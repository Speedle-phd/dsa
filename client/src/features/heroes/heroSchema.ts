import { z } from 'zod'
import type { HeroInput } from './heroApi'
import type { Language } from '@/locales/languageStore'
import { t } from '@/locales/translation'

export const heroFormSchema = (language: Language) => {
   const optionalNumber = z
      .string()
      .refine(
         (value) =>
            value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0),
         t('Enter a non-negative number', language),
      )

   return z
      .object({
      name: z
         .string()
         .trim()
         .min(2, t('Name must have at least 2 characters', language))
         .max(100, t('Name must have 100 characters or fewer', language)),
      title: z
         .string()
         .trim()
         .max(80, t('Title must have 80 characters or fewer', language)),
      sex: z.enum(['male', 'female', 'other']),
      age: z
         .number()
         .int(t('Age must be a whole number', language))
         .min(1, t('Age must be at least 1', language))
         .max(200, t('Age must be 200 or fewer', language)),
      species: z
         .string()
         .trim()
         .min(1, t('Species is required', language))
         .max(80, t('Species must have 80 characters or fewer', language)),
      placeOfOrigin: z
         .string()
         .trim()
         .min(1, t('Place of origin is required', language))
         .max(80, t('Place of origin must have 80 characters or fewer', language)),
      culture: z
         .string()
         .trim()
         .min(1, t('Culture is required', language))
         .max(80, t('Culture must have 80 characters or fewer', language)),
      profession: z
         .string()
         .trim()
         .min(1, t('Profession is required', language))
         .max(80, t('Profession must have 80 characters or fewer', language)),
      socialStatus: z
         .string()
         .trim()
         .min(1, t('Social status is required', language))
         .max(60, t('Social status must have 60 characters or fewer', language)),
      height: optionalNumber,
      weight: optionalNumber,
      build: z
         .string()
         .trim()
         .max(60, t('Build must have 60 characters or fewer', language)),
      eyeColor: z
         .string()
         .trim()
         .max(40, t('Eye color must have 40 characters or fewer', language)),
      hairColor: z
         .string()
         .trim()
         .max(40, t('Hair color must have 40 characters or fewer', language)),
      appearance: z
         .string()
         .trim()
         .max(1000, t('Appearance must have 1000 characters or fewer', language)),
      background: z
         .string()
         .trim()
         .max(400, t('Background must have 400 characters or fewer', language)),
      biography: z
         .string()
         .trim()
         .max(2000, t('Biography must have 2000 characters or fewer', language)),
      status: z.enum(['active', 'retired', 'deceased']),
   })
   .and(
      z.object({
         parents: z.string(),
         siblings: z.string(),
         partner: z.string().trim(),
         children: z.string(),
         familyNotes: z
            .string()
            .trim()
            .max(500, t('Family notes must have 500 characters or fewer', language)),
      }),
      )
}

export type HeroFormValues = Omit<HeroInput, 'height' | 'weight' | 'familyTree'> & {
   height: string
   weight: string
   parents: string
   siblings: string
   partner: string
   children: string
   familyNotes: string
}

// Parts of the hero form that can be edited on their own (overview edit buttons)
export const heroFormSections = ['identity', 'family', 'appearance', 'chronicle'] as const
export type HeroFormSection = (typeof heroFormSections)[number]
