import { z } from 'zod'
import { improvementKeys, serviceKeys } from '@/utils/summonRules'

const objectId = z.string().regex(/^[0-9a-f]{24}$/i)

export const addSummonSchema = z.object({
   creature: z.string().trim().min(1).max(60),
   ritual: z.enum(['Invocatio Minor', 'Invocatio Maior', 'Elementarer Diener', 'Dschinnenruf']),
   quality: z.number().int().min(1).max(6),
   improvements: z.array(z.enum(improvementKeys)).max(improvementKeys.length).default([]),
})
export const summonActionSchema = z.discriminatedUnion('action', [
   z.object({ action: z.literal('service'), summonId: objectId, service: z.enum(serviceKeys) }),
   z.object({ action: z.literal('sunrise'), summonId: objectId }),
   z.object({ action: z.literal('dismiss'), summonId: objectId }),
   z.object({ action: z.literal('join-fight'), summonId: objectId, service: z.enum(['fight', 'fightMany']) }),
   z.object({ action: z.literal('fight-over'), summonId: objectId }),
   z.object({ action: z.literal('health'), summonId: objectId, current: z.number().int().min(0).max(999) }),
])
