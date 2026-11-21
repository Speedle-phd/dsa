# Schicksalspunkte (Schips)

source: DSA5 Regelwerk, S. 20–21, 29–31, 220–222

## Rules

- A hero starts with 3 Schips; Glück/Pech change the maximum. Never more than the maximum (S. 29).
- Only **1 Schip per Probe/roll**. Roll uses are Neuer Wurf, Qualität verbessern and Schadenswurf wiederholen, each once per roll. Other uses can be combined in the same round, e.g. Erster, then Zustand ignorieren, then Neuer Wurf (S. 29).

| Use | Effect | Limits |
| --- | --- | --- |
| Erster | act first this KR regardless of INI; several users act first in INI order | announce at the start of the KR (S. 29–30) |
| Neuer Wurf | reroll 1, 2 or all dice of an Eigenschafts-/Fertigkeitsprobe or AT/Verteidigung/FK | after the complete roll; not on a Patzer; second result binding; once per Probe (S. 30) |
| Qualität verbessern | +1 QS, may exceed what FP allow | successful Fertigkeitsprobe only; once per Probe (S. 30) |
| Schadenswurf wiederholen | reroll **one** W6 of your own damage | only one W6 even with 2W6+ (S. 30) |
| Verteidigung | +4 on all defenses until the end of the KR; also raises the number of possible defenses | before rolling the defense (S. 30) |
| Zustand ignorieren | ignore all conditions for one KR | (S. 30) |
| SF "Attacke/Ausweichen/Eigenschaft/Fernkampf/Parade verbessern" (5 AP each) | improve the die result by up to 2 | after the roll; not on a Patzer; needs the SF (S. 220–222) |
| SF Wachsamkeit (10 AP) | remove the status Überrascht immediately | (S. 222) |

Regaining (S. 31, GM decides): start of a session +1; end of an adventure chapter +1 or more; Heldentat +1 each; end of an adventure all. Optional: good roleplay. Optional rule "Kein Schicksal / Alle sind auserwählt".

Eigenschaftsprobe (S. 20–21): 1W20 ≤ modified attribute; 1 and 20 need a Bestätigungswurf; effective value ≤ 0 allows no check; a 20 is always a possible Patzer even above 19. Schips cannot be spent on a Bestätigungswurf (S. 20): Neuer Wurf rerolls the check die and, if needed, a fresh confirmation follows.

## Implemented

- Talent/spell Probe (`ProbeDialog`): Neuer Wurf (choose dice), Qualität verbessern and, with the SF, **Eigenschaft verbessern**: pick one die that cost FP, it counts 2 better for its FP cost only (one Teilprobe, S. 222). Not on a Patzer; it never creates or removes a critical (same interpretation as for single W20 rolls).
- Single-W20 rolls (`FateActions.tsx` → `FateD20Actions`): Neuer Wurf and, if the hero owns it, "… verbessern" (+2). Used by the fight panel (AT, FK, PA, AW) and the new **Eigenschaftsprobe** (`AttributeCheckDialog`, W20 button on the Overview attribute tiles).
- Fight panel: Schadenswurf wiederholen (pick one W6, W6 weapons only); round actions Erster (only before anything else happened in the KR), Verteidigung +4 and Zustand ignorieren, stored per KR in the fight state (`fight.fate`). Zustand ignorieren drops all condition modifiers and blocks in `useCheckState`, so talent and spell checks during that KR ignore conditions too.
- Overview: +1 Schip and "Refill all" (`PUT /api/stats/restore-fate-points/:id`) with the S. 31 occasions.
- Companions have no Schips (see `creatures/companions.md`).
- SF Wachsamkeit: while the status Überrascht is set, the fight panel's defense card offers "Wachsamkeit (1 Schip)", which spends the Schip and clears the status (S. 222).

### Decisions

- App interpretation of "… verbessern": the +2 only turns a normal failure into a success; it never creates or removes a critical, and it is offered only when 2 is enough.
- Optional rules on S. 31 are not implemented (the GM simply adds Schips with +1).
