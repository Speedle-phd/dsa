import { describe, expect, it } from 'vitest'
import { canControlCombatant, clampPosition, damagePoints, initialsFor, initiativeOrder, npcGroupName, npcState, stepTurn, tokenAssignment, type RuleCombatant } from './encounterRules'

const fighter = (id: string, initiative: number | null, initiativeBase = 10, tiebreak = 0, change: Partial<RuleCombatant> = {}): RuleCombatant =>
   ({ id, kind: 'npc', name: id, initiative, initiativeBase, tiebreak, ...change })

describe('initiative order (S. 226–227)', () => {
   it('sorts by INI, then INI-Basiswert, then the roll-off; combatants without INI act last', () => {
      const order = initiativeOrder([
         fighter('slow', 9), fighter('none', null, 20), fighter('fast', 15), fighter('tieLowBase', 12, 9), fighter('tieHighBase', 12, 11),
         fighter('rollLow', 11, 10, 2), fighter('rollHigh', 11, 10, 5),
      ])
      expect(order.map((entry) => entry.id)).toEqual(['fast', 'tieHighBase', 'tieLowBase', 'rollHigh', 'rollLow', 'slow', 'none'])
   })
})

describe('turns and Kampfrunden', () => {
   const fighters = [fighter('a', 15), fighter('b', 12), fighter('c', 8)]
   it('starts with the highest INI in round 1', () => {
      expect(stepTurn(fighters, null, 0, 'next')).toEqual({ activeId: 'a', round: 1 })
   })
   it('moves down the order and starts the next round after the last combatant', () => {
      expect(stepTurn(fighters, 'a', 1, 'next')).toEqual({ activeId: 'b', round: 1 })
      expect(stepTurn(fighters, 'c', 1, 'next')).toEqual({ activeId: 'a', round: 2 })
   })
   it('steps back, also into the previous round, but not before round 1', () => {
      expect(stepTurn(fighters, 'b', 2, 'previous')).toEqual({ activeId: 'a', round: 2 })
      expect(stepTurn(fighters, 'a', 2, 'previous')).toEqual({ activeId: 'c', round: 1 })
      expect(stepTurn(fighters, 'a', 1, 'previous')).toEqual({ activeId: 'a', round: 1 })
   })
   it('handles an active combatant that was removed', () => {
      expect(stepTurn(fighters, 'gone', 3, 'next')).toEqual({ activeId: 'a', round: 3 })
   })
})

describe('NPC damage and state', () => {
   it('subtracts RS from TP, never below 0 (S. 230, 233)', () => {
      expect(damagePoints(10, 4)).toBe(6)
      expect(damagePoints(3, 4)).toBe(0)
      expect(damagePoints(10, 4, true)).toBe(10)
   })
   it('shows players a rough state (app choice)', () => {
      expect([npcState(20, 20), npcState(11, 20), npcState(10, 20), npcState(1, 20), npcState(0, 20), npcState(-3, 20)])
         .toEqual(['unhurt', 'wounded', 'badlyWounded', 'badlyWounded', 'down', 'down'])
   })
})

describe('distinct NPC tokens (user decision, Nov 2026)', () => {
   it('derives group name and initials', () => {
      expect(npcGroupName('Ork 3')).toBe('Ork')
      expect(initialsFor('Ork 2')).toBe('OR')
      expect(initialsFor('Grauer Wolf')).toBe('GW')
   })
   it('gives each NPC type its own color and numbers copies on', () => {
      const existing = [
         { kind: 'hero' as const, group: 'Alrik', color: null, number: 0 },
         { kind: 'npc' as const, group: 'Ork', color: 0, number: 1 },
         { kind: 'npc' as const, group: 'Ork', color: 0, number: 2 },
      ]
      expect(tokenAssignment(existing, 'Ork')).toEqual({ color: 0, nextNumber: 3 })
      expect(tokenAssignment(existing, 'Wolf')).toEqual({ color: 1, nextNumber: 1 })
   })
})

describe('who controls a combatant (user decision, Nov 2026)', () => {
   const hero = { kind: 'hero' as const, userId: 'alice' }
   const npc = { kind: 'npc' as const, userId: null }
   it('lets the GM control everything and players only their own hero', () => {
      expect(canControlCombatant('gm', 'gm', npc)).toBe(true)
      expect(canControlCombatant('member', 'alice', hero)).toBe(true)
      expect(canControlCombatant('member', 'bob', hero)).toBe(false)
      expect(canControlCombatant('member', 'alice', npc)).toBe(false)
      expect(canControlCombatant('pending', 'alice', hero)).toBe(false)
   })
   it('keeps tokens on the board', () => {
      expect(clampPosition({ x: 0, y: 0 }, { width: 20, height: 15 })).toBe(true)
      expect(clampPosition({ x: 20, y: 3 }, { width: 20, height: 15 })).toBe(false)
      expect(clampPosition({ x: -1, y: 3 }, { width: 20, height: 15 })).toBe(false)
   })
})
