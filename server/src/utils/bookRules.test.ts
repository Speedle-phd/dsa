import { describe, expect, it } from 'vitest'
import { applyCalendarAction, defaultBookRules, effectiveBookRules, normalizeBookRules } from './bookRules'

describe('book rules (user decision, Nov 2026)', () => {
   it('fills missing switches with off', () => {
      expect(normalizeBookRules(null)).toEqual(defaultBookRules)
      expect(normalizeBookRules({ adk: true })).toEqual({ ...defaultBookRules, adk: true })
   })
   it('a Fokusregel Stufe II needs its Stufe I, and every rule needs the book (AdK S. 278, 284)', () => {
      expect(normalizeBookRules({ adk: true, herbSearchRegions: true })).toMatchObject({ herbSearch: false, herbSearchRegions: false })
      expect(normalizeBookRules({ herbSearch: true, herbSearchRegions: true })).toMatchObject({ herbSearch: false, herbSearchRegions: false })
      expect(normalizeBookRules({ adk: true, shelfLife: true, shelfLifeParts: true })).toMatchObject({ shelfLife: true, shelfLifeParts: true })
   })
   it('the party switches win over the hero\'s own', () => {
      expect(effectiveBookRules({ adk: true }, { rules: { adk: false } }).adk).toBe(false)
      expect(effectiveBookRules({ adk: true }, null).adk).toBe(true)
   })
})

describe('calendar actions', () => {
   it('sets, advances and clears the day', () => {
      expect(applyCalendarAction(null, { action: 'set', day: 10 })).toEqual({ day: 10 })
      expect(applyCalendarAction(10, { action: 'advance', days: 7 })).toEqual({ day: 17 })
      expect(applyCalendarAction(10, { action: 'advance', days: -3 })).toEqual({ day: 7 })
      expect(applyCalendarAction(10, { action: 'clear' })).toEqual({ day: null })
   })
   it('needs a date before advancing and stays in range', () => {
      expect(applyCalendarAction(null, { action: 'advance', days: 1 })).toEqual({ error: 'Set a date first.' })
      expect(applyCalendarAction(2, { action: 'advance', days: -5 })).toEqual({ error: 'This date is out of range.' })
   })
})
