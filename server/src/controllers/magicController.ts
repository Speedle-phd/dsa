import type { Request, Response } from 'express'
import type { MagicReferenceResponse } from '@/types/apiContracts'
import { findStatsForUser, saveStats } from '@/utils/statsPersistence'
import { buildStatResponse } from '@/views/statsView'
import { BadRequestError, UnauthorizedError } from '@/utils/appError'
import { activatableStaffSpells, magicSpells, magicTricks, magicTraditions } from '@/utils/magicCatalog'
import { assertMagicUser, missingRitualPrerequisite, spellMaximum, spellRemovalDependents } from '@/utils/magicRules'
import { advancementCost, assertAffordable } from '@/utils/advancement'
import { characterEntryCatalog, staffCapacity, staffVolumes } from '@/utils/characterEntryCatalog'
import { magicRemoveSchema, magicSettingsSchema, manaAdjustmentSchema, permanentManaSchema, spellChangeSchema, spellNotesSchema } from '@/validations/magicValidation'
import { permanentBuybackCost, permanentEnergyLoss } from '@/utils/energyRules'
import { ActiveEffect } from '@/models/activeEffect.model'
import { createEffect } from '@/controllers/activeEffectController'
import { astralSpend, hasMinorSpirits, minorSpiritsAppear, minorSpiritsEffect } from '@/utils/magicDisadvantages'

export function getMagicReference(_req: Request, res: Response) {
   const reference: MagicReferenceResponse = {
      spells: magicSpells, tricks: magicTricks, traditions: [...magicTraditions],
      abilityKeys: characterEntryCatalog.filter((entry) => entry.category === 'generalSpecialAbilities' &&
         (entry.effect.page >= 251 && entry.effect.page <= 304 || entry.key === 'Analytiker')).map((entry) => entry.key),
      staff: { volumes: staffVolumes, capacity: staffCapacity, activatable: activatableStaffSpells },
   }
   res.json(reference)
}

export async function changeSpell(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   const { key, value, spendAP } = spellChangeSchema.parse(req.body)
   const spell = magicSpells.find((entry) => entry.key === key)
   if (!spell) throw new BadRequestError('Choose a verified spell or ritual.')
   // source: DSA5 Regelwerk, S. 278, 281 (curses are taught only between witches)
   if (spell.kind === 'Hexenfluch' && !stat.generalSpecialAbilities.includes('Tradition (Hexe)')) {
      throw new BadRequestError('Hexenflüche require Tradition (Hexe) (S. 278, 281).')
   }
   // source: DSA5 Regelwerk, S. 274, 283 (Zauberlieder need the elven tradition, which includes Zweistimmiger Gesang)
   if (spell.kind === 'Elfenlied' && !stat.generalSpecialAbilities.includes('Tradition (Elf)')) {
      throw new BadRequestError('Elfenlieder require Tradition (Elf) (S. 283).')
   }
   const owned = stat.spells.find((entry) => entry.key === key)
   const target = value ?? (owned ? owned.value + 1 : 0)
   if (spendAP) {
      assertMagicUser(stat)
      const prerequisite = owned ? null : missingRitualPrerequisite(stat, key)
      if (prerequisite) throw new BadRequestError(`${key} requires ${prerequisite.key} FW ${prerequisite.value} (S. 263).`)
      if (target > spellMaximum(stat, spell)) throw new BadRequestError('Spell maximum reached (Probe + 2; Merkmalskenntnis above FW 14, S. 39, 285).')
   }
   if (spellRemovalDependents(stat, key, target).length) throw new BadRequestError('Remove dependent Merkmalskenntnis first (S. 285).')
   const cost = advancementCost(owned?.value ?? null, target, spell.stfClass, spendAP)
   assertAffordable(cost, stat.experience.total, stat.experience.spent)
   if (owned) {
      owned.value = target
      owned.paidAP += cost
   } else stat.spells.push({ key, value: target, notes: '', paidAP: cost })
   stat.experience.spent += cost
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}

export async function removeSpell(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   const { key, spendAP } = magicRemoveSchema.parse(req.body)
   const owned = stat.spells.find((entry) => entry.key === key)
   if (!owned) throw new BadRequestError('This spell is not recorded.')
   if (spellRemovalDependents(stat, key).length) throw new BadRequestError('Remove dependent Merkmalskenntnis first (S. 285).')
   const refund = spendAP ? owned.paidAP : 0
   assertRefund(refund, stat.experience.spent)
   stat.spells = stat.spells.filter((entry) => entry.key !== key)
   if (stat.magicSettings.guildSpell === key) stat.magicSettings.guildSpell = null
   stat.experience.spent -= refund
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}

function assertRefund(refund: number, spent: number) {
   if (!Number.isSafeInteger(refund) || refund < 0 || refund > spent) throw new BadRequestError('Cannot refund this purchase: the stored AP accounting is inconsistent.')
}

export async function changeTrick(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   const { key, spendAP } = magicRemoveSchema.parse(req.body)
   if (!magicTricks.some((entry) => entry.key === key)) throw new BadRequestError('Choose a verified Zaubertrick.')
   if (stat.magicTricks.some((entry) => entry.key === key)) throw new BadRequestError('This Zaubertrick is already recorded.')
   if (spendAP) assertMagicUser(stat, false)
   // source: DSA5 Regelwerk, S. 50, 286
   const cost = spendAP ? 1 : 0
   assertAffordable(cost, stat.experience.total, stat.experience.spent)
   stat.magicTricks.push({ key, paidAP: cost })
   stat.experience.spent += cost
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}

export async function removeTrick(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   const { key, spendAP } = magicRemoveSchema.parse(req.body)
   const owned = stat.magicTricks.find((entry) => entry.key === key)
   if (!owned) throw new BadRequestError('This Zaubertrick is not recorded.')
   const refund = spendAP ? owned.paidAP : 0
   assertRefund(refund, stat.experience.spent)
   stat.magicTricks = stat.magicTricks.filter((entry) => entry.key !== key)
   stat.experience.spent -= refund
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}

export async function updateSpellNotes(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   const { key, notes } = spellNotesSchema.parse(req.body)
   const spell = stat.spells.find((entry) => entry.key === key)
   if (!spell) throw new BadRequestError('This spell is not recorded.')
   spell.notes = notes
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}

export async function updateMagicSettings(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   const payload = magicSettingsSchema.parse(req.body)
   if (payload.artifactItems && (new Set(payload.artifactItems).size !== payload.artifactItems.length ||
      payload.artifactItems.some((name) => !stat.equipment.some((item) => item.item === name && item.amount > 0)))) {
      throw new BadRequestError('Select each tradition artifact once from the current inventory.')
   }
   if (payload.guildSpell && (!stat.generalSpecialAbilities.includes('Tradition (Gildenmagier)') ||
      !stat.spells.some((entry) => entry.key === payload.guildSpell) ||
      !magicSpells.some((entry) => entry.key === payload.guildSpell && entry.kind === 'Zauberspruch' &&
         !entry.traditions.includes('allgemein') && !entry.traditions.includes('Gildenmagier')))) {
      throw new BadRequestError('Choose an owned foreign Zauberspruch for the guild creation exception (S. 275).')
   }
   const owns = (key: string) => stat.generalSpecialAbilities.includes(key)
   const carried = (name: string) => stat.equipment.some((item) => item.item === name && item.amount > 0)
   // source: DSA5 Regelwerk, S. 275–276 (only the bound staff carries staff spells; one active staff spell at a time)
   if (payload.staffItem && (!owns('Bindung des Stabes') || !carried(payload.staffItem))) {
      throw new BadRequestError('Link the bound staff to an inventory item (needs Bindung des Stabes, S. 276).')
   }
   if (payload.staffActive && (!owns('Bindung des Stabes') || !owns(payload.staffActive) || !activatableStaffSpells.includes(payload.staffActive))) {
      throw new BadRequestError('Only an owned staff spell of the bound staff can be activated (S. 276).')
   }
   // source: DSA5 Regelwerk, S. 281 (Flugsalbe turns one wooden object into the witch's flying device)
   if (payload.flyingDevice && (!owns('Flugsalbe') || !carried(payload.flyingDevice))) {
      throw new BadRequestError('The flying device needs Flugsalbe and an inventory item (S. 281).')
   }
   if (payload.staffItem !== undefined) stat.magicSettings.staffItem = payload.staffItem
   if (payload.staffActive !== undefined) stat.magicSettings.staffActive = payload.staffActive
   if (payload.staffInHand !== undefined) stat.magicSettings.staffInHand = payload.staffInHand
   if (payload.flyingDevice !== undefined) stat.magicSettings.flyingDevice = payload.flyingDevice
   if (payload.guildSpell !== undefined) stat.magicSettings.guildSpell = payload.guildSpell
   if (payload.artifacts !== undefined) stat.magicSettings.artifacts = payload.artifacts
   if (payload.artifactItems !== undefined) stat.magicSettings.artifactItems = payload.artifactItems
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}

export async function adjustMana(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   const { direction, amount, spiritRoll } = manaAdjustmentSchema.parse(req.body)
   const spend = direction === 'spend' ? astralSpend(stat, amount, stat.mana.current) : null
   if (spend && hasMinorSpirits(stat) && spiritRoll === undefined) throw new BadRequestError('Roll a W20 for Lästige Mindergeister (S. 173).')
   const target = stat.mana.current + (spend ? -spend.total : amount)
   if (target < 0 || target > stat.mana.max) throw new BadRequestError('AsP must stay between zero and the maximum.')
   stat.mana.current = target
   await saveStats(stat)
   const minorSpirits = spend !== null && spiritRoll !== undefined && minorSpiritsAppear(stat, spiritRoll, spend.total)
   if (minorSpirits && !(await ActiveEffect.exists({ statsId: stat._id, userId: req.user._id, key: minorSpiritsEffect.key }))) {
      await createEffect(stat._id, req.user._id, minorSpiritsEffect)
   }
   res.json({ ...buildStatResponse(stat), spend: { total: spend?.total ?? 0, extra: spend?.extra ?? 0, minorSpirits } })
}

// Permanent AsP: "lose" records a loss (the current AsP drop with the maximum), "buy-back" restores points for 2 AP each,
// "correct" undoes a mistaken loss record without AP. source: DSA5 Regelwerk, S. 262, 352
export async function changePermanentMana(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   const { mode, amount, spendAP } = permanentManaSchema.parse(req.body)
   const open = permanentEnergyLoss(stat.mana)
   if (mode === 'lose') {
      if (!stat.isSorcerer) throw new BadRequestError('Only a Zauberer has AsP to lose.')
      stat.mana.permanentLoss = (stat.mana.permanentLoss ?? 0) + amount
   } else {
      if (amount > open) throw new BadRequestError(`Only ${open} permanent AsP are open.`)
      if (mode === 'buy-back') {
         const cost = spendAP ? amount * permanentBuybackCost : 0
         assertAffordable(cost, stat.experience.total, stat.experience.spent)
         stat.experience.spent += cost
         stat.mana.permanentBuyback = (stat.mana.permanentBuyback ?? 0) + amount
      } else stat.mana.permanentLoss = (stat.mana.permanentLoss ?? 0) - amount
   }
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}
