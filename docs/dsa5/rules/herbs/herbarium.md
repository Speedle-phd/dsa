# Archiv der Kräuter: Herbarium, store and plant use (Phase 1)

source: Archiv der Kräuter (AdK), S. 9–10 (page layout), S. 11–142 (plants), S. 266–270 (effect types)

## Summary

- 132 plants, one page each (some run onto a second page). Each page gives:
  - effect types (Heilung, Gift, physisch, psychisch, Nützlich, Wehrhaft, Übernatürlich; overview S. 266–270)
  - landscape type and regions with frequency
  - Such- and Bestimmungsschwierigkeit (modifiers on Pflanzenkunde)
  - applications per QS 1–6
  - raw effect by Berührung / Einatmung / Verzehr, and processed (→ recipes)
  - price per application raw / processed; recipes with pages; shelf life
  - "Was weiß mein Held …?" per QS 1, 2, 3+ of Pflanzenkunde
- A few plants have no number where others do; the book's words are kept as a note:
  - Malomis: not found in the wild
  - Nemezijn: cannot be found or used
  - Morgendornstrauch: no applications
  - untraded plants: no price

## Decisions

- User decisions (Nov 2026):
  - short de/en summaries in own words with `AdK S. …`, no book prose
  - the book is switched on per party by the GM (or by the player of a hero without a party)
- App choices, not user decisions:
  - **Data**:
    - Facts are generated from the PDF by `scripts/adk_herbs.py` into `herbData.ts`; hand corrections go in `herbCatalog.ts`.
    - Summaries for all 132 plants (six batches, Nov 2026) are in `herbSummaries.ts`. A test requires a summary with three knowledge levels for every plant and a text for every raw route the page gives.
  - **Shelf life** is not taken over yet (the page layout varies too much); Phase 3 adds it with the plant parts (AdK S. 284–290).
  - **Landscapes for filters**:
    - From the book's landscape text: "alle"/"überall" = all eight types above ground, minus those named after "außer".
    - "unterirdisch"/"Höhlen" = Höhlen.
    - Three plants (lakes, rivers, gardens) have no type.
  - **Store**:
    - With the book on, the AdK plants replace the core-rule herbs category (same plants, more data).
    - Two forms per plant: roh / verarbeitet, at the book's two prices. Untraded plants are not sold.
    - The inventory entry keeps the plain name plus `herb { form, obtainedDay }`, with the in-game day of purchase.
  - **Using a plant**:
    - Wirselkraut and Gulmond keep their core rules (Regelwerk S. 345–346).
    - Every other AdK plant is used up with its summary and "mit der Spielleitung abhandeln". The app applies no further effect yet.
  - **Pflanzenkunde**: after a successful check, the result offers a plant picker and shows its knowledge up to the QS reached (QS 3+ for 3 or more).

## Code

- Server:
  - `server/src/utils/herbs/`: `herbTypes.ts`, `herbData.ts` (generated), `herbCatalog.ts` (corrections, landscapes), `herbSummaries.ts` (+ test)
  - `GET /api/stats/herb-reference` (`bookController.ts`)
  - `consumables.ts`: AdK plants without a rule → `info` with `book: 'AdK'`
  - purchases accept `herb`
- Client:
  - `client/src/features/herbs/`: `herbApi.ts`, `herbStore.ts` (store items), `Herbarium.tsx` (Alchemy tab), `HerbKnowledge.tsx` (Pflanzenkunde result)
  - store: `pages/AdventurianStore.tsx`, `StorePurchaseDialog.tsx`
  - use: `ConsumeDialog.tsx`
- Generator: `scripts/adk_herbs.py` (`--digest a b file` prints the raw text of plants a–b for the next summary batch)
