import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { defaultRanged, defaultSituation, type RangedSituation, type Situation } from './combatSituation'
import { actionUse, spendAction, type ActionCost, type ActionUse, type Casting } from './fightActions'
import type { FightAlly } from './fightAllies'

export type FightLogEntry = { id: number; round: number; key: string; values: Record<string, string | number> }
export type WeaponState = 'destroyed' | 'broken' | 'damaged' | 'lost' | 'stuck' | 'jammed'
// Per-weapon fight state: reload progress (S. 245) and Patzer-table damage (S. 231, 243), kept for this fight only.
export type FightWeapon = { loaded?: boolean; progress?: number; state?: WeaponState; until?: number }
export type Stance = 'Vorstoß' | 'Verteidigungshaltung'

export type Fight = {
   initiative: { base: number; modifier: number; roll: number }
   round: number
   defenses: number
   // Accumulated defense penalty this KR (S. 232: +3 per defense; S. 244: less after a critical ranged defense).
   defensePenalty?: number
   attackWeapon: string | null
   defense: string | null
   log: FightLogEntry[]
   // Combat rounds in which a Schip was spent on Erster, Verteidigung +4 or Zustand ignorieren (S. 29–30)
   fate?: { first?: number; defense?: number; ignoreConditions?: number }
   situation?: Situation
   ranged?: RangedSituation
   // Declared at the start of a KR (S. 250).
   stance?: { kind: Stance; round: number }
   // An ally's Anführer bonus received for this KR (S. 215): +1 AT, defense and FK, not cumulative.
   leaderRound?: number
   // Riposte used (S. 249): no further defense in this KR.
   noDefenseRound?: number
   // Two-weapon attack in this KR (S. 238): defenses are harder; a botch on the first attack cancels the second.
   dualRound?: number
   dualBotchRound?: number
   offHand?: string | null
   weapons?: Record<string, FightWeapon>
   // Patzer-table effects (S. 231–244): Schmerz +1 until this KR, −2 on the next action, no defense until the next action.
   tempPainUntil?: number
   nextActionPenalty?: number
   noDefenseUntilAction?: boolean
   // One-handed weapon held in both hands (S. 366): which option, and the KR of the last switch (once per KR).
   grip?: { key: string | null; changedRound: number }
   // Companions, summoned creatures and Radau brooms on the hero's side
   allies?: FightAlly[]
   // Actions used by the hero in the current KR (S. 228)
   turn?: ActionUse
   // A spell being cast as a longer action (S. 228–229)
   casting?: Casting | null
   // Set when this panel fights in a party fight (user decision, Nov 2026): a new or ended party fight resets the panel
   party?: { partyId: string; encounterId: string }
   // Hits of the party fight already taken into this panel (casting disturbance, log)
   seenHits?: string[]
   // The party fight whose server copy this device has adopted or writes (usePanelMirror); before that it never writes
   panelSynced?: string
   // A party-fight hit raised the Schmerz: Blutrausch is offered (S. 171), never set automatically
   rageOffer?: string | null
}

type FightStore = {
   fights: Record<string, Fight>
   start: (heroId: string, initiative: Fight['initiative']) => void
   end: (heroId: string) => void
   update: (heroId: string, change: Partial<Fight>) => void
   nextRound: (heroId: string) => void
   log: (heroId: string, key: string, values?: FightLogEntry['values']) => void
   // null removes the ally from the fight
   updateAlly: (heroId: string, allyId: string, change: Partial<FightAlly> | null) => void
   // Uses an action or free action of the hero (no allyId) or an ally in the current KR; `extra` lets the GM grant one more action.
   spend: (heroId: string, cost: ActionCost | 'extra', allyId?: string) => void
}

const maxLogEntries = 40

export const defensePenaltyOf = (fight: Fight) => fight.defensePenalty ?? 3 * fight.defenses
export const situationOf = (fight?: Fight) => ({ ...defaultSituation, ...fight?.situation })
export const rangedOf = (fight?: Fight) => ({ ...defaultRanged, ...fight?.ranged })

// Running fights per hero, kept in this browser until the fight ends.
export const useFightStore = create<FightStore>()(persist((set) => {
   const patch = (heroId: string, change: (fight: Fight) => Partial<Fight>) => set((state) => {
      const fight = state.fights[heroId]
      return fight ? { fights: { ...state.fights, [heroId]: { ...fight, ...change(fight) } } } : state
   })
   const entry = (fight: Fight, key: string, values: FightLogEntry['values'] = {}) =>
      [{ id: (fight.log[0]?.id ?? 0) + 1, round: fight.round, key, values }, ...fight.log].slice(0, maxLogEntries)
   return {
      fights: {},
      start: (heroId, initiative) => set((state) => {
         const fight: Fight = { initiative, round: 1, defenses: 0, defensePenalty: 0, attackWeapon: null, defense: null, log: [] }
         const total = initiative.base + initiative.modifier + initiative.roll
         fight.log = entry(fight, 'Fight started · INI {total} ({base} {modifier} + W6 {roll})', {
            total, base: initiative.base, modifier: initiative.modifier >= 0 ? `+${initiative.modifier}` : initiative.modifier, roll: initiative.roll,
         })
         return { fights: { ...state.fights, [heroId]: fight } }
      }),
      end: (heroId) => set((state) => {
         const fights = { ...state.fights }
         delete fights[heroId]
         return { fights }
      }),
      update: (heroId, change) => patch(heroId, () => change),
      // source: DSA5 Regelwerk, S. 232 (defense penalties reset each KR)
      nextRound: (heroId) => patch(heroId, (fight) => {
         const next = { ...fight, round: fight.round + 1, defenses: 0 }
         return { round: next.round, defenses: 0, defensePenalty: 0, log: entry(next, 'Combat round {round} begins', { round: next.round }),
            ...(fight.allies ? { allies: fight.allies.map((ally) => ({ ...ally, defenses: 0 })) } : {}) }
      }),
      log: (heroId, key, values) => patch(heroId, (fight) => ({ log: entry(fight, key, values) })),
      spend: (heroId, cost, allyId) => patch(heroId, (fight) => {
         const next = (use: ActionUse | undefined) => {
            const current = actionUse(use, fight.round)
            return cost === 'extra' ? { ...current, extra: current.extra + 1 } : spendAction(current, cost)
         }
         return allyId ? { allies: (fight.allies ?? []).map((ally) => ally.id === allyId ? { ...ally, turn: next(ally.turn) } : ally) }
            : { turn: next(fight.turn) }
      }),
      updateAlly: (heroId, allyId, change) => patch(heroId, (fight) => ({
         allies: (fight.allies ?? []).flatMap((ally) => ally.id !== allyId ? [ally] : change ? [{ ...ally, ...change }] : []),
      })),
   }
}, { name: 'dsa-fights', storage: createJSONStorage(() => localStorage) }))
