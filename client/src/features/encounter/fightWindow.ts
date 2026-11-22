import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// The floating fight window over the board (user decision, Nov 2026): where it was dragged to and whether it is minimized.
// Per browser; null = default place (top right of the board).
// size: compact (one column), wide (two columns), full (fullscreen, up to three columns; user feedback Nov 2026)
export type FightWindowSize = 'compact' | 'wide' | 'full'
type FightWindow = {
   position: { x: number; y: number } | null
   minimized: boolean
   size: FightWindowSize
   place: (position: { x: number; y: number } | null) => void
   setMinimized: (minimized: boolean) => void
   setSize: (size: FightWindowSize) => void
}
export const useFightWindow = create<FightWindow>()(persist((set) => ({
   position: null,
   minimized: false,
   size: 'compact',
   place: (position) => set({ position }),
   setMinimized: (minimized) => set({ minimized }),
   setSize: (size) => set({ size, minimized: false }),
}), { name: 'dsa5.fightWindow' }))

// Keeps the window's top-left corner inside the area (it may not be dragged off the board)
export function clampWindow(position: { x: number; y: number }, area: { width: number; height: number }, size: { width: number; height: number }) {
   return {
      x: Math.round(Math.min(Math.max(0, position.x), Math.max(0, area.width - size.width))),
      y: Math.round(Math.min(Math.max(0, position.y), Math.max(0, area.height - Math.min(size.height, 48)))),
   }
}
