import { randomBytes } from 'node:crypto'
import type { Request, Response } from 'express'
import { Char } from '@/models/char.model'
import { Party, type IPartyDocument } from '@/models/party.model'
import { Stats } from '@/models/stats.model'
import { User } from '@/models/user.model'
import { realtime } from '@/socket/realtime'
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '@/utils/appError'
import { toRuleShape } from '@/utils/partyAccess'
import { canViewParty, canViewSheet, heroIsTaken, partyRole } from '@/utils/partyRules'
import { syncResources } from '@/utils/statsPersistence'
import { applyCalendarAction, storedBookRules, type BookRules, type CalendarAction } from '@/utils/bookRules'
import { inviteCode as inviteCodeSchema, objectId } from '@/validations/partyValidation'
import { buildCharResponse } from '@/views/charView'
import { partySummaryView, partyView, type HeroLookup } from '@/views/partyView'
import { buildStatResponse } from '@/views/statsView'
import { addHeroToEncounter, endPartyEncounters, removeHeroFromEncounters } from './encounterController'

function userOf(req: Request) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   return req.user._id
}
function idParam(req: Request, key: string) {
   const parsed = objectId.safeParse(req.params[key])
   if (!parsed.success) throw new NotFoundError('Party not found')
   return parsed.data
}
// 128 random bits (22 characters): the code is a bearer secret for join requests
const newInviteCode = () => randomBytes(16).toString('base64url')

async function usernamesFor(parties: IPartyDocument[]) {
   const ids = [...new Set(parties.flatMap((party) => [String(party.gmUserId), ...party.members.map((member) => String(member.userId))]))]
   const users = await User.find({ _id: { $in: ids } }).select('username')
   return new Map(users.map((user) => [user._id.toString(), user.username]))
}

async function heroesFor(party: IPartyDocument): Promise<HeroLookup> {
   const charIds = party.members.map((member) => member.charId)
   const [chars, stats] = await Promise.all([
      Char.find({ _id: { $in: charIds } }).select('name species profession'),
      Stats.find({ charId: { $in: charIds } }),
   ])
   const statsByChar = new Map(stats.map((stat) => {
      syncResources(stat)
      return [String(stat.charId), buildStatResponse(stat).stats] as const
   }))
   return new Map(chars.map((char) => [char._id.toString(), {
      basics: { name: char.name, species: char.species, profession: char.profession },
      stats: statsByChar.get(char._id.toString()) ?? null,
   }]))
}

async function respondWithParty(res: Response, party: IPartyDocument, viewerId: string, status = 200) {
   const [heroes, usernames] = await Promise.all([heroesFor(party), usernamesFor([party])])
   res.status(status).json({ party: partyView(party, viewerId, heroes, usernames) })
}

// Everyone involved refetches: the party room (GM and members) and each affected user (their party list)
function notifyParty(party: IPartyDocument, ...userIds: string[]) {
   const partyId = String(party._id)
   realtime.toParty(partyId, { topic: 'party', partyId })
   for (const userId of new Set([String(party.gmUserId), ...userIds])) realtime.toUser(userId, { topic: 'parties' })
}

// Party the viewer may see: GM (also archived), accepted members, and players with a pending request (they only
// see their own request, partyView). 404 otherwise, so foreign parties are not revealed.
async function visibleParty(req: Request) {
   const viewerId = userOf(req)
   const party = await Party.findById(idParam(req, 'id'))
   const role = party ? partyRole(toRuleShape(party), viewerId) : null
   if (!party || !(canViewParty(toRuleShape(party), viewerId) || role === 'gm' || (role === 'pending' && party.status === 'active'))) {
      throw new NotFoundError('Party not found')
   }
   return { party, viewerId }
}
async function gmParty(req: Request) {
   const { party, viewerId } = await visibleParty(req)
   if (String(party.gmUserId) !== viewerId) throw new NotFoundError('Party not found')
   return { party, viewerId }
}

export async function createParty(req: Request, res: Response) {
   const viewerId = userOf(req)
   for (let attempt = 0; attempt < 3; attempt++) {
      try {
         const party = await Party.create({ name: req.body.name, gmUserId: viewerId, inviteCode: newInviteCode() })
         realtime.toUser(viewerId, { topic: 'parties' })
         return respondWithParty(res, party, viewerId, 201)
      } catch (error) {
         if ((error as { code?: number }).code !== 11000) throw error
      }
   }
   throw new ConflictError('Could not create an invite code. Try again.')
}

export async function listParties(req: Request, res: Response) {
   const viewerId = userOf(req)
   const parties = await Party.find({ $or: [{ gmUserId: viewerId }, { 'members.userId': viewerId }] }).sort({ updatedAt: -1 })
   const usernames = await usernamesFor(parties)
   const ownChars = parties.flatMap((party) => party.members.filter((member) => String(member.userId) === viewerId).map((member) => member.charId))
   const chars = await Char.find({ _id: { $in: ownChars } }).select('name')
   const heroNames = new Map(chars.map((char) => [char._id.toString(), char.name]))
   res.json({ parties: parties.map((party) => partySummaryView(party, viewerId, usernames, heroNames)) })
}

export async function getParty(req: Request, res: Response) {
   const { party, viewerId } = await visibleParty(req)
   await respondWithParty(res, party, viewerId)
}

export async function updateParty(req: Request, res: Response) {
   const { party, viewerId } = await gmParty(req)
   if (req.body.name !== undefined) party.name = req.body.name
   if (req.body.status !== undefined) party.status = req.body.status
   await party.save()
   notifyParty(party, ...party.members.map((member) => String(member.userId)))
   if (party.status === 'archived') {
      await endPartyEncounters(party._id)
      realtime.closeParty(String(party._id))
   }
   await respondWithParty(res, party, viewerId)
}

// Book rules of the party (user decision, Nov 2026: the GM switches them; members follow them)
export async function updatePartyRules(req: Request, res: Response) {
   const { party, viewerId } = await gmParty(req)
   const change = req.body.rules as Partial<BookRules>
   party.rules = { ...storedBookRules(party.rules), ...change }
   await party.save()
   notifyParty(party, ...party.members.map((member) => String(member.userId)))
   await respondWithParty(res, party, viewerId)
}

// The party's in-game date (user decision, Nov 2026: the GM sets and advances it)
export async function updatePartyCalendar(req: Request, res: Response) {
   const { party, viewerId } = await gmParty(req)
   const next = applyCalendarAction(party.calendarDay, req.body as CalendarAction)
   if ('error' in next) throw new BadRequestError(next.error)
   party.calendarDay = next.day
   await party.save()
   notifyParty(party, ...party.members.map((member) => String(member.userId)))
   await respondWithParty(res, party, viewerId)
}

export async function rotateInviteCode(req: Request, res: Response) {
   const { party, viewerId } = await gmParty(req)
   party.inviteCode = newInviteCode()
   await party.save()
   await respondWithParty(res, party, viewerId)
}

async function partyByCode(req: Request) {
   const parsed = inviteCodeSchema.safeParse(req.params.code)
   const party = parsed.success ? await Party.findOne({ inviteCode: parsed.data, status: 'active' }) : null
   if (!party) throw new NotFoundError('This invite link is not valid (any more).')
   return party
}

export async function previewInvite(req: Request, res: Response) {
   const viewerId = userOf(req)
   const party = await partyByCode(req)
   const usernames = await usernamesFor([party])
   res.json({ invite: { partyId: String(party._id), name: party.name, gmName: usernames.get(String(party.gmUserId)) ?? '',
      role: partyRole(toRuleShape(party), viewerId) } })
}

// A join request waits for the GM (user decision, Nov 2026: invite link/code + accept)
export async function requestJoin(req: Request, res: Response) {
   const viewerId = userOf(req)
   const party = await partyByCode(req)
   if (String(party.gmUserId) === viewerId) throw new BadRequestError('You are the game master of this party.')
   const charId: string = req.body.charId
   const [char, stats, user] = await Promise.all([
      Char.findOne({ _id: charId, userId: viewerId }).select('_id'),
      Stats.findOne({ charId, userId: viewerId }).select('_id'),
      User.findById(viewerId).select('settings'),
   ])
   if (!char || !stats) throw new NotFoundError('Hero not found')
   const others = await Party.find({ status: 'active', 'members.charId': charId })
   if (heroIsTaken(others.map(toRuleShape), charId)) throw new ConflictError('This hero is already in a party or waiting for an answer.')
   party.members.push({ userId: viewerId, charId, statsId: stats._id, state: 'pending',
      visibility: user?.settings?.defaultPartyVisibility ?? 'summary', requestedAt: new Date() })
   await party.save()
   notifyParty(party, viewerId)
   res.status(201).json({ partyId: String(party._id) })
}

function memberOf(party: IPartyDocument, charId: string) {
   const member = party.members.find((entry) => String(entry.charId) === charId)
   if (!member) throw new NotFoundError('Member not found')
   return member
}

export async function answerRequest(req: Request, res: Response) {
   const answer = req.params.answer
   if (answer !== 'accept' && answer !== 'deny') throw new NotFoundError('Not found')
   const { party, viewerId } = await gmParty(req)
   const member = memberOf(party, idParam(req, 'charId'))
   if (member.state !== 'pending') throw new BadRequestError('This hero has already joined.')
   const memberUserId = String(member.userId)
   if (answer === 'accept') member.state = 'accepted'
   else party.members.pull(member._id)
   await party.save()
   if (answer === 'accept') {
      realtime.joinParty(memberUserId, String(party._id))
      // A hero accepted during a running fight joins it (without INI and position)
      await addHeroToEncounter(party._id, member)
   }
   notifyParty(party, memberUserId)
   await respondWithParty(res, party, viewerId)
}

// The GM removes a hero, or the owner leaves with it
export async function removeMember(req: Request, res: Response) {
   const viewerId = userOf(req)
   const party = await Party.findById(idParam(req, 'id'))
   if (!party) throw new NotFoundError('Party not found')
   const member = memberOf(party, idParam(req, 'charId'))
   const memberUserId = String(member.userId)
   if (String(party.gmUserId) !== viewerId && memberUserId !== viewerId) throw new NotFoundError('Member not found')
   party.members.pull(member._id)
   await party.save()
   await removeHeroFromEncounters(member.charId)
   if (!party.members.some((entry) => String(entry.userId) === memberUserId)) realtime.leaveParty(memberUserId, String(party._id))
   notifyParty(party, memberUserId)
   res.json({ ok: true })
}

export async function setVisibility(req: Request, res: Response) {
   const viewerId = userOf(req)
   const party = await Party.findById(idParam(req, 'id'))
   const member = party ? memberOf(party, idParam(req, 'charId')) : null
   if (!party || !member || String(member.userId) !== viewerId) throw new NotFoundError('Member not found')
   member.visibility = req.body.visibility
   await party.save()
   notifyParty(party)
   await respondWithParty(res, party, viewerId)
}

// Read-only sheet for the GM, the owner, or members when the owner chose "full"
export async function getPartySheet(req: Request, res: Response) {
   const viewerId = userOf(req)
   const party = await Party.findById(idParam(req, 'id'))
   const charId = idParam(req, 'charId')
   if (!party || !canViewSheet(toRuleShape(party), viewerId, charId)) throw new NotFoundError('Hero not found')
   const [char, stat] = await Promise.all([Char.findById(charId), Stats.findOne({ charId })])
   if (!char || !stat) throw new NotFoundError('Hero not found')
   syncResources(stat)
   res.json({ ...buildCharResponse(char), ...buildStatResponse(stat), canApplyEffects: String(party.gmUserId) === viewerId })
}
