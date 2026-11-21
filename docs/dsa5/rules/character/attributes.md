# Eigenschaften und Eigenschaftsprobe

source: DSA5 Regelwerk, S. 17–21, 39, 43

## Summary

- Every hero has 8 Eigenschaften: 4 geistige (MU, KL, IN, CH) and 4 körperliche (FF, GE, KO, KK) (S. 17).
- An Eigenschaftsprobe is 1W20 ≤ effective attribute value; it is used only when no talent fits (S. 18, 21).
- Modifiers raise/lower the value for that roll only → Effektiver Eigenschaftswert (EEW) (S. 19–20).
- 1 and 20 need a Bestätigungswurf to become Kritischer Erfolg / Patzer (S. 20).
- Rounding everywhere: round half up ("echt runden"), unless a rule says otherwise (S. 17).

## Values / formulas

| Abk. | Eigenschaft      | Gruppe     |
| ---- | ---------------- | ---------- |
| MU   | Mut              | geistig    |
| KL   | Klugheit         | geistig    |
| IN   | Intuition        | geistig    |
| CH   | Charisma         | geistig    |
| FF   | Fingerfertigkeit | körperlich |
| GE   | Gewandtheit      | körperlich |
| KO   | Konstitution     | körperlich |
| KK   | Körperkraft      | körperlich |

```
EEW = Eigenschaft + Erleichterung − Erschwernis
success = W20 <= EEW
```

Modifier guide (S. 19): +6 extrem leicht, +4 sehr leicht, +2 leicht, ±0 anspruchsvoll, −2 schwer, −4 sehr schwer, −6 extrem schwer.

Value ratings (S. 19): ≤7 extrem schlecht, 8–9 miserabel, 10–11 dürftig, 12–13 passabel, 14–15 fähig, 16–17 herausragend, ≥18 meisterhaft.

Critical results (S. 20):

| Roll | Bestätigungswurf (same modifiers) | Result            |
| ---- | --------------------------------- | ----------------- |
| 1    | ≤ EEW                             | Kritischer Erfolg |
| 1    | > EEW                             | normal success    |
| 20   | > EEW, or a 20                    | Patzer            |
| 20   | ≤ EEW                             | normal failure    |

Creation (S. 43): all attributes start at 8 (= 64 points). Cost per point: up to 14 → 15 AP; 15 → 30; 16 → 45; 17 → 60; 18 → 75; 19 → 90 (Steigerungsfaktor E, see [experience.md](experience.md)). Max value and max sum depend on the Erfahrungsgrad.

## Edge cases

- EEW ≤ 0: no roll allowed, the action fails automatically (S. 20).
- EEW ≥ 20: a rolled 20 is still a possible Patzer; a 20 on the Patzer confirmation is always a Patzer (S. 21).
- Schips cannot be used on Bestätigungswürfe (S. 20).
- After creation, attributes have no maximum (S. 39). Optional rule: cap = Erfahrungsgrad max + 2 (S. 39).
- Species modify the max value for some attributes, not the attribute itself (S. 40, 44).
- Optional rule "Kein Bestätigungswurf": 1/20 are critical immediately (S. 20).

## Implemented Eigenschaftsprobe

- Overview → each attribute tile has a W20 button (`client/src/features/heroes/AttributeCheckDialog.tsx`): difficulty presets from the Eigenschaftsmodifikatoren (S. 19: ±2/4/6; `attributeDifficultyPresets` in `skillCheck.ts`, not the talent presets of S. 24) and custom value, other modifiers from `useCheckState(stats, 'attribute', key)` (conditions, Paralyse question, owned effects), success chance, one W20 with automatic Bestätigungswurf on 1/20 (shared `rollD20` in `d20.ts`).
- Schips: Neuer Wurf (rerolls the check die, a new confirmation follows if needed; Schips are never spent on the confirmation itself, S. 20) and, with the SF Eigenschaft verbessern, +2 (S. 222). See [fate-points.md](fate-points.md).

## Code

- `server/src/utils/attributeLevelUp.ts` — `eLevelUpCosts` (attribute costs)
