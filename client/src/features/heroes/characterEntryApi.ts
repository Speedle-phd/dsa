import { axiosInstance } from '@/axios/axios'
import type { Stats } from './statsApi'

export type EntryCategory = 'advantages' | 'disadvantages' | 'generalSpecialAbilities' | 'languages' | 'scripts'
export type EntryEffect = { de: string; en: string; page: number }
export type EntryGroup = 'general' | 'fate' | 'magic' | 'tradition' | 'staff' | 'witch' | 'karma'
export type EntrySelection = {
   category: EntryCategory
   catalogKey: string
   level: number
   detail: string
   application: string
   potency?: number
}
export type EntryPurchase = EntrySelection & { key: string; ap: number }
export type EntryMode = 'purchase' | 'record' | 'creation'
export type EntrySuggestion = { value: string; level?: number; label?: string }
export type EntryReference = {
   entries: Array<{
      key: string
      category: EntryCategory
      ap: number
      levels?: number
      parameter?: 'talent' | 'technique' | 'text' | 'immunity' | 'specialization'
      choices?: string[]
      // Free-text subjects: the book's examples (level = the level the book gives)
      suggestions?: EntrySuggestion[]
      creationOnly?: boolean
      // Special abilities: Overview (general, fate, karma) or the Arcana sections
      group?: EntryGroup
      effect: EntryEffect
   }>
   talents: string[]
   techniques: string[]
}
export type EntryQuote = {
   key: string
   ap: number
   requirements: string[]
   problems: string[]
   approval: { de: string; en: string } | null
   effect: EntryEffect
}
export type RemovalQuote = { refund: number; creditReversal: number; dependents: string[]; buyOff: number | null }
export type AddEntryInput = {
   category: EntryCategory
   mode: EntryMode
   key?: string
   selection?: EntrySelection
   gmApproved: boolean
}
export type RemoveEntryInput = { category: EntryCategory; key: string; mode: 'undo' | 'buyOff' | 'record'; gmApproved: boolean }

export async function getEntryReference() {
   return (await axiosInstance.get<EntryReference>('/api/stats/character-entry-reference')).data
}
export async function previewEntry(id: string, selection: EntrySelection, mode: EntryMode) {
   return (await axiosInstance.post<EntryQuote>(`/api/stats/character-entry-preview/${id}`, { ...selection, mode })).data
}
export async function previewEntryRemoval(id: string, category: EntryCategory, key: string) {
   return (await axiosInstance.post<RemovalQuote>(`/api/stats/character-entry-removal-preview/${id}`, { category, key })).data
}
export async function addEntry(id: string, input: AddEntryInput) {
   return (await axiosInstance.put<{ stats: Stats }>(`/api/stats/character-entry/${id}`, input)).data.stats
}
export async function removeEntry(id: string, input: RemoveEntryInput) {
   return (await axiosInstance.put<{ stats: Stats }>(`/api/stats/remove-character-entry/${id}`, input)).data.stats
}
