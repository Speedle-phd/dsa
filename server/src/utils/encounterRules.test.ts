import { describe, expect, it } from 'vitest'
import { canControlCombatant, leaderTargets, clampPosition, damagePoints, isAdjacent, initialsFor, initiativeOrder, npcDefenseTarget, npcGroupName, npcState, previousDefenses, stepTurn, tokenAssignment, type RuleCombatant } from './encounterRules'

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

describe('NPC defense against hero attacks', () => {
   const base = { value: 10, previousDefenses: 0, attackerCritical: false, incoming: 'melee' as const }
   it('lowers PA and AW by 3 per earlier defense in the KR, but not the VW of creatures (S. 232, 354)', () => {
      expect(npcDefenseTarget({ ...base, kind: 'parry', previousDefenses: 2 })).toBe(4)
      expect(npcDefenseTarget({ ...base, kind: 'dodge', previousDefenses: 1 })).toBe(7)
      expect(npcDefenseTarget({ ...base, kind: 'defense', previousDefenses: 2 })).toBe(10)
   })
   it('applies shot −4 and thrown −2 (S. 243–244) and halves after a critical attack, rounded up (S. 231)', () => {
      expect(npcDefenseTarget({ ...base, kind: 'dodge', incoming: 'shot' })).toBe(6)
      expect(npcDefenseTarget({ ...base, kind: 'dodge', incoming: 'thrown' })).toBe(8)
      expect(npcDefenseTarget({ ...base, kind: 'parry', value: 9, attackerCritical: true })).toBe(5)
      expect(npcDefenseTarget({ ...base, kind: 'parry', previousDefenses: 1, attackerCritical: true })).toBe(4)
   })
   it('counts defenses only in the current Kampfrunde', () => {
      expect(previousDefenses({ round: 3, count: 2 }, 3)).toBe(2)
      expect(previousDefenses({ round: 2, count: 2 }, 3)).toBe(0)
      expect(previousDefenses(null, 1)).toBe(0)
   })
})

describe('melee needs a neighbouring square (house rule, Nov 2026)', () => {
   it('accepts the 8 surrounding squares, diagonals included', () => {
      const center = { x: 5, y: 5 }
      for (const [x, y] of [[4, 4], [5, 4], [6, 4], [4, 5], [6, 5], [4, 6], [5, 6], [6, 6]]) expect(isAdjacent(center, { x, y })).toBe(true)
   })
   it('rejects the same square, two squares away and tokens off the board', () => {
      expect(isAdjacent({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(false)
      expect(isAdjacent({ x: 5, y: 5 }, { x: 7, y: 5 })).toBe(false)
      expect(isAdjacent({ x: 5, y: 5 }, { x: 7, y: 7 })).toBe(false)
      expect(isAdjacent(null, { x: 1, y: 1 })).toBe(false)
   })
})

describe('turn budget (S. 228)', () => {
   it('gives 1 action and 1 free action per round; a move uses the free action first, then the action (sprint)', async () => {
      const { actionsLeft, moveCost, spend } = await import('./encounterRules')
      expect(actionsLeft(null, 1)).toEqual({ action: true, free: true })
      const moved = spend(null, 1, 'free')
      expect(moveCost(moved, 1)).toBe('action')
      expect(moveCost(spend(moved, 1, 'action'), 1)).toBeNull()
      // a new round starts fresh
      expect(actionsLeft(spend(moved, 1, 'action'), 2)).toEqual({ action: true, free: true })
   })
})

describe('movement around obstacles (app choice: diagonal step = 1 Schritt)', () => {
   it('counts the shortest path and walks around blocked squares', async () => {
      const { pathLength } = await import('./encounterRules')
      const board = { width: 10, height: 10 }
      expect(pathLength(board, new Set(), { x: 0, y: 0 }, { x: 3, y: 3 }, 8)).toBe(3)
      // a wall from (2,0) to (2,4): the way round leads through (2,5)
      const wall = new Set(['2:0', '2:1', '2:2', '2:3', '2:4'])
      expect(pathLength(board, wall, { x: 0, y: 2 }, { x: 4, y: 2 }, 10)).toBe(6)
      expect(pathLength(board, wall, { x: 0, y: 2 }, { x: 4, y: 2 }, 5)).toBeNull()
      expect(pathLength(board, wall, { x: 0, y: 2 }, { x: 2, y: 2 }, 10)).toBeNull()
   })
})

describe('hero GS on the board', () => {
   it('applies the species base, modifiers and status overrides like the fight panel', async () => {
      const { effectiveSpeed } = await import('./heroSpeed')
      const view = (speed: Partial<{ total: number; override: number | null; factor: number; blocked: boolean }> = {}, base: number | null = null) => ({
         combatModifiers: { speed: 0, speedBase: base },
         checkModifiers: { speedBase: { sources: [], halved: null }, speed: { total: 0, override: null, factor: 1, blocked: false, ...speed } },
      })
      expect(effectiveSpeed(view(), 'Mensch')).toBe(8)
      expect(effectiveSpeed(view(), 'Zwerg')).toBe(6)
      expect(effectiveSpeed(view({ total: -2 }), 'Mensch')).toBe(6)
      expect(effectiveSpeed(view({ override: 1 }), 'Mensch')).toBe(1)
      expect(effectiveSpeed(view(), 'Troll')).toBeNull()
      expect(effectiveSpeed(view({}, 7), 'Troll')).toBe(7)
   }, 20_000)
})

describe('reach and melee on the board', () => {
   it('lets long weapons reach 2 squares (house rule) and others only neighbours', async () => {
      const { inMeleeReach, boardDistance } = await import('./encounterRules')
      expect(boardDistance({ x: 0, y: 0 }, { x: 2, y: 1 })).toBe(2)
      expect(inMeleeReach({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(true)
      expect(inMeleeReach({ x: 0, y: 0 }, { x: 2, y: 0 })).toBe(false)
      expect(inMeleeReach({ x: 0, y: 0 }, { x: 2, y: 2 }, 'long')).toBe(true)
      expect(inMeleeReach({ x: 0, y: 0 }, { x: 3, y: 0 }, 'long')).toBe(false)
   })
   it('counts as in melee only next to an opponent it exchanged blows with this or the last KR (S. 241)', async () => {
      const { engagedWith } = await import('./encounterRules')
      const combatants = [{ id: 'a', position: { x: 0, y: 0 } }, { id: 'b', position: { x: 1, y: 0 } }, { id: 'c', position: { x: 0, y: 1 } }]
      const attacks = [{ attackerId: 'b', targetId: 'a', round: 2, status: 'hit' }, { attackerId: 'a', targetId: 'c', round: 1, status: 'cancelled' }]
      expect(engagedWith('a', 3, combatants, attacks)).toEqual(['b'])
      expect(engagedWith('a', 4, combatants, attacks)).toEqual([])
      expect(engagedWith('c', 3, combatants, attacks)).toEqual([])
   })
})

describe('turn end with a second strike or a Flucht move open (S. 237–238)', () => {
   it('keeps the turn while the second strike or the Flucht move is open', async () => {
      const { spend, turnDone, sideOf, canControlCombatant } = await import('./encounterRules')
      const afterFirst = { ...spend(null, 2, 'action'), dual: true }
      expect(turnDone(afterFirst, 2)).toBe(false)
      expect(turnDone({ ...afterFirst, dual: false }, 2)).toBe(true)
      expect(turnDone({ ...spend(null, 2, 'action'), bonus: 4 }, 2)).toBe(false)
      expect(turnDone(spend(null, 2, 'free'), 2)).toBe(false)
      // spending keeps an open second strike of the same round, a new round starts fresh
      expect(spend({ round: 2, action: true, free: false, dual: true }, 2, 'free').dual).toBe(true)
      expect(spend({ round: 1, action: true, free: false, dual: true }, 2, 'free').dual).toBe(false)
      expect([sideOf('hero'), sideOf('ally'), sideOf('npc')]).toEqual(['party', 'party', 'foes'])
      expect(canControlCombatant('member', 'u1', { kind: 'ally', userId: 'u1' })).toBe(true)
      expect(canControlCombatant('member', 'u1', { kind: 'npc', userId: 'u1' })).toBe(false)
   })
})

describe('board scale (user decision: Schritt per square)', () => {
   it('turns GS into squares and squares into Schritt', async () => {
      const { squaresFor, schrittFor } = await import('./encounterRules')
      expect(squaresFor(8)).toBe(8)
      expect(squaresFor(8, 2)).toBe(4)
      expect(squaresFor(7, 2)).toBe(3)
      expect(squaresFor(12, 5)).toBe(2)
      expect(schrittFor(3, 2)).toBe(6)
   })
})

describe('Anführer (S. 215)', () => {
   const party = [{ id: 'lead', kind: 'hero' as const, down: false }, { id: 'h2', kind: 'hero' as const, down: false },
      { id: 'wolf', kind: 'ally' as const, down: false }, { id: 'orc', kind: 'npc' as const, down: false }, { id: 'h3', kind: 'hero' as const, down: false }]
   const leader = { id: 'lead', kind: 'hero' as const }
   it('grants up to QS + 1 other allies, including companions', () => {
      expect(leaderTargets(leader, party, ['h2', 'wolf'], 1)).toEqual({ ids: ['h2', 'wolf'] })
      expect(leaderTargets(leader, party, ['h2', 'wolf', 'h3'], 1)).toEqual({ error: 'Anführer reaches at most QS + 1 allies.' })
   })
   it('refuses the leader, opponents and unknown combatants', () => {
      expect(leaderTargets(leader, party, ['lead'], 3)).toHaveProperty('error')
      expect(leaderTargets(leader, party, ['orc'], 3)).toHaveProperty('error')
      expect(leaderTargets(leader, party, ['nobody'], 3)).toHaveProperty('error')
   })
   it('an NPC leader supports other NPCs', () => {
      expect(leaderTargets({ id: 'orc', kind: 'npc' }, [...party, { id: 'orc2', kind: 'npc', down: false }], ['orc2'], 1)).toEqual({ ids: ['orc2'] })
   })
})
