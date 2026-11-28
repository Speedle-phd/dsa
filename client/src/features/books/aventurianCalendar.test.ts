import { describe, expect, it } from 'vitest'
import { formatAventurianDate, fromAventurianDate, toAventurianDate } from './aventurianCalendar'

describe('Aventurian calendar (user decision, Nov 2026)', () => {
   it('counts 12 months of 30 days and 5 Namenlose Tage', () => {
      expect(toAventurianDate(0)).toEqual({ year: 0, month: 0, day: 1 })
      expect(toAventurianDate(359)).toEqual({ year: 0, month: 11, day: 30 })
      expect(toAventurianDate(360)).toEqual({ year: 0, month: 12, day: 1 })
      expect(toAventurianDate(364)).toEqual({ year: 0, month: 12, day: 5 })
      expect(toAventurianDate(365)).toEqual({ year: 1, month: 0, day: 1 })
   })
   it('converts both ways and rejects dates that do not exist', () => {
      const day = fromAventurianDate({ year: 1045, month: 9, day: 3 })
      expect(day).not.toBeNull()
      expect(toAventurianDate(day ?? 0)).toEqual({ year: 1045, month: 9, day: 3 })
      expect(fromAventurianDate({ year: 1045, month: 0, day: 31 })).toBeNull()
      expect(fromAventurianDate({ year: 1045, month: 12, day: 6 })).toBeNull()
   })
   it('formats German and English', () => {
      const day = fromAventurianDate({ year: 1045, month: 9, day: 3 }) ?? 0
      expect(formatAventurianDate(day, 'de')).toBe('3. Peraine 1045 BF')
      expect(formatAventurianDate(day, 'en')).toBe('3 Peraine 1045 BF')
      expect(formatAventurianDate(fromAventurianDate({ year: 1045, month: 12, day: 2 }) ?? 0, 'de')).toBe('2. Namenloser Tag 1045 BF')
   })
})
