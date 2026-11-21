import mongoose, { Schema, type Document } from 'mongoose'
import type { ExtendedAttempt, ExtendedStatus } from '@/utils/extendedCheck'

// Sammelprobe (S. 26–27) of one hero. Kept outside the stats document; always queried by statsId + userId.
export interface IExtendedCheckDocument extends Document {
   userId: mongoose.Types.ObjectId
   statsId: mongoose.Types.ObjectId
   name: string
   skill: { kind: 'talent' | 'spell'; key: string }
   interval: string
   maxAttempts: number
   attempts: ExtendedAttempt[]
   collected: number
   penalty: number
   status: ExtendedStatus
   createdAt: Date
   updatedAt: Date
}

const extendedCheckSchema = new Schema<IExtendedCheckDocument>(
   {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      statsId: { type: Schema.Types.ObjectId, ref: 'Stats', required: true, index: true },
      name: { type: String, required: true, trim: true, maxlength: 120 },
      skill: {
         kind: { type: String, enum: ['talent', 'spell'], required: true },
         key: { type: String, required: true, maxlength: 120 },
      },
      interval: { type: String, default: '', trim: true, maxlength: 60 },
      maxAttempts: { type: Number, required: true, min: 1, max: 50 },
      attempts: {
         type: [{
            outcome: { type: String, enum: ['success', 'failure', 'critical', 'botch'], required: true },
            quality: { type: Number, required: true, min: 0, max: 60 },
            by: { type: String, default: null, maxlength: 80 },
            _id: false,
         }],
         default: [],
      },
      collected: { type: Number, default: 0, min: 0 },
      penalty: { type: Number, default: 0, min: 0 },
      status: { type: String, enum: ['open', 'done', 'failed'], default: 'open' },
   },
   { timestamps: true },
)

export const ExtendedCheck = mongoose.model<IExtendedCheckDocument>('ExtendedCheck', extendedCheckSchema)
