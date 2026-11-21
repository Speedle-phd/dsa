import { calcExperience, incrementFatePoints, spendFatePoint } from '@/utils/baseAttributes'
import { calcRegeneration, regenerationResources, type RegenerationOutcome, type RegenerationResource } from '@/utils/regeneration'
import { regenerationSchema } from '@/validations/statsValidation'
import type { Request, Response } from 'express'
import { Char } from '@/models/char.model'
import { Stats, type IStatsDocument } from '@/models/stats.model'
import { ActiveEffect } from '@/models/activeEffect.model'
import {
   BadRequestError,
   NotFoundError,
   UnauthorizedError,
} from '@/utils/appError'
import { buildStatResponse, buildStatsResponse } from '@/views/statsView'
import {
   calcBaseAttributes,
   calcBurden,
   calcPain,
} from '@/utils/baseAttributes'
import { advancementCost, assertAffordable } from '@/utils/advancement'
import {
   defaultTalents,
   isTalentKey,
   talentStfClassByKey,
} from '@/utils/talentCatalog'
import { getExpForLevel, getLevelForExp } from '@/utils/levelExpMapping'
import { attributeNames, statsRules } from '@/validations/statsRules'
import { findStatsForUser, saveStats } from '@/utils/statsPersistence'
import {
   purchaseEquipment as calculateEquipmentPurchase,
   carriedEquipmentWeight,
   type EquipmentPurchaseInput,
} from '@/utils/equipmentPurchase'

import { adjustPurse, type PurseAdjustmentInput } from '@/utils/purseAdjustment'
import { assertEntryListsPreserved } from '@/utils/characterEntryRules'
import { equippedArmor, normalizeArmorEquipment } from '@/utils/armorEquipment'
import { applyResourceMaxima } from '@/utils/energyRules'
import { levelUpAttributeSchema, levelUpTalentSchema, vitalResourcesTypeSchema } from '@/validations/statsValidation'
import { talentMaximum } from '@/utils/skillMaximum'

// source: DSA5 Regelwerk, S. 28–29, 56 (recalculate bases after permanent changes)
// Heroes saved before KaP was tracked have no current value; treat it as full.
function karmaCurrent(stat: Pick<IStatsDocument, 'karmaEnergy'>) {
   return stat.karmaEnergy.current ?? stat.karmaEnergy.max
}

function recalculateResources(stat: IStatsDocument) {
   stat.health.basicValue = stat.health.value
   stat.soulPower.basicValue = stat.soulPower.value
   stat.toughness.basicValue = stat.toughness.value
   stat.dodge.basicValue = calcBaseAttributes.dodge(stat.dexterity, 0)
   stat.dodge.max = calcBaseAttributes.dodge(stat.dexterity, stat.dodge.bonusMalus)
   stat.dodge.value = stat.dodge.max
   applyResourceMaxima(stat)
   stat.health.current = Math.min(stat.health.current, stat.health.max)
   stat.mana.current = Math.min(stat.mana.current, stat.mana.max)
   stat.karmaEnergy.current = Math.min(karmaCurrent(stat), stat.karmaEnergy.max)
   stat.pain = calcPain(stat.health.current, stat.health.max)
   stat.carryingCapacity = calcBaseAttributes.carryingCapacity(stat.strength)
}

function assertCurrentDoesNotExceedMaximum(
   name: string,
   current: number,
   maximum: number,
) {
   if (current > maximum) {
      throw new BadRequestError(
         `${name} current value cannot exceed its maximum value.`,
      )
   }
}
function assertExperienceDoesNotExceedTotal(total: number, spent: number) {
   if (spent > total) {
      throw new BadRequestError(
         `Experience spent cannot exceed total experience.`,
      )
   }
}

function assertAdditionalPurchaseBetween(value: number) {
   if (
      value < statsRules.attributeRange.minLength ||
      value > statsRules.attributeRange.maxLength
   ) {
      throw new BadRequestError(
         `Additional purchase value must be between ${statsRules.attributeRange.minLength} and ${statsRules.attributeRange.maxLength}.`,
      )
   }
}

const attributes = attributeNames
export type Attribute = (typeof attributes)[number]
function isAttribute(value: string): value is Attribute {
   return attributes.includes(value as Attribute)
}

export async function getStats(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const stats = await Stats.find({ userId: req.user._id }).sort({
      createdAt: -1,
   })

   res.status(200).json(buildStatsResponse(stats))
}

export async function getStatsById(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const { id } = req.params
   const stat = await findStatsForUser(id, req.user._id)

   res.status(200).json(buildStatResponse(stat))
}

export async function getStatsByCharacterId(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const stat = await Stats.findOne({
      charId: req.params.charId,
      userId: req.user._id,
   })

   if (!stat) {
      throw new NotFoundError('Stats not found')
   }

   res.status(200).json(buildStatResponse(stat))
}

export async function createStats(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const { charId, ...payload } = req.body

   if (!charId) {
      throw new BadRequestError('Character id is required')
   }

   const char = await Char.findOne({ _id: charId, userId: req.user._id })

   if (!char) {
      throw new NotFoundError('Character not found')
   }

   const existingStats = await Stats.findOne({
      userId: req.user._id,
      charId,
   })

   if (existingStats) {
      throw new BadRequestError('Stats for this character already exist')
   }

   const equipment = normalizeArmorEquipment(payload.equipment ?? [])
   const stat = await Stats.create({
      ...payload,
      equipment,
      wornArmor: equippedArmor(equipment),
      userId: req.user._id,
      charId,
   })

   res.status(201).json(buildStatResponse(stat))
}

export async function updateStats(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const { id } = req.params
   const stat = await findStatsForUser(id, req.user._id)

   const { spendAP = false, ...payload } = req.body
   let advancementAP = 0
   for (const attribute of attributes) {
      if (payload[attribute] !== undefined) {
         advancementAP += advancementCost(stat[attribute], payload[attribute], 'e', spendAP)
      }
   }
   for (const resource of ['health', 'mana', 'karmaEnergy'] as const) {
      if (payload[resource]?.additionalPurchase !== undefined) {
         advancementAP += advancementCost(stat[resource].additionalPurchase, payload[resource].additionalPurchase, 'd', spendAP)
      }
   }
   assertAffordable(advancementAP, stat.experience.total, stat.experience.spent)

   // List of fields that should NOT be directly updateable (derived/calculated)
   assertEntryListsPreserved(stat.toObject(), payload)
   const derivedFields = [
      'health.max',
      'soulPower.max',
      'toughness.max',
      'dodge.max',
      'mana.max',
      'karmaEnergy.max',
      'experience.total',
      'experience.base',
      'experience.disadvantageCredit',
      'entryCredits',
      'entryPurchases',
      'burden',
      'pain',
      'carryingCapacity',
   ]

   // Validate that no derived fields are being updated
   const updateKeys = Object.keys(payload).flatMap((key) => {
      if (typeof payload[key] === 'object' && payload[key] !== null) {
         return Object.keys(payload[key]).map((subKey) => `${key}.${subKey}`)
      }
      return key
   })

   const invalidFields = updateKeys.filter((key) =>
      derivedFields.some((derived) => key.startsWith(derived)),
   )

   if (invalidFields.length > 0) {
      throw new BadRequestError(
         `Cannot update derived fields: ${invalidFields.join(', ')}`,
      )
   }

   // Calculate equipment weight for burden calculation
   let equipmentWeight = 0
   if (payload.equipment && Array.isArray(payload.equipment)) {
      equipmentWeight = carriedEquipmentWeight(payload.equipment)
   } else if (stat.equipment && !payload.equipment) {
      equipmentWeight = carriedEquipmentWeight(stat.equipment)
   }

   // Merge existing data with updates
   const mergedStat = {
      ...stat.toObject(),
      ...payload,
      experience: { ...stat.toObject().experience, ...payload.experience },
      health: { ...stat.health, ...payload.health },
      mana: { ...stat.mana, ...payload.mana },
      karmaEnergy: { ...stat.karmaEnergy, ...payload.karmaEnergy },
      soulPower: { ...stat.soulPower, ...payload.soulPower },
      toughness: { ...stat.toughness, ...payload.toughness },
      dodge: { ...stat.dodge, ...payload.dodge },
      fatePoints: {
         value: payload.fatePoints?.value ?? stat.fatePoints?.value ?? 3,
         bonusMalus:
            payload.fatePoints?.bonusMalus ?? stat.fatePoints?.bonusMalus ?? 0,
         current: payload.fatePoints?.current ?? stat.fatePoints?.current ?? 3,
         max:
            (payload.fatePoints?.value ?? stat.fatePoints?.value ?? 3) +
            (payload.fatePoints?.bonusMalus ??
               stat.fatePoints?.bonusMalus ??
               0),
      },
   }

   mergedStat.health.basicValue = mergedStat.health.value

   mergedStat.soulPower.basicValue = mergedStat.soulPower.value
   mergedStat.toughness.basicValue = mergedStat.toughness.value

   mergedStat.dodge.basicValue = calcBaseAttributes.dodge(
      mergedStat.dexterity,
      0,
   )
   mergedStat.dodge.value = calcBaseAttributes.dodge(
      mergedStat.dexterity,
      mergedStat.dodge.bonusMalus,
   )
   mergedStat.dodge.max = mergedStat.dodge.value

   applyResourceMaxima(mergedStat)

   assertCurrentDoesNotExceedMaximum(
      'Health',
      mergedStat.health.current,
      mergedStat.health.max,
   )
   assertCurrentDoesNotExceedMaximum(
      'Mana',
      mergedStat.mana.current,
      mergedStat.mana.max,
   )
   mergedStat.karmaEnergy.current = payload.karmaEnergy?.current ??
      Math.min(karmaCurrent(stat), mergedStat.karmaEnergy.max)
   assertCurrentDoesNotExceedMaximum(
      'Karma energy',
      mergedStat.karmaEnergy.current,
      mergedStat.karmaEnergy.max,
   )
   assertCurrentDoesNotExceedMaximum(
      'Fate points',
      mergedStat.fatePoints.current,
      mergedStat.fatePoints.max,
   )

   mergedStat.carryingCapacity = calcBaseAttributes.carryingCapacity(
      mergedStat.strength,
   )
   mergedStat.pain = calcPain(mergedStat.health.current, mergedStat.health.max)
   mergedStat.burden = calcBurden(mergedStat.carryingCapacity, equipmentWeight)
   // An unrelated correction must not rebase AP on the hero's attained experience level.
   mergedStat.experience.base = payload.level === undefined ? stat.experience.base : getExpForLevel(mergedStat.level)
   mergedStat.experience.total = payload.level !== undefined
      ? mergedStat.experience.base + mergedStat.experience.gathered + (mergedStat.experience.disadvantageCredit ?? 0)
      : stat.experience.total + mergedStat.experience.gathered - stat.experience.gathered
   mergedStat.experience.spent += advancementAP
   assertExperienceDoesNotExceedTotal(mergedStat.experience.total, mergedStat.experience.spent)
   if (payload.level !== undefined || payload.experience?.gathered !== undefined) {
      mergedStat.level = getLevelForExp(mergedStat.experience.total - (mergedStat.experience.disadvantageCredit ?? 0))
   }

   // Apply updates to the document
   mergedStat.equipment = normalizeArmorEquipment(mergedStat.equipment, stat.toObject().equipment,
      payload.equipment === undefined ? stat.wornArmor : null)
   mergedStat.wornArmor = equippedArmor(mergedStat.equipment)
   Object.assign(stat, mergedStat)

   await saveStats(stat)

   res.status(200).json(buildStatResponse(stat))
}

export async function purchaseEquipmentController(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const stat = await findStatsForUser(req.params.id, req.user._id)
   const statData = stat.toObject()
   const result = calculateEquipmentPurchase(
      statData.purse,
      statData.equipment,
      req.body as EquipmentPurchaseInput,
   )

   if (!result.ok) {
      if (result.reason === 'insufficient-funds') {
         throw new BadRequestError(
            `This purchase costs ${result.totalCostKreuzer} kreuzer, but you only have ${result.availableKreuzer} kreuzer available.`,
         )
      }
      throw new BadRequestError(
         result.reason === 'invalid-purse'
            ? 'The hero purse contains invalid coin amounts.'
            : 'The equipment purchase contains invalid values.',
      )
   }

   stat.purse = result.purse
   stat.equipment = normalizeArmorEquipment(result.equipment, statData.equipment, stat.wornArmor)
   stat.wornArmor = equippedArmor(stat.equipment)
   stat.burden = calcBurden(stat.carryingCapacity, result.totalWeight)

   await saveStats(stat)

   res.status(200).json(buildStatResponse(stat))
}

export async function adjustPurseController(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const stat = await findStatsForUser(req.params.id, req.user._id)
   const result = adjustPurse(
      stat.toObject().purse,
      req.body as PurseAdjustmentInput,
   )

   if (!result.ok) {
      if (result.reason === 'insufficient-funds') {
         throw new BadRequestError(
            `You cannot lose ${result.amountKreuzer} kreuzer, but you only have ${result.availableKreuzer} kreuzer available.`,
         )
      }
      throw new BadRequestError(
         result.reason === 'invalid-purse'
            ? 'The hero purse contains invalid coin amounts.'
            : 'Enter a valid, non-empty coin amount.',
      )
   }

   stat.purse = result.purse
   await saveStats(stat)

   res.status(200).json(buildStatResponse(stat))
}

export async function deleteStats(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const { id } = req.params
   const stat = await findStatsForUser(id, req.user._id)

   await stat.deleteOne()

   res.status(200).json({
      message: 'Stats deleted successfully',
   })
}

export async function levelUpAttribute(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const { id } = req.params

   const stat = await findStatsForUser(id, req.user._id)

   const { attribute, value, spendAP } = levelUpAttributeSchema.parse(req.body)

   if (!isAttribute(attribute)) {
      throw new BadRequestError('Invalid attribute')
   }

   const currentLevel = stat[attribute]
   const nextLevel = value ?? currentLevel + 1
   const cost = advancementCost(currentLevel, nextLevel, 'e', spendAP)
   assertAffordable(cost, stat.experience.total, stat.experience.spent)
   stat[attribute] = nextLevel

   stat.experience.spent = stat.experience.spent + cost
   assertExperienceDoesNotExceedTotal(
      stat.experience.total,
      stat.experience.spent,
   )
   recalculateResources(stat)
   await saveStats(stat)
   res.status(200).json(buildStatResponse(stat))
}
export async function purchaseAdditionalVitalResources(
   req: Request,
   res: Response,
) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const { id } = req.params

   const stat = await findStatsForUser(id, req.user._id)

   const { value, target, spendAP } = vitalResourcesTypeSchema.parse(req.body)

   if (value !== 'health' && value !== 'mana' && value !== 'karmaEnergy') {
      throw new BadRequestError('Invalid additional purchase values')
   }

   const currentLevel = stat[value].additionalPurchase || 0
   const nextLevel = target ?? currentLevel + 1
   const cost = advancementCost(currentLevel, nextLevel, 'd', spendAP)
   assertAffordable(cost, stat.experience.total, stat.experience.spent)
   if (spendAP && ((value === 'mana' && !stat.isSorcerer) || (value === 'karmaEnergy' && !stat.isConsecratedPerson))) {
      throw new BadRequestError('This hero cannot purchase this resource.')
   }

   stat[value].additionalPurchase = nextLevel

   if (value === 'karmaEnergy') {
      stat.karmaEnergy.current = Math.max(0, karmaCurrent(stat) + nextLevel - currentLevel)
   } else {
      stat[value].current = value === 'mana'
         ? Math.max(0, stat[value].current + nextLevel - currentLevel)
         : stat[value].current + nextLevel - currentLevel
   }

   stat.experience.spent = stat.experience.spent + cost
   assertExperienceDoesNotExceedTotal(
      stat.experience.total,
      stat.experience.spent,
   )
   assertAdditionalPurchaseBetween(stat[value].additionalPurchase)
   recalculateResources(stat)
   assertCurrentDoesNotExceedMaximum(
      value,
      value === 'karmaEnergy' ? karmaCurrent(stat) : stat[value].current,
      stat[value].max,
   )

   await saveStats(stat)
   res.status(200).json(buildStatResponse(stat))
}

export async function updateAdvantagesAbilities(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const { id } = req.params

   const stat = await findStatsForUser(id, req.user._id)

   const payload = req.body

   const { advantages, disadvantages, generalSpecialAbilities } = payload as {
      advantages: string[]
      disadvantages: string[]
      generalSpecialAbilities: string[]
   }

   assertEntryListsPreserved(stat.toObject(), { advantages, disadvantages, generalSpecialAbilities })
   if (advantages) stat.advantages = advantages
   if (disadvantages) stat.disadvantages = disadvantages
   if (generalSpecialAbilities) stat.generalSpecialAbilities = generalSpecialAbilities

   await saveStats(stat)

   res.status(200).json(buildStatResponse(stat))
}

export async function updateTalents(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const { id } = req.params

   const stat = await findStatsForUser(id, req.user._id)

   const payload = req.body

   const { talents } = payload as {
      talents: Array<{ key: string; value: number | null; notes: string }>
   }

   const invalidKeys = talents
      .map((talent) => talent.key)
      .filter((key) => !isTalentKey(key))

   if (invalidKeys.length > 0) {
      throw new BadRequestError(`Unknown talents: ${invalidKeys.join(', ')}`)
   }

   // Initial values do not cost AP.
   stat.talents = talents

   await saveStats(stat)

   res.status(200).json(buildStatResponse(stat))
}

export async function levelUpTalent(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const { id } = req.params

   const stat = await findStatsForUser(id, req.user._id)

   const { talentKey, value, spendAP } = levelUpTalentSchema.parse(req.body)

   if (!isTalentKey(talentKey)) {
      throw new BadRequestError('Invalid talent')
   }

   const talents =
      stat.talents && stat.talents.length > 0 ? stat.toObject().talents : defaultTalents()
   let talent = talents.find((entry) => entry.key === talentKey)

   if (!talent) {
      // Stats saved before this talent was added to the catalog.
      talents.push({ key: talentKey, value: null, notes: '' })
      talent = talents[talents.length - 1]
   }

   const stfClass = talentStfClassByKey[talentKey]
   const target = value ?? (talent.value === null ? 0 : talent.value + 1)
   const maximum = talentMaximum(stat, talentKey) ?? 0
   if (spendAP && target > maximum) {
      throw new BadRequestError(`Talent has reached its maximum ${maximum} (highest probe attribute + 2, Herausragende Fertigkeit; S. 39, 166).`)
   }
   const cost = advancementCost(talent.value, target, stfClass, spendAP)
   assertAffordable(cost, stat.experience.total, stat.experience.spent)
   talent.value = target
   stat.experience.spent += cost

   stat.talents = talents

   await saveStats(stat)

   res.status(200).json(buildStatResponse(stat))
}

export async function updateLanguagesScripts(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const { id } = req.params

   const stat = await findStatsForUser(id, req.user._id)

   const payload = req.body

   const { languages, scripts } = payload as {
      languages: string[]
      scripts: string[]
   }

   assertEntryListsPreserved(stat.toObject(), { languages, scripts })
   stat.languages = languages
   stat.scripts = scripts

   await saveStats(stat)

   res.status(200).json(buildStatResponse(stat))
}

export async function updateExperience(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const { id } = req.params

   const stat = await findStatsForUser(id, req.user._id)

   const payload = req.body

   const { gathered, level } = payload as { gathered: number; level: string }

   const { totalExperience, experienceGained } = calcExperience(stat, gathered)
   stat.experience.total = totalExperience
   stat.experience.gathered = experienceGained

   stat.level = getLevelForExp(stat.experience.total - (stat.experience.disadvantageCredit ?? 0))

   await saveStats(stat)

   res.status(200).json(buildStatResponse(stat))
}

export async function incrementFatePointsController(
   req: Request,
   res: Response,
) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const { id } = req.params

   const stat = await findStatsForUser(id, req.user._id)

   assertCurrentDoesNotExceedMaximum(
      'Fate Points',
      stat.fatePoints.current + 1,
      stat.fatePoints.max,
   )
   stat.fatePoints.current = incrementFatePoints(stat.fatePoints)

   await saveStats(stat)

   res.status(200).json(buildStatResponse(stat))
}

// source: DSA5 Regelwerk, S. 31 (end of an adventure: all Schips come back)
export async function restoreFatePointsController(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   stat.fatePoints.current = stat.fatePoints.max
   await saveStats(stat)
   res.status(200).json(buildStatResponse(stat))
}

export async function spendFatePointController(
   req: Request,
   res: Response,
) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const { id } = req.params

   const stat = await findStatsForUser(id, req.user._id)

   if (stat.fatePoints.current < 1) {
      throw new BadRequestError('No fate points left to spend.')
   }
   stat.fatePoints.current = spendFatePoint(stat.fatePoints)

   await saveStats(stat)

   res.status(200).json(buildStatResponse(stat))
}

export async function regenerateController(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const stat = await findStatsForUser(req.params.id, req.user._id)
   const { rolls, ...requested } = regenerationSchema.parse(req.body)
   // source: DSA5 Regelwerk, S. 36 (status Vergiftet/Krank: no normal regeneration)
   const situation = { ...requested, poisonedOrSick: requested.poisonedOrSick ||
      (stat.statuses ?? []).some((status) => status === 'Vergiftet' || status === 'Krank') }
   const entries = { advantages: stat.advantages ?? [], disadvantages: stat.disadvantages ?? [] }
   const regeneration: Partial<Record<RegenerationResource, RegenerationOutcome & { gained: number }>> = {}
   // Pending Wirselkraut and Medicus treatment apply to the next LeP regeneration and are used up by it (S. 340, 346, 382).
   const pending = rolls.health === undefined ? [] : await ActiveEffect.find({
      statsId: stat._id, userId: req.user._id, key: { $in: ['herbHealth', 'treatment'] },
   })
   const herbHealth = pending.reduce((sum, effect) => sum + (effect.values?.herbHealth ?? 0), 0)
   const treatmentQuality = Math.max(situation.treatmentQuality, ...pending.map((effect) => effect.values?.treatmentQuality ?? 0))

   for (const resource of regenerationResources) {
      const roll = rolls[resource]
      if (roll === undefined) continue
      if ((resource === 'mana' && !stat.isSorcerer) || (resource === 'karmaEnergy' && !stat.isConsecratedPerson)) {
         throw new BadRequestError('This hero cannot regenerate this energy.')
      }
      const outcome = calcRegeneration(resource, roll, { ...situation, treatmentQuality }, entries, { herbHealth })
      const current = resource === 'karmaEnergy' ? karmaCurrent(stat) : stat[resource].current
      // source: DSA5 Regelwerk, S. 339 (never above the maximum)
      const gained = Math.max(0, Math.min(outcome.amount, stat[resource].max - current))
      stat[resource].current = current + gained
      regeneration[resource] = { ...outcome, gained }
   }
   stat.pain = calcPain(stat.health.current, stat.health.max)

   await saveStats(stat)
   if (pending.length) await ActiveEffect.deleteMany({ _id: { $in: pending.map((effect) => effect._id) }, userId: req.user._id })

   res.status(200).json({ ...buildStatResponse(stat), regeneration })
}

export async function debugStatsController(req: Request, res: Response) {
   const { id } = req.params

   const stat = await Stats.findOne({ charId: id })

   if (!stat) {
      throw new NotFoundError('Stats not found')
   }

   res.status(200).json(buildStatResponse(stat))
}
