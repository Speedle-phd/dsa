import {
   characterEntryCatalog, entryCategories, entryRomans, languageScripts, staffCapacity, staffVolumes,
   type CatalogEntry, type EntryCategory, type EntryCredit, type EntryMode, type EntryPurchase, type EntryRequirement, type EntrySelection,
} from "./characterEntryCatalog"
import { talentCatalog } from "./talentCatalog"
import { combatTechniques } from "./combatRules"
import { BadRequestError } from "./appError"
import { magicSpells, magicTraditions, type OwnedSpell, type OwnedTrick } from "./magicCatalog"
import { meetsPropertyKnowledge } from "./magicRules"

export type EntryState = Record<EntryCategory, string[]> & {
   courage: number
   intuition: number
   fingerDexterity: number
   talents: Array<{ key: string; value: number | null }>
   combatTechniques: Array<{ key: string; value: number }>
   combatSpecialAbilities: string[]
   entryPurchases: EntryPurchase[]
   entryCredits?: EntryCredit[]
   experience: { total: number; spent: number; disadvantageCredit?: number }
   wisdom?: number
   charisma?: number
   spells?: OwnedSpell[]
   magicTricks?: OwnedTrick[]
}
export type EntryQuote = {
   key: string
   ap: number
   requirements: string[]
   problems: string[]
   approval: { de: string; en: string } | null
   effect: CatalogEntry["effect"]
}

function findEntry(selection: EntrySelection) {
   const entry = characterEntryCatalog.find((item) => item.category === selection.category && item.key === selection.catalogKey)
   if (!entry) throw new BadRequestError("Choose a verified catalog entry; custom entries can only be recorded.")
   return entry
}

export function entryName(entry: CatalogEntry, selection: EntrySelection) {
   const detail = selection.detail ? ` (${selection.detail}${selection.application ? `: ${selection.application}` : ""})` : ""
   return `${entry.key}${detail}${entry.levels ? ` ${entryRomans[selection.level - 1]}` : ""}`
}

export function selectionFromEntry(category: EntryCategory, key: string): EntrySelection | undefined {
   key = canonicalEntryName(category, key)
   const roman = / (VIII|VII|VI|IV|III|II|IX|X|V|I)$/.exec(key)
   const level = roman ? entryRomans.indexOf(roman[1]) + 1 : 1
   const base = roman ? key.slice(0, -roman[0].length) : key
   const sorted = characterEntryCatalog.filter((entry) => entry.category === category).sort((a, b) => b.key.length - a.key.length)
   for (const entry of sorted) {
      if (base === entry.key && !entry.parameter && !entry.choices) {
         // An old language without a level cannot establish a purchase prerequisite.
         if (category === "languages" && !roman) return undefined
         return { category, catalogKey: entry.key, level, detail: "", application: "" }
      }
      if ((entry.parameter || entry.choices) && base.startsWith(`${entry.key} (`) && base.endsWith(")")) {
         const parameter = base.slice(entry.key.length + 2, -1)
         const separator = entry.parameter === "specialization" ? parameter.indexOf(": ") : -1
         return {
            category, catalogKey: entry.key, level,
            detail: separator < 0 ? parameter : parameter.slice(0, separator),
            application: separator < 0 ? "" : parameter.slice(separator + 2),
         }
      }
   }
   return undefined
}

// source: DSA5 Regelwerk, S. 177 (legacy short names refer to the matching bad trait)
export function canonicalEntryName(category: EntryCategory, key: string) {
   if (category !== "disadvantages") return key
   const candidate = `Schlechte Eigenschaft (${key})`
   return characterEntryCatalog.some((entry) => entry.category === category && entry.key === candidate) ? candidate : key
}

export function entryEffect(category: EntryCategory, key: string) {
   const selection = selectionFromEntry(category, key)
   const entry = characterEntryCatalog.find((item) => item.category === category &&
      (item.key === selection?.catalogKey || item.key === key))
   return entry?.effect
}

function matches(key: string, prefix: string) {
   return key === prefix || key.startsWith(`${prefix} (`) || entryRomans.some((roman) => key === `${prefix} ${roman}`)
}
function talentValue(state: EntryState, key: string) {
   return state.talents.find((item) => item.key === key)?.value ?? 0
}
function entryRequirements(entry: CatalogEntry, selection: EntrySelection): EntryRequirement[] {
   const requirements = [...entry.requirements]
   if (entry.key === "Merkmalsfokus") requirements.push({ entry: `Merkmalskenntnis (${selection.detail})`, category: "generalSpecialAbilities" })
   // source: DSA5 Regelwerk, S. 219
   if (entry.key.startsWith("Schriftstellerei (")) requirements.push({ writing: true })
   if (entry.key === "Schriftstellerei (Fachpublikationen)") requirements.push({ talent: selection.detail, minimum: 4 })
   return requirements
}
function requirementMet(state: EntryState, requirement: EntryRequirement) {
   if ("talent" in requirement) return talentValue(state, requirement.talent) >= requirement.minimum
   if ("attribute" in requirement) return state[requirement.attribute] >= requirement.minimum
   if ("entry" in requirement) return state[requirement.category].some((key) => matches(canonicalEntryName(requirement.category, key), requirement.entry))
   if ("absent" in requirement) return !state[requirement.category].some((key) => matches(canonicalEntryName(requirement.category, key), requirement.absent))
   if ("sum" in requirement) return requirement.sum.reduce((sum, key) => sum + talentValue(state, key), 0) >= requirement.minimum
   if ("writing" in requirement) return state.languages.some((key) => {
      const language = selectionFromEntry("languages", key)
      return language?.level === 3 && languageScripts[language.catalogKey]?.some((script) => state.scripts.includes(script))
   })
   return state.combatTechniques.some((technique) =>
      combatTechniques.some((entry) => entry.key === technique.key && entry.ranged) && technique.value >= requirement.ranged)
}
function requirementLabel(requirement: EntryRequirement) {
   if ("talent" in requirement) return `${requirement.talent} FW ${requirement.minimum}`
   if ("attribute" in requirement) return `${{ courage: "MU", intuition: "IN", fingerDexterity: "FF" }[requirement.attribute]} ${requirement.minimum}`
   if ("entry" in requirement) return requirement.entry
   if ("absent" in requirement) return `Nicht / not: ${requirement.absent}`
   if ("sum" in requirement) return `${requirement.sum.join(" + ")} FW ≥ ${requirement.minimum}`
   if ("writing" in requirement) return "A level III language and its matching script are required."
   return `Fernkampf / ranged KtW ≥ ${requirement.ranged}`
}
function previousLevel(state: EntryState, selection: EntrySelection) {
   return state[selection.category].reduce((maximum, key) => {
      const item = selectionFromEntry(selection.category, key)
      return item?.catalogKey === selection.catalogKey && item.detail === selection.detail ? Math.max(maximum, item.level) : maximum
   }, 0)
}

// source: DSA5 Regelwerk, S. 162, 163–179, 215–224, 352
export function quoteEntry(state: EntryState, selection: EntrySelection, mode: EntryMode = "purchase"): EntryQuote {
   if (mode === "creation" && selection.category !== "disadvantages") throw new BadRequestError("Creation AP credits are only available for disadvantages.")
   const entry = findEntry(selection)
   if (!Number.isInteger(selection.level) || selection.level < 1 || selection.level > (entry.levels ?? 1)) {
      throw new BadRequestError("Choose a valid entry level.")
   }
   const detail = selection.detail.trim()
   if ((entry.parameter || entry.choices) ? !detail : Boolean(detail)) throw new BadRequestError("Provide the required specialization, or leave it empty for an unparameterized entry.")
   if (detail !== selection.detail || selection.application !== selection.application.trim()) throw new BadRequestError("Entry details must be trimmed.")
   if (entry.choices && !entry.choices.includes(detail)) throw new BadRequestError("Choose a listed specialization.")
   if (entry.parameter !== "specialization" && selection.application) throw new BadRequestError("This entry has no application field.")
   if (entry.parameter === "specialization" && !selection.application) throw new BadRequestError("Choose a talent application.")
   const skill = talentCatalog.find((item) => item.key === detail)
   const technique = combatTechniques.find((item) => item.key === detail)
   if ((entry.parameter === "talent" || entry.parameter === "specialization") && !skill) throw new BadRequestError("Choose a known talent.")
   if (entry.parameter === "technique" && !technique) throw new BadRequestError("Choose a known combat technique.")
   let ap = entry.ap
   if (entry.ordinalCosts) {
      const count = state[selection.category].filter((key) => selectionFromEntry(selection.category, key)?.catalogKey === entry.key).length
      ap = entry.ordinalCosts[Math.min(count, entry.ordinalCosts.length - 1)]
   }
   if (entry.key === "Tradition (Hexe)") {
      // source: DSA5 Regelwerk, S. 172 (one 10 AP discount per exclusion)
      ap -= ["Keine Flugsalbe", "Kein Vertrauter"].filter((key) => state.disadvantages.includes(key)).length * 10
   }
   if (entry.factor && skill) ap = ({ a: 1, b: 2, c: 3, d: 4 }[skill.stfClass]) * entry.factor
   if (entry.factor && technique) ap = ({ b: 1, c: 2, d: 3 }[technique.stfClass]) * entry.factor
   if (entry.key === "Herausragende Kampftechnik" && technique) ap = ({ b: 2, c: 3 }[technique.stfClass]) * 4
   if (entry.parameter === "immunity") {
      if (!Number.isInteger(selection.potency) || !selection.potency || selection.potency < 1 || selection.potency > 100) {
         throw new BadRequestError("Provide the verified poison/disease level (1–100).")
      }
      // source: DSA5 Regelwerk, S. 17, 167 (normal rounding of half the source level)
      ap = Math.round(selection.potency / 2)
   } else if (selection.potency !== undefined) throw new BadRequestError("Only immunities have a source level.")
   const entryRules = entryRequirements(entry, selection)
   const requirements = entryRules.map(requirementLabel)
   const problems = entryRules.filter((requirement) => !requirementMet(state, requirement)).map(requirementLabel)
   if (entry.key === "Merkmalskenntnis" && !meetsPropertyKnowledge(state, detail)) {
      problems.push("Merkmalskenntnis requires a tradition attribute of 15 and three matching spells at FW 10 (S. 285).")
   }
   if (entry.ordinalCosts && state[selection.category].filter((name) =>
      selectionFromEntry(selection.category, name)?.catalogKey === entry.key).length >= entry.ordinalCosts.length) {
      problems.push("All priced selections are already recorded; further selections require a verified expansion rule.")
   }
   const existing = previousLevel(state, selection)
   const key = entryName(entry, selection)
   if (state[selection.category].some((name) => canonicalEntryName(selection.category, name) === key) || (entry.levels && existing >= selection.level)) problems.push("Already recorded at this or a higher level.")
   if (entry.levels && selection.category !== "disadvantages" && existing < selection.level - 1) {
      requirements.push(`${entry.key} ${entryRomans[selection.level - 2]}`)
      problems.push("Record or purchase the previous level first.")
   }
   if (entry.creationOnly) problems.push("Creation-only: record the existing entry instead of purchasing it during play.")
   if (entry.recordOnly) problems.push("Record only: permanent AsP costs must be settled separately with your GM.")
   // source: DSA5 Regelwerk, S. 276 (a staff holds 18 volume points)
   if (entry.key in staffVolumes) {
      const used = staffVolumeUsed(state.generalSpecialAbilities)
      if (used + staffVolumes[entry.key] > staffCapacity) problems.push(`Staff volume: ${used} + ${staffVolumes[entry.key]} exceeds ${staffCapacity} (S. 276).`)
   }
   if (entry.key.startsWith("Tradition (") && entry.key.endsWith("kirche)") &&
      state.generalSpecialAbilities.some((key) => key.startsWith("Tradition (") && key.endsWith("kirche)"))) problems.push("Only one divine tradition is allowed.")
   if (selection.category === "languages" && selection.level === 3 && ["Isdira", "Asdharia"].includes(entry.key) &&
      !state.advantages.some((item) => matches(item, "Zweistimmiger Gesang"))) problems.push("Zweistimmiger Gesang required for level III.")
   if (selection.category === "scripts") {
      const languages = Object.entries(languageScripts).filter(([, scripts]) => scripts.includes(entry.key)).map(([language]) => language)
      requirements.push(`Sprache / language: ${languages.join(" / ")}`)
      if (!state.languages.some((key) => {
         const item = selectionFromEntry("languages", key)
         return item && languages.includes(item.catalogKey)
      })) problems.push("A matching language with an explicit level is required.")
   }
   const sameTalent = (category: EntryCategory, name: string) => state[category].some((key) => {
      const item = selectionFromEntry(category, key)
      return item?.catalogKey === name && item.detail === detail
   })
   if ((entry.key === "Begabung" || entry.key === "Herausragende Fertigkeit") && sameTalent("disadvantages", "Unfähig")) problems.push("Unfähig in the same talent.")
   if (entry.key === "Unfähig" && (sameTalent("advantages", "Begabung") || sameTalent("advantages", "Herausragende Fertigkeit"))) problems.push("Begabung/Herausragende Fertigkeit in the same talent.")
   if ((entry.key === "Magische Einstimmung" && sameTalent("disadvantages", "Magische Einschränkung")) ||
      (entry.key === "Magische Einschränkung" && sameTalent("advantages", "Magische Einstimmung"))) problems.push("Incompatible magical environment traits.")
   if (entry.key === "Fertigkeitsspezialisierung") {
      const count = state.generalSpecialAbilities.filter((key) => {
         const item = selectionFromEntry("generalSpecialAbilities", key)
         return item?.catalogKey === entry.key && item.detail === detail
      }).length
      ap *= count + 1
      requirements.push(`${detail} FW ${(count + 1) * 6}`)
      if (count >= 3 || talentValue(state, detail) < (count + 1) * 6) problems.push("Specializations require FW 6/12/18; maximum three per talent.")
   }
   if (entry.maximum) {
      const counts = new Map<string, number>()
      for (const key of state[selection.category]) {
         const item = selectionFromEntry(selection.category, key)
         if (item?.catalogKey === entry.key) counts.set(item.detail, Math.max(counts.get(item.detail) ?? 0, item.level))
      }
      const count = [...counts.values()].reduce((sum, level) => sum + level, 0)
      if (count >= entry.maximum) problems.push(`Maximum ${entry.maximum} selections reached.`)
   }
   // Trait limits below concern the number of choices, not creation AP credits.
   for (const [prefix, maximum] of [["Eingeschränkter Sinn", 2], ["Schlechte Eigenschaft", 2], ["Persönlichkeitsschwäche", 2]] as const) {
      if (entry.key.startsWith(prefix) && state.disadvantages.filter((key) => key.startsWith(`${prefix} (`)).length >= maximum) problems.push(`Maximum ${maximum}: ${prefix}.`)
   }
   if (ap > state.experience.total - state.experience.spent && selection.category !== "disadvantages") problems.push("Not enough available AP.")
   if (mode === "creation") {
      // source: DSA5 Regelwerk, S. 39, 46 (80 AP maximum; credit each selected level only once)
      // source: DSA5 Regelwerk, S. 175, 179 (only highest principles/obligations level gives AP)
      const creditedLevel = entry.creditHighestOnly ? state.disadvantages.reduce((maximum, name) => {
         const item = selectionFromEntry("disadvantages", name)
         return item?.catalogKey === entry.key ? Math.max(maximum, item.level) : maximum
      }, 0) : existing
      ap *= entry.levels ? Math.max(0, selection.level - creditedLevel) : 1
      const values = new Map<string, number>()
      for (const name of state.disadvantages) {
         const item = selectionFromEntry("disadvantages", name)
         if (!item) {
            problems.push("Unknown existing disadvantage: resolve its catalog entry before granting creation AP.")
            continue
         }
         const catalog = findEntry(item)
         const identity = `${item.catalogKey}:${catalog.creditHighestOnly ? "" : item.detail}`
         values.set(identity, Math.max(values.get(identity) ?? 0, quoteEntry(state, item, "record").ap * (catalog.levels ? item.level : 1)))
      }
      if ([...values.values()].reduce((sum, value) => sum + value, 0) + ap > 80 ||
         (state.experience.disadvantageCredit ?? 0) + ap > 80) problems.push("Disadvantages at character creation may grant at most 80 AP.")
   }
   return { key, ap, requirements, problems, approval: entry.approval ?? null, effect: entry.effect }
}

// Removal is an undo, not normal advancement. Only compare newly broken dependencies.
export function removalDependents(state: EntryState, category: EntryCategory, key: string) {
   const next: EntryState = { ...state, [category]: state[category].filter((item) => item !== key) }
   const blocked: string[] = []
   // source: DSA5 Regelwerk, S. 274, 285–286
   if (category === "advantages" && key === "Zauberer") {
      blocked.push(...(state.spells ?? []).map((entry) => entry.key), ...(state.magicTricks ?? []).map((entry) => entry.key))
   }
   if (category === "generalSpecialAbilities") {
      // source: DSA5 Regelwerk, S. 278, 281 (witch-only curses)
      if (key === "Tradition (Hexe)") {
         blocked.push(...(state.spells ?? []).filter((owned) =>
            magicSpells.some((spell) => spell.key === owned.key && spell.kind === "Hexenfluch")).map((entry) => entry.key))
      }
      // source: DSA5 Regelwerk, S. 274, 283 (elven songs need the elven tradition)
      if (key === "Tradition (Elf)") {
         blocked.push(...(state.spells ?? []).filter((owned) =>
            magicSpells.some((spell) => spell.key === owned.key && spell.kind === "Elfenlied")).map((entry) => entry.key))
      }
      if (magicTraditions.some((entry) => entry.key === key) &&
         !magicTraditions.some((entry) => next.generalSpecialAbilities.includes(entry.key))) {
         blocked.push(...(state.spells ?? []).map((entry) => entry.key))
      }
      if (key.startsWith("Merkmalskenntnis (")) {
         const property = key.slice("Merkmalskenntnis (".length, -1)
         blocked.push(...(state.spells ?? []).filter((owned) => owned.value > 14 &&
            magicSpells.some((spell) => spell.key === owned.key && spell.property === property)).map((entry) => entry.key))
      }
   }
   for (const group of ["advantages", "disadvantages", "generalSpecialAbilities", "languages", "scripts"] as const) {
      for (const name of next[group]) {
         const selection = selectionFromEntry(group, name)
         if (!selection) continue
         const entry = findEntry(selection)
         if (entryRequirements(entry, selection).some((requirement) => requirementMet(state, requirement) && !requirementMet(next, requirement))) blocked.push(name)
         if (entry.levels && category === group && selection.level > 1) {
            const removed = selectionFromEntry(category, key)
            if (removed?.catalogKey === selection.catalogKey && removed.detail === selection.detail &&
               removed.level === selection.level - 1) blocked.push(name)
         }
         if (group === "scripts" && category === "languages") {
            const known = (current: EntryState) => current.languages.some((language) => {
               const item = selectionFromEntry("languages", language)
               return item && languageScripts[item.catalogKey]?.includes(entry.key)
            })
            if (known(state) && !known(next)) blocked.push(name)
         }
         if (group === "languages" && selection.level === 3 && ["Isdira", "Asdharia"].includes(entry.key) &&
            category === "advantages" && key === "Zweistimmiger Gesang") blocked.push(name)
         if (category === "generalSpecialAbilities" && entry.key === "Fertigkeitsspezialisierung") {
            const removed = selectionFromEntry(category, key)
            const paid = state.entryPurchases.find((purchase) => purchase.category === group && purchase.key === name)
            const prior = state.entryPurchases.find((purchase) => purchase.category === category && purchase.key === key)
            if (removed?.catalogKey === entry.key && removed.detail === selection.detail && paid && (!prior || paid.ap > prior.ap)) blocked.push(name)
         }
         if (category === "generalSpecialAbilities" && entry.ordinalCosts) {
            const removed = selectionFromEntry(category, key)
            const paid = state.entryPurchases.find((purchase) => purchase.category === group && purchase.key === name)
            const prior = state.entryPurchases.find((purchase) => purchase.category === category && purchase.key === key)
            if (removed?.catalogKey === entry.key && paid && (!prior || paid.ap > prior.ap)) blocked.push(name)
         }
      }
   }
   return [...new Set(blocked)]
}

export function assertEntryListsPreserved(state: EntryState, updates: Partial<Record<EntryCategory, string[]>>) {
   const remaining: EntryState = { ...state }
   for (const category of entryCategories) {
      const list = updates[category]
      if (!list) continue
      for (const key of state[category]) {
         if (list.includes(key)) continue
         if (state.entryPurchases.some((purchase) => purchase.category === category && purchase.key === key)) {
            throw new BadRequestError("Use the entry removal controls for tracked purchases; bulk editing cannot remove them.")
         }
         if (category === "disadvantages" && state.entryCredits?.some((credit) => credit.key === key)) {
            throw new BadRequestError("Use the entry removal controls to reverse tracked creation AP credits.")
         }
         if (removalDependents(remaining, category, key).length) throw new BadRequestError("Remove dependent entries first using the entry controls.")
         remaining[category] = remaining[category].filter((name) => name !== key)
      }
   }
}

export function staffVolumeUsed(abilities: readonly string[]) {
   return abilities.reduce((sum, name) => {
      const item = selectionFromEntry("generalSpecialAbilities", name)
      return sum + (item ? staffVolumes[item.catalogKey] ?? 0 : 0)
   }, 0)
}
