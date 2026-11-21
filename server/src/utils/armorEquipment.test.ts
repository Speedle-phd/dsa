import { describe, expect, it } from 'vitest'
import { equippedArmor, normalizeArmorEquipment } from './armorEquipment'

describe('Single worn armor from equipment placement (S. 32, 374)', () => {
   const equipment = [
      { item: 'Kettenrüstung', amount: 1, carriedOn: 'Equipped', weight: 12 },
      { item: 'Plattenrüstung', amount: 1, carriedOn: 'Backpack', weight: 25 },
      { item: 'Langschwert', amount: 1, carriedOn: 'Equipped', weight: 1 },
   ]
   it('automatically stows the previous armor and preserves equipped weapons', () => {
      const next = normalizeArmorEquipment(equipment.map((entry) => entry.item === 'Plattenrüstung' ? { ...entry, carriedOn: 'Equipped' } : entry), equipment)
      expect(next.map((entry) => entry.carriedOn)).toEqual(['Other', 'Equipped', 'Equipped'])
      expect(equippedArmor(next)).toBe('Plattenrüstung')
      expect(next.map((entry) => entry.weight)).toEqual([12, 25, 1])
      expect(equipment[0]?.carriedOn).toBe('Equipped')
   })
   it('unequips armor when moved away or removed', () => {
      expect(equippedArmor(normalizeArmorEquipment(equipment.map((entry) => ({ ...entry, carriedOn: 'Backpack' })), equipment))).toBeNull()
      expect(equippedArmor(normalizeArmorEquipment(equipment.slice(1), equipment))).toBeNull()
   })
   it('migrates an existing worn-armor selection only if no placement is explicitly equipped', () => {
      const legacy = equipment.map((entry) => ({ ...entry, carriedOn: 'Backpack' }))
      expect(normalizeArmorEquipment(legacy, [], 'Plattenrüstung')[1]?.carriedOn).toBe('Equipped')
      expect(equippedArmor(equipment, 'Plattenrüstung')).toBe('Kettenrüstung')
   })
   it('normalizes conflicting incoming placements to exactly one armor', () => {
      const next = normalizeArmorEquipment(equipment.map((entry) => ({ ...entry, carriedOn: 'Equipped' })))
      expect(next.filter((entry) => ['Kettenrüstung', 'Plattenrüstung'].includes(entry.item) && entry.carriedOn === 'Equipped')).toHaveLength(1)
   })
   it('ignores empty or unknown items instead of assigning invented armor penalties', () => {
      expect(equippedArmor([{ item: 'Invented armor', amount: 1, carriedOn: 'Equipped' }, { item: 'Kettenrüstung', amount: 0, carriedOn: 'Equipped' }])).toBeNull()
   })
})
