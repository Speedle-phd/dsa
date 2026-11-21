import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { axiosInstance } from '@/axios/axios'
import { throwD20s } from '@/components/diceEngine'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { activeEffectsKey } from './activeEffectsApi'
import type { Stats } from './statsApi'
import type { TalentAttribute, TalentStfClass } from './talentCatalog'

export type MagicSpell = {
   key: string
   kind: 'Zauberspruch' | 'Ritual' | 'Hexenfluch' | 'Elfenlied'
   probe: [TalentAttribute, TalentAttribute, TalentAttribute]
   resistance: 'SK' | 'ZK' | null
   stfClass: TalentStfClass
   cost: string
   castingTime: string
   range: string
   duration: string
   target: string
   property: string
   traditions: string[]
   costModifiable: boolean
   rangeModifiable: boolean
   effect: { de: string; en: string }
   page: number
   // Elfenlieder: talent of the optional pre-check (S. 283)
   songTalent?: 'musizieren' | 'singen' | 'both'
}
export type MagicTrick = Pick<MagicSpell, 'key' | 'range' | 'duration' | 'property' | 'page' | 'effect'>
export type MagicReference = {
   spells: MagicSpell[]
   tricks: MagicTrick[]
   traditions: Array<{ key: string; distribution: string; attribute: TalentAttribute; page: number }>
   abilityKeys: string[]
   staff: { volumes: Record<string, number>; capacity: number; activatable: string[] }
}
export type MagicAction =
   | { action: 'spell'; key: string; value?: number; spendAP: boolean }
   | { action: 'magic-trick' | 'remove-spell' | 'remove-magic-trick'; key: string; spendAP: boolean }
   | { action: 'spell-notes'; key: string; notes: string }
   | { action: 'magic-settings'; artifacts?: string; artifactItems?: string[]; guildSpell?: string | null
      staffItem?: string | null; staffActive?: string | null; staffInHand?: boolean; flyingDevice?: string | null }
   | { action: 'permanent-mana'; mode: 'lose' | 'buy-back' | 'correct'; amount: number; spendAP: boolean }
   | { action: 'adjust-mana'; direction: 'spend' | 'recover'; amount: number }

export async function getMagicReference() {
   return (await axiosInstance.get<MagicReference>('/api/stats/magic-reference')).data
}
export async function updateMagic(id: string, input: MagicAction) {
   const { action, ...payload } = input
   return (await axiosInstance.put<{ stats: Stats }>(`/api/stats/${action}/${id}`, payload)).data.stats
}

type ManaSpend = { stats: Stats; spend: { total: number; extra: number; minorSpirits: boolean } }
const spiritDieColor = '#7c3aed'
// source: DSA5 Regelwerk, S. 173 (Lästige Mindergeister: W20 on every AsP spend), S. 177 (Schwacher Astralkörper: +1 AsP; added by the server)
async function spendMana(stats: Stats, amount: number) {
   const spiritRoll = stats.disadvantages.includes('Lästige Mindergeister') ? (await throwD20s([spiritDieColor]))[0] : undefined
   const { data } = await axiosInstance.put<ManaSpend>(`/api/stats/adjust-mana/${stats._id}`,
      { direction: 'spend', amount, ...(spiritRoll === undefined ? {} : { spiritRoll }) })
   return { ...data, spiritRoll }
}
export function useManaSpend(stats: Stats, onSpent?: (amount: number) => void) {
   const queryClient = useQueryClient()
   const language = useLanguageStore((state) => state.language)
   return useMutation({
      mutationFn: (amount: number) => spendMana(stats, amount),
      onSuccess: ({ stats: next, spend, spiritRoll }, amount) => {
         queryClient.setQueryData(['stats', stats.charId], next)
         if (spend.extra) toast(t('Schwacher Astralkörper: 1 AsP more (S. 177).', language))
         if (spiritRoll !== undefined) {
            void queryClient.invalidateQueries({ queryKey: activeEffectsKey(stats._id) })
            toast(t(spend.minorSpirits ? 'Lästige Mindergeister appear (W20 {roll} ≤ {spent} AsP): all checks −1 until you end the effect (S. 173).'
               : 'Lästige Mindergeister: W20 {roll} > {spent} AsP, none appear (S. 173).', language)
               .replace('{roll}', String(spiritRoll)).replace('{spent}', String(spend.total)))
         }
         onSpent?.(amount)
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
}
// Shown next to "Spend AsP" buttons so the extra point is no surprise.
export const astralSpendNote = (stats: Stats) => [
   ...(stats.disadvantages.includes('Schwacher Astralkörper') ? ['+1 AsP (Schwacher Astralkörper, S. 177)'] : []),
   ...(stats.disadvantages.includes('Lästige Mindergeister') ? ['W20 for Lästige Mindergeister (S. 173)'] : []),
]

// source: DSA5 Regelwerk, S. 39, 255–256, 274–275, 281, 283, 285 (UX mirror; server validates purchases)
export function spellRules(stats: Stats, spell: MagicSpell, reference: MagicReference, value: number) {
   const native = spell.traditions.includes('allgemein') ||
      reference.traditions.some((tradition) => stats.generalSpecialAbilities.includes(tradition.key) &&
         spell.traditions.includes(tradition.distribution)) ||
      (stats.magicSettings.guildSpell === spell.key && stats.generalSpecialAbilities.includes('Tradition (Gildenmagier)'))
   const knowledge = stats.generalSpecialAbilities.includes(`Merkmalskenntnis (${spell.property})`)
   return {
      foreign: !native,
      maximum: Math.min(25, Math.max(...spell.probe.map((attribute) => stats[attribute])) + 2, knowledge ? 25 : 14),
      modifications: spell.kind !== 'Hexenfluch' && (native || knowledge) ? Math.floor(value / 4) : 0,
      elvenDuration: stats.generalSpecialAbilities.includes('Tradition (Elf)') && spell.traditions.includes('Elfen'),
   }
}

// source: DSA5 Regelwerk, S. 274 (foreign spells −2)
export const foreignSource = { label: 'Foreign tradition', value: -2, page: 274 }

// source: DSA5 Regelwerk, S. 255, 258, 278 (success: full cost; critical: half; failure: half of base + first interval, Hexe one third)
// Rounding up is a user decision (the book gives no rounding). Variable costs ("≥ 4", "4 / 8 / 16") only prefill their first number.
export function suggestedSpellCost(cost: string, outcome: 'success' | 'critical' | 'failure', witch: boolean) {
   const exact = /^(\d+)(?: \+ (\d+) \/ .+)?$/.exec(cost.trim())
   const base = Number(exact?.[1] ?? /\d+/.exec(cost)?.[0] ?? NaN)
   if (Number.isNaN(base)) return { amount: null, exact: false }
   const interval = Number(exact?.[2] ?? 0)
   const amount = outcome === 'success' ? base : outcome === 'critical' ? Math.ceil(base / 2) : Math.ceil((base + interval) / (witch ? 3 : 2))
   return { amount, exact: exact !== null }
}

export const knowledgePrefix = 'Merkmalskenntnis ('

// source: DSA5 Regelwerk, S. 285 (leading attribute 15, three spells of the Merkmal at FW 10; at most three priced selections)
// UX mirror of the server's meetsPropertyKnowledge; the server validates purchases.
export function propertyKnowledge(stats: Stats, reference: MagicReference) {
   const known = stats.generalSpecialAbilities.filter((entry) => entry.startsWith(knowledgePrefix)).map((entry) => entry.slice(knowledgePrefix.length, -1))
   const properties = [...new Set(reference.spells.map((spell) => spell.property))]
   const leading = reference.traditions.filter((tradition) => stats.generalSpecialAbilities.includes(tradition.key))
      .map((tradition) => ({ tradition: tradition.key, attribute: tradition.attribute, value: stats[tradition.attribute] }))
   const attributeMet = leading.some((entry) => entry.value >= 15)
   const owned = stats.spells.flatMap((entry) => {
      const spell = reference.spells.find((definition) => definition.key === entry.key)
      return spell ? [{ key: entry.key, value: entry.value, property: spell.property }] : []
   })
   const rows = properties.filter((property) => known.includes(property) || owned.some((entry) => entry.property === property)).map((property) => {
      const spells = owned.filter((entry) => entry.property === property).sort((a, b) => b.value - a.value)
      const ready = spells.filter((entry) => entry.value >= 10).length
      return { property, known: known.includes(property), spells, ready, eligible: attributeMet && ready >= 3 }
   }).sort((a, b) => Number(b.known) - Number(a.known) || Number(b.eligible) - Number(a.eligible) || b.ready - a.ready)
   return { rows, leading, attributeMet, known, unknown: known.filter((property) => !properties.includes(property)), full: known.length >= 3 }
}
