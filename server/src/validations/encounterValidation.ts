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

export const startEncounterSchema = z.object({ width: boardSize.width.optional(), height: boardSize.height.optional() })
export const boardSchema = z.object(boardSize)
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
export const npcInitiativeSchema = z.object({ onlyMissing: z.boolean().default(true) })
export const npcTemplateSchema = z.object({ name: z.string().trim().min(1).max(80), values: npcValuesSchema })
