import mongoose, { Schema, type Document } from 'mongoose'
import type { ArtifactKind, ArtifactRecharge } from '@/utils/artifacts'

// A magical artifact of one hero (S. 266–270): found or made with ARCANOVI / ZAUBERKLINGE. Queried by statsId + userId.
export interface IArtifactDocument extends Document {
   userId: mongoose.Types.ObjectId
   statsId: mongoose.Types.ObjectId
   name: string
   item: string | null
   kind: ArtifactKind
   spell: string
   skillPoints: number
   duration: string
   charges: { current: number; max: number }
   recharge: ArtifactRecharge | null
   trigger: string
   permanentAsp: number
   sideEffect: string
   notes: string
   origin: 'found' | 'created'
   createdAt: Date
   updatedAt: Date
}

const artifactSchema = new Schema<IArtifactDocument>(
   {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      statsId: { type: Schema.Types.ObjectId, ref: 'Stats', required: true, index: true },
      name: { type: String, required: true, trim: true, maxlength: 120 },
      item: { type: String, default: null, maxlength: 200 },
      kind: { type: String, enum: ['storage', 'recharging', 'permanent', 'weapon'], required: true },
      spell: { type: String, default: '', trim: true, maxlength: 120 },
      skillPoints: { type: Number, default: 0, min: 0, max: 40 },
      duration: { type: String, default: '', trim: true, maxlength: 120 },
      charges: {
         current: { type: Number, default: 0, min: 0, max: 7 },
         max: { type: Number, default: 0, min: 0, max: 7 },
      },
      recharge: { type: String, enum: ['month', 'week', 'day', null], default: null },
      trigger: { type: String, default: '', trim: true, maxlength: 200 },
      permanentAsp: { type: Number, default: 0, min: 0 },
      sideEffect: { type: String, default: '', trim: true, maxlength: 400 },
      notes: { type: String, default: '', trim: true, maxlength: 2000 },
      origin: { type: String, enum: ['found', 'created'], default: 'found' },
   },
   { timestamps: true },
)

export const Artifact = mongoose.model<IArtifactDocument>('Artifact', artifactSchema)
