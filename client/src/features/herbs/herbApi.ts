import { useQuery } from '@tanstack/react-query'
import { axiosInstance } from '@/axios/axios'
import type { Stats } from '@/features/heroes/statsApi'
import type { ShelfLifeTables } from './shelfLifeRules'

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
   // Frequency per landscape type (AdK S. 261–266), in the order of `search.landscapes`; null = not there
   distribution: Array<number | null> | null
   distributionNote: string | null
   summary: { touch?: Localized; inhale?: Localized; eat?: Localized; knowledge: Localized[] } | null
}
// Kräutersuche tables (AdK S. 277) from the server
export type HerbSearchTables = {
   landscapes: string[]
   landscapeModifiers: Record<string, number>
   weatherModifiers: Record<'clear' | 'rain' | 'storm' | 'hurricane', number>
   generalSearchModifier: number
   baseHours: Record<'specific' | 'general', number>
}
// Mirrors server/src/utils/herbs/recipeTypes.ts (recipes of Archiv der Kräuter, AdK S. 144–178)
export type RecipeKind = 'hilfsmittel' | 'gift' | 'rauschmittel' | 'elixier' | 'alchimistischesGift' | 'alchimistischesRauschmittel'
export const plantRecipeKinds: readonly RecipeKind[] = ['hilfsmittel', 'gift', 'rauschmittel']
export type Recipe = {
   key: string
   name: string
   page: number
   kind: RecipeKind
   aliases: string[]
   ingredients: string | null
   tools?: string | null
   processing?: number | null
   costPerLevel?: number | null
   laboratory?: 'Archaisches Labor' | 'Hexenküche' | 'Alchemistenlabor' | null
   difficulty?: number | null
   brewPrerequisites?: string | null
   secretAp?: number | null
   secretPrerequisite?: string | null
   poison?: { level: number | 'QS' | null; type: string | null; resistance: string | null; onset: string | null; duration: string | null }
   legality?: string
   valuePrice?: string
   // Plant recipes: one application of each group (any plant of it) per product; optional plants are not tracked
   mainPlants: string[][]
   optionalPlants: string[]
   price: number | null
   pricePerLevel: boolean
   summary: { effect: Localized; qualities?: Localized[] } | null
   // Pflanzenkunde modifier of a plant recipe (S. 144); null for alchemical recipes
   craftModifier: number | null
   // Plant recipes: the talents it can be made with (Pflanzenkunde; a few name another, S. 148–149); secret = own Berufsgeheimnis
   craftTalents: Array<{ talent: string; modifier: number; application?: string }>
   secret: boolean
}
export type HerbReference = { herbs: Herb[]; effectTypes: string[]; landscapes: string[]; search: HerbSearchTables; shelfLife: ShelfLifeTables; recipes: Recipe[] }

// Making a plant recipe (server: herbItemController.ts craftHerbal): one Pflanzenkunde check for the batch
export async function craftHerbal(statsId: string, input: { recipe: string; amount: number; talent: string; check: { success: boolean } }) {
   return (await axiosInstance.post<{ crafted: number; stats: Stats }>(`/api/stats/craft-herbal/${statsId}`, input)).data
}

// Haltbarmachung of a raw stack (server: herbItemController.ts)
export type PreserveInput = { index: number; item: string } & (
   | { method: 'check'; check: { success: boolean; quality: number; critical: boolean } }
   | { method: 'part'; part: string; methodKey: string })
export async function preserveHerb(statsId: string, input: PreserveInput) {
   return (await axiosInstance.post<{ preserved: boolean; keepsUntilDay: number | null; stats: Stats }>(`/api/stats/preserve-herb/${statsId}`, input)).data
}

// A herb search the player rolled (server: herbSearchController.ts)
export type HerbSearchInput = {
   kind: 'specific' | 'general'; landscape: string; weather: 'clear' | 'rain' | 'storm' | 'hurricane'; plant?: string
   plantCheck: { success: boolean; quality: number }; use: 'improve' | 'yield'; hoursTaken?: number; sensesSuccess: boolean; picks?: string[]
}
export type HerbSearchResult = { found: Array<{ name: string; amount: number }>; pending: { _id: string; count: number } | null; hours: number; stats: Stats }
export async function searchHerbs(statsId: string, input: HerbSearchInput) {
   return (await axiosInstance.post<HerbSearchResult>(`/api/stats/herb-search/${statsId}`, input)).data
}

// A general search in a party waits for the GM's choice of species
export type HerbFind = {
   _id: string; charId: string; heroName: string; landscape: string; count: number; status: 'open' | 'assigned' | 'dismissed'
   picks: string[]; createdAt: string; suggestions: Array<{ key: string; frequency: number; search: number; note: string | null }>
}
export const herbFindsKey = (partyId: string) => ['herb-finds', partyId] as const
export async function getHerbFinds(partyId: string) {
   return (await axiosInstance.get<{ finds: HerbFind[] }>(`/api/parties/${partyId}/herb-finds`)).data.finds
}
export async function assignHerbFind(partyId: string, findId: string, picks: string[]) {
   return (await axiosInstance.post<{ find: HerbFind }>(`/api/parties/${partyId}/herb-finds/${findId}/assign`, { picks })).data.find
}
export async function dismissHerbFind(partyId: string, findId: string) {
   return (await axiosInstance.post<{ find: HerbFind }>(`/api/parties/${partyId}/herb-finds/${findId}/dismiss`)).data.find
}

export const herbReferenceKey = ['herb-reference'] as const

export async function getHerbReference() {
   return (await axiosInstance.get<HerbReference>('/api/stats/herb-reference')).data
}

// Static book data: loaded once per session
export function useHerbReference(enabled = true) {
   return useQuery({ queryKey: herbReferenceKey, queryFn: getHerbReference, staleTime: Infinity, gcTime: Infinity, enabled })
}

export const routeLabels: Record<HerbRoute, string> = { touch: 'Berührung', inhale: 'Einatmung', eat: 'Verzehr' }
