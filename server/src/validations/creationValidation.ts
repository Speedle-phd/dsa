import { z } from 'zod'
import { entryCategories } from '@/utils/characterEntryCatalog'
import { attributeKeys, creationSections } from '@/utils/creation/creationLedger'
import { experienceLevels } from '@/utils/creation/experienceCaps'
import { speciesKeys } from '@/utils/creation/speciesCatalog'

const attribute = z.enum(attributeKeys as [string, ...string[]])
const value = z.number().int().min(0).max(25)
const text = (max: number) => z.string().trim().max(max)

export const creationDraftSchema = z.object({
   level: z.enum(experienceLevels),
   species: z.enum(speciesKeys).nullable(),
   speciesChoice: attribute.nullable(),
   culture: text(60).nullable(),
   culturePackage: z.boolean(),
   language: text(60).nullable(),
   script: text(60).nullable(),
   localKnowledge: text(80),
   attributes: z.object(Object.fromEntries(attributeKeys.map((key) => [key, value])) as Record<string, typeof value>),
   profession: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('none') }),
      z.object({ kind: z.literal('custom'), name: text(80) }),
      z.object({ kind: z.literal('package'), key: text(80).min(1), variant: text(80).nullable(), choices: z.array(z.array(text(60)).max(5)).max(5), application: text(80),
         tricks: z.array(text(60)).max(5).default([]) }),
   ]),
   entries: z.array(z.object({
      category: z.enum(entryCategories), catalogKey: text(100).min(1), level: z.number().int().min(1).max(10),
      detail: text(100), application: text(100), potency: z.number().int().min(1).max(100).optional(),
   })).max(200),
   talents: z.record(text(60), value),
   techniques: z.record(text(60), value),
   spells: z.record(text(80), value),
   tricks: z.array(text(80)).max(50),
   liturgies: z.record(text(80), value).default({}),
   blessings: z.array(text(60)).max(20).default([]),
   combatAbilities: z.array(text(80)).max(60).default([]),
   approvals: z.array(text(160)).max(200),
   name: text(100),
   sex: z.enum(['male', 'female', 'other']),
   age: z.number().int().min(1).max(500).nullable(),
   background: text(4000),
})

export const createCreationDraftSchema = z.object({ level: z.enum(experienceLevels).default('Erfahren'), archetype: text(60).optional() })
export const updateCreationDraftSchema = z.object({ data: creationDraftSchema, step: z.enum(creationSections) })
