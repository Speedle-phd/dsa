import { describe, expect, it } from 'vitest'
import type { Herb } from './herbApi'
import { landscapeSuggestions, searchPlan, searchYield } from './herbSearchRules'

describe('Kräutersuche in the dialog (AdK S. 276–278, mirrors the server)', () => {
   it('Bruder Hilbert, QS 4: 4 hours instead of 8 and Sinnesschärfe +2, or 4 applications', () => {
      expect(searchPlan(8, 4, 'improve')).toEqual({ hours: 4, taken: 4, senses: 2, shortened: 0, valid: true })
      expect(searchYield('specific', 4, 'yield', [1, 2, 3, 4, 5, 6])).toEqual({ species: 1, applications: 4 })
   })
   it('Rowena with only 4 of 10 hours: Sinnesschärfe −3; two species with "yield", one with "improve"', () => {
      expect(searchPlan(10, 2, 'yield', 4)).toMatchObject({ taken: 4, shortened: -3, valid: true })
      expect(searchYield('general', 2, 'yield').species).toBe(2)
      expect(searchYield('general', 2, 'improve').species).toBe(1)
   })
   it('suggests the plants of a landscape by frequency, then by Suchschwierigkeit', () => {
      const herb = (key: string, frequency: number | null, search: number | null) =>
         ({ key, search, distribution: [frequency, null, null, null, null, null, null, null] }) as unknown as Herb
      const list = landscapeSuggestions([herb('A', 2, -1), herb('B', 5, -4), herb('C', 5, -1), herb('D', null, 0), herb('E', 5, null)], 0)
      expect(list.map((entry) => entry.herb.key)).toEqual(['C', 'B', 'A'])
   })
})
