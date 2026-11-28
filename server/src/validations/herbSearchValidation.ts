import { z } from 'zod'
import { searchLandscapes } from '@/utils/herbs/herbTypes'

const plantName = z.string().trim().min(1).max(80)

// The result of a herb search the player rolled (AdK S. 276–278); the server computes the finds from it
export const herbSearchSchema = z.object({
   kind: z.enum(['specific', 'general']),
   landscape: z.enum(searchLandscapes),
   weather: z.enum(['clear', 'rain', 'storm', 'hurricane']).default('clear'),
   plant: plantName.optional(),
   plantCheck: z.object({ success: z.boolean(), quality: z.number().int().min(0).max(6) }),
   use: z.enum(['improve', 'yield']),
   hoursTaken: z.number().int().min(1).max(24).optional(),
   sensesSuccess: z.boolean(),
   // A hero without a party picks the species of a general search itself
   picks: z.array(plantName).max(6).optional(),
}).refine((value) => value.kind === 'general' || value.plant !== undefined, { message: 'Choose the plant you search for.' })

export const herbFindAssignSchema = z.object({ picks: z.array(plantName).min(1).max(6) })

// Haltbarmachung of a raw stack (AdK S. 284–286): by a Pflanzenkunde check, or by plant part and method
export const preserveHerbSchema = z.discriminatedUnion('method', [
   z.object({ method: z.literal('check'), index: z.number().int().min(0), item: plantName,
      check: z.object({ success: z.boolean(), quality: z.number().int().min(0).max(6), critical: z.boolean().default(false) }) }),
   z.object({ method: z.literal('part'), index: z.number().int().min(0), item: plantName, part: z.string().max(30), methodKey: z.string().max(30) }),
])

// Making a plant recipe (AdK S. 144): one Pflanzenkunde check for the whole batch
export const craftHerbalSchema = z.object({ recipe: z.string().trim().min(1).max(80), amount: z.number().int().min(1).max(50), talent: z.string().max(40).optional(),
   check: z.object({ success: z.boolean() }) })
