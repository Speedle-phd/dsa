import { z } from 'zod'

export const liturgyChangeSchema = z.object({
   key: z.string().trim().min(1).max(200),
   value: z.number().int().min(0).max(25).optional(),
   spendAP: z.boolean().default(true),
})
export const karmaRemoveSchema = liturgyChangeSchema.pick({ key: true, spendAP: true })
export const liturgyNotesSchema = z.object({ key: z.string().trim().min(1).max(200), notes: z.string().trim().max(2000) })
export const karmaAdjustmentSchema = z.object({ direction: z.enum(['spend', 'recover']), amount: z.number().int().positive() })
