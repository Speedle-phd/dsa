import { describe, expect, it } from 'vitest'
import {
   adjustHealth, advanceCombatTechnique, combatAbilities,
   combatTechniqueValues, defaultCombatTechniques, purchaseCombatAbility,
} from './combatRules'
import { combatSettingsSchema, healthAdjustmentSchema } from '../validations/combatValidation'

const attributes = { courage: 14, intuition: 15, dexterity: 14, fingerDexterity: 14, constitution: 13, strength: 16 }

describe('Kampftechniken and advancement (S. 39, 50–51, 235–236)', () => {
   it('starts all 14 techniques at KtW 6', () => {
      expect(defaultCombatTechniques()).toHaveLength(14)
      expect(defaultCombatTechniques().every((entry) => entry.value === 6)).toBe(true)
   })
   it.each([
      ['Dolche', 6, 8, 5], ['Schwerter', 7, 9, 6],
      ['Bögen', 6, 8, null], ['Kettenwaffen', 6, 8, null],
   ])('calculates base AT/FK and PA for %s', (key, value, attack, parry) => {
      expect(combatTechniqueValues({ key, value }, attributes)).toEqual({ key, attack, parry })
   })
   it('only grants a bonus for three full attribute points above eight', () => {
      expect(combatTechniqueValues({ key: 'Dolche', value: 6 },
         { ...attributes, courage: 10, dexterity: 10 })).toEqual({ key: 'Dolche', attack: 6, parry: 3 })
   })
   it.each([['Dolche', 6, 7, 2], ['Schwerter', 12, 13, 6], ['Schwerter', 13, 14, 9]])(
      'charges the target-step cost for %s %i', (key, current, value, cost) => {
         expect(advanceCombatTechnique({ key, value: current }, attributes, 100)).toEqual({ ok: true, value, cost })
      })
   it('rejects missing AP, unknown techniques and the leading-attribute cap', () => {
      expect(advanceCombatTechnique({ key: 'Dolche', value: 6 }, attributes, 1)).toEqual({ ok: false, reason: 'insufficient-ap' })
      expect(advanceCombatTechnique({ key: 'Schwerter', value: 18 }, attributes, 100)).toEqual({ ok: false, reason: 'maximum-reached' })
      expect(advanceCombatTechnique({ key: 'Bögen', value: 16 }, attributes, 100)).toEqual({ ok: false, reason: 'maximum-reached' })
      expect(advanceCombatTechnique({ key: 'unknown', value: 6 }, attributes, 100)).toEqual({ ok: false, reason: 'invalid-technique' })
   })
})

describe('Combat special abilities (S. 54–55)', () => {
   it('uses unique purchase keys', () => {
      expect(new Set(combatAbilities.map((entry) => entry.key)).size).toBe(combatAbilities.length)
   })
   it('checks previous levels and attributes before spending AP', () => {
      expect(purchaseCombatAbility('Finte II', attributes, [], [], 100)).toEqual({ ok: false, reason: 'missing-prerequisites' })
      expect(purchaseCombatAbility('Finte II', { ...attributes, dexterity: 15 }, [], ['Finte I'], 20)).toEqual({ ok: true, cost: 20 })
   })
   it('checks talent prerequisites and variant costs', () => {
      expect(purchaseCombatAbility('Verbessertes Ausweichen I', attributes, [], [], 100)).toEqual({ ok: false, reason: 'missing-prerequisites' })
      expect(purchaseCombatAbility('Verbessertes Ausweichen I', attributes, [{ key: 'koerperbeherrschung', value: 4 }], [], 15)).toEqual({ ok: true, cost: 15 })
      expect(purchaseCombatAbility('Schnellladen (Armbrüste)', attributes, [], [], 5)).toEqual({ ok: true, cost: 5 })
   })
   it('rejects duplicates, unknown abilities and insufficient AP', () => {
      expect(purchaseCombatAbility('Haltegriff', attributes, [], ['Haltegriff'], 100)).toEqual({ ok: false, reason: 'already-owned' })
      expect(purchaseCombatAbility('Haltegriff', attributes, [], [], 4)).toEqual({ ok: false, reason: 'insufficient-ap' })
      expect(purchaseCombatAbility('unknown', attributes, [], [], 100)).toEqual({ ok: false, reason: 'unknown-ability' })
   })
})

describe('Health and Schmerz (S. 34, 234, 340)', () => {
   it.each([[28, 7, 21, 1], [21, 7, 14, 2], [14, 7, 7, 3], [7, 2, 5, 4], [5, 5, 0, 4], [0, 4, -4, 4]])(
      'deducts SP from %i LeP and recalculates pain', (current, amount, next, pain) => {
         expect(adjustHealth(current, 28, 'damage', amount)).toEqual({ ok: true, current: next, pain })
      })
   it('caps healing at max and clears pain after crossing its thresholds', () => {
      expect(adjustHealth(5, 28, 'heal', 17)).toEqual({ ok: true, current: 22, pain: 0 })
      expect(adjustHealth(-4, 28, 'heal', 5)).toEqual({ ok: true, current: 1, pain: 4 })
      expect(adjustHealth(22, 28, 'heal', 100)).toEqual({ ok: true, current: 28, pain: 0 })
   })
   it.each([0, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid adjustment %s', (amount) => {
      expect(adjustHealth(28, 28, 'damage', amount)).toEqual({ ok: false })
      expect(healthAdjustmentSchema.safeParse({ direction: 'damage', amount }).success).toBe(false)
   })
   it('validates manual condition levels and KtW boundaries', () => {
      expect(combatSettingsSchema.safeParse({ conditions: { Furcht: 5 } }).success).toBe(false)
      expect(combatSettingsSchema.safeParse({ conditions: { unknown: 1 } }).success).toBe(false)
      expect(combatSettingsSchema.safeParse({ techniques: [{ key: 'Dolche', value: 5 }] }).success).toBe(false)
   })
})
