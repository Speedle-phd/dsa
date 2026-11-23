# Fernkampf

source: DSA5 Regelwerk, S. 241–246, 249

## Summary

- An FK attack works like an AT. The target must be within the weapon's range, not in Angriffsdistanz. A fighter in melee cannot shoot (S. 241).
- Distance bands nah/mittel/weit come from the weapon's range (e.g. `10/50/80`). Up to 1.5× the maximum is possible as an unaimed shot (S. 241).
- Defense: only dodge or an active shield parry; shots −4, thrown weapons −2 (S. 243–244).
- Each shot needs the load time (Ladezeit). Shot arrows, bolts and bullets are unusable afterwards; thrown weapons can be picked up (S. 245–246).

## Values / formulas

| Modifier | FK | TP | S. |
|---|---|---|---|
| Distance nah / mittel / weit | +2 / ±0 / −2 | +1 / 0 / −1 | 241, 245 |
| Target size winzig / klein / mittel / groß / riesig (cover counts as smaller) | −8 / −4 / 0 / +4 / +8 | | 241 |
| Target stands still / ≤ 4 Schritt / ≥ 5 Schritt | +2 / 0 / −2 | | 242 |
| Target zigzags (GS halved) | −4 extra | | 242 |
| Shooter walked ≤ 4 / ran ≥ 5 Schritt | −2 / −4 | | 242 |
| Sight 1 / 2 / 3 / 4 | −2 / −4 / −6 / only on a 1 | | 242 |
| Aiming (per action, longer action) | +2, max +4 | | 242 |
| Shooting into melee (a miss hits nobody) | −2 | | 242 |
| Mounted: stands / Schritt / Trab / Galopp | 0 / −4 / only on a 1 / −8 | | 242 |

| Defense against ranged | Modifier | S. |
|---|---|---|
| Shot (Schusswaffe) | −4 | 244 |
| Thrown weapon (Wurfwaffe) | −2 | 244 |
| Confirmed critical defense | next defense in the KR not −3 | 244 |
| Unconfirmed critical defense | next defense only −2 | 244 |

Load times (S. 245, 249): after the last load action the weapon is ready. 0 actions = 1 free action. A load time above 1 is a longer action, and a defense interrupts it (S. 228–229). Loaded crossbows only need a free action to be readied. Schnellladen: Bögen and Wurfwaffen −1 action, Armbrüste half.

## Party fight on the board (user decisions, Nov 2026)

- Distance band from the board distance in squares × the board's Schritt per square (diagonal 1, app choice) and the weapon range; beyond the maximum the app blocks the shot, because shots up to 1.5× the maximum are only unaimed area shots (S. 241) — the GM rules those by hand.
- Target movement = squares in its last own turn, shooter movement = squares this turn (S. 242, "in letzter Handlung"); into melee = target next to one of the shooter's side.
- "Im Nahkampf" (S. 241) = next to an opponent it attacked or was attacked by in this or the last KR; such a fighter cannot shoot (server-checked).
- Aiming in a party fight is one action per step (+2, max +4) and counts for the next shot only.

## Edge cases

- Geron example (S. 241) uses −1 for sight 1; the ranged sight table (S. 242) gives −2 (−1 is the melee value, S. 239). The table is right (user decision, Nov 2026).
- Optional rule "Mögliche Wiederverwendung von Geschossen" (arrows on 1, bolts/bullets on 1–2 on W6, S. 246) is not built.
- Optional Fernkampf-Patzertabelle (S. 243): ammunition is lost except on Zerrung, Ladehemmung and Zu konzentriert.

## Code

- `client/src/features/heroes/combatSituation.ts`: `rangeBands`, `rangedAttackModifiers`, `defenseModifiers`, `nextDefensePenalty`, `reloadActions` (+ `combatSituation.test.ts`).
- `client/src/features/heroes/FightPanel.tsx` (attack card, load buttons), `FightSituation.tsx` (`RangedControls`).
- `server/src/utils/ammunition.ts`: `consumeAmmunition`; `PUT /api/stats/use-ammunition/:id`.

### Decisions

- Ammunition is deducted automatically per shot from a carried (not stashed) entry; without ammunition the shot is blocked. User decision, Nov 2026.
- Crossbow Schnellladen halves round half up (S. 17). User decision, Nov 2026.
- App choice, not a user decision: reload values that are not a single number (Eisenwalder `2/10`) are tracked by hand.
