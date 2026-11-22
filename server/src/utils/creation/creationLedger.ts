import { advancementCost } from '../advancement'
import { calcBaseAttributes } from '../baseAttributes'
import { characterEntryCatalog, type EntryCategory, type EntrySelection } from '../characterEntryCatalog'
import { entryName, quoteEntry, type EntryState } from '../characterEntryRules'
import { combatAbilities, combatTechniques } from '../combatRules'
import { energyMaximum, healthMaximum } from '../energyRules'
import { entryValueBonus } from '../entryDerivedValues'
import { magicSpells, magicTricks } from '../magicCatalog'
import { isForeignSpell, spellMaximum } from '../magicRules'
import { blessingAp, blessings, liturgies, liturgyAvailable } from '../karmaCatalog'
import { heroChurch, liturgyMaximum } from '../karmaRules'
import { combatTechniqueMaximum, talentMaximum } from '../skillMaximum'
import { talentCatalog, type TalentAttribute } from '../talentCatalog'
import { capsFor, creationLimits, type ExperienceLevel } from './experienceCaps'
import { cultureFor, type CultureDefinition } from './cultureCatalog'
import { professionFor, resolvedProfession, type ProfessionDefinition } from './professionCatalog'
import { speciesFor, type SpeciesKey } from './speciesCatalog'

export const attributeKeys: TalentAttribute[] = ['courage', 'wisdom', 'intuition', 'charisma', 'fingerDexterity', 'dexterity', 'constitution', 'strength']
export const creationSections = ['basics', 'species', 'culture', 'attributes', 'profession', 'entries', 'skills', 'abilities', 'finish'] as const
export type CreationSection = typeof creationSections[number]

export type CreationDraftData = {
   level: ExperienceLevel
   species: SpeciesKey | null
   // Mensch/Halbelf: attribute whose maximum rises by 1; Elf/Zwerg: attribute whose maximum drops by 2 (S. 88–93)
   speciesChoice: TalentAttribute | null
   culture: string | null
   culturePackage: boolean
   language: string | null
   script: string | null
   localKnowledge: string
   attributes: Record<TalentAttribute, number>
   // package: chosen technique per choice slot and the application of the package's Fertigkeitsspezialisierung
   profession: { kind: 'none' } | { kind: 'custom'; name: string } | { kind: 'package'; key: string; variant: string | null; choices: string[][]; application: string; tricks?: string[] }
   entries: EntrySelection[]
   talents: Record<string, number>
   techniques: Record<string, number>
   spells: Record<string, number>
   tricks: string[]
   // Liturgies/ceremonies (FW) and blessings bought besides the profession package (S. 305–333)
   liturgies?: Record<string, number>
   blessings?: string[]
   // Combat special abilities bought besides the profession package (S. 51–55); levels are separate keys ("Finte II")
   combatAbilities?: string[]
   approvals: string[]
   name: string
   sex: 'male' | 'female' | 'other'
   age: number | null
   background: string
}

// Messages are English templates with {placeholders}; the client translates them.
export type CreationIssue = { section: CreationSection; key: string; message: string; values?: Record<string, string | number> }
export type CreationWarning = CreationIssue & { approved: boolean }
export type LedgerEntry = { category: EntryCategory; name: string; ap: number; problems: string[] }
export type DerivedPart = { label: string; value: number }
export type CreationLedger = {
   apTotal: number
   costs: Record<CreationSection, number>
   spent: number
   balance: number
   caps: {
      attributes: Record<TalentAttribute, number>; attributeSum: number; skill: number; technique: number; spells: number
      advantageAp: number; disadvantageAp: number
   }
   usage: { attributeSum: number; advantageAp: number; disadvantageAp: number; spells: number; liturgies: number }
   packageTalents: Record<string, number>
   profession: { key: string; variant: string | null; ap: number; languageBudget: number; budgetUsed: number; budgetIncludesScripts: boolean; curseBudget: number; curseUsed: number } | null
   // Every talent is active from FW 0 (S. 25); base = package value, else 0
   talents: Record<string, { base: number; value: number; cost: number; maximum: number }>
   techniques: Record<string, { base: number; value: number; cost: number; maximum: number }>
   spells: Record<string, { base: number | null; value: number; cost: number; maximum: number }>
   liturgies: Record<string, { base: number | null; value: number; cost: number; maximum: number }>
   entries: LedgerEntry[]
   combatAbilities: Array<{ key: string; ap: number; problems: string[] }>
   granted: { advantages: string[]; disadvantages: string[]; generalSpecialAbilities: string[]; languages: string[]; combatSpecialAbilities: string[]; tricks: string[]; blessings: string[] }
   derived: Record<'health' | 'mana' | 'karma' | 'soulPower' | 'toughness' | 'dodge' | 'initiative' | 'speed' | 'fatePoints', { value: number; parts: DerivedPart[] }>
   violations: CreationIssue[]
   warnings: CreationWarning[]
}

const roundHalfUp = (value: number) => Math.floor(value + 0.5)
const stepCost = (from: number, to: number, factor: 'a' | 'b' | 'c' | 'd' | 'e') =>
   to >= from ? advancementCost(from, to, factor, true) : -advancementCost(to, from, factor, true)
// Problems that do not apply while creating: the ledger checks the balance itself and creation-only entries are allowed.
const ignoredProblems = new Set(['Not enough available AP.', 'Creation-only: record the existing entry instead of purchasing it during play.'])

// source: DSA5 Regelwerk, S. 44, 97–125 (Übliche Professionen of the culture)
export function usualProfession(culture: CultureDefinition, profession: ProfessionDefinition) {
   if (profession.group === 'worldly') {
      const worldly = culture.professions.worldly
      return 'only' in worldly ? worldly.only.includes(profession.key) : !worldly.except.includes(profession.key)
   }
   const family = profession.family ?? profession.key
   return (profession.group === 'magic' ? culture.professions.magic : culture.professions.divine).includes(family)
}

export function emptyDraft(level: ExperienceLevel = 'Erfahren'): CreationDraftData {
   return {
      level, species: null, speciesChoice: null, culture: null, culturePackage: false, language: null, script: null, localKnowledge: '',
      attributes: Object.fromEntries(attributeKeys.map((key) => [key, creationLimits.attributeStart])) as Record<TalentAttribute, number>,
      profession: { kind: 'none' }, entries: [], talents: {}, techniques: {}, spells: {}, tricks: [], liturgies: {}, blessings: [], combatAbilities: [], approvals: [],
      name: '', sex: 'other', age: null, background: '',
   }
}

// source: DSA5 Regelwerk, S. 37–59 (Heldenerschaffung: AP account, EG caps, species, culture, attributes, entries, skills, base values)
export function creationLedger(draft: CreationDraftData): CreationLedger {
   const caps = capsFor(draft.level)
   const species = speciesFor(draft.species)
   const culture = cultureFor(draft.culture)
   const violations: CreationIssue[] = []
   const warnings: CreationWarning[] = []
   const warn = (issue: CreationIssue) => warnings.push({ ...issue, approved: draft.approvals.includes(issue.key) })
   const costs = Object.fromEntries([...['basics', 'species', 'culture', 'attributes', 'profession', 'entries', 'skills', 'abilities', 'finish']].map((key) => [key, 0])) as Record<CreationSection, number>

   // Spezies (S. 40, 87–94)
   if (species) {
      costs.species = species.ap
      if (species.choice.value < 0 && !draft.speciesChoice) violations.push({ section: 'species', key: 'species-choice', message: 'Choose which attribute maximum drops by 2.' })
      if (draft.speciesChoice && !species.choice.options.includes(draft.speciesChoice)) violations.push({ section: 'species', key: 'species-choice', message: 'This attribute is not an option for the species.' })
   }

   // Kultur (S. 40–42): free mother tongue III and Ortskenntnis; package optional and whole; the script costs 2 AP
   const packageTalents = culture && draft.culturePackage ? culture.package.talents : {}
   if (culture) {
      costs.culture = draft.culturePackage ? culture.package.ap : 0
      if (species && !species.cultures.includes(culture.key)) warn({ section: 'culture', key: `culture:${culture.key}`, message: 'Unusual culture for this species: needs the GM’s approval (S. 40).' })
      if (!draft.language || !culture.languages.includes(draft.language)) violations.push({ section: 'culture', key: 'language', message: 'Choose the mother tongue of the culture.' })
   }

   // Profession (S. 44–45, 128): package AP; variant restrictions; unusual for the culture needs the GM
   const chosenProfession = draft.profession.kind === 'package' ? draft.profession : null
   const professionDefinition = chosenProfession ? professionFor(chosenProfession.key) : null
   const profession = professionDefinition ? resolvedProfession(professionDefinition, chosenProfession!.variant) : null
   if (chosenProfession && !professionDefinition) violations.push({ section: 'profession', key: 'profession', message: 'Unknown entry: {name}.', values: { name: chosenProfession.key } })
   const chosenTechniques: Record<string, number> = {}
   if (profession && chosenProfession) {
      costs.profession = profession.ap
      const variant = profession.variant
      if (chosenProfession.variant && !variant) violations.push({ section: 'profession', key: 'variant', message: 'Unknown entry: {name}.', values: { name: chosenProfession.variant } })
      if (variant?.cultures && culture && !variant.cultures.includes(culture.key))
         violations.push({ section: 'profession', key: 'variant-culture', message: '{variant} requires the culture {cultures} (S. {page}).', values: { variant: variant.key, cultures: variant.cultures.join(', '), page: profession.profession.page } })
      if (variant?.sex && draft.sex !== variant.sex) violations.push({ section: 'profession', key: 'variant-sex', message: '{variant} must be female (S. {page}).', values: { variant: variant.key, page: profession.profession.page } })
      if (culture && !usualProfession(culture, profession.profession)) warn({ section: 'profession', key: `profession:${profession.profession.key}`, message: 'Unusual profession for this culture: needs the GM’s approval (S. 44).' })
      profession.choices.forEach((slot, index) => {
         const picked = [...new Set(chosenProfession.choices[index] ?? [])].filter((key) => slot.options.includes(key))
         if (picked.length !== slot.count) violations.push({ section: 'profession', key: `choice:${index}`, message: 'Choose {count} of: {options}.', values: { count: slot.count, options: slot.options.join(', ') } })
         for (const key of picked) chosenTechniques[key] = Math.max(chosenTechniques[key] ?? 0, slot.value)
      })
      if (profession.specialization && !chosenProfession.application.trim()) violations.push({ section: 'profession', key: 'application', message: 'Choose the application of the Fertigkeitsspezialisierung ({skill}).', values: { skill: profession.specialization } })
   }

   // Eigenschaften (S. 43–44, 88): start at 8, column E; species modifiers change only the maximum
   const attributeMax = Object.fromEntries(attributeKeys.map((key) => [key, caps.attribute + (species?.attributeMax[key] ?? 0) +
      (species && draft.speciesChoice === key ? species.choice.value : 0)])) as Record<TalentAttribute, number>
   let attributeSum = 0
   for (const key of attributeKeys) {
      const value = draft.attributes[key]
      attributeSum += value
      if (value < creationLimits.attributeStart) violations.push({ section: 'attributes', key: `attribute:${key}`, message: 'Attributes start at 8 (S. 43).' })
      else costs.attributes += advancementCost(creationLimits.attributeStart, value, 'e', true)
      if (value > attributeMax[key]) violations.push({ section: 'attributes', key: `attribute:${key}`, message: '{attribute} {value} is above its maximum {max} (S. 39, 88).', values: { attribute: key, value, max: attributeMax[key] } })
   }
   if (attributeSum > caps.attributeSum) violations.push({ section: 'attributes', key: 'attribute-sum', message: 'The attribute sum {sum} is above {max} (S. 39).', values: { sum: attributeSum, max: caps.attributeSum } })

   // Granted entries: species automatics (paid in the species AP), mother tongue III and Ortskenntnis (S. 41, 91)
   const granted = {
      advantages: [...species?.automatic.advantages ?? []], disadvantages: [...species?.automatic.disadvantages ?? []],
      generalSpecialAbilities: [...draft.localKnowledge.trim() ? [`Ortskenntnis (${draft.localKnowledge.trim()})`] : [],
         ...profession?.specialization && chosenProfession?.application.trim() ? [`Fertigkeitsspezialisierung (${profession.specialization}: ${chosenProfession.application.trim()})`] : [],
         ...profession?.abilities ?? []],
      languages: draft.language ? [`${draft.language} III`] : [],
      // Combat special abilities in the profession package (S. 128)
      combatSpecialAbilities: [...profession?.combatAbilities ?? []],
      tricks: [] as string[],
      blessings: [] as string[],
   }

   // Talente, Kampftechniken, Zauber (S. 25, 50): package values are the base; lowering refunds, raising costs
   const values = { ...draft.attributes, advantages: [] as string[] }
   const talents: CreationLedger['talents'] = {}
   for (const talent of talentCatalog) {
      // User decision: profession values and culture bonuses add up (archetype Allacaya: Fährtensuchen 7 + 1 = 8)
      const base = (packageTalents[talent.key] ?? 0) + (profession?.talents[talent.key] ?? 0)
      const value = draft.talents[talent.key] ?? base
      // source: DSA5 Regelwerk, S. 25 ("Alle Talente sind aktiv"): no activation cost, only the raises from FW 0 or the package value
      const cost = stepCost(base, value, talent.stfClass)
      talents[talent.key] = { base, value, cost, maximum: caps.skill }
   }
   const techniques: CreationLedger['techniques'] = {}
   for (const technique of combatTechniques) {
      const base = Math.max(profession?.techniques[technique.key] ?? creationLimits.techniqueStart, chosenTechniques[technique.key] ?? 0)
      const value = draft.techniques[technique.key] ?? base
      if (value < creationLimits.techniqueStart) violations.push({ section: 'skills', key: `technique:${technique.key}`, message: 'Combat techniques start at 6 (S. 45).' })
      techniques[technique.key] = { base, value, cost: stepCost(base, Math.max(value, creationLimits.techniqueStart), technique.stfClass as 'b' | 'c' | 'd'), maximum: caps.technique }
   }

   // Entries (S. 46–49, 51–55, 162): quoted one level at a time against all other entries
   const named = draft.entries.map((selection) => {
      const catalog = characterEntryCatalog.find((entry) => entry.category === selection.category && entry.key === selection.catalogKey)
      return { selection, catalog, name: catalog ? entryName(catalog, selection) : selection.catalogKey }
   })
   const owned = (category: EntryCategory, skip?: string) => [...(category in granted ? granted[category as keyof typeof granted] : []),
      ...(category === 'scripts' && draft.script ? [draft.script] : []),
      ...named.filter((item) => item.selection.category === category && item.name !== skip).map((item) => item.name)]
   const stateFor = (skip?: string): EntryState => ({
      advantages: owned('advantages', skip), disadvantages: owned('disadvantages', skip), generalSpecialAbilities: owned('generalSpecialAbilities', skip),
      languages: owned('languages', skip), scripts: owned('scripts', skip),
      ...draft.attributes,
      talents: Object.entries(talents).map(([key, talent]) => ({ key, value: talent.value })),
      combatTechniques: Object.entries(techniques).map(([key, technique]) => ({ key, value: technique.value })),
      combatSpecialAbilities: [...granted.combatSpecialAbilities], entryPurchases: [], experience: { total: 1_000_000, spent: 0 },
      spells: Object.entries(draft.spells).map(([key, value]) => ({ key, value, notes: '', paidAP: 0 })),
      magicTricks: draft.tricks.map((key) => ({ key, paidAP: 0 })),
   })
   const entries: LedgerEntry[] = []
   const disadvantageValues = new Map<string, number>()
   let advantageAp = species?.automatic.advantageAp ?? 0
   for (const { selection, catalog, name } of named) {
      const section: CreationSection = selection.category === 'advantages' || selection.category === 'disadvantages' ? 'entries' : 'abilities'
      if (!catalog) {
         entries.push({ category: selection.category, name, ap: 0, problems: ['Unknown entry.'] })
         violations.push({ section, key: `entry:${name}`, message: 'Unknown entry: {name}.', values: { name } })
         continue
      }
      const levels = catalog.levels ? selection.level : 1
      let ap = 0
      const problems = new Set<string>()
      // Already granted by species, culture or profession, or chosen twice (entries with a specification only with the same one)
      const sameEntry = (other: string) => other === name || (!catalog.parameter && !catalog.choices && (other === catalog.key || other.startsWith(`${catalog.key} `)))
      const grantedHere = selection.category in granted ? granted[selection.category as keyof typeof granted] as string[] : []
      const position = named.findIndex((item) => item.selection === selection)
      if (grantedHere.some(sameEntry) || (selection.category === 'scripts' && draft.script === catalog.key) ||
         named.some((other, index) => index < position && other.selection.category === selection.category && sameEntry(other.name)))
         problems.add('Already part of the hero (species, culture or profession) or chosen twice.')
      try {
         for (let level = 1; level <= levels; level++) {
            const state = stateFor(name)
            if (level > 1) state[selection.category].push(entryName(catalog, { ...selection, level: level - 1 }))
            const quote = quoteEntry(state, { ...selection, level }, selection.category === 'disadvantages' ? 'record' : 'purchase')
            ap += quote.ap
            for (const problem of quote.problems) if (!ignoredProblems.has(problem) && !problem.startsWith('Already recorded')) problems.add(problem)
            if (level === levels && quote.approval) warn({ section, key: `entry:${name}`, message: 'GM approval: {name}', values: { name } })
         }
      } catch (error) {
         problems.add(error instanceof Error ? error.message : String(error))
      }
      if (selection.category === 'disadvantages') {
         // source: DSA5 Regelwerk, S. 175, 179 (only the highest level of principles/obligations gives AP)
         const identity = catalog.creditHighestOnly ? catalog.key : `${catalog.key}:${selection.detail}`
         disadvantageValues.set(identity, Math.max(disadvantageValues.get(identity) ?? 0, ap))
      } else {
         if (selection.category === 'advantages') advantageAp += ap
         costs[section] += ap
      }
      entries.push({ category: selection.category, name, ap: selection.category === 'disadvantages' ? -ap : ap, problems: [...problems] })
      for (const problem of problems) violations.push({ section, key: `entry:${name}`, message: '{name}: {problem}', values: { name, problem } })
   }
   const disadvantageAp = [...disadvantageValues.values()].reduce((sum, value) => sum + value, 0)
   costs.entries -= disadvantageAp
   // source: DSA5 Regelwerk, S. 39, 46, 91 (at most 80 AP each; the species' automatic advantages count)
   if (advantageAp > creationLimits.advantageAp) violations.push({ section: 'entries', key: 'advantage-ap', message: 'Advantages may cost at most 80 AP ({ap}).', values: { ap: advantageAp } })
   if (disadvantageAp > creationLimits.disadvantageAp) violations.push({ section: 'entries', key: 'disadvantage-ap', message: 'Disadvantages may give at most 80 AP ({ap}).', values: { ap: disadvantageAp } })
   if (culture && draft.script) {
      if (!culture.scripts.includes(draft.script)) violations.push({ section: 'culture', key: 'script', message: 'Choose one of the culture’s scripts.' })
      costs.culture += characterEntryCatalog.find((entry) => entry.category === 'scripts' && entry.key === draft.script)?.ap ?? 0
   }
   values.advantages = owned('advantages')

   // Package prerequisites are paid separately (S. 128): advantages, and the attributes of its special abilities (S. 54–55)
   let budgetUsed = 0
   if (profession) {
      if (profession.profession.requiredSpecies && (!species || !profession.profession.requiredSpecies.includes(species.key)))
         violations.push({ section: 'profession', key: 'requires-species', message: '{profession} requires the species {name} (S. 128).', values: { profession: profession.profession.key, name: profession.profession.requiredSpecies.join(', ') } })
      for (const advantage of profession.profession.requiredAdvantages ?? []) {
         if (!owned('advantages').some((name) => name === advantage || name.startsWith(`${advantage} `)))
            violations.push({ section: 'profession', key: `requires:${advantage}`, message: '{profession} requires the advantage {name}; buy it separately (S. 128).', values: { profession: profession.profession.key, name: advantage } })
      }
      for (const ability of profession.profession.requiredAbilities ?? []) {
         if (!owned('generalSpecialAbilities').includes(ability))
            violations.push({ section: 'profession', key: `requires:${ability}`, message: '{profession} requires the special ability {name}; buy it separately (S. 128).', values: { profession: profession.profession.key, name: ability } })
      }
      for (const { key, level } of profession.profession.requiredDisadvantages ?? []) {
         const owns = draft.entries.some((entry) => entry.category === 'disadvantages' && entry.catalogKey === key && entry.level >= level)
         if (!owns) violations.push({ section: 'profession', key: `requires:${key}`, message: '{profession} requires the disadvantage {name}; take it separately (S. 128).', values: { profession: profession.profession.key, name: `${key} ${['I', 'II', 'III', 'IV'][level - 1]}` } })
      }
      for (const name of granted.combatSpecialAbilities) {
         for (const requirement of combatAbilities.find((ability) => ability.key === name)?.requirements ?? []) {
            if ('attribute' in requirement && draft.attributes[requirement.attribute] < requirement.minimum)
               violations.push({ section: 'profession', key: `sf:${name}`, message: '{name} needs {attribute} {minimum} (S. 54–55).', values: { name, attribute: requirement.attribute, minimum: requirement.minimum } })
         }
      }
      // source: DSA5 Regelwerk, S. 128 ("Sprachen (und Schriften) für insgesamt N AP" are part of the package price)
      // App choice: the budget pays the first languages/scripts bought; unused budget is not refunded.
      const languageAp = entries.filter((entry) => entry.category === 'languages' || (profession.profession.budgetIncludesScripts && entry.category === 'scripts'))
         .reduce((sum, entry) => sum + Math.max(0, entry.ap), 0)
      const scriptAp = profession.profession.budgetIncludesScripts && culture && draft.script
         ? characterEntryCatalog.find((entry) => entry.category === 'scripts' && entry.key === draft.script)?.ap ?? 0 : 0
      budgetUsed = Math.min(profession.profession.languageBudget, languageAp + scriptAp)
      costs.profession -= budgetUsed
   }
   // Combat special abilities bought at creation (S. 51–55, 54): AP, attribute/talent prerequisites and earlier levels
   const boughtCombat = [...new Set(draft.combatAbilities ?? [])]
   const combatOwned = [...granted.combatSpecialAbilities, ...boughtCombat]
   const combatRows: CreationLedger['combatAbilities'] = boughtCombat.map((key) => {
      const ability = combatAbilities.find((entry) => entry.key === key)
      if (!ability) {
         violations.push({ section: 'abilities', key: `combat:${key}`, message: 'Unknown entry: {name}.', values: { name: key } })
         return { key, ap: 0, problems: ['Unknown entry.'] }
      }
      const problems: string[] = []
      if (granted.combatSpecialAbilities.includes(key)) problems.push('Already part of the hero (species, culture or profession) or chosen twice.')
      for (const requirement of ability.requirements) {
         const unmet = 'attribute' in requirement ? draft.attributes[requirement.attribute] < requirement.minimum
            : 'talent' in requirement ? (talents[requirement.talent]?.value ?? 0) < requirement.minimum
               : !combatOwned.includes(requirement.ability)
         if (!unmet) continue
         const needed = 'attribute' in requirement ? requirement.attribute : 'talent' in requirement ? requirement.talent : requirement.ability
         const minimum = 'ability' in requirement ? null : requirement.minimum
         problems.push(minimum === null ? needed : `${needed} ${minimum}`)
         violations.push(minimum === null
            ? { section: 'abilities', key: `combat:${key}`, message: '{name} needs {requirement}.', values: { name: key, requirement: needed } }
            : { section: 'abilities', key: `combat:${key}`, message: '{name} needs {requirement} {minimum} (S. 54–55).', values: { name: key, requirement: needed, minimum } })
      }
      if (granted.combatSpecialAbilities.includes(key)) violations.push({ section: 'abilities', key: `combat:${key}`, message: '{name}: {problem}', values: { name: key, problem: problems[0] } })
      const ap = granted.combatSpecialAbilities.includes(key) ? 0 : ability.ap
      costs.abilities += ap
      return { key, ap, problems }
   })

   for (const recommended of species?.recommended ?? []) {
      if (![...owned('advantages'), ...owned('disadvantages')].some((name) => name === recommended || name.startsWith(`${recommended} `)))
         warn({ section: 'entries', key: `recommended:${recommended}`, message: 'Strongly recommended for the species: {name}; skip it only with the GM (S. 91, 94).', values: { name: recommended } })
   }

   // Caps on the final values (S. 39): EG maximum and highest attribute + 2
   for (const talent of talentCatalog) {
      const entry = talents[talent.key]
      entry.maximum = Math.min(caps.skill, talentMaximum(values, talent.key) ?? caps.skill)
      if (entry.value > entry.maximum) violations.push({ section: 'skills', key: `talent:${talent.key}`, message: '{skill} {value} is above its maximum {max} (S. 39).', values: { skill: talent.key, value: entry.value, max: entry.maximum } })
      costs.skills += entry.cost
   }
   for (const technique of combatTechniques) {
      const entry = techniques[technique.key]
      entry.maximum = Math.min(caps.technique, combatTechniqueMaximum(values, technique.key) ?? caps.technique)
      if (entry.value > entry.maximum) violations.push({ section: 'skills', key: `technique:${technique.key}`, message: '{skill} {value} is above its maximum {max} (S. 39).', values: { skill: technique.key, value: entry.value, max: entry.maximum } })
      costs.skills += entry.cost
   }
   const caster = owned('advantages').includes('Zauberer')
   const spells: CreationLedger['spells'] = {}
   // Package spells are activated at their package value (S. 45); others are activated and raised from FW 0
   const packageSpells = profession?.spells ?? {}
   const spellValues = { ...packageSpells, ...draft.spells }
   const magicState = { ...draft.attributes, advantages: owned('advantages'), generalSpecialAbilities: owned('generalSpecialAbilities'),
      spells: Object.entries(spellValues).map(([key, value]) => ({ key, value, notes: '', paidAP: 0 })), magicSettings: { guildSpell: null } }
   let foreignSpells = 0
   let curseAp = 0
   for (const [key, value] of Object.entries(spellValues)) {
      const spell = magicSpells.find((entry) => entry.key === key)
      if (!spell) {
         violations.push({ section: 'skills', key: `spell:${key}`, message: 'Unknown entry: {name}.', values: { name: key } })
         continue
      }
      const base = packageSpells[key] ?? null
      const maximum = Math.min(caps.skill, spellMaximum(magicState, spell))
      const cost = base === null ? advancementCost(null, value, spell.stfClass, true) : stepCost(base, value, spell.stfClass)
      spells[key] = { base, value, cost, maximum }
      costs.skills += cost
      if (spell.kind === 'Hexenfluch') curseAp += Math.max(0, cost)
      // source: DSA5 Regelwerk, S. 39, 45 (Fremdzauber: spells of another tradition, limited by the EG)
      if (isForeignSpell(magicState, spell)) foreignSpells++
      if (value > maximum) violations.push({ section: 'skills', key: `spell:${key}`, message: '{skill} {value} is above its maximum {max} (S. 39).', values: { skill: key, value, max: maximum } })
      // source: DSA5 Regelwerk, S. 278, 281, 283 (curses only for witches, elven songs only for elves)
      if (spell.kind === 'Hexenfluch' && !owned('generalSpecialAbilities').includes('Tradition (Hexe)'))
         violations.push({ section: 'skills', key: `spell:${key}`, message: '{name} needs {requirement}.', values: { name: key, requirement: 'Tradition (Hexe)' } })
      if (spell.kind === 'Elfenlied' && !owned('generalSpecialAbilities').includes('Tradition (Elf)'))
         violations.push({ section: 'skills', key: `spell:${key}`, message: '{name} needs {requirement}.', values: { name: key, requirement: 'Tradition (Elf)' } })
   }
   // Package Zaubertricks are part of the price; others cost 1 AP each (S. 285)
   const packageTricks = profession?.tricks && chosenProfession ? [...new Set(chosenProfession.tricks ?? [])].filter((key) => profession.tricks!.options.includes(key)) : []
   if (profession?.tricks && packageTricks.length !== profession.tricks.count)
      violations.push({ section: 'profession', key: 'trick-choice', message: 'Choose {count} of: {options}.', values: { count: profession.tricks.count, options: profession.tricks.options.join(', ') } })
   const boughtTricks = draft.tricks.filter((key) => !packageTricks.includes(key))
   for (const key of boughtTricks) {
      if (!magicTricks.some((trick) => trick.key === key)) violations.push({ section: 'skills', key: `trick:${key}`, message: 'Unknown entry: {name}.', values: { name: key } })
      costs.skills += 1
   }
   granted.tricks = packageTricks
   const spellCount = Object.keys(spells).length
   if (spellCount > caps.spells) violations.push({ section: 'skills', key: 'spell-count', message: 'At most {max} spells at this Erfahrungsgrad (S. 39).', values: { max: caps.spells } })
   if (foreignSpells > caps.foreignSpells) violations.push({ section: 'skills', key: 'foreign-spells', message: 'At most {max} spells of another tradition at this Erfahrungsgrad (S. 39).', values: { max: caps.foreignSpells } })
   if ((spellCount > 0 || draft.tricks.length > 0 || packageTricks.length > 0) && !caster) violations.push({ section: 'skills', key: 'spell-caster', message: 'Spells and Zaubertricks need the advantage Zauberer (S. 38).' })
   // source: DSA5 Regelwerk, S. 147–149 ("Flüche für insgesamt N AP" are part of the witch package price)
   const curseUsed = Math.min(profession?.curseBudget ?? 0, curseAp)
   costs.profession -= curseUsed

   // Liturgies and ceremonies (S. 306, 322): package values are the base; only general ones and those of the own church
   const priest = owned('advantages').includes('Geweihter')
   const karmaState = { ...draft.attributes, advantages: owned('advantages'), disadvantages: owned('disadvantages'), generalSpecialAbilities: owned('generalSpecialAbilities') }
   const church = heroChurch(karmaState)
   const packageLiturgies = profession?.liturgies ?? {}
   const liturgyValues = { ...packageLiturgies, ...draft.liturgies }
   const liturgyRows: CreationLedger['liturgies'] = {}
   for (const [key, value] of Object.entries(liturgyValues)) {
      const liturgy = liturgies.find((entry) => entry.key === key)
      if (!liturgy) {
         violations.push({ section: 'skills', key: `liturgy:${key}`, message: 'Unknown entry: {name}.', values: { name: key } })
         continue
      }
      const base = packageLiturgies[key] ?? null
      const maximum = Math.min(caps.skill, liturgyMaximum(karmaState, liturgy))
      const cost = base === null ? advancementCost(null, value, liturgy.stfClass, true) : stepCost(base, value, liturgy.stfClass)
      liturgyRows[key] = { base, value, cost, maximum }
      costs.skills += cost
      if (value > maximum) violations.push({ section: 'skills', key: `liturgy:${key}`, message: '{skill} {value} is above its maximum {max} (S. 39).', values: { skill: key, value, max: maximum } })
      if (church && !liturgyAvailable(liturgy, church)) violations.push({ section: 'skills', key: `liturgy:${key}`, message: '{name} is not a liturgy of your church (S. 322).', values: { name: key } })
   }
   const liturgyCount = Object.keys(liturgyRows).length
   // App choice: the EG limit "Zauber/Liturgien" (S. 39) is applied to spells and liturgies each
   if (liturgyCount > caps.spells) violations.push({ section: 'skills', key: 'liturgy-count', message: 'At most {max} liturgies at this Erfahrungsgrad (S. 39).', values: { max: caps.spells } })
   // Blessings: the package's Zwölf Segnungen are part of its price; others 1 AP each (S. 322, 324)
   granted.blessings = profession?.blessings === 'twelve' ? blessings.map((entry) => entry.key) : []
   const boughtBlessings = [...new Set(draft.blessings ?? [])].filter((key) => !granted.blessings.includes(key))
   for (const key of boughtBlessings) {
      if (!blessings.some((entry) => entry.key === key)) violations.push({ section: 'skills', key: `blessing:${key}`, message: 'Unknown entry: {name}.', values: { name: key } })
      costs.skills += blessingAp
   }
   const ownedBlessings = [...granted.blessings, ...boughtBlessings]
   if ((liturgyCount > 0 || ownedBlessings.length > 0) && !priest) violations.push({ section: 'skills', key: 'liturgy-priest', message: 'Liturgies and blessings need the advantage Geweihter (S. 165).' })
   if (liturgyCount > 0 && priest && !church) violations.push({ section: 'skills', key: 'liturgy-church', message: 'Liturgies need the tradition of your church (S. 316–320).' })
   // source: DSA5 Regelwerk, S. 324 (priests of the Twelve must buy Die Zwölf Segnungen at creation; all six churches here are Zwölfgötter churches)
   if (priest && church && blessings.some((entry) => !ownedBlessings.includes(entry.key)))
      violations.push({ section: 'skills', key: 'twelve-blessings', message: 'Priests of the Twelve buy Die Zwölf Segnungen at creation (12 AP, S. 324).' })

   // Basiswerte (S. 56–57)
   const stateValues = { ...draft.attributes, advantages: owned('advantages'), disadvantages: owned('disadvantages'), generalSpecialAbilities: owned('generalSpecialAbilities') }
   const a = draft.attributes
   const health = healthMaximum(stateValues, species?.health ?? 0, 0, 0)
   const mana = energyMaximum(stateValues, 'mana', 0, 0, caster)
   const karma = energyMaximum(stateValues, 'karmaEnergy', 0, 0, owned('advantages').includes('Geweihter'))
   const soulBonus = entryValueBonus(stateValues, 'soulPower')
   const toughBonus = entryValueBonus(stateValues, 'toughness')
   const speedBonus = entryValueBonus(stateValues, 'speed')
   const fateBonus = entryValueBonus(stateValues, 'fatePoints')
   const derived: CreationLedger['derived'] = {
      health: { value: health, parts: [{ label: 'Species', value: species?.health ?? 0 }, { label: '2 × KO', value: 2 * a.constitution }, { label: 'Advantages', value: health - (species?.health ?? 0) - 2 * a.constitution }] },
      mana: { value: mana, parts: caster ? [{ label: 'Zauberer', value: 20 }, { label: 'Tradition', value: mana - 20 }] : [] },
      karma: { value: karma, parts: karma ? [{ label: 'Geweihter', value: 20 }, { label: 'Tradition', value: karma - 20 }] : [] },
      soulPower: { value: calcBaseAttributes.soulPower(species?.soulPower ?? 0, a.courage, a.wisdom, a.intuition, soulBonus), parts: [{ label: 'Species', value: species?.soulPower ?? 0 }, { label: '(MU + KL + IN) / 6', value: roundHalfUp((a.courage + a.wisdom + a.intuition) / 6) }, { label: 'Advantages', value: soulBonus }] },
      toughness: { value: calcBaseAttributes.toughness(species?.toughness ?? 0, a.strength, a.constitution, toughBonus), parts: [{ label: 'Species', value: species?.toughness ?? 0 }, { label: '(KO + KO + KK) / 6', value: roundHalfUp((2 * a.constitution + a.strength) / 6) }, { label: 'Advantages', value: toughBonus }] },
      dodge: { value: calcBaseAttributes.dodge(a.dexterity, 0), parts: [{ label: 'GE / 2', value: roundHalfUp(a.dexterity / 2) }] },
      initiative: { value: roundHalfUp((a.courage + a.dexterity) / 2), parts: [{ label: '(MU + GE) / 2', value: roundHalfUp((a.courage + a.dexterity) / 2) }] },
      speed: { value: (species?.speed ?? 0) + speedBonus, parts: [{ label: 'Species', value: species?.speed ?? 0 }, { label: 'Advantages', value: speedBonus }] },
      fatePoints: { value: Math.max(0, 3 + fateBonus), parts: [{ label: 'Base', value: 3 }, { label: 'Advantages', value: fateBonus }] },
   }

   // Abschluss (S. 38, 56): every hero needs species, culture and a name; 0–10 AP may be kept
   const spent = Object.values(costs).reduce((sum, value) => sum + value, 0)
   const balance = caps.ap - spent
   if (!species) violations.push({ section: 'species', key: 'species', message: 'Choose a species.' })
   if (!culture) violations.push({ section: 'culture', key: 'culture', message: 'Choose a culture.' })
   if (draft.name.trim().length < 2) violations.push({ section: 'finish', key: 'name', message: 'Give the hero a name.' })
   if (balance < 0) violations.push({ section: 'finish', key: 'balance', message: 'The AP account is {balance}: it must not be negative (S. 38).', values: { balance } })
   if (balance > creationLimits.leftoverAp) violations.push({ section: 'finish', key: 'balance', message: 'At most 10 AP may be kept ({balance} left, S. 56).', values: { balance } })
   for (const warning of warnings) if (!warning.approved) violations.push({ ...warning, key: `approval:${warning.key}`, message: 'Not approved yet: {name}', values: { name: warning.key.replace(/^[a-z-]+:/, '') } })

   return {
      apTotal: caps.ap, costs, spent, balance,
      caps: { attributes: attributeMax, attributeSum: caps.attributeSum, skill: caps.skill, technique: caps.technique, spells: caps.spells,
         advantageAp: creationLimits.advantageAp, disadvantageAp: creationLimits.disadvantageAp },
      usage: { attributeSum, advantageAp, disadvantageAp, spells: spellCount, liturgies: liturgyCount },
      liturgies: liturgyRows, combatAbilities: combatRows,
      packageTalents, talents, techniques, spells, entries, granted, derived, violations, warnings,
      profession: profession ? { key: profession.profession.key, variant: profession.variant?.key ?? null, ap: profession.ap,
         languageBudget: profession.profession.languageBudget, budgetUsed, budgetIncludesScripts: profession.profession.budgetIncludesScripts,
         curseBudget: profession.curseBudget, curseUsed } : null,
   }
}
