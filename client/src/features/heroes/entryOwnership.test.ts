import { describe, expect, it } from 'vitest'
import { entryAvailability } from './entryOwnership'

describe('entryAvailability', () => {
   it('hides a simple entry the hero has', () => {
      expect(entryAvailability(['Zauberer'], { key: 'Zauberer' }).available).toBe(false)
      expect(entryAvailability(['Zauberer'], { key: 'Zauberer (Test)' }).available).toBe(true)
   })
   it('offers only the levels above the owned one', () => {
      const item = { key: 'Hohe Astralkraft', levels: 7 }
      expect(entryAvailability(['Hohe Astralkraft III', 'Hohe Astralkraft IV'], item)).toMatchObject({ available: true, minLevel: 5 })
      expect(entryAvailability(['Hohe Astralkraft VII'], item).available).toBe(false)
      expect(entryAvailability(['Garethi III'], { key: 'Garethi', levels: 3 }).available).toBe(false)
   })
   it('removes owned subjects from a subject list', () => {
      const item = { key: 'Begabung', parameter: 'talent' }
      expect([...entryAvailability(['Begabung (Klettern)'], item).takenSubjects]).toEqual(['Klettern'])
      const choices = { key: 'Merkmalskenntnis', choices: ['Feuer', 'Eis'] }
      expect(entryAvailability(['Merkmalskenntnis (Feuer)', 'Merkmalskenntnis (Eis)'], choices).available).toBe(false)
   })
   it('keeps specializations and leveled subjects open', () => {
      expect(entryAvailability(['Fertigkeitsspezialisierung (Klettern: Bäume)'], { key: 'Fertigkeitsspezialisierung', parameter: 'specialization' }).takenSubjects.size).toBe(0)
      expect(entryAvailability(['Verpflichtungen (Orden) II'], { key: 'Verpflichtungen', parameter: 'text', levels: 3 }).available).toBe(true)
   })
})
