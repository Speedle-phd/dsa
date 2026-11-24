import { describe, expect, it } from 'vitest'
import { canAnswer, seesRequest, visibleTargets, type CheckTargetShape } from './checkRequestRules'

const result = { success: true, qs: 2, rolls: [5, 9, 12], outcome: 'success' as const }
const targets: CheckTargetShape[] = [
   { charId: 'hero-a', userId: 'player-a', state: 'rolled', result },
   { charId: 'hero-b', userId: 'player-b', state: 'open', result: null },
]

describe('GM check requests', () => {
   it('shows a request to the GM and to the players asked, not to other members', () => {
      expect(seesRequest(targets, 'gm', true)).toBe(true)
      expect(seesRequest(targets, 'player-b', false)).toBe(true)
      expect(seesRequest(targets, 'player-c', false)).toBe(false)
   })

   it('keeps the results of a hidden request between the GM and each hero\'s player', () => {
      expect(visibleTargets(targets, 'gm', true, true)[0].result).toEqual(result)
      expect(visibleTargets(targets, 'player-a', false, true)[0]).toEqual({ charId: 'hero-a', state: 'rolled', mine: true, result })
      expect(visibleTargets(targets, 'player-b', false, true)[0]).toEqual({ charId: 'hero-a', state: 'rolled', mine: false, result: null })
   })

   it('shows every result of an open request to all players asked', () => {
      expect(visibleTargets(targets, 'player-b', false, false)[0].result).toEqual(result)
   })

   it('lets a player answer once, for an own hero, while the request is open', () => {
      expect(canAnswer('open', targets, 'player-b', 'hero-b')).toBe(true)
      expect(canAnswer('open', targets, 'player-a', 'hero-a')).toBe(false)
      expect(canAnswer('open', targets, 'player-a', 'hero-b')).toBe(false)
      expect(canAnswer('closed', targets, 'player-b', 'hero-b')).toBe(false)
   })
})
