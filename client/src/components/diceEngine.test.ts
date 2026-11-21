import { describe, expect, it } from 'vitest'
import { physicalDie } from './diceEngine'

describe('physicalDie', () => {
   it('throws the real die where one exists', () => {
      expect(physicalDie(20)).toMatchObject({ sides: 20 })
      expect(physicalDie(6)?.value(4)).toBe(4)
   })
   it('throws a W6 for W3 and W2 (e.g. Schnabel 1W3−1)', () => {
      const w3 = physicalDie(3)!
      expect(w3.sides).toBe(6)
      expect([1, 2, 3, 4, 5, 6].map(w3.value)).toEqual([1, 1, 2, 2, 3, 3])
      expect([1, 2, 3, 4, 5, 6].map(physicalDie(2)!.value)).toEqual([1, 1, 1, 2, 2, 2])
   })
   it('has no physical die for other sizes', () => {
      expect(physicalDie(7)).toBeNull()
   })
})
