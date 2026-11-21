// Bestiarium (DSA5 Regelwerk, S. 353–362): creatures and the general rules for demons and elementals.
// Texts are short paraphrases for the app, not rulebook prose. Animals reuse the companion stat blocks.
import { companionSpecies, type CompanionAttack, type CompanionAttributes, type CompanionTalent } from './companionCatalog'

export type Localized = { de: string; en: string }
export type CreatureKind = 'animal' | 'demon' | 'elemental'
export type SummoningRitual = 'Invocatio Minor' | 'Invocatio Maior' | 'Elementarer Diener' | 'Dschinnenruf'
export type BestiaryAttack = CompanionAttack & { parry?: number | null; perRound?: number }
export type BestiarySpell = { name: string; value: number; probe: string }
export type KnowledgeFact = { qs: 1 | 2 | 3 } & Localized

export type BestiaryCreature = {
   key: string
   kind: CreatureKind
   page: number
   // Animals: companion species with the same key (S. 360–362)
   companionSpecies: string | null
   size: string
   typus: string
   // KL "t" = tierische Klugheit (S. 354–355)
   animalWisdom: boolean
   attributes: CompanionAttributes
   health: number
   mana: number | null
   initiative: number
   // VW for non-humanoids (not lowered by several defenses, S. 354); humanoids have PA per attack and AW
   defense: number | null
   dodge: number | null
   soulPower: number
   toughness: number
   speed: string
   armor: number
   actions: number
   attacks: BestiaryAttack[]
   talents: CompanionTalent[]
   spells: BestiarySpell[]
   traits: string
   abilities: string
   count: string
   loot: Localized | null
   // Jagdmodifikator (S. 354); the core rules define no hunting procedure
   hunt: number | null
   behaviour: Localized
   flight: Localized
   special: Array<{ name: string } & Localized>
   // [LeP at or below, Schmerz levels gained]; null = Schmerz has no effect (demons, elementals)
   painTable: Array<[number, number]> | null
   // Anrufungsschwierigkeit (S. 354, 264) and the ritual that calls the creature (S. 263, 300)
   invocation: number | null
   summonedBy: SummoningRitual | null
   extraServices: Array<{ name: string; services: number } & Localized>
   knowledge: { talent: 'tierkunde' | 'sphaerenkunde'; application: string; facts: KnowledgeFact[] }
}

const attrs = (courage: number, wisdom: number, intuition: number, charisma: number,
   fingerDexterity: number, dexterity: number, constitution: number, strength: number): CompanionAttributes =>
   ({ courage, wisdom, intuition, charisma, fingerDexterity, dexterity, constitution, strength })
const talents = (values: Record<string, number | null>, notes: Record<string, string> = {}): CompanionTalent[] =>
   Object.entries(values).map(([key, value]) => ({ key, value, note: notes[key] ?? '' }))
const automatic = 'Gelingt automatisch.'
const noSwimming = 'Keine Probe erlaubt; kann nicht schwimmen.'
const facts = (one: Localized, two: Localized, three: Localized): KnowledgeFact[] => [{ qs: 1, ...one }, { qs: 2, ...two }, { qs: 3, ...three }]
const never: Localized = { de: 'Flieht nicht.', en: 'Never flees.' }
const seeBehaviour: Localized = { de: 'Siehe Kampfverhalten.', en: 'See combat behaviour.' }
const blakharaz: Localized = { de: 'Als Dämonen des Blakharaz sind sie mit Praios geweihten Waffen zu verletzen und meiden direktes Sonnenlicht.',
   en: 'As demons of Blakharaz they can be hurt by weapons consecrated to Praios and avoid direct sunlight.' }

type AnimalExtras = Pick<BestiaryCreature, 'count' | 'loot' | 'hunt' | 'behaviour' | 'flight' | 'special' | 'knowledge'>
function animal(key: string, extras: AnimalExtras): BestiaryCreature {
   const species = companionSpecies.find((entry) => entry.key === key)!
   return {
      key, kind: 'animal', page: species.page, companionSpecies: key, size: species.size, typus: 'Tier, nicht humanoid', animalWisdom: true,
      attributes: species.attributes, health: species.health, mana: null, initiative: species.initiative, defense: species.defense, dodge: null,
      soulPower: species.soulPower, toughness: species.toughness, speed: species.speed, armor: species.armor, actions: species.actions,
      attacks: species.attacks, talents: species.talents, spells: [], traits: species.traits, abilities: species.abilities,
      painTable: species.painTable, invocation: null, summonedBy: null, extraServices: [], ...extras,
   }
}

// source: DSA5 Regelwerk, S. 356–362
export const bestiary: BestiaryCreature[] = [
   {
      key: 'Gotongi', kind: 'demon', page: 356, companionSpecies: null, size: 'klein', typus: 'Dämon (niederer, Blakharaz), nicht humanoid', animalWisdom: false,
      attributes: attrs(12, 9, 14, 8, 9, 18, 8, 8), health: 12, mana: 35, initiative: 15, defense: 9, dodge: null, soulPower: -1, toughness: -1,
      speed: '1/12', armor: 0, actions: 1,
      attacks: [{ name: 'Zwicken', attack: 15, damage: '1W6', reach: 'kurz' }],
      talents: talents({ fliegen: 14, koerperbeherrschung: 8, kraftakt: 2, schwimmen: null, selbstbeherrschung: null, sinnesschaerfe: 18, verbergen: 14, einschuechtern: 2, willenskraft: 3 },
         { schwimmen: noSwimming, selbstbeherrschung: automatic }),
      spells: [{ name: 'Große Gier', value: 8, probe: '12/14/8' }, { name: 'Große Verwirrung', value: 8, probe: '12/14/8' },
         { name: 'Horriphobus', value: 8, probe: '12/14/8' }, { name: 'Visibili', value: 12, probe: '9/14/8' }],
      traits: 'Dunkelsicht II, Herausragender Sinn (Sicht, Gehör) / Angst vor eigenem Spiegelbild III, Schlechte Eigenschaft (Neugier, Rachsucht)',
      abilities: '', count: '1 oder 2W6 (Schwarm)', loot: null, hunt: null,
      behaviour: { de: 'Hält Abstand und bleibt unsichtbar; wehrt sich mit Zaubern und flieht. Greift nur überlegen an, im Sturzflug zwickend.',
         en: 'Keeps its distance and stays invisible; defends itself with spells, then flees. Attacks only when superior, nipping in a dive.' },
      flight: seeBehaviour, special: [], painTable: null, invocation: 0, summonedBy: 'Invocatio Minor', extraServices: [],
      knowledge: { talent: 'sphaerenkunde', application: 'Sphärenwesen', facts: facts(blakharaz,
         { de: 'Gotongis fürchten ihr eigenes Spiegelbild.', en: 'Gotongis fear their own reflection.' },
         { de: 'Sehr neugierig: Geheimniskrämerei lockt sie heran.', en: 'Very curious: acting secretive lures them closer.' }) },
   },
   {
      key: 'Heshthot', kind: 'demon', page: 356, companionSpecies: null, size: 'mittel', typus: 'Dämon (niederer, Blakharaz), humanoid', animalWisdom: false,
      attributes: attrs(16, 12, 14, 12, 13, 13, 15, 15), health: 35, mana: 35, initiative: 15, defense: null, dodge: 7, soulPower: 2, toughness: 3,
      speed: '9', armor: 2, actions: 2,
      attacks: [
         { name: 'Waffenlos', attack: 12, parry: 6, damage: '1W6+1', reach: 'kurz' },
         { name: 'Heshthot-Langschwert', attack: 16, parry: 8, damage: '1W6+5', reach: 'lang', perRound: 1 },
         { name: 'Heshthot-Peitsche', attack: 16, parry: null, damage: '1W6+1', reach: 'lang', perRound: 1 },
      ],
      talents: talents({ klettern: 2, koerperbeherrschung: 7, kraftakt: 8, schwimmen: 1, selbstbeherrschung: null, sinnesschaerfe: 9, verbergen: 10, einschuechtern: 12, willenskraft: null },
         { selbstbeherrschung: automatic, willenskraft: automatic }),
      spells: [{ name: 'Dunkelheit', value: 15, probe: '16/12/12' }, { name: 'Horriphobus', value: 6, probe: '16/14/12' }],
      traits: 'Dunkelsicht II / Schlechte Eigenschaft (Rachsucht)',
      abilities: 'Finte I+II (Schwert, Waffenlos), Haltegriff (Waffenlos), Schildspalter (Schwert), Vorstoß (alle), Wuchtschlag I+II (Schwert, Waffenlos)',
      count: '1 oder 1W3+2 (Dämonenhorde)', loot: null, hunt: null,
      behaviour: { de: 'Erzeugt zuerst Dunkelheit, greift dann abwechselnd mit Schwert und Peitsche an; verfolgt bevorzugt, wer ihn verletzt hat.',
         en: 'Creates darkness first, then alternates sword and whip; prefers to attack whoever wounded it.' },
      flight: never,
      special: [
         { name: 'Heshthot-Schwert', de: 'Wer seinen Schwertangriff mit einer Waffe pariert: bei 19–20 auf W20 zerbricht sie, wenn sie nicht unzerbrechlich ist.',
            en: 'Parrying its sword with a weapon: on 19–20 on a W20 the weapon breaks unless unbreakable.' },
         { name: 'Heshthot-Peitsche', de: 'Jeder Treffer mit SP: eine Stufe Schmerz bis zum nächsten Sonnenaufgang.',
            en: 'Each hit that causes SP: one level of Schmerz until the next sunrise.' },
         { name: 'Sofortige Vernichtung', de: 'Mit einem einzigen Angriff aller LeP beraubt: seine Waffen bleiben 1W6 Tage zurück.',
            en: 'Reduced to 0 LeP by a single attack: its weapons remain for 1W6 days.' },
      ],
      painTable: null, invocation: -3, summonedBy: 'Invocatio Minor',
      extraServices: [{ name: 'Waffenauslieferung', services: 2, de: 'Übergibt eine seiner Waffen; sie bleibt 1W6 Tage auf Dere.', en: 'Hands over one of its weapons; it stays on Dere for 1W6 days.' }],
      knowledge: { talent: 'sphaerenkunde', application: 'Sphärenwesen', facts: facts(blakharaz,
         { de: 'Er kann unnatürliche Dunkelheit hervorrufen, die ihm große Vorteile bringt.', en: 'It can create unnatural darkness that gives it a great advantage.' },
         { de: 'Manche führen andere Waffen (Henkersbeil, Ketten) mit denselben Werten.', en: 'Some use other weapons (executioner’s axe, chains) with the same values.' }) },
   },
   {
      key: 'Irrhalk', kind: 'demon', page: 357, companionSpecies: null, size: 'groß', typus: 'Dämon (gehörnter, Blakharaz), nicht humanoid', animalWisdom: false,
      attributes: attrs(17, 12, 15, 12, 9, 18, 24, 26), health: 90, mana: 45, initiative: 18, defense: 9, dodge: null, soulPower: 3, toughness: 4,
      speed: '12/36', armor: 4, actions: 2,
      attacks: [{ name: 'Biss', attack: 16, damage: '2W6+6', reach: 'kurz', perRound: 1 }, { name: 'Klauen', attack: 19, damage: '2W6+4', reach: 'mittel' }],
      talents: talents({ fliegen: 14, klettern: 4, koerperbeherrschung: 12, kraftakt: 16, schwimmen: null, selbstbeherrschung: null, sinnesschaerfe: 4, verbergen: 2, einschuechtern: 12, willenskraft: null },
         { schwimmen: noSwimming, selbstbeherrschung: automatic, willenskraft: automatic }),
      spells: [{ name: 'Horriphobus', value: 6, probe: '17/15/12' }],
      traits: 'Dunkelsicht II', abilities: 'Flugangriff, Sturmangriff (Biss, Klauen)', count: '1 oder 1W6+1 (Schwarm)', loot: null, hunt: null,
      behaviour: { de: 'Stößt aus dem Flug herab und rammt das Opfer in den Boden, oder hebt es hoch und lässt es fallen.',
         en: 'Dives from the air and pins the victim to the ground, or lifts it up and drops it.' },
      flight: never,
      special: [
         { name: 'Feurige Glut', de: 'Wer durch ihn verletzt wird: bei 1–3 auf W6 zusätzlich 1W3 SP; Kleidung und Ausrüstung können beschädigt werden (Meister).',
            en: 'Anyone it wounds: on 1–3 on a W6 another 1W3 SP; clothing and gear may be damaged (GM).' },
         { name: 'Zerplatzen', de: 'Bei 0 LeP zerplatzt er: wer in Reichweite lang oder kürzer gegen ihn kämpfte, weicht aus oder erleidet 1W6+4 TP.',
            en: 'At 0 LeP it bursts: everyone who fought it at reach long or shorter dodges or takes 1W6+4 TP.' },
      ],
      painTable: null, invocation: -4, summonedBy: 'Invocatio Maior',
      extraServices: [{ name: 'Langer Transport', services: 2, de: 'Trägt den Beschwörer oder eine bestimmte Person bis zu 500 Meilen weit.', en: 'Carries the summoner or a chosen person up to 500 miles.' }],
      knowledge: { talent: 'sphaerenkunde', application: 'Sphärenwesen', facts: facts(blakharaz,
         { de: 'Sein Kot ist alles verzehrende Glut, die einen Tag lang bleibt.', en: 'Its droppings are all-consuming embers that last a day.' },
         { de: 'Irrhalken hassen Greifen und stürzen sich auf jeden, den sie sehen.', en: 'Irrhalks hate griffins and attack any they see.' }) },
   },
   {
      key: 'Feuergeist', kind: 'elemental', page: 359, companionSpecies: null, size: 'klein', typus: 'Elementar (Feuer), nicht humanoid', animalWisdom: false,
      attributes: attrs(14, 8, 10, 10, 10, 12, 9, 9), health: 18, mana: null, initiative: 13, defense: 6, dodge: null, soulPower: 0, toughness: 0,
      speed: '8', armor: 0, actions: 1,
      attacks: [{ name: 'Flammenhand', attack: 16, damage: '2W6+2', reach: 'kurz' }],
      talents: talents({ klettern: 2, koerperbeherrschung: 4, kraftakt: 4, schwimmen: null, selbstbeherrschung: 5, sinnesschaerfe: 5, verbergen: 2, einschuechtern: 5, menschenkenntnis: 0, ueberreden: 1, willenskraft: 5 },
         { schwimmen: noSwimming }),
      spells: [], traits: '', abilities: '', count: '1', loot: null, hunt: null,
      behaviour: { de: 'Greift frontal an, wenn er kämpfen muss, und kämpft bis zum Ende.', en: 'Attacks head-on when forced to fight and fights to the end.' },
      flight: never, special: [], painTable: null, invocation: -1, summonedBy: 'Elementarer Diener', extraServices: [],
      knowledge: { talent: 'sphaerenkunde', application: 'Sphärenwesen', facts: facts(
         { de: 'Elementargeister sind kaum klüger als kluge Tiere.', en: 'Elemental spirits are hardly smarter than clever animals.' },
         { de: 'Er kann nicht zaubern und verbirgt sich oft in gewöhnlichen Feuern.', en: 'It cannot cast spells and often hides in ordinary fires.' },
         { de: 'Neugierig und reizbar; Kontakt mit Wasser macht ihn wütend.', en: 'Curious and irritable; contact with water makes it angry.' }) },
   },
   {
      key: 'Feuerdschinn', kind: 'elemental', page: 359, companionSpecies: null, size: 'mittel', typus: 'Elementar (Feuer), nicht humanoid', animalWisdom: false,
      attributes: attrs(16, 13, 15, 14, 12, 16, 14, 15), health: 33, mana: 50, initiative: 16, defense: 8, dodge: null, soulPower: 2, toughness: 2,
      speed: '10', armor: 2, actions: 2,
      attacks: [{ name: 'Flammenhand', attack: 18, damage: '3W6+6', reach: 'mittel', perRound: 2 }],
      talents: talents({ klettern: 2, koerperbeherrschung: 14, kraftakt: 14, schwimmen: null, selbstbeherrschung: 14, sinnesschaerfe: 14, verbergen: 14, einschuechtern: 11, menschenkenntnis: 4, ueberreden: 3, willenskraft: 7 },
         { schwimmen: noSwimming }),
      spells: [{ name: 'Manifesto', value: 12, probe: '16/13/14' }, { name: 'Elementar (Feuer), alle', value: 12, probe: '14/14/14' }],
      traits: '', abilities: 'Finte I+II, Haltegriff, Schildspalter, Zu Fall bringen (Flammenhand)', count: '1', loot: null, hunt: null,
      behaviour: { de: 'Hält Feinde erst mit Zaubern fern und zieht sich, wenn möglich, in Feuer oder brennbare Umgebung zurück.',
         en: 'Keeps enemies away with spells first and retreats into fire or flammable surroundings if possible.' },
      flight: { de: 'Bei Verlust von 50 % der LeP.', en: 'After losing 50 % of its LeP.' }, special: [], painTable: null, invocation: -3, summonedBy: 'Dschinnenruf', extraServices: [],
      knowledge: { talent: 'sphaerenkunde', application: 'Sphärenwesen', facts: facts(
         { de: 'Dschinne sind mit magischen Waffen leichter zu verletzen.', en: 'Djinns are easier to hurt with magical weapons.' },
         { de: 'Feuerdschinne beherrschen starke elementare Magie.', en: 'Fire djinns command strong elemental magic.' },
         { de: 'Vermutlich uralt, aber sie sprechen nie über ihre Vergangenheit.', en: 'Probably ancient, but they never talk about their past.' }) },
   },
   animal('Hund', {
      count: '1 oder 2W6 (Rudel)', loot: { de: '8 Rationen Fleisch, Fell (5 Heller)', en: '8 rations of meat, pelt (5 Heller)' }, hunt: -1,
      behaviour: { de: 'Droht erst mit Knurren und Bellen; greift nur an, wenn er oder sein Mensch direkt angegangen wird.',
         en: 'Growls and barks first; attacks only when it or its owner is threatened directly.' },
      flight: { de: 'Bei Verlust von 50 % der LeP.', en: 'After losing 50 % of its LeP.' }, special: [],
      knowledge: { talent: 'tierkunde', application: 'domestizierte Tiere', facts: facts(
         { de: 'Dutzende Rassen mit eigenen Aufgaben (Wach-, Jagdhund); Mischlinge leben meist in Städten.', en: 'Dozens of breeds with their own tasks (guard, hunting); mongrels mostly live in towns.' },
         { de: 'Greifen Menschen selten von sich aus an, lassen sich aber dazu abrichten.', en: 'Rarely attack people on their own, but can be trained to.' },
         { de: 'In Großstädten leben Meuten, die bedroht sehr gefährlich werden.', en: 'Packs live in big cities and become very dangerous when threatened.' }) },
   }),
   animal('Pferd', {
      count: '1 oder 3W20 (Herde)', loot: { de: '300 Rationen Fleisch, Fell (20 Silbertaler)', en: '300 rations of meat, hide (20 Silbertaler)' }, hunt: -2,
      behaviour: { de: 'Versucht immer zu fliehen; erschreckt oder gestellt tritt es aus, manche beißen.',
         en: 'Always tries to flee; when startled or cornered it kicks, some bite.' },
      flight: seeBehaviour,
      special: [{ name: 'Packesel', de: 'Trägt bis zu 150 Stein.', en: 'Carries up to 150 Stein.' }],
      knowledge: { talent: 'tierkunde', application: 'domestizierte Tiere', facts: facts(
         { de: 'Fluchttiere: nie von hinten nähern.', en: 'Prey animals: never approach from behind.' },
         { de: 'Hafer ist gutes Kraftfutter; schwer arbeitend bis zu 5 Stein am Tag.', en: 'Oats are good feed; up to 5 Stein a day when working hard.' },
         { de: 'Bucheckern, Kastanien und Efeu sind für Pferde giftig.', en: 'Beechnuts, chestnuts and ivy are poisonous to horses.' }) },
   }),
   animal('Katze', {
      count: '1 oder 2W6 (Rudel)', loot: { de: '4 Rationen Fleisch, Fell (3 Heller)', en: '4 rations of meat, pelt (3 Heller)' }, hunt: -1,
      behaviour: { de: 'Flieht meist; in die Ecke gedrängt greift sie an, bis sich eine Fluchtchance bietet.',
         en: 'Usually flees; cornered, it attacks until it can escape.' },
      flight: seeBehaviour, special: [],
      knowledge: { talent: 'tierkunde', application: 'domestizierte Tiere', facts: facts(
         { de: 'Viele Rassen (z.B. Aranierin); die meisten sind Scheunenkatzen.', en: 'Many breeds (e.g. the Aranian); most are barn cats.' },
         { de: 'Manche Hexen halten Katzen.', en: 'Some witches keep cats.' },
         { de: 'In Städten gern gesehen, weil sie Mäuse und Ratten jagen.', en: 'Welcome in towns because they hunt mice and rats.' }) },
   }),
   animal('Kröte', {
      count: '1 oder 2W6 (Teich)', loot: { de: '1 Ration Fleisch (ungenießbar)', en: '1 ration of meat (inedible)' }, hunt: 0,
      behaviour: { de: 'Stellt sich tot oder flieht.', en: 'Plays dead or flees.' }, flight: seeBehaviour,
      special: [{ name: 'Krötengift', de: 'Stufe 4, Kontakt- und Waffengift: 1 Stufe Verwirrung, Beginn 5 KR, Dauer 30 Minuten; wirkt nicht auf Hexen, außer gewollt.',
         en: 'Level 4 contact and weapon poison: 1 level of Verwirrung, onset 5 KR, 30 minutes; no effect on witches unless they want it.' }],
      knowledge: { talent: 'tierkunde', application: 'Wildtiere', facts: facts(
         { de: 'Kröten sondern ein Gift ab, das Halluzinationen auslöst.', en: 'Toads secrete a poison that causes hallucinations.' },
         { de: 'Manche Hexen halten Kröten.', en: 'Some witches keep toads.' },
         { de: 'Manche Arten wie die Koschkröte sondern ein leichtes Hautgift ab.', en: 'Some species such as the Kosch toad secrete a mild skin poison.' }) },
   }),
   animal('Rabe', {
      count: '1 oder 2W20 (Schwarm)', loot: { de: '1 Ration Fleisch (zäh), Federkleid (5 Heller)', en: '1 ration of meat (tough), plumage (5 Heller)' }, hunt: -1,
      behaviour: { de: 'Fliegt vor Angreifern davon; zum Kampf gezwungen hackt er im Flug.', en: 'Flies away from attackers; forced to fight, it pecks in flight.' },
      flight: seeBehaviour, special: [],
      knowledge: { talent: 'tierkunde', application: 'Wildtiere', facts: facts(
         { de: 'Heilige Tiere des Boron und sehr intelligent.', en: 'Sacred animals of Boron and very intelligent.' },
         { de: 'Manche Hexen halten Raben.', en: 'Some witches keep ravens.' },
         { de: 'Raben lassen sich abrichten und lernen kleine Tricks.', en: 'Ravens can be trained to perform small tricks.' }) },
   }),
]

// source: DSA5 Regelwerk, S. 355–356 (demons), S. 358 (elementals), S. 359 (counter-elements)
export const creatureRules: Record<'demon' | 'elemental', { page: number; rules: Localized[] }> = {
   demon: { page: 355, rules: [
      { de: 'Keine Zustände.', en: 'Not affected by conditions.' },
      { de: 'Fast ohne Masse: laufen an Wänden hoch, werden aber nicht gegen ihren Willen fortgetragen.', en: 'Almost massless: walk up walls, but cannot be carried off against their will.' },
      { de: 'Hinterlassen keine Leiche, nur Schleim, Schwefel o. Ä.', en: 'Leave no corpse, only slime, sulphur or similar.' },
      { de: 'Profane Waffen: halbe TP (erst halbieren, dann RS).', en: 'Mundane weapons: half TP (halve first, then subtract RS).' },
      { de: 'Geweihte Waffen der Gegengottheit: doppelte TP; andere geweihte und magische Waffen: normale TP.', en: 'Weapons consecrated to the opposing god: double TP; other consecrated and magical weapons: normal TP.' },
      { de: 'Immun gegen Einfluss, Heilung, Illusion, Verwandlung; gegen andere Zauber zählt die SK zusätzlich als Erschwernis, gegen Schadenszauber als zusätzlicher RS.', en: 'Immune to Einfluss, Heilung, Illusion, Verwandlung; other spells are additionally harder by their SK, damage spells face SK as extra RS.' },
      { de: 'Immun gegen Gifte und Krankheiten; ziehen keinen Nutzen aus Liturgien; verteidigen mehrfach ohne Schips.', en: 'Immune to poisons and diseases; gain nothing from liturgies; may defend several times without Schips.' },
   ] },
   elemental: { page: 358, rules: [
      { de: 'Keine Zustände.', en: 'Not affected by conditions.' },
      { de: 'Profane und geweihte Waffen: halbe TP (erst halbieren, dann RS); magische Waffen und Waffen aus dem Gegenelement: normale TP.', en: 'Mundane and consecrated weapons: half TP (halve first, then RS); magical weapons and weapons of the counter-element: normal TP.' },
      { de: 'Immun gegen Einfluss, Heilung, Illusion, Verwandlung; SK zählt wie bei Dämonen zusätzlich.', en: 'Immune to Einfluss, Heilung, Illusion, Verwandlung; SK counts extra as for demons.' },
      { de: 'Immun gegen Gifte, Krankheiten und Schaden des eigenen Elements; Schadenszauber des Gegenelements ignorieren den RS.', en: 'Immune to poisons, diseases and harm from their own element; damage spells of the counter-element ignore RS.' },
      { de: 'Keine Liturgien. Dschinne beherrschen alle Elementar-Zauber ihres Elements mit FW 12 (Probe 14/14/14) und verteidigen mehrfach ohne Schips.', en: 'No liturgies. Djinns know all Elementar spells of their element at FW 12 (check 14/14/14) and may defend several times without Schips.' },
   ] },
}
export const counterElements: Array<[string, string]> = [['Feuer', 'Wasser'], ['Luft', 'Erz'], ['Humus', 'Eis']]

// source: DSA5 Regelwerk, S. 355 (tierische Klugheit compared with human KL)
export const animalWisdomTable: Array<[number, number]> = [[0, 0], [3, 1], [6, 2], [9, 3], [12, 4], [15, 5]]

// source: DSA5 Regelwerk, S. 362 (special manoeuvres of creatures)
export const creatureManeuvers: Array<{ name: string; page: number } & Localized> = [
   { name: 'Flugangriff', page: 362, de: 'AT −2, bei Treffer +2 TP; braucht 8 Schritt Anflug und GS 4. Misslingt er, darf der Verteidiger einen Passierschlag führen; gelingt er, ist die AT des Opfers gegen das Wesen in dieser KR −6. Nicht mit Finte.',
      en: 'AT −2, +2 TP on a hit; needs an 8-Schritt approach and GS 4. On a miss the defender gets a Passierschlag; on a hit the victim’s AT against it is −6 this KR. Not with Finte.' },
   { name: 'Verbeißen', page: 362, de: 'Biss mit AT −2. Wird er nicht verteidigt, hat sich das Wesen festgebissen: in den folgenden KR trifft der Biss automatisch, +1 TP je weiterer KR; das Opfer ist Fixiert, die Verteidigung des Wesens sinkt auf 0. Loslassen am Ende einer KR (freie Aktion).',
      en: 'Bite with AT −2. If it is not defended, the creature holds on: in the following KR the bite hits automatically, +1 TP per further KR; the victim is Fixiert, the creature’s defense drops to 0. Letting go at the end of a KR (free action).' },
]

// source: DSA5 Regelwerk, S. 355 (spells of demons that no core tradition uses)
export const demonSpells: Array<{ name: string } & Localized> = [
   { name: 'Große Verwirrung', de: 'MU/IN/CH (SK); QS 1–4+: 1–4 Stufen Verwirrung; 4 Aktionen, 8 AsP, Berührung, QS × 15 Minuten, Lebewesen, Dämonisch.',
      en: 'MU/IN/CH (SK); QS 1–4+: 1–4 levels of Verwirrung; 4 actions, 8 AsP, touch, QS × 15 minutes, living beings, Dämonisch.' },
   { name: 'Dunkelheit', de: 'MU/KL/CH; Kugel mit QS × 2 Metern Durchmesser, Sicht je QS eine Stufe schlechter (nicht für den Zaubernden); 8 Aktionen, 16 AsP + 8 AsP je 5 Minuten, aufrechterhaltend, Zone, Dämonisch.',
      en: 'MU/KL/CH; sphere of QS × 2 metres, sight one level worse per QS (not for the caster); 8 actions, 16 AsP + 8 AsP per 5 minutes, sustained, zone, Dämonisch.' },
]

// source: DSA5 Regelwerk, S. 263, 300 (which ritual calls which creatures)
export const summoningRituals: Record<SummoningRitual, Localized> = {
   'Invocatio Minor': { de: 'Niedere Dämonen', en: 'Lesser demons' },
   'Invocatio Maior': { de: 'Gehörnte Dämonen (bis fünf Hörner)', en: 'Horned demons (up to five horns)' },
   'Elementarer Diener': { de: 'Elementargeister', en: 'Elemental spirits' },
   Dschinnenruf: { de: 'Dschinne', en: 'Djinns' },
}

// source: DSA5 Regelwerk, S. 264 (each improvement costs 1 QS and can be chosen once)
export const summonImprovements = [
   { key: 'offensive', name: 'Offensive Verbesserung', de: '+2 AT, +4 TP', en: '+2 AT, +4 TP' },
   { key: 'defensive', name: 'Defensive Verbesserung', de: '+2 PA, +2 RS, +10 LeP', en: '+2 PA, +2 RS, +10 LeP' },
   { key: 'speed', name: 'Schnelligkeitsverbesserung', de: '+2 GS, +2 AW', en: '+2 GS, +2 AW' },
   { key: 'magic', name: 'Magische Verbesserung', de: 'FW aller Zauber +4', en: 'All spells FW +4' },
   { key: 'resistance', name: 'Resistenzverbesserung', de: 'SK und ZK +2; magische Waffen machen nur halbe TP', en: 'SK and ZK +2; magical weapons deal only half TP' },
   { key: 'mental', name: 'Geistige Verbesserung', de: 'MU, KL, IN, CH +2 (abgeleitete Werte unverändert)', en: 'MU, KL, IN, CH +2 (derived values unchanged)' },
   { key: 'physical', name: 'Körperliche Verbesserung', de: 'FF, GE, KO, KK +2 (abgeleitete Werte unverändert)', en: 'FF, GE, KO, KK +2 (derived values unchanged)' },
] as const
export type SummonImprovement = typeof summonImprovements[number]['key']

// source: DSA5 Regelwerk, S. 265 (services; Kampf against several targets and Wache need at least 2 and use all)
export const summonServices = [
   { key: 'work', name: 'Arbeit', minimum: 1, usesAll: false, de: 'Einfache Arbeit bis zum nächsten Sonnenaufgang, auch Transport.', en: 'Simple work until the next sunrise, including transport.' },
   { key: 'advice', name: 'Beratung', minimum: 1, usesAll: false, de: 'Rat im Rahmen seiner geistigen Möglichkeiten.', en: 'Advice within its mental abilities.' },
   { key: 'ability', name: 'Fähigkeit benutzen', minimum: 1, usesAll: false, de: 'Setzt eine Fähigkeit oder einen Zauber ein.', en: 'Uses one ability or spell.' },
   { key: 'fight', name: 'Kampf', minimum: 1, usesAll: false, de: 'Greift ein Ziel an, höchstens 1 Stunde.', en: 'Attacks one target, for at most 1 hour.' },
   { key: 'fightMany', name: 'Kampf (mehrere Gegner)', minimum: 2, usesAll: true, de: 'Greift mehrere Gegner an; verbraucht alle Dienste.', en: 'Attacks several enemies; uses all services.' },
   { key: 'spying', name: 'Spionage', minimum: 1, usesAll: false, de: 'Beobachtet ein Ziel, höchstens 1 Tag je Dienst.', en: 'Watches a target, at most 1 day per service.' },
   { key: 'search', name: 'Suche', minimum: 1, usesAll: false, de: 'Sucht ein bekanntes Objekt oder eine bekannte Person.', en: 'Searches for a known object or person.' },
   { key: 'guard', name: 'Wache', minimum: 2, usesAll: true, de: 'Bewacht ein Ziel bis zu 1 Jahr, bis zum ersten Kampf; verbraucht alle Dienste und umgeht den Sonnenaufgang.', en: 'Guards a target for up to 1 year, until the first fight; uses all services and ignores sunrise.' },
] as const
export type SummonService = typeof summonServices[number]['key']

// source: DSA5 Regelwerk, S. 264–265 (failed demon summoning; the GM rolls 1W20, +15 on a botch)
export const summoningFailures: Array<{ from: number; to: number | null } & Localized> = [
   { from: 1, to: 14, de: 'Nichts geschieht.', en: 'Nothing happens.' },
   { from: 15, to: 18, de: 'Niederhöllische Materie erscheint im Kreis.', en: 'Matter from the netherhells appears in the circle.' },
   { from: 19, to: 21, de: 'Der Dämon erscheint, aber unkontrolliert.', en: 'The demon appears, but uncontrolled.' },
   { from: 22, to: 23, de: 'Ein unkontrollierter Dämon mit gleich vielen oder weniger Hörnern (Meister) erscheint.', en: 'An uncontrolled demon with as many horns or fewer (GM) appears.' },
   { from: 24, to: 25, de: 'Ein unkontrollierter Dämon mit 1W3 Hörnern mehr erscheint.', en: 'An uncontrolled demon with 1W3 more horns appears.' },
   { from: 26, to: 27, de: 'Eine Flammensäule schießt aus dem Kreis.', en: 'A pillar of flame shoots out of the circle.' },
   { from: 28, to: 29, de: 'Giftgas: 1W6 SP je KR beim Einatmen.', en: 'Poison gas: 1W6 SP per KR when inhaled.' },
   { from: 30, to: 32, de: 'Der Dämon erscheint, gibt sich gehorsam und verfolgt eigene Ziele bis Sonnenaufgang.', en: 'The demon appears, feigns obedience and follows its own agenda until sunrise.' },
   { from: 33, to: null, de: 'Nichts geschieht, aber ein Erzdämon wird aufmerksam.', en: 'Nothing happens, but an archdemon takes notice.' },
]
