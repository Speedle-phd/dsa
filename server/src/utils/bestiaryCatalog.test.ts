import { describe, expect, it } from 'vitest'
import { bestiary } from './bestiaryCatalog'
import { companionSpecies } from './companionCatalog'
import { magicSpells } from './magicCatalog'
import { talentCatalog } from './talentCatalog'
import { afterSunrise, assertSummon, assertSummonHealth, fightOver, improvedCreature, joinFight, servicesFor, summonHealth, useService, vanishes } from './summonRules'
import { missingRitualPrerequisite } from './magicRules'

const creature = (key: string) => bestiary.find((entry) => entry.key === key)!

describe('Bestiarium catalog (S. 356–362)', () => {
   it('lists the ten creatures of the core rules', () => {
      expect(bestiary.map((entry) => entry.key)).toEqual(['Gotongi', 'Heshthot', 'Irrhalk', 'Feuergeist', 'Feuerdschinn', 'Hund', 'Pferd', 'Katze', 'Kröte', 'Rabe'])
   })
   it('takes the animal stat blocks from the companion species', () => {
      for (const species of companionSpecies) {
         expect(creature(species.key)).toMatchObject({ kind: 'animal', health: species.health, attacks: species.attacks, painTable: species.painTable })
      }
   })
   it.each([['Gotongi', 0, 'Invocatio Minor'], ['Heshthot', -3, 'Invocatio Minor'], ['Irrhalk', -4, 'Invocatio Maior'],
      ['Feuergeist', -1, 'Elementarer Diener'], ['Feuerdschinn', -3, 'Dschinnenruf']])('%s: Anrufungsschwierigkeit %i via %s (S. 356–359)', (key, invocation, ritual) => {
      expect(creature(key)).toMatchObject({ invocation, summonedBy: ritual, painTable: null })
      expect(magicSpells.some((spell) => spell.key === ritual)).toBe(true)
   })
   it('knowledge checks use a known talent and three facts by QS (S. 354)', () => {
      for (const entry of bestiary) {
         expect(talentCatalog.some((talent) => talent.key === entry.knowledge.talent)).toBe(true)
         expect(entry.knowledge.facts.map((fact) => fact.qs)).toEqual([1, 2, 3])
      }
   })
   it('book example Mirhiban: neutral place +1, Feuerdschinn −3 → check −2 (S. 264)', () => {
      expect(1 + creature('Feuerdschinn').invocation!).toBe(-2)
   })
})

describe('Summoning: services and improvements (S. 264–265)', () => {
   const hero = { spells: [{ key: 'Dschinnenruf' }, { key: 'Invocatio Minor' }] }
   it('book example Mirhiban: QS 4 with two improvements leaves 3 services', () => {
      expect(servicesFor(4, 2)).toBe(3)
      expect(() => assertSummon(hero, { creature: 'Feuerdschinn', ritual: 'Dschinnenruf', quality: 4, improvements: ['offensive', 'defensive'] })).not.toThrow()
   })
   it('applies the improvements to the creature', () => {
      const djinn = improvedCreature(creature('Feuerdschinn'), ['offensive', 'defensive'])
      expect(djinn.attacks[0]).toMatchObject({ attack: 20, damage: '3W6+10' })
      expect(djinn).toMatchObject({ armor: 4, health: 43, defense: 10 })
      const gotongi = improvedCreature(creature('Gotongi'), ['speed', 'magic', 'resistance'])
      expect(gotongi).toMatchObject({ speed: '3/14', soulPower: 1, toughness: 1 })
      expect(gotongi.spells.map((spell) => spell.value)).toEqual([12, 12, 12, 16])
      expect(gotongi.attacks[0].damage).toBe('1W6')
   })
   it('rejects a wrong ritual, an unowned ritual, repeated improvements and more improvements than QS', () => {
      expect(() => assertSummon(hero, { creature: 'Irrhalk', ritual: 'Invocatio Minor', quality: 2, improvements: [] })).toThrow('Invocatio Maior')
      expect(() => assertSummon(hero, { creature: 'Feuergeist', ritual: 'Elementarer Diener', quality: 2, improvements: [] })).toThrow('Record the ritual')
      expect(() => assertSummon(hero, { creature: 'Hund', ritual: 'Invocatio Minor', quality: 2, improvements: [] })).toThrow('cannot be summoned')
      expect(() => assertSummon(hero, { creature: 'Gotongi', ritual: 'Invocatio Minor', quality: 2, improvements: ['magic', 'magic'] })).toThrow('only once')
      expect(() => assertSummon(hero, { creature: 'Gotongi', ritual: 'Invocatio Minor', quality: 1, improvements: ['magic', 'speed'] })).toThrow('1 QS')
   })
   it('uses services; Kampf against several and Wache need 2 and use all', () => {
      expect(useService({ services: 3, task: null }, 'work')).toEqual({ services: 2, task: null })
      expect(() => useService({ services: 1, task: null }, 'guard')).toThrow('at least 2')
      expect(useService({ services: 3, task: null }, 'fightMany')).toEqual({ services: 0, task: 'fightMany' })
      expect(() => useService({ services: 0, task: 'guard' }, 'work')).toThrow('busy')
   })
   it('every sunrise costs a service; a guard keeps its post; without services it vanishes', () => {
      expect(afterSunrise({ services: 2, task: null })).toEqual({ services: 1, task: null })
      expect(afterSunrise({ services: 0, task: 'guard' })).toEqual({ services: 0, task: 'guard' })
      expect(vanishes({ services: 0, task: null })).toBe(true)
      expect(vanishes({ services: 0, task: 'guard' })).toBe(false)
   })
})

describe('Summoning rituals build on each other (S. 263)', () => {
   it.each([
      ['Invocatio Minor', [{ key: 'Invocatio Minima', value: 9 }], 'Invocatio Minima'],
      ['Invocatio Minor', [{ key: 'Invocatio Minima', value: 10 }], null],
      ['Invocatio Maior', [{ key: 'Invocatio Minor', value: 11 }], 'Invocatio Minor'],
      ['Elementarer Diener', [], 'Manifesto'],
      ['Dschinnenruf', [{ key: 'Elementarer Diener', value: 12 }], null],
      ['Ignifaxius', [], null],
   ])('%s with %j → missing %s', (key, spells, missing) => {
      expect(missingRitualPrerequisite({ spells: spells.map((spell) => ({ ...spell, notes: '', paidAP: 0 })) }, key)?.key ?? null).toBe(missing)
   })
})

describe('LeP of a summoned creature (S. 264, 356)', () => {
   it('starts at the printed maximum, raised by Defensive Verbesserung (+10 LeP)', () => {
      const heshthot = creature('Heshthot')
      expect(summonHealth(heshthot.health, null)).toEqual({ max: heshthot.health, current: heshthot.health })
      const improved = improvedCreature(heshthot, ['defensive']).health
      expect(improved).toBe(heshthot.health + 10)
      expect(summonHealth(improved, 12)).toEqual({ max: improved, current: 12 })
   })
   it('keeps 0 LeP and rejects values above the maximum', () => {
      expect(summonHealth(30, 0).current).toBe(0)
      expect(summonHealth(30, 45).current).toBe(30)
      expect(assertSummonHealth(30, 0)).toBe(0)
      expect(() => assertSummonHealth(30, 31)).toThrow()
   })
})

describe('Kampf service in the fight panel (S. 265)', () => {
   it('keeps a creature with its last service until the fight is over', () => {
      const fighting = joinFight({ services: 1, task: null }, 'fight')
      expect(fighting).toEqual({ services: 0, task: 'fight' })
      expect(vanishes(fighting)).toBe(false)
      expect(vanishes(fightOver(fighting))).toBe(true)
      expect(fightOver({ services: 2, task: 'fight' })).toEqual({ services: 2, task: null })
   })
   it('Kampf against several enemies uses all services; a running one costs nothing more', () => {
      expect(joinFight({ services: 3, task: null }, 'fightMany')).toEqual({ services: 0, task: 'fightMany' })
      expect(joinFight({ services: 0, task: 'fightMany' }, 'fight')).toEqual({ services: 0, task: 'fightMany' })
      expect(fightOver({ services: 0, task: 'fightMany' })).toEqual({ services: 0, task: 'fightMany' })
   })
   it('needs a free service and no other running task', () => {
      expect(() => joinFight({ services: 0, task: null }, 'fight')).toThrow()
      expect(() => joinFight({ services: 1, task: null }, 'fightMany')).toThrow()
      expect(() => joinFight({ services: 2, task: 'fight' }, 'fight')).toThrow()
   })
})
