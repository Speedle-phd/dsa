# Fertigkeitsprobe, Qualitätsstufen und Probenarten

source: DSA5 Regelwerk, S. 21–28

## Summary

- Fertigkeiten = Talente, Zauber/Rituale and Liturgien/Zeremonien. Each has a FW and a Probe with 3 Eigenschaften (S. 21).
- Roll 3W20, one die per Eigenschaft. Points the roll is over the Eigenschaft are paid from the FW (S. 21–22).
- Remaining FW points = Fertigkeitspunkte (FP), which map to Qualitätsstufen (QS) (S. 23).
- Modifiers apply to all 3 Eigenschaften (S. 23).
- No Bestätigungswurf on Fertigkeitsproben (S. 24).

## Values / formulas

```
eff_i = Eigenschaft_i + mod          (i = 1..3; if any eff_i <= 0 → no check allowed)
over_i = max(0, W20_i − eff_i)
FP = FW − Σ over_i                    (FP < 0 → failure)
success with FP = 0 counts as FP 1 → QS 1
```

| FP    | QS  |
| ----- | --- |
| 0–3   | 1   |
| 4–6   | 2   |
| 7–9   | 3   |
| 10–12 | 4   |
| 13–15 | 5   |
| 16+   | 6   |

Critical results (S. 24):

| Dice      | Result                                |
| --------- | ------------------------------------- |
| two 1s    | Kritischer Erfolg (automatic success) |
| three 1s  | automatic success, spectacular        |
| two 20s   | Patzer (automatic failure)            |
| three 20s | Patzer, disastrous                    |

Modifier guide (S. 24): +5 extrem leicht, +3 sehr leicht, +1 leicht, ±0 anspruchsvoll, −1 schwierig, −3 sehr schwierig, −5 extrem schwierig.

Probenarten (S. 25–28):

| Art             | Rule                                                                                                                    | Wiederholung                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Erfolgsprobe    | standard; success/failure, FP → QS                                                                                      | allowed at the Spielleiter's discretion, each retry −1 (cumulative, lasts 24 h) |
| Vergleichsprobe | higher QS wins, result = net QS; tie → draw or the passive side wins; if both fail, the passive side wins with QS 1     | not allowed                                                                     |
| Sammelprobe     | collect QS over time intervals: 6 QS = Teilerfolg, 10 QS = done; allowed attempts 5 schwer / 7 durchschnitt / 10 leicht | a failure adds −1 to later attempts (cumulative)                                |
| Gruppenprobe    | Vergleichs- or Sammelprobe only; QS of all members are added                                                            | as the base type                                                                |

Sammelprobe specials (S. 27): Kritischer Erfolg doubles that roll's QS and clears the stacked penalties; Patzer resets the collected QS to 0 and fails the whole check.
Vergleichsprobe specials (S. 26): a Kritischer Erfolg wins automatically (both crit → draw); a Patzer loses (both Patzer → draw).

Notation: `Talent (Anwendungsgebiet)`, e.g. Körperbeherrschung (Springen) (S. 22, 25).

## Edge cases

- FW 0 is a valid FW, so the check is allowed (S. 23, 25).
- Inactive skills (not activated) cannot be rolled (S. 25).
- Rolling well below an Eigenschaft gives no bonus FP (S. 22).
- Optional rule "Alternative Eigenschaften": an assessment-only check uses KL/IN/IN (S. 23).
- Schips: Neuer Wurf (not on a Patzer) or Qualität verbessern (+1 QS on success), max 1 per check (S. 29–30).

## Implemented modifier display

- Talents have a W20 button that opens a Probe dialog (`TalentProbeDialog.tsx` → shared `ProbeDialog.tsx`, rules in `skillCheck.ts`; spells reuse it, see `magic/spells-and-rituals.md`). It uses the same effective targets/FW as the table, plus a per-roll difficulty (S. 24 presets or a custom value), shows the exact success chance, rolls three colour-coded W20 (red/blue/green = 1st/2nd/3rd Eigenschaft, S. 22) and evaluates FP, QS, Doppel-1/Dreifach-1 and Doppel-20/Dreifach-20.
- A Kritischer Erfolg takes its QS from the remaining FP, at least QS 1; extra effects are left to the GM (S. 24).
- One Schip per Probe (S. 29): Neuer Wurf rerolls the chosen dice and is binding; it is not allowed on a Patzer. Qualität verbessern gives +1 QS on a success (S. 30). The Schip is deducted on the server (`PUT /api/stats/spend-fate-point/:id`).
- After a failed attempt, the dialog offers the retry penalty (−1 per failed attempt, S. 25–26); it is never applied automatically.
- Attribute, talent, AT/FK, PA and AW controls show the base value and, when changed, the effective value in a green (easier) or red (harder) box. Net-zero changes have no box.
- Talent target values sit beside the talent name; the Probe column retains the attribute abbreviations. Target bonuses change all three targets (S. 23), not FW. Genuine FW effects, such as Fertigkeitsspezialisierung +2 FW, appear beside FW (S. 216).
- Owned rule effects come from the hero's recorded advantages, disadvantages and abilities. Unconditional numeric effects are automatic. Check conditional effects only when the listed application, environment or maneuver applies, then press Apply.
- Selections affect only the corresponding hero/check and are shared across tabs. Uncheck or reset when circumstances change; reloading clears selections. Permanent values and AP are unchanged.
- Reroll reminders and narrative effects do not create numeric boxes. Critical consequences and liturgies remain manual.

## Implemented talent rules from the Talente chapter (S. 184–222, Nov 2026)

- **Routineprobe** (S. 184–185): `routineCheck` / `routineMinimum` in `skillCheck.ts`. All probe attributes (base values) 13+, FW ≥ the minimum for the full modifier (+3→1, +2→4, +1→7, ±0→10, −1→13, −2→16, −3→19; harder: never). FP = ⌈FW/2⌉ (incl. Spezialisierung). "Take routine" in the talent Probe (no dice, Schips or retry; the GM rules out time pressure); a Sammelprobe can record it. The Talents tab "Routine" column shows the routine FP and the hardest allowed modifier, or "—" with the reason. Optional "Verrechnung von Eigenschaften" (+3 FW minimum per missing attribute point) is a per-browser toggle (`talentOptions.ts`).
- **Talent-specific Kritischer Erfolg** (S. 189–212): `talentCriticalRules` in `talentCatalog.ts`. "FP = doppelter FW" (Klettern, Kraftakt, Schwimmen, Singen, Sinnesschärfe, Tanzen, Taschendiebstahl, Verbergen, Fesseln, Fischen & Angeln, Mechanik) and "FP ×2, mindestens 5" (Holz-, Leder-, Metall-, Stein-, Stoffbearbeitung). Server mirror `talentsWithOwnCritical` (`server/src/utils/talentCatalog.ts`).
- **Book data per talent** (`talentDetails.ts`, generated from the rulebook text and checked by hand): applications, new applications with the unlocking advantage/SF, Einsatzmöglichkeiten, tools, the failure/critical/botch texts (German), the "Talentanwendung" modifier rows and Sammelprobe rows, food rations.
- Talent Probe setup (`TalentProbeDialog.tsx`): application picker (auto-selects the matching Fertigkeitsspezialisierung; an unlocked new application is blocked unless the GM allows it at −3, S. 186), book examples as difficulty presets, tools proper / poor (−1…−5) / none (no check, S. 184) with Meister der Improvisation offsetting up to 2 automatically (S. 218). The result shows the book text for failure/critical/botch.
- Optional **Talentgruppenprobe** (S. 184): per-browser toggle; the Talents tab and Probe then use the group probe.
- Sammelprobe form: the talent's book examples fill name, interval and attempts ("beliebig viele" → 50).

### Decisions (Talente chapter)

- User decision, Nov 2026: a talent's own critical rule **replaces** the generic one; the Sammelprobe counts that QS once (no ×2) and still clears penalties. Talents without a rule keep the S. 27 doubling.
- App choice: the routine column uses the stored FW and no modifiers; the dialog uses the effective FW and the full modifier.
- App choice: "no tools" blocks the check; the GM can pick "poor tools" instead when they allow improvising.
- The application list for Fertigkeitsspezialisierung is a suggestion list (datalist); the book lists are not closed (S. 216).

## Implemented Vergleichs-, Sammel- und Gruppenprobe

- **Vergleichsprobe** (S. 25–26): `ProbeDialog` has a check type "Erfolgsprobe / Vergleichsprobe". Choose active / passive / no passive side, roll, then enter the opponent's result (failed, QS, critical, Patzer). `evaluateOpposed` in `skillCheck.ts` gives the winner and net QS. No retry is offered (S. 26). Gruppenvergleichsprobe: other members' QS are added (S. 27).
- **Sammelprobe** (S. 26–27): Talents tab → "Sammelproben". Each one has a name, a talent or owned spell, the GM's interval and the allowed attempts (presets 5/7/10). Rolling opens the normal talent/spell Probe with the failure penalty as a modifier; "Record attempt" stores the result on the server. Success adds QS, failure adds −1 to later attempts, critical doubles the QS and clears the penalty, Patzer resets to 0 and fails; 6 QS Teilerfolg, 10 QS done; out of attempts = failed. Gruppensammelprobe: "Add group member" records another member's result in the same pool (a member's Patzer resets it too).
- Rules: `server/src/utils/extendedCheck.ts` (+ tests). Stored in their own collection (`models/extendedCheck.model.ts`, by `statsId` + `userId`), endpoints `GET /api/stats/extended-checks/:id`, `PUT /api/stats/add-extended-check|extended-check-attempt|remove-extended-check/:id`. Deleted with the hero or account.

### Decisions (Probenarten)

- Sammelproben are saved per hero on the server. User decision, Nov 2026.
- Confirmed by the user, Nov 2026: a critical Sammelprobe doubles the QS as shown in the dialog (including a Schip "Qualität verbessern").
- App choice, not a user decision: a Vergleichsprobe won by a critical or lost by a Patzer shows no net QS (the book gives none).
- Not covered: Sammelproben with separate QS targets per skill (S. 26), optional "Gruppensammelproben mit verschiedenen Talenten" (FP/2, S. 27). Eigenschaftsproben have their own dialog (see [../character/attributes.md](../character/attributes.md)); all Schip uses are summarised in [../character/fate-points.md](../character/fate-points.md).
