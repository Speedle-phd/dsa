import { z } from 'zod'
import { checkKinds, checkOutcomes } from '@/models/checkRequest.model'
import { isTalentKey } from '@/utils/talentCatalog'
import { objectId } from '@/validations/partyValidation'
import { attributeNames } from '@/validations/statsRules'

export const createCheckRequestSchema = z.object({
   kind: z.enum(checkKinds),
   key: z.string().trim().min(1).max(60),
   modifier: z.number().int().min(-10).max(10).default(0),
   hidden: z.boolean().default(false),
   note: z.string().trim().max(120).default(''),
   charIds: z.array(objectId).min(1).max(12),
}).refine((value) => value.kind === 'attribute' ? (attributeNames as readonly string[]).includes(value.key) : isTalentKey(value.key),
   { message: 'Unknown check.', path: ['key'] })

export const checkResultSchema = z.object({
   charId: objectId,
   result: z.object({
      success: z.boolean(),
      qs: z.number().int().min(1).max(6).nullable(),
      rolls: z.array(z.number().int().min(1).max(20)).min(1).max(3),
      outcome: z.enum(checkOutcomes),
   }),
})

export const checkAnswerSchema = z.object({ charId: objectId })
