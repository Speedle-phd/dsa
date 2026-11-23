import { obstacleKinds } from '@/utils/encounterRules'
import { z } from 'zod'

const stat = (max: number) => z.number().int().min(0).max(max)
const optionalStat = (max: number) => stat(max).nullable().default(null)

export const npcValuesSchema = z.object({
   maxHealth: z.number().int().min(1).max(999),
   armor: stat(30).default(0),
   initiativeBase: z.number().int().min(-20).max(60).default(10),
   attack: optionalStat(40),
   parry: optionalStat(40),
   defense: optionalStat(40),
   dodge: optionalStat(40),
   damage: z.string().trim().max(40).default(''),
   speed: optionalStat(40),
   notes: z.string().trim().max(500).default(''),
})

const boardSize = { width: z.number().int().min(5).max(60), height: z.number().int().min(5).max(60) }
// Schritt per square (user decision, Nov 2026)
const boardScale = z.number().int().min(1).max(10)

export const startEncounterSchema = z.object({ width: boardSize.width.optional(), height: boardSize.height.optional() })
export const boardSchema = z.object({ ...boardSize, scale: boardScale.optional() })
export const addNpcsSchema = z.object({
   name: z.string().trim().min(1).max(60),
   count: z.number().int().min(1).max(12),
   values: npcValuesSchema,
   saveTemplate: z.boolean().default(false),
   hidden: z.boolean().default(false),
})
export const updateCombatantSchema = z.object({
   name: z.string().trim().min(1).max(80).optional(),
   hidden: z.boolean().optional(),
   initiative: z.number().int().min(-50).max(100).nullable().optional(),
   initiativeBase: z.number().int().min(-20).max(60).optional(),
   values: npcValuesSchema.partial().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'Nothing to change.' })
export const damageSchema = z.object({
   direction: z.enum(['damage', 'heal']),
   amount: z.number().int().min(1).max(999),
   ignoreArmor: z.boolean().default(false),
})
export const positionSchema = z.object({
   position: z.object({ x: z.number().int().min(0).max(59), y: z.number().int().min(0).max(59) }).nullable(),
})
export const turnSchema = z.object({ direction: z.enum(['next', 'previous']) })
export const obstaclesSchema = z.object({
   cells: z.array(z.object({ x: z.number().int().min(0).max(59), y: z.number().int().min(0).max(59), kind: z.enum(obstacleKinds).nullable() })).min(1).max(400),
})
export const npcInitiativeSchema = z.object({ onlyMissing: z.boolean().default(true) })
export const npcTemplateSchema = z.object({ name: z.string().trim().min(1).max(80), values: npcValuesSchema })

const combatOutcome = z.enum(['success', 'failure', 'critical', 'criticalUnconfirmed', 'botch', 'botchAverted'])
const rollRecord = z.object({
   label: z.string().trim().min(1).max(60),
   roll: z.number().int().min(1).max(20),
   confirmation: z.number().int().min(1).max(20).nullable().optional(),
   target: z.number().int().min(-60).max(60),
   outcome: combatOutcome,
})
export const attackSchema = z.object({
   reach: z.enum(['short', 'medium', 'long']).default('medium'),
   attackerId: z.string().regex(/^[a-f0-9]{24}$/),
   targetId: z.string().regex(/^[a-f0-9]{24}$/),
   incoming: z.enum(['melee', 'shot', 'thrown']).default('melee'),
   attack: rollRecord,
   tp: z.number().int().min(0).max(300).default(0),
   dice: z.object({ count: z.number().int().min(1).max(20), sides: z.number().int().min(2).max(100), bonus: z.number().int().min(-50).max(100) }).nullable().default(null),
   // Passierschlag (S. 237) and the strikes of a two-weapon attack (S. 238)
   passing: z.boolean().default(false),
   dual: z.enum(['first', 'second']).nullable().default(null),
})
export const allySchema = z.object({
   heroId: z.string().regex(/^[a-f0-9]{24}$/),
   key: z.string().trim().min(1).max(80),
   name: z.string().trim().min(1).max(80),
   initiative: z.number().int().min(-20).max(60),
   initiativeBase: z.number().int().min(-20).max(60),
   speed: z.number().int().min(0).max(60).nullable(),
   armor: z.number().int().min(0).max(30).default(0),
   source: z.discriminatedUnion('kind', [
      z.object({ kind: z.enum(['companion', 'summon']), id: z.string().regex(/^[a-f0-9]{24}$/) }),
      z.object({ kind: z.literal('radau') }),
   ]).nullable().default(null),
})
// The GM grants a hero or ally a Passierschlag against an opponent (S. 237)
export const passingGrantSchema = z.object({ combatantId: z.string().regex(/^[a-f0-9]{24}$/), targetId: z.string().regex(/^[a-f0-9]{24}$/) })
// The attacker's TP after a failed defense (S. 230)
export const damageRollSchema = z.object({ tp: z.number().int().min(0).max(300) })
export const preparedSchema = z.object({ name: z.string().trim().min(1).max(80), width: boardSize.width.optional(), height: boardSize.height.optional() })
// A turn-bound action besides attacks and moves (casting, loading, aiming, Flucht …); `move`: squares Flucht allows (S. 237)
export const actionSchema = z.object({
   kind: z.enum(['action', 'free']),
   label: z.string().trim().min(1).max(60),
   detail: z.string().trim().max(80).default(''),
   move: z.number().int().min(1).max(60).optional(),
})
// defense: null = no defense possible (e.g. Überrascht); sp: damage the hero's owner applied (hero targets)
export const defenseSchema = z.object({
   defense: rollRecord.nullable(),
   halved: z.boolean().default(false),
   sp: z.number().int().min(0).max(300).optional(),
})
