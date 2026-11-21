import { useQuery } from '@tanstack/react-query'
import { axiosInstance } from '@/axios/axios'
import { catalogEntry } from '@/utils/storePricing'
import type { Stats } from './statsApi'

export type Localized = { de: string; en: string }
export type EffectValues = {
   soulPower?: number
   damageBonus?: number
   magicalWeapon?: boolean
   unbreakable?: boolean
   ignoreStupor?: number
   transitionPain?: number
   herbHealth?: number
   treatmentQuality?: number
   // Lästige Mindergeister: −1 on every skill check while it runs (S. 173)
   checkPenalty?: number
   // Eiserner Wille level: SK +level, all other checks −level (S. 216)
   ironWill?: number
   // Schmerzen unterdrücken: suppressed Schmerz levels (S. 219)
   ignorePain?: number
   // Ending the effect adds one level of Betäubung (S. 216, 219)
   stuporOnEnd?: boolean
   // Aura verbergen (S. 284): no spells; ending adds Verwirrung
   blocksSpells?: boolean
   confusionOnEnd?: boolean
   // Elfenlieder (S. 284): craft checks +QS, spells/rituals +1/+2
   craftBonus?: number
   spellBonus?: number
}
// A running elixir, herb, poison or service effect (S. 270–274, 342–346, 382). It runs until the player ends it.
export type ActiveEffect = {
   _id: string
   key: string
   label: string
   quality: number | null
   page: number
   duration: Localized
   values: EffectValues
   weapon: string | null
   setsStatus: string | null
   note: Localized | null
   createdAt: string
}
export type ConsumeInput = { index: number; item: string; rolls?: number[]; weapon?: string; cure?: boolean; confirmWeaker?: boolean }
export type ConsumeOutcome = { kind: 'heal' | 'mana' | 'antidote' | 'effect' | 'info'; amount?: number; cured?: boolean }

export const activeEffectsKey = (statsId: string | undefined) => ['active-effects', statsId]

export async function getActiveEffects(statsId: string) {
   return (await axiosInstance.get<{ effects: ActiveEffect[] }>(`/api/stats/active-effects/${statsId}`)).data.effects
}
export async function consumeItem(statsId: string, input: ConsumeInput) {
   return (await axiosInstance.put<{ stats: Stats; effects: ActiveEffect[]; outcome: ConsumeOutcome }>(`/api/stats/consume-item/${statsId}`, input)).data
}
export async function updateActiveEffect(statsId: string, effectId: string, action: 'end' | 'end-transition') {
   return (await axiosInstance.put<{ stats: Stats; effects: ActiveEffect[] }>(`/api/stats/active-effect/${statsId}`, { effectId, action })).data
}

export type AbilityEffect = 'Eiserner Wille' | 'Schmerzen unterdrücken' | 'Aura verbergen' | 'Melodie der Kunstfertigkeit' | 'Zaubermelodie'
   | 'Zauberklinge Geisterspeer'
export async function startAbilityEffect(statsId: string, ability: AbilityEffect, quality?: number, weapon?: string) {
   return (await axiosInstance.put<{ stats: Stats; effects: ActiveEffect[] }>(`/api/stats/ability-effect/${statsId}`, { ability, quality, weapon })).data
}

export function useActiveEffects(stats: Pick<Stats, '_id'> | undefined) {
   return useQuery({
      queryKey: activeEffectsKey(stats?._id),
      queryFn: () => getActiveEffects(stats!._id),
      enabled: Boolean(stats?._id),
      staleTime: 30_000,
   }).data ?? []
}

// Mirrors the server rules (consumables.ts): which inventory items open the consume dialog.
export function isConsumableItem(name: string) {
   const kind = catalogEntry(name)?.item.kind
   return kind === 'elixir' || kind === 'herb' || kind === 'poison'
}

// Only the strongest effect of a kind counts (S. 272), so the highest value of each bonus applies.
export function effectBonus(effects: readonly ActiveEffect[], key: 'soulPower' | 'ignoreStupor' | 'transitionPain' | 'checkPenalty' | 'ironWill' | 'ignorePain'
   | 'craftBonus' | 'spellBonus') {
   const best = effects.reduce<ActiveEffect | null>((top, effect) => (effect.values[key] ?? 0) > (top?.values[key] ?? 0) ? effect : top, null)
   return best ? { value: best.values[key] ?? 0, label: best.label, page: best.page } : null
}

export function weaponEffects(effects: readonly ActiveEffect[], weapon: string) {
   const own = effects.filter((effect) => effect.weapon === weapon)
   return {
      damageBonus: Math.max(0, ...own.map((effect) => effect.values.damageBonus ?? 0)),
      magical: own.some((effect) => effect.values.magicalWeapon),
      poisoned: own.filter((effect) => effect.key.startsWith('weapon-poison:')).map((effect) => effect.label),
   }
}

// SK bonus sources: the strongest elixir (S. 272) plus a focused Eiserner Wille (S. 216), which is not an elixir.
export function soulPowerSources(effects: readonly ActiveEffect[]) {
   return [effectBonus(effects, 'soulPower'), effectBonus(effects, 'ironWill')].filter((source) => source !== null)
}
