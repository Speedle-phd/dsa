import { describe, expect, it } from 'vitest'
import { availableTricks, companionPain, companionTalentTargets, effectiveCompanion, newCompanion } from './companionRules'

// Printed check values from the stat blocks.
const printed: Record<string, Record<string, number[]>> = {
   Hund: { koerperbeherrschung: [14, 14, 9], kraftakt: [9, 10, 10], schwimmen: [14, 9, 10], selbstbeherrschung: [12, 12, 9],
      sinnesschaerfe: [11, 14, 14], verbergen: [12, 14, 14], einschuechtern: [12, 14, 13], willenskraft: [12, 14, 13] },
   Pferd: { koerperbeherrschung: [14, 14, 22], kraftakt: [22, 24, 24], schwimmen: [14, 22, 24], selbstbeherrschung: [10, 10, 22],
      sinnesschaerfe: [10, 12, 12], verbergen: [10, 12, 14], einschuechtern: [10, 12, 12], willenskraft: [10, 12, 12] },
   Katze: { klettern: [12, 14, 13], koerperbeherrschung: [14, 14, 6], kraftakt: [6, 13, 13], schwimmen: [14, 6, 13], selbstbeherrschung: [12, 12, 6],
      sinnesschaerfe: [12, 13, 13], verbergen: [12, 13, 14], einschuechtern: [12, 13, 12], willenskraft: [12, 13, 12] },
   Kröte: { klettern: [16, 8, 9], koerperbeherrschung: [8, 8, 4], kraftakt: [4, 9, 9], schwimmen: [8, 4, 9], selbstbeherrschung: [16, 16, 4],
      sinnesschaerfe: [8, 12, 12], verbergen: [16, 12, 8], einschuechtern: [16, 12, 10], willenskraft: [16, 12, 10] },
   Rabe: { fliegen: [12, 10, 9], koerperbeherrschung: [10, 10, 6], kraftakt: [6, 9, 9], schwimmen: [10, 6, 9], selbstbeherrschung: [12, 12, 6],
      sinnesschaerfe: [16, 12, 12], verbergen: [12, 12, 10], einschuechtern: [12, 12, 11], willenskraft: [12, 12, 11] },
}

describe('Animal talent checks match the printed stat blocks (S. 360–362)', () => {
   for (const [species, checks] of Object.entries(printed)) {
      it(species, () => {
         const companion = newCompanion(species, species, false)
         for (const [key, values] of Object.entries(checks)) expect(companionTalentTargets(companion, key), key).toEqual(values)
      })
   }
   it('raises every check value by 1 for a familiar (S. 279)', () => {
      expect(companionTalentTargets(newCompanion('Katze', 'Mira', true), 'klettern')).toEqual([13, 15, 14])
   })
})

describe('Familiar bonuses (S. 279)', () => {
   it('adds +1 attributes, +10 LeP, +1 RS/SK/ZK and 15 AsP and starts at full energy', () => {
      const cat = newCompanion('Katze', 'Mira', true)
      expect(effectiveCompanion(cat)).toEqual({
         attributes: { courage: 13, wisdom: 13, intuition: 14, charisma: 13, fingerDexterity: 11, dexterity: 15, constitution: 7, strength: 14 },
         maxHealth: 20, maxMana: 15, armor: 1, soulPower: 2, toughness: -1,
      })
      expect(cat.health.current).toBe(20)
      expect(cat.mana.current).toBe(15)
   })
   it('gives a normal animal no bonus and no AsP', () => {
      const dog = newCompanion('Hund', 'Rex', false)
      expect(effectiveCompanion(dog)).toMatchObject({ maxHealth: 13, maxMana: 0, armor: 0, soulPower: 1, toughness: 0 })
   })
})

describe('Animal Schmerz (S. 34, 360–362)', () => {
   const at = (species: string, current: number, familiar = false) => {
      const companion = newCompanion(species, species, familiar)
      companion.health.current = current
      return companionPain(companion)
   }
   it.each([
      ['Hund', 13, 0], ['Hund', 10, 1], ['Hund', 7, 2], ['Hund', 4, 3], ['Hund', 1, 4], ['Hund', 0, 4],
      ['Pferd', 50, 0], ['Pferd', 49, 1], ['Pferd', 16, 3], ['Pferd', 5, 4],
      ['Katze', 9, 0], ['Katze', 8, 1], ['Katze', 2, 4],
      ['Kröte', 2, 0], ['Kröte', 1, 4],
      ['Rabe', 5, 0], ['Rabe', 3, 2], ['Rabe', 1, 4],
   ])('%s at %i LeP: Schmerz %i (printed table)', (species, current, pain) => expect(at(species, current)).toBe(pain))
   it.each([[20, 0], [15, 1], [10, 2], [5, 4]])('familiar cat (20 LeP) at %i LeP: Schmerz %i (hero rule, user decision)', (current, pain) =>
      expect(at('Katze', current, true)).toBe(pain))
})

describe('Familiar tricks (S. 279–280)', () => {
   it('limits toad tricks to toads and gives normal animals none', () => {
      expect(availableTricks({ species: 'Kröte', familiar: true }).map((entry) => entry.key)).toContain('Krötenschlag')
      expect(availableTricks({ species: 'Rabe', familiar: true }).map((entry) => entry.key)).not.toContain('Tarnung')
      expect(availableTricks({ species: 'Hund', familiar: false })).toEqual([])
   })
})
