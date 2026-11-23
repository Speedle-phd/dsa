import { stowPlacement } from './containers'

// source: DSA5 Regelwerk, S. 32, 374 (ordered armor table; protection = Rüstungsschutz RS)
export const armorTable = [
   { names: ['Normale Kleidung', 'Felle'], burden: 0, extra: 0, protection: 0 },
   { names: ['Schwere Kleidung', 'Winterkleidung'], burden: 0, extra: 1, protection: 1 },
   { names: ['Stoffrüstung', 'Gambeson'], burden: 1, extra: 0, protection: 2 },
   { names: ['Lederrüstung'], burden: 1, extra: 1, protection: 3 },
   { names: ['Kettenrüstung'], burden: 2, extra: 0, protection: 4 },
   { names: ['Schuppenrüstung'], burden: 2, extra: 1, protection: 5 },
   { names: ['Plattenrüstung'], burden: 3, extra: 0, protection: 6 },
] as const

// RS of the worn armor (S. 374); 0 without armor or for an unknown name
export function armorProtection(name: string | null | undefined) {
   const index = name ? armorIndex(name) : -1
   return index >= 0 ? armorTable[index].protection : 0
}

export function armorIndex(name: string) {
   return armorTable.findIndex((row) => row.names.some((entry) => entry === name))
}

type ArmorEntry = { item: string; amount: number; carriedOn?: string }
const equipped = (entry: ArmorEntry) => entry.amount > 0 && entry.carriedOn === 'Equipped' && armorIndex(entry.item) >= 0

export function equippedArmor(equipment: readonly ArmorEntry[], legacy?: string | null) {
   return equipment.find(equipped)?.item ??
      equipment.find((entry) => entry.amount > 0 && entry.item === legacy && armorIndex(entry.item) >= 0)?.item ?? null
}

export function normalizeArmorEquipment<T extends ArmorEntry>(
   equipment: readonly T[], previous: readonly ArmorEntry[] = [], legacy?: string | null,
): T[] {
   const candidates = equipment.filter(equipped)
   const newlyEquipped = candidates.filter((entry) => !previous.some((old) => equipped(old) && old.item === entry.item))
   const selected = newlyEquipped.at(-1) ?? candidates[0] ??
      equipment.find((entry) => entry.amount > 0 && entry.item === legacy && armorIndex(entry.item) >= 0)
   return equipment.map((entry) => entry === selected ? { ...entry, carriedOn: 'Equipped' }
      : equipped(entry) ? { ...entry, carriedOn: stowPlacement } : { ...entry })
}
