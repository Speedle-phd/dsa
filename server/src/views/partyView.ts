import type { IPartyDocument } from '@/models/party.model'
import { partyRole, rosterDetail, type RosterDetail } from '@/utils/partyRules'
import type { PublicStats } from '@/types/apiContracts'
import { toRuleShape } from '@/utils/partyAccess'
import { normalizeBookRules, storedBookRules } from '@/utils/bookRules'

export type HeroBasics = { name: string; species: string; profession: string }
type Bar = { current: number; max: number }

export type PartyHeroView = HeroBasics & {
   detail: RosterDetail
   canOpenSheet: boolean
   health?: Bar; mana?: Bar; karmaEnergy?: Bar
   pain?: number
   statuses?: string[]
   conditions?: Record<string, number>
   // GM and owner only
   statsId?: string
   // Stored statuses (switchable) and those from disadvantages (Blind, Taub, Stumm), which cannot be switched off
   storedStatuses?: string[]
   permanentStatuses?: string[]
   fatePoints?: Bar
   dodge?: number
   apAvailable?: number
}

const bar = (value?: { current?: number; max?: number }) =>
   value && (value.max ?? 0) > 0 ? { current: value.current ?? value.max ?? 0, max: value.max ?? 0 } : undefined

// Roster entry shaped by the owner's privacy choice (partyRules.rosterDetail)
export function partyHeroView(detail: RosterDetail, basics: HeroBasics, stats: PublicStats | null, statsId: string): PartyHeroView {
   const view: PartyHeroView = { ...basics, detail, canOpenSheet: detail === 'full' || detail === 'all' }
   if (detail === 'name' || !stats) {
      return detail === 'name' ? { name: basics.name, species: '', profession: '', detail, canOpenSheet: false } : view
   }
   Object.assign(view, {
      health: bar(stats.health), mana: bar(stats.mana), karmaEnergy: bar(stats.karmaEnergy), pain: stats.pain ?? 0,
      statuses: [...new Set([...(stats.statuses ?? []), ...(stats.permanentStatuses ?? [])])],
      conditions: Object.fromEntries(Object.entries(stats.combatConditions ?? {}).filter(([, level]) => level > 0)),
   })
   if (detail === 'all') {
      Object.assign(view, {
         statsId,
         storedStatuses: stats.statuses ?? [],
         permanentStatuses: stats.permanentStatuses ?? [],
         fatePoints: bar(stats.fatePoints),
         dodge: stats.dodge?.max,
         apAvailable: (stats.experience?.total ?? 0) - (stats.experience?.spent ?? 0),
      })
   }
   return view
}

export type HeroLookup = Map<string, { basics: HeroBasics; stats: PublicStats | null }>

export function partyView(party: IPartyDocument, viewerId: string, heroes: HeroLookup, usernames: Map<string, string>) {
   const shape = toRuleShape(party)
   const role = partyRole(shape, viewerId)
   const isGm = role === 'gm'
   const visibleMembers = shape.members.filter((member) =>
      isGm || member.userId === viewerId || (role === 'member' && member.state === 'accepted'))
   return {
      _id: String(party._id),
      name: party.name,
      status: party.status,
      role,
      gm: { userId: shape.gmUserId, username: usernames.get(shape.gmUserId) ?? '' },
      ...(isGm ? { inviteCode: party.inviteCode } : {}),
      // Book rules in effect and the in-game date (everyone sees them; only the GM changes them)
      rules: normalizeBookRules(storedBookRules(party.rules)),
      calendarDay: party.calendarDay ?? null,
      members: visibleMembers.map((member) => {
         const hero = heroes.get(member.charId)
         const basics = hero?.basics ?? { name: '?', species: '', profession: '' }
         return {
            charId: member.charId,
            playerName: usernames.get(member.userId) ?? '',
            state: member.state,
            isSelf: member.userId === viewerId,
            ...(isGm || member.userId === viewerId ? { visibility: member.visibility } : {}),
            hero: partyHeroView(rosterDetail(shape, viewerId, member), basics, hero?.stats ?? null, member.statsId),
         }
      }),
   }
}

// Party list entry: enough to show "my parties" and pending requests
export function partySummaryView(party: IPartyDocument, viewerId: string, usernames: Map<string, string>, heroNames: Map<string, string>) {
   const shape = toRuleShape(party)
   const own = shape.members.find((member) => member.userId === viewerId)
   return {
      _id: String(party._id),
      name: party.name,
      status: party.status,
      role: partyRole(shape, viewerId),
      gmName: usernames.get(shape.gmUserId) ?? '',
      members: shape.members.filter((member) => member.state === 'accepted').length,
      pendingRequests: party.gmUserId.toString() === viewerId ? shape.members.filter((member) => member.state === 'pending').length : 0,
      ...(own ? { myHero: { charId: own.charId, name: heroNames.get(own.charId) ?? '', state: own.state } } : {}),
   }
}
