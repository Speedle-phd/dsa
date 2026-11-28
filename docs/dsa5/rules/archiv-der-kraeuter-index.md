# Archiv der Kräuter – Knowledge Index

> Source: `Archiv_der_Kraeuter.pdf` (Ulisses 2026; combines Aventurisches Herbarium I + II). It stays local; `*.pdf` is gitignored.
> This index points to pages; it does not reproduce the book. Cite as `AdK S. <page>` (printed page).
> Extract pages with `python scripts/dsa5_pages.py <pages> --book kraeuter [--grep <text>]`.

Plants and recipes, one row each: [alchemy/plants-index.md](alchemy/plants-index.md). Book rules, calendar and plant items in the app: [herbs/foundations.md](herbs/foundations.md); Herbarium, store and plant use: [herbs/herbarium.md](herbs/herbarium.md).

## Chapters

The kind of each chapter:

- **Regel**: mechanics to implement.
- **Daten**: catalog values.
- **SL**: background and GM material, mostly text.

| Chapter | AdK S. | Kind | Where it would go in the app |
|---|---|---|---|
| Aufbau der Pflanzenbeschreibung | 9–10 | Schema | fields of a plant catalog (see plants-index) |
| Aventurisches Herbarium: 132 plants, one page each | 11–142 | Daten | herb items and consumables (`aventurian_store.ts`, `consumables.ts`); Pflanzenkunde results |
| Rezepte: Pflanzliche Rezepte (Pflanzenkunde check; Hilfsmittel, Rauschmittel) | 144–157 | Regel + Daten | crafting from herbs (no crafting system yet) |
| Rezepte: Alchimistische Rezepte (Elixiere, Gifte, Rauschmittel) | 158–177 | Regel + Daten | alchemy tab: extend the existing brewing (`PUT brew-elixir`, [alchemy/alchemy.md](alchemy/alchemy.md)) with the AdK elixirs |
| Landschaften Aventuriens (types and regions) | 180–200 | Daten/SL | plant search by landscape |
| Nahrung aus der Wildnis | 201–204 | Daten | food gathering (Wildnisleben, Fischer/Jäger/Sammler notes) |
| Kulturpflanzen Aventuriens | 205–211 | Daten/SL | – |
| Belebte Landschaften: Gruselwald Düsterbruch, Märchenwald Heimighain, Sordulas Fenn, Chard'hasak, Tempelgarten Sperenshag | 213–227 | SL | GM tools (later: ready-made settings) |
| Heilige Pflanzen | 228–229 | SL/Daten | karma/liturgies (flavour) |
| Garten und Gewächshaus einer Magierakademie | 230–234 | SL | – |
| Pflanzenwesen: Waldschrate | 236–240 | Daten | bestiary (stat blocks → NPC library paste import) |
| Der Alraunige Homunculus (recipe and creature) | 241–247 | Regel + Daten | companions/familiars, alchemy |
| Dämonische Pflanzen & Daimonide, Sonderbare Symbionten, Pflanzenchimären | 248–258 | Daten | bestiary |
| Die Landschaftstypen im Überblick | 260 | Daten | plant search |
| Die Pflanzenverbreitung (search modifier per plant and landscape) | 261–266 | Daten | plant search |
| Die Wirkungen der Pflanzen im Überblick (7 effect types) | 267–270 | Daten | catalog filter; in plants-index |
| Die Alltagspflanzen im Überblick | 270–275 | Daten | everyday plants (Alltagsarzneien) |
| **Kräutersuche** (Fokusregel I) | 275–281 | Regel | search with Pflanzenkunde: Such-/Bestimmungsschwierigkeit, time, applications by QS |
| Nahrung aus der Wildnis im Überblick | 282–283 | Daten | food gathering |
| **Haltbarmachung** (Fokusregel I) | 284–290 | Regel | shelf life by a Pflanzenkunde check; replaces the flat "3 months" of the Regelwerk (S. 345) |
| **Alltagsarzneien** (Fokusregel I) | 291–294 | Regel + Daten | simple remedies from everyday plants; random tables (2W20) for touching, inhaling or eating unknown plants (S. 292–294) |
| **Die Alchimistische Äquivalenzlehre** | 294–298 | Regel | substituting ingredients when brewing |
| Grundrezepte der Lebensmittelbearbeitung | 299–300 | Daten | – |
| **Sucht** (Fokusregel I for Rauschmittel) | 301–302 | Regel | drugs work like poisons plus addiction; needs a poison/drug flow |
| Legalität und Preise von Rauschmitteln | 303 | Daten | store prices, legality by region |
| **Krankheiten** | 303–304 | Regel | diseases (no disease system yet) |
| Magische und magieaffine Hölzer | 305–306 | Daten | magic: artefact materials |
| **Traditionsartefakte aus Holz** | 306–313 | Regel + Daten | magic: tradition artefacts (Magierstab, Hexe …) |

## Already in the app (from the Regelwerk)

- Herbs:
  - Wirselkraut and Gulmond have rules.
  - Alraune, Axorda-Baum, Donf, Egelschreck and Lulanie are items only (Regelwerk S. 344–346, [alchemy/alchemy.md](alchemy/alchemy.md)).
  - AdK has full pages for all seven.
- Elixirs: Antidot, Heiltrank, Liebestrunk, Unsichtbarkeits-, Verwandlungselixier, Waffenbalsam, Willenstrunk and Zaubertrank (Regelwerk S. 272–274). The AdK plant pages refer back to them as "RW S. …".
- Talent results: Pflanzenkunde shows only the food note for Sammler (Regelwerk S. 219). A plant search, shelf life, recipes, drugs/addiction and diseases are not implemented.

## Suggested order for later work

Superseded by the approved implementation plan (Nov 2026, phases 0–9): `~/.claude/plans/can-you-come-up-atomic-fern-of-2cfd4214-a8a8-435a-b847-907d14d6eba5.md`, summarised in `HANDOFF.md` → Open ideas.

A suggestion, not a decision:

1. **Plant catalog data**: the 132 plants as data (fields of plants-index), linked to store items.
2. **Kräutersuche** (S. 275–281, with Verbreitung S. 261–266): search and identify by landscape, applications by QS.
3. **Haltbarkeit/Haltbarmachung** (S. 284–290): shelf life on herb items.
4. **Recipes** (S. 144–177, Äquivalenzlehre S. 294–298): crafting from herbs; ties into a future brewing feature.
5. **Sucht and Krankheiten** (S. 301–304): need a poison/drug/disease flow first.
6. **Homunculus** (S. 241–247) as a companion, and **wooden tradition artefacts** (S. 306–313).
7. **Pflanzenwesen** for the bestiary; Belebte Landschaften as GM material.

Each rule gets a topic doc first (`/summarize-dsa-rule`), as for the Regelwerk.
