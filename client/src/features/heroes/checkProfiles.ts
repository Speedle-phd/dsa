import type { Source } from './combatSituation'
import type { CheckProfile, Stats } from './statsApi'

// What the player's fight panel decided for the current KR (local panel, or its copy on the server for the GM)
export type RoundState = { stance: 'Vorstoß' | 'Verteidigungshaltung' | null; leader: boolean; tempPain: boolean; ignoreConditions: boolean }

// Round-bound modifiers of one check; the single source for the player's rolls (useCheckState) and the GM overview
export function roundSources(kind: CheckProfile['kind'], checkKey: string, state: RoundState) {
   const combat = kind === 'attack' || kind === 'ranged' || kind === 'defense'
   const sources: Source[] = []
   const blocked: string[] = []
   // source: DSA5 Regelwerk, S. 250 (Vorstoß: AT +2, no defense; Verteidigungshaltung: defenses +4, no attacks)
   if (state.stance === 'Vorstoß') {
      if (kind === 'defense') blocked.push('Vorstoß: no defense this combat round.')
      if (kind === 'attack' && checkKey !== 'Schilde') sources.push({ label: 'Vorstoß', value: 2, page: 250 })
   }
   if (state.stance === 'Verteidigungshaltung') {
      if (kind === 'attack' || kind === 'ranged') blocked.push('Verteidigungshaltung: no attacks this combat round.')
      if (kind === 'defense') sources.push({ label: 'Verteidigungshaltung', value: 4, page: 250 })
   }
   // source: DSA5 Regelwerk, S. 231–244 (Patzer table: one level of Schmerz for 3 KR; a Zustand, so Zustand ignorieren drops it)
   if (state.tempPain && !state.ignoreConditions) sources.push({ label: 'Schmerz (Patzer)', value: -1, page: 34 })
   // source: DSA5 Regelwerk, S. 215 (Anführer bonus for this KR)
   if (state.leader && combat) sources.push({ label: 'Anführer', value: 1, page: 215 })
   return { sources, blocked }
}

// The server's rule profile for one kind of check (Belastung, movement, pleasing to the deity, complex)
type ProfileFlags = Pick<CheckProfile, 'burden' | 'movement' | 'pleasing' | 'complex'>
export const findProfile = (stats: Stats, kind: CheckProfile['kind'], flags: ProfileFlags) =>
   stats.checkModifiers.profiles.find((entry) => entry.kind === kind && entry.burden === flags.burden && entry.movement === flags.movement &&
      entry.pleasing === flags.pleasing && entry.complex === flags.complex)

// Attacks and defenses: Belastung applies except to ranged attacks, always with movement (same flags as useCheckState)
export const combatProfile = (stats: Stats, kind: 'attack' | 'ranged' | 'defense') =>
   findProfile(stats, kind, { burden: kind !== 'ranged', movement: true, pleasing: false, complex: false })
