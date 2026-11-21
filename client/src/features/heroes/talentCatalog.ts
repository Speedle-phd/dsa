// DSA talent catalog: static reference data (Probe attributes + StF class).
// Keys must match the server catalog in server/src/utils/talentCatalog.ts.
export type TalentAttribute =
   | 'courage'
   | 'wisdom'
   | 'intuition'
   | 'charisma'
   | 'dexterity'
   | 'fingerDexterity'
   | 'constitution'
   | 'strength'

export type TalentCategory =
   | 'physical'
   | 'social'
   | 'nature'
   | 'knowledge'
   | 'craft'

export type TalentStfClass = 'a' | 'b' | 'c' | 'd'

export type TalentDefinition = {
   key: string
   category: TalentCategory
   label: string
   probe: [TalentAttribute, TalentAttribute, TalentAttribute]
   stfClass: TalentStfClass
}

export const talentCategoryLabels: Record<TalentCategory, string> = {
   physical: 'Körpertalente',
   social: 'Gesellschaftstalente',
   nature: 'Naturtalente',
   knowledge: 'Wissenstalente',
   craft: 'Handwerkstalente',
}

export const attributeAbbreviations: Record<TalentAttribute, string> = {
   courage: 'MU',
   wisdom: 'KL',
   intuition: 'IN',
   charisma: 'CH',
   dexterity: 'GE',
   fingerDexterity: 'FF',
   constitution: 'KO',
   strength: 'KK',
}

// English abbreviations, matching the ones used on the Overview tab.
export const attributeAbbreviationsEnglish: Record<TalentAttribute, string> = {
   courage: 'COU',
   wisdom: 'WIS',
   intuition: 'INT',
   charisma: 'CHA',
   dexterity: 'DEX',
   fingerDexterity: 'FIN',
   constitution: 'CON',
   strength: 'STR',
}

export function getAttributeAbbreviation(
   attribute: TalentAttribute,
   language: 'de' | 'en',
): string {
   return language === 'en'
      ? attributeAbbreviationsEnglish[attribute]
      : attributeAbbreviations[attribute]
}

export type BurdenLevel = 'yes' | 'no' | 'maybe'

// Whether a talent's check is made harder by the hero's current burden (BE).
// 'maybe' = the book lists situational exceptions. source: DSA5 Regelwerk, S. 188–213
export const talentBurdenByKey: Record<string, BurdenLevel> = {
   fliegen: 'yes',
   gaukelei: 'yes',
   klettern: 'yes',
   koerperbeherrschung: 'yes',
   kraftakt: 'yes',
   reiten: 'yes',
   schwimmen: 'yes',
   selbstbeherrschung: 'no',
   singen: 'maybe',
   sinnesschaerfe: 'maybe',
   tanzen: 'yes',
   taschendiebstahl: 'yes',
   verbergen: 'yes',
   zechen: 'no',
   bekehrenUeberzeugen: 'no',
   betoeren: 'maybe',
   einschuechtern: 'no',
   etikette: 'no',
   gassenwissen: 'maybe',
   menschenkenntnis: 'no',
   ueberreden: 'no',
   verkleiden: 'yes',
   willenskraft: 'no',
   faehrtensuchen: 'yes',
   fesseln: 'maybe',
   fischenUndAngeln: 'maybe',
   orientierung: 'no',
   pflanzenkunde: 'maybe',
   tierkunde: 'yes',
   wildnisleben: 'yes',
   brettUndGlueckspiel: 'no',
   geographie: 'no',
   geschichtswissen: 'no',
   goetterUndKulte: 'no',
   kriegskunst: 'no',
   magiekunde: 'no',
   mechanik: 'no',
   rechnen: 'no',
   rechtskunde: 'no',
   sagenUndLegenden: 'no',
   sphaerenkunde: 'no',
   sternkunde: 'no',
   alchimie: 'yes',
   booteUndSchiffe: 'yes',
   fahrzeuge: 'yes',
   handel: 'no',
   heilkundeGift: 'yes',
   heilkundeKrankheiten: 'yes',
   heilkundeSeele: 'no',
   heilkundeWunden: 'yes',
   holzbearbeitung: 'yes',
   lebensmittelbearbeitung: 'yes',
   lederbearbeitung: 'yes',
   malenUndZeichnen: 'yes',
   metallbearbeitung: 'yes',
   musizieren: 'yes',
   schloesserknacken: 'yes',
   steinbearbeitung: 'yes',
   stoffbearbeitung: 'yes',
}

export function getTalentBurdenLevel(key: string): BurdenLevel {
   return talentBurdenByKey[key] ?? 'no'
}

// Kritischer Erfolg with its own FP rule (S. 189–212): "FP = doppelter FW" for QS, Vergleichs- and Sammelproben, or for
// crafting "FP verdoppelt, mindestens 5". Mirrored on the server (talentsWithOwnCritical) for Sammelproben.
export type TalentCriticalRule = 'doubleSkill' | 'doubleFp'
const doubleSkill = ['klettern', 'kraftakt', 'schwimmen', 'singen', 'sinnesschaerfe', 'tanzen', 'taschendiebstahl', 'verbergen', 'fesseln', 'fischenUndAngeln', 'mechanik']
const doubleFp = ['holzbearbeitung', 'lederbearbeitung', 'metallbearbeitung', 'steinbearbeitung', 'stoffbearbeitung']
export const talentCriticalRules: Record<string, TalentCriticalRule> = Object.fromEntries([
   ...doubleSkill.map((key) => [key, 'doubleSkill'] as const), ...doubleFp.map((key) => [key, 'doubleFp'] as const),
])

// source: DSA5 Regelwerk, S. 184 (optional Talentgruppenprobe: one probe per talent group)
export const talentGroupProbes: Record<TalentCategory, [TalentAttribute, TalentAttribute, TalentAttribute]> = {
   physical: ['courage', 'dexterity', 'strength'],
   social: ['intuition', 'charisma', 'charisma'],
   nature: ['courage', 'dexterity', 'constitution'],
   knowledge: ['wisdom', 'wisdom', 'intuition'],
   craft: ['fingerDexterity', 'fingerDexterity', 'constitution'],
}

// source: DSA5 Regelwerk, S. 188–213
export const talentCatalog: TalentDefinition[] = [
   // Körpertalente
   {
      key: 'fliegen',
      category: 'physical',
      label: 'Fliegen',
      probe: ['courage', 'intuition', 'dexterity'],
      stfClass: 'b',
   },
   {
      key: 'gaukelei',
      category: 'physical',
      label: 'Gaukeleien',
      probe: ['courage', 'charisma', 'fingerDexterity'],
      stfClass: 'a',
   },
   {
      key: 'klettern',
      category: 'physical',
      label: 'Klettern',
      probe: ['courage', 'dexterity', 'strength'],
      stfClass: 'b',
   },
   {
      key: 'koerperbeherrschung',
      category: 'physical',
      label: 'Körperbeherrschung',
      probe: ['dexterity', 'dexterity', 'constitution'],
      stfClass: 'd',
   },
   {
      key: 'kraftakt',
      category: 'physical',
      label: 'Kraftakt',
      probe: ['constitution', 'strength', 'strength'],
      stfClass: 'b',
   },
   {
      key: 'reiten',
      category: 'physical',
      label: 'Reiten',
      probe: ['charisma', 'dexterity', 'strength'],
      stfClass: 'b',
   },
   {
      key: 'schwimmen',
      category: 'physical',
      label: 'Schwimmen',
      probe: ['dexterity', 'constitution', 'strength'],
      stfClass: 'b',
   },
   {
      key: 'selbstbeherrschung',
      category: 'physical',
      label: 'Selbstbeherrschung',
      probe: ['courage', 'courage', 'constitution'],
      stfClass: 'd',
   },
   {
      key: 'singen',
      category: 'physical',
      label: 'Singen',
      probe: ['wisdom', 'charisma', 'constitution'],
      stfClass: 'a',
   },
   {
      key: 'sinnesschaerfe',
      category: 'physical',
      label: 'Sinnesschärfe',
      probe: ['wisdom', 'intuition', 'intuition'],
      stfClass: 'd',
   },
   {
      key: 'tanzen',
      category: 'physical',
      label: 'Tanzen',
      probe: ['wisdom', 'charisma', 'dexterity'],
      stfClass: 'a',
   },
   {
      key: 'taschendiebstahl',
      category: 'physical',
      label: 'Taschendiebstahl',
      probe: ['courage', 'fingerDexterity', 'dexterity'],
      stfClass: 'b',
   },
   {
      key: 'verbergen',
      category: 'physical',
      label: 'Verbergen',
      probe: ['courage', 'intuition', 'dexterity'],
      stfClass: 'c',
   },
   {
      key: 'zechen',
      category: 'physical',
      label: 'Zechen',
      probe: ['wisdom', 'constitution', 'strength'],
      stfClass: 'a',
   },
   // Gesellschaftstalente
   {
      key: 'bekehrenUeberzeugen',
      category: 'social',
      label: 'Bekehren & Überzeugen',
      probe: ['courage', 'wisdom', 'charisma'],
      stfClass: 'b',
   },
   {
      key: 'betoeren',
      category: 'social',
      label: 'Betören',
      probe: ['courage', 'charisma', 'charisma'],
      stfClass: 'b',
   },
   {
      key: 'einschuechtern',
      category: 'social',
      label: 'Einschüchtern',
      probe: ['courage', 'intuition', 'charisma'],
      stfClass: 'b',
   },
   {
      key: 'etikette',
      category: 'social',
      label: 'Etikette',
      probe: ['wisdom', 'intuition', 'charisma'],
      stfClass: 'b',
   },
   {
      key: 'gassenwissen',
      category: 'social',
      label: 'Gassenwissen',
      probe: ['wisdom', 'intuition', 'charisma'],
      stfClass: 'c',
   },
   {
      key: 'menschenkenntnis',
      category: 'social',
      label: 'Menschenkenntnis',
      probe: ['wisdom', 'intuition', 'charisma'],
      stfClass: 'c',
   },
   {
      key: 'ueberreden',
      category: 'social',
      label: 'Überreden',
      probe: ['courage', 'intuition', 'charisma'],
      stfClass: 'c',
   },
   {
      key: 'verkleiden',
      category: 'social',
      label: 'Verkleiden',
      probe: ['intuition', 'charisma', 'dexterity'],
      stfClass: 'b',
   },
   {
      key: 'willenskraft',
      category: 'social',
      label: 'Willenskraft',
      probe: ['courage', 'intuition', 'charisma'],
      stfClass: 'd',
   },
   // Naturtalente
   {
      key: 'faehrtensuchen',
      category: 'nature',
      label: 'Fährtensuchen',
      probe: ['courage', 'intuition', 'dexterity'],
      stfClass: 'c',
   },
   {
      key: 'fesseln',
      category: 'nature',
      label: 'Fesseln',
      probe: ['wisdom', 'fingerDexterity', 'strength'],
      stfClass: 'a',
   },
   {
      key: 'fischenUndAngeln',
      category: 'nature',
      label: 'Fischen & Angeln',
      probe: ['fingerDexterity', 'dexterity', 'constitution'],
      stfClass: 'a',
   },
   {
      key: 'orientierung',
      category: 'nature',
      label: 'Orientierung',
      probe: ['wisdom', 'intuition', 'intuition'],
      stfClass: 'b',
   },
   {
      key: 'pflanzenkunde',
      category: 'nature',
      label: 'Pflanzenkunde',
      probe: ['wisdom', 'fingerDexterity', 'constitution'],
      stfClass: 'c',
   },
   {
      key: 'tierkunde',
      category: 'nature',
      label: 'Tierkunde',
      probe: ['courage', 'courage', 'charisma'],
      stfClass: 'c',
   },
   {
      key: 'wildnisleben',
      category: 'nature',
      label: 'Wildnisleben',
      probe: ['courage', 'dexterity', 'constitution'],
      stfClass: 'c',
   },
   // Wissenstalente
   {
      key: 'brettUndGlueckspiel',
      category: 'knowledge',
      label: 'Brett- & Glücksspiel',
      probe: ['wisdom', 'wisdom', 'intuition'],
      stfClass: 'a',
   },
   {
      key: 'geographie',
      category: 'knowledge',
      label: 'Geographie',
      probe: ['wisdom', 'wisdom', 'intuition'],
      stfClass: 'b',
   },
   {
      key: 'geschichtswissen',
      category: 'knowledge',
      label: 'Geschichtswissen',
      probe: ['wisdom', 'wisdom', 'intuition'],
      stfClass: 'b',
   },
   {
      key: 'goetterUndKulte',
      category: 'knowledge',
      label: 'Götter & Kulte',
      probe: ['wisdom', 'wisdom', 'intuition'],
      stfClass: 'b',
   },
   {
      key: 'kriegskunst',
      category: 'knowledge',
      label: 'Kriegskunst',
      probe: ['courage', 'wisdom', 'intuition'],
      stfClass: 'b',
   },
   {
      key: 'magiekunde',
      category: 'knowledge',
      label: 'Magiekunde',
      probe: ['wisdom', 'wisdom', 'intuition'],
      stfClass: 'c',
   },
   {
      key: 'mechanik',
      category: 'knowledge',
      label: 'Mechanik',
      probe: ['wisdom', 'wisdom', 'fingerDexterity'],
      stfClass: 'b',
   },
   {
      key: 'rechnen',
      category: 'knowledge',
      label: 'Rechnen',
      probe: ['wisdom', 'wisdom', 'intuition'],
      stfClass: 'a',
   },
   {
      key: 'rechtskunde',
      category: 'knowledge',
      label: 'Rechtskunde',
      probe: ['wisdom', 'wisdom', 'intuition'],
      stfClass: 'a',
   },
   {
      key: 'sagenUndLegenden',
      category: 'knowledge',
      label: 'Sagen & Legenden',
      probe: ['wisdom', 'wisdom', 'intuition'],
      stfClass: 'b',
   },
   {
      key: 'sphaerenkunde',
      category: 'knowledge',
      label: 'Sphärenkunde',
      probe: ['wisdom', 'wisdom', 'intuition'],
      stfClass: 'b',
   },
   {
      key: 'sternkunde',
      category: 'knowledge',
      label: 'Sternkunde',
      probe: ['wisdom', 'wisdom', 'intuition'],
      stfClass: 'a',
   },
   // Handwerkstalente
   {
      key: 'alchimie',
      category: 'craft',
      label: 'Alchimie',
      probe: ['courage', 'wisdom', 'fingerDexterity'],
      stfClass: 'c',
   },
   {
      key: 'booteUndSchiffe',
      category: 'craft',
      label: 'Boote & Schiffe',
      probe: ['fingerDexterity', 'dexterity', 'strength'],
      stfClass: 'b',
   },
   {
      key: 'fahrzeuge',
      category: 'craft',
      label: 'Fahrzeuge',
      probe: ['charisma', 'fingerDexterity', 'constitution'],
      stfClass: 'a',
   },
   {
      key: 'handel',
      category: 'craft',
      label: 'Handel',
      probe: ['wisdom', 'intuition', 'charisma'],
      stfClass: 'b',
   },
   {
      key: 'heilkundeGift',
      category: 'craft',
      label: 'Heilkunde Gift',
      probe: ['courage', 'wisdom', 'intuition'],
      stfClass: 'b',
   },
   {
      key: 'heilkundeKrankheiten',
      category: 'craft',
      label: 'Heilkunde Krankheiten',
      probe: ['courage', 'intuition', 'constitution'],
      stfClass: 'b',
   },
   {
      key: 'heilkundeSeele',
      category: 'craft',
      label: 'Heilkunde Seele',
      probe: ['intuition', 'charisma', 'constitution'],
      stfClass: 'b',
   },
   {
      key: 'heilkundeWunden',
      category: 'craft',
      label: 'Heilkunde Wunden',
      probe: ['wisdom', 'fingerDexterity', 'fingerDexterity'],
      stfClass: 'd',
   },
   {
      key: 'holzbearbeitung',
      category: 'craft',
      label: 'Holzbearbeitung',
      probe: ['fingerDexterity', 'dexterity', 'strength'],
      stfClass: 'b',
   },
   {
      key: 'lebensmittelbearbeitung',
      category: 'craft',
      label: 'Lebensmittelbearbeitung',
      probe: ['intuition', 'fingerDexterity', 'fingerDexterity'],
      stfClass: 'a',
   },
   {
      key: 'lederbearbeitung',
      category: 'craft',
      label: 'Lederbearbeitung',
      probe: ['fingerDexterity', 'dexterity', 'constitution'],
      stfClass: 'b',
   },
   {
      key: 'malenUndZeichnen',
      category: 'craft',
      label: 'Malen & Zeichnen',
      probe: ['intuition', 'fingerDexterity', 'fingerDexterity'],
      stfClass: 'a',
   },
   {
      key: 'metallbearbeitung',
      category: 'craft',
      label: 'Metallbearbeitung',
      probe: ['fingerDexterity', 'constitution', 'strength'],
      stfClass: 'c',
   },
   {
      key: 'musizieren',
      category: 'craft',
      label: 'Musizieren',
      probe: ['charisma', 'fingerDexterity', 'constitution'],
      stfClass: 'a',
   },
   {
      key: 'schloesserknacken',
      category: 'craft',
      label: 'Schlösserknacken',
      probe: ['intuition', 'fingerDexterity', 'fingerDexterity'],
      stfClass: 'c',
   },
   {
      key: 'steinbearbeitung',
      category: 'craft',
      label: 'Steinbearbeitung',
      probe: ['fingerDexterity', 'fingerDexterity', 'strength'],
      stfClass: 'a',
   },
   {
      key: 'stoffbearbeitung',
      category: 'craft',
      label: 'Stoffbearbeitung',
      probe: ['wisdom', 'fingerDexterity', 'fingerDexterity'],
      stfClass: 'a',
   },
]

export const talentCategories: TalentCategory[] = [
   'physical',
   'social',
   'nature',
   'knowledge',
   'craft',
]

export function talentsByCategory(category: TalentCategory) {
   return talentCatalog.filter((talent) => talent.category === category)
}

export const qualityLevelTable: Array<{
   pointsLabel: string
   quality: number
}> = [
   { pointsLabel: '0-3', quality: 1 },
   { pointsLabel: '4-6', quality: 2 },
   { pointsLabel: '7-9', quality: 3 },
   { pointsLabel: '10-12', quality: 4 },
   { pointsLabel: '13-15', quality: 5 },
   { pointsLabel: '16+', quality: 6 },
]

export const attributeModifierColumns = [-3, -2, -1, 0, 1, 2, 3] as const

// Rulebook order MU KL IN CH FF GE KO KK, as on the hero sheet; used on every attribute display.
export const baseAttributeOrder: TalentAttribute[] = [
   'courage',
   'wisdom',
   'intuition',
   'charisma',
   'fingerDexterity',
   'dexterity',
   'constitution',
   'strength',
]

export const attributeLabels: Record<TalentAttribute, string> = {
   courage: 'Courage',
   wisdom: 'Wisdom',
   intuition: 'Intuition',
   charisma: 'Charisma',
   dexterity: 'Dexterity',
   fingerDexterity: 'Finger dexterity',
   constitution: 'Constitution',
   strength: 'Strength',
}

export const attributeModifierRows = baseAttributeOrder
