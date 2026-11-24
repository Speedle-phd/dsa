import { createContext, useContext } from 'react'
import type { D20Roll, DamageDice } from './combatRoll'
import type { Incoming, Reach } from './combatSituation'

// Links the hero's fight panel to a shared party fight (user decisions, Nov 2026): attacks go to an opponent on the
// board and wait for the GM's defense roll; attacks on the hero arrive here and are defended in the panel.
// defenseModifier: the attacker's Finte, −2 per level (S. 247)
export type IncomingAttack = { id: string; attackerName: string; weapon: string; critical: boolean; incoming: Incoming; passing: boolean; defenseModifier: number }
export type EncounterLink = {
   // Opponents with their board distance in squares (null = not both on the board), the squares they moved in their last
   // turn and whether they stand next to one of the hero's side (shooting into melee, S. 242)
   // distance in squares (melee reach), paces in Schritt (ranged bands; squares × board scale)
   targets: Array<{ id: string; name: string; distance: number | null; paces: number | null; moved: number; intoMelee: boolean }>
   onBoard: boolean
   // The hero's own squares moved this turn and whether it is in melee (no ranged attacks, S. 241)
   self: { moved: number; engaged: boolean }
   // The party fight decides whether the hero may act (own turn, action left, no open attack); null = may attack
   actionReason: string | null
   // Passierschlag (S. 237): no action and outside the own turn, only when one is open (critical parry or GM) and no other
   // attack is open; null = possible against `passingTargets`
   passingReason: string | null
   passingTargets: string[]
   // The second strike of a two-weapon attack is open (S. 238)
   dualOpen: boolean
   // Every other turn-bound action (casting, loading, aiming, Flucht); see turnGate.ts
   gate: { reason: (cost: 'action' | 'free') => string | null; spend: (cost: 'action' | 'free', label: string, detail?: string, move?: number) => Promise<boolean> }
   incoming: IncomingAttack | null
   // Anführer (S. 215): the other heroes and companions of the party that can act; `lead` spends the action and gives them
   // the bonus in the next KR
   allies: Array<{ id: string; name: string }>
   lead: (quality: number, targetIds: string[], names: string) => Promise<boolean>
   busy: boolean
   // The attack goes out without TP: the damage is rolled only after a failed defense (user decision, Nov 2026)
   sendAttack: (input: { targetId: string; incoming: Incoming; weapon: string; roll: D20Roll; dice: DamageDice | null; reach: Reach | null; passing?: boolean; dual?: 'first' | 'second' | null; defenseModifier?: number }) => Promise<boolean>
   sendDefense: (attackId: string, defense: { label: string; roll: D20Roll } | null) => Promise<boolean>
}

export const EncounterLinkContext = createContext<EncounterLink | null>(null)
export const useEncounterLink = () => useContext(EncounterLinkContext)
