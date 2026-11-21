import { calcBaseAttributes } from './baseAttributes'
import { applyEntryValues, entryLevel } from './entryDerivedValues'
import { magicTraditions } from './magicCatalog'

type Attribute = 'courage' | 'wisdom' | 'intuition' | 'charisma'
type EnergyState = Partial<Record<Attribute | 'constitution', number>> & {
   advantages?: string[]
   disadvantages?: string[]
   generalSpecialAbilities?: string[]
}
export type EnergyKind = 'mana' | 'karmaEnergy'

// source: DSA5 Regelwerk, S. 56 (Leiteigenschaften der Geweihtentraditionen), S. 317–320
export const karmaTraditions = [
   { key: 'Tradition (Praioskirche)', attribute: 'wisdom' },
   { key: 'Tradition (Rondrakirche)', attribute: 'courage' },
   { key: 'Tradition (Boronkirche)', attribute: 'courage' },
   { key: 'Tradition (Hesindekirche)', attribute: 'wisdom' },
   { key: 'Tradition (Phexkirche)', attribute: 'intuition' },
   { key: 'Tradition (Perainekirche)', attribute: 'intuition' },
] as const

// source: DSA5 Regelwerk, S. 57 (Grundwert of Vorteil Zauberer / Geweihter: 20)
export const energyBaseValue = 20

const resource = { health: 'Lebenskraft', mana: 'Astralkraft', karmaEnergy: 'Karmalkraft' } as const

// source: DSA5 Regelwerk, S. 56–57 (Leiteigenschaft of the owned tradition; the highest if several are recorded)
export function leadingAttribute(state: EnergyState, kind: EnergyKind) {
   const traditions = kind === 'mana' ? magicTraditions : karmaTraditions
   const owned = traditions.filter((tradition) => state.generalSpecialAbilities?.includes(tradition.key))
      .map((tradition) => ({ tradition: tradition.key, attribute: tradition.attribute as Attribute, value: state[tradition.attribute as Attribute] ?? 0 }))
   return owned.sort((a, b) => b.value - a.value)[0] ?? null
}

// source: DSA5 Regelwerk, S. 166 (Hohe Lebenskraft/Astralkraft/Karmalkraft +1 per level), S. 174 (Niedrige … −1 per level)
export function energyAdvantageBonus(state: EnergyState, kind: EnergyKind | 'health') {
   return entryLevel(state.advantages, `Hohe ${resource[kind]}`) - entryLevel(state.disadvantages, `Niedrige ${resource[kind]}`)
}

// source: DSA5 Regelwerk, S. 57 (Basiswert = Grundwert 20 + Leiteigenschaft ± Vor-/Nachteile; Zukauf added on top)
export function energyMaximum(state: EnergyState, kind: EnergyKind, otherModifier: number, purchased: number, active: boolean) {
   if (!active) return 0
   return energyBaseValue + (leadingAttribute(state, kind)?.value ?? 0) + energyAdvantageBonus(state, kind) + otherModifier + purchased
}

// source: DSA5 Regelwerk, S. 57 (LE-Grundwert der Spezies + 2 × KO ± Vor-/Nachteile; example 5 + 12 + 12 + Hohe Lebenskraft III = 32)
export function healthMaximum(state: EnergyState, speciesValue: number, otherModifier: number, purchased: number) {
   return calcBaseAttributes.health(speciesValue, state.constitution ?? 0, otherModifier + energyAdvantageBonus(state, 'health'), purchased)
}

type EnergyPool = {
   traditionAttributeBonus?: number; bonusMalus?: number; additionalPurchase?: number; max?: number; current?: number | null
   permanentLoss?: number; permanentBuyback?: number
}

// source: DSA5 Regelwerk, S. 262, 352 (permanently spent AsP lower the maximum; each can be bought back for 2 AP)
export const permanentBuybackCost = 2
export const permanentEnergyLoss = (pool: Pick<EnergyPool, 'permanentLoss' | 'permanentBuyback'> = {}) =>
   Math.max(0, (pool.permanentLoss ?? 0) - (pool.permanentBuyback ?? 0))
type HealthPool = { value?: number; bonusMalus?: number; additionalPurchase?: number; max?: number }
// Derived fields only; callers decide whether to clamp or reject a current value above the new maximum.
export function applyResourceMaxima(stat: EnergyState & { isSorcerer?: boolean; isConsecratedPerson?: boolean; health: HealthPool; mana: EnergyPool; karmaEnergy: EnergyPool }) {
   stat.health.max = healthMaximum(stat, stat.health.value ?? 0, stat.health.bonusMalus ?? 0, stat.health.additionalPurchase ?? 0)
   for (const [kind, active] of [['mana', stat.isSorcerer ?? false], ['karmaEnergy', stat.isConsecratedPerson ?? false]] as const) {
      const pool = stat[kind]
      pool.traditionAttributeBonus = leadingAttribute(stat, kind)?.value ?? 0
      pool.max = Math.max(0, energyMaximum(stat, kind, pool.bonusMalus ?? 0, pool.additionalPurchase ?? 0, active) - permanentEnergyLoss(pool))
   }
   applyEntryValues(stat)
}
