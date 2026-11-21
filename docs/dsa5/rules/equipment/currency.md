# Währungen, Gewichte, Maße

source: DSA5 Regelwerk, S. 364 (price lists S. 363–382)

## Summary

- All prices in the book are in Silbertaler and all weights in Stein (S. 364).
- The regional supplements add other currencies and units (S. 364).
- Ready-made Ausrüstungspakete can be used, e.g. at creation (S. 364).

## Values / formulas

| Münze       | Wert           |
| ----------- | -------------- |
| Dukat       | 10 Silbertaler |
| Silbertaler | 10 Heller      |
| Heller      | 10 Kreuzer     |
| Kreuzer     | 1              |

```
1 Dukat = 10 Silbertaler = 100 Heller = 1000 Kreuzer
1 Stein = 40 Unzen        (1 Stein ≈ 1 kg, 1 Unze ≈ 25 g)
1 Schritt = 100 Halbfinger (1 Schritt ≈ 1 m, 1 Halbfinger ≈ 1 cm)
```

Daily wages (S. 364): billige Arbeitskraft 1–9 Heller; einfacher Arbeiter 1–4 Silbertaler; qualifiziert 5–9 Silbertaler; hochqualifiziert 10–50 Silbertaler.

Reisepaket (S. 364): 20 Stein, 120 Silbertaler in total.

## Code

- `client/src/utils/aventurian_store.ts`, `client/src/pages/AdventurianStore.tsx`
- `server/src/utils/equipmentPurchase.ts`
- `client/src/features/heroes/equipmentOptions.ts`, `HeroEquipment.tsx`
