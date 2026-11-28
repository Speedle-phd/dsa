import { describe, expect, it } from 'vitest'
import { expiryDay, isSpoiled, plantParts, preservedByCheck, preservedByMethod } from './shelfLife'

const raw = (obtainedDay: number | null) => ({ form: 'raw' as const, obtainedDay, keepsUntilDay: null })

describe('Haltbarkeit without the focus rule (RW S. 345, AdK S. 284)', () => {
   it('plants keep 3 months from the day they were obtained', () => {
      expect(expiryDay(raw(100), { shelfLife: false })).toBe(190)
      expect(isSpoiled(raw(100), { shelfLife: false }, 190)).toBe(false)
      expect(isSpoiled(raw(100), { shelfLife: false }, 191)).toBe(true)
   })
   it('without a recorded day or calendar nothing spoils', () => {
      expect(expiryDay(raw(null), { shelfLife: false })).toBeNull()
      expect(isSpoiled(raw(100), { shelfLife: false }, null)).toBe(false)
   })
})

describe('Haltbarmachung, Fokusregel I (AdK S. 284)', () => {
   it('raw plants keep 1 week (user decision, Nov 2026)', () => {
      expect(expiryDay(raw(100), { shelfLife: true })).toBe(107)
   })
   it('bought or made plants keep the core 3 months unless a date is recorded', () => {
      expect(expiryDay({ form: 'preserved', obtainedDay: 100, keepsUntilDay: null }, { shelfLife: true })).toBe(190)
      expect(expiryDay({ form: 'preserved', obtainedDay: 100, keepsUntilDay: 140 }, { shelfLife: true })).toBe(140)
   })
   it('a check preserves for 1 month + 1 per QS; a critical success doubles it', () => {
      expect(preservedByCheck(100, 0, false)).toBe(130)
      expect(preservedByCheck(100, 3, false)).toBe(220)
      expect(preservedByCheck(100, 3, true)).toBe(340)
   })
})

describe('Haltbarkeit von Pflanzenteilen, Fokusregel II (AdK S. 285–286)', () => {
   it('book example: Bruder Hilbert pickles blossoms in alcohol, they keep 3 months instead of 24 hours', () => {
      const flowers = plantParts.find((part) => part.key === 'flowers')
      expect(flowers?.rawDays).toBe(1)
      expect(preservedByMethod(100, 'flowers', 'pickle')).toEqual({ keepsUntilDay: 190, lasting: false })
   })
   it('resin hardens for many years (no end); unknown methods are refused', () => {
      expect(preservedByMethod(100, 'resin', 'harden')).toEqual({ keepsUntilDay: null, lasting: true })
      // "viele Jahre" never spoils, also long after the core 3 months
      const resin = { form: 'preserved' as const, obtainedDay: 100, keepsUntilDay: null, lasting: true }
      expect(expiryDay(resin, { shelfLife: true })).toBeNull()
      expect(isSpoiled(resin, { shelfLife: true }, 100 + 3650)).toBe(false)
      // a processed plant bought without a date keeps the core 3 months
      expect(isSpoiled({ form: 'preserved', obtainedDay: 100, keepsUntilDay: null }, { shelfLife: true }, 191)).toBe(true)
      expect(preservedByMethod(100, 'leaves', 'pickle')).toHaveProperty('error')
   })
   it('the table has its 14 plant parts, each with at least one method', () => {
      expect(plantParts).toHaveLength(14)
      expect(plantParts.every((part) => part.methods.length > 0)).toBe(true)
   })
})
