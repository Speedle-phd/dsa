import type { Request, Response } from 'express'
import { BadRequestError, UnauthorizedError } from '@/utils/appError'
import { applyCalendarAction, storedBookRules, type BookRules, type CalendarAction } from '@/utils/bookRules'
import { bookContext } from '@/utils/bookContext'
import { findStatsForUser, saveStats } from '@/utils/statsPersistence'
import { herbs } from '@/utils/herbs/herbCatalog'
import { herbEffectTypes, herbLandscapes, searchLandscapes } from '@/utils/herbs/herbTypes'
import { baseHours, generalSearchModifier, landscapeModifiers, weatherModifiers } from '@/utils/herbs/herbSearch'
import { coreShelfDays, plantParts, preserveCostKreuzer, rawShelfDays } from '@/utils/herbs/shelfLife'
import { craftModifier } from '@/utils/herbs/crafting'
import { recipes } from '@/utils/herbs/recipeCatalog'
import { isPlantRecipeKind } from '@/utils/herbs/recipeTypes'

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
   res.json({ herbs, effectTypes: herbEffectTypes, landscapes: herbLandscapes,
      // Kräutersuche tables (AdK S. 277) for the search dialog; the server applies the same ones
      search: { landscapes: searchLandscapes, landscapeModifiers, weatherModifiers, generalSearchModifier, baseHours },
      // Haltbarkeit (AdK S. 284–286): plant parts and methods, and the day counts the app uses
      shelfLife: { plantParts, coreShelfDays, rawShelfDays, preserveCostKreuzer },
      // Recipes (AdK S. 144–178) with the Pflanzenkunde modifier of plant recipes; the server applies the same one
      recipes: recipes.map((recipe) => ({ ...recipe, craftModifier: isPlantRecipeKind(recipe.kind) ? craftModifier(recipe) : null })) })
}
