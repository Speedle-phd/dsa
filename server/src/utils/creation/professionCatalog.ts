// Professionspakete (S. 127–160). A package is bought as a whole for its AP; prerequisites (Vorteile, Tradition) are paid separately
// (S. 44–45, 128). Variants have their own total AP and set values absolutely ("X statt Y").
export type TechniqueChoice = { options: string[]; count: number; value: number }
export type ProfessionGroup = 'worldly' | 'magic' | 'divine'
export type ProfessionVariant = {
   key: string
   ap: number
   talents?: Record<string, number>
   techniques?: Record<string, number>
   // Replaces the package's choice slots ([] = no choice left)
   choices?: TechniqueChoice[]
   specialization?: string
   addAbilities?: string[]
   addCombatAbilities?: string[]
   removeCombatAbilities?: string[]
   // "… müssen als Kultur X wählen" / "muss weiblich sein"
   cultures?: string[]
   sex?: 'female'
   note?: string
}
export type ProfessionDefinition = {
   key: string
   group: ProfessionGroup
   // How cultures list it: Hexe, Magier, a church … (worldly professions use their key)
   family?: string
   page: number
   ap: number
   // Paid separately: advantages, special abilities, disadvantages (with level) and species the package needs (S. 128)
   requiredAdvantages?: string[]
   requiredAbilities?: string[]
   requiredDisadvantages?: Array<{ key: string; level: number }>
   requiredSpecies?: string[]
   // "Sprachen (und Schriften) für insgesamt N AP" (S. 128)
   languageBudget: number
   budgetIncludesScripts: boolean
   // Fertigkeitsspezialisierung in this talent; the application is chosen by the player
   specialization: string | null
   abilities: string[]
   combatAbilities: string[]
   techniques: Record<string, number>
   choices: TechniqueChoice[]
   talents: Record<string, number>
   // Spells, rituals, curses and elven songs of the package: activated and counted toward the EG limit (S. 45)
   spells?: Record<string, number>
   // "ein/zwei Zaubertrick(s) aus folgender Liste"
   tricks?: { count: number; options: string[] }
   // "Flüche für insgesamt N AP" (witches)
   curseBudget?: number
   // Liturgies and ceremonies of the package; priests also get "Die Zwölf Segnungen" (S. 154–159)
   liturgies?: Record<string, number>
   blessings?: 'twelve'
   variants: ProfessionVariant[]
}

const choose = (value: number, options: string[], count = 1): TechniqueChoice => ({ options, count, value })

// source: DSA5 Regelwerk, S. 129–144 (weltliche Professionen)
export const professionCatalog: ProfessionDefinition[] = [
   { key: 'Barde', group: 'worldly', page: 129, ap: 150, languageBudget: 16, budgetIncludesScripts: true, specialization: 'musizieren', abilities: [], combatAbilities: [],
      techniques: { Dolche: 8, Raufen: 8 }, choices: [],
      talents: { singen: 7, tanzen: 2, bekehrenUeberzeugen: 2, betoeren: 2, etikette: 4, gassenwissen: 4, menschenkenntnis: 5, ueberreden: 5, wildnisleben: 2,
         geographie: 4, geschichtswissen: 4, goetterUndKulte: 4, rechnen: 3, rechtskunde: 2, sagenUndLegenden: 5, holzbearbeitung: 3, musizieren: 7 },
      variants: [
         { key: 'Geschichtenerzähler und Haimamud', ap: 144, specialization: 'sagenUndLegenden', talents: { singen: 0, gassenwissen: 7, sagenUndLegenden: 7, holzbearbeitung: 0, musizieren: 0 },
            note: 'Haimamudim choose the culture Aranien, Mhanadistan or Novadis.' },
         { key: 'Skalde', ap: 162, techniques: { Hiebwaffen: 8 }, talents: { sagenUndLegenden: 8 }, cultures: ['Thorwal'] },
      ] },
   { key: 'Gardist', group: 'worldly', page: 130, ap: 246, languageBudget: 10, budgetIncludesScripts: true, specialization: 'gassenwissen', abilities: [],
      combatAbilities: ['Belastungsgewöhnung I', 'Wuchtschlag I'], techniques: { Armbrüste: 10, Raufen: 8 }, choices: [choose(10, ['Hiebwaffen', 'Schwerter', 'Stangenwaffen'], 2)],
      talents: { koerperbeherrschung: 3, selbstbeherrschung: 4, sinnesschaerfe: 5, einschuechtern: 4, etikette: 3, gassenwissen: 6, menschenkenntnis: 3, ueberreden: 2,
         willenskraft: 4, fesseln: 4, orientierung: 5, goetterUndKulte: 4, kriegskunst: 2, rechtskunde: 5, fahrzeuge: 4, heilkundeWunden: 4 },
      variants: [
         { key: 'Aufseher', ap: 234, removeCombatAbilities: ['Belastungsgewöhnung I'], talents: { einschuechtern: 7, faehrtensuchen: 2, fahrzeuge: 0 } },
         { key: 'Kerkermeister und Schließer', ap: 239, removeCombatAbilities: ['Belastungsgewöhnung I'], talents: { bekehrenUeberzeugen: 2, einschuechtern: 7, fesseln: 7 } },
         { key: 'Zöllner', ap: 258, talents: { menschenkenntnis: 7 } },
      ] },
   { key: 'Gaukler', group: 'worldly', page: 131, ap: 160, languageBudget: 2, budgetIncludesScripts: true, specialization: 'gaukelei', abilities: [], combatAbilities: [],
      techniques: { Raufen: 8, Wurfwaffen: 8 }, choices: [],
      talents: { gaukelei: 7, klettern: 4, koerperbeherrschung: 7, kraftakt: 2, reiten: 2, tanzen: 2, taschendiebstahl: 3, verbergen: 3, zechen: 3, gassenwissen: 2,
         menschenkenntnis: 4, ueberreden: 2, verkleiden: 5, tierkunde: 2, wildnisleben: 3, geographie: 3, goetterUndKulte: 2, sagenUndLegenden: 5, fahrzeuge: 4,
         malenUndZeichnen: 2, musizieren: 3 },
      variants: [
         { key: 'Akrobat', ap: 173, specialization: 'koerperbeherrschung', talents: { klettern: 7, koerperbeherrschung: 8 } },
         { key: 'Dompteur', ap: 171, specialization: 'tierkunde', talents: { menschenkenntnis: 2, tierkunde: 7 } },
         { key: 'Messerwerfer', ap: 160, techniques: { Wurfwaffen: 12 }, talents: { gaukelei: 5, verkleiden: 2 } },
         { key: 'Possenreißer', ap: 154, talents: { koerperbeherrschung: 3, ueberreden: 4, verkleiden: 7 } },
         { key: 'Wahrsager', ap: 146, specialization: 'menschenkenntnis', techniques: { Wurfwaffen: 6 }, talents: { koerperbeherrschung: 0, menschenkenntnis: 6, ueberreden: 4, sternkunde: 4 } },
      ] },
   { key: 'Gladiator', group: 'worldly', page: 132, ap: 164, languageBudget: 2, budgetIncludesScripts: true, specialization: 'kraftakt', abilities: [],
      combatAbilities: ['Finte I', 'Wuchtschlag I'], techniques: { Raufen: 12 }, choices: [choose(12, ['Hiebwaffen', 'Schwerter', 'Stangenwaffen'])],
      talents: { koerperbeherrschung: 4, kraftakt: 6, selbstbeherrschung: 5, zechen: 3, einschuechtern: 5, menschenkenntnis: 3, goetterUndKulte: 4, kriegskunst: 3, heilkundeWunden: 4 },
      variants: [
         { key: 'Grubenkämpfer', ap: 139, removeCombatAbilities: ['Finte I'], techniques: { Dolche: 10 }, choices: [] },
         { key: 'Schaukämpfer', ap: 159, removeCombatAbilities: ['Wuchtschlag I'], talents: { gaukelei: 3, selbstbeherrschung: 2, zechen: 4, ueberreden: 4, orientierung: 3 } },
      ] },
   { key: 'Händler', group: 'worldly', page: 133, ap: 136, languageBudget: 10, budgetIncludesScripts: true, specialization: 'handel', abilities: [], combatAbilities: [],
      techniques: { Stangenwaffen: 8 }, choices: [],
      talents: { sinnesschaerfe: 3, etikette: 4, gassenwissen: 3, menschenkenntnis: 5, ueberreden: 5, willenskraft: 4, geographie: 2, goetterUndKulte: 3, rechnen: 6,
         rechtskunde: 4, sagenUndLegenden: 3, fahrzeuge: 3, handel: 7 },
      variants: [
         { key: 'Fahrender Händler', ap: 167, techniques: { Hiebwaffen: 8, Raufen: 8 }, talents: { orientierung: 4, wildnisleben: 3, fahrzeuge: 7 } },
         { key: 'Fernhändler', ap: 172, talents: { orientierung: 3, wildnisleben: 4, geographie: 7, magiekunde: 2, sternkunde: 2 } },
         { key: 'Geldwechsler', ap: 153, specialization: 'rechnen', techniques: { Dolche: 8, Hiebwaffen: 8, Stangenwaffen: 6 }, talents: { gassenwissen: 7, rechnen: 8 } },
         { key: 'Hausierer', ap: 162, techniques: { Stangenwaffen: 6 }, talents: { gassenwissen: 7, menschenkenntnis: 7, ueberreden: 7, orientierung: 4 } },
         { key: 'Tauschhändler', ap: 166, talents: { faehrtensuchen: 4, orientierung: 4, wildnisleben: 4, fahrzeuge: 1 }, cultures: ['Fjarninger', 'Utulus', 'Waldmenschen', 'Nivesen'] },
      ] },
   { key: 'Heiler', group: 'worldly', page: 134, ap: 207, languageBudget: 8, budgetIncludesScripts: true, specialization: 'heilkundeWunden', abilities: [], combatAbilities: [],
      techniques: { Dolche: 8, Hiebwaffen: 8 }, choices: [],
      talents: { selbstbeherrschung: 6, sinnesschaerfe: 4, etikette: 4, menschenkenntnis: 5, ueberreden: 4, fesseln: 4, pflanzenkunde: 6, tierkunde: 6, goetterUndKulte: 4,
         rechnen: 5, rechtskunde: 3, sagenUndLegenden: 2, heilkundeGift: 5, heilkundeKrankheiten: 6, heilkundeWunden: 7 },
      variants: [
         { key: 'Hebamme', ap: 218, talents: { etikette: 0, pflanzenkunde: 7, sagenUndLegenden: 6, heilkundeGift: 4, heilkundeKrankheiten: 7, heilkundeSeele: 4 } },
         { key: 'Medicus', ap: 221, specialization: 'heilkundeKrankheiten', talents: { etikette: 7, pflanzenkunde: 8, heilkundeKrankheiten: 8 } },
         { key: 'Quacksalber und Zahnreißer', ap: 196, talents: { gaukelei: 2, ueberreden: 7, fahrzeuge: 4, heilkundeGift: 2, heilkundeKrankheiten: 2, heilkundeWunden: 4 } },
      ] },
   { key: 'Höfling', group: 'worldly', page: 135, ap: 176, requiredAdvantages: ['Adel'], languageBudget: 10, budgetIncludesScripts: true, specialization: 'etikette',
      abilities: [], combatAbilities: [], techniques: { Bögen: 8, Dolche: 8 }, choices: [choose(8, ['Fechtwaffen', 'Schwerter'])],
      talents: { reiten: 5, sinnesschaerfe: 4, tanzen: 4, verbergen: 3, zechen: 2, bekehrenUeberzeugen: 4, betoeren: 4, etikette: 7, menschenkenntnis: 7, ueberreden: 4,
         willenskraft: 5, geschichtswissen: 2, goetterUndKulte: 3, rechnen: 3, rechtskunde: 3, sagenUndLegenden: 4 },
      variants: [
         { key: 'Adelsspross', ap: 172, techniques: { Bögen: 10 }, choices: [choose(10, ['Fechtwaffen', 'Schwerter'])],
            talents: { reiten: 7, zechen: 4, menschenkenntnis: 4, willenskraft: 3, geschichtswissen: 0, rechtskunde: 2 } },
         { key: 'Diplomat', ap: 192, techniques: { Bögen: 6 }, choices: [], talents: { bekehrenUeberzeugen: 7, etikette: 8, ueberreden: 6, willenskraft: 7, heilkundeGift: 3 } },
         { key: 'Hofdame', ap: 171, techniques: { Bögen: 6 }, choices: [], talents: { tanzen: 6, zechen: 0, stoffbearbeitung: 7 }, cultures: ['Andergast'], sex: 'female' },
         { key: 'Müßiggänger', ap: 195, techniques: { Bögen: 10, Dolche: 10 }, talents: { tanzen: 6, zechen: 4, betoeren: 7, geschichtswissen: 0, rechtskunde: 2, heilkundeGift: 2 } },
      ] },
   { key: 'Jäger', group: 'worldly', page: 136, ap: 246, languageBudget: 6, budgetIncludesScripts: false, specialization: 'faehrtensuchen', abilities: [], combatAbilities: [],
      techniques: { Bögen: 12, Stangenwaffen: 8 }, choices: [],
      talents: { klettern: 4, koerperbeherrschung: 4, kraftakt: 2, schwimmen: 4, selbstbeherrschung: 3, sinnesschaerfe: 6, verbergen: 5, faehrtensuchen: 7, fesseln: 4,
         orientierung: 6, pflanzenkunde: 5, tierkunde: 5, wildnisleben: 7, goetterUndKulte: 3, sagenUndLegenden: 4, heilkundeWunden: 3, holzbearbeitung: 3, lederbearbeitung: 3 },
      variants: [
         { key: 'Großwildjäger', ap: 260, techniques: { Armbrüste: 10 }, talents: { selbstbeherrschung: 6, pflanzenkunde: 3 } },
         { key: 'Kopfgeldjäger', ap: 278, techniques: { Armbrüste: 12 }, choices: [choose(12, ['Fechtwaffen', 'Hiebwaffen', 'Schwerter'])],
            talents: { einschuechtern: 4, menschenkenntnis: 5, pflanzenkunde: 2, tierkunde: 1 } },
         { key: 'Stammesjäger', ap: 258, talents: { heilkundeGift: 4, steinbearbeitung: 4 } },
      ] },
   { key: 'Krieger', group: 'worldly', page: 137, ap: 216, languageBudget: 10, budgetIncludesScripts: true, specialization: 'kriegskunst', abilities: [],
      combatAbilities: ['Belastungsgewöhnung I', 'Finte I', 'Vorstoß', 'Wuchtschlag I'], techniques: { Raufen: 10 },
      choices: [choose(12, ['Hiebwaffen', 'Kettenwaffen', 'Schwerter', 'Zweihandhiebwaffen', 'Zweihandschwerter'])],
      talents: { koerperbeherrschung: 4, kraftakt: 4, reiten: 4, selbstbeherrschung: 4, sinnesschaerfe: 2, etikette: 5, menschenkenntnis: 2, willenskraft: 4,
         geschichtswissen: 3, goetterUndKulte: 3, kriegskunst: 7, sagenUndLegenden: 2 },
      variants: [] },
   { key: 'Prostituierte', group: 'worldly', page: 138, ap: 203, languageBudget: 6, budgetIncludesScripts: false, specialization: 'betoeren', abilities: [], combatAbilities: [],
      techniques: { Dolche: 8, Raufen: 8 }, choices: [],
      talents: { koerperbeherrschung: 3, selbstbeherrschung: 4, sinnesschaerfe: 4, tanzen: 2, taschendiebstahl: 2, verbergen: 4, zechen: 5, betoeren: 6, gassenwissen: 6,
         menschenkenntnis: 6, ueberreden: 3, verkleiden: 2, willenskraft: 4, goetterUndKulte: 3, rechnen: 4, sagenUndLegenden: 3, handel: 4, heilkundeKrankheiten: 4,
         heilkundeWunden: 2, stoffbearbeitung: 3 },
      variants: [
         { key: 'Bordellmutter/-vater', ap: 230, talents: { gassenwissen: 7, menschenkenntnis: 8, willenskraft: 7, handel: 7 } },
         { key: 'Hure/Lustknabe', ap: 226, techniques: { Dolche: 10, Raufen: 10 }, talents: { selbstbeherrschung: 5, tanzen: 0, taschendiebstahl: 4, gassenwissen: 7, willenskraft: 6, rechnen: 2 } },
         { key: 'Kurtisane/Gesellschafter', ap: 209, talents: { betoeren: 7, etikette: 4, gassenwissen: 4, fesseln: 2 } },
         { key: 'Mätresse/Favorit', ap: 213, talents: { betoeren: 8, etikette: 7, gassenwissen: 2, fesseln: 4 } },
      ] },
   { key: 'Ritter', group: 'worldly', page: 139, ap: 230, languageBudget: 10, budgetIncludesScripts: true, specialization: 'reiten', abilities: [],
      combatAbilities: ['Belastungsgewöhnung I', 'Finte I', 'Wuchtschlag I'], techniques: { Lanzen: 10, Raufen: 8, Schwerter: 12, Zweihandschwerter: 10 },
      choices: [choose(10, ['Hiebwaffen', 'Kettenwaffen', 'Zweihandhiebwaffen'])],
      talents: { koerperbeherrschung: 3, kraftakt: 5, reiten: 8, selbstbeherrschung: 4, etikette: 6, menschenkenntnis: 2, willenskraft: 3, geschichtswissen: 2,
         goetterUndKulte: 4, kriegskunst: 4, sagenUndLegenden: 5 },
      variants: [
         { key: 'Hofritter', ap: 228, techniques: { Raufen: 6, Lanzen: 12 }, talents: { kraftakt: 3, reiten: 6, betoeren: 4, etikette: 7, kriegskunst: 2 } },
         { key: 'Raubritter und Heckenritter', ap: 226, talents: { reiten: 6, etikette: 2, handel: 4 } },
      ] },
   { key: 'Seefahrer', group: 'worldly', page: 140, ap: 173, languageBudget: 10, budgetIncludesScripts: false, specialization: 'booteUndSchiffe', abilities: [], combatAbilities: [],
      techniques: { Dolche: 8, Raufen: 8, Schwerter: 8 }, choices: [],
      talents: { koerperbeherrschung: 5, klettern: 5, schwimmen: 7, zechen: 4, menschenkenntnis: 2, ueberreden: 2, fesseln: 7, fischenUndAngeln: 4, orientierung: 5,
         tierkunde: 2, wildnisleben: 3, geographie: 4, goetterUndKulte: 4, sagenUndLegenden: 5, booteUndSchiffe: 7, holzbearbeitung: 4, stoffbearbeitung: 3 },
      variants: [
         { key: 'Fischer', ap: 185, addAbilities: ['Fischer'], talents: { fischenUndAngeln: 7, tierkunde: 4 } },
         { key: 'Pirat', ap: 199, techniques: { Schwerter: 10 }, talents: { einschuechtern: 4, gassenwissen: 4 } },
         { key: 'Walfänger und Robbenjäger', ap: 191, addAbilities: ['Fischer'], talents: { tierkunde: 7 } },
      ] },
   { key: 'Söldner', group: 'worldly', page: 141, ap: 202, languageBudget: 6, budgetIncludesScripts: false, specialization: 'kriegskunst', abilities: [],
      combatAbilities: ['Aufmerksamkeit', 'Belastungsgewöhnung I', 'Wuchtschlag I'], techniques: { Armbrüste: 10, Raufen: 10 },
      choices: [choose(10, ['Hiebwaffen', 'Schwerter', 'Stangenwaffen', 'Zweihandschwerter', 'Zweihandhiebwaffen'])],
      talents: { koerperbeherrschung: 3, kraftakt: 3, selbstbeherrschung: 4, zechen: 5, menschenkenntnis: 2, ueberreden: 3, orientierung: 4, wildnisleben: 3,
         goetterUndKulte: 3, kriegskunst: 6, sagenUndLegenden: 5, handel: 3, heilkundeWunden: 4 },
      variants: [
         { key: 'Plänkler', ap: 218, techniques: { Armbrüste: 12, Wurfwaffen: 12 } },
         { key: 'Leichtgerüstete', ap: 217, addCombatAbilities: ['Finte I'] },
         { key: 'Schwergerüstete', ap: 222, addCombatAbilities: ['Zu Fall bringen'] },
      ] },
   { key: 'Spitzel', group: 'worldly', page: 142, ap: 230, languageBudget: 16, budgetIncludesScripts: true, specialization: 'verbergen', abilities: [], combatAbilities: [],
      techniques: { Dolche: 12, Raufen: 10 }, choices: [],
      talents: { sinnesschaerfe: 7, taschendiebstahl: 5, verbergen: 8, gassenwissen: 6, menschenkenntnis: 6, ueberreden: 6, verkleiden: 8, willenskraft: 5, orientierung: 3,
         goetterUndKulte: 3, rechnen: 4, rechtskunde: 4, sagenUndLegenden: 2, handel: 3, schloesserknacken: 3 },
      variants: [
         { key: 'Geheimagent', ap: 266, techniques: { Armbrüste: 10 }, choices: [choose(12, ['Fechtwaffen', 'Hiebwaffen', 'Schwerter'])], talents: { taschendiebstahl: 2, etikette: 4, geographie: 4 } },
         { key: 'Meuchelmörder', ap: 302, techniques: { Armbrüste: 12 }, choices: [choose(12, ['Fechtwaffen', 'Hiebwaffen', 'Schwerter'])], talents: { klettern: 5, koerperbeherrschung: 6, einschuechtern: 4 } },
      ] },
   { key: 'Stammeskrieger', group: 'worldly', page: 143, ap: 289, languageBudget: 4, budgetIncludesScripts: false, specialization: 'einschuechtern', abilities: [],
      combatAbilities: ['Aufmerksamkeit', 'Finte I', 'Wuchtschlag I'], techniques: { Bögen: 10, Raufen: 12 },
      choices: [choose(12, ['Hiebwaffen', 'Schwerter', 'Stangenwaffen', 'Zweihandhiebwaffen', 'Zweihandschwerter'])],
      talents: { klettern: 4, koerperbeherrschung: 6, kraftakt: 4, selbstbeherrschung: 5, sinnesschaerfe: 5, verbergen: 5, einschuechtern: 7, faehrtensuchen: 4,
         orientierung: 4, pflanzenkunde: 3, tierkunde: 3, wildnisleben: 4, goetterUndKulte: 2, sagenUndLegenden: 4, heilkundeWunden: 4, holzbearbeitung: 4, lederbearbeitung: 3 },
      variants: [] },
   { key: 'Streuner', group: 'worldly', page: 144, ap: 212, languageBudget: 6, budgetIncludesScripts: false, specialization: 'gassenwissen', abilities: [], combatAbilities: [],
      techniques: { Dolche: 10, Raufen: 12 }, choices: [choose(10, ['Armbrüste', 'Wurfwaffen'])],
      talents: { klettern: 3, koerperbeherrschung: 2, selbstbeherrschung: 2, sinnesschaerfe: 4, taschendiebstahl: 4, verbergen: 5, zechen: 4, betoeren: 3, gassenwissen: 7,
         menschenkenntnis: 4, ueberreden: 4, verkleiden: 2, willenskraft: 4, orientierung: 4, brettUndGlueckspiel: 2, goetterUndKulte: 2, rechnen: 4, rechtskunde: 3,
         sagenUndLegenden: 3, schloesserknacken: 4 },
      variants: [
         { key: 'Bettler', ap: 203, talents: { klettern: 0, betoeren: 0, menschenkenntnis: 6, ueberreden: 7, schloesserknacken: 0 } },
         { key: 'Dieb', ap: 221, talents: { taschendiebstahl: 7, gassenwissen: 6, orientierung: 7 } },
         { key: 'Einbrecher', ap: 225, talents: { klettern: 7, taschendiebstahl: 2, schloesserknacken: 7 } },
         { key: 'Hochstapler', ap: 247, talents: { betoeren: 7, etikette: 7, verkleiden: 4, ueberreden: 7 } },
         { key: 'Spieler', ap: 228, specialization: 'brettUndGlueckspiel', talents: { gaukelei: 4, menschenkenntnis: 7, brettUndGlueckspiel: 7 } },
      ] },
]
const elf = { requiredSpecies: ['Elf'], requiredAbilities: ['Tradition (Elf)'] }
const witch = { family: 'Hexe', requiredAdvantages: ['Zauberer'], requiredAbilities: ['Tradition (Hexe)'], abilities: ['Flugsalbe', 'Vertrautenbindung'] }
const mage = { family: 'Magier', requiredAdvantages: ['Zauberer'], requiredAbilities: ['Tradition (Gildenmagier)'], abilities: ['Bindung des Stabes'] }

// source: DSA5 Regelwerk, S. 145–153 (Zaubererprofessionen); Elfenlieder of the package are listed with the spells.
// Within the package, Bindung des Stabes is priced without the permanent AsP (S. 128).
professionCatalog.push(
   { key: 'Wildnisläufer', group: 'magic', page: 145, ap: 256, ...elf, languageBudget: 2, budgetIncludesScripts: true, specialization: 'faehrtensuchen', abilities: [], combatAbilities: [],
      techniques: { Bögen: 12, Dolche: 8 }, choices: [],
      talents: { koerperbeherrschung: 4, schwimmen: 2, singen: 4, sinnesschaerfe: 4, verbergen: 4, faehrtensuchen: 7, orientierung: 4, pflanzenkunde: 5, tierkunde: 5,
         wildnisleben: 7, holzbearbeitung: 5, musizieren: 4 },
      spells: { Freundschaftslied: 4, Armatrutz: 6, Fulminictus: 5, 'Odem Arcanum': 3, Silentium: 6, Visibili: 5, Wasseratem: 3 },
      tricks: { count: 1, options: ['Feuerfinger', 'Handwärmer', 'Lockruf', 'Trocken'] }, variants: [] },
   { key: 'Zauberweber', group: 'magic', page: 146, ap: 221, ...elf, languageBudget: 4, budgetIncludesScripts: true, specialization: 'musizieren', abilities: [], combatAbilities: [],
      techniques: { Bögen: 8 }, choices: [],
      talents: { koerperbeherrschung: 4, schwimmen: 4, singen: 5, willenskraft: 3, faehrtensuchen: 4, orientierung: 3, pflanzenkunde: 5, wildnisleben: 4, geschichtswissen: 4,
         goetterUndKulte: 4, magiekunde: 5, sternkunde: 5, musizieren: 7 },
      spells: { Zaubermelodie: 4, Bannbaladin: 4, 'Blick in die Gedanken': 5, 'Odem Arcanum': 6, Silentium: 4, Visibili: 6, Wasseratem: 4 },
      tricks: { count: 2, options: ['Duft', 'Feuerfinger', 'Lockruf', 'Signatur'] }, variants: [] },
   { key: 'Katzenhexe', group: 'magic', page: 147, ap: 285, ...witch, languageBudget: 6, budgetIncludesScripts: true, specialization: null, combatAbilities: [],
      techniques: { Dolche: 10, Raufen: 10 }, choices: [],
      talents: { fliegen: 3, klettern: 5, koerperbeherrschung: 4, sinnesschaerfe: 5, verbergen: 4, betoeren: 5, etikette: 4, menschenkenntnis: 4, ueberreden: 4, verkleiden: 4,
         orientierung: 4, tierkunde: 2, brettUndGlueckspiel: 2, goetterUndKulte: 3, magiekunde: 4, alchimie: 3 },
      spells: { 'Große Gier': 6, 'Harmlose Gestalt': 5, Hexengalle: 4, Katzenaugen: 6, Motoricus: 4, 'Odem Arcanum': 4, 'Satuarias Herrlichkeit': 5 },
      tricks: { count: 1, options: ['Bauchreden', 'Duft', 'Glücksgriff', 'Handwärmer', 'Trocken'] }, variants: [] },
   { key: 'Krötenhexe', group: 'magic', page: 148, ap: 296, ...witch, languageBudget: 6, budgetIncludesScripts: true, curseBudget: 12, specialization: null, combatAbilities: [],
      techniques: { Raufen: 8 }, choices: [],
      talents: { fliegen: 6, verbergen: 5, menschenkenntnis: 5, verkleiden: 3, orientierung: 3, pflanzenkunde: 5, tierkunde: 5, wildnisleben: 4, magiekunde: 4,
         sagenUndLegenden: 7, alchimie: 4, heilkundeGift: 4, heilkundeKrankheiten: 5, heilkundeWunden: 4 },
      spells: { 'Balsam Salabunde': 6, 'Große Gier': 5, 'Harmlose Gestalt': 5, Hexengalle: 4, Krötensprung: 6, Radau: 4, Sanftmut: 4 },
      tricks: { count: 1, options: ['Handwärmer', 'Regenbogenaugen', 'Schlangenhände'] }, variants: [] },
   { key: 'Rabenhexe', group: 'magic', page: 149, ap: 295, ...witch, languageBudget: 8, budgetIncludesScripts: true, curseBudget: 8, specialization: null, combatAbilities: [],
      techniques: { Raufen: 8, Stangenwaffen: 8 }, choices: [],
      talents: { fliegen: 6, gaukelei: 4, verbergen: 2, bekehrenUeberzeugen: 4, menschenkenntnis: 6, ueberreden: 4, pflanzenkunde: 4, tierkunde: 4, wildnisleben: 3,
         geschichtswissen: 4, goetterUndKulte: 4, magiekunde: 3, sagenUndLegenden: 5, sternkunde: 4, alchimie: 4, heilkundeKrankheiten: 2, heilkundeSeele: 4 },
      spells: { 'Blick in die Gedanken': 6, 'Große Gier': 4, 'Harmlose Gestalt': 4, Hexengalle: 4, 'Odem Arcanum': 6, Radau: 5, Sanftmut: 5 },
      tricks: { count: 2, options: ['Abkühlung', 'Bauchreden', 'Schnipsen', 'Trocken'] }, variants: [] },
   { key: 'Gildenloser Magier', group: 'magic', page: 150, ap: 237, ...mage, languageBudget: 12, budgetIncludesScripts: true, specialization: null, combatAbilities: [],
      techniques: { Stangenwaffen: 10 }, choices: [],
      talents: { etikette: 2, menschenkenntnis: 4, willenskraft: 4, orientierung: 3, geographie: 4, geschichtswissen: 3, goetterUndKulte: 4, magiekunde: 5, rechnen: 4,
         sagenUndLegenden: 5, sphaerenkunde: 3, alchimie: 4 },
      spells: { Armatrutz: 6, 'Blick in die Gedanken': 5, 'Flim Flam': 4, Fulminictus: 5, 'Odem Arcanum': 4, Paralysis: 6, Penetrizzel: 4 },
      tricks: { count: 1, options: ['Bauchreden', 'Feuerfinger', 'Glücksgriff', 'Handwärmer', 'Trocken'] }, variants: [] },
   { key: 'Graumagier', group: 'magic', page: 151, ap: 314, ...mage, languageBudget: 12, budgetIncludesScripts: true, specialization: null, combatAbilities: [],
      techniques: { Stangenwaffen: 8 }, choices: [],
      talents: { koerperbeherrschung: 2, selbstbeherrschung: 3, sinnesschaerfe: 3, etikette: 2, menschenkenntnis: 4, willenskraft: 3, orientierung: 3, wildnisleben: 2,
         geographie: 4, geschichtswissen: 4, goetterUndKulte: 4, magiekunde: 6, rechnen: 4, sagenUndLegenden: 3, sphaerenkunde: 3, alchimie: 4, heilkundeGift: 4,
         heilkundeKrankheiten: 5, heilkundeWunden: 4, malenUndZeichnen: 4 },
      spells: { Armatrutz: 5, Bannbaladin: 4, Corpofesso: 6, Paralysis: 6, Penetrizzel: 4, Salander: 5, Visibili: 4 },
      tricks: { count: 1, options: ['Glücksgriff', 'Handwärmer', 'Lockruf', 'Regenbogenaugen', 'Signatur'] }, variants: [] },
   { key: 'Schwarzmagier', group: 'magic', page: 152, ap: 302, ...mage, languageBudget: 12, budgetIncludesScripts: true, specialization: null, combatAbilities: [],
      techniques: { Dolche: 8, Stangenwaffen: 8 }, choices: [],
      talents: { koerperbeherrschung: 2, selbstbeherrschung: 5, sinnesschaerfe: 2, betoeren: 3, etikette: 2, gassenwissen: 2, menschenkenntnis: 5, willenskraft: 5,
         orientierung: 3, geographie: 2, geschichtswissen: 5, goetterUndKulte: 5, magiekunde: 6, rechnen: 4, sagenUndLegenden: 4, sphaerenkunde: 5, alchimie: 4,
         heilkundeGift: 2, malenUndZeichnen: 4 },
      spells: { Bannbaladin: 6, 'Blick in die Gedanken': 5, Corpofesso: 4, Horriphobus: 6, 'Odem Arcanum': 4, Respondami: 5, Somnigravis: 4 },
      tricks: { count: 1, options: ['Abkühlung', 'Duft', 'Schlangenhände', 'Signatur'] }, variants: [] },
   { key: 'Weißmagier', group: 'magic', page: 153, ap: 316, ...mage, requiredDisadvantages: [{ key: 'Prinzipientreue', level: 2 }], languageBudget: 10,
      budgetIncludesScripts: true, specialization: null, combatAbilities: [], techniques: { Dolche: 8, Schwerter: 10, Stangenwaffen: 10 }, choices: [],
      talents: { koerperbeherrschung: 3, kraftakt: 2, selbstbeherrschung: 5, sinnesschaerfe: 2, etikette: 3, willenskraft: 5, orientierung: 2, tierkunde: 2, geographie: 2,
         geschichtswissen: 4, goetterUndKulte: 5, magiekunde: 5, rechnen: 6, rechtskunde: 6, sagenUndLegenden: 3, sphaerenkunde: 3, alchimie: 4, heilkundeWunden: 3,
         malenUndZeichnen: 4 },
      spells: { Armatrutz: 5, 'Blitz dich find': 6, Fulminictus: 5, Gardianum: 4, Ignifaxius: 6, Paralysis: 4, Psychostabilis: 4 },
      tricks: { count: 1, options: ['Abkühlung', 'Feuerfinger', 'Schnipsen', 'Signatur', 'Trocken'] }, variants: [] },
)
const priest = (church: string, principles: number) => ({
   group: 'divine' as const, family: church, requiredAdvantages: ['Geweihter'], requiredAbilities: [`Tradition (${church}kirche)`],
   requiredDisadvantages: [{ key: 'Prinzipientreue', level: principles }, { key: 'Verpflichtungen', level: 2 }],
   budgetIncludesScripts: true, specialization: 'goetterUndKulte', abilities: [], combatAbilities: [], blessings: 'twelve' as const,
})

// source: DSA5 Regelwerk, S. 154–159 (Geweihtenprofessionen; each includes Die Zwölf Segnungen)
professionCatalog.push(
   { key: 'Borongeweihter', ...priest('Boron', 2), page: 154, ap: 285, languageBudget: 8, techniques: { Dolche: 8, Hiebwaffen: 8 }, choices: [],
      talents: { selbstbeherrschung: 4, sinnesschaerfe: 3, zechen: 3, bekehrenUeberzeugen: 4, einschuechtern: 2, etikette: 3, menschenkenntnis: 4, willenskraft: 6,
         pflanzenkunde: 4, tierkunde: 2, goetterUndKulte: 6, rechnen: 4, rechtskunde: 3, sagenUndLegenden: 4, sphaerenkunde: 2, sternkunde: 4, alchimie: 3,
         heilkundeGift: 2, heilkundeKrankheiten: 3, heilkundeSeele: 4, heilkundeWunden: 3 },
      liturgies: { 'Bann der Furcht': 3, 'Bann des Lichts': 5, Exorzismus: 3, 'Kleiner Bann wider Untote': 7, Objektsegen: 8, Schlaf: 6 },
      variants: [
         { key: 'Diener Bishdariels', ap: 292, talents: { sternkunde: 7, heilkundeSeele: 6 } },
         { key: 'Diener Golgaris', ap: 303, techniques: { Hiebwaffen: 10 }, talents: { heilkundeWunden: 6 } },
      ] },
   { key: 'Hesindegeweihter', ...priest('Hesinde', 1), page: 155, ap: 312, languageBudget: 16, techniques: { Dolche: 8, Stangenwaffen: 8 }, choices: [],
      talents: { selbstbeherrschung: 2, sinnesschaerfe: 5, bekehrenUeberzeugen: 6, etikette: 4, menschenkenntnis: 4, ueberreden: 2, willenskraft: 6, pflanzenkunde: 4,
         tierkunde: 3, geographie: 4, geschichtswissen: 5, goetterUndKulte: 6, magiekunde: 3, mechanik: 4, rechnen: 5, rechtskunde: 3, sagenUndLegenden: 3,
         sphaerenkunde: 3, sternkunde: 3, alchimie: 4, heilkundeKrankheiten: 2, heilkundeWunden: 2 },
      liturgies: { Entzifferung: 5, 'Friedvolle Aura': 6, 'Göttlicher Fingerzeig': 3, Magieschutz: 7, Magiesicht: 6, Objektsegen: 5 },
      variants: [
         { key: 'Pastori', ap: 329, talents: { geschichtswissen: 7, magiekunde: 6, sphaerenkunde: 5 } },
         { key: 'Satori', ap: 322, techniques: { Raufen: 8 }, talents: { goetterUndKulte: 8, rechtskunde: 5 } },
      ] },
   { key: 'Perainegeweihter', ...priest('Peraine', 1), page: 156, ap: 290, languageBudget: 8, techniques: { Hiebwaffen: 8 }, choices: [],
      talents: { selbstbeherrschung: 4, bekehrenUeberzeugen: 7, etikette: 2, menschenkenntnis: 5, ueberreden: 3, willenskraft: 4, pflanzenkunde: 6, tierkunde: 3,
         geschichtswissen: 2, goetterUndKulte: 6, rechnen: 3, rechtskunde: 2, sagenUndLegenden: 5, alchimie: 3, heilkundeGift: 4, heilkundeKrankheiten: 5,
         heilkundeSeele: 4, heilkundeWunden: 6 },
      liturgies: { 'Friedvolle Aura': 3, Giftbann: 5, Heilsegen: 7, Krankheitsbann: 6, Objektsegen: 7, Pflanzenwuchs: 4 },
      variants: [
         { key: 'Heiler', ap: 298, talents: { heilkundeKrankheiten: 7, heilkundeWunden: 7 } },
         { key: 'Säer', ap: 305, talents: { pflanzenkunde: 7, tierkunde: 7 } },
      ] },
   { key: 'Phexgeweihter', ...priest('Phex', 1), page: 157, ap: 304, languageBudget: 8, techniques: { Dolche: 10 }, choices: [],
      talents: { klettern: 4, koerperbeherrschung: 4, selbstbeherrschung: 2, sinnesschaerfe: 5, taschendiebstahl: 3, verbergen: 5, bekehrenUeberzeugen: 4, etikette: 2,
         gassenwissen: 4, menschenkenntnis: 5, ueberreden: 4, willenskraft: 5, orientierung: 3, geschichtswissen: 2, goetterUndKulte: 6, magiekunde: 2, mechanik: 3,
         rechnen: 6, rechtskunde: 3, sagenUndLegenden: 3, sternkunde: 4, handel: 6, schloesserknacken: 3 },
      liturgies: { 'Fall ins Nichts': 5, Lautlos: 6, Mondsicht: 5, Objektsegen: 5, Wieselflink: 8 },
      variants: [
         { key: 'Beutelschneider', ap: 319, talents: { taschendiebstahl: 6, gassenwissen: 7 } },
         { key: 'Händler', ap: 315, talents: { bekehrenUeberzeugen: 6, menschenkenntnis: 6, handel: 8 } },
         { key: 'Fassadenkletterer', ap: 324, talents: { klettern: 7, koerperbeherrschung: 6, menschenkenntnis: 3, schloesserknacken: 7 } },
      ] },
   { key: 'Praiosgeweihter', ...priest('Praios', 2), page: 158, ap: 242, languageBudget: 10, techniques: { Hiebwaffen: 8 }, choices: [],
      talents: { selbstbeherrschung: 4, sinnesschaerfe: 4, bekehrenUeberzeugen: 6, etikette: 5, menschenkenntnis: 4, willenskraft: 6, orientierung: 3, geographie: 3,
         geschichtswissen: 4, goetterUndKulte: 7, magiekunde: 3, rechnen: 4, rechtskunde: 6, sagenUndLegenden: 3, sphaerenkunde: 2, sternkunde: 2 },
      liturgies: { 'Bann der Dunkelheit': 4, Blendstrahl: 6, Magieschutz: 6, Objektsegen: 5, Wahrheit: 3 },
      variants: [
         { key: 'Legalisten', ap: 244, talents: { rechtskunde: 8 } },
         { key: 'Prinzipisten', ap: 254, talents: { magiekunde: 7 } },
      ] },
   { key: 'Rondrageweihter', ...priest('Rondra', 2), page: 159, ap: 283, languageBudget: 8, techniques: { Raufen: 10, Schwerter: 12, Zweihandschwerter: 10 },
      choices: [choose(10, ['Fechtwaffen', 'Hiebwaffen', 'Kettenwaffen', 'Zweihandhiebwaffen'])],
      talents: { koerperbeherrschung: 4, kraftakt: 4, selbstbeherrschung: 5, sinnesschaerfe: 3, bekehrenUeberzeugen: 3, etikette: 4, menschenkenntnis: 3, willenskraft: 4,
         geschichtswissen: 2, goetterUndKulte: 6, kriegskunst: 5, rechnen: 3, rechtskunde: 3, sagenUndLegenden: 3, heilkundeWunden: 3, metallbearbeitung: 3 },
      liturgies: { Ehrenhaftigkeit: 6, Objektsegen: 5, Schmerzresistenz: 6, 'Schutz der Wehrlosen': 4 },
      variants: [
         { key: 'Salutaristen', ap: 296, talents: { kriegskunst: 7, magiekunde: 3 } },
         { key: 'Traditionalisten', ap: 295, talents: { selbstbeherrschung: 7, geschichtswissen: 4 } },
         { key: 'Honoren', ap: 282, techniques: { Zweihandschwerter: 11 }, talents: { kriegskunst: 3 } },
      ] },
)
export const professionFor = (key: string | null | undefined) => professionCatalog.find((entry) => entry.key === key) ?? null

// A package with its variant applied (values absolute, S. 128)
export function resolvedProfession(profession: ProfessionDefinition, variantKey: string | null) {
   const variant = profession.variants.find((entry) => entry.key === variantKey) ?? null
   const combatAbilities = [...profession.combatAbilities.filter((key) => !variant?.removeCombatAbilities?.includes(key)), ...variant?.addCombatAbilities ?? []]
   return {
      profession, variant, ap: variant?.ap ?? profession.ap,
      talents: { ...profession.talents, ...variant?.talents },
      techniques: { ...profession.techniques, ...variant?.techniques },
      choices: variant?.choices ?? profession.choices,
      specialization: variant?.specialization ?? profession.specialization,
      abilities: [...profession.abilities, ...variant?.addAbilities ?? []],
      combatAbilities,
      spells: { ...profession.spells },
      tricks: profession.tricks ?? null,
      curseBudget: profession.curseBudget ?? 0,
      liturgies: { ...profession.liturgies },
      blessings: profession.blessings ?? null,
   }
}
