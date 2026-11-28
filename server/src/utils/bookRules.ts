// Optional rules and content of expansion books. User decision, Nov 2026: the GM switches them per party; a hero
// without a party has its own switches. Off = the core rules. "Fokusregeln" build on each other (Stufe I → II).
// source: Archiv der Kräuter (AdK), S. 275, 278 (Kräutersuche I, Regionen II), S. 284 (Haltbarmachung I, Pflanzenteile II), S. 301 (Sucht I)

export const bookRuleKeys = ['adk', 'herbSearch', 'herbSearchRegions', 'shelfLife', 'shelfLifeParts', 'addiction'] as const
export type BookRuleKey = (typeof bookRuleKeys)[number]
export type BookRules = Record<BookRuleKey, boolean>

// `requires`: a rule only applies when the rule it builds on is on; `adk` is the book itself (Herbarium, recipes)
export const bookRuleRequirements: Record<BookRuleKey, BookRuleKey | null> = {
   adk: null,
   herbSearch: 'adk',
   herbSearchRegions: 'herbSearch',
   shelfLife: 'adk',
   shelfLifeParts: 'shelfLife',
   addiction: 'adk',
}

export const defaultBookRules: BookRules = { adk: false, herbSearch: false, herbSearchRegions: false, shelfLife: false, shelfLifeParts: false, addiction: false }

// The switches stored on a party or hero (also a Mongoose subdocument): known keys only, as chosen
export function storedBookRules(value: unknown): Partial<BookRules> {
   const source = (value ?? {}) as Record<string, unknown>
   return Object.fromEntries(bookRuleKeys.filter((key) => typeof source[key] === 'boolean').map((key) => [key, source[key]])) as Partial<BookRules>
}

// Fills missing switches and turns off every rule whose base rule is off (stored values stay as chosen)
export function normalizeBookRules(input: Partial<BookRules> | null | undefined): BookRules {
   const rules = { ...defaultBookRules }
   for (const key of bookRuleKeys) rules[key] = input?.[key] === true
   const active = (key: BookRuleKey): boolean => rules[key] && (bookRuleRequirements[key] === null || active(bookRuleRequirements[key]))
   return Object.fromEntries(bookRuleKeys.map((key) => [key, active(key)])) as BookRules
}

// The party's switches win over the hero's own while the hero plays in it
export function effectiveBookRules(own: Partial<BookRules> | null | undefined, party: { rules?: Partial<BookRules> | null } | null): BookRules {
   return normalizeBookRules(party ? party.rules : own)
}

// ---- In-game date (user decision, Nov 2026: a party calendar the GM sets and advances; a solo hero has its own)
// A date is a day number: 0 = 1 Praios 0 BF, 365 days a year (12 × 30 + 5 Namenlose Tage, user decision: the
// common Aventurian calendar; the books in the repo do not define it). Shown as a date on the client.
export const daysPerYear = 365
export const maxCalendarDay = daysPerYear * 5000

export type CalendarAction = { action: 'set'; day: number } | { action: 'advance'; days: number } | { action: 'clear' }

export function applyCalendarAction(current: number | null | undefined, change: CalendarAction): { day: number | null } | { error: string } {
   if (change.action === 'clear') return { day: null }
   if (change.action === 'set') return change.day >= 0 && change.day <= maxCalendarDay ? { day: change.day } : { error: 'This date is out of range.' }
   if (current === null || current === undefined) return { error: 'Set a date first.' }
   const day = current + change.days
   return day >= 0 && day <= maxCalendarDay ? { day } : { error: 'This date is out of range.' }
}
