# Kampfablauf: Kampfrunde, Initiative, Angriff, Verteidigung, Schaden

source: DSA5 Regelwerk, S. 226–236

## Summary

- A Kampfrunde (KR) lasts 2–5 s. Per KR each fighter gets 1 Aktion, 1 freie Aktion and any number of Verteidigungen (S. 227–228).
- INI is rolled once per fight and keeps its order for the whole fight (S. 226–227).
- Sequence: choose target → Attacke → Verteidigung (PA or AW) → TP − RS = SP (S. 229–234).
- Only heroes and persons with Schips may defend more than once per KR (S. 232).

## Values / formulas

```
INI (fight) = INI-Basiswert + 1W6 ± mods (e.g. −Belastung)
order: INI desc → INI-Basiswert desc → 1W6 roll-off (repeat until decided)
attack hits: W20 <= AT (or FK)
defense:     W20 <= PA or AW − 3 × (defenses already made this KR)
SP = max(0, TP − RS)
TP = weapon dice + weapon bonus + Schadensbonus
```

Actions (S. 228):

- Aktion: attack, ranged attack, move up to GS Schritt, draw a weapon, reload (may take several actions), cast a spell or liturgy (several actions).
- Freie Aktion: a short shout, drop an item, stand up from a chair, throw yourself down, turn around, move up to GS (only on your INI turn).
- Sprint = Aktion + freie Aktion → up to 2 × GS Schritt (S. 229).
- An action may be delayed; an unused action is lost at the end of the KR (S. 227).

Longer actions (S. 228–229): defending breaks them; a disturbance needs Selbstbeherrschung (Störungen ignorieren). Modifiers: tap on the shoulder +3; Schmerz −level; the caster takes damage: −SP/3 (min 1).

Angriffsdistanz: more than 2 Schritt away = not in melee (S. 230).

Reichweite (AT modifier for the shorter weapon, S. 230–231):

| Attacker \ Opponent | kurz | mittel | lang |
| ------------------- | ---- | ------ | ---- |
| kurz                | –    | −2     | −4   |
| mittel              | –    | –      | −2   |
| lang                | –    | –      | –    |

Critical results in combat (Bestätigungswurf with the same modifiers):

| Roll               | Confirmed                                                   | Not confirmed           |
| ------------------ | ----------------------------------------------------------- | ----------------------- |
| AT 1               | defender's value halved (rounded up), TP incl. mods doubled | defender's value halved |
| Verteidigung 1     | immediate Passierschlag                                     | normal defense          |
| AT/Verteidigung 20 | Patzer: 1W6+2 SP to self (optional table 2W6, S. 231, 234)  | normal failure          |

## Edge cases

- One defense per attack. The −3 per extra defense applies to all defense types and resets at the start of each KR (S. 232).
- A defense whose value drops to ≤ 0 cannot be used; another type with a value > 0 still can (S. 232).
- Non-humanoid creatures always defend with their full value (S. 232).
- Ranged attacks and attacks of large creatures: dodge (AW) or active shield parry only (S. 227, 236).
- Schmerz from LeP loss and dying at ≤ 0 LeP: see [../character/conditions.md](../character/conditions.md) (S. 234).
- Fechtwaffen: defense against them −1 (S. 235).

## Open questions

- None.

## Implemented fight panel (GM-driven, hero side only)

- Combat tab → Kampfwerte: the W6 button next to INI starts a fight with INI = Basiswert + modifiers + 1W6 (S. 226). The fight (INI, KR, defenses this KR, log) is stored in this browser per hero until "End fight".
- Weapons: items placed "Equipped" in the inventory plus Waffenlos (1W6, GE/KK 14, S. 367). AT/FK/PA use the same effective values as the sheet; active shield parry uses twice the shield PA modifier (S. 236).
- Rolls: W20 with automatic Bestätigungswurf on 1/20 (S. 231–233); Kettenwaffen attacks botch from 19 (S. 235); a confirmed AT crit doubles TP incl. all modifiers. Defense penalty accumulates per KR (`fight.defensePenalty`: +3 per defense, after a ranged-defense crit 0 or 2, S. 244), halved (rounded up) after a critical enemy attack.
- Enemies are not simulated: the GM decides whether an enemy defends and rolls enemy TP. "Take a hit" applies TP − RS of the worn armor as SP to LeP on the server.
- Schips (S. 29–30, 220–222): after an AT/FK/PA/AW roll Neuer Wurf or the matching "… verbessern" SF (+2); after a damage roll, reroll one W6; per KR: Erster (only before anything else happened in the KR), Verteidigung +4 (also in the defense values and chips) and Zustand ignorieren. Stored per KR in `fight.fate`. Details: [../character/fate-points.md](../character/fate-points.md).
- **Situation card** (`fight.situation`, inputs from the GM): enemy weapon reach (S. 230–231: shorter weapon −2/−4 AT), enemy weapon type (defense −1 vs Fechtwaffen; PA −2 vs Kettenwaffen and the shield bonus only once; Dolche/Fechtwaffen cannot parry Ketten-, Stangen-, Zweihandwaffen unless Kreuzblock + two weapons, S. 235, 248), enemy size (winzig −4 AT; groß: only shield parry or dodge; riesig: only dodge, S. 239), sight 1–4 (−1/−2/−3, level 4 AT halved and defense only on a 1, S. 239), advantageous position (+2 AT and defenses, S. 238), water (−2/−6 AT and PA, no ranged under water, S. 239).
- **Defense card:** incoming melee / shot (−4) / thrown (−2): against ranged only dodge or an active shield (S. 243–244); attacked from behind −4 (S. 238); Riposte (S. 249).
- **Passierschlag** option: AT −4, no maneuvers, no crit or botch (S. 237). Failed Hammerschlag/Todesstoß/Sturmangriff, critical defenses and failed flight point to it.
- **Maneuvers** are chosen with the modifier button on the cards (per technique). Their TP go into the damage roll: Wuchtschlag/Präziser Stich/Schuss +2 per level, Hammerschlag/Todesstoß +1W6, Sturmangriff +2 + ½ GS, Entwaffnen/Zu Fall bringen/Wurf 1W3, Einhändiger Kampf +1 (S. 247–250). Finte shows the enemy's −2/level defense as a note.
- **Weapons:** passive parry bonus of an equipped shield or Linkhand (+1, Klingenfänger +1 more), only the highest (S. 233, 248, 366), also on the sheet. Two-weapon attack (S. 238): both −2 (Beidhändiger Kampf I −1, II 0), off hand −4 more unless Beidhändig, defenses this KR likewise except with a shield; a botch on the first attack cancels the second. Einhändiger Kampf applies automatically with a single Fecht/Schwert weapon (S. 247). An equipped Großschild costs the main weapon AT −1 (S. 367). A one-handed melee weapon held alone may be gripped with both hands: +1 TP, PA −1, not for Dolche/Fechtwaffen (S. 366; app choice: not for Raufen either); the grip toggle (`fight.grip`) switches at most once per KR. Waffenbalsam adds +1 TP from QS 3 (S. 274).
- **Round stances** (S. 250): Vorstoß / Verteidigungshaltung declared before anything else in the KR (`fight.stance`), read by `useCheckState`.
- **Flucht** (S. 237): Körperbeherrschung (Kampfmanöver) − enemies in reach; result text GS or GS/2 + Passierschlag. **Hinterhalt** (S. 237): Sinnesschärfe as a Vergleichsprobe (passive); a lost contest offers "Set Überrascht".
- **Optional Patzer tables** (S. 231–232, 234, 243, 244; per-browser toggle `dsa:fight:patzer-tables`): 2W6 result with one-click effects: weapon damaged/broken/destroyed on the item (server, `PUT /api/stats/weapon-condition/:id`; repair `PUT /api/stats/repair-weapon/:id`), lost/stuck/jammed for this fight, Sturz (Körperbeherrschung −2 → Liegend), Stolpern (next action −2), Schmerz +1 for 3 KR (`fight.tempPainUntil`), Betäubung +1 (server), self-damage TP − RS, no defense until the next action.
- **Action budget** (`fight.turn`, ally `turn`; rules in `fightActions.ts`, UI `FightTurn.tsx`): per KR 1 action + 1 free action (S. 228); pills show what is left. Uses the action: attack / ranged attack (a two-weapon attack's second strike shares it, S. 238; a Passierschlag needs none, S. 237), each reload step (reload time 0: a free action, S. 245), Flucht (S. 237), moving up to GS, each casting action, a Zaubertrick (S. 285). Moving up to GS is also possible as the free action (only on one's own INI turn); both together are the sprint (S. 228–229). Used-up actions disable the buttons with the reason; "GM: one more action" grants an extra action for this KR. Allies have the same bar; an ally attack uses its action.
- **Casting in a fight** (`fight.casting`, Magic card): spells whose casting time is in actions (1–32; curses "≥ 1" = 1; rituals in minutes/hours are not offered). Zauberdauer senken/erhöhen (one step, S. 256) is chosen before casting and preselected in the spell Probe. Casting is a longer action (S. 228–229): one action per KR ("Continue casting"), other actions are blocked, free actions stay possible; at the last action the spell Probe opens (effect at the end of the last action). Defending aborts it (the defense button says so). SP taken while casting ask for Selbstbeherrschung (Störungen ignorieren) at −SP/3 (min 1); a failure aborts. "Abort" ends it by hand.
- **Allies** (`fight.allies`, `FightAllySection.tsx`, rules in `fightAllies.ts`): companions, summoned creatures and Radau brooms fight on the hero's side. Each joins with its own INI (base + 1W6; cards sorted by INI), attacks through the companion attack dialog (Flugangriff/Verbeißen when listed; rolls go to the fight log), defends (VW not lowered by several defenses, S. 354; PA/AW −3 per earlier defense in the KR, S. 232; critical enemy attack halves, S. 231; Schmerz −1 per level, S. 34) and takes hits (TP − RS). Values are read live from the source record, not copied.
   - Companion LeP are saved on the companion right away; summoned creatures keep their current LeP on the `Summon` record (`health`, null = full; `PUT summon-action` `health`). 0 LeP shows a note; the GM decides what happens.
   - Demons/elementals: "half TP" toggle for mundane (elementals: also consecrated) weapons, halved before RS (S. 355, 358).
   - Summons join with the service Kampf (1 service, runs as task `fight` until the fight ends, then the creature leaves if no service is left) or Kampf against several enemies (all services, task `fightMany`, S. 265). "End fight" and "Leave the fight" end a `fight` task (`fight-over`); the Bestiarium card offers "Fight over" too.
   - Radau (S. 297): joins from a successful spell Probe while a fight runs; INI 12+1W6, AT 10+QS, TP 1W6+3, one AT per KR, no maneuvers, unbreakable (no LeP, no hit card), PA half the AT only against Haltegriff; notes for the random next target, Haltegriff/Kraftakt and the sustained-spell penalty. From the next KR on, each KR offers "Spend 2 AsP" or "End spell".
- Ranged combat: [ranged-combat.md](ranged-combat.md). Not implemented: Reiterkampf (S. 239–240), a shared INI order of hero and enemies (allies are only sorted among themselves), picking up items (S. 239), Schildspalter structure points.

### Decisions

- Everything above except Reiterkampf. User decision, Nov 2026.
- User decisions, Nov 2026:
   - Sturmangriff ½ GS rounds half up (S. 17).
   - Patzer-table self-damage is weapon TP, reduced by RS (S. 234).
   - Weapon damage from Patzer tables stays on the inventory item (`equipment[].condition`): "damaged" AT/PA −2 (FK −4), "broken" not usable in fights. Repair in the equipment tab: pay the price the GM names (taken from the purse), or a craft check (Metall-, Holz- or Lederbearbeitung, the GM sets the modifier). The core rules define neither (S. 381–382 lists no repair). A destroyed weapon is removed from the inventory. Lost, stuck and jammed weapons are fight-only.
   - Two-handed = items marked "(2H)" (covers all Zweihandhiebwaffen and Zweihandschwerter and the two-handed Stangenwaffen).
   - Temporary Schmerz from Patzer tables is a fight-only −1 for 3 KR; the LeP-derived Schmerz is unchanged.
- User decisions, Nov 2026 (allies): allies are the ones that attack on the hero's side (enemies stay with the GM); companion LeP are saved right away, summon LeP on the summon; the Radau broom is unbreakable; only the core book's fighters (companions, Bestiarium summons, Radau).
- App choices, not user decisions (allies): Radau's PA (half the AT) and the half TP against demons/elementals round up like the other halvings (S. 231); Radau's activation (4 AsP) covers the KR it is cast in, upkeep starts with the next KR; a Kampf started in the fight panel keeps the creature until the fight is over.
- Party fight (Nov 2026, see HANDOFF "Shared fight & battle board"): the shared initiative order follows INI → INI-Basiswert → roll-off (S. 226–227; app choice: the roll-off is one stored random number per combatant); NPC hits apply SP = TP − RS (S. 230, 233), healing up to the maximum; players see NPC health only as a rough state (app choice). One square stands for 1 Schritt by default; the GM can set 1–10 Schritt per square (user decision, Nov 2026): moves cover ⌊GS ÷ Schritt per square⌋ squares, ranged distances count squares × Schritt per square. Turn flow (user decisions, Nov 2026): only the active combatant acts with 1 Aktion + 1 freie Aktion per KR (S. 227–228); the action ends the turn, an open attack locks the fight until it is defended. Players move their hero on their own turn up to GS squares as the free action, a second move uses the action (sprint, S. 228–229); terrain squares block movement only. App choices (the core rules have no grid): a diagonal step counts as 1 Schritt; tokens may be passed but not ended on. User decisions (Nov 2026): every action is turn-bound in a party fight (casting, loading, aiming, Flucht, S. 228–229, 237, 242, 245); Passierschlag without action outside the own turn and without defense (S. 237); the second strike of a two-weapon attack shares the action (S. 238); allies (companions, summons, Radau) have their own token and INI turn; **house rule**: weapons with Reichweite lang reach 2 squares. Flucht on the board: the action plus a move of GS, GS/2 after a failed check (S. 237). Order in the party fight (user decision): attack → defense → only after a failed defense the attacker rolls the TP; SP = TP − RS is applied by the server (S. 230, 233). Every combatant rolls INI before round 1 (S. 226).
- Party fight attacks: heroes attack from their own fight panel (all panel rules), the GM rolls the NPC defense (PA/AW −3 per earlier defense in the KR, VW not lowered, S. 232, 354; shot −4 / thrown −2, S. 243–244; halved after a critical attack, confirmed or not, S. 231); NPC attacks are defended by the player in the panel, damage TP − RS of the worn armor.
- User decisions, Nov 2026 (actions): the action budget blocks, with a GM override for one more action; movement is an action tracker only (no map, distance stays in the Situation card); casting follows the full longer-action rules (defense aborts, disturbance check).
- App choices, not user decisions (actions): −SP/3 rounds half up (S. 17); continuing a cast and moving are explicit buttons (nothing is spent automatically at the start of a KR); aiming (S. 242) stays a Situation input and does not use actions; drawing a sheathed weapon is still a note.
- App choice, not a user decision: maneuvers are kept per technique (the modifier button on the sheet and in the fight share the selection).

