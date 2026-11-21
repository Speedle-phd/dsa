import { axiosInstance } from '@/axios/axios'
import type { Stats } from './statsApi'

export type CombatAttribute = 'courage' | 'intuition' | 'dexterity' | 'fingerDexterity' | 'constitution' | 'strength'
export type CombatRequirement =
   | { attribute: CombatAttribute; minimum: number }
   | { talent: string; minimum: number }
   | { ability: string }
export type CombatReference = {
   techniques: Array<{
      key: string
      attributes: CombatAttribute[]
      stfClass: 'b' | 'c'
      ranged: boolean
      canParry: boolean
   }>
   abilities: Array<{
      key: string
      ap: number
      requirements: CombatRequirement[]
      effect?: { page: number; de: string; en: string }
   }>
   conditions: string[]
}
export type CombatSettingsInput = {
   techniques?: Stats['combatTechniques']
   conditions?: Stats['combatConditions']
   statuses?: Stats['statuses']
   triggers?: Stats['triggers']
   modifiers?: Stats['combatModifiers']
   wornArmor?: Stats['wornArmor']
}

export async function getCombatReference() {
   const response = await axiosInstance.get<CombatReference>('/api/stats/combat-reference')
   return response.data
}

async function updateCombat(path: string, payload: unknown) {
   const response = await axiosInstance.put<{ stats: Stats }>(path, payload)
   return response.data.stats
}

export const levelUpCombatTechnique = (id: string, techniqueKey: string, spendAP = true, value?: number) =>
   updateCombat(`/api/stats/combat-technique-level-up/${id}`, { techniqueKey, spendAP, value })
export const addCombatAbility = (id: string, abilityKey: string, mode: 'record' | 'purchase') =>
   updateCombat(`/api/stats/combat-ability/${id}`, { abilityKey, mode })
export const removeCombatAbility = (id: string, abilityKey: string, spendAP = true) =>
   updateCombat(`/api/stats/remove-combat-ability/${id}`, { abilityKey, spendAP })
export const updateCombatSettings = (id: string, values: CombatSettingsInput) =>
   updateCombat(`/api/stats/combat-settings/${id}`, values)
export const adjustHealth = (id: string, direction: 'heal' | 'damage', amount: number) =>
   updateCombat(`/api/stats/adjust-health/${id}`, { direction, amount })
// source: DSA5 Regelwerk, S. 246 (each shot uses one arrow, bolt or bullet)
export const spendAmmunition = (id: string, item: string) =>
   updateCombat(`/api/stats/use-ammunition/${id}`, { item })
// source: DSA5 Regelwerk, S. 231, 234, 243–244 (Patzer table: weapon damaged, badly damaged or destroyed)
export const setWeaponCondition = (id: string, index: number, item: string, condition: 'damaged' | 'broken' | 'destroyed') =>
   updateCombat(`/api/stats/weapon-condition/${id}`, { index, item, condition })
export type RepairPayment = { method: 'pay'; price: { dukaten: number; silbertaler: number; heller: number; kreuzer: number } } | { method: 'self' }
export const repairWeapon = (id: string, index: number, item: string, payment: RepairPayment) =>
   updateCombat(`/api/stats/repair-weapon/${id}`, { index, item, ...payment })
