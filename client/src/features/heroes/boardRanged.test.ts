import { describe, expect, it } from 'vitest'
import { boardRanged, distanceBand, shooterMoveBand, targetMoveBand } from './boardRanged'

describe('ranged values from the board (S. 241–242)', () => {
   it('picks the distance band from the weapon range', () => {
      expect(distanceBand('10/50/80', 10)).toBe('near')
      expect(distanceBand('10/50/80', 11)).toBe('medium')
      expect(distanceBand('10/50/80', 80)).toBe('far')
      expect(distanceBand('10/50/80', 81)).toBe('beyond')
      expect(distanceBand(undefined, 5)).toBeNull()
   })
   it('maps movement of the last turn', () => {
      expect([0, 4, 5].map(targetMoveBand)).toEqual(['still', 'slow', 'fast'])
      expect([0, 4, 5].map(shooterMoveBand)).toEqual(['still', 'walk', 'run'])
   })
   it('leaves the distance to the player when it is beyond the maximum or unknown', () => {
      expect(boardRanged({ paces: 90, moved: 0, intoMelee: true }, { moved: 3 }, '10/50/80'))
         .toEqual({ targetMove: 'still', shooterMove: 'walk', intoMelee: true })
      expect(boardRanged({ paces: 20, moved: 6, intoMelee: false }, { moved: 0 }, '10/50/80'))
         .toEqual({ distance: 'medium', targetMove: 'fast', shooterMove: 'still', intoMelee: false })
   })
})
