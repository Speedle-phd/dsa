// Animal companions and witch familiars (DSA5 Regelwerk, S. 278–280, 354–362).
export type CompanionAttribute = 'courage' | 'wisdom' | 'intuition' | 'charisma' | 'fingerDexterity' | 'dexterity' | 'constitution' | 'strength'
export type CompanionAttributes = Record<CompanionAttribute, number>
export type CompanionAttack = { name: string; attack: number; damage: string; reach: string }
export type CompanionTalent = { key: string; value: number | null; note: string }
export type CompanionSpecies = {
   key: string
   page: number
   familiar: boolean
   size: string
   attributes: CompanionAttributes
   health: number
   initiative: number
   defense: number
   soulPower: number
   toughness: number
   speed: string
   armor: number
   actions: number
   attacks: CompanionAttack[]
   talents: CompanionTalent[]
   traits: string
   abilities: string
   special: string
   // [LeP at or below, Schmerz levels gained]
   painTable: Array<[number, number]>
}

const attrs = (courage: number, wisdom: number, intuition: number, charisma: number,
   fingerDexterity: number, dexterity: number, constitution: number, strength: number): CompanionAttributes =>
   ({ courage, wisdom, intuition, charisma, fingerDexterity, dexterity, constitution, strength })

// source: DSA5 Regelwerk, S. 354 (animal talents use the usual check attributes)
export const companionTalentProbes: Record<string, [CompanionAttribute, CompanionAttribute, CompanionAttribute]> = {
   fliegen: ['courage', 'intuition', 'dexterity'],
   klettern: ['courage', 'dexterity', 'strength'],
   koerperbeherrschung: ['dexterity', 'dexterity', 'constitution'],
   kraftakt: ['constitution', 'strength', 'strength'],
   schwimmen: ['dexterity', 'constitution', 'strength'],
   selbstbeherrschung: ['courage', 'courage', 'constitution'],
   sinnesschaerfe: ['wisdom', 'intuition', 'intuition'],
   verbergen: ['courage', 'intuition', 'dexterity'],
   einschuechtern: ['courage', 'intuition', 'charisma'],
   willenskraft: ['courage', 'intuition', 'charisma'],
}
// source: DSA5 Regelwerk, S. 362 (Rabe: Fliegen printed as 12/10/9 = MU/GE/KK, unlike MU/IN/GE elsewhere; kept as printed)
export const companionProbeOverrides: Record<string, Record<string, [CompanionAttribute, CompanionAttribute, CompanionAttribute]>> = {
   Rabe: { fliegen: ['courage', 'dexterity', 'strength'] },
}

const talents = (values: Record<string, number | null>, notes: Record<string, string> = {}): CompanionTalent[] =>
   Object.entries(values).map(([key, value]) => ({ key, value, note: notes[key] ?? '' }))

// source: DSA5 Regelwerk, S. 360–362
export const companionSpecies: CompanionSpecies[] = [
   {
      key: 'Hund', page: 360, familiar: false, size: 'klein', attributes: attrs(12, 11, 14, 13, 9, 14, 9, 10), health: 13, initiative: 13,
      defense: 7, soulPower: 1, toughness: 0, speed: '12', armor: 0, actions: 1,
      attacks: [{ name: 'Biss', attack: 13, damage: '1W6+2', reach: 'kurz' }],
      talents: talents({ klettern: null, koerperbeherrschung: 7, kraftakt: 4, schwimmen: 6, selbstbeherrschung: 4, sinnesschaerfe: 7, verbergen: 7, einschuechtern: 4, willenskraft: 2 },
         { klettern: 'Keine Probe erlaubt; Hunde können nicht klettern.' }),
      traits: 'Herausragender Sinn (Geruch)', abilities: 'Verbeißen',
      special: 'Flucht: Verlust von 50 % der Lebenspunkte.', painTable: [[10, 1], [7, 1], [4, 1], [1, 1]],
   },
   {
      key: 'Pferd', page: 360, familiar: false, size: 'groß', attributes: attrs(10, 10, 12, 12, 8, 14, 22, 24), health: 65, initiative: 13,
      defense: 7, soulPower: 0, toughness: 0, speed: '12', armor: 0, actions: 1,
      attacks: [
         { name: 'Tritt', attack: 15, damage: '1W6+5', reach: 'mittel' },
         { name: 'Biss', attack: 12, damage: '1W6+1', reach: 'kurz' },
         { name: 'Niederreiten', attack: 14, damage: '2W6+4', reach: 'mittel' },
      ],
      talents: talents({ klettern: null, koerperbeherrschung: 4, kraftakt: 8, schwimmen: 4, selbstbeherrschung: 4, sinnesschaerfe: 4, verbergen: 2, einschuechtern: 2, willenskraft: 3 },
         { klettern: 'Keine Probe erlaubt; Pferde können nicht klettern.' }),
      traits: '', abilities: 'Mächtiger Schlag (erfolgreicher Tritt: Gegner mittel oder kleiner bestehen Kraftakt −2 oder erhalten Liegend)',
      special: 'Packesel: trägt bis zu 150 Stein. Flucht: versucht immer zu fliehen.', painTable: [[49, 1], [33, 1], [16, 1], [5, 1]],
   },
   {
      key: 'Katze', page: 361, familiar: true, size: 'winzig', attributes: attrs(12, 12, 13, 12, 10, 14, 6, 13), health: 10, initiative: 13,
      defense: 7, soulPower: 1, toughness: -2, speed: '10', armor: 0, actions: 1,
      attacks: [{ name: 'Krallen', attack: 14, damage: '1W2', reach: 'kurz' }, { name: 'Biss', attack: 12, damage: '1W3', reach: 'kurz' }],
      talents: talents({ klettern: 10, koerperbeherrschung: 12, kraftakt: 2, schwimmen: 2, selbstbeherrschung: 2, sinnesschaerfe: 10, verbergen: 10, einschuechtern: 2, willenskraft: 4 }),
      traits: 'Dunkelsicht I, Herausragender Sinn (Gehör) / Schlechte Eigenschaft (Neugier)', abilities: '',
      special: 'Flucht: versucht zu fliehen; angreifen nur, wenn in die Ecke gedrängt.', painTable: [[8, 1], [6, 1], [4, 1], [2, 1]],
   },
   {
      key: 'Kröte', page: 361, familiar: true, size: 'winzig', attributes: attrs(16, 8, 12, 10, 6, 8, 4, 9), health: 2, initiative: 12,
      defense: 4, soulPower: 1, toughness: -1, speed: '1', armor: 0, actions: 1,
      attacks: [{ name: 'Zunge', attack: 13, damage: '0 (+Gift)', reach: 'kurz' }],
      talents: talents({ klettern: 1, koerperbeherrschung: 4, kraftakt: 5, schwimmen: 11, selbstbeherrschung: 7, sinnesschaerfe: 7, verbergen: 10, einschuechtern: 0, willenskraft: 7 }),
      traits: 'Herausragender Sinn (Tastsinn)', abilities: '',
      special: 'Krötengift: Stufe 4, Kontakt- und Waffengift; 1 Stufe Verwirrung, Beginn 5 KR, Dauer 30 Minuten. Wirkt nicht auf Hexen, außer sie wollen es.',
      painTable: [[1, 4]],
   },
   {
      key: 'Rabe', page: 362, familiar: true, size: 'winzig', attributes: attrs(12, 16, 12, 11, 12, 10, 6, 9), health: 5, initiative: 11,
      defense: 5, soulPower: -1, toughness: -2, speed: '2/16', armor: 0, actions: 1,
      attacks: [{ name: 'Schnabel', attack: 14, damage: '1W3-1', reach: 'kurz' }],
      talents: talents({ fliegen: 7, koerperbeherrschung: 4, kraftakt: 2, schwimmen: 0, selbstbeherrschung: 4, sinnesschaerfe: 12, verbergen: 2, einschuechtern: 2, willenskraft: 2 }),
      traits: 'Herausragender Sinn (Sicht)', abilities: '',
      special: 'Flucht: fliegt vor Angreifern davon; im Kampf hackt er im Flug.', painTable: [[4, 1], [3, 1], [2, 1], [1, 1]],
   },
]

// source: DSA5 Regelwerk, S. 279 (familiars: physical and mental attributes +1, +10 LeP, +1 RS, +1 SK, +1 ZK, 15 AsP)
export const familiarBonus = { attribute: 1, health: 10, armor: 1, soulPower: 1, toughness: 1, mana: 15 } as const

export type FamiliarTrick = {
   key: string
   species: string[] | 'all'
   cost: string
   duration: string
   property: string
   ap: number | null
   page: number
   effect: { de: string; en: string }
}
const trick = (key: string, species: FamiliarTrick['species'], cost: string, duration: string, property: string, ap: number | null, page: number, de: string, en: string): FamiliarTrick =>
   ({ key, species, cost, duration, property, ap, page, effect: { de, en } })

// source: DSA5 Regelwerk, S. 279–280 (no check, one action, counts as QS 1; ap null = known from the start)
export const familiarTricks: FamiliarTrick[] = [
   trick('Dinge erspüren', 'all', '1 AsP', 'eine halbe Stunde', 'Hellsicht', 10, 279, 'Findet die Richtung zu einem Objekt der Hexe mit emotionaler Bindung im Umkreis von sieben Meilen.', 'Senses the direction of an object the witch is emotionally bound to, within seven miles.'),
   trick('Erster unter Gleichen', 'all', '3 AsP', 'eine halbe Stunde', 'Einfluss', 5, 279, 'Schüchtert Tiere seiner Art ein und vertreibt sie, solange sie nicht größer sind.', 'Intimidates and drives off animals of its kind that are not larger than itself.'),
   trick('Fluchbote', 'all', '1 AsP', 'sofort', 'je nach Fluch', 15, 279, 'Überbringt einen Fluch der Hexe auf bis zu 7 Schritt und übermittelt ihre Bedingungen telepathisch.', 'Delivers the witch’s curse within 7 paces and relays her conditions telepathically.'),
   trick('Hexensinn', 'all', '1 AsP', 'eine halbe Stunde', 'Hellsicht', null, 279, 'Spürt über jede Distanz die Richtung, in der sich die Hexe befindet.', 'Senses the witch’s direction over any distance.'),
   trick('Kraftraub', 'all', '3 AsP', 'aufrechterhaltend', 'Heilung', 15, 280, 'Entzieht einer schlafenden, beobachteten Person die Regeneration einer Ruhephase; fehlende LeP kann er sich selbst hinzufügen.', 'Steals a watched sleeper’s regeneration for one rest phase; may add it to its own missing LeP.'),
   trick('Krötengift', ['Kröte'], '3 AsP', '5 Kampfrunden', 'Verwandlung', 10, 280, 'Magisches Hautgift: Wer die Kröte berührt, erhält drei Tage lang den Fluch Warzen sprießen.', 'Magical skin poison: anyone touching the toad suffers Warzen sprießen for three days.'),
   trick('Krötenschlag', ['Kröte'], 'alle AsP, mindestens 8', 'sofort', 'Verwandlung', 25, 280, 'Wandelt alle AsP in einen Angriff: 2W6+2 TP gegen das nächste Ziel, Rüstung schützt nicht.', 'Turns all AsP into an attack: 2W6+2 TP to the nearest target, ignoring armour.'),
   trick('Stimmungssinn', 'all', '1 AsP pro 5 Minuten', 'aufrechterhaltend', 'Hellsicht', 20, 280, 'Erkennt Gefühle einer Person und übermittelt sie der Hexe; ggf. Menschenkenntnis +1 (Spielleitung).', 'Reads a person’s mood and passes it to the witch; the GM may grant Menschenkenntnis +1.'),
   trick('Tarnung', ['Kröte'], '1 AsP pro 5 Minuten', 'aufrechterhaltend', 'Verwandlung', 10, 280, 'Nimmt die Farbe der Umgebung an: Verbergen (sich verstecken) +2, solange sie sich nicht bewegt.', 'Takes on the surroundings’ colour: Verbergen (hiding) +2 while motionless.'),
   trick('Tiersinne', 'all', '1 AsP pro 5 Minuten', 'aufrechterhaltend', 'Hellsicht', 10, 280, 'Leiht der Hexe bei Körperkontakt seine Sinne (Katze: Dunkelsicht I und Gehör, Rabe: Sicht, Kröte: Geruch).', 'Lends the witch its senses while touching (cat: darksight I and hearing, raven: sight, toad: smell).'),
   trick('Ungesehener Beobachter', 'all', '1 AsP pro 10 Minuten', 'aufrechterhaltend', 'Einfluss', 35, 280, 'Die Hexe nimmt mit geschlossenen Augen wahr, was der Vertraute wahrnimmt (sieben Meilen); sie erleidet seinen Schaden mit.', 'The witch, eyes closed, perceives what the familiar does (seven miles) and shares its damage.'),
   trick('Zwiegespräch', 'all', '1 AsP pro 10 Minuten', 'aufrechterhaltend', 'Einfluss', null, 280, 'Telepathischer Austausch von Bildern und Gefühlen bei Körperkontakt.', 'Telepathic exchange of images and feelings while touching.'),
]
export const freeFamiliarTricks = familiarTricks.filter((entry) => entry.ap === null).map((entry) => entry.key)
