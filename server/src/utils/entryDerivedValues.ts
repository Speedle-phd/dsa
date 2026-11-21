import { calcBaseAttributes } from './baseAttributes'
import { entryRomans } from './characterEntryCatalog'
import type { StatusName } from './statusRules'

type EntryState = { advantages?: string[]; disadvantages?: string[] }
type Category = 'advantages' | 'disadvantages'
export type DerivedValue = 'soulPower' | 'toughness' | 'fatePoints' | 'speed'
export type ValueSource = { label: string; value: number; page: number }

// Owned level of an entry: 1 for "Name", n for "Name <roman n>", 0 if not owned.
// Each bought level is recorded separately (III, then IV), so the highest one counts.
export function ownedEntry(entries: string[] | undefined, name: string) {
   let owned: { entry: string; level: number } | null = null
   for (const entry of entries ?? []) {
      const roman = entry.startsWith(`${name} `) ? entry.slice(name.length + 1) : null
      const level = entry === name ? 1 : roman && entryRomans.includes(roman) ? entryRomans.indexOf(roman) + 1 : 0
      if (level > (owned?.level ?? 0)) owned = { entry, level }
   }
   return owned
}
export const entryLevel = (entries: string[] | undefined, name: string) => ownedEntry(entries, name)?.level ?? 0

// Fixed per-level changes of derived values (rule data).
const valueRules: Record<DerivedValue, Array<[Category, string, number, number]>> = {
   // source: DSA5 Regelwerk, S. 166, 174 (SK-Grundwert ±1)
   soulPower: [['advantages', 'Hohe Seelenkraft', 1, 166], ['disadvantages', 'Niedrige Seelenkraft', -1, 174]],
   // source: DSA5 Regelwerk, S. 167, 174 (ZK-Grundwert ±1)
   toughness: [['advantages', 'Hohe Zähigkeit', 1, 167], ['disadvantages', 'Niedrige Zähigkeit', -1, 174]],
   // source: DSA5 Regelwerk, S. 165, 174 (Schips maximum ±1 per level)
   fatePoints: [['advantages', 'Glück', 1, 165], ['disadvantages', 'Pech', -1, 174]],
   // source: DSA5 Regelwerk, S. 165, 171 (GS-Grundwert ±1)
   speed: [['advantages', 'Flink', 1, 165], ['disadvantages', 'Behäbig', -1, 171]],
}

export function entryValueSources(state: EntryState, value: DerivedValue): ValueSource[] {
   return valueRules[value].flatMap(([category, name, perLevel, page]) => {
      const owned = ownedEntry(state[category], name)
      return owned ? [{ label: owned.entry, value: perLevel * owned.level, page }] : []
   })
}
export const entryValueBonus = (state: EntryState, value: DerivedValue) =>
   entryValueSources(state, value).reduce((sum, source) => sum + source.value, 0)

// SK/ZK changes that only count against one kind of threat. Display only: the app makes no checks against the hero.
// source: DSA5 Regelwerk, S. 165, 167, 171, 172 (poisons, diseases ±1 per level), S. 168 (Schwer zu verzaubern: spells on the hero −1,
// incl. Einfluss/Heilung/Hellsicht/Verwandlung, Arbosch), S. 179 (Zauberanfällig −1 per level; Wahrer Name −4 for a caster who knows it)
export type ResistanceThreat = 'poison' | 'disease' | 'magic' | 'trueName'
const conditionalRules: Array<[Category, string, ResistanceThreat, number, number]> = [
   ['advantages', 'Giftresistenz', 'poison', 1, 165], ['disadvantages', 'Giftanfällig', 'poison', -1, 171],
   ['advantages', 'Krankheitsresistenz', 'disease', 1, 167], ['disadvantages', 'Krankheitsanfällig', 'disease', -1, 172],
   ['advantages', 'Schwer zu verzaubern', 'magic', 1, 168], ['disadvantages', 'Zauberanfällig', 'magic', -1, 179],
   ['disadvantages', 'Wahrer Name', 'trueName', -4, 179],
]
export function conditionalResistances(state: EntryState) {
   return conditionalRules.flatMap(([category, name, against, perLevel, page]) => {
      const owned = ownedEntry(state[category], name)
      return owned ? [{ label: owned.entry, against, value: perLevel * owned.level, page }] : []
   })
}

// source: DSA5 Regelwerk, S. 171, 178 (these disadvantages give the status permanently)
const statusDisadvantages = { Blind: 'Blind', Taub: 'Taub', Stumm: 'Stumm' } as const satisfies Record<string, StatusName>
export function entryStatuses(state: EntryState): StatusName[] {
   return Object.entries(statusDisadvantages).filter(([name]) => state.disadvantages?.includes(name)).map(([, status]) => status)
}

// source: DSA5 Regelwerk, S. 179 (Verstümmelt (Einbeinig): GS-Grundwert halved)
export const halvesSpeedBase = (state: EntryState) => Boolean(state.disadvantages?.includes('Verstümmelt (Einbeinig)'))

type Attributes = Partial<Record<'courage' | 'wisdom' | 'intuition' | 'strength' | 'constitution', number>>
type ResistancePool = { value?: number; bonusMalus?: number; max?: number }
type FatePool = { value?: number; bonusMalus?: number; current?: number; max?: number }
// Derived SK, ZK and Schips maxima; pools that are missing are skipped.
export function applyEntryValues(stat: EntryState & Attributes & { soulPower?: ResistancePool; toughness?: ResistancePool; fatePoints?: FatePool }) {
   if (stat.soulPower) stat.soulPower.max = calcBaseAttributes.soulPower(stat.soulPower.value ?? 0, stat.courage ?? 0, stat.wisdom ?? 0,
      stat.intuition ?? 0, (stat.soulPower.bonusMalus ?? 0) + entryValueBonus(stat, 'soulPower'))
   if (stat.toughness) stat.toughness.max = calcBaseAttributes.toughness(stat.toughness.value ?? 0, stat.strength ?? 0, stat.constitution ?? 0,
      (stat.toughness.bonusMalus ?? 0) + entryValueBonus(stat, 'toughness'))
   // source: DSA5 Regelwerk, S. 174 (Pech: never below 0)
   if (stat.fatePoints) stat.fatePoints.max = Math.max(0, (stat.fatePoints.value ?? 3) + (stat.fatePoints.bonusMalus ?? 0) + entryValueBonus(stat, 'fatePoints'))
}
