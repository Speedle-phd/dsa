// Special manoeuvres of creatures (DSA5 Regelwerk, S. 362) for companion attacks. Client only: nothing is stored.
export type CompanionManeuver = 'none' | 'Flugangriff' | 'Verbeißen'

// source: DSA5 Regelwerk, S. 362 (a creature has the manoeuvre only if its stat block lists it; Verbeißen is a bite)
export function availableManeuvers(abilities: string, attackName: string): CompanionManeuver[] {
   return [
      ...(abilities.includes('Flugangriff') ? ['Flugangriff' as const] : []),
      ...(abilities.includes('Verbeißen') && /biss/i.test(attackName) ? ['Verbeißen' as const] : []),
   ]
}

// source: DSA5 Regelwerk, S. 362 (both manoeuvres: AT −2; Flugangriff +2 TP on a hit)
export const maneuverPenalty = (maneuver: CompanionManeuver) => maneuver === 'none' ? 0 : -2
export const maneuverDamage = (maneuver: CompanionManeuver) => maneuver === 'Flugangriff' ? 2 : 0

// source: DSA5 Regelwerk, S. 362 (Verbeißen: the round of the bite +0 TP, then +1 TP per further round; later bites hit automatically)
export const heldBiteBonus = (round: number) => Math.max(0, round - 1)
