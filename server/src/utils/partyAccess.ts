import { isValidObjectId } from 'mongoose'
import { Party, type IPartyDocument } from '@/models/party.model'
import { User } from '@/models/user.model'
import { verifyToken } from '@/utils/jwt'
import { canViewParty, type PartyRuleShape } from '@/utils/partyRules'

export function toRuleShape(party: Pick<IPartyDocument, 'gmUserId' | 'status' | 'members'>): PartyRuleShape {
   return {
      gmUserId: String(party.gmUserId),
      status: party.status,
      members: party.members.map((member) => ({
         userId: String(member.userId), charId: String(member.charId), statsId: String(member.statsId),
         state: member.state, visibility: member.visibility,
      })),
   }
}

// The active party a hero belongs to (accepted or pending), if any
export async function activePartyOfHero(match: { charId?: string; statsId?: string }) {
   const field = match.charId ? 'members.charId' : 'members.statsId'
   const value = match.charId ?? match.statsId
   if (!value || !isValidObjectId(value)) return null
   return Party.findOne({ status: 'active', [field]: value })
}

// Socket handshake and room checks use the same rules as REST.
export const socketAccess = {
   async authenticate(token: string) {
      const payload = await verifyToken(token)
      if (!payload.sub) return null
      const user = await User.findById(payload.sub).select('username')
      return user ? { userId: user._id.toString(), username: user.username } : null
   },
   async canJoinParty(userId: string, partyId: string) {
      const party = await Party.findById(partyId)
      return party ? canViewParty(toRuleShape(party), userId) : false
   },
   // Presence by hero: accepted members whose player is connected, and the GM; no user ids leave the server
   async onlineMembers(partyId: string, userIds: string[]) {
      const party = await Party.findById(partyId).select('gmUserId members')
      if (!party) return { charIds: [], gmOnline: false }
      const online = new Set(userIds)
      return {
         charIds: party.members.filter((member) => member.state === 'accepted' && online.has(String(member.userId))).map((member) => String(member.charId)),
         gmOnline: online.has(String(party.gmUserId)),
      }
   },
}
