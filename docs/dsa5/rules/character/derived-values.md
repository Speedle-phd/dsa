# Abgeleitete Werte / Basiswerte

source: DSA5 Regelwerk, S. 28–29, 40, 51, 56–57

## Summary

- Basiswerte = species Grundwert + attribute part ± Vor-/Nachteile (S. 56).
- AsP only with Vorteil Zauberer, KaP only with Vorteil Geweihter (S. 56).
- Buying extra LeP/AsP/KaP (Zukauf) is only allowed after play starts, not during creation (S. 56).
- Short-term changes from Zustände/Status do not trigger recalculation unless the rule says so (S. 31).
- Round half up (S. 17), as in the book examples on S. 57.

## Values / formulas

```
LeP  = LE-Grundwert(Spezies) + 2 × KO                  ± Vor-/Nachteile
AsP  = 20 (Vorteil Zauberer) + Leiteigenschaft(Tradition) ± Vor-/Nachteile
KaP  = 20 (Vorteil Geweihter) + Leiteigenschaft(Tradition) ± Vor-/Nachteile
SK   = SK-Grundwert(Spezies) + round((MU + KL + IN) / 6)  ± Vor-/Nachteile
ZK   = ZK-Grundwert(Spezies) + round((KO + KO + KK) / 6)  ± Vor-/Nachteile
AW   = round(GE / 2)
INI  = round((MU + GE) / 2)                              ± Vor-/Nachteile
GS   = GS-Grundwert(Spezies)                             ± Vor-/Nachteile
Schips (max) = 3                                          ± Glück / Pech
```

AsP/KaP Grundwert 20 comes from the S. 57 examples: Elf "20 + IN 14 = 34" AsP, Geweihter "20 + MU 14 = 34" KaP. The full attribute value is added (not halved).

Implemented AsP/KaP maximum (`server/src/utils/energyRules.ts`, derived on every load, save and response):

```
max = 20 + value of the owned tradition's Leiteigenschaft
        + levels Hohe Astralkraft/Karmalkraft − levels Niedrige … (S. 166, 174)
        + other modifiers (manual field) + Zukauf
max = 0 without Vorteil Zauberer / Geweihter
```

- No recorded tradition: Leiteigenschaft part 0 (max 20). Several traditions (not a core-rule case): the highest Leiteigenschaft counts (app choice).
- The former hand-entered "tradition bonus" field is gone; the stored `traditionAttributeBonus` is now the derived attribute value.
- LeP max is derived the same way: LE-Grundwert (species, stored `health.value`) + 2 × KO + levels Hohe Lebenskraft − levels Niedrige Lebenskraft (S. 166, 174) + other modifiers + Zukauf. Book example S. 57: 5 + 12 + 12 + Hohe Lebenskraft III = 32. Schmerz is recalculated from the derived maximum (S. 34).

Species Grundwerte (S. 40):

| Spezies | LE  | SK  | ZK  | GS  | Eigenschaftsänderungen | AP  |
| ------- | --- | --- | --- | --- | ---------------------- | --- |
| Mensch  | 5   | −5  | −5  | 8   | one of choice +1       | 0   |
| Elf     | 2   | −4  | −6  | 8   | IN, GE +1; KL or KK −2 | 18  |
| Halbelf | 5   | −4  | −6  | 8   | one of choice +1       | 0   |
| Zwerg   | 8   | −4  | −4  | 6   | KO, KK +1; CH or GE −2 | 61  |

Elves automatically get the Vorteile Zauberer and Zweistimmiger Gesang (S. 40).

Leiteigenschaften (S. 56):

| Tradition                | Leiteigenschaft |
| ------------------------ | --------------- |
| Gildenmagier             | KL              |
| Hexen                    | CH              |
| Elfen                    | IN              |
| Praios-, Hesindegeweihte | KL              |
| Rondra-, Borongeweihte   | MU              |
| Phex-, Perainegeweihte   | IN              |

AT/PA/FK: see [../combat/combat-techniques.md](../combat/combat-techniques.md).

## Edge cases

- 0 LeP or less: the hero is dying (S. 28).
- SK/ZK can be negative; the value is applied as a modifier on the opponent's check (S. 28).
- Status Fixiert: AW −4, GS 0 (S. 36).
- AW and Tragkraft (KK × 2 Stein, S. 348) are derived in `syncResources` on every load and save, like LeP/AsP/KaP. Before Nov 2026 they were only recalculated by some stats edits, so heroes from guided creation showed AW 0 ("not possible"); they are corrected on their next load.

## Open questions

- Details of Zukauf (buying LeP/AsP/KaP) are not on these pages → see Detailregeln / Vorteile chapter.

## Code

- `server/src/utils/baseAttributes.ts` — `calcBaseAttributes` (LeP, SK, ZK, AW, Tragkraft)
- `server/src/utils/statsPersistence.ts` — `syncResources`: AW, Tragkraft and the resource maxima on every load and save
- `server/src/utils/entryDerivedValues.ts` — SK/ZK ± Hohe/Niedrige Seelenkraft/Zähigkeit, Schips ± Glück/Pech, GS-Grundwert (Flink, Behäbig, Einbeinig), applied through `applyResourceMaxima`; see [advantages-disadvantages.md](advantages-disadvantages.md)
- `server/src/utils/energyRules.ts` — LeP/AsP/KaP maximum, Leiteigenschaft per tradition, Lebenskraft/Astralkraft/Karmalkraft levels (tests: `energyRules.test.ts`)

## Permanent AsP (S. 251, 262, 352)

- `mana.permanentLoss` (staff binding, artifacts, manual records) lowers the AsP maximum; `mana.permanentBuyback` (2 AP per point) restores it. Max = basis − (loss − buy-back), never below 0 (`permanentEnergyLoss` in `utils/energyRules.ts`).
