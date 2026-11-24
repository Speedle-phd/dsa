import type { RoundState } from '@/features/heroes/checkProfiles'
import type { Fight, WeaponState } from '@/features/heroes/fightStore'

// Mirrors HeroPanel in server/src/models/encounter.model.ts: the player's fight panel for one KR, copied to the server for the
// GM overview and the player's other devices (user request, Nov 2026)
export type HeroPanel = {
   round: number
   stance: 'Vorstoß' | 'Verteidigungshaltung' | null
   leader: boolean
   tempPain: boolean
   ignoreConditions: boolean
   fateDefense: boolean
   defensePenalty: number
   nextActionPenalty: number
   noDefense: boolean
   casting: { spell: string; done: number; total: number } | null
   weapons: Array<{ key: string; loaded: boolean | null; state: WeaponState | null }>
}

export function panelFromFight(fight: Fight): HeroPanel {
   const round = fight.round
   return {
      round,
      stance: fight.stance && fight.stance.round === round ? fight.stance.kind : null,
      leader: fight.leaderRound === round,
      tempPain: fight.tempPainUntil !== undefined && round <= fight.tempPainUntil,
      ignoreConditions: fight.fate?.ignoreConditions === round,
      fateDefense: fight.fate?.defense === round,
      // source: DSA5 Regelwerk, S. 232 (−3 per earlier defense in the KR), as the panel counts it (defensePenaltyOf)
      defensePenalty: Math.min(60, Math.max(0, fight.defensePenalty ?? 3 * fight.defenses)),
      nextActionPenalty: Math.max(-10, Math.min(0, fight.nextActionPenalty ?? 0)),
      noDefense: fight.noDefenseRound === round || Boolean(fight.noDefenseUntilAction),
      casting: fight.casting ? { spell: fight.casting.spell, done: fight.casting.done, total: fight.casting.total } : null,
      weapons: Object.entries(fight.weapons ?? {}).slice(0, 30).map(([key, state]) => ({ key, loaded: state.loaded ?? null, state: state.state ?? null })),
   }
}

// The panel's round-bound choices, only while the copy belongs to the fight's current KR
export function roundStateOf(panel: HeroPanel | null | undefined, round: number): RoundState | null {
   if (!panel || panel.round !== round) return null
   return { stance: panel.stance, leader: panel.leader, tempPain: panel.tempPain, ignoreConditions: panel.ignoreConditions }
}

// A second device takes the copy over once (instead of overwriting it with an empty panel); Patzer effects that last
// longer than this KR are only known for this KR there
export function fightFromPanel(panel: HeroPanel, fight: Fight): Partial<Fight> {
   return {
      stance: panel.stance ? { kind: panel.stance, round: panel.round } : fight.stance,
      leaderRound: panel.leader ? panel.round : fight.leaderRound,
      tempPainUntil: panel.tempPain ? Math.max(fight.tempPainUntil ?? 0, panel.round) : fight.tempPainUntil,
      fate: { ...fight.fate, ...(panel.ignoreConditions ? { ignoreConditions: panel.round } : {}), ...(panel.fateDefense ? { defense: panel.round } : {}) },
      defensePenalty: panel.defensePenalty,
      nextActionPenalty: panel.nextActionPenalty || undefined,
      noDefenseUntilAction: panel.noDefense || undefined,
      casting: panel.casting ? { ...panel.casting, lastRound: panel.round, modification: 'none' } : fight.casting,
      weapons: {
         ...fight.weapons,
         ...Object.fromEntries(panel.weapons.map((weapon) => [weapon.key, {
            ...fight.weapons?.[weapon.key], ...(weapon.loaded !== null ? { loaded: weapon.loaded } : {}), ...(weapon.state ? { state: weapon.state } : {}),
         }])),
      },
   }
}
