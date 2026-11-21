import { describe, expect, it } from 'vitest'
import { abilityEffectSpec, conditionsAfterEffect } from './abilityEffects'

describe('Eiserner Wille (S. 216)', () => {
   it('uses the owned level', () => {
      expect(abilityEffectSpec({ generalSpecialAbilities: ['Eiserner Wille II'], pain: 0 }, 'Eiserner Wille').values).toEqual({ ironWill: 2, stuporOnEnd: true })
      expect(abilityEffectSpec({ generalSpecialAbilities: ['Eiserner Wille I'], pain: 0 }, 'Eiserner Wille').values.ironWill).toBe(1)
   })
   it('needs the SF', () => {
      expect(() => abilityEffectSpec({ generalSpecialAbilities: [], pain: 0 }, 'Eiserner Wille')).toThrow()
   })
})

describe('Schmerzen unterdrücken (S. 219)', () => {
   it('suppresses one level per QS', () => {
      expect(abilityEffectSpec({ generalSpecialAbilities: ['Schmerzen unterdrücken'], pain: 2 }, 'Schmerzen unterdrücken', 3).values)
         .toEqual({ ignorePain: 3, stuporOnEnd: true })
   })
   it('needs Schmerz, the SF and a QS', () => {
      expect(() => abilityEffectSpec({ generalSpecialAbilities: ['Schmerzen unterdrücken'], pain: 0 }, 'Schmerzen unterdrücken', 2)).toThrow()
      expect(() => abilityEffectSpec({ generalSpecialAbilities: [], pain: 2 }, 'Schmerzen unterdrücken', 2)).toThrow()
      expect(() => abilityEffectSpec({ generalSpecialAbilities: ['Schmerzen unterdrücken'], pain: 2 }, 'Schmerzen unterdrücken')).toThrow()
   })
})

describe('ending a sustained ability', () => {
   it('adds one level of Betäubung, at most IV', () => {
      expect(conditionsAfterEffect({ Betäubung: 1 }, { stuporOnEnd: true })).toEqual({ Betäubung: 2 })
      expect(conditionsAfterEffect({ Betäubung: 4 }, { stuporOnEnd: true })).toEqual({ Betäubung: 4 })
      expect(conditionsAfterEffect({ Betäubung: 1 }, { soulPower: 2 })).toEqual({ Betäubung: 1 })
   })
})

describe('Aura verbergen and elven song effects (S. 284)', () => {
   it('hides the aura and adds Verwirrung when it ends', () => {
      const spec = abilityEffectSpec({ generalSpecialAbilities: ['Aura verbergen'], pain: 0 }, 'Aura verbergen', 2)
      expect(spec.values).toEqual({ blocksSpells: true, confusionOnEnd: true })
      expect(conditionsAfterEffect({ Verwirrung: 0 }, spec.values)).toEqual({ Verwirrung: 1 })
   })
   it('turns the song QS into bonuses', () => {
      const state = { pain: 0, spells: [{ key: 'Zaubermelodie' }, { key: 'Melodie der Kunstfertigkeit' }] }
      expect(abilityEffectSpec(state, 'Zaubermelodie', 3).values).toEqual({ spellBonus: 1 })
      expect(abilityEffectSpec(state, 'Zaubermelodie', 4).values).toEqual({ spellBonus: 2 })
      expect(abilityEffectSpec(state, 'Melodie der Kunstfertigkeit', 5).values).toEqual({ craftBonus: 5 })
      expect(() => abilityEffectSpec({ pain: 0 }, 'Zaubermelodie', 2)).toThrow()
   })
})
