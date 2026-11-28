// Haltbarkeit of plants (Archiv der Kräuter, AdK S. 284–286; Regelwerk S. 345). Days are in-game day numbers
// (bookRules.ts calendar: months of 30 days).
// source: RW S. 345 / AdK S. 284 box "Haltbarkeit ohne Fokusregel": without the focus rules plants keep 3 months
// source: AdK S. 284 (Fokusregel I: a Pflanzenkunde check preserves all applications of a plant: 1 month + 1 per QS;
//         material 5 Kreuzer per application)
// source: AdK S. 284–286 (Fokusregel II: per plant part and method, 5 minutes per application, no check)
import type { BookRules } from '@/utils/bookRules'
import type { HerbItemState } from '@/utils/herbItem'

export const daysPerMonth = 30
export const coreShelfDays = 3 * daysPerMonth
// User decision (Nov 2026): with Fokusregel I alone, raw plants keep 1 week (the table's value for leaves)
export const rawShelfDays = 7
// AdK S. 284: "pauschal 5 Kreuzer pro Anwendung"
export const preserveCostKreuzer = 5

export type PreserveMethod = { key: string; label: string; days: number | null }
export type PlantPart = { key: string; label: string; rawDays: number; methods: PreserveMethod[]; note?: string }

const m = (months: number) => months * daysPerMonth
// AdK S. 285–286, "Allgemeine Haltbarkeit von Pflanzenteilen" (null days = "viele Jahre"; 24 h = 1 day; 12 h = the same day)
export const plantParts: PlantPart[] = [
   { key: 'leaves', label: 'Blätter und Kräuter', rawDays: 7, methods: [{ key: 'dry', label: 'zerkleinern und trocknen', days: m(1) }] },
   { key: 'flowers', label: 'Blütenteile und Knospen', rawDays: 1, methods: [
      { key: 'dry', label: 'ganz trocknen', days: m(1) }, { key: 'pickle', label: 'in Öl, Alkohol oder Essig einlegen', days: m(3) }] },
   { key: 'thorns', label: 'Dornen und Stacheln', rawDays: m(1), methods: [
      { key: 'dry', label: 'ganz trocknen', days: m(3) }, { key: 'essence', label: 'vom Stängel trennen und einlegen (Essenz)', days: m(6) }] },
   { key: 'fibres', label: 'Fasern und Myzel', rawDays: 7, methods: [
      { key: 'dry', label: 'ganz trocknen', days: m(3) }, { key: 'pickle', label: 'in Öl, Alkohol oder Essig einlegen', days: m(6) }] },
   { key: 'fruitBody', label: 'Fruchtkörper', rawDays: 7, methods: [
      { key: 'press', label: 'auspressen, Sud luftdicht verschließen, Masse trocknen', days: m(12) }, { key: 'dry', label: 'ganz trocknen', days: m(6) },
      { key: 'boil', label: 'einkochen, Masse luftdicht verschließen', days: m(12) }] },
   { key: 'resin', label: 'Harz', rawDays: m(6), methods: [{ key: 'harden', label: 'aushärten lassen', days: null }] },
   { key: 'wood', label: 'Holz, Rinde und Schale', rawDays: m(2), methods: [
      { key: 'dry', label: 'großzügig portionieren und trocknen', days: m(12) }, { key: 'powder', label: 'pulverisieren und trocken lagern', days: m(8) },
      { key: 'paste', label: 'pulverisieren und mit Öl zu Paste vermischen', days: m(10) }] },
   { key: 'sap', label: 'Saft und Gel', rawDays: 3, methods: [{ key: 'boil', label: 'auspressen, abkochen und luftdicht verschließen', days: m(6) }] },
   { key: 'seeds', label: 'Samen', rawDays: m(6), methods: [{ key: 'dry', label: 'ganz trocknen und ggf. schälen', days: m(12) }] },
   { key: 'stalks', label: 'Stängel', rawDays: m(1), methods: [
      { key: 'essence', label: 'zerkleinern und einkochen, Sud luftdicht verschließen (Essenz)', days: m(6) }, { key: 'dry', label: 'portionieren und trocknen', days: m(9) }] },
   { key: 'shoots', label: 'Triebe und Sprossen', rawDays: 0, note: 'meist nur frisch voll wirksam', methods: [{ key: 'pickle', label: 'in Öl, Alkohol oder Essig einlegen', days: m(1) }] },
   { key: 'oil', label: 'Öl', rawDays: m(3), methods: [{ key: 'press', label: 'auspressen, abkochen, absieben und luftdicht verschließen', days: m(12) }] },
   { key: 'roots', label: 'Wurzeln und Wurzelstock', rawDays: m(6), methods: [{ key: 'dry', label: 'ganz oder zerkleinert trocknen (Sud und Masse getrennt)', days: m(12) }] },
   { key: 'bulbs', label: 'Zwiebeln', rawDays: m(1), methods: [{ key: 'store', label: 'dunkel und kühl lagern', days: m(6) }] },
]

// The last in-game day a plant item keeps its effect; null = unknown (no day recorded) or lasting (many years).
// A stored keepsUntilDay wins (preserved by a check or a method). Otherwise: core rule 3 months, or with Fokusregel I
// raw plants 1 week (user decision) and bought or made plants the core 3 months (app choice).
export function expiryDay(herb: HerbItemState | null | undefined, rules: Pick<BookRules, 'shelfLife'>): number | null {
   if (!herb || herb.lasting) return null
   if (herb.keepsUntilDay !== null && herb.keepsUntilDay !== undefined) return herb.keepsUntilDay
   if (herb.obtainedDay === null || herb.obtainedDay === undefined) return null
   if (rules.shelfLife && herb.form === 'raw') return herb.obtainedDay + rawShelfDays
   return herb.obtainedDay + coreShelfDays
}

// Spoiled when the current day is past the last day (no calendar day: nothing spoils)
export function isSpoiled(herb: HerbItemState | null | undefined, rules: Pick<BookRules, 'shelfLife'>, today: number | null) {
   const last = expiryDay(herb, rules)
   return today !== null && last !== null && today > last
}

// Fokusregel I: 1 month + 1 per QS; a critical success doubles it (RW S. 200, Pflanzenkunde: "doppelt so lange")
export function preservedByCheck(today: number, quality: number, critical: boolean) {
   const days = (1 + Math.max(0, quality)) * daysPerMonth
   return today + (critical ? days * 2 : days)
}

// Fokusregel II: the method's processed shelf life from today; "viele Jahre" keeps without an end (lasting)
export function preservedByMethod(today: number, partKey: string, methodKey: string): { keepsUntilDay: number | null; lasting: boolean } | { error: string } {
   const method = plantParts.find((part) => part.key === partKey)?.methods.find((entry) => entry.key === methodKey)
   if (!method) return { error: 'Choose a plant part and a method from the table (AdK S. 285).' }
   return method.days === null ? { keepsUntilDay: null, lasting: true } : { keepsUntilDay: today + method.days, lasting: false }
}
