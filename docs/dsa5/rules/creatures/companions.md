# Begleiter & Vertrautentiere

source: DSA5 Regelwerk, S. 34, 227–234, 278–280, 354–362

## Stat blocks (S. 354–362)

- The core rulebook has stat blocks for five animals: Hund, Pferd (S. 360), Katze, Kröte (S. 361), Rabe (S. 362). Further animals live in Aventurischer Almanach / Aventurisches Bestiarium (not available here); those are entered as **custom animals**.
- Fields: Eigenschaften (KL marked "t" = tierische Klugheit, S. 354–355), LeP, INI (value + 1W6), VW (single defense value; not lowered by multiple defenses, S. 354), SK, ZK, GS (ground/air), RS, Aktionen, natural attacks (AT, TP, RW), talents with FW, advantages, special abilities, special rules, Größenkategorie, Schmerz table.
- Animal talents use the usual check attributes (verified for every printed triple). Exception as printed: Rabe Fliegen 12/10/9 = MU/GE/KK, not MU/IN/GE (S. 362). "Keine Probe erlaubt" (dogs/horses climbing) is stored as FW empty.
- Special manoeuvres Verbeißen and Flugangriff (S. 362) are options in the companion attack dialog when the companion's special abilities list them (see [bestiary.md](bestiary.md)).

| Species | LeP | Schmerz at ≤ LeP (+levels)   |
| ------- | --- | ---------------------------- |
| Hund    | 13  | 10, 7, 4, 1 (+1 each)        |
| Pferd   | 65  | 49, 33, 16, 5 (+1 each)      |
| Katze   | 10  | 8, 6, 4, 2 (+1 each)         |
| Kröte   | 2   | 1 (+4)                       |
| Rabe    | 5   | 4, 3, 2, 1 (+1 each)         |

## Familiars (S. 278–280)

- Requires SF Vertrautenbindung (20 AP, Tradition Hexe; other traditions only by GM). Only one familiar; a new one at the earliest one month after the old one died. Core familiar species: Katze, Kröte, Rabe.
- Bonuses: all Eigenschaften +1, +10 LeP, +1 RS, +1 SK, +1 ZK, 15 AsP. Regeneration as for heroes.
- Own AP: ¼ of the AP the witch gains after creation (not deducted from her). They can raise attributes, talents, LE/AE and natural-weapon combat techniques (category C) like heroes; combat SF at GM discretion.
- Tricks: no check, one action, count as QS 1 for antimagic. Known from the start: Zwiegespräch, Hexensinn. Others: Dinge erspüren 10, Erster unter Gleichen 5, Fluchbote 15, Kraftraub 15, Stimmungssinn 20, Tiersinne 10, Ungesehener Beobachter 35 (all species); Krötengift 10, Krötenschlag 25, Tarnung 10 (Kröte only).

## Implementation

- Server: `utils/companionCatalog.ts` (species, probes, familiar bonus, tricks), `utils/companionRules.ts` (effective values, Schmerz, check targets, available tricks), `controllers/companionController.ts`, `validations/companionValidation.ts`. Stored in their own collection (`models/companion.model.ts`, by `statsId` + `userId`; base values, familiar bonuses are added in the controller's view as `effective`).
- Endpoints: `GET /api/stats/companion-reference`; `PUT /api/stats/add-companion|update-companion|companion-resources|companion-trick|remove-companion-trick|remove-companion/:id`.
- Client: Companions tab (`HeroCompanions.tsx`): cards with LeP/AsP meters (−/+), Schmerz, attributes, combat values, attacks (`CompanionAttackDialog`: AT with Bestätigungswurf, damage, crit ×2), talents (shared `ProbeDialog` with the companion's attributes, no Schips, Schmerz as modifier), familiar tricks with the familiar's AP pool (header AP switch applies), edit dialog for all base values.
- Not automated: defense rolls (GM-driven), advancement cost tables for familiars (values edited by hand), trick AsP costs (adjust AsP manually), Patzer consequences, death/replacement waiting time.

### Decisions

- Book animals + custom animals with hand-entered values. User decision, Nov 2026.
- Familiars: bonuses automatic, tricks bought from the familiar's own AP pool, other raised values edited by hand (no animal advancement cost engine). User decision, Nov 2026.
- Rollable: talents, attacks and damage. User decision, Nov 2026.
- App choice, not a user decision: companion checks offer no Schips (the stat blocks, S. 360–362, and the familiar rules, S. 278–280, list no Schicksalspunkte). Confirm with the user if this should change.
- Schmerz: printed species table for normal book animals; hero rule (S. 34: ¾, ½, ¼ of max LeP and ≤ 5 LeP) for familiars (+10 LeP makes the printed table unfit) and custom animals. User decision, Nov 2026.
- AP: every companion has an AP pool (total/spent/available). Familiars get ¼ of the witch's later AP (S. 279); for other animals the core rules give no AP, so the pool only records what the GM awards. User decision, Nov 2026.
- LO (Loyalität): shown in the header of the official animal sheet (Tierbogen) but not defined in the core rules. Stored as a free number per companion (empty = not set), no rules attached. User decision, Nov 2026; implement effects once the user names the source.
- App choice, not a user decision: at Schmerz IV the companion's roll buttons are disabled (S. 34: Schmerz IV = handlungsunfähig; heroes may keep acting with Selbstbeherrschung, animals have no such option in the app).
