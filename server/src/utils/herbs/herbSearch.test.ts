import { describe, expect, it } from 'vitest'
import { herbByName, herbs } from './herbCatalog'
import { canSearchFor, landscapeSuggestions, plantCheckSources, qualityBenefits, searchPlan, searchYield } from './herbSearch'

const total = (sources: Array<{ value: number }>) => sources.reduce((sum, source) => sum + source.value, 0)

describe('Kräutersuche, book example 1: Bruder Hilbert and the Atan-Kiefer (AdK S. 276–278)', () => {
   // The example counts the Atan-Kiefer's Suchschwierigkeit as −2; its plant page (S. 15) prints −3
   it('Pflanzenkunde: Gebirge −1, Suchschwierigkeit −2, rain −1 = −4', () => {
      expect(total(plantCheckSources({ landscape: 'Gebirge', weather: 'rain', kind: 'specific', plantSearch: -2 }))).toBe(-4)
   })
   it('QS 4 either shortens the search by 4 hours with Sinnesschärfe +2, or gives 4 applications', () => {
      expect(qualityBenefits(4)).toEqual({ hours: 4, senses: 2 })
      expect(searchPlan({ kind: 'specific', quality: 4, use: 'improve' })).toEqual({ hours: 4, sensesModifier: 2, shortened: 0 })
      expect(searchPlan({ kind: 'specific', quality: 4, use: 'yield' })).toEqual({ hours: 8, sensesModifier: 0, shortened: 0 })
      expect(searchYield({ kind: 'specific', quality: 4, use: 'yield', applications: herbByName('Atan-Kiefer')?.applications })).toEqual({ species: 1, applications: 4 })
   })
})

describe('Kräutersuche, book example 2: Rowena in the Reichsforst (AdK S. 276–278)', () => {
   it('Pflanzenkunde: Wälder +1, general search −1 = ±0', () => {
      expect(total(plantCheckSources({ landscape: 'Wälder', weather: 'clear', kind: 'general' }))).toBe(0)
   })
   it('QS 2: two species with QS-1 applications each, or 8 instead of 10 hours and Sinnesschärfe +1', () => {
      expect(searchYield({ kind: 'general', quality: 2, use: 'yield' })).toEqual({ species: 2, applications: null })
      expect(searchPlan({ kind: 'general', quality: 2, use: 'improve' })).toEqual({ hours: 8, sensesModifier: 1, shortened: 0 })
   })
   it('only 4 of the 10 hours: Sinnesschärfe −3; under 2 hours finds nothing', () => {
      expect(searchPlan({ kind: 'general', quality: 2, use: 'yield', hoursTaken: 4 })).toEqual({ hours: 4, sensesModifier: -3, shortened: -3 })
      expect(searchPlan({ kind: 'general', quality: 2, use: 'yield', hoursTaken: 1 })).toHaveProperty('error')
   })
})

describe('Kräutersuche: QS table and the user decision for "improve"', () => {
   it('the best value reached counts (AdK S. 277)', () => {
      expect([0, 1, 2, 3, 4, 5, 6].map(qualityBenefits)).toEqual([
         { hours: 0, senses: 0 }, { hours: 2, senses: 0 }, { hours: 2, senses: 1 }, { hours: 4, senses: 1 },
         { hours: 4, senses: 2 }, { hours: 6, senses: 2 }, { hours: 6, senses: 3 },
      ])
   })
   it('with "improve" the yield is the minimum (user decision, Nov 2026)', () => {
      expect(searchYield({ kind: 'specific', quality: 5, use: 'improve', applications: [3, 3, 3, 4, 4, 5] })).toEqual({ species: 1, applications: 3 })
      expect(searchYield({ kind: 'general', quality: 5, use: 'improve' })).toEqual({ species: 1, applications: null })
   })
})

describe('Kräutersuche: what grows where (distribution table, AdK S. 262–266)', () => {
   it('suggests the plants of a landscape, most common first', () => {
      const forest = landscapeSuggestions(herbs, 'Wälder')
      expect(forest[0].frequency).toBe(5)
      expect(forest.every((entry, index) => index === 0 || entry.frequency <= forest[index - 1].frequency)).toBe(true)
      expect(forest.map((entry) => entry.key)).toContain('Wirselkraut')
      expect(forest.map((entry) => entry.key)).not.toContain('Atan-Kiefer')
      // a cave mushroom (remark "in Höhlen") comes after the forest plants of the same frequency
      expect(forest[0].note).toBeNull()
   })
   it('a specific search needs the plant in that landscape and in the wild', () => {
      const atan = herbByName('Atan-Kiefer')
      const malomis = herbByName('Malomis')
      expect(atan && canSearchFor(atan, 'Gebirge')).toBe(true)
      expect(atan && canSearchFor(atan, 'Wälder')).toBe(false)
      expect(malomis && canSearchFor(malomis, 'Wälder')).toBe(false)
   })
   it('every plant with a landscape type has distribution values (table rows read or corrected)', () => {
      expect(herbs.filter((herb) => herb.landscapes.length > 0 && !herb.distribution).map((herb) => herb.key)).toEqual([])
   })
})
