import mongoose, { Schema, type Document } from 'mongoose'
import type { OwnedCompanion } from '@/utils/companionRules'

// Animal companion or familiar of one hero (S. 278–280, 360–362). Kept outside the stats document; always queried by statsId + userId.
export interface ICompanionDocument extends Document, Omit<OwnedCompanion, '_id'> {
   userId: mongoose.Types.ObjectId
   statsId: mongoose.Types.ObjectId
   createdAt: Date
   updatedAt: Date
}

const companionSchema = new Schema<ICompanionDocument>(
   {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      statsId: { type: Schema.Types.ObjectId, ref: 'Stats', required: true, index: true },
      name: { type: String, required: true, maxlength: 100 },
      species: { type: String, required: true, maxlength: 100 },
      familiar: { type: Boolean, default: false },
      attributes: {
         courage: { type: Number, required: true }, wisdom: { type: Number, required: true },
         intuition: { type: Number, required: true }, charisma: { type: Number, required: true },
         fingerDexterity: { type: Number, required: true }, dexterity: { type: Number, required: true },
         constitution: { type: Number, required: true }, strength: { type: Number, required: true },
      },
      health: { max: { type: Number, required: true, min: 1 }, current: { type: Number, required: true, min: 0 } },
      mana: { base: { type: Number, default: 0, min: 0 }, current: { type: Number, default: 0, min: 0 } },
      initiative: { type: Number, required: true },
      defense: { type: Number, required: true },
      soulPower: { type: Number, default: 0 },
      toughness: { type: Number, default: 0 },
      speed: { type: String, default: '', maxlength: 20 },
      armor: { type: Number, default: 0, min: 0 },
      actions: { type: Number, default: 1, min: 1 },
      attacks: {
         type: [{ _id: false, name: { type: String, required: true, maxlength: 60 }, attack: { type: Number, required: true },
            damage: { type: String, default: '', maxlength: 30 }, reach: { type: String, default: '', maxlength: 30 } }],
         default: [],
      },
      talents: {
         type: [{ _id: false, key: { type: String, required: true }, value: { type: Number, default: null }, note: { type: String, default: '', maxlength: 200 } }],
         default: [],
      },
      traits: { type: String, default: '', maxlength: 2000 },
      abilities: { type: String, default: '', maxlength: 2000 },
      special: { type: String, default: '', maxlength: 2000 },
      tricks: { type: [{ _id: false, key: { type: String, required: true }, paidAP: { type: Number, default: 0, min: 0 } }], default: [] },
      experience: { total: { type: Number, default: 0, min: 0 }, spent: { type: Number, default: 0, min: 0 } },
      loyalty: { type: Number, default: null },
      notes: { type: String, default: '', maxlength: 4000 },
   },
   { timestamps: true },
)

export const Companion = mongoose.model<ICompanionDocument>('Companion', companionSchema)
