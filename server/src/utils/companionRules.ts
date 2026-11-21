import { calcPain } from './baseAttributes'
import {
   companionProbeOverrides, companionSpecies, companionTalentProbes, familiarBonus, familiarTricks,
   type CompanionAttack, type CompanionAttributes, type CompanionTalent,
} from './companionCatalog'

export const customSpecies = 'custom'

export type OwnedCompanion = {
   _id?: unknown
   name: string
   species: string
   familiar: boolean
   attributes: CompanionAttributes
   health: { max: number; current: number }
   mana: { base: number; current: number }
   initiative: number
   defense: number
   soulPower: number
   toughness: number
   speed: string
   armor: number
   actions: number
   attacks: CompanionAttack[]
   talents: CompanionTalent[]
   traits: string
   abilities: string
   special: string
   tricks: Array<{ key: string; paidAP: number }>
   experience: { total: number; spent: number }
   // LO (Loyalität) from the official animal sheet; no core-rule definition, stored as entered (user decision)
   loyalty: number | null
   notes: string
}

// source: DSA5 Regelwerk, S. 279 (familiar bonuses apply on top of the species values)
export function effectiveCompanion(companion: OwnedCompanion) {
   const bonus = companion.familiar ? familiarBonus : { attribute: 0, health: 0, armor: 0, soulPower: 0, toughness: 0, mana: 0 }
   const attributes = Object.fromEntries(Object.entries(companion.attributes)
      .map(([key, value]) => [key, value + bonus.attribute])) as CompanionAttributes
   return {
      attributes,
      maxHealth: companion.health.max + bonus.health,
      maxMana: companion.mana.base + bonus.mana,
      armor: companion.armor + bonus.armor,
      soulPower: companion.soulPower + bonus.soulPower,
      toughness: companion.toughness + bonus.toughness,
   }
}

// source: DSA5 Regelwerk, S. 360–362 (printed species tables); S. 34 hero rule for familiars and custom animals (user decision)
export function companionPain(companion: OwnedCompanion) {
   const species = companionSpecies.find((entry) => entry.key === companion.species)
   const { maxHealth } = effectiveCompanion(companion)
   if (!species || companion.familiar) return calcPain(companion.health.current, maxHealth)
   return Math.min(4, species.painTable.reduce((sum, [threshold, levels]) => sum + (companion.health.current <= threshold ? levels : 0), 0))
}

export function companionTalentTargets(companion: OwnedCompanion, key: string) {
   const probe = companionProbeOverrides[companion.species]?.[key] ?? companionTalentProbes[key]
   if (!probe) return null
   const { attributes } = effectiveCompanion(companion)
   return probe.map((attribute) => attributes[attribute])
}

export function companionProbe(companion: Pick<OwnedCompanion, 'species'>, key: string) {
   return companionProbeOverrides[companion.species]?.[key] ?? companionTalentProbes[key] ?? null
}

// source: DSA5 Regelwerk, S. 279–280 (species-specific tricks; custom animals only get tricks for all species)
export function availableTricks(companion: Pick<OwnedCompanion, 'species' | 'familiar'>) {
   if (!companion.familiar) return []
   return familiarTricks.filter((entry) => entry.species === 'all' || entry.species.includes(companion.species))
}

export function newCompanion(species: string, name: string, familiar: boolean): OwnedCompanion {
   const template = companionSpecies.find((entry) => entry.key === species)
   const base: OwnedCompanion = {
      name, species, familiar,
      attributes: template ? { ...template.attributes } : { courage: 10, wisdom: 10, intuition: 10, charisma: 10, fingerDexterity: 10, dexterity: 10, constitution: 10, strength: 10 },
      health: { max: template?.health ?? 10, current: 0 },
      mana: { base: 0, current: 0 },
      initiative: template?.initiative ?? 10, defense: template?.defense ?? 5,
      soulPower: template?.soulPower ?? 0, toughness: template?.toughness ?? 0,
      speed: template?.speed ?? '8', armor: template?.armor ?? 0, actions: template?.actions ?? 1,
      attacks: template?.attacks.map((attack) => ({ ...attack })) ?? [],
      talents: template?.talents.map((talent) => ({ ...talent })) ?? [],
      traits: template?.traits ?? '', abilities: template?.abilities ?? '', special: template?.special ?? '',
      tricks: [], experience: { total: 0, spent: 0 }, loyalty: null, notes: '',
   }
   const effective = effectiveCompanion(base)
   base.health.current = effective.maxHealth
   base.mana.current = effective.maxMana
   return base
}
