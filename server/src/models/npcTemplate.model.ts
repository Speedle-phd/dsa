import mongoose, { Schema, type Document } from 'mongoose'
import type { NpcValues } from './encounter.model'

export interface INpcTemplateDocument extends Document {
   userId: mongoose.Types.ObjectId
   name: string
   values: Omit<NpcValues, 'health'>
   createdAt: Date
   updatedAt: Date
}

// Opponents a GM reuses across fights ("Ork-Krieger", "Wegelagerer"). The core rules have no humanoid stat blocks.
const npcTemplateSchema = new Schema<INpcTemplateDocument>(
   {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      name: { type: String, required: true, trim: true, maxlength: 80 },
      values: {
         maxHealth: { type: Number, required: true, min: 1 },
         armor: { type: Number, default: 0 },
         initiativeBase: { type: Number, default: 10 },
         attack: { type: Number, default: null },
         parry: { type: Number, default: null },
         defense: { type: Number, default: null },
         dodge: { type: Number, default: null },
         damage: { type: String, default: '' },
         speed: { type: Number, default: null },
         notes: { type: String, default: '' },
      },
   },
   { timestamps: true },
)

export const NpcTemplate = mongoose.model<INpcTemplateDocument>('NpcTemplate', npcTemplateSchema)
