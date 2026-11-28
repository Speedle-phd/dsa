import type { Herb } from './herbApi'

// Kräutersuche (AdK S. 276–278) for the search dialog. Mirrors server/src/utils/herbs/herbSearch.ts, which recomputes
// everything; the modifier tables come from the server's herb reference.
export type SearchKind = 'specific' | 'general'
export type SearchWeather = 'clear' | 'rain' | 'storm' | 'hurricane'
export type QualityUse = 'improve' | 'yield'

// AdK S. 277, "Qualität bei der Kräutersuche": the best value reached counts
export function qualityBenefits(quality: number) {
   return {
      hours: quality >= 5 ? 6 : quality >= 3 ? 4 : quality >= 1 ? 2 : 0,
      senses: quality >= 6 ? 3 : quality >= 4 ? 2 : quality >= 2 ? 1 : 0,
   }
}

// Search time and the Sinnesschärfe modifier; a shortened search costs −1 per 2 hours saved (AdK S. 278)
export function searchPlan(baseHours: number, quality: number, use: QualityUse, hoursTaken?: number) {
   const benefits = use === 'improve' ? qualityBenefits(quality) : { hours: 0, senses: 0 }
   const hours = baseHours - benefits.hours
   const taken = Math.min(hours, hoursTaken ?? hours)
   const shortened = taken < hours ? -Math.floor((hours - taken) / 2) : 0
   return { hours, taken, senses: benefits.senses, shortened, valid: taken >= 2 }
}

// The yield (AdK S. 277–278); user decision (Nov 2026): with "improve" the minimum, QS 1 applications and 1 species
export function searchYield(kind: SearchKind, quality: number, use: QualityUse, applications?: number[] | null) {
   const q = Math.max(1, Math.min(6, quality))
   if (kind === 'general') return { species: use === 'yield' ? q : 1, applications: null }
   return { species: 1, applications: applications ? applications[(use === 'yield' ? q : 1) - 1] ?? 1 : 1 }
}

// Plants of a landscape, most common first, conditional ones (a * remark) last within a frequency, then the easier to find
// (AdK S. 261–266, 278)
export function landscapeSuggestions(herbs: readonly Herb[], landscapeIndex: number) {
   return herbs
      .filter((herb) => herb.search !== null && herb.distribution?.[landscapeIndex] != null)
      .map((herb) => ({ herb, frequency: herb.distribution?.[landscapeIndex] ?? 0 }))
      .sort((a, b) => b.frequency - a.frequency || Number(Boolean(a.herb.distributionNote)) - Number(Boolean(b.herb.distributionNote))
         || (b.herb.search ?? 0) - (a.herb.search ?? 0) || a.herb.key.localeCompare(b.herb.key, 'de'))
}

// AdK S. 261: frequency labels of the distribution table
export const frequencyLabels: Record<number, string> = { 5: 'gewöhnlich', 4: 'gelegentlich', 3: 'eher selten', 2: 'selten', 1: 'sehr selten' }
