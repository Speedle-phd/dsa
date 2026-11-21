import { describe, expect, it } from 'vitest'
import { combatTechniqueMaximum, talentMaximum } from './skillMaximum'

const hero = (advantages: string[] = []) => ({
   courage: 13, wisdom: 10, intuition: 12, charisma: 11, fingerDexterity: 14, dexterity: 12, constitution: 11, strength: 15, advantages,
})

describe('Fertigkeit maximum = highest probe attribute + 2 (S. 39), Herausragende Fertigkeit (S. 166)', () => {
   it.each([
      ['klettern', [], 17],
      ['klettern', ['Herausragende Fertigkeit (klettern)'], 18],
      ['klettern', ['Herausragende Fertigkeit (klettern) II'], 19],
      ['klettern', ['Herausragende Fertigkeit (reiten) II'], 17],
      ['magiekunde', [], 14],
   ])('%s with %j → %i', (key, advantages, maximum) => {
      expect(talentMaximum(hero(advantages), key)).toBe(maximum)
   })
   it('returns null for an unknown talent', () => {
      expect(talentMaximum(hero(), 'invented')).toBeNull()
   })
})

describe('Kampftechnik maximum = Leiteigenschaft + 2 (S. 39), Herausragende Kampftechnik +1 (S. 166)', () => {
   it.each([
      ['Bögen', [], 16],
      ['Bögen', ['Herausragende Kampftechnik (Bögen)'], 17],
      ['Bögen', ['Herausragende Kampftechnik (Schwerter)'], 16],
      ['Schwerter', [], 17],
   ])('%s with %j → %i', (key, advantages, maximum) => {
      expect(combatTechniqueMaximum(hero(advantages), key)).toBe(maximum)
   })
})
