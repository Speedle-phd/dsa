import { describe, expect, it } from 'vitest'
import { calcBaseAttributes, calcBurden } from './baseAttributes'

describe('Tragkraft and Belastung from weight (S. 348)', () => {
   it('carries KK × 2 Stein without trouble', () => {
      expect(calcBaseAttributes.carryingCapacity(12)).toBe(24)
      expect(calcBurden(24, 24)).toBe(0)
   })
   it.each([[25, 0], [27, 0], [28, 1], [31, 1], [32, 2], [40, 4], [60, 4]])('%i Stein at Tragkraft 24 → Belastung %i (every 4 full Stein, at most IV)', (weight, level) => {
      expect(calcBurden(24, weight)).toBe(level)
   })
})
