// Plants of Archiv der Kräuter (AdK S. 9–142). Facts come from the book's labelled fields (herbData.ts, generated);
// effects and knowledge are short summaries in own words (herbSummaries.ts; user decision, Nov 2026).

export type Localized = { de: string; en: string }

// The seven effect types of the overview table (AdK S. 266–270)
export const herbEffectTypes = ['Heilung', 'Gift', 'physisch', 'psychisch', 'Nützlich', 'Wehrhaft', 'Übernatürlich'] as const
export type HerbEffectType = (typeof herbEffectTypes)[number]

// The landscape types of the plant pages and the herb search (AdK S. 260, 276)
export const herbLandscapes = ['Hoher Norden', 'Grasländer, Heiden und Steppen', 'Sümpfe, Marschen und Moore', 'Wälder', 'Regenwälder', 'Gebirge',
   'Wüstenrandgebiete und Wüsten', 'Maraskan', 'Höhlen'] as const
export type HerbLandscape = (typeof herbLandscapes)[number]
// The eight landscape types of the herb search and the distribution table (AdK S. 262, 276); caves count via notes
export const searchLandscapes = ['Hoher Norden', 'Grasländer, Heiden und Steppen', 'Sümpfe, Marschen und Moore', 'Wälder', 'Regenwälder', 'Gebirge',
   'Wüstenrandgebiete und Wüsten', 'Maraskan'] as const
export type SearchLandscape = (typeof searchLandscapes)[number]

export type HerbRoute = 'touch' | 'inhale' | 'eat'

export type HerbFacts = {
   name: string
   page: number
   effectTypes: HerbEffectType[]
   // The book's text: landscape type(s) and regions with frequency ("selten", "gelegentlich" …)
   landscape: string | null
   regions: string | null
   // Modifiers on Pflanzenkunde for finding and identifying the plant; null with a note when the book gives no number
   search: number | null
   searchNote: string | null
   identify: number | null
   identifyNote: string | null
   // Applications found per QS 1–6
   applications: number[] | null
   applicationsNote: string | null
   // Silbertaler per application, raw / processed
   price: { raw: number | null; processed: number | null; note: string | null }
   recipes: Array<{ name: string; page: number; book: 'AdK' | 'RW' }>
   // Raw routes the page gives an effect for (Berührung, Einatmung, Verzehr)
   rawRoutes: HerbRoute[]
   // Frequency per landscape type (AdK S. 261–266): 5 gewöhnlich … 1 sehr selten, null = not there; order of searchLandscapes
   distribution: Array<number | null> | null
   distributionNote: string | null
}

// Short summaries per raw route and what a hero knows per QS of Pflanzenkunde (QS 1, 2, 3+)
export type HerbSummary = {
   touch?: Localized
   inhale?: Localized
   eat?: Localized
   knowledge: Localized[]
}

export type Herb = HerbFacts & {
   key: string
   landscapes: HerbLandscape[]
   summary: HerbSummary | null
}
