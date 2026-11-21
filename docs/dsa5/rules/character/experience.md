# Erfahrungsgrade und Steigerungskosten

source: DSA5 Regelwerk, S. 25, 38–39, 45, 50

## Summary

- The Erfahrungsgrad (EG) sets the starting AP and the caps that apply during creation (S. 38–39).
- After play starts, only these caps remain: FW ≤ highest attribute of the Probe + 2; KtW ≤ Leiteigenschaft + 2; attributes have no cap (S. 39).
- Every skill has a Steigerungsfaktor A–D, attributes use E. Raise one step at a time and pay the cost of each target step (S. 50).
- Talente start active at FW 0. Zauber, Rituale, Liturgien and Zeremonien must be activated (bought to FW 0) (S. 25, 50).
- Kampftechniken start at KtW 6 (S. 50).

## Values / formulas

Erfahrungsgrade (S. 39):

| EG               | AP   | max Eigenschaft | max Fertigkeit | max Kampftechnik | max Eigenschaftssumme | max Zauber/Liturgien (davon Fremdzauber) |
| ---------------- | ---- | --------------- | -------------- | ---------------- | --------------------- | ---------------------------------------- |
| Unerfahren       | 900  | 12              | 10             | 8                | 95                    | 8 (0)                                    |
| Durchschnittlich | 1000 | 13              | 10             | 10               | 98                    | 10 (1)                                   |
| Erfahren         | 1100 | 14              | 10             | 12               | 100                   | 12 (2)                                   |
| Kompetent        | 1200 | 15              | 13             | 14               | 102                   | 14 (3)                                   |
| Meisterlich      | 1400 | 16              | 16             | 16               | 105                   | 16 (4)                                   |
| Brillant         | 1700 | 17              | 19             | 18               | 109                   | 18 (5)                                   |
| Legendär         | 2100 | 18              | 20             | 20               | 114                   | 20 (6)                                   |

Kostentabelle, AP to reach the target value (S. 50):

| Target value      | A   | B   | C   | D   | E   |
| ----------------- | --- | --- | --- | --- | --- |
| Aktivierung (→ 0) | 1   | 2   | 3   | 4   | –   |
| 1–12              | 1   | 2   | 3   | 4   | 15  |
| 13                | 2   | 4   | 6   | 8   | 15  |
| 14                | 3   | 6   | 9   | 12  | 15  |
| 15                | 4   | 8   | 12  | 16  | 30  |
| 16                | 5   | 10  | 15  | 20  | 45  |
| 17                | 6   | 12  | 18  | 24  | 60  |
| 18                | 7   | 14  | 21  | 28  | 75  |
| 19                | 8   | 16  | 24  | 32  | 90  |
| 20                | 9   | 18  | 27  | 36  | 105 |
| 21                | 10  | 20  | 30  | 40  | 120 |
| 22                | 11  | 22  | 33  | 44  | 135 |
| 23                | 12  | 24  | 36  | 48  | 150 |
| 24                | 13  | 26  | 39  | 52  | 165 |
| 25                | 14  | 28  | 42  | 56  | 180 |

```
cost(X → Y) = Σ table[v][SF] for v in X+1 .. Y
From 13 upward, A–D: table[v] = (v − 11) × base, where base A=1, B=2, C=3, D=4
```

What uses which column (S. 50): Eigenschaft E; Fertigkeit, Zauber/Ritual, Liturgie/Zeremonie A–D; Kampftechnik B–D; Zaubertrick and Segnung 1 AP each.

## Edge cases

- Shared advancement controls use a subtle plus for one-step increases. With Spend AP disabled, the edit control supports corrections within each value's existing minimum. Corrections leave AP unchanged and do not refund previous purchases. Server prerequisite/dependency checks still apply.

- Book example (S. 50): Gassenwissen (C) from 7 → 8 costs 3 AP.
- At the end of creation, at most 10 AP may be kept and the AP-Konto cannot be negative (S. 38, 56).
- The table ends at 25.

## Open questions

- AP rewards and learning methods after creation (Detailregeln "Erfahrung", "Lernmethoden", S. 337–352) are not covered yet.
- House rule: the app charges the activation cost when a talent goes from unset (`null`) to FW 0. By the book, talents are always active and free (S. 25, 50).

## Code

- `server/src/utils/levelExpMapping.ts` — AP per EG (matches S. 39)
- `server/src/utils/attributeLevelUp.ts` — A–E cost tables (rows 1–25 match S. 50), `activationCost`
- `client/src/features/heroes/ExperienceEditor.tsx` — add earned AP in the Experience section.
- `client/src/features/heroes/advancement.ts`, `AdvancementControls.tsx` — shared per-hero Spend AP mode and value controls.
- `server/src/utils/advancement.ts` — sum target-step costs; explicit no-AP corrections/free advancement.

## Display of disadvantage AP

- Stored: AP from disadvantages taken at creation are a credit (`experience.disadvantageCredit`, max 80) added to `experience.total`; undo and buy-off reverse it, and the Erfahrungsgrad is computed without it.
- Shown (Nov 2026, after user feedback): the overview counts them as negative costs within the EG budget, as the book does (S. 38, 46): "Erfahrung" = total − credit (EG AP + AP gained), "Ausgegebene Erfahrung" = spent − credit, plus a line "Nachteile bei der Erschaffung: −N AP (in den ausgegebenen AP verrechnet)". Available AP are unchanged. The "Erfahrung korrigieren" dialog shows the net spent value and adds the credit back on save.

## App editing policy

- Spend AP is a switch beside the DE/EN language control on the hero page, enabled by default and shared across Overview, Talents, Combat and Arcana for the current hero during the page session. Reload restores the safe paid default. Local dialogs expose the same switch; no-AP mode also displays a reminder above the sheet.
- With AP disabled, both plus buttons and direct value corrections preserve all AP counters. Corrections do not automatically refund AP or reverse disadvantage creation credits. Removing an entry in this mode discards its refund/credit tracking while keeping historical AP totals.
- Paid increases sum all target steps from the existing value (S. 50); paid decreases are rejected. Combat's Leiteigenschaft + 2 cap remains enforced for paid advancement (S. 39). Manual corrections retain the existing editor bounds.
- Languages, scripts, advantages and abilities use the same toggle to choose paid purchase or no-AP recording. Disadvantages retain their separate creation-credit policy: with AP accounting enabled, additions grant creation AP; during-play additions must be recorded with AP disabled (S. 39, 46, 162, 352).
- Global initial-values editors have been replaced by controls at the affected values. Resource bases/modifiers/current pools, fate points and explicit AP bookkeeping still need local manual editors. Resource editing charges only increases in additional purchases when AP is enabled; ordinary modifiers and current pools do not cost AP.
- Unrelated edits preserve starting AP and earned/spent counters rather than rebasing starting AP on the attained Erfahrungsgrad.
- The local Experience correction editor can explicitly change the starting Erfahrungsgrad. Its default preserves starting AP; the current Erfahrungsgrad is recalculated from total AP excluding creation credits.
