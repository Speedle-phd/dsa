# Handoff — DSA5 hero manager

Snapshot of the work up to Nov 2026. Read this first, then the topic docs it links. Project rules: `.github/copilot-instructions.md` and `.github/instructions/*.md` (kept up to date with the learnings below). Rule knowledge: `docs/dsa5/rules/rulebook-index.md` → topic docs.

The root folder is one git repository for client and server (initialised Nov 2026, the old per-folder repos `dsa_client`/`dsa_server` were dropped); there are no commits yet, so this file and the topic docs are still the main change record. Everything runs in Docker Compose, as production (default) or development (see "Running the app").

## Running the app
Both setups need the root `.env` (copy `.env.example`, set the MongoDB user/password and `JWT_SECRET`). Run the commands from the repo root.

| | Production (default) | Development |
|---|---|---|
| Start | `docker compose up -d --build` | `docker compose -f compose.yml -f compose.dev.yml up -d --build` |
| Stop | `docker compose down` | `docker compose -f compose.yml -f compose.dev.yml down` |
| Open | `http://localhost:8080` (`APP_PORT` in `.env`) | `http://localhost:5173`, API `http://localhost:3000` |
| Client | `vite build`, served by nginx (`client/Dockerfile`, `client/nginx.conf`) | Vite dev server, hot reload (`client/Dockerfile.dev`) |
| Server | bundled with esbuild, `node dist/server.js`, `NODE_ENV=production` (`server/Dockerfile`) | `tsx watch`, `NODE_ENV=development` (`server/Dockerfile.dev`) |
| API | same origin: nginx proxies `/api` to the server; port 3000 is not published | published on 3000, browser calls it directly (CORS) |
| Code changes | need a rebuild (`--build`) | reload automatically (bind mounts) |
| Rate limit | 1000 requests / 15 min per client IP | 2000 / 15 min |
| MongoDB port | not published | `127.0.0.1:27017` for Compass/mongosh |

- `compose.yml` is the production stack; `compose.dev.yml` is an overlay that swaps in the dev images, bind mounts and ports (`!override`). Without `-f … compose.dev.yml` you always get production.
- Both use the same compose project and the same `mongo_data` volume, so heroes and accounts are shared. Run one at a time: starting the other one recreates the `client`/`server` containers. Images are tagged separately (`dsa-*:prod` / `dsa-*:dev`), so switching doesn't rebuild.
- The production server image runs `tsc --noEmit` during the build: a type error fails `docker compose up --build`.
- Behind nginx the server sets `trust proxy` from `TRUST_PROXY` (1 in production, 0 in development) so the rate limit counts per user, not per proxy.
- Production is meant for this machine/LAN over plain HTTP. Putting it on the internet still needs HTTPS (a host proxy or Caddy in front), a strong `JWT_SECRET` and `CLIENT_ORIGIN` set to the public URL.
- Logs: `docker compose logs -f server` (add the `-f compose.yml -f compose.dev.yml` files for development).

## Parties & realtime (Phase 1 of 3, Nov 2026)
Plan: `~/.claude/plans/so-we-might-wanna-wondrous-gem-…md` (Phase 2 shared fight tracker with NPCs, Phase 3 grid battle board are outlined there and re-planned when started).

User decisions: a **party** (Heldengruppe) has one game master; players join with **one hero each** via an **invite link + GM accepts**; the GM sees all accepted heroes live and may apply **game effects** (LeP damage/healing, AsP/KaP, statuses, Zustände, AP awards); each owner chooses per hero what the **other players** see (`private` = name only, `summary` = species/profession, energy bars, Schmerz, statuses/Zustände, `full` = plus the read-only sheet; default from the user setting). The GM always sees everything; pending requests see nothing but their own request.

- **Server**: `models/party.model.ts` (own collection; members `{ userId, charId, statsId, state: pending|accepted, visibility }`, invite code = 128 random bits, unique), `utils/partyRules.ts` (+ test: roles, sheet access, effects permission, roster detail, one active party per hero incl. pending), `utils/partyAccess.ts` (rule shape, socket access), `controllers/partyController.ts`, `routes/partyRoutes.ts` (`/api/parties`: list/create, `GET|PATCH /:id`, `POST /:id/invite-code`, `GET|POST /join/:code`, `POST /:id/members/:charId/accept|deny`, `PATCH|DELETE /:id/members/:charId`, `GET /:id/heroes/:charId/sheet`), `views/partyView.ts` (roster shaped per viewer), `utils/partyCleanup.ts` (hero/account deletion). User setting `settings.defaultPartyVisibility` (`GET|PATCH /api/users/me/settings`).
- **GM effects** reuse the owner endpoints: `adjust-health`, `adjust-mana`, `adjust-karma`, `combat-settings` (GM: `statuses`/`conditions` only, else 403), `experience` load stats through `findStatsForActor` (`utils/statsPersistence.ts`: owner, or GM of the hero's active party). A GM "spend" of AsP/KaP is a plain loss (no casting surcharges, no Mindergeister). Every other stats route stays owner-only (404 for the GM).
- **Realtime**: Socket.IO on the Express HTTP server (`socket/index.ts`, WebSocket only, handshake = the Bearer token, per-socket rate limit), `socket/realtime.ts` (no-op until initialised). Events carry only a **topic** (`hero` + charId, `party` + partyId, `parties`); clients refetch through REST, where privacy is applied. Rooms: `user:<id>` automatic, `party:<id>` via `subscribe` (GM/accepted only). `saveStats` publishes `hero` to the owner and the hero's party after every save; char edits too. Accepting a request joins the player's sockets to the room (`realtime.joinParty`), removal/leaving drops them (`leaveParty`). Production: nginx forwards `/socket.io/` with Upgrade headers.
- **Client**: `realtime/socket.ts` (singleton, token read on every connect, party rooms re-joined on reconnect), `realtime/RealtimeBridge.tsx` (connects with the login, maps notices to query keys in `realtimeTopics.ts`), `features/parties/` (`partyApi.ts`, `PartyMemberCard.tsx`, `GmHeroActions.tsx`), pages `/parties`, `/parties/:partyId`, `/parties/:partyId/heroes/:charId` (compact read-only sheet), `/join/:code`, `/settings`; header links "Parties" and the settings gear.
- App choice (not a user decision): the read-only party sheet is a compact view of the stored values instead of the full hero tabs (those load owner-only resources and have edit controls in ~30 components). Rolling and editing stay on the owner's hero page.
- Gotcha: controlled `<select>`s that start a mutation must read `event.target.value` before calling `mutate` (React resets the select before the mutation function runs).

## Features by tab

### Overview
- Character record, Appearance, Family and the **Chronik** (background, biography; line breaks kept) each have an "Edit" button that opens `HeroEditor` with only that section (`sections` prop); the other fields are saved unchanged. If a hidden stored value fails validation (e.g. an older hero without place of origin), the form expands to all sections and shows the message. Missing optional texts default to "" (heroes from guided creation had no `title` and could not be saved before).
- `useModalKeyboard` keeps the field React's `autoFocus` focused (also under StrictMode's double effects) and returns focus to the opener on close; before, every dialog started on its first button.
- Attribute tiles: advancement controls and a **W20 button → Eigenschaftsprobe** (`AttributeCheckDialog`): difficulty presets ±2/4/6 (S. 19, not the talent presets of S. 24), modifiers from `useCheckState`, Bestätigungswurf on 1/20, Schips. Doc: `character/attributes.md`.
- Resources: LeP/AsP/KaP meters; **maxima are derived on the server** (see "Derived values"). "Edit resources" shows the calculation per resource and keeps only "other modifiers", Zukauf and current values as inputs.
- Rest ("Rasten") → `RegenerationDialog`, computed and saved on the server (`PUT /api/stats/regenerate/:id`). Doc: `character/regeneration.md`.
- Schips: +1, **"Refill all"** (end of adventure, `PUT /api/stats/restore-fate-points/:id`) and the S. 31 occasions.

### Vor- und Nachteile (S. 161–182)
- Derived automatically: SK/ZK (Hohe/Niedrige Seelenkraft/Zähigkeit), Schips max (Glück/Pech, min 0), GS-Grundwert (Flink, Behäbig, Einbeinig halves, rounded up), permanent Blind/Taub/Stumm statuses (locked pills). Breakdowns in the stats editor and under the Kampfwerte.
- Talent maximum (highest probe attribute + 2) is now enforced on AP raises; Herausragende Fertigkeit/Kampftechnik raise it (`skillMaxima` in the stats response).
- Rerolls in the dice dialogs: Begabung, Unfähig (talent Probe), Waffenbegabung (Bestätigungswurf in the fight panel).
- Magic: Wilde Magie botch from 19, Schwacher Astralkörper +1 AsP, Lästige Mindergeister W20 on every AsP spend → `ActiveEffect` with −1 on all checks; Artefaktgebunden / Magische Einstimmung / Einschränkung as spell effects.
- Triggers (Status section): Angst vor (Furcht = level), Lichtempfindlich (Schmerz I), Sensibler Geruchssinn (Verwirrung I), stored in `stats.triggers`. Blutrausch offered after a painful hit. Dunkelsicht/Nachtblind on "caused by darkness" sight. Conditional SK/ZK (poison, disease, magic) listed under the Overview resources.
- Doc: `character/advantages-disadvantages.md` (Decisions: Einbeinig rounding, Unfähig = lowest die).
- Hero tabs: "Arkanes" only with Zauberer, a magic tradition or recorded spells/tricks; "Götterwirken" only with Geweihter, a church tradition or recorded liturgies/blessings (`heroCapabilities.ts`). A hidden tab in `?tab=` falls back to the overview.
- Entry subjects: one text field plus the book's examples as clickable chips below the row; a chip fills the subject and, for Prinzipientreue/Verpflichtungen, the level (`server/src/utils/entrySuggestions.ts`, `DetailInput`/`SuggestionChips` in `SuggestedDetail.tsx`). Used in the entry dialog and the creation wizard.

### Talents
- W20 button per talent → `TalentProbeDialog` (thin wrapper around the shared `ProbeDialog`): difficulty, other modifiers, success chance, three colour-coded W20 (S. 22), FP → QS, Doppel/Dreifach 1/20, retry hint (never auto-applied), Schips (Neuer Wurf, Qualität verbessern).
- All talents are active from FW 0 and can be rolled (S. 25). Until Nov 2026 unset talents (`null`) had to be activated for A–D 1–4 AP (house rule); the user dropped it, `utils/talentMigration.ts` sets old unset talents to 0 on start (paid AP are not refunded). Doc: `skills/skill-checks.md`, `character/experience.md`.
- **Vergleichsprobe** (S. 25–27): check type in the shared `ProbeDialog` (talents and spells): side (active/passive/none), group members' QS, opponent result → winner and net QS (`evaluateOpposed`, client only).
- **Sammelproben** (S. 26–27): section on the Talents tab, saved per hero in their **own collection** (`ExtendedCheck` model). Roll opens the talent/spell Probe with the failure penalty; "Record attempt"; group members' results add to the same pool. The form offers the talent's book examples (interval, attempts).
- **Talente chapter (S. 183–225, Nov 2026)** — doc `skills/skill-checks.md` "Implemented talent rules":
   - Routineprobe (eligibility, "Take routine", honest "Routine" column), optional Verrechnung and Talentgruppenprobe toggles (`talentOptions.ts`, per browser).
   - Talent-specific critical rules (FP = 2×FW / FP×2 min 5); Sammelprobe counts that QS once (user decision).
   - Schip "Eigenschaft verbessern" inside talent/spell Probes (S. 222).
   - `talentDetails.ts`: applications, new applications + unlocking entry, tools, book texts, example modifiers, Sammelprobe rows. Probe setup: application picker (auto Spezialisierung, locked new applications −3 with GM OK), book examples, tools picker with automatic Meister der Improvisation; ⓘ per talent on the Talents tab; Spezialisierung form suggests the talent's applications.
   - Eiserner Wille / Schmerzen unterdrücken as active effects (SK, all-check penalty, Schmerz offset, Betäubung +1 when they end), Anführer round bonus in the fight panel, Falschspielen repeat, Rosstäuscher roll twice, Fischer/Jäger/Sammler food note. Label "Gaukeleien".

### Guided hero creation (Nov 2026, Phases 1–5 of the plan)
- Dashboard "Create hero" → server draft → `/create/:draftId` with a breadcrumb over 9 sections, live AP balance and caps; "Quick create" keeps the old form. Species (4) and all 26 cultures with packages are encoded; professions are named by hand until Phase 2. Doc: `character/character-creation.md` "Implemented guided creation", `character/species.md`, `character/cultures.md`.
- Code: server `utils/creation/` (`experienceCaps`, `speciesCatalog`, `cultureCatalog`, `startTables`, `creationLedger` + test, `creationFinish`), `models/creationDraft.model.ts`, `controllers/creationController.ts`, `routes/creationRoutes.ts`; client `features/creation/`, `pages/HeroCreation.tsx`.
- Professions (Phases 2–3): 16 worldly + 9 caster professions with variants (`utils/creation/professionCatalog.ts`), choice slots, language and curse budgets, package spells/tricks, usual professions per culture. Doc: `character/professions.md`.
- Talents: all start active at FW 0 (or their package value) without activation cost; archetypes Allacaya, Irinja and Gonzalo balance to 0 AP. Entries the hero already has are hidden in the pickers and flagged as duplicates.
- Related fixes: AW and Tragkraft are derived on every load/save (`syncResources`), so created heroes no longer show AW 0; the experience overview shows disadvantage AP as negative costs (net spent), see `character/experience.md` "Display of disadvantage AP".
- Belastung from weight follows S. 348 (every 4 full Stein above KK × 2, at most IV) and is recomputed on every load/save; see `character/conditions.md`.
- Priests (Phase 4): `utils/karmaCatalog.ts` (34 liturgies, 6 ceremonies, 12 blessings), `utils/karmaRules.ts`, `controllers/karmaController.ts`; 6 priest professions with variants; ledger liturgy rows and blessings; Finish writes `stats.liturgies`/`stats.blessings`. Hero tab "Götterwirken" (`HeroKarma.tsx`, `LiturgyProbeDialog.tsx`, `karmaApi.ts`): KaP meter, blessings (1 KaP), liturgy cards, learn/raise, Probe with modifications, ceremony modifiers, KaP suggestion and botch table. Doc: `karma/liturgies.md`.
- Archetypes (Phase 5): `utils/creation/archetypeCatalog.ts` (12 archetypes, `archetypeDraft`), `POST /api/creation/drafts { archetype }` opens on the summary; client `ArchetypeCreateButton` in `CreationDrafts.tsx`. Combat SF can now be bought at creation (`draft.combatAbilities`, ledger `combatAbilities`, `CreationCombat.tsx`). Doc: `character-creation.md`.
- Open: Mirakel; archetype equipment; Mohisch in the language catalog.

### Combat
- Kampfwerte INI tile W6 → starts the **fight panel** (GM-driven, hero side only; state per hero in localStorage `dsa-fights`). Docs: `combat/combat-basics.md`, `combat/ranged-combat.md`.
   - Weapons = equipped items + weapons in a worn Dolch-/Schwertscheide (note: drawing takes an action, Schnellziehen a free action; not counted as held for Einhändiger Kampf, parry bonus or the grip) + Waffenlos. AT/FK with Bestätigungswurf (Kettenwaffen botch from 19), damage (crit ×2), defense penalty per KR (`fight.defensePenalty`), "Take a hit" (TP − RS → LeP on the server), fight log.
   - Situation card (enemy reach/type/size, sight, position, water); defense vs melee / shot (−4) / thrown (−2); Passierschlag; attacked from behind.
   - Ranged: distance from the weapon's range (±2 FK, ±1 TP), size, movement, aiming, into melee; load time (Schnellladen); one arrow/bolt/bullet deducted per shot.
   - Maneuvers via the modifier button on the cards; their TP reach the damage roll. Passive shield/Linkhand PA bonus; two-weapon attacks (Beidhändiger Kampf only for its techniques); Einhändiger Kampf automatic (its +1 TP also when ticked by hand); Großschild AT −1 on the main weapon (S. 367).
   - Two-handed grip toggle for a one-handed weapon held alone: +1 TP, PA −1, not Dolche/Fechtwaffen/Raufen, switch once per KR (`fight.grip`, S. 366).
   - Waffenbalsam +1 TP and "magical weapon"/poison notes come from active effects; ammunition is taken from carried stacks, the Köcher first.
   - Round stances Vorstoß/Verteidigungshaltung, Riposte, Flucht, Hinterhalt (sets Überrascht).
   - Optional Patzer tables (per-browser toggle): weapon damaged/broken/destroyed is stored on the item; lost/stuck/jammed and temporary Schmerz are fight-only.
- **Actions, movement and casting in the fight panel** (Nov 2026): action budget per KR (1 action + 1 free action, S. 228) for the hero and each ally, with "GM: one more action"; movement buttons (free action / action, up to GS); a Magic card casts spells over several KR as a longer action (defending aborts, Selbstbeherrschung check after damage, spell Probe at the end) and uses Zaubertricks. Files: `fightActions.ts` (+ test), `FightTurn.tsx`. Doc: `combat/combat-basics.md` "Action budget", "Casting in a fight".
- **Allies in the fight panel** (Nov 2026): companions, summoned creatures (service Kampf / Kampf gegen mehrere) and Radau brooms (from a successful spell Probe) join with their own INI, attack via the companion attack dialog, defend (VW not lowered by several defenses) and take hits. Companion LeP save on the companion, summon LeP on the `Summon` (`health`). Radau: unbreakable, 2 AsP per KR offered as a button. Files: `fightAllies.ts` (+ test), `FightAllySection.tsx`; server `joinFight`/`fightOver`/`summonHealth` in `summonRules.ts`. Doc: `combat/combat-basics.md` "Allies".
- **Schips in combat:** after AT/FK/PA/AW: Neuer Wurf or the matching "… verbessern" SF (+2); after damage: reroll one W6; per KR: Erster (only at the start of the KR), Verteidigung +4, Zustand ignorieren (applies to every check in that KR via `useCheckState`). Doc: `combat/combat-basics.md`, `character/fate-points.md`.
- Layout below the Kampfwerte: Status pills (left) beside the Zustände table (right), Lebensenergie full width underneath.
- Zustände table with ⓘ tooltips (`conditionInfo.ts`); Berauscht/Trance/Überanstrengung are sheet-only (no core-rule effects).
- **Status panel** (S. 34–36, pills beside the Zustände): 15 on/off statuses stored in `stats.statuses`. Liegend, Fixiert, Bewegungs-/Handlungsunfähig, Blutrausch, Blind and Taub feed the shared check modifiers (roll effects, `targetRule` for Blind, GS overrides); the fight panel applies Eingeengt (weapon reach / shield size), Blutrausch +2 TP and Überrascht (no defense, cleared next KR, **Wachsamkeit** for 1 Schip). Removing Blutrausch adds Betäubung +2. Vergiftet/Krank block LeP regeneration. Doc: `character/conditions.md`.

### Equipment
- **Placements** (`carriedOn`): Angelegt / Lager / Sonstiges always; containers once owned (`features/heroes/containers.ts`, server mirror `utils/containers.ts`). Worn containers (Rucksack, Ranzen, Beutel, Gürtel, Köcher, Scheiden …) only while Angelegt or nested in another usable one; external ones (Truhe, Satteltasche, Packsattel, vehicles) whenever owned. Köcher 20 Pfeile/Bolzen, Scheiden one weapon of their technique, Zunderdose one Zunder pack. Contents weigh where the container is; external containers do not count. Dropping the last container moves contents to Sonstiges. Old placements (Backpack, Belt, Pouch, Saddlebag) stay valid for existing items. Shared `PlacementSelect`.
- Replaced armor is taken off to Sonstiges (`stowPlacement`).
- **Pick up item** (`PickUpDialog`): free; search the store catalog (QS/training variants) or name a custom item; merges into identical stacks.
- **Use up** only on consumables: Alchimicum/herb/poison opens `ConsumeDialog` (see "Store, Alchimica, services"); the items in `utils/storeConsumables.ts` (food, light, bandages, writing material, ammunition … — app choice, user request) open `UseItemDialog` (quantity + confirm). Tools, containers, clothing and weapons have no use button.
- **Equipment packages** (Reise-/Stadt-/Wildnispaket, S. 364–365) are paid once and added piece by piece (`utils/storeBundles.ts`, `contents` in `purchase-equipment`); the pieces match the book's table and add up to its weight. Kleidungspakete stay one item (no pieces listed).
- Damaged and broken weapons (Patzer tables) carry a badge here and in the Combat tab tables (`equipment[].condition`). "Damaged": AT/PA −2 (FK −4); "broken": not usable in fights.
- Wrench button → `WeaponRepair.tsx`: pay the price the GM names (taken from the purse) or a craft check (Metall-/Holz-/Lederbearbeitung, GM modifier). The core rules give neither (user decision). Destroyed weapons are removed by the Patzer result.
- Moving items merges stacks only with the same condition. Doc: `equipment/purchasing.md`.

### Store, Alchimica, services
- Store (`/store`): all of S. 364–381 incl. Alchimica (QS picker, price × QS), Gifte, Heilkräuter, Bücher, Artefakte, Tiere (training variants), Futter, Fahrzeuge; "price varies" rows ask for the agreed price. Purchase dialog (`features/store/StorePurchaseDialog.tsx`): variant, placement, list → market → custom price. Buying Hund/Pferd offers "add as companion". Docs: `equipment/purchasing.md`.
- **Market rate** (`MarketRatePanel`, `heroStore.marketRate`, persisted): one Feilschen Vergleichsprobe per market visit (net QS × 10 %, max 50 %, S. 208) or a manual percentage; applies to list prices until reset. The haggle check is fixed to Feilschen (`TalentProbeDialog fixedApplication`), so a Feilschen specialization's +2 FW applies; Geldwechsel/Buchhaltung have no app effect (the core rules give no exchange rates or fees, regional currencies are in the regional supplements, S. 208, 364).
- **Consumables** (`server/src/utils/consumables.ts`, `PUT consume-item`): Heil-/Zaubertrank roll and heal (capped), Antidot removes Vergiftet on confirmation, timed elixirs/Gulmond/Wirselkraut/weapon balm/poisons become **active effects** (own model `ActiveEffect`, shown by `ActiveEffectsStrip` above the tabs, ended by the player; only the strongest of a kind counts, S. 272). Client applies SK bonus, Gulmond offset, Verwandlung Schmerz, balm TP. Wirselkraut and Medicus treatment are used up by the next LeP regeneration. Doc: `alchemy/alchemy.md`.
- **Dienstleistungen** (`/services`, `pages/Services.tsx`): tabs Medicus / Schmiede / Gasthaus / Weitere; prices owned by the server (`utils/serviceCatalog.ts`, in Kreuzer), bills paid via `purchase-service`. Medicus treatment QS → next LeP regeneration; Schmiede lists damaged weapons (repair dialog); Gasthaus menu board with a bill and "Rest here". Doc: `equipment/services.md`.

### Companions (Begleiter)
- Hund, Pferd, Katze, Kröte, Rabe from S. 360–362 plus custom animals. Full-width cards: LeP/AsP with −/+, Schmerz, attribute and combat tiles with full names, attacks (attack dialog: AT + Bestätigungswurf + damage), talents (shared `ProbeDialog` with the animal's attributes, no Schips), LO + AP tiles, texts, notes, edit/remove dialogs.
- Familiars (SF Vertrautenbindung, one per hero; Katze/Kröte/Rabe or custom): +1 attributes, +10 LeP, +1 RS/SK/ZK, 15 AsP (S. 279); free tricks Zwiegespräch/Hexensinn; other tricks learned one-click from the familiar's own AP pool.
- Schmerz: printed species table for book animals; hero rule (S. 34) for familiars and custom animals (user decision). Rabe Fliegen uses its printed check (MU/GE/KK).
- LO (Loyalität): free number, no rules — the core book doesn't define it; implement effects once the user names the source.
- Doc: `creatures/companions.md`.

### Bestiarium (S. 353–362)
- Hero tab with the 10 core creatures (cards with stat block, loot, behaviour, Schmerz, Jagd shown as "not defined in the core rules"), kind filter, rules section (demons, elementals, counter-elements, manoeuvres, demon spells, tierische Klugheit, summoning). Animals can be added as companions.
- Knowledge check: Tierkunde/Sphärenkunde in the talent Probe, facts revealed by QS (crit: all; botch: GM warning).
- Summoning: Invocatio Minor/Maior, Elementarer Diener, Dschinnenruf via the spell Probe with the Anrufungsschwierigkeit; improvements bought with QS; summoned creatures saved (own model `Summon`) with services, sunrise and dismiss; demon failure table with an optional W20 for the GM. Ritual prerequisites (S. 263) enforced on AP activation.
- Companion attack dialog: Flugangriff and Verbeißen (held bite with automatic bites, +1 TP per KR) when the companion lists them.
- Doc: `creatures/bestiary.md`.

### Magie chapter (S. 251–305, Nov 2026)
- Doc: `magic/spells-and-rituals.md` "Magie chapter update", `alchemy/alchemy.md` "Alchemy tab".
- SF groups: Overview shows general/fate/karmal SF only; Arcana sections by tradition: Magierstab (Gildenmagier), Hexe + Hexenflüche (Hexe), Elfenlieder (Elf); shown with a warning when entries of a missing tradition remain. New SF Flugsalbe.
- Elfenlieder (6, own FW, pre-check QS → FP, song effects), Magierstab panel (volume 18, one active staff spell, Kraftfokus/Merkmalsfokus automatic, Flammenschwert in the fight panel), permanent AsP with buy-back, spell Probe: optional Patzer table and Merkmalsproben, formula/gesture, witch ground/emotions, ritual modifiers and modifications, Verbotene Pforten, Aura verbergen, Zauberklinge → magical weapon.
- Artifacts: own collection, Equipment tab section for every hero (activate vs 14/14/14 with stored FP, charges, recharge, magical analysis); ARCANOVI calculator and creation in the Arcana tab.
- **Alchemy tab** (always, `HeroAlchemy.tsx`, theme hue 318): supplies with Use, lab, recipes (Berufsgeheimnisse), brewing with failure table, analysis.

### Arcana
- AsP box shows the maximum's breakdown; manual spend/recover; Zukauf.
- **Magical foundation:** tradition and magical SF lists plus a **Merkmalskenntnis panel**: leading attribute vs. 15, progress per Merkmal (3 spells at FW 10), "Learn"/"Record" opens the add dialog preselected, invalid legacy entries flagged. Merkmalskenntnis/Merkmalsfokus choose from the 11 core Merkmale (S. 252).
- **Spells, rituals, curses** as cards in one shared grid (sorted by distribution, "Verbreitung" on each card): W20 → `SpellProbeDialog` (foreign −2, target SK/ZK, sustained spells, modification tick boxes + Regelhinweis Zaubermodifikationen (`ModificationRules.tsx`), crit +1W6 FP, AsP suggestion rounded up — Hexe ⅓ — with a "Spend AsP" button); FW ≥ 14 without Merkmalskenntnis shows a hint.
- Zaubertricks, Traditionsartefakte (linked inventory items), casting reference.
- Doc: `magic/spells-and-rituals.md`.

## Derived values (server)
- `utils/energyRules.ts`: LeP max = species value + 2 × KO + Hohe/Niedrige Lebenskraft + other + Zukauf; AsP/KaP max = 20 + Leiteigenschaft of the owned tradition (highest if several) + Astral-/Karmalkraft levels + other + Zukauf (S. 56–57, 166, 174; tests use the S. 57 examples).
- Applied in `statsPersistence.ts` (`syncResources` on `findStatsForUser` and `saveStats`, also clamps current and recomputes Schmerz), in the recalculation paths of `statsController.ts`, and on read in `views/statsView.ts` (so old heroes show correct values).
- Doc: `character/derived-values.md`.

## Shared building blocks (reuse these)
- Design (Nov 2026, after `../chore_app`): tokens, Geist, `PageHeading`, header pill navigation, hero tab pill bar with icons, `SectionNav` (section links with scrollspy: rail ≥ 1100px, chip row below). Details and rules in `.github/instructions/ui-patterns.instructions.md` → "Design system". The pre-redesign stylesheet is not kept; this file and the instructions are the record.
- Floating buttons (bottom right, mounted in `App.tsx`): dice launcher and "Back to top" (`ScrollToTopButton`, appears after one screen height / at least 400 px, centred above the launcher, focuses `<main>` after scrolling up). Both tuck away while scrolling down on phones (≤ 760 px); scroll hooks in `components/scrollHooks.ts`.
- Dice: `components/diceEngine.ts` (`throwColoredDice`, `throwD20s`; crypto fallback). The 3D dice exist as W4/W6/W8/W10/W12/W20/W100; W2 and W3 are thrown as a W6 and halved/thirded (`physicalDie`, e.g. Schnabel 1W3−1), so every roll is visible. Single W20 with confirmation: `features/heroes/d20.ts` (`rollD20`).
- 3W20 checks: `ProbeDialog.tsx` (`attributes`, optional `check`, `fate`, `extraSources`, `setup`, `criticalBonus`, `renderResult`).
- Schips: `fate.ts` (`useFatePoint`), `FateActions.tsx`; rule mirrors in `combatRoll.ts` (`improveRoll`) and `skillCheck.ts`.
- Modifiers: `checkState.ts` (`useCheckState`, `useSpellCheck`; honours Zustand ignorieren). `CheckValue.tsx` (`ModifiedValue`, `CheckModifierButton`).
- Entries: `CharacterEntryList.tsx` (+ `AddCharacterEntryDialog` for preselected entries).
- Breakdown texts: `energy.ts`. Dialog keyboard: `useModalKeyboard` (topmost dialog only).
- Server endpoints added over the sessions: `spend-fate-point`, `restore-fate-points`, `regenerate`, `adjust-mana`, `companion-reference`, `companions` (GET), `add-companion`, `update-companion`, `companion-resources`, `companion-trick`, `remove-companion-trick`, `remove-companion`, `extended-checks` (GET), `add-extended-check`, `extended-check-attempt`, `remove-extended-check`, `use-ammunition`, `weapon-condition`, `repair-weapon`, `active-effects` (GET), `consume-item`, `active-effect`, `purchase-service`, `summons` (GET), `add-summon`, `summon-action`, `ability-effect`, `permanent-mana`, `artifacts` (GET), `add-artifact`, `update-artifact`, `artifact-action`, `create-artifact`, `brew-elixir` (all under `/api/stats/…/:id`), plus `service-reference` and `bestiary-reference` (GET, registered before `/:id`). `combat-settings` also accepts `statuses` and `triggers`; `adjust-mana` accepts `spiritRoll` and returns `spend`.
- Pricing/placement helpers: `utils/storePricing.ts` (`catalogEntry`, `equipmentDisplayName`, `withRate`, `haggleRate`), `features/heroes/containers.ts`, `components/QuantityStepper.tsx`.

## Data model
- `stats.model.ts` is large (~45 top-level fields). New records with their own lifecycle get their own model (`models/extendedCheck.model.ts`, `models/activeEffect.model.ts`, `models/companion.model.ts`, keyed by `statsId` + `userId`); equipment entries carry an optional `quality` (elixir QS); rule in `.github/instructions/typescript.instructions.md`.
- **Companions** have their own collection (Nov 2026, user OK). Companion endpoints return `{ companions }`, `GET /api/stats/companions/:id` lists them, the client keeps them under the query key `['companions', statsId]` (`companionsKey`). Old `stats.companions` arrays are moved on server start by `utils/companionMigration.ts` (keeps `_id`s, idempotent, then unsets the field).
- **Equipment stays in `stats`** (decision): Belastung, worn armor/RS/BE, the Unterkleidung rule and check modifiers read it on every load, and purchase/repair/consume/ammunition change purse + equipment + burden + wornArmor in one atomic save. Splitting it would need multi-document transactions (replica set). Spells are a possible later candidate.
- Deleting a hero removes its stats, Sammelproben, companions, summons, artifacts and active effects and takes it out of its party; deleting an account removes all of them, deletes the parties it led and its memberships (`accountDeletion.test.ts`).
- New model `models/artifact.model.ts` (by `statsId` + `userId`); `stats.mana.permanentLoss/permanentBuyback`; `magicSettings.staffItem/staffActive/staffInHand/flyingDevice`.

## Verify
- Server: `cd server && npm run build && npx vitest run` (600 tests passing incl. 5 Socket.IO integration tests, Nov 2026). In the dev container `storeCatalog.test.ts` and `alchemy.test.ts` fail to import the client catalog (not mounted); run them with `docker compose -f compose.yml -f compose.dev.yml run --rm --no-deps -v <repo>\client:/client:ro server npx vitest run src/utils/storeCatalog.test.ts src/utils/alchemy.test.ts`. If every test file fails with "Cannot read properties of undefined (reading 'config')", the shell's working directory has a lowercase drive letter (`c:\`): run it from PowerShell after `Set-Location 'C:\Users\…\dsa\server'`.
- Client unit tests: 146 (packages, application glosses, containers, haggling, combat situation, skill check rerolls/routine/critical rules, companion manoeuvres, magic and alchemy rules, dice conversion, tab visibility).
- Client: `cd client && npm run test && npm run build && npm run lint` — lint has **two pre-existing errors** in `conditionInfo.ts` (lines 103 and 155: a literal non-breaking space before `${info.page}`; replace with ` `). The file was being edited elsewhere, so it was left alone.
- Browser: Playwright (`playwright-core` + installed Edge), scripts outside the repo; see "Browser verification" in `.github/copilot-instructions.md`. Party features need several browser contexts (GM + players, each with its own token) and are checked live without reloads.

## Test data (local DB)
- Account `playwright-test@example.com` / `Playwright!2026`, hero "Alrik Testheld".
- Combat: Langschwert + Holzschild + Lederrüstung equipped, Dolch and Kurzbogen carried (not equipped), no arrows; Schwerter 12; 17/27 LeP (Schmerz I); no statuses, Betäubung 0; purse empty; no combat SF, craft talents at FW 0.
- Scripts that change test data back it up first and restore it (equipment via `PUT /api/stats/update/:id { equipment }`, statuses/conditions via `combat-settings`, purse via `adjust-purse`).
- Recorded without AP: Zauberer, Tradition (Gildenmagier), Hohe Astralkraft II, Hohe Lebenskraft I, Vertrautenbindung, a deliberately invalid "Merkmalskenntnis (Feuer)" (shows the warning).
- Spells: Radau 14, Horriphobus 10, Bannbaladin 10, Respondami 14, Motoricus 4, Ignifaxius 7 (KL 13 → no Merkmalskenntnis purchasable with AP on).
- Companions: dog "Rex" (7/13 LeP, LO 12, AP 30), familiar cat "Mira" (knows Dinge erspüren, Erster unter Gleichen).
- Species LE value is stored as 0 (old test data; a Mensch would have 5).
- Delete the account when no longer needed.

## Gotchas
- Client files that export components may only export components (`react-refresh/only-export-components`): put hooks and helpers next to them in a `.ts` file (e.g. `fightHelpers.ts`).
- `.probe-difficulty-presets` is a fixed 7-column grid for the difficulty numbers only. Text choices (check type, side, opponent result, attempt presets) use `.probe-segmented`.
- **Vite sometimes misses writes to `index.css`** — touch the file or restart `npm run dev` before debugging CSS.
- Rate limit: 2000 requests / 15 min in development, 1000 in production (`server.ts`); logins are limited separately → reuse one token in scripts.
- Fight log: values named `before`/`after` are rendered as a LeP change; use other names for other log values.
- `.section-header` layout is only styled inside `.hero-arcana` (its h2/h3 weights are global); other tabs use `.section-heading` (icon + eyebrow + h2, button with `.section-action`). A new tab wrapper needs its own `display: grid; grid-template-columns: minmax(0, 1fr); gap` (like `.hero-overview, .hero-alchemy`) so wide tables can't widen the page.
- `minmax(0, 1fr)` grid cells let content overflow into neighbours (seen in spell name cells) — use `min-content` where content must not shrink.
- Translation file is appended to by hand; keep it valid JSON and remove keys a change makes unused.
- The client has Vitest for pure rule code; components are still checked in the browser.
- Ranged sight 1 is −2 (table S. 242), not −1 as in Geron's example (S. 241). User decision.
- Express routes: static GET paths like `/service-reference` must be registered before `/:id`.
- Metal armor without equipped "Unterkleidung für Metallrüstungen" gets BE +1 (S. 374); test fixtures with metal armor include it.

## Open ideas / next steps
1. Liturgies (reuse `ProbeDialog` + KaP like the spell Probe).
2. Optional Patzer table for spells (S. 258); Reiterkampf (S. 239–240, 242).
3. LO effects and non-familiar companion AP rules once the user names the source (e.g. Aventurisches Kompendium / Bestiarium).
4. Real effects for Berauscht / Trance / Überanstrengung once a source is given.
5. Familiar advancement cost tables (currently values are edited by hand).
6. Clean up or delete the Playwright test account.
10. Parties Phase 2 (shared fight tracker with NPCs) and Phase 3 (grid battle board): see the plan file named in "Parties & realtime".
7. Grundregeln still open (S. 15–37, not chosen yet): optional rules Kein Bestätigungswurf (S. 20) and Alternative Eigenschaften KL/IN/IN (S. 23); Zustand decay over time; attribute value ratings (S. 19); keeping the retry penalty for 24 h (S. 25); Sammelproben with several skills (S. 26).
8. Possibly extract spells from `stats` (equipment stays, see "Data model").
9. Alchemy brewing/analysis checks (S. 271–272), poison and disease progression, server-side validation of store item prices, migrating legacy placements.
10. Talente chapter leftovers: book texts in `talentDetails.ts` are German only; Heilkunde Wunden self-treatment (QS LeP / ignore Schmerz, S. 209) and the Wildnisleben regeneration ±1 are only shown as text; Selbstbeherrschung's critical (ignore Schmerz up to III for a day) is text only; Eiserner Wille/Schmerzen unterdrücken were checked by unit tests, not yet in the browser (the test hero doesn't own them).
11. Magie chapter leftovers: brewing/ARCANOVI happy paths were checked by unit tests, not end-to-end with the test hero (no lab, recipe or ARCANOVI); poisons/herbs have no brewing; Freundschaftslied's permanent AsP is recorded by hand; illusion/transformation size rules (S. 258–259) are text only. Liturgies: Mirakel not implemented (see `karma/liturgies.md`).
12. Begabung/Herausragende Fertigkeit for spells (the catalog parameter accepts talents only); Bann des Eisens (S. 255) so Eisenaffine Aura can apply; climate rules for Hitze/Kälte.
