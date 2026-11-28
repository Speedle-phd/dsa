import type { IStatsDocument } from '@/models/stats.model'
import { effectiveBookRules, normalizeBookRules, storedBookRules } from '@/utils/bookRules'
import { activePartyOfHero } from '@/utils/partyAccess'

// The book rules and in-game date that apply to a hero: its party's while it is an accepted member of an active
// party, otherwise its own (user decision, Nov 2026)
export async function bookContext(stat: IStatsDocument) {
   const party = await activePartyOfHero({ statsId: String(stat._id) })
   const member = party?.members.find((entry) => String(entry.statsId) === String(stat._id) && entry.state === 'accepted')
   const own = { rules: normalizeBookRules(storedBookRules(stat.bookRules)), calendarDay: stat.calendarDay ?? null }
   if (party && member) {
      return { source: 'party' as const, party: { _id: String(party._id), name: party.name },
         rules: effectiveBookRules(own.rules, { rules: storedBookRules(party.rules) }), calendarDay: party.calendarDay ?? null }
   }
   return { source: 'hero' as const, party: null, rules: own.rules, calendarDay: own.calendarDay }
}
