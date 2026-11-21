import { describe, expect, it } from 'vitest'
import { consumeAmmunition } from './ammunition'

const quiver = (amount: number, carriedOn = 'Belt') => ({ item: 'Pfeile', amount, carriedOn, weight: 0 })

describe('Ammunition per shot (S. 246, 373)', () => {
   it('uses one carried arrow per shot', () => {
      const result = consumeAmmunition([quiver(20)], 'Pfeile')
      expect(result).toMatchObject({ ok: true, left: 19 })
      expect(result.ok && result.equipment[0].amount).toBe(19)
   })
   it('removes the entry when the last projectile is shot', () => {
      const result = consumeAmmunition([quiver(1), { item: 'Seil', amount: 1, carriedOn: 'Backpack', weight: 1 }], 'Pfeile')
      expect(result.ok && result.equipment.map((entry) => entry.item)).toEqual(['Seil'])
   })
   it('cannot shoot stashed or missing ammunition', () => {
      expect(consumeAmmunition([quiver(10, 'Stash')], 'Pfeile').ok).toBe(false)
      expect(consumeAmmunition([quiver(10)], 'Bolzen').ok).toBe(false)
      expect(consumeAmmunition([quiver(0)], 'Pfeile').ok).toBe(false)
   })
})
