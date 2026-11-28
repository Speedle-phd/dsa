# Pflanzen und Rezepte: Archiv der Kräuter (Index)

source: Archiv der Kräuter (AdK), S. 9–142 (plants), 144–177 (recipes), 266–270 (effect types)

A facts-only index for later implementation. It does not reproduce the book: the full rules, effects and descriptions stay on the page.
Read them with `python scripts/dsa5_pages.py <page> --book kraeuter`. Chapter map: [../archiv-der-kraeuter-index.md](../archiv-der-kraeuter-index.md).

## How a plant page is built (AdK S. 9–10)

Every plant has one page (a few run to two) with the same fields. They are the natural shape of a plant catalog:

- Was weiß mein Held: knowledge per QS of Pflanzenkunde (Heil-, Gift- or Nutzpflanzen); alternative names
- Verbreitung: Landschaftstyp (+ frequency: sehr selten … gelegentlich) and Regionen (sub-types)
- Suchschwierigkeit / Bestimmungsschwierigkeit: modifiers on the Pflanzenkunde check
- Anwendungen: applications found per QS 1–6
- Wirkung:
  - roh, split into Berührung / Einatmung / Verzehr
  - verarbeitet (→ recipes)
- Preis: raw / processed
- Rezepte: Pflanzliche Hilfsmittel, Pflanzliche Rauschmittel, Elixiere, Alchimistische Gifte (with page references, some to the Regelwerk)
- Alltagsarzneien und Volksbrauchtum (lore); Haltbarkeit: raw / processed (→ Haltbarmachung, S. 284)

## Effect types (AdK S. 266–270)

The overview table gives each plant's effect types in raw form:

- **Heilung**
- **Gift**
- **physisch** (physische Wirkung)
- **psychisch** (psychische Wirkung)
- **Nützlich**
- **Wehrhaft**
- **Übernatürlich**

The Wirkungstyp column below comes from that table.

## Already in the app

- From the Regelwerk (S. 344–346), as store items and consumables:
  - Wirselkraut (+1 LeP per application at the next regeneration, max +3) and Gulmond (an active effect) have rules.
  - Alraune, Axorda-Baum, Donf, Egelschreck and Lulanie are description-only.
  - See [alchemy.md](alchemy.md) and `server/src/utils/consumables.ts`.
- AdK adds values for all of them (search, applications, price), and recipes such as Brandsalbe and Wirseltrank for Wirselkraut.
- Prices: AdK prints two prices, raw / processed. The app's store uses one price per item.

## Plants

Generated from the book's labelled fields (132 plants). Suche/Bestimmung are the check modifiers; Anwendungen are per QS 1–6; S. = AdK page.

| Pflanze | S. | Wirkungstyp (S. 266–270) | Landschaftstyp | Suche | Bestimmung | Anwendungen | Preis | Rezepte |
|---|---|---|---|---|---|---|---|---|
| Alraune | 11 | Gift, physisch, psychisch, Nützlich, Übernatürlich | Wälder, Regenwälder | –3 | –2 | 1/1/1/1/1/1 | 3 / 5 Silbertaler | Alrauniger Homunculus (S. 241) |
| Alveranie | 12 | Heilung, Übernatürlich | alle | –6 | –2 | 1/1/1/1/1/1 | wird nicht gehandelt (aber sicherlich bis zu 100 Dukaten) | – |
| Aranische Wassernuss | 13 | Gift, Nützlich | Sümpfe, Marschen und Moore | –1 | –1 | 1/2/3/4/5/6 | 2 / 8 Silbertaler | Krähenfüße (S. 148) |
| Arganstrauch | 14 | Heilung, physisch | Regenwälder, Sümpfe, Marschen und Moore, Wälder | –3 | –1 | 1/1/2/2/3/3 | 50 / 120 Silbertaler | – |
| Atan-Kiefer | 15 | Heilung | Gebirge | –3 | –2 | 1/2/3/4/5/6 | 6 / 9 Silbertaler | Atanax (S. 145) |
| Atmon | 16 | Gift, physisch, Nützlich | Wüstenrandgebiete und Wüsten, Grasländer, Heiden und Steppen, Gebirge, Sümpfe, Marschen und Moore | –3 | –3 | 1/1/2/2/3/3 | 15 / 20 Silbertaler | Atmonbrei (S. 145) |
| Axorda-Baum | 17 | Heilung, Gift, physisch | Maraskan | –3 | +/–0 | 1/1/1/1/2/2 | 16 / 80 Silbertaler (in Notzeiten mit Gold aufgewogen) | Axorda-Katzensäckchen (S. 152) |
| Basilamine | 18 | Gift, Wehrhaft | Wälder | –6 | –5 (entdecken: Sinnesschärfe –3) | 1/2/3/4/5/6 | 0,1 / 0,2 Silbertaler | – |
| Belmart | 19 | Heilung, Nützlich | Wälder | –1 | –1 | 1/2/3/4/5/6 | 8 / 12 Silbertaler | Fiebersaft (S. 146), experimentell in Antidot (RW S. 272) |
| Blauschirmpilz | 20 | Gift, physisch, Übernatürlich | alle | –3 | –3 | 1/1/2/2/3/3 | 5 / 15 Silbertaler | Blauschirmsporen (S. 145) |
| Bleichmohn | 21 | Heilung, physisch, psychisch, Nützlich | Gebirge | –2 | 0 | 1/2/3/4/5/6 | 10 / 50 Silbertaler | Schmerzwein (S. 169), Heilsalbe (S. 164) |
| Blutblatt | 22 | physisch, Nützlich, Übernatürlich | alle | –1 | –1 | 1/1/2/2/3/3 | 3 / 7 Silbertaler | (Hinweis) (RW S. 260), Blutblattkranz (S. 146) |
| Boronie | 23 | Nützlich, Übernatürlich | Regenwald, Grasländer, Heiden und Steppen | –3 | –1 | 1/2/3/4/5/6 | verboten (al’anfanische Boronkirche); illegal, Preis schwankt | – |
| Boronsschlinge | 24 | Gift, physisch, Wehrhaft | Wald, Regenwald | –3 | –4 | 1/1/1/2/2/2 | 4 / 6 Silbertaler | – |
| Braunschlinge | 25 | Gift, physisch, Nützlich, Wehrhaft | Grasländer, Heiden und Steppen, Sümpfe, Marschen und Moore, Wälder | –2 | –2 | 1/1/1/1/1/1 | 2 / 2,5 Silbertaler | Schlängelbeutel (S. 150), Unverwundbarkeitselixier (S. 171) |
| Carlog | 26 | Gift, physisch, Nützlich | Grasländer, Heiden und Steppen, Sümpfe, Marschen und Moore, Wälder | –1 | –1 | 1/2/3/4/5/6 | 2 / 2,2 Silbertaler | Eulentränen (S. 161), Katzenaugensalbe (S. 177) |
| Cheria-Kaktus | 27 | Gift, physisch, psychisch, Nützlich, Wehrhaft | Wüstenrandgebiete und Wüsten | –2 | –2 | 1/1/2/2/3/3 | 8 / 12 Silbertaler | Cheriacha (S. 154), Hauch der Weissagung (S. 164), Weissagungspulver (S. 171) |
| Chonchinis | 28 | Heilung | überall (außer in Ewigem Eis und in Wüsten) | –2 | –1 | 1/1/2/2/3/3 | 4 / 8 Silbertaler | Brandsalbe (S. 146), Praiosmilch (S. 149) |
| Dämonenklaue | 29 | Gift, physisch, psychisch | Wälder | –3 | –2 | 1/1/1/2/2/2 | 5 / 10 Silbertaler | Schleieröffner (S. 157) |
| Dergolasch | 30 | Heilung, physisch, Nützlich | Höhlen | –2 | –1 | 1/2/3/4/5/6 | 1 / 2 Silbertaler | Dergolasch-Pulver (S. 146), Furchtlos-Tropfen (S. 162) |
| Disdychonda | 31 | Gift, physisch, Wehrhaft | Wälder, Regenwälder, Maraskan | –3 | –2 | 1/1/1/2/2/2 | 15 / 60 Silbertaler | Kelmon (RW S. 342) |
| Donf | 32 | Heilung | Sümpfe, Marschen und Moore, Grasländer, Heiden und Steppen | +/–0 | +3 | 1/1/2/2/3/3 | 2 / 4 Silbertaler | – |
| Dornrose | 33 | physisch, psychisch, Nützlich, Wehrhaft | Grasländer, Heiden und Steppen, Wälder | –3 | –3 | 1/1/1/2/2/3 | 3 / 5 Silbertaler | Dornrosengerte (S. 146), Dornrosenöl (S. 154), Tharvun-Parfüm (S. 88) |
| Dracheneiranke | 34 | psychisch, Nützlich, Übernatürlich | Grasländer, Heiden und Steppen, Gebirge | –3 | –3 | 1/1/2/2/3/3 | 24 / 32 Silbertaler | Drachentrunk (S. 175) |
| Druidenwurz | 35 | Gift, physisch, psychisch, Nützlich | Wälder | –2 | –2 | 1/1/1/2/2/3 | 4 / 6 Silbertaler | Dreh-Öl (S. 176) |
| Efeuer | 36 | Gift, physisch, Wehrhaft | Ruinen, Wälder, Gebirge, Gärten | –3 | –1 | 1/2/3/4/5/6 | 3 / 5 Silbertaler | – |
| Egelschreck | 37 | Heilung, Nützlich | Sümpfe, Marschen und Moore, Grasländer, Heiden und Steppen, Wälder, Maraskan | +/–0 | +/–0 | 4/4/5/5/5/6 | 4 / 12 Silbertaler | Egelschreckpaste (S. 146) |
| Eiterfarn | 38 | Gift, physisch, psychisch, Übernatürlich | Grasländer, Heiden und Steppen, Gebirge | –3 | –2 | 1/1/2/2/3/3 | 5 / 8 Silbertaler | Freundfeind (S. 173) |
| Eitriger Krötenschemel | 39 | Gift, physisch, psychisch | Sümpfe, Marschen und Moore, Wälder, Regenwälder | –2 | –1 | 1/1/2/2/3/3 | 5 / 10 Silbertaler | Krötenschemelgift (S. 153), Purpurblitz (S. 174) |
| Färberlotos | 40 | Gift, Nützlich, Übernatürlich | Grasländer, Heiden und Steppen, Sümpfe, Marschen und Moore, Wälder, Maraskan | –1 | –1 | 1/2/3/4/5/6 | 3 / 5 Silbertaler | Tarnelixier (S. 169), Neckergel (S. 167) |
| Felsenmilch | 41 | Heilung, Nützlich | alle (nur unterirdisch) | +/–0 | +/–0 | 1/1/2/2/3/3 | 3 / 3,5 Silbertaler | – |
| Feuer- und Efferdsmoos | 42 | Gift, Nützlich, Wehrhaft | alle (nur unterirdisch) | –3 | –3 | 2/2/2/3/3/3 (bei QS 1-3 jede Variante einmal, ab QS 4 eine weitere zufällige Anwendung zusätzlich) | 12 / 15 Silbertaler | Feuerpulver (S. 161), Neckergel (S. 167) |
| Feuerschlick | 43 | physisch, Nützlich, Übernatürlich | Sümpfe, Marschen und Moore sowie auf dem Meer | –2 | –1 | 1/1/2/2/3/3 | 3 / 4 Silbertaler | Willenstrunk (RW S. 274), Feuerschlick-Essenz (S. 176), Feuerschlick-Pulver (S. 177) |
| Finage | 44 | Heilung, psychisch, Nützlich | Wälder, Regenwälder, Maraskan, Grasländer, Heiden und Steppen | –4 | –2 | 1/1/1/2/2/2 | 8 / 12 Silbertaler | Finagebast (S. 146) |
| Fünffingerkraut | 45 | Nützlich | Grasländer, Heiden und Steppen | –2 | –2 | 1/2/2/2/2/3 | 3 / 4 Silbertaler | Fingerfertigkeitselixier (S. 162) |
| Grauer Lotos | 46 | Gift, Übernatürlich | Grasländer, Heiden und Steppen, Sümpfe, Marschen und Moore, Wälder | –3 | –3 | 1/1/2/2/3/3 | 5 / 10 Silbertaler | – |
| Grauer Mohn | 47 | Gift, physisch, psychisch, Nützlich, Übernatürlich | Gebirge | –3 | –2 | 1/1/1/1/1/1 | 100 / 130 Silbertaler | – |
| Grüne Schleimschlange | 48 | psychisch | Sümpfe, Marschen und Moore | –1 | –2 | 1/1/1/2/2/2 | 0,1 / bis 2 Silbertaler | – |
| Grüner Schleimpilz | 49 | physisch, psychisch, Nützlich | Höhlen und lichtlose Tunnel | –2 | –1 | 1/2/3/4/5/6 | 6 / 9 Silbertaler | Grüner Pilzschleim (S. 147), Grünschleim-Tropfen (S. 147) |
| Gulmond | 50 | Heilung, Gift, physisch, Nützlich | Grasländer, Heiden und Steppen, Wälder | –2 | –0 | 2/2/3/3/3/4 | 6 / 6,2 Silbertaler | Fiebersaft (S. 146), Wachtrunk (S. 171), Pulver des Klaren Geistes (S. 167), Ifirnstrunk (S. 165) |
| Guraanstrauch | 51 | physisch, Nützlich | Regenwälder, Sümpfe, Marschen und Moore | –1 | –1 | 1/2/3/4/5/6 | 1 / 1,5 Silbertaler | Hesindigo (S. 147) |
| Hiradwurz | 52 | Heilung, physisch | Grasländer, Heiden und Steppen, Wüstenrandgebiete und Wüsten | –1 | –2 | 1/1/2/2/3/3 | 5 / 8 Silbertaler | Hirad-Antidot (S. 147) |
| Hlûtharsiegel | 53 | Nützlich, Übernatürlich | alle | –2 | –2 | 1/1/1/1/1/1 | 96 / 144 Silbertaler | – |
| Hollbeere | 54 | Heilung, Gift, physisch, Nützlich | Wälder | –2 | –1 | 1/1/1/2/2/3 | 4 / 8 Silbertaler | – |
| Höllenkraut | 55 | Gift, psychisch | Regenwälder, Gebirge | –3 | –3 | 1/2/3/4/5/6 | 5 / 10 Silbertaler | Wurara (RW S. 342), Angstgift (S. 172) |
| Horusche | 56 | Gift, Nützlich, Übernatürlich | Regenwälder, Maraskan | –3 | –2 | 1/1/2/2/3/3 | 5 / 8 Silbertaler | Horuschenöl (S. 147) |
| Ilmenblatt | 57 | Heilung, physisch, psychisch, Nützlich | Wälder, Regenwälder, Gebirge, Grasländer, Heiden und Steppen | –1 | –1 | 1/2/3/4/5/6 | 3 / 10 Silbertaler | Ilmenblatt-Rauchpäckchen (S. 155), Friedenswasser (S. 162), Furchtlos-Tropfen (S. 162), Hauch der Weissagung (S. 164) |
| Jacopo-Kraut | 58 | psychisch, Nützlich, Übernatürlich | Wälder | –3 | –3 | 1/1/1/2/2/2 | 4 / 8 Silbertaler | Jacopo-Duftbeutel (S. 147), Jacopo-Süßigkeit (S. 148) |
| Jagdgras | 59 | Heilung, Wehrhaft | Maraskan, Grasländer, Heiden und Steppen, Wälder | –4 | –4 | 1/2/3/4/5/6 | 8 / 16 Silbertaler | – |
| Jaguarlilie | 60 | physisch, Übernatürlich | alle | –4 | –3 | 1/1/1/1/1/1 | 2 / 20 Silbertaler | – |
| Joruga | 61 | Heilung | Wälder, Grasländer, Heiden und Steppen, Gebirge | –4 | –3 | 1/1/2/2/3/3 | 7 / 21 Silbertaler | Fiebersaft (S. 146) |
| Kairan | 62 | Heilung, Nützlich, Übernatürlich | Seen mit magisch durchdrungenem Wasser | –4 | –4 | 1/1/1/2/2/2 | 24 / 32 Silbertaler | Kairantrunk (S. 148), Zaubertrank/Astraltrank (RW S. 274) |
| Kajubo | 63 | Nützlich | Regenwälder | –1 | –1 | 1/1/1/2/2/3 | 2 / 2,2 Silbertaler | – |
| Khômknolle | 64 | Nützlich | Grasländer, Heiden und Steppen, Wüstenrandgebiete und Wüsten | –3 | –3 | 1/1/2/2/3/3 | 1 / 1,2 Silbertaler | – |
| Klippenzahn | 65 | Heilung, Nützlich | Gebirge, Grasländer, Heiden und Steppen, Wälder, Hoher Norden | –4 | –2 | 3/4/5/6/7/8 | 2 / 3 Silbertaler | Techtals Elixier (S. 169) |
| Krakenseerose | 66 | physisch, Nützlich, Wehrhaft | Grasländer, Heiden und Steppen, Sümpfe, Marschen und Moore | –2 | –2 | 1/1/2/2/3/3 | 1 / 13 Silbertaler | Schlängelbeutel (S. 150) |
| Kukuka | 67 | Heilung, Nützlich | Regenwälder | –4 | –4 | 1/1/1/2/2/3 | 16 / 24 Silbertaler | – |
| Libellengras | 68 | physisch, Nützlich | Grasländer, Heiden und Steppen, Sümpfe, Marschen und Moore | –3 | –2 | 1/1/2/2/3/3 | 8 / 10 Silbertaler | Scharfsinnelixier (S. 168) |
| Lichtnebler | 69 | Gift, Nützlich | Höhlen | –2 | –1 | 1/1/1/2/2/2 | 10 / 14 Silbertaler | Lichtnebler-Beutel (S. 173) |
| Lulanie | 70 | Heilung, Nützlich, Übernatürlich | Wälder | 0 | +1 | 1/1/1/1/2/2 | 5 / 10 Silbertaler | Liebesküchlein (S. 148), Lulanientrunk (S. 148), Feuerschlick-Essenz (S. 176) |
| Madablüte | 71 | psychisch, Nützlich, Übernatürlich | Grasländer, Heiden und Steppen, Gebirge, Orte mit Verbindung zu Mada | –5 | –3/–5, wenn nicht in Blüte | 1/1/1/1/1/1 | nicht gehandelt (Frevel gegen Hesinde), bis zu 100 Dukaten | – |
| Malomis | 72 | Nützlich, Übernatürlich | keine | nicht wild auffindbar | –4 | 1/1/1/2/2/2 | 16 / 32 Silbertaler | 1001 Rausch (S. 159) |
| Margolasch | 73 | Heilung, Gift, physisch, Nützlich | Wälder, Gebirge | –1 | –1 | 1/1/2/2/3/3 | 1 / 1,2 Silbertaler | Margolasch-Abführmittel (S. 153) |
| Menchal-Kaktus | 74 | Heilung, Nützlich, Übernatürlich | Wüstenrandgebiete und Wüsten | –3 | –2 | 1/1/1/2/2/2 | 6 / 10 Silbertaler | Feengesteck (S. 146), Menchal-Rüstung (S. 149), Antidot (RW S. 272) |
| Merach-Strauch | 75 | Gift | Wälder, Regenwälder, Gebirge | –1 | –1 | 1/1/1/1/1/1 | 5 / 8 Silbertaler | Merach-Extrakt (S. 174) |
| Messergras | 76 | Nützlich, Wehrhaft | Grasländer, Heiden und Steppen, Wüstenränder und Wüsten | –2 | +/–0 | 1/2/3/4/5/6 | 2 / 4 Silbertaler | Messergras-Skalpell (S. 149) |
| Mibelrohr | 77 | Heilung, Gift, Nützlich, Übernatürlich | Flussauen, Seeufer, Sümpfe, Marschen und Moore zwischen Salza und Mengbilla | –3 | –2 | 1/1/2/2/2/3 | 12 / 24 Silbertaler | Kairantrunk (S. 148), Mibel-Absud (S. 156), Gewandtheitselixier (S. 163) |
| Mirbelstein | 78 | Nützlich | Grasländer, Heiden und Steppen, Wälder | –2 | –2 | 1/1/1/2/2/2 | 4 / 8 Silbertaler | Stinkmirbelsäckchen (S. 150) |
| Mirhamer Seidenliane | 79 | Gift, physisch, psychisch, Nützlich | Regenwälder, Gebirge | –3 | –1 | 1/1/2/2/3/3 | 9 / 36 Silbertaler | – |
| Moarana-Liane | 80 | Gift, physisch, Nützlich | Regenwälder, Wälder | –2 | –2 | 1/2/3/4/5/6 | 4 / 6 Silbertaler | Boabungaha (S. 152), Moarana-Liebessaft (S. 156), Wachtrunk (S. 171) |
| Mordpilz | 81 | Gift, physisch, psychisch | Regenwälder, Maraskan | –4 | –4 | 1/1/1/1/2/2 | 5 / 10 Silbertaler | – |
| Morgendornstrauch | 82 | Wehrhaft, Übernatürlich | Sümpfe, Marschen und Moore | –4 | –2 | keine (es können aber 1/2/3/4/5/6 Sträucher gefunden werden) | 1 / 1 Silbertaler (aber gewöhnlich keine Nachfrage) | – |
| Naftanstaude | 83 | Gift | Grasländer, Heiden und Steppen, Wälder | –2 | –2 | 1/1/2/2/3/3 | 4 / 10 Silbertaler | Goldleim (S. 152) |
| Neckerkraut | 84 | Heilung | Regenwälder, Sümpfe, Marschen und Moore, Grasländer, Heiden und Steppen in Küstennähe | –1 | +/–0 | 3/4/5/6/7/8 | 3 / 3,5 Silbertaler | – |
| Nemezijn | 85 | Gift, physisch, psychisch, Wehrhaft, Übernatürlich | Maraskan | Man kann Nemezijn nicht finden, | Nemezijn erdenkt seine | Nemezijn lässt sich nicht benutzen. | Nemezijn ist weder käuflich noch verkäuflich. | – |
| Nothilf | 86 | Heilung | Wald, Gebirge | –2 | –1 | 1/2/3/4/5/6 | 10 / 16 Silbertaler, dort, wo Tulmadron genutzt wird, in der Regel zehnfache Preise | – |
| Olginwurz | 87 | Heilung, Nützlich | Grasländer, Heiden und Steppen, Wälder, Gebirge, Wüstenrandgebiete & Wüsten | –4 | –4 | 1/1/1/1/1/1 | 32 / 64 Silbertaler | Konstitutionselixier (S. 165) |
| Orazal | 88 | Gift, physisch, Nützlich, Übernatürlich | Wälder, Regenwälder, Gebirge | –2 | –1 | 1/1/1/2/2/2 | 5 / 9 Silbertaler | Orazalkleber (S. 149), Alchimistensäure (S. 159), Hylailer Feuer (S. 164), Merach-Extrakt (S. 174), Feuerschlick-Pulver (S. 177) |
| Orkland-Bovist | 89 | Gift, physisch, Wehrhaft | Grasländer, Heiden und Steppen, Wälder | –2 | –1 | 1/1/2/2/3/3 | 0,2 / 0,3 Silbertaler | – |
| Pestsporenpilz | 90 | Gift, psychisch, Nützlich, Wehrhaft, Übernatürlich | Grasländer, Heiden und Steppen, Sümpfe, Marschen und Moore | –2 | –1 | 1/1/1/2/2/2 | 2 / 4 Silbertaler | Erscheinungspulver (S. 160), Katzenaugensalbe (S. 177) |
| Phosphorpilz | 91 | Gift, Nützlich | alle (nur unterirdisch) | +1 | +1 | 1/2/3/4/5/6 | 2 / 4 Silbertaler | Kaltes Licht (S. 165) |
| Purpurmohn | 92 | physisch, psychisch, Übernatürlich | Grasländer, Heiden und Steppen, Wälder | –4 | –2 | 1/1/1/1/1/1 | 20 / 50 Silbertaler | – |
| Purpurner Lotos | 93 | Gift, physisch, psychisch, Übernatürlich | Grasländer, Heiden und Steppen, Sümpfe, Marschen und Moore, Wälder | –1 | –1 | 1/2/3/4/5/6 | 4 / 8 Silbertaler | Purpurner Lotosstaub (S. 153), Purpurblitz (S. 174), Lotosöl (S. 174) |
| Quasselwurz | 94 | Nützlich | Wälder | –5 | –5 | 1/1/1/2/2/2 | 25 / 50 Silbertaler | Quasselpulver (S. 168) |
| Quinja | 95 | Heilung, physisch, Nützlich | Regenwälder, Wälder | –3 | –2 | 3/3/4/4/5/5 | 6 / 6,5 Silbertaler | Quinja-Schnaps (S. 156) |
| Rahjalieb | 96 | Nützlich | Grasländer, Heiden und Steppen, Sümpfe, Marschen und Moore, Wälder, Regenwälder (letzteres besonders häufig) | 0 | +1 | 1/1/2/2/3/3 | 1 / 1,5 Silbertaler | – |
| Rattenpilz | 97 | physisch, psychisch, Übernatürlich | alle | –4 | –3 | 1/1/2/2/3/3 | wird nicht öffentlich gehandelt | – |
| Rauschgurke | 98 | physisch, psychisch, Nützlich | Maraskan | –2 | –1 | 1/1/2/2/3/3 | 10 / 16 Silbertaler | – |
| Rote Pfeilblüte | 99 | Heilung, Nützlich | Sümpfe, Marschen und Moore, Wälder, Regenwälder | –3 | –2 | 1/1/1/2/2/2 | 6 / 12 Silbertaler | – |
| Roter Drachenschlund | 100 | Heilung, Nützlich | Wälder | –4 | –3 | 1/1/1/2/2/2 | 20 / 30 Silbertaler | Gnädiger Drachenodem (S. 163) |
| Roter Lotos | 101 | Gift, physisch, Übernatürlich | Grasländer, Heiden und Steppen, Sümpfe, Marschen und Moore, Wälder, Maraskan | –2 | –1 | 1/1/2/2/3/3 | 2 / 4 Silbertaler | Gardistenkeuche (S. 152), Halbgift (S. 173) |
| Sansaro | 102 | Heilung, Nützlich | Sümpfe, Marschen und Moore, Regen wälder, Maraskan | –5 | –4 | 1/1/1/2/2/3 | 9 / 18 Silbertaler | Sansaro-Essenz (S. 149), Sansaro-Paste (S. 149) |
| Satuariensbusch | 103 | Heilung, physisch, Nützlich, Übernatürlich | Wälder, Grasländer, Heiden und Steppen, Gebirge | –2 | –2 | 1/1/1/2/2/2 | 8 / 12 Silbertaler | Bannkreide (S. 159) |
| Schattennebler | 104 | physisch, Nützlich | Wälder, Gebirge | –2 | +/–0 | 1/1/1/1/1/1 | 2 / 2,2 Silbertaler | – |
| Schlangentang | 105 | Wehrhaft, Übernatürlich | alle | –3 | –1 | 1/1/1/1/1/1 | 0,75 / 1 Silbertaler | – |
| Schlangenzünglein | 106 | Nützlich | Sümpfe, Marschen und Moore, Maraskan | –1 | –1 | 1/1/1/2/2/2 | 10 / 15 Silbertaler | Magiepaste (S. 166) |
| Schleichender Tod | 107 | Gift, physisch, Nützlich | Sümpfe, Marschen und Moore, Wälder, Regenwälder | –2 | –2 | 1/1/2/2/3/3 | 8 / 16 Silbertaler | Samthauch (S. 157), Liebestrunk (RW S. 273), Mengbiller Bannbalöl (S. 166) |
| Schleimiger Sumpfknöterich | 108 | Gift, physisch, Nützlich | Wälder | –1 | –2 | 1/1/1/2/2/2 | 6 / 8 Silbertaler | Knötergift (S. 152), Berserkerelixier (S. 160) |
| Schlinggras | 109 | Nützlich, Wehrhaft | Sümpfe, Marschen und Moore | –4 | –4 | 1/1/1/1/1/1 | 0,2 / 0,3 Silbertaler | Blasrohr (S. 145) |
| Schwarmschwamm | 110 | Gift, physisch, psychisch, Übernatürlich | nur langsam fließende Gewässer | –2 | –1 | 1/1/1/2/2/2 | 6 / 9 Silbertaler | – |
| Schwarzäugige Canyzeth | 111 | Nützlich, Übernatürlich | Wälder | –3 | –1 | 1/1/1/1/1/1 | 6 / 8 Silbertaler | Schwarzäugiges Amulett (S. 150) |
| Schwarzer Lotos | 112 | Heilung, Gift, physisch, psychisch, Nützlich | Sümpfe, Marschen und Moore | –5 | –1 | 1/1/1/2/2/2 | 50 / 250 Silbertaler | Schwarzer Lotosstaub (S. 153), Lotoswein (S. 156), Antidot (RW S. 272) |
| Schwarzer Mohn | 113 | Heilung, physisch, psychisch, Übernatürlich | Grasländer, Heiden und Steppen | –4 | –1 | 1/1/2/2/3/3 | 10 / 15 Silbertaler | Schwarzer Weihrauch (S. 157), Schlaftrunk (S. 168), Schlafgift (S. 174) |
| Schwarzer Weinstock | 114 | Heilung, Gift, physisch, psychisch, Nützlich, Wehrhaft, Übernatürlich | Wälder, Grasländer, Heiden und Steppen Araniens | –4 | –4 | 1/1/1/1/1/1 | 3 / 5 Silbertaler | Schwarzer Wein (S. 158), Mutelixier (S. 167), Charismaelixier (S. 160) |
| Seelenhauch | 115 | Gift, physisch, Nützlich, Übernatürlich | Grasländer, Heiden und Steppen | –4 | –2 | 1/1/1/2/2/3 | 10 / 15 Silbertaler | Tijakools Hauch (S. 170) |
| Shurinstrauch | 116 | Gift, physisch | Grasländer, Heiden und Steppen, Wälder | –3 | –3 | 1/1/2/2/3/3 | 35 / 50 Silbertaler | Shurinknollengift (S. 153) |
| Steinrinde | 117 | Nützlich | alle (nur unterirdisch) | –1 | 0 | 1/1/2/2/3/3 | 1,5 / 3 Silbertaler | – |
| Talaschin | 118 | physisch, Nützlich | Hoher Norden, Wüstenrandgebiete & Wüsten, selten auch überall sonst | 0 | 0 | 1/2/3/4/5/6 | 1 / 2 Silbertaler | Talaschin-Tinktur (S. 150) |
| Tarnblatt | 119 | physisch, Nützlich, Übernatürlich | Maraskan | –3 | –5 | 1/1/2/2/3/3 | 15 / 18 Silbertaler | Tarntinktur (S. 151), Zurbarans Pflanzentinktur (S. 172) |
| Tarnele | 120 | Heilung, Nützlich | Grasländer, Heiden und Steppen, Wälder, Sümpfe, Marschen und Moore | +2 | +/–0 | 1/1/2/2/3/3 | 3 / 6 Silbertaler | Narbenpulver (S. 149) |
| Thonnys | 121 | Heilung, physisch, Nützlich, Übernatürlich | Grasländer, Heiden und Steppen, Wälder | –4 | –4 | 1/1/2/2/3/3 | 16 / 32 Silbertaler | Willenstrunk (RW S. 274), Zaubertrank (RW S. 274), Aufputschmittel (S. 157) |
| Tigermohn | 122 | Heilung, physisch, psychisch, Nützlich | Grasländer, Heiden und Steppen, Wälder | –2 | –3 | 1/1/2/2/3/3 | 7 / 10 Silbertaler | Beruhigungsmittel (S. 154), Friedenswasser (S. 162) |
| Traschbart | 123 | Heilung | Wald, Sümpfe, Marschen und Moore | –3 | –2 | 1/1/2/2/3/3 | 6 / 18 Silbertaler | Fiebersaft (S. 146) |
| Trichterwurzel | 124 | Heilung, Gift, psychisch, Wehrhaft | Maraskan | –4 | –4 | 1/1/1/1/1/1 | 16 / 18 Silbertaler | Pulver des Klaren Geistes (S. 167) |
| Tuur-Amash-Kelch | 125 | Gift, physisch, Wehrhaft, Übernatürlich | alle | –3 | 0 | 1/1/1/1/1/1 | 6 / 9 Silbertaler | – |
| Ulmenwürger | 126 | Heilung | Sümpfe, Marschen und Moore, Wälder | –2 | –2 | 1/2/3/4/5/6 | 6 / 9 Silbertaler | Heilsalbe (S. 164) |
| Vierblättrige Einbeere | 127 | Heilung, Gift | Wälder, Heiden, Grasländer und Steppen | –3 | –2 | 1/1/2/2/3/3 | 6 / 7 Silbertaler | Einbeerentrank (S. 155) |
| Vragieswurzel | 128 | Gift, physisch, psychisch | Wälder, Regenwälder, Gebirge | –3 | –2 | 1/1/1/2/2/2 | 5 / 8 Silbertaler | Boronwein (S. 154), Betäubungsgift (S. 172), Schlafgift (S. 174), Regenbogenstaub (S. 177) |
| Waldwebe | 129 | Gift, Nützlich, Wehrhaft | Wälder, Regenwälder, Maraskan | –3 | –4 | 1/2/3/4/5/6 | 12 / 14 Silbertaler | Waldwebennetz (S. 151) |
| Wandermoos | 130 | physisch, Nützlich | alle (nur unterirdisch) | –5 | –5 | 1/1/1/2/2/2 | 10 / 20 Silbertaler | Wandermoos-Essenz (S. 151) |
| Wasserrausch | 131 | physisch, psychisch, Nützlich | Grasländer, Heiden und Steppen, Sümpfe, Marschen und Moore, Wälder | –4 | –1 | 1/1/1/1/1/1 | 15 / 30 Silbertaler | Rahjasine (S. 156) |
| Weißdorn | 132 | Nützlich | Grasländer, Heiden und Steppen | –3 | +1 | 1/1/1/1/1/1 | 4 / 12 Silbertaler | Weißdorn-Mazerat (S. 151) |
| Weißer Lotos | 133 | Gift, physisch, psychisch, Nützlich, Übernatürlich | Grasländer, Heiden und Steppen, Sümpfe, Marschen und Moore, Wälder | –4 | –3 | 1/1/1/2/2/2 | 12 / 16 Silbertaler | Marbos Odem (S. 156), Stabiles Zazamotoxin (S. 174) |
| Weißgelber Lotos | 134 | Gift, psychisch, Nützlich, Übernatürlich | Grasländer, Heiden und Steppen, Sümpfe, Marschen und Moore, Wälder | –3 | –3 | 1/1/1/2/2/2 | 8 / 12 Silbertaler | Lotostrunk (S. 166) |
| Winselgras | 135 | psychisch, Nützlich | Grasländer, Heiden und Steppen | –2 | +/–0 | 1/1/1/2/2/2 | 0,5 / 2 Silbertaler | Matte der Ruhestörung (S. 148) |
| Wirselkraut | 136 | Heilung | alle | –1 | –2 | 3/3/3/4/4/5 | 2 / 2,2 Silbertaler | Brandsalbe (S. 146), Wirseltrank (S. 151), Heilsalbe (S. 164), Heiltrank (RW S. 272) |
| Wolchrauke | 137 | Gift, physisch, Nützlich | Hoher Norden, Grasländer, Heiden und Steppen, Wälder, Gebirge | –3 | –3 | 1/1/2/2/3/3 | 8 / 12 Silbertaler | – |
| Würgedattel | 138 | Wehrhaft | Regenwälder | –2 | –2 | 1/1/2/2/3/3 | 12 / 20 Silbertaler | – |
| Yaganstrauch | 139 | Heilung, physisch, psychisch, Nützlich | Wälder, Gebirge, Maraskan | –2 | –1 | 1/2/2/3/3/3 | 6 / 6,5 Silbertaler (Nüsse) | Schlaftrunk (S. 168), Aufputschmittel (S. 175) |
| Zithabar | 140 | physisch, psychisch, Nützlich | Grasländer, Heiden und Steppen, Sümpfe, Marschen und Moore | –2 | –2 | 1/1/2/2/3/3 | 2 / 12 Silbertaler | Schwarzer Pfeffer (S. 157), Hauch der Weissagung (S. 164) |
| Zunderschwamm | 141 | Nützlich | Wälder, Regenwälder, Maraskan | –1 | –1 | 1/2/3/4/5/6 | 0,1 / 0,2 Silbertaler (reicht für ca. 25 Portionen Zunder) | Scherzschwamm (S. 150), Schwammzunder (S. 150) |
| Zwölfblatt | 142 | Heilung, Gift, physisch | Wälder, Grasländer, Heiden und Steppen, Sümpfe, Marschen und Moore | –2 | –3 | 1/1/1/2/2/3 | 1 / 24 Silbertaler | – |

## Recipes referenced by the plants

Collected from the plants' Rezepte fields (134 entries; S. = AdK page, RW = Regelwerk). The recipe chapter: Pflanzliche Rezepte S. 144–157 (Pflanzenkunde check; Hilfsmittel, Rauschmittel), Alchimistische Rezepte S. 158–177 (Elixiere, Gifte, Rauschmittel; Alchimie). A few labels are context words, not names (e.g. "experimentell in Antidot"); check the page.

| Rezept | S. | Pflanzen |
|---|---|---|
| Tharvun-Parfüm | 88 | Dornrose |
| Atanax | 145 | Atan-Kiefer |
| Atmonbrei | 145 | Atmon |
| Blasrohr | 145 | Schlinggras |
| Blauschirmsporen | 145 | Blauschirmpilz |
| Blutblattkranz | 146 | Blutblatt |
| Brandsalbe | 146 | Chonchinis, Wirselkraut |
| Dergolasch-Pulver | 146 | Dergolasch |
| Dornrosengerte | 146 | Dornrose |
| Egelschreckpaste | 146 | Egelschreck |
| Feengesteck | 146 | Menchal-Kaktus |
| Fiebersaft | 146 | Belmart, Gulmond, Joruga, Traschbart |
| Finagebast | 146 | Finage |
| Grüner Pilzschleim | 147 | Grüner Schleimpilz |
| Grünschleim-Tropfen | 147 | Grüner Schleimpilz |
| Hesindigo | 147 | Guraanstrauch |
| Hirad-Antidot | 147 | Hiradwurz |
| Horuschenöl | 147 | Horusche |
| Jacopo-Duftbeutel | 147 | Jacopo-Kraut |
| Jacopo-Süßigkeit | 148 | Jacopo-Kraut |
| Kairantrunk | 148 | Kairan, Mibelrohr |
| Krähenfüße | 148 | Aranische Wassernuss |
| Liebesküchlein | 148 | Lulanie |
| Lulanientrunk | 148 | Lulanie |
| Matte der Ruhestörung | 148 | Winselgras |
| Menchal-Rüstung | 149 | Menchal-Kaktus |
| Messergras-Skalpell | 149 | Messergras |
| Narbenpulver | 149 | Tarnele |
| Orazalkleber | 149 | Orazal |
| Praiosmilch | 149 | Chonchinis |
| Sansaro-Essenz | 149 | Sansaro |
| Sansaro-Paste | 149 | Sansaro |
| Scherzschwamm | 150 | Zunderschwamm |
| Schlängelbeutel | 150 | Braunschlinge, Krakenseerose |
| Schwammzunder | 150 | Zunderschwamm |
| Schwarzäugiges Amulett | 150 | Schwarzäugige Canyzeth |
| Stinkmirbelsäckchen | 150 | Mirbelstein |
| Talaschin-Tinktur | 150 | Talaschin |
| Tarntinktur | 151 | Tarnblatt |
| Waldwebennetz | 151 | Waldwebe |
| Wandermoos-Essenz | 151 | Wandermoos |
| Weißdorn-Mazerat | 151 | Weißdorn |
| Wirseltrank | 151 | Wirselkraut |
| Axorda-Katzensäckchen | 152 | Axorda-Baum |
| Boabungaha | 152 | Moarana-Liane |
| Gardistenkeuche | 152 | Roter Lotos |
| Goldleim | 152 | Naftanstaude |
| Knötergift | 152 | Schleimiger Sumpfknöterich |
| Krötenschemelgift | 153 | Eitriger Krötenschemel |
| Margolasch-Abführmittel | 153 | Margolasch |
| Purpurner Lotosstaub | 153 | Purpurner Lotos |
| Schwarzer Lotosstaub | 153 | Schwarzer Lotos |
| Shurinknollengift | 153 | Shurinstrauch |
| Beruhigungsmittel | 154 | Tigermohn |
| Boronwein | 154 | Vragieswurzel |
| Cheriacha | 154 | Cheria-Kaktus |
| Dornrosenöl | 154 | Dornrose |
| Einbeerentrank | 155 | Vierblättrige Einbeere |
| Ilmenblatt-Rauchpäckchen | 155 | Ilmenblatt |
| Lotoswein | 156 | Schwarzer Lotos |
| Marbos Odem | 156 | Weißer Lotos |
| Mibel-Absud | 156 | Mibelrohr |
| Moarana-Liebessaft | 156 | Moarana-Liane |
| Quinja-Schnaps | 156 | Quinja |
| Rahjasine | 156 | Wasserrausch |
| Aufputschmittel | 157 | Thonnys |
| Samthauch | 157 | Schleichender Tod |
| Schleieröffner | 157 | Dämonenklaue |
| Schwarzer Pfeffer | 157 | Zithabar |
| Schwarzer Weihrauch | 157 | Schwarzer Mohn |
| Schwarzer Wein | 158 | Schwarzer Weinstock |
| 1001 Rausch | 159 | Malomis |
| Alchimistensäure | 159 | Orazal |
| Bannkreide | 159 | Satuariensbusch |
| Berserkerelixier | 160 | Schleimiger Sumpfknöterich |
| Charismaelixier | 160 | Schwarzer Weinstock |
| Erscheinungspulver | 160 | Pestsporenpilz |
| Eulentränen | 161 | Carlog |
| Feuerpulver | 161 | Feuer- und Efferdsmoos |
| Fingerfertigkeitselixier | 162 | Fünffingerkraut |
| Friedenswasser | 162 | Ilmenblatt, Tigermohn |
| Furchtlos-Tropfen | 162 | Dergolasch, Ilmenblatt |
| Gewandtheitselixier | 163 | Mibelrohr |
| Gnädiger Drachenodem | 163 | Roter Drachenschlund |
| Hauch der Weissagung | 164 | Cheria-Kaktus, Ilmenblatt, Zithabar |
| Heilsalbe | 164 | Bleichmohn, Ulmenwürger, Wirselkraut |
| Hylailer Feuer | 164 | Orazal |
| Ifirnstrunk | 165 | Gulmond |
| Kaltes Licht | 165 | Phosphorpilz |
| Konstitutionselixier | 165 | Olginwurz |
| Lotostrunk | 166 | Weißgelber Lotos |
| Magiepaste | 166 | Schlangenzünglein |
| Mengbiller Bannbalöl | 166 | Schleichender Tod |
| Mutelixier | 167 | Schwarzer Weinstock |
| Neckergel | 167 | Feuer- und Efferdsmoos, Färberlotos |
| Pulver des Klaren Geistes | 167 | Gulmond, Trichterwurzel |
| Quasselpulver | 168 | Quasselwurz |
| Scharfsinnelixier | 168 | Libellengras |
| Schlaftrunk | 168 | Schwarzer Mohn, Yaganstrauch |
| Schmerzwein | 169 | Bleichmohn |
| Tarnelixier | 169 | Färberlotos |
| Techtals Elixier | 169 | Klippenzahn |
| Tijakools Hauch | 170 | Seelenhauch |
| Unverwundbarkeitselixier | 171 | Braunschlinge |
| Wachtrunk | 171 | Gulmond, Moarana-Liane |
| Weissagungspulver | 171 | Cheria-Kaktus |
| Angstgift | 172 | Höllenkraut |
| Betäubungsgift | 172 | Vragieswurzel |
| Zurbarans Pflanzentinktur | 172 | Tarnblatt |
| Freundfeind | 173 | Eiterfarn |
| Halbgift | 173 | Roter Lotos |
| Lichtnebler-Beutel | 173 | Lichtnebler |
| Lotosöl | 174 | Purpurner Lotos |
| Merach-Extrakt | 174 | Merach-Strauch, Orazal |
| Purpurblitz | 174 | Eitriger Krötenschemel, Purpurner Lotos |
| Schlafgift | 174 | Schwarzer Mohn, Vragieswurzel |
| Stabiles Zazamotoxin | 174 | Weißer Lotos |
| Aufputschmittel | 175 | Yaganstrauch |
| Drachentrunk | 175 | Dracheneiranke |
| Dreh-Öl | 176 | Druidenwurz |
| Feuerschlick-Essenz | 176 | Feuerschlick, Lulanie |
| Feuerschlick-Pulver | 177 | Feuerschlick, Orazal |
| Katzenaugensalbe | 177 | Carlog, Pestsporenpilz |
| Regenbogenstaub | 177 | Vragieswurzel |
| Alrauniger Homunculus | 241 | Alraune |
| Antidot | RW 272 | Menchal-Kaktus, Schwarzer Lotos |
| Heiltrank | RW 272 | Wirselkraut |
| experimentell in Antidot | RW 272 | Belmart |
| Liebestrunk | RW 273 | Schleichender Tod |
| Willenstrunk | RW 274 | Feuerschlick, Thonnys |
| Zaubertrank | RW 274 | Thonnys |
| Zaubertrank/Astraltrank | RW 274 | Kairan |
| Kelmon | RW 342 | Disdychonda |
| Wurara | RW 342 | Höllenkraut |
