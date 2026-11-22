import { vi } from 'vitest'
import * as persistence from '../statsPersistence'

// Controller tests: the hero's owner loads the stats (both lookups; the game-effect endpoints use findStatsForActor).
export function mockStatsLookup(stat: unknown) {
   vi.spyOn(persistence, 'findStatsForActor').mockResolvedValue({ stat, actor: 'owner' } as never)
   return vi.spyOn(persistence, 'findStatsForUser').mockResolvedValue(stat as never)
}
