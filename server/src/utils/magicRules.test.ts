import { describe, expect, it } from 'vitest'
import { magicSpells, magicTricks } from './magicCatalog'
import { isForeignSpell, meetsPropertyKnowledge, spellImplications, spellMaximum, spellRemovalDependents, type MagicState } from './magicRules'
import { quoteEntry, removalDependents } from './characterEntryRules'

function state(): MagicState {
   return {
      advantages: ['Zauberer'], generalSpecialAbilities: ['Tradition (Gildenmagier)'],
      courage: 14, wisdom: 15, intuition: 13, charisma: 12, fingerDexterity: 12,
      dexterity: 12, constitution: 12, strength: 12,
      spells: [], magicSettings: { guildSpell: null },
   }
}
function spell(key: string) {
   const entry = magicSpells.find((entry) => entry.key === key)
   if (!entry) throw new Error(`Missing test spell ${key}`)
   return entry
}

describe('Zauber & Rituale catalog (S. 286–304, 413)', () => {
   it('includes all core spells, rituals and tricks without duplicate keys', () => {
      expect(magicSpells.filter((entry) => entry.kind === 'Zauberspruch')).toHaveLength(45)
      expect(magicSpells.filter((entry) => entry.kind === 'Ritual')).toHaveLength(6)
      expect(magicSpells.filter((entry) => entry.kind === 'Hexenfluch')).toHaveLength(10)
      expect(magicSpells.filter((entry) => entry.kind === 'Elfenlied')).toHaveLength(6)
      expect(magicTricks).toHaveLength(12)
      expect(new Set(magicSpells.map((entry) => entry.key)).size).toBe(67)
      for (const entry of magicSpells) {
         expect(entry.probe).toHaveLength(3)
         expect(entry.probe.every(Boolean)).toBe(true)
         expect(entry.page).toBeGreaterThanOrEqual(entry.kind === 'Hexenfluch' ? 282 : entry.kind === 'Elfenlied' ? 283 : 287)
         expect(entry.page).toBeLessThanOrEqual(301)
      }
   })
   it.each([
      ['Bannbaladin', 'SK', 'b', 'Einfluss'],
      ['Fulminictus', 'ZK', 'c', 'Verwandlung'],
      ['Arcanovi', null, 'd', 'Objekt'],
   ])('preserves %s resistance, factor and property', (key, resistance, factor, property) => {
      expect(spell(String(key))).toMatchObject({ resistance, stfClass: factor, property })
   })
   it('retains spell-specific prohibitions instead of assuming every value is modifiable', () => {
      expect(spell('Ignifaxius').costModifiable).toBe(false)
      expect(spell('Große Gier').rangeModifiable).toBe(false)
      expect(spell('Armatrutz').rangeModifiable).toBe(false)
      expect(spell('Zauberklinge Geisterspeer')).toMatchObject({ cost: '10 / 20 / 35', costModifiable: false })
   })
})

describe('Hexenflüche (S. 274, 281–283)', () => {
   it('all ten curses use factor B and prohibit modifications even with knowledge', () => {
      const hero = state()
      hero.generalSpecialAbilities = ['Tradition (Hexe)', 'Merkmalskenntnis (Verwandlung)']
      for (const curse of magicSpells.filter((entry) => entry.kind === 'Hexenfluch')) {
         expect(curse.stfClass).toBe('b')
         expect(curse.costModifiable).toBe(false)
         expect(curse.rangeModifiable).toBe(false)
         expect(spellImplications(hero, curse, 16)).toMatchObject({ foreign: false, modifications: 0 })
      }
   })
   it.each([
      ['Hexenschuss', 'ZK', '14', 'QS × 3 h'],
      ['Beute!', 'SK', '14', 'QS × 3 Tage'],
      ['Hagelschlag', null, '21', 'QS × 15 min'],
      ['Pestilenz', 'ZK', 'Krankheitsstufe', '≤ QS × 3 Tage'],
   ])('preserves the curse-specific values for %s', (key, resistance, cost, duration) => {
      expect(spell(String(key))).toMatchObject({ resistance, cost, duration, kind: 'Hexenfluch' })
   })
   it('protects the witch tradition while curses remain, even with another magical tradition', () => {
      const hero = { ...state(), disadvantages: [], languages: [], scripts: [], talents: [], combatTechniques: [],
         combatSpecialAbilities: [], entryPurchases: [], experience: { total: 1100, spent: 0 } }
      hero.generalSpecialAbilities.push('Tradition (Hexe)')
      hero.spells = [{ key: 'Hexenschuss', value: 8, notes: '', paidAP: 0 }]
      expect(removalDependents(hero, 'generalSpecialAbilities', 'Tradition (Hexe)')).toContain('Hexenschuss')
   })
})

describe('Traditions, maximum FW and modifications (S. 39, 255–256, 274–275, 283, 285)', () => {
   it('caps paid advancement at highest probe attribute +2 and at 14 without knowledge', () => {
      const hero = state()
      expect(spellMaximum(hero, spell('Bannbaladin'))).toBe(14)
      hero.generalSpecialAbilities.push('Merkmalskenntnis (Einfluss)')
      expect(spellMaximum(hero, spell('Bannbaladin'))).toBe(16)
      hero.generalSpecialAbilities.push('Merkmalskenntnis (Objekt)')
      expect(spellMaximum(hero, spell('Arcanovi'))).toBe(17)
   })
   it('treats general and owned tradition spells as native', () => {
      const hero = state()
      expect(isForeignSpell(hero, spell('Bannbaladin'))).toBe(false)
      expect(isForeignSpell(hero, spell('Ignifaxius'))).toBe(false)
      expect(isForeignSpell(hero, spell('Adlerauge'))).toBe(true)
   })
   it('foreign spells retain −2 after knowledge unlocks modifications', () => {
      const hero = state()
      expect(spellImplications(hero, spell('Adlerauge'), 12)).toMatchObject({ modifier: -2, modifications: 0 })
      hero.generalSpecialAbilities.push('Merkmalskenntnis (Heilung)')
      expect(spellImplications(hero, spell('Adlerauge'), 12)).toMatchObject({ modifier: -2, modifications: 3 })
   })
   it.each([[0, 0], [3, 0], [4, 1], [7, 1], [8, 2], [14, 3]])('FW %i allows %i modifications', (value, modifications) => {
      expect(spellImplications(state(), spell('Bannbaladin'), value).modifications).toBe(modifications)
   })
   it('the guild creation exception removes foreign status only for its chosen spell', () => {
      const hero = state()
      hero.magicSettings.guildSpell = 'Adlerauge'
      expect(isForeignSpell(hero, spell('Adlerauge'))).toBe(false)
      expect(isForeignSpell(hero, spell('Falkenauge'))).toBe(true)
      hero.generalSpecialAbilities = ['Tradition (Hexe)']
      expect(isForeignSpell(hero, spell('Adlerauge'))).toBe(true)
   })
   it('marks doubled Elfen duration without changing the catalog base duration', () => {
      const hero = state()
      hero.generalSpecialAbilities = ['Tradition (Elf)']
      expect(spellImplications(hero, spell('Adlerauge'), 8).elvenDuration).toBe(true)
      expect(spellImplications(hero, spell('Bannbaladin'), 8).elvenDuration).toBe(false)
      expect(spell('Adlerauge').duration).toBe('aufrechterhaltend')
   })
})

describe('Merkmalskenntnis acquisition and dependency protection (S. 274, 285–286)', () => {
   function entryState() {
      return { ...state(), disadvantages: [], languages: [], scripts: [], talents: [], combatTechniques: [],
         combatSpecialAbilities: [], entryPurchases: [], experience: { total: 1100, spent: 0 } }
   }
   it('requires three matching spells at FW 10 and leading attribute 15', () => {
      const hero = entryState()
      hero.spells = ['Armatrutz', 'Balsam Salabunde', 'Psychostabilis'].map((key) => ({ key, value: 10, paidAP: 0, notes: '' }))
      expect(meetsPropertyKnowledge(hero, 'Heilung')).toBe(true)
      const selection = { category: 'generalSpecialAbilities' as const, catalogKey: 'Merkmalskenntnis', detail: 'Heilung', level: 1, application: '' }
      expect(quoteEntry(hero, selection).problems).toEqual([])
      hero.spells[0].value = 9
      expect(meetsPropertyKnowledge(hero, 'Heilung')).toBe(false)
      expect(quoteEntry(hero, selection).problems).toContain('Merkmalskenntnis requires a tradition attribute of 15 and three matching spells at FW 10 (S. 285).')
      hero.spells[0].value = 10
      hero.wisdom = 14
      expect(meetsPropertyKnowledge(hero, 'Heilung')).toBe(false)
   })
   it('counts matching curses for Merkmalskenntnis and protects their FW threshold (S. 285)', () => {
      const hero = entryState()
      hero.generalSpecialAbilities = ['Tradition (Hexe)', 'Merkmalskenntnis (Einfluss)']
      hero.charisma = 15
      hero.spells = ['Beute!', 'Schlaf rauben', 'Zunge lähmen'].map((key) => ({ key, value: 10, paidAP: 0, notes: '' }))
      expect(meetsPropertyKnowledge(hero, 'Einfluss')).toBe(true)
      expect(spellRemovalDependents(hero, 'Beute!', 9)).toEqual(['Merkmalskenntnis (Einfluss)'])
      hero.spells[0].value = 9
      expect(meetsPropertyKnowledge(hero, 'Einfluss')).toBe(false)
   })
   it('protects knowledge prerequisites on removal or correction, but allows a fourth spell to leave', () => {
      const hero = entryState()
      hero.generalSpecialAbilities.push('Merkmalskenntnis (Heilung)')
      hero.spells = ['Armatrutz', 'Balsam Salabunde', 'Psychostabilis'].map((key) => ({ key, value: 10, paidAP: 0, notes: '' }))
      expect(spellRemovalDependents(hero, 'Armatrutz')).toEqual(['Merkmalskenntnis (Heilung)'])
      expect(spellRemovalDependents(hero, 'Armatrutz', 9)).toEqual(['Merkmalskenntnis (Heilung)'])
      expect(spellRemovalDependents(hero, 'Armatrutz', 10)).toEqual([])
      hero.spells.push({ key: 'Adlerauge', value: 10, paidAP: 0, notes: '' })
      expect(spellRemovalDependents(hero, 'Armatrutz')).toEqual([])
   })
   it('does not block new learning because an older manually recorded knowledge lacks prerequisites', () => {
      const hero = entryState()
      hero.generalSpecialAbilities.push('Merkmalskenntnis (Heilung)')
      expect(spellRemovalDependents(hero, 'Armatrutz', 0)).toEqual([])
      hero.spells.push({ key: 'Armatrutz', value: 8, paidAP: 0, notes: '' })
      expect(spellRemovalDependents(hero, 'Armatrutz', 9)).toEqual([])
   })
   it('protects the last tradition, Zauberer, and knowledge needed above FW 14', () => {
      const hero = entryState()
      hero.spells = [{ key: 'Armatrutz', value: 15, paidAP: 0, notes: '' }]
      hero.magicTricks = [{ key: 'Abkühlung', paidAP: 1 }]
      hero.generalSpecialAbilities.push('Merkmalskenntnis (Heilung)')
      expect(removalDependents(hero, 'advantages', 'Zauberer')).toContain('Armatrutz')
      expect(removalDependents(hero, 'advantages', 'Zauberer')).toContain('Abkühlung')
      expect(removalDependents(hero, 'generalSpecialAbilities', 'Tradition (Gildenmagier)')).toContain('Armatrutz')
      expect(removalDependents(hero, 'generalSpecialAbilities', 'Merkmalskenntnis (Heilung)')).toEqual(['Armatrutz'])
   })
})
