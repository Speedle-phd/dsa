# Archiv der Kräuter: book rules, calendar and plant items (Phase 0)

source: Archiv der Kräuter (AdK), S. 275, 278, 284, 301; DSA5 Regelwerk, S. 10, 345, 398

## Summary

- Many AdK rules are **Fokusregeln**: optional, in levels (Stufe I, Stufe II builds on Stufe I).
  - Kräutersuche I (AdK S. 275), Kräutersuche in Regionen II (S. 278)
  - Haltbarmachung I and Haltbarkeit von Pflanzenteilen II (S. 284)
  - Sucht I (S. 301)
- Without them the core rules apply, e.g. herbs keep three months (RW S. 345; AdK S. 284 "Haltbarkeit ohne Fokusregel").
- Shelf life and other durations need an in-game date. Neither book defines the calendar: the Regelwerk names the Twelve Gods (S. 10) and the Namenlose Tage (S. 398).

## Decisions

- User decisions (Nov 2026):
  - The GM switches the book rules **per party**. A hero without a party has its own switches. Off = core rules.
  - **A party calendar**: the GM sets and advances the date; a solo hero has its own date.
  - **The calendar layout**: the common Aventurian calendar, recorded as a user decision because the books don't define it. It has 12 god months of 30 days (Praios … Rahja), then 5 Namenlose Tage, 365 days a year, years in BF.
  - AdK content is entered as short de/en summaries in own words with `AdK S. …`.
- App choices, not user decisions:
  - A date is stored as a day number (0 = 1 Praios 0 BF). The client shows it as a date (`3. Peraine 1045 BF`).
  - A Stufe II rule only applies while its Stufe I and the book are on. The stored switch keeps its value, so turning the base rule back on restores it.
  - A hero in an active party uses the party's rules and date and cannot change its own (400); the switches are stored per hero for later.
  - Switches for rules the app does not apply yet are shown but disabled ("Noch nicht umgesetzt").
  - Inventory entries of plants carry `herb { form: raw|preserved|product, obtainedDay, keepsUntilDay }`. Stacks only merge with the same state and days.

## Code

- Server:
  - `server/src/utils/bookRules.ts`: keys, requirements, `normalizeBookRules`, `effectiveBookRules`, `storedBookRules`, `applyCalendarAction` (+ test)
  - `server/src/utils/herbItem.ts`: plant item state, `sameHerbState`; used by `equipmentPurchase.ts` (+ test)
  - Models: `party.rules`, `party.calendarDay`, `stats.bookRules`, `stats.calendarDay`, `equipment[].herb`
  - `PUT /api/parties/:id/rules`, `POST /api/parties/:id/calendar` (GM only, `partyController.ts`); `GET /api/stats/book-context/:id` and `PUT /api/stats/book-settings/:id` (owner; `bookController.ts`); validation in `validations/bookValidation.ts`
- Client:
  - `client/src/features/books/`: `bookRules.ts` (mirror with labels and pages), `aventurianCalendar.ts` (+ test), `bookApi.ts`, `BookSettings.tsx`
  - Shown on the party page (GM edits, members read) and on the settings page with a hero picker (`HeroBookSettingsPicker`; user request, Nov 2026). The Alchemy tab only links to it while the book is off.
