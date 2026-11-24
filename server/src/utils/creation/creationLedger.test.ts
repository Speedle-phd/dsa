import { describe, expect, it } from 'vitest'
import { characterEntryCatalog, languageScripts } from '../characterEntryCatalog'
import { talentCatalog } from '../talentCatalog'
import { creationLedger, emptyDraft, type CreationDraftData } from './creationLedger'
import { cultureCatalog } from './cultureCatalog'
import { finishedHero } from './creationFinish'
import { professionCatalog } from './professionCatalog'
import { combatAbilities, combatTechniques } from '../combatRules'
import { magicSpells, magicTricks } from '../magicCatalog'
import { blessings, liturgies, liturgyAvailable } from '../karmaCatalog'
import { karmaSpend, liturgyMaximum } from '../karmaRules'
import { capsFor, experienceCaps } from './experienceCaps'
import { speciesCatalog } from './speciesCatalog'
import { startAge } from './startTables'

const draft = (change: Partial<CreationDraftData> = {}): CreationDraftData => ({ ...emptyDraft(), ...change })
const issues = (data: CreationDraftData) => creationLedger(data).violations.map((issue) => issue.key)

describe('Erfahrungsgrade (S. 39)', () => {
   it('has the seven levels with their AP and caps', () => {
      expect(experienceCaps.map((entry) => entry.ap)).toEqual([900, 1000, 1100, 1200, 1400, 1700, 2100])
      expect(capsFor('Erfahren')).toMatchObject({ attribute: 14, skill: 10, technique: 12, attributeSum: 100, spells: 12, foreignSpells: 2 })
      expect(capsFor('Legendär')).toMatchObject({ attribute: 18, skill: 20, technique: 20, attributeSum: 114, spells: 20, foreignSpells: 6 })
   })
})

describe('Spezies (S. 40, 87–94)', () => {
   it('Sarah: an elf costs 18 AP, leaving 1,082 of 1,100 (S. 41)', () => {
      const ledger = creationLedger(draft({ species: 'Elf', speciesChoice: 'wisdom' }))
      expect(ledger.apTotal - ledger.spent).toBe(1082)
   })
   it('modifiers change only the maximum: elf IN 15, KL 12 with the −2 on KL (S. 88, 91)', () => {
      const ledger = creationLedger(draft({ species: 'Elf', speciesChoice: 'wisdom' }))
      expect(ledger.caps.attributes).toMatchObject({ intuition: 15, dexterity: 15, wisdom: 12, strength: 14 })
      expect(ledger.costs.attributes).toBe(0)
   })
   it('elves and dwarves must choose the lowered attribute; humans may raise one', () => {
      expect(issues(draft({ species: 'Zwerg' }))).toContain('species-choice')
      expect(issues(draft({ species: 'Zwerg', speciesChoice: 'wisdom' }))).toContain('species-choice')
      expect(creationLedger(draft({ species: 'Mensch', speciesChoice: 'courage' })).caps.attributes.courage).toBe(15)
   })
   it('species AP equal the overview (S. 94)', () => {
      expect(Object.fromEntries(speciesCatalog.map((entry) => [entry.key, entry.ap]))).toEqual({ Mensch: 0, Elf: 18, Halbelf: 0, Zwerg: 61 })
   })
})

describe('Kulturen (S. 41–42, 95–126)', () => {
   it('lists the 26 cultures with the package AP of the overview', () => {
      expect(cultureCatalog).toHaveLength(26)
      expect(Object.fromEntries(cultureCatalog.map((entry) => [entry.key, entry.package.ap]))).toMatchObject({
         Andergast: 20, Mittelreich: 12, Utulus: 40, Waldmenschen: 42, Auelfen: 43, Firnelfen: 55, Hügelzwerge: 13, Erzzwerge: 34,
      })
   })
   it('uses only known talents, languages and scripts', () => {
      const scripts = characterEntryCatalog.filter((entry) => entry.category === 'scripts').map((entry) => entry.key)
      for (const culture of cultureCatalog) {
         for (const key of Object.keys(culture.package.talents)) expect(talentCatalog.some((talent) => talent.key === key), `${culture.key}: ${key}`).toBe(true)
         for (const language of culture.languages) expect(language in languageScripts, `${culture.key}: ${language}`).toBe(true)
         for (const script of culture.scripts) expect(scripts, `${culture.key}: ${script}`).toContain(script)
      }
   })
   it('the culture is free; the package costs its AP and the script 2 AP (S. 40–41)', () => {
      const base = draft({ species: 'Mensch', culture: 'Andergast', language: 'Garethi' })
      expect(creationLedger(base).costs.culture).toBe(0)
      expect(creationLedger({ ...base, culturePackage: true, script: 'Kusliker Zeichen' }).costs.culture).toBe(22)
   })
   it('grants the mother tongue III and the Ortskenntnis for free (S. 41, Louisa: Garethi III, Ortskenntnis Grangor)', () => {
      const ledger = creationLedger(draft({ species: 'Mensch', culture: 'Horasreich', language: 'Garethi', localKnowledge: 'Grangor' }))
      expect(ledger.granted.languages).toEqual(['Garethi III'])
      expect(ledger.granted.generalSpecialAbilities).toEqual(['Ortskenntnis (Grangor)'])
      expect(ledger.spent).toBe(0)
   })
   it('an unusual culture needs the GM’s approval (S. 40)', () => {
      const unusual = draft({ species: 'Zwerg', speciesChoice: 'charisma', culture: 'Andergast', language: 'Garethi' })
      expect(issues(unusual)).toContain('approval:culture:Andergast')
      expect(issues({ ...unusual, approvals: ['culture:Andergast'] })).not.toContain('approval:culture:Andergast')
   })
})

describe('Eigenschaften (S. 43–44)', () => {
   it.each([[[14, 14, 14, 13, 13, 11, 11, 10], 540], [[15, 14, 13, 13, 12, 12, 11, 10], 555], [[15, 15, 13, 13, 12, 11, 11, 10], 570]])(
      'the packages %j cost %i AP', (values, ap) => {
         const attributes = Object.fromEntries(['courage', 'wisdom', 'intuition', 'charisma', 'fingerDexterity', 'dexterity', 'constitution', 'strength']
            .map((key, index) => [key, values[index]])) as CreationDraftData['attributes']
         const ledger = creationLedger(draft({ species: 'Mensch', speciesChoice: 'courage', attributes }))
         expect(ledger.costs.attributes).toBe(ap)
         expect(ledger.usage.attributeSum).toBe(100)
      })
   it('checks the maximum and the sum at the EG', () => {
      const attributes = { ...emptyDraft().attributes, courage: 15 }
      expect(issues(draft({ species: 'Mensch', attributes }))).toContain('attribute:courage')
      expect(issues(draft({ species: 'Mensch', speciesChoice: 'courage', attributes }))).not.toContain('attribute:courage')
      const high = Object.fromEntries(Object.keys(attributes).map((key) => [key, 13])) as CreationDraftData['attributes']
      expect(issues(draft({ attributes: high }))).toContain('attribute-sum')
   })
})

describe('Packages and skills (S. 45, 50)', () => {
   const andergast = draft({ species: 'Mensch', culture: 'Andergast', language: 'Garethi', culturePackage: true })
   it('the package value is the base; raising costs from there (Holzbearbeitung B: 2 → 4 = 4 AP)', () => {
      const ledger = creationLedger({ ...andergast, talents: { holzbearbeitung: 4 } })
      expect(ledger.talents.holzbearbeitung).toMatchObject({ base: 2, value: 4, cost: 4 })
   })
   it('lowering a package value refunds its cost (S. 45)', () => {
      const ledger = creationLedger({ ...andergast, talents: { wildnisleben: 0 } })
      expect(ledger.talents.wildnisleben).toMatchObject({ base: 2, value: 0, cost: -6 })
   })
   it('FW above the EG cap or highest attribute + 2 is a violation (S. 39)', () => {
      const strong = { ...emptyDraft().attributes, constitution: 12, strength: 12 }
      expect(issues(draft({ attributes: strong, talents: { kraftakt: 11 } }))).toContain('talent:kraftakt')
      expect(issues(draft({ level: 'Kompetent', talents: { kraftakt: 11 } }))).toContain('talent:kraftakt')
      expect(issues(draft({ level: 'Kompetent', attributes: strong, talents: { kraftakt: 11 } }))).not.toContain('talent:kraftakt')
   })
   it('combat techniques start at 6 and cost from there', () => {
      const ledger = creationLedger(draft({ techniques: { Dolche: 8 } }))
      expect(ledger.techniques.Dolche).toMatchObject({ base: 6, value: 8, cost: 4 })
   })
   it('spells need the advantage Zauberer', () => {
      expect(issues(draft({ spells: { Radau: 4 } }))).toContain('spell-caster')
      expect(issues(draft({ species: 'Elf', speciesChoice: 'wisdom', spells: { Radau: 4 } }))).not.toContain('spell-caster')
   })
})

describe('Vor- und Nachteile (S. 39, 46–49, 91)', () => {
   const entry = (category: 'advantages' | 'disadvantages', catalogKey: string, level = 1, detail = '') => ({ category, catalogKey, level, detail, application: '' })
   it('an advantage costs its AP; a disadvantage gives AP', () => {
      const ledger = creationLedger(draft({ species: 'Mensch', entries: [entry('advantages', 'Altersresistenz'), entry('disadvantages', 'Nachtblind')] }))
      expect(ledger.costs.entries).toBe(5 - 10)
      expect(ledger.usage).toMatchObject({ advantageAp: 5, disadvantageAp: 10 })
   })
   it('the elf’s automatic advantages count 30 AP toward the 80 AP limit (S. 91)', () => {
      const elf = draft({ species: 'Elf', speciesChoice: 'wisdom', entries: [entry('advantages', 'Magische Einstimmung', 1, 'Wald')] })
      expect(creationLedger(elf).usage.advantageAp).toBe(70)
      const more = { ...elf, entries: [...elf.entries, entry('advantages', 'Dunkelsicht', 2)] }
      expect(issues(more)).toContain('advantage-ap')
   })
   it('LeP: 5 + 12 + 12 + Hohe Lebenskraft III = 32 (S. 57)', () => {
      const attributes = { ...emptyDraft().attributes, constitution: 12 }
      const ledger = creationLedger(draft({ species: 'Mensch', attributes, entries: [entry('advantages', 'Hohe Lebenskraft', 3)] }))
      expect(ledger.derived.health.value).toBe(32)
   })
})

describe('Abschluss (S. 38, 56, 58)', () => {
   it('keeps at most 10 AP and never goes negative', () => {
      expect(issues(draft({ species: 'Mensch' }))).toContain('balance')
      expect(issues(draft({ level: 'Unerfahren', species: 'Zwerg', speciesChoice: 'charisma', techniques: { Hiebwaffen: 12 } }))).toContain('balance')
   })
   it('start ages per species and EG', () => {
      expect(startAge('Mensch', 'Erfahren')).toEqual({ base: 16, count: 1, sides: 3 })
      expect(startAge('Elf', 'Erfahren')).toEqual({ base: 26, count: 2, sides: 6 })
      expect(startAge('Zwerg', 'Legendär')).toEqual({ base: 142, count: 7, sides: 6 })
   })
})

describe('Finish: the created hero (S. 25, 38, 46, 58)', () => {
   const complete = (): CreationDraftData => ({
      ...emptyDraft(), species: 'Mensch', speciesChoice: 'courage', culture: 'Mittelreich', language: 'Garethi', localKnowledge: 'Havena',
      culturePackage: true, script: 'Kusliker Zeichen', name: 'Alrik',
      entries: [{ category: 'advantages', catalogKey: 'Altersresistenz', level: 1, detail: '', application: '' },
         { category: 'disadvantages', catalogKey: 'Nachtblind', level: 1, detail: '', application: '' }],
   })
   it('keeps the AP account: the available AP equal the balance, disadvantages are a credit', () => {
      const data = complete()
      const ledger = creationLedger(data)
      const { stats } = finishedHero(data, ledger)
      expect(stats.experience.total - stats.experience.spent).toBe(ledger.balance)
      expect(stats.experience.disadvantageCredit).toBe(10)
      expect(stats.entryCredits).toEqual([{ key: 'Nachtblind', ap: 10 }])
      expect(stats.entryPurchases.map((entry) => [entry.key, entry.ap])).toEqual([['Altersresistenz', 5], ['Kusliker Zeichen', 2]])
   })
   it('records species base values, the free mother tongue, Ortskenntnis and 750 S', () => {
      const data = complete()
      const { char, stats } = finishedHero(data, creationLedger(data))
      expect(stats.health.value).toBe(5)
      expect(stats.languages).toEqual(['Garethi III'])
      expect(stats.generalSpecialAbilities).toEqual(['Ortskenntnis (Havena)'])
      expect(stats.purse.silbertaler).toBe(750)
      expect(char).toMatchObject({ species: 'Mensch', culture: 'Mittelreich', placeOfOrigin: 'Havena', socialStatus: 'frei', age: 16 })
   })
   it('writes every talent active: untouched ones at FW 0, package ones at their value (S. 25)', () => {
      const data = complete()
      const { stats } = finishedHero(data, creationLedger(data))
      expect(stats.talents.find((talent) => talent.key === 'holzbearbeitung')?.value).toBe(1)
      expect(stats.talents.find((talent) => talent.key === 'zechen')?.value).toBe(0)
      expect(stats.talents.every((talent) => typeof talent.value === 'number')).toBe(true)
   })
   it('talents start active at FW 0 without activation cost; raises cost the S. 50 steps (S. 25, 50)', () => {
      const ledger = creationLedger(draft({ talents: { zechen: 0, kraftakt: 2 } }))
      expect(ledger.talents.zechen).toMatchObject({ base: 0, value: 0, cost: 0 })
      // Kraftakt (B): FW 1 and FW 2 cost 2 AP each
      expect(ledger.talents.kraftakt).toMatchObject({ base: 0, value: 2, cost: 2 + 2 })
      expect(ledger.talents.klettern).toMatchObject({ base: 0, value: 0, cost: 0 })
   })
})

describe('Professionen (S. 127–144)', () => {
   const human = (change: Partial<CreationDraftData> = {}): CreationDraftData => ({
      ...emptyDraft(), species: 'Mensch', culture: 'Mittelreich', language: 'Garethi', ...change,
   })
   const pkg = (key: string, variant: string | null = null, choices: string[][] = [], application = 'Anwendung') =>
      ({ kind: 'package' as const, key, variant, choices, application })
   it('lists the 16 worldly professions with the AP of S. 129–144', () => {
      const worldly = professionCatalog.filter((entry) => entry.group === 'worldly')
      expect(Object.fromEntries(worldly.map((entry) => [entry.key, entry.ap]))).toEqual({
         Barde: 150, Gardist: 246, Gaukler: 160, Gladiator: 164, Händler: 136, Heiler: 207, Höfling: 176, Jäger: 246, Krieger: 216,
         Prostituierte: 203, Ritter: 230, Seefahrer: 173, Söldner: 202, Spitzel: 230, Stammeskrieger: 289, Streuner: 212,
      })
   })
   it('uses only known talents, combat techniques and special abilities', () => {
      const general = characterEntryCatalog.filter((entry) => entry.category === 'generalSpecialAbilities').map((entry) => entry.key)
      for (const profession of professionCatalog) {
         for (const part of [profession, ...profession.variants]) {
            for (const key of Object.keys(part.talents ?? {})) expect(talentCatalog.some((talent) => talent.key === key), `${profession.key}: ${key}`).toBe(true)
            for (const key of [...Object.keys(part.techniques ?? {}), ...(part.choices ?? []).flatMap((slot) => slot.options)])
               expect(combatTechniques.some((technique) => technique.key === key), `${profession.key}: ${key}`).toBe(true)
            if (part.specialization) expect(talentCatalog.some((talent) => talent.key === part.specialization), `${profession.key}: ${part.specialization}`).toBe(true)
         }
         for (const key of [...profession.combatAbilities, ...profession.variants.flatMap((variant) => variant.addCombatAbilities ?? [])])
            expect(combatAbilities.some((ability) => ability.key === key), `${profession.key}: ${key}`).toBe(true)
         for (const key of [...profession.abilities, ...profession.variants.flatMap((variant) => variant.addAbilities ?? [])]) expect(general).toContain(key)
      }
   })
   it('Louisa: Mensch, Horasreich, Streuner (Einbrecher) for 225 AP after 540 AP attributes: 560 → 335 (S. 46; the book prints 329)', () => {
      const attributes = { courage: 14, wisdom: 13, intuition: 14, charisma: 13, fingerDexterity: 14, dexterity: 14, constitution: 10, strength: 8 }
      const base = human({ culture: 'Horasreich', attributes })
      expect(creationLedger(base).balance).toBe(560)
      const ledger = creationLedger({ ...base, profession: pkg('Streuner', 'Einbrecher', [['Wurfwaffen']], 'Fassadenklettern') })
      expect(ledger.balance).toBe(335)
      expect(ledger.talents).toMatchObject({ klettern: { base: 7 }, taschendiebstahl: { base: 2 }, schloesserknacken: { base: 7 }, gassenwissen: { base: 7 } })
   })
   it('profession values and culture bonuses add up (user decision)', () => {
      const ledger = creationLedger(human({ culture: 'Andergast', culturePackage: true, profession: pkg('Jäger') }))
      expect(ledger.talents.wildnisleben.base).toBe(7 + 2)
   })
   it('choice slots: the chosen technique gets the slot value; missing choices are open points', () => {
      expect(issues(human({ profession: pkg('Streuner') }))).toContain('choice:0')
      const ledger = creationLedger(human({ profession: pkg('Streuner', null, [['Armbrüste']]) }))
      expect(ledger.techniques.Armbrüste.base).toBe(10)
      expect(ledger.techniques.Wurfwaffen.base).toBe(6)
      expect(issues(human({ profession: pkg('Gardist', null, [['Schwerter']]) }))).toContain('choice:0')
      expect(issues(human({ profession: pkg('Gardist', null, [['Schwerter', 'Hiebwaffen']]) }))).not.toContain('choice:0')
   })
   it('the Fertigkeitsspezialisierung needs its application', () => {
      expect(issues(human({ profession: pkg('Händler', null, [], '') }))).toContain('application')
      expect(creationLedger(human({ profession: pkg('Händler', null, [], 'Feilschen') })).granted.generalSpecialAbilities).toContain('Fertigkeitsspezialisierung (handel: Feilschen)')
   })
   it('prerequisites are paid separately: Höfling needs Adel, combat SF their attributes (S. 128, 54–55)', () => {
      expect(issues(human({ profession: pkg('Höfling', null, [['Schwerter']]) }))).toContain('requires:Adel')
      const soldier = creationLedger(human({ profession: pkg('Söldner', null, [['Schwerter']]) }))
      expect(soldier.granted.combatSpecialAbilities).toEqual(['Aufmerksamkeit', 'Belastungsgewöhnung I', 'Wuchtschlag I'])
      expect(soldier.violations.map((issue) => issue.key)).toEqual(expect.arrayContaining(['sf:Aufmerksamkeit', 'sf:Belastungsgewöhnung I', 'sf:Wuchtschlag I']))
      expect(creationLedger(human({ profession: pkg('Gardist', 'Aufseher', [['Schwerter', 'Hiebwaffen']]) })).granted.combatSpecialAbilities).toEqual(['Wuchtschlag I'])
   })
   it('variants with culture or sex limits (S. 129, 133, 135)', () => {
      expect(issues(human({ profession: pkg('Barde', 'Skalde') }))).toContain('variant-culture')
      expect(issues(human({ culture: 'Thorwal', language: 'Thorwalsch', profession: pkg('Barde', 'Skalde') }))).not.toContain('variant-culture')
      const lady = human({ culture: 'Andergast', profession: pkg('Höfling', 'Hofdame') })
      expect(issues(lady)).toContain('variant-sex')
      expect(issues({ ...lady, sex: 'female' })).not.toContain('variant-sex')
   })
   it('an unusual profession for the culture needs the GM (S. 44)', () => {
      expect(issues(human({ culture: 'Fjarninger', language: 'Fjarningsch', profession: pkg('Streuner', null, [['Wurfwaffen']]) }))).toContain('approval:profession:Streuner')
      expect(issues(human({ profession: pkg('Streuner', null, [['Wurfwaffen']]) }))).not.toContain('approval:profession:Streuner')
   })
   it('the language budget pays for languages (and scripts if listed) up to its AP (S. 128)', () => {
      const thorwalsch = { category: 'languages' as const, catalogKey: 'Thorwalsch', level: 2, detail: '', application: '' }
      const ledger = creationLedger(human({ profession: pkg('Streuner', null, [['Wurfwaffen']]), entries: [thorwalsch] }))
      expect(ledger.profession).toMatchObject({ languageBudget: 6, budgetUsed: 4 })
      expect(ledger.costs.profession).toBe(212 - 4)
      expect(creationLedger(human({ profession: pkg('Streuner', null, [['Wurfwaffen']]), script: 'Kusliker Zeichen' })).profession?.budgetUsed).toBe(0)
      expect(creationLedger(human({ profession: pkg('Händler'), script: 'Kusliker Zeichen' })).profession?.budgetUsed).toBe(2)
   })
   it('Finish records the package combat special abilities and the profession name', () => {
      const data = human({ name: 'Rondrik', speciesChoice: 'courage', profession: pkg('Gladiator', 'Grubenkämpfer') })
      const { char, stats } = finishedHero(data, creationLedger(data))
      expect(stats.combatSpecialAbilities).toEqual(['Wuchtschlag I'])
      expect(char.profession).toBe('Gladiator (Grubenkämpfer)')
      expect(stats.combatTechniques.find((entry) => entry.key === 'Dolche')?.value).toBe(10)
   })
})

describe('Zaubererprofessionen (S. 145–153)', () => {
   const entry = (category: 'advantages' | 'disadvantages' | 'generalSpecialAbilities', catalogKey: string, level = 1, detail = '') =>
      ({ category, catalogKey, level, detail, application: '' })
   const pkg = (key: string, tricks: string[] = [], application = 'Anwendung') =>
      ({ kind: 'package' as const, key, variant: null, choices: [], application, tricks })
   const elf = (change: Partial<CreationDraftData> = {}): CreationDraftData => ({
      ...emptyDraft(), species: 'Elf', speciesChoice: 'wisdom', culture: 'Auelfen', language: 'Isdira',
      entries: [entry('generalSpecialAbilities', 'Tradition (Elf)')], ...change,
   })
   const mage = (change: Partial<CreationDraftData> = {}): CreationDraftData => ({
      ...emptyDraft(), species: 'Mensch', culture: 'Mittelreich', language: 'Garethi',
      entries: [entry('advantages', 'Zauberer'), entry('generalSpecialAbilities', 'Tradition (Gildenmagier)')], ...change,
   })
   it('lists the 9 caster professions with their AP', () => {
      expect(Object.fromEntries(professionCatalog.filter((item) => item.group === 'magic').map((item) => [item.key, item.ap]))).toEqual({
         Wildnisläufer: 256, Zauberweber: 221, Katzenhexe: 285, Krötenhexe: 296, Rabenhexe: 295,
         'Gildenloser Magier': 237, Graumagier: 314, Schwarzmagier: 302, Weißmagier: 316,
      })
   })
   it('uses only known spells and Zaubertricks', () => {
      for (const profession of professionCatalog) {
         for (const key of Object.keys(profession.spells ?? {})) expect(magicSpells.some((spell) => spell.key === key), `${profession.key}: ${key}`).toBe(true)
         for (const key of profession.tricks?.options ?? []) expect(magicTricks.some((trick) => trick.key === key), `${profession.key}: ${key}`).toBe(true)
      }
   })
   it('prerequisites are paid separately: species Elf and Tradition (Elf) for the Wildnisläufer (S. 145)', () => {
      expect(issues(elf({ entries: [], profession: pkg('Wildnisläufer', ['Lockruf']) }))).toContain('requires:Tradition (Elf)')
      expect(issues(elf({ profession: pkg('Wildnisläufer', ['Lockruf']) }))).not.toContain('requires:Tradition (Elf)')
      expect(issues(mage({ profession: pkg('Wildnisläufer', ['Lockruf']) }))).toContain('requires-species')
   })
   it('package spells start at their value; raising costs from there, lowering refunds (S. 45)', () => {
      const ledger = creationLedger(elf({ profession: pkg('Wildnisläufer', ['Lockruf']), spells: { Armatrutz: 4 } }))
      expect(ledger.spells.Freundschaftslied).toMatchObject({ base: 4, value: 4, cost: 0 })
      expect(ledger.spells.Armatrutz).toMatchObject({ base: 6, value: 4 })
      expect(ledger.spells.Armatrutz.cost).toBeLessThan(0)
      // 6 Zauber; Freundschaftslied is listed under Sonderfertigkeiten (S. 145) and does not count (S. 39)
      expect(ledger.usage.spells).toBe(6)
   })
   it('the package Zaubertrick is free, others cost 1 AP; the choice is required', () => {
      expect(issues(elf({ profession: pkg('Wildnisläufer') }))).toContain('trick-choice')
      const ledger = creationLedger(elf({ profession: pkg('Wildnisläufer', ['Lockruf']), tricks: ['Lockruf', 'Duft'] }))
      expect(ledger.granted.tricks).toEqual(['Lockruf'])
      expect(ledger.violations.map((issue) => issue.key)).not.toContain('trick-choice')
      const without = creationLedger(elf({ profession: pkg('Wildnisläufer', ['Lockruf']) }))
      expect(ledger.costs.skills - without.costs.skills).toBe(1)
   })
   it('Fremdzauber count against the EG limit (S. 39): Fulminictus for a guild mage', () => {
      const guild = mage({ profession: pkg('Gildenloser Magier', ['Trocken']) })
      expect(issues(guild)).not.toContain('foreign-spells')
      expect(issues({ ...guild, level: 'Unerfahren' })).toContain('foreign-spells')
   })
   it('the Weißmagier needs Prinzipientreue II (S. 153)', () => {
      expect(issues(mage({ profession: pkg('Weißmagier', ['Trocken']) }))).toContain('requires:Prinzipientreue')
      const principled = mage({ profession: pkg('Weißmagier', ['Trocken']) })
      principled.entries = [...principled.entries, entry('disadvantages', 'Prinzipientreue', 2, 'Wahrheitsliebe')]
      expect(issues(principled)).not.toContain('requires:Prinzipientreue')
   })
   it('the curse budget of the Krötenhexe pays for curses (S. 148)', () => {
      const witch: CreationDraftData = { ...emptyDraft(), species: 'Mensch', culture: 'Mittelreich', language: 'Garethi',
         entries: [entry('advantages', 'Zauberer'), entry('generalSpecialAbilities', 'Tradition (Hexe)')],
         profession: pkg('Krötenhexe', ['Handwärmer']), spells: { Hexenschuss: 0 } }
      const ledger = creationLedger(witch)
      expect(ledger.profession).toMatchObject({ curseBudget: 12, curseUsed: ledger.spells.Hexenschuss.cost })
      expect(ledger.granted.generalSpecialAbilities).toEqual(expect.arrayContaining(['Flugsalbe', 'Vertrautenbindung']))
   })
   it('curses do not count toward the spell limit of the Erfahrungsgrad (S. 39; user decision, Nov 2026)', () => {
      // Krötenhexe: 7 package spells; Unerfahren allows 8 spells
      const witch: CreationDraftData = { ...emptyDraft(), level: 'Unerfahren', species: 'Mensch', culture: 'Mittelreich', language: 'Garethi',
         entries: [entry('advantages', 'Zauberer'), entry('generalSpecialAbilities', 'Tradition (Hexe)')],
         profession: pkg('Krötenhexe', ['Handwärmer']), spells: { Hexenschuss: 0, 'Beiß auf Granit!': 0, Hagelschlag: 0 } }
      const ledger = creationLedger(witch)
      expect(ledger.usage.spells).toBe(7)
      expect(issues(witch)).not.toContain('spell-count')
      expect(issues({ ...witch, spells: { ...witch.spells, 'Odem Arcanum': 0, Fulminictus: 0 } })).toContain('spell-count')
   })
   it('Finish: package tricks and spells are not recorded as paid', () => {
      const data = elf({ name: 'Sarah', profession: pkg('Wildnisläufer', ['Lockruf']), tricks: ['Lockruf', 'Duft'] })
      const { stats } = finishedHero(data, creationLedger(data))
      expect(stats.magicTricks).toEqual([{ key: 'Lockruf', paidAP: 0 }, { key: 'Duft', paidAP: 1 }])
      expect(stats.spells.find((spell) => spell.key === 'Visibili')).toMatchObject({ value: 5, paidAP: 0 })
   })
})

describe('Entries the hero already has', () => {
   const entry = (category: 'advantages' | 'generalSpecialAbilities' | 'languages', catalogKey: string, level = 1, detail = '') => ({ category, catalogKey, level, detail, application: '' })
   const witch = (extra: CreationDraftData['entries']): CreationDraftData => ({ ...emptyDraft(), species: 'Mensch', culture: 'Mittelreich', language: 'Garethi',
      entries: [entry('advantages', 'Zauberer'), entry('generalSpecialAbilities', 'Tradition (Hexe)'), ...extra],
      profession: { kind: 'package', key: 'Rabenhexe', variant: null, choices: [], application: '', tricks: ['Trocken'] } })
   it('flags SF the profession already grants (Rabenhexe: Flugsalbe, Vertrautenbindung)', () => {
      expect(issues(witch([entry('generalSpecialAbilities', 'Flugsalbe')]))).toContain('entry:Flugsalbe')
      expect(issues(witch([]))).not.toContain('entry:Flugsalbe')
   })
   it('flags the mother tongue, the elf’s automatic advantages and doubles', () => {
      expect(issues(witch([entry('languages', 'Garethi', 2)]))).toContain('entry:Garethi II')
      const elf = { ...emptyDraft(), species: 'Elf' as const, speciesChoice: 'wisdom' as const, entries: [entry('advantages', 'Zauberer')] }
      expect(issues(elf)).toContain('entry:Zauberer')
      expect(issues({ ...emptyDraft(), entries: [entry('advantages', 'Altersresistenz'), entry('advantages', 'Altersresistenz')] })).toContain('entry:Altersresistenz')
   })
   it('allows the same entry with another specification (a second Ortskenntnis)', () => {
      const data = { ...emptyDraft(), species: 'Mensch' as const, culture: 'Mittelreich', language: 'Garethi', localKnowledge: 'Gareth',
         entries: [entry('generalSpecialAbilities', 'Ortskenntnis', 1, 'Havena')] }
      expect(creationLedger(data).entries[0].problems).not.toContain('Already part of the hero (species, culture or profession) or chosen twice.')
   })
})

describe('Geweihtenprofessionen and liturgies (S. 154–159, 305–333)', () => {
   const entry = (category: 'advantages' | 'disadvantages' | 'generalSpecialAbilities', catalogKey: string, level = 1, detail = '') => ({ category, catalogKey, level, detail, application: '' })
   const pkg = (key: string, choices: string[][] = []) => ({ kind: 'package' as const, key, variant: null, choices, application: 'Anwendung', tricks: [] })
   const rondra = (change: Partial<CreationDraftData> = {}): CreationDraftData => ({
      ...emptyDraft(), species: 'Mensch', culture: 'Mittelreich', language: 'Garethi',
      entries: [entry('advantages', 'Geweihter'), entry('disadvantages', 'Prinzipientreue', 2, 'Rondrakirche'), entry('disadvantages', 'Verpflichtungen', 2, 'Tempel'),
         entry('generalSpecialAbilities', 'Tradition (Rondrakirche)')],
      profession: pkg('Rondrageweihter', [['Hiebwaffen']]), ...change,
   })
   it('lists the 6 priest professions with their AP', () => {
      expect(Object.fromEntries(professionCatalog.filter((item) => item.group === 'divine').map((item) => [item.key, item.ap]))).toEqual({
         Borongeweihter: 285, Hesindegeweihter: 312, Perainegeweihter: 290, Phexgeweihter: 304, Praiosgeweihter: 242, Rondrageweihter: 283,
      })
   })
   it('packages hold only known liturgies of their own church or general ones', () => {
      for (const profession of professionCatalog.filter((item) => item.group === 'divine')) {
         for (const key of Object.keys(profession.liturgies ?? {})) {
            const liturgy = liturgies.find((item) => item.key === key)
            expect(liturgy, `${profession.key}: ${key}`).toBeDefined()
            expect(liturgyAvailable(liturgy!, profession.family as never), `${profession.key}: ${key}`).toBe(true)
         }
      }
   })
   it('the catalog has 34 liturgies, 6 ceremonies and 12 blessings (S. 322–333)', () => {
      expect(liturgies.filter((item) => item.kind === 'Liturgie')).toHaveLength(34)
      expect(liturgies.filter((item) => item.kind === 'Zeremonie')).toHaveLength(6)
      expect(blessings).toHaveLength(12)
   })
   it('the package grants its liturgies at their values and Die Zwölf Segnungen', () => {
      const ledger = creationLedger(rondra())
      expect(ledger.liturgies.Ehrenhaftigkeit).toMatchObject({ base: 6, value: 6, cost: 0 })
      expect(ledger.granted.blessings).toHaveLength(12)
      expect(ledger.violations.map((issue) => issue.key)).not.toContain('twelve-blessings')
   })
   it('requires Geweihter, the church tradition and the listed disadvantages (S. 159)', () => {
      const bare = rondra({ entries: [] })
      expect(issues(bare)).toEqual(expect.arrayContaining(['requires:Geweihter', 'requires:Tradition (Rondrakirche)', 'requires:Prinzipientreue', 'requires:Verpflichtungen']))
   })
   it('only general liturgies and those of the own church (S. 322)', () => {
      expect(issues(rondra({ liturgies: { Heilsegen: 0 } }))).toContain('liturgy:Heilsegen')
      expect(issues(rondra({ liturgies: { 'Göttliches Zeichen': 0 } }))).not.toContain('liturgy:Göttliches Zeichen')
   })
   it('a custom priest of the Twelve must buy Die Zwölf Segnungen (S. 324)', () => {
      const custom = rondra({ profession: { kind: 'custom', name: 'Tempeldiener' } })
      expect(issues(custom)).toContain('twelve-blessings')
      const blessed = { ...custom, blessings: blessings.map((item) => item.key) }
      expect(issues(blessed)).not.toContain('twelve-blessings')
      expect(creationLedger(blessed).costs.skills - creationLedger(custom).costs.skills).toBe(12)
   })
   it('Finish records liturgies, the package blessings and the KaP', () => {
      const data = rondra({ name: 'Chris', attributes: { ...emptyDraft().attributes, courage: 14 } })
      const ledger = creationLedger(data)
      const { stats } = finishedHero(data, ledger)
      expect(stats.liturgies.find((item) => item.key === 'Schmerzresistenz')).toMatchObject({ value: 6, paidAP: 0 })
      expect(stats.blessings).toHaveLength(12)
      expect(stats.isConsecratedPerson).toBe(true)
      // source: S. 57 (KaP = 20 + Leiteigenschaft; Rondra: MU)
      expect(ledger.derived.karma.value).toBe(20 + 14)
   })
})

describe('Liturgy rules (S. 39, 177, 321)', () => {
   const state = (abilities: string[], disadvantages: string[] = []) => ({ courage: 14, intuition: 13, charisma: 12, advantages: ['Geweihter'], disadvantages, generalSpecialAbilities: abilities })
   const ehrenhaftigkeit = liturgies.find((item) => item.key === 'Ehrenhaftigkeit')!
   it('the maximum is the highest check attribute + 2, at most 14 without Aspektkenntnis', () => {
      expect(liturgyMaximum(state(['Tradition (Rondrakirche)']), ehrenhaftigkeit)).toBe(14)
      expect(liturgyMaximum({ ...state(['Tradition (Rondrakirche)', 'Aspektkenntnis (Schild)']), courage: 16 }, ehrenhaftigkeit)).toBe(18)
   })
   it('Schwacher Karmalkörper costs one more KaP per spend (S. 177)', () => {
      expect(karmaSpend(state([], ['Schwacher Karmalkörper']), 4, 20)).toEqual({ total: 5, extra: 1 })
      expect(karmaSpend(state([]), 4, 20)).toEqual({ total: 4, extra: 0 })
   })
})
