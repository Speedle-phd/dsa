import mongoose, { Schema, type Document, type Types } from 'mongoose'
import { searchLandscapes, type SearchLandscape } from '@/utils/herbs/herbTypes'

// A general herb search of a hero in a party (AdK S. 278): the GM picks which species were found (user decision,
// Nov 2026); the app suggests the plants of the landscape. Done or dismissed finds stay for the session.
export interface IHerbFindDocument extends Document {
   partyId: Types.ObjectId
   userId: Types.ObjectId
   charId: Types.ObjectId
   statsId: Types.ObjectId
   landscape: SearchLandscape
   // How many species the hero found at most (the QS, or 1 with "improve")
   count: number
   status: 'open' | 'assigned' | 'dismissed'
   picks: string[]
   createdAt: Date
   updatedAt: Date
}

const herbFindSchema = new Schema<IHerbFindDocument>(
   {
      partyId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      charId: { type: Schema.Types.ObjectId, ref: 'Char', required: true },
      statsId: { type: Schema.Types.ObjectId, ref: 'Stats', required: true },
      landscape: { type: String, enum: searchLandscapes, required: true },
      count: { type: Number, required: true, min: 1, max: 6 },
      status: { type: String, enum: ['open', 'assigned', 'dismissed'], default: 'open' },
      picks: { type: [String], default: [] },
   },
   { timestamps: true },
)

herbFindSchema.index({ partyId: 1, createdAt: -1 })
// Like check requests, finds belong to one session: MongoDB removes them a day later (app choice)
herbFindSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 })

export const HerbFind = mongoose.model<IHerbFindDocument>('HerbFind', herbFindSchema)
