// The optional rules of expansion books the GM switches per party (a hero without a party has its own switches).
// Keep in sync with server/src/utils/bookRules.ts; the server sends the rules already resolved (Stufe II needs Stufe I).
export const bookRuleKeys = ['adk', 'herbSearch', 'herbSearchRegions', 'shelfLife', 'shelfLifeParts', 'addiction'] as const
export type BookRuleKey = (typeof bookRuleKeys)[number]
export type BookRules = Record<BookRuleKey, boolean>

// `available`: the app already applies the rule (Archiv der Kräuter is built in phases, see HANDOFF.md)
export const bookRuleInfo: Record<BookRuleKey, { label: string; hint: string; page: number | null; level: 1 | 2 | null; requires: BookRuleKey | null; available: boolean }> = {
   adk: { label: 'Archiv der Kräuter', hint: 'Herbarium in the Alchemy tab, the book’s plants in the store, plant knowledge after Pflanzenkunde.', page: null, level: null, requires: null, available: true },
   herbSearch: { label: 'Kräutersuche', hint: 'Search herbs with Pflanzenkunde and Sinnesschärfe by landscape.', page: 275, level: 1, requires: 'adk', available: true },
   herbSearchRegions: { label: 'Kräutersuche in Regionen', hint: 'Search modifiers per region instead of per landscape.', page: 278, level: 2, requires: 'herbSearch', available: false },
   shelfLife: { label: 'Haltbarmachung', hint: 'Shelf life by a Pflanzenkunde check instead of a flat three months.', page: 284, level: 1, requires: 'adk', available: true },
   shelfLifeParts: { label: 'Haltbarkeit von Pflanzenteilen', hint: 'Shelf life per plant part and method, without a check.', page: 284, level: 2, requires: 'shelfLife', available: true },
   addiction: { label: 'Sucht', hint: 'Drugs: Zechen check, Berauscht, overdose and addiction.', page: 301, level: 1, requires: 'adk', available: false },
}
