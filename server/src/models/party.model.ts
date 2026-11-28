import mongoose, { Schema, type Document } from 'mongoose'
import { bookRuleKeys, type BookRules } from '@/utils/bookRules'

export const partyStatuses = ['active', 'archived'] as const
export const memberStates = ['pending', 'accepted'] as const
// What the other players see of a hero (the GM always sees everything)
export const memberVisibilities = ['private', 'summary', 'full'] as const

export type PartyMember = {
   userId: mongoose.Types.ObjectId
   charId: mongoose.Types.ObjectId
   statsId: mongoose.Types.ObjectId
   state: (typeof memberStates)[number]
   visibility: (typeof memberVisibilities)[number]
   requestedAt: Date
}

export interface IPartyDocument extends Document {
   name: string
   gmUserId: mongoose.Types.ObjectId
   inviteCode: string
   status: (typeof partyStatuses)[number]
   members: mongoose.Types.DocumentArray<PartyMember & Document>
   // Optional book rules the GM switches on (bookRules.ts) and the party's in-game date (day number, null = not set)
   rules?: Partial<BookRules> | null
   calendarDay?: number | null
   createdAt: Date
   updatedAt: Date
}

// One Boolean per book rule (shared with the hero's own switches in stats.model.ts)
export function bookRuleSchema() {
   return new Schema(Object.fromEntries(bookRuleKeys.map((key) => [key, { type: Boolean, default: false }])), { _id: false })
}

// A party (Heldengruppe) led by one game master; players join with one hero each (user decision, Nov 2026).
const partySchema = new Schema<IPartyDocument>(
   {
      name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
      gmUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      inviteCode: { type: String, required: true, unique: true },
      status: { type: String, enum: partyStatuses, default: 'active' },
      members: {
         type: [{
            userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            charId: { type: Schema.Types.ObjectId, ref: 'Char', required: true },
            statsId: { type: Schema.Types.ObjectId, ref: 'Stats', required: true },
            state: { type: String, enum: memberStates, required: true },
            visibility: { type: String, enum: memberVisibilities, default: 'summary' },
            requestedAt: { type: Date, default: Date.now },
         }],
         default: [],
      },
      rules: { type: bookRuleSchema(), default: () => ({}) },
      calendarDay: { type: Number, default: null },
   },
   { timestamps: true },
)

partySchema.index({ 'members.userId': 1 })
partySchema.index({ 'members.charId': 1, status: 1 })
partySchema.index({ 'members.statsId': 1, status: 1 })

export const Party = mongoose.model<IPartyDocument>('Party', partySchema)
