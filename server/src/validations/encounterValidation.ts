import { obstacleKinds } from '@/utils/encounterRules'
import { z } from 'zod'

const stat = (max: number) => z.number().int().min(0).max(max)
const optionalStat = (max: number) => stat(max).nullable().default(null)

const text = (max: number) => z.string().trim().max(max).default('')
const attribute = z.number().int().min(0).max(40)
// One NPC weapon or natural attack (S. 354); FK for ranged weapons in `attack`
export const npcWeaponSchema = z.object({
   name: z.string().trim().min(1).max(60),
   kind: z.enum(['melee', 'ranged', 'natural']),
   attack: z.number().int().min(0).max(40),
   parry: z.number().int().min(0).max(40).nullable().default(null),
   damage: z.string().trim().max(40).default(''),
   reach: z.enum(['short', 'medium', 'long']).nullable().default(null),
   range: z.string().trim().regex(/^\d+\/\d+\/\d+$/).nullable().default(null),
   reload: z.number().int().min(0).max(20).nullable().default(null),
   ammo: z.string().trim().max(80).nullable().default(null),
   perRound: z.number().int().min(1).max(10).nullable().default(null),
})
// The full NPC stat block (npcRules.ts NpcSheet)
export const npcSheetSchema = z.object({
   attributes: z.object({
      courage: attribute, wisdom: attribute, intuition: attribute, charisma: attribute,
      fingerDexterity: attribute, dexterity: attribute, constitution: attribute, strength: attribute,
   }).nullable().default(null),
   wisdomAnimal: z.boolean().default(false),
   mana: z.number().int().min(0).max(999).nullable().default(null),
   karma: z.number().int().min(0).max(999).nullable().default(null),
   soulPower: z.number().int().min(-10).max(30).nullable().default(null),
   toughness: z.number().int().min(-10).max(30).nullable().default(null),
   burden: z.number().int().min(0).max(4).default(0),
   armorName: text(80),
   weapons: z.array(npcWeaponSchema).max(12).default([]),
   actions: z.number().int().min(1).max(6).default(1),
   abilities: z.array(z.string().trim().min(1).max(80)).max(60).default([]),
   traits: text(2000),
   talents: z.array(z.object({ name: z.string().trim().min(1).max(60), value: z.number().int().min(-5).max(30) })).max(80).default([]),
   spells: text(2000),
   behaviour: text(2000),
   flight: text(500),
   fleeAt: z.number().int().min(0).max(999).nullable().default(null),
   painThresholds: z.array(z.number().int().min(0).max(999)).max(8).nullable().default(null),
   size: text(40),
   typus: text(80),
   loot: text(500),
   special: text(2000),
   count: text(80),
})

export const npcValuesSchema = z.object({
   maxHealth: z.number().int().min(1).max(999),
   armor: stat(30).default(0),
   initiativeBase: z.number().int().min(-20).max(60).default(10),
   attack: optionalStat(40),
   parry: optionalStat(40),
   defense: optionalStat(40),
   dodge: optionalStat(40),
   damage: z.string().trim().max(40).default(''),
   speed: optionalStat(40),
   notes: z.string().trim().max(2000).default(''),
   sheet: npcSheetSchema.nullable().default(null),
})

const boardSize = { width: z.number().int().min(5).max(60), height: z.number().int().min(5).max(60) }
// Schritt per square (user decision, Nov 2026)
const boardScale = z.number().int().min(1).max(10)

export const startEncounterSchema = z.object({ width: boardSize.width.optional(), height: boardSize.height.optional() })
export const boardSchema = z.object({ ...boardSize, scale: boardScale.optional() })
export const addNpcsSchema = z.object({
   name: z.string().trim().min(1).max(60),
   count: z.number().int().min(1).max(12),
   values: npcValuesSchema,
   saveTemplate: z.boolean().default(false),
   hidden: z.boolean().default(false),
})
export const updateCombatantSchema = z.object({
   name: z.string().trim().min(1).max(80).optional(),
   hidden: z.boolean().optional(),
   initiative: z.number().int().min(-50).max(100).nullable().optional(),
   initiativeBase: z.number().int().min(-20).max(60).optional(),
   values: npcValuesSchema.partial().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'Nothing to change.' })
export const damageSchema = z.object({
   direction: z.enum(['damage', 'heal']),
   amount: z.number().int().min(1).max(999),
   ignoreArmor: z.boolean().default(false),
})
export const positionSchema = z.object({
   position: z.object({ x: z.number().int().min(0).max(59), y: z.number().int().min(0).max(59) }).nullable(),
})
export const turnSchema = z.object({ direction: z.enum(['next', 'previous']) })
// The player's fight panel for this round (copy for the GM overview and other devices)
export const panelSchema = z.object({
   round: z.number().int().min(0).max(10_000),
   stance: z.enum(['Vorstoß', 'Verteidigungshaltung']).nullable(),
   leader: z.boolean(),
   tempPain: z.boolean(),
   ignoreConditions: z.boolean(),
   fateDefense: z.boolean(),
   defensePenalty: z.number().int().min(0).max(60),
   nextActionPenalty: z.number().int().min(-10).max(0),
   noDefense: z.boolean(),
   casting: z.object({ spell: z.string().trim().min(1).max(80), done: z.number().int().min(0).max(64), total: z.number().int().min(1).max(64) }).nullable(),
   weapons: z.array(z.object({
      key: z.string().trim().min(1).max(120),
      loaded: z.boolean().nullable(),
      state: z.enum(['destroyed', 'broken', 'damaged', 'lost', 'stuck', 'jammed']).nullable(),
   })).max(30),
})
export const obstaclesSchema = z.object({
   cells: z.array(z.object({ x: z.number().int().min(0).max(59), y: z.number().int().min(0).max(59), kind: z.enum(obstacleKinds).nullable() })).min(1).max(400),
})
export const npcInitiativeSchema = z.object({ onlyMissing: z.boolean().default(true) })
export const npcTemplateSchema = z.object({
   name: z.string().trim().min(1).max(80),
   values: npcValuesSchema,
   source: z.enum(['manual', 'import', 'generator', 'bestiary']).default('manual'),
   tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
})

const combatOutcome = z.enum(['success', 'failure', 'critical', 'criticalUnconfirmed', 'botch', 'botchAverted'])
const rollRecord = z.object({
   label: z.string().trim().min(1).max(60),
   roll: z.number().int().min(1).max(20),
   confirmation: z.number().int().min(1).max(20).nullable().optional(),
   target: z.number().int().min(-60).max(60),
   outcome: combatOutcome,
})
export const attackSchema = z.object({
   reach: z.enum(['short', 'medium', 'long']).default('medium'),
   attackerId: z.string().regex(/^[a-f0-9]{24}$/),
   targetId: z.string().regex(/^[a-f0-9]{24}$/),
   incoming: z.enum(['melee', 'shot', 'thrown']).default('melee'),
   attack: rollRecord,
   tp: z.number().int().min(0).max(300).default(0),
   dice: z.object({ count: z.number().int().min(1).max(20), sides: z.number().int().min(2).max(100), bonus: z.number().int().min(-50).max(100) }).nullable().default(null),
   // Passierschlag (S. 237) and the strikes of a two-weapon attack (S. 238)
   passing: z.boolean().default(false),
   dual: z.enum(['first', 'second']).nullable().default(null),
   // Finte: the target's defense −2 per level (S. 247)
   defenseModifier: z.number().int().min(-12).max(0).default(0),
   // The NPC's weapon or natural attack, for its per-round limit (S. 354)
   weapon: z.string().trim().max(60).nullable().default(null),
})
export const allySchema = z.object({
   heroId: z.string().regex(/^[a-f0-9]{24}$/),
   key: z.string().trim().min(1).max(80),
   name: z.string().trim().min(1).max(80),
   initiative: z.number().int().min(-20).max(60),
   initiativeBase: z.number().int().min(-20).max(60),
   speed: z.number().int().min(0).max(60).nullable(),
   armor: z.number().int().min(0).max(30).default(0),
   source: z.discriminatedUnion('kind', [
      z.object({ kind: z.enum(['companion', 'summon']), id: z.string().regex(/^[a-f0-9]{24}$/) }),
      z.object({ kind: z.literal('radau') }),
   ]).nullable().default(null),
})
// The GM grants a hero or ally a Passierschlag against an opponent (S. 237)
export const passingGrantSchema = z.object({ combatantId: z.string().regex(/^[a-f0-9]{24}$/), targetId: z.string().regex(/^[a-f0-9]{24}$/) })
// The attacker's TP after a failed defense (S. 230)
export const damageRollSchema = z.object({ tp: z.number().int().min(0).max(300) })
export const preparedSchema = z.object({ name: z.string().trim().min(1).max(80), width: boardSize.width.optional(), height: boardSize.height.optional() })
// A turn-bound action besides attacks and moves (casting, loading, aiming, Flucht …); `move`: squares Flucht allows (S. 237)
export const actionSchema = z.object({
   kind: z.enum(['action', 'free']),
   label: z.string().trim().min(1).max(60),
   detail: z.string().trim().max(80).default(''),
   move: z.number().int().min(1).max(60).optional(),
   // Anführer (S. 215): the Überreden QS and the allies chosen (up to QS + 1)
   leader: z.object({ quality: z.number().int().min(1).max(6), targetIds: z.array(z.string().regex(/^[a-f0-9]{24}$/)).min(1).max(7) }).optional(),
})
// defense: null = no defense possible (e.g. Überrascht); sp: damage the hero's owner applied (hero targets)
export const defenseSchema = z.object({
   defense: rollRecord.nullable(),
   halved: z.boolean().default(false),
   sp: z.number().int().min(0).max(300).optional(),
})

// Generator input (utils/npcGenerator.ts): weapon data comes from the client's store catalog, the rules from the server
const attributeValue = z.number().int().min(1).max(30)
export const npcDeriveSchema = z.object({
   species: z.string().trim().min(1).max(40),
   attributes: z.object({
      courage: attributeValue, wisdom: attributeValue, intuition: attributeValue, charisma: attributeValue,
      fingerDexterity: attributeValue, dexterity: attributeValue, constitution: attributeValue, strength: attributeValue,
   }),
   techniques: z.record(z.string().max(40), z.number().int().min(0).max(30)),
   weapons: z.array(z.object({
      name: z.string().trim().min(1).max(60),
      technique: z.string().trim().min(1).max(40),
      damage: z.string().trim().max(40),
      leading: z.string().trim().max(10).nullable(),
      threshold: z.number().int().min(0).max(30).nullable(),
      attackModifier: z.number().int().min(-10).max(10),
      parryModifier: z.number().int().min(-10).max(10),
      reach: z.enum(['short', 'medium', 'long', 'ranged']),
      range: z.string().trim().regex(/^\d+\/\d+\/\d+$/).nullable(),
      reload: z.number().int().min(0).max(20).nullable(),
      shield: z.boolean(),
   })).max(8),
   armor: z.string().trim().max(60).nullable(),
   abilities: z.array(z.string().trim().min(1).max(80)).max(30),
})
