import { aventurianStore, type AventurianStoreItem } from '@/utils/aventurian_store'
import type { Stats } from './statsApi'

export const combatStoreItems = Object.values(aventurianStore).flat().filter((item) => item.weapon || item.armor)

export type StoreWeapon = NonNullable<AventurianStoreItem['weapon']>

// source: DSA5 Regelwerk, S. 367 (Waffenlos: 1W6, GE/KK 14, 0/0, kurz)
export const unarmedWeapon: StoreWeapon = {
   combatTechnique: 'Raufen', damage: '1W6', leadingAttribute: 'GE/KK', threshold: 14, attackModifier: 0, parryModifier: 0, reach: 'short',
}

// source: DSA5 Regelwerk, S. 234–235 (weapon-specific leading attribute and threshold)
export function damageBonus(weapon: StoreWeapon, stats: Stats) {
   if (weapon.threshold === undefined || !weapon.leadingAttribute) return null
   const attributes = weapon.leadingAttribute.split('/').map((key) =>
      key === 'GE' ? stats.dexterity : key === 'KK' ? stats.strength : null)
   if (attributes.some((value) => value === null)) return null
   return Math.max(0, Math.max(...attributes.filter((value) => value !== null)) - weapon.threshold)
}

// Worn armor's RS (S. 374); Belastungsgewöhnung changes only BE, not RS.
export function armorProtection(stats: Stats) {
   const armor = stats.checkModifiers.armor
   return armor ? combatStoreItems.find((item) => item.name === armor)?.armor?.protection ?? 0 : 0
}
