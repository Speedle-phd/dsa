# NSC: Werteblock, Generator und Kampf

source: DSA5 Regelwerk, S. 34, 36, 228, 231, 233, 245–250, 354

## Summary

- Every published adventure prints NPCs in the stat block format of S. 354 (same as the bestiary):
  - `MU KL IN CH / FF GE KO KK`
  - `LeP AsP KaP INI x+1W6`, then `SK ZK AW GS` (or `VW` for non-humanoids)
  - one line per weapon: melee `Name: AT n PA n TP xWy+z RW kurz|mittel|lang`; ranged `FK n LZ n TP … RW a/b/c`; natural attacks without PA
  - `RS/BE x/y (armour)`, `Aktionen: n (max. 1 × Biss)`
  - labelled sections: Sonderfertigkeiten, Vor-/Nachteile, Talente, Zauber, Kampfverhalten, Flucht, `Schmerz +1 bei: a, b, c, 5 LeP oder weniger`, Anzahl, Größenkategorie, Typus, Beute, Sonderregeln
- Printed NPC values follow the hero rules exactly (checked on sample blocks):
  - LeP = species LE + 2 × KO
  - INI = (MU + GE)/2 − BE
  - AW = GE/2 − BE
  - GS = species GS − BE
  - Belastung lowers AT, defenses, INI and GS by its level, not FK (S. 36)
- **Schmerz** (S. 34): one level each at ≤ ¾, ≤ ½, ≤ ¼ of the LeP and at ≤ 5 LeP; a stat block may print its own thresholds. Each level gives −1 on AT, PA, AW and checks. Schmerz IV means unable to act. Demons and elementals feel no Schmerz (S. 355, 358).
- **Maneuvers**, per level used (S. 247–250):

  | Maneuver | Attack | Effect on a hit |
  |---|---|---|
  | Finte | AT −1 | the target's defense −2 |
  | Wuchtschlag | AT −2 | TP +2 |
  | Präziser Stich (Dolche/Fechtwaffen) | AT −2 | TP +2 |
  | Präziser Schuss/Wurf | FK −2 | TP +2 |
  | Hammerschlag | AT −2 | TP +1W6; a failure grants a Passierschlag |
  | Todesstoß | AT −2 | TP +1W6; a failure grants a Passierschlag |

- **Creatures** (S. 354):
  - "Aktionen: 2" allows two attacks per KR, with per-attack limits ("max. 1 × Biss")
  - VW is not lowered by several defenses
- The core rules print **no NPC tables** (no roles or experience levels for NPCs, S. 383–391).

## Decisions

- User decisions (Nov 2026):
  - stat blocks are pasted, generated, or taken from the bestiary
  - no adventure content is bundled; parser tests use invented blocks
  - the parser stays generic (German and English labels)
  - a GM NPC library across parties
  - NPCs fight with weapons + maneuvers, Schmerz from LeP, actions + defenses, flight and behaviour hints
- App choices, not user decisions:
  - **Generator** roles (Bürger, Kämpfer, Wache, Schütze, Schurke, Zauberkundige) and experience levels (schwach … gefährlich) are spreads of attributes and combat technique values. They are not rules; every derived value comes from the hero rules.
  - **One maneuver per NPC attack.** The GM adds anything else as a situational modifier.
  - **Finte modifier on a miss.** The modifier is sent only with a successful attack; a miss needs no defense.
  - **+1W6 of Hammerschlag/Todesstoß** is added only to W6 damage dice; with other dice the GM adds it by hand.
  - **Flight.** "Flucht: Verlust von n % der LeP" becomes a LeP threshold (floor of max × (1 − n %)). Other flight texts stay text. The fight only warns, and the GM decides.
  - **Schmerz IV.** An NPC unable to act is skipped like a downed one, but it can still be attacked. It cannot defend.
  - **Per-weapon limits** count only for NPCs with more than one action.

## Code

- Server:
  - `server/src/utils/npcRules.ts`: sheet type, `npcWeapons`, `npcPain`, `fleeThreshold`, `npcAttackTurn` (+ test)
  - `server/src/utils/npcGenerator.ts`: `deriveNpc` (+ test)
  - `submitAttack` (`defenseModifier`, `weapon`) and `cannotAct` in `controllers/encounterController.ts`
- Client:
  - `client/src/features/npcs/statBlockParser.ts` (+ test)
  - `npcManeuvers.ts`: maneuver table and level parsing (+ test)
  - `npcSheet.ts`: `npcPainLevel`, `draftWeapons`
  - `npcPresets.ts`: generator roles (+ test)
  - `features/encounter/GmCombat.tsx`: NPC attack form and NPC defense
  - `NpcFightHints.tsx`
