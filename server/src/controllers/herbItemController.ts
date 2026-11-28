import type { Request, Response } from 'express'
import { BadRequestError, UnauthorizedError } from '@/utils/appError'
import { bookContext } from '@/utils/bookContext'
import { purchaseEquipment, purseFromKreuzer, purseToKreuzer } from '@/utils/equipmentPurchase'
import { craftUses } from '@/utils/herbs/crafting'
import { recipeByName } from '@/utils/herbs/recipeCatalog'
import { isSpoiled, preserveCostKreuzer, preservedByCheck, preservedByMethod } from '@/utils/herbs/shelfLife'
import { findStatsForUser, saveStats } from '@/utils/statsPersistence'
import { buildStatResponse } from '@/views/statsView'

type PreserveBody = { index: number; item: string } & (
   | { method: 'check'; check: { success: boolean; quality: number; critical: boolean } }
   | { method: 'part'; part: string; methodKey: string })

// Haltbarmachung (AdK S. 284–286) of a whole stack of raw plants: Fokusregel I by a Pflanzenkunde check the player
// rolled (material 5 Kreuzer per application, paid also on a failure: app choice), or Fokusregel II by plant part and
// method without a check (the player picks the part: user decision, Nov 2026)
export async function preserveHerb(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   const context = await bookContext(stat)
   const body = req.body as PreserveBody
   if (!context.rules.shelfLife) throw new BadRequestError('Haltbarmachung (Archiv der Kräuter) is not switched on for this hero.')
   if (body.method === 'part' && !context.rules.shelfLifeParts) throw new BadRequestError('Shelf life per plant part is not switched on for this hero.')
   const today = context.calendarDay
   if (today === null) throw new BadRequestError('Set an in-game date first (settings or party page).')
   const entry = stat.equipment[body.index]
   if (!entry || entry.item !== body.item || !entry.herb) throw new BadRequestError('This plant is no longer in the inventory.')
   if (entry.herb.form !== 'raw') throw new BadRequestError('Only raw plants can be preserved.')
   if (isSpoiled(entry.herb, context.rules, today)) throw new BadRequestError('This plant is spoiled (AdK S. 284).')

   let preserved: number | null | undefined
   let lasting = false
   if (body.method === 'check') {
      const cost = preserveCostKreuzer * entry.amount
      const available = purseToKreuzer(stat.purse)
      if (available === null || available < cost) throw new BadRequestError('Not enough money: the material costs 5 Kreuzer per application.')
      stat.purse = purseFromKreuzer(available - cost)
      if (body.check.success) preserved = preservedByCheck(today, body.check.quality, body.check.critical)
   } else {
      const result = preservedByMethod(today, body.part, body.methodKey)
      if ('error' in result) throw new BadRequestError(result.error)
      preserved = result.keepsUntilDay
      lasting = result.lasting
   }
   if (preserved !== undefined) {
      entry.herb = { form: 'preserved', obtainedDay: entry.herb.obtainedDay ?? today, keepsUntilDay: preserved, ...(lasting ? { lasting } : {}) }
   }
   await saveStats(stat)
   res.json({ preserved: preserved !== undefined, keepsUntilDay: preserved ?? null, stats: buildStatResponse(stat).stats })
}

// Pflanzliche Rezepte (AdK S. 144): the player rolled Pflanzenkunde (modified by the recipe); one check makes `amount`
// products from as many applications of each main plant, and a failure loses the plants (user decisions, Nov 2026).
// Products are plant items of form 'product' made today; they keep the core 3 months (app choice: the book gives no shelf life).
export async function craftHerbal(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   const context = await bookContext(stat)
   if (!context.rules.adk) throw new BadRequestError('Archiv der Kräuter is not switched on for this hero.')
   const body = req.body as { recipe: string; amount: number; talent?: string; check: { success: boolean } }
   const recipe = recipeByName(body.recipe)
   if (!recipe) throw new BadRequestError('Unknown recipe.')
   // The check must be one the recipe allows (S. 148–149); a recipe that is a Berufsgeheimnis needs it
   if (body.talent && !recipe.craftTalents.some((entry) => entry.talent === body.talent)) throw new BadRequestError('This recipe is not made with that talent.')
   if (recipe.secret && !stat.generalSpecialAbilities.includes(`Berufsgeheimnis (${recipe.key})`)) {
      throw new BadRequestError('This recipe is a Berufsgeheimnis (AdK S. 148).')
   }
   const equipment = stat.toObject().equipment
   const plan = craftUses(recipe, equipment, body.amount, context.rules, context.calendarDay)
   if ('error' in plan) throw new BadRequestError(plan.error)
   const carriedOn = equipment[plan.uses[0].index].carriedOn
   let next = equipment.map((entry, index) => {
      const used = plan.uses.filter((use) => use.index === index).reduce((sum, use) => sum + use.amount, 0)
      return used ? { ...entry, amount: entry.amount - used } : entry
   }).filter((entry) => entry.amount > 0)
   if (body.check.success) {
      const added = purchaseEquipment(stat.purse, next, {
         item: recipe.key, category: 'Archiv_der_Kraeuter', unitWeight: 0, amount: body.amount, carriedOn, unitPriceSilbertaler: 0,
         herb: { form: 'product', obtainedDay: context.calendarDay, keepsUntilDay: null },
      })
      if (!added.ok) throw new BadRequestError('The products could not be added.')
      next = added.equipment
   }
   stat.equipment = next as typeof stat.equipment
   await saveStats(stat)
   res.json({ crafted: body.check.success ? body.amount : 0, stats: buildStatResponse(stat).stats })
}
