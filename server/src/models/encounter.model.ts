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
   kind: 'hero' | 'npc' | 'ally'
   // Allies (companions, summons, Radau; user decision Nov 2026): the hero combatant they belong to, the panel's ally id, GS
   ownerId?: mongoose.Types.ObjectId | null
   allyKey?: string | null
   speed?: number | null
   // Worn RS of a hero (reported by its owner) or an ally's RS; ally record for damage (companion / summon / Radau)
   armor?: number | null
   source?: { kind: 'companion' | 'summon' | 'radau'; id?: string | null } | null
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
   // Defenses made in a Kampfrunde (S. 232: −3 per further PA/AW)
   defenses?: { round: number; count: number } | null
   // Actions used in a Kampfrunde (1 action + 1 free action, S. 228)
   turn?: { round: number; action: boolean; free: boolean; dual?: boolean; bonus?: number } | null
   // Schritt moved in the combatant's latest own turn (ranged modifiers for shooter and target, S. 242)
   lastTurn?: { round: number; squares: number } | null
}
export type Obstacle = { x: number; y: number; kind: string }

export type CombatRollRecord = { label: string; roll: number; confirmation?: number | null; target: number; outcome: string }
// An attack between a hero and an NPC that waits for (or got) the defender's roll
export type EncounterAttack = {
   _id: mongoose.Types.ObjectId
   attackerId: mongoose.Types.ObjectId
   targetId: mongoose.Types.ObjectId
   incoming: 'melee' | 'shot' | 'thrown'
   attack: CombatRollRecord
   critical: boolean
   // Passierschlag: no defense possible (S. 237)
   passing?: boolean
   tp: number
   // pending: waits for the defense; damage: the defense failed, the attacker rolls TP (user decision, Nov 2026)
   status: 'pending' | 'damage' | 'defended' | 'hit' | 'cancelled'
   // The attacker's damage dice (TP ×2 after a confirmed critical, S. 231); ½ TP chosen by the defender (demons, elementals)
   dice?: { count: number; sides: number; bonus: number } | null
   halved?: boolean
   // RS used for the hit; the hero's Schmerz rose (Blutrausch, S. 171)
   rs?: number | null
   painRaised?: boolean
   defense?: CombatRollRecord | null
   sp?: number | null
   round: number
   createdAt: Date
}
// Shared fight log: `values` for everyone, `gmValues` (NPC values) only for the GM
export type EncounterLogEntry = { round: number; key: string; values: Record<string, string | number>; gmKey?: string | null; gmValues?: Record<string, string | number> | null; createdAt: Date }

export interface IEncounterDocument extends Document {
   partyId: mongoose.Types.ObjectId
   // prepared: set up by the GM, invisible to players until unlocked (user decision, Nov 2026)
   status: 'active' | 'ended' | 'prepared'
   name: string
   round: number
   activeId: mongoose.Types.ObjectId | null
   // scale: Schritt per square (user decision, Nov 2026)
   board: { width: number; height: number; scale?: number }
   obstacles: Array<Obstacle>
   // Passierschläge a hero or ally may strike (S. 237): after a critical parry, or granted by the GM (user decision, Nov 2026)
   passingGrants: Array<{ combatantId: mongoose.Types.ObjectId; targetId: mongoose.Types.ObjectId; reason: 'parry' | 'gm'; round: number }>
   combatants: mongoose.Types.DocumentArray<Combatant & Document>
   attacks: mongoose.Types.DocumentArray<EncounterAttack & Document>
   log: Array<EncounterLogEntry>
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
      status: { type: String, enum: ['active', 'ended', 'prepared'], default: 'active' },
      name: { type: String, default: '', maxlength: 80 },
      round: { type: Number, default: 0 },
      activeId: { type: Schema.Types.ObjectId, default: null },
      board: {
         width: { type: Number, default: 20, min: 5, max: 60 },
         height: { type: Number, default: 14, min: 5, max: 60 },
         scale: { type: Number, default: 1, min: 1, max: 10 },
      },
      // Terrain squares that block movement (user decision, Nov 2026)
      obstacles: { type: [{ x: Number, y: Number, kind: String, _id: false }], default: [] },
      passingGrants: {
         type: [{ combatantId: Schema.Types.ObjectId, targetId: Schema.Types.ObjectId, reason: { type: String, enum: ['parry', 'gm'] }, round: Number, _id: false }],
         default: [],
      },
      combatants: {
         type: [{
            kind: { type: String, enum: ['hero', 'npc', 'ally'], required: true },
            ownerId: { type: Schema.Types.ObjectId, default: null },
            allyKey: { type: String, default: null, maxlength: 80 },
            speed: { type: Number, default: null },
            armor: { type: Number, default: null },
            source: { type: Schema.Types.Mixed, default: null },
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
            defenses: { type: { round: Number, count: Number }, default: null, _id: false },
            turn: { type: { round: Number, action: Boolean, free: Boolean, dual: Boolean, bonus: Number }, default: null, _id: false },
            lastTurn: { type: { round: Number, squares: Number }, default: null, _id: false },
         }],
         default: [],
      },
      attacks: {
         type: [{
            attackerId: { type: Schema.Types.ObjectId, required: true },
            targetId: { type: Schema.Types.ObjectId, required: true },
            incoming: { type: String, enum: ['melee', 'shot', 'thrown'], default: 'melee' },
            attack: { type: Schema.Types.Mixed, required: true },
            critical: { type: Boolean, default: false },
            passing: { type: Boolean, default: false },
            tp: { type: Number, default: 0 },
            status: { type: String, enum: ['pending', 'damage', 'defended', 'hit', 'cancelled'], default: 'pending' },
            dice: { type: { count: Number, sides: Number, bonus: Number }, default: null, _id: false },
            halved: { type: Boolean, default: false },
            rs: { type: Number, default: null },
            painRaised: { type: Boolean, default: false },
            defense: { type: Schema.Types.Mixed, default: null },
            sp: { type: Number, default: null },
            round: { type: Number, default: 0 },
            createdAt: { type: Date, default: Date.now },
         }],
         default: [],
      },
      log: {
         type: [{
            round: Number, key: String, values: Schema.Types.Mixed, gmKey: { type: String, default: null },
            gmValues: { type: Schema.Types.Mixed, default: null }, createdAt: { type: Date, default: Date.now }, _id: false,
         }],
         default: [],
      },
   },
   { timestamps: true, optimisticConcurrency: true },
)

// At most one running fight per party
encounterSchema.index({ partyId: 1 }, { unique: true, partialFilterExpression: { status: 'active' } })

export const Encounter = mongoose.model<IEncounterDocument>('Encounter', encounterSchema)
