import type { Request } from 'express'
import { Party, type IPartyDocument } from '@/models/party.model'
import { ForbiddenError, NotFoundError, UnauthorizedError } from '@/utils/appError'
import { toRuleShape } from '@/utils/partyAccess'
import { canViewParty, partyRole, type PartyRole } from '@/utils/partyRules'
import { objectId } from '@/validations/partyValidation'

// Request helpers shared by the party-scoped controllers (fight, check requests)
export function userOf(req: Request) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   return req.user._id
}
export function idParam(req: Request, key: string, message = 'Not found') {
   const parsed = objectId.safeParse(req.params[key])
   if (!parsed.success) throw new NotFoundError(message)
   return parsed.data
}

export type PartyContext = { party: IPartyDocument; viewerId: string; role: PartyRole }
// GM and accepted members of an active party; 404 for everyone else (no existence leak)
export async function partyContext(req: Request): Promise<PartyContext> {
   const viewerId = userOf(req)
   const party = await Party.findById(idParam(req, 'id', 'Party not found'))
   if (!party || !canViewParty(toRuleShape(party), viewerId)) throw new NotFoundError('Party not found')
   return { party, viewerId, role: partyRole(toRuleShape(party), viewerId) }
}
export function requireGm(context: PartyContext) {
   if (context.role !== 'gm') throw new ForbiddenError('Only the game master can do this.')
}
