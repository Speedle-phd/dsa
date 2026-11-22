import type { Request, Response } from 'express'
import { BadRequestError, ForbiddenError, UnauthorizedError } from '@/utils/appError'
import { findStatsForActor, findStatsForUser, saveStats } from '@/utils/statsPersistence'
import { buildStatResponse } from '@/views/statsView'
import {
   adjustHealth, combatAbilities, combatTechniques,
   defaultCombatTechniques, getCombatTechnique, manualCombatConditions, purchaseCombatAbility,
} from '@/utils/combatRules'
import { combatSettingsSchema, healthAdjustmentSchema } from '@/validations/combatValidation'
import { combatAbilityEffect } from '@/utils/combatAbilityEffects'
import { armorIndex } from '@/utils/checkModifiers'
import { equippedArmor, normalizeArmorEquipment } from '@/utils/armorEquipment'
import { endBloodRage, normalizeStatuses } from '@/utils/statusRules'
import { ActiveEffect } from '@/models/activeEffect.model'
import { conditionsAfterEffect } from '@/utils/abilityEffects'
import { consumeAmmunition } from '@/utils/ammunition'
import { carriedEquipmentWeight } from '@/utils/equipmentPurchase'
import { stowPlacement } from '@/utils/containers'
import { calcBurden } from '@/utils/baseAttributes'
import { repairWeaponSchema, useAmmunitionSchema, weaponConditionSchema } from '@/validations/combatValidation'
import { repairWeapon, setWeaponCondition } from '@/utils/weaponCondition'
import { adjustPurse } from '@/utils/purseAdjustment'
import { advancementCost, assertAffordable } from '@/utils/advancement'
import { levelUpCombatTechniqueSchema, removeCombatAbilitySchema } from '@/validations/combatValidation'
import { combatTechniqueMaximum } from '@/utils/skillMaximum'
import { triggerOptions } from '@/utils/entryTriggers'

export function getCombatReference(_req: Request, res: Response) {
   res.json({
      techniques: combatTechniques,
      abilities: combatAbilities.map((entry) => ({ ...entry, effect: combatAbilityEffect(entry.key) })),
      conditions: manualCombatConditions,
   })
}

export async function levelUpCombatTechnique(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   const techniques = stat.combatTechniques.length ? stat.toObject().combatTechniques : defaultCombatTechniques()
   const { techniqueKey, value, spendAP } = levelUpCombatTechniqueSchema.parse(req.body)
   const entry = techniques.find((item) => item.key === techniqueKey)
   if (!entry) throw new BadRequestError('Unknown combat technique.')
   const technique = getCombatTechnique(entry.key)
   if (!technique) throw new BadRequestError('Unknown combat technique.')
   const target = value ?? entry.value + 1
   const maximum = combatTechniqueMaximum(stat, technique.key) ?? 0
   if (spendAP && target > maximum) {
      throw new BadRequestError(`Combat technique has reached its maximum ${maximum} (Leiteigenschaft + 2, Herausragende Kampftechnik; S. 39, 166).`)
   }
   const cost = advancementCost(entry.value, target, technique.stfClass, spendAP)
   assertAffordable(cost, stat.experience.total, stat.experience.spent)
   entry.value = target
   stat.combatTechniques = techniques
   stat.experience.spent += cost
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}

export async function removeCombatAbility(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   const { abilityKey, spendAP } = removeCombatAbilitySchema.parse(req.body)
   if (!stat.combatSpecialAbilities.includes(abilityKey)) {
      throw new BadRequestError('This combat ability is not recorded.')
   }
   const dependents = combatAbilities.filter((entry) =>
      stat.combatSpecialAbilities.includes(entry.key) &&
      entry.requirements.some((requirement) => 'ability' in requirement && requirement.ability === abilityKey))
   if (dependents.length) {
      throw new BadRequestError(`Remove dependent combat abilities first: ${dependents.map((entry) => entry.key).join(', ')}.`)
   }
   const purchase = stat.combatAbilityPurchases.find((entry) => entry.key === abilityKey)
   const refund = spendAP ? purchase?.ap ?? 0 : 0
   if (!Number.isSafeInteger(refund) || refund < 0 || refund > stat.experience.spent) {
      throw new BadRequestError('Cannot refund this purchase: the stored AP accounting is inconsistent.')
   }
   stat.combatSpecialAbilities = stat.combatSpecialAbilities.filter((key) => key !== abilityKey)
   stat.combatAbilityPurchases = stat.combatAbilityPurchases.filter((entry) => entry.key !== abilityKey)
   stat.experience.spent -= refund
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}

export async function addCombatAbility(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   const { abilityKey, mode } = req.body as { abilityKey: string; mode: 'record' | 'purchase' }
   if (stat.combatSpecialAbilities.includes(abilityKey)) throw new BadRequestError('This combat ability is already recorded.')
   if (mode === 'purchase') {
      const result = purchaseCombatAbility(abilityKey, stat, stat.talents, stat.combatSpecialAbilities,
         stat.experience.total - stat.experience.spent)
      if (!result.ok) throw new BadRequestError(
         result.reason === 'missing-prerequisites' ? 'Combat ability prerequisites are not met (S. 54–55).'
            : result.reason === 'insufficient-ap' ? 'Not enough AP to purchase this combat ability.'
               : 'Invalid combat ability purchase.',
      )
      stat.experience.spent += result.cost
      stat.combatAbilityPurchases.push({ key: abilityKey, ap: result.cost })
   }
   stat.combatSpecialAbilities.push(abilityKey)
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}

export async function updateCombatSettings(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const { stat, actor } = await findStatsForActor(req.params.id, req.user._id)
   const payload = combatSettingsSchema.parse(req.body)
   // The party GM may set statuses and Zustände only (user decision, Nov 2026)
   if (actor === 'gm' && Object.keys(payload).some((key) => key !== 'statuses' && key !== 'conditions')) {
      throw new ForbiddenError('The game master can change statuses and conditions only.')
   }
   if (payload.wornArmor !== undefined) {
      if (payload.wornArmor !== null && (armorIndex(payload.wornArmor) < 0 ||
         !stat.equipment.some((entry) => entry.item === payload.wornArmor && entry.amount > 0))) {
         throw new BadRequestError('Select a known armor item from this hero inventory.')
      }
      const equipment = stat.toObject().equipment
      let selected = false
      stat.equipment = normalizeArmorEquipment(equipment.map((entry) => {
         if (!selected && entry.item === payload.wornArmor && entry.amount > 0) {
            selected = true
            return { ...entry, carriedOn: 'Equipped' }
         }
         return armorIndex(entry.item) >= 0 && entry.carriedOn === 'Equipped'
            ? { ...entry, carriedOn: stowPlacement } : entry
      }))
      stat.wornArmor = payload.wornArmor
   }
   if (payload.techniques) {
      if (payload.techniques.length !== combatTechniques.length ||
         new Set(payload.techniques.map((entry) => entry.key)).size !== combatTechniques.length ||
         payload.techniques.some((entry) => !getCombatTechnique(entry.key))) {
         throw new BadRequestError('Provide each combat technique exactly once.')
      }
      // Manual initial setup follows the existing talent editor: no AP charge.
      stat.combatTechniques = payload.techniques
   }
   if (payload.conditions) stat.combatConditions = payload.conditions
   if (payload.statuses) {
      const next = normalizeStatuses(payload.statuses)
      stat.combatConditions = endBloodRage(stat.statuses ?? [], next, stat.combatConditions ?? {})
      // source: DSA5 Regelwerk, S. 216 (Eiserner Wille ends when the hero becomes Bewusstlos, then Betäubung I)
      if (next.includes('Bewusstlos') && !(stat.statuses ?? []).includes('Bewusstlos')) {
         const focus = await ActiveEffect.findOneAndDelete({ statsId: stat._id, userId: stat.userId, key: 'ironWill' })
         if (focus) stat.combatConditions = conditionsAfterEffect(stat.combatConditions ?? {}, focus.toObject().values ?? {})
      }
      stat.statuses = next
   }
   if (payload.triggers) {
      const options = triggerOptions(stat).map((option) => option.key)
      if (payload.triggers.some((key) => !options.includes(key))) throw new BadRequestError('Only triggers of recorded disadvantages can be switched on (S. 170, 173, 177).')
      stat.triggers = [...new Set(payload.triggers)]
   }
   if (payload.modifiers) stat.combatModifiers = payload.modifiers
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}

export async function adjustHealthController(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const { stat } = await findStatsForActor(req.params.id, req.user._id)
   const { direction, amount } = healthAdjustmentSchema.parse(req.body)
   const result = adjustHealth(stat.health.current, stat.health.max, direction, amount)
   if (!result.ok) throw new BadRequestError('Enter a positive whole number of LeP and check the health values.')
   stat.health.current = result.current
   stat.pain = result.pain
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}

// source: DSA5 Regelwerk, S. 246 (shot projectiles are used up)
export async function useAmmunitionController(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   const { item } = useAmmunitionSchema.parse(req.body)
   const result = consumeAmmunition(stat.toObject().equipment, item)
   if (!result.ok) throw new BadRequestError(`No ${item} carried. Move some out of the stash or buy more.`)
   stat.equipment = result.equipment
   stat.burden = calcBurden(stat.carryingCapacity, carriedEquipmentWeight(result.equipment))
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}

// source: DSA5 Regelwerk, S. 231, 234, 243–244 (Patzer table: weapon damaged, badly damaged or destroyed)
export async function setWeaponConditionController(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   const { index, item, condition } = weaponConditionSchema.parse(req.body)
   const equipment = setWeaponCondition(stat.toObject().equipment, index, item, condition)
   if (!equipment) throw new BadRequestError('This weapon is no longer in the inventory.')
   stat.equipment = equipment
   stat.wornArmor = equippedArmor(stat.equipment)
   stat.burden = calcBurden(stat.carryingCapacity, carriedEquipmentWeight(equipment))
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}

// The core rules give no repair price or check: the GM's price is paid from the purse, or the hero has passed a craft check.
export async function repairWeaponController(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   const payload = repairWeaponSchema.parse(req.body)
   const equipment = repairWeapon(stat.toObject().equipment, payload.index, payload.item)
   if (!equipment) throw new BadRequestError('This weapon does not need a repair.')
   if (payload.method === 'pay') {
      const result = adjustPurse(stat.toObject().purse, { direction: 'lose', coins: payload.price })
      if (!result.ok) throw new BadRequestError(result.reason === 'insufficient-funds'
         ? `The repair costs ${result.amountKreuzer} kreuzer, but you only have ${result.availableKreuzer} kreuzer available.`
         : 'Enter a valid repair price.')
      stat.purse = result.purse
   }
   stat.equipment = equipment
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}
