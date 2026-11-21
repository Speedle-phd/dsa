import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Hero } from './heroApi'

export type StoreFilters = {
   query: string
   category: string
}

type HeroStore = {
   isEditorOpen: boolean
   editingHero: Hero | null
   deletingHero: Hero | null
   hero: Hero | undefined
   storeFilters: StoreFilters
   // Haggled market rate in percent for the current market visit (S. 208); 0 = list prices.
   marketRate: number
   setMarketRate: (rate: number) => void
   setHero: (hero: Hero | undefined) => void
   clearHero: () => void
   openCreate: () => void
   openEdit: (hero: Hero) => void
   closeEditor: () => void
   requestDelete: (hero: Hero) => void
   closeDeleteDialog: () => void
   setStoreFilters: (filters: Partial<StoreFilters>) => void
   resetStoreFilters: () => void
}

const defaultStoreFilters: StoreFilters = {
   query: '',
   category: 'all',
}

export const useHeroStore = create<HeroStore>()(
   persist(
      (set) => ({
         isEditorOpen: false,
         editingHero: null,
         deletingHero: null,
         hero: undefined,
         storeFilters: defaultStoreFilters,
         marketRate: 0,
         setMarketRate: (marketRate) => set({ marketRate: Math.max(-50, Math.min(50, Math.round(marketRate))) }),
         setHero: (hero) => set({ hero }),
         clearHero: () => set({ hero: undefined }),
         openCreate: () => set({ isEditorOpen: true, editingHero: null }),
         openEdit: (hero) => set({ isEditorOpen: true, editingHero: hero }),
         closeEditor: () => set({ isEditorOpen: false, editingHero: null }),
         requestDelete: (hero) => set({ deletingHero: hero }),
         closeDeleteDialog: () => set({ deletingHero: null }),
         setStoreFilters: (filters) =>
            set((state) => ({
               storeFilters: { ...state.storeFilters, ...filters },
            })),
         resetStoreFilters: () => set({ storeFilters: defaultStoreFilters }),
      }),
      { name: 'dsa5.hero' },
   ),
)
