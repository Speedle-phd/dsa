import { z } from 'zod'

const objectId = z.string().regex(/^[0-9a-f]{24}$/i)

export const consumeItemSchema = z.object({
   index: z.number().int().min(0),
   item: z.string().trim().min(1).max(160),
   // Final die values (a W3 already read from the W6) for Heiltrank / Zaubertrank.
   rolls: z.array(z.number().int().min(1).max(6)).max(2).default([]),
   weapon: z.string().trim().min(1).max(160).optional(),
   // Antidot: the player confirms the poison's level is at most the antidote's QS (S. 272).
   cure: z.boolean().default(false),
   // Use the item even though a stronger effect of the same kind is running (S. 272).
   confirmWeaker: z.boolean().default(false),
})
export const abilityEffectSchema = z.object({
   ability: z.enum(['Eiserner Wille', 'Schmerzen unterdrücken', 'Aura verbergen', 'Melodie der Kunstfertigkeit', 'Zaubermelodie', 'Zauberklinge Geisterspeer']),
   quality: z.number().int().min(1).max(6).optional(),
   weapon: z.string().trim().min(1).max(160).optional(),
})
export const activeEffectActionSchema = z.object({
   effectId: objectId,
   action: z.enum(['end', 'end-transition']),
})
