import { describe, expect, it } from 'vitest'
import { allyDamage, allyDefensePenalty, radauFighter } from './fightAllies'

describe('Radau broom (S. 297)', () => {
   it.each([[1, 11, 6], [2, 12, 6], [5, 15, 8], [6, 16, 8]])('QS %i: AT %i, PA against Haltegriff %i', (quality, attack, parry) => {
      const broom = radauFighter(quality)
      expect(broom.attacks).toEqual([expect.objectContaining({ attack, damage: '1W6+3', perRound: 1 })])
      expect(broom.defenses).toEqual([expect.objectContaining({ label: 'PA', value: parry, penalty: true })])
   })
   it('is unbreakable: no LeP, no armor needed, no maneuvers', () => {
      expect(radauFighter(3)).toMatchObject({ health: null, abilities: '' })
   })
})

describe('Ally defenses (S. 232, 354)', () => {
   it('PA and AW are 3 harder per earlier defense in the KR', () => {
      const parry = { key: 'PA', label: 'PA', value: 8, penalty: true }
      expect([0, 1, 2].map((count) => allyDefensePenalty(parry, count))).toEqual([0, 3, 6])
   })
   it('a VW is not lowered by several defenses', () => {
      expect(allyDefensePenalty({ key: 'VW', label: 'VW', value: 9, penalty: false }, 3)).toBe(0)
   })
})

describe('Damage to allies (S. 234, 355, 358)', () => {
   it('subtracts RS from TP', () => {
      expect(allyDamage(10, 2, false)).toBe(8)
      expect(allyDamage(2, 3, false)).toBe(0)
   })
   it('halves TP of mundane weapons before RS for demons and elementals', () => {
      expect(allyDamage(15, 2, true)).toBe(6)
      expect(allyDamage(14, 2, true)).toBe(5)
      expect(allyDamage(3, 2, true)).toBe(0)
   })
})
