import { describe, expect, it } from 'vitest'
import { analysisQualityCap, arcanoviPlan, artifactPrice, sideEffectFor, spellPatzerTable, staffFoci, staffVolume, withPowerFocus } from './magicRules'

const settings = { artifacts: '', artifactItems: [], guildSpell: null, staffItem: 'Magierstab', staffActive: null, staffInHand: true, flyingDevice: null }

describe('Magierstab (S. 276–277)', () => {
   it('counts the volume of owned staff spells', () => {
      expect(staffVolume(['Bindung des Stabes', 'Kraftfokus', 'Merkmalsfokus (Elementar)', 'Merkmalsfokus (Antimagie)', 'Fallen entschärfen'],
         { 'Bindung des Stabes': 0, Kraftfokus: 6, Merkmalsfokus: 8 })).toBe(22)
   })
   it('uses the foci only while the staff is held and untransformed', () => {
      const owned = ['Bindung des Stabes', 'Kraftfokus', 'Merkmalsfokus (Elementar)']
      expect(staffFoci({ generalSpecialAbilities: owned, magicSettings: settings })).toEqual({ usable: true, powerFocus: true, properties: ['Elementar'] })
      expect(staffFoci({ generalSpecialAbilities: owned, magicSettings: { ...settings, staffActive: 'Ewige Flamme' } }).powerFocus).toBe(false)
      expect(staffFoci({ generalSpecialAbilities: owned, magicSettings: { ...settings, staffInHand: false } }).properties).toEqual([])
      expect(withPowerFocus(1, true)).toBe(1)
      expect(withPowerFocus(8, true)).toBe(7)
   })
})

describe('ARCANOVI and artifacts (S. 267–269)', () => {
   it('matches the server rules and the book example', () => {
      expect(arcanoviPlan({ spellCost: 8, charges: 3, recharge: null, iron: false, materialSaved: 0, materialBonus: false }))
         .toMatchObject({ arcanoviModifier: -2, spellModifier: -2, asp: 40, permanent: 4, saveable: 2 })
      expect(artifactPrice(40, 4, 'b', 3, 100)).toBe(1050)
   })
   it('looks up side effects and the analysis cap', () => {
      expect(sideEffectFor(7).de).toContain('Katzen')
      expect(sideEffectFor(25).de).toContain('Kein')
      expect(analysisQualityCap(false, 0)).toBe(0)
      expect(analysisQualityCap(true, 0)).toBe(1)
      expect(analysisQualityCap(true, 3)).toBe(4)
   })
})

describe('Spell Patzer table (S. 258)', () => {
   it('covers 2–12', () => {
      for (let roll = 2; roll <= 12; roll++) expect(spellPatzerTable[roll]).toBeDefined()
   })
})
