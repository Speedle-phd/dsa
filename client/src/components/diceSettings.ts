import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Per-browser preference (user feedback, Nov 2026: 3D rolls felt slow). "quick" rolls without the animation.
// The system setting "reduce motion" also rolls without animation.
export const useDiceSettings = create<{ quick: boolean; setQuick: (quick: boolean) => void }>()(
   persist((set) => ({ quick: false, setQuick: (quick) => set({ quick }) }), { name: 'dsa5.dice' }),
)

export function quickRolls() {
   return useDiceSettings.getState().quick || window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
