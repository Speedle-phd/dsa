import type { Language } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import type { OpposedResult } from '@/features/heroes/skillCheck'
import { aventurianStore, type AventurianStoreItem } from './aventurian_store'

export type StoreVariant = NonNullable<AventurianStoreItem['variants']>[number]

const catalogItems = Object.values(aventurianStore).flat()

// Maps a stored equipment name ("Heiltrank (QS 3)", "Pferd (ausgebildet)") back to its catalog item and variant.
export function catalogEntry(name: string): { item: AventurianStoreItem; variant?: StoreVariant } | undefined {
   const exact = catalogItems.find((item) => item.name === name)
   if (exact) return { item: exact, variant: exact.variants?.find((variant) => variant.id === 'untrained') }
   for (const item of catalogItems) {
      const variant = item.variants?.find((option) => purchaseName(item, option) === name)
      if (variant) return { item, variant }
   }
   return undefined
}

export function equipmentDisplayName(name: string, language: Language) {
   const entry = catalogEntry(name)
   if (!entry) return name
   const suffix = entry.variant && entry.variant.id !== 'untrained' ? ` (${t(entry.variant.label, language)})` : ''
   return `${t(entry.item.name, language)}${suffix}`
}

const formatSilbertaler = (value: number, language: Language) =>
   `${new Intl.NumberFormat(language, { maximumFractionDigits: 2 }).format(value)} S`

// The stored equipment name keeps the variant (German, as printed) so the inventory knows the QS or training.
export function purchaseName(item: AventurianStoreItem, variant?: StoreVariant) {
   return variant && variant.id !== 'untrained' ? `${item.name} (${variant.label})` : item.name
}

export function defaultVariant(item: AventurianStoreItem) {
   return item.variants?.[0]
}

// Unit price for the purchase: variant price, the agreed price for "price varies" items, or the list price.
export function unitPrice(item: AventurianStoreItem, variant?: StoreVariant, agreedPrice?: number) {
   if (variant) return variant.silbertaler
   if (item.priceVaries) return agreedPrice ?? item.priceVaries.min ?? 0
   return item.price.silbertaler
}

// A haggled market rate changes list prices by a percentage (negative = cheaper), rounded to whole Kreuzer (S. 364).
export const withRate = (silbertaler: number, rate: number) => Math.round(silbertaler * (100 + rate)) / 100

// source: DSA5 Regelwerk, S. 208 (Feilschen: Vergleichsprobe Handel (Feilschen); the price moves by the winner's net QS × 10 %,
// at most 50 %; a critical success or botch moves it by at least 50 %, here exactly 50 %). The buyer wants a lower price.
export function haggleRate(contest: OpposedResult) {
   if (contest.winner === 'draw') return 0
   const percent = contest.netQuality === null ? 50 : Math.min(50, contest.netQuality * 10)
   return contest.winner === 'own' ? -percent : percent
}

export function priceLabel(item: AventurianStoreItem, language: Language, rate = 0) {
   const unit = item.priceUnit ? ` ${t(item.priceUnit, language)}` : ''
   if (item.kind === 'elixir') return `${formatSilbertaler(withRate(item.price.silbertaler, rate), language)} / QS`
   if (item.variants?.length) return `${t('from', language)} ${formatSilbertaler(withRate(item.variants[0].silbertaler, rate), language)}`
   if (item.priceVaries) {
      const { min, max } = item.priceVaries
      if (min !== undefined && max !== undefined) return `${formatSilbertaler(min, language).replace(' S', '')}–${formatSilbertaler(max, language)}${unit}`
      return t('Price varies', language)
   }
   return item.price.silbertaler ? `${formatSilbertaler(withRate(item.price.silbertaler, rate), language)}${unit}` : t('free', language)
}
