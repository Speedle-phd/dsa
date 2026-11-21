// Cultures (S. 95–126). The culture itself is free; it gives the mother tongue at level III and one Ortskenntnis (S. 41).
// The Kulturpaket is optional and bought as a whole (S. 40). The script is a suggestion that must be bought.
export type CultureDefinition = {
   key: string
   page: number
   species: Array<'Mensch' | 'Elf' | 'Zwerg'>
   package: { ap: number; talents: Record<string, number> }
   // Mother tongue options (language catalog keys); dialects are flavour only
   languages: string[]
   // Suggested scripts (script catalog keys), each 2 AP (S. 41)
   scripts: string[]
   socialStatus: Array<'Adel' | 'Unfrei'>
   // Übliche Professionen; others need the GM's approval (S. 44). magic: Hexe/Magier/elven professions, divine: churches
   professions: { worldly: { except: string[] } | { only: string[] }; magic: string[]; divine: string[] }
}

const allChurches = ['Boron', 'Hesinde', 'Peraine', 'Phex', 'Praios', 'Rondra']

const human = ['Mensch'] as Array<'Mensch'>
const elf = ['Elf'] as Array<'Elf'>
const dwarf = ['Zwerg'] as Array<'Zwerg'>

// source: DSA5 Regelwerk, S. 41–42 (Kulturen im Überblick: package talents and AP), S. 97–125 (language, script, social status, usual professions)
export const cultureCatalog: CultureDefinition[] = [
   { key: 'Andergast', page: 97, species: human, languages: ['Garethi'], scripts: ['Kusliker Zeichen'], socialStatus: ['Adel', 'Unfrei'],
      professions: { worldly: { except: ['Gladiator', 'Stammeskrieger'] }, magic: ['Hexe', 'Magier'], divine: allChurches },
      package: { ap: 20, talents: { holzbearbeitung: 2, orientierung: 1, pflanzenkunde: 1, sagenUndLegenden: 1, tierkunde: 1, wildnisleben: 2 } } },
   { key: 'Aranien', page: 98, species: human, languages: ['Tulamidya', 'Garethi'], scripts: ['Tulamidya-Zeichen', 'Kusliker Zeichen'], socialStatus: ['Adel', 'Unfrei'],
      professions: { worldly: { except: ['Ritter', 'Gladiator', 'Stammeskrieger'] }, magic: ['Hexe', 'Magier'], divine: allChurches },
      package: { ap: 26, talents: { betoeren: 1, brettUndGlueckspiel: 1, gassenwissen: 2, handel: 2, menschenkenntnis: 1, rechnen: 1, sagenUndLegenden: 1, stoffbearbeitung: 1, ueberreden: 2 } } },
   { key: 'Bornland', page: 99, species: human, languages: ['Garethi'], scripts: ['Kusliker Zeichen'], socialStatus: ['Adel', 'Unfrei'],
      professions: { worldly: { except: ['Gladiator', 'Stammeskrieger'] }, magic: ['Hexe', 'Magier'], divine: allChurches },
      package: { ap: 18, talents: { faehrtensuchen: 1, holzbearbeitung: 2, lebensmittelbearbeitung: 1, orientierung: 1, pflanzenkunde: 1, wildnisleben: 1, zechen: 2 } } },
   { key: 'Fjarninger', page: 101, species: human, languages: ['Fjarningsch'], scripts: [], socialStatus: ['Adel'],
      professions: { worldly: { only: ['Händler', 'Heiler', 'Jäger', 'Söldner', 'Stammeskrieger'] }, magic: [], divine: [] },
      package: { ap: 33, talents: { einschuechtern: 2, faehrtensuchen: 1, koerperbeherrschung: 1, kraftakt: 2, metallbearbeitung: 1, orientierung: 2, selbstbeherrschung: 1, steinbearbeitung: 1, wildnisleben: 2 } } },
   { key: 'Horasreich', page: 102, species: human, languages: ['Garethi'], scripts: ['Kusliker Zeichen'], socialStatus: ['Adel'],
      professions: { worldly: { except: ['Gladiator', 'Ritter', 'Stammeskrieger'] }, magic: ['Hexe', 'Magier'], divine: allChurches },
      package: { ap: 27, talents: { betoeren: 1, booteUndSchiffe: 1, etikette: 2, gassenwissen: 2, geographie: 1, geschichtswissen: 1, handel: 1, mechanik: 1, rechnen: 2, rechtskunde: 2, tanzen: 1 } } },
   { key: 'Maraskan', page: 103, species: human, languages: ['Garethi', 'Tulamidya'], scripts: ['Kusliker Zeichen', 'Tulamidya-Zeichen'], socialStatus: ['Adel'],
      professions: { worldly: { except: ['Gladiator', 'Ritter', 'Stammeskrieger'] }, magic: ['Hexe', 'Magier'], divine: [] },
      package: { ap: 26, talents: { goetterUndKulte: 1, heilkundeGift: 2, orientierung: 1, pflanzenkunde: 2, tierkunde: 2, verbergen: 1, wildnisleben: 1 } } },
   { key: 'Mhanadistan', page: 104, species: human, languages: ['Tulamidya'], scripts: ['Tulamidya-Zeichen'], socialStatus: ['Adel', 'Unfrei'],
      professions: { worldly: { except: ['Ritter', 'Stammeskrieger'] }, magic: ['Hexe', 'Magier'], divine: allChurches },
      package: { ap: 28, talents: { brettUndGlueckspiel: 2, gassenwissen: 2, geschichtswissen: 1, goetterUndKulte: 2, handel: 2, magiekunde: 1, sagenUndLegenden: 2, ueberreden: 1 } } },
   { key: 'Mittelreich', page: 106, species: human, languages: ['Garethi'], scripts: ['Kusliker Zeichen'], socialStatus: ['Adel', 'Unfrei'],
      professions: { worldly: { except: ['Stammeskrieger'] }, magic: ['Hexe', 'Magier'], divine: allChurches },
      package: { ap: 12, talents: { holzbearbeitung: 1, metallbearbeitung: 1, pflanzenkunde: 1, stoffbearbeitung: 1, tierkunde: 1 } } },
   { key: 'Nivesen', page: 107, species: human, languages: ['Nujuka'], scripts: [], socialStatus: ['Adel'],
      professions: { worldly: { only: ['Händler', 'Heiler', 'Jäger', 'Söldner', 'Stammeskrieger'] }, magic: [], divine: [] },
      package: { ap: 37, talents: { faehrtensuchen: 2, fahrzeuge: 1, orientierung: 2, pflanzenkunde: 1, sagenUndLegenden: 2, sinnesschaerfe: 1, tierkunde: 2, verbergen: 1, wildnisleben: 2 } } },
   { key: 'Norbarden', page: 108, species: human, languages: ['Alaani'], scripts: ['Kusliker Zeichen'], socialStatus: [],
      professions: { worldly: { only: ['Händler', 'Heiler', 'Jäger', 'Söldner', 'Streuner'] }, magic: ['Hexe', 'Magier'], divine: ['Hesinde', 'Phex'] },
      package: { ap: 18, talents: { fahrzeuge: 2, geographie: 2, handel: 2, orientierung: 1, ueberreden: 1, wildnisleben: 1 } } },
   { key: 'Nordaventurien', page: 109, species: human, languages: ['Alaani', 'Garethi', 'Nujuka', 'Thorwalsch'], scripts: ['Kusliker Zeichen'], socialStatus: ['Adel', 'Unfrei'],
      professions: { worldly: { except: ['Gladiator', 'Stammeskrieger'] }, magic: ['Hexe', 'Magier'], divine: allChurches },
      package: { ap: 25, talents: { faehrtensuchen: 1, handel: 1, holzbearbeitung: 1, lederbearbeitung: 1, orientierung: 1, pflanzenkunde: 1, selbstbeherrschung: 1, tierkunde: 1, wildnisleben: 1, zechen: 1 } } },
   { key: 'Nostria', page: 110, species: human, languages: ['Garethi'], scripts: ['Kusliker Zeichen'], socialStatus: ['Adel', 'Unfrei'],
      professions: { worldly: { except: ['Gladiator', 'Stammeskrieger'] }, magic: ['Hexe', 'Magier'], divine: allChurches },
      package: { ap: 15, talents: { fischenUndAngeln: 2, orientierung: 1, pflanzenkunde: 1, sagenUndLegenden: 1, tierkunde: 1, wildnisleben: 1 } } },
   { key: 'Novadis', page: 111, species: human, languages: ['Tulamidya'], scripts: ['Geheiligte Glyphen von Unau'], socialStatus: ['Adel', 'Unfrei'],
      professions: { worldly: { except: ['Gladiator', 'Ritter'] }, magic: ['Magier'], divine: [] },
      package: { ap: 25, talents: { einschuechtern: 2, faehrtensuchen: 1, orientierung: 2, rechtskunde: 1, reiten: 2, tierkunde: 1, wildnisleben: 2 } } },
   { key: 'Südaventurien', page: 112, species: human, languages: ['Garethi'], scripts: ['Kusliker Zeichen'], socialStatus: ['Adel', 'Unfrei'],
      professions: { worldly: { except: ['Ritter', 'Stammeskrieger'] }, magic: ['Hexe', 'Magier'], divine: allChurches },
      package: { ap: 26, talents: { betoeren: 1, booteUndSchiffe: 1, fischenUndAngeln: 1, gassenwissen: 2, heilkundeGift: 1, menschenkenntnis: 2, ueberreden: 1, willenskraft: 1 } } },
   { key: 'Svellttal', page: 113, species: human, languages: ['Garethi'], scripts: ['Kusliker Zeichen'], socialStatus: ['Adel', 'Unfrei'],
      professions: { worldly: { except: ['Gladiator', 'Stammeskrieger'] }, magic: ['Hexe', 'Magier'], divine: allChurches },
      package: { ap: 21, talents: { faehrtensuchen: 2, fahrzeuge: 2, orientierung: 1, pflanzenkunde: 1, sagenUndLegenden: 1, tierkunde: 1, wildnisleben: 1 } } },
   { key: 'Thorwal', page: 114, species: human, languages: ['Thorwalsch'], scripts: ['Thorwalsche Runen', 'Kusliker Zeichen'], socialStatus: ['Adel'],
      professions: { worldly: { except: ['Gladiator', 'Ritter', 'Stammeskrieger'] }, magic: ['Hexe', 'Magier'], divine: [] },
      package: { ap: 24, talents: { booteUndSchiffe: 2, einschuechtern: 1, fischenUndAngeln: 2, geographie: 1, holzbearbeitung: 2, kraftakt: 2, orientierung: 1, sagenUndLegenden: 1, zechen: 2 } } },
   { key: 'Utulus', page: 116, species: human, languages: ['Tahaya'], scripts: [], socialStatus: ['Adel', 'Unfrei'],
      professions: { worldly: { only: ['Händler', 'Heiler', 'Jäger', 'Seefahrer', 'Stammeskrieger'] }, magic: [], divine: [] },
      package: { ap: 40, talents: { einschuechtern: 1, faehrtensuchen: 1, heilkundeGift: 1, heilkundeKrankheiten: 1, holzbearbeitung: 1, koerperbeherrschung: 1, orientierung: 1, pflanzenkunde: 1, sagenUndLegenden: 1, schwimmen: 1, sinnesschaerfe: 1, tierkunde: 2, wildnisleben: 2 } } },
   { key: 'Waldmenschen', page: 117, species: human, languages: ['Tahaya'], scripts: [], socialStatus: ['Adel'],
      professions: { worldly: { only: ['Händler', 'Heiler', 'Jäger', 'Söldner', 'Stammeskrieger'] }, magic: ['Hexe'], divine: [] },
      package: { ap: 42, talents: { faehrtensuchen: 1, heilkundeGift: 1, heilkundeKrankheiten: 1, klettern: 1, koerperbeherrschung: 1, orientierung: 1, pflanzenkunde: 2, sagenUndLegenden: 1, sinnesschaerfe: 1, tierkunde: 2, verbergen: 1, wildnisleben: 2 } } },
   { key: 'Zyklopeninseln', page: 118, species: human, languages: ['Garethi', 'Zyklopäisch'], scripts: ['Kusliker Zeichen'], socialStatus: ['Adel'],
      professions: { worldly: { except: ['Ritter', 'Stammeskrieger'] }, magic: ['Hexe', 'Magier'], divine: allChurches },
      package: { ap: 16, talents: { booteUndSchiffe: 1, fischenUndAngeln: 2, geschichtswissen: 1, goetterUndKulte: 2, musizieren: 1, rechnen: 1, rechtskunde: 1, sagenUndLegenden: 1, tanzen: 1 } } },
   { key: 'Auelfen', page: 119, species: elf, languages: ['Isdira'], scripts: ['Isdira- und Asdharia-Zeichen'], socialStatus: [],
      professions: { worldly: { only: [] }, magic: ['Wildnisläufer', 'Zauberweber'], divine: [] },
      package: { ap: 43, talents: { betoeren: 1, booteUndSchiffe: 1, faehrtensuchen: 1, fischenUndAngeln: 2, koerperbeherrschung: 2, musizieren: 2, orientierung: 1, pflanzenkunde: 1, schwimmen: 2, singen: 2, sinnesschaerfe: 1, tierkunde: 1, verbergen: 1, wildnisleben: 1 } } },
   { key: 'Firnelfen', page: 120, species: elf, languages: ['Isdira'], scripts: ['Isdira- und Asdharia-Zeichen'], socialStatus: [],
      professions: { worldly: { only: [] }, magic: ['Wildnisläufer', 'Zauberweber'], divine: [] },
      package: { ap: 55, talents: { faehrtensuchen: 2, fischenUndAngeln: 1, klettern: 1, koerperbeherrschung: 2, musizieren: 2, orientierung: 2, selbstbeherrschung: 1, singen: 2, sinnesschaerfe: 2, tierkunde: 2, verbergen: 2, wildnisleben: 2 } } },
   { key: 'Waldelfen', page: 121, species: elf, languages: ['Isdira'], scripts: ['Isdira- und Asdharia-Zeichen'], socialStatus: [],
      professions: { worldly: { only: [] }, magic: ['Wildnisläufer', 'Zauberweber'], divine: [] },
      package: { ap: 47, talents: { faehrtensuchen: 2, klettern: 1, koerperbeherrschung: 2, musizieren: 2, orientierung: 1, pflanzenkunde: 2, singen: 2, sinnesschaerfe: 1, tierkunde: 2, verbergen: 2, wildnisleben: 1 } } },
   { key: 'Ambosszwerge', page: 122, species: dwarf, languages: ['Rogolan'], scripts: ['Rogolan-Runen'], socialStatus: [],
      professions: { worldly: { except: ['Gladiator', 'Ritter', 'Stammeskrieger'] }, magic: ['Magier'], divine: ['Rondra'] },
      package: { ap: 31, talents: { einschuechtern: 1, geschichtswissen: 1, kraftakt: 2, kriegskunst: 2, mechanik: 1, metallbearbeitung: 2, orientierung: 1, sagenUndLegenden: 1, steinbearbeitung: 2, verbergen: 1, zechen: 2 } } },
   { key: 'Brillantzwerge', page: 123, species: dwarf, languages: ['Rogolan'], scripts: ['Rogolan-Runen'], socialStatus: [],
      professions: { worldly: { except: ['Gladiator', 'Ritter', 'Stammeskrieger'] }, magic: ['Magier'], divine: ['Hesinde', 'Phex', 'Rondra'] },
      package: { ap: 29, talents: { betoeren: 1, geographie: 2, geschichtswissen: 1, metallbearbeitung: 1, musizieren: 1, sagenUndLegenden: 1, schloesserknacken: 2, steinbearbeitung: 1, tanzen: 1, verbergen: 2, zechen: 1 } } },
   { key: 'Erzzwerge', page: 124, species: dwarf, languages: ['Rogolan'], scripts: ['Rogolan-Runen'], socialStatus: [],
      professions: { worldly: { except: ['Gladiator', 'Ritter', 'Stammeskrieger'] }, magic: ['Magier'], divine: [] },
      package: { ap: 34, talents: { geschichtswissen: 2, goetterUndKulte: 2, mechanik: 2, metallbearbeitung: 1, rechnen: 2, rechtskunde: 1, sagenUndLegenden: 2, selbstbeherrschung: 1, steinbearbeitung: 1, verbergen: 2, zechen: 1 } } },
   { key: 'Hügelzwerge', page: 125, species: dwarf, languages: ['Rogolan'], scripts: ['Rogolan-Runen'], socialStatus: [],
      professions: { worldly: { except: ['Gladiator', 'Ritter', 'Stammeskrieger'] }, magic: ['Magier'], divine: ['Peraine'] },
      package: { ap: 13, talents: { fahrzeuge: 1, fischenUndAngeln: 1, lebensmittelbearbeitung: 2, singen: 1, tanzen: 1, verbergen: 2, zechen: 1 } } },
]
export const cultureFor = (key: string | null | undefined) => cultureCatalog.find((entry) => entry.key === key) ?? null
