# Spezies

source: DSA5 Regelwerk, S. 40, 87–94

## Summary

- Four species in the core rules: Mensch, Elf, Halbelf, Zwerg. The AP value includes the automatic advantages and the base values (S. 88).
- Species modifiers change only the **maximum** of an attribute, never its value ("bringt keinen zusätzlichen Eigenschaftspunkt ein", S. 88).
- Automatic advantages count toward the 80 AP limit for advantages (Elf: 30 AP, S. 91).
- "Dringend empfohlen" entries should be chosen, or the player agrees with the GM why not (S. 91, 94).

## Values / formulas

| Spezies | AP | LE | SK | ZK | GS | Maximum changes | Automatic | Usual cultures | Page |
| ------- | -- | -- | -- | -- | -- | --------------- | --------- | -------------- | ---- |
| Mensch  | 0  | 5  | −5 | −5 | 8  | +1 on one attribute of choice | – | all 19 human cultures (by people, S. 89) | 89 |
| Elf     | 18 | 2  | −4 | −6 | 8  | IN +1, GE +1; KL **or** KK −2 | Zauberer, Zweistimmiger Gesang (30 AP) | Auelfen, Firnelfen, Waldelfen | 91 |
| Halbelf | 0  | 5  | −4 | −6 | 8  | +1 on one attribute of choice | – | Andergast, Auelfen, Bornland, Firnelfen, Horasreich, Mittelreich, Nivesen, Nordaventurien, Nostria, Svellttal, Thorwal, Waldelfen | 92 |
| Zwerg   | 61 | 8  | −4 | −4 | 6  | KO +1, KK +1; CH **or** GE −2 | – | Ambosszwerge, Brillantzwerge, Erzzwerge, Hügelzwerge | 93 |

Strongly recommended: Elf — Altersresistenz, Dunkelsicht I, Nichtschläfer, Sensibler Geruchssinn, Unfähig (Zechen) (S. 91); Zwerg — Dunkelsicht I, Immunität gegen Tulmadron, Unfähig (Schwimmen) (S. 94).

Human peoples and their usual cultures (S. 89): Mittelländer, Nivesen, Norbarden, Thorwaler, Tulamiden, Waldmenschen, Utulus. Together they cover all 19 human cultures, so the app does not filter human cultures by people.

## Edge cases

- The human list for Waldmenschen ends with a dangling comma (S. 89); the union over all peoples is unaffected.
- Typical/untypical advantages and looks tables (hair, eyes, height, weight) are not encoded yet.

## Code

- `server/src/utils/creation/speciesCatalog.ts` (data), used by `creationLedger.ts`.
