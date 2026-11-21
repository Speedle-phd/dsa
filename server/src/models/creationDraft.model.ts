import mongoose, { Schema, type Document } from 'mongoose'
import type { CreationDraftData, CreationSection } from '@/utils/creation/creationLedger'

// A hero in guided creation (S. 37–59). Own lifecycle until "Finish" turns it into a Char + Stats; always queried by _id + userId.
export interface ICreationDraftDocument extends Document {
   userId: mongoose.Types.ObjectId
   data: CreationDraftData
   step: CreationSection
   createdAt: Date
   updatedAt: Date
}

const creationDraftSchema = new Schema<ICreationDraftDocument>(
   {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      // Validated with Zod (creationValidation.ts) before every save
      data: { type: Schema.Types.Mixed, required: true },
      step: { type: String, default: 'basics', maxlength: 20 },
   },
   { timestamps: true, minimize: false },
)

export const CreationDraft = mongoose.model<ICreationDraftDocument>('CreationDraft', creationDraftSchema)
