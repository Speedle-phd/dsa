# Götterwirken: Liturgien, Zeremonien, Segnungen

source: DSA5 Regelwerk (4th revised German edition), S. 39, 154–159, 165, 177, 305–336

## Catalog

- `server/src/utils/karmaCatalog.ts` holds 34 Liturgien, 6 Zeremonien (S. 324–336) and 12 Segnungen (S. 323–324). Each row has Probe, SK/ZK resistance, StF, cost, casting time, range, duration, target category, distribution (church plus aspects, or `allgemein`), page and a short German/English effect summary.
- Churches covered: Boron, Hesinde, Peraine, Phex, Praios, Rondra. The divine tradition is the SF `Tradition (<Gott>kirche)` (S. 316–320).
- Fixed, non-modifiable costs (S. 310): Giftbann, Heilsegen, Kleiner Bann wider Untote, Kleiner Bannstrahl, Krankheitsbann, Objektweihe.
- Only `allgemein` liturgies and those of the hero's own church may be learned (S. 322). Unlike magic, there is no "foreign −2" path.

## Acquisition and advancement

- Requires the advantage Geweihter (S. 165) and the tradition of a church. Activation to FW 0 costs A/B/C/D = 1/2/3/4 AP (S. 25, 50; like spells — talents need no activation); raising uses the S. 50 table.
- Maximum: highest Probe attribute + 2 (S. 39), capped at 14 without Aspektkenntnis of one of the liturgy's aspects (S. 321). The editor ends at 25.
- Segnungen cost 1 AP each. "Die Zwölf Segnungen" is a 12 AP package of all twelve (S. 324) and is part of every priest profession.
- The header AP switch works as in Arcana: AP disabled records without AP; removal refunds only tracked payments.
- Server: `karmaController.ts`, routes `PUT /api/stats/{liturgy,remove-liturgy,liturgy-notes,blessing,remove-blessing,adjust-karma}/:id`, `GET /api/stats/karma-reference`. Rules in `karmaRules.ts` (`heroChurch`, `assertPriest`, `liturgyMaximum`, `karmaSpend`).

## Liturgy Probe (`LiturgyProbeDialog`)

- 3W20 with QS like a spell (S. 310–311). Modifiers: target SK/ZK lowers the three attributes; −1 per sustained liturgy or spell (S. 321); without prayer / without gesture −2 each (liturgies only).
- Modifications: one per full 4 FW, each ±1, no duplicates (S. 310): shorter/longer casting time, greater range, lower costs, Erzwingen. Cost modifications are hidden for fixed-cost liturgies.
- Zeremonien add place (Tempel of the deity +1, Heiligtum +2 … Unheiligtum des Namenlosen −5), time (Feiertag +1, Monat +1/+2, Namenlose Tage −5) and a consecrated tradition artefact +1 (S. 312–313).
- KaP: success pays full cost; failure half of base cost plus the first interval; critical success halves the cost and may add +1W6 FP (S. 311, 314). The dialog suggests the amount; the user spends it with one button. Halves are rounded up (app choice; the book gives no rounding rule).
- Schwacher Karmalkörper adds 1 KaP to every spending (S. 177), applied on the server.
- Botch: the 2W6 table (S. 311) is offered with a roll button; the optional "no botches" rule is noted, not enforced.
- Entrückung (S. 315): only a note (one level per 10 full KaP within a day); the user sets the condition.
- Not implemented: Mirakel, Liturgie-specific active effects, permanent KaP for Objektweihe beyond the note in the effect text.

## Creation

- Priest professions (S. 154–159): Boron, Hesinde, Peraine, Phex, Praios, Rondra, each with variants. They require Geweihter, the church tradition, Prinzipientreue (level 1 or 2) and Verpflichtungen II, and include Die Zwölf Segnungen.
- The creation ledger lists liturgy rows (package base → target, cost, maximum) and checks: priest and church requirements, maximum, and the EG limit of S. 39. That limit is counted separately for spells and for liturgies (app choice; the table names "Zauber/Liturgien" in one column).
- Finish writes `stats.liturgies` (paid AP above the package) and `stats.blessings` (package ones with 0 AP, bought ones 1 AP).
