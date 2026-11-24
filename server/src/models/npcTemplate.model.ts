import mongoose, { Schema, type Document } from 'mongoose'
import type { NpcValues } from './encounter.model'

export const npcSources = ['manual', 'import', 'generator', 'bestiary'] as const
export type NpcSource = (typeof npcSources)[number]

export interface INpcTemplateDocument extends Document {
   userId: mongoose.Types.ObjectId
   name: string
   values: Omit<NpcValues, 'health'>
   // How the NPC was made (library filter); tags are the GM's own words ("Räuber", "Kapitel 2")
   source: NpcSource
   tags: string[]
   createdAt: Date
   updatedAt: Date
}

// The GM's NPC library across parties (user request, Nov 2026): reused in fights and prepared fights.
// The core rules have no humanoid stat blocks; GMs paste them from their adventures, generate or build them.
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
         // Validated by npcSheetSchema before every write
         sheet: { type: Schema.Types.Mixed, default: null },
      },
      source: { type: String, enum: npcSources, default: 'manual' },
      tags: { type: [String], default: [] },
   },
   { timestamps: true },
)

export const NpcTemplate = mongoose.model<INpcTemplateDocument>('NpcTemplate', npcTemplateSchema)
