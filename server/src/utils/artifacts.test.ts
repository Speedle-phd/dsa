import { describe, expect, it } from 'vitest'
import { arcanoviPlan, artifactPrice, rechargeArtifact, useCharge } from './artifacts'

const plan = (overrides: Partial<Parameters<typeof arcanoviPlan>[0]> = {}) =>
   arcanoviPlan({ spellCost: 8, charges: 3, recharge: null, iron: false, materialSaved: 0, materialBonus: false, ...overrides })

describe('ARCANOVI (S. 267–268)', () => {
   it('Mirhiban example: three Psychostabilis charges cost 40 AsP, 4 permanent, both checks −2', () => {
      expect(plan()).toEqual({ arcanoviModifier: -2, spellModifier: -2, asp: 40, permanent: 4, permanentSaved: 0, materialSilver: 0 })
   })
   it('self-recharging artifacts multiply the spell cost and ease nothing', () => {
      expect(plan({ spellCost: 10, charges: 1, recharge: 'week' })).toMatchObject({ arcanoviModifier: -2, spellModifier: -2, asp: 116, permanent: 12 })
      expect(() => plan({ recharge: 'day' })).toThrow()
   })
   it('iron makes the ritual harder; material saves permanent AsP or eases the ritual', () => {
      expect(plan({ iron: true }).arcanoviModifier).toBe(-4)
      expect(plan({ materialSaved: 2 })).toMatchObject({ permanent: 2, materialSilver: 200 })
      expect(() => plan({ materialSaved: 3 })).toThrow()
      expect(plan({ materialBonus: true }).arcanoviModifier).toBe(-1)
   })
   it('stores 1–7 charges', () => {
      expect(() => plan({ charges: 8 })).toThrow()
   })
})

describe('artifact use (S. 267–269)', () => {
   it('spends and regains charges', () => {
      expect(useCharge('storage', { current: 2, max: 3 })).toEqual({ current: 1, max: 3 })
      expect(() => useCharge('storage', { current: 0, max: 3 })).toThrow()
      expect(useCharge('permanent', { current: 0, max: 0 })).toEqual({ current: 0, max: 0 })
      expect(rechargeArtifact('recharging', { current: 0, max: 1 })).toEqual({ current: 1, max: 1 })
      expect(() => rechargeArtifact('storage', { current: 0, max: 3 })).toThrow()
   })
   it('prices the Armreif der Willensstärke close to the book (1,050 S with a 100 S armband)', () => {
      expect(artifactPrice(40, 4, 'b', 3, 100)).toBe(1050)
   })
})
