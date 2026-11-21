# Dienstleistungen

source: DSA5 Regelwerk, S. 339–340, 364, 381–382

## Summary

- Price list for services: Badehaus, Medicus, Schmiede, Schreibstube, Alchimist, travel per person and 100 Meilen (without food and lodging), the typical Mittelreich Gasthaus, and miscellaneous (S. 381–382).
- Gasthaus prices are given in the coins usually paid (Kreuzer, Heller, Silbertaler); the app keeps them in Kreuzer (1 S = 10 H = 100 K, S. 364).

## App behavior

- Page `/services` (button next to Store), tabs Medicus (+ Badehaus, Alchimist), Schmiede, Gasthaus, Weitere (Schreibstube, Reise, Sonstiges).
- The server owns the price list (`GET /api/stats/service-reference`) and charges a whole bill (`PUT /api/stats/purchase-service/:id`).
- Medicus Behandlung (10 S.): the Medicus rolls Heilkunde Wunden (GM); the entered QS is added to the next LeP regeneration (S. 340) and then used up.
- Schmiede: Pferd beschlagen per hoof (4 by default). Damaged weapons can be repaired through the existing repair dialog; the core rules give no repair price, so the smith names it.
- Gasthaus: menu board with a running bill (Zeche). After paying for a bed or room, "Rest here" opens the regeneration dialog. App choice: Einzelzimmer, Doppelzimmer and Suite preset "Gute Unterkunft" (S. 339); the player can change it.

## Open questions

- Diagnose, Amputation, Chirurgischer Eingriff, Alchimistische Analyse and the rest are paid only; their checks and consequences are resolved by the GM.

## Code

- `server/src/utils/serviceCatalog.ts` (+ test), `server/src/controllers/serviceController.ts`
- `client/src/pages/Services.tsx`, `client/src/features/services/`
