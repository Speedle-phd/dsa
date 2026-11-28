// Kräutersuche, Fokusregel Stufe I (Archiv der Kräuter, AdK S. 275–278). Pure rules; the client rolls the checks.
// source: AdK S. 276–277 (3 steps: landscape, Pflanzenkunde, Sinnesschärfe (Suchen); modifier tables; QS table; base time)
// source: AdK S. 278 (shortened search; finds; the GM picks the species of a general search, the distribution table helps)
import { searchLandscapes, type Herb, type SearchLandscape } from './herbTypes'

export type SearchKind = 'specific' | 'general'
export type SearchWeather = 'clear' | 'rain' | 'storm' | 'hurricane'
// "improve": shorter search and an easier Sinnesschärfe check; "yield": more applications (specific) or species (general)
export type QualityUse = 'improve' | 'yield'

// AdK S. 277, "Landschaftstyp der Kräutersuche"
export const landscapeModifiers: Record<SearchLandscape, number> = {
   'Hoher Norden': -4, 'Grasländer, Heiden und Steppen': 0, 'Sümpfe, Marschen und Moore': -1, Wälder: 1, Regenwälder: 0,
   Gebirge: -1, 'Wüstenrandgebiete und Wüsten': -4, Maraskan: -2,
}
// AdK S. 277, "Weitere Modifikatoren": Regen/Schnee −1, Sturm −2, Orkan −3
export const weatherModifiers: Record<SearchWeather, number> = { clear: 0, rain: -1, storm: -2, hurricane: -3 }
// AdK S. 277: a general search is −1 (a specific one uses the plant's Suchschwierigkeit); base time 8 / 10 hours
export const generalSearchModifier = -1
export const baseHours: Record<SearchKind, number> = { specific: 8, general: 10 }

export type CheckSource = { label: string; value: number }

// Modifiers of the Pflanzenkunde check
export function plantCheckSources(input: { landscape: SearchLandscape; weather: SearchWeather; kind: SearchKind; plantSearch?: number | null }): CheckSource[] {
   return [
      { label: input.landscape, value: landscapeModifiers[input.landscape] },
      ...(weatherModifiers[input.weather] ? [{ label: input.weather, value: weatherModifiers[input.weather] }] : []),
      input.kind === 'general' ? { label: 'Allgemeine Kräutersuche', value: generalSearchModifier } : { label: 'Suchschwierigkeit', value: input.plantSearch ?? 0 },
   ]
}

// AdK S. 277, "Qualität bei der Kräutersuche": the best value reached counts (QS 4: −4 hours and Sinnesschärfe +2)
export function qualityBenefits(quality: number) {
   return {
      hours: quality >= 5 ? 6 : quality >= 3 ? 4 : quality >= 1 ? 2 : 0,
      senses: quality >= 6 ? 3 : quality >= 4 ? 2 : quality >= 2 ? 1 : 0,
   }
}

// Time and the Sinnesschärfe modifier. `hoursTaken`: a shortened search, −1 per 2 hours saved; under 2 hours has no
// effect (AdK S. 278), so it is refused
export function searchPlan(input: { kind: SearchKind; quality: number; use: QualityUse; hoursTaken?: number }): { hours: number; sensesModifier: number; shortened: number } | { error: string } {
   const benefits = input.use === 'improve' ? qualityBenefits(input.quality) : { hours: 0, senses: 0 }
   const hours = baseHours[input.kind] - benefits.hours
   const taken = input.hoursTaken ?? hours
   if (taken < 2) return { error: 'A search of less than 2 hours finds nothing (AdK S. 278).' }
   const shortened = taken < hours ? -Math.floor((hours - taken) / 2) : 0
   return { hours: Math.min(hours, taken), sensesModifier: benefits.senses + shortened, shortened }
}

// What a successful search finds (AdK S. 277–278; RW S. 344: applications by QS from the plant's table).
// User decision (Nov 2026): with "improve" the yield is the minimum, the applications of QS 1 and 1 species.
export function searchYield(input: { kind: SearchKind; quality: number; use: QualityUse; applications?: number[] | null }) {
   const quality = Math.max(1, Math.min(6, input.quality))
   if (input.kind === 'general') return { species: input.use === 'yield' ? quality : 1, applications: null }
   const table = input.applications ?? null
   return { species: 1, applications: table ? table[(input.use === 'yield' ? quality : 1) - 1] ?? 1 : 1 }
}

// The plants of a landscape for the GM's choice, most common first, then the easier to find (AdK S. 261, 278:
// "häufiger Pflanzen mit geringer Suchschwierigkeit"). Plants that are not found in the wild are left out. Plants that
// only grow under a condition (a * remark in the table, e.g. "in Höhlen") come after the others of the same frequency.
export function landscapeSuggestions(herbs: readonly Herb[], landscape: SearchLandscape) {
   const index = searchLandscapes.indexOf(landscape)
   return herbs
      .filter((herb) => herb.search !== null && herb.distribution?.[index] != null)
      .map((herb) => ({ key: herb.key, frequency: herb.distribution?.[index] ?? 0, search: herb.search ?? 0, note: herb.distributionNote }))
      .sort((a, b) => b.frequency - a.frequency || Number(Boolean(a.note)) - Number(Boolean(b.note)) || b.search - a.search || a.key.localeCompare(b.key, 'de'))
}

// A specific search needs a plant that grows in that landscape and can be found in the wild
export function canSearchFor(herb: Herb, landscape: SearchLandscape) {
   return herb.search !== null && herb.distribution?.[searchLandscapes.indexOf(landscape)] != null
}
