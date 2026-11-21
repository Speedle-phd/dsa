import { describe, expect, it } from 'vitest'
import { carriedEquipmentWeight, resolvePlacement, stowPlacement } from './containers'

const pack = { item: 'Lederrucksack', amount: 1, weight: 2, carriedOn: 'Equipped' }
const rope = { item: 'Kletterseil', amount: 1, weight: 5, carriedOn: 'Lederrucksack' }

describe('Containers (S. 376–377, 381; app storage policy)', () => {
   it('counts items in a worn container where the container is', () => {
      expect(carriedEquipmentWeight([pack, rope])).toBe(7)
      expect(carriedEquipmentWeight([{ ...pack, carriedOn: 'Stash' }, rope])).toBe(0)
   })
   it('follows nested containers', () => {
      const pouch = { item: 'Tuchbeutel', amount: 1, weight: 0.5, carriedOn: 'Lederrucksack' }
      const gem = { item: 'Rubin, 10 Karat', amount: 1, weight: 0.002, carriedOn: 'Tuchbeutel' }
      expect(resolvePlacement(gem.carriedOn, [{ ...pack, carriedOn: 'Stash' }, pouch, gem])).toBe('stash')
      expect(resolvePlacement(gem.carriedOn, [pack, pouch, gem])).toBe('carried')
   })
   it('does not count items in external containers (chest, saddle bags, vehicles)', () => {
      const cart = { item: 'Bollerwagen', amount: 1, weight: 0, carriedOn: 'Other' }
      expect(carriedEquipmentWeight([cart, { ...rope, carriedOn: 'Bollerwagen' }])).toBe(0)
   })
   it('keeps the contents of a missing container with the hero', () => {
      expect(carriedEquipmentWeight([rope])).toBe(5)
   })
   it('lays replaced armor down under Other', () => {
      expect(stowPlacement).toBe('Other')
   })
})
