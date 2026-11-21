# Bestiarium

source: DSA5 Regelwerk, S. 200, 205, 262–265, 300, 353–362

## Summary

- The core rules print 10 creatures: demons Gotongi, Heshthot (S. 356–357), Irrhalk (S. 357–358); elementals Feuergeist, Feuerdschinn (S. 359); animals Hund, Pferd (S. 360), Katze, Kröte (S. 361), Rabe (S. 362). More are in the Aventurischer Almanach / Aventurisches Bestiarium (not available); enter those as custom companions.
- Stat block fields (S. 354): Eigenschaften (KL "t" = tierische Klugheit), LeP/AsP/KaP, INI, RS, SK, ZK, GS, AT/PA/AW or VW (non-humanoids; not lowered by several defenses), FK/LZ, TP, RW, Aktionen (+ per-attack limits), Vor-/Nachteile, SF, Talente, Zauber, Anzahl, Typus, Anrufungsschwierigkeit, Größenkategorie, Beute, Kampfverhalten, Flucht, knowledge facts per QS, Jagd modifier, Sonderregeln.
- Tierische Klugheit vs. human KL (S. 355): 0→0, 3→1, 6→2, 9→3, 12→4, 15→5.
- Demons (S. 355–356): no conditions; mundane weapons half TP (halve, then RS); weapons of the opposing god double TP; other consecrated and magical weapons normal; immune to Einfluss/Heilung/Illusion/Verwandlung, SK counts again against other spells (as extra RS against damage spells); immune to poisons/diseases; no liturgies; defend several times without Schips. Schmerz: no effect.
- Elementals (S. 358): as demons, but consecrated weapons also deal half; magical and counter-element weapons normal; immune to their own element; counter-element damage spells ignore RS; djinns know all Elementar spells of their element at FW 12 (14/14/14). Counter-elements Feuer–Wasser, Luft–Erz, Humus–Eis (S. 359).
- Demon spells Große Verwirrung and Dunkelheit (S. 355) are used by demons only.
- Special manoeuvres (S. 362): Flugangriff (AT −2, +2 TP, 8 Schritt approach, GS 4, defender's Passierschlag on a miss, AT −6 against the flyer this KR on a hit, no Finte); Verbeißen (bite AT −2; undefended → automatic bites, +1 TP per further KR, victim Fixiert, own defense 0). A creature has them only when its stat block lists them (core: Hund Verbeißen, Irrhalk Flugangriff; the Rabe lists none).
- Knowledge (S. 200, 205, 354): Tierkunde for animals (domestizierte Tiere / Wildtiere / Ungeheuer), Sphärenkunde for demons and elementals, Magiekunde/Pflanzenkunde for others. QS 1/2/3+ reveal the printed facts; critical = everything; botch = something dangerously wrong (GM).
- Summoning (S. 262–265): Invocatio Minor (lesser demons), Invocatio Maior (horned demons), Elementarer Diener (elemental spirits), Dschinnenruf (djinns). The ritual check is modified by the Anrufungsschwierigkeit (Gotongi 0, Heshthot −3, Irrhalk −4, Feuergeist −1, Feuerdschinn −3; Mirhiban example +1 −3 = −2). Success: 1 service + 1 per QS; each QS can buy one improvement instead (each once). Every sunrise costs one service; at 0 the creature leaves. Kampf against several enemies and Wache need 2 and use all services. Failed demon summoning: GM rolls 1W20 (+15 on a botch) on the failure table. Prerequisites (S. 263): Invocatio Minima FW 10 → Minor, Minor FW 12 → Maior, Manifesto FW 10 → Elementarer Diener, Elementarer Diener FW 12 → Dschinnenruf.
- Hunting: each animal has a Jagd modifier, but the core rules give no hunting procedure. Shown, not used.

## Decisions

- Hero tab "Bestiarium"; actions: knowledge check, summoning, companion manoeuvres. Loot stays informational (user decision, Nov 2026). Summoned creatures and companions now fight as allies in the fight panel, incl. the half-TP rule as a toggle and LeP saved on the summon (user decision, Nov 2026; see [../combat/combat-basics.md](../combat/combat-basics.md) "Allies").
- App choice, not a user decision: improvements on a creature with a single VW: "+2 PA" raises the VW, "+2 AW" has no effect.
- App choice, not a user decision: Verbeißen: the bite that holds gets +0 TP, the next KR +1, then +2 …; the held state lives in the attack dialog only.
- App choice, not a user decision: a running Kampf-against-several or Wache keeps the summoned creature until it is dismissed; Wache ignores sunrise.

## Code

- Server: `utils/bestiaryCatalog.ts` (creatures — animals reuse `companionSpecies` —, creature rules, summoning tables), `utils/summonRules.ts` (services, improvements, sunrise), `utils/magicRules.ts` `missingRitualPrerequisite`, model `models/summon.model.ts` (`statsId` + `userId`), `controllers/summonController.ts`, `validations/summonValidation.ts`. Endpoints: `GET /api/stats/bestiary-reference`, `GET summons/:id`, `PUT add-summon/:id`, `PUT summon-action/:id` (service / sunrise / dismiss / join-fight / fight-over / health). Tests: `bestiaryCatalog.test.ts`.
- Client: `HeroBestiary.tsx` (tab), `bestiaryApi.ts`, `companionManeuvers.ts` (+ test) used by `CompanionAttackDialog.tsx`.
