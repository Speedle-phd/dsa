export const magicAttributes = ['courage', 'wisdom', 'intuition', 'charisma', 'fingerDexterity', 'dexterity', 'constitution', 'strength'] as const
export type MagicAttribute = typeof magicAttributes[number]
export type MagicSpell = {
   key: string
   kind: 'Zauberspruch' | 'Ritual' | 'Hexenfluch' | 'Elfenlied'
   probe: [MagicAttribute, MagicAttribute, MagicAttribute]
   resistance: 'SK' | 'ZK' | null
   stfClass: 'a' | 'b' | 'c' | 'd'
   cost: string
   castingTime: string
   range: string
   duration: string
   target: string
   property: string
   traditions: string[]
   costModifiable: boolean
   rangeModifiable: boolean
   effect: { de: string; en: string }
   page: number
   // Elfenlieder: talent of the optional pre-check whose QS adds FP (S. 283)
   songTalent?: 'musizieren' | 'singen' | 'both'
}
const abbreviations: Record<string, MagicAttribute> = {
   MU: 'courage', KL: 'wisdom', IN: 'intuition', CH: 'charisma',
   FF: 'fingerDexterity', GE: 'dexterity', KO: 'constitution', KK: 'strength',
}
type SpellRow = [
   key: string, probe: string, factor: MagicSpell['stfClass'], cost: string, time: string,
   range: string, duration: string, target: string, property: string, traditions: string,
   page: number, de: string, en: string,
]
// source: DSA5 Regelwerk, S. 287–304 (individual descriptions, verified against summary tables S. 302–304)
// source: DSA5 Regelwerk, S. 252 (Merkmale of the core rules; every spell has exactly one)
export const spellProperties = ['Antimagie', 'Dämonisch', 'Einfluss', 'Elementar', 'Heilung', 'Hellsicht', 'Illusion', 'Objekt', 'Sphären', 'Telekinese', 'Verwandlung'] as const

const spellRows: SpellRow[] = [
   ['Adlerauge', 'KL/IN/FF', 'b', '4 + 2 / 5 min', '2', 'selbst', 'aufrechterhaltend', 'Wesen', 'Heilung', 'Elfen', 287, 'Sinnesschärfe: FW + QS + 3.', 'Sinnesschärfe: FW + QS + 3.'],
   ['Analys Arkanstruktur', 'KL/KL/IN', 'c', '16', '32', 'Berührung', 'sofort', 'Wesen, Objekte', 'Hellsicht', 'allgemein', 287, 'QS begrenzt die anschließende magische Analyse.', 'QS limits the subsequent magical analysis.'],
   ['Armatrutz', 'KL/IN/FF', 'c', '4 / 8 / 16', '1', 'selbst', 'QS × 3 min', 'Wesen', 'Heilung', 'allgemein', 288, 'RS 1 / 2 / 3, keine zusätzliche Belastung.', 'RS 1 / 2 / 3, no additional Belastung.'],
   ['Axxeleratus', 'KL/IN/FF', 'b', '8', '1', 'Berührung', 'QS × 5 KR', 'Lebewesen', 'Heilung', 'Elfen', 288, 'Erhöht Bewegungsgeschwindigkeit und Initiative.', 'Increases movement speed and initiative.'],
   ['Balsam Salabunde', 'KL/IN/FF', 'b', '≥ 4; 1 / LeP', '16', 'Berührung', 'sofort', 'Kulturschaffende', 'Heilung', 'allgemein', 288, 'Heilt LeP; Zeit bis zur Heilung hängt von QS ab.', 'Restores LeP; healing time depends on QS.'],
   ['Bannbaladin', 'MU/IN/CH/SK', 'b', '8', '4', '4', 'QS × 3 min', 'Kulturschaffende, übernatürliche Wesen', 'Einfluss', 'allgemein', 288, 'Erzeugt vorübergehende Freundlichkeit, keine willenlose Kontrolle.', 'Creates temporary friendliness, not mindless obedience.'],
   ['Blick in die Gedanken', 'MU/KL/IN/SK', 'c', '8 + 4 / 30 s', '4', '4', 'aufrechterhaltend', 'Kulturschaffende, übernatürliche Wesen', 'Hellsicht', 'allgemein', 289, 'Liest aktuelle Gedanken; QS bestimmt die Tiefe.', 'Reads current thoughts; QS determines depth.'],
   ['Blitz dich find', 'MU/IN/CH/SK', 'a', '4', '1', '8', 'QS KR', 'Lebewesen', 'Einfluss', 'allgemein', 289, 'Verursacht Verwirrung.', 'Causes Verwirrung.'],
   ['Corpofesso', 'KL/IN/KO/ZK', 'c', '16', '2', '8', 'QS × 2 KR', 'Lebewesen', 'Verwandlung', 'Gildenmagier', 289, 'Schwächt die körperlichen Fähigkeiten des Ziels.', 'Weakens the target’s physical abilities.'],
   ['Disruptivo', 'MU/KL/CH', 'b', '8 + 4 / 5 min', '8', 'selbst', 'aufrechterhaltend', 'Zone', 'Antimagie', 'allgemein', 289, 'Zone erschwert neue Zaubersprüche um QS, auch eigene.', 'Zone penalizes new Zaubersprüche by QS, including your own.'],
   ['Duplicatus', 'KL/IN/CH', 'c', '4 / Doppelgänger', '2', 'Berührung', 'QS × 3 KR', 'Lebewesen', 'Illusion', 'Gildenmagier', 290, 'Illusionäre Doppelgänger; Flächenangriffe nicht betroffen.', 'Illusory doubles; area attacks are unaffected.'],
   ['Falkenauge', 'MU/KL/IN', 'b', '4', '2', 'Berührung', '≤ QS × 2 KR', 'Lebewesen', 'Hellsicht', 'Elfen', 291, 'Nächster Fernkampfangriff auf das gewählte Ziel +QS.', 'Next ranged attack against the chosen target +QS.'],
   ['Flim Flam', 'MU/KL/CH', 'a', '2 + 1 / h', '1', '8', 'aufrechterhaltend', 'Zone', 'Elementar', 'allgemein', 291, 'Lichtkugel; Helligkeit nach QS.', 'Light orb; brightness depends on QS.'],
   ['Fulminictus', 'KL/IN/KO/ZK', 'c', '8', '1', '8', 'sofort', 'Lebewesen', 'Verwandlung', 'Elfen', 291, 'Direkter Schaden: 2W6 + QS × 2 SP.', 'Direct damage: 2W6 + QS × 2 SP.'],
   ['Gardianum', 'MU/KL/CH', 'b', '≥ 4', '1', 'selbst', '5 min', 'Zone', 'Antimagie', 'Gildenmagier', 291, 'Schutz gegen Schaden durch Zaubersprüche.', 'Protection against damage from Zaubersprüche.'],
   ['Große Gier', 'MU/IN/CH/SK', 'b', '8', '2', 'Berührung', 'QS × 15 min', 'Lebewesen', 'Einfluss', 'Hexen', 291, 'Weckt Verlangen nach einem gewählten Gegenstand oder einer Handlung.', 'Creates desire for a chosen object or action.'],
   ['Harmlose Gestalt', 'KL/IN/CH', 'b', '8 + 4 / 5 min', '4', 'selbst', 'aufrechterhaltend', 'Wesen', 'Illusion', 'Hexen', 292, 'Unauffällige Gestalt und Stimme, keine neuen Kenntnisse.', 'Inconspicuous appearance and voice, no new knowledge.'],
   ['Hexengalle', 'KL/IN/KO', 'b', '4', '1', 'selbst', 'sofort', 'Wesen', 'Verwandlung', 'Hexen', 292, 'Säurespucke: 1W6 + QS TP, Spuckreichweite 3 Schritt.', 'Acid spit: 1W6 + QS TP, spitting range 3 Schritt.'],
   ['Hexenkrallen', 'KL/IN/KO', 'a', '4', '1', 'selbst', 'QS × 3 min', 'Wesen', 'Verwandlung', 'Hexen', 292, 'Magische Krallen: Raufen, 1W6 + 3 TP, weiterhin unbewaffnet.', 'Magical claws: Raufen, 1W6 + 3 TP, still unarmed.'],
   ['Horriphobus', 'MU/IN/CH/SK', 'b', '8', '2', '8', 'QS × 3 min', 'Lebewesen', 'Einfluss', 'Gildenmagier', 293, 'Furcht nach QS; QS 1 und 6 ändern auch die Dauer.', 'Furcht depends on QS; QS 1 and 6 also change duration.'],
   ['Ignifaxius', 'MU/KL/CH', 'c', '8', '2', '16', 'sofort', 'alle', 'Elementar', 'Gildenmagier', 293, 'Flammenstrahl: 2W6 + QS × 2 TP, RS schützt.', 'Flame ray: 2W6 + QS × 2 TP, RS applies.'],
   ['Invocatio Minima', 'MU/CH/KO', 'a', '4', '4', '1', 'sofort', 'Objekt', 'Sphären', 'Gildenmagier,Hexen', 293, 'Kleine Menge dämonischer Substanz.', 'Small amount of demonic substance.'],
   ['Katzenaugen', 'KL/IN/KO', 'a', '2 + 1 / 10 min', '4', 'selbst', 'aufrechterhaltend', 'Wesen', 'Verwandlung', 'Hexen', 294, 'Sichtabzüge durch Dunkelheit −QS, nicht bei völliger Dunkelheit.', 'Darkness visibility penalties −QS, except in total darkness.'],
   ['Krötensprung', 'KL/IN/KO', 'a', '2', '2', 'Berührung', 'sofort', 'Lebewesen', 'Verwandlung', 'Hexen', 294, 'Ein Sprung: Weite +QS + 3 Schritt, Höhe +QS.', 'One jump: distance +QS + 3 Schritt, height +QS.'],
   ['Manifesto', 'MU/KL/CH', 'a', '4', '4', '1', 'sofort', 'Objekt', 'Elementar', 'allgemein', 294, 'Kleine Menge eines gewählten Elements.', 'Small amount of a chosen element.'],
   ['Manus Miracula', 'KL/FF/KK', 'a', '4 + 2 / 5 min', '2', 'selbst', 'aufrechterhaltend', 'Wesen', 'Telekinese', 'allgemein', 295, 'Telekinetische Unterstützung von Handbewegungen.', 'Telekinetic assistance for hand movements.'],
   ['Motoricus', 'KL/FF/KK', 'b', '≥ 4 + ½ / 5 min', '2', '8', 'aufrechterhaltend', 'Objekt', 'Telekinese', 'allgemein', 295, 'Bewegt Objekte telekinetisch; Kosten abhängig vom Gewicht.', 'Moves objects telekinetically; cost depends on weight.'],
   ['Nebelwand', 'MU/KL/CH', 'c', '≥ 4', '2', '16', 'QS × 15 min', 'Zone', 'Elementar', 'Elfen', 295, 'Erzeugt Nebel; dieser verweht nach der Wirkungsdauer.', 'Creates fog; it disperses after the duration.'],
   ['Oculus Illusionis', 'KL/IN/CH', 'b', '4 + 2 / 5 min', '4', '8', 'aufrechterhaltend', 'Zone', 'Illusion', 'Gildenmagier', 295, 'Erzeugt visuelle Illusionen.', 'Creates visual illusions.'],
   ['Odem Arcanum', 'MU/KL/IN', 'a', '4', '2', '8', '1 min', 'Wesen, Objekt', 'Hellsicht', 'allgemein', 296, 'Erkennt magische Auren nach QS.', 'Detects magical auras according to QS.'],
   ['Paralysis', 'KL/IN/KO/ZK', 'b', '8', '2', '8', 'QS × 2 min', 'Lebewesen', 'Verwandlung', 'Gildenmagier', 296, 'Verursacht Paralyse nach QS.', 'Causes Paralyse according to QS.'],
   ['Penetrizzel', 'MU/KL/IN', 'b', '4 + 2 / min', '2', 'selbst', 'aufrechterhaltend', 'alle', 'Hellsicht', 'Gildenmagier', 296, 'Blick durch feste Materie; Tiefe nach QS.', 'Sight through solid matter; depth depends on QS.'],
   ['Psychostabilis', 'KL/IN/FF', 'b', '4 + 2 / 10 min', '8', 'Berührung', 'aufrechterhaltend', 'Lebewesen', 'Heilung', 'allgemein', 296, 'Erhöht die Seelenkraft.', 'Increases Seelenkraft.'],
   ['Radau', 'KL/FF/KK', 'b', '4 + 2 / KR', '2', '16', 'aufrechterhaltend', 'Objekt', 'Telekinese', 'Hexen', 297, 'Verzauberter Besen oder Stab greift selbstständig an.', 'Enchanted broom or staff attacks independently.'],
   ['Respondami', 'MU/IN/CH/SK', 'b', '8', '2', 'Berührung', 'QS × 15 min', 'Lebewesen', 'Einfluss', 'Gildenmagier', 297, 'Erzwingt eine wahrheitsgemäße Antwort.', 'Compels a truthful answer.'],
   ['Salander', 'KL/IN/KO/ZK', 'c', '16', '8', 'Berührung', 'QS × 3 h', 'Lebewesen', 'Verwandlung', 'Gildenmagier', 297, 'Verwandlung in ein kleineres Lebewesen.', 'Transformation into a smaller living creature.'],
   ['Sanftmut', 'MU/IN/CH/SK', 'a', '4', '2', '8', 'QS × 3 min', 'Tier', 'Einfluss', 'Hexen', 298, 'Beruhigt ein Tier.', 'Calms an animal.'],
   ['Satuarias Herrlichkeit', 'KL/IN/KO', 'b', '8', '4', 'selbst', 'QS × 3 h', 'Wesen', 'Verwandlung', 'Hexen', 298, 'Verbessert das Aussehen des Zaubernden.', 'Improves the caster’s appearance.'],
   ['Silentium', 'KL/FF/KK', 'b', '4 + 2 / 5 min', '8', 'selbst', 'aufrechterhaltend', 'Zone', 'Telekinese', 'Elfen', 298, 'Dämpft Geräusche in einer Zone.', 'Suppresses sound in a zone.'],
   ['Somnigravis', 'MU/IN/CH/SK', 'b', '8', '8', '8', 'QS × 3 min', 'Lebewesen', 'Einfluss', 'Elfen', 298, 'Müdigkeit oder Schlaf nach QS.', 'Drowsiness or sleep according to QS.'],
   ['Spinnenlauf', 'KL/IN/KO', 'a', '4 + 2 / 5 min', '4', 'selbst', 'aufrechterhaltend', 'Lebewesen', 'Verwandlung', 'Hexen', 299, 'Haftet an Wänden und Decken.', 'Clings to walls and ceilings.'],
   ['Spurlos', 'KL/FF/KK', 'b', '4 + 2 / 5 min', '4', 'selbst', 'aufrechterhaltend', 'Wesen', 'Telekinese', 'Elfen', 299, 'Bewegung hinterlässt keine gewöhnlichen Spuren.', 'Movement leaves no ordinary tracks.'],
   ['Transversalis', 'MU/CH/KO', 'c', '8 + 1 / Meile', '8', 'selbst', 'sofort', 'Objekt, Wesen', 'Sphären', 'Gildenmagier', 299, 'Teleportation zu einem bekannten Ziel.', 'Teleportation to a known destination.'],
   ['Visibili', 'KL/IN/KO', 'b', '8 + 4 / 5 min', '4', 'Berührung', 'aufrechterhaltend', 'Lebewesen', 'Verwandlung', 'Elfen', 299, 'Unsichtbarkeit; Ausrüstung wird nicht unsichtbar.', 'Invisibility; equipment does not become invisible.'],
   ['Wasseratem', 'KL/IN/KO', 'b', '4 + 2 / 5 min', '8', 'Berührung', 'aufrechterhaltend', 'Lebewesen', 'Verwandlung', 'Elfen', 300, 'Ermöglicht Atmen unter Wasser und an der Luft.', 'Allows breathing underwater and in air.'],
]
// source: DSA5 Regelwerk, S. 300–301, 304
const ritualRows: SpellRow[] = [
   ['Arcanovi', 'KL/IN/FF', 'd', '16', '8 h', '8', 'sofort', 'geweihte Objekte, profane Objekte', 'Objekt', 'allgemein', 300, 'Bindet Zaubersprüche in Artefakte; zusätzliche Kosten siehe S. 266.', 'Binds Zaubersprüche into artifacts; additional costs on S. 266.'],
   ['Dschinnenruf', 'MU/CH/KO', 'c', '32', '8 h', '8', 'sofort', 'Elementare', 'Sphären', 'Gildenmagier', 300, 'Ruft einen Dschinn; Dienste siehe S. 262–264.', 'Summons a Dschinn; services on S. 262–264.'],
   ['Elementarer Diener', 'MU/CH/KO', 'b', '16', '30 min', '8', 'sofort', 'Elementare', 'Sphären', 'Gildenmagier', 300, 'Ruft einen Elementargeist; Dienste siehe S. 262–264.', 'Summons an Elementargeist; services on S. 262–264.'],
   ['Invocatio Maior', 'MU/CH/KO', 'c', '32', '8 h', '8', 'sofort', 'Dämonen', 'Sphären', 'Gildenmagier,Hexen', 300, 'Gehörnter Dämon, höchstens fünf Hörner; Schwierigkeit des Dämons beachten.', 'Horned demon, at most five horns; apply its summoning difficulty.'],
   ['Invocatio Minor', 'MU/CH/KO', 'b', '16', '30 min', '8', 'sofort', 'Dämonen', 'Sphären', 'Gildenmagier,Hexen', 300, 'Niederer Dämon; Anrufungsschwierigkeit beachten.', 'Lesser demon; apply its summoning difficulty.'],
   ['Zauberklinge Geisterspeer', 'KL/IN/FF', 'c', '10 / 20 / 35', '8 h', '8', 'QS × 3 Tage', 'Objekt', 'Objekt', 'allgemein', 301, 'Magische Waffe. Langzeitvariante: Kosten ×5, davon 1/20 permanent, QS × 30 Jahre.', 'Magical weapon. Long-term variant: cost ×5, 1/20 permanent, QS × 30 years.'],
]
const fixedCosts = new Set(['Armatrutz', 'Balsam Salabunde', 'Fulminictus', 'Gardianum', 'Hexengalle', 'Ignifaxius', 'Motoricus', 'Nebelwand', 'Transversalis', 'Zauberklinge Geisterspeer'])
function definition(row: SpellRow, kind: MagicSpell['kind']): MagicSpell {
   const [key, check, stfClass, cost, castingTime, range, duration, target, property, traditions, page, de, en] = row
   const parts = check.split('/')
   const probe = parts.slice(0, 3).map((part) => {
      const attribute = abbreviations[part]
      if (!attribute) throw new Error(`Invalid magic catalog attribute: ${part}`)
      return attribute
   })
   return {
      key, kind, probe: [probe[0], probe[1], probe[2]], resistance: parts[3] === 'SK' ? 'SK' : parts[3] === 'ZK' ? 'ZK' : null,
      stfClass, cost, castingTime, range, duration, target, property, traditions: traditions.split(','), page, effect: { de, en },
      costModifiable: !fixedCosts.has(key), rangeModifiable: range !== 'selbst' && key !== 'Große Gier',
   }
}
// source: DSA5 Regelwerk, S. 274, 281–283 (all curses use B; direct delivery at least 1 Aktion, up to 64 Schritt)
const curseRows: SpellRow[] = [
   ['Beiß auf Granit!', 'KL/IN/FF/ZK', 'b', '14', '≥ 1', '64', 'QS × 3 Tage', 'Opfer', 'Objekt', 'Hexen', 282, 'Berührte feste Nahrung verwandelt sich; Flüssigkeiten bleiben unverändert.', 'Touched solid food transforms; liquids remain unchanged.'],
   ['Beute!', 'KL/IN/CH/SK', 'b', '14', '≥ 1', '64', 'QS × 3 Tage', 'Opfer', 'Einfluss', 'Hexen', 282, 'Lockt fleischfressende Wirbeltiere zum Opfer.', 'Attracts carnivorous vertebrates to the victim.'],
   ['Hagelschlag', 'MU/IN/CH', 'b', '21', '≥ 1', '64', 'QS × 15 min', 'Fläche', 'Elementar', 'Hexen', 282, 'Sturm über bis zu QS × 20.000 Rechtschritt; 2W6 TP je 5 Minuten für ungeschützte Ziele.', 'Storm across up to QS × 20,000 Rechtschritt; 2W6 TP per 5 minutes to unprotected targets.'],
   ['Hexenschuss', 'IN/FF/KO/ZK', 'b', '14', '≥ 1', '64', 'QS × 3 h', 'Opfer', 'Verwandlung', 'Hexen', 282, 'Eine Stufe Schmerz.', 'One level of Schmerz.'],
   ['Pech an den Hals wünschen', 'KL/IN/CH/SK', 'b', '7', '≥ 1', '64', 'QS × 3 Tage', 'Opfer', 'Einfluss', 'Hexen', 282, 'Auch 19 zählt als Patzerzahl; weitere Missgeschicke nach Meisterentscheid.', '19 also counts as a botch number; other mishaps are decided by the GM.'],
   ['Pestilenz', 'MU/CH/GE/ZK', 'b', 'Krankheitsstufe', '≥ 1', '64', '≤ QS × 3 Tage', 'Opfer', 'Dämonisch', 'Hexen', 282, 'Bekannte nichtmagische Krankheit bis Stufe FW; nicht ansteckend, endet spätestens nach QS × 3 Tagen.', 'Known nonmagical disease up to level FW; not contagious, ends no later than QS × 3 days.'],
   ['Schlaf rauben', 'KL/IN/CH/SK', 'b', '14', '≥ 1', '64', 'QS × 3 Tage', 'Opfer', 'Einfluss', 'Hexen', 282, 'Verhindert Schlaf und Regeneration; Verwirrung nach je zwei Tagen ohne Schlaf.', 'Prevents sleep and regeneration; Verwirrung after each two days without sleep.'],
   ['Unfruchtbarkeit', 'IN/FF/KO/ZK', 'b', '14', '≥ 1', '64', 'QS × 3 Wochen', 'Person, Tier', 'Verwandlung', 'Hexen', 282, 'Verhindert die Fortpflanzung während der Wirkungsdauer.', 'Prevents reproduction during the duration.'],
   ['Warzen sprießen', 'IN/FF/KO/ZK', 'b', '7', '≥ 1', '64', 'QS × 3 Tage', 'Opfer', 'Verwandlung', 'Hexen', 282, 'Hässlich I; Gutaussehend wird vorübergehend aufgehoben.', 'Hässlich I; Gutaussehend is temporarily suppressed.'],
   ['Zunge lähmen', 'KL/IN/CH/ZK', 'b', '14', '≥ 1', '64', 'QS × 3 h', 'Opfer', 'Einfluss', 'Hexen', 283, 'Status Stumm; betrifft auch gesprochene Zauberformeln.', 'Status Stumm; also affects spoken spell formulas.'],
]
// source: DSA5 Regelwerk, S. 274, 283–284 (Zauberlieder: ritual rules, no modifications, own FW and StF)
const songRows: Array<[...SpellRow, MagicSpell['songTalent']]> = [
   ['Erinnerungsmelodie', 'KL/IN/IN', 'a', '1 / 5 min', '5 min je Jahr', 'selbst', 'Dauer der Erinnerung', 'Elf', 'Einfluss', 'Elfen', 283, 'Ruft eine lang vergangene Erinnerung zurück; 5 Minuten Spiel je Jahr.', 'Recalls a long-past memory; 5 minutes of playing per year.', 'musizieren'],
   ['Friedenslied', 'MU/IN/CH', 'a', '2 / 5 min', '5 min', 'selbst', 'solange gespielt', 'Zone', 'Einfluss', 'Elfen', 283, 'Zone des Friedens (QS × 3 Schritt): Angriffe nur mit Willenskraft −QS × 2; nicht gegen Untote, Dämonen, Elementare, Golems.', 'Zone of peace (QS × 3 Schritt): attacking needs Willenskraft −QS × 2; not undead, demons, elementals or golems.', 'musizieren'],
   ['Freundschaftslied', 'IN/CH/CH', 'a', '4 / h, 1 permanent', '3 × 1 h', 'selbst', 'permanent', 'Elf', 'Einfluss', 'Elfen', 284, 'Band zweier Elfen, einmal im Leben; Balsam auch ohne AsP über die eigene LeP.', 'Bond of two elves, once in a lifetime; Balsam even without AsP using own LeP.', 'musizieren'],
   ['Melodie der Kunstfertigkeit', 'IN/IN/CH', 'b', '4 / h', '1 h', 'selbst', 'solange gesungen', 'Elf', 'Heilung', 'Elfen', 284, 'Handwerkstalente während des Liedes +QS.', 'Craft talents +QS while singing.', 'singen'],
   ['Sorgenlied', 'MU/IN/IN', 'a', '2 / 5 min', '5 min je 100 Meilen', 'selbst', 'sofort', 'Freund', 'Hellsicht', 'Elfen', 284, 'Allgemeiner Eindruck vom Befinden eines guten Freundes.', 'General impression of a good friend’s well-being.', 'singen'],
   ['Zaubermelodie', 'MU/IN/CH', 'b', '8', '1 h', 'selbst', 'bis Sonnenaufgang', 'Elf', 'Heilung', 'Elfen', 284, 'Nach Trance: Zauber und Rituale +1 (QS 1–3) / +2 (QS 4–6) bis Sonnenaufgang.', 'After a trance: spells and rituals +1 (QS 1–3) / +2 (QS 4–6) until sunrise.', 'both'],
]

export const magicSpells = [
   ...spellRows.map((row) => definition(row, 'Zauberspruch')),
   ...ritualRows.map((row) => definition(row, 'Ritual')),
   ...curseRows.map((row) => ({ ...definition(row, 'Hexenfluch'), costModifiable: false, rangeModifiable: false })),
   ...songRows.map(([...row]) => ({ ...definition(row.slice(0, 13) as SpellRow, 'Elfenlied'), costModifiable: false, rangeModifiable: false, songTalent: row[13] })),
]

export type MagicTrick = Pick<MagicSpell, 'key' | 'range' | 'duration' | 'property' | 'page' | 'effect'>
type TrickRow = [key: string, range: string, duration: string, property: string, page: number, de: string, en: string]
// source: DSA5 Regelwerk, S. 286–287, 301 (all tricks: 1 AP, 1 AsP, 1 Aktion, no check or modification)
const trickRows: TrickRow[] = [
   ['Abkühlung', 'Berührung', 'sofort', 'Elementar', 286, 'Becher Flüssigkeit bis 10 Grad kühler.', 'Cools a cup of liquid by up to 10 degrees.'],
   ['Bauchreden', '8', '1 Aktion', 'Illusion', 286, 'Kurzes Wort oder leises Geräusch aus der Entfernung.', 'Brief word or quiet sound from a distance.'],
   ['Duft', 'selbst', '5 min', 'Illusion', 286, 'Angenehmer Duft.', 'Pleasant scent.'],
   ['Feuerfinger', 'selbst', '5 min', 'Elementar', 286, 'Kleine Flamme; kein Schutz vor Hitze.', 'Small flame; no protection from heat.'],
   ['Glücksgriff', 'selbst', 'sofort', 'Hellsicht', 286, 'Bekanntes vorhandenes Objekt herausgreifen.', 'Pick out a known object that is present.'],
   ['Handwärmer', 'Berührung', '5 min', 'Elementar', 286, 'Temperatur eines kleinen gehaltenen Objekts bewahren.', 'Maintains the temperature of a small held object.'],
   ['Lockruf', '4', '5 min', 'Einfluss', 287, 'Lockt ein kleines Tier an.', 'Attracts a small animal.'],
   ['Regenbogenaugen', 'selbst', '5 min', 'Illusion', 287, 'Ändert die Augenfarbe.', 'Changes eye color.'],
   ['Schlangenhände', 'selbst', '5 min', 'Verwandlung', 287, 'Sehr flexible Hand- und Fingerknochen.', 'Very flexible hand and finger bones.'],
   ['Schnipsen', '4', 'sofort', 'Telekinese', 287, 'Schwacher telekinetischer Impuls.', 'Weak telekinetic pulse.'],
   ['Signatur', 'Berührung', 'sofort', 'Objekt', 287, 'Abwischbares Zeichen auf einem unbelebten Objekt.', 'Removable mark on an inanimate object.'],
   ['Trocken', 'selbst', '5 min', 'Elementar', 287, 'Schützt vor Nässe, trocknet keine nasse Kleidung.', 'Protects against wetness, does not dry wet clothing.'],
]
export const magicTricks: MagicTrick[] = trickRows.map(([key, range, duration, property, page, de, en]) => ({
   key, range, duration, property, page, effect: { de, en },
}))
// source: DSA5 Regelwerk, S. 275, 278, 283
export const magicTraditions = [
   { key: 'Tradition (Gildenmagier)', distribution: 'Gildenmagier', attribute: 'wisdom', page: 275 },
   { key: 'Tradition (Hexe)', distribution: 'Hexen', attribute: 'charisma', page: 278 },
   { key: 'Tradition (Elf)', distribution: 'Elfen', attribute: 'intuition', page: 283 },
] as const

export type OwnedSpell = { key: string; value: number; notes: string; paidAP: number }
export type OwnedTrick = { key: string; paidAP: number }
// staff*: the bound Magierstab (S. 275–278); flyingDevice: the witch's anointed object (S. 281)
export type MagicSettings = {
   artifacts: string; artifactItems: string[]; guildSpell: string | null
   staffItem: string | null; staffActive: string | null; staffInHand: boolean; flyingDevice: string | null
}
// Staff spells that are switched on with 1 action; foci and the binding work all the time (S. 276).
export const activatableStaffSpells = ['Doppeltes Maß', 'Ewige Flamme', 'Flammenschwert', 'Seil des Adepten', 'Stab-Apport']
