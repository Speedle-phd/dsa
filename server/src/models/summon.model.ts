import mongoose, { Schema, type Document } from 'mongoose'
import type { SummonImprovement, SummoningRitual } from '@/utils/bestiaryCatalog'

// A demon or elemental summoned by the hero (S. 262–265). Kept outside the stats document; always queried by statsId + userId.
export interface ISummonDocument extends Document {
   userId: mongoose.Types.ObjectId
   statsId: mongoose.Types.ObjectId
   creature: string
   ritual: SummoningRitual
   quality: number
   improvements: SummonImprovement[]
   services: number
   // A service that used all services (Kampf against several enemies, Wache) and is still running
   task: string | null
   // Current LeP in a fight; null = full (S. 354)
   health: number | null
   createdAt: Date
   updatedAt: Date
}

const summonSchema = new Schema<ISummonDocument>(
   {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      statsId: { type: Schema.Types.ObjectId, ref: 'Stats', required: true, index: true },
      creature: { type: String, required: true, maxlength: 60 },
      ritual: { type: String, required: true, maxlength: 60 },
      quality: { type: Number, required: true, min: 1, max: 6 },
      improvements: { type: [String], default: [] },
      services: { type: Number, required: true, min: 0 },
      task: { type: String, default: null },
      health: { type: Number, default: null, min: 0 },
   },
   { timestamps: true },
)

export const Summon = mongoose.model<ISummonDocument>('Summon', summonSchema)
