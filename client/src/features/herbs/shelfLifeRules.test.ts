import { describe, expect, it } from 'vitest'
import { durationLabel, expiryDay, isSpoiled } from './shelfLifeRules'

const tables = { coreShelfDays: 90, rawShelfDays: 7 }
const raw = { form: 'raw' as const, obtainedDay: 100, keepsUntilDay: null }

describe('Haltbarkeit in the client (mirrors the server, AdK S. 284–286)', () => {
   it('core rule 3 months; with Haltbarmachung raw plants keep 1 week (user decision)', () => {
      expect(expiryDay(raw, false, tables)).toBe(190)
      expect(expiryDay(raw, true, tables)).toBe(107)
      expect(isSpoiled(raw, true, tables, 108)).toBe(true)
      expect(isSpoiled(raw, true, tables, null)).toBe(false)
   })
   it('lasting plants (viele Jahre) never spoil; processed ones without a date keep 3 months', () => {
      expect(isSpoiled({ form: 'preserved', obtainedDay: 100, keepsUntilDay: null, lasting: true }, true, tables, 5000)).toBe(false)
      expect(isSpoiled({ form: 'preserved', obtainedDay: 100, keepsUntilDay: null }, true, tables, 191)).toBe(true)
   })
   it('a recorded date wins', () => {
      expect(expiryDay({ form: 'preserved', obtainedDay: 100, keepsUntilDay: 400 }, true, tables)).toBe(400)
   })
   it('labels durations of the part table', () => {
      expect(durationLabel(90, 'de')).toBe('3 Monate')
      expect(durationLabel(1, 'de')).toBe('1 Tag')
      expect(durationLabel(null, 'en')).toBe('many years')
   })
})
