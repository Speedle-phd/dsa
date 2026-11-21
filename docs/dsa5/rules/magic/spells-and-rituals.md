# Zauber & Rituale

source: DSA5 Regelwerk (4th revised German edition), S. 25, 39, 50, 253–261, 274–287, 300–304, 413

## Sheet and persistence

S. 413 combines AsP current/max, eight attributes, spell/ritual name, Probe, FW, costs, casting time, range, duration, Merkmal, StF, effect and printed source page. Supporting sections hold tradition, leading attribute, Merkmalskenntnisse, Traditionsartefakte, magical special abilities and Zaubertricks.

- The app omits the standalone source-page column for spells, rituals and curses; source references remain available in Details.
- The app catalog contains the 45 Zaubersprüche, six Rituale, ten Hexenflüche and 12 Zaubertricks from this book (S. 281–304).
- Each owned spell/ritual has its own FW, user notes and actually paid AP. Unlearned spells are absent, not active at FW 0 (S. 25, 50).
- Existing heroes receive empty collections on read; no destructive migration or automatic profession spell assignment.
- Magical SF and traditions reuse the existing character-entry catalog and purchase/removal controls. They are not duplicated in a new ability collection.
- Tradition and magical SF controls share their own full-width section between the Arcana resource summary and Zauber & Rituale. Traditionsartefakte also uses a full-width section.
- The foundation section groups tradition and magical SF in distinct responsive panels with labeled add actions. Existing purchase previews, AP mode, effect tooltips and removal safeguards remain unchanged.
- Arcana cards prioritize owned entries, current values and actions. Curse rules, Zaubertrick rules/details and general casting guidance are collapsed initially. Spell/curse descriptions remain in the Details dialog rather than repeating in table rows. Warnings and user notes remain visible; search is shown when ordinary magical skills are owned.
- Traditionsartefakte link existing inventory item names, showing quantity, placement and weight from inventory without creating duplicate equipment. The present inventory has no stable per-item identifier: a link refers to all entries of that name, not a particular copy. Unavailable links are explicitly marked and must be unlinked before saving an updated selection. Existing artifact notes are preserved as supplementary text. Neither linking nor notes enchant/bind an item, pay permanent AsP or grant flight.

## Acquisition and advancement

- Activation to FW 0 costs A/B/C/D = 1/2/3/4 AP. Subsequent target steps use the shared S. 50 cost table, including multi-step increases.
- Paid spell/ritual acquisition requires the advantage Zauberer and a supported tradition (S. 274). Current supported traditions are Gildenmagier, Hexe and Elf, matching the existing catalog.
- Paid FW maximum during play is highest attribute in the spell's Probe +2 (S. 39), additionally capped at 14 without the matching Merkmalskenntnis (S. 285). The app cost table/editor ends at 25.
- Merkmalskenntnis acquisition validates a tradition's leading attribute of at least 15 and three distinct matching spells/rituals at FW 10, in addition to the existing GM confirmation/training requirement and ordinal AP costs (S. 285).
- Removing/correcting a spell cannot invalidate an owned Merkmalskenntnis's three-spell prerequisite. Removing knowledge needed by an owned FW above 14, the last supported tradition while spells remain, or Zauberer while spells/tricks remain is blocked.
- The shared header AP switch also governs Arcana. AP disabled permits free recording and numeric corrections without changing any AP counter; it does not confer magic ability. Paid decreases are rejected. Dependency guards still apply.
- Removal is an explicit undo, not ordinary forgetting: only actually tracked payments can be refunded. With AP disabled, removal discards tracking and preserves spent AP. No AP is inferred from a corrected FW.
- Starting-creation experience caps/counts (S. 39) are not enforced by this during-play sheet. It is not a character-creation wizard.

## Traditions and check information

- Gildenmagier: KL; Hexe: CH; Elf: IN (S. 275, 278, 283). AsP bases, configured attribute bonus and maxima continue to use the existing resource model/editor; viewing the sheet never silently rewrites them.
- `allgemein` distribution is native to all traditions. Other foreign spells remain at −2 even after learning from someone of the hero's tradition (S. 274, 286).
- One owned foreign **Zauberspruch** can be explicitly documented as the Gildenmagier creation exception; it is treated as native, not as a repeatable during-play conversion. The field requires Gildenmagier and cannot select a ritual, native spell or unowned spell (S. 275).
- Matching Merkmalskenntnis permits modifications of foreign spells but does not remove −2 (S. 285).
- Elf doubles duration for spells with Elfen distribution (S. 283). Catalog durations remain base values; the table marks ×2 instead of overwriting data. Special QS-dependent duration exceptions still require the individual spell description.
- A spell's SK/ZK resistance reduces all three check attributes, not FW (S. 253–254). No target resistance is guessed.

## Casting reference, not a casting engine

- Select target/category, range and sight before modifications; the target must remain visible/in range throughout casting, unless touch suffices (S. 254–255, 260).
- Allowed modifications: one per full four FW; at most one step per category, no duplicates. Foreign traditions need matching knowledge. Spell-specific cost/range prohibitions are retained (S. 255–256, 260–261, 285).
- Time/cost increase gives +1, decrease −1; range increase −1. Geste/Formel omission gives −2 each. Range `selbst` cannot be increased. Sustaining cost must not drop below 1 AsP per interval (S. 256–257, 261).
- Normal failure costs half, Hexe one third (S. 255, 278). For sustained spells, failure considers activation plus the first interval (S. 286).
- Each sustained spell/liturgy imposes −1 on further magical/divine checks, not ordinary talents (S. 285–286).
- Iron: −1 per full 2 Stein, or 4 with Eisenaffine Aura; regeneration is also affected after prolonged carrying (S. 164, 256). Material weights are not guessed from generic inventory entries.
- Ritual site, constellation, clothing and implements supply situational modifiers (S. 260). Conditions, interruptions, tradition techniques and target-specific exceptions still apply.
- The spell Probe (below) rolls the check and suggests the AsP cost. Casting actions, active effects, summoning services, permanent AsP and artifact enchantment are **not automatically executed** here. Concise effect summaries link to the relevant German printed pages rather than reproducing full descriptions.
- Current AsP can be spent/restored manually within 0..max, without AP changes. Additional AsP purchases reuse the existing resource controller and AP switch.

## Merkmalskenntnis panel

- Merkmale of the core rules (S. 252): Antimagie, Dämonisch, Einfluss, Elementar, Heilung, Hellsicht, Illusion, Objekt, Sphären, Telekinese, Verwandlung (`spellProperties` in `magicCatalog.ts`). Merkmalskenntnis and Merkmalsfokus select from this list (`choices`), no free text, so the subject always matches a spell's Merkmal.
- "Magical foundation" shows a Merkmalskenntnis panel (`propertyKnowledge` in `magicApi.ts`, UX mirror of `meetsPropertyKnowledge`): leading attribute vs. 15, one card per Merkmal of owned spells (or known knowledge) with 3 progress pips for spells at FW 10, missing prerequisites, the matching spells, and a Learn button when eligible (any non-known Merkmal when AP is disabled: Record). The button opens the usual add dialog with entry and Merkmal preselected; GM approval for training stays in that dialog.
- Saved entries whose Merkmal is not in the list (e.g. typed before the list existed) are flagged as having no effect.

## Implemented spell Probe

- Each spell/ritual/curse row has a W20 button that opens `SpellProbeDialog` (shared 3W20 flow in `ProbeDialog.tsx`, same as talents: difficulty, Schips, retry hint, QS).
- Modifiers: the talent modifier profile with `complex` (Entrückung covers "Talente und Zauber", S. 33; Verwirrung III blocks spells, S. 34; Belastung does not apply); foreign tradition −2 automatic (S. 274); target SK/ZK entered per roll, curses enter the already-halved value (S. 253–254, 281); −1 per sustained spell/liturgy (S. 285–286). Modifications are tick boxes (see "Spell Probe additions").
- Critical success: optional +1W6 FP button, half costs (S. 258). Optional Patzer table (2W6): see "Spell Probe additions".
- AsP: success = base cost; critical = half base; failure (incl. Patzer) = half of base + first interval, Hexe one third (S. 255, 258, 278). The suggestion is prefilled in an editable field; nothing is deducted until "Spend AsP" is clicked. Variable costs ("≥ 4", "4 / 8 / 16", "Krankheitsstufe") prefill the first number or nothing and say so.
- Spells and curses are shown as cards in one auto-fill grid (not a table), so cards of different distributions share rows; spells and rituals are sorted by distribution and each card shows "Verbreitung: …" under its subtitle (no group headings). Card: header with W20 button, name, kind · Merkmal · StF and icon actions (Details, note, remove); a value strip with Probe, effective targets (modifier profile + foreign −2, modifier button) and FW + advancement; facts (costs, casting time, range, duration); notes. A card at FW ≥ 14 without the matching Merkmalskenntnis says so.

### Decisions

- Halved/third AsP costs round **up** (book gives no rounding). User decision, Nov 2026.
- AsP after a spell roll is **offered** (editable amount + button), never deducted automatically. User decision, Nov 2026.
- Tradition (Hexe) owned → one third on failure for every spell of that hero.

## Zaubertricks

Each costs 1 AP, 1 AsP and one action; no check, normally QS 1, or QS 2 with Starke Zaubertricks. No FW or modifications. A tradition is not necessary for their acquisition, but Zauberer is required for a paid purchase (S. 50, 285–287).

## Hexenflüche

- Separate repertoire shown only when the hero owns `Tradition (Hexe)`. The server also requires that tradition for acquisition and advancement, even with AP disabled. Removing the witch tradition is blocked while curses remain, including when another magical tradition is owned (S. 278, 281).
- Ten curses from S. 282–283 reuse owned magical skill persistence, FW, notes and tracked AP. All use B, activation 2 AP and the usual advancement costs (S. 274, 281). Matching curses count toward Merkmalskenntnis prerequisites (S. 285).
- No modifications, even with Merkmalskenntnis. SK/ZK apply at half value. Direct delivery needs at least one action and reaches up to 64 Schritt; longer spoken curses need a GM ruling. Effects begin after 24 hours (S. 281).
- Alternative delivery uses a one-hour transfer ritual and a familiar's Fluchbote, or a body sample at midnight while the target sleeps. Demands, release for 3 AsP, the witch's death, antimagical and liturgical removal remain manual (S. 279, 281).
- The displayed casting time and range describe direct delivery, not every delivery method. No roll, delayed effect or resistance rounding is automatically calculated.

## Witch tradition artifacts / flying devices

- A broom is a physical item, as are other possible wooden devices such as walking sticks, stools or tables (S. 278, 281). Inventory linking does not infer material suitability.
- Flugsalbe enables the anointed witch's chosen wooden object for one year, one device per batch. Another witch cannot fly it. Loss requires waiting until the next Hexenfest for a replacement (S. 281).
- The device remains an ordinary destructible object and is not a magical weapon; the ointment is magical. Takeoff costs 1 AsP, speed up to 50 Meilen/h, additional load up to 25 Stein besides the witch. Challenging maneuvers require Fliegen (S. 281).
- The artifact card shows only explicitly linked inventory items, missing-item warnings and saved notes, rather than general flight rules or tradition-based flight warnings. Assignment guidance remains in the editor. It does not infer flight readiness from a linked item or tracked SF. Ointment application/expiry tracking is outside this inventory-link implementation.

## Localization

German spell/trick names, properties, traditions and target-category identifiers remain unchanged in storage and display unless an existing verified glossary entry is available. English app labels and concise explanatory summaries are localized, but new domain names are not presented as official English rulebook names based only on this German source. Numeric catalog notation retains AsP, QS, KR, min, h and German distance units. Printed references always refer to this German edition.

## Summoning

- Invocatio Minor/Maior, Elementarer Diener and Dschinnenruf are cast from the Bestiarium tab with the creature's Anrufungsschwierigkeit; prerequisites FW 10/12 (S. 263) are enforced when a ritual is first activated with AP. See [../creatures/bestiary.md](../creatures/bestiary.md).

## Magie chapter update (S. 251–305, Nov 2026)

### Structure
- Special abilities carry a `group` (`characterEntryCatalog.ts`): the Overview shows `general`, `fate` and `karma` only; the Arcana tab shows `magic` (foundation), `staff` (Magierstab), `witch` (Vertrautenbindung, Flugsalbe). Owned custom entries without a group stay on the Overview.
- Sections by tradition, like the curses: **Magierstab** only with Tradition (Gildenmagier), **Hexe** (familiar, Flugsalbe, flying device) and **Hexenflüche** only with Tradition (Hexe), **Elfenlieder** only with Tradition (Elf). If a hero owns entries of a missing tradition, the section stays visible with a warning. Removing a tradition is blocked while its curses or songs remain (staff spells already depend on the tradition).
- New SF **Flugsalbe** (15 AP, S. 281).

### Elfenlieder (S. 274, 283–284)
- Six songs in `magicCatalog.ts` (kind `Elfenlied`, own FW and StF, stored in `stats.spells`). Ritual rules, no modifications, clothing irrelevant. The spell Probe offers a pre-check (Singen or Musizieren per song): its QS adds FP (`extraSkillPoints` in `ProbeDialog`). Melodie der Kunstfertigkeit (crafts +QS) and Zaubermelodie (spells/rituals +1 at QS 1–3, +2 at QS 4–6) start active effects.

### Magierstab (S. 275–278)
- `magicSettings.staffItem / staffActive / staffInHand`. Volume 18 enforced on acquisition (`staffVolumes`). Staff panel: linked item, held toggle, volume bar, one active staff spell (AsP via the normal spend), foci always on.
- Kraftfokus −1 AsP on the cost suggestion (min 1) and Merkmalsfokus +1 on matching spells, both only while held and untransformed (`staffFoci` in `magicRules.ts`). Active Flammenschwert = extra fight weapon (Langschwert values, 1W6+7 TP, magical, AsP reminder).
- Bindung des Stabes is now purchasable: buying it books 2 permanent AsP; undoing the purchase returns them.

### Permanent AsP (S. 251, 262, 352)
- `mana.permanentLoss` / `permanentBuyback`; the maximum drops by the open loss. Arcana summary: record a loss, buy back for 2 AP each (free with AP off), correct a mistaken record. Endpoint `PUT permanent-mana`.

### Spell Probe additions
- Optional Patzer table (2W6, S. 258) and optional Merkmalsproben (S. 252), per-browser toggles (`talentOptions.ts`).
- Formula / gesture omitted −2 each (spells), witch ground distance (−1 per Schritt, max −8) and emotions (±2), ritual site / constellation / clothing / equipment (S. 255, 260, 278).
- **Zauber- und Ritualmodifikationen** (S. 255–256, 261) are tick boxes for spells and rituals: Erzwingen +1, Kosten senken −1, Reichweite erhöhen −1, Zauber-/Ritualdauer erhöhen +1 / senken −1; at most FW/4 (`spellRules().modifications`), each once, erhöhen/senken exclusive, cost changes blocked for fixed costs, range increase blocked for "selbst". The total enters the check as "Zaubermodifikationen" / "Ritualmodifikationen". Curses, songs and (without Merkmalskenntnis) foreign spells get none.
- **Regelhinweis** (`ModificationRules.tsx`, data `modificationSteps` / `modificationLabel` in `magicRules.ts`): collapsible rule note in the spell/ritual check and twice (spells, rituals) in the Arcana casting reference — limit, the five modifications with their effect, formula/gesture −2, the step tables (S. 256 / S. 261) and the restrictions. The note explains steps; the app does not rewrite a spell's cost, range or casting time.
- Verbotene Pforten: part of the cost as LeP (at least 1 AsP) after confirming the Selbstbeherrschung check. Aura verbergen: active effect that blocks spell Probes; ending it adds Verwirrung +1.
- Zauberklinge Geisterspeer success → pick a weapon: active effect "magical weapon" for QS × 3 days.

### Artifacts (S. 266–270)
- Own collection (`models/artifact.model.ts`, deleted with hero/account). Equipment tab → **Magical artifacts** for every hero: Zauberspeicher (1–7 charges), self-recharging (month/week/day), permanent, magical weapon. Activate spends a charge and rolls the stored spell against 14/14/14 with FW = stored FP (no hero modifiers, no Schips). Magical analysis helper with the QS cap (Analytiker +1, Hellsicht spell QS).
- Arcana → **Artefaktmagie** (owners of ARCANOVI): calculator for charges / recharge, iron −2, material (save permanent AsP at 100 S each, max half, or +1), AsP, permanent AsP, price estimate; rolls ARCANOVI then the spell; success creates the artifact on the server (`create-artifact` spends AsP, books permanent AsP, pays material). QS 1 on the ARCANOVI → side-effect roll (1W20 + FP).
- The old "Traditionsartefakte" link list remains only as "Earlier artifact links" while such data exists.

### Decisions
- App decision: permanent AsP of an artifact = 1/10 of **all** AsP spent including the ARCANOVI (rule text, S. 267), rounded normally; the S. 268 recharge example leaves the ARCANOVI out.
- Artifacts live on the Equipment tab (usable by anyone); creation stays in the Arcana tab (user decision, Nov 2026).

## Code

- `server/src/utils/magicCatalog.ts`, `magicRules.ts`: source data and pure rules.
- `server/src/controllers/magicController.ts`, `validations/magicValidation.ts`: ownership-scoped transactions and boundary validation.
- `server/src/models/stats.model.ts`, `views/statsView.ts`: persistence and compatible public defaults.
- `client/src/features/heroes/HeroArcana.tsx`, `magicApi.ts`: sheet, acquisition previews, advancement, notes, AsP and shared ability controls.
