import { useQuery } from '@tanstack/react-query'
import { axiosInstance } from '@/axios/axios'

// Mirrors server/src/utils/herbs/herbTypes.ts (plants of Archiv der Kräuter, AdK S. 9–142)
export type Localized = { de: string; en: string }
export type HerbRoute = 'touch' | 'inhale' | 'eat'
export type Herb = {
   key: string
   name: string
   page: number
   effectTypes: string[]
   landscape: string | null
   regions: string | null
   landscapes: string[]
   search: number | null
   searchNote: string | null
   identify: number | null
   identifyNote: string | null
   applications: number[] | null
   applicationsNote: string | null
   price: { raw: number | null; processed: number | null; note: string | null }
   recipes: Array<{ name: string; page: number; book: 'AdK' | 'RW' }>
   rawRoutes: HerbRoute[]
   summary: { touch?: Localized; inhale?: Localized; eat?: Localized; knowledge: Localized[] } | null
}
export type HerbReference = { herbs: Herb[]; effectTypes: string[]; landscapes: string[] }

export const herbReferenceKey = ['herb-reference'] as const

export async function getHerbReference() {
   return (await axiosInstance.get<HerbReference>('/api/stats/herb-reference')).data
}

// Static book data: loaded once per session
export function useHerbReference(enabled = true) {
   return useQuery({ queryKey: herbReferenceKey, queryFn: getHerbReference, staleTime: Infinity, gcTime: Infinity, enabled })
}

export const routeLabels: Record<HerbRoute, string> = { touch: 'Berührung', inhale: 'Einatmung', eat: 'Verzehr' }
