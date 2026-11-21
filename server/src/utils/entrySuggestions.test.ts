import { describe, expect, it } from 'vitest'
import { characterEntryCatalog } from './characterEntryCatalog'
import { entrySuggestions } from './entrySuggestions'

describe('entry subject suggestions (S. 167–179, 321)', () => {
   it('belong to catalog entries with a free-text subject', () => {
      for (const key of Object.keys(entrySuggestions)) {
         const entry = characterEntryCatalog.find((item) => item.key === key)
         expect(entry?.parameter, key).toBe('text')
         expect(entry?.suggestions?.length, key).toBeGreaterThan(0)
      }
   })
   it('keep suggested levels inside the entry levels', () => {
      for (const entry of characterEntryCatalog) {
         for (const suggestion of entry.suggestions ?? []) if (suggestion.level) expect(suggestion.level).toBeLessThanOrEqual(entry.levels ?? 1)
      }
   })
   it('suggest Rondrakirche for Prinzipientreue II and Feuer for Angst vor', () => {
      expect(entrySuggestions.Prinzipientreue).toContainEqual({ value: 'Rondrakirche', level: 2 })
      expect(entrySuggestions['Angst vor']).toContainEqual({ value: 'Feuer' })
   })
   it('lists the aspects of the churches for Aspektkenntnis', () => {
      expect(entrySuggestions.Aspektkenntnis).toContainEqual({ value: 'Schild', label: 'Schild (Rondra)' })
   })
})
