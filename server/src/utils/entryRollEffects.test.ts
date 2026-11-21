import { describe, expect, it } from 'vitest'
import { ownedRollEffects } from './entryRollEffects'
import { checkModifiers } from './checkModifiers'

describe('Owned roll effects (S. 163–179, 216–219, 246–250, 321)', () => {
   it('offers Gutaussehend only for its three listed talents and only conditionally (S. 165)', () => {
      const effects = ownedRollEffects({ advantages: ['Gutaussehend I'] })
      expect(effects).toHaveLength(3)
      expect(effects.every((effect) => !effect.automatic && effect.value === 1 && effect.page === 165)).toBe(true)
      expect(effects.find((effect) => effect.keys?.includes('handel'))?.de).toContain('Feilschen')
      expect(effects.flatMap((effect) => effect.keys ?? [])).toEqual(['betoeren', 'ueberreden', 'handel'])
   })
   it('uses the highest trait tier once, without stacking prerequisite levels (S. 165)', () => {
      const effects = ownedRollEffects({ advantages: ['Gutaussehend I', 'Gutaussehend II', 'Gutaussehend II'] })
      expect(effects).toHaveLength(3)
      expect(effects.every((effect) => effect.value === 2)).toBe(true)
   })
   it('automatically applies unconditional talent and ranged modifiers (S. 168–171, 179)', () => {
      const effects = ownedRollEffects({
         advantages: ['Richtungssinn', 'Wohlklang'],
         disadvantages: ['Fettleibig', 'Eingeschränkter Sinn (Sicht)', 'Verstümmelt (Einäugig)'],
      })
      expect(effects.filter((effect) => effect.kind === 'ranged' && effect.automatic).map((effect) => effect.value)).toEqual([-2, -4])
      expect(effects.find((effect) => effect.label === 'Richtungssinn')?.automatic).toBe(true)
      expect(effects.find((effect) => effect.label === 'Fettleibig')?.keys).toEqual(['klettern', 'koerperbeherrschung', 'tanzen', 'verbergen'])
   })
   it('does not turn specialization FP or a reroll into an attribute bonus (S. 164, 178, 216)', () => {
      const effects = ownedRollEffects({
         advantages: ['Begabung (handel)'],
         disadvantages: ['Unfähig (singen)'],
         generalSpecialAbilities: ['Fertigkeitsspezialisierung (handel: Feilschen)'],
      })
      expect(effects.every((effect) => effect.value === 0)).toBe(true)
      expect(effects.find((effect) => effect.label.startsWith('Fertigkeitsspezialisierung'))?.skillPoints).toBe(2)
      expect(effects.find((effect) => effect.label.startsWith('Fertigkeitsspezialisierung'))?.automatic).toBe(false)
      expect(effects.find((effect) => effect.label.startsWith('Unfähig'))?.keys).toEqual(['singen'])
   })
   it('keeps terrain and location bonuses conditional and nonstacking within their context (S. 217–218)', () => {
      const effects = ownedRollEffects({ generalSpecialAbilities: ['Geländekunde (Waldkundig)', 'Ortskenntnis (Gareth)'] })
      expect(effects.map((effect) => effect.group)).toEqual(['terrain', 'location'])
      expect(effects.every((effect) => !effect.automatic && effect.value === 1)).toBe(true)
   })
   it('offers maneuver tiers with correct penalties and technique restrictions (S. 247–250)', () => {
      const effects = ownedRollEffects({ combatSpecialAbilities: ['Finte I', 'Finte II', 'Wuchtschlag III', 'Präziser Stich II', 'Sturmangriff'] })
      expect(effects.find((effect) => effect.label === 'Finte II')?.value).toBe(-2)
      expect(effects.find((effect) => effect.label === 'Wuchtschlag III')?.value).toBe(-6)
      expect(effects.find((effect) => effect.label === 'Präziser Stich II')?.keys).toEqual(['Dolche', 'Fechtwaffen'])
      expect(effects.find((effect) => effect.label === 'Sturmangriff')?.excludes).toEqual(['Finte'])
      expect(effects.every((effect) => !effect.automatic)).toBe(true)
   })
   it('leaves round stances and equipment-dependent abilities to the fight panel (S. 233, 238, 248–250)', () => {
      const effects = ownedRollEffects({ combatSpecialAbilities: ['Vorstoß', 'Verteidigungshaltung', 'Riposte', 'Klingenfänger', 'Beidhändiger Kampf I'] })
      expect(effects).toEqual([])
   })
   it('carries maneuver damage to the damage roll (S. 247–250)', () => {
      const effects = ownedRollEffects({ combatSpecialAbilities: ['Wuchtschlag III', 'Präziser Schuss/Wurf II', 'Hammerschlag', 'Sturmangriff', 'Zu Fall bringen', 'Entwaffnen', 'Einhändiger Kampf'] })
      const damage = (label: string) => effects.find((effect) => effect.label === label && effect.kind !== 'defense')?.damage
      expect(damage('Wuchtschlag III')).toEqual({ bonus: 6 })
      expect(damage('Präziser Schuss/Wurf II')).toEqual({ bonus: 4 })
      expect(damage('Hammerschlag')).toEqual({ dice: 1 })
      expect(damage('Sturmangriff')).toEqual({ bonus: 2, halfSpeed: true })
      expect(damage('Zu Fall bringen')).toEqual({ replace: '1W3' })
      expect(damage('Entwaffnen (-4)')).toEqual({ replace: '1W3' })
      expect(damage('Einhändiger Kampf')).toEqual({ bonus: 1 })
   })
   it('applies improved dodge only at the highest owned tier, in ordinary clothing (S. 250)', () => {
      const state = { combatSpecialAbilities: ['Verbessertes Ausweichen I', 'Verbessertes Ausweichen III'] }
      expect(ownedRollEffects(state).map((effect) => effect.value)).toEqual([3])
      expect(ownedRollEffects({ ...state, equipment: [{ item: 'Lederrüstung', amount: 1, carriedOn: 'Equipped' }] })).toEqual([])
   })
   it('removes all owned bonuses when the corresponding entries are removed', () => {
      expect(ownedRollEffects({ advantages: [], combatSpecialAbilities: [] })).toEqual([])
      expect(ownedRollEffects({ advantages: ['Custom unknown trait'] })).toEqual([])
   })
   it('offers only a correction of an existing long-range penalty; tools are handled by the talent Probe (S. 164, 218)', () => {
      const effects = ownedRollEffects({ advantages: ['Entfernungssinn'], generalSpecialAbilities: ['Meister der Improvisation'] })
      expect(effects.find((effect) => effect.label === 'Entfernungssinn')?.offsetPenalty).toBe(2)
      expect(effects.some((effect) => effect.label.startsWith('Meister der Improvisation'))).toBe(false)
   })
   it('reduces pain penalties without preventing pain IV incapacitation (S. 169)', () => {
      const state = { pain: 3, combatConditions: {}, combatSpecialAbilities: [], equipment: [], advantages: ['Zäher Hund'] }
      const result = checkModifiers(state)
      expect(result.profiles[0]?.total).toBe(-2)
      expect(result.profiles[0]?.sources).toContainEqual({ label: 'Zäher Hund', value: 1, page: 169 })
      expect(checkModifiers({ ...state, pain: 4 }).profiles[0]?.blocked).toContain('Schmerz IV: Selbstbeherrschung required to remain capable of acting.')
      expect(checkModifiers({ ...state, combatConditions: { Betäubung: 2, Furcht: 3 } }).profiles[0]?.blocked).toContain('Eight condition levels: incapacitated.')
   })
   it('increases actual pain penalties and blocks at III, but not at zero pain (S. 179)', () => {
      const state = { pain: 2, combatConditions: {}, combatSpecialAbilities: [], equipment: [], disadvantages: ['Zerbrechlich'] }
      expect(checkModifiers(state).profiles[0]?.total).toBe(-3)
      expect(checkModifiers({ ...state, pain: 3 }).profiles[0]?.blocked.length).toBeGreaterThan(0)
      expect(checkModifiers({ ...state, pain: 0 }).profiles[0]?.total).toBe(0)
   })
   it('keeps the condition cap separate from additional entry penalties (S. 32, 179)', () => {
      const result = checkModifiers({ pain: 2, combatConditions: { Furcht: 2, Betäubung: 2 }, combatSpecialAbilities: [],
         equipment: [], disadvantages: ['Verstümmelt (Einäugig)'] })
      const ranged = result.profiles.find((profile) => profile.kind === 'ranged')!
      expect(ranged.total).toBe(-5)
      expect(result.entryEffects.find((effect) => effect.kind === 'ranged')?.value).toBe(-4)
   })
})

describe('Spell modifiers and reroll markers from Vor-/Nachteile (S. 164, 167, 169, 171, 173, 178)', () => {
   const state = (advantages: string[], disadvantages: string[] = []) => ({ advantages, disadvantages, generalSpecialAbilities: [], combatSpecialAbilities: [], equipment: [] })
   it('offers Artefaktgebunden, Magische Einstimmung and Einschränkung for every spell, never automatically', () => {
      const effects = ownedRollEffects(state(['Magische Einstimmung (Wesen der Nacht)'], ['Artefaktgebunden (Magierstab)', 'Magische Einschränkung (Fluch der Berge)']))
      expect(effects.map(({ value, keys, automatic }) => ({ value, keys, automatic }))).toEqual([
         { value: 1, keys: ['spell:*'], automatic: false },
         { value: -1, keys: ['spell:*'], automatic: false },
         { value: -1, keys: ['spell:*'], automatic: false },
      ])
   })
   it('no longer offers Lästige Mindergeister as a manual −1 (it is a running effect now)', () => {
      expect(ownedRollEffects(state([], ['Lästige Mindergeister']))).toEqual([])
   })
   it('marks Begabung, Unfähig and Waffenbegabung as rerolls', () => {
      const effects = ownedRollEffects(state(['Begabung (klettern)', 'Waffenbegabung (Schwerter)'], ['Unfähig (schwimmen)']))
      expect(effects.map(({ reroll, keys }) => [reroll, keys?.[0]])).toEqual([
         ['begabung', 'klettern'], ['waffenbegabung', 'Schwerter'], ['waffenbegabung', 'Schwerter'], ['waffenbegabung', 'Schwerter'], ['unfaehig', 'schwimmen'],
      ])
   })
})
