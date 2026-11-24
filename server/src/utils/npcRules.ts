import { calcPain } from '@/utils/baseAttributes'

// NPC stat blocks (DSA5 Regelwerk, S. 354, the format of every published adventure; user request, Nov 2026).
// Pure functions shared by the fight, the library and the generator; tested without a DB.

export const npcAttributeKeys = ['courage', 'wisdom', 'intuition', 'charisma', 'fingerDexterity', 'dexterity', 'constitution', 'strength'] as const
export type NpcAttributeKey = (typeof npcAttributeKeys)[number]
export type NpcReach = 'short' | 'medium' | 'long'
export type NpcWeapon = {
   name: string
   // natural: claws, bite … (no PA, S. 354)
   kind: 'melee' | 'ranged' | 'natural'
   // AT for melee and natural attacks, FK for ranged weapons
   attack: number
   parry: number | null
   damage: string
   reach: NpcReach | null
   // Ranged: "10/50/80" Schritt (S. 241), Ladezeit in actions (S. 245), ammunition text
   range: string | null
   reload: number | null
   ammo: string | null
   // At most this many uses per KR ("max. 1 × Biss", S. 354); null = no limit
   perRound: number | null
}
export type NpcSheet = {
   // KL of animals is "tierische Klugheit" (t, S. 355): `wisdomAnimal`
   attributes: Record<NpcAttributeKey, number> | null
   wisdomAnimal: boolean
   mana: number | null
   karma: number | null
   soulPower: number | null
   toughness: number | null
   // BE of the armour; armour name as printed
   burden: number
   armorName: string
   weapons: NpcWeapon[]
   // Actions per KR (creatures, S. 354)
   actions: number
   // Special abilities as printed, with levels ("Finte I", "Wuchtschlag II")
   abilities: string[]
   traits: string
   talents: Array<{ name: string; value: number }>
   spells: string
   behaviour: string
   flight: string
   // LeP at or below which the NPC flees (from "Verlust von 50 % der LeP"); null = see the text
   fleeAt: number | null
   // "Schmerz +1 bei: 23, 16, 8, 5 LeP"; null = the rule (S. 34); [] = no Schmerz (demons, elementals)
   painThresholds: number[] | null
   size: string
   typus: string
   loot: string
   special: string
   count: string
}

export function emptySheet(): NpcSheet {
   return {
      attributes: null, wisdomAnimal: false, mana: null, karma: null, soulPower: null, toughness: null, burden: 0, armorName: '',
      weapons: [], actions: 1, abilities: [], traits: '', talents: [], spells: '', behaviour: '', flight: '', fleeAt: null,
      painThresholds: null, size: '', typus: '', loot: '', special: '', count: '',
   }
}

type LegacyValues = { attack: number | null; parry: number | null; damage: string; sheet?: Partial<NpcSheet> | null }

// The NPC's weapons; an NPC from before the stat blocks has one attack (AT, PA, TP)
export function npcWeapons(values: LegacyValues): NpcWeapon[] {
   if (values.sheet?.weapons?.length) return values.sheet.weapons
   if (values.attack === null) return []
   return [{ name: 'Attack', kind: 'melee', attack: values.attack, parry: values.parry, damage: values.damage, reach: null, range: null, reload: null, ammo: null, perRound: null }]
}

// The flat fields the older screens read: the first melee (or any) weapon
export function legacyFromWeapons(weapons: NpcWeapon[]) {
   const main = weapons.find((weapon) => weapon.kind !== 'ranged') ?? weapons[0]
   return main ? { attack: main.attack, parry: main.parry, damage: main.damage } : { attack: null, parry: null, damage: '' }
}

// source: DSA5 Regelwerk, S. 34 (Schmerz levels from LeP: the printed thresholds of the stat block, else ¾ / ½ / ¼ / ≤ 5 LeP); at most IV
export function npcPain(health: number, maxHealth: number, thresholds: number[] | null | undefined) {
   if (thresholds && thresholds.length === 0) return 0
   const level = thresholds ? thresholds.filter((value) => health <= value).length : calcPain(health, maxHealth)
   return Math.min(4, level)
}

// LeP at or below which a creature flees after losing `percent` % of its LeP ("Flucht: Verlust von 50 % der LeP"):
// 50 % of 31 is 15.5 lost, reached at 15 LeP
export const fleeThreshold = (maxHealth: number, percent: number) => Math.max(0, Math.floor(maxHealth * (1 - percent / 100)))

// One more attack of a creature with several actions per KR (S. 354: "Aktionen: 2", per-attack limits such as "max. 1 × Biss").
// `turn` is the NPC's turn of this round (null = none yet; `action` true = spent); returns the next turn or the reason the attack is not allowed.
export type NpcTurn = { round: number; action: boolean; free: boolean; dual?: boolean; bonus?: number; attacks?: number; weapons?: string[] }
export function npcAttackTurn(turn: NpcTurn | null, round: number, maxActions: number, weapons: NpcWeapon[], weaponName: string | null):
   { turn: NpcTurn } | { error: string } {
   const used = turn?.attacks ?? 0
   if (used >= maxActions || turn?.action) return { error: 'The action of this round is already used.' }
   const spent = turn?.weapons ?? []
   const limit = weaponName ? weapons.find((entry) => entry.name === weaponName)?.perRound ?? null : null
   if (limit !== null && spent.filter((entry) => entry === weaponName).length >= limit) return { error: 'This attack is used up for this round (S. 354).' }
   return { turn: { round, free: turn?.free ?? false, dual: false, bonus: turn?.bonus ?? 0, attacks: used + 1,
      weapons: weaponName ? [...spent, weaponName] : [...spent], action: used + 1 >= maxActions } }
}
