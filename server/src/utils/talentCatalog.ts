// StF (Steigerungsfaktor) class per talent, used to compute AP level-up cost
// via attributeLevelUp(). Keys must match the client talent catalog exactly.
export type TalentStfClass = 'a' | 'b' | 'c' | 'd'

export type TalentAttribute = 'courage' | 'wisdom' | 'intuition' | 'charisma' | 'fingerDexterity' | 'dexterity' | 'constitution' | 'strength'

// source: DSA5 Regelwerk, S. 188–213 (Probe attributes; keep in sync with the client talent catalog)
export const talentCatalog: Array<{ key: string; stfClass: TalentStfClass; probe: [TalentAttribute, TalentAttribute, TalentAttribute] }> = [
   // Koerpertalente
   { key: 'fliegen', stfClass: 'b', probe: ['courage', 'intuition', 'dexterity'] },
   { key: 'gaukelei', stfClass: 'a', probe: ['courage', 'charisma', 'fingerDexterity'] },
   { key: 'klettern', stfClass: 'b', probe: ['courage', 'dexterity', 'strength'] },
   { key: 'koerperbeherrschung', stfClass: 'd', probe: ['dexterity', 'dexterity', 'constitution'] },
   { key: 'kraftakt', stfClass: 'b', probe: ['constitution', 'strength', 'strength'] },
   { key: 'reiten', stfClass: 'b', probe: ['charisma', 'dexterity', 'strength'] },
   { key: 'schwimmen', stfClass: 'b', probe: ['dexterity', 'constitution', 'strength'] },
   { key: 'selbstbeherrschung', stfClass: 'd', probe: ['courage', 'courage', 'constitution'] },
   { key: 'singen', stfClass: 'a', probe: ['wisdom', 'charisma', 'constitution'] },
   { key: 'sinnesschaerfe', stfClass: 'd', probe: ['wisdom', 'intuition', 'intuition'] },
   { key: 'tanzen', stfClass: 'a', probe: ['wisdom', 'charisma', 'dexterity'] },
   { key: 'taschendiebstahl', stfClass: 'b', probe: ['courage', 'fingerDexterity', 'dexterity'] },
   { key: 'verbergen', stfClass: 'c', probe: ['courage', 'intuition', 'dexterity'] },
   { key: 'zechen', stfClass: 'a', probe: ['wisdom', 'constitution', 'strength'] },
   // Gesellschaftstalente
   { key: 'bekehrenUeberzeugen', stfClass: 'b', probe: ['courage', 'wisdom', 'charisma'] },
   { key: 'betoeren', stfClass: 'b', probe: ['courage', 'charisma', 'charisma'] },
   { key: 'einschuechtern', stfClass: 'b', probe: ['courage', 'intuition', 'charisma'] },
   { key: 'etikette', stfClass: 'b', probe: ['wisdom', 'intuition', 'charisma'] },
   { key: 'gassenwissen', stfClass: 'c', probe: ['wisdom', 'intuition', 'charisma'] },
   { key: 'menschenkenntnis', stfClass: 'c', probe: ['wisdom', 'intuition', 'charisma'] },
   { key: 'ueberreden', stfClass: 'c', probe: ['courage', 'intuition', 'charisma'] },
   { key: 'verkleiden', stfClass: 'b', probe: ['intuition', 'charisma', 'dexterity'] },
   { key: 'willenskraft', stfClass: 'd', probe: ['courage', 'intuition', 'charisma'] },
   // Naturtalente
   { key: 'faehrtensuchen', stfClass: 'c', probe: ['courage', 'intuition', 'dexterity'] },
   { key: 'fesseln', stfClass: 'a', probe: ['wisdom', 'fingerDexterity', 'strength'] },
   { key: 'fischenUndAngeln', stfClass: 'a', probe: ['fingerDexterity', 'dexterity', 'constitution'] },
   { key: 'orientierung', stfClass: 'b', probe: ['wisdom', 'intuition', 'intuition'] },
   { key: 'pflanzenkunde', stfClass: 'c', probe: ['wisdom', 'fingerDexterity', 'constitution'] },
   { key: 'tierkunde', stfClass: 'c', probe: ['courage', 'courage', 'charisma'] },
   { key: 'wildnisleben', stfClass: 'c', probe: ['courage', 'dexterity', 'constitution'] },
   // Wissenstalente
   { key: 'brettUndGlueckspiel', stfClass: 'a', probe: ['wisdom', 'wisdom', 'intuition'] },
   { key: 'geographie', stfClass: 'b', probe: ['wisdom', 'wisdom', 'intuition'] },
   { key: 'geschichtswissen', stfClass: 'b', probe: ['wisdom', 'wisdom', 'intuition'] },
   { key: 'goetterUndKulte', stfClass: 'b', probe: ['wisdom', 'wisdom', 'intuition'] },
   { key: 'kriegskunst', stfClass: 'b', probe: ['courage', 'wisdom', 'intuition'] },
   { key: 'magiekunde', stfClass: 'c', probe: ['wisdom', 'wisdom', 'intuition'] },
   { key: 'mechanik', stfClass: 'b', probe: ['wisdom', 'wisdom', 'fingerDexterity'] },
   { key: 'rechnen', stfClass: 'a', probe: ['wisdom', 'wisdom', 'intuition'] },
   { key: 'rechtskunde', stfClass: 'a', probe: ['wisdom', 'wisdom', 'intuition'] },
   { key: 'sagenUndLegenden', stfClass: 'b', probe: ['wisdom', 'wisdom', 'intuition'] },
   { key: 'sphaerenkunde', stfClass: 'b', probe: ['wisdom', 'wisdom', 'intuition'] },
   { key: 'sternkunde', stfClass: 'a', probe: ['wisdom', 'wisdom', 'intuition'] },
   // Handwerkstalente
   { key: 'alchimie', stfClass: 'c', probe: ['courage', 'wisdom', 'fingerDexterity'] },
   { key: 'booteUndSchiffe', stfClass: 'b', probe: ['fingerDexterity', 'dexterity', 'strength'] },
   { key: 'fahrzeuge', stfClass: 'a', probe: ['charisma', 'fingerDexterity', 'constitution'] },
   { key: 'handel', stfClass: 'b', probe: ['wisdom', 'intuition', 'charisma'] },
   { key: 'heilkundeGift', stfClass: 'b', probe: ['courage', 'wisdom', 'intuition'] },
   { key: 'heilkundeKrankheiten', stfClass: 'b', probe: ['courage', 'intuition', 'constitution'] },
   { key: 'heilkundeSeele', stfClass: 'b', probe: ['intuition', 'charisma', 'constitution'] },
   { key: 'heilkundeWunden', stfClass: 'd', probe: ['wisdom', 'fingerDexterity', 'fingerDexterity'] },
   { key: 'holzbearbeitung', stfClass: 'b', probe: ['fingerDexterity', 'dexterity', 'strength'] },
   { key: 'lebensmittelbearbeitung', stfClass: 'a', probe: ['intuition', 'fingerDexterity', 'fingerDexterity'] },
   { key: 'lederbearbeitung', stfClass: 'b', probe: ['fingerDexterity', 'dexterity', 'constitution'] },
   { key: 'malenUndZeichnen', stfClass: 'a', probe: ['intuition', 'fingerDexterity', 'fingerDexterity'] },
   { key: 'metallbearbeitung', stfClass: 'c', probe: ['fingerDexterity', 'constitution', 'strength'] },
   { key: 'musizieren', stfClass: 'a', probe: ['charisma', 'fingerDexterity', 'constitution'] },
   { key: 'schloesserknacken', stfClass: 'c', probe: ['intuition', 'fingerDexterity', 'fingerDexterity'] },
   { key: 'steinbearbeitung', stfClass: 'a', probe: ['fingerDexterity', 'fingerDexterity', 'strength'] },
   { key: 'stoffbearbeitung', stfClass: 'a', probe: ['wisdom', 'fingerDexterity', 'fingerDexterity'] },
]

export const talentKeys = talentCatalog.map((entry) => entry.key)

// source: DSA5 Regelwerk, S. 189–212 (talents whose Kritischer Erfolg sets the FP itself: "FP = doppelter FW" or, for
// crafting, "FP verdoppelt, mindestens 5"). Their Sammelprobe QS is not doubled again (user decision, Nov 2026).
export const talentsWithOwnCritical = new Set([
   'klettern', 'kraftakt', 'schwimmen', 'singen', 'sinnesschaerfe', 'tanzen', 'taschendiebstahl', 'verbergen', 'fesseln',
   'fischenUndAngeln', 'mechanik', 'holzbearbeitung', 'lederbearbeitung', 'metallbearbeitung', 'steinbearbeitung', 'stoffbearbeitung',
])

export const talentStfClassByKey: Record<string, TalentStfClass> =
   Object.fromEntries(talentCatalog.map((entry) => [entry.key, entry.stfClass]))

export function isTalentKey(value: string): boolean {
   return talentKeys.includes(value)
}

// source: DSA5 Regelwerk, S. 25 ("Alle Talente sind aktiv"): every talent starts at FW 0, no activation cost
export function defaultTalents() {
   return talentCatalog.map((entry) => ({
      key: entry.key,
      value: 0,
      notes: '',
   }))
}
