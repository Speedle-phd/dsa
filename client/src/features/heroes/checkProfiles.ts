import type { CheckProfile, Stats } from './statsApi'

// The server's rule profile for one kind of check (Belastung, movement, pleasing to the deity, complex)
type ProfileFlags = Pick<CheckProfile, 'burden' | 'movement' | 'pleasing' | 'complex'>
export const findProfile = (stats: Stats, kind: CheckProfile['kind'], flags: ProfileFlags) =>
   stats.checkModifiers.profiles.find((entry) => entry.kind === kind && entry.burden === flags.burden && entry.movement === flags.movement &&
      entry.pleasing === flags.pleasing && entry.complex === flags.complex)

// Attacks and defenses: Belastung applies except to ranged attacks, always with movement (same flags as useCheckState)
export const combatProfile = (stats: Stats, kind: 'attack' | 'ranged' | 'defense') =>
   findProfile(stats, kind, { burden: kind !== 'ranged', movement: true, pleasing: false, complex: false })
