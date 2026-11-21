import { axiosInstance } from '@/axios/axios'
import type { CompanionAttack, CompanionTalent } from './companionApi'
import type { TalentAttribute } from './talentCatalog'

export type Localized = { de: string; en: string }
export type CreatureKind = 'animal' | 'demon' | 'elemental'
export type SummoningRitual = 'Invocatio Minor' | 'Invocatio Maior' | 'Elementarer Diener' | 'Dschinnenruf'
export type BestiaryAttack = CompanionAttack & { parry?: number | null; perRound?: number }

// Bestiarium stat block (S. 354–362); values from the server catalog
export type BestiaryCreature = {
   key: string
   kind: CreatureKind
   page: number
   companionSpecies: string | null
   size: string
   typus: string
   animalWisdom: boolean
   attributes: Record<TalentAttribute, number>
   health: number
   mana: number | null
   initiative: number
   defense: number | null
   dodge: number | null
   soulPower: number
   toughness: number
   speed: string
   armor: number
   actions: number
   attacks: BestiaryAttack[]
   talents: CompanionTalent[]
   spells: Array<{ name: string; value: number; probe: string }>
   traits: string
   abilities: string
   count: string
   loot: Localized | null
   hunt: number | null
   behaviour: Localized
   flight: Localized
   special: Array<{ name: string } & Localized>
   painTable: Array<[number, number]> | null
   invocation: number | null
   summonedBy: SummoningRitual | null
   extraServices: Array<{ name: string; services: number } & Localized>
   knowledge: { talent: 'tierkunde' | 'sphaerenkunde'; application: string; facts: Array<{ qs: 1 | 2 | 3 } & Localized> }
}
export type SummonImprovement = 'offensive' | 'defensive' | 'speed' | 'magic' | 'resistance' | 'mental' | 'physical'
export type SummonServiceKey = 'work' | 'advice' | 'ability' | 'fight' | 'fightMany' | 'spying' | 'search' | 'guard'
export type BestiaryReference = {
   creatures: BestiaryCreature[]
   creatureRules: Record<'demon' | 'elemental', { page: number; rules: Localized[] }>
   counterElements: Array<[string, string]>
   animalWisdomTable: Array<[number, number]>
   creatureManeuvers: Array<{ name: string; page: number } & Localized>
   demonSpells: Array<{ name: string } & Localized>
   summoningRituals: Record<SummoningRitual, Localized>
   summonImprovements: Array<{ key: SummonImprovement; name: string } & Localized>
   summonServices: Array<{ key: SummonServiceKey; name: string; minimum: number; usesAll: boolean } & Localized>
   summoningFailures: Array<{ from: number; to: number | null } & Localized>
}
export type Summon = {
   _id: string
   creature: string
   ritual: SummoningRitual
   quality: number
   improvements: SummonImprovement[]
   services: number
   task: SummonServiceKey | null
   createdAt: string
   effective: BestiaryCreature | null
   health: { max: number; current: number } | null
}
export type SummonAction =
   | { action: 'service'; summonId: string; service: SummonServiceKey }
   | { action: 'sunrise' | 'dismiss' | 'fight-over'; summonId: string }
   | { action: 'join-fight'; summonId: string; service: 'fight' | 'fightMany' }
   | { action: 'health'; summonId: string; current: number }

export const summonsKey = (statsId: string | undefined) => ['summons', statsId]

export async function getBestiaryReference() {
   return (await axiosInstance.get<BestiaryReference>('/api/stats/bestiary-reference')).data
}
export async function getSummons(statsId: string) {
   return (await axiosInstance.get<{ summons: Summon[] }>(`/api/stats/summons/${statsId}`)).data.summons
}
export async function addSummon(statsId: string, input: { creature: string; ritual: SummoningRitual; quality: number; improvements: SummonImprovement[] }) {
   return (await axiosInstance.put<{ summons: Summon[] }>(`/api/stats/add-summon/${statsId}`, input)).data.summons
}
export async function updateSummon(statsId: string, input: SummonAction) {
   return (await axiosInstance.put<{ summons: Summon[] }>(`/api/stats/summon-action/${statsId}`, input)).data.summons
}

// source: DSA5 Regelwerk, S. 264–265 (one service for success, one more per QS minus the QS spent on improvements)
export const servicesFor = (quality: number, improvements: number) => 1 + quality - improvements

// source: DSA5 Regelwerk, S. 200, 354 (facts up to the QS reached; a critical success knows everything)
export function revealedFacts(creature: BestiaryCreature, quality: number | null, critical: boolean) {
   if (critical) return creature.knowledge.facts
   return quality === null ? [] : creature.knowledge.facts.filter((fact) => fact.qs <= quality)
}

// source: DSA5 Regelwerk, S. 264 (failed demon summoning: the GM rolls 1W20, +15 on a botch)
export function failureRow(reference: BestiaryReference, roll: number) {
   return reference.summoningFailures.find((row) => roll >= row.from && (row.to === null || roll <= row.to)) ?? null
}
