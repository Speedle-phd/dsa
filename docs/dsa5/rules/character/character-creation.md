# Heldenerschaffung (15 Schritte)

source: DSA5 Regelwerk, S. 37–57

## Summary

- Creation is paid from an AP-Konto whose size depends on the Erfahrungsgrad (S. 38–39).
- The balance may go negative during creation. At the end it must be ≥ 0 and ≤ 10 (S. 38, 56).
- Vorteile max 80 AP, Nachteile max 80 AP, for every EG (S. 39, 46).
- Every hero starts with 3 Schips, attributes at 8 and Kampftechniken at 6 (S. 39, 43, 45).

## Values / formulas

| #   | Schritt            | What happens                                                              | AP                                                             | Page           |
| --- | ------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------- |
| 1   | Heldenkonzept      | pick a concept; Zauberer/Geweihter need the matching Vorteil              | –                                                              | 38             |
| 2   | Erfahrungsgrad     | sets AP-Konto and caps                                                    | –                                                              | 38–39          |
| 3   | Spezies            | LE/SK/ZK/GS Grundwerte, attribute modifiers                               | 0/18/0/61                                                      | 40, 87–94      |
| 4   | Kultur             | Muttersprache (Sprache III) and Ortskenntnis free; optional Kulturpaket   | 0 or package cost                                              | 40–42, 95–126  |
| 5   | Eigenschaften      | buy points above 8; stay within max value and max sum                     | E column                                                       | 43–44          |
| 6   | Profession         | optional Professionspaket (talents, Kampftechniken, SF, spells/liturgies) | package cost                                                   | 44–45, 127–160 |
| 7   | Vor-/Nachteile     | ≤ 80 AP each                                                              | see [advantages-disadvantages.md](advantages-disadvantages.md) | 46–49          |
| 8   | Steigerungen       | activate and raise skills per Kostentabelle                               | A–D                                                            | 50             |
| 9   | Kampftechniken     | calculate AT/PA/FK                                                        | B–D                                                            | 51             |
| 10  | Sonderfertigkeiten | prerequisites + AP (incl. Tradition for casters/priests)                  | per SF                                                         | 51–55          |
| 11  | Letzte Anpassungen | balance the account, keep ≤ 10 AP                                         | –                                                              | 56             |
| 12  | Basiswerte         | LeP, AsP, KaP, SK, ZK, AW, INI, GS                                        | –                                                              | 56–57          |
| 13  | Ausrüstung         | buy equipment                                                             | –                                                              | 363–382        |
| 14  | Startalter         | –                                                                         | –                                                              | –              |
| 15  | Name               | –                                                                         | –                                                              | –              |

Eigenschaftspakete (S. 43–44): the packages cost 540 AP (sum 100, no value above 14), 555 AP (one 15) or 570 AP (two 15s).

Caster/priest caps (S. 45):

- Active spells ≤ the EG limit. Fremdzauber (from another tradition) ≤ the EG limit (0–6, see [experience.md](experience.md)).
- Priests may only take general liturgies and those of their own church.
- Priests of the Zwölfgötter must buy the Zwölf Segnungen during creation.

Traditions (S. 53–54), AP: Elfen 125, Gildenmagier 155, Hexen 135; Boron 130, Hesinde 130, Peraine 110, Phex 150, Praios 130, Rondra 150.

## Edge cases

- Professionspakete are built for EG Erfahren. Other EGs may adjust them, but must respect the EG caps (S. 45).
- Uncommon Kulturen/Professionen or untypical Vor-/Nachteile need the Spielleiter's approval (S. 40–41, 44).
- Zukauf of LeP/AsP/KaP is not allowed during creation (S. 56).

## More rules (S. 40–59)

- Attributes start at 8; species modifiers change only the maximum (S. 43, 88). Kulturpaket and Professionspaket are bought as a whole; package prerequisites (Zauberer/Geweihter, Tradition, required advantages) are paid separately (S. 44–45, 128).
- Professions may be modified: lowering a package value saves its AP, raising costs AP within the EG caps (S. 45, "Professionen modifizieren").
- Start money 750 Silbertaler (optional ±200 S per EG step from Erfahren), start age by species and EG (free or rolled), birth date roll, name from the culture's suggestions (S. 58–59). Background prompts without rules (S. 60–61).
- Species: [species.md](species.md). Cultures: [cultures.md](cultures.md).

## Implemented guided creation (Nov 2026)

- Dashboard "Create hero" starts a server-side draft (`CreationDraft` model); "Quick create" keeps the old free-text form. Unfinished drafts are listed on the dashboard.
- Page `/create/:draftId` (`pages/HeroCreation.tsx`, steps in `client/src/features/creation/`): sticky header with the AP balance (green 0–10, amber above, red below 0), chips for Vorteile/Nachteile x/80, attribute sum and spells, and a breadcrumb of nine sections (done ✓, open GM approval ?, rule problem !). On phones the breadcrumb is a "Step n/9" menu.
- Sections: Erfahrungsgrad, Spezies (+ maximum choice), Kultur (mother tongue, Ortskenntnis, script, package), Eigenschaften, Profession (own name for now), Vor-/Nachteile, Fertigkeiten (talents, combat techniques, spells and Zaubertricks for casters), Sonderfertigkeiten & Sprachen, Abschluss (name, sex, age roll, background, base values with breakdown, open points, "Create hero").
- The server recomputes everything on every save (`utils/creation/creationLedger.ts`): costs per section, caps, violations, GM-approval warnings, derived values. "Finish" refuses while anything is open and writes the hero: `experience.base` = EG AP, disadvantage AP as `disadvantageCredit` + `entryCredits`, purchases as `entryPurchases`, all talents active (FW 0, S. 25), species base values, 750 S.
- Endpoints: `GET /api/creation/reference`, `GET/POST /api/creation/drafts`, `GET/PUT/DELETE /api/creation/drafts/:id`, `POST /api/creation/drafts/:id/finish`.

### Decisions

- User decisions, Nov 2026: server-side draft; all species, cultures and professions in phases (own profession from the start); a liturgy catalog for priests; culture bonuses and profession values add up (archetype Allacaya: Fährtensuchen 7 + 1 = 8), every value stays editable and lowering refunds (S. 45), EG caps apply to the total.
- App choices, not user decisions:
   - FW cap during creation = the lower of the EG maximum and highest check attribute + 2 (S. 39); the same for spells (spell maximum) and combat techniques (Leiteigenschaft + 2).
   - GM approvals (unusual culture, entries with an approval note, skipped "dringend empfohlen" species entries) are checkboxes; an unchecked one blocks "Finish".
   - The 80 AP advantage limit is enforced only during creation (S. 39, 46), not on purchases afterwards.
   - Finish without a database transaction (the app runs without a replica set): if the stats cannot be saved, the new character is deleted again.
   - Start age default = the table's base value when no age is entered; start money always 750 S (the optional EG rule is not applied).
- Professions (Phases 2–3, Nov 2026): all 16 worldly and 9 caster professions with variants, see [professions.md](professions.md). The package price is charged as a whole; package values are the base (lowering refunds); choice slots (combat techniques, Zaubertricks, specialization application) are open points until chosen; package SF and combat SF are granted, their attribute prerequisites and the package's required advantages/SF/disadvantages/species are checked; a variant's culture/sex limit is a rule problem, an unusual profession for the culture a GM approval.
- App choices, not user decisions (professions):
   - The language budget ("Sprachen (und Schriften) für insgesamt N AP") pays the languages (and scripts, incl. the culture's script) the hero buys, up to N AP; unused budget is not refunded. The witches' curse budget works the same for Hexenflüche.
   - Package spells and package Zaubertricks are recorded with `paidAP` 0 on the hero (part of the profession price); raising a package spell records only the extra cost.
   - Package combat SF go to `combatSpecialAbilities` without `combatAbilityPurchases` (no refund on removal).
   - Entries the hero already has (granted by species, culture or profession — e.g. Rabenhexe: Flugsalbe, Vertrautenbindung; elf: Zauberer — the mother tongue, the culture script, or chosen before) are hidden in the pickers and flagged by the server as "already part of the hero or chosen twice", which blocks Finish. Entries with a specification (Ortskenntnis, Begabung …) count as duplicates only with the same specification.
   - Talents follow the app's house rule (experience.md): untouched talents stay not activated (`null`); package talents are activated at their value; activating another talent costs its activation (A–D 1–4 AP) and can be undone. Finish keeps `null` for not activated talents.
   - The Fertigkeitsspezialisierung is stored as `Fertigkeitsspezialisierung (<talent key>: <application>)`, the catalog's format.
- Priests (Phase 4, Nov 2026): 6 priest professions with variants, liturgy rows and Segnungen in the Skills step, see [../karma/liturgies.md](../karma/liturgies.md). The EG limit for "Zauber/Liturgien" (S. 39) is counted separately for spells and for liturgies (app choice). Priests of the Twelve must have Die Zwölf Segnungen (S. 324); the package includes them.
- Combat special abilities (Nov 2026): bought in the "Special abilities & languages" step besides the package ones (S. 51–55). Each level is its own entry ("Finte II" needs "Finte I"); attribute and talent prerequisites (S. 54–55) are checked on the final values. Finish records them as purchases, so removing one on the hero page refunds its AP.
- Archetypes (Phase 5, Nov 2026): the twelve example heroes (S. 62–85) start a filled Erfahren draft ("From an archetype" on the hero list, `utils/creation/archetypeCatalog.ts`). The printed values are taken as they are and checked like any draft:
   - Allacaya balances to 0 AP and her derived values match the book (LeP 28, AsP 35, SK 2, ZK 0, AW 8, INI 13, GS 8, Schips 2).
   - The others do not add up in print (e.g. Korgrimm −77, Thallian +20, Ylwa −29 AP under these rules; Wulfgrimm's Menschenkenntnis 0 is below his package 2, and his Wettervorhersage needs Wildnisleben 4 with 3 printed). Part of the gap is the activation house rule for talents outside the packages. The player resolves the rest in the wizard.
   - Not printed and left open: the application of the Fertigkeitsspezialisierung, GM approvals. Mohisch (Orestas) is missing from the language catalog. Elwene has no choice technique at 10 (S. 159): the first option is chosen and lowered to 6.
   - Equipment and money of the archetypes are not copied; start money is the usual 750 S.
- Not yet: looks tables, Reich/Arm money.

## Open questions

- The worked example has two arithmetic slips (S. 46): Louisa 560 − 225 printed as 329; Chris's step 7 printed as 3 AP. Tests follow the arithmetic.
