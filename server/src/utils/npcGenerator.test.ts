import { describe, expect, it } from 'vitest'
import { damageWithBonus, deriveNpc, type GeneratorInput, type GeneratorWeapon } from './npcGenerator'

const mace: GeneratorWeapon = { name: 'Streitkolben', technique: 'Hiebwaffen', damage: '1W6+4', leading: 'KK', threshold: 14, attackModifier: 0, parryModifier: -1, reach: 'medium', range: null, reload: null, shield: false }
const bow: GeneratorWeapon = { name: 'Kurzbogen', technique: 'Bögen', damage: '1W6+4', leading: null, threshold: null, attackModifier: 0, parryModifier: 0, reach: 'ranged', range: '10/50/80', reload: 1, shield: false }
const base: GeneratorInput = {
   species: 'Mensch',
   attributes: { courage: 13, wisdom: 11, intuition: 13, charisma: 12, fingerDexterity: 11, dexterity: 13, constitution: 13, strength: 13 },
   techniques: { Hiebwaffen: 12, Bögen: 10 }, weapons: [mace, bow], armor: 'Stoffrüstung', abilities: [],
}

describe('NPC generator (hero rules)', () => {
   it('derives the values of a human fighter in light armour by hand (S. 32, 36, 56, 234)', () => {
      const npc = deriveNpc(base)
      // LeP 5 + 2 × 13; SK −5 + 37/6 → 1; ZK −5 + 39/6 → 2 (rounded half up)
      expect(npc).toMatchObject({ maxHealth: 31, armor: 2, initiativeBase: 12, dodge: 6, speed: 7 })
      expect(npc.sheet).toMatchObject({ soulPower: 1, toughness: 2, burden: 1, armorName: 'Stoffrüstung' })
      // AT 12 + (13−8)/3 = 13 − BE 1 = 12; PA ⌈12/2⌉ + 1 = 7 − 1 (weapon) − 1 (BE) = 5; KK 13 below the threshold 14: no bonus
      expect(npc.sheet.weapons[0]).toMatchObject({ kind: 'melee', attack: 12, parry: 5, damage: '1W6+4', reach: 'medium' })
      // FK 10 + (FF 11 − 8)/3 = 11; Belastung does not reduce FK
      expect(npc.sheet.weapons[1]).toMatchObject({ kind: 'ranged', attack: 11, parry: null, range: '10/50/80', reload: 1 })
      expect(npc).toMatchObject({ attack: 12, parry: 5, damage: '1W6+4' })
   })

   it('Belastungsgewöhnung I reads the armour two rows lighter for BE, INI and GS, not for RS (S. 246)', () => {
      const npc = deriveNpc({ ...base, armor: 'Lederrüstung', abilities: ['Belastungsgewöhnung I'] })
      // Lederrüstung RS 3 BE 1 (+1 GS/INI); two rows lighter: Schwere Kleidung BE 0 (+1 GS/INI)
      expect(npc).toMatchObject({ armor: 3, initiativeBase: 12, dodge: 7, speed: 7 })
      expect(npc.sheet.burden).toBe(0)
   })

   it('adds Kampfreflexe to INI and Verbessertes Ausweichen to AW (S. 248, 250)', () => {
      const npc = deriveNpc({ ...base, armor: null, abilities: ['Kampfreflexe II', 'Verbessertes Ausweichen I'] })
      expect(npc).toMatchObject({ initiativeBase: 15, dodge: 8, speed: 8 })
      expect(npc.breakdown.initiativeBase).toEqual([{ label: '(MU + GE) / 2', value: 13 }, { label: 'Kampfreflexe', value: 2 }])
   })

   it('adds the damage bonus above the threshold of the leading attribute (S. 233)', () => {
      const attributes = { ...base.attributes, strength: 17, dexterity: 12 }
      expect(damageWithBonus('1W6+4', 'GE/KK', 15, attributes)).toBe('1W6+6')
      expect(damageWithBonus('2W6', 'KK', 14, attributes)).toBe('2W6+3')
      expect(damageWithBonus('1W6+4', 'KK', 18, attributes)).toBe('1W6+4')
   })

   it('refuses an unknown species or combat technique', () => {
      expect(() => deriveNpc({ ...base, species: 'Drache' })).toThrow('Unknown species')
      expect(() => deriveNpc({ ...base, weapons: [{ ...mace, technique: 'Peitschen' }] })).toThrow('Unknown combat technique')
   })
})
