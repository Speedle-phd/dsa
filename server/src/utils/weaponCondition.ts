// Weapon damage from the optional Patzer tables (S. 231, 234, 243, 244) is kept on the inventory item until repaired.
// "Waffe beschädigt": AT/PA −2 (ranged FK −4); "schwer beschädigt": unusable; "zerstört": gone for good.
// The core rules give no repair price or check: the GM enters the smith's price, or the hero repairs it with a craft check
// (user decision, Nov 2026).
// source: DSA5 Regelwerk, S. 231–232, 234, 243–244
export const weaponConditions = ['damaged', 'broken'] as const
export type WeaponCondition = typeof weaponConditions[number]

type Entry = { item: string; amount: number; carriedOn: string; condition?: WeaponCondition | null }

function target<T extends Entry>(equipment: readonly T[], index: number, item: string) {
   const entry = equipment[index]
   return entry && entry.item === item && entry.amount > 0 ? entry : null
}

// Marks one piece; a stack of several is split so the other pieces stay intact.
export function setWeaponCondition<T extends Entry>(equipment: readonly T[], index: number, item: string, condition: WeaponCondition | 'destroyed') {
   const entry = target(equipment, index, item)
   if (!entry) return null
   const rest = equipment.filter((_, slot) => slot !== index)
   if (condition === 'destroyed') return entry.amount > 1 ? [...rest.slice(0, index), { ...entry, amount: entry.amount - 1 }, ...rest.slice(index)] : rest
   if (entry.amount === 1) return equipment.map((other, slot) => slot === index ? { ...other, condition } : other)
   return [...rest.slice(0, index), { ...entry, amount: entry.amount - 1 }, { ...entry, amount: 1, condition }, ...rest.slice(index)]
}

export function repairWeapon<T extends Entry>(equipment: readonly T[], index: number, item: string) {
   const entry = target(equipment, index, item)
   if (!entry?.condition) return null
   return equipment.map((other, slot) => {
      if (slot !== index) return other
      const { condition: _repaired, ...repaired } = other
      return repaired as T
   })
}
