import type { Request, Response } from 'express'
import { BadRequestError, UnauthorizedError } from '@/utils/appError'
import { applyCalendarAction, effectiveBookRules, normalizeBookRules, storedBookRules, type BookRules, type CalendarAction } from '@/utils/bookRules'
import { activePartyOfHero } from '@/utils/partyAccess'
import { findStatsForUser, saveStats } from '@/utils/statsPersistence'
import type { IStatsDocument } from '@/models/stats.model'
import { herbs } from '@/utils/herbs/herbCatalog'
import { herbEffectTypes, herbLandscapes } from '@/utils/herbs/herbTypes'

// The book rules and in-game date that apply to a hero: its party's while it is an accepted member of an active
// party, otherwise its own (user decision, Nov 2026)
async function bookContext(stat: IStatsDocument) {
   const party = await activePartyOfHero({ statsId: String(stat._id) })
   const member = party?.members.find((entry) => String(entry.statsId) === String(stat._id) && entry.state === 'accepted')
   const own = { rules: normalizeBookRules(storedBookRules(stat.bookRules)), calendarDay: stat.calendarDay ?? null }
   if (party && member) {
      return { source: 'party' as const, party: { _id: String(party._id), name: party.name },
         rules: effectiveBookRules(own.rules, { rules: storedBookRules(party.rules) }), calendarDay: party.calendarDay ?? null }
   }
   return { source: 'hero' as const, party: null, rules: own.rules, calendarDay: own.calendarDay }
}

export async function getBookContext(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   res.json(await bookContext(stat))
}

// Only for a hero without a party: in a party the GM sets rules and date
export async function updateBookSettings(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   if ((await bookContext(stat)).source === 'party') throw new BadRequestError('This hero plays in a party: its GM sets the rules and the date.')
   const { rules, calendar } = req.body as { rules?: Partial<BookRules>; calendar?: CalendarAction }
   if (rules) stat.bookRules = { ...storedBookRules(stat.bookRules), ...rules }
   if (calendar) {
      const next = applyCalendarAction(stat.calendarDay, calendar)
      if ('error' in next) throw new BadRequestError(next.error)
      stat.calendarDay = next.day
   }
   await saveStats(stat)
   res.json(await bookContext(stat))
}

// The plants of Archiv der Kräuter (Herbarium, store, Pflanzenkunde); static reference data
export function getHerbReference(_req: Request, res: Response) {
   res.json({ herbs, effectTypes: herbEffectTypes, landscapes: herbLandscapes })
}
