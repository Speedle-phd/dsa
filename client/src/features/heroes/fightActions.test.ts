import { describe, expect, it } from 'vitest'
import { actionBlocked, actionUse, actionsLeft, canSpend, castingActions, disturbancePenalty, freeLeft, parseSpeed, spendAction } from './fightActions'

describe('Actions per combat round (S. 227–228)', () => {
   it('starts every KR with one action and one free action', () => {
      const fresh = actionUse({ round: 2, actions: 1, free: 1, extra: 0 }, 3)
      expect([actionsLeft(fresh), freeLeft(fresh)]).toEqual([1, 1])
   })
   it('keeps the use of the current KR', () => {
      expect(actionUse({ round: 3, actions: 1, free: 0, extra: 0 }, 3).actions).toBe(1)
   })
   it('an action and a free action can be spent once each (a sprint uses both)', () => {
      const use = spendAction(spendAction(actionUse(undefined, 1), 'action'), 'free')
      expect([canSpend(use, 'action'), canSpend(use, 'free')]).toEqual([false, false])
      expect(actionBlocked(use, 'action')).toMatch(/No action left/)
   })
   it('a GM-granted extra action can be spent', () => {
      const use = { round: 1, actions: 1, free: 0, extra: 1 }
      expect(canSpend(use, 'action')).toBe(true)
   })
   it('a spell being cast blocks other actions, not free actions (S. 229)', () => {
      const casting = { spell: 'Radau', total: 2, done: 1, lastRound: 1, modification: 'none' as const }
      const use = actionUse(undefined, 2)
      expect(actionBlocked(use, 'action', casting)).toMatch(/casting/)
      expect(actionBlocked(use, 'free', casting)).toBeNull()
   })
})

describe('Casting time in actions (S. 228, 256, 281, 297)', () => {
   it.each([['2', 'none', 2], ['4', 'none', 4], ['≥ 1', 'none', 1], ['8', 'shorter', 4], ['2', 'longer', 4], ['32', 'longer', null], ['1', 'shorter', null]] as const)(
      '%s actions, %s → %s', (time, modification, expected) => {
         expect(castingActions(time, modification)).toBe(expected)
      })
   it('Radau takes 2 actions: the action of this KR and the next (S. 297)', () => {
      expect(castingActions('2')).toBe(2)
   })
   it('rituals measured in minutes or hours are not cast in a fight', () => {
      expect(castingActions('30 min')).toBeNull()
      expect(castingActions('8 h')).toBeNull()
   })
})

describe('Disturbance while casting (S. 229)', () => {
   it.each([[0, 0], [1, 1], [2, 1], [3, 1], [5, 2], [9, 3], [10, 3]])('%i SP → −%i', (sp, penalty) => {
      expect(disturbancePenalty(sp)).toBe(penalty)
   })
})

describe('Speed values', () => {
   it('reads the first GS of a stat block', () => {
      expect([parseSpeed('12'), parseSpeed('12/36'), parseSpeed('')]).toEqual([12, 12, null])
   })
})
