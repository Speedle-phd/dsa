---
description: 'Use when implementing, reviewing, or documenting DSA5 (Das Schwarze Auge) game mechanics: attributes, Eigenschaften, Talente, AP/Abenteuerpunkte, Steigerung, Kampf, Magie, Liturgien, Ausrüstung, derived values.'
applyTo: 'docs/dsa5/**, server/src/utils/**, server/src/validations/**, client/src/features/heroes/**'
---

# DSA5 rules

## Lookup order (cheapest first)

1. **Topic doc** — `docs/dsa5/rules/<topic>/*.md`. If one covers the mechanic, use it and stop.
2. **Index** — `docs/dsa5/rules/rulebook-index.md` to find the printed page range.
3. **PDF extract** — pull only the needed pages from `DSA5 rulebook.pdf`:
   ```powershell
   python scripts/dsa5_pages.py 226-228
   python scripts/dsa5_pages.py 225-250 --grep "Verteidigung"
   ```
   Page numbers are the **printed** page numbers (`S. …`); the script handles the PDF offset.
   Never read the whole PDF. Narrow with `--grep` before widening the range.
4. If the rule is still unclear or contradictory, ask the user. Never invent rules or values.
   - Offer concrete options (e.g. rounding direction, table vs. text). Record the answer in the topic doc under **Decisions** (see `character/regeneration.md`).
   - Keep user decisions and your own app choices apart: label the latter "App choice, not a user decision" in **Decisions** and mention them to the user.
   - Values from outside the core rulebook (expansion books, the official sheet) are not invented: if the user wants them anyway, store them as plain, editable values without rules (e.g. companion LO) until a source is named.
   - Things only named on the character sheet (S. 411), e.g. Berauscht, Trance, Überanstrengung, have no core-rule effects. Say so; don't fill them in.

## Encoding rules

- Keep DSA5 terminology in German for domain identifiers and data (`Eigenschaft`, `Talent`, `AP`, `LeP`, `AsP`, `KaP`, `SF`, `Steigerungsfaktor`). Code structure stays English.
- Keep rule data (tables, costs, lists) separate from logic, e.g. a `const` table plus a pure function.
- Annotate every encoded rule with its source on one line: `// source: DSA5 Regelwerk, S. <page>`.
- Reuse existing rule code before adding new code. Known locations:
   - `server/src/utils/attributeLevelUp.ts` — Steigerungskosten (A–E)
   - `server/src/utils/levelExpMapping.ts` — Erfahrungsgrade / Start-AP
   - `server/src/utils/creation/` — guided creation: EG caps (`experienceCaps`), species, cultures, professions and archetypes (catalogs, `archetypeDraft`), `creationLedger` (AP, caps, violations, derived values), `creationFinish` (draft → hero)
   - `server/src/utils/energyRules.ts` — LeP/AsP/KaP maximum (Leiteigenschaft per tradition, Lebens-/Astral-/Karmalkraft levels)
   - `server/src/utils/checkModifiers.ts` — condition/Belastung modifier profiles; `entryRollEffects.ts` — owned advantage/SF effects
   - `server/src/utils/magicCatalog.ts`, `magicRules.ts` — spells, traditions, Merkmale (`spellProperties`), spell maximum
   - `server/src/utils/karmaCatalog.ts`, `karmaRules.ts` — liturgies, ceremonies, blessings, churches, liturgy maximum, KaP spending (Schwacher Karmalkörper)
   - `server/src/utils/companionCatalog.ts`, `companionRules.ts` — animals, familiars, tricks, animal Schmerz
   - `server/src/utils/bestiaryCatalog.ts`, `summonRules.ts` — Bestiarium creatures, demon/elemental rules, summoning services and improvements (S. 262–265, 353–362); `client/src/features/heroes/companionManeuvers.ts` — Flugangriff/Verbeißen
   - `server/src/utils/regeneration.ts`, `combatRules.ts` — regeneration, LeP changes
   - `server/src/utils/statusRules.ts` — Status (S. 34–36) as roll effects, GS overrides, Blutrausch end
   - `server/src/utils/entryDerivedValues.ts` — SK/ZK/Schips/GS from Vor-/Nachteile, permanent statuses, conditional SK/ZK; `entryTriggers.ts` — Angst vor/Lichtempfindlich/Sensibler Geruchssinn triggers; `skillMaximum.ts` — talent/technique maximum (S. 39, 166); `magicDisadvantages.ts` — Schwacher Astralkörper, Lästige Mindergeister; `entrySuggestions.ts` — book examples for free-text entry subjects (S. 167–179, 321)
   - `client/src/features/heroes/combatSituation.ts` — combat situation, ranged, defense, reach, reload, two weapons, maneuver TP (S. 230–250); `patzerTables.ts` — optional Patzer tables; `server/src/utils/ammunition.ts` — ammunition per shot; `weaponCondition.ts` — weapon damage and repair
   - `server/src/utils/extendedCheck.ts` — Sammelprobe (S. 26–27); `client/src/features/heroes/skillCheck.ts` `evaluateOpposed` — Vergleichsprobe
   - `client/src/features/heroes/skillCheck.ts`, `combatRoll.ts` — client roll mirrors (3W20, single W20, damage, "… verbessern")
   - `server/src/utils/baseAttributes.ts`, `talentCatalog.ts`
   - `client/src/features/heroes/` — hero UI and schema
- Server is the source of truth for rule validation; the client may mirror rules for UX only.
- Values the rules derive (LeP/AsP/KaP max, Schmerz, familiar bonuses, check targets) are computed, never typed in: derive them on the server when loading (`findStatsForUser`), saving (`saveStats`) and in the response view, so old data is corrected too. Keep a manual "other modifiers" field only for things the app cannot know, and show the breakdown in the UI.
- Subjects that must match catalog data (e.g. the Merkmal of Merkmalskenntnis) are chosen from a list (`choices`), not typed, so typos cannot silently break rule links.
- Verify rule code against the book's own worked examples (e.g. Geron S. 22, Mirhiban S. 23–24, Arbosch S. 231–234, Layariel S. 339) and cite them in test names.
- GM-discretion rules (retries, optional rules, critical effects) are offered, never applied automatically.

## App conventions (user decisions)

- Every talent is active from FW 0 and can be rolled (S. 25, user decision Nov 2026: the former activation house rule was dropped). Hero talents are always numbers, never `null`; only spells, rituals, liturgies and ceremonies are activated for A–D 1–4 AP. Companion/creature talents keep `null` = the creature can't use that talent.
- Guided creation: the server ledger is the source of truth (the client only renders it); culture bonuses and profession values add up and stay editable (lowering refunds); unusual choices are GM approvals, never blocks. See `character/character-creation.md`.
- Disadvantage AP from creation are stored as `disadvantageCredit` on the total but shown as negative costs (net spent).
- Combat is **GM-driven**: the app rolls only the hero's side (the hero plus allies: companions, summoned creatures, Radau brooms); enemy TP are entered. Only equipped items (`carriedOn === 'Equipped'`), weapons in a worn Dolch-/Schwertscheide (not held until drawn) and Waffenlos are available in a fight.
- Companions: book animals (S. 360–362) + custom animals; familiar bonuses automatic, tricks from the familiar's AP, other raised values by hand; no Schips; Schmerz from the printed table for book animals, hero rule (S. 34) for familiars and custom animals.
- Spell Probe: halved/third AsP costs round up; AsP is offered via a "Spend AsP" button, never deducted automatically.
- Companions: every companion has an AP pool; LO (Loyalität) is a free number without rules (source unknown). Rabe Fliegen uses its printed check (MU/GE/KK).
- Schips: one per roll (Neuer Wurf, Qualität verbessern, Schadenswurf wiederholen, "… verbessern"); round uses (Erster, Verteidigung +4, Zustand ignorieren) are separate. App choice: "… verbessern" (+2) only turns a normal failure into a success, never creates or removes a critical.
- LeP/AsP/KaP max: 20 (AsP/KaP) or species value + 2 × KO (LeP) + Leiteigenschaft (AsP/KaP) + advantage levels + other modifiers + Zukauf (S. 56–57, 166, 174). Several traditions: highest Leiteigenschaft (app choice).
- Regeneration: modifiers → negatives to 0 → halve (round down); Vergiftet/Krank blocks only LeP. KaP current is tracked (`karmaEnergy.current`, missing = full).
- Vor-/Nachteile with fixed numbers change derived values automatically; trigger-based ones (Angst vor, Lichtempfindlich, Sensibler Geruchssinn) are switched on by the player; rerolls (Begabung, Unfähig, Waffenbegabung) are dice actions. Einbeinig halves GS rounding up; Unfähig rerolls the lowest die. See `character/advantages-disadvantages.md`.
- Status (on/off) is stored per hero (`stats.statuses`). Printed numbers apply automatically through roll effects; GM-only parts are tooltip reminders. Zustand ignorieren does not ignore statuses.
- Summoned creatures are their own model (`summon.model.ts`); hunting has no core-rule procedure (Jagd modifier shown only).
- Sammelproben are their own model, saved per hero; Vergleichsproben are not stored.
- Fight panel facts the app cannot know (distance, enemy weapon and size, sight, cover) are inputs in the Situation card, never guessed. Two-handed = items marked "(2H)".
- Weapon damage from Patzer tables stays on the item until repaired (GM price or craft check, the book has neither rule); ammunition is deducted per shot (carried stacks only, Köcher first).
- Placements: Angelegt / Lager / Sonstiges always; containers only when owned (worn ones Angelegt or nested). Contents weigh where their container is; external containers (Truhe, Satteltasche, Packsattel, vehicles) do not count. Replaced armor goes to Sonstiges. Keep `features/heroes/containers.ts` and `server/src/utils/containers.ts` in sync.
- Missing book weights are 0 (approved policy); missing prices are the GM's agreed price, never invented. Store prices can be changed by a market rate (Feilschen, S. 208) or a custom price per purchase; service prices are owned by the server.
- Timed elixir/herb/service effects are `ActiveEffect` records ended by the player (no in-game clock); only the strongest effect of a kind counts (S. 272).

## Copyright

The rulebook is © Ulisses Spiele. Topic docs contain concise, implementation-oriented
summaries and tables of values needed by the code — not copied prose.
