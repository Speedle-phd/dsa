import type { EntryCategory, EntrySelection } from '../characterEntryCatalog'
import { combatTechniques } from '../combatRules'
import { talentCatalog, type TalentAttribute } from '../talentCatalog'
import { attributeKeys, emptyDraft, type CreationDraftData } from './creationLedger'
import { cultureFor } from './cultureCatalog'
import { capsFor, creationLimits } from './experienceCaps'
import { professionFor, resolvedProfession } from './professionCatalog'
import type { SpeciesKey } from './speciesCatalog'

// The twelve archetypes of the core rules: finished Erfahren heroes to start a draft from (S. 62–85).
// Values are the printed ones; the draft is checked like any other, so book slips show up as open points.
export type Archetype = {
   key: string; page: number; sex: 'male' | 'female'; species: SpeciesKey; speciesChoice: TalentAttribute | null; culture: string
   profession: string; variant: string | null; language: string; script: string | null; localKnowledge: string
   attributes: Record<TalentAttribute, number>; entries: EntrySelection[]; combatAbilities: string[]
   // Only values that differ from the defaults: techniques other than 6, talents above 0
   techniques: Record<string, number>; talents: Record<string, number>
   spells: Record<string, number>; tricks: string[]; liturgies: Record<string, number>; note?: string
}

const entry = (category: EntryCategory) => (catalogKey: string, level = 1, detail = '', potency?: number): EntrySelection =>
   ({ category, catalogKey, level, detail, application: '', ...potency ? { potency } : {} })
const a = entry('advantages'), d = entry('disadvantages'), s = entry('generalSpecialAbilities'), l = entry('languages'), w = entry('scripts')

// source: DSA5 Regelwerk, S. 62–85 (Archetypen; Immunität gegen Tulmadron: Stufe 4, S. 346)
export const archetypeCatalog: Archetype[] = [
   { key: 'Allacaya', page: 62, sex: 'female', species: 'Elf', speciesChoice: 'strength', culture: 'Auelfen',
      profession: 'Wildnisläufer', variant: null, language: 'Isdira', script: 'Isdira- und Asdharia-Zeichen', localKnowledge: 'Heimatdorf',
      attributes: { fingerDexterity: 14, dexterity: 15, constitution: 13, strength: 9, courage: 10, wisdom: 10, intuition: 15, charisma: 14 },
      entries: [a('Altersresistenz'), a('Dunkelsicht'), a('Gutaussehend'), a('Nichtschläfer'), a('Wohlklang'), d('Pech'), d('Persönlichkeitsschwäche (Arroganz)'), d('Persönlichkeitsschwäche (Weltfremd)', 1, 'Geld, Götter'), d('Sensibler Geruchssinn'), d('Unfähig', 1, 'zechen'), s('Tradition (Elf)'), l('Garethi', 2)],
      combatAbilities: [],
      techniques: { Dolche: 8, Bögen: 12 },
      talents: { koerperbeherrschung: 10, schwimmen: 8, singen: 6, sinnesschaerfe: 6, verbergen: 5, betoeren: 1, faehrtensuchen: 8, fischenUndAngeln: 2, orientierung: 5, pflanzenkunde: 7, tierkunde: 6, wildnisleben: 8, booteUndSchiffe: 1, holzbearbeitung: 5, musizieren: 6 },
      spells: { Adlerauge: 4, Armatrutz: 6, Axxeleratus: 4, 'Balsam Salabunde': 4, Falkenauge: 4, Fulminictus: 7, 'Odem Arcanum': 3, Silentium: 6, Somnigravis: 4, Visibili: 5, Wasseratem: 3, Freundschaftslied: 4 }, tricks: ['Lockruf'], liturgies: {}, note: 'Weltfremd gegenüber Geld und Göttern.', },
   { key: 'Korgrimm', page: 64, sex: 'male', species: 'Zwerg', speciesChoice: 'charisma', culture: 'Erzzwerge',
      profession: 'Krieger', variant: null, language: 'Rogolan', script: 'Rogolan-Runen', localKnowledge: 'Xorlosch',
      attributes: { fingerDexterity: 14, dexterity: 13, constitution: 15, strength: 15, courage: 14, wisdom: 10, intuition: 11, charisma: 8 },
      entries: [a('Dunkelsicht'), a('Hohe Lebenskraft', 4), a('Immunität gegen Gift', 1, 'Tulmadron', 4), a('Schwer zu verzaubern'), a('Zäher Hund'), a('Zwergennase'), d('Pech', 2), d('Prinzipientreue', 2, 'zwergische Kriegerehre'), d('Schlechte Angewohnheit', 1, 'Langschläfer'), d('Schlechte Eigenschaft (Goldgier)'), d('Schlechte Eigenschaft (Jähzorn)'), d('Unfähig', 1, 'schwimmen'), s('Geländekunde', 1, 'Gebirgskundig'), s('Meister der Improvisation'), l('Garethi', 2), l('Oloarkh', 1), w('Kusliker Zeichen')],
      combatAbilities: ['Belastungsgewöhnung II', 'Schildspalter', 'Sturmangriff', 'Wuchtschlag II'],
      techniques: { Dolche: 10, Raufen: 12, Schilde: 12, Zweihandhiebwaffen: 12, Armbrüste: 12 },
      talents: { koerperbeherrschung: 4, kraftakt: 8, reiten: 4, selbstbeherrschung: 9, sinnesschaerfe: 3, verbergen: 2, zechen: 9, einschuechtern: 10, etikette: 5, menschenkenntnis: 2, willenskraft: 6, geschichtswissen: 7, goetterUndKulte: 5, kriegskunst: 10, mechanik: 2, rechnen: 2, rechtskunde: 4, sagenUndLegenden: 8, heilkundeWunden: 6, metallbearbeitung: 5, steinbearbeitung: 8 },
      spells: {}, tricks: [], liturgies: {}, },
   { key: 'Thallian', page: 66, sex: 'male', species: 'Mensch', speciesChoice: null, culture: 'Mittelreich',
      profession: 'Gildenloser Magier', variant: null, language: 'Garethi', script: 'Kusliker Zeichen', localKnowledge: 'Heimatdorf',
      attributes: { fingerDexterity: 10, dexterity: 12, constitution: 9, strength: 10, courage: 14, wisdom: 15, intuition: 14, charisma: 14 },
      entries: [a('Zauberer'), d('Persönlichkeitsschwäche (Eitelkeit)'), d('Schlechte Eigenschaft (Neugier)'), d('Verpflichtungen', 1, 'Lehrmeister'), s('Tradition (Gildenmagier)'), l('Bosparano', 3), l('Isdira', 2), w('Isdira- und Asdharia-Zeichen')],
      combatAbilities: [],
      techniques: { Stangenwaffen: 10 },
      talents: { selbstbeherrschung: 4, sinnesschaerfe: 2, etikette: 2, menschenkenntnis: 4, willenskraft: 10, orientierung: 3, pflanzenkunde: 1, tierkunde: 1, geographie: 6, geschichtswissen: 7, goetterUndKulte: 4, magiekunde: 10, rechnen: 4, sagenUndLegenden: 5, sphaerenkunde: 3, alchimie: 4, holzbearbeitung: 1, metallbearbeitung: 1, stoffbearbeitung: 1 },
      spells: { Armatrutz: 10, 'Balsam Salabunde': 3, 'Blick in die Gedanken': 5, Corpofesso: 4, 'Flim Flam': 4, Fulminictus: 5, Gardianum: 4, Ignifaxius: 3, Motoricus: 4, 'Odem Arcanum': 4, Paralysis: 6, Penetrizzel: 4 }, tricks: ['Trocken'], liturgies: {}, note: 'Privatschüler des Magisters Alrik Dagabor.', },
   { key: 'Irinja', page: 68, sex: 'female', species: 'Mensch', speciesChoice: null, culture: 'Bornland',
      profession: 'Katzenhexe', variant: null, language: 'Garethi', script: 'Kusliker Zeichen', localKnowledge: 'Heimatdorf',
      attributes: { fingerDexterity: 12, dexterity: 13, constitution: 13, strength: 9, courage: 14, wisdom: 10, intuition: 14, charisma: 15 },
      entries: [a('Gutaussehend'), a('Zauberer'), d('Angst vor', 2, 'Feuer'), d('Körpergebundene Kraft'), d('Persönlichkeitsschwäche (Arroganz)'), d('Schlechte Angewohnheit', 1, 'Putzfimmel'), d('Schlechte Angewohnheit', 1, 'Unordentlich'), d('Schlechte Eigenschaft (Neugier)'), d('Schlechte Eigenschaft (Rachsucht)'), s('Tradition (Hexe)'), l('Goblinisch', 2)],
      combatAbilities: [],
      techniques: { Dolche: 10, Raufen: 10 },
      talents: { fliegen: 7, klettern: 5, koerperbeherrschung: 4, sinnesschaerfe: 5, tanzen: 4, verbergen: 4, zechen: 2, betoeren: 7, etikette: 2, menschenkenntnis: 4, ueberreden: 4, verkleiden: 4, faehrtensuchen: 1, orientierung: 5, pflanzenkunde: 5, tierkunde: 6, wildnisleben: 6, brettUndGlueckspiel: 2, goetterUndKulte: 3, magiekunde: 4, alchimie: 3, holzbearbeitung: 2, lebensmittelbearbeitung: 1 },
      spells: { 'Balsam Salabunde': 4, 'Blick in die Gedanken': 4, 'Große Gier': 6, 'Harmlose Gestalt': 5, Hexengalle: 4, Hexenkrallen: 6, Katzenaugen: 6, Krötensprung: 7, Motoricus: 4, 'Odem Arcanum': 4, Radau: 7, 'Satuarias Herrlichkeit': 5 }, tricks: ['Duft'], liturgies: {}, note: 'Schwesternschaft: Schöne der Nacht.', },
   { key: 'Belima', page: 70, sex: 'female', species: 'Mensch', speciesChoice: null, culture: 'Mhanadistan',
      profession: 'Streuner', variant: 'Dieb', language: 'Tulamidya', script: 'Tulamidya-Zeichen', localKnowledge: 'Khunchom',
      attributes: { fingerDexterity: 14, dexterity: 15, constitution: 11, strength: 9, courage: 14, wisdom: 11, intuition: 14, charisma: 12 },
      entries: [a('Flink'), a('Fuchssinn'), d('Schlechte Eigenschaft (Goldgier)'), s('Fallen entschärfen'), s('Füchsisch'), l('Garethi', 2)],
      combatAbilities: ['Finte I', 'Kampfreflexe I', 'Präziser Schuss/Wurf I', 'Präziser Stich I', 'Schnellziehen', 'Verbessertes Ausweichen I'],
      techniques: { Dolche: 12, Raufen: 12, Wurfwaffen: 12 },
      talents: { klettern: 8, koerperbeherrschung: 8, selbstbeherrschung: 5, sinnesschaerfe: 8, taschendiebstahl: 7, verbergen: 10, zechen: 7, betoeren: 7, gassenwissen: 10, menschenkenntnis: 4, ueberreden: 5, verkleiden: 8, willenskraft: 7, orientierung: 7, brettUndGlueckspiel: 10, geschichtswissen: 1, goetterUndKulte: 4, magiekunde: 1, mechanik: 8, rechnen: 4, rechtskunde: 3, sagenUndLegenden: 5, handel: 8, heilkundeWunden: 3, schloesserknacken: 10 },
      spells: {}, tricks: [], liturgies: {}, },
   { key: 'Orestas', page: 72, sex: 'male', species: 'Mensch', speciesChoice: null, culture: 'Südaventurien',
      profession: 'Söldner', variant: null, language: 'Garethi', script: 'Kusliker Zeichen', localKnowledge: 'Al’Anfa',
      attributes: { fingerDexterity: 10, dexterity: 14, constitution: 13, strength: 14, courage: 15, wisdom: 11, intuition: 13, charisma: 10 },
      entries: [a('Giftresistenz'), d('Schlechte Eigenschaft (Neugier)'), d('Schlechte Eigenschaft (Verschwendungssucht)'), s('Anführer'), s('Attacke verbessern'), s('Parade verbessern'), s('Geländekunde', 1, 'Dschungelkundig'), l('Tulamidya', 1)],
      combatAbilities: ['Einhändiger Kampf', 'Finte I', 'Verteidigungshaltung'],
      techniques: { Hiebwaffen: 10, Raufen: 10, Schwerter: 12, Stangenwaffen: 12, Zweihandschwerter: 12, Armbrüste: 10, Wurfwaffen: 10 },
      talents: { klettern: 1, koerperbeherrschung: 7, selbstbeherrschung: 8, zechen: 7, betoeren: 3, gassenwissen: 6, menschenkenntnis: 8, ueberreden: 6, willenskraft: 8, fischenUndAngeln: 2, orientierung: 5, pflanzenkunde: 4, tierkunde: 4, wildnisleben: 7, goetterUndKulte: 3, kriegskunst: 8, sagenUndLegenden: 5, booteUndSchiffe: 1, handel: 6, heilkundeGift: 7, heilkundeWunden: 7 },
      spells: {}, tricks: [], liturgies: {}, note: 'Mohisch I fehlt im Sprachkatalog.', },
   { key: 'Elwene', page: 74, sex: 'female', species: 'Mensch', speciesChoice: null, culture: 'Mittelreich',
      profession: 'Rondrageweihter', variant: null, language: 'Garethi', script: 'Kusliker Zeichen', localKnowledge: 'Trallop',
      attributes: { fingerDexterity: 10, dexterity: 14, constitution: 13, strength: 14, courage: 15, wisdom: 10, intuition: 12, charisma: 12 },
      entries: [a('Geweihter'), a('Mystiker'), a('Reich'), d('Prinzipientreue', 2, 'Rondrakirche'), d('Verpflichtungen', 2, 'Tempel, Kirche'), d('Schlechte Angewohnheit', 1, 'Selbstgespräche'), s('Anführer'), s('Tradition (Rondrakirche)'), l('Ur-Tulamidya', 1), l('Bosparano', 1), w('Ur-Tulamidya-Zeichen')],
      combatAbilities: ['Belastungsgewöhnung I', 'Finte I', 'Schildspalter', 'Vorstoß', 'Wuchtschlag I'],
      techniques: { Raufen: 10, Schwerter: 12, Zweihandschwerter: 10 },
      talents: { koerperbeherrschung: 6, kraftakt: 5, reiten: 4, selbstbeherrschung: 9, sinnesschaerfe: 4, bekehrenUeberzeugen: 3, etikette: 4, menschenkenntnis: 3, willenskraft: 8, pflanzenkunde: 1, tierkunde: 1, geschichtswissen: 2, goetterUndKulte: 6, kriegskunst: 7, rechnen: 3, rechtskunde: 3, sagenUndLegenden: 3, holzbearbeitung: 1, metallbearbeitung: 3, stoffbearbeitung: 1 },
      spells: {}, tricks: [], liturgies: { Ehrenhaftigkeit: 7, Objektsegen: 5, Schmerzresistenz: 6, 'Schutz der Wehrlosen': 6 }, note: 'Keine der Wahl-Kampftechniken steht im Buch auf 10 (S. 159); die erste Option wird auf 6 gesenkt.', },
   { key: 'Selim', page: 76, sex: 'male', species: 'Mensch', speciesChoice: null, culture: 'Aranien',
      profession: 'Perainegeweihter', variant: null, language: 'Tulamidya', script: 'Tulamidya-Zeichen', localKnowledge: 'Zorgan',
      attributes: { fingerDexterity: 13, dexterity: 9, constitution: 14, strength: 10, courage: 11, wisdom: 14, intuition: 15, charisma: 14 },
      entries: [a('Geweihter'), a('Vertrauenerweckend'), d('Pechmagnet'), d('Prinzipientreue', 1, 'Perainekirche'), d('Schlechte Eigenschaft (Autoritätsglaube)'), d('Schlechte Eigenschaft (Neugier)'), d('Verpflichtungen', 2, 'Tempel, Kirche'), s('Tradition (Perainekirche)'), l('Garethi', 3), w('Kusliker Zeichen')],
      combatAbilities: ['Verteidigungshaltung'],
      techniques: { Hiebwaffen: 8 },
      talents: { selbstbeherrschung: 7, bekehrenUeberzeugen: 7, betoeren: 1, etikette: 2, gassenwissen: 2, menschenkenntnis: 6, ueberreden: 5, willenskraft: 8, pflanzenkunde: 10, tierkunde: 3, brettUndGlueckspiel: 2, geschichtswissen: 6, goetterUndKulte: 8, rechnen: 4, rechtskunde: 2, sagenUndLegenden: 6, alchimie: 3, handel: 5, heilkundeGift: 8, heilkundeKrankheiten: 10, heilkundeSeele: 4, heilkundeWunden: 10, stoffbearbeitung: 1 },
      spells: {}, tricks: [], liturgies: { 'Friedvolle Aura': 8, Giftbann: 8, Heilsegen: 10, Krankheitsbann: 6, Objektsegen: 5, Pflanzenwuchs: 4 }, },
   { key: 'Nevinia', page: 78, sex: 'female', species: 'Mensch', speciesChoice: null, culture: 'Horasreich',
      profession: 'Streuner', variant: 'Hochstapler', language: 'Garethi', script: 'Kusliker Zeichen', localKnowledge: 'Kuslik',
      attributes: { fingerDexterity: 12, dexterity: 13, constitution: 10, strength: 10, courage: 12, wisdom: 14, intuition: 14, charisma: 15 },
      entries: [a('Begabung', 1, 'ueberreden'), a('Fuchssinn'), a('Geborener Redner'), a('Gutaussehend'), a('Soziale Anpassungsfähigkeit'), a('Wohlklang'), s('Dokumentfälscher'), s('Fächersprache'), s('Falschspielen'), l('Isdira', 1), l('Thorwalsch', 1)],
      combatAbilities: ['Einhändiger Kampf', 'Finte I', 'Präziser Stich I', 'Verbessertes Ausweichen I', 'Verteidigungshaltung'],
      techniques: { Dolche: 10, Fechtwaffen: 12, Raufen: 12, Armbrüste: 10, Wurfwaffen: 10 },
      talents: { klettern: 3, koerperbeherrschung: 8, selbstbeherrschung: 2, sinnesschaerfe: 4, tanzen: 1, taschendiebstahl: 4, verbergen: 9, zechen: 4, betoeren: 8, etikette: 8, gassenwissen: 9, menschenkenntnis: 10, ueberreden: 10, verkleiden: 8, willenskraft: 5, orientierung: 4, brettUndGlueckspiel: 8, geographie: 1, geschichtswissen: 1, goetterUndKulte: 2, mechanik: 1, rechnen: 10, rechtskunde: 5, sagenUndLegenden: 3, booteUndSchiffe: 1, handel: 7, malenUndZeichnen: 8, schloesserknacken: 4 },
      spells: {}, tricks: [], liturgies: {}, },
   { key: 'Wulfgrimm', page: 80, sex: 'male', species: 'Mensch', speciesChoice: null, culture: 'Thorwal',
      profession: 'Seefahrer', variant: null, language: 'Thorwalsch', script: 'Thorwalsche Runen', localKnowledge: 'Thorwal',
      attributes: { fingerDexterity: 12, dexterity: 13, constitution: 15, strength: 14, courage: 13, wisdom: 10, intuition: 12, charisma: 11 },
      entries: [a('Hohe Lebenskraft', 5), a('Hohe Zähigkeit'), a('Zäher Hund'), d('Schlechte Eigenschaft (Aberglaube)'), d('Schlechte Eigenschaft (Jähzorn)'), s('Wettervorhersage'), l('Garethi', 3), l('Oloarkh', 1)],
      combatAbilities: ['Belastungsgewöhnung I', 'Finte I', 'Schildspalter', 'Sturmangriff', 'Vorstoß', 'Wuchtschlag I'],
      techniques: { Dolche: 10, Hiebwaffen: 12, Raufen: 12, Schilde: 12, Schwerter: 12, Wurfwaffen: 10 },
      talents: { klettern: 5, koerperbeherrschung: 7, kraftakt: 7, schwimmen: 10, selbstbeherrschung: 6, sinnesschaerfe: 2, zechen: 6, einschuechtern: 6, fesseln: 7, fischenUndAngeln: 9, orientierung: 10, tierkunde: 8, wildnisleben: 3, geographie: 5, goetterUndKulte: 4, sagenUndLegenden: 6, booteUndSchiffe: 10, heilkundeWunden: 4, holzbearbeitung: 6, stoffbearbeitung: 8 },
      spells: {}, tricks: [], liturgies: {}, },
   { key: 'Ylwa', page: 82, sex: 'female', species: 'Mensch', speciesChoice: null, culture: 'Fjarninger',
      profession: 'Stammeskrieger', variant: null, language: 'Fjarningsch', script: null, localKnowledge: 'Heimatdorf',
      attributes: { fingerDexterity: 11, dexterity: 14, constitution: 14, strength: 15, courage: 14, wisdom: 9, intuition: 13, charisma: 10 },
      entries: [a('Hohe Lebenskraft', 5), a('Verbesserte Regeneration (Lebensenergie)', 2), d('Blutrausch'), d('Niedrige Seelenkraft'), d('Schlechte Eigenschaft (Aberglaube)'), d('Schlechte Eigenschaft (Jähzorn)'), s('Geländekunde', 1, 'Eis- und Schneekundig'), s('Schmerzen unterdrücken'), l('Garethi', 2)],
      combatAbilities: ['Schildspalter', 'Sturmangriff', 'Verbessertes Ausweichen I', 'Vorstoß', 'Wuchtschlag II'],
      techniques: { Hiebwaffen: 12, Raufen: 12, Schwerter: 12, Zweihandhiebwaffen: 12, Bögen: 10, Wurfwaffen: 12 },
      talents: { klettern: 8, koerperbeherrschung: 7, kraftakt: 10, schwimmen: 3, selbstbeherrschung: 8, sinnesschaerfe: 7, verbergen: 5, einschuechtern: 9, faehrtensuchen: 5, orientierung: 6, pflanzenkunde: 3, tierkunde: 3, wildnisleben: 6, goetterUndKulte: 2, sagenUndLegenden: 4, heilkundeWunden: 8, holzbearbeitung: 8, lederbearbeitung: 3, metallbearbeitung: 5, steinbearbeitung: 9 },
      spells: {}, tricks: [], liturgies: {}, },
   { key: 'Gonzalo', page: 84, sex: 'male', species: 'Mensch', speciesChoice: null, culture: 'Mittelreich',
      profession: 'Borongeweihter', variant: null, language: 'Garethi', script: 'Kusliker Zeichen', localKnowledge: 'Punin',
      attributes: { fingerDexterity: 11, dexterity: 11, constitution: 10, strength: 11, courage: 15, wisdom: 14, intuition: 14, charisma: 14 },
      entries: [a('Geweihter'), a('Giftresistenz'), a('Unscheinbar'), a('Zeitgefühl'), d('Arm'), d('Prinzipientreue', 2, 'Boronkirche'), d('Verpflichtungen', 2, 'Tempel, Kirche'), s('Schmerzen unterdrücken'), s('Tradition (Boronkirche)'), l('Tulamidya', 2), w('Tulamidya-Zeichen')],
      combatAbilities: [],
      techniques: { Dolche: 8, Hiebwaffen: 10 },
      talents: { selbstbeherrschung: 7, sinnesschaerfe: 7, verbergen: 1, zechen: 3, bekehrenUeberzeugen: 6, einschuechtern: 2, etikette: 3, menschenkenntnis: 10, willenskraft: 10, pflanzenkunde: 5, tierkunde: 3, goetterUndKulte: 6, rechnen: 4, rechtskunde: 3, sagenUndLegenden: 4, sphaerenkunde: 2, sternkunde: 7, alchimie: 3, heilkundeGift: 2, heilkundeKrankheiten: 3, heilkundeSeele: 8, heilkundeWunden: 3, holzbearbeitung: 1, metallbearbeitung: 1, stoffbearbeitung: 1 },
      spells: {}, tricks: [], liturgies: { 'Bann der Furcht': 3, 'Bann des Lichts': 9, Exorzismus: 3, 'Kleiner Bann wider Untote': 10, Objektsegen: 7, Schlaf: 6 }, },
]
export const archetypeFor = (key: string | null | undefined) => archetypeCatalog.find((entry) => entry.key === key) ?? null

// A draft with the archetype's choices. Package values not printed are lowered to the printed value (S. 45).
export function archetypeDraft(archetype: Archetype): CreationDraftData {
   const draft = emptyDraft('Erfahren')
   const profession = resolvedProfession(professionFor(archetype.profession)!, archetype.variant)
   const culture = cultureFor(archetype.culture)
   const technique = (key: string) => archetype.techniques[key] ?? creationLimits.techniqueStart
   // Per choice slot the options with the highest printed value; ties keep the book order
   const choices = profession.choices.map((slot) => [...slot.options].sort((x, y) => technique(y) - technique(x)).slice(0, slot.count))
   const packageTricks = archetype.tricks.filter((key) => profession.tricks?.options.includes(key))
   const talents: Record<string, number> = {}
   for (const { key } of talentCatalog) {
      const inPackage = key in (culture?.package.talents ?? {}) || key in profession.talents
      if (archetype.talents[key] !== undefined) talents[key] = archetype.talents[key]
      else if (inPackage) talents[key] = 0
   }
   // Mensch/Halbelf: the attribute printed above the EG maximum carries the +1 (S. 88)
   const cap = capsFor('Erfahren').attribute
   const speciesChoice = archetype.speciesChoice ?? attributeKeys.find((key) => archetype.attributes[key] > cap) ?? 'courage'
   return {
      ...draft, species: archetype.species, speciesChoice, culture: archetype.culture, culturePackage: true,
      language: archetype.language, script: archetype.script, localKnowledge: archetype.localKnowledge,
      attributes: { ...archetype.attributes },
      profession: { kind: 'package', key: archetype.profession, variant: archetype.variant, choices, application: '', tricks: packageTricks },
      entries: archetype.entries.map((selection) => ({ ...selection })),
      combatAbilities: archetype.combatAbilities.filter((key) => !profession.combatAbilities.includes(key)),
      talents, techniques: Object.fromEntries(combatTechniques.map(({ key }) => [key, technique(key)])),
      spells: { ...archetype.spells }, tricks: archetype.tricks.filter((key) => !packageTricks.includes(key)), liturgies: { ...archetype.liturgies },
      name: archetype.key, sex: archetype.sex,
   }
}
