import { axiosInstance } from '@/axios/axios'
import type { TalentAttribute } from './talentCatalog'

export type CompanionAttack = { name: string; attack: number; damage: string; reach: string }
export type CompanionTalent = { key: string; value: number | null; note: string }
export type Companion = {
   id: string
   name: string
   species: string
   familiar: boolean
   attributes: Record<TalentAttribute, number>
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
   talents: Array<CompanionTalent & { targets: number[] | null; probe: TalentAttribute[] | null }>
   traits: string
   abilities: string
   special: string
   tricks: Array<{ key: string; paidAP: number; free: boolean }>
   experience: { total: number; spent: number }
   loyalty: number | null
   notes: string
   effective: {
      attributes: Record<TalentAttribute, number>
      maxHealth: number
      maxMana: number
      armor: number
      soulPower: number
      toughness: number
      pain: number
   }
}
export type CompanionSpecies = {
   key: string
   page: number
   familiar: boolean
   size: string
   health: number
   painTable: Array<[number, number]>
}
export type FamiliarTrick = {
   key: string
   species: string[] | 'all'
   cost: string
   duration: string
   property: string
   ap: number | null
   page: number
   effect: { de: string; en: string }
}
export type CompanionReference = { species: CompanionSpecies[]; tricks: FamiliarTrick[]; talentKeys: string[] }
export const customSpecies = 'custom'

export type CompanionUpdate = {
   companionId: string
   name: string
   attributes: Record<TalentAttribute, number>
   healthMax: number
   manaBase: number
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
   notes: string
   experienceTotal: number
   loyalty: number | null
}
export type CompanionAction =
   | { action: 'add-companion'; species: string; name: string; familiar: boolean }
   | ({ action: 'update-companion' } & CompanionUpdate)
   | { action: 'companion-resources'; companionId: string; health?: number; mana?: number }
   | { action: 'companion-trick' | 'remove-companion-trick'; companionId: string; key: string; spendAP: boolean }
   | { action: 'remove-companion'; companionId: string }

export async function getCompanionReference() {
   return (await axiosInstance.get<CompanionReference>('/api/stats/companion-reference')).data
}
export const companionsKey = (statsId: string | undefined) => ['companions', statsId]

export async function getCompanions(statsId: string) {
   return (await axiosInstance.get<{ companions: Companion[] }>(`/api/stats/companions/${statsId}`)).data.companions
}
export async function updateCompanions(statsId: string, input: CompanionAction) {
   const { action, ...payload } = input
   return (await axiosInstance.put<{ companions: Companion[] }>(`/api/stats/${action}/${statsId}`, payload)).data.companions
}

// source: DSA5 Regelwerk, S. 279–280 (species-specific tricks; UX mirror, the server validates)
export const companionTricks = (reference: CompanionReference, companion: Pick<Companion, 'species' | 'familiar'>) =>
   companion.familiar ? reference.tricks.filter((entry) => entry.species === 'all' || entry.species.includes(companion.species)) : []

export const displayDamage = (damage: string) => damage.replace(/-(\d)/, '−$1')
