import mongoose, { Schema, type Document } from 'mongoose'
import type { EffectValues, Localized } from '@/utils/consumables'

// A running elixir, herb, poison or service effect of one hero (S. 270–274, 342–346, 382).
// There is no in-game clock: effects end when the player ends them (or when regeneration uses them up).
export interface IActiveEffectDocument extends Document {
   userId: mongoose.Types.ObjectId
   statsId: mongoose.Types.ObjectId
   key: string
   label: string
   quality?: number
   page: number
   duration: Localized
   values: EffectValues
   weapon?: string
   setsStatus?: string
   note?: Localized
   createdAt: Date
}

const localized = { de: { type: String, default: '' }, en: { type: String, default: '' } }

const activeEffectSchema = new Schema<IActiveEffectDocument>(
   {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      statsId: { type: Schema.Types.ObjectId, ref: 'Stats', required: true, index: true },
      key: { type: String, required: true, maxlength: 160 },
      label: { type: String, required: true, maxlength: 160 },
      quality: { type: Number, min: 0, max: 6 },
      page: { type: Number, required: true },
      duration: localized,
      values: {
         soulPower: Number,
         damageBonus: Number,
         magicalWeapon: Boolean,
         unbreakable: Boolean,
         ignoreStupor: Number,
         transitionPain: Number,
         herbHealth: Number,
         treatmentQuality: Number,
         checkPenalty: Number,
         ironWill: Number,
         ignorePain: Number,
         stuporOnEnd: Boolean,
         blocksSpells: Boolean,
         confusionOnEnd: Boolean,
         craftBonus: Number,
         spellBonus: Number,
      },
      weapon: { type: String, maxlength: 160 },
      setsStatus: { type: String, maxlength: 40 },
      note: localized,
   },
   { timestamps: true },
)

export const ActiveEffect = mongoose.model<IActiveEffectDocument>('ActiveEffect', activeEffectSchema)
