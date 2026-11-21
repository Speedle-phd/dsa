import { describe, expect, it } from 'vitest'
import { repairWeapon, setWeaponCondition } from './weaponCondition'

const sword = { item: 'Langschwert', amount: 1, carriedOn: 'Equipped' }
const daggers = { item: 'Dolch', amount: 3, carriedOn: 'Belt' }

describe('Weapon condition from Patzer tables (S. 231, 234, 243–244)', () => {
   it('marks a single weapon damaged or broken', () => {
      expect(setWeaponCondition([sword], 0, 'Langschwert', 'broken')).toEqual([{ ...sword, condition: 'broken' }])
   })
   it('splits a stack so only one piece is damaged', () => {
      expect(setWeaponCondition([daggers], 0, 'Dolch', 'damaged')).toEqual([{ ...daggers, amount: 2 }, { ...daggers, amount: 1, condition: 'damaged' }])
   })
   it('a destroyed weapon leaves the inventory', () => {
      expect(setWeaponCondition([sword, daggers], 0, 'Langschwert', 'destroyed')).toEqual([daggers])
      expect(setWeaponCondition([daggers], 0, 'Dolch', 'destroyed')).toEqual([{ ...daggers, amount: 2 }])
   })
   it('rejects a mismatched entry', () => {
      expect(setWeaponCondition([sword], 0, 'Dolch', 'broken')).toBeNull()
      expect(setWeaponCondition([sword], 3, 'Langschwert', 'broken')).toBeNull()
   })
   it('repair clears the condition; an intact weapon cannot be repaired', () => {
      expect(repairWeapon([{ ...sword, condition: 'broken' as const }], 0, 'Langschwert')).toEqual([sword])
      expect(repairWeapon([sword], 0, 'Langschwert')).toBeNull()
   })
})
