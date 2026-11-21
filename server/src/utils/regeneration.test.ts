import { describe, expect, it } from 'vitest'
import { calcRegeneration, entryLevel, type RegenerationSituation } from './regeneration'

const calm: RegenerationSituation = {
   campsite: 'normal', interruption: 'none', environment: 'normal', poisonedOrSick: false,
   ironStone: 0, treatmentQuality: 0, otherModifier: 0, reducedHealth: false,
}
const none = { advantages: [], disadvantages: [] }
const amount = (...args: Parameters<typeof calcRegeneration>) => calcRegeneration(...args).amount

describe('Regeneration (S. 339)', () => {
   it.each([
      ['Layariel, first phase: 1W6 = 4', 4, calm, 4],
      ['Layariel, good lodging: 6 + 1', 6, { ...calm, campsite: 'good' as const }, 7],
      ['bad campsite −1', 3, { ...calm, campsite: 'bad' as const }, 2],
      ['short interruption −1', 3, { ...calm, interruption: 'short' as const }, 2],
      ['long interruption −2', 3, { ...calm, interruption: 'long' as const }, 1],
      ['negative results count as 0', 1, { ...calm, campsite: 'bad' as const, interruption: 'long' as const }, 0],
      ['bad environment halves after modifiers, rounded down', 6, { ...calm, campsite: 'good' as const, environment: 'bad' as const }, 3],
      ['bad environment, odd result', 5, { ...calm, environment: 'bad' as const }, 2],
      ['terrible environment: no regeneration', 6, { ...calm, environment: 'terrible' as const }, 0],
   ])('%s', (_, roll, situation, expected) => {
      expect(amount('health', roll, situation, none)).toBe(expected)
   })

   it('Vergiftet/Krank blocks LeP only (table, S. 339)', () => {
      const sick = { ...calm, poisonedOrSick: true, treatmentQuality: 2 }
      expect(amount('health', 6, sick, none)).toBe(0)
      expect(amount('mana', 6, sick, none)).toBe(6)
   })
})

describe('Regeneration advantages (S. 169, 176–177)', () => {
   it('Verbesserte Regeneration adds 1 per level for its energy only', () => {
      const entries = { advantages: ['Verbesserte Regeneration (Astralenergie) II'], disadvantages: [] }
      expect(amount('mana', 3, calm, entries)).toBe(5)
      expect(amount('health', 3, calm, entries)).toBe(3)
   })

   it('Schlechte Regeneration subtracts 1 per level, minimum 0', () => {
      const entries = { advantages: [], disadvantages: ['Schlechte Regeneration (Lebensenergie) III'] }
      expect(amount('health', 5, calm, entries)).toBe(2)
      expect(amount('health', 2, calm, entries)).toBe(0)
   })

   it.each([
      [['Verbesserte Regeneration (Lebensenergie)'], 1],
      [['Verbesserte Regeneration (Lebensenergie) III'], 3],
      [['Verbesserte Regeneration (Astralenergie) II'], 0],
      [[], 0],
   ])('entry level of %j is %i', (entries, level) => {
      expect(entryLevel(entries, 'Verbesserte Regeneration (Lebensenergie)')).toBe(level)
   })
})

describe('Bann des Eisens (S. 256)', () => {
   it.each([[1.5, 3], [2, 2], [5, 1], [8, 0]])('%s Stein iron reduces AsP from 3 to %i', (ironStone, expected) => {
      expect(amount('mana', 3, { ...calm, ironStone }, none)).toBe(expected)
   })

   it('does not affect LeP', () => {
      expect(amount('health', 3, { ...calm, ironStone: 4 }, none)).toBe(3)
   })
})

describe('Heilkunde Wunden treatment (S. 340)', () => {
   it('adds the QS to LeP on top of regeneration, not halved', () => {
      expect(amount('health', 5, { ...calm, environment: 'bad', treatmentQuality: 2 }, none)).toBe(4)
      expect(amount('mana', 5, { ...calm, treatmentQuality: 2 }, none)).toBe(5)
   })
})

describe('Weniger Regeneration, optional rule (S. 340)', () => {
   it.each([[1, 1], [2, 1], [3, 2], [6, 3]])('W6 %i counts as W3 %i', (roll, expected) => {
      expect(amount('health', roll, { ...calm, reducedHealth: true }, none)).toBe(expected)
   })

   it('ignores LeP bonus points but keeps penalties', () => {
      const entries = { advantages: ['Verbesserte Regeneration (Lebensenergie) II'], disadvantages: [] }
      expect(amount('health', 6, { ...calm, reducedHealth: true, campsite: 'good' }, entries)).toBe(3)
      expect(amount('health', 6, { ...calm, reducedHealth: true, campsite: 'bad' }, none)).toBe(2)
   })

   it('leaves AsP unchanged', () => {
      expect(amount('mana', 6, { ...calm, reducedHealth: true }, none)).toBe(6)
   })
})
