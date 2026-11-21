import { describe, expect, it } from 'vitest'
import { advancementCost } from './advancement'

describe('Advancement costs and manual corrections (S. 50)', () => {
   it.each([
      [7, 8, 'c', 3],
      [12, 14, 'b', 10],
      [14, 16, 'e', 75],
      [null, 0, 'b', 2],
      [null, 2, 'b', 6],
      [10, 10, 'e', 0],
   ] as const)('charges %s → %s, factor %s: %s AP', (current, target, factor, expected) => {
      expect(advancementCost(current, target, factor, true)).toBe(expected)
   })
   it.each([[14, 8], [8, 14], [null, 10]] as const)('keeps AP unchanged for %s → %s', (current, target) => {
      expect(advancementCost(current, target, 'e', false)).toBe(0)
   })
   it('does not turn a paid decrease into an untracked refund', () => {
      expect(() => advancementCost(14, 8, 'e', true)).toThrow('Disable Spend AP')
   })
   it.each([-1, 26, 1.5, NaN])('rejects invalid corrections: %s', (target) => {
      expect(() => advancementCost(8, target, 'b', false)).toThrow('whole number')
   })
})
