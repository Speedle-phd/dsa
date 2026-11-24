import { describe, expect, it } from 'vitest'
import { generatorWeapons, presetInput, roles, storeWeapon, tiers } from './npcPresets'

describe('generator presets (app choice)', () => {
   it('fills attributes, techniques, weapons, armour and abilities by role and experience', () => {
      const input = presetInput('fighter', 'average')
      expect(input.attributes).toMatchObject({ courage: 13, dexterity: 13, constitution: 13, strength: 13, wisdom: 11 })
      expect(input.weapons.map((weapon) => weapon.name)).toEqual(['Waffenlos', 'Säbel'])
      expect(input.techniques).toEqual({ Raufen: 8, Schwerter: 10 })
      expect(input).toMatchObject({ armor: 'Stoffrüstung', abilities: ['Wuchtschlag I'], species: 'Mensch' })
   })

   it('takes ranged weapons with range and reload time from the store', () => {
      expect(storeWeapon('Kurzbogen')).toMatchObject({ technique: 'Bögen', reach: 'ranged', range: expect.stringMatching(/^\d+\/\d+\/\d+$/) })
      expect(storeWeapon('No such weapon')).toBeNull()
   })

   it('only uses weapons that exist in the store for every role and tier', () => {
      for (const role of roles) for (const tier of tiers) {
         for (const weapon of presetInput(role, tier).weapons) expect(weapon.name === 'Waffenlos' || generatorWeapons.includes(weapon.name), `${role}/${tier}: ${weapon.name}`).toBe(true)
      }
   })
})
