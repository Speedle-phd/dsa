import type { Request, Response } from 'express'
import { findStatsForUser, saveStats } from '@/utils/statsPersistence'
import { buildStatResponse } from '@/views/statsView'
import { BadRequestError, UnauthorizedError } from '@/utils/appError'
import { advancementCost, assertAffordable } from '@/utils/advancement'
import { blessingAp, blessings, churchTradition, churches, liturgies, liturgySteps, twelveBlessings } from '@/utils/karmaCatalog'
import { assertPriest, karmaSpend, liturgyMaximum } from '@/utils/karmaRules'
import { karmaAdjustmentSchema, karmaRemoveSchema, liturgyChangeSchema, liturgyNotesSchema } from '@/validations/karmaValidation'

async function owner(req: Request) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   return findStatsForUser(req.params.id, req.user._id)
}
function assertRefund(refund: number, spent: number) {
   if (refund > spent) throw new BadRequestError('The refund exceeds the spent AP.')
}

export function getKarmaReference(_req: Request, res: Response) {
   res.json({ liturgies, blessings, twelveBlessings, steps: liturgySteps,
      churches: churches.map((church) => ({ church, tradition: churchTradition(church) })) })
}

// source: DSA5 Regelwerk, S. 50 (activation and Steigerung like spells), S. 306 (liturgies are skills with their own FW)
export async function changeLiturgy(req: Request, res: Response) {
   const stat = await owner(req)
   const { key, value, spendAP } = liturgyChangeSchema.parse(req.body)
   const liturgy = liturgies.find((entry) => entry.key === key)
   if (!liturgy) throw new BadRequestError('Choose a verified liturgy or ceremony.')
   const owned = stat.liturgies.find((entry) => entry.key === key)
   const target = value ?? (owned ? owned.value + 1 : 0)
   if (spendAP) {
      assertPriest(stat, liturgy)
      if (target > liturgyMaximum(stat, liturgy)) throw new BadRequestError('Liturgy maximum reached (check + 2; Aspektkenntnis above FW 14, S. 39, 321).')
   }
   const cost = advancementCost(owned?.value ?? null, target, liturgy.stfClass, spendAP)
   assertAffordable(cost, stat.experience.total, stat.experience.spent)
   if (owned) {
      owned.value = target
      owned.paidAP += cost
   } else stat.liturgies.push({ key, value: target, notes: '', paidAP: cost })
   stat.experience.spent += cost
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}

export async function removeLiturgy(req: Request, res: Response) {
   const stat = await owner(req)
   const { key, spendAP } = karmaRemoveSchema.parse(req.body)
   const owned = stat.liturgies.find((entry) => entry.key === key)
   if (!owned) throw new BadRequestError('This liturgy is not recorded.')
   const refund = spendAP ? owned.paidAP : 0
   assertRefund(refund, stat.experience.spent)
   stat.liturgies = stat.liturgies.filter((entry) => entry.key !== key)
   stat.experience.spent -= refund
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}

export async function updateLiturgyNotes(req: Request, res: Response) {
   const stat = await owner(req)
   const { key, notes } = liturgyNotesSchema.parse(req.body)
   const owned = stat.liturgies.find((entry) => entry.key === key)
   if (!owned) throw new BadRequestError('This liturgy is not recorded.')
   owned.notes = notes
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}

// source: DSA5 Regelwerk, S. 322, 324 (each blessing 1 AP; Die Zwölf Segnungen together 12 AP)
export async function addBlessing(req: Request, res: Response) {
   const stat = await owner(req)
   const { key, spendAP } = karmaRemoveSchema.parse(req.body)
   const keys = key === twelveBlessings.key ? blessings.map((entry) => entry.key) : [key]
   if (!keys.every((name) => blessings.some((entry) => entry.key === name))) throw new BadRequestError('Choose a verified blessing.')
   const missing = keys.filter((name) => !stat.blessings.some((entry) => entry.key === name))
   if (!missing.length) throw new BadRequestError('Already recorded.')
   if (spendAP) assertPriest(stat)
   const cost = spendAP ? missing.length * blessingAp : 0
   assertAffordable(cost, stat.experience.total, stat.experience.spent)
   for (const name of missing) stat.blessings.push({ key: name, paidAP: spendAP ? blessingAp : 0 })
   stat.experience.spent += cost
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}

export async function removeBlessing(req: Request, res: Response) {
   const stat = await owner(req)
   const { key, spendAP } = karmaRemoveSchema.parse(req.body)
   const owned = stat.blessings.find((entry) => entry.key === key)
   if (!owned) throw new BadRequestError('This blessing is not recorded.')
   const refund = spendAP ? owned.paidAP : 0
   assertRefund(refund, stat.experience.spent)
   stat.blessings = stat.blessings.filter((entry) => entry.key !== key)
   stat.experience.spent -= refund
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}

// KaP spent on liturgies and blessings, or recovered by the GM's ruling (S. 306, 311)
export async function adjustKarma(req: Request, res: Response) {
   const stat = await owner(req)
   const { direction, amount } = karmaAdjustmentSchema.parse(req.body)
   const current = stat.karmaEnergy.current ?? stat.karmaEnergy.max
   const spend = direction === 'spend' ? karmaSpend(stat, amount, current) : null
   const target = current + (spend ? -spend.total : amount)
   // source: DSA5 Regelwerk, S. 306 (a liturgy costing more KaP than the priest has fails)
   if (target < 0 || target > stat.karmaEnergy.max) throw new BadRequestError('KaP must stay between zero and the maximum.')
   stat.karmaEnergy.current = target
   await saveStats(stat)
   res.json({ ...buildStatResponse(stat), spend: { total: spend?.total ?? 0, extra: spend?.extra ?? 0 } })
}
