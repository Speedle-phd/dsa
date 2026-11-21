# Kulturen

source: DSA5 Regelwerk, S. 40–42, 95–126

## Summary

- The culture itself is free. It gives the mother tongue as Sprache III and one Ortskenntnis for free (S. 41).
- The script is only a suggestion and must be bought (2 AP in every culture; some cultures have none).
- The Kulturpaket is optional and bought as a whole for its AP; it adds +1/+2 to typical talents (S. 40, 96).
- Social status is "frei" by default; Adel/Unfrei are bought as the advantage Adel or the disadvantage Unfrei (S. 41).
- Cultures outside the species' usual list need the GM's approval (S. 40).

## Values / formulas

Package AP (S. 41–42): Andergast 20, Aranien 26, Bornland 18, Fjarninger 33, Horasreich 27, Maraskan 26, Mhanadistan 28, Mittelreich 12, Nivesen 37, Norbarden 18, Nordaventurien 25, Nostria 15, Novadis 25, Südaventurien 26, Svellttal 21, Thorwal 24, Utulus 40, Waldmenschen 42, Zyklopeninseln 16; Auelfen 43, Firnelfen 55, Waldelfen 47; Ambosszwerge 31, Brillantzwerge 29, Erzzwerge 34, Hügelzwerge 13. The talents of each package are in `cultureCatalog.ts`.

Mother tongue choices: Aranien (Tulamidya or Garethi), Maraskan (Garethi or Tulamidya), Nordaventurien (Alaani, Garethi, Nujuka or Thorwalsch), Zyklopeninseln (Garethi or Zyklopäisch). Dialects in brackets are flavour only.

Script names mapped to the app catalog: "Tulamidya" → Tulamidya-Zeichen, "Heilige Glyphen von Unau" → Geheiligte Glyphen von Unau, "Isdira-Zeichen" → Isdira- und Asdharia-Zeichen.

Usual professions (S. 97–125) are encoded per culture as worldly "all except …" or "only …", plus the magic (Hexe, Magier, Wildnisläufer, Zauberweber) and priest (church) lists. Elven cultures list only Wildnisläufer and Zauberweber. Entries marked "selten"/"sehr selten" count as usual.

## Open questions

- Typical/untypical talents and Vor-/Nachteile are not encoded yet (display only).

## Code

- `server/src/utils/creation/cultureCatalog.ts` (data); test `creationLedger.test.ts` checks the package AP and that every talent, language and script exists.
