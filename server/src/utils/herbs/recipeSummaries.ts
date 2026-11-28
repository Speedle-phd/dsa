// What the products of Archiv der Kräuter's recipes do: short summaries in own words, German and English (user decision,
// Nov 2026). Alchemical recipes add one line per QS 1–6. Recipes without an entry point to their page.
// source: Archiv der Kräuter (AdK), S. 145–178
import type { RecipeSummary } from './recipeTypes'

// One line per QS 1–6, German and English side by side
const qs = (de: string[], en: string[]) => de.map((text, index) => ({ de: text, en: en[index] }))

export const recipeSummaries: Record<string, RecipeSummary> = {
   // ---- Batch 1: Pflanzliche Hilfsmittel, S. 145–148
   Atanax: { effect: {
      de: 'Sud gegen Krankheiten: täglicher Schaden −2 SP und Dauer −2 Tage (Fieber: −4 SP, −4 Tage); die Krankheit nimmt nur den milderen Verlauf, verläuft sie schon so, endet sie sofort. Wirkungslos bei übernatürlichen Krankheiten.',
      en: 'Decoction against diseases: daily damage −2 SP and duration −2 days (fevers: −4 SP, −4 days); the disease only takes its milder course, and ends at once if it already does. No effect on supernatural diseases.' } },
   Atmonbrei: { effect: {
      de: 'Auf den Körper gerieben 3 Stunden +1 auf Klettern, Körperbeherrschung, Kraftakt, Schwimmen und Tanzen. Eine weitere Anwendung am selben oder nächsten Tag kehrt das in −1 um.',
      en: 'Rubbed on the body: +1 to Klettern, Körperbeherrschung, Kraftakt, Schwimmen and Tanzen for 3 hours. Another application the same or the next day turns it into −1.' } },
   Blasrohr: { effect: {
      de: 'Ein Blasrohr aus Schlinggrashalmen, in 5 Minuten über einer Wärmequelle geformt (Kampftechnik Blasrohre, Werte auf S. 145).',
      en: 'A blowpipe made from Schlinggras stalks, shaped over a heat source in 5 minutes (combat technique Blasrohre, values on p. 145).' } },
   Blauschirmsporen: { effect: {
      de: 'Gereinigte Sporen: einen neuen Pilz pflanzen, etwa 2 × 2 Schritt dämonisch verseuchten Boden reinigen oder eine kleine Menge dämonischer Essenz bannen (etwa aus INVOCATIO MINIMA).',
      en: 'Purified spores: plant a new mushroom, cleanse about 2 × 2 paces of demon-tainted ground, or banish a small amount of demonic essence (such as from INVOCATIO MINIMA).' } },
   Blutblattkranz: { effect: {
      de: 'Kranz, der an Zauberern nicht welkt: ohne AsP keine Kopfschmerzen, IN-Teilproben der Magischen Analyse +2; kostet den Träger 1 AsP pro Tag.',
      en: 'A wreath that does not wilt on a spellcaster: no headaches at 0 AsP, IN parts of a magical analysis +2; costs the wearer 1 AsP per day.' } },
   Brandsalbe: { effect: {
      de: 'Auf Brand- oder Ätzwunden (Brennend, Feuerzauber): sofort 2W3 LeP (mit Wirselkraut 3W3) und 1 Stufe Schmerz dieser Wunde weniger. Nicht kumulativ; neue Heilung erst nach der nächsten Regenerationsphase.',
      en: 'On burns or acid wounds (Brennend, fire spells): 2W3 LeP at once (3W3 with Wirselkraut) and 1 level of Schmerz from that wound removed. Does not stack; new healing only after the next regeneration phase.' } },
   'Dergolasch-Pulver': { effect: {
      de: 'Gegessen hebt das Pulver 6 Stunden Angst vor Dunkelheit, vor engen Räumen und ähnliche Ängste auf; nach Meisterentscheid baut es auch Furcht ab.',
      en: 'Eaten, the powder suspends fear of darkness, of tight spaces and similar fears for 6 hours; at the GM’s discretion it also reduces Furcht.' } },
   Dornrosengerte: { effect: {
      de: 'Ein Dornrosenzweig mit Ledergriff als Waffe (Werte auf S. 146).',
      en: 'A Dornrose branch with a leather grip used as a weapon (values on p. 146).' } },
   Egelschreckpaste: { effect: {
      de: 'Hält einen Tag lang alle gewöhnlichen Parasiten fern; anhaftende Zecken und Egel fallen ab. Auf eine kleine Wunde gerieben einmal pro Tag sofort 1 LeP.',
      en: 'Keeps all mundane parasites away for a day; ticks and leeches already attached fall off. Rubbed on a small wound: 1 LeP at once, once per day.' } },
   Feengesteck: { effect: {
      de: 'Ein getrockneter Kranz aus Menchalblüten (2 Anwendungen) macht Zugänge zu Feenwelten sichtbar; die Bedingungen, sie zu durchschreiten, bleiben gleich.',
      en: 'A dried wreath of Menchal blossoms (2 applications) reveals entrances to fairy realms; the conditions for passing through stay the same.' } },
   Fiebersaft: { effect: {
      de: 'Mit Gulmond: Schlachtfeldfieber 2 Tage kürzer; zusätzlich mit Traschbart: keine Folgeerkrankung an Jahresfieber. Aus reinem Joruga wie die rohe Pflanze, aber ohne Verdauungsbeschwerden.',
      en: 'With Gulmond: Schlachtfeldfieber 2 days shorter; adding Traschbart prevents a follow-up case of Jahresfieber. Pure Joruga works like the raw plant but without stomach trouble.' } },
   Finagebast: { effect: {
      de: 'Verband aus Finagerinde: bei Heilkunde Wunden dürfen beide FF-Teilproben einmal wiederholt werden; der neue Wurf gilt.',
      en: 'A dressing of Finage bark: with Heilkunde Wunden both FF parts of the check may be rerolled once; the new roll counts.' } },
   'Grüner Pilzschleim': { effect: {
      de: 'Geschnupft 1 Woche immun gegen Atemgifte, aber 2 Wochen ohne Geruchssinn (erneut binnen eines Monats: auch ohne Geschmack); der Anwender wird vom Pilz befallen.',
      en: 'Snorted: immune to inhaled poisons for 1 week but no sense of smell for 2 weeks (again within a month: no taste either); the user is infested by the fungus.' } },
   'Grünschleim-Tropfen': { effect: {
      de: 'In die Augen geträufelt Dunkelsicht I, dafür bei Tageslicht Sicht Stufe 1 (grelles Licht Stufe 2); der Anwender wird vom Pilz befallen. Endet erst, wenn der Pilz mit Dergolasch-Abführmittel entfernt ist.',
      en: 'Dripped into the eyes: Dunkelsicht I, but vision level 1 in daylight (bright light level 2); the user is infested by the fungus. Ends only once the fungus is removed with Dergolasch-Abführmittel.' } },
   Hesindigo: { effect: {
      de: 'Leuchtend blaues Farbpigment für fast jedes Material; lichtecht erst mit Alaun, Trägerstoff und alchimistischer Fixierung. Bei einem kritischen Patzer bleiben ungewollte, dauerhafte Flecken.',
      en: 'Bright blue pigment for almost any material; lightfast only with alum, a binder and alchemical fixing. A critical botch leaves unwanted permanent stains.' } },
   'Hirad-Antidot': { effect: {
      de: 'Gegen nicht übernatürliche Schlangengifte: 1 Anwendung schwächt die Wirkung ab, 2 beenden sie. Bei anderem Gift (auch Alkohol) Schüttelfrost (Paralyse I) und Risiko der stärkeren Wirkung; Nebenwirkung auf die Sicht laut S. 147.',
      en: 'Against non-supernatural snake venoms: 1 application weakens the effect, 2 end it. With another poison (alcohol too) chills (Paralyse I) and a risk of the stronger effect; side effects on vision as on p. 147.' } },
   'Horuschenöl': { effect: {
      de: 'Stärkungsmittel: 10 Stunden KK +1 für 1 SP. Jede weitere Anwendung gibt Kraftakt FW +2 und kostet 2/4/8 … SP mehr.',
      en: 'Tonic: KK +1 for 10 hours at the cost of 1 SP. Each further application gives Kraftakt FW +2 and costs 2/4/8 … more SP.' } },
   'Jacopo-Duftbeutel': { effect: {
      de: 'Zieht Kulturschaffende im Umkreis von 8 Schritt an: Willenskraft (Betören widerstehen) −1, sonst folgen sie dem Träger 1W3 Stunden. Der Hersteller ist immun.',
      en: 'Attracts Kulturschaffende within 8 paces: Willenskraft (resist Betören) −1, or they follow the wearer for 1W3 hours. The maker is immune.' } },
   'Jacopo-Süßigkeit': { effect: {
      de: 'Wer sie isst, legt Willenskraft (Betören widerstehen) −2 ab, sonst 1W6 Stunden Verwirrung II und leicht zu überreden (Willenskraft gegen Betören oder Überreden −3).',
      en: 'Whoever eats it rolls Willenskraft (resist Betören) −2, or suffers Verwirrung II for 1W6 hours and is easy to persuade (Willenskraft against Betören or Überreden −3).' } },
   Kairantrunk: { effect: {
      de: 'Gibt 1W3−1 AsP, die binnen 14 Stunden verbraucht sein müssen; mit Mibelrohr 1W3 AsP ohne Frist, aber öfter als zweimal im Monat droht Mibelsucht (Selbstbeherrschung −3, S. 302).',
      en: 'Restores 1W3−1 AsP that must be used within 14 hours; with Mibelrohr 1W3 AsP without a limit, but more than twice a month risks Mibelsucht (Selbstbeherrschung −3, p. 302).' } },
   // ---- Batch 2: Pflanzliche Hilfsmittel, S. 148–151
   'Krähenfüße': { effect: {
      de: 'Krähenfüße aus Aranischen Wassernüssen, beliebt bei zwielichtigem Volk (Werte auf S. 148).',
      en: 'Caltrops made from Aranische Wassernüsse, popular with shady folk (values on p. 148).' } },
   'Liebesküchlein': { effect: {
      de: 'Für eine Person: 24 Stunden Willenskraft (Betören widerstehen) um QS/2 erschwert. Gebacken mit Lebensmittelbearbeitung (Backen) statt Pflanzenkunde; ein Berufsgeheimnis (2 AP, Lebensmittelbearbeitung 4, Tradition (Hexen)).',
      en: 'For one person: Willenskraft (resist Betören) harder by QS/2 for 24 hours. Baked with Lebensmittelbearbeitung (Backen) instead of Pflanzenkunde; a Berufsgeheimnis (2 AP, Lebensmittelbearbeitung 4, Tradition (Hexen)).' } },
   Lulanientrunk: { effect: {
      de: 'Gegen Raschen Wahn: nahm die Krankheit den schlimmeren Verlauf, wird er zum milderen; hatte die Krankheitsprobe versagt, ist sie sofort geheilt.',
      en: 'Against Rascher Wahn: if the disease took its worse course, it turns to the milder one; if the disease check had failed, it is cured at once.' } },
   'Matte der Ruhestörung': { effect: {
      de: 'Im Sonnen- oder Mondlicht erzeugt die Matte schaurige Laute: Wer im Umkreis von 350 Schritt schläft, hat keine Regenerationsphase; nach Meisterentscheid droht Furcht II (Selbstbeherrschung oder Willenskraft), bis 1 Stunde nach Verlassen des Umkreises.',
      en: 'In sun- or moonlight the mat makes ghastly sounds: whoever sleeps within 350 paces gets no regeneration phase; at the GM’s discretion Furcht II threatens (Selbstbeherrschung or Willenskraft), lasting until 1 hour after leaving the area.' } },
   'Menchal-Rüstung': { effect: {
      de: 'Rüstung aus der Kaktusschale (Werte auf S. 149): verliert jeden Monat 1 RS und zerfällt nach 3 Monaten; feucht gehalten kühlt sie (1 Hitzestufe ignorieren), wirkt aber abstoßend. Auch mit Lederbearbeitung ±0 herstellbar.',
      en: 'Armour made from the cactus shell (values on p. 149): loses 1 RS every month and falls apart after 3 months; kept moist it cools (ignore 1 heat level) but looks repulsive. Can also be made with Lederbearbeitung ±0.' } },
   'Messergras-Skalpell': { effect: {
      de: 'Ein gefaltetes Skalpell aus Messergras: kein Kampfwerkzeug, aber ein Hilfsmittel für Heilkunde Wunden und zum langsamen Schneiden.',
      en: 'A folded scalpel made from Messergras: not a weapon, but a tool for Heilkunde Wunden and for slow cutting.' } },
   Narbenpulver: { effect: {
      de: 'In Schnitte gerieben verheilen sie problemlos zu schwarzen Ziernarben; für ein bestimmtes Motiv nach Meisterentscheid Malen & Zeichnen −1.',
      en: 'Rubbed into cuts, they heal cleanly into black decorative scars; a particular design may need Malen & Zeichnen −1 (GM).' } },
   Orazalkleber: { effect: {
      de: 'Trocknet in etwa 1 Stunde; ein Rechtspann hält etwa 10 Stein an der Wand oder 5 Stein an der Decke.',
      en: 'Dries in about 1 hour; one square span holds about 10 Stein on a wall or 5 Stein on a ceiling.' } },
   Praiosmilch: { effect: {
      de: 'Bis zu 12 Stunden Sonnenschutz; unterdrückt 3 Stunden 1 Stufe Schmerz durch Verbrennung. Wirkungslos, wenn Praiosbrand schon mehr als 1 Stufe verursacht hat.',
      en: 'Protects from the sun for up to 12 hours; suppresses 1 level of Schmerz from burns for 3 hours. No effect if sunburn has already caused more than 1 level.' } },
   'Sansaro-Essenz': { effect: {
      de: '24 Stunden Schutz vor Ansteckung mit Krankheiten (nicht übernatürlichen).',
      en: 'Protects from catching diseases for 24 hours (not supernatural ones).' } },
   'Sansaro-Paste': { effect: {
      de: 'Auf den ganzen Körper aufgetragen hält sie bis zu 3 Tage Insekten fern. Wer sie 7 Tage ohne Waschen nutzt, riecht faulig: CH-Teilproben bei Gesellschaftstalenten −2 (außer Menschenkenntnis, Willenskraft).',
      en: 'Applied to the whole body it keeps insects away for up to 3 days. After 7 days without washing it smells rotten: CH parts of social checks −2 (except Menschenkenntnis, Willenskraft).' } },
   Scherzschwamm: { effect: {
      de: 'Streich: unter dem Kissen angezündet zischt er laut; das Opfer stinkt 1W6 × 10 Minuten (CH-Teilproben bei Gesellschaftstalenten −1, außer Menschenkenntnis und Willenskraft).',
      en: 'A prank: lit under a pillow it hisses loudly; the victim stinks for 1W6 × 10 minutes (CH parts of social checks −1, except Menschenkenntnis and Willenskraft).' } },
   'Schlängelbeutel': { effect: {
      de: 'Wurfgeschoss (Wurfwaffen, Reichweite 3/5/10): Ausweichen oder Schild-PA je −2; ein Treffer macht das Opfer bis zum Ende der nächsten KR Fixiert, ohne TP.',
      en: 'Thrown missile (Wurfwaffen, range 3/5/10): dodge or shield parry at −2; a hit leaves the target Fixiert until the end of the next KR, without TP.' } },
   Schwammzunder: { effect: {
      de: 'Leicht entzündlicher Zunder: das Feuer brennt auch im Regen 3 Stunden; mit Sand lässt es sich normal löschen.',
      en: 'Easily lit tinder: the fire keeps burning for 3 hours even in rain; sand still puts it out normally.' } },
   'Schwarzäugiges Amulett': { effect: {
      de: 'Die Blüte im Amulett lockt Lügen hervor: einmal täglich 30 Minuten Menschenkenntnis (Lügen durchschauen) +3 für einen Hesinde-Diener; Willenskraft-Vergleichsprobe widersteht. In der Hesindestunde 1W20: bei 1 berichtet die Blüte dem Träger, bei 20 verrät sie ihn.',
      en: 'The blossom in the amulet draws out lies: once a day for 30 minutes, Menschenkenntnis (see through lies) +3 for a servant of Hesinde; a Willenskraft contest resists. In Hesinde’s hour roll 1W20: on 1 the blossom reports to its wearer, on 20 it betrays them.' } },
   'Stinkmirbelsäckchen': { effect: {
      de: 'Hält bis zu 3 Wochen Ungeziefer fern; der Träger stinkt (CH-Teilproben bei Gesellschaftstalenten −1, außer Menschenkenntnis und Willenskraft), Tiere erkennen ihn nicht am Geruch.',
      en: 'Keeps vermin away for up to 3 weeks; the wearer stinks (CH parts of social checks −1, except Menschenkenntnis and Willenskraft), and animals do not know them by smell.' } },
   'Talaschin-Tinktur': { effect: {
      de: '2 Stunden für Spürhunde nicht zu riechen; mehrfach binnen 24 Stunden aufgetragen juckt sie (alle Proben −1).',
      en: 'Tracking dogs cannot smell the user for 2 hours; applied several times within 24 hours it itches (all checks −1).' } },
   Tarntinktur: { effect: {
      de: 'Grundtinktur für 1 Tag wirkende Verkleidungen, je nach Zusatz eine Wirkung: spitze Ohren (Alraune, schwarze Baumpilze), Augenfarbe (Chamäleonaugen, Färberlotos), Narben (Maraskengift), höhere Stimme (Kreide) oder tiefere (Honig).',
      en: 'Base tincture for disguises lasting 1 day, one effect per addition: pointed ears (Alraune, black tree fungi), eye colour (chameleon eyes, Färberlotos), scars (Maraskan venom), a higher voice (chalk) or a lower one (honey).' } },
   Waldwebennetz: { effect: {
      de: 'Netz zwischen zwei Stöcken: gibt beim ersten Kontakt sein Gift ab (wie Säure auf kleiner Fläche), danach ein harmloses Tragenetz oder Fangnetz für Kleintiere (Waffenwerte auf S. 151).',
      en: 'A net between two sticks: releases its venom on first contact (like acid on a small area), then serves as a harmless carrying net or trap for small animals (weapon values on p. 151).' } },
   'Wandermoos-Essenz': { effect: {
      de: '2 Stunden lang spürt der Anwender, in welcher Richtung die nächste Süßwasserquelle liegt (Reichweite 2 Meilen).',
      en: 'For 2 hours the user senses the direction of the nearest fresh water (range 2 miles).' } },
   'Weißdorn-Mazerat': { effect: {
      de: 'Versprengt schützt es 1 Stunde lang 15 Rechtsschritt vor Vampiren und Feen; angespritzt müssen sie zurückweichen, außer ihnen gelingt Selbstbeherrschung (Störungen ignorieren) −3.',
      en: 'Sprinkled, it protects 15 square paces from vampires and fairies for 1 hour; splashed at them, they must back off unless they pass Selbstbeherrschung (ignore distractions) −3.' } },
   Wirseltrank: { effect: {
      de: 'Sofort 2 LeP, nach einer Stunde 1W3 LeP und 1W3 LeP mehr bei der nächsten Regeneration. Nicht kumulativ; erneut erst nach der nächsten Regenerationsphase. Zwerge erhalten nur die Hälfte.',
      en: '2 LeP at once, 1W3 LeP after an hour and 1W3 LeP more at the next regeneration. Does not stack; again only after the next regeneration phase. Dwarves get only half.' } },
   // ---- Batch 3: Pflanzliche Gifte S. 152–153 and Pflanzliche Rauschmittel S. 154–156 (full effect / weaker effect)
   'Axorda-Katzensäckchen': { effect: {
      de: 'Betäubendes Säckchen (wie schwere Trunkenheit): Betäubung II und 1W3 SP / Betäubung I. Werfen mit Wurfwaffen (5/10/15), Ausweichen möglich; Selbstbeherrschung −2, um nicht einzuatmen. Ausgeleert trifft es alle im Umkreis von 5 Schritt.',
      en: 'A stunning pouch (like heavy drunkenness): Betäubung II and 1W3 SP / Betäubung I. Thrown with Wurfwaffen (5/10/15), can be dodged; Selbstbeherrschung −2 to avoid breathing it in. Emptied out, it affects everyone within 5 paces.' } },
   Boabungaha: { effect: {
      de: 'Erstickendes Atemgift: Betäubung I und Schmerz I / Betäubung I; alle 5 KR Selbstbeherrschung (Handlungsfähigkeit bewahren), sonst wirkt es erneut. Wird das Opfer durch Betäubung handlungsunfähig, ist es 2W6+6 Minuten bewusstlos und erstickt (RW S. 341); nur Übernatürliches hilft.',
      en: 'Suffocating inhaled poison: Betäubung I and Schmerz I / Betäubung I; every 5 KR Selbstbeherrschung (stay able to act), or it strikes again. If Betäubung incapacitates the victim, they fall unconscious for 2W6+6 minutes and suffocate (RW p. 341); only supernatural help ends it.' } },
   Gardistenkeuche: { effect: {
      de: 'Hustenstaub aus Rotem Lotos: Betäubung I und Körpertalente −2 / keine Wirkung. Werfen mit Wurfwaffen (aus der Hand 3/4/5, als Beutel 5/10/15); Selbstbeherrschung −2, um nicht einzuatmen.',
      en: 'Coughing dust of Roter Lotos: Betäubung I and physical skills −2 / no effect. Thrown with Wurfwaffen (by hand 3/4/5, as a pouch 5/10/15); Selbstbeherrschung −2 to avoid breathing it in.' } },
   Goldleim: { effect: {
      de: 'Kontakt- und Waffengift für Metall: ein Treffer oder eine bestrichene Klinke verursacht Brennend auf kleiner Fläche (Säure).',
      en: 'Contact and weapon poison for metal: a hit or a smeared door handle causes Brennend on a small area (acid).' } },
   'Knötergift': { effect: {
      de: 'Nach 8 Stunden heftiger Brechdurchfall: 1W6+1 SP je KR und Betäubung I / 1W3+1 SP und Betäubung I.',
      en: 'After 8 hours, violent vomiting and diarrhoea: 1W6+1 SP per KR and Betäubung I / 1W3+1 SP and Betäubung I.' } },
   'Krötenschemelgift': { effect: {
      de: 'Krämpfe und Erbrechen mit blauen Händen und Gesicht: 1W6+2 SP / 1W3+1 SP pro angefangener Stunde. Nicht kumulativ, solange es noch wirkt.',
      en: 'Cramps and vomiting with blue hands and face: 1W6+2 SP / 1W3+1 SP per hour begun. Does not stack while it is still working.' } },
   'Margolasch-Abführmittel': { effect: {
      de: 'Stark abführend / keine Wirkung; bei voller Wirkung Selbstbeherrschung (Störungen ignorieren) −2, um nicht ständig zum Abort zu müssen. So viele Anwendungen wie die Giftstufe neutralisieren ein Einnahmegift.',
      en: 'Strong laxative / no effect; at full effect Selbstbeherrschung (ignore distractions) −2 to avoid constant trips to the privy. As many applications as the poison’s level neutralise an ingested poison.' } },
   'Purpurner Lotosstaub': { effect: {
      de: 'Vor allem eine Ingredienz (etwa für Purpurblitz). Eingeatmet: einmalig 1W6+2 SP, dann Betäubung I bis zum Ende / einmalig 1W3+1 SP, die Dauer addiert sich. Werfen wie Gardistenkeuche.',
      en: 'Mainly an ingredient (for Purpurblitz, among others). Inhaled: 1W6+2 SP once, then Betäubung I until it ends / 1W3+1 SP once, the duration adds up. Thrown like Gardistenkeuche.' } },
   'Schwarzer Lotosstaub': { effect: {
      de: 'Halluzinogenes, lähmendes Atemgift bis zum Herzstillstand, an seinem süßen Duft erkennbar: 1W6+2 SP alle 5 Minuten und Verwirrung II / 1W3+1 SP alle 5 Minuten und Verwirrung I.',
      en: 'Hallucinogenic, paralysing inhaled poison up to cardiac arrest, known by its sweet scent: 1W6+2 SP every 5 minutes and Verwirrung II / 1W3+1 SP every 5 minutes and Verwirrung I.' } },
   Shurinknollengift: { effect: {
      de: 'Langsam und oft tödlich: je volle 5 Minuten 1W6 SP und −1 auf alle körperlichen Eigenschaften; fällt eine auf 0, stirbt das Opfer. Überlebende erholen sich um 1 Punkt pro Stunde.',
      en: 'Slow and often deadly: every full 5 minutes 1W6 SP and −1 to all physical attributes; if one drops to 0, the victim dies. Survivors recover 1 point per hour.' } },
   Beruhigungsmittel: { effect: {
      de: '1W6+3 / 1W3+3 Stunden werden Ängste (Angst vor …) und Furcht ignoriert. Danach Betäubung I; Überdosis: Furcht I. Sucht: 1–2 auf W20 bei jeder Anwendung.',
      en: 'Fears (Angst vor …) and Furcht are ignored for 1W6+3 / 1W3+3 hours. Afterwards Betäubung I; overdose: Furcht I. Addiction: 1–2 on W20 with every use.' } },
   Boronwein: { effect: {
      de: 'Betäubung II und alle Fertigkeitsproben −4 / Betäubung I, Berauscht I und −2. Misslingt danach Zechen −3: 2 Stunden Verwirrung I, MU −4, Jähzorn. Überdosis: 3W20 SP. Sucht: 16–20 auf W20 bei jeder Anwendung.',
      en: 'Betäubung II and all skill checks −4 / Betäubung I, Berauscht I and −2. If a following Zechen −3 fails: Verwirrung I for 2 hours, MU −4, short temper. Overdose: 3W20 SP. Addiction: 16–20 on W20 with every use.' } },
   Cheriacha: { effect: {
      de: 'In der Wasserpfeife geraucht: Berauscht II / Berauscht I, anfangs mit leichten Farb- und Duftvisionen. Süchtige leiden danach an Paralyse I und 1W3 Tage Impotenz. Sucht: 1–2 auf W20 bei jeder 5. Anwendung.',
      en: 'Smoked in a water pipe: Berauscht II / Berauscht I, with mild visions of colours and scents at first. Addicts then suffer Paralyse I and impotence for 1W3 days. Addiction: 1–2 on W20 with every 5th use.' } },
   'Dornrosenöl': { effect: {
      de: 'Betörendes Parfüm: Betören (Anbändeln, Aufhübschen) +1 gegen Kulturschaffende, die es länger als 1 Minute im Umkreis von 3 Schritt riechen / keine Wirkung. Überdosis: 1W3 SP, evtl. 8 Stunden handlungsunfähig. Sucht: 1–5 auf W20 bei jeder Anwendung.',
      en: 'Seductive perfume: Betören (flirting, dressing up) +1 against Kulturschaffende who smell it for over 1 minute within 3 paces / no effect. Overdose: 1W3 SP, possibly incapacitated for 8 hours. Addiction: 1–5 on W20 with every use.' } },
   Einbeerentrank: { effect: {
      de: '+4 LeP bei der nächsten Regeneration (nicht kumulativ, auch nicht mit rohen Einbeeren). Süchtig wird, wer 2 an einem Tag oder mehr als 3 pro Woche nimmt; Süchtige erhalten keine Heilung mehr und ohne wöchentliche Dosis 1W6 SP.',
      en: '+4 LeP at the next regeneration (does not stack, not even with raw Einbeeren). Taking 2 in a day or more than 3 a week makes one addicted; addicts get no healing and take 1W6 SP without a weekly dose.' } },
   'Ilmenblatt-Rauchpäckchen': { effect: {
      de: 'Berauscht I, mit W6 zusätzlich Berauscht I (1–3) oder Paralyse I (6) / Berauscht I. Bei 1–10 auf W20 beendet der Rauch im Umkreis von 7 Schritt Blutrausch und Raserei. Sucht: 1 auf W20 bei jeder 10. Anwendung.',
      en: 'Berauscht I, plus on W6 another Berauscht I (1–3) or Paralyse I (6) / Berauscht I. On 1–10 on W20 the smoke ends Blutrausch and Raserei within 7 paces. Addiction: 1 on W20 with every 10th use.' } },
   Lotoswein: { effect: {
      de: 'Verwirrung I (Halluzinationen) und Betäubung I / Betäubung I; bei 1–2 auf W6 Paralyse I. Überdosis: 1W3 SP. Sucht: 1–2 auf W20 bei jeder 5. Anwendung.',
      en: 'Verwirrung I (hallucinations) and Betäubung I / Betäubung I; on 1–2 on W6 Paralyse I. Overdose: 1W3 SP. Addiction: 1–2 on W20 with every 5th use.' } },
   'Marbos Odem': { effect: {
      de: 'Betäubung II und Willenskraft −2 / Betäubung I und −1; danach 2 Stunden handlungsunfähig. Überdosis: Berauscht I, 1W3 LeP. Sucht: 1–5 auf W20 bei jeder Anwendung, Entzug Paralyse +2.',
      en: 'Betäubung II and Willenskraft −2 / Betäubung I and −1; afterwards incapacitated for 2 hours. Overdose: Berauscht I, 1W3 LeP. Addiction: 1–5 on W20 with every use, withdrawal Paralyse +2.' } },
   'Mibel-Absud': { effect: {
      de: 'KL +1 und GE +1 / KL oder GE +1 (W6). Überdosis: Betäubung I. Stark suchterzeugend: 1–15 auf W20 ab der 2. Anwendung im Monat (Mibelsucht, S. 302).',
      en: 'KL +1 and GE +1 / KL or GE +1 (W6). Overdose: Betäubung I. Highly addictive: 1–15 on W20 from the 2nd use in a month (Mibelsucht, p. 302).' } },
   'Moarana-Liebessaft': { effect: {
      de: 'Berauscht I, Kraftakt +1 und Betören (Liebesspiel) +2 / Berauscht I; danach Betäubung I. Überdosis: 1 Stunde länger, 1 LeP je Anwendung. Sucht: 1–2 auf W20 bei jeder Anwendung.',
      en: 'Berauscht I, Kraftakt +1 and Betören (love play) +2 / Berauscht I; afterwards Betäubung I. Overdose: 1 hour longer, 1 LeP per use. Addiction: 1–2 on W20 with every use.' } },
   // ---- Batch 4: Pflanzliche Rauschmittel S. 156–158 and the first Elixiere S. 159–161
   'Quinja-Schnaps': { effect: {
      de: 'Baut Betäubung I ab (Achaz: II), dazu Berauscht II / Berauscht I; saurer Atem. Überdosis: Betäubung I. Sucht: 1–5 auf W20 bei jeder 4. Anwendung.',
      en: 'Removes Betäubung I (Achaz: II), plus Berauscht II / Berauscht I; sour breath. Overdose: Betäubung I. Addiction: 1–5 on W20 with every 4th use.' } },
   Rahjasine: { effect: {
      de: 'Willenskraft (Betören widerstehen) −2, Berauscht II und Lüsternheit / −1, Berauscht I und Lüsternheit. Jede weitere Dosis erschwert das Widerstehen um 1 mehr (höchstens −7). Sucht: 1–2 auf W20 bei jeder Anwendung.',
      en: 'Willenskraft (resist Betören) −2, Berauscht II and lustfulness / −1, Berauscht I and lustfulness. Each further dose makes resisting 1 harder (at most −7). Addiction: 1–2 on W20 with every use.' } },
   Samthauch: { effect: {
      de: 'Geschnupft: Berauscht II / Berauscht I mit ekstatischen Träumen, danach 3W6 Stunden Betäubung II. Überdosis: Berauscht I, 1W3+1 LeP. Sucht: 1–2 auf W20 bei jeder Anwendung.',
      en: 'Snorted: Berauscht II / Berauscht I with ecstatic dreams, then Betäubung II for 3W6 hours. Overdose: Berauscht I, 1W3+1 LeP. Addiction: 1–2 on W20 with every use.' } },
   'Schleieröffner': { effect: {
      de: 'Bewusstlos auf einer Reise in die Geisterwelt, an die man sich erinnert / ohne Erinnerung und danach Betäubung I. Zauber und Liturgien in Geister- oder Traumwelten +1. Überdosis: 2W3−1 SP. Sucht: 1 auf W20 bei jeder Anwendung.',
      en: 'Unconscious on a journey into the spirit world, remembered afterwards / not remembered, then Betäubung I. Spells and liturgies into spirit or dream worlds +1. Overdose: 2W3−1 SP. Addiction: 1 on W20 with every use.' } },
   'Schwarzer Pfeffer': { effect: {
      de: 'Geraucht: Betäubung I, zur Musik einer Kabasflöte (15 S) halluzinogen / keine Wirkung; bei 1 auf W6 danach Kopfschmerzen (Betäubung I). Sucht: 1 auf W20 bei jeder 10. Anwendung.',
      en: 'Smoked: Betäubung I, hallucinogenic with Kabasflöte music (15 S) / no effect; on 1 on W6, a headache afterwards (Betäubung I). Addiction: 1 on W20 with every 10th use.' } },
   'Schwarzer Weihrauch': { effect: {
      de: 'Nur in Ruhe: bewusstlos, danach Entrückung I und bei der nächsten Regeneration +2 LeP und +2 AsP (Zauberer) / Betäubung II, Entrückung I, +1 LeP und +1 AsP. 48 Stunden SK und ZK gegen Einfluss −2, Heilkunde Seele am Anwender +3. Sucht: 1–3 auf W20 bei jeder Anwendung.',
      en: 'Only at rest: unconscious, then Entrückung I and +2 LeP and +2 AsP (spellcasters) at the next regeneration / Betäubung II, Entrückung I, +1 LeP and +1 AsP. For 48 hours SK and ZK against Einfluss −2, Heilkunde Seele on the user +3. Addiction: 1–3 on W20 with every use.' } },
   'Schwarzer Wein': { effect: {
      de: 'Magische Droge der Belkelel-Kulte: Betäubung I, IN −1, CH +2, KK +2, Schmerz bis II ignorieren / Betäubung I, IN −2, CH +1, KK +1, Schmerz bis I ignorieren. Danach 24 Stunden KL, FF, GE −4 und 1 SP je volle 30 Minuten. Sucht: Selbstbeherrschung, erschwert um die Zahl der bisherigen Anwendungen; Süchtige werden den Kulten hörig.',
      en: 'Magical drug of the Belkelel cults: Betäubung I, IN −1, CH +2, KK +2, ignore Schmerz up to II / Betäubung I, IN −2, CH +1, KK +1, ignore Schmerz up to I. Afterwards KL, FF, GE −4 for 24 hours and 1 SP per full 30 minutes. Addiction: Selbstbeherrschung, harder by the number of earlier uses; addicts fall under the cults’ sway.' } },
   '1001 Rausch': { effect: {
      de: 'Parfüm aus Malomis: wirkt auf alle, die länger als 10 Sekunden im Umkreis von 5 Schritt bleiben, und erleichtert Betören (Anbändeln, Aufhübschen).',
      en: 'Malomis perfume: affects everyone who stays within 5 paces for more than 10 seconds and makes Betören (flirting, dressing up) easier.' },
      qualities: qs(
         ['Erste CH-Teilprobe +2, 30 Minuten.', 'Beide CH-Teilproben +2, 1 Stunde.', 'Betören +2 und +1 FP, 2 Stunden.', 'Betören +2 und +1 FP, 4 Stunden.', 'Betören +3 und +2 FP, 8 Stunden.', 'Betören +3 und +2 FP, 16 Stunden.'],
         ['First CH part +2, 30 minutes.', 'Both CH parts +2, 1 hour.', 'Betören +2 and +1 FP, 2 hours.', 'Betören +2 and +1 FP, 4 hours.', 'Betören +3 and +2 FP, 8 hours.', 'Betören +3 and +2 FP, 16 hours.']) },
   'Alchimistensäure': { effect: {
      de: 'Säure gegen Gegenstände und Lebewesen: 1W3 Strukturschaden oder SP je KR (Feuer- und Säureschaden, RW S. 341). Im Gefäß geworfen mit Wurfwaffen (2/4/8), Ausweichen oder Schild-PA möglich; löschen mit Körperbeherrschung −2.',
      en: 'Acid against objects and living beings: 1W3 structure damage or SP per KR (fire and acid damage, RW p. 341). Thrown in a vessel with Wurfwaffen (2/4/8), can be dodged or shield-parried; putting it out needs Körperbeherrschung −2.' },
      qualities: qs(['Wirkt 1W3 KR.', 'Wirkt 1W6 KR.', 'Wirkt 1W6+2 KR.', 'Wirkt 1W6+4 KR.', 'Wirkt 1W6+6 KR.', 'Wirkt 1W6+8 KR.'],
         ['Lasts 1W3 KR.', 'Lasts 1W6 KR.', 'Lasts 1W6+2 KR.', 'Lasts 1W6+4 KR.', 'Lasts 1W6+6 KR.', 'Lasts 1W6+8 KR.']) },
   Bannkreide: { effect: {
      de: 'Eine Anwendung zeichnet einen Bannkreis gegen jede Art Wesen (Invokationen, entfesselte Elementare und Dämonen); das Aktivieren kostet weniger AsP.',
      en: 'One application draws a binding circle against any kind of being (invocations, unbound elementals and demons); activating it costs fewer AsP.' },
      qualities: qs([1, 2, 3, 4, 5, 6].map((n) => `Aktivieren kostet ${n} AsP weniger.`), [1, 2, 3, 4, 5, 6].map((n) => `Activation costs ${n} AsP less.`)) },
   Berserkerelixier: { effect: {
      de: 'Macht Kämpfer rasend; wer es ihnen gab, wird nie angegriffen.',
      en: 'Drives fighters into a frenzy; whoever gave it to them is never attacked.' },
      qualities: qs(
         ['5 KR AT +1, VW −2; danach Betäubung I.', '5 KR AT +2, VW −4.', 'Blutrausch für 5 KR.', 'Blutrausch für 10 KR.', 'Blutrausch für 20 KR.', 'Blutrausch für 40 KR.'],
         ['AT +1, defence −2 for 5 KR; afterwards Betäubung I.', 'AT +2, defence −4 for 5 KR.', 'Blutrausch for 5 KR.', 'Blutrausch for 10 KR.', 'Blutrausch for 20 KR.', 'Blutrausch for 40 KR.']) },
   Charismaelixier: { effect: {
      de: 'Steigert 20 Minuten lang CH und Seelenkraft.',
      en: 'Raises CH and Seelenkraft for 20 minutes.' },
      qualities: qs(['CH +1.', 'CH +1, SK +1.', 'CH +2, SK +1.', 'CH +2, SK +2.', 'CH +3, SK +2.', 'CH +3, SK +3.'],
         ['CH +1.', 'CH +1, SK +1.', 'CH +2, SK +1.', 'CH +2, SK +2.', 'CH +3, SK +2.', 'CH +3, SK +3.']) },
   Erscheinungspulver: { effect: {
      de: 'Macht Unsichtbares kurz sichtbar und setzt dafür jeden magischen Effekt aus (nicht karmale Unsichtbarkeit). Geworfen mit Wurfwaffen (aus der Hand 3/4/5, als Beutel 5/10/15), Ausweichen möglich.',
      en: 'Briefly reveals the invisible by suspending any magical effect (not karmic invisibility). Thrown with Wurfwaffen (by hand 3/4/5, as a pouch 5/10/15), can be dodged.' },
      qualities: qs(['1W3 KR sichtbar.', '1W6 KR sichtbar.', '1W6+2 KR sichtbar.', '1W6+4 KR sichtbar.', '2W6+4 KR sichtbar.', '3W6+6 KR sichtbar.'],
         ['Visible for 1W3 KR.', 'Visible for 1W6 KR.', 'Visible for 1W6+2 KR.', 'Visible for 1W6+4 KR.', 'Visible for 2W6+4 KR.', 'Visible for 3W6+6 KR.']) },
   'Eulentränen': { effect: {
      de: 'In die Augen geträufelt sieht man im Dunkeln besser; jede Anwendung kostet 1 SP.',
      en: 'Dripped into the eyes for better sight in the dark; each application costs 1 SP.' },
      qualities: qs(['Dunkelsicht I, 5 Minuten.', 'Dunkelsicht I, 10 Minuten.', 'Dunkelsicht I, 15 Minuten.', 'Dunkelsicht II, 30 Minuten.', 'Dunkelsicht II, 1 Stunde.', 'Dunkelsicht II, 2 Stunden.'],
         ['Dunkelsicht I, 5 minutes.', 'Dunkelsicht I, 10 minutes.', 'Dunkelsicht I, 15 minutes.', 'Dunkelsicht II, 30 minutes.', 'Dunkelsicht II, 1 hour.', 'Dunkelsicht II, 2 hours.']) },
   // ---- Batch 5: Elixiere S. 161–166
   Feuerpulver: { effect: {
      de: 'Feuerwerk für prächtige Lichtspiele. Muss wasserdicht unter Wasser lagern, sonst zünden es Feuergeister binnen 1W6 KR; feucht ist es nutzlos. Bei 1–5 auf W20 zündet es sofort nach dem Brauen, ab Hitzestufe 3 stündlich (außer gekühlt). Wer in der Zone steht, wird bei 1–2 auf W20 getroffen.',
      en: 'Fireworks for splendid light shows. Must be kept watertight under water, or fire spirits ignite it within 1W6 KR; damp, it is useless. On 1–5 on W20 it goes off right after brewing, and hourly from heat level 3 (unless cooled). Anyone in the zone is hit on 1–2 on W20.' },
      qualities: qs(
         ['Zone 1 Rechtsschritt; Treffer: Brennend (kleine Fläche).', 'Zone 2 Rechtsschritt; Treffer: 1W20 TP und Brennend (kleine Fläche).', 'Zone 3 Rechtsschritt; Treffer: 2W20 TP und Brennend (große Fläche).',
            'Zone 4 Rechtsschritt; Treffer: 3W20 TP und Brennend (große Fläche).', 'Zone 6 Rechtsschritt; Treffer: 4W20 TP und Brennend (ganzer Körper).', 'Zone 8 Rechtsschritt; Treffer: 5W20 TP und Brennend (ganzer Körper).'],
         ['Zone of 1 square pace; a hit: Brennend (small area).', 'Zone of 2 square paces; a hit: 1W20 TP and Brennend (small area).', 'Zone of 3 square paces; a hit: 2W20 TP and Brennend (large area).',
            'Zone of 4 square paces; a hit: 3W20 TP and Brennend (large area).', 'Zone of 6 square paces; a hit: 4W20 TP and Brennend (whole body).', 'Zone of 8 square paces; a hit: 5W20 TP and Brennend (whole body).']) },
   Fingerfertigkeitselixier: { effect: {
      de: 'Eines der Elixiere der Tugenden: 20 Minuten mehr FF und Fernkampf.',
      en: 'One of the elixirs of virtue: more FF and ranged combat for 20 minutes.' },
      qualities: qs(['FF +1.', 'FF +1, FK +1.', 'FF +2, FK +1.', 'FF +2, FK +2.', 'FF +3, FK +2.', 'FF +3, FK +3.'],
         ['FF +1.', 'FF +1, FK +1.', 'FF +2, FK +1.', 'FF +2, FK +2.', 'FF +3, FK +2.', 'FF +3, FK +3.']) },
   Friedenswasser: { effect: {
      de: 'Beruhigt: Ängste (Angst vor …) und Furcht werden für die Dauer ignoriert und Furcht wird abgebaut; ab QS 4 wird der Anwender zum Friedensstifter.',
      en: 'Calming: fears (Angst vor …) and Furcht are ignored for the duration and Furcht is reduced; from QS 4 the user turns into a peacemaker.' },
      qualities: qs(
         ['1W6 Stunden, Furcht −1.', '1W6+2 Stunden, Furcht −2.', '1W6+4 Stunden, Furcht −3.', 'Wie QS 3; 15 Minuten überzeugter Pazifist gegenüber allen Kulturschaffenden.',
            'Wie QS 3; 30 Minuten Pazifist gegenüber allen intelligenten Wesen, selbst Dämonen.', 'Wie QS 5; versucht zudem friedlich, alle Waffen in Sicht an sich zu bringen und zu zerstören.'],
         ['1W6 hours, Furcht −1.', '1W6+2 hours, Furcht −2.', '1W6+4 hours, Furcht −3.', 'As QS 3; a devoted pacifist towards all Kulturschaffende for 15 minutes.',
            'As QS 3; a pacifist towards all intelligent beings, even demons, for 30 minutes.', 'As QS 5; also tries peacefully to take and destroy every weapon in sight.']) },
   'Furchtlos-Tropfen': { effect: {
      de: 'Orkisches Rezept: Ängste (Angst vor …) und Furcht werden für die Dauer ignoriert und Furcht wird abgebaut.',
      en: 'Orcish recipe: fears (Angst vor …) and Furcht are ignored for the duration and Furcht is reduced.' },
      qualities: qs(['1W3+3 Stunden, Furcht −1.', '1W3+4 Stunden, Furcht −1.', '1W3+5 Stunden, Furcht −1.', '1W3+5 Stunden, Furcht −2.', '1W3+6 Stunden, Furcht −3.', '1W3+8 Stunden, Furcht −4.'],
         ['1W3+3 hours, Furcht −1.', '1W3+4 hours, Furcht −1.', '1W3+5 hours, Furcht −1.', '1W3+5 hours, Furcht −2.', '1W3+6 hours, Furcht −3.', '1W3+8 hours, Furcht −4.']) },
   Gewandtheitselixier: { effect: {
      de: 'Eines der Elixiere der Tugenden: 20 Minuten mehr GE und GS.',
      en: 'One of the elixirs of virtue: more GE and GS for 20 minutes.' },
      qualities: qs(['GE +1.', 'GE +1, GS +1.', 'GE +2, GS +1.', 'GE +2, GS +2.', 'GE +3, GS +2.', 'GE +3, GS +3.'],
         ['GE +1.', 'GE +1, GS +1.', 'GE +2, GS +1.', 'GE +2, GS +2.', 'GE +3, GS +2.', 'GE +3, GS +3.']) },
   Ghulscheuche: { effect: {
      de: 'Das einzige verlässliche Mittel gegen Ghulgift.',
      en: 'The only reliable cure for ghoul venom.' },
      qualities: qs(
         ['Ein Infizierter verwandelt sich erst binnen 1W20 Tagen.', 'Heilkunde Gift gegen Ghulgift nur −2, kein Aderlass nötig.', 'Heilkunde Gift gegen Ghulgift ohne Erschwernis, kein Aderlass nötig.',
            'Nur noch die schwächere Wirkung des Ghulgifts.', 'Ghulgift neutralisiert; 1 Tag immun.', 'Wie QS 5; auch ein seit höchstens 1 Tag Verwandelter kann noch mit Heilkunde Gift behandelt werden.'],
         ['An infected person turns only within 1W20 days.', 'Heilkunde Gift against ghoul venom only −2, no bloodletting needed.', 'Heilkunde Gift against ghoul venom without penalty, no bloodletting needed.',
            'Only the weaker effect of the venom.', 'Ghoul venom neutralised; immune for 1 day.', 'As QS 5; someone turned no more than 1 day ago can still be treated with Heilkunde Gift.']) },
   'Gnädiger Drachenodem': { effect: {
      de: 'Bricht einen zufälligen Fluch auf dem Anwender, wenn beim Brauen etwas vom Körper des Fluchsprechers verwendet wurde.',
      en: 'Breaks a random curse on the user if something from the curser’s body went into the brew.' },
      qualities: qs([1, 2, 3, 4, 5, 6].map((n) => `Flüche mit QS bis ${n}.`), [1, 2, 3, 4, 5, 6].map((n) => `Curses of QS up to ${n}.`)) },
   'Hauch der Weissagung': { effect: {
      de: 'Schärft die Beobachtung; in höchster Qualität sind echte Prophezeiungen möglich.',
      en: 'Sharpens perception; at the highest quality true prophecies are possible.' },
      qualities: qs(
         ['1 Stunde Sinnesschärfe +1, KL −1.', '1 Stunde Sinnesschärfe +2, KL −2.', '1 Stunde Sinnesschärfe +2, KL −1.', 'Wie QS 3, dazu Menschenkenntnis +1.', 'Wie QS 3, dazu Menschenkenntnis +2.',
            'Wie QS 5; für 1 Schip einem Helden einmal pro Abenteuer weissagen: er zahlt für das nächste Neu Würfeln, Schadenswurf wiederholen oder Verteidigung keinen Schip.'],
         ['Sinnesschärfe +1, KL −1 for 1 hour.', 'Sinnesschärfe +2, KL −2 for 1 hour.', 'Sinnesschärfe +2, KL −1 for 1 hour.', 'As QS 3, plus Menschenkenntnis +1.', 'As QS 3, plus Menschenkenntnis +2.',
            'As QS 5; for 1 Schip, prophesy for a hero once per adventure: they pay no Schip for their next reroll, damage reroll or defence.']) },
   Heilsalbe: { effect: {
      de: 'Verbreitete Wirselkraut-Salbe; nicht kumulativ (nur die beste QS zählt), erneut erst nach der nächsten Regenerationsphase.',
      en: 'A common Wirselkraut salve; does not stack (only the best QS counts), again only after the next regeneration phase.' },
      qualities: qs(['1W3 LeP bei der nächsten Regeneration.', '1W3+1 LeP bei der nächsten Regeneration.', 'Sofort 1 LeP, 1W3+1 bei der nächsten Regeneration.', 'Sofort 1 LeP, 1W3+2 bei der nächsten Regeneration.',
         'Sofort 2 LeP, 1W3+2 bei der nächsten Regeneration.', 'Sofort 2 LeP, 1W3+3 bei der nächsten Regeneration.'],
         ['1W3 LeP at the next regeneration.', '1W3+1 LeP at the next regeneration.', '1 LeP at once, 1W3+1 at the next regeneration.', '1 LeP at once, 1W3+2 at the next regeneration.',
            '2 LeP at once, 1W3+2 at the next regeneration.', '2 LeP at once, 1W3+3 at the next regeneration.']) },
   'Hylailer Feuer': { effect: {
      de: 'Militärisches Brandmittel, meist verboten: 1W3 Strukturschaden oder SP je KR (Brennend), die Fläche wächst alle 5 KR. Im Gefäß geworfen mit Wurfwaffen (2/4/8), nur Ausweichen oder Schild-PA; löschen mit Körperbeherrschung −5.',
      en: 'Military incendiary, mostly forbidden: 1W3 structure damage or SP per KR (Brennend), the area grows every 5 KR. Thrown in a vessel with Wurfwaffen (2/4/8), only dodge or shield parry; putting it out needs Körperbeherrschung −5.' },
      qualities: qs(['Zündet bei 1–2 auf W6, brennt 1W6 KR.', 'Zündet bei 1–3, brennt 1W6+2 KR.', 'Zündet bei 1–3, brennt 2W6+4 KR.', 'Zündet bei 1–4, brennt 2W6+6 KR.', 'Zündet bei 1–4, brennt 3W6+8 KR.', 'Zündet bei 1–5, brennt 3W6+10 KR.'],
         ['Ignites on 1–2 on W6, burns 1W6 KR.', 'Ignites on 1–3, burns 1W6+2 KR.', 'Ignites on 1–3, burns 2W6+4 KR.', 'Ignites on 1–4, burns 2W6+6 KR.', 'Ignites on 1–4, burns 3W6+8 KR.', 'Ignites on 1–5, burns 3W6+10 KR.']) },
   Ifirnstrunk: { effect: {
      de: 'Schützt vor allen Folgen von Kälte. Wer die Haut während der Wirkung nicht feucht hält, verliert einen Tag nach der Einnahme 1W6 LeP durch Frost.',
      en: 'Protects from all effects of cold. Whoever does not keep their skin moist during the effect loses 1W6 LeP to frost a day after drinking it.' },
      qualities: qs(['1 Stunde.', '4 Stunden.', '12 Stunden.', '1 Tag.', '3 Tage.', '3 Tage, dazu Schwimmhäute (Schwimmen +3).'],
         ['1 hour.', '4 hours.', '12 hours.', '1 day.', '3 days.', '3 days, plus webbed fingers (Schwimmen +3).']) },
   'Kaltes Licht': { effect: {
      de: 'Leuchtende Masse, in Flüssigkeit aufbewahrt. 1 KR Kontakt mit Haut oder Kleidung bedeutet Brennend auf kleiner Fläche; löschen mit Körperbeherrschung −2.',
      en: 'Glowing mass kept in liquid. 1 KR of contact with skin or clothing means Brennend on a small area; putting it out needs Körperbeherrschung −2.' },
      qualities: qs(['Licht einer Kerze, 0,5 Stunden.', 'Licht einer Kerze, 1 Stunde.', 'Licht einer Kerze, 1,5 Stunden.', 'Licht einer Fackel, 2 Stunden.', 'Licht einer Fackel, 2,5 Stunden.', 'Licht einer Fackel, 3 Stunden.'],
         ['Candle light, 0.5 hours.', 'Candle light, 1 hour.', 'Candle light, 1.5 hours.', 'Torch light, 2 hours.', 'Torch light, 2.5 hours.', 'Torch light, 3 hours.']) },
   Konstitutionselixier: { effect: {
      de: 'Eines der Elixiere der Tugenden: 20 Minuten mehr KO und Zähigkeit.',
      en: 'One of the elixirs of virtue: more KO and Zähigkeit for 20 minutes.' },
      qualities: qs(['KO +1.', 'KO +1, ZK +1.', 'KO +2, ZK +1.', 'KO +2, ZK +2.', 'KO +3, ZK +2.', 'KO +3, ZK +3.'],
         ['KO +1.', 'KO +1, ZK +1.', 'KO +2, ZK +1.', 'KO +2, ZK +2.', 'KO +3, ZK +2.', 'KO +3, ZK +3.']) },
   'Körperkraftelixier': { effect: {
      de: 'Eines der bekannten Stärkeelixiere: 20 Minuten mehr KK und Zähigkeit.',
      en: 'A well-known strength elixir: more KK and Zähigkeit for 20 minutes.' },
      qualities: qs(['KK +1.', 'KK +1, ZK +1.', 'KK +2, ZK +1.', 'KK +2, ZK +2.', 'KK +3, ZK +2.', 'KK +3, ZK +3.'],
         ['KK +1.', 'KK +1, ZK +1.', 'KK +2, ZK +1.', 'KK +2, ZK +2.', 'KK +3, ZK +2.', 'KK +3, ZK +3.']) },
   // ---- Batch 6: Elixiere S. 166–170
   Lotostrunk: { effect: {
      de: 'Macht 30 Minuten lang die magischen Strukturen der Welt fassbarer.',
      en: 'Makes the magical structures of the world easier to grasp for 30 minutes.' },
      qualities: qs(
         ['ODEM ARCANUM +1.', 'ODEM ARCANUM und ANALYS ARKANSTRUKTUR +1.', 'Beide Zauber +1; Profane dürfen eine Magische Analyse ohne QS-Grenze durchführen.',
            'Beide Zauber +2; Magische Analyse für Profane ohne QS-Grenze.', 'Wie QS 4, dazu Magische Analyse +1.', 'Wie QS 4, dazu Magische Analyse +2.'],
         ['ODEM ARCANUM +1.', 'ODEM ARCANUM and ANALYS ARKANSTRUKTUR +1.', 'Both spells +1; mundane users may perform a magical analysis without a QS limit.',
            'Both spells +2; magical analysis for mundane users without a QS limit.', 'As QS 4, plus magical analysis +1.', 'As QS 4, plus magical analysis +2.']) },
   Magiepaste: { effect: {
      de: 'Färbt sich blutrot, wenn in der Nähe Magie gewirkt wird; mit Haaren eines Zauberers oder magischen Wesens gebraut, reagiert sie nicht auf dessen Magie.',
      en: 'Turns blood red when magic is worked nearby; brewed with hair of a spellcaster or magical being, it ignores that one’s magic.' },
      qualities: qs(['1 Anwendung, Reichweite 3 Schritt.', '1 Anwendung, 7 Schritt.', '2 Anwendungen, 3 Schritt.', '2 Anwendungen, 7 Schritt.', '3 Anwendungen, 3 Schritt.', '3 Anwendungen, 7 Schritt.'],
         ['1 application, range 3 paces.', '1 application, 7 paces.', '2 applications, 3 paces.', '2 applications, 7 paces.', '3 applications, 3 paces.', '3 applications, 7 paces.']) },
   'Mengbiller Bannbalöl': { effect: {
      de: 'Wirkt ähnlich wie BANNBALADIN (RW S. 288): der Anwender selbst begegnet allen freundlicher; seine Einstellung zu jeder Person steigt.',
      en: 'Works much like BANNBALADIN (RW p. 288): the user feels friendlier towards everyone; their attitude to each person improves.' },
      qualities: qs(['Einstellung +1, 24 Stunden.', 'Einstellung +1, 48 Stunden.', 'Einstellung +2, 24 Stunden.', 'Einstellung +2, 48 Stunden.', 'Einstellung +3, 24 Stunden.', 'Einstellung +3, 48 Stunden.'],
         ['Attitude +1, 24 hours.', 'Attitude +1, 48 hours.', 'Attitude +2, 24 hours.', 'Attitude +2, 48 hours.', 'Attitude +3, 24 hours.', 'Attitude +3, 48 hours.']) },
   Mutelixier: { effect: {
      de: 'Stärkt 20 Minuten lang die Psyche: mehr MU und Initiative.',
      en: 'Strengthens the mind for 20 minutes: more MU and initiative.' },
      qualities: qs(['MU +1.', 'MU +1, INI +1.', 'MU +2, INI +1.', 'MU +2, INI +2.', 'MU +3, INI +2.', 'MU +3, INI +3.'],
         ['MU +1.', 'MU +1, INI +1.', 'MU +2, INI +1.', 'MU +2, INI +2.', 'MU +3, INI +2.', 'MU +3, INI +3.']) },
   Neckergel: { effect: {
      de: 'Schützt 1 Rechtsschritt je Anwendung vor Brennend und Schaden durch Feuer oder Säure; die Dauer läuft ab dem ersten Kontakt. 5 Minuten perlt zudem jede Flüssigkeit ab; Regen wäscht es bald ab.',
      en: 'Protects 1 square pace per application from Brennend and damage by fire or acid; the duration starts at first contact. Liquids also run off for 5 minutes; rain soon washes it away.' },
      qualities: qs(['5 KR (nicht gegen magisches Feuer und Drachenfeuer).', '10 KR.', '20 KR.', '1 Minute, auch gegen magisches Feuer.', '2 Minuten, auch gegen magisches Feuer.', '2 Minuten, oder Drachenfeuer für 5 KR neutralisieren.'],
         ['5 KR (not against magical fire and dragonfire).', '10 KR.', '20 KR.', '1 minute, magical fire included.', '2 minutes, magical fire included.', '2 minutes, or neutralise dragonfire for 5 KR.']) },
   'Pulver des Klaren Geistes': { effect: {
      de: 'Eingeatmet hebt es die Wirkung eines Rauschmittels auf; in höchster Güte kann es sogar eine Sucht heilen.',
      en: 'Inhaled, it ends the effect of a drug; at the highest quality it can even cure an addiction.' },
      qualities: qs(['Rauschmittel bis Stufe 1.', 'Bis Stufe 2.', 'Bis Stufe 3.', 'Bis Stufe 4.', 'Bis Stufe 5.',
         'Bis Stufe 6; dazu einmal je Rauschmittel die Suchtprobe wiederholen: bleibt sie aus, klingt die Sucht binnen eines Tages ab (bei erneutem Konsum kehrt sie zurück).'],
         ['Drugs up to level 1.', 'Up to level 2.', 'Up to level 3.', 'Up to level 4.', 'Up to level 5.',
            'Up to level 6; also reroll the addiction check once per drug: if it fails to addict, the addiction fades within a day (it returns on renewed use).']) },
   Quasselpulver: { effect: {
      de: 'Nach 5 Minuten wird ein Kulturschaffender redselig und verrät Geheimnisse; gelenkt wird er mit Überreden gegen seine Willenskraft.',
      en: 'After 5 minutes a Kulturschaffender becomes talkative and spills secrets; steer them with Überreden against their Willenskraft.' },
      qualities: qs(['Willenskraft −1, 10 Minuten.', 'Willenskraft −1, 20 Minuten.', 'Willenskraft −2, 30 Minuten.', 'Willenskraft −2, 40 Minuten.', 'Willenskraft −3, 50 Minuten.', 'Willenskraft −3, 60 Minuten.'],
         ['Willenskraft −1, 10 minutes.', 'Willenskraft −1, 20 minutes.', 'Willenskraft −2, 30 minutes.', 'Willenskraft −2, 40 minutes.', 'Willenskraft −3, 50 minutes.', 'Willenskraft −3, 60 minutes.']) },
   Scharfsinnelixier: { effect: {
      de: 'Schärft alle Sinne auf elfisches Niveau.',
      en: 'Sharpens all senses to elven levels.' },
      qualities: qs(['Sinnesschärfe +1, 15 Minuten.', 'Sinnesschärfe +1, 30 Minuten.', 'Sinnesschärfe +2, 45 Minuten.', 'Sinnesschärfe +2, 60 Minuten.', 'Sinnesschärfe +3, 75 Minuten.', 'Sinnesschärfe +3, 90 Minuten.'],
         ['Sinnesschärfe +1, 15 minutes.', 'Sinnesschärfe +1, 30 minutes.', 'Sinnesschärfe +2, 45 minutes.', 'Sinnesschärfe +2, 60 minutes.', 'Sinnesschärfe +3, 75 minutes.', 'Sinnesschärfe +3, 90 minutes.']) },
   Schlaftrunk: { effect: {
      de: 'Erholsamer Schlaf: in der nächsten Regenerationsphase (nur im Schlaf) zusätzliche LeP, AsP und KaP.',
      en: 'Restful sleep: extra LeP, AsP and KaP in the next regeneration phase (only while asleep).' },
      qualities: qs([1, 2, 3, 4, 5, 6].map((n) => `+${n} LeP, AsP und KaP.`), [1, 2, 3, 4, 5, 6].map((n) => `+${n} LeP, AsP and KaP.`)) },
   Schmerzwein: { effect: {
      de: 'Altbewährtes Schmerzmittel aus Bleichmohn; während der Wirkung KL, IN, FF, GE, GS und INI −1.',
      en: 'Tried-and-tested painkiller from Bleichmohn; while it works KL, IN, FF, GE, GS and INI −1.' },
      qualities: qs(['Schmerz I unterdrückt, 30 Minuten.', 'Schmerz I unterdrückt, 1 Stunde.', 'Schmerz I unterdrückt, 2 Stunden.', 'Schmerz I, 2 Stunden; Selbstbeherrschung +2.', 'Schmerz I, 2 Stunden; Selbstbeherrschung +4.', 'Schmerz I, 2 Stunden; Selbstbeherrschung +6.'],
         ['Schmerz I suppressed, 30 minutes.', 'Schmerz I suppressed, 1 hour.', 'Schmerz I suppressed, 2 hours.', 'Schmerz I, 2 hours; Selbstbeherrschung +2.', 'Schmerz I, 2 hours; Selbstbeherrschung +4.', 'Schmerz I, 2 hours; Selbstbeherrschung +6.']) },
   Tarnelixier: { effect: {
      de: 'Verändert den Körper für QS Stunden nach 30 Minuten Meditation (bei Störung Selbstbeherrschung, sonst verfliegt es). Magisch erkennbar; Sinnesschärfe (Hinterhalt entdecken) gegen Verbergen, um die QS erschwert, durchschaut die Täuschung.',
      en: 'Changes the body for QS hours after 30 minutes of meditation (if disturbed, Selbstbeherrschung, or it is lost). Detectable as magic; Sinnesschärfe (spot ambush) against Verbergen, harder by the QS, sees through it.' },
      qualities: qs(
         ['Augen-, Haar- und Hautfarbe.', 'Dazu kleine Körperteile (Nase, Ohren …); bei Anstrengung Selbstbeherrschung −2, um sie zu halten.', 'Dazu mittelgroße Körperteile (Hand, Fuß …).',
            'Dazu große Körperteile (Arm, Bein, Brust …); Selbstbeherrschung nur −1.', 'Wie QS 4; Selbstbeherrschung ohne Erschwernis.', 'Wie QS 5; der ganze Körper samt Geschlecht, Gesicht und Stimme bei gleicher Größe und gleichem Gewicht (Meisterentscheid).'],
         ['Eye, hair and skin colour.', 'Plus small body parts (nose, ears …); under strain Selbstbeherrschung −2 to keep them.', 'Plus medium body parts (hand, foot …).',
            'Plus large body parts (arm, leg, chest …); Selbstbeherrschung only −1.', 'As QS 4; Selbstbeherrschung without penalty.', 'As QS 5; the whole body including sex, face and voice, keeping height and weight (GM’s call).']) },
   'Techtals Elixier': { effect: {
      de: 'Steigert die Leistung bei Recherche-Sammelproben: die eigenen QS steigen (höchstens 10), einmal je Probe, egal wie viele es nehmen. Man riecht 1 Tag nach Klippenzahn. Das Rezept muss erst aufgespürt werden.',
      en: 'Boosts research in cumulative checks: the user’s QS rise (at most 10), once per check however many take it. The user smells of Klippenzahn for 1 day. The recipe must first be tracked down.' },
      qualities: qs([1, 2, 3, 4, 5, 6].map((n) => `Beigesteuerte QS +${n}.`), [1, 2, 3, 4, 5, 6].map((n) => `Contributed QS +${n}.`)) },
   'Tharvun-Parfüm': { effect: {
      de: 'Parfüm: erleichtert Betören (Anbändeln, Aufhübschen) gegenüber Interessierten, die länger als 1 Minute im Umkreis von 3 Schritt bleiben.',
      en: 'Perfume: makes Betören (flirting, dressing up) easier against interested people who stay within 3 paces for more than 1 minute.' },
      qualities: qs(['Erste CH-Teilprobe +1, 30 Minuten.', 'Beide CH-Teilproben +1, 30 Minuten.', 'Betören +1, 30 Minuten.', 'Betören +1, 1 Stunde.', 'Betören +2, 30 Minuten.', 'Betören +2, 1 Stunde.'],
         ['First CH part +1, 30 minutes.', 'Both CH parts +1, 30 minutes.', 'Betören +1, 30 minutes.', 'Betören +1, 1 hour.', 'Betören +2, 30 minutes.', 'Betören +2, 1 hour.']) },
   'Tijakools Hauch': { effect: {
      de: 'Ganz getrunken lässt es einen Geist im Umkreis von 8 Schritt widerstandslos Besitz vom Anwender ergreifen.',
      en: 'Drunk completely, it lets a spirit within 8 paces possess the user without resistance.' },
      qualities: qs(['15 Minuten.', '30 Minuten.', '45 Minuten.', '60 Minuten.', '75 Minuten.', '90 Minuten.'],
         ['15 minutes.', '30 minutes.', '45 minutes.', '60 minutes.', '75 minutes.', '90 minutes.']) },
   // ---- Batch 7: the last Elixiere S. 171–172, Alchimistische Gifte S. 172–175 and Rauschmittel S. 175–178
   // (alchemical poisons and drugs: the level is the brew's QS; full effect / weaker effect)
   Unverwundbarkeitselixier: { effect: {
      de: 'Schützt 1 Stunde lang wie eine Rüstung und unterdrückt Schmerz; höhere Schmerzstufen wirken voll. Eine Überdosis soll unverwundbar machen – und am Ende töten.',
      en: 'Protects like armour for 1 hour and suppresses Schmerz; higher levels of Schmerz apply in full. An overdose is said to make one invulnerable – and kill at the end.' },
      qualities: qs(['Schmerz bis I ignorieren.', 'RS 1, Schmerz bis I ignorieren.', 'RS 1, Schmerz bis II ignorieren.', 'RS 2, Schmerz bis II ignorieren.', 'RS 2, Schmerz bis III ignorieren.', 'RS 3, Schmerz bis III ignorieren.'],
         ['Ignore Schmerz up to I.', 'RS 1, ignore Schmerz up to I.', 'RS 1, ignore Schmerz up to II.', 'RS 2, ignore Schmerz up to II.', 'RS 2, ignore Schmerz up to III.', 'RS 3, ignore Schmerz up to III.']) },
   Wachtrunk: { effect: {
      de: 'Hält in guter Qualität tagelang wach, ohne Schlafmangel.',
      en: 'At good quality it keeps one awake for days without lack of sleep.' },
      qualities: qs(['1W6 Stunden keine Müdigkeit; schlafen muss man trotzdem.', 'Eine Nacht (etwa 6 Stunden) ohne Schlaf, aber ohne Regenerationsphase (Boni wie Heilpflanzen gelten).',
         'Wie QS 2, aber mit Regenerationsphase, solange man sich nicht schwer anstrengt.', 'Wie QS 3, zwei Nächte.', 'Wie QS 3, drei Nächte.', 'Wie QS 3, vier Nächte.'],
         ['No tiredness for 1W6 hours; one still has to sleep.', 'One night (about 6 hours) without sleep, but no regeneration phase (bonuses such as healing plants still apply).',
            'As QS 2, but with a regeneration phase as long as one avoids heavy exertion.', 'As QS 3, two nights.', 'As QS 3, three nights.', 'As QS 3, four nights.']) },
   Weissagungspulver: { effect: {
      de: 'Eingeatmet bittet der Anwender eine Wesenheit um ein Zeichen und sieht binnen 15 Minuten etwas Bemerkenswertes; ob es von ihr stammt, weiß er nicht. Andere überzeugt er mit Bekehren & Überzeugen.',
      en: 'Inhaled, the user asks an entity for a sign and sees something remarkable within 15 minutes; whether it came from that entity stays unknown. Convincing others takes Bekehren & Überzeugen.' },
      qualities: qs(['Bekehren & Überzeugen −1.', 'Bekehren & Überzeugen ±0.', 'Bekehren & Überzeugen +1.', 'Wie QS 3; das Zeichen ist 3 KR lang für alle sichtbar.', 'Wie QS 3; 6 KR für alle sichtbar.', 'Wie QS 3; 9 KR für alle sichtbar.'],
         ['Bekehren & Überzeugen −1.', 'Bekehren & Überzeugen ±0.', 'Bekehren & Überzeugen +1.', 'As QS 3; the sign is visible to everyone for 3 KR.', 'As QS 3; visible to everyone for 6 KR.', 'As QS 3; visible to everyone for 9 KR.']) },
   'Zurbarans Pflanzentinktur': { effect: {
      de: 'Verschmilzt zwei Pflanzen zu einer dämonisch anmutenden Pflanzenchimäre (S. 256), die danach zu dämonischem Unrat zerfällt.',
      en: 'Fuses two plants into a demonic-looking plant chimera (p. 256) that then decays into demonic filth.' },
      qualities: qs([1, 2, 3, 4, 5, 6].map((n) => `Hält ${n} ${n === 1 ? 'Tag' : 'Tage'}.`), [1, 2, 3, 4, 5, 6].map((n) => `Lasts ${n} ${n === 1 ? 'day' : 'days'}.`)) },
   Angstgift: { effect: {
      de: 'Waffengift, das Panik auslöst: Furcht II / Furcht I. Nicht kumulativ: erneut erst nach dem Ende der Wirkung.',
      en: 'Weapon poison that causes panic: Furcht II / Furcht I. Does not stack: again only after the effect ends.' } },
   'Betäubungsgift': { effect: {
      de: 'Waffengift, das müde und träge macht: Betäubung II und Paralyse II / Betäubung I und Paralyse I. Nicht kumulativ: erneut erst nach dem Ende der Wirkung.',
      en: 'Weapon poison causing tiredness and sluggishness: Betäubung II and Paralyse II / Betäubung I and Paralyse I. Does not stack: again only after the effect ends.' } },
   Freundfeind: { effect: {
      de: 'Gift der Schattenlande, oft als Pastille: sofort 1W6+1 SP und Blutrausch; danach 1 Stunde Verwirrung I, in der man Freunde und Geliebte vergisst.',
      en: 'A poison of the Shadowlands, often pressed into pastilles: 1W6+1 SP at once and Blutrausch; afterwards Verwirrung I for 1 hour, forgetting friends and loved ones.' } },
   Halbgift: { effect: {
      de: 'Lässt das Opfer schrumpfen: AT und VW −50 %, Körpertalente −2 (außer Selbstbeherrschung, Sinnesschärfe), eine Größenkategorie kleiner / AT und VW −25 %, Körpertalente −1, drei Viertel der Größe.',
      en: 'Shrinks the victim: AT and defence −50 %, physical skills −2 (except Selbstbeherrschung, Sinnesschärfe), one size category smaller / AT and defence −25 %, physical skills −1, three quarters of their size.' } },
   'Lichtnebler-Beutel': { effect: {
      de: 'Ätzender Sporenbeutel (Wurfwaffen 5/10/15, Ausweichen möglich, Selbstbeherrschung −2 gegen das Einatmen): Sicht I im Umkreis von 5 Schritt und Säure auf unbedeckter Haut wie auf großer / kleiner Fläche, bis man sie abwäscht; eingeatmet Säure am ganzen Körper für 3 / 1 KR.',
      en: 'Caustic spore pouch (Wurfwaffen 5/10/15, can be dodged, Selbstbeherrschung −2 against breathing it in): vision level I within 5 paces and acid on bare skin as for a large / small area until washed off; inhaled, acid on the whole body for 3 / 1 KR.' } },
   'Lotosöl': { effect: {
      de: 'Waffengift des Namenlosenkults gegen Diener der Zwölfgötter: 4W6 SP / 2W6 SP, nur bei Geweihten, deren Tradition nicht der Namenlose Kult ist.',
      en: 'Weapon poison of the Nameless cult against servants of the Twelve: 4W6 SP / 2W6 SP, only against priests whose tradition is not the Nameless cult.' } },
   'Merach-Extrakt': { effect: {
      de: 'Geruch- und geschmacklos, unauffällig in Speisen und Getränken: 1 SP je KR.',
      en: 'Odourless and tasteless, easily hidden in food and drink: 1 SP per KR.' } },
   Purpurblitz: { effect: {
      de: 'Das gefährlichste Gift Aventuriens, nach dem Tod nicht nachweisbar: 1W6 SP / 1W3 SP je KR und purpurner Nebel vor den Augen (Verwirrung I).',
      en: 'The deadliest poison of Aventuria, untraceable after death: 1W6 SP / 1W3 SP per KR and purple mist before the eyes (Verwirrung I).' } },
   Schlafgift: { effect: {
      de: 'Heimlich in Getränken verabreicht: bewusstlos / Betäubung I. Billiger, aber weniger sicher als mineralische Schlafgifte.',
      en: 'Slipped into drinks: unconscious / Betäubung I. Cheaper but less reliable than mineral sleeping poisons.' } },
   'Stabiles Zazamotoxin': { effect: {
      de: 'Wirkt nur gegen Dämonen (ZK −7): 2W6+7 SP je KR, kein Ausweichen in den Limbus, keine Unsichtbarkeit und Regeneration, GS halbiert; ihr Körper bleibt 3W6+7 Tage in der 3. Sphäre / 2W6 SP je KR, kein Limbus, GS halbiert, 3W6 Tage.',
      en: 'Works only against demons (ZK −7): 2W6+7 SP per KR, no escape into Limbus, no invisibility or regeneration, GS halved; their body stays 3W6+7 days in the 3rd sphere / 2W6 SP per KR, no Limbus, GS halved, 3W6 days.' } },
   Aufputschmittel: { effect: {
      de: 'Geschluckt: Selbstbeherrschung +2 und baut Betäubung I ab; Sinnesschärfe −1. Überdosis: 1W3 SP, danach kehrt die Betäubung mit einer Stufe mehr zurück. Sucht: 1–4 auf W20 bei jeder Anwendung.',
      en: 'Swallowed: Selbstbeherrschung +2 and removes Betäubung I; Sinnesschärfe −1. Overdose: 1W3 SP, afterwards the Betäubung returns with one more level. Addiction: 1–4 on W20 with every use.' } },
   Drachentrunk: { effect: {
      de: 'In 1 KR ausgetrunken prägt er sich alles Wahrgenommene unmittelbar danach unvergesslich ein, selbst über den Tod hinaus; nur Götterwirken löscht es. Überdosis: 1 Tag Verwirrung I, ab der 3. Dosis in 24 Stunden nur ein Sinn. Sucht: 1–2 auf W20 bei jeder 3. Anwendung.',
      en: 'Drunk within 1 KR, everything perceived right afterwards is memorised indelibly, even beyond death; only divine power erases it. Overdose: Verwirrung I for 1 day, from the 3rd dose in 24 hours only one sense. Addiction: 1–2 on W20 with every 3rd use.' } },
   'Dreh-Öl': { effect: {
      de: 'Auf Stirn oder Schläfen (auch über das Kissen eines Schlafenden): kehrt die Persönlichkeit ins Gegenteil (Vor- und Nachteile nach Meisterentscheid) und weckt Tatendrang; Willenskraft −QS hält ihn zurück. Brennt leicht. Sucht: 1–5 auf W20 bei jeder Anwendung.',
      en: 'On the forehead or temples (also via a sleeper’s pillow): turns the personality into its opposite (advantages and disadvantages at the GM’s call) and stirs an urge to act; Willenskraft −QS holds it back. Burns slightly. Addiction: 1–5 on W20 with every use.' } },
   'Feuerschlick-Essenz': { effect: {
      de: 'KL +1, KL-Teilproben bei Hellsichtzaubern und Wissenstalenten +2; nächste Regeneration +1 LeP und +1W3 AsP. Danach Betäubung I. Überdosis: 1W6 SP. Sucht: 1–4 auf W20 bei jeder Anwendung (Ilaris-Sucht).',
      en: 'KL +1, KL parts of clairvoyance spells and knowledge skills +2; next regeneration +1 LeP and +1W3 AsP. Afterwards Betäubung I. Overdose: 1W6 SP. Addiction: 1–4 on W20 with every use (Ilaris addiction).' } },
   'Feuerschlick-Pulver': { effect: {
      de: 'Geschnupft: KL-Teilproben bei Hellsichtzaubern und Wissenstalenten +2; danach 3 Stunden KL-Teilproben −1. Überdosis: 1W3 SP. Sucht: 1–3 auf W20 bei jeder Anwendung (Ilaris-Sucht).',
      en: 'Snorted: KL parts of clairvoyance spells and knowledge skills +2; afterwards KL parts −1 for 3 hours. Overdose: 1W3 SP. Addiction: 1–3 on W20 with every use (Ilaris addiction).' } },
   Katzenaugensalbe: { effect: {
      de: 'Auf die Lider gestrichen: Dunkelsicht I; bei Sonne oder hellem Licht alle Proben −2. Überdosis: 1W2 SP, 2 Stunden Verwirrung I. Sucht: 1–2 auf W20 bei jeder Anwendung.',
      en: 'Applied to the eyelids: Dunkelsicht I; in sunlight or bright light all checks −2. Overdose: 1W2 SP, Verwirrung I for 2 hours. Addiction: 1–2 on W20 with every use.' } },
   Regenbogenstaub: { effect: {
      de: 'Teure, gefährliche Traumdroge, geschnupft oder getrunken; die Wirkung hängt von der QS ab. Überdosis: 2W6 SP. Sucht: 1–5 auf W20 bei jeder Anwendung.',
      en: 'Costly, dangerous dream drug, snorted or drunk; the effect depends on the QS. Overdose: 2W6 SP. Addiction: 1–5 on W20 with every use.' },
      qualities: qs(
         ['4W6 SP und 1W3 Stunden Schlaf.', '3W6 SP, angenehme Träume; danach Willenskraft −2 gegen eine weitere Dosis, sonst 7 Stunden Apathie (Verwirrung II).',
            '2W6 SP, rauschhafte Träume; Willenskraft −3, sonst 5 Stunden Apathie.', '1W6 SP, farbenprächtige Träume; Willenskraft −4, sonst 3 Stunden Apathie.',
            '2W6 Stunden echt wirkende Träume ohne Nebenwirkungen.', '2W6 Stunden umgekrempeltes Bewusstsein, 1W20 auf der Tabelle S. 178: von Eigenschaftsboni und einem Extra-Schip bis zu Sucht und sofortigem Tod.'],
         ['4W6 SP and 1W3 hours of sleep.', '3W6 SP, pleasant dreams; afterwards Willenskraft −2 against another dose, or 7 hours of apathy (Verwirrung II).',
            '2W6 SP, intoxicating dreams; Willenskraft −3, or 5 hours of apathy.', '1W6 SP, colourful dreams; Willenskraft −4, or 3 hours of apathy.',
            'Realistic dreams for 2W6 hours without side effects.', 'Mind turned inside out for 2W6 hours, 1W20 on the table on p. 178: from attribute bonuses and an extra Schip to addiction and instant death.']) },
}
