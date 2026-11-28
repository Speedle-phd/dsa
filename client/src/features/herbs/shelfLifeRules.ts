import { formatAventurianDate } from '@/features/books/aventurianCalendar'
import type { HerbItemState } from '@/features/books/bookApi'
import { t } from '@/locales/translation'

// Haltbarkeit of plant items (AdK S. 284–286, RW S. 345). Mirrors server/src/utils/herbs/shelfLife.ts (expiryDay,
// isSpoiled); the day counts come from the server's herb reference.
export type ShelfLifeTables = {
   plantParts: Array<{ key: string; label: string; rawDays: number; note?: string; methods: Array<{ key: string; label: string; days: number | null }> }>
   coreShelfDays: number
   rawShelfDays: number
   preserveCostKreuzer: number
}

export function expiryDay(herb: HerbItemState | null | undefined, shelfLife: boolean, tables: Pick<ShelfLifeTables, 'coreShelfDays' | 'rawShelfDays'>) {
   if (!herb || herb.lasting) return null
   if (herb.keepsUntilDay !== null && herb.keepsUntilDay !== undefined) return herb.keepsUntilDay
   if (herb.obtainedDay === null || herb.obtainedDay === undefined) return null
   return herb.obtainedDay + (shelfLife && herb.form === 'raw' ? tables.rawShelfDays : tables.coreShelfDays)
}

export function isSpoiled(herb: HerbItemState | null | undefined, shelfLife: boolean, tables: Pick<ShelfLifeTables, 'coreShelfDays' | 'rawShelfDays'>, today: number | null) {
   const last = expiryDay(herb, shelfLife, tables)
   return today !== null && last !== null && today > last
}

// "7 Tage", "3 Monate", "viele Jahre" for the part table
export function durationLabel(days: number | null, language: 'de' | 'en') {
   if (days === null) return language === 'de' ? 'viele Jahre' : 'many years'
   if (days === 0) return language === 'de' ? 'nur frisch' : 'only fresh'
   if (days % 30 === 0) {
      const months = days / 30
      return language === 'de' ? `${months} ${months === 1 ? 'Monat' : 'Monate'}` : `${months} ${months === 1 ? 'month' : 'months'}`
   }
   return language === 'de' ? `${days} ${days === 1 ? 'Tag' : 'Tage'}` : `${days} ${days === 1 ? 'day' : 'days'}`
}

const formLabels = { raw: 'raw', preserved: 'preserved', product: 'product' } as const

// Status line of a plant item in the inventory: its form, and the day it keeps until or "spoiled"
export function herbShelf(entry: { herb?: HerbItemState | null }, shelfLife: boolean, tables: Pick<ShelfLifeTables, 'coreShelfDays' | 'rawShelfDays'>, today: number | null, language: 'de' | 'en') {
   const herb = entry.herb
   if (!herb) return null
   const spoiled = isSpoiled(herb, shelfLife, tables, today)
   const last = expiryDay(herb, shelfLife, tables)
   const form = t(formLabels[herb.form], language)
   if (spoiled) return { spoiled, text: `${form} · ${t('spoiled', language)}` }
   const keeps = herb.lasting ? durationLabel(null, language)
      : last === null ? null : formatAventurianDate(last, language)
   return { spoiled, text: keeps ? `${form} · ${t('Keeps until', language)} ${keeps}` : form }
}
