import { describe, expect, it } from 'vitest'
import { archetypeCatalog, archetypeDraft, archetypeFor } from './archetypeCatalog'
import { creationLedger, emptyDraft, type CreationDraftData } from './creationLedger'
import { finishedHero } from './creationFinish'

// Remaining AP of each printed archetype under the app's rules. Only Allacaya balances like the book (0 AP left);
// the others differ by printed values that do not add up (e.g. Wulfgrimm Menschenkenntnis 0 below its package 2, S. 80, 141),
// plus the activation house rule for talents outside the packages (experience.md). The player resolves the rest.
const balances: Record<string, number> = {
   Allacaya: 0, Korgrimm: -77, Thallian: 20, Irinja: -1, Belima: -8, Orestas: 10,
   Elwene: -27, Selim: -8, Nevinia: -11, Wulfgrimm: 6, Ylwa: -29, Gonzalo: -2,
}
// Open points every archetype may have: the specialization's application is not printed, the AP balance, and GM approvals
const expectedOpen = new Set(['application', 'balance'])

describe('Archetypen (DSA5 Regelwerk, S. 62–85)', () => {
   it('has the twelve archetypes of the core rules, all Erfahren with attribute sum ≤ 100', () => {
      expect(archetypeCatalog.map((archetype) => archetype.key)).toEqual(Object.keys(balances))
      for (const archetype of archetypeCatalog) expect(Object.values(archetype.attributes).reduce((sum, value) => sum + value, 0)).toBeLessThanOrEqual(100)
   })

   it.each(archetypeCatalog.map((archetype) => [archetype.key, archetype] as const))('%s resolves to known catalog entries and its printed balance', (key, archetype) => {
      const ledger = creationLedger(archetypeDraft(archetype))
      expect(ledger.balance).toBe(balances[key])
      const open = ledger.violations.map((issue) => issue.key).filter((issue) => !expectedOpen.has(issue) && !issue.startsWith('approval:'))
      // Wulfgrimm: Wettervorhersage needs Wildnisleben 4, printed 3 (S. 80, 219)
      expect(open).toEqual(key === 'Wulfgrimm' ? ['entry:Wettervorhersage'] : [])
      expect(ledger.entries.every((entry) => entry.problems.every((problem) => problem.startsWith('Wildnisleben') || problem.includes('wildnisleben')))).toBe(true)
   })

   it('Allacaya: package plus culture bonus, Lockruf from the package, KL or KK lowered (S. 62–63)', () => {
      const data = archetypeDraft(archetypeFor('Allacaya')!)
      const ledger = creationLedger(data)
      expect(data.profession).toMatchObject({ kind: 'package', key: 'Wildnisläufer', tricks: ['Lockruf'] })
      expect(ledger.talents.faehrtensuchen).toMatchObject({ base: 8, value: 8 })
      expect(ledger.granted.tricks).toEqual(['Lockruf'])
      expect(ledger.derived.mana.value).toBe(35)
   })

   it('humans carry the +1 maximum on the attribute printed above 14; choice slots take the highest printed technique', () => {
      expect(archetypeDraft(archetypeFor('Thallian')!).speciesChoice).toBe('wisdom')
      expect(archetypeDraft(archetypeFor('Belima')!).profession).toMatchObject({ variant: 'Dieb', choices: [['Wurfwaffen']] })
      // Elwene: no choice technique printed at 10 (S. 74–75, 159): the first option is chosen and lowered to 6
      const elwene = creationLedger(archetypeDraft(archetypeFor('Elwene')!))
      expect(elwene.techniques.Fechtwaffen).toMatchObject({ base: 10, value: 6, cost: -12 })
   })

   it('package combat SF are not bought twice; Finish writes the bought ones with their AP', () => {
      const data = archetypeDraft(archetypeFor('Korgrimm')!)
      expect(data.combatAbilities).toEqual(['Belastungsgewöhnung II', 'Schildspalter', 'Sturmangriff', 'Wuchtschlag II'])
      const ledger = creationLedger(data)
      const { stats } = finishedHero(data, ledger)
      expect(stats.combatSpecialAbilities).toEqual(expect.arrayContaining(['Belastungsgewöhnung I', 'Belastungsgewöhnung II', 'Finte I', 'Vorstoß', 'Wuchtschlag I', 'Wuchtschlag II']))
      expect(stats.combatAbilityPurchases).toContainEqual({ key: 'Wuchtschlag II', ap: 20 })
      expect(stats.combatAbilityPurchases.some((purchase) => purchase.key === 'Finte I')).toBe(false)
   })
})

describe('Kampfsonderfertigkeiten bei der Erschaffung (S. 51–55)', () => {
   const draft = (change: Partial<CreationDraftData>): CreationDraftData => ({ ...emptyDraft(), species: 'Mensch', speciesChoice: 'courage', ...change })
   it('costs its AP in the special abilities section', () => {
      const ledger = creationLedger(draft({ attributes: { ...emptyDraft().attributes, dexterity: 13 }, combatAbilities: ['Finte I'] }))
      expect(ledger.combatAbilities).toEqual([{ key: 'Finte I', ap: 15, problems: [] }])
      expect(ledger.costs.abilities).toBe(15)
   })
   it('checks attributes, talents and earlier levels', () => {
      const ledger = creationLedger(draft({ combatAbilities: ['Finte II', 'Berittener Kampf'] }))
      const messages = ledger.violations.filter((issue) => issue.key.startsWith('combat:')).map((issue) => issue.values)
      expect(messages).toContainEqual({ name: 'Finte II', requirement: 'dexterity', minimum: 15 })
      expect(messages).toContainEqual({ name: 'Finte II', requirement: 'Finte I' })
      expect(messages).toContainEqual({ name: 'Berittener Kampf', requirement: 'reiten', minimum: 10 })
   })
   it('flags unknown abilities', () => {
      expect(creationLedger(draft({ combatAbilities: ['Erfundene SF'] })).violations.map((issue) => issue.key)).toContain('combat:Erfundene SF')
   })
})
