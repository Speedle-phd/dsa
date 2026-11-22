import mongoose, { Schema, type Document } from 'mongoose'

// NPC values the GM enters (or takes from a template/the bestiary). Heroes keep their values in their own stats.
export type NpcValues = {
   health: number
   maxHealth: number
   armor: number
   initiativeBase: number
   attack: number | null
   parry: number | null
   // VW of non-humanoid creatures (S. 354)
   defense: number | null
   dodge: number | null
   damage: string
   speed: number | null
   notes: string
}

export type Combatant = {
   _id: mongoose.Types.ObjectId
   kind: 'hero' | 'npc'
   // Heroes: the party member
   charId?: mongoose.Types.ObjectId | null
   statsId?: mongoose.Types.ObjectId | null
   userId?: mongoose.Types.ObjectId | null
   name: string
   group: string
   initials: string
   color: number | null
   number: number
   initiative: number | null
   initiativeBase: number
   tiebreak: number
   position: { x: number; y: number } | null
   hidden: boolean
   npc?: NpcValues | null
}

export interface IEncounterDocument extends Document {
   partyId: mongoose.Types.ObjectId
   status: 'active' | 'ended'
   round: number
   activeId: mongoose.Types.ObjectId | null
   board: { width: number; height: number }
   combatants: mongoose.Types.DocumentArray<Combatant & Document>
   createdAt: Date
   updatedAt: Date
}

const npcSchema = new Schema<NpcValues>({
   health: { type: Number, required: true },
   maxHealth: { type: Number, required: true, min: 1 },
   armor: { type: Number, default: 0, min: 0 },
   initiativeBase: { type: Number, default: 10 },
   attack: { type: Number, default: null },
   parry: { type: Number, default: null },
   defense: { type: Number, default: null },
   dodge: { type: Number, default: null },
   damage: { type: String, default: '' },
   speed: { type: Number, default: null },
   notes: { type: String, default: '' },
}, { _id: false })

// A shared party fight with its battle board (user decisions, Nov 2026). Several people write at once:
// whole-document saves use optimistic concurrency, token moves are single atomic updates.
const encounterSchema = new Schema<IEncounterDocument>(
   {
      partyId: { type: Schema.Types.ObjectId, ref: 'Party', required: true, index: true },
      status: { type: String, enum: ['active', 'ended'], default: 'active' },
      round: { type: Number, default: 0 },
      activeId: { type: Schema.Types.ObjectId, default: null },
      board: {
         width: { type: Number, default: 20, min: 5, max: 60 },
         height: { type: Number, default: 14, min: 5, max: 60 },
      },
      combatants: {
         type: [{
            kind: { type: String, enum: ['hero', 'npc'], required: true },
            charId: { type: Schema.Types.ObjectId, default: null },
            statsId: { type: Schema.Types.ObjectId, default: null },
            userId: { type: Schema.Types.ObjectId, default: null },
            name: { type: String, required: true, maxlength: 80 },
            group: { type: String, required: true, maxlength: 80 },
            initials: { type: String, required: true, maxlength: 3 },
            color: { type: Number, default: null },
            number: { type: Number, default: 0 },
            initiative: { type: Number, default: null },
            initiativeBase: { type: Number, default: 0 },
            tiebreak: { type: Number, default: 0 },
            position: { type: { x: Number, y: Number }, default: null, _id: false },
            hidden: { type: Boolean, default: false },
            npc: { type: npcSchema, default: null },
         }],
         default: [],
      },
   },
   { timestamps: true, optimisticConcurrency: true },
)

// At most one running fight per party
encounterSchema.index({ partyId: 1 }, { unique: true, partialFilterExpression: { status: 'active' } })

export const Encounter = mongoose.model<IEncounterDocument>('Encounter', encounterSchema)
