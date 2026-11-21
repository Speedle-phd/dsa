# Kampftechniken, AT/PA/FK und Kampf-Sonderfertigkeiten

source: DSA5 Regelwerk, S. 50–51, 54–56, 234–236

## Summary

- Every weapon belongs to a Kampftechnik. All Kampftechniken start at KtW 6 and are raised with the Kostentabelle, columns B–D (S. 50–51).
- KtW cap: during creation the EG cap; afterwards Leiteigenschaft + 2 (S. 39, 50).
- The Leiteigenschaft affects PA and the Schadensbonus (Nahkampf) or the FK value (S. 234–235).
- Ranged Kampftechniken have no Schadensschwelle and no Schadensbonus (S. 235).

## Values / formulas

```
bonus(x) = floor(max(0, x − 8) / 3)          // "je 3 volle Punkte über 8": 11 → 1, 14 → 2
AT = KtW + bonus(MU)
PA = ceil(KtW / 2) + bonus(Leiteigenschaft)  // for GE/KK techniques use the higher value
FK = KtW + bonus(FF)
Schadensbonus (Nahkampf) = max(0, Leiteigenschaft − Schadensschwelle(Waffe))  // +1 TP per point
```

| Kampftechnik       | Leiteigenschaft | SF  | Notes (S. 235–236)                                                                       |
| ------------------ | --------------- | --- | ---------------------------------------------------------------------------------------- |
| Armbrüste          | FF              | B   | ranged                                                                                   |
| Bögen              | FF              | C   | ranged                                                                                   |
| Dolche             | GE              | B   | cannot parry Ketten-, Stangen-, Zweihandhiebwaffen, Zweihandschwerter                    |
| Fechtwaffen        | GE              | C   | same parry limits; defense against them −1                                               |
| Hiebwaffen         | KK              | C   |                                                                                          |
| Kettenwaffen       | KK              | C   | parry against them −2; shields only get the single bonus; Patzer on 19–20; cannot parry  |
| Lanzen             | KK              | B   |                                                                                          |
| Raufen             | GE/KK           | B   | 1W6 TP; see S. 235 for parrying armed attacks                                            |
| Schilde            | KK              | C   | active shield parry gets 2 × shield PA bonus; can block ranged attacks and large enemies |
| Schwerter          | GE/KK           | C   |                                                                                          |
| Stangenwaffen      | GE/KK           | C   |                                                                                          |
| Wurfwaffen         | FF              | B   | ranged                                                                                   |
| Zweihandhiebwaffen | KK              | C   |                                                                                          |
| Zweihandschwerter  | KK              | C   |                                                                                          |

Parierwaffen and shields held passively add their PA bonus to the main weapon's PA; only the highest bonus counts (S. 233).

Kampf-SF (S. 54–55):

| SF                            | Voraussetzungen                    | Kampftechniken                                                           | AP           |
| ----------------------------- | ---------------------------------- | ------------------------------------------------------------------------ | ------------ |
| Aufmerksamkeit                | IN 13                              | alle                                                                     | 10           |
| Belastungsgewöhnung I–II      | I: KO 13; II: KO 15                | alle                                                                     | 20 / 35      |
| Beidhändiger Kampf I–II       | I: GE 13; II: GE 15                | Dolche, Fecht, Hieb, Raufen, Schilde, Schwerter                          | 20 / 35      |
| Berittener Kampf              | Reiten 10                          | alle                                                                     | 20           |
| Berittener Schütze            | Berittener Kampf                   | Armbrüste, Bögen, Wurfwaffen                                             | 10           |
| Einhändiger Kampf             | GE 13                              | Fecht, Schwerter                                                         | 10           |
| Entwaffnen                    | GE 15                              | Fecht, Hieb, Raufen, Schwerter, Stangen, Zweihandhieb, Zweihandschwerter | 40           |
| Feindgespür                   | IN 15                              | alle                                                                     | 10           |
| Finte I–III                   | GE 13 / 15 / 17                    | Dolche, Fecht, Hieb, Raufen, Schwerter, Stangen, Zweihand\*              | 15 / 20 / 25 |
| Haltegriff                    | –                                  | Raufen                                                                   | 5            |
| Hammerschlag                  | MU 15, Vorstoß, Wuchtschlag III    | Hieb, Ketten, Schwerter, Zweihand\*                                      | 25           |
| Kampfreflexe I–III            | IN 13 / 15 / 17                    | alle                                                                     | 10 / 15 / 20 |
| Klingenfänger                 | GE 13                              | Dolche                                                                   | 10           |
| Kreuzblock                    | GE 13                              | Dolche, Fecht                                                            | 10           |
| Lanzenangriff                 | MU 13, Berittener Kampf            | Lanzen                                                                   | 10           |
| Präziser Schuss/Wurf I–III    | IN 13 / 15 / 17                    | Armbrüste, Bögen, Wurfwaffen                                             | 15 / 20 / 25 |
| Präziser Stich I–III          | GE 13 / 15 / 17                    | Dolche, Fecht                                                            | 15 / 20 / 25 |
| Riposte                       | GE 15                              | Dolche, Fecht                                                            | 40           |
| Rundumschlag I–II             | GE 15 / 17                         | Hieb, Schilde, Schwerter, Stangen, Zweihand\*                            | 25 / 35      |
| Schildspalter                 | KK 13, Wuchtschlag I               | Hieb, Ketten, Zweihand\*                                                 | 15           |
| Schnellladen                  | FF 13                              | Armbrüste 5 / Bögen 20 / Wurfwaffen 10                                   | varies       |
| Schnellziehen                 | FF 13                              | Dolche, Fecht, Hieb, Ketten, Schwerter, Stangen, Zweihand\*              | 10           |
| Sturmangriff                  | MU 13, Vorstoß, Wuchtschlag I      | Hieb, Schwerter, Stangen, Zweihand\*                                     | 25           |
| Todesstoß                     | MU 15, Präziser Stich III, Vorstoß | Dolche, Fecht                                                            | 30           |
| Verbessertes Ausweichen I–III | Körperbeherrschung 4 / 8 / 12      | –                                                                        | 15 / 20 / 25 |
| Verteidigungshaltung          | IN 13                              | Dolche, Fecht, Hieb, Raufen, Schilde, Schwerter, Stangen, Zweihand\*     | 10           |
| Vorstoß                       | GE 13                              | Dolche, Fecht, Hieb, Ketten, Raufen, Schwerter, Stangen, Zweihand\*      | 10           |
| Wuchtschlag I–III             | KK 13 / 15 / 17                    | Hieb, Ketten, Raufen, Schwerter, Stangen, Zweihand\*                     | 15 / 20 / 25 |
| Wurf                          | GE 13, Haltegriff                  | Raufen                                                                   | 10           |
| Zu Fall bringen               | KK 13                              | Stangen                                                                  | 20           |

Zweihand\* = Zweihandhiebwaffen and Zweihandschwerter. Higher levels also require the previous level.

## Edge cases

- Book examples: KtW 6, MU 14, GE 14 → AT 8, PA 5 (S. 51); KtW 12, MU 14 → AT 14 (S. 51).
- Weapon AT/PA modifiers are added on top (e.g. Streitaxt PA −1, S. 233).

## Open questions

- Per-weapon tables (TP, L+S, RW, AT/PA-Mod) are in S. 237–250 and not extracted yet.
- S. 235 says Kettenwaffen cannot parry, and also gives parry penalties against them. The doc keeps both statements as written.

## Combat tab

- The tab follows the sections on S. 411, using responsive cards/tables rather than reproducing the sheet artwork.
- All techniques default to KtW 6, including existing heroes. Advancement charges the target step from S. 50 and enforces Leiteigenschaft + 2 (S. 39).
- Manual initial configuration, like the talent editor, records values without charging AP. This is an import/setup facility, not a rules-based advancement or character-creation validator.
- Combat abilities can be recorded without AP (including custom names), or purchased from the S. 54–55 catalog with AP and prerequisite checks. Higher levels require the previous level.
- Removal is a correction facility: only purchases recorded with an AP receipt are refunded. Existing/manual entries have no automatic refund. Remove owned dependent abilities first; removal never cascades or guesses historical AP costs.
- Ability-effect tooltips contain concise summaries verified against S. 246–250. Unknown custom abilities have an explicit missing-description notice. Page citations live in tooltips and code rather than the main layout.
- Weapon/armor rows use matching inventory names and the existing store metadata. Missing metadata is reported; custom weapon statistics are not invented.
- Roll targets show the base beside a colored effective-value badge, inline with the situational modifier button. Signed modifiers and source citations remain in the badge tooltip. Weapon modifiers, melee damage bonus and active shield PA remain included in weapon base values. Kampfreflexe adds to INI (S. 248).
- Unchanged effective targets omit the duplicate badge. Missing contextual choices are labeled separately from rules-based unavailability. An unrecorded FW does not block displaying a talent's probe targets; all talents are active at FW 0 under S. 25, 50. Recording FW and AP advancement retain their existing setup behavior.
- Explicitly select worn armor in equipment; inventory ownership alone does not activate armor. Its effective Belastung and extra GS/INI deductions follow the armor table (S. 32). Belastungsgewöhnung shifts two rows per level, including extra deductions, without changing RS (S. 246).
- Recorded Belastung now means non-armor load only, entered manually. The older inventory weight estimate remains informational and is not silently applied to checks. Armor is added only once.
- Condition effects follow their individual scopes (S. 32–34): Belastung does not penalize FK; Paralyse needs movement/speech context; Entrückung affects talents/spells, not combat checks. Combined condition penalties cap at 5, not situational penalties. Inability to act and Verwirrung III knowledge restrictions are shown explicitly, not as usable numeric targets.
- Berauscht, Trance and Überanstrengung have no verified core-rulebook modifier definitions in this implementation. Active entries produce a visible warning; their effects must be entered manually rather than guessed.
- Schmerz IV permits an explicit per-check confirmation of preserved action capability, or selection of the required Selbstbeherrschung (Handlungsfähigkeit bewahren) check itself (S. 34). Other incapacity reasons are not bypassed.
- Temporary per-check context is shared by hero/check across tabs and resets on reload. Enter situation/manoeuvre modifiers explicitly; target, range, lighting and unrecorded status cannot be inferred. An equipped shield or Linkhand adds its passive PA bonus to the other equipped melee weapons (S. 233, 366; Klingenfänger +1, S. 248). Situation, range and sight are entered in the fight panel (see [combat-basics.md](combat-basics.md)).
- Talent modifiers adjust all three attribute targets, never the stored FW (S. 23). Conditional BE applications, Paralyse and deity-pleasing checks require an explicit context choice.
- Health adjustments (now only from the fight panel: hits and Patzer) deduct already-calculated SP, cap healing at maximum LeP, allow negative LeP, and recalculate Schmerz (S. 34, 234). At LeP <= 0 the tab warns about dying; below negative KO it warns about death (S. 340), without changing character status automatically.
- Other conditions on S. 411 are manually recorded at levels 0–IV and affect displayed roll targets. Regeneration is on the overview (see [../character/regeneration.md](../character/regeneration.md)); the fight panel rolls INI, AT/FK, defenses and TP (see [combat-basics.md](combat-basics.md)). No stabilization is implemented.
