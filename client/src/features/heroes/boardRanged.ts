import { rangeBands, type RangedSituation } from './combatSituation'

// Ranged values the battle board decides (user decision, Nov 2026). source: DSA5 Regelwerk, S. 241–242.
// Distance band from the weapon's range (squares = Schritt); 'beyond' = past the maximum, only unaimed area shots (S. 241).
export function distanceBand(range: string | undefined, squares: number): RangedSituation['distance'] | 'beyond' | null {
   const bands = rangeBands(range)
   if (!bands) return null
   return squares <= bands[0] ? 'near' : squares <= bands[1] ? 'medium' : squares <= bands[2] ? 'far' : 'beyond'
}
// Target: still / 4 Schritt and less / 5 and more in its last turn; shooter likewise in its own turn (S. 242)
export const targetMoveBand = (squares: number): RangedSituation['targetMove'] => squares === 0 ? 'still' : squares <= 4 ? 'slow' : 'fast'
export const shooterMoveBand = (squares: number): RangedSituation['shooterMove'] => squares === 0 ? 'still' : squares <= 4 ? 'walk' : 'run'

// paces: distance in Schritt; moved: Schritt the target moved in its last turn
export type BoardTarget = { paces: number | null; moved: number; intoMelee: boolean }
// The ranged situation the board fixes for one shot; the rest (size, cover, zigzag, aiming) stays with the player
export function boardRanged(target: BoardTarget, self: { moved: number }, range: string | undefined): Partial<RangedSituation> {
   const band = target.paces === null ? null : distanceBand(range, target.paces)
   return {
      ...(band && band !== 'beyond' ? { distance: band } : {}),
      targetMove: targetMoveBand(target.moved),
      shooterMove: shooterMoveBand(self.moved),
      intoMelee: target.intoMelee,
   }
}
