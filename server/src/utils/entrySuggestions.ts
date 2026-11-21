import { liturgies } from './karmaCatalog'

// Suggested subjects for entries with a free-text subject. The lists are the book's examples and not closed:
// any other subject may still be typed. `level` is the level the book gives for that example.
export type EntrySuggestion = { value: string; level?: number; label?: string }

const plain = (...values: string[]): EntrySuggestion[] => values.map((value) => ({ value }))
const leveled = (level: number, ...values: string[]): EntrySuggestion[] => values.map((value) => ({ value, level }))

// source: DSA5 Regelwerk, S. 321 (Aspektkenntnis: one aspect of the own church), aspects from the liturgy distributions (S. 324–336)
const aspects: EntrySuggestion[] = [...new Map(liturgies.flatMap((liturgy) => liturgy.distribution
   .filter((entry) => entry.church !== 'allgemein')
   .flatMap((entry) => entry.aspects.map((aspect) => [`${aspect}|${entry.church}`, { value: aspect, label: `${aspect} (${entry.church})` }] as const)))).values()]
   .sort((a, b) => a.label.localeCompare(b.label, 'de'))

export const entrySuggestions: Record<string, EntrySuggestion[]> = {
   // source: DSA5 Regelwerk, S. 167 (Beispiele für Magische Einstimmung)
   'Magische Einstimmung': plain('Wesen der Auen', 'Wesen der Berge', 'Wesen des Eises', 'Wesen der Meere', 'Wesen der Nacht', 'Wesen des Waldes'),
   // source: DSA5 Regelwerk, S. 170 (Beispiele für Ängste); Feuer: archetype Irinja (S. 68)
   'Angst vor': plain('Blut', 'Dunkelheit', 'Feuer', 'Höhe', 'dem Meer', 'engen Räumen', 'Insekten', 'Reptilien', 'Spinnen', 'Toten und Untoten'),
   // source: DSA5 Regelwerk, S. 171 (Traditionsartefakt oder Gegenstand mit starker persönlicher Bedeutung)
   Artefaktgebunden: plain('Magierstab', 'Elfisches Musikinstrument', 'Hexenkessel', 'Fluggerät'),
   // source: DSA5 Regelwerk, S. 172 (Körperliche Auffälligkeit, z. B.)
   'Körperliche Auffälligkeit': plain('Hexensträhne', 'Warze auf der Nase', 'Hasenscharte', 'Kleiner Buckel'),
   // source: DSA5 Regelwerk, S. 173 (Beispiele für Magische Einschränkung)
   'Magische Einschränkung': plain('Fluch der Auen', 'Fluch der Berge', 'Fluch des Eises', 'Fluch der Meere', 'Fluch der Nacht', 'Fluch des Waldes'),
   // source: DSA5 Regelwerk, S. 174 (Vorurteile gegen Nichtmenschen, Frauen, Männer, Zauberer, bestimmte Kulte)
   'Persönlichkeitsschwäche (Vorurteile)': plain('Nichtmenschen', 'Frauen', 'Männer', 'Zauberer', 'Kulte'),
   // source: DSA5 Regelwerk, S. 174 (Weltfremd, begrenzt auf Bereiche)
   'Persönlichkeitsschwäche (Weltfremd)': plain('Adel', 'Besitz', 'Fortschritt', 'Geld', 'Götter', 'Hierarchien', 'Religion', 'Welt außerhalb der eigenen Kultur'),
   // source: DSA5 Regelwerk, S. 175 (Beispiele für Prinzipientreue), S. 316–320 (Moralkodizes der Kirchen)
   Prinzipientreue: [
      ...leveled(1, '99 Gesetze', 'Hesindekirche', 'Perainekirche', 'Phexkirche'),
      ...leveled(2, 'Strenger Umgang mit den 99 Gesetzen', 'Ehrenhaftigkeit der Krieger und Ritter', 'Zwergischer Ehrenkodex', 'Boronkirche', 'Praioskirche', 'Rondrakirche', 'Elfische Weltsicht'),
      ...leveled(3, 'Radikale Auslegung der 99 Gesetze', 'Strenger Pazifist'),
   ],
   // source: DSA5 Regelwerk, S. 175–176 (Beispiele für Schlechte Angewohnheiten)
   'Schlechte Angewohnheit': plain('Barfüßer', 'Dritte Person', 'Duzer', 'Erster', 'Heulsuse', 'Hypochonder', 'Junge', 'Langschläfer', 'Links-Rechts-Schwäche',
      'Mein Kind', 'Nägelkauer', 'Nase-/Ohrenbohrer', 'Nervös', 'Putzfimmel', 'Raucher', 'Redet wie ein Wasserfall', 'Schlechte Tischmanieren', 'Selbstgespräche',
      'Unordentlich', 'Wir'),
   // source: DSA5 Regelwerk, S. 178 (Beispiele für Stigmata)
   Stigma: plain('Albino', 'Grüne Haare', 'Brandmale', 'Katzenhafte Augen', 'Schlangenschuppen'),
   // source: DSA5 Regelwerk, S. 179 (Beispiele für Verpflichtungen); "Tempel, Kirche" as in the priest packages (S. 154–159)
   Verpflichtungen: [
      ...leveled(1, 'Sippe', 'Gläubiger'),
      ...leveled(2, 'Lehnsherr', 'Tempel, Kirche', 'Lehrmeister', 'Akademie', 'Gilde'),
      ...leveled(3, 'Sekte'),
   ],
   'Aspektkenntnis': aspects,
}
