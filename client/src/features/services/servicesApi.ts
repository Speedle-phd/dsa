import { axiosInstance } from '@/axios/axios'
import type { ActiveEffect } from '@/features/heroes/activeEffectsApi'
import type { Stats } from '@/features/heroes/statsApi'

export type Coin = 'Silbertaler' | 'Heller' | 'Kreuzer'
export type ServiceGroup = 'medicus' | 'bathhouse' | 'alchemist' | 'smithy' | 'drinks' | 'food' | 'lodging' | 'inn' |
   'scriptorium' | 'travel' | 'misc'
// Dienstleistungen (S. 381–382); priced by the server.
export type Service = {
   key: string
   group: ServiceGroup
   price: { amount: number; coin: Coin }
   priceKreuzer: number
   unit?: 'per hoof' | 'per page' | 'per 100 miles' | 'per night' | 'donation'
   page: number
   effect?: 'treatment' | 'rest'
}
export type BillItem = { key: string; quantity: number }

export async function getServiceReference() {
   return (await axiosInstance.get<{ services: Service[] }>('/api/stats/service-reference')).data.services
}
export async function purchaseService(statsId: string, items: BillItem[], treatmentQuality?: number) {
   return (await axiosInstance.put<{ stats: Stats; effects: ActiveEffect[]; paidKreuzer: number }>(
      `/api/stats/purchase-service/${statsId}`, { items, ...(treatmentQuality ? { treatmentQuality } : {}) })).data
}

const coinShort: Record<Coin, string> = { Silbertaler: 'S', Heller: 'H', Kreuzer: 'K' }
export const formatServicePrice = (price: Service['price'], language: 'de' | 'en') =>
   `${new Intl.NumberFormat(language, { maximumFractionDigits: 2 }).format(price.amount)} ${coinShort[price.coin]}`

// source: DSA5 Regelwerk, S. 364 (1 D = 10 S = 100 H = 1000 K)
export const purseKreuzer = (purse: Stats['purse']) => purse.dukaten * 1000 + purse.silbertaler * 100 + purse.heller * 10 + purse.kreuzer
export function formatKreuzer(total: number) {
   const parts: Array<[number, string]> = [[Math.floor(total / 1000), 'D'], [Math.floor(total % 1000 / 100), 'S'], [Math.floor(total % 100 / 10), 'H'], [total % 10, 'K']]
   const shown = parts.filter(([value]) => value > 0).map(([value, coin]) => `${value} ${coin}`)
   return shown.length ? shown.join(' ') : '0 K'
}
