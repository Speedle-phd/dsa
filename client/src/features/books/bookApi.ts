import { useQuery } from '@tanstack/react-query'
import { axiosInstance } from '@/axios/axios'
import type { Party } from '@/features/parties/partyApi'
import type { BookRules } from './bookRules'

// Mirrors server/src/utils/herbItem.ts: plant items are raw, preserved or a product; days are in-game day numbers
export type HerbItemState = { form: 'raw' | 'preserved' | 'product'; obtainedDay: number | null; keepsUntilDay: number | null }

export type CalendarAction = { action: 'set'; day: number } | { action: 'advance'; days: number } | { action: 'clear' }

// Mirrors server/src/controllers/bookController.ts: the party's rules and date while the hero plays in one
export type BookContext = {
   source: 'party' | 'hero'
   party: { _id: string; name: string } | null
   rules: BookRules
   calendarDay: number | null
}

export const bookContextKey = (statsId: string) => ['book-context', statsId] as const

export async function getBookContext(statsId: string) {
   return (await axiosInstance.get<BookContext>(`/api/stats/book-context/${statsId}`)).data
}
export async function updateBookSettings(statsId: string, change: { rules?: Partial<BookRules>; calendar?: CalendarAction }) {
   return (await axiosInstance.put<BookContext>(`/api/stats/book-settings/${statsId}`, change)).data
}
export async function updatePartyRules(partyId: string, rules: Partial<BookRules>) {
   return (await axiosInstance.put<{ party: Party }>(`/api/parties/${partyId}/rules`, { rules })).data.party
}
export async function updatePartyCalendar(partyId: string, change: CalendarAction) {
   return (await axiosInstance.post<{ party: Party }>(`/api/parties/${partyId}/calendar`, change)).data.party
}

export function useBookContext(statsId: string | undefined) {
   return useQuery({ queryKey: bookContextKey(statsId ?? ''), queryFn: () => getBookContext(statsId ?? ''), enabled: Boolean(statsId) })
}
