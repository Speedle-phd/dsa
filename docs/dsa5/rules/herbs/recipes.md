# Archiv der Kräuter: Rezepte and Äquivalenzlehre (Phase 4)

source: Archiv der Kräuter (AdK), S. 144 (Pflanzliche Rezepte), S. 145–158 (plant recipes), S. 158–159 (Alchimistische Rezepte), S. 159–178 (alchemical recipes), S. 294–298 (Alchimistische Äquivalenzlehre); DSA5 Regelwerk, S. 270–272 (brewing)

## Summary

- **125 recipes in six sections:**
  - Pflanzliche Hilfsmittel (42, S. 145–151)
  - Pflanzliche Gifte (10, S. 152–153)
  - Pflanzliche Rauschmittel (17, S. 154–158)
  - Elixiere (39, S. 159–172)
  - Alchimistische Gifte (10, S. 172–175)
  - Alchimistische Rauschmittel (7, S. 175–178)
- **Pflanzliche Rezepte** (S. 144):
  - A Pflanzenkunde check turns one application of the main plant into one product.
  - The main plant cannot be replaced (no Äquivalenzlehre).
  - The check is modified:
    - Hilfsmittel: by the Verarbeitungsschwierigkeit
    - Gifte and Rauschmittel: harder by half the poison level, rounded in the hero's favour
  - Prices:
    - Hilfsmittel cost what one application of the main plant costs at a merchant.
    - Gifte and Rauschmittel have a printed Wert / Preis.
- **Alchimistische Rezepte** (S. 158) are brewed like the core elixirs (Alchimie, lab, Brauschwierigkeit, ingredient level, RW S. 270–272).
  - Each recipe is a Berufsgeheimnis with an AP value and often an Alchimie minimum.
  - Alchemical poisons and drugs have the brew's QS as their level.
  - Alchimika keep indefinitely.
  - Ingredients may be swapped by the Äquivalenzlehre (S. 294–298), except main ingredients of some poisons and drugs (the GM decides).
- An optional rule on S. 144 lets weapon poisons last longer. It is not built.
- **Other talents** (S. 148–149):
  - Liebesküchlein is baked with Lebensmittelbearbeitung (Backen) instead of Pflanzenkunde and is a Berufsgeheimnis itself (2 AP; Lebensmittelbearbeitung 4, Tradition (Hexe)).
  - Menchal-Rüstung may be made with Lederbearbeitung ±0 instead of Pflanzenkunde −2.
- **Alchimistische Äquivalenzlehre** (S. 294–298):
  - Ingredients of a recipe with typical ingredients may be swapped for ones of the same essence (elements Feuer, Wasser, Luft, Erz, Humus, Eis; disputed: Kraft, Geist, Zeit, Gleichgewicht).
  - New special ability (S. 297), 15 AP: Alchimie 10 and two of Götter & Kulte, Magiekunde, Sagen & Legenden, Sphärenkunde, Sternkunde at FW 10.
  - When brewing, each point of extra difficulty saves 10 % of the ingredient cost, at most 50 %.
  - The GM may grant bonuses for good arguments from sympathies, or botch-like effects for weak ones.
  - The core elixirs list typical ingredients too (RW S. 272), so the saving applies to every brew.
  - Base ingredients with element and price per application: table S. 297–298.

## Decisions

- User decisions (Nov 2026):
  - **One check makes a whole batch**: the player picks how many applications to process.
  - **A failed check loses the plants.**
  - Products are short summaries in own words with the page (as for the plants).
- App choices, not user decisions:
  - **Verarbeitungsschwierigkeit** is applied like the Brauschwierigkeit: the printed value is the modifier (−2 = harder, +1 = easier).
  - **Main plants**:
    - A recipe's main plant is the plant whose page lists it.
    - The four recipes with several plants are set by hand from their Zutaten:
      - Brandsalbe → Chonchinis (+ Wirselkraut optional)
      - Fiebersaft → Joruga (+ Gulmond/Traschbart/Belmart optional)
      - Kairantrunk → Kairan (+ Mibelrohr optional)
      - Schlängelbeutel → Braunschlinge or Krakenseerose
    - Optional plants and the other Zutaten (salt, water, fat …) are shown, not taken from the inventory.
  - **Products** are plant items of form `product`, made on the current in-game day.
    - They keep the core 3 months: the book gives no shelf life for plant products.
    - Stacks used for crafting are those that spoil first; spoiled ones are skipped.
  - **Hilfsmittel price**: the main plant's raw price.
  - **Elixirs from AdK** join the laboratory table when the book is on.
    - Their Berufsgeheimnisse are in the special-ability catalog with `book: 'AdK'`.
    - The ability picker only offers them to heroes with the book switched on.
    - Brewing conditions (darkness, moonlight …) are shown, not checked.
  - **Using a product or an AdK brew**: the item is used up and its summary (for a brew its QS line) is shown; the effect is resolved with the GM.
    - Poisons and drugs get their rules in Phase 5.
  - **Other talents**:
    - The craft dialog offers the talents a recipe allows; the server accepts only those.
    - Liebesküchlein needs its Berufsgeheimnis (also in the ability picker, `book: 'AdK'`).
    - Making Liebesküchlein uses the Lebensmittelbearbeitung application Backen.
  - **Äquivalenzlehre**:
    - The brew dialog offers −1 … −5 (10–50 %) only to heroes with the ability and the book switched on; the server checks both.
    - Savings may leave tenths of a Silbertaler; they are paid in Heller.
    - Which substitute is used is roleplay with the GM: the app does not check ingredients (it never did; brewing pays the ingredient level in money, RW S. 271).
    - The element table and the base-ingredient table are not copied into the app; the page is cited.
    - The ability requirement "two of five talents" is a new requirement kind (`anyOf`) in the entry rules.
  - **Weapon and armour tables** printed beside recipes (Blasrohr, Dornrosengerte, Menchal-Rüstung, Waldwebennetz …) are not in the store yet.

## Data

- `scripts/adk_recipes.py` generates `server/src/utils/herbs/recipeData.ts` (facts only) from the PDF.
  - Recipe headings are short lines followed by a line of effect icons.
  - Wachtrunk (S. 171) is printed without icons and is named in the script.
  - The report lists unreadable fields, dropped sidebars and repeated labels (two recipes merged).
- `--digest a b <file>` prints the descriptions, effects and QS of recipes a..b (book order) as input for the next batch of summaries; keep it out of git.
- Summaries: `server/src/utils/herbs/recipeSummaries.ts`, all 125 (Nov 2026; a test keeps it complete).
  - Poisons and drugs read "full effect / weaker effect".
  - Elixirs have six QS lines.
  - Alchemical poisons and drugs have one summary: their level is the brew's QS. Regenbogenstaub has QS lines, since its effect depends on the QS.
- Generator details:
  - "Qualitätsstufen" without a colon (Kaltes Licht, S. 165) is read.
  - "Wirkung*:" with a footnote (Lotosöl, S. 174) is read; the footnote after its price is dropped from the price.
- Book inconsistency: Freundfeind (S. 173) prints "Stufe: 5" but also "Die Giftstufe entspricht der QS". The app keeps the printed 5 (app choice); the GM may use the QS instead.

## Code

- Server:
  - `utils/herbs/recipeTypes.ts`, `recipeData.ts`, `recipeSummaries.ts`, `recipeCatalog.ts` (main plants, prices, `alchemicalRecipes`, `secretTalentMinimum`)
  - `crafting.ts` (`craftModifier`, `craftUses`), tests in `recipeCatalog.test.ts`
  - `POST /api/stats/craft-herbal/:id` (`herbItemController.craftHerbal`, `craftHerbalSchema`)
  - `utils/alchemy.ts` `brewRecipe(elixir, adk)`; the brew controller passes the hero's `adk` rule
  - Berufsgeheimnisse in `characterEntryCatalog.ts` (`book: 'AdK'`, `effect.book`)
  - `consumables.ts` turns products and brews into info items
  - The herb reference includes `recipes` with `craftModifier`
- Äquivalenzlehre:
  - Server:
    - the ability in `characterEntryCatalog.ts`, requirement `anyOf` in `characterEntryRules.ts` (+ test)
    - `brewPlan({ …, substitution })` in `utils/alchemy.ts` (+ test)
    - `substitution` in `brewElixirSchema`, checked in `alchemyController.ts`
  - Client: the choice in the brew dialog (`HeroAlchemy.tsx`)
- Craft talents: `craftTalents`/`secret` on recipes (`recipeCatalog.ts`, + test), `talent` in `craftHerbalSchema`; the talent choice in `CraftHerbalDialog.tsx`
- Client:
  - `features/herbs/RecipeBook.tsx` (Alchemy tab, after the laboratory), `CraftHerbalDialog.tsx`
  - `recipeRules.ts` (+ test): `adkElixirItems`, `craftableAmount`, `recipeKindLabels`
  - `ConsumeDialog.tsx` shows recipe summaries
  - `isConsumableItem` also counts the category Alchimica
