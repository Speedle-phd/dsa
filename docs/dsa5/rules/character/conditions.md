# Zustände, Status und Schicksalspunkte

source: DSA5 Regelwerk, S. 29–36, 56

## Summary

- Zustände have levels I–IV. Each level gives a penalty; level IV usually means handlungsunfähig (S. 31–34).
- A Status is either on or off, with no levels (S. 34).
- Penalties from all Zustände add up, but the total is capped at 5 (S. 32).
- 8 or more Zustand levels in total → Status Handlungsunfähig (S. 32).
- Schips (Schicksalspunkte): start and maximum 3, changed by Glück/Pech (S. 29, 39).

## Values / formulas

```
totalPenalty = min(5, sum of all Zustand penalties)
handlungsunfähig = Belastung/Betäubung/Furcht/Verwirrung at IV || sum(levels) >= 8
Schmerz IV = handlungsunfähig unless Selbstbeherrschung preserves action capability
Paralyse IV = movement/speech unavailable, not all motionless activities
Entrückung IV = deity-dependent modifiers, not itself incapacitation
```

| Zustand    | per level                                                             | IV                                        | Decay (unless stated otherwise)           |
| ---------- | --------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------- |
| Belastung  | talent checks with BE, AT, Verteidigung, INI, GS: −level              | handlungsunfähig except dropping the load | when the load is removed                  |
| Betäubung  | all checks −level                                                     | handlungsunfähig                          | 1 level per 3 h rest                      |
| Entrückung | checks not pleasing to the god −1/−2/−3/−4; pleasing ones +0/+1/+2/+3 | tool of the god                           | 1 level per hour                          |
| Furcht     | all checks −level                                                     | katatonisch, handlungsunfähig             | 1 level / 5 min after the trigger is gone |
| Paralyse   | movement/speech checks −level; GS 75 %/50 %/25 %                      | bewegungsunfähig                          | 1 level / 30 min                          |
| Schmerz    | all checks −level, GS −level                                          | handlungsunfähig, otherwise −4            | 1 level / 4 h                             |
| Verwirrung | all checks −level; at III no spells, liturgies or Wissenstalente      | handlungsunfähig                          | 1 level / hour                            |

Schmerz from LeP loss (S. 34, 56): +1 level each when LeP ≤ ¾, ≤ ½, ≤ ¼ of max LeP, and +1 more when LeP ≤ 5. The level disappears when LeP rise back above the threshold.
Example (S. 34): max 28 LeP, 21 LeP → 1 level; ≤ 14 LeP → 2 levels.

Belastung from armor (S. 32):

| Rüstung                  | RS  | BE  | Extra         |
| ------------------------ | --- | --- | ------------- |
| Normale Kleidung / nackt | 0   | 0   | –             |
| Schwere Kleidung         | 1   | 0   | −1 GS, −1 INI |
| Stoffrüstung             | 2   | 1   | –             |
| Lederrüstung             | 3   | 1   | −1 GS, −1 INI |
| Kettenrüstung            | 4   | 2   | –             |
| Schuppenrüstung          | 5   | 2   | −1 GS, −1 INI |
| Plattenrüstung           | 6   | 3   | –             |

Armor weight is ignored when calculating Belastung from carried load (S. 32).

Status (S. 34–36): Bewegungsunfähig, Bewusstlos (+ Handlungsunfähig), Blind, Blutrausch, Brennend, Eingeengt, Fixiert (GS 0, AW −4), Handlungsunfähig (GS 0, no actions/defense), Krank, Liegend (GS 1, Verteidigung −2, AT −4), Stumm, Taub, Überrascht, Unsichtbar, Vergiftet.

| Status | Rule (S.) | App |
| --- | --- | --- |
| Bewegungsunfähig | no body movement; GS 0 (34) | blocks AT/FK/defense; for talents/attributes a selectable block; GS 0 |
| Bewusstlos | + Handlungsunfähig (34) | stored together with Handlungsunfähig |
| Blind | after an opposed Sinnesschärfe/Verbergen check: melee AT halved, FK and defense vs melee only on a 1, no defense vs ranged (35) | AT halved (rounded up), FK/defense target 1; the opposed check is the GM's |
| Blutrausch | AT +4, +2 TP, no defense/FK, only Körpertalente + Einschüchtern, Kraftakt +2, ignores Schmerz; then 2 Betäubung (35) | all automatic; removing the status adds Betäubung +2 (max IV); 2W20 duration not tracked |
| Brennend | Körperbeherrschung ±0/−1/−2 to put out (35) | reminder only (fire damage S. 340 not covered) |
| Eingeengt | AT/PA by reach/shield size; talents up to −2 (35–36) | fight panel applies the table (shield sizes S. 367); talents left to the GM |
| Fixiert | GS 0, AW −4 (36) | automatic |
| Handlungsunfähig | GS 0, no actions or defenses (36) | blocks every check |
| Krank / Vergiftet | no normal regeneration (36) | blocks LeP regeneration on the server; Krank 1W3 LeP/day is a reminder |
| Liegend | GS 1, defense −2, attacks −4 (36) | automatic |
| Stumm, Unsichtbar | spell problems / affects attackers (36) | reminders only |
| Taub | no hearing-only Sinnesschärfe; Hinterhalte entdecken −3 (36) | −3 as a selectable effect on Sinnesschärfe |
| Überrascht | one action against the hero without defense, then the regular KR (36) | fight panel blocks defenses; cleared with "Next round"/"End fight"; SF Wachsamkeit (1 Schip) clears it (S. 222) |

Implementation: `server/src/utils/statusRules.ts` (catalog, `statusRollEffects` as automatic/conditional roll effects, `statusSpeed`, `endBloodRage`), stored as `stats.statuses`, edited in the Combat tab ("Status" panel, texts in `conditionInfo.ts` → `statusInfo`). Target rules (halve / only a 1) via `RollEffect.targetRule` → `useCheckState().targetRule`.

### Decisions (status)

- Statuses are stored on the server per hero. User decision, Nov 2026.
- Confirmed by the user, Nov 2026: Liegend "Angriffe −4" applies to AT and FK.
- Confirmed by the user, Nov 2026: Blind halving rounds up, like the critical-attack halving (S. 231).
- Confirmed by the user, Nov 2026: removing Blutrausch adds 2 Betäubung automatically (the UI says so first).
- Confirmed by the user, Nov 2026: Überrascht is cleared at the next KR or when the fight ends.
- Confirmed by the user, Nov 2026: Zustand ignorieren (Schip) ignores Zustände only, not statuses (S. 30 names Zustände).
- Confirmed by the user, Nov 2026: Blutrausch ignores Schmerz penalties (checks and GS) but Schmerz IV still blocks; the 8-level count is unchanged.

Eingeengt modifiers, AT/PA (S. 36): short weapons ±0/±0; medium −4/−4; long −8/−8; small shields −2/−2; medium shields −4/−3; large shields −6/−4.

Schips: uses, 1 Schip each (S. 29–30):

| Use                      | Effect                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------- |
| Erster                   | act first this Kampfrunde (announce at the start of the round)                      |
| Neuer Wurf               | reroll 1–3 dice of one check; not allowed on a Patzer; the second result is binding |
| Qualität verbessern      | +1 QS on a successful Fertigkeitsprobe                                              |
| Schadenswurf wiederholen | reroll 1 W6 of your own damage roll                                                 |
| Verteidigung             | +4 on all defenses until the end of the round                                       |
| Zustand ignorieren       | ignore all Zustände for 1 Kampfrunde                                                |

Max 1 Schip per check (S. 29). Regaining (S. 31): start of a session 1; end of an adventure chapter ≥1; end of an adventure all; Heldentat 1. Never above the maximum.

Full Schip rules, the "… verbessern" SFs and what the app implements: [fate-points.md](fate-points.md). Zustand ignorieren is applied centrally: while it is active for the current KR, `useCheckState` drops all condition modifiers and condition blocks (fight panel, talent, spell and attribute checks).

Berauscht, Trance and Überanstrengung appear only as fields on the character sheet (S. 411); the core rulebook defines no per-level effects for them (checked S. 31–36; "Trance" on S. 284 is spell flavour text). The app shows them without automatic modifiers and labels them as sheet-only in their tooltip.

Tooltips: `client/src/features/heroes/conditionInfo.ts` holds the per-level effects shown in the combat tab's Zustände table.

## Edge cases

- Zustände/Status from a spell or liturgy end immediately when its effect ends (S. 32).
- Blutrausch: AT +4, TP +2, no defense, ignores Schmerz; afterwards 2 levels of Betäubung (S. 35).
- SF Belastungsgewöhnung shifts the worn armor up two rows per level in the armor table, including BE and extra GS/INI deductions; it does not reduce separately recorded non-armor load (S. 246).
- Entrückung IV is not itself Handlungsunfähig; it retains the deity-dependent +3/−4 talent/spell effects. Paralyse IV blocks movement/speech but allows motionless activities (S. 33–34).

## Open questions

- Belastung from carried weight (S. 348): a hero carries KK × 2 Stein without trouble and gets one level of Belastung for every 4 **full** Stein above that, at most IV. `calcBurden` uses `floor(excess / 4)` (fixed Nov 2026; it rounded up before) and `syncResources` recomputes `burden` on every load and save, so stored values are corrected. Test: `baseAttributes.test.ts`.

## Code

- `server/src/utils/baseAttributes.ts` — `calcPain` (matches S. 34), `calcBurden`
