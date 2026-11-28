import type { Request, Response } from 'express'
import { BadRequestError, UnauthorizedError } from '@/utils/appError'
import { bestLaboratory, brewedQuality, brewPlan } from '@/utils/alchemy'
import { calcBurden } from '@/utils/baseAttributes'
import { bookContext } from '@/utils/bookContext'
import { basePlacements, isContainer } from '@/utils/containers'
import { carriedEquipmentWeight, purchaseEquipment } from '@/utils/equipmentPurchase'
import { adjustPurse } from '@/utils/purseAdjustment'
import { findStatsForUser, saveStats } from '@/utils/statsPersistence'
import { brewElixirSchema } from '@/validations/alchemyValidation'
import { buildStatResponse } from '@/views/statsView'

// source: DSA5 Regelwerk, S. 270–272. The client rolls the Alchimie check; the server checks recipe, lab, ingredients and AsP,
// charges the ingredients (lost on a failure) and adds a successful elixir with its QS (capped by the ingredient level).
export async function brewElixir(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   const { elixir, level, asp, success, quality, placement, substitution } = brewElixirSchema.parse(req.body)
   if (!stat.generalSpecialAbilities.includes(`Berufsgeheimnis (${elixir})`)) throw new BadRequestError(`The recipe ${elixir} is a Berufsgeheimnis (S. 215, 270).`)
   const owned = stat.equipment.filter((item) => item.amount > 0).map((item) => item.item)
   // Archiv der Kräuter adds its alchemical recipes (AdK S. 158–178) for heroes with the book switched on
   const { rules } = await bookContext(stat)
   if (substitution && !(rules.adk && stat.generalSpecialAbilities.includes('Alchimistische Äquivalenzlehre'))) {
      throw new BadRequestError('Substituting ingredients needs the special ability Alchimistische Äquivalenzlehre (AdK S. 297).')
   }
   const plan = brewPlan({ elixir, level, asp, laboratory: bestLaboratory(owned), adk: rules.adk, substitution })
   if (!(basePlacements as readonly string[]).includes(placement) && !(isContainer(placement) && owned.includes(placement))) {
      throw new BadRequestError('Choose a valid placement for the elixir.')
   }
   let equipment = stat.toObject().equipment
   if (asp) {
      // source: DSA5 Regelwerk, S. 271 (charging with AsP needs a crushed Alraune)
      if (!stat.isSorcerer || asp > stat.mana.current) throw new BadRequestError('Not enough AsP to charge the brew.')
      const index = equipment.findIndex((item) => item.item === 'Alraune' && item.amount > 0)
      if (index < 0) throw new BadRequestError('Charging with AsP uses up an Alraune (S. 271).')
      equipment = equipment.flatMap((item, slot) => slot !== index ? [item] : item.amount > 1 ? [{ ...item, amount: item.amount - 1 }] : [])
      stat.mana.current -= asp
   }
   if (success) {
      const qs = brewedQuality(quality, level)
      const bought = purchaseEquipment(stat.purse, equipment, {
         item: `${elixir} (QS ${qs})`, category: 'Alchimica', unitWeight: 0, amount: 1, carriedOn: placement,
         unitPriceSilbertaler: plan.ingredientCost, quality: qs,
      })
      if (!bought.ok) throw new BadRequestError('Not enough money for the ingredients.')
      stat.purse = bought.purse
      equipment = bought.equipment
   } else {
      // in Heller: a saving can leave tenths of a Silbertaler (AdK S. 297)
      const paid = adjustPurse(stat.purse, { direction: 'lose', coins: { dukaten: 0, silbertaler: 0, heller: Math.round(plan.ingredientCost * 10), kreuzer: 0 } })
      if (!paid.ok) throw new BadRequestError('Not enough money for the ingredients.')
      stat.purse = paid.purse
   }
   stat.equipment = equipment
   stat.burden = calcBurden(stat.carryingCapacity, carriedEquipmentWeight(equipment))
   await saveStats(stat)
   res.json({ ...buildStatResponse(stat), brewed: success ? brewedQuality(quality, level) : null })
}
