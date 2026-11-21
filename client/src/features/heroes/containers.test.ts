import { describe, expect, it } from 'vitest'
import { haggleRate, withRate } from '@/utils/storePricing'
import { carriedEquipmentWeight, defaultPlacement, placementOptions, releaseContents } from './containers'

const quiver = 'Köcher, für 20 Pfeile oder Bolzen'
const entry = (item: string, carriedOn: string, amount = 1, weight = 0) => ({ item, carriedOn, amount, weight })
const values = (options: ReturnType<typeof placementOptions>) => options.map((option) => option.value)

describe('Placements and containers (S. 374–377, 381)', () => {
   it('always offers Angelegt, Lager and Sonstiges', () => {
      expect(values(placementOptions([], 'Seil', 1))).toEqual(['Equipped', 'Stash', 'Other'])
   })
   it('offers worn containers only while they are equipped (or inside an equipped container)', () => {
      expect(values(placementOptions([entry('Lederrucksack', 'Stash')], 'Seil', 1))).not.toContain('Lederrucksack')
      const gear = [entry('Lederrucksack', 'Equipped'), entry('Tuchbeutel', 'Lederrucksack')]
      expect(values(placementOptions(gear, 'Seil', 1))).toEqual(expect.arrayContaining(['Lederrucksack', 'Tuchbeutel']))
   })
   it('offers owned external containers wherever they are', () => {
      expect(values(placementOptions([entry('Truhe', 'Stash')], 'Seil', 1))).toContain('Truhe')
   })
   it('never puts a container into itself or into something it holds', () => {
      const gear = [entry('Lederrucksack', 'Equipped'), entry('Tuchbeutel', 'Lederrucksack')]
      expect(values(placementOptions(gear, 'Lederrucksack', 1))).not.toEqual(expect.arrayContaining(['Lederrucksack']))
      expect(values(placementOptions(gear, 'Lederrucksack', 1))).not.toContain('Tuchbeutel')
   })
   it('a quiver takes 20 arrows or bolts and nothing else (S. 374)', () => {
      const gear = [entry(quiver, 'Equipped'), entry('Pfeile', quiver, 15)]
      expect(placementOptions(gear, 'Pfeile', 5).find((option) => option.value === quiver)?.full).toBe(false)
      expect(placementOptions(gear, 'Pfeile', 6).find((option) => option.value === quiver)?.full).toBe(true)
      expect(values(placementOptions(gear, 'Seil', 1))).not.toContain(quiver)
      expect(defaultPlacement([entry(quiver, 'Equipped'), entry('Lederrucksack', 'Equipped')], 'Pfeile', 10)).toBe(quiver)
   })
   it('sheaths take weapons of their technique', () => {
      const gear = [entry('Dolchscheide', 'Equipped'), entry('Schwertscheide', 'Equipped')]
      expect(values(placementOptions(gear, 'Dolch', 1))).toContain('Dolchscheide')
      expect(values(placementOptions(gear, 'Dolch', 1))).not.toContain('Schwertscheide')
      expect(values(placementOptions(gear, 'Langschwert', 1))).toContain('Schwertscheide')
   })
   it('suggests a worn backpack, else Sonstiges', () => {
      expect(defaultPlacement([entry('Lederrucksack', 'Equipped')], 'Seil')).toBe('Lederrucksack')
      expect(defaultPlacement([], 'Seil')).toBe('Other')
   })
   it('contents weigh where their container is; external containers do not count', () => {
      expect(carriedEquipmentWeight([entry('Lederrucksack', 'Stash', 1, 2), entry('Seil', 'Lederrucksack', 1, 5)])).toBe(0)
      expect(carriedEquipmentWeight([entry('Bollerwagen', 'Other'), entry('Seil', 'Bollerwagen', 1, 5)])).toBe(0)
      expect(carriedEquipmentWeight([entry('Seil', 'Backpack', 1, 5)])).toBe(5)
   })
   it('dropping the last container leaves its contents under Sonstiges', () => {
      expect(releaseContents([entry('Seil', 'Lederrucksack')], 'Lederrucksack')).toEqual([entry('Seil', 'Other')])
      expect(releaseContents([entry('Lederrucksack', 'Equipped'), entry('Seil', 'Lederrucksack')], 'Lederrucksack')[1]?.carriedOn).toBe('Lederrucksack')
   })
})

describe('Feilschen (S. 208)', () => {
   it('moves the price by the net QS × 10 %, at most 50 %, in the winner’s favour', () => {
      expect(haggleRate({ winner: 'own', netQuality: 2, reason: '' })).toBe(-20)
      expect(haggleRate({ winner: 'opponent', netQuality: 3, reason: '' })).toBe(30)
      expect(haggleRate({ winner: 'own', netQuality: 7, reason: '' })).toBe(-50)
      expect(haggleRate({ winner: 'draw', netQuality: 0, reason: '' })).toBe(0)
   })
   it('a critical success or botch decides it with 50 %', () => {
      expect(haggleRate({ winner: 'own', netQuality: null, reason: '' })).toBe(-50)
      expect(haggleRate({ winner: 'opponent', netQuality: null, reason: '' })).toBe(50)
   })
   it('rounds market prices to whole Kreuzer (S. 364)', () => {
      expect(withRate(60, -20)).toBe(48)
      expect(withRate(0.3, -10)).toBe(0.27)
      expect(withRate(2.2, 30)).toBe(2.86)
   })
})
