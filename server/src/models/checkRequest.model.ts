import mongoose, { Schema, type Document, type Types } from 'mongoose'

// Outcomes of a talent check (3W20, S. 23) and of an attribute check (W20 with confirmation, S. 20)
export const checkOutcomes = ['success', 'failure', 'critical', 'spectacular', 'botch', 'disaster', 'criticalUnconfirmed', 'botchAverted'] as const
export type CheckOutcome = (typeof checkOutcomes)[number]
export const checkKinds = ['attribute', 'talent'] as const
export type CheckKind = (typeof checkKinds)[number]

export type CheckResult = { success: boolean; qs: number | null; rolls: number[]; outcome: CheckOutcome }
export type CheckTarget = { _id: Types.ObjectId; charId: Types.ObjectId; userId: Types.ObjectId; state: 'open' | 'rolled' | 'declined'; result: CheckResult | null; answeredAt: Date | null }

export interface ICheckRequestDocument extends Document {
   partyId: Types.ObjectId
   gmUserId: Types.ObjectId
   kind: CheckKind
   key: string
   modifier: number
   // Results only for the GM and the hero's own player
   hidden: boolean
   note: string
   targets: Types.DocumentArray<CheckTarget>
   status: 'open' | 'closed'
   createdAt: Date
   updatedAt: Date
}

const resultSchema = new Schema<CheckResult>({
   success: { type: Boolean, required: true },
   qs: { type: Number, default: null },
   rolls: { type: [Number], default: [] },
   outcome: { type: String, enum: checkOutcomes, required: true },
}, { _id: false })

const targetSchema = new Schema<CheckTarget>({
   charId: { type: Schema.Types.ObjectId, ref: 'Char', required: true },
   userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
   state: { type: String, enum: ['open', 'rolled', 'declined'], default: 'open' },
   result: { type: resultSchema, default: null },
   answeredAt: { type: Date, default: null },
})

// A check the GM asks of chosen heroes (user request, Nov 2026); results are rolled in the player's browser like every roll
const checkRequestSchema = new Schema<ICheckRequestDocument>(
   {
      partyId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
      gmUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      kind: { type: String, enum: checkKinds, required: true },
      key: { type: String, required: true },
      modifier: { type: Number, default: 0 },
      hidden: { type: Boolean, default: false },
      note: { type: String, default: '', maxlength: 120 },
      targets: { type: [targetSchema], default: [] },
      status: { type: String, enum: ['open', 'closed'], default: 'open' },
   },
   { timestamps: true },
)

checkRequestSchema.index({ partyId: 1, createdAt: -1 })
// Requests belong to one session: MongoDB removes them a day later (app choice)
checkRequestSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 })

export const CheckRequest = mongoose.model<ICheckRequestDocument>('CheckRequest', checkRequestSchema)
