// Who may see and change what inside a party. Pure functions on plain ids (strings), tested without a database.
// User decisions, Nov 2026: the GM sees every accepted hero live and may apply game effects (LeP/AsP/KaP, statuses,
// Zustände, AP); each owner chooses what the other players see (private / summary / full); pending members see nothing.

export type Visibility = 'private' | 'summary' | 'full'
export type PartyRuleMember = { userId: string; charId: string; statsId: string; state: 'pending' | 'accepted'; visibility: Visibility }
export type PartyRuleShape = { gmUserId: string; status: 'active' | 'archived'; members: PartyRuleMember[] }
export type PartyRole = 'gm' | 'member' | 'pending' | null

export function partyRole(party: PartyRuleShape, userId: string): PartyRole {
   if (party.gmUserId === userId) return 'gm'
   const own = party.members.filter((member) => member.userId === userId)
   if (own.some((member) => member.state === 'accepted')) return 'member'
   return own.length ? 'pending' : null
}

// Roster and live notices: the GM and accepted members of an active party
export function canViewParty(party: PartyRuleShape, userId: string) {
   const role = partyRole(party, userId)
   return party.status === 'active' && (role === 'gm' || role === 'member')
}

const acceptedHero = (party: PartyRuleShape, match: (member: PartyRuleMember) => boolean) =>
   party.members.find((member) => member.state === 'accepted' && match(member))

// Full (read-only) sheet: the GM, the owner, or another member when the owner chose "full"
export function canViewSheet(party: PartyRuleShape, viewerId: string, charId: string) {
   if (!canViewParty(party, viewerId)) return false
   const member = acceptedHero(party, (entry) => entry.charId === charId)
   if (!member) return false
   return party.gmUserId === viewerId || member.userId === viewerId || member.visibility === 'full'
}

// Game effects on a party hero (LeP/AsP/KaP, statuses and Zustände, AP awards): only the GM of an active party
export function canApplyEffects(party: PartyRuleShape, viewerId: string, statsId: string) {
   return party.status === 'active' && party.gmUserId === viewerId && Boolean(acceptedHero(party, (entry) => entry.statsId === statsId))
}

// How much of a hero a viewer gets in the roster
export type RosterDetail = 'name' | 'summary' | 'full' | 'all'
export function rosterDetail(party: PartyRuleShape, viewerId: string, member: PartyRuleMember): RosterDetail {
   if (party.gmUserId === viewerId || member.userId === viewerId) return 'all'
   if (member.state !== 'accepted') return 'name'
   return member.visibility === 'private' ? 'name' : member.visibility
}

// A hero can be in one active party at a time (pending requests count, so a hero cannot be offered twice)
export function heroIsTaken(parties: PartyRuleShape[], charId: string) {
   return parties.some((party) => party.status === 'active' && party.members.some((member) => member.charId === charId))
}
