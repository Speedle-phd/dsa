import { statsRules } from '@/validations/statsRules'
import { defaultTalents } from '@/utils/talentCatalog'
import { defaultCombatTechniques, type CombatTechniqueEntry } from '@/utils/combatRules'
import type { EntryPurchase } from '@/utils/characterEntryCatalog'
import type { MagicSettings, OwnedSpell, OwnedTrick } from '@/utils/magicCatalog'
import type { OwnedBlessing, OwnedLiturgy } from '@/utils/karmaCatalog'
import mongoose, { Schema, type Document } from 'mongoose'

const DEFAULT_ATTRIBUTE_VALUE = 0

export interface IStatsDocument extends Document {
   userId: mongoose.Types.ObjectId
   charId: mongoose.Types.ObjectId

   strength: number
   courage: number
   intuition: number
   dexterity: number
   fingerDexterity: number
   wisdom: number
   charisma: number
   constitution: number

   level: string
   experience: {
      base: number
      total: number
      gathered: number
      spent: number
      disadvantageCredit: number
   }

   health: {
      value: number
      basicValue: number
      bonusMalus: number
      additionalPurchase: number
      current: number
      max: number
   }

   mana: {
      professionValue: number
      bonusMalus: number
      traditionAttributeBonus: number
      additionalPurchase: number
      // Permanently spent AsP (staff binding, artifacts) and how many were bought back (S. 262, 352)
      permanentLoss: number
      permanentBuyback: number
      current: number
      max: number
   }

   karmaEnergy: {
      professionValue: number
      bonusMalus: number
      traditionAttributeBonus: number
      additionalPurchase: number
      // Absent on heroes saved before KaP was tracked; read as full (max).
      current?: number
      max: number
   }

   soulPower: {
      value: number
      basicValue: number
      bonusMalus: number
      max: number
   }

   toughness: {
      value: number
      basicValue: number
      bonusMalus: number
      max: number
   }

   dodge: {
      value: number
      basicValue: number
      bonusMalus: number
      max: number
   }

   fatePoints: {
      value: number
      bonusMalus: number
      current: number
      max: number
   }

   pain: number
   burden: number

   purse: {
      dukaten: number
      silbertaler: number
      heller: number
      kreuzer: number
   }

   carryingCapacity: number

   advantages: string[]
   disadvantages: string[]
   generalSpecialAbilities: string[]
   combatTechniques: CombatTechniqueEntry[]
   combatSpecialAbilities: string[]
   combatAbilityPurchases: Array<{ key: string; ap: number }>
   entryPurchases: EntryPurchase[]
   entryCredits: Array<{ key: string; ap: number }>
   combatConditions: Record<string, number>
   statuses: string[]
   triggers: string[]
   wornArmor: string | null
   combatModifiers: { initiative: number; speed: number; speedBase: number | null }

   talents: Array<{
      key: string
      value: number | null
      notes: string
   }>
   languages: string[]
   scripts: string[]
   spells: OwnedSpell[]
   magicTricks: OwnedTrick[]
   magicSettings: MagicSettings
   // Liturgies and ceremonies (S. 305–333) and blessings (S. 322–324)
   liturgies: OwnedLiturgy[]
   blessings: OwnedBlessing[]

   equipment: Array<{
      item: string
      weight: number
      amount: number
      carriedOn: string
      category: string
      description: string
      condition?: 'damaged' | 'broken'
      quality?: number
   }>

   isSorcerer: boolean
   isConsecratedPerson: boolean

   createdAt: Date
   updatedAt: Date
}

const statsSchema = new Schema<IStatsDocument>(
   {
      userId: {
         type: Schema.Types.ObjectId,
         ref: 'User',
         required: true,
         index: true,
      },
      charId: {
         type: Schema.Types.ObjectId,
         ref: 'Char',
         required: true,
         index: true,
      },

      strength: {
         type: Number,
         required: true,
         default: DEFAULT_ATTRIBUTE_VALUE,
         min: statsRules.attributeRange.minLength,
         max: statsRules.attributeRange.maxLength,
      },
      courage: {
         type: Number,
         required: true,
         default: DEFAULT_ATTRIBUTE_VALUE,
         min: statsRules.attributeRange.minLength,
         max: statsRules.attributeRange.maxLength,
      },
      intuition: {
         type: Number,
         required: true,
         default: DEFAULT_ATTRIBUTE_VALUE,
         min: statsRules.attributeRange.minLength,
         max: statsRules.attributeRange.maxLength,
      },
      dexterity: {
         type: Number,
         required: true,
         default: DEFAULT_ATTRIBUTE_VALUE,
         min: statsRules.attributeRange.minLength,
         max: statsRules.attributeRange.maxLength,
      },
      fingerDexterity: {
         type: Number,
         required: true,
         default: DEFAULT_ATTRIBUTE_VALUE,
         min: statsRules.attributeRange.minLength,
         max: statsRules.attributeRange.maxLength,
      },
      wisdom: {
         type: Number,
         required: true,
         default: DEFAULT_ATTRIBUTE_VALUE,
         min: statsRules.attributeRange.minLength,
         max: statsRules.attributeRange.maxLength,
      },
      charisma: {
         type: Number,
         required: true,
         default: DEFAULT_ATTRIBUTE_VALUE,
         min: statsRules.attributeRange.minLength,
         max: statsRules.attributeRange.maxLength,
      },
      constitution: {
         type: Number,
         required: true,
         default: DEFAULT_ATTRIBUTE_VALUE,
         min: statsRules.attributeRange.minLength,
         max: statsRules.attributeRange.maxLength,
      },

      level: {
         type: String,
         required: true,
         default: 'Unerfahren',
         trim: true,
      },

      experience: {
         base: {
            type: Number,
            required: true,
            default: 0,
         },
         total: {
            type: Number,
            required: true,
            default: 0,
         },
         gathered: {
            type: Number,
            required: true,
            default: 0,
         },
         spent: {
            type: Number,
            required: true,
            default: 0,
         },
         disadvantageCredit: { type: Number, default: 0, min: 0, max: 80 },
      },

      health: {
         value: { type: Number, required: true, default: 0 },
         basicValue: { type: Number, required: true, default: 0 },
         bonusMalus: { type: Number, required: true, default: 0 },
         additionalPurchase: {
            type: Number,
            required: true,
            default: 0,
            min: statsRules.attributeRange.minLength,
            max: statsRules.attributeRange.maxLength,
         },
         current: { type: Number, required: true, default: 0 },
         max: { type: Number, required: true, default: 0 },
      },

      mana: {
         professionValue: { type: Number, required: true, default: 0 },
         bonusMalus: { type: Number, required: true, default: 0 },
         additionalPurchase: {
            type: Number,
            required: true,
            default: 0,
            min: statsRules.attributeRange.minLength,
            max: statsRules.attributeRange.maxLength,
         },
         traditionAttributeBonus: { type: Number, required: true, default: 0 },
         permanentLoss: { type: Number, default: 0, min: 0 },
         permanentBuyback: { type: Number, default: 0, min: 0 },
         current: { type: Number, required: true, default: 0 },
         max: { type: Number, required: true, default: 0 },
      },

      karmaEnergy: {
         professionValue: { type: Number, required: true, default: 0 },
         bonusMalus: { type: Number, required: true, default: 0 },
         additionalPurchase: {
            type: Number,
            required: true,
            default: 0,
            min: statsRules.attributeRange.minLength,
            max: statsRules.attributeRange.maxLength,
         },
         traditionAttributeBonus: { type: Number, required: true, default: 0 },
         current: { type: Number, min: 0 },
         max: { type: Number, required: true, default: 0 },
      },

      soulPower: {
         value: { type: Number, required: true, default: 0 },
         basicValue: { type: Number, required: true, default: 0 },
         bonusMalus: { type: Number, required: true, default: 0 },
         max: { type: Number, required: true, default: 0 },
      },

      toughness: {
         value: { type: Number, required: true, default: 0 },
         basicValue: { type: Number, required: true, default: 0 },
         bonusMalus: { type: Number, required: true, default: 0 },
         max: { type: Number, required: true, default: 0 },
      },

      dodge: {
         value: { type: Number, required: true, default: 0 },
         basicValue: { type: Number, required: true, default: 0 },
         bonusMalus: { type: Number, required: true, default: 0 },
         max: { type: Number, required: true, default: 0 },
      },

      fatePoints: {
         value: { type: Number, required: true, default: 3 },
         bonusMalus: { type: Number, required: true, default: 0 },
         current: { type: Number, required: true, default: 3 },
         max: { type: Number, required: true, default: 3 },
      },

      pain: {
         type: Number,
         required: true,
         default: 0,
      },
      burden: {
         type: Number,
         required: true,
         default: 0,
      },

      purse: {
         dukaten: { type: Number, required: true, default: 0 },
         silbertaler: { type: Number, required: true, default: 0 },
         heller: { type: Number, required: true, default: 0 },
         kreuzer: { type: Number, required: true, default: 0 },
      },

      carryingCapacity: {
         type: Number,
         required: true,
         default: 0,
      },

      advantages: {
         type: [String],
         required: true,
         default: [],
      },
      disadvantages: {
         type: [String],
         required: true,
         default: [],
      },
      generalSpecialAbilities: {
         type: [String],
         required: true,
         default: [],
      },

      talents: {
         type: [
            {
               key: { type: String, required: true },
               value: { type: Number, default: null, min: 0 },
               notes: { type: String, default: '' },
            },
         ],
         required: true,
         default: defaultTalents,
      },
      combatTechniques: {
         type: [{ key: { type: String, required: true }, value: { type: Number, required: true, min: 6, max: 25 } }],
         default: defaultCombatTechniques,
      },
      combatSpecialAbilities: { type: [String], default: [] },
      combatAbilityPurchases: {
         type: [{ key: { type: String, required: true }, ap: { type: Number, required: true, min: 0 } }],
         default: [],
      },
      entryPurchases: {
         type: [{
            category: { type: String, enum: ['advantages', 'disadvantages', 'generalSpecialAbilities', 'languages', 'scripts'], required: true },
            key: { type: String, required: true },
            catalogKey: { type: String, required: true },
            level: { type: Number, required: true, min: 1, max: 10 },
            detail: { type: String, default: '' },
            application: { type: String, default: '' },
            potency: { type: Number },
            ap: { type: Number, required: true, min: 0 },
         }],
         default: [],
      },
      entryCredits: {
         type: [{ key: { type: String, required: true }, ap: { type: Number, required: true, min: 0, max: 80 } }],
         default: [],
      },
      combatConditions: { type: Schema.Types.Mixed, default: () => ({}) },
      statuses: { type: [String], default: [] },
      // Disadvantage triggers the GM switched on (S. 170, 173, 177)
      triggers: { type: [String], default: [] },
      wornArmor: { type: String, default: null },
      combatModifiers: {
         initiative: { type: Number, default: 0 },
         speed: { type: Number, default: 0 },
         speedBase: { type: Number, default: null },
      },
      languages: {
         type: [String],
         required: true,
         default: [],
      },
      scripts: {
         type: [String],
         required: true,
         default: [],
      },

      equipment: {
         type: [
            {
               item: { type: String, required: true },
               amount: { type: Number, required: true, default: 1 },
               weight: { type: Number, default: 0 },
               carriedOn: { type: String, required: true },
               category: { type: String, required: true },
               description: { type: String },
               // Weapon damage from a Patzer table until repaired (S. 231, 234, 243–244)
               condition: { type: String, enum: ['damaged', 'broken'] },
               // Qualitätsstufe of an alchemical elixir (S. 271, 379)
               quality: { type: Number, min: 1, max: 6 },
            },
         ],
         required: true,
         default: [],
      },

      spells: {
         type: [{
            _id: false,
            key: { type: String, required: true },
            value: { type: Number, required: true, min: 0, max: 25 },
            notes: { type: String, default: '', maxlength: 2000 },
            paidAP: { type: Number, default: 0, min: 0 },
         }],
         default: [],
      },
      magicTricks: {
         type: [{ _id: false, key: { type: String, required: true }, paidAP: { type: Number, default: 0, min: 0 } }],
         default: [],
      },
      liturgies: {
         type: [{
            _id: false,
            key: { type: String, required: true },
            value: { type: Number, required: true, min: 0, max: 25 },
            notes: { type: String, default: '', maxlength: 2000 },
            paidAP: { type: Number, default: 0, min: 0 },
         }],
         default: [],
      },
      blessings: {
         type: [{ _id: false, key: { type: String, required: true }, paidAP: { type: Number, default: 0, min: 0 } }],
         default: [],
      },
      magicSettings: {
         artifacts: { type: String, default: '', maxlength: 4000 },
         artifactItems: { type: [String], default: [] },
         guildSpell: { type: String, default: null },
         staffItem: { type: String, default: null, maxlength: 200 },
         staffActive: { type: String, default: null, maxlength: 80 },
         staffInHand: { type: Boolean, default: true },
         flyingDevice: { type: String, default: null, maxlength: 200 },
      },
      isSorcerer: {
         type: Boolean,
         required: true,
         default: false,
      },
      isConsecratedPerson: {
         type: Boolean,
         required: true,
         default: false,
      },
   },
   {
      timestamps: true,
      optimisticConcurrency: true,
      collection: 'stats',
   },
)

statsSchema.index({ userId: 1, charId: 1 }, { unique: true })

statsSchema.set('toJSON', {
   transform: (_doc: unknown, ret: any) => {
      delete ret.__v
      return ret
   },
})

export const Stats = mongoose.model<IStatsDocument>('Stats', statsSchema)
