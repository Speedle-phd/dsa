import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { throwColoredDice } from '@/components/diceEngine'
import { getErrorMessage } from '@/utils/errorHandling'
import { summonsKey, updateSummon } from './bestiaryApi'
import { setWeaponCondition, updateCombatSettings } from './combatApi'
import type { DamageDice } from './combatRoll'
import type { AllySource } from './fightAllies'
import { useFightStore, type Fight } from './fightStore'
import type { Stats } from './statsApi'

const damageColor = '#b7791f'

// source: DSA5 Regelwerk, S. 56, 248 (INI-Basiswert = (MU + GE) / 2 + modifiers + highest Kampfreflexe level);
// `modifier` are the situational INI modifiers (e.g. Belastung). Used by the fight panel and the party fight.
export function heroInitiative(stats: Pick<Stats, 'courage' | 'dexterity' | 'combatModifiers' | 'combatSpecialAbilities' | 'checkModifiers'>) {
   const reflexLevel = ['I', 'II', 'III'].reduce((level, roman, index) =>
      stats.combatSpecialAbilities.includes(`Kampfreflexe ${roman}`) ? index + 1 : level, 0)
   return {
      base: Math.round((stats.courage + stats.dexterity) / 2) + stats.combatModifiers.initiative + reflexLevel,
      modifier: stats.checkModifiers.initiative.total,
   }
}

// W3 dice are read from a W6: 1–2 → 1, 3–4 → 2, 5–6 → 3 (S. 16).
export async function rollDamage(dice: DamageDice, color = damageColor) {
   const rolls = await throwColoredDice(dice.sides === 3 ? 6 : dice.sides, Array.from({ length: dice.count }, () => color))
   return dice.sides === 3 ? rolls.map((roll) => Math.ceil(roll / 2)) : rolls
}

export function useSettings(stats: Stats) {
   const queryClient = useQueryClient()
   return useMutation({
      mutationFn: (values: Parameters<typeof updateCombatSettings>[1]) => updateCombatSettings(stats._id, values),
      onSuccess: (next) => queryClient.setQueryData(['stats', stats.charId], next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
}

// Optional rule, remembered per browser like the other optional rules.
const patzerKey = 'dsa:fight:patzer-tables'
export function readPatzerTables() {
   try { return localStorage.getItem(patzerKey) === 'true' } catch { return false }
}
export function writePatzerTables(value: boolean) {
   try { localStorage.setItem(patzerKey, String(value)) } catch { /* storage unavailable */ }
}

export const roundStarted = (fight: Fight) => fight.log.some((entry) => entry.round === fight.round && !entry.key.startsWith('Schip:') &&
   entry.key !== 'Combat round {round} begins' && !entry.key.startsWith('Fight started') && !entry.key.startsWith('Stance:'))


// source: DSA5 Regelwerk, S. 231, 234, 243–244 (weapon damaged, badly damaged or destroyed by a Patzer)
export function useWeaponCondition(stats: Stats) {
   const queryClient = useQueryClient()
   return useMutation({
      mutationFn: ({ index, item, state }: { index: number; item: string; state: 'damaged' | 'broken' | 'destroyed' }) =>
         setWeaponCondition(stats._id, index, item, state),
      onSuccess: (next) => queryClient.setQueryData(['stats', stats.charId], next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
}

// An ally joins the running fight with its own INI (base + 1W6, S. 227); Radau's activation pays its first KR (S. 297).
export async function joinFightAs(heroId: string, source: AllySource, name: string, base: number, speed: number | null = null) {
   const fight = useFightStore.getState().fights[heroId]
   if (!fight) return
   const [roll] = await throwColoredDice(6, ['#2f855a'])
   const ally = { id: `${source.kind}-${Date.now()}`, source, initiative: { base, roll }, joinedRound: fight.round, defenses: 0, name, speed,
      ...(source.kind === 'radau' ? { paidRound: fight.round } : {}) }
   const { update, log } = useFightStore.getState()
   update(heroId, { allies: [...(fight.allies ?? []), ally] })
   log(heroId, 'Ally joins: {name} · INI {total} ({base} + W6 {roll})', { name, total: base + roll, base, roll })
}

// A summoned creature's Kampf task ends with the fight (S. 265); without services left it leaves.
export function useSummonFightOver(stats: Stats) {
   const queryClient = useQueryClient()
   return useMutation({
      mutationFn: async (summonIds: string[]) => {
         let summons = null
         for (const summonId of summonIds) summons = await updateSummon(stats._id, { action: 'fight-over', summonId })
         return summons
      },
      onSuccess: (next) => { if (next) queryClient.setQueryData(summonsKey(stats._id), next) },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
}
