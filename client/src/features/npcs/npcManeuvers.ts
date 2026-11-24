import type { NpcWeapon } from './npcSheet'

// Attack maneuvers an NPC can use, read from its special abilities (S. 247–250). One maneuver per attack (app choice:
// the stat blocks name basic and special maneuvers alike; combining them is left to the GM's situational modifier).
type ManeuverData = {
   name: string; page: number; kinds: ReadonlyArray<NpcWeapon['kind']>
   // per level: AT/FK change, the target's defense change, TP bonus; `die`: +1W6 TP instead
   attack: number; defense: number; tp: number; die: boolean; levels: boolean
}
// source: DSA5 Regelwerk, S. 247 (Finte), 248 (Hammerschlag, Präziser Schuss/Wurf), 249 (Präziser Stich), 250 (Todesstoß, Wuchtschlag)
export const npcManeuverTable: readonly ManeuverData[] = [
   { name: 'Finte', page: 247, kinds: ['melee', 'natural'], attack: -1, defense: -2, tp: 0, die: false, levels: true },
   { name: 'Wuchtschlag', page: 250, kinds: ['melee', 'natural'], attack: -2, defense: 0, tp: 2, die: false, levels: true },
   { name: 'Präziser Stich', page: 249, kinds: ['melee'], attack: -2, defense: 0, tp: 2, die: false, levels: true },
   { name: 'Präziser Schuss/Wurf', page: 248, kinds: ['ranged'], attack: -2, defense: 0, tp: 2, die: false, levels: true },
   { name: 'Hammerschlag', page: 248, kinds: ['melee'], attack: -2, defense: 0, tp: 0, die: true, levels: false },
   { name: 'Todesstoß', page: 250, kinds: ['melee'], attack: -2, defense: 0, tp: 0, die: true, levels: false },
]

export type NpcManeuver = ManeuverData & { maxLevel: number }
export type ManeuverEffect = { attack: number; defense: number; tp: number; die: boolean; label: string }

const romans: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 }
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Highest level among "Finte I", "Finte I+II (Schwert)", "Wuchtschlag I-III"; 0 = not known
export function abilityLevel(abilities: readonly string[], name: string, levels: boolean) {
   let best = 0
   for (const ability of abilities) {
      const match = new RegExp(`^${escape(name)}(?![\\p{L}])\\s*([IV+\\-–, ]*)`, 'u').exec(ability.trim())
      if (!match) continue
      if (!levels) return 1
      const found = (match[1].match(/IV|I{1,3}/g) ?? []).map((part) => romans[part] ?? 0)
      best = Math.max(best, ...found, found.length ? 0 : 1)
   }
   return best
}

// The maneuvers the NPC has that fit this weapon (a Passierschlag allows none, S. 237)
export function npcManeuvers(abilities: readonly string[], weapon: Pick<NpcWeapon, 'kind'>): NpcManeuver[] {
   return npcManeuverTable.filter((entry) => entry.kinds.includes(weapon.kind))
      .map((entry) => ({ ...entry, maxLevel: abilityLevel(abilities, entry.name, entry.levels) }))
      .filter((entry) => entry.maxLevel > 0)
}

export function maneuverEffect(maneuver: NpcManeuver, level: number): ManeuverEffect {
   const used = maneuver.levels ? Math.min(Math.max(1, level), maneuver.maxLevel) : 1
   const roman = ['I', 'II', 'III', 'IV'][used - 1]
   return { attack: maneuver.attack * used, defense: maneuver.defense * used, tp: maneuver.tp * used, die: maneuver.die,
      label: maneuver.levels ? `${maneuver.name} ${roman}` : maneuver.name }
}

// Damage dice with the maneuver and a distance TP change; +1W6 only adds to W6 dice (otherwise the GM adds it by hand)
export function withManeuverDice(dice: { count: number; sides: number; bonus: number } | null, effect: ManeuverEffect | null, extraTp = 0) {
   if (!dice) return null
   return { count: dice.count + (effect?.die && dice.sides === 6 ? 1 : 0), sides: dice.sides, bonus: dice.bonus + (effect?.tp ?? 0) + extraTp }
}
