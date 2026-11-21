import { z } from 'zod'
import { charRules, charValidationMessages } from '@/validations/charRules'

const sexEnum = z.enum(['male', 'female', 'other'])
const statusEnum = z.enum(['active', 'retired', 'deceased'])

export const createCharSchema = z.object({
   name: z
      .string()
      .trim()
      .min(charRules.name.minLength, charValidationMessages.name)
      .max(charRules.name.maxLength, charValidationMessages.name),
   title: z
      .string()
      .trim()
      .max(charRules.title.maxLength)
      .optional()
      .or(z.literal('')),
   sex: sexEnum,
   age: z.number().int().min(1).max(200),
   species: z
      .string()
      .trim()
      .min(1, charValidationMessages.species)
      .max(charRules.species.maxLength),
   placeOfOrigin: z
      .string()
      .trim()
      .min(1, charValidationMessages.placeOfOrigin)
      .max(charRules.placeOfOrigin.maxLength),
   culture: z
      .string()
      .trim()
      .min(1, charValidationMessages.culture)
      .max(charRules.culture.maxLength),
   profession: z
      .string()
      .trim()
      .min(1, charValidationMessages.profession)
      .max(charRules.profession.maxLength),
   socialStatus: z
      .string()
      .trim()
      .min(1, charValidationMessages.socialStatus)
      .max(charRules.socialStatus.maxLength),
   height: z.number().min(0).optional(),
   weight: z.number().min(0).optional(),
   build: z
      .string()
      .trim()
      .max(charRules.build.maxLength)
      .optional()
      .or(z.literal('')),
   eyeColor: z
      .string()
      .trim()
      .max(charRules.eyeColor.maxLength)
      .optional()
      .or(z.literal('')),
   hairColor: z
      .string()
      .trim()
      .max(charRules.hairColor.maxLength)
      .optional()
      .or(z.literal('')),
   appearance: z
      .string()
      .trim()
      .max(charRules.appearance.maxLength)
      .optional()
      .or(z.literal('')),
   background: z
      .string()
      .trim()
      .max(charRules.background.maxLength)
      .optional()
      .or(z.literal('')),
   biography: z
      .string()
      .trim()
      .max(charRules.biography.maxLength)
      .optional()
      .or(z.literal('')),
   familyTree: z
      .object({
         parents: z.array(z.string()).default([]),
         siblings: z.array(z.string()).default([]),
         partner: z.string().nullable().optional(),
         children: z.array(z.string()).default([]),
         notes: z
            .string()
            .trim()
            .max(charRules.familyNotes.maxLength)
            .optional()
            .or(z.literal('')),
      })
      .optional(),
   status: statusEnum.optional().default('active'),
})

export const updateCharSchema = createCharSchema.partial()
