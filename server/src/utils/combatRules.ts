import { attributeLevelUp } from './attributeLevelUp'
import { calcPain } from './baseAttributes'

type CombatAttribute = 'courage' | 'intuition' | 'dexterity' | 'fingerDexterity' | 'constitution' | 'strength'
export type CombatAttributes = Record<CombatAttribute, number>
export type CombatTechniqueEntry = { key: string; value: number }
export type CombatRequirement =
   | { attribute: CombatAttribute; minimum: number }
   | { talent: string; minimum: number }
   | { ability: string }
export type CombatAbility = { key: string; ap: number; requirements: CombatRequirement[] }

// source: DSA5 Regelwerk, S. 50–51, 235–236
export const combatTechniques = [
   { key: 'Armbrüste', attributes: ['fingerDexterity'], stfClass: 'b', ranged: true, canParry: false },
   { key: 'Bögen', attributes: ['fingerDexterity'], stfClass: 'c', ranged: true, canParry: false },
   { key: 'Dolche', attributes: ['dexterity'], stfClass: 'b', ranged: false, canParry: true },
   { key: 'Fechtwaffen', attributes: ['dexterity'], stfClass: 'c', ranged: false, canParry: true },
   { key: 'Hiebwaffen', attributes: ['strength'], stfClass: 'c', ranged: false, canParry: true },
   { key: 'Kettenwaffen', attributes: ['strength'], stfClass: 'c', ranged: false, canParry: false },
   { key: 'Lanzen', attributes: ['strength'], stfClass: 'b', ranged: false, canParry: true },
   { key: 'Raufen', attributes: ['dexterity', 'strength'], stfClass: 'b', ranged: false, canParry: true },
   { key: 'Schilde', attributes: ['strength'], stfClass: 'c', ranged: false, canParry: true },
   { key: 'Schwerter', attributes: ['dexterity', 'strength'], stfClass: 'c', ranged: false, canParry: true },
   { key: 'Stangenwaffen', attributes: ['dexterity', 'strength'], stfClass: 'c', ranged: false, canParry: true },
   { key: 'Wurfwaffen', attributes: ['fingerDexterity'], stfClass: 'b', ranged: true, canParry: false },
   { key: 'Zweihandhiebwaffen', attributes: ['strength'], stfClass: 'c', ranged: false, canParry: true },
   { key: 'Zweihandschwerter', attributes: ['strength'], stfClass: 'c', ranged: false, canParry: true },
] as const

export const defaultCombatTechniques = (): CombatTechniqueEntry[] =>
   combatTechniques.map(({ key }) => ({ key, value: 6 }))

const attributeRequirement = (attribute: CombatAttribute, minimum: number): CombatRequirement =>
   ({ attribute, minimum })
const abilityRequirement = (ability: string): CombatRequirement => ({ ability })
const ability = (key: string, ap: number, requirements: CombatRequirement[] = []): CombatAbility =>
   ({ key, ap, requirements })
const levels = (name: string, costs: number[], requirement: (index: number) => CombatRequirement) =>
   costs.map((ap, index) => ability(`${name} ${['I', 'II', 'III'][index]}`, ap, [
      requirement(index),
      ...(index > 0 ? [abilityRequirement(`${name} ${['I', 'II'][index - 1]}`)] : []),
   ]))

// source: DSA5 Regelwerk, S. 54–55 (costs and prerequisites; no maneuver text reproduced)
export const combatAbilities: CombatAbility[] = [
   ability('Aufmerksamkeit', 10, [attributeRequirement('intuition', 13)]),
   ...levels('Belastungsgewöhnung', [20, 35], (i) => attributeRequirement('constitution', 13 + i * 2)),
   ...levels('Beidhändiger Kampf', [20, 35], (i) => attributeRequirement('dexterity', 13 + i * 2)),
   ability('Berittener Kampf', 20, [{ talent: 'reiten', minimum: 10 }]),
   ability('Berittener Schütze', 10, [abilityRequirement('Berittener Kampf')]),
   ability('Einhändiger Kampf', 10, [attributeRequirement('dexterity', 13)]),
   ability('Entwaffnen', 40, [attributeRequirement('dexterity', 15)]),
   ability('Feindgespür', 10, [attributeRequirement('intuition', 15)]),
   ...levels('Finte', [15, 20, 25], (i) => attributeRequirement('dexterity', 13 + i * 2)),
   ability('Haltegriff', 5),
   ability('Hammerschlag', 25, [attributeRequirement('courage', 15), abilityRequirement('Vorstoß'), abilityRequirement('Wuchtschlag III')]),
   ...levels('Kampfreflexe', [10, 15, 20], (i) => attributeRequirement('intuition', 13 + i * 2)),
   ability('Klingenfänger', 10, [attributeRequirement('dexterity', 13)]),
   ability('Kreuzblock', 10, [attributeRequirement('dexterity', 13)]),
   ability('Lanzenangriff', 10, [attributeRequirement('courage', 13), abilityRequirement('Berittener Kampf')]),
   ...levels('Präziser Schuss/Wurf', [15, 20, 25], (i) => attributeRequirement('intuition', 13 + i * 2)),
   ...levels('Präziser Stich', [15, 20, 25], (i) => attributeRequirement('dexterity', 13 + i * 2)),
   ability('Riposte', 40, [attributeRequirement('dexterity', 15)]),
   ...levels('Rundumschlag', [25, 35], (i) => attributeRequirement('dexterity', 15 + i * 2)),
   ability('Schildspalter', 15, [attributeRequirement('strength', 13), abilityRequirement('Wuchtschlag I')]),
   ...(['Armbrüste', 'Bögen', 'Wurfwaffen'] as const).map((key, i) =>
      ability(`Schnellladen (${key})`, [5, 20, 10][i], [attributeRequirement('fingerDexterity', 13)])),
   ability('Schnellziehen', 10, [attributeRequirement('fingerDexterity', 13)]),
   ability('Sturmangriff', 25, [attributeRequirement('courage', 13), abilityRequirement('Vorstoß'), abilityRequirement('Wuchtschlag I')]),
   ability('Todesstoß', 30, [attributeRequirement('courage', 15), abilityRequirement('Präziser Stich III'), abilityRequirement('Vorstoß')]),
   ...levels('Verbessertes Ausweichen', [15, 20, 25], (i) => ({ talent: 'koerperbeherrschung', minimum: 4 + i * 4 })),
   ability('Verteidigungshaltung', 10, [attributeRequirement('intuition', 13)]),
   ability('Vorstoß', 10, [attributeRequirement('dexterity', 13)]),
   ...levels('Wuchtschlag', [15, 20, 25], (i) => attributeRequirement('strength', 13 + i * 2)),
   ability('Wurf', 10, [attributeRequirement('dexterity', 13), abilityRequirement('Haltegriff')]),
   ability('Zu Fall bringen', 20, [attributeRequirement('strength', 13)]),
]

export function getCombatTechnique(key: string) {
   return combatTechniques.find((technique) => technique.key === key)
}

// source: DSA5 Regelwerk, S. 51, 234–235 (base values, before conditions or maneuvers)
export function combatTechniqueValues(entry: CombatTechniqueEntry, attributes: CombatAttributes) {
   const technique = getCombatTechnique(entry.key)
   if (!technique) throw new Error('Unknown combat technique')
   const bonus = (value: number) => Math.floor(Math.max(0, value - 8) / 3)
   const leadingValue = Math.max(...technique.attributes.map((key) => attributes[key]))
   return {
      key: entry.key,
      attack: entry.value + bonus(technique.ranged ? attributes.fingerDexterity : attributes.courage),
      parry: technique.canParry ? Math.ceil(entry.value / 2) + bonus(leadingValue) : null,
   }
}

// source: DSA5 Regelwerk, S. 39, 50 (after creation: Leiteigenschaft + 2)
export function advanceCombatTechnique(entry: CombatTechniqueEntry, attributes: CombatAttributes, availableAP: number) {
   const technique = getCombatTechnique(entry.key)
   if (!technique || !Number.isInteger(entry.value) || entry.value < 6) {
      return { ok: false, reason: 'invalid-technique' } as const
   }
   const maximum = Math.max(...technique.attributes.map((key) => attributes[key])) + 2
   if (entry.value >= maximum || entry.value >= 25) {
      return { ok: false, reason: 'maximum-reached' } as const
   }
   const [value, cost] = attributeLevelUp(entry.value, technique.stfClass)
   if (cost > availableAP) return { ok: false, reason: 'insufficient-ap' } as const
   return { ok: true, value, cost } as const
}

export function purchaseCombatAbility(
   key: string,
   attributes: CombatAttributes,
   talents: Array<{ key: string; value: number | null }>,
   owned: string[],
   availableAP: number,
) {
   const selected = combatAbilities.find((entry) => entry.key === key)
   if (!selected) return { ok: false, reason: 'unknown-ability' } as const
   if (owned.includes(key)) return { ok: false, reason: 'already-owned' } as const
   const missing = selected.requirements.filter((requirement) =>
      'attribute' in requirement ? attributes[requirement.attribute] < requirement.minimum
         : 'talent' in requirement ? (talents.find((entry) => entry.key === requirement.talent)?.value ?? 0) < requirement.minimum
            : !owned.includes(requirement.ability))
   if (missing.length > 0) return { ok: false, reason: 'missing-prerequisites' } as const
   if (selected.ap > availableAP) return { ok: false, reason: 'insufficient-ap' } as const
   return { ok: true, cost: selected.ap } as const
}

// source: DSA5 Regelwerk, S. 234, 340 (negative LeP are intentional)
export function adjustHealth(current: number, maximum: number, direction: 'heal' | 'damage', amount: number) {
   if (!Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(current) ||
      !Number.isSafeInteger(maximum) || maximum < 0 || current > maximum ||
      (direction !== 'heal' && direction !== 'damage')) {
      return { ok: false } as const
   }
   const next = direction === 'heal' ? Math.min(maximum, current + amount) : current - amount
   if (!Number.isSafeInteger(next)) return { ok: false } as const
   return { ok: true, current: next, pain: calcPain(next, maximum) } as const
}

// source: DSA5 Regelwerk, S. 31–34, 411 (additional sheet conditions are recorded manually)
export const manualCombatConditions = [
   'Berauscht', 'Betäubung', 'Entrückung', 'Furcht',
   'Paralyse', 'Trance', 'Überanstrengung', 'Verwirrung',
] as const
