import { describe, expect, it } from 'vitest'
import { applyResourceMaxima, energyAdvantageBonus, energyMaximum, healthMaximum, leadingAttribute, permanentEnergyLoss } from './energyRules'

const hero = (overrides: Record<string, unknown> = {}) => ({
   courage: 14, wisdom: 12, intuition: 14, charisma: 11,
   advantages: [] as string[], disadvantages: [] as string[], generalSpecialAbilities: [] as string[], ...overrides,
})

describe('AsP/KaP Basiswert = 20 + Leiteigenschaft ± Vor-/Nachteile (S. 56–57)', () => {
   it('Elf example: 20 + IN 14 = 34 AsP (S. 57)', () => {
      expect(energyMaximum(hero({ generalSpecialAbilities: ['Tradition (Elf)'] }), 'mana', 0, 0, true)).toBe(34)
   })
   it('Geweihter example: 20 + MU 14 = 34 KaP (S. 57)', () => {
      expect(energyMaximum(hero({ generalSpecialAbilities: ['Tradition (Rondrakirche)'] }), 'karmaEnergy', 0, 0, true)).toBe(34)
   })
   it.each([
      ['Tradition (Gildenmagier)', 'mana', 'wisdom', 12],
      ['Tradition (Hexe)', 'mana', 'charisma', 11],
      ['Tradition (Praioskirche)', 'karmaEnergy', 'wisdom', 12],
      ['Tradition (Boronkirche)', 'karmaEnergy', 'courage', 14],
      ['Tradition (Phexkirche)', 'karmaEnergy', 'intuition', 14],
   ] as const)('%s uses its Leiteigenschaft (S. 56)', (tradition, kind, attribute, value) => {
      expect(leadingAttribute(hero({ generalSpecialAbilities: [tradition] }), kind)).toEqual({ tradition, attribute, value })
   })
   it('adds Hohe Astralkraft and subtracts Niedrige Karmalkraft per level (S. 166, 174)', () => {
      const state = hero({ advantages: ['Zauberer', 'Hohe Astralkraft III'], disadvantages: ['Niedrige Karmalkraft II'] })
      expect(energyAdvantageBonus(state, 'mana')).toBe(3)
      expect(energyAdvantageBonus(state, 'karmaEnergy')).toBe(-2)
      expect(energyAdvantageBonus(hero({ advantages: ['Hohe Astralkraft'] }), 'mana')).toBe(1)
   })
   it('counts the highest recorded level when lower levels stay recorded (S. 166)', () => {
      expect(energyAdvantageBonus(hero({ advantages: ['Zauberer', 'Hohe Astralkraft III', 'Hohe Astralkraft IV'] }), 'mana')).toBe(4)
      expect(energyAdvantageBonus(hero({ advantages: ['Hohe Astralkraft IV', 'Hohe Astralkraft III'] }), 'mana')).toBe(4)
   })
   it('adds other modifiers and Zukauf, and gives 0 without Zauberer/Geweihter (S. 56)', () => {
      const state = hero({ generalSpecialAbilities: ['Tradition (Gildenmagier)'], advantages: ['Hohe Astralkraft II'] })
      expect(energyMaximum(state, 'mana', -1, 4, true)).toBe(20 + 12 + 2 - 1 + 4)
      expect(energyMaximum(state, 'mana', 0, 0, false)).toBe(0)
   })
   it('uses 20 without a recorded tradition', () => {
      expect(energyMaximum(hero(), 'mana', 0, 0, true)).toBe(20)
   })
   it('stores the derived Leiteigenschaft and maximum, ignoring a stale hand-entered value', () => {
      const stat = { ...hero({ generalSpecialAbilities: ['Tradition (Hexe)'], advantages: ['Zauberer', 'Hohe Astralkraft II'] }), isSorcerer: true, isConsecratedPerson: false,
         health: { value: 5, bonusMalus: 0, additionalPurchase: 0, max: 0 },
         mana: { traditionAttributeBonus: 17, bonusMalus: 0, additionalPurchase: 0, max: 37, current: 37 },
         karmaEnergy: { traditionAttributeBonus: 0, bonusMalus: 0, additionalPurchase: 0, max: 0, current: 0 } }
      applyResourceMaxima(stat)
      expect(stat.mana).toMatchObject({ traditionAttributeBonus: 11, max: 33 })
      expect(stat.karmaEnergy.max).toBe(0)
   })
})

describe('LeP Basiswert = LE-Grundwert + 2 × KO ± Vor-/Nachteile (S. 57, 166, 174)', () => {
   it('book example: 5 + KO 12 + KO 12 + Hohe Lebenskraft III = 32 (S. 57)', () => {
      expect(healthMaximum(hero({ constitution: 12, advantages: ['Hohe Lebenskraft III'] }), 5, 0, 0)).toBe(32)
   })
   it('subtracts Niedrige Lebenskraft per level and adds other modifiers and Zukauf (S. 174)', () => {
      expect(healthMaximum(hero({ constitution: 12, disadvantages: ['Niedrige Lebenskraft II'] }), 5, 1, 3)).toBe(5 + 24 - 2 + 1 + 3)
   })
   it('stores the derived LeP maximum', () => {
      const stat = { ...hero({ constitution: 13, advantages: ['Hohe Lebenskraft'] }), health: { value: 2, bonusMalus: 0, additionalPurchase: 0, max: 0 },
         mana: { bonusMalus: 0, additionalPurchase: 0 }, karmaEnergy: { bonusMalus: 0, additionalPurchase: 0 } }
      applyResourceMaxima(stat)
      expect(stat.health.max).toBe(2 + 26 + 1)
   })
})

describe('permanent AsP (S. 262, 352)', () => {
   it('lowers the maximum until bought back', () => {
      const hero = {
         isSorcerer: true, isConsecratedPerson: false, wisdom: 14, constitution: 12, advantages: ['Zauberer'], disadvantages: [],
         generalSpecialAbilities: ['Tradition (Gildenmagier)'],
         health: { value: 5 }, mana: { bonusMalus: 0, additionalPurchase: 0, permanentLoss: 6, permanentBuyback: 2 }, karmaEnergy: {},
      }
      applyResourceMaxima(hero)
      expect(hero.mana).toMatchObject({ max: 20 + 14 - 4 })
      expect(permanentEnergyLoss({ permanentLoss: 2, permanentBuyback: 5 })).toBe(0)
   })
})
