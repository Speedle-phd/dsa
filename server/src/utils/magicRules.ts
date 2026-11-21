import { magicSpells, magicTraditions, type MagicSpell, type OwnedSpell } from './magicCatalog'
import { BadRequestError } from './appError'

export type MagicState = {
   advantages: string[]
   generalSpecialAbilities: string[]
   wisdom: number
   charisma: number
   intuition: number
   courage: number
   fingerDexterity: number
   dexterity: number
   constitution: number
   strength: number
   spells: OwnedSpell[]
   magicSettings: { guildSpell: string | null }
}

// source: DSA5 Regelwerk, S. 274–275, 286 (general spells and guild creation exception)
export function isForeignSpell(state: Pick<MagicState, 'generalSpecialAbilities' | 'magicSettings'>, spell: MagicSpell) {
   if (spell.traditions.includes('allgemein')) return false
   if (state.magicSettings.guildSpell === spell.key && state.generalSpecialAbilities.includes('Tradition (Gildenmagier)')) return false
   return !magicTraditions.some((tradition) =>
      state.generalSpecialAbilities.includes(tradition.key) && spell.traditions.includes(tradition.distribution))
}

// source: DSA5 Regelwerk, S. 39, 285
export function spellMaximum(state: MagicState, spell: MagicSpell) {
   return Math.min(25, Math.max(...spell.probe.map((attribute) => state[attribute])) + 2,
      state.generalSpecialAbilities.includes(`Merkmalskenntnis (${spell.property})`) ? 25 : 14)
}

// source: DSA5 Regelwerk, S. 255–256, 260–261, 274, 281, 285
export function spellImplications(state: MagicState, spell: MagicSpell, value: number) {
   const foreign = isForeignSpell(state, spell)
   const knowledge = state.generalSpecialAbilities.includes(`Merkmalskenntnis (${spell.property})`)
   return {
      maximum: spellMaximum(state, spell),
      foreign,
      modifier: foreign ? -2 : 0,
      modifications: spell.kind !== 'Hexenfluch' && spell.kind !== 'Elfenlied' && (!foreign || knowledge) ? Math.floor(value / 4) : 0,
      elvenDuration: state.generalSpecialAbilities.includes('Tradition (Elf)') && spell.traditions.includes('Elfen'),
   }
}

// source: DSA5 Regelwerk, S. 274, 286
export function assertMagicUser(state: Pick<MagicState, 'advantages' | 'generalSpecialAbilities'>, requireTradition = true) {
   if (!state.advantages.includes('Zauberer')) throw new BadRequestError('Magic acquisition requires Zauberer (S. 274, 286).')
   if (requireTradition && !magicTraditions.some((tradition) => state.generalSpecialAbilities.includes(tradition.key))) {
      throw new BadRequestError('Spells require Zauberer and a supported magical tradition (S. 274).')
   }
}

// source: DSA5 Regelwerk, S. 285 (three matching skills FW 10, leading attribute 15)
export function meetsPropertyKnowledge(state: Partial<MagicState>, property: string) {
   return magicTraditions.some((tradition) => state.generalSpecialAbilities?.includes(tradition.key) &&
      (state[tradition.attribute] ?? 0) >= 15) &&
      (state.spells ?? []).filter((owned) => owned.value >= 10 &&
         magicSpells.some((spell) => spell.key === owned.key && spell.property === property)).length >= 3
}

export function spellRemovalDependents(state: Pick<MagicState, 'spells' | 'generalSpecialAbilities'>, key: string, target = -1) {
   // source: DSA5 Regelwerk, S. 285
   const spell = magicSpells.find((entry) => entry.key === key)
   const owned = state.spells.find((entry) => entry.key === key)
   if (!spell || !owned || owned.value < 10 || target >= 10 ||
      !state.generalSpecialAbilities.includes(`Merkmalskenntnis (${spell.property})`)) return []
   const count = state.spells.filter((owned) => owned.key !== key && owned.value >= 10 &&
      magicSpells.some((entry) => entry.key === owned.key && entry.property === spell.property)).length
   return count < 3 ? [`Merkmalskenntnis (${spell.property})`] : []
}

// source: DSA5 Regelwerk, S. 263 (summoning rituals build on each other: FW 10 in Invocatio Minima / Manifesto, FW 12 in the next step)
export const ritualPrerequisites: Record<string, { key: string; value: number }> = {
   'Invocatio Minor': { key: 'Invocatio Minima', value: 10 },
   'Invocatio Maior': { key: 'Invocatio Minor', value: 12 },
   'Elementarer Diener': { key: 'Manifesto', value: 10 },
   Dschinnenruf: { key: 'Elementarer Diener', value: 12 },
}
export function missingRitualPrerequisite(state: Pick<MagicState, 'spells'>, key: string) {
   const needed = ritualPrerequisites[key]
   if (!needed) return null
   return (state.spells.find((entry) => entry.key === needed.key)?.value ?? -1) >= needed.value ? null : needed
}
