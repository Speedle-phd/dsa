# Regeneration (LeP, AsP, KaP)

source: DSA5 Regelwerk, S. 339–340; S. 252, 256; S. 169, 176–177

## Summary

- A Regenerationsphase is a rest/sleep phase of at least 6 hours; at most 2 per day (S. 339).
- Roll 1W6 separately for each reduced energy, apply the situation's modifiers, negative results count as 0, then add to the energy. Never above the maximum (S. 339).
- AsP regenerate 1W6 per phase, plus matching advantages/SF (S. 252).
- Heilkunde Wunden (Heilung fördern): one simple check, its QS is added to LeP at the next phase on top of regeneration; takes 15 minutes (S. 340).

## Values / formulas

| Situation (S. 339)                                     | Effect                    |
| ------------------------------------------------------ | ------------------------- |
| Grundregeneration (6 h sleep)                          | 1W6 LeP/AsP/KaP           |
| Schlechter Lagerplatz / failed Wildnisleben (Lagersuche) | −1                      |
| Unterbrechung der Nachtruhe (watch, disturbance)       | −1                        |
| Längere Unterbrechung (Hundswache, night attack)       | −2                        |
| Gute Unterkunft (single room, inn)                     | +1                        |
| Schlechte Umgebung (wet, cold, restless)               | halved                    |
| Furchtbare Umgebung (storm, tied to a horse)           | none                      |
| Vergiftet / Krank                                      | no LeP regeneration       |
| per full 2 Stein iron carried > 1 hour (S. 256)        | −1 AsP                    |

Advantages/disadvantages: Verbesserte Regeneration (LE/AE/KE) I–III +1 per level (S. 169); Schlechte Regeneration (LE/AE/KE) I–III −1 per level, minimum 0 (S. 176–177).

Optional rule "Weniger Regeneration" (S. 340): LeP regenerate 1W3 and lose all LeP bonus points.

## Decisions (user-approved, the book is silent or contradictory)

- Order: 1W6 + modifiers, negatives → 0, then halve for a bad environment, rounded down.
- Vergiftet/Krank blocks only LeP (table), although the bullet text says "no regeneration".
- The Heilkunde Wunden QS is not halved; it is not added while LeP regeneration is blocked.
- With "Weniger Regeneration", 1W3 is read from a W6 as ⌈W6 / 2⌉; positive LeP modifiers are ignored, penalties still apply; the treatment QS still applies.

## Code

- `server/src/utils/regeneration.ts` (+ `.test.ts`) — pure rule; `PUT /api/stats/regenerate/:id` applies it and caps at the maximum.
- `client/src/features/heroes/RegenerationDialog.tsx` — "Rest" button in the overview's Resources section; 3D W6 per energy.
- KaP current is stored as `karmaEnergy.current`; heroes saved before that read as full.
- Not tracked: the 2-phases-per-day limit (reminder only), Nichtschläfer/Schlafwandler (use "Other modifier").
- Wirselkraut (+1 LeP per application, max +3 per phase, S. 346) and a paid Medicus treatment (QS, S. 340, 382) wait as active effects and are added to the next LeP regeneration, then used up (not while Vergiftet/Krank).
