import { z } from 'zod'
import { manualCombatConditions } from '../utils/combatRules'
import { statusNames } from '../utils/statusRules'
import { ammunitionItems } from '../utils/ammunition'
import { weaponConditions } from '../utils/weaponCondition'

export const levelUpCombatTechniqueSchema = z.object({
   techniqueKey: z.string().trim().min(1),
   value: z.number().int().min(6).max(25).optional(),
   spendAP: z.boolean().default(true),
})
export const addCombatAbilitySchema = z.object({
   abilityKey: z.string().trim().min(1).max(200),
   mode: z.enum(['record', 'purchase']),
})
export const removeCombatAbilitySchema = addCombatAbilitySchema.pick({ abilityKey: true }).extend({
   spendAP: z.boolean().default(true),
})
export const healthAdjustmentSchema = z.object({
   direction: z.enum(['heal', 'damage']),
   amount: z.number().int().positive(),
})
export const combatSettingsSchema = z.object({
   techniques: z.array(z.object({
      key: z.string().trim().min(1),
      value: z.number().int().min(6).max(25),
   })).optional(),
   conditions: z.partialRecord(z.enum(['Belastung', ...manualCombatConditions]), z.number().int().min(0).max(4)).optional(),
   statuses: z.array(z.enum(statusNames)).max(statusNames.length).optional(),
   triggers: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
   wornArmor: z.string().trim().min(1).max(200).nullable().optional(),
   modifiers: z.object({
      initiative: z.number().int().min(-100).max(100),
      speed: z.number().int().min(-100).max(100),
      speedBase: z.number().int().min(0).max(100).nullable(),
   }).optional(),
})
export const useAmmunitionSchema = z.object({ item: z.enum(ammunitionItems) })
const weaponTarget = { index: z.number().int().min(0), item: z.string().trim().min(1).max(200) }
export const weaponConditionSchema = z.object({ ...weaponTarget, condition: z.enum([...weaponConditions, 'destroyed']) })
const coins = z.object({
   dukaten: z.number().int().min(0).default(0), silbertaler: z.number().int().min(0).default(0),
   heller: z.number().int().min(0).default(0), kreuzer: z.number().int().min(0).default(0),
})
export const repairWeaponSchema = z.discriminatedUnion('method', [
   z.object({ ...weaponTarget, method: z.literal('pay'), price: coins }),
   z.object({ ...weaponTarget, method: z.literal('self') }),
])
