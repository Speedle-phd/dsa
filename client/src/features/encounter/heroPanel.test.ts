import { describe, expect, it } from 'vitest'
import type { Fight } from '@/features/heroes/fightStore'
import { fightFromPanel, panelFromFight, roundStateOf } from './heroPanel'

const fresh: Fight = { initiative: { base: 12, modifier: 0, roll: 4 }, round: 3, defenses: 0, attackWeapon: null, defense: null, log: [] }

describe('panel copy of a party fight', () => {
   it('takes only what belongs to the current KR', () => {
      const panel = panelFromFight({ ...fresh, defenses: 2, stance: { kind: 'Vorstoß', round: 2 }, fate: { defense: 3 }, leaderRound: 3,
         weapons: { 'Kurzbogen-1': { loaded: false, progress: 0 } }, casting: { spell: 'Ignifaxius', done: 1, total: 2, lastRound: 3, modification: 'none' } })
      expect(panel).toMatchObject({ round: 3, stance: null, fateDefense: true, leader: true, defensePenalty: 6, casting: { spell: 'Ignifaxius', done: 1, total: 2 } })
      expect(panel.weapons).toEqual([{ key: 'Kurzbogen-1', loaded: false, state: null }])
   })

   it('lets a second device take the copy over unchanged', () => {
      const first = panelFromFight({ ...fresh, stance: { kind: 'Verteidigungshaltung', round: 3 }, fate: { ignoreConditions: 3 }, defensePenalty: 3,
         nextActionPenalty: -2, tempPainUntil: 3, weapons: { 'Armbrust-2': { loaded: true, state: 'damaged' } } })
      const second = { ...fresh, ...fightFromPanel(first, fresh) }
      expect(panelFromFight(second)).toEqual(first)
   })

   it('applies the copy to the GM view only in its own KR', () => {
      const panel = panelFromFight({ ...fresh, stance: { kind: 'Vorstoß', round: 3 } })
      expect(roundStateOf(panel, 3)).toEqual({ stance: 'Vorstoß', leader: false, tempPain: false, ignoreConditions: false })
      expect(roundStateOf(panel, 4)).toBeNull()
   })
})
