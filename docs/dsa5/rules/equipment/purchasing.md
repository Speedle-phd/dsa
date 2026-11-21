# Ausrüstung kaufen

source: DSA5 Regelwerk, S. 363–381

## Summary

- The equipment tables list typical items and prices; they are not exhaustive and can guide prices for other items (S. 363).
- Listed prices use Silbertaler; convert the hero's purse to a common unit before comparing or deducting costs (S. 364).
- A purchase adds the selected quantity to the hero's equipment and deducts its total listed price from the purse.
- App placement policy: `Stash` (DE: Lager) keeps items in inventory but excludes their weight from carried weight and encumbrance. Moving them back to a carried placement includes their weight again. Store purchases can go directly to Stash; storage does not equip armor.
- Placements (user decision, Nov 2026): Angelegt, Lager and Sonstiges are always available. Storage items become placements once owned: worn containers (Lederrucksack, Lederranzen, Kiepe, Umhängetasche, Gürteltasche, Sack, Tuchbeutel, Geldbeutel, Geldkatze, Schmuckkästchen, Ledergürtel, Lederschürze mit Taschen, Hose mit Hosentasche, Köcher, Dolch-/Schwertscheide, Zunderdose) only while Angelegt or inside another usable container; external containers (Truhe, Satteltasche, Packsattel, vehicles) whenever owned. Köcher holds 20 Pfeile or Bolzen, Scheiden one Dolch / Schwert or Fechtwaffe, the Zunderdose one Zunder pack (S. 374, 376); other sizes are not given, so there is no capacity limit.
- Weight: contents count where their container is (a stashed backpack takes its contents to the stash); external containers do not count towards the hero's carried weight. Dropping the last of a container moves its contents to Sonstiges. Older placements (Rucksack, Gürtel, Beutel, Satteltasche) stay valid for existing items and count as carried.
- Replaced armor is taken off and moved to Sonstiges. Shots use carried ammunition, the Köcher first.
- Pick up item: free addition from the store catalog search (with QS/training) or a custom item, e.g. recovered arrows or loot.
- Prices: one haggle per market visit (Handel (Feilschen) Vergleichsprobe, net QS × 10 %, at most 50 %, critical/botch 50 %, S. 208) sets a market rate for all list prices until reset; it can also be set by hand. Every purchase can use a custom price per unit instead. Individually agreed prices ("price varies") ignore the market rate.
- The store contains the fixed-price/fixed-weight core tables: purchasable melee/ranged weapons, shields, priced armor, weapon accessories, clothing, writing supplies, uncut gemstones, jewelry material variants, instruments, luxury goods and animal equipment, alongside the existing tools, containers and three equipment packages (S. 364–381).
- Light-source burn times are shown in the store: torch 1.5 hours, Gwen-Petryl stone unlimited, candles (10) 10 hours, lantern 12 hours, oil lamp 8 hours, and bullseye lantern 12 hours (S. 376). The rulebook gives a light range guideline of 7–10 Schritt without modifiers; the GM decides the actual range.
- Package previews list their included item types and quantities before purchase (S. 364–365).
- Weapon entries can include combat technique, damage, modifiers, range, ammunition, and reload actions; armor entries show RS and BE (S. 366–374).
- Ammunition is sold per projectile: Pfeile 0.4 S., Bolzen 0.2 S., Kugeln 0.5 S. (S. 373). No pack quantity is specified. The book lists no ammunition weights; the user-approved app policy uses weight 0, not a rulebook claim that ammunition is weightless.
- Clothing packages contain one culture/status-appropriate set, with no fixed individual contents: Unfrei 5 S., Frei 25 S., Niederadel 150 S., Adel 1,000 S., Hochadel 1,500 S. Spare clothing is purchased separately (S. 375). Their missing weights use the same user-approved weight-0 policy. They appear under Clothing.
- Proviant für einen Tag feeds one person for one day, weighs 1.5 Stein and costs 0.5 S. per daily ration (S. 375); it appears under Traveling and Tools.
- S. 379–381 are in the store as well (user decision, Nov 2026): Alchimica (8, priced per QS, the QS is chosen in the purchase dialog and stored as `quality` plus a `(QS n)` name suffix), Gifte (4, store price; Stufe/Art/Widerstand/Beginn/Dauer/effects from S. 342), Heilkräuter (7, the herbalist price; raw price and search/identification/applications from S. 344–346), Bücher (4), Magische Artefakte (Armreif der Willensstärke; Firnklinge with the Säbel values of S. 368, because S. 270 calls it a Säbel), Tiere (riding animals offer untrained / trained +20 % / combat-trained ×2, S. 381), Futter (per week) and Fortbewegungsmittel. Rows without a listed weight use the approved weight-0 policy.
- "Price varies" rows (Schwere Kleidung, Winterkleidung, S. 374; Codex Albyricus 300–700 S. per volume, S. 379) ask for the price agreed with the GM.
- Buying a Hund or Pferd offers to add it as a companion (core stat blocks, S. 360–362); Maultier and Pony have no core stat block.
- Using an Alchimicum, herb or poison opens a consume dialog; effects are described in [../alchemy/alchemy.md](../alchemy/alchemy.md). Services (S. 381–382) are on their own page: [services.md](services.md).
- Unterkleidung für Metallrüstungen is required under Ketten-, Schuppen- and Plattenrüstung; without it equipped, BE +1 (S. 374, `checkModifiers`).

- Ammunition is used per shot in the fight panel: one `Pfeile`/`Bolzen`/`Kugeln` from a carried (not stashed) entry (S. 246, user decision). Thrown weapons are not consumed.
- Weapon condition (`condition: 'damaged' | 'broken'` on the equipment entry) comes from the optional Patzer tables (S. 231, 234, 243–244). One piece of a stack is split off; moving items merges only entries with the same condition. A destroyed weapon is removed. Repair (equipment tab): the GM's price from the purse, or a craft check (Metall-, Holz- or Lederbearbeitung). The core rules have no repair price or check (S. 381–382), so neither is invented. User decision, Nov 2026.

## Values / formulas

| Currency | Value in Kreuzer |
| -------- | --------------- |
| Kreuzer  | 1               |
| Heller   | 10              |
| Silbertaler | 100           |
| Dukaten  | 1,000           |

```text
purchase cost = item price × quantity
remaining purse = purse value − purchase cost
```

## Edge cases

- Reject a purchase when its total price exceeds the available purse.
- Store each equipment entry's weight per item; total carried weight is per-item weight × quantity.
- Armor uses the same `carriedOn: Equipped` placement as other gear. Equipping a different known armor item automatically takes off the previous suit and moves it to `Other` (Sonstiges); only the equipped suit affects BE/GS/INI (S. 32, 374). Moving or removing it clears the worn selection.
- Older saved `wornArmor` selections are presented as Equipped and normalized on the next relevant save. The legacy API field remains compatible, but no separate equipment-tab armor selector is needed.

## Open questions

- Missing weights (books, Alchimica, poisons, herbs, animals, feed, vehicles) use the approved weight-0 policy; missing prices are entered as the GM's agreed price, never invented. Services are not inventory items.
- The separately priced Haumesser tool (20 S.) and weapon (100 S.) remain distinct; the latter uses the display suffix `(Waffe)`. Dreizack likewise retains its tool entry and separate `(2H)` weapon row (S. 368, 375). These labels disambiguate the book's differing prices, not additional rules.
- New entries record printed `sourcePage`, displayed in purchase details. Gem prices refer to uncut 10-Karat/2-Gramm pieces (S. 378). Jewelry is offered as separate Bronze/Silber/Gold variants with the corresponding weight and price.
- Weapon restrictions and special handling are reference notes, not new automatic effects or purchase authorization. This includes consecration, creation cultures and staff binding. The Linkhand PA bonus and the Großschild main-weapon AT −1 (S. 366–367) are applied in fights. The Eisenwalder retains its 2/10-action magazine reload distinction. Lance/chain weapons do not display a normal parry.

- The cited pages do not define merchant availability, price negotiation, or a special purchase procedure.
- The store does not enforce profession, cultural, or legal restrictions on owning particular weapons or armor.

## Code

- `client/src/pages/AdventurianStore.tsx`
- `client/src/utils/aventurian_store.ts`
- `server/src/utils/equipmentPurchase.ts`
- `server/src/utils/ammunition.ts`, `weaponCondition.ts` (+ tests); `client/src/features/heroes/WeaponRepair.tsx`
- Placements: `client/src/features/heroes/containers.ts` (+ test), `PlacementSelect.tsx`, `PickUpDialog.tsx`; server `server/src/utils/containers.ts` (+ test)
- Prices: `client/src/utils/storePricing.ts` (`withRate`, `haggleRate`), `client/src/features/store/StorePurchaseDialog.tsx`, `MarketRatePanel.tsx`
