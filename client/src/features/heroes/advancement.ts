import { create } from 'zustand'

type AdvancementStore = {
   modes: Record<string, boolean>
   setSpendAP: (heroId: string, spendAP: boolean) => void
}

const useAdvancementStore = create<AdvancementStore>((set) => ({
   modes: {},
   setSpendAP: (heroId, spendAP) => set((state) => ({ modes: { ...state.modes, [heroId]: spendAP } })),
}))

export function useAdvancementMode(heroId: string) {
   const spendAP = useAdvancementStore((state) => state.modes[heroId] ?? true)
   const setSpendAP = useAdvancementStore((state) => state.setSpendAP)
   return { spendAP, setSpendAP: (value: boolean) => setSpendAP(heroId, value) }
}

// source: DSA5 Regelwerk, S. 50 (next target step; existing unset-talent activation policy)
export function nextStepCost(value: number | null, factor: 'a' | 'b' | 'c' | 'd' | 'e') {
   if (factor === 'e') return value !== null && value >= 14 ? (value - 12) * 15 : 15
   const base = { a: 1, b: 2, c: 3, d: 4 }[factor]
   return base * (value !== null && value >= 12 ? value - 10 : 1)
}
