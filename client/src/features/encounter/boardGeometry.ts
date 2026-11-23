import type { Position } from './encounterApi'

// Square under a pointer on a board element (null outside). Drag & drop and click-to-place use it.
export function cellAt(point: { x: number; y: number }, rect: { left: number; top: number; width: number; height: number },
   board: { width: number; height: number }): Position | null {
   const fx = (point.x - rect.left) / rect.width
   const fy = (point.y - rect.top) / rect.height
   if (fx < 0 || fy < 0 || fx >= 1 || fy >= 1) return null
   return { x: Math.floor(fx * board.width), y: Math.floor(fy * board.height) }
}

// Arrow-key movement, one square, kept on the board (keyboard alternative to dragging, WCAG 2.5.7)
const steps: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
export function stepPosition(position: Position, key: string, board: { width: number; height: number }): Position | null {
   const step = steps[key]
   if (!step) return null
   const next = { x: position.x + step[0], y: position.y + step[1] }
   return next.x < 0 || next.y < 0 || next.x >= board.width || next.y >= board.height ? position : next
}

// First free square, row by row (placing a token from the tray without dragging)
export function firstFreeCell(occupied: readonly Position[], board: { width: number; height: number }): Position | null {
   const taken = new Set(occupied.map((cell) => `${cell.x}:${cell.y}`))
   for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) if (!taken.has(`${x}:${y}`)) return { x, y }
   }
   return null
}

// Squares between two tokens, a diagonal step = 1 Schritt (app choice); null when one is not on the board
export function boardDistance(a: Position | null | undefined, b: Position | null | undefined) {
   if (!a || !b) return null
   return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
}
// Melee reach: neighbouring squares; Reichweite lang also 2 squares (house rule, user decision Nov 2026); mirrors the server
export function inMeleeReach(a: Position | null | undefined, b: Position | null | undefined, reach: 'short' | 'medium' | 'long' | null = 'medium') {
   const distance = boardDistance(a, b)
   return distance !== null && distance >= 1 && distance <= (reach === 'long' ? 2 : 1)
}

// Melee only against the 8 neighbouring squares, diagonals included (house rule, user decision Nov 2026); mirrors the server
export function isAdjacent(a: Position | null | undefined, b: Position | null | undefined) {
   if (!a || !b) return false
   return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) === 1
}

// Squares a token can reach within `limit` steps around blocked squares (8 directions, a diagonal step = 1 Schritt,
// app choice); mirrors pathLength on the server. Returns the step count per square key "x:y".
export function reachableCells(board: { width: number; height: number }, blocked: ReadonlySet<string>, from: Position, limit: number) {
   const distance = new Map<string, number>([[`${from.x}:${from.y}`, 0]])
   let frontier = [from]
   for (let steps = 1; steps <= limit && frontier.length; steps++) {
      const next: Position[] = []
      for (const cell of frontier) {
         for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
            const x = cell.x + dx, y = cell.y + dy
            const key = `${x}:${y}`
            if ((!dx && !dy) || x < 0 || y < 0 || x >= board.width || y >= board.height || distance.has(key) || blocked.has(key)) continue
            distance.set(key, steps)
            next.push({ x, y })
         }
      }
      frontier = next
   }
   return distance
}
export const cellKey = (cell: Position) => `${cell.x}:${cell.y}`

// Board scale (user decision, Nov 2026): one square = `scale` Schritt; mirrors the server
export const squaresFor = (schritt: number, scale = 1) => Math.floor(schritt / Math.max(1, scale))
