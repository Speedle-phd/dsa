import { z } from 'zod'

const objectId = z.string().regex(/^[0-9a-f]{24}$/i)
const text = (max: number) => z.string().trim().max(max)

// A found artifact or the GM's description of one (S. 267–270).
export const artifactFieldsSchema = z.object({
   name: z.string().trim().min(1).max(120),
   item: z.string().trim().min(1).max(200).nullable().default(null),
   kind: z.enum(['storage', 'recharging', 'permanent', 'weapon']),
   spell: text(120).default(''),
   skillPoints: z.number().int().min(0).max(40).default(0),
   duration: text(120).default(''),
   charges: z.number().int().min(0).max(7).default(0),
   recharge: z.enum(['month', 'week', 'day']).nullable().default(null),
   trigger: text(200).default(''),
   sideEffect: text(400).default(''),
   notes: text(2000).default(''),
})
export const updateArtifactSchema = artifactFieldsSchema.partial().extend({ artifactId: objectId })
export const artifactActionSchema = z.object({ artifactId: objectId, action: z.enum(['use', 'recharge', 'remove']) })

// ARCANOVI result: the server recomputes AsP and permanent AsP from these inputs (S. 267–268).
export const createArtifactSchema = z.object({
   name: z.string().trim().min(1).max(120),
   item: z.string().trim().min(1).max(200).nullable().default(null),
   spell: z.string().trim().min(1).max(120),
   spellCost: z.number().int().min(1).max(200),
   skillPoints: z.number().int().min(0).max(40),
   duration: text(120).default(''),
   charges: z.number().int().min(1).max(7),
   recharge: z.enum(['month', 'week', 'day']).nullable().default(null),
   iron: z.boolean().default(false),
   materialSaved: z.number().int().min(0).max(50).default(0),
   materialBonus: z.boolean().default(false),
   trigger: text(200).default(''),
   sideEffect: text(400).default(''),
})
