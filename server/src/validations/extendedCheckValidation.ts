import { z } from 'zod'

const objectId = z.string().regex(/^[0-9a-f]{24}$/i)

export const addExtendedCheckSchema = z.object({
   name: z.string().trim().min(1).max(120),
   skill: z.object({ kind: z.enum(['talent', 'spell']), key: z.string().trim().min(1).max(120) }),
   interval: z.string().trim().max(60).default(''),
   maxAttempts: z.number().int().min(1).max(50),
})
export const extendedCheckAttemptSchema = z.object({
   checkId: objectId,
   outcome: z.enum(['success', 'failure', 'critical', 'botch']),
   quality: z.number().int().min(0).max(60),
   by: z.string().trim().min(1).max(80).nullable().default(null),
})
export const removeExtendedCheckSchema = z.object({ checkId: objectId })
