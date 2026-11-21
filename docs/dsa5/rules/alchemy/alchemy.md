# Alchimie: Elixiere, Gifte, Heilkräuter verwenden

source: DSA5 Regelwerk, S. 270–274, 342, 344–346, 379–380

## Summary

- Alchimica are bought per QS: price = rate × QS (S. 379). Ingredient level caps the QS when brewing (S. 271); brewing itself is not implemented.
- Elixirs take effect at the start of the next KR unless stated otherwise (S. 272).
- Gestapelte Alchimieeffekte: if several supernatural effects do the same thing, only the strongest applies (S. 272).
- Herbs: one application per person; effects do not stack within one regeneration phase unless the herb says so (S. 344). Processed herbs keep three months (S. 345).
- Weapon poisons are applied before a fight, act only on the first undefended hit that gets through RS, and stay on the weapon for at most 5 attacks; only bladed or piercing weapons (S. 342).

## Values / formulas

| Elixir | Rate / QS | Labor | Brauschwierigkeit | Effect per QS 1–6 |
| --- | --- | --- | --- | --- |
| Antidot | 65 S. | Hexenküche | −1 | neutralizes poisons up to Stufe = QS |
| Heiltrank | 60 S. | archaisches Labor | 0 | 1W3 / 1W6 / 1W6+2 / +4 / +6 / +8 LeP |
| Liebestrunk | 80 S. | Hexenküche | −1 | cumulative effects (1 h at QS 3, a day at QS 5, a week at QS 6) |
| Unsichtbarkeitselixier | 80 S. | Hexenküche | −2 | 1/3/5/10/15/20 min; transition 10 min … 15 s |
| Verwandlungselixier | 80 S. | Hexenküche | −2 | 1/2/5/10/15/20 min; 1 level Schmerz while transforming |
| Waffenbalsam | 110 S. | Alchimistenlabor | −2 | magical 5 min … 1 week; +1 TP from QS 3; unbreakable from QS 5 |
| Willenstrunk | 100 S. | Alchimistenlabor | −2 | SK +1/2/2/2/3/3 for 5/10/15/20/30/45 min |
| Zaubertrank | 100 S. | Alchimistenlabor | −2 | 1W3 / 1W6 / 1W6+2 / +4 / +6 / +8 AsP |

| Herb | Effect in the app |
| --- | --- |
| Wirselkraut | +1 LeP per application at the next LeP regeneration, max +3 per phase (S. 346) |
| Gulmond | ignore the penalties of 2 levels of Betäubung for 12 h; Betäubung IV still incapacitates (S. 345) |
| Alraune, Axordabaum, Donf, Egelschreck, Lulanie | description only (alchemy ingredient / disease cures; no disease system) |

## App behavior

- "Use" on a consumable opens a dialog (server `PUT /api/stats/consume-item/:id`, rules in `server/src/utils/consumables.ts`):
  - Heiltrank / Zaubertrank: the dice are rolled with the 3D dice, LeP/AsP are capped at the maximum, Schmerz is recomputed.
  - Antidot: removes `Vergiftet` only after the player confirms the poison level ≤ QS.
  - Timed elixirs and Gulmond create an active effect (`ActiveEffect` model). A weaker effect of the same kind is refused unless confirmed (then the item is used without a new effect); a stronger one replaces it.
  - Waffenbalsam and poisons are applied to a chosen weapon from the inventory.
- Active effects show above the hero tabs. There is no in-game clock, so the book duration is shown and the player ends the effect. Ending an Unsichtbarkeitselixier removes the `Unsichtbar` status it set.
- Applied automatically while active: SK bonus (sheet), Gulmond offset against Betäubung in check modifiers, Schmerz +1 during a Verwandlung until "Transformation finished", Waffenbalsam TP and "magical weapon" in the fight panel.
- Wirselkraut and a paid Medicus treatment are used up by the next LeP regeneration.

## Alchemy tab (Nov 2026, user decision: always shown)

- Supplies: carried elixirs, herbs and poisons with **Use** (same `ConsumeDialog`).
- Laboratory: best lab in the inventory (Archaisches Labor < Hexenküche < Alchemistenlabor; the book also writes "Alchimistenlabor").
- Recipes: the eight core elixirs; a recipe is the matching `Berufsgeheimnis (<Elixier>)` (S. 215, 270), with a learn button.
- **Brew** (S. 271): ingredient level 1–6 (level × rate from the purse; caps the QS), lab one level lower −3 / two lower impossible / higher +1 / +2, AsP 4/8 with an Alraune (+1/+2, Zauberer), Brauschwierigkeit; Alchimie Probe. Server `PUT brew-elixir` (`utils/alchemy.ts`, `controllers/alchemyController.ts`) checks recipe, talent, lab, Alraune, AsP and money, removes the Alraune, charges the ingredients and adds `<Elixier> (QS n)` with QS = min(QS, level). Failure: ingredients lost + failure table (1W20, +5 on a Patzer, S. 271–272).
- **Analyse** (S. 272): Alchimie Probe with half the Brauschwierigkeit (app decision: rounded toward the harder side), lab −2/±0/+1, recipe known +1; QS 2+ also reveals the quality. Nothing is consumed.

## Open questions

- One brew per day and the GM's secret roll are notes only.
- Poison checks on the victim and disease progression are not simulated; poisons on a weapon are a reminder chip.

## Code

- `server/src/utils/consumables.ts` (+ test), `server/src/models/activeEffect.model.ts`, `server/src/controllers/activeEffectController.ts`
- `client/src/features/heroes/ConsumeDialog.tsx`, `ActiveEffectsStrip.tsx`, `activeEffectsApi.ts`
- Catalog data: `client/src/utils/aventurian_store.ts` (`alchemy`, `poison`, `herb`)
