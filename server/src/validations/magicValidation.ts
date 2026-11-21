import { z } from 'zod'

export const spellChangeSchema = z.object({
   key: z.string().trim().min(1).max(200),
   value: z.number().int().min(0).max(25).optional(),
   spendAP: z.boolean().default(true),
})
export const magicRemoveSchema = spellChangeSchema.pick({ key: true, spendAP: true })
export const spellNotesSchema = z.object({
   key: z.string().trim().min(1).max(200),
   notes: z.string().trim().max(2000),
})
export const magicSettingsSchema = z.object({
   artifacts: z.string().trim().max(4000).optional(),
   artifactItems: z.array(z.string().trim().min(1).max(200)).max(100).optional(),
   guildSpell: z.string().trim().min(1).max(200).nullable().optional(),
   staffItem: z.string().trim().min(1).max(200).nullable().optional(),
   staffActive: z.string().trim().min(1).max(80).nullable().optional(),
   staffInHand: z.boolean().optional(),
   flyingDevice: z.string().trim().min(1).max(200).nullable().optional(),
})
// source: DSA5 Regelwerk, S. 262, 352 (record permanently spent AsP, or buy them back for 2 AP each)
export const permanentManaSchema = z.object({
   mode: z.enum(['lose', 'buy-back', 'correct']),
   amount: z.number().int().positive().max(200),
   spendAP: z.boolean().default(true),
})
export const manaAdjustmentSchema = z.object({
   direction: z.enum(['spend', 'recover']),
   amount: z.number().int().positive(),
   // W20 for Lästige Mindergeister (S. 173), rolled by the client with the 3D dice
   spiritRoll: z.number().int().min(1).max(20).optional(),
})
