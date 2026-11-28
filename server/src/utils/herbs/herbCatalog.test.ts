import { describe, expect, it } from 'vitest'
import { herbByName, herbs } from './herbCatalog'
import { herbSummaries } from './herbSummaries'
import { herbEffectTypes } from './herbTypes'

describe('Archiv der Kräuter plants (AdK S. 11–142)', () => {
   it('has all 132 plant pages in book order with unique names', () => {
      expect(herbs).toHaveLength(132)
      expect(new Set(herbs.map((herb) => herb.key)).size).toBe(132)
      expect(herbs[0]).toMatchObject({ key: 'Alraune', page: 11 })
      expect(herbs.at(-1)).toMatchObject({ key: 'Zwölfblatt', page: 142 })
      expect(herbs.every((herb, index) => index === 0 || herb.page >= herbs[index - 1].page)).toBe(true)
   })
   it('reads the values of a plant page (Wirselkraut, AdK S. 136)', () => {
      expect(herbByName('Wirselkraut')).toMatchObject({
         search: -1, identify: -2, applications: [3, 3, 3, 4, 4, 5], price: { raw: 2, processed: 2.2 },
         effectTypes: ['Heilung'],
      })
   })
   it('every plant has an effect type, and applications as six numbers or a note', () => {
      for (const herb of herbs) {
         expect(herb.effectTypes.length, herb.key).toBeGreaterThan(0)
         expect(herb.effectTypes.every((type) => herbEffectTypes.includes(type)), herb.key).toBe(true)
         expect(herb.applications === null ? herb.applicationsNote : herb.applications.length, herb.key).toBeTruthy()
      }
   })
   it('maps the book landscape to the search landscapes', () => {
      expect(herbByName('Atan-Kiefer')?.landscapes).toEqual(['Gebirge'])
      expect(herbByName('Dergolasch')?.landscapes).toEqual(['Höhlen'])
      expect(herbByName('Wandermoos')?.landscapes).toEqual(['Höhlen'])
      expect(herbByName('Alveranie')?.landscapes).toHaveLength(8)
      expect(herbByName('Chonchinis')?.landscapes).not.toContain('Wüstenrandgebiete und Wüsten')
      expect(herbByName('Boronsschlinge')?.landscapes).toEqual(['Wälder', 'Regenwälder'])
   })
   it('every plant has a summary with its knowledge (all six batches written)', () => {
      expect(herbs.filter((herb) => !herb.summary).map((herb) => herb.key)).toEqual([])
      expect(herbs.filter((herb) => herb.summary?.knowledge.length !== 3).map((herb) => herb.key)).toEqual([])
   })
   it('a summary covers every raw route the plant page gives', () => {
      for (const herb of herbs.filter((entry) => entry.summary)) {
         expect(herb.rawRoutes.filter((route) => !herb.summary?.[route]), herb.key).toEqual([])
      }
   })
   it('summaries name only existing plants and give the three knowledge levels', () => {
      for (const [name, summary] of Object.entries(herbSummaries)) {
         expect(herbByName(name), name).not.toBeNull()
         expect(summary.knowledge.length, name).toBeGreaterThanOrEqual(1)
         expect(summary.knowledge.length, name).toBeLessThanOrEqual(3)
      }
   })
})
