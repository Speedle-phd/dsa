# Vor- und Nachteile (Übersicht)

source: DSA5 Regelwerk, S. 39, 46–49 (details S. 161–182)

## Summary

- At character creation, Vorteile cost AP and Nachteile give AP. Each side is capped at 80 AP, independent of EG (S. 39, 46).
- Many Vor-/Nachteile have levels (I–III, I–VII …); their cost is per level.
- (\*) = only allowed if Spezies, Kultur or Profession lists it as automatic or recommended.
- Descriptions and effects are on S. 161–182 (not summarized here).

## During-play entry controls (S. 162, 352)

- Later advantage acquisition requires GM approval and costs the printed AP. Some entries, such as Zauberer and Reich, are creation-only.
- Newly recorded disadvantages grant no AP during play. Buying off a disadvantage requires GM approval and costs its printed AP value; the UI buys off the selected highest level together with its lower recorded levels.
- Manual/existing entries do not charge or grant AP and do not enforce acquisition prerequisites.
- Disadvantages also offer an explicit character-creation mode: validate prerequisites, grant the printed AP for newly selected levels, and enforce the 80 AP cap (S. 39, 46). AP are tracked separately from adventure awards. Existing records are not credited retroactively.
- Prinzipientreue and Verpflichtungen grant AP only once for their highest level, even with multiple subjects (S. 175, 179).
- Undoing a credited disadvantage withdraws its exact tracked credit; if those AP have already been spent, undo purchases first. Paid buy-off charges the printed cost without also withdrawing the original credit.
- Disadvantages use the catalog rather than arbitrary custom names. Legacy short bad-trait names, such as Goldgier, resolve to `Schlechte Eigenschaft (Goldgier)` (S. 177). Unknown legacy entries can still be removed without a fabricated refund; resolve them before requesting creation credits.
- Mistaken purchases can be undone. Refund only the exact AP tracked by this app, once; legacy/custom entries have no automatic refund.
- Known prerequisites and purchased level dependencies block removal. Bulk list editors cannot remove tracked purchases.
- The catalog provides concise German/English effect reminders with printed page references. Server-derived roll effects are wired into the shared check display: unconditional numeric bonuses apply automatically; application/environment/GM-dependent effects require selection in the temporary roll context. Removing an entry removes its available effects.
- Gutaussehend grants +1 per level only to Betören (Anbändeln/Liebeskünste), Überreden (Aufschwatzen/Herausreden/Manipulieren/Schmeicheln), and Handel (Feilschen), not the whole talent (S. 165). Hässlich has a narrower Überreden scope (S. 172). Highest owned trait level counts once.
- Zäher Hund reduces pain penalties by one level but does not prevent incapacitation at Schmerz IV (S. 169). Zerbrechlich increases pain effects and reaches incapacitation at III (S. 179); neither changes the stored wound-derived pain level.
- Rerolls are dice actions, not target modifiers (user decision, Nov 2026): **Begabung** (S. 164) offers "reroll one die" in the talent Probe, the better result counts, not after Doppel-/Dreifach-20, Schips still usable; **Unfähig** (S. 178) holds the result until the best die is rolled again, the second result is binding; **Waffenbegabung** (S. 169) offers one repeat of the Bestätigungswurf after a crit/botch. Immunities and narrative permissions stay reminders.
- Selected effects update the effective target/FW boxes without rolling dice; see [skill checks](../skills/skill-checks.md). Dice rolls, special rerolls and critical consequences remain manual.

- Free-text subjects offer the book's examples as clickable chips below the text field (`server/src/utils/entrySuggestions.ts`): Angst vor (S. 170; Feuer from the archetype Irinja), Prinzipientreue and Verpflichtungen with the level the book gives (S. 175, 179; picking one sets that level), Schlechte Angewohnheit, Stigma, Körperliche Auffälligkeit, Vorurteile/Weltfremd, Magische Einstimmung/Einschränkung, Artefaktgebunden and the church aspects for Aspektkenntnis. The lists are not closed; any other subject can be typed. Used on the hero page and in creation (`DetailInput` + `SuggestionChips`).

## Values / formulas

Vorteile (S. 47–48):

| Vorteil                             | Voraussetzung (short)                                  | AP                                               |
| ----------------------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| Adel I–III                          | culture has a matching nobility                        | 5/level                                          |
| Altersresistenz (\*)                | –                                                      | 5                                                |
| Angenehmer Geruch                   | –                                                      | 6                                                |
| Begabung                            | not Unfähig; max 3                                     | A/B/C/D: 6/12/18/24                              |
| Beidhändig                          | –                                                      | 15                                               |
| Dunkelsicht I–II (\*)               | not Nachtblind                                         | 10/level                                         |
| Eisenaffine Aura                    | Zauberer                                               | 15                                               |
| Entfernungssinn                     | not Blind/Eingeschr. Sinn (Sicht)/Farbenblind/Einäugig | 10                                               |
| Flink                               | not Behäbig/Fettleibig/Einbeinig                       | 8                                                |
| Fuchssinn                           | –                                                      | 15                                               |
| Geborener Redner                    | not Stumm                                              | 4                                                |
| Geweihter                           | –                                                      | 25                                               |
| Giftresistenz I–II                  | not Giftanfällig                                       | 10/level                                         |
| Glück I–III                         | not Pech                                               | 30/level                                         |
| Gutaussehend I–II                   | not Hässlich                                           | 20/level                                         |
| Herausragende Fertigkeit            | not Unfähig                                            | A/B/C/D: 2/4/6/8 per use                         |
| Herausragende Kampftechnik          | –                                                      | B/C/D: 8/12/16                                   |
| Herausragender Sinn                 | not Eingeschr. Sinn/Blind/Taub for the same sense      | Sicht/Gehör 12; Geruch & Geschmack 6; Tastsinn 2 |
| Hitzeresistenz                      | not Hitzeempfindlich                                   | 5                                                |
| Hohe Astralkraft I–VII              | Zauberer, not Niedrige Astralkraft                     | 6/level                                          |
| Hohe Karmalkraft I–VII              | Geweihter, not Niedrige Karmalkraft                    | 6/level                                          |
| Hohe Lebenskraft I–VII              | not Niedrige Lebenskraft                               | 6/level                                          |
| Hohe Seelenkraft                    | not Niedrige Seelenkraft                               | 25                                               |
| Hohe Zähigkeit                      | not Niedrige Zähigkeit                                 | 25                                               |
| Immunität gegen (Gift)              | –                                                      | ½ Giftstufe                                      |
| Immunität gegen (Krankheit)         | –                                                      | ½ Krankheitsstufe                                |
| Kälteresistenz                      | not Kälteempfindlich                                   | 5                                                |
| Krankheitsresistenz I–II            | not Krankheitsanfällig                                 | 10/level                                         |
| Magische Einstimmung                | Zauberer, not Magische Einschränkung (same area)       | 40                                               |
| Mystiker                            | Geweihter, not Pragmatiker                             | 20                                               |
| Nichtschläfer (\*)                  | –                                                      | 8                                                |
| Pragmatiker                         | Geweihter, not Mystiker                                | 10                                               |
| Reich I–X                           | not Arm                                                | 1/level                                          |
| Richtungssinn                       | not Unfähig in Orientierung                            | 10                                               |
| Schlangenmensch                     | –                                                      | 6                                                |
| Schwer zu verzaubern (\*)           | –                                                      | 15                                               |
| Soziale Anpassungsfähigkeit         | not Unfähig in a Gesellschaftstalent                   | 10                                               |
| Unscheinbar                         | –                                                      | 4                                                |
| Verbesserte Regeneration (AE) I–III | Zauberer, not Schlechte Regeneration (AE)              | 10/level                                         |
| Verbesserte Regeneration (KE) I–III | Geweihter, not Schlechte Regeneration (KE)             | 10/level                                         |
| Verbesserte Regeneration (LE) I–III | not Schlechte Regeneration (LE)                        | 10/level                                         |
| Verhüllte Aura                      | Zauberer                                               | 20                                               |
| Vertrauenerweckend                  | not Unfähig in a Gesellschaftstalent                   | 25                                               |
| Waffenbegabung                      | –                                                      | B/C/D: 5/10/15                                   |
| Wohlklang                           | not Stumm                                              | 5                                                |
| Zäher Hund                          | not Zerbrechlich                                       | 20                                               |
| Zauberer                            | –                                                      | 25                                               |
| Zeitgefühl                          | –                                                      | 2                                                |
| Zweistimmiger Gesang (\*)           | –                                                      | 5                                                |
| Zwergennase                         | –                                                      | 8                                                |

Nachteile (S. 48–49):

| Nachteil                          | Voraussetzung (short)                             | AP                                                                    |
| --------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| Angst vor … I–III                 | –                                                 | −8/level                                                              |
| Arm I–III                         | not Reich                                         | −1/level                                                              |
| Artefaktgebunden                  | Zauberer                                          | −10                                                                   |
| Behäbig                           | not Flink                                         | −4                                                                    |
| Blind                             | not Herausr. Sinn (Sicht) etc.                    | −50                                                                   |
| Blutrausch                        | Jähzorn, not Angst vor Blut                       | −10                                                                   |
| Eingeschränkter Sinn              | not Herausr. Sinn (same) etc.                     | Sicht −15; Gehör −10; Geruch & Geschmack −6; Tastsinn −2              |
| Farbenblind                       | not Blind                                         | −2                                                                    |
| Fettleibig                        | replaces Behäbig                                  | −25                                                                   |
| Giftanfällig I–II                 | not Giftresistenz                                 | −5/level                                                              |
| Hässlich I–II                     | not Gutaussehend                                  | −10/level                                                             |
| Hitzeempfindlich                  | not Hitzeresistenz                                | −3                                                                    |
| Kälteempfindlich                  | not Kälteresistenz                                | −3                                                                    |
| Keine Flugsalbe (\*)              | Zauberer, tradition can take SF Flugsalbe         | −25                                                                   |
| Kein Vertrauter (\*)              | Zauberer, tradition can take SF Vertrautenbindung | −25                                                                   |
| Körpergebundene Kraft             | Zauberer, species has hair                        | −5                                                                    |
| Körperliche Auffälligkeit         | –                                                 | −2                                                                    |
| Krankheitsanfällig I–II           | not Krankheitsresistenz                           | −5/level                                                              |
| Lästige Mindergeister             | Zauberer                                          | −20                                                                   |
| Lichtempfindlich                  | –                                                 | −20                                                                   |
| Magische Einschränkung            | Zauberer                                          | −30                                                                   |
| Nachtblind                        | not Dunkelsicht                                   | −10                                                                   |
| Niedrige Astralkraft I–VII        | Zauberer, not Hohe Astralkraft                    | −2/level                                                              |
| Niedrige Karmalkraft I–VII        | Geweihter, not Hohe Karmalkraft                   | −2/level                                                              |
| Niedrige Lebenskraft I–VII        | not Hohe Lebenskraft                              | −4/level                                                              |
| Niedrige Seelenkraft              | not Hohe Seelenkraft                              | −25                                                                   |
| Niedrige Zähigkeit                | not Hohe Zähigkeit                                | −25                                                                   |
| Pech I–III                        | not Glück                                         | −20/level                                                             |
| Pechmagnet                        | –                                                 | −5                                                                    |
| Persönlichkeitsschwächen          | –                                                 | varies                                                                |
| Prinzipientreue I–III             | –                                                 | −10/level                                                             |
| Schlafwandler                     | –                                                 | −10                                                                   |
| Schlechte Angewohnheit            | –                                                 | −2 each                                                               |
| Schlechte Eigenschaft             | –                                                 | varies                                                                |
| Schlechte Regeneration (AE) I–III | Zauberer, not Verb. Regeneration (AE)             | −10/level                                                             |
| Schlechte Regeneration (KE) I–III | Geweihter, not Verb. Regeneration (KE)            | −10/level                                                             |
| Schlechte Regeneration (LE) I–III | not Verb. Regeneration (LE)                       | −10/level                                                             |
| Schwacher Astralkörper            | Zauberer                                          | −15                                                                   |
| Schwacher Karmalkörper            | Geweihter                                         | −15                                                                   |
| Sensibler Geruchssinn (\*)        | not Eingeschr. Sinn (Geruch)                      | −10                                                                   |
| Sprachfehler                      | not Stumm                                         | −15                                                                   |
| Stigma                            | –                                                 | −10                                                                   |
| Stumm                             | not Wohlklang, not Sprachfehler                   | −40                                                                   |
| Taub                              | not Herausr. Sinn (Gehör)                         | −40                                                                   |
| Unfähig                           | not Begabung (same talent); max 3                 | A/B/C/D: −1/−2/−3/−4                                                  |
| Unfrei                            | –                                                 | −8                                                                    |
| Verpflichtungen I–III             | –                                                 | −10/level                                                             |
| Verstümmelt                       | –                                                 | Einarmig −30; Einäugig −10; Einbeinig −30; Einhändig −20; Einohrig −5 |
| Wahrer Name                       | –                                                 | −10                                                                   |
| Wilde Magie                       | Zauberer                                          | −10                                                                   |
| Zauberanfällig I–II               | –                                                 | −12/level                                                             |
| Zerbrechlich                      | not Zäher Hund                                    | −20                                                                   |

## Derived and situational effects (S. 161–182, implemented Nov 2026)

- Derived on the server (`utils/entryDerivedValues.ts`, applied in `applyResourceMaxima` and on read): SK ±1 Hohe/Niedrige Seelenkraft (S. 166, 174), ZK ±1 Hohe/Niedrige Zähigkeit (S. 167, 174), Schips max ±1/level Glück/Pech, never below 0 (S. 165, 174), GS-Grundwert +1 Flink / −1 Behäbig (S. 165, 171), halved by Verstümmelt (Einbeinig) (S. 179). The manual "bonusMalus" fields stay as "other modifiers"; don't also enter these there.
- Blind/Taub/Stumm give their status permanently (S. 171, 178): derived, not stored, locked in the status pills.
- Maxima (`utils/skillMaximum.ts`): talent = highest probe attribute + 2 (S. 39) + Herausragende Fertigkeit per pick; combat technique = Leiteigenschaft + 2 + Herausragende Kampftechnik (S. 166). Enforced only when AP are spent.
- Magic: Wilde Magie (19 counts as 20 for spell botches, S. 179); Schwacher Astralkörper (+1 AsP per spend, S. 177); Lästige Mindergeister (W20 ≤ AsP spent → `ActiveEffect` "mindergeister", all skill checks −1 until ended, no stacking, S. 173); Artefaktgebunden −1, Magische Einstimmung +1, Magische Einschränkung −1 as selectable spell effects (key `spell:*`, S. 167, 171, 173).
- Triggers (`utils/entryTriggers.ts`, `stats.triggers`): Angst vor … (Furcht = level, S. 170), Lichtempfindlich (Schmerz I, S. 173), Sensibler Geruchssinn (Verwirrung I, S. 177) are switched on by the player while the trigger is present; levels add to the checks (max IV), never written into the conditions.
- Blutrausch (S. 171): after "Take a hit" raises Schmerz, the fight panel offers the status (never automatic).
- Dunkelsicht I/II and Nachtblind (S. 164, 173) adjust a sight level marked "caused by darkness" in the fight Situation card; complete darkness (level 4) is unchanged.
- Conditional SK/ZK (Gift-/Krankheitsresistenz/-anfällig, Zauberanfällig, Schwer zu verzaubern, Wahrer Name; S. 165–179) are listed under the Overview resources; display only, the app has no checks against the hero.
- Reminders only (no supporting rules in the app): Hitze-/Kälteresistenz/-empfindlich (no climate rules), Eisenaffine Aura (Bann des Eisens not implemented), Nichtschläfer/Schlafwandler (notes in the rest dialog), Reich/Arm (creation money), Mystiker/Pragmatiker and Schwacher Karmalkörper (no liturgies yet), Körpergebundene Kraft (lose 10 AsP by hand).
- Not yet possible: Begabung/Herausragende Fertigkeit for spells; the catalog parameter only accepts talents.

## Decisions

- Verstümmelt (Einbeinig): (species GS ± Flink/Behäbig) / 2, rounded up (user decision).
- Unfähig: the "best" die is the lowest number; on a tie the first one (user decision).
- App choice, not a user decision: Schwacher Astralkörper takes the extra point only while AsP are left; it applies to every AsP spend (spell dialog and manual spend).
- App choice, not a user decision: Waffenbegabung's repeated Bestätigungswurf replaces the first one.

## Edge cases

- Hohe Lebenskraft III raises the LE-Grundwert by 3 (example S. 46).
- Hohe/Niedrige Lebenskraft, Astralkraft and Karmalkraft (±1 per level, S. 166, 174) are applied automatically to LeP/AsP/KaP max (`server/src/utils/energyRules.ts`); see [derived-values.md](derived-values.md). Do not also enter them in the manual "other modifiers".
- Glück/Pech change the Schips maximum (S. 29). The Spielleiter should allow Glück to be bought after play starts (S. 39).

## Code

- `client/src/features/heroes/AdvantagesAbilitiesEditor.tsx`
