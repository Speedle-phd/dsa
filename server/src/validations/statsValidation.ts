import { z } from 'zod'
import { attributeNames, statsRules } from './statsRules'

const nonEmptyString = z.string().trim().min(1)

const resourceSchema = z.object({
   value: z.number().min(0).default(0),
   bonusMalus: z.number().default(0),
   additionalPurchase: z.number().default(0),
   max: z.number().min(0).default(0),
})

const attributeSchema = z
   .number()
   .min(
      statsRules.attributeRange.minLength,
      `Attribute must be at least ${statsRules.attributeRange.minLength}`,
   )
   .max(
      statsRules.attributeRange.maxLength,
      `Attribute must be at most ${statsRules.attributeRange.maxLength}`,
   )
   .optional()

const updateResourceSchema = z.object({
   value: z.number().min(0).optional(),
   bonusMalus: z.number().default(0).optional(),
   additionalPurchase: z.number().min(0).optional(),
   basicValue: z.number().min(0).optional(),
   professionValue: z.number().min(0).optional(),
   traditionAttributeBonus: z.number().min(0).optional(),
   current: z.number().min(0).optional(),
})

export const levelUpAttributeSchema = z.object({
   attribute: z.enum(attributeNames),
   value: z.number().int().min(0).max(25).optional(),
   spendAP: z.boolean().default(true),
})

const staticResourceSchema = z.object({
   value: z.number().default(0),
   bonusMalus: z.number().default(0),
   additionalPurchase: z.number().default(0),
   max: z.number().min(0).default(0),
})
const staticMagicResourceSchema = z.object({
   professionValue: z.number().min(0).default(0),
   bonusMalus: z.number().default(0),
   additionalPurchase: z.number().min(0).default(0),
   traditionAttributeBonus: z.number().min(0).default(0),
   max: z.number().min(0).default(0),
})
const staticUpdateResourceSchema = z.object({
   value: z.number().optional(),
   bonusMalus: z.number().optional(),
})
const staticDerivedResourceSchema = z.object({
   bonusMalus: z.number().optional(),
   traditionAttributeBonus: z.number().min(0).optional(),
   additionalPurchase: z.number().min(0).optional(),
})

const purseSchema = z.object({
   dukaten: z.number().min(0).default(0),
   silbertaler: z.number().min(0).default(0),
   heller: z.number().min(0).default(0),
   kreuzer: z.number().min(0).default(0),
})

const experienceSchema = z.object({
   gathered: z.number().min(0).default(0),
   spent: z.number().min(0).default(0),
})

const equipmentSchema = z.object({
   item: nonEmptyString,
   weight: z.number().min(0),
   amount: z.number().min(1),
   carriedOn: nonEmptyString,
   category: nonEmptyString,
   description: z.string().optional(),
   condition: z.enum(['damaged', 'broken']).optional(),
   quality: z.number().int().min(1).max(6).optional(),
})
const equipmentArraySchema = z.array(equipmentSchema)

export const purchaseEquipmentSchema = z.object({
   item: nonEmptyString,
   category: nonEmptyString,
   unitWeight: z.number().min(0),
   amount: z.number().int().min(1),
   carriedOn: nonEmptyString,
   unitPriceSilbertaler: z.number().min(0),
   description: z.string().optional(),
   quality: z.number().int().min(1).max(6).optional(),
   contents: z.array(z.object({
      item: nonEmptyString,
      category: nonEmptyString,
      unitWeight: z.number().min(0),
      amount: z.number().int().min(1).max(100),
      description: z.string().max(1000).optional(),
   })).max(40).optional(),
})

const coinAmount = z.number().int().min(0).default(0)

export const adjustPurseSchema = z.object({
   direction: z.enum(['receive', 'lose']),
   coins: z.object({
      dukaten: coinAmount,
      silbertaler: coinAmount,
      heller: coinAmount,
      kreuzer: coinAmount,
   }),
})

export const createStatsSchema = z.object({
   charId: z.string().min(1, 'Character id is required'),
   strength: attributeSchema,
   courage: attributeSchema,
   intuition: attributeSchema,
   dexterity: attributeSchema,
   fingerDexterity: attributeSchema,
   wisdom: attributeSchema,
   charisma: attributeSchema,
   constitution: attributeSchema,
   level: z.string().trim().optional(),
   experience: experienceSchema.optional(),
   health: resourceSchema.optional(),
   mana: staticMagicResourceSchema.optional(),
   karmaEnergy: staticMagicResourceSchema.optional(),
   soulPower: staticResourceSchema.optional(),
   toughness: staticResourceSchema.optional(),
   fatePoints: resourceSchema.optional(),
   burden: z.number().min(0).optional(),
   purse: purseSchema.optional(),
   equipment: equipmentArraySchema.optional(),
   advantages: z.array(z.string()).default([]).optional(),
   disadvantages: z.array(z.string()).default([]).optional(),
   generalSpecialAbilities: z.array(z.string()).default([]).optional(),
})

export const updateStatsSchema = z.object({
   spendAP: z.boolean().optional(),
   strength: attributeSchema,
   courage: attributeSchema,
   intuition: attributeSchema,
   dexterity: attributeSchema,
   fingerDexterity: attributeSchema,
   wisdom: attributeSchema,
   charisma: attributeSchema,
   constitution: attributeSchema,
   level: z.string().trim().optional(),
   experience: experienceSchema.optional(),
   health: updateResourceSchema
      .pick({
         value: true,
         bonusMalus: true,
         additionalPurchase: true,
         current: true,
      })
      .extend({ current: z.number().int().optional() })
      .optional(),
   mana: updateResourceSchema
      .pick({
         bonusMalus: true,
         additionalPurchase: true,
         traditionAttributeBonus: true,
         current: true,
      })
      .optional(),
   karmaEnergy: staticDerivedResourceSchema.extend({ current: z.number().int().min(0).optional() }).optional(),
   soulPower: staticUpdateResourceSchema.optional(),
   toughness: staticUpdateResourceSchema.optional(),
   dodge: z
      .object({
         bonusMalus: z.number().optional(),
      })
      .optional(),
   fatePoints: z
      .object({
         value: z.number().min(0).optional(),
         bonusMalus: z.number().optional(),
         current: z.number().min(0).optional(),
      })
      .optional(),
   purse: purseSchema.optional(),
   advantages: z.array(z.string()).optional(),
   disadvantages: z.array(z.string()).optional(),
   generalSpecialAbilities: z.array(z.string()).optional(),
   equipment: z.array(equipmentSchema).optional(),
   isSorcerer: z.boolean().optional(),
   isConsecratedPerson: z.boolean().optional(),
})

export const updateAdvantagesAbilitiesSchema = updateStatsSchema.pick({
   advantages: true,
   disadvantages: true,
   generalSpecialAbilities: true,
})

export const updateExperienceSchema = z.object({
   gathered: z.number(),
   level: z.string().trim().optional(),
})

export const vitalResourcesTypeSchema = z.object({
   value: z.enum(['health', 'mana', 'karmaEnergy']),
   target: z.number().int().min(0).max(25).optional(),
   spendAP: z.boolean().default(true),
})

const talentEntrySchema = z.object({
   key: nonEmptyString,
   value: z.number().int().min(0),
   notes: z.string().max(200).default(''),
})

export const updateTalentsSchema = z.object({
   talents: z.array(talentEntrySchema),
})

export const levelUpTalentSchema = z.object({
   talentKey: nonEmptyString,
   value: z.number().int().min(0).max(25).optional(),
   spendAP: z.boolean().default(true),
})

export const updateLanguagesScriptsSchema = z.object({
   languages: z.array(z.string().trim()),
   scripts: z.array(z.string().trim()),
})

// source: DSA5 Regelwerk, S. 339–340 (one 1W6 per regenerating energy)
const regenerationDie = z.number().int().min(1).max(6).optional()
export const regenerationSchema = z.object({
   rolls: z.object({ health: regenerationDie, mana: regenerationDie, karmaEnergy: regenerationDie })
      .refine((rolls) => Object.values(rolls).some((roll) => roll !== undefined), 'Roll at least one energy.'),
   campsite: z.enum(['bad', 'normal', 'good']),
   interruption: z.enum(['none', 'short', 'long']),
   environment: z.enum(['normal', 'bad', 'terrible']),
   poisonedOrSick: z.boolean(),
   ironStone: z.number().min(0).max(1000),
   treatmentQuality: z.number().int().min(0).max(6),
   otherModifier: z.number().int().min(-10).max(10),
   reducedHealth: z.boolean(),
})
