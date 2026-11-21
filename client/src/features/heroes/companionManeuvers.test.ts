import { describe, expect, it } from 'vitest'
import { availableManeuvers, heldBiteBonus, maneuverDamage, maneuverPenalty } from './companionManeuvers'

describe('Creature manoeuvres Flugangriff and Verbeißen (S. 362)', () => {
   it('are offered only when the stat block lists them; Verbeißen only for a bite', () => {
      expect(availableManeuvers('Verbeißen', 'Biss')).toEqual(['Verbeißen'])
      expect(availableManeuvers('Verbeißen', 'Tritt')).toEqual([])
      expect(availableManeuvers('', 'Schnabel')).toEqual([])
      expect(availableManeuvers('Flugangriff, Sturmangriff (Biss, Klauen)', 'Klauen')).toEqual(['Flugangriff'])
   })
   it('both cost AT −2; Flugangriff adds +2 TP', () => {
      expect([maneuverPenalty('none'), maneuverPenalty('Flugangriff'), maneuverPenalty('Verbeißen')]).toEqual([0, -2, -2])
      expect([maneuverDamage('Flugangriff'), maneuverDamage('Verbeißen'), maneuverDamage('none')]).toEqual([2, 0, 0])
   })
   it.each([[1, 0], [2, 1], [3, 2], [5, 4]])('held bite in KR %i: +%i TP', (round, bonus) => {
      expect(heldBiteBonus(round)).toBe(bonus)
   })
})
