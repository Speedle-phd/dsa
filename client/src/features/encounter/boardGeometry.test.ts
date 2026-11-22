import { describe, expect, it } from 'vitest'
import { cellAt, firstFreeCell, isAdjacent, stepPosition } from './boardGeometry'

const board = { width: 20, height: 10 }
const rect = { left: 100, top: 50, width: 400, height: 200 }

describe('battle board geometry', () => {
   it('maps a pointer to the square under it', () => {
      expect(cellAt({ x: 100, y: 50 }, rect, board)).toEqual({ x: 0, y: 0 })
      expect(cellAt({ x: 139, y: 69 }, rect, board)).toEqual({ x: 1, y: 0 })
      expect(cellAt({ x: 499, y: 249 }, rect, board)).toEqual({ x: 19, y: 9 })
   })
   it('returns null outside the board', () => {
      expect(cellAt({ x: 99, y: 60 }, rect, board)).toBeNull()
      expect(cellAt({ x: 500, y: 60 }, rect, board)).toBeNull()
   })
   it('moves one square with arrow keys and stops at the edge', () => {
      expect(stepPosition({ x: 3, y: 3 }, 'ArrowRight', board)).toEqual({ x: 4, y: 3 })
      expect(stepPosition({ x: 0, y: 3 }, 'ArrowLeft', board)).toEqual({ x: 0, y: 3 })
      expect(stepPosition({ x: 3, y: 3 }, 'Enter', board)).toBeNull()
   })
   it('finds the first free square row by row', () => {
      expect(firstFreeCell([{ x: 0, y: 0 }, { x: 1, y: 0 }], board)).toEqual({ x: 2, y: 0 })
      expect(firstFreeCell([], { width: 5, height: 5 })).toEqual({ x: 0, y: 0 })
   })
})

describe('melee neighbours', () => {
   it('counts diagonals, not the same square or two squares away', () => {
      expect(isAdjacent({ x: 2, y: 2 }, { x: 3, y: 3 })).toBe(true)
      expect(isAdjacent({ x: 2, y: 2 }, { x: 2, y: 2 })).toBe(false)
      expect(isAdjacent({ x: 2, y: 2 }, { x: 4, y: 2 })).toBe(false)
      expect(isAdjacent(null, { x: 1, y: 1 })).toBe(false)
   })
})

describe('reachableCells', () => {
   it('counts diagonal steps as 1 and walks around walls', async () => {
      const { reachableCells } = await import('./boardGeometry')
      const board = { width: 10, height: 10 }
      expect(reachableCells(board, new Set(), { x: 0, y: 0 }, 8).get('3:3')).toBe(3)
      const wall = new Set(['2:0', '2:1', '2:2', '2:3', '2:4'])
      const cells = reachableCells(board, wall, { x: 0, y: 2 }, 6)
      expect(cells.get('4:2')).toBe(6)
      expect(cells.has('2:2')).toBe(false)
      expect(reachableCells(board, wall, { x: 0, y: 2 }, 5).has('4:2')).toBe(false)
   })
})

describe('clampWindow', () => {
   it('keeps the fight window on the board, at least its title bar', async () => {
      const { clampWindow } = await import('./fightWindow')
      const area = { width: 800, height: 600 }, size = { width: 300, height: 400 }
      expect(clampWindow({ x: -20, y: -5 }, area, size)).toEqual({ x: 0, y: 0 })
      expect(clampWindow({ x: 700, y: 590 }, area, size)).toEqual({ x: 500, y: 552 })
      expect(clampWindow({ x: 120.4, y: 80.6 }, area, size)).toEqual({ x: 120, y: 81 })
   })
})

describe('board scale', () => {
   it('turns GS into squares', async () => {
      const { squaresFor } = await import('./boardGeometry')
      expect([squaresFor(8), squaresFor(8, 2), squaresFor(7, 2), squaresFor(12, 5)]).toEqual([8, 4, 3, 2])
   })
})
