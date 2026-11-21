import type { MagicAttribute } from './magicCatalog'

export const churches = ['Boron', 'Hesinde', 'Peraine', 'Phex', 'Praios', 'Rondra'] as const
export type Church = typeof churches[number]
// The Tradition SF of each church (S. 316–320); its Leiteigenschaft is in energyRules.karmaTraditions
export const churchTradition = (church: Church) => `Tradition (${church}kirche)`

export type LiturgyKind = 'Liturgie' | 'Zeremonie'
// `allgemein`: every tradition counts it as its own (S. 322)
export type LiturgyDistribution = { church: Church | 'allgemein'; aspects: string[] }
export type Liturgy = {
   key: string
   kind: LiturgyKind
   probe: [MagicAttribute, MagicAttribute, MagicAttribute]
   resistance: 'SK' | 'ZK' | null
   stfClass: 'a' | 'b' | 'c'
   cost: string
   costModifiable: boolean
   castingTime: string
   range: string
   duration: string
   target: string
   distribution: LiturgyDistribution[]
   page: number
   effect: { de: string; en: string }
}
export type OwnedLiturgy = { key: string; value: number; notes: string; paidAP: number }
export type OwnedBlessing = { key: string; paidAP: number }

type Row = [string, LiturgyKind, string, 'a' | 'b' | 'c', string, string, string, string, string, string, number, string, string]
const attributeKeys: Record<string, MagicAttribute> = {
   MU: 'courage', KL: 'wisdom', IN: 'intuition', CH: 'charisma', FF: 'fingerDexterity', GE: 'dexterity', KO: 'constitution', KK: 'strength',
}
// "Praios (Antimagie und Ordnung), Phex (Schatten)" → [{ church, aspects }]
function distribution(text: string): LiturgyDistribution[] {
   return text.split(/,\s*(?=[A-ZÄÖÜa-z]+(?: \(|$))/).map((part) => {
      const match = /^(\w+)(?: \(([^)]*)\))?$/.exec(part.trim())
      const church = match?.[1] === 'allgemein' ? 'allgemein' : match?.[1] as Church
      return { church, aspects: match?.[2] ? match[2].split(/\s*(?:,| und )\s*/) : [] }
   })
}

// source: DSA5 Regelwerk, S. 324–333 (Liturgien und Zeremonien; overview S. 334–336). Effect texts are short summaries.
const rows: Row[] = [
   ['Bann der Dunkelheit', 'Liturgie', 'MU/KL/CH', 'a', '4 KaP + 2 KaP pro Minute', '1 Aktion', 'selbst', 'aufrechterhaltend', 'Lebewesen', 'Praios (Ordnung)', 324,
      'Sonnenlicht aus der Hand, je QS heller (Kerze bis blendend).', 'Sunlight from the hand, brighter per QS (candle to blinding).'],
   ['Bann der Furcht', 'Liturgie', 'IN/CH/CH', 'b', '8 KaP', '2 Aktionen', 'Berührung', 'sofort', 'Kulturschaffende', 'Boron (Traum)', 324,
      'Hebt pro QS eine Stufe Furcht auf.', 'Removes one level of Furcht per QS.'],
   ['Bann des Lichts', 'Liturgie', 'MU/KL/CH', 'b', '16 KaP + 8 KaP pro 5 Minuten', '4 Aktionen', 'selbst', 'aufrechterhaltend', 'Zone', 'Boron (Tod und Traum), Phex (Schatten)', 324,
      'Kugel aus Dunkelheit (QS × 3 Schritt), Sicht pro QS eine Stufe schlechter; der Geweihte sieht normal.', 'Sphere of darkness (QS × 3 Schritt), sight one level worse per QS; the priest sees normally.'],
   ['Blendstrahl', 'Liturgie', 'MU/KL/IN/SK', 'a', '4 KaP', '1 Aktion', '8 Schritt', 'QS in Kampfrunden', 'Lebewesen', 'Praios (Antimagie und Ordnung)', 324,
      'Blendet das Ziel: eine Stufe Verwirrung.', 'Blinds the target: one level of Verwirrung.'],
   ['Ehrenhaftigkeit', 'Liturgie', 'MU/IN/CH/SK', 'b', '8 KaP', '4 Aktionen', '8 Schritt', 'QS × 3 in Minuten', 'Kulturschaffende', 'Rondra (Schild und Sturm)', 325,
      'Zwingt den Gegner, nach den Geboten des Geweihten ehrenhaft zu kämpfen.', 'Forces the opponent to fight honourably by the priest’s rules.'],
   ['Entzifferung', 'Liturgie', 'KL/KL/IN', 'a', '4 KaP', '8 Aktionen', 'selbst', 'QS × 3 in Minuten', 'Kulturschaffende', 'Hesinde (Wissen)', 325,
      'Entziffert pro QS fünf Foliantenseiten.', 'Deciphers five folio pages per QS.'],
   ['Ermutigung', 'Liturgie', 'MU/IN/CH', 'b', '8 KaP', '4 Aktionen', 'Berührung', 'QS × 3 in Minuten', 'Kulturschaffende, übernatürliche Wesen', 'Rondra (Sturm)', 325,
      'Kumulative Boni je QS: MU, AT, MU, AT, MU, SK je +1.', 'Cumulative bonuses per QS: MU, AT, MU, AT, MU, SK +1 each.'],
   ['Fall ins Nichts', 'Liturgie', 'MU/IN/GE', 'a', '8 KaP', '1 Aktion', 'selbst', 'QS × 3 in Kampfrunden', 'Kulturschaffende', 'Phex (Schatten)', 325,
      'Pro QS drei Schritt Fallschaden ignorieren.', 'Ignore three Schritt of falling damage per QS.'],
   ['Friedvolle Aura', 'Liturgie', 'MU/IN/CH', 'b', '8 KaP', '1 Aktion', 'selbst', 'QS × 3 in Kampfrunden', 'Kulturschaffende', 'Hesinde (Magie und Wissen), Peraine (Heilung und Landwirtschaft)', 325,
      'Angreifer brauchen eine Willenskraft-Probe mit mehr QS; sonst kein Angriff, sonst AT um QS erschwert.', 'Attackers need a Willenskraft check with more QS; otherwise no attack, and even then AT −QS.'],
   ['Giftbann', 'Liturgie', 'KL/IN/CH', 'b', '2 KaP pro Giftstufe', '4 Aktionen', 'Berührung', 'sofort', 'Lebewesen', 'Peraine (Heilung)', 325,
      'Neutralisiert ein Gift bis Stufe QS.', 'Neutralises a poison up to level QS.'],
   ['Göttlicher Fingerzeig', 'Liturgie', 'KL/IN/IN', 'a', '8 KaP', '4 Aktionen', 'selbst', 'sofort', 'Kulturschaffende', 'allgemein', 326,
      'Zeigt einen benötigten Gegenstand innerhalb von QS Schritt.', 'Reveals a needed object within QS Schritt.'],
   ['Göttliches Zeichen', 'Liturgie', 'IN/IN/CH', 'a', '4 KaP', '4 Aktionen', '4 Schritt', 'QS × 3 in Kampfrunden', 'Zone', 'allgemein', 326,
      'Ein Zeichen der Gottheit im Radius QS × 10 Schritt; der Meister kann Bekehren & Überzeugen erleichtern.', 'A sign of the deity within QS × 10 Schritt; the GM may ease Bekehren & Überzeugen.'],
   ['Heilsegen', 'Liturgie', 'KL/IN/CH', 'b', '1 KaP pro LeP, mindestens 4 KaP', '16 Aktionen', 'Berührung', 'sofort', 'Kulturschaffende, übernatürliche Wesen', 'Peraine (Heilung)', 326,
      'Das Ziel erhält so viele LeP zurück wie KaP eingesetzt (höchstens FW).', 'The target regains as many LeP as KaP spent (at most FW).'],
   ['Kleiner Bann wider Untote', 'Liturgie', 'MU/MU/CH/ZK', 'b', '4 KaP', '1 Aktion', '8 Schritt', 'sofort', 'Untote', 'Boron (Tod)', 326,
      '2W6 + QS × 2 SP gegen einen Untoten, ohne Verteidigung.', '2W6 + QS × 2 SP against an undead, no defence.'],
   ['Kleiner Bannstrahl', 'Liturgie', 'MU/IN/CH', 'b', '8 KaP', '2 Aktionen', '16 Schritt', 'sofort', 'Dämonen', 'Praios (Antimagie)', 327,
      '2W6 + QS × 2 SP gegen einen Dämon (Blakharaz’ Domäne doppelt), ohne Verteidigung.', '2W6 + QS × 2 SP against a demon (double against Blakharaz’ domain), no defence.'],
   ['Krankheitsbann', 'Liturgie', 'KL/IN/CH', 'b', '2 KaP pro Krankheitsstufe', '16 Aktionen', 'Berührung', 'sofort', 'Lebewesen', 'Peraine (Heilung)', 327,
      'Heilt eine Krankheit bis Stufe QS (keine bereits erlittenen Schäden).', 'Cures a disease up to level QS (not damage already taken).'],
   ['Lautlos', 'Liturgie', 'IN/IN/GE', 'b', '4 KaP + 2 KaP pro Minute', '4 Aktionen', 'selbst', 'aufrechterhaltend', 'Kulturschaffende', 'Phex (Schatten)', 327,
      'Verbergen (Schleichen) um QS erleichtert.', 'Verbergen (Schleichen) easier by QS.'],
   ['Magieschutz', 'Liturgie', 'MU/IN/CH', 'c', '8 KaP + 4 KaP pro 10 Minuten', '4 Aktionen', 'selbst', 'aufrechterhaltend', 'Kulturschaffende', 'Praios (Antimagie), Hesinde (Magie)', 328,
      'SK und ZK gegen Magie +QS − 1 (mindestens 1).', 'SK and ZK against magic +QS − 1 (at least 1).'],
   ['Magiesicht', 'Liturgie', 'KL/IN/IN', 'a', '4 KaP', '2 Aktionen', '8 Schritt', '1 Minute', 'Lebewesen, Objekt', 'Praios (Antimagie), Hesinde (Magie)', 328,
      'Erkennt aktive Magie an einem Wesen oder Objekt.', 'Detects active magic on a being or object.'],
   ['Mondsicht', 'Liturgie', 'KL/KL/IN', 'a', '2 KaP + 1 KaP pro 10 Minuten', '4 Aktionen', 'selbst', 'aufrechterhaltend', 'Kulturschaffende', 'Phex (Schatten)', 328,
      'Dunkelheitsabzüge um QS − 1 Stufen geringer (nicht in völliger Dunkelheit).', 'Darkness penalties QS − 1 levels lower (not in total darkness).'],
   ['Mondsilberzunge', 'Liturgie', 'KL/IN/CH', 'b', '8 KaP', '1 Aktion', 'selbst', 'QS × 3 in Minuten', 'Kulturschaffende', 'Phex (Handel)', 328,
      'Überreden und Handel (Feilschen) um QS erleichtert.', 'Überreden and Handel (Feilschen) easier by QS.'],
   ['Objektsegen', 'Liturgie', 'MU/IN/CH', 'b', '4 KaP', '4 Aktionen', 'Berührung', 'QS × 3 in Stunden', 'Objekt', 'allgemein', 328,
      'Segnet Materialien für Götterdienste (gesegnet, nicht geweiht).', 'Blesses materials for services (blessed, not consecrated).'],
   ['Ort der Ruhe', 'Liturgie', 'MU/KL/IN', 'a', '4 KaP', '8 Aktionen', '4 Schritt', 'QS × 3 in Stunden', 'Zone', 'Boron (Traum)', 329,
      'Dämpft Geräusche im Radius QS × 3 Schritt; Lauschen um QS erschwert.', 'Muffles sounds within QS × 3 Schritt; listening harder by QS.'],
   ['Pflanzenwuchs', 'Liturgie', 'KL/IN/CH', 'a', '8 KaP', '16 Aktionen', 'Berührung', '1 Jahr', 'Pflanzen', 'Peraine (Landwirtschaft)', 329,
      'Eine buschgroße Pflanze wächst pro QS 30 % schneller.', 'A bush-sized plant grows 30 % faster per QS.'],
   ['Rabenruf', 'Liturgie', 'MU/KL/IN', 'a', '8 KaP', '16 Aktionen', 'QS × 3 in Meilen', 'QS × 3 in Stunden', 'Tiere', 'Boron (Tod und Traum)', 329,
      'Ruft bis zu QS × 3 Raben herbei; einer kann einen kleinen Gegenstand tragen.', 'Calls up to QS × 3 ravens; one can carry a small object.'],
   ['Schlaf', 'Liturgie', 'KL/IN/CH/SK', 'b', '8 KaP', '2 Aktionen', '8 Schritt', 'QS × 3 in Minuten', 'Kulturschaffende', 'Boron (Traum)', 329,
      'Betäubung je nach QS; bei Stufe IV schläft das Ziel ein.', 'Betäubung by QS; at level IV the target falls asleep.'],
   ['Schlangenstab', 'Liturgie', 'MU/KL/IN', 'b', '8 KaP', '2 Aktionen', '4 Schritt', 'QS × 3 in Minuten', 'Objekt', 'Hesinde (Magie)', 329,
      'Verwandelt einen Stab in eine schützende Giftschlange (Werte S. 329).', 'Turns a staff into a protective venomous snake (values S. 329).'],
   ['Schlangenzunge', 'Liturgie', 'MU/KL/IN', 'a', '8 KaP', '8 Aktionen', 'selbst', 'QS × 3 in Minuten', 'Kulturschaffende', 'Hesinde (Magie und Wissen)', 330,
      'Gespräch mit einer Schlange.', 'Talk with a snake.'],
   ['Schmerzresistenz', 'Liturgie', 'MU/IN/KO', 'c', '8 KaP', '1 Aktion', 'selbst', 'QS × 3 in Kampfrunden', 'Kulturschaffende', 'Rondra (Schild)', 330,
      'Schmerz I–III wird ignoriert (Stufe IV wirkt normal).', 'Schmerz I–III is ignored (level IV applies normally).'],
   ['Schutz der Wehrlosen', 'Liturgie', 'MU/IN/CH/SK', 'b', '8 KaP', '1 Aktion', '16 Schritt', 'QS × 3 in Minuten', 'Kulturschaffende', 'Rondra (Schild)', 330,
      'Ein Angreifer eines Wehrlosen greift stattdessen den Geweihten an.', 'An attacker of a defenceless person attacks the priest instead.'],
   ['Sternenglanz', 'Liturgie', 'KL/IN/CH', 'a', '8 KaP', '2 Aktionen', '8 Schritt', 'QS × 15 Minuten', 'Objekt', 'Phex (Handel)', 330,
      'Eine Ware wirkt wertvoller: QS × 10 % höherer Preis.', 'Goods look more valuable: QS × 10 % higher price.'],
   ['Wahrheit', 'Liturgie', 'MU/KL/IN/SK', 'c', '16 KaP', '8 Aktionen', 'Berührung', 'QS × 3 in Minuten', 'Kulturschaffende', 'Praios (Ordnung)', 331,
      'Das Ziel muss dem Geweihten wahrheitsgemäß antworten.', 'The target must answer the priest truthfully.'],
   ['Wieselflink', 'Liturgie', 'IN/IN/GE', 'b', '8 KaP', '2 Aktionen', 'selbst', 'QS × 3 in Minuten', 'Kulturschaffende', 'Phex (Schatten)', 331,
      'Kumulative Boni je QS: GE, GS, GE, AW, GE, GS je +1.', 'Cumulative bonuses per QS: GE, GS, GE, AW, GE, GS +1 each.'],
   ['Wundersame Verständigung', 'Liturgie', 'KL/KL/IN', 'b', '8 KaP', '2 Aktionen', 'selbst', 'QS × 3 in Stunden', 'Lebewesen', 'Hesinde (Wissen), Phex (Handel)', 331,
      'Sprachstufe der benötigten Sprache: QS 1–2 I, 3–4 II, 5–6 III.', 'Language level for the needed language: QS 1–2 I, 3–4 II, 5–6 III.'],
   ['Ackersegen', 'Zeremonie', 'MU/KL/IN', 'b', '16 KaP', '2 Stunden', 'Sicht', 'ein Wachstumszyklus', 'Pflanzen', 'Peraine (Landwirtschaft)', 331,
      'Segnet ein Feld bis QS × 1.000 Rechtschritt: weniger Krankheit und Ungeziefer, bessere Ernte.', 'Blesses a field up to QS × 1,000 square Schritt: fewer pests and diseases, better harvest.'],
   ['Exorzismus', 'Zeremonie', 'MU/IN/CH/SK', 'b', '32 KaP', '8 Stunden', '4 Schritt', 'sofort', 'Dämonen, Geister', 'allgemein, Praios (Antimagie), Boron (Traum)', 331,
      'Treibt einen besitzergreifenden Dämon oder Geist aus.', 'Drives out a possessing demon or spirit.'],
   ['Geweihter Panzer', 'Zeremonie', 'MU/IN/CH', 'b', '16 KaP', '30 Minuten', 'selbst', 'QS × 15 Minuten', 'Kulturschaffende', 'Rondra (Sturm)', 331,
      'Die Rüstung gilt als geweiht; angreifende Dämonen erleiden 1W3 SP.', 'The armour counts as consecrated; attacking demons take 1W3 SP.'],
   ['Löwengestalt', 'Zeremonie', 'MU/KL/IN', 'b', '16 KaP', '30 Minuten', 'selbst', 'QS × 3 in Stunden', 'Lebewesen (nur der Geweihte selbst)', 'Rondra (Schild und Sturm)', 332,
      'Verwandlung in einen Löwen, +QS × 2 Punkte auf körperliche Eigenschaften.', 'Turns into a lion, +QS × 2 points on physical attributes.'],
   ['Nebelleib', 'Zeremonie', 'KL/IN/CH', 'b', '16 KaP', '30 Minuten', 'selbst', 'QS × 10 Minuten', 'Kulturschaffende', 'Phex (Schatten)', 332,
      'Der Körper wird zu Nebel; Waffen schaden nicht.', 'The body turns to mist; weapons cause no damage.'],
   ['Objektweihe', 'Zeremonie', 'KL/IN/CH', 'c', '16 KaP, davon 2 permanent', '2 Stunden', '4 Schritt', 'permanent', 'Objekt', 'allgemein', 333,
      'Weiht ein Objekt (bis 4 Stein, +1 Stein je QS); Waffen gelten als geweiht.', 'Consecrates an object (up to 4 Stein, +1 Stein per QS); weapons count as consecrated.'],
]
// "Kosten nicht modifizierbar" (S. 325–329, 333)
const fixedCost = new Set(['Giftbann', 'Heilsegen', 'Kleiner Bann wider Untote', 'Kleiner Bannstrahl', 'Krankheitsbann', 'Objektweihe'])

export const liturgies: Liturgy[] = rows.map(([key, kind, check, stfClass, cost, castingTime, range, duration, target, spread, page, de, en]) => {
   const parts = check.split('/')
   return {
      key, kind, stfClass, cost, castingTime, range, duration, target, page, effect: { de, en },
      probe: parts.slice(0, 3).map((part) => attributeKeys[part]) as Liturgy['probe'],
      resistance: (parts[3] as 'SK' | 'ZK' | undefined) ?? null,
      costModifiable: !fixedCost.has(key),
      distribution: distribution(spread),
   }
})

export type Blessing = { key: string; god: string; range: string; duration: string; target: string; page: number; effect: { de: string; en: string } }
// source: DSA5 Regelwerk, S. 322–324 (Segnungen: 1 KaP, 1 Aktion, QS 1, no check, 1 AP each, not modifiable; Die Zwölf Segnungen)
export const blessings: Blessing[] = [
   { key: 'Eidsegen', god: 'Praios', range: '4 Schritt', duration: '1 Jahr', target: 'Kulturschaffende', page: 322, effect: { de: 'Ein freiwilliger Eid bindet; Brechen nur mit Willenskraft −1.', en: 'A voluntary oath binds; breaking it needs Willenskraft −1.' } },
   { key: 'Feuersegen', god: 'Ingerimm', range: 'selbst', duration: '5 Minuten', target: 'Kulturschaffende', page: 322, effect: { de: 'Kleine Flamme auf der Hand, kerzenhell.', en: 'A small flame on the hand, as bright as a candle.' } },
   { key: 'Geburtssegen', god: 'Tsa', range: 'Berührung', duration: 'bis zum 12. Lebensjahr', target: 'Kulturschaffende', page: 322, effect: { de: 'Schützt ein Neugeborenes vor Raub durch Kobolde, Feen und niedere Dämonen.', en: 'Protects a newborn from being taken by kobolds, fairies and lesser demons.' } },
   { key: 'Glückssegen', god: 'Phex', range: 'Berührung', duration: '12 Stunden', target: 'Kulturschaffende', page: 323, effect: { de: 'Einmal 1 FP zu einer Fertigkeitsprobe addieren.', en: 'Once add 1 FP to a skill check.' } },
   { key: 'Grabsegen', god: 'Boron', range: 'Berührung', duration: '12 Monate', target: 'Zone', page: 323, effect: { de: 'Grabschänder brauchen Willenskraft −1; Nekromantie an der Leiche −1.', en: 'Grave robbers need Willenskraft −1; necromancy on the body −1.' } },
   { key: 'Harmoniesegen', god: 'Rahja', range: 'Berührung', duration: '12 Stunden', target: 'Kulturschaffende', page: 323, effect: { de: 'Furcht auslösende Effekte um 1 erschwert.', en: 'Effects causing Furcht are 1 harder.' } },
   { key: 'Kleiner Heilsegen', god: 'Peraine', range: 'Berührung', duration: 'sofort', target: 'Kulturschaffende', page: 323, effect: { de: '1 LeP zurück, einmal pro Tag und Person.', en: '1 LeP back, once per day and person.' } },
   { key: 'Kleiner Schutzsegen', god: 'Rondra', range: '4 Schritt', duration: '4 Kampfrunden', target: 'Zone', page: 323, effect: { de: 'Hält Hirnlose oder niedere Dämonen aus einer Zone (bis 4 Schritt Radius).', en: 'Keeps mindless undead or lesser demons out of a zone (up to 4 Schritt radius).' } },
   { key: 'Speisesegen', god: 'Travia', range: 'Berührung', duration: 'sofort', target: 'Objekt', page: 323, effect: { de: 'Eine Portion wird nahrhaft; Gifte bis Stufe 2 neutralisiert.', en: 'One portion becomes nourishing; poisons up to level 2 neutralised.' } },
   { key: 'Stärkungssegen', god: 'Firun', range: 'selbst', duration: '12 Kampfrunden', target: 'Kulturschaffende', page: 323, effect: { de: 'Bei Selbstbeherrschung einen Würfel neu würfeln.', en: 'Reroll one die on a Selbstbeherrschung check.' } },
   { key: 'Tranksegen', god: 'Efferd', range: 'Berührung', duration: 'sofort', target: 'Objekt', page: 323, effect: { de: 'Ein Liter Getränk erfrischt; Gifte bis Stufe 2 neutralisiert.', en: 'One litre of drink refreshes; poisons up to level 2 neutralised.' } },
   { key: 'Weisheitssegen', god: 'Hesinde', range: 'Berührung', duration: '12 Stunden', target: 'Kulturschaffende', page: 323, effect: { de: 'Bei einem Wissenstalent einen Würfel neu würfeln.', en: 'Reroll one die on a knowledge skill check.' } },
]
// source: DSA5 Regelwerk, S. 324 (Die Zwölf Segnungen: 12 AP; Zwölfgöttergeweihte must buy them at creation)
export const twelveBlessings = { key: 'Die Zwölf Segnungen', ap: 12 } as const
export const blessingAp = 1

// source: DSA5 Regelwerk, S. 310, 313 (Liturgie- und Zeremoniemodifikationen: one step each, ±1)
export const liturgySteps = {
   Liturgie: { time: ['1 Aktion', '2 Aktionen', '4 Aktionen', '8 Aktionen', '16 Aktionen', '32 Aktionen'], cost: ['1 KaP', '2 KaP', '4 KaP', '8 KaP', '16 KaP', '32 KaP'] },
   Zeremonie: { time: ['5 Minuten', '30 Minuten', '2 Stunden', '8 Stunden', '16 Stunden', '32 Stunden'], cost: ['8 KaP', '16 KaP', '32 KaP', '64 KaP', '128 KaP', '256 KaP'] },
   range: ['Berührung', '4 Schritt', '8 Schritt', '16 Schritt', '32 Schritt', '64 Schritt'],
} as const

// May a priest of this church use the liturgy? Only general liturgies and those of the own church (S. 308, 322)
export const liturgyAvailable = (liturgy: Liturgy, church: Church | null) =>
   liturgy.distribution.some((entry) => entry.church === 'allgemein' || entry.church === church)
