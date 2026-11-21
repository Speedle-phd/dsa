# Professionen

source: DSA5 Regelwerk, S. 44–45, 127–160

## Summary

- A Professionspaket is bought as a whole for its AP (S. 44, 128). A variant replaces the price with its own total and sets values absolutely ("X statt Y").
- Prerequisites are not part of the price: Spezies, Vorteile (Zauberer, Adel …), Tradition SF, required disadvantages (Weißmagier: Prinzipientreue II), and the attributes the package's special abilities need (S. 128; "KO 13 (für die SF Belastungsgewöhnung I)").
- Talents and combat techniques not in the package stay at 0 / 6 (S. 128). Spells and liturgies of the package are activated and count toward the EG limit (S. 45).
- Packages may be modified: lowering a value saves its AP, raising costs AP within the EG caps (S. 45).
- Professions outside the culture's usual list need the GM's approval (S. 44).
- Inside a package, Bindung des Stabes costs 14 AP without the permanent AsP (S. 128).

## Values / formulas

Worldly (S. 129–144), AP with variants: Barde 150 (Geschichtenerzähler/Haimamud 144, Skalde 162), Gardist 246 (Aufseher 234, Kerkermeister 239, Zöllner 258), Gaukler 160 (Akrobat 173, Dompteur 171, Messerwerfer 160, Possenreißer 154, Wahrsager 146), Gladiator 164 (Grubenkämpfer 139, Schaukämpfer 159), Händler 136 (Fahrender Händler 167, Fernhändler 172, Geldwechsler 153, Hausierer 162, Tauschhändler 166), Heiler 207 (Hebamme 218, Medicus 221, Quacksalber 196), Höfling 176 (Adelsspross 172, Diplomat 192, Hofdame 171, Müßiggänger 195), Jäger 246 (Großwildjäger 260, Kopfgeldjäger 278, Stammesjäger 258), Krieger 216, Prostituierte 203 (Bordellmutter 230, Hure 226, Kurtisane 209, Mätresse 213), Ritter 230 (Hofritter 228, Raubritter 226), Seefahrer 173 (Fischer 185, Pirat 199, Walfänger 191), Söldner 202 (Plänkler 218, Leichtgerüstete 217, Schwergerüstete 222), Spitzel 230 (Geheimagent 266, Meuchelmörder 302), Stammeskrieger 289, Streuner 212 (Bettler 203, Dieb 221, Einbrecher 225, Hochstapler 247, Spieler 228).

Casters (S. 145–153): Wildnisläufer 256, Zauberweber 221 (species Elf + Tradition (Elf)); Katzenhexe 285, Krötenhexe 296, Rabenhexe 295 (Zauberer + Tradition (Hexe)); Gildenloser Magier 237, Graumagier 314, Schwarzmagier 302, Weißmagier 316 (Zauberer + Tradition (Gildenmagier); Weißmagier also Prinzipientreue II).

Priests (S. 154–159): Borongeweihter 285 (Diener Bishdariels 292, Diener Golgaris 303), Hesindegeweihter 312 (Pastori 329, Satori 322), Perainegeweihter 290 (Heiler 298, Säer 305), Phexgeweihter 304 (Beutelschneider 319, Händler 315, Fassadenkletterer 324), Praiosgeweihter 242 (Legalisten 244, Prinzipisten 254), Rondrageweihter 283 (Salutaristen 296, Traditionalisten 295, Honoren 282). Each requires Geweihter, `Tradition (<Gott>kirche)`, Prinzipientreue (Boron, Praios, Rondra II; others I) and Verpflichtungen II, and includes Die Zwölf Segnungen and its package liturgies, see [../karma/liturgies.md](../karma/liturgies.md).

Choices inside packages: one or two combat techniques from a list at a value; Zaubertricks from a list (1 or 2); the application of the Fertigkeitsspezialisierung; "Sprachen (und Schriften) für insgesamt N AP"; witches "Flüche für insgesamt N AP" (Krötenhexe 12, Rabenhexe 8).

Variant restrictions: Haimamud (Aranien, Mhanadistan or Novadis — the variant shares its entry with the Geschichtenerzähler, so this is a note), Skalde (Thorwal), Tauschhändler (Fjarninger, Utulus, Waldmenschen, Nivesen), Hofdame (Andergast, female).

## Edge cases

- Book spellings that differ from the catalogs: "Odem" = Odem Arcanum, "Balsam" = Balsam Salabunde, "Blitz" = Blitz dich find, "Lanze" = Lanzen, "Armbürste" = Armbrüste, "Heilkunde Krankheit" = Heilkunde Krankheiten. The catalog test checks every key.
- Elfenlieder (Freundschaftslied, Zaubermelodie) are listed under Sonderfertigkeiten in the elven packages; they are spells of kind Elfenlied in the app.
- Söldner variants Leichtgerüstete/Schwergerüstete only add Finte I / Zu Fall bringen; the book names no other change.
- "Fulminictus (Elfen)" and similar marks are Fremdzauber; the app detects them from the spell's traditions.

## Code

- `server/src/utils/creation/professionCatalog.ts` (data, `resolvedProfession`), used by `creationLedger.ts`; client `features/creation/CreationProfession.tsx`.
