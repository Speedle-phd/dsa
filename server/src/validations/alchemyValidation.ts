import { z } from 'zod'

// source: DSA5 Regelwerk, S. 270–272 (recipe, ingredient level 1–6, 0/4/8 AsP, result of the Alchimie check)
export const brewElixirSchema = z.object({
   elixir: z.string().trim().min(1).max(80),
   level: z.number().int().min(1).max(6),
   asp: z.union([z.literal(0), z.literal(4), z.literal(8)]),
   success: z.boolean(),
   quality: z.number().int().min(0).max(6),
   placement: z.string().trim().min(1).max(200),
})
