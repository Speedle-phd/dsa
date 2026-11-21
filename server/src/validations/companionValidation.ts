import { z } from 'zod'
import { companionSpecies, companionTalentProbes } from '@/utils/companionCatalog'
import { customSpecies } from '@/utils/companionRules'

const id = z.string().trim().min(1).max(64)
const text = (max: number) => z.string().trim().max(max)
const attribute = z.number().int().min(0).max(40)

export const companionAddSchema = z.object({
   species: z.enum([customSpecies, ...companionSpecies.map((entry) => entry.key)]),
   name: text(100).min(1),
   familiar: z.boolean().default(false),
})
export const companionUpdateSchema = z.object({
   companionId: id,
   name: text(100).min(1),
   attributes: z.object({
      courage: attribute, wisdom: attribute, intuition: attribute, charisma: attribute,
      fingerDexterity: attribute, dexterity: attribute, constitution: attribute, strength: attribute,
   }),
   healthMax: z.number().int().min(1).max(999),
   manaBase: z.number().int().min(0).max(999),
   initiative: z.number().int().min(0).max(50),
   defense: z.number().int().min(0).max(30),
   soulPower: z.number().int().min(-10).max(20),
   toughness: z.number().int().min(-10).max(20),
   speed: text(20),
   armor: z.number().int().min(0).max(20),
   actions: z.number().int().min(1).max(5),
   attacks: z.array(z.object({
      name: text(60).min(1), attack: z.number().int().min(0).max(30), damage: text(30), reach: text(30),
   })).max(10),
   talents: z.array(z.object({
      key: z.enum(Object.keys(companionTalentProbes) as [string, ...string[]]),
      value: z.number().int().min(0).max(25).nullable(),
      note: text(200),
   })).max(10).refine((entries) => new Set(entries.map((entry) => entry.key)).size === entries.length, 'Each talent only once.'),
   traits: text(2000),
   abilities: text(2000),
   special: text(2000),
   notes: text(4000),
   experienceTotal: z.number().int().min(0).max(100000),
   loyalty: z.number().int().min(-999).max(999).nullable(),
})
export const companionResourcesSchema = z.object({
   companionId: id,
   health: z.number().int().min(0).max(999).optional(),
   mana: z.number().int().min(0).max(999).optional(),
})
export const companionTrickSchema = z.object({ companionId: id, key: text(100).min(1), spendAP: z.boolean().default(true) })
export const companionRemoveSchema = z.object({ companionId: id })
