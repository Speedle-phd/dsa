# Archiv der Kräuter: Haltbarkeit (Phase 3)

source: Archiv der Kräuter (AdK), S. 284–286 (Haltbarmachung, Fokusregel I and II); DSA5 Regelwerk, S. 200, 345

## Summary

- **Core rule** (RW S. 345): plants keep 3 months.
- **Haltbarmachung, Fokusregel I** (AdK S. 284):
  - One Pflanzenkunde check preserves a whole stack.
  - It keeps 1 month plus 1 month per QS.
  - Material costs 5 Kreuzer per application.
  - A critical success doubles the duration (RW S. 200, Pflanzenkunde: "doppelt so lange").
- **Fokusregel II** (AdK S. 285–286): a table of plant parts. Each part has a raw shelf life and one or more methods (dry, pickle in oil/alcohol/vinegar, store dark and cool …) with their own shelf life. "viele Jahre" has no end date. Each application takes 5 minutes and needs no check.
- Spoiled plants have lost their effect (AdK S. 284).

## Decisions

- User decisions (Nov 2026):
  - With Haltbarmachung on, **raw plants keep 1 week**, also with Fokusregel II. The part table's raw values are shown in the dialog for information.
  - With Fokusregel II, the **player picks the plant part and the method** from the table; the catalog does not record which part a plant uses.
  - **Spoiled plants are marked and blocked**: "verdorben" in the inventory, "Verwenden" is gone (the server refuses too), and "Wegwerfen" removes the stack.
- App choices, not user decisions:
  - The material is paid also when the check fails; without enough money the server refuses and the stack stays raw.
  - Preserving needs an in-game date. Without one, plants never spoil and cannot be preserved; the Alchemy tab says so.
  - A stack keeps its `obtainedDay` when preserved; `keepsUntilDay` records the end (`null` = viele Jahre).
  - Bought plants and products follow the same day logic: without Haltbarmachung, 3 months from the day they were obtained.

## Code

- Server:
  - `server/src/utils/herbs/shelfLife.ts`: `plantParts` (14 parts of S. 285–286), `expiryDay`, `isSpoiled`, `preservedByCheck`, `preservedByMethod` (+ test with the book's Hilbert example)
  - `POST /api/stats/preserve-herb/:id` (`controllers/herbItemController.ts`, `preserveHerbSchema` in `validations/herbSearchValidation.ts`)
  - `consumeItemController` refuses a spoiled plant; the herb reference (`GET /api/stats/herb-reference`) includes the tables
- Client:
  - `client/src/features/herbs/shelfLifeRules.ts` (+ test): `expiryDay`, `isSpoiled`, `durationLabel`, `herbShelf` (the status line)
  - `PreserveHerbDialog.tsx` (check or part/method), status line and buttons in the supplies list of `HeroAlchemy.tsx`
- Switches: `shelfLife` and `shelfLifeParts` (book rules per party or solo hero).
