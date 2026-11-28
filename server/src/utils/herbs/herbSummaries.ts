// Short summaries of the plant pages of Archiv der Kräuter, in own words (user decision, Nov 2026: no book prose).
// Raw effects per route and what a hero knows per QS of Pflanzenkunde (QS 1, 2, 3+). Written in batches of about
// 20 plants, each checked against its page (`python scripts/dsa5_pages.py <S.> --book kraeuter`).
// Plants without an entry show their values and page only.
import type { HerbSummary } from './herbTypes'

export const herbSummaries: Record<string, HerbSummary> = {
   // ---- Batch 1: AdK S. 11–32 (Alraune … Donf)
   Alraune: {
      eat: { de: 'Leicht giftig (Stufe 1, 1 SP, sofort).', en: 'Mildly poisonous (level 1, 1 SP, immediate).' },
      knowledge: [
         { de: 'Eine der begehrtesten alchimistischen Zutaten mit vielseitiger Wirkung.', en: 'One of the most sought-after alchemical ingredients, with many uses.' },
         { de: 'Soll häufiger dort wachsen, wo jemand gewaltsam starb.', en: 'Said to grow more often where someone died a violent death.' },
         { de: 'Ihr Sud verstärkt Elixiere; mächtige Hexen und Alchimisten sollen Alraunen zu Dienern beleben können.', en: 'Its brew strengthens elixirs; powerful witches and alchemists are said to bring mandrakes to life as servants.' },
      ],
   },
   Alveranie: {
      eat: { de: 'Heilt die magische Krankheit Guruk-Phaor (AdK S. 303, 250).', en: 'Cures the magical disease Guruk-Phaor (AdK p. 303, 250).' },
      knowledge: [
         { de: 'Blüht jeden Monat in der Farbe eines anderen der Zwölfgötter.', en: 'Blooms each month in the colour of another of the Twelve Gods.' },
         { de: 'Unsterblich, solange sie nicht gewaltsam zerstört wird (100 LeP).', en: 'Immortal unless destroyed by force (100 LeP).' },
         { de: 'Eine göttergefällige Tat kann sie heilen – und sie soll Göttergefällige heilen.', en: 'A deed pleasing to the gods can restore it, and it is said to heal the god-fearing.' },
      ],
   },
   'Aranische Wassernuss': {
      eat: { de: 'Roh leicht giftig (Stufe 1, 1W3 SP, sofort); Gefahr von Parasiten.', en: 'Raw: mildly poisonous (level 1, 1D3 SP, immediate); risk of parasites.' },
      knowledge: [
         { de: 'Wächst in stehenden Gewässern.', en: 'Grows in still water.' },
         { de: 'Getrocknete Schalen dienen als Krähenfüße gegen Verfolger.', en: 'Dried shells serve as caltrops against pursuers.' },
         { de: 'Gekochte Kerne sind ein Leckerbissen; roh verderben sie den Magen und übertragen Parasiten.', en: 'Cooked kernels are a delicacy; raw they upset the stomach and carry parasites.' },
      ],
   },
   Arganstrauch: {
      eat: { de: 'Wurzel: bei strikter Ruhe nach 7 Stunden 1W6+10 LeP; bei Anstrengung nur 1W6 LeP und 24 h Handlungsunfähig. Weitere Anwendungen in den 7 Stunden heilen erneut, geben aber je 2 Stufen Paralyse (24 h). Wundfieber-Chance 5 % statt 10 %.', en: 'Root: with strict rest, 1D6+10 LeP after 7 hours; with exertion only 1D6 LeP and incapacitated for 24 h. More doses within the 7 hours heal again but add 2 levels of Paralyse each (24 h). Wound fever chance 5 % instead of 10 %.' },
      knowledge: [
         { de: 'Braucht feuchte, sonnige Standorte.', en: 'Needs damp, sunny places.' },
         { de: 'Die Wurzelknolle ist ein starkes Heilmittel, das bei Ruhe besser wirkt.', en: 'The root tuber is a strong remedy that works better with rest.' },
         { de: 'Argansud wirkt binnen vier Stunden, verlangt aber absolute Ruhe.', en: 'Argan brew works within four hours but needs complete rest.' },
      ],
   },
   'Atan-Kiefer': {
      knowledge: [
         { de: 'Aus ihr wird das Universalheilmittel Atanax gewonnen.', en: 'The panacea Atanax is made from it.' },
         { de: 'Der Baum stirbt, wenn man ihm die ganze Rinde auf einmal nimmt.', en: 'The tree dies if all its bark is taken at once.' },
         { de: 'Atanax gehört zu den am häufigsten gefälschten Waren Aventuriens.', en: 'Atanax is one of the most often faked goods in Aventuria.' },
      ],
   },
   Atmon: {
      touch: { de: 'Wirkt erst verarbeitet als Atmonbrei.', en: 'Only works when made into Atmonbrei.' },
      eat: { de: 'Magenkrämpfe (Giftstufe 2, 1 Stufe Betäubung, 1W6 SP).', en: 'Stomach cramps (poison level 2, 1 level of Betäubung, 1D6 SP).' },
      knowledge: [
         { de: 'Gedeiht in kargen Gebieten nahe Bergen oder Wüsten.', en: 'Grows in barren land near mountains or deserts.' },
         { de: 'Ernte zur Blüte im Peraine; Atmonbrei äußerlich erleichtert körperliche Tätigkeiten.', en: 'Harvested in bloom in Peraine; Atmonbrei applied to the skin eases physical activity.' },
         { de: 'Roh eingenommen leicht giftig; als Brechmittel schwächt es kurz zuvor genommene Gifte.', en: 'Mildly poisonous when eaten raw; as an emetic it weakens poisons taken shortly before.' },
      ],
   },
   'Axorda-Baum': {
      inhale: { de: 'Wie Verzehr, wenn eine Anwendung Blütenkätzchen vollständig verbrannt und eingeatmet wird.', en: 'As eating, if one application of catkins is fully burned and inhaled.' },
      eat: { de: 'Blütenkätzchen: 1 Stufe Betäubung (nicht mehr bei weiteren Anwendungen in der Wirkungszeit) und je Anwendung 1W3 SP (Giftstufe 2).', en: 'Catkins: 1 level of Betäubung (no more for further doses while it lasts) and 1D3 SP per dose (poison level 2).' },
      knowledge: [
         { de: 'Ein Urwaldriese des Südens, der auf Maraskan wächst.', en: 'A giant of the southern jungle that grows on Maraskan.' },
         { de: 'Wächst erst ab 1.000 Schritt Höhe; aus der Rinde entsteht Xordai, das einzige bekannte Mittel gegen Zorganpocken.', en: 'Only grows above 1,000 paces; its bark yields Xordai, the only known cure for Zorgan pox.' },
         { de: 'Die Kätzchen wirken wie starker Alkohol; aus den Pollen entsteht ein Atemgift, das prophetische Eingebungen fördern soll.', en: 'The catkins act like strong drink; the pollen yields an inhaled poison said to bring prophetic visions.' },
      ],
   },
   Basilamine: {
      touch: { de: 'Säureschaden (RW S. 341): Die Schoten beschießen alle in bis zu 5 Schritt, solange sie im Radius bleiben; die Fläche legt die Spielleitung fest.', en: 'Acid damage (core rules p. 341): the pods shoot everyone within 5 paces while they stay in range; the GM sets the area.' },
      inhale: { de: 'Säureschaden verdoppelt (wie sehr starke Säure).', en: 'Acid damage doubled (as very strong acid).' },
      eat: { de: 'Säureschaden verdoppelt (wie sehr starke Säure).', en: 'Acid damage doubled (as very strong acid).' },
      knowledge: [
         { de: 'Reife Schoten platzen bei Erschütterung und verätzen die Haut.', en: 'Ripe pods burst when shaken and burn the skin.' },
         { de: 'Tarnt sich im Wuchs ihrer Nachbarn; nur im Ingerimm verraten sie rote Blüten.', en: 'Mimics the growth of its neighbours; only red flowers in Ingerimm give it away.' },
         { de: 'Ihre Säure kann sogar Rüstungen beschädigen.', en: 'Its acid can even damage armour.' },
      ],
   },
   Belmart: {
      eat: { de: 'Blätter: Status Krank und nicht übernatürliche Krankheiten wirken 24 h nicht (die Dauer läuft nicht ab). Ab der 2. Anwendung pro Woche 1W20: unter der Zahl der Anwendungen wirkt Belmart nicht mehr und es droht Belmartfieber (AdK S. 303). Sofort nach einer Vergiftung: Giftprobe mit ZK +1 wiederholen (gelungen = schwächere Wirkung, misslungen = keine); nicht gegen Gifte auf SK.', en: 'Leaves: the status Krank and non-supernatural diseases have no effect for 24 h (their duration does not run). From the 2nd dose a week roll 1D20: below the number of doses Belmart stops working and Belmart fever follows (AdK p. 303). Right after a poisoning: repeat the poison check with ZK +1 (success = weaker effect, failure = none); not against poisons resisted with SK.' },
      knowledge: [
         { de: 'Nutz- und Heilpflanze aus schattigen Wäldern; die Blätter heben Krankheitsfolgen für einen Tag auf.', en: 'A useful and healing plant of shady woods; its leaves suspend the effects of disease for a day.' },
         { de: 'Die Folgen kehren zurück; zu lange genommen verursacht es ein eigenes Fieber.', en: 'The effects come back; taken too long it causes a fever of its own.' },
         { de: 'Zutat für Fiebersaft und möglicher Ersatz für eine Antidot-Zutat.', en: 'Used for Fiebersaft and a possible substitute ingredient for Antidot.' },
      ],
   },
   Blauschirmpilz: {
      touch: { de: 'Sporen: Paktierer im Radius erleiden 1 Stufe Dämonische Auszehrung, Dämonen 1W6 SP pro KR; reinigt verseuchten Boden. Platzt der Pilz, verseucht er 30 Schritt und es wachsen 1W3 neue.', en: 'Spores: pact-bound in range suffer 1 level of demonic exhaustion, demons 1D6 SP per round; cleanses tainted soil. If it bursts it taints 30 paces and 1D3 new ones grow.' },
      inhale: { de: 'Sporen des geplatzten Pilzes giftig (Stufe 2, 1W3+1 SP pro KR für 3 KR).', en: 'Spores of a burst mushroom are poisonous (level 2, 1D3+1 SP per round for 3 rounds).' },
      eat: { de: 'In der Woche vor dem Platzen giftig (Stufe 2, 1W3+1 SP, sofort).', en: 'Poisonous in the week before it bursts (level 2, 1D3+1 SP, immediate).' },
      knowledge: [
         { de: 'Wächst nur auf dämonisch verseuchtem Boden, schwillt an und platzt.', en: 'Only grows on demonically tainted soil, swells and bursts.' },
         { de: 'Saugt dämonische Essenz aus dem Boden; ungeerntet verbreitet er sie beim Platzen weiter.', en: 'Draws demonic essence from the soil; if not harvested it spreads it when it bursts.' },
         { de: 'Vollgesogen geerntet und an einen sehr heißen oder kalten Ort gebracht, vergeht er; die weißen Sporen reinigen Boden.', en: 'Harvested when full and taken somewhere very hot or cold, it perishes; the white spores cleanse soil.' },
      ],
   },
   Bleichmohn: {
      eat: { de: '1W3+3 h die Abzüge von 2 Stufen Schmerz ignorieren (Stufe IV macht trotzdem handlungsunfähig); weitere Kapseln verlängern um je 1W3+3 h (max. 24 h). Je Anwendung 1W3 Erleichterung auf Selbstbeherrschung; über 2 gehen die Punkte reihum von KL, GE, IN, FF ab.', en: 'Ignore the penalties of 2 levels of Schmerz for 1D3+3 h (level IV still incapacitates); more capsules add 1D3+3 h each (max. 24 h). Each dose adds 1D3 to Selbstbeherrschung; points above 2 come off KL, GE, IN, FF in turn.' },
      knowledge: [
         { de: 'Gebirgspflanze mit weißen Blüten (Rahja bis Ingerimm); die Samenkapseln lindern Schmerzen.', en: 'A mountain plant with white flowers (Rahja to Ingerimm); its seed capsules ease pain.' },
         { de: 'Aus den Kapseln entsteht alchimistisch Schmerzwein.', en: 'Alchemists make Schmerzwein from the capsules.' },
         { de: 'Die rohen Kapseln wirken unterschiedlich stark; starke Exemplare berauschen.', en: 'Raw capsules vary in strength; strong ones intoxicate.' },
      ],
   },
   Blutblatt: {
      touch: { de: 'Bei Zauberern: bleibt bei Körperkontakt unbegrenzt frisch, der Zauberer verliert aber 1 AsP pro Tag.', en: 'With spellcasters: stays fresh indefinitely while touching the body, but the caster loses 1 AsP a day.' },
      knowledge: [
         { de: 'Wächst an astral durchzogenen Orten.', en: 'Grows in places suffused with astral power.' },
         { de: 'Nährt sich von Astralenergie, schwindet aber bei zu starker Konzentration (etwa an Artefakten).', en: 'Feeds on astral energy but withers where it is too concentrated (e.g. artefacts).' },
         { de: 'Dämonische Präsenz lässt es sofort verdorren.', en: 'Demonic presence withers it at once.' },
      ],
   },
   Boronie: {
      inhale: { de: 'Wie ein Grabsegen; Dämonen aus Thargunitoths Gefolge halten mindestens 5 Schritt Abstand (zerstören kann man sie aus der Ferne). Hält bis 5 h nach dem Entwurzeln; mehr Blüten schützen eine größere Fläche.', en: 'Works like a Grabsegen; demons of Thargunitoth’s host keep at least 5 paces away (they can destroy it from afar). Lasts until 5 h after uprooting; more blossoms protect a larger area.' },
      knowledge: [
         { de: 'Dem Boron zugeordnet und in Al’Anfa viel verwendet.', en: 'Sacred to Boron and much used in Al’Anfa.' },
         { de: 'Unheilige Wesen der Widersacherin Borons können sich einer blühenden Boronie nicht nähern.', en: 'Unholy beings of Boron’s adversary cannot approach a blooming boronia.' },
         { de: 'Verstärkt borongefälliges Götterwirken.', en: 'Strengthens divine works pleasing to Boron.' },
      ],
   },
   Boronsschlinge: {
      touch: { de: 'Wer nach dem Duft Betäubung erleidet und auf 1 Schritt herankommt, wird von Ranken gepackt (AT 12, 1W3 SP Säure pro KR, RW lang; 5 SP entfernen eine Ranke): Fixiert und Eingeengt bis zur Befreiung.', en: 'Anyone stunned by the scent within 1 pace is seized by tendrils (AT 12, 1D3 SP acid per round, long reach; 5 SP remove a tendril): Fixiert and Eingeengt until freed.' },
      inhale: { de: 'Duft: 2 Stufen Betäubung (Giftstufe 4), jede Stunde neu, kumulativ, unbemerkt bis zur nächsten Probe. Die verwandte Moorwurz löst Brechreiz aus (Giftstufe 3, 1 Stufe Betäubung, 1W3 SP).', en: 'Scent: 2 levels of Betäubung (poison level 4), again every hour, cumulative, unnoticed until the next check. The related Moorwurz causes nausea (poison level 3, 1 level of Betäubung, 1D3 SP).' },
      knowledge: [
         { de: 'Ihr Duft wirkt wie eine beruhigende Umarmung.', en: 'Its scent feels like a soothing embrace.' },
         { de: 'Verbreitet an schattigen Plätzen in Wäldern und Regenwäldern.', en: 'Common in shady spots of forests and rainforests.' },
         { de: 'Rasten in ihrer Nähe ist oft tödlich; sie reagiert auf Wärme und lässt sich so ablenken.', en: 'Resting near it is often deadly; it reacts to warmth and can be distracted that way.' },
      ],
   },
   Braunschlinge: {
      touch: { de: 'Greift an (INI 1W6+14, AT 15, RW lang, 20 LeP und RS 3 je Schlinge, 1W3 Schlingen; abgetrennt kämpfen sie weiter): umschlungen, 1W3+3 SP pro KR, Eingeengt. Sekret giftig (Stufe 3): 1 Stufe Paralyse und 2 SP pro KR für 4 KR. Befreien: Vergleichsprobe Kraftakt (Ziehen & Zerren) gegen FW 12 (14/14/14).', en: 'Attacks (INI 1D6+14, AT 15, long reach, 20 LeP and RS 3 per vine, 1D3 vines; severed vines keep fighting): entwined, 1D3+3 SP per round, Eingeengt. Sap is poisonous (level 3): 1 level of Paralyse and 2 SP per round for 4 rounds. Break free: competitive Kraftakt (Ziehen & Zerren) against FW 12 (14/14/14).' },
      eat: { de: 'Wie Berührung.', en: 'As touch.' },
      knowledge: [
         { de: 'Sieht aus wie ein verdorrter Farn; die Ranken werden bis zu 18 Schritt lang.', en: 'Looks like a withered fern; its vines reach 18 paces.' },
         { de: 'Spürt Erschütterungen und packt ab einem gewissen Gewicht gezielt an Hals und Handgelenken zu.', en: 'Senses vibrations and, above a certain weight, grabs at the throat and wrists.' },
         { de: 'Stumpfe Waffen wirken nicht, Klingen schon; das Sekret betäubt; in Blut eingelegt leben die Ranken lange weiter.', en: 'Blunt weapons do nothing, blades do; the sap stuns; kept in blood the vines live on for a long time.' },
      ],
   },
   Carlog: {
      eat: { de: 'Blüte: 1 Stunde Dunkelsicht I (mit Dunkelsicht I: II); bei Tageslicht Sicht Stufe 1, bei sehr hellem Licht zusätzlich 1 Stufe Verwirrung.', en: 'Flower: Dunkelsicht I for 1 hour (with Dunkelsicht I: II); in daylight vision level 1, in very bright light also 1 level of Verwirrung.' },
      knowledge: [
         { de: 'Wächst nahe größerer Gewässer, süß oder salzig.', en: 'Grows near larger waters, fresh or salt.' },
         { de: 'Weitet die Pupillen und verbessert die Sicht bei schlechtem Licht.', en: 'Widens the pupils and improves sight in poor light.' },
         { de: 'Helles Licht wird schwer erträglich; zeitweilige Blindheit und Schmerzen sind möglich.', en: 'Bright light becomes hard to bear; brief blindness and pain are possible.' },
      ],
   },
   'Cheria-Kaktus': {
      inhale: { de: 'Roh keine; Rauch wirkt nur verarbeitet (Cheriacha).', en: 'None raw; smoke only works when processed (Cheriacha).' },
      touch: { de: 'Ohne gelungene Bestimmungsprobe 1W6 TP durch Dornen; ab 1 SP wirkt das Gift: 1 Stufe Betäubung für 5 Minuten (Halluzinationen). Ein zweiter Stich wirkt genauso, weitere nur mit TP.', en: 'Without a successful identification check 1D6 TP from the spines; from 1 SP the poison works: 1 level of Betäubung for 5 minutes (hallucinations). A second prick does the same, more only deal TP.' },
      eat: { de: 'Fleisch: 1 Stufe Betäubung für 1 Minute (Halluzinationen); weitere Anwendungen erst nach 24 h wieder wirksam.', en: 'Flesh: 1 level of Betäubung for 1 minute (hallucinations); further doses only work again after 24 h.' },
      knowledge: [
         { de: 'Wächst in Wüstenrandgebieten, vor allem an der Khôm und im Szintotal.', en: 'Grows on desert fringes, mainly along the Khôm and the Szinto valley.' },
         { de: 'Dornen und Fleisch sind giftig und halluzinogen; bei der Ernte Hautkontakt meiden.', en: 'Spines and flesh are poisonous and hallucinogenic; avoid skin contact when harvesting.' },
         { de: 'Grundlage des Rauschmittels Cheriacha und Zutat im Weissagungspulver.', en: 'The basis of the drug Cheriacha and an ingredient of Weissagungspulver.' },
      ],
   },
   Chonchinis: {
      touch: { de: 'Brand- und Ätzwunden (Brennend, Feuerangriffe): sofort 1 LeP je Anwendung, bis 6 LeP je Regenerationsphase; heilt nur Schaden dieser Art.', en: 'Burns and acid wounds (Brennend, fire attacks): 1 LeP per application at once, up to 6 LeP per regeneration phase; only heals that kind of damage.' },
      knowledge: [
         { de: 'Wächst fast überall und ist als Heilkraut bekannt.', en: 'Grows almost everywhere and is known as a healing herb.' },
         { de: 'Der weiße Saft beugt verarbeitet Hautreizungen vor.', en: 'Its white sap, once processed, prevents skin irritation.' },
         { de: 'Leicht zu Brandsalbe zu verarbeiten, die dann aber nicht mehr vorbeugt.', en: 'Easily made into Brandsalbe, which then no longer prevents injury.' },
      ],
   },
   Dämonenklaue: {
      eat: { de: 'Giftig (Stufe 1): 1 Stufe Verwirrung, keine Regeneration in der nächsten Phase, 10 h; jede weitere Anwendung zusätzlich 1 Stufe Schmerz.', en: 'Poisonous (level 1): 1 level of Verwirrung, no regeneration in the next phase, 10 h; each further dose adds 1 level of Schmerz.' },
      knowledge: [
         { de: 'Giftpilz, geschätzt von Feenwesen und Schamanen.', en: 'A poisonous mushroom valued by fey and shamans.' },
         { de: 'Verwirrt, schmerzt und raubt Erholung; gefährlich erst bei wiederholter Einnahme.', en: 'Confuses, hurts and prevents rest; only dangerous when taken repeatedly.' },
         { de: 'Grundlage eines Rauschmittels, das den Geist für andere Sphären öffnen soll.', en: 'The basis of a drug said to open the mind to other spheres.' },
      ],
   },
   Dergolasch: {
      inhale: { de: 'Duftet nussig (keine Wirkung).', en: 'Smells nutty (no effect).' },
      eat: { de: 'Kurze Magenkrämpfe; je 2 Anwendungen 1 Stufe Betäubung, die auch Grünen Schleimpilz (AdK S. 49) aus dem Körper treibt.', en: 'Brief stomach cramps; every 2 doses cause 1 level of Betäubung, which also expels Green Slime Mould (AdK p. 49).' },
      knowledge: [
         { de: 'Heller Pilz feuchter, lichtloser Höhlen, leicht mit Speisepilzen zu verwechseln; roh verursacht er Übelkeit.', en: 'A pale mushroom of damp, dark caves, easily mistaken for edible ones; raw it causes nausea.' },
         { de: 'Dergolasch-Pulver lindert Ängste unter Tage; Zutat für Furchtlos-Tropfen.', en: 'Dergolasch powder eases fears underground; an ingredient of Furchtlos-Tropfen.' },
         { de: 'Roh gegessen wirkt er gegen Grünen Schleimpilz im Verdauungstrakt.', en: 'Eaten raw it works against Green Slime Mould in the gut.' },
      ],
   },
   Disdychonda: {
      touch: { de: 'Greift an (INI 14+1W6, AT 12, RW kurz, 1W6–1 TP, 20 LeP, RS 1); bei SP Gift (Stufe 2): 2W6 SP und 3 Stufen Paralyse für 5 Minuten. Raubnesseln (INI 12+1W6, AT 12, 1W6–2 TP, 5 LeP, RS 1) mit gleichem Gift greifen bis zum Verlassen des Feldes an.', en: 'Attacks (INI 14+1D6, AT 12, short reach, 1D6–1 TP, 20 LeP, RS 1); on SP its poison (level 2): 2D6 SP and 3 levels of Paralyse for 5 minutes. Young plants (INI 12+1D6, AT 12, 1D6–2 TP, 5 LeP, RS 1) with the same poison attack until one leaves the field.' },
      eat: { de: 'Extrakt eines Bodenblatts (oder 5 Raubnesseln): 1W6 SP und 1 Stufe Paralyse für 5 Minuten.', en: 'Extract of a ground leaf (or 5 young plants): 1D6 SP and 1 level of Paralyse for 5 minutes.' },
      knowledge: [
         { de: 'Die größte bekannte fleischfressende Pflanze: die Blüte schnappt zu und verdaut die Beute in Säure.', en: 'The largest known carnivorous plant: its flower snaps shut and digests prey in acid.' },
         { de: 'Tritt man auf die Bodenblätter, rollen sie sich um das Opfer und betäuben es mit Nesselgift; nach einem Fehlschlag folgt ein zweiter Versuch.', en: 'Stepping on its ground leaves makes them roll around the victim and stun it with nettle poison; after a miss a second try follows.' },
         { de: 'Junge Pflanzen wachsen in Feldern und reißen gemeinsam Reisende; nur die stärkste wird groß.', en: 'Young plants grow in fields and tear travellers apart together; only the strongest grows up.' },
      ],
   },
   Donf: {
      touch: { de: 'Ernte tückisch: bei 1–2 auf W6 Sturz in ein Schlammloch, außer Körperbeherrschung –1 gelingt (sonst 1W6 SP).', en: 'Harvesting is treacherous: on 1–2 on a D6 a fall into a mud hole unless Körperbeherrschung –1 succeeds (else 1D6 SP).' },
      eat: { de: 'Heilt Sumpffieber (RW S. 344) mit Ende der nächsten Regenerationsphase; andere gewöhnliche Fieberkrankheiten nehmen nur den schwächeren Verlauf.', en: 'Cures Sumpffieber (core rules p. 344) at the end of the next regeneration phase; other ordinary fevers only take their milder course.' },
      knowledge: [
         { de: 'Heilpflanze gegen Fieber; man kaut die frischen Stängel.', en: 'A healing plant against fever; one chews the fresh stalks.' },
         { de: 'Wächst meist im Sumpf, oft in überwucherten Schlammlöchern – Vorsicht bei der Ernte.', en: 'Mostly grows in swamps, often in overgrown mud holes; harvest with care.' },
         { de: 'Kleine Feenwesen schätzen die Donfblüte.', en: 'Small fey prize the donf blossom.' },
      ],
   },

   // ---- Batch 2: AdK S. 33–54 (Dornrose … Hollbeere)
   Dornrose: {
      touch: { de: 'Stacheln: 1W3+1 TP.', en: 'Thorns: 1D3+1 TP.' },
      inhale: { de: 'Giftig (Stufe 1): nach mindestens 1 Minute Duft 1 Stufe Verwirrung für 10 Minuten.', en: 'Poisonous (level 1): after at least 1 minute of the scent, 1 level of Verwirrung for 10 minutes.' },
      knowledge: [
         { de: 'Ihre Stacheln durchdringen selbst Lederrüstungen.', en: 'Its thorns pierce even leather armour.' },
         { de: 'Ihr Duft betört auf eine Rahja ungefällige Weise; seit dem Fall Orons ist ihr Anbau verboten.', en: 'Its scent beguiles in a way displeasing to Rahja; growing it has been forbidden since the fall of Oron.' },
         { de: 'Aus den Blütenblättern entsteht ein Öl, das aggressive Brunst auslöst.', en: 'Its petals yield an oil that causes aggressive lust.' },
      ],
   },
   Dracheneiranke: {
      eat: { de: 'Einen Samen kauen (max. 5 Minuten): alle Wahrnehmungen dieser Zeit wie mit eidetischem Gedächtnis merken. Mehr als eine Anwendung in 24 h löscht stattdessen die Erinnerungen an alle Einnahmezeiten dieser 24 h.', en: 'Chew a seed (max. 5 minutes): remember everything perceived meanwhile as with an eidetic memory. More than one dose in 24 h instead erases the memories of every chewing period of those 24 h.' },
      knowledge: [
         { de: 'Liebt warme, freie Standorte auf Ebenen, Hügeln oder im Gebirge; gelbgoldene Blüten, gerollte Astenden.', en: 'Likes warm, open places on plains, hills or mountains; golden-yellow flowers, curled shoots.' },
         { de: 'Die Samen reifen von Travia bis Boron und verbessern kurz das Gedächtnis; nur eine Anwendung am Tag.', en: 'The seeds ripen from Travia to Boron and briefly sharpen memory; only one dose a day.' },
         { de: 'Geht auf die Drachin Ishlunar im Khoram-Gebirge zurück; der Drachentrunk wirkt länger.', en: 'Traced back to the dragon Ishlunar of the Khoram mountains; Drachentrunk works longer.' },
      ],
   },
   Druidenwurz: {
      inhale: { de: 'Trockene oder verbrannte Teile: Niesreiz, in dieser KR keine normale Aktion (einmal je Kontakt).', en: 'Dried or burnt parts: a sneezing fit, no normal action this round (once per contact).' },
      eat: { de: 'Wurzel: Brechreiz, 1W3 SP und 1 Stufe Betäubung (Giftstufe 3); wiederholt nur noch SP, keine weitere Betäubung.', en: 'Root: vomiting, 1D3 SP and 1 level of Betäubung (poison level 3); repeated doses deal SP only, no more Betäubung.' },
      knowledge: [
         { de: 'Wächst in Misch- und Laubwäldern Mittelaventuriens; wirksam ist die Wurzel.', en: 'Grows in mixed and deciduous woods of central Aventuria; the root is the active part.' },
         { de: 'Riecht nach Pfeffer, am stärksten von Peraine bis Efferd; getrocknet ein Nies- und Brechmittel.', en: 'Smells of pepper, strongest from Peraine to Efferd; dried it makes one sneeze and vomit.' },
         { de: 'Leicht giftig; daraus entsteht ein Öl, das Menschen Dinge tun lässt, die sie sonst ablehnen.', en: 'Mildly poisonous; it yields an oil that makes people do things they would otherwise refuse.' },
      ],
   },
   Efeuer: {
      touch: { de: 'Kurz auf nackter Haut 1 SP; Durchqueren oder Beklettern 1W3 SP pro Schritt, ab dem 4. Schritt zusätzlich 1 Stufe Schmerz für 1 Stunde.', en: 'Brief contact on bare skin 1 SP; crossing or climbing it 1D3 SP per pace, from the 4th pace also 1 level of Schmerz for 1 hour.' },
      eat: { de: '1W3+3 SP und 1 Stufe Schmerz für 3 Stunden.', en: '1D3+3 SP and 1 level of Schmerz for 3 hours.' },
      knowledge: [
         { de: 'Gleicht harmlosem Efeu bis auf den roten Blattrand.', en: 'Looks like harmless ivy except for the red leaf edge.' },
         { de: 'Überwuchert Ruinen und verlassene Orte; bei Berührung juckender, brennender Ausschlag.', en: 'Overgrows ruins and abandoned places; touching it causes an itching, burning rash.' },
         { de: 'Kaum zu zerstören: zerschnitten wächst er wieder zusammen, Feuer schadet nur kurz vor Winterende.', en: 'Hard to destroy: cut apart it grows back together; fire only harms it shortly before the end of winter.' },
      ],
   },
   Egelschreck: {
      touch: { de: 'Auf eine kleine Wunde gerieben: sofort 1 LeP, einmal pro Tag.', en: 'Rubbed on a small wound: 1 LeP at once, once a day.' },
      eat: { de: 'Keine Wirkung (schmeckt seifig).', en: 'No effect (tastes of soap).' },
      knowledge: [
         { de: 'Vertreibt blutsaugende Parasiten; häufig in Sümpfen, gelegentlich in Flussauen und auf feuchten Wiesen.', en: 'Drives off blood-sucking parasites; common in swamps, sometimes in river meadows and damp fields.' },
         { de: 'Mit Fett und Kalk zur Egelschreckpaste verarbeitet hält sie Parasiten einen Tag fern; roh stillt sie Blutungen.', en: 'Made into a paste with fat and lime it keeps parasites away for a day; raw it stops bleeding.' },
         { de: 'Gut erforscht; manche schwören, sie halte sogar Vampire und Dämonen fern.', en: 'Well studied; some swear it even keeps vampires and demons away.' },
      ],
   },
   Eiterfarn: {
      touch: { de: 'Sekret: Status Blutrausch, 2 Stufen Verwirrung; 10 KR lang keine Erinnerung an Freunde – das Opfer greift den Nächsten an.', en: 'Sap: status Blutrausch, 2 levels of Verwirrung; for 10 rounds no memory of friends, the victim attacks whoever is closest.' },
      eat: { de: 'Wie Berührung, danach 1 Stufe Betäubung für 30 Minuten und Erbrechen; zum Schlucken Willenskraft (Bedrohungen standhalten) –1.', en: 'As touch, then 1 level of Betäubung for 30 minutes and vomiting; swallowing it needs Willenskraft (Bedrohungen standhalten) –1.' },
      knowledge: [
         { de: 'Knubbelige braune Stängel mit vertrocknet wirkenden Wedeln; bei Berührung platzt gelbes, stinkendes Sekret heraus.', en: 'Knobbly brown stalks with withered-looking fronds; touching them bursts out a yellow, stinking sap.' },
         { de: 'Das Sekret löst Angst, Gewaltfantasien und den Verlust von Geschick und Erinnerungen an geliebte Menschen aus.', en: 'The sap causes fear, violent fantasies and loss of dexterity and of memories of loved ones.' },
         { de: 'Dämonischen Ursprungs; vermutlich durch Balphemor von Punin in Wildermark und Transysilien verbreitet.', en: 'Of demonic origin; probably spread through the Wildermark and Transysilia by Balphemor of Punin.' },
      ],
   },
   'Eitriger Krötenschemel': {
      eat: { de: 'Giftig (Stufe 2): 1W6 SP, Erbrechen und Krämpfe, 1 Stufe Betäubung für 1 Stunde.', en: 'Poisonous (level 2): 1D6 SP, vomiting and cramps, 1 level of Betäubung for 1 hour.' },
      knowledge: [
         { de: 'Kürbisgroßer Pilz aus Maraskan, oft in Hexenringen und an seltsamen Orten.', en: 'A pumpkin-sized mushroom from Maraskan, often in witch rings and odd places.' },
         { de: 'Gegessen vergiftet er mit Krämpfen und Erbrechen; als Waffengift wirkt er stark; Zeichen: blaue Hände und Gesicht.', en: 'Eaten it poisons with cramps and vomiting; as a weapon poison it is strong; sign: blue hands and face.' },
         { de: 'Maraskantaranteln fressen ihn und machen sein Gift noch gefährlicher.', en: 'Maraskan tarantulas eat it and make its poison even more dangerous.' },
      ],
   },
   Färberlotos: {
      touch: { de: 'Saft färbt Augen (2 Paar je Anwendung, 1 SP je Auge) oder Haare für 1 Stunde, doppelte Menge 2 Stunden; auch für Schminke, Stoffe und Alchimika; im Dunkeln hält die Farbe.', en: 'The sap dyes eyes (2 pairs per application, 1 SP per eye) or hair for 1 hour, a double dose 2 hours; also for make-up, cloth and alchemica; kept from light the colour lasts.' },
      inhale: { de: 'Leicht giftig (Stufe 1, 1 SP je Anwendung).', en: 'Mildly poisonous (level 1, 1 SP per application).' },
      knowledge: [
         { de: 'Blüten in wechselnden Farben, meist gelb-, blau- oder rosastichig.', en: 'Blossoms in varying colours, mostly yellowish, bluish or pinkish.' },
         { de: 'Blütenstaub mindergiftig; gekochte Blätter und Samen essbar; die Farbe tönt Haar und Augen zeitweise.', en: 'Pollen mildly poisonous; cooked leaves and seeds are edible; the dye tints hair and eyes for a while.' },
         { de: 'Tarnt kurzzeitig misslungene Alchimika; im Tarnelixier mit Tarnblatt am stärksten.', en: 'Briefly disguises failed alchemica; strongest with Tarnblatt in Tarnelixier.' },
      ],
   },
   Felsenmilch: {
      inhale: { de: 'Der Geruch lockt Wühlschrate aus bis zu 3 Meilen an (bei 15–20 auf W20 verfolgen sie die Helden).', en: 'The smell draws Wühlschrate from up to 3 miles (on 15–20 on a D20 they follow the heroes).' },
      eat: { de: 'Eine Anwendung ernährt 5 Personen einen Tag. Goldgelbe Felsenmilch (1 auf W3): +1 LeP, AsP und KaP in der nächsten Regeneration.', en: 'One application feeds 5 people for a day. Golden Felsenmilch (1 on a D3): +1 LeP, AsP and KaP at the next regeneration.' },
      knowledge: [
         { de: 'Milchende Felsspalten stammen von einem Pilz, der Flüssigkeit speichert und durch Erdbewegungen verletzt wird.', en: 'Milk from rock clefts comes from a fungus that stores liquid and is broken by earth movements.' },
         { de: 'Sehr sättigend; frisch etwa 3 Tage haltbar, lässt sich aber haltbar machen.', en: 'Very filling; keeps about 3 days fresh but can be preserved.' },
         { de: 'Die Farbe zeigt den Zuckergehalt; goldgelbe ist am nahrhaftesten und macht glücklich.', en: 'Its colour shows the sugar content; the golden kind is most nourishing and makes one happy.' },
      ],
   },
   'Feuer- und Efferdsmoos': {
      touch: { de: 'Wer vorbei will, braucht Körperbeherrschung: je QS 1 Schritt unbeschadet; misslungen Status Brennend (kleine Fläche), mit Wasser große Fläche. Die jeweils andere Moosart beendet die Wirkung sofort.', en: 'Passing needs Körperbeherrschung: 1 pace unharmed per QS; on a failure status Brennend (small area), with water a large area. The other moss ends the effect at once.' },
      eat: { de: 'Wie Berührung.', en: 'As touch.' },
      knowledge: [
         { de: 'Leben in feuchten Höhlen, meist beide zusammen.', en: 'Live in damp caves, usually together.' },
         { de: 'Verletzt sondern sie ein ätzendes Sekret ab; Wasser verstärkt es statt es abzuwaschen.', en: 'When harmed they give off a caustic sap; water strengthens it instead of washing it off.' },
         { de: 'Gegenmittel ist das Sekret der anderen Art; Feuerpulver und Neckergel sind typische Rezepte.', en: 'The antidote is the other moss’s sap; Feuerpulver and Neckergel are typical recipes.' },
      ],
   },
   Feuerschlick: {
      eat: { de: 'Zum Schlucken Selbstbeherrschung –2. Nicht leuchtend: 3 h Wissenstalente und Hellsicht-Zauber +1. Leuchtend: +2, KL +1 und Regeneration LeP +1, AsP +1W6, danach eine Nacht voller Visionen. Wiederholt droht Ilaris-Sucht (AdK S. 302; 1–4 auf W20 ab der 2. Anwendung, Bedarf alle 1W3 Tage).', en: 'Swallowing needs Selbstbeherrschung –2. Not glowing: knowledge talents and Hellsicht spells +1 for 3 h. Glowing: +2, KL +1 and regeneration LeP +1, AsP +1D6, followed by a night of visions. Repeated use risks Ilaris addiction (AdK p. 302; 1–4 on a D20 from the 2nd dose, needed every 1D3 days).' },
      knowledge: [
         { de: 'Bildet an Araniens Küsten, vor allem vor Elburum, Teppiche im Schlick.', en: 'Forms carpets in the mud along Arania’s coasts, above all off Elburum.' },
         { de: 'Vermehrt sich rasend in der Hitze; bei Vollmond soll er orange leuchten.', en: 'Multiplies fast in heat; at full moon it is said to glow orange.' },
         { de: 'Hesindegeweihten heilig; Gelehrte schätzen ihn als Geistesmittel und fürchten die Sucht.', en: 'Holy to priests of Hesinde; scholars value it as a mental stimulant and fear the addiction.' },
      ],
   },
   Finage: {
      eat: { de: 'Frische Triebe mit einem Elixier der Tugend: dessen QS einmalig +1; bei 1–5 auf W20 für die Wirkungsdauer die Schlechte Eigenschaft Jähzorn.', en: 'Fresh shoots taken with an elixir of virtue: its QS +1 once; on 1–5 on a D20 the bad trait Jähzorn for its duration.' },
      knowledge: [
         { de: 'Wächst im Süden; die im Winter abblätternde Rinde gibt Verbandsmaterial; zieht Blutsauger an.', en: 'Grows in the south; the bark it sheds in winter makes bandages; attracts blood-suckers.' },
         { de: 'Junge Triebe im Peraine sind Teil vieler Tränke; Finagesud hilft gegen Schäden durch Magie und Gift.', en: 'Young shoots in Peraine go into many potions; Finage brew helps against harm from magic and poison.' },
         { de: 'Zu häufig genossen macht sie reizbar; Tugendelixiere profitieren von einem Trieb.', en: 'Taken too often it makes one irritable; elixirs of virtue benefit from a shoot.' },
      ],
   },
   Fünffingerkraut: {
      knowledge: [
         { de: 'Bildet wiesenartige Teppiche mit kniehohen Ähren, von Elfen viel geerntet; gutes Futter.', en: 'Forms meadow-like carpets with knee-high ears, much harvested by elves; good fodder.' },
         { de: 'Vor Ende des Praios geerntet ergibt es ein Elixier für eine ruhige Hand, beliebt bei Phex- und Firungläubigen.', en: 'Harvested before the end of Praios it yields an elixir for a steady hand, popular with followers of Phex and Firun.' },
         { de: 'In den Namenlosen Tagen geerntet soll das Elixier nur dem Namenlosen gefälligen Taten dienen.', en: 'Harvested in the Nameless Days the elixir is said to serve only deeds pleasing to the Nameless One.' },
      ],
   },
   'Grauer Lotos': {
      eat: { de: 'Keine Wirkung (zur Frucht gibt es nur Gerüchte, siehe Seite).', en: 'No effect (there are only rumours about the fruit, see the page).' },
      inhale: { de: 'Blütenstaub: der nächste Traum ist ein Albtraum von Untoten; je Minute 1 SP, keine Regeneration; das Opfer erwacht nicht von selbst, kann aber geweckt werden. Mehrfaches Einatmen ändert nichts.', en: 'Pollen: the next dream is a nightmare of undead; 1 SP per minute, no regeneration; the victim does not wake by itself but can be woken. Breathing more changes nothing.' },
      knowledge: [
         { de: 'Sieht aus wie verkümmerter, verwesender Lotos, ist aber eine eigene Art; der Blütenstaub ist giftig.', en: 'Looks like a stunted, rotting lotus but is its own kind; its pollen is poisonous.' },
         { de: 'Verursacht tödliche Albträume; schmerzt beim Einatmen nicht und fällt daher meist zu spät auf.', en: 'Causes deadly nightmares; it does not hurt when inhaled, so it is usually noticed too late.' },
         { de: 'Geweihte der Warunkei suchen und vernichten ihn gezielt.', en: 'Priests in the Warunkei hunt it down and destroy it.' },
      ],
   },
   'Grauer Mohn': {
      eat: { de: 'Samen (Giftstufe 4). Gelungen: 1W6 SP, nach 1 Minute immun gegen Schmerz und 4 Stufen Betäubung je 30 Minuten; die Seele löst sich vom Körper (Seelenwanderung mit Willenskraft –2; Rückkehr ab 250/500/1.000 Schritt –1/–2/–3, sonst stirbt der Körper). Misslungen: 1W3 SP, immun gegen Schmerz, 2 Stufen Betäubung je 15 Minuten. Giftheilmittel beenden es. Blüte: weiß 1 Stufe Furcht, grau 1 Stufe Betäubung, schwarz Überreden und Betören +1.', en: 'Seeds (poison level 4). Success: 1D6 SP, after 1 minute immune to Schmerz and 4 levels of Betäubung for 30 minutes each; the soul leaves the body (soul travel with Willenskraft –2; returning from 250/500/1,000 paces –1/–2/–3, otherwise the body dies). Failure: 1D3 SP, immune to Schmerz, 2 levels of Betäubung for 15 minutes each. Poison cures end it. Flower: white 1 level of Furcht, grey 1 level of Betäubung, black Überreden and Betören +1.' },
      knowledge: [
         { de: 'Blüht je nach Stadium weiß, schwarz oder grau und wirkt auf die Psyche.', en: 'Blooms white, black or grey depending on its stage and affects the mind.' },
         { de: 'Die Blüten wecken Angst, Freude oder Lethargie; der Samen betäubt völlig und löst die Seele vom Körper.', en: 'The flowers cause fear, joy or lethargy; the seed stuns completely and frees the soul from the body.' },
         { de: 'Mit dem Samen sind gefährliche Seelenwanderungen möglich.', en: 'The seed allows dangerous soul travel.' },
      ],
   },
   'Grüne Schleimschlange': {
      touch: { de: 'Keine Wirkung; ein überwucherter Kadaver kann 1 Stufe Furcht auslösen (Willenskraft –1). Bei toten Reisenden findet sich vielleicht noch Metall (Spielleitung).', en: 'No effect; an overgrown carcass can cause 1 level of Furcht (Willenskraft –1). Dead travellers may still carry metal goods (GM).' },
      knowledge: [
         { de: 'Lebt an Sümpfen, Mooren und Flussauen des Nordens; ihre langen Arme umschlingen Tiere und Menschen.', en: 'Lives by swamps, moors and river meadows of the north; its long arms wrap around animals and people.' },
         { de: 'Langsam und harmlos: sie nähert sich nur totem Gewebe und zersetzt es mit Schleim.', en: 'Slow and harmless: it only approaches dead tissue and dissolves it with slime.' },
         { de: 'Aus Wurzel und Samen lässt sich Schlingerbrot backen; auch Ersatzzutat für Heilmittel.', en: 'Root and seeds make Schlingerbrot; also a substitute ingredient for remedies.' },
      ],
   },
   'Grüner Schleimpilz': {
      inhale: { de: 'Roh keine; der aufbereitete Schleim wirkt (Pflanzliche Hilfsmittel).', en: 'None raw; the prepared slime works (plant remedies).' },
      eat: { de: 'Neues Anwendungsgebiet Bewegungsgespür (Sinnesschärfe): spürt Lebewesen ab Größe klein in 20 Schritt; bei mehr als 7 davon 1 Stufe Verwirrung (15 Minuten). Bleibt, bis Dergolasch den Pilz austreibt.', en: 'New application Bewegungsgespür (Sinnesschärfe): senses creatures of size small or larger within 20 paces; with more than 7 of them 1 level of Verwirrung (15 minutes). Lasts until Dergolasch expels the fungus.' },
      knowledge: [
         { de: 'Wächst in tiefen Höhlen, wo nie die Sonne scheint.', en: 'Grows in deep caves where the sun never shines.' },
         { de: 'Unter dem zähen Schleim ist er lecker und nahrhaft, hilft beim Sehen im Dunkeln und schärft das Gespür für Erschütterungen.', en: 'Under its tough slime it is tasty and nourishing, helps one see in the dark and sharpens the sense for tremors.' },
         { de: 'Getrockneter Schleim schützt vor Atemgiften; der Befall im Körper endet nur mit Dergolasch.', en: 'Dried slime protects against inhaled poisons; an infestation of the body only ends with Dergolasch.' },
      ],
   },
   Gulmond: {
      eat: { de: '12 Stunden die Abzüge von 2 Stufen Betäubung ignorieren; Betäubung IV macht trotzdem handlungsunfähig.', en: 'Ignore the penalties of 2 levels of Betäubung for 12 hours; Betäubung IV still incapacitates.' },
      knowledge: [
         { de: 'Strauch aus Steppen, Wäldern und Hochland; die Blätter (Frühling bis Herbst) stärken die Widerstandskraft.', en: 'A shrub of steppes, woods and highlands; its leaves (spring to autumn) strengthen resistance.' },
         { de: 'Roh, als frischer, getrockneter oder doppelter Tee – in dieser Reihenfolge stärker.', en: 'Raw, or as fresh, dried or double tea, stronger in that order.' },
         { de: 'Hilft über schwere Krankheitsphasen; höhere Dosen ziehen eher einen Kater nach sich.', en: 'Helps through the worst stages of severe illness; higher doses are more likely to leave a hangover.' },
      ],
   },
   Guraanstrauch: {
      touch: { de: 'Blüten färben Haut, Haare, Stoffe (hoch dosiert sogar Metall und Glas) strahlend blau; verblasst in 2 Wochen Sonnenlicht, nicht abwaschbar.', en: 'The flowers dye skin, hair, cloth (in high doses even metal and glass) bright blue; fades over 2 weeks in sunlight, cannot be washed off.' },
      inhale: { de: 'Ab 4 Anwendungen Blütenduft milder Rausch (1 Stufe Betäubung); Rachen und Zähne werden blau.', en: 'From 4 applications of the scent a mild intoxication (1 level of Betäubung); throat and teeth turn blue.' },
      eat: { de: 'Rachen und Zähne werden blau (verblasst wie oben).', en: 'Throat and teeth turn blue (fades as above).' },
      knowledge: [
         { de: 'Liefert den Saft für Hesindigo, ein unvergleichlich strahlendes, dauerhaftes Blau.', en: 'Provides the sap for Hesindigo, an unmatched bright and lasting blue.' },
         { de: 'Stammt aus dem Tiefen Süden, von den Waldinseln und aus dem Regengebirge; andere Farben halten schlechter.', en: 'Comes from the far south, the Forest Islands and the Rain Mountains; other colours from it last less.' },
         { de: 'Schon der Duft färbt Kleidung und Haut bis zu zwei Wochen und berauscht ähnlich wie Alkohol.', en: 'Even its scent dyes clothes and skin for up to two weeks and intoxicates much like alcohol.' },
      ],
   },
   Hiradwurz: {
      eat: { de: 'Gegen nicht magische, nicht dämonische Schlangengifte: 1 Anwendung schwächerer Verlauf, 2 beenden das Gift. Bei anderem Gift Schüttelfrost (1 Stufe Paralyse), bei 1–5 auf W20 zudem dessen stärkere Wirkung (bei Alkohol doppelte Stufen Berauscht). An mindestens 5 Tagen im Monat genommen: Schlangengift wirkt schwächer oder gar nicht.', en: 'Against non-magical, non-demonic snake venom: 1 dose gives the milder course, 2 end the venom. With another poison: shivering fits (1 level of Paralyse), and on 1–5 on a D20 its stronger effect (with alcohol double levels of Berauscht). Taken on at least 5 days a month: snake venom works weaker or not at all.' },
      knowledge: [
         { de: 'Wächst im Land der Ersten Sonne; die Wurzel soll viele Gifte beenden.', en: 'Grows in the Land of the First Sun; its root is said to end many poisons.' },
         { de: 'Tatsächlich nur Schlangengifte; regelmäßig gegessen macht sie teilweise resistent.', en: 'In truth only snake venoms; eaten regularly it gives partial resistance.' },
         { de: 'Bei anderen Giften droht gefährlicher Schüttelfrost; Hirad-Antidot kann vorübergehend blind machen.', en: 'With other poisons it risks dangerous shivering fits; Hirad-Antidot can cause brief blindness.' },
      ],
   },
   Hlûtharsiegel: {
      touch: { de: 'Im Umkreis von 6 Schritt gilt der Boden als allen Zwölfgöttern geweiht; endet beim Pflücken. Geister, Dämonen und Daimonide können die Pflanze nicht berühren oder ihr schaden.', en: 'Within 6 paces the ground counts as consecrated to all Twelve Gods; ends when it is picked. Spirits, demons and daimonids cannot touch or harm the plant.' },
      knowledge: [
         { de: 'Kniehohe Pflanze, die nur auf Gräbern von Geweihten und Heiligen wächst; man darf sie nicht pflücken.', en: 'A knee-high plant that only grows on the graves of priests and saints; it must not be picked.' },
         { de: 'Übernatürlich; schützt Grab und Umgebung; verletzt geht sie ein.', en: 'Supernatural; protects the grave and its surroundings; harmed, it dies.' },
         { de: 'Ihre seltenen Samen sind kostbar und gehören in einen Tempel.', en: 'Its rare seeds are precious and belong to a temple.' },
      ],
   },
   Hollbeere: {
      eat: { de: 'Je Fund W20: 2–6 Beere, 7–20 Blätter, 1 Glücksbeere (wie ein Glückssegen). Blättersud: LeP-Wurf der nächsten Regeneration wiederholen (höherer zählt). Beeren leicht giftig (Giftstufe 2, 1 SP, 1 Stufe Betäubung); 2 zugleich und Selbstbeherrschung gelungen: 1 Stunde Unverdauliches gefahrlos essen.', en: 'Per find a D20: 2–6 berry, 7–20 leaves, 1 lucky berry (like a Glückssegen). Leaf brew: reroll the LeP roll of the next regeneration (higher counts). Berries mildly poisonous (poison level 2, 1 SP, 1 level of Betäubung); 2 at once and a successful Selbstbeherrschung: eat indigestible things safely for 1 hour.' },
      knowledge: [
         { de: 'Rosa, kirschähnliche Beeren an Sträuchern nahe Wäldern; ursprünglich aus Nostria oder Albernia.', en: 'Pink, cherry-like berries on shrubs near woods; originally from Nostria or Albernia.' },
         { de: 'Die Beeren sind leicht giftig und lösen Erbrechen aus; für Tiere und Kinder gefährlich.', en: 'The berries are mildly poisonous and cause vomiting; dangerous for animals and children.' },
         { de: 'Getrocknete Blätter heilen im Schlaf; wer die Beeren behält, verdaut eine Weile Ungenießbares; selten eine Glücksbeere.', en: 'Dried leaves heal during sleep; keeping the berries down lets one digest the inedible for a while; rarely a lucky berry.' },
      ],
   },

   // ---- Batch 3: AdK S. 55–76 (Höllenkraut … Messergras)
   Höllenkraut: {
      eat: { de: 'Keine Wirkung; die Ranken sind extrem bitter und faserig.', en: 'No effect; the vines are extremely bitter and fibrous.' },
      knowledge: [
         { de: 'Windet sich um Regenwaldriesen und wächst rasend schnell in jede Lücke zum Licht.', en: 'Twines around rainforest giants and grows towards the light into any gap at great speed.' },
         { de: 'Mit kalkhaltigem Wasser eingekocht ergeben die Fasern das Jagdgift Wurara der Waldmenschen.', en: 'Boiled with limy water its fibres yield Wurara, the hunting poison of the forest folk.' },
         { de: 'Mit sympathetischen Zutaten wird daraus das Angstgift, das reiche Reisende im Süden zur Verteidigung tragen.', en: 'With sympathetic ingredients it becomes Angstgift, carried for self-defence by wealthy travellers in the south.' },
      ],
   },
   Horusche: {
      eat: { de: 'Kern: Kraftakt +1 für 10 Stunden; jeder weitere Kern in dieser Zeit gibt 1W6+4 SP und je +1 mehr (max. +5), ohne die Dauer zu verlängern.', en: 'Kernel: Kraftakt +1 for 10 hours; every further kernel in that time deals 1D6+4 SP and adds +1 more (max. +5) without extending the duration.' },
      knowledge: [
         { de: 'Rankt an hohen Bäumen und blüht alle drei Wochen blassviolett.', en: 'Climbs tall trees and blooms pale violet every three weeks.' },
         { de: 'Die Schoten tragen 1–3 schwarze Kerne, die roh Kraft geben; wiederholt vergiften sie.', en: 'The pods hold 1–3 black kernels that give strength raw; repeated, they poison.' },
         { de: 'Alchimisten zahlen gut: konzentriertes Öl hilft im Kampf und verstärkt Waffenbalsam.', en: 'Alchemists pay well: the concentrated oil helps in combat and strengthens Waffenbalsam.' },
      ],
   },
   Ilmenblatt: {
      inhale: { de: 'Duft und Rauch beruhigen: 1 Stufe Berauscht je Anwendung; bei 1 auf W6 danach Hunger oder Übelkeit (1 Stufe Betäubung).', en: 'Scent and smoke calm: 1 level of Berauscht per application; on 1 on a D6 hunger or nausea afterwards (1 level of Betäubung).' },
      eat: { de: 'Wie Einatmung.', en: 'As inhaled.' },
      knowledge: [
         { de: 'Wächst vor allem an der Westküste südlich von Drôl, auf den Zyklopeninseln und in Altoum; ein mildes Rauschmittel.', en: 'Grows mainly on the west coast south of Drôl, on the Cyclops Islands and in Altoum; a mild intoxicant.' },
         { de: 'Frisch gegessen oder getrocknet mit Tabak geraucht; das Harz der Stängel hält getrocknet jahrelang.', en: 'Eaten fresh or smoked dried with tobacco; the stalk resin keeps for years once dried.' },
         { de: 'Entspannt und stimmt friedlich; seine Essenz steckt in vielen Alchimika.', en: 'Relaxes and makes peaceful; its essence goes into many alchemica.' },
      ],
   },
   'Jacopo-Kraut': {
      inhale: { de: '1 Stufe Verwirrung; Geweihte zusätzlich 1 Stufe Entrückung.', en: '1 level of Verwirrung; priests also 1 level of Entrückung.' },
      knowledge: [
         { de: 'Liebt sonnenwarme Steine; gilt als Zutat der Feenküche.', en: 'Loves sun-warmed stones; known as an ingredient of fey cooking.' },
         { de: 'Feen sollen es auf Runensteinen, Altären und Ritualplätzen anbauen.', en: 'Fey are said to grow it on rune stones, altars and ritual sites.' },
         { de: 'Sein Duft bindet: wer ihn atmet, will es pflegen, kehrt zurück und nascht davon – so locken Feen Wanderer in ihre Reiche.', en: 'Its scent binds: whoever breathes it wants to tend it, returns and nibbles at it; so fey lure travellers into their realms.' },
      ],
   },
   Jagdgras: {
      touch: { de: 'Greift an und wurzelt in der Haut (INI 13+1W6, AT 13, RW kurz, 1W3+1 TP, 12 LeP, RS 1, GS 8); schleicht sich an Schlafende (Sinnesschärfe (Hinterhalt entdecken) –2). Ab 3 erlittenen SP wird 1 Stufe Schmerz abgebaut; Entfernen kostet 1W3 SP.', en: 'Attacks and roots in the skin (INI 13+1D6, AT 13, short reach, 1D3+1 TP, 12 LeP, RS 1, GS 8); creeps up on sleepers (Sinnesschärfe (Hinterhalt entdecken) –2). From 3 SP suffered 1 level of Schmerz is removed; pulling it out costs 1D3 SP.' },
      eat: { de: 'Lebend wie Berührung, tot keine Wirkung.', en: 'Alive as touch, dead no effect.' },
      knowledge: [
         { de: 'Man sagt, der Wind jage es vor sich her.', en: 'They say the wind chases it along.' },
         { de: 'Es bewegt sich selbst und verfolgt Mensch und Tier.', en: 'It moves by itself and follows people and animals.' },
         { de: 'Nachts setzt es sich auf Schlafende, schlägt Wurzeln und saugt ihnen das Leben aus.', en: 'At night it settles on sleepers, takes root and drains their life.' },
      ],
   },
   Jaguarlilie: {
      touch: { de: 'Nachts erscheint bei 17–20 auf W20 der Dämon Kah-Thurak-Arfai (AdK S. 251).', en: 'At night the demon Kah-Thurak-Arfai appears on 17–20 on a D20 (AdK p. 251).' },
      inhale: { de: 'Nur nachts: Pollen 1 Stufe Betäubung.', en: 'Only at night: pollen, 1 level of Betäubung.' },
      eat: { de: 'Blüten, Pollen: 2 Stufen Betäubung.', en: 'Flowers, pollen: 2 levels of Betäubung.' },
      knowledge: [
         { de: 'Öffnet nachts die Blüten und verströmt goldenen Blütenstaub, der im Fackelschein glitzert; tagsüber unscheinbar.', en: 'Opens at night and releases golden pollen that glitters in torchlight; plain by day.' },
         { de: 'Manche Nächte strahlt der Pollen magisch; sie wächst oft dort, wo viel Blut versickert ist.', en: 'Some nights the pollen has a magical aura; it often grows where much blood soaked the ground.' },
         { de: 'Wohnstatt des Nachtdämons Kah-Thurak-Arfai, der zwischen den Pflanzen wechselt.', en: 'Home of the night demon Kah-Thurak-Arfai, who moves between the plants.' },
      ],
   },
   Joruga: {
      eat: { de: 'Rohe Wurzel: Durchfall. Joruga-Öl: schützt 4 Monate vor Schwarzer Wut (nicht Tollwut); 3 Anwendungen binnen eines Tages nach Ansteckung senken das Risiko auf 1 auf W20 (Schwarze Wut) bzw. 1–4 (Tollwut).', en: 'Raw root: diarrhoea. Joruga oil: protects against Schwarze Wut for 4 months (not rabies); 3 doses within a day after exposure lower the risk to 1 on a D20 (Schwarze Wut) or 1–4 (rabies).' },
      knowledge: [
         { de: 'Gemeint ist meist die Wurzel aus Albernia, Andergast, Nostria oder den Nordmarken; Sud und Öl heilen.', en: 'Usually the root from Albernia, Andergast, Nostria or the Nordmarken; its brew and oil heal.' },
         { de: 'Jorugasud wirkt als Fiebersaft und hilft auch bei Schwarzer Wut und Tollwut.', en: 'Joruga brew works as Fiebersaft and also helps with Schwarze Wut and rabies.' },
         { de: 'Das Öl schützt vorab vor Schwarzer Wut und senkt nach einer Ansteckung das Risiko; mit Gulmond hilft es gegen Schlachtfeldfieber.', en: 'The oil protects against Schwarze Wut in advance and lowers the risk after exposure; with Gulmond it helps against battlefield fever.' },
      ],
   },
   Kairan: {
      touch: { de: 'Ohne Mondsilbermesser geerntet entweicht die Astralkraft sofort. Bei der ersten Berührung erscheint bei 1–3 auf W20 ein Astralgeist (AdK S. 254), bei 4–6 ist einer unbemerkt gebunden.', en: 'Harvested without a moon-silver knife the astral power escapes at once. At the first touch an astral spirit appears on 1–3 on a D20 (AdK p. 254); on 4–6 one is bound unnoticed.' },
      eat: { de: 'Mit gebundenem Astralgeist: Beschwerden, vor allem für Zauberer (AdK S. 254). Die Astralkraft löst sich erst nach dem Haltbarmachen.', en: 'With a bound astral spirit: ailments, worst for spellcasters (AdK p. 254). The astral power is only released once preserved.' },
      knowledge: [
         { de: 'Seltene, schachtelhalmähnliche Pflanze, die Astralenergie speichert.', en: 'A rare plant like horsetail that stores astral energy.' },
         { de: 'Wächst nur in sternenkraftdurchdrungenen Gewässern; Ernte mit Mondsilber, Lagerung im Seewasser; Grundlage des Zaubertranks.', en: 'Only grows in waters steeped in star power; harvested with moon silver and kept in the lake’s water; the basis of the Zaubertrank.' },
         { de: 'Astralgeister können die Halme heimsuchen; mancherorts ist die Ernte verboten oder beansprucht.', en: 'Astral spirits can haunt the stalks; in places harvesting is forbidden or claimed by someone.' },
      ],
   },
   Kajubo: {
      eat: { de: '15 Minuten unter Wasser bleiben, ohne Luft zu holen.', en: 'Stay underwater for 15 minutes without breathing.' },
      knowledge: [
         { de: 'Begehrt bei Seeleuten in Häfen und an Küsten: lässt unter Wasser „atmen“.', en: 'Sought by sailors in ports and on coasts: lets one “breathe” underwater.' },
         { de: 'Reger, oft blutiger Schmuggel; blüht viermal von Phex bis Travia, dann ziehen Banden zur Ernte aus.', en: 'Busy, often bloody smuggling; it blooms four times from Phex to Travia, when gangs set out for the harvest.' },
         { de: 'Es unterdrückt nur das Luftbedürfnis; frisch zwei Wochen haltbar, in Öl schwächer; Schiffsmagier verdienen am Konservieren.', en: 'It only suppresses the need for air; keeps two weeks fresh, weaker in oil; ship mages earn by preserving it.' },
      ],
   },
   Khômknolle: {
      eat: { de: 'Das Wasser einer Anwendung hält ein mittelgroßes Wesen 1W3 Tage in der Wüste am Leben. Die Schale ist hart (15 Strukturpunkte).', en: 'The water of one application keeps a medium-sized being alive in the desert for 1D3 days. The shell is hard (15 structure points).' },
      knowledge: [
         { de: 'Wächst in sehr trockenen Gegenden (Khôm, Gorien, Mhanadistan); oben nur unscheinbare Blätter.', en: 'Grows in very dry lands (Khôm, Gorien, Mhanadistan); only plain leaves above ground.' },
         { de: '2–3 Spann unter der Erde liegt ein großer Wasserspeicher; zum Öffnen braucht man Beil oder Klinge.', en: '2–3 spans underground lies a large water store; an axe or blade is needed to open it.' },
         { de: 'Ungeöffnet hält das Wasser etwa einen Monat und lässt sich transportieren.', en: 'Unopened the water keeps about a month and can be carried.' },
      ],
   },
   Klippenzahn: {
      touch: { de: 'Verbände mit dem Saft aus 4 Anwendungen lindern 1 Stufe Schmerz.', en: 'Bandages soaked in the sap of 4 applications ease 1 level of Schmerz.' },
      inhale: { de: 'Honigsüßer Duft (keine Wirkung).', en: 'Honey-sweet scent (no effect).' },
      eat: { de: 'Stängelsaft: LeP-Regeneration der nächsten Ruhephase +1 je Anwendung (max. 2); ZK gegen Wundfieber am Folgetag +1 je Anwendung (max. +3).', en: 'Stalk sap: LeP regeneration of the next rest +1 per application (max. 2); ZK against wound fever the next day +1 per application (max. +3).' },
      knowledge: [
         { de: 'Wächst in Felsritzen unwirtlicher Gegenden des Nordens.', en: 'Grows in rock crevices of the harsh north.' },
         { de: 'Sein Duft zieht Menschen und Tiere an.', en: 'Its scent attracts people and animals.' },
         { de: 'Der Saft senkt das Wundfieber-Risiko; die Blüten sind Hauptzutat von Techtals Elixier.', en: 'The sap lowers the risk of wound fever; the flowers are the main ingredient of Techtals Elixier.' },
      ],
   },
   Krakenseerose: {
      touch: { de: 'Greift an (INI 12+1W6, AT 12, TP 1W6+2, RW lang, 13 LeP, RS 0) und versucht einen Haltegriff (Kraftakt 7, 13/13/13).', en: 'Attacks (INI 12+1D6, AT 12, TP 1D6+2, long reach, 13 LeP, RS 0) and tries to grapple (Kraftakt 7, 13/13/13).' },
      eat: { de: 'Erbrechen: 1 Stufe Betäubung für 30 Minuten.', en: 'Vomiting: 1 level of Betäubung for 30 minutes.' },
      knowledge: [
         { de: 'Lebt in kleinen Tümpeln und tötet dort alles durch Ausscheidungen oder ihre Tentakel.', en: 'Lives in small ponds and kills everything there with its secretions or tentacles.' },
         { de: 'Eine daimonide Pflanze unklaren Zwecks; wie die Braunschlinge auch als umklammerndes Wurfgeschoss.', en: 'A daimonid plant of unknown purpose; like the Braunschlinge it can also be a clinging missile.' },
         { de: 'Zutat niederhöllischer Gebräue; ihre Ausscheidungen sind dämonisch.', en: 'An ingredient of infernal brews; its secretions are demonic.' },
      ],
   },
   Kukuka: {
      touch: { de: '2 Anwendungen Blätter: 1 Stufe Schmerz dieser Stelle 30 Minuten ignorieren.', en: '2 applications of leaves: ignore 1 level of Schmerz from that spot for 30 minutes.' },
      inhale: { de: 'Rauch von 1 Anwendung (tief eingeatmet): 3 Personen 1 Stunde immun gegen Schmerz; danach 12 Stunden kein Schlaf, dann 8 Stunden Tiefschlaf.', en: 'Smoke of 1 application (inhaled deeply): 3 people immune to Schmerz for 1 hour; then no sleep for 12 hours, then 8 hours of deep sleep.' },
      eat: { de: '3 Stunden immun gegen Schmerz, bestehende Stufen fallen sofort weg; danach 12 Stunden kein Schlaf, dann 8 Stunden Tiefschlaf.', en: 'Immune to Schmerz for 3 hours, existing levels vanish at once; then no sleep for 12 hours, then 8 hours of deep sleep.' },
      knowledge: [
         { de: 'Baum der Regenwälder im Schatten der Riesen, mit ausschließlich roten Blättern.', en: 'A rainforest tree in the shade of giants, with only red leaves.' },
         { de: 'Gekaute Blätter machen kurz schmerzresistent, danach folgt Schlaffheit.', en: 'Chewed leaves give brief resistance to pain, followed by lethargy.' },
         { de: 'In Wachs eingeschlossen transportierbar; Teil heilender Rezepturen.', en: 'Can be carried sealed in wax; part of healing recipes.' },
      ],
   },
   Libellengras: {
      touch: { de: 'Die Frucht klebt und hinterlässt süßlich stinkenden Schleim, der Insekten anzieht.', en: 'The fruit sticks and leaves a sweet-smelling slime that attracts insects.' },
      eat: { de: 'Erbrechen: 1 Stufe Betäubung für 30 Minuten.', en: 'Vomiting: 1 level of Betäubung for 30 minutes.' },
      knowledge: [
         { de: 'Schilf feuchter Böden mit leuchtend oranger Blüte und süß duftender Frucht.', en: 'A reed of damp ground with bright orange flowers and sweet-smelling fruit.' },
         { de: 'Tiere fressen die Frucht (Ingerimm/Rahja, Rondra/Efferd) und erbrechen sie – bitter, aber nahrhaft.', en: 'Animals eat the fruit (Ingerimm/Rahja, Rondra/Efferd) and vomit it up; bitter but nourishing.' },
         { de: 'Treibt gut: gebunden ein Floß für bis zu 80 Stein; die Frucht ist Hauptzutat des Scharfsinnelixiers.', en: 'Floats well: bound into a raft it carries up to 80 stone; the fruit is the main ingredient of Scharfsinnelixier.' },
      ],
   },
   Lichtnebler: {
      touch: { de: 'Bei Licht: Sporenwolke (3 Schritt), Sicht Stufe I und Säureschaden (kleine Fläche); Selbstbeherrschung +1, um nicht einzuatmen. Nur einmal je Pilz.', en: 'In light: a spore cloud (3 paces), vision level I and acid damage (small area); Selbstbeherrschung +1 not to breathe it in. Once per mushroom.' },
      inhale: { de: '2 KR Säureschaden wie am ganzen Körper.', en: 'Acid damage for 2 rounds as if to the whole body.' },
      eat: { de: 'Wie Einatmung; eine Minute nach der Ernte ist der Fruchtkörper harmlos und essbar.', en: 'As inhaled; one minute after harvest the fruiting body is harmless and edible.' },
      knowledge: [
         { de: 'Bovistartiger Pilz tiefer Höhlen.', en: 'A puffball-like mushroom of deep caves.' },
         { de: 'Nördlich von Neetha–Khunchom; schon schwaches Licht löst ätzende, orientierungsraubende Sporenwolken aus.', en: 'North of the Neetha–Khunchom line; even faint light sets off caustic spore clouds that confuse one’s bearings.' },
         { de: 'Aus den Sporen entsteht ein Atem- und Kontaktgift (Lichtnebler-Beutel); gefährlich, aber wirksam.', en: 'Its spores make an inhaled and contact poison (Lichtnebler-Beutel); dangerous but effective.' },
      ],
   },
   Lulanie: {
      eat: { de: 'Blütentee: beendet Blutrausch binnen 2 KR oder verhindert ihn für 30 Minuten; entfernt Furcht I.', en: 'Blossom tea: ends Blutrausch within 2 rounds or prevents it for 30 minutes; removes Furcht I.' },
      knowledge: [
         { de: 'Wächst im Schatten dichter Wälder; rote Glockenblüten, als Tee beruhigend.', en: 'Grows in the shade of dense woods; red bell flowers, calming as tea.' },
         { de: 'Lulanientrunk aus Blütenstaub und Alkohol verkürzt Lutanas und Raschen Wahn.', en: 'Lulanientrunk of pollen and spirits shortens Lutanas and Rascher Wahn.' },
         { de: 'Hexen verwenden sie in Liebesküchlein zum Verführen.', en: 'Witches use it in love cakes to seduce.' },
      ],
   },
   Madablüte: {
      touch: { de: 'Offene Blüte: 7 Schritt Friedfertigkeit – Angreifen nur mit Willenskraft –5 (Verteidigen geht); nicht für Untote, Dämonen, Golems; Feen und Werwesen werden angezogen. Wer sie dort betrachtet oder berührt, erhält KL +1 bis zum nächsten Vollmond.', en: 'Open flower: 7 paces of peacefulness; attacking needs Willenskraft –5 (defending is allowed); not for undead, demons, golems; fey and were-creatures are drawn to it. Whoever looks at or touches it there gains KL +1 until the next full moon.' },
      knowledge: [
         { de: 'Öffnet nur bei Vollmond ihre strahlend weiße Blüte.', en: 'Only opens its radiant white flower at full moon.' },
         { de: 'Zieht magische Wesen an und umgibt sich mit Friedfertigkeit; sie zu pflücken ist Frevel.', en: 'Draws magical beings and surrounds itself with peace; picking it is sacrilege.' },
         { de: 'Selten auch an Orten und Tempeln mit Verbindung zu Mada.', en: 'Rarely also found at places and temples linked to Mada.' },
      ],
   },
   Malomis: {
      inhale: { de: 'Duftet nach dem, was der Riechende gerade am berauschendsten findet: je Pflanze W6; wessen SK darunter liegt, ist so viele Minuten gebannt. Losreißen mit Selbstbeherrschung –1, sonst von vorn (höchstens zweimal).', en: 'Smells of whatever the smeller finds most intoxicating right now: a D6 per plant; anyone with SK below it is held for that many minutes. Breaking free needs Selbstbeherrschung –1, otherwise it starts again (at most twice).' },
      knowledge: [
         { de: 'Von dieser Pflanze hat der Held noch nie gehört.', en: 'The hero has never heard of this plant.' },
         { de: 'Aus ihren Blüten entsteht das berühmte Parfüm „1001 Rausch“.', en: 'Its blossoms make the famous perfume “1001 Rausch”.' },
         { de: 'Duftet für jeden verführerisch anders; ein Unbekannter brachte sie in den Tsatempel von Silas, wild wächst sie nirgends.', en: 'Smells tempting in a different way to everyone; a stranger brought it to the Tsa temple of Silas; it grows wild nowhere.' },
      ],
   },
   Margolasch: {
      eat: { de: 'Gebraten: +1 LeP in der nächsten Regeneration (nicht kumulativ). Roh abführend; das Gift lässt sich gewinnen (Pflanzliche Gifte).', en: 'Fried: +1 LeP at the next regeneration (not cumulative). Raw it is a laxative; its poison can be extracted (plant poisons).' },
      knowledge: [
         { de: 'Hellgrauer Speisepilz aus Albernia und dem Windhag, bei Zwergen sehr beliebt.', en: 'A pale grey edible mushroom from Albernia and the Windhag, much liked by dwarves.' },
         { de: 'Zwerge kaufen ihn in großen Mengen; gebraten verbessert er die nächtliche Regeneration.', en: 'Dwarves buy it in large amounts; fried it improves regeneration at night.' },
         { de: 'Roh leicht giftig und ein zuverlässiges Abführmittel, das kurz außer Gefecht setzt.', en: 'Raw it is mildly poisonous and a reliable laxative that briefly puts one out of action.' },
      ],
   },
   'Menchal-Kaktus': {
      touch: { de: 'Harmlose Stacheln. Der Saft halbiert je Anwendung einmal die SP eines bereits wirkenden Gifts (keine Heilung) und ersetzt eine Tagesration Wasser. Dschinne und Feen begehren die Blüten und erscheinen an wilden Pflanzen vielleicht von selbst (Spielleitung).', en: 'Harmless spines. Its sap halves the SP of a poison already working once per application (no healing) and counts as a day’s water. Djinn and fey covet the flowers and may turn up at wild plants (GM).' },
      eat: { de: 'Frische Blüten schmecken hervorragend; getrocknet ein besonderes Gewürz (siehe Haltbarkeit).', en: 'Fresh flowers taste excellent; dried they are a special spice (see shelf life).' },
      knowledge: [
         { de: 'Runder Kaktus wüstennaher Gebiete.', en: 'A round cactus of lands near deserts.' },
         { de: 'Das Fruchtfleisch speichert Wasser, der Saft mildert Gifte; Zutat für Antidot.', en: 'The flesh stores water, the sap softens poisons; an ingredient of Antidot.' },
         { de: 'Dschinne und Feen bieten für die Blüten Wünsche; frische Blüten zu Gestecken gebunden machen Feentore sichtbar.', en: 'Djinn and fey offer wishes for the flowers; fresh flowers made into wreaths reveal fey gates.' },
      ],
   },
   'Merach-Strauch': {
      eat: { de: 'Mit Alkohol 3 Tage vorher oder nachher: 1W20 SP je Bissen (eine Frucht = 5 Bissen) sofort und 1 Minute Handlungsunfähig. Gekocht ist das Gift unwirksam.', en: 'With alcohol within 3 days before or after: 1D20 SP per bite (one fruit = 5 bites) at once and 1 minute incapacitated. Cooking makes the poison harmless.' },
      knowledge: [
         { de: 'Trägt von Efferd bis Travia blaue, apfelähnliche, köstliche Früchte.', en: 'Bears delicious blue, apple-like fruit from Efferd to Travia.' },
         { de: 'Mit Alkohol im Körper wird die Frucht zu starkem Gift; überreife sind gefährlich; Kochen entgiftet.', en: 'With alcohol in the body the fruit becomes a strong poison; overripe ones are dangerous; cooking removes it.' },
         { de: 'Daraus entsteht der kaum herauszuschmeckende Merach-Extrakt der Meuchler.', en: 'It yields Merach extract, used by assassins and hard to taste.' },
      ],
   },
   Messergras: {
      touch: { de: 'Stumpfe Seite 1W6–1, scharfe 1W6+1 TP. Je Meile durch Messergras 1W6+3 TP; Körperbeherrschung (Akrobatik, Balance oder Springen): je QS 1 TP weniger.', en: 'Blunt side 1D6–1, sharp side 1D6+1 TP. Each mile through it 1D6+3 TP; Körperbeherrschung (Akrobatik, Balance or Springen): 1 TP less per QS.' },
      eat: { de: '1W6+1 SP durch Schnitte; kein Nährwert.', en: '1D6+1 SP from cuts; no nourishment.' },
      knowledge: [
         { de: 'Wächst in trockenen Steppen, Hochländern und an Wüstenrändern, vor allem zwischen Riva und Mengbilla.', en: 'Grows in dry steppes, highlands and desert fringes, mainly between Riva and Mengbilla.' },
         { de: 'Messerscharf, aber keine Waffe; dient als Skalpell; feuerfest, getrocknet so haltbar wie Stroh.', en: 'Razor-sharp but no weapon; used as a scalpel; fireproof, dried it lasts like straw.' },
         { de: 'Zu viel Wasser lässt es faulen.', en: 'Too much water makes it rot.' },
      ],
   },

   // ---- Batch 4: AdK S. 77–98 (Mibelrohr … Rauschgurke)
   Mibelrohr: {
      eat: { de: 'Roh keine Wirkung; Tee siehe Mibel-Absud.', en: 'No raw effect; for tea see Mibel-Absud.' },
      knowledge: [
         { de: 'Schilf der Feuchtländer an der Westküste zwischen Salza und Mengbilla; daraus wird Mibel-Absud gemacht.', en: 'A reed of the western wetlands between Salza and Mengbilla; Mibel-Absud is made from it.' },
         { de: 'Der Absud hebt kurz Klugheit und Gewandtheit, macht aber süchtig (Mibelsucht, AdK S. 302); Zutat für Gewandtheitselixier und Astraltränke.', en: 'The brew briefly raises cleverness and agility but is addictive (Mibelsucht, AdK p. 302); an ingredient of Gewandtheitselixier and astral potions.' },
         { de: 'Mibelsucht führt ohne regelmäßigen Absud zu völliger Apathie.', en: 'Without regular brew, Mibelsucht leads to complete apathy.' },
      ],
   },
   Mirbelstein: {
      inhale: { de: 'Die Knolle stinkt erbärmlich (keine Wirkung; der Geruch haftet nicht).', en: 'The tuber stinks terribly (no effect; the smell does not cling).' },
      knowledge: [
         { de: 'Unscheinbar wie ein bemooster Stein; außer der Mirbelfliege meiden ihn alle Insekten.', en: 'Inconspicuous like a mossy stone; all insects but the Mirbel fly avoid it.' },
         { de: 'Die getrocknete Knolle hält Insekten fern; der Gestank haftet nicht an anderem.', en: 'The dried tuber keeps insects away; its stench does not cling to anything.' },
         { de: 'Borbarad-Moskitos und maraskanische Insekten sind dagegen immun.', en: 'Borbarad mosquitoes and Maraskan insects are immune to it.' },
      ],
   },
   'Mirhamer Seidenliane': {
      touch: { de: 'Knotensaft brennt und juckt: 1 SP.', en: 'Knot sap burns and itches: 1 SP.' },
      knowledge: [
         { de: 'Schmarotzt in südlichen Regenwäldern an Baumriesen; Ranken mit Knoten, blassgelbe Blüte von Tsa bis Ingerimm.', en: 'A parasite on giant trees of the southern rainforests; knotted vines, pale yellow flowers from Tsa to Ingerimm.' },
         { de: 'Kaum unter eigenem Namen bekannt, wohl aber das Gift Kukris und die Seidenseile aus ihren Fasern.', en: 'Hardly known by name, but the poison Kukris and the silk ropes from its fibres are.' },
         { de: 'Kukris aus den Knoten ist sogar in Mengbilla verboten; das feine Seil nutzen Meuchler zum Einsteigen und Erdrosseln.', en: 'Kukris from the knots is illegal even in Mengbilla; assassins use the fine rope for climbing in and strangling.' },
      ],
   },
   'Moarana-Liane': {
      eat: { de: 'Gekaut: KO und KK +1 für 2 Stunden, danach Gliederschmerzen (1 Stufe Betäubung für 2 Stunden). Sucht bei 1–5 auf W20 je Anwendung; Bedarf alle 1W3 Tage.', en: 'Chewed: KO and KK +1 for 2 hours, then aching limbs (1 level of Betäubung for 2 hours). Addiction on 1–5 on a D20 per dose; needed every 1D3 days.' },
      knowledge: [
         { de: 'Wächst im Regenwald an kleineren Bäumen; getrocknet wie Süßholz gekaut steigert sie die Ausdauer.', en: 'Grows on smaller rainforest trees; dried and chewed like liquorice it raises stamina.' },
         { de: 'Zu oft genommen macht sie abhängig; aus ihr entsteht auch das Atemgift Boabungaha.', en: 'Taken too often it is addictive; it also yields the inhaled poison Boabungaha.' },
         { de: 'Waldmenschen kochen daraus einen Liebessaft für Potenz und Ausdauer – mit Müdigkeit, Gliederschmerzen und Suchtgefahr.', en: 'Forest folk boil it into a love potion for potency and stamina, with tiredness, aching limbs and risk of addiction.' },
      ],
   },
   Mordpilz: {
      touch: { de: 'Berührung des Geflechts: Befall bei 1–4 auf W20 (Mordpilzbefall, AdK S. 304).', en: 'Touching the mycelium: infestation on 1–4 on a D20 (Mordpilzbefall, AdK p. 304).' },
      inhale: { de: 'Bei trockener Luft Befall durch Sporen bei 1–8 auf W20 (AdK S. 304).', en: 'In dry air, infestation by spores on 1–8 on a D20 (AdK p. 304).' },
      eat: { de: 'Wie Berührung.', en: 'As touch.' },
      knowledge: [
         { de: 'Seltener weiß-gelber Pilz der Regenwälder, der nach Berührung oder Einatmen jedes Lebewesen befällt.', en: 'A rare white-to-yellow rainforest fungus that infests any living being after touch or inhalation.' },
         { de: 'Nach einem Tag zeigt sich das Geflecht, wandert nach innen und tötet.', en: 'After a day the mycelium appears, spreads inward and kills.' },
         { de: 'Heilbar durch starke, dauerhafte Unterkühlung binnen ein bis zwei Tagen.', en: 'Curable by strong, lasting chilling within one or two days.' },
      ],
   },
   Morgendornstrauch: {
      touch: { de: 'Ein Stich verwandelt binnen einer Woche in eine Sumpfranze (AdK S. 253; Verwandlungsmagie QS 4, aufzuheben mit Antimagie oder Liturgie in höchstens 8 Schritt vom Strauch). Eine ruhelose Seele lockt mit Klageliedern (Überreden 7, 13/13/13, gegen Willenskraft; 1 Netto-QS nähern, ab 2 berühren). Zwischen mehreren Sträuchern Körperbeherrschung +2, um sich nicht zu stechen.', en: 'A prick turns one into a Sumpfranze within a week (AdK p. 253; transformation magic QS 4, lifted by antimagic or a liturgy within 8 paces of the shrub). A restless soul lures with laments (Überreden 7, 13/13/13, against Willenskraft; 1 net QS: approach, 2+: touch). Among several shrubs Körperbeherrschung +2 to avoid a prick.' },
      knowledge: [
         { de: 'Pflanze nordaventurischer Moore; ein Stich verwandelt in eine Sumpfranze.', en: 'A plant of northern moors; a prick turns one into a Sumpfranze.' },
         { de: 'Die Blüten öffnen sich nur nachts; ihre Farbe verrät das Alter des Strauchs.', en: 'Its flowers only open at night; their colour shows the shrub’s age.' },
         { de: 'Irrlichter sind die Seelen der Verwandelten; nur mächtiges karmales oder arkanes Wirken hält die Verwandlung auf.', en: 'Will-o’-the-wisps are the souls of the transformed; only strong divine or arcane power stops the change.' },
      ],
   },
   Naftanstaude: {
      touch: { de: 'Saft einer Anwendung: 2W6 SP an organischem Material; klebt, lässt sich aber leicht abwischen.', en: 'Sap of one application: 2D6 SP to organic material; sticky but easy to wipe off.' },
      eat: { de: 'Wie Berührung.', en: 'As touch.' },
      knowledge: [
         { de: 'Riecht nach Verwesung, weil meist tote Tiere um sie liegen.', en: 'Smells of decay because dead animals usually lie around it.' },
         { de: 'Wächst fast überall; ihr stark ätzender goldgelber Saft ist Grundlage des Waffengifts Goldleim.', en: 'Grows almost everywhere; its strongly caustic golden sap is the basis of the weapon poison Goldleim.' },
         { de: 'Der Saft zersetzt alles Organische; Ernte mit Spezialgerät, Transport in Glas oder Keramik.', en: 'The sap dissolves anything organic; harvested with special tools and carried in glass or ceramics.' },
      ],
   },
   Neckerkraut: {
      eat: { de: 'Unterbricht Efferd- oder Kerkersieche für einen Tag; frisch schützt es eine Woche vor beiden. Mehr hilft nicht mehr.', en: 'Interrupts Efferdsieche or Kerkersieche for a day; fresh it protects against both for a week. More does not help more.' },
      knowledge: [
         { de: 'Liebt sandige Böden der Westküste: Strände, Sümpfe, Wiesen.', en: 'Likes the sandy soil of the west coast: beaches, swamps, meadows.' },
         { de: 'Frische Blätter beugen Kerker- und Efferdsieche vor; als Pillen haltbar gemacht heißt es Efferdhilf.', en: 'Fresh leaves prevent Kerkersieche and Efferdsieche; preserved as pills it is called Efferdhilf.' },
         { de: 'Bestandteil des Purpurwassers, das endlose Tauchgänge erlauben soll.', en: 'An ingredient of Purpurwasser, said to allow endless dives.' },
      ],
   },
   Nemezijn: {
      touch: { de: 'Nemezijn rächt sich.', en: 'Nemezijn takes revenge.' },
      inhale: { de: 'Nemezijn rächt sich.', en: 'Nemezijn takes revenge.' },
      eat: { de: 'Nemezijn rächt sich.', en: 'Nemezijn takes revenge.' },
      knowledge: [
         { de: 'Von einem Nemezijn hat der Held noch nie gehört.', en: 'The hero has never heard of a Nemezijn.' },
         { de: 'Maraskanisches Wort für einen unversöhnlichen Rachegeist, der bis ans Ende der Welt folgt.', en: 'A Maraskan word for an implacable spirit of vengeance that follows one to the end of the world.' },
         { de: 'Ein sagenhafter Baum, der jede Berührung rächt und seine Saat in jeder Pflanzengestalt aussendet.', en: 'A legendary tree that avenges every touch and sends its seed out in any plant form.' },
      ],
   },
   Nothilf: {
      touch: { de: 'Frische Blätter auf einer Brandwunde: Heilkunde Wunden +1.', en: 'Fresh leaves on a burn: Heilkunde Wunden +1.' },
      knowledge: [
         { de: 'Ranker an Eichen um die Salamandersteine; als Brandhilf fördert er die Genesung von Brandwunden (nicht bei Zwergen).', en: 'A climber on oaks around the Salamander Stones; as Brandhilf it helps burns heal (not for dwarves).' },
         { de: 'Die rosa Blüten in Öl ergeben Nothilf-Lösung, ein Gegengift gegen Tulmadron.', en: 'Its pink flowers in oil make Nothilf solution, an antidote to Tulmadron.' },
         { de: 'Die Blüten gehen vor allem in den Süden; der Handel ist lukrativ.', en: 'The flowers are mostly exported south; the trade is lucrative.' },
      ],
   },
   Olginwurz: {
      eat: { de: 'Frisch mit Alkohol: ein wirkendes Gift oder eine Krankheit nimmt sofort den schwächeren Verlauf; war er schon schwach, endet es nach 5 Minuten. Wirkungslos gegen Übernatürliches.', en: 'Fresh with spirits: a working poison or disease takes its milder course at once; if it already was mild, it ends after 5 minutes. No effect on supernatural ones.' },
      knowledge: [
         { de: 'Bekannt, begehrt und sehr selten (Raschtulswall); frisch hilft sie gegen natürliche Krankheiten und Gifte.', en: 'Well known, much sought and very rare (Raschtulswall); fresh it helps against natural diseases and poisons.' },
         { de: 'Bildet Moosballen; Olginsud schützt eine Woche vor allen natürlichen Krankheiten und Giften.', en: 'Forms moss balls; Olgin brew protects against all natural diseases and poisons for a week.' },
         { de: 'Der Sud schützt nur, heilt aber nicht; frische Wurz ist Hauptzutat des Konstitutionselixiers.', en: 'The brew only protects, it does not heal; the fresh root is the main ingredient of Konstitutionselixier.' },
      ],
   },
   Orazal: {
      touch: { de: 'Saft frischer Schlingen: 2W6 SP Säure pro KR an Organischem für 6 KR oder bis entfernt; sonnenwarmer Saft klebt – von der Haut nur mit Selbstbeherrschung (1W6 SP).', en: 'Sap of fresh vines: 2D6 SP acid per round to organic material for 6 rounds or until removed; sun-warmed sap sticks, off the skin only with Selbstbeherrschung (1D6 SP).' },
      inhale: { de: 'Rauch verholzter Teile: Sicht Stufe 1 und 1 Stufe Schmerz.', en: 'Smoke of woody parts: vision level 1 and 1 level of Schmerz.' },
      eat: { de: 'Schaden wie Berührung; erwärmter Saft lässt sich nicht entfernen.', en: 'Damage as touch; warmed sap cannot be removed.' },
      knowledge: [
         { de: 'Schlingpflanze, die Bäume „erdrosseln“ kann; daraus entsteht das verbreitete Konservierungsmittel Schwefliger Orazal.', en: 'A climber that can “strangle” trees; it yields the common preservative Schwefliger Orazal.' },
         { de: 'Der ätzende Saft frischer Schlingen erschwert die Ernte und dient für Orazalkleber; altes Holz gibt keinen Saft.', en: 'The caustic sap of fresh vines makes harvesting hard and is used for Orazalkleber; old wood gives no sap.' },
         { de: 'Erkennbar an großen blassgelben bis orangen Blüten (Leibspeise von Äffchen); der Rauch reizt Augen und Kopf.', en: 'Known by large pale yellow to orange flowers (loved by monkeys); its smoke stings the eyes and head.' },
      ],
   },
   'Orkland-Bovist': {
      touch: { de: 'Von Praios bis Rondra platzt er bei Berührung: Sporen in 5 Schritt, ausweichen mit Körperbeherrschung –5, sonst eingeatmet.', en: 'From Praios to Rondra it bursts when touched: spores within 5 paces, dodge with Körperbeherrschung –5, otherwise inhaled.' },
      inhale: { de: 'Husten (1 Stufe Betäubung); Gefahr von Lungenpilz (15–20 auf W20) oder Pilzflechte (3–14 auf W20), AdK S. 304.', en: 'Coughing (1 level of Betäubung); risk of lung fungus (15–20 on a D20) or fungal rash (3–14 on a D20), AdK p. 304.' },
      eat: { de: 'Reife Pilze wie Einatmung, sonst keine Wirkung.', en: 'Ripe ones as inhaled, otherwise no effect.' },
      knowledge: [
         { de: 'Bis zu 1 Schritt groß; wächst in kleinen Gruppen im nördlichen Hochland und den Orkland-Steppen.', en: 'Up to 1 pace wide; grows in small groups in the northern highlands and the Orcland steppes.' },
         { de: 'Reif im Hochsommer platzt er bei Erschütterung; die Sporen schaden der Lunge.', en: 'Ripe in high summer it bursts when jolted; the spores harm the lungs.' },
         { de: 'Folgen: Pilzflechte (raubt die Erholung im Schlaf) und Lungenpilz (behindert dauerhaft die Atmung).', en: 'Consequences: fungal rash (spoils rest in sleep) and lung fungus (lastingly hinders breathing).' },
      ],
   },
   Pestsporenpilz: {
      touch: { de: 'Wird die Sporenkapsel zerstört (Drauftreten, Häuten ohne Pflanzenkunde –1), werden Sporen in 1 Schritt frei.', en: 'If the spore capsule is broken (stepping on it, skinning it without Pflanzenkunde –1), spores are released within 1 pace.' },
      inhale: { de: '2W6+4 SP (Giftstufe 4).', en: '2D6+4 SP (poison level 4).' },
      eat: { de: 'Frische Sporenkapsel: 2W6+4 SP (Giftstufe 4).', en: 'Fresh spore capsule: 2D6+4 SP (poison level 4).' },
      knowledge: [
         { de: 'Kokosnussgroß mit rissiger, hirnähnlicher Haut; in Sümpfen und Grasländern des Nordens; giftige Sporen.', en: 'Coconut-sized with cracked, brain-like skin; in northern swamps and grasslands; poisonous spores.' },
         { de: 'Die Haut dient für Katzenaugensalbe und Erscheinungspulver und lässt sich wie Pergament beschreiben.', en: 'Its skin is used for Katzenaugensalbe and Erscheinungspulver and can be written on like parchment.' },
         { de: 'Die Sporen töten sofort, damit die Leiche den Pilz düngt; jeder Pilz sporuliert nur einmal.', en: 'The spores kill at once so the corpse feeds the fungus; each one releases spores only once.' },
      ],
   },
   Phosphorpilz: {
      touch: { de: 'Leuchtet nach dem Pflücken 30 Minuten: Dunkelheits-Sicht im Radius 1/2/3/4 Schritt um 4/3/2/1 Stufen besser; eine Tagesration Wasser verlängert um 3 Stunden.', en: 'Glows for 30 minutes after picking: darkness vision penalties reduced by 4/3/2/1 levels at a radius of 1/2/3/4 paces; a day’s water adds 3 hours.' },
      knowledge: [
         { de: 'Wächst an Wänden von Höhlen und Gängen, oft als Geflecht oder Teppich.', en: 'Grows on the walls of caves and tunnels, often as a web or carpet.' },
         { de: 'Leuchtmittel unter Tage, heller bei Feuchtigkeit; abgeschnitten leuchtet er eine Weile weiter.', en: 'A light source underground, brighter when damp; cut off it keeps glowing for a while.' },
         { de: 'Getrocknet gibt er im Feuer grüne Stichflammen; alchimistisch wird daraus Kaltes Licht.', en: 'Dried, it makes tall green flames in fire; alchemy turns it into Kaltes Licht.' },
      ],
   },
   Purpurmohn: {
      inhale: { de: 'Wie Verzehr, wenn der Rauch einer Samenkapsel vollständig und tief eingeatmet wird.', en: 'As eaten, if the smoke of a seed capsule is inhaled fully and deeply.' },
      eat: { de: 'Giftig (Stufe 6, Widerstand SK, Beginn nach 5 Minuten, Dauer 3W6 × 5 Minuten): 2 Stufen Berauscht, stark erregt / 1 Stufe, leicht erregt. Danach ebenso lange 1 Stufe Betäubung und 1 Stufe Paralyse. Jede Anwendung prüft Purpursucht (AdK S. 302); weitere in der Wirkungszeit je 1 Stufe Betäubung und 1W3+1 LeP.', en: 'Poisonous (level 6, resisted with SK, starts after 5 minutes, lasts 3D6 × 5 minutes): 2 levels of Berauscht, highly excited / 1 level, mildly excited. Afterwards 1 level of Betäubung and 1 level of Paralyse for as long. Each dose checks for Purpursucht (AdK p. 302); more during the effect add 1 level of Betäubung and lose 1D3+1 LeP each.' },
      knowledge: [
         { de: 'Liebt warmes, gemäßigtes Klima; heimisch im Süden.', en: 'Likes a warm, mild climate; native to the south.' },
         { de: 'Zum Jahresende goldener Blütenrand; berauschender Duft; die Samen machen gefährlich süchtig (Purpursucht).', en: 'A golden flower edge at year’s end; intoxicating scent; the seeds cause dangerous addiction (Purpursucht).' },
         { de: 'Ernte an der geschlossenen Kapsel; in den Namenlosen Tagen streut er goldene Samen und gilt daher als Pflanze des Dreizehnten.', en: 'Harvest the closed capsule; in the Nameless Days it scatters golden seeds and so is linked to the Thirteenth.' },
      ],
   },
   'Purpurner Lotos': {
      inhale: { de: 'Pollen giftig (Stufe 1): 1W6 SP und 1 Stufe Betäubung, 5 Minuten je Atemzug.', en: 'Pollen poisonous (level 1): 1D6 SP and 1 level of Betäubung, 5 minutes per breath.' },
      knowledge: [
         { de: 'Verrufen als Pflanze des Namenlosen; das Gift kommt mit den Pollen, zur Blüte ist die Nähe gefährlich.', en: 'Notorious as a plant of the Nameless One; the poison comes with the pollen, so being near it in bloom is dangerous.' },
         { de: 'Aus ihm entsteht Purpurblitz, das grausamste und kaum nachweisbare alchimistische Gift.', en: 'It yields Purpurblitz, the cruellest and barely detectable alchemical poison.' },
         { de: 'Neu: Lotosöl des Namenlosenkults, das Dienern der Zwölfgötter schadet.', en: 'New: Lotosöl of the Nameless cult, which harms servants of the Twelve.' },
      ],
   },
   Quasselwurz: {
      eat: { de: 'Redeschwall für 2W6 × 5 Minuten: ein Geheimnis zu wahren verlangt Willenskraft, ab dem 2. Intervall je –1 mehr; ein Zuhörer lenkt das Thema mit Überreden –3.', en: 'A flood of talk for 2D6 × 5 minutes: keeping a secret needs Willenskraft, –1 more from the 2nd interval on; a listener steers the topic with Überreden –3.' },
      knowledge: [
         { de: 'Gilt beim Volk als Hexenkraut, ohne dass jemand recht weiß, warum.', en: 'Common folk call it a witch herb without quite knowing why.' },
         { de: 'Liegt in Hexen- und Druidenküchen oft in Mengen bereit, angeblich als Glücksbringer.', en: 'Kept in large amounts in witches’ and druids’ kitchens, supposedly as a lucky charm.' },
         { de: 'Löst die Zunge und macht unvorsichtig; herb-stumpf herauszuschmecken, von Basiliskum gut überdeckt.', en: 'Loosens the tongue and makes one careless; tastes harsh and dull, well hidden by basil.' },
      ],
   },
   Quinja: {
      eat: { de: 'Beere: KK +1 für 2 Stunden (mehrere nicht mehr). Sud aus Quinja, Sansaro und Donf schützt 5 Monate vor Jahresfieber. Die ähnliche Scheinquinja vergiftet (Stufe 2, Sicht Stufe I für 3 Stunden, 3 SP); Sinnesschärfe, erleichtert um die QS der Pflanzenkunde, erkennt sie.', en: 'Berry: KK +1 for 2 hours (several do no more). A brew of Quinja, Sansaro and Donf protects against annual fever for 5 months. The similar false quinja poisons (level 2, vision level I for 3 hours, 3 SP); Sinnesschärfe, eased by the QS of Pflanzenkunde, tells them apart.' },
      knowledge: [
         { de: 'Liebt Wärme an schattigen Plätzen; leuchtend rote Beeren für Quinja-Schnaps.', en: 'Likes warmth in shady spots; bright red berries for Quinja schnapps.' },
         { de: 'Die Beeren stärken zwei Stunden, verderben aber vor Tagesende; die giftige Falsche Quinja hat rosa Blüten und schmeckt süßer.', en: 'The berries give strength for two hours but spoil within the day; the poisonous false quinja has pink flowers and tastes sweeter.' },
         { de: 'Der Sud mit Sansaro und Donf schützt vor Jahresfieber; Ersatzzutat für Elixiere der Tugenden.', en: 'The brew with Sansaro and Donf protects against annual fever; a substitute for elixirs of virtue.' },
      ],
   },
   Rahjalieb: {
      eat: { de: 'Verhütet 1W3+1 Tage die Empfängnis (auch als Tee aus getrockneten Blättern); nicht bei Achaz.', en: 'Prevents conception for 1D3+1 days (also as tea from dried leaves); not for Achaz.' },
      knowledge: [
         { de: 'Bekanntes Verhütungsmittel mit gekräuselten Blättern und herzförmigen Blüten; überall südlich von Festum an schattigen Plätzen.', en: 'A well-known contraceptive with curly leaves and heart-shaped petals; found in shade everywhere south of Festum.' },
         { de: 'Getrocknet als Tee erhältlich.', en: 'Available dried for tea.' },
         { de: 'Auch Zutat für Liebestränke, richtig verbunden soll es die Lust steigern.', en: 'Also an ingredient of love potions; properly combined it is said to raise desire.' },
      ],
   },
   Rattenpilz: {
      touch: { de: 'Geweihte (außer des Namenlosen) stecken sich bei 11–20 auf W20 mit Zorganpocken an (RW S. 344).', en: 'Priests (except of the Nameless One) catch Zorgan pox on 11–20 on a D20 (core rules p. 344).' },
      inhale: { de: 'Die Spielleitung würfelt eine Giftprobe (Stufe 3, erschwert um die SK): gelungen, ergreifen Namenlose Zweifel den Helden.', en: 'The GM rolls a poison check (level 3, made harder by the SK): on a success, Nameless doubts take hold of the hero.' },
      eat: { de: 'Wie Berührung und Einatmung.', en: 'As touch and inhaled.' },
      knowledge: [
         { de: 'Wächst, wo der Namenlose Macht hat, und lockt mit schmackhaftem Duft.', en: 'Grows where the Nameless One holds power and lures with a tasty smell.' },
         { de: 'Gegessen oder lange eingeatmet weckt er Namenlose Zweifel; Geweihte anderer Götter können schon durch Berührung an Zorganpocken erkranken.', en: 'Eaten or long inhaled it brings Nameless doubts; priests of other gods can catch Zorgan pox just by touching it.' },
         { de: 'Sein Gift lässt sich als würziger Sud heimlich verabreichen; Namenlosendiener mischen ihn in Alchimika.', en: 'Its poison can be given secretly as a spicy brew; servants of the Nameless mix it into alchemica.' },
      ],
   },
   Rauschgurke: {
      eat: { de: 'Ganze rohe Frucht: 2W6 Stunden KK +1W3 und KL −(1W6+1); sinkt die KL um 4 oder mehr, nach 5 Minuten Tiefschlaf mit wirren Träumen für den Rest der Zeit.', en: 'A whole raw fruit: KK +1D3 and KL −(1D6+1) for 2D6 hours; if KL drops by 4 or more, deep sleep with confused dreams after 5 minutes for the rest of the time.' },
      knowledge: [
         { de: 'Frisch vom Baum gegessen verleiht sie Bärenkräfte, um den Preis wirrer Träume.', en: 'Eaten fresh from the tree it gives the strength of a bear, at the price of confused dreams.' },
         { de: 'Stammt vom Rauschagura-Baum; nur ein Barbar isst sie roh.', en: 'Comes from the Rauschagura tree; only a barbarian eats it raw.' },
         { de: 'Maraskaner kennen viele Rezepte; richtig zubereitet verstärkt sie jede andere Pflanze.', en: 'Maraskans know many recipes; properly prepared it strengthens any other plant.' },
      ],
   },

   // ---- Batch 5: AdK S. 99–120 (Rote Pfeilblüte … Tarnele)
   'Rote Pfeilblüte': {
      eat: { de: 'Frische Knospe (bis 1 Tag nach dem Pflücken): CH +1 für 12 Stunden; weitere in der Zeit geben nichts mehr.', en: 'Fresh bud (up to 1 day after picking): CH +1 for 12 hours; more in that time give nothing.' },
      knowledge: [
         { de: 'Schlingkraut an Regenwaldbäumen mit beachtlicher Heilwirkung; als Tee oder Punsch haltbar gemacht.', en: 'A creeper on rainforest trees with notable healing power; preserved as tea or punch.' },
         { de: 'Frische Knospen lassen das Charisma erblühen – meist ein Privileg Wohlhabender oder der Regenwaldbewohner.', en: 'Fresh buds make one’s charisma bloom, usually a privilege of the wealthy or of rainforest dwellers.' },
         { de: 'Höhere Dosen machen sie nur bitterer, nicht wirksamer.', en: 'Higher doses only make it more bitter, not more effective.' },
      ],
   },
   'Roter Drachenschlund': {
      touch: { de: 'Frisch in einen Werwolfbiss gelegt: verhindert die Verwandlung, solange die erste noch bevorsteht – nur ein einziges Mal.', en: 'Placed fresh in a werewolf bite: prevents becoming a werewolf as long as the first change is still to come; works only once.' },
      inhale: { de: 'Riecht nach Echse, Raubtiere meiden ihn; Rauch einer Anwendung Blätter hält Werwesen 1W6 Stunden auf mindestens 5 Schritt (als Roter Drachenodem stärker).', en: 'Smells of lizard, predators avoid it; smoke of one application of leaves keeps were-creatures at least 5 paces away for 1D6 hours (stronger as Roter Drachenodem).' },
      knowledge: [
         { de: 'Wächst an Waldrändern und Flussufern – angeblich nur, wo einmal Drachenblut floss.', en: 'Grows at forest edges and river banks, supposedly only where dragon blood once fell.' },
         { de: 'In ihrer Nähe fühlt man sich beobachtet; die Blätter heilen Lykanthropie, ihr Rauch hält Werwesen fern.', en: 'Near it one feels watched; its leaves cure lycanthropy, its smoke keeps were-creatures away.' },
         { de: 'Gegen Lykanthropie nur frisch und nur einmal; das Elixier Gnädiger Drachenodem soll Flüche brechen.', en: 'Against lycanthropy only fresh and only once; the elixir Gnädiger Drachenodem is said to break curses.' },
      ],
   },
   'Roter Lotos': {
      inhale: { de: 'Giftig (Stufe 1): 1W3 SP und 1 Stufe Paralyse, sofort; nicht durch mehr Anwendungen steigerbar.', en: 'Poisonous (level 1): 1D3 SP and 1 level of Paralyse, immediate; more applications do not add to it.' },
      knowledge: [
         { de: 'Färbepflanze, deren Farbe in der Sonne schnell verblasst.', en: 'A dye plant whose colour fades quickly in the sun.' },
         { de: 'Fein gemahlen eingeatmet löst er lähmende Hustenanfälle aus – als „Gardistenkeuche“ bei Dieben beliebt.', en: 'Finely ground and inhaled it causes paralysing coughing fits, popular with thieves as “Gardistenkeuche”.' },
         { de: 'Die nördlichste Lotosart, noch im Nebelmoor und bei Prem zu finden.', en: 'The northernmost lotus, found even in the Nebelmoor and near Prem.' },
      ],
   },
   Sansaro: {
      inhale: { de: 'Unangenehmer Geruch (keine Wirkung).', en: 'Unpleasant smell (no effect).' },
      eat: { de: 'Bei Efferd- und Kerkersieche keine weiteren Stufen Verwirrung durch die Krankheit; zwei Wochen ständig genommen besiegt es beide. Bei Fieber −1 SP pro Tag.', en: 'With Efferdsieche and Kerkersieche no further levels of Verwirrung from the disease; taken constantly for two weeks it defeats both. With fevers −1 SP per day.' },
      knowledge: [
         { de: 'Sansarosud und -paste kennt man im Süden als Mittel gegen Krankheiten und Insekten.', en: 'In the south Sansaro brew and paste are known against disease and insects.' },
         { de: 'Ein stinkender Tang aus dem Perlenmeer, der sich zu dicken, schwer zu erntenden Teppichen verwebt.', en: 'A stinking seaweed of the Pearl Sea that weaves into thick mats that are hard to harvest.' },
         { de: 'Lindert vor allem Efferd- und Kerkersieche und senkt Fieber.', en: 'Mainly eases Efferdsieche and Kerkersieche and lowers fever.' },
      ],
   },
   Satuariensbusch: {
      touch: { de: 'Geister und niedere Dämonen können ihn nicht berühren und weichen vor frischen Trieben zurück. Als Wundauflage halbiert 1 Anwendung das Wundfieber-Risiko, 2 schließen es aus.', en: 'Spirits and lesser demons cannot touch it and shrink from fresh shoots. As a wound dressing 1 application halves the risk of wound fever, 2 remove it.' },
      eat: { de: 'Roh: 1 Stufe Betäubung (Magenkrämpfe, nicht kumulativ); als Tee vorbeugend heilend (siehe Haltbarkeit).', en: 'Raw: 1 level of Betäubung (stomach cramps, not cumulative); as tea a preventive remedy (see shelf life).' },
      knowledge: [
         { de: 'Immergrüner Strauch vor allem südlich der Gelben Sichel; Geister und Dämonen meiden ihn.', en: 'An evergreen shrub mostly south of the Yellow Sickle; spirits and demons avoid it.' },
         { de: 'Blätter, Blüten und Beeren ergeben einen heilkräftigen Tee; roh sind sie schwach giftig.', en: 'Leaves, flowers and berries make a healing tea; raw they are mildly poisonous.' },
         { de: 'Sein Saft dient für Verbände und Bannkreide; übernatürlich, sein Holz taugt für Artefakte.', en: 'Its sap is used for bandages and Bannkreide; supernatural, its wood suits artefacts.' },
      ],
   },
   Schattennebler: {
      touch: { de: 'Wer auf 10 Schritt herankommt, muss Verbergen (Schleichen) oder Körperbeherrschung –3 schaffen, sonst Sporen: Dunkelheit Stufe II in 20 Schritt und Gift für alle Betroffenen. Einmal pro Tag.', en: 'Anyone coming within 10 paces needs Verbergen (Schleichen) or Körperbeherrschung –3, otherwise spores: darkness level II within 20 paces and poison for everyone in it. Once a day.' },
      inhale: { de: 'Sporen giftig (Stufe 3): 1 Stufe Verwirrung für 5 Minuten.', en: 'Spores poisonous (level 3): 1 level of Verwirrung for 5 minutes.' },
      knowledge: [
         { de: 'Kleiner grauer Pilz auf Felsen im Schatten.', en: 'A small grey mushroom on shaded rocks.' },
         { de: 'Wächst in großen Kolonien und stößt bei Erschütterung dunkle, orientierungsraubende Sporen aus.', en: 'Grows in large colonies and releases dark, disorienting spores when jolted.' },
         { de: 'Mit großer Vorsicht lässt er sich ernten.', en: 'It can be harvested with great care.' },
      ],
   },
   Schlangentang: {
      touch: { de: 'Greift an und will ertränken (INI 14+1W6, AT 12, TP 1W6+2, RW lang, 20 LeP, RS 0, Haltegriff: Kraftakt 7, 13/13/13). Weißdornholz lässt ihn zurückschrecken und loslassen.', en: 'Attacks to drown its prey (INI 14+1D6, AT 12, TP 1D6+2, long reach, 20 LeP, RS 0, grapple: Kraftakt 7, 13/13/13). Hawthorn wood makes it recoil and let go.' },
      knowledge: [
         { de: 'Meerespflanze an Steinen mit bunten, schlangenartigen Auswüchsen.', en: 'A sea plant on rocks with colourful, snake-like growths.' },
         { de: 'Daimonid, Charyptoroth zugehörig: packt Beute mit Tentakeln, zieht sie hinein und zersetzt sie.', en: 'Daimonid, linked to Charyptoroth: grabs prey with tentacles, pulls it in and digests it.' },
         { de: 'Bewegte Gegenstände irritieren ihn kurz; Weißdornzweige schützen.', en: 'Moving objects briefly confuse it; hawthorn twigs protect.' },
      ],
   },
   Schlangenzünglein: {
      touch: { de: 'Der Saft färbt sich rot und tritt aus, wenn in 5 Schritt etwas Magisches ist: tröpfelnd bei Zaubertrick, Zauberer oder Kraftlinie, stark beim Zaubern (der Halm reißt), sofort zerreißend bei Dämon oder Artefakt. Die Menge zeigt die Stärke; sehr zerbrechlich.', en: 'The sap turns red and seeps out when something magical is within 5 paces: dripping for a cantrip, a caster or a ley line, flowing when a spell is cast (the stalk splits), bursting at once near a demon or artefact. The amount shows the strength; very fragile.' },
      knowledge: [
         { de: 'Von dieser Pflanze hat die Heldin noch nie gehört.', en: 'The hero has never heard of this plant.' },
         { de: 'Seltene fliegenfangende Pflanze aus Maraskan und von den Flüssen zum Golf von Perricum; gilt als ausgestorben.', en: 'A rare fly-catching plant from Maraskan and the rivers to the Gulf of Perricum; thought to be extinct.' },
         { de: 'Reagiert auf Magie: ihr Saft wird rot und tritt aus, als verblute sie.', en: 'Reacts to magic: its sap turns red and seeps out as if it were bleeding.' },
      ],
   },
   'Schleichender Tod': {
      inhale: { de: 'Riechen an einer Blüte: 1 Stufe Betäubung und starkes Wohlgefühl für 3 Stunden; schläft man in der Zeit ein, lebhafte Träume und danach 1W6 Stunden erneut Betäubung. Samthauch braucht konzentrierten Pollen.', en: 'Smelling a flower: 1 level of Betäubung and strong wellbeing for 3 hours; falling asleep meanwhile brings vivid dreams and afterwards Betäubung again for 1D6 hours. Samthauch needs concentrated pollen.' },
      knowledge: [
         { de: 'Blassgelbe Orchidee hoch in Regenwaldbäumen; ihr Pollen wird als Samthauch gehandelt (Ekstase, lebhafte Träume).', en: 'A pale yellow orchid high in rainforest trees; its pollen is traded as Samthauch (ecstasy, vivid dreams).' },
         { de: 'Höhere Borongeweihte Al’Anfas nehmen Samthauch regelmäßig; falsch dosiert ist er tödlich.', en: 'Higher priests of Boron in Al’Anfa take Samthauch regularly; wrongly dosed it is deadly.' },
         { de: 'Hauptzutat vieler Liebestränke, des Mengbiller Bannbalöls und des Regenbogenstaubs.', en: 'A main ingredient of many love potions, Mengbiller Bannbalöl and Regenbogenstaub.' },
      ],
   },
   'Schleimiger Sumpfknöterich': {
      touch: { de: 'Brennt wie Säure auf kleiner Fläche; als Waffen- und Kontaktgift muss es erst verarbeitet werden.', en: 'Burns like acid on a small area; it must be processed before use as a weapon or contact poison.' },
      eat: { de: 'Wie Berührung, nicht abwaschbar; verfliegt nach 8 KR.', en: 'As touch, cannot be washed off; fades after 8 rounds.' },
      knowledge: [
         { de: 'Sehr giftiger Pilz des Nordens in und am Wald.', en: 'A very poisonous mushroom of northern woods and their edges.' },
         { de: 'Wächst trotz des Namens nicht im Sumpf; duftet verführerisch, sein ätzender Schleim verletzt schon bei Berührung.', en: 'Despite its name it does not grow in swamps; it smells tempting, and its caustic slime harms at a touch.' },
         { de: 'Daraus entsteht Knötergift; er befällt Laubbäume, „Hexenringe“ um tote Eichen oder Buchen verraten ihn.', en: 'It yields Knötergift; it attacks deciduous trees, and “witch rings” around dead oaks or beeches give it away.' },
      ],
   },
   Schlinggras: {
      touch: { de: 'Packt bei 7–20 auf W20 vorbeigehende Wesen (AW –2 zum Ausweichen): Eingeengt und Fixiert; nach 2 KR ins Moor gezogen, Angriffe auf die Schlingen dann mit Sicht Stufe 4.', en: 'Grabs passers-by on 7–20 on a D20 (AW –2 to evade): Eingeengt and Fixiert; after 2 rounds pulled into the bog, attacks on the blades then at vision level 4.' },
      knowledge: [
         { de: 'Bis 1,5 Schritt hoch auf totem Holz in Mooren; kaum von Schilf zu unterscheiden, nur im Herbst rot gemasert.', en: 'Up to 1.5 paces tall on dead wood in bogs; hard to tell from reeds, red-veined only in autumn.' },
         { de: 'Wickelt sich um Beine und zieht ins Moor; Halme sind leicht zu schneiden, eingesunken muss man am Wurzelnetz ansetzen.', en: 'Wraps around legs and drags into the bog; blades are easy to cut, but once sunk one must cut at the root net.' },
         { de: 'Geerntet härtet es an der Luft steinhart – für Gefäße und Blasrohre.', en: 'Harvested, it hardens like stone in the air, for vessels and blowpipes.' },
      ],
   },
   Schwarmschwamm: {
      touch: { de: 'Ätzendes Wasser: 1W6 SP an allen natürlichen und magischen Oberflächen.', en: 'Caustic water: 1D6 SP to all natural and magical surfaces.' },
      eat: { de: 'Wasser in 10 Schritt ist giftig (Stufe 3): je Schluck 1W3 SP, 1 Stufe Verwirrung (1 Tag), 1 Stufe Schmerz (1 Stunde); das Gift bleibt 14 Tage, weitere Schlucke addieren sich. Willenskraft, um nicht als Wächter beim Schwamm zu bleiben (nach jedem Schluck).', en: 'Water within 10 paces is poisonous (level 3): per gulp 1D3 SP, 1 level of Verwirrung (1 day), 1 level of Schmerz (1 hour); the poison stays 14 days and further gulps add up. Willenskraft not to stay and guard the sponge (after every gulp).' },
      knowledge: [
         { de: 'Wächst in Klumpen an Grund und Ufer fließender Gewässer und gibt bei Berührung ätzendes Wasser ab.', en: 'Grows in clumps on the bed and banks of flowing water and releases caustic water when touched.' },
         { de: 'Seine Gewässer sind tierreich, aber voller Kadaver; Tiere verteidigen die Schwämme aggressiv.', en: 'Its waters teem with animals but are full of carcasses; animals defend the sponges fiercely.' },
         { de: 'Gibt dämonisches Gift ab, das langsam tötet und Lebewesen bis dahin zu seinen Wächtern macht.', en: 'Releases a demonic poison that kills slowly and meanwhile makes creatures its guards.' },
      ],
   },
   'Schwarzäugige Canyzeth': {
      touch: { de: 'Wer ihr aus höchstens 1 Schritt in die Blüte blickt, will ihr Geheimnisse und Groll anvertrauen; Umstehende können mit Menschenkenntnis +2 gegen Willenskraft gezielt nachfragen. Zwischen 5 und 6 Uhr morgens gibt sie Gehörtes telepathisch an den ersten Passanten in 3 Schritt weiter (erkennbar nur mit KL-Probe).', en: 'Whoever looks into its flower from within 1 pace wants to confide secrets and grudges to it; bystanders can ask targeted questions with Menschenkenntnis +2 against Willenskraft. Between 5 and 6 in the morning it passes what it heard telepathically to the first passer-by within 3 paces (noticed only with a KL check).' },
      knowledge: [
         { de: 'Kletterpflanze des Südens in lichten Wäldern und zunehmend in Gärten.', en: 'A southern climbing plant of open woods and more and more of gardens.' },
         { de: 'Sie ist eine magische Pflanze.', en: 'It is a magical plant.' },
         { de: 'Sie raunt die Geheimnisse vor dem Morgengrauen Vorübergehenden zu; eine getrocknete Blüte ist Kern des Schwarzäugigen Amuletts gegen Lügen.', en: 'It whispers the secrets to passers-by before dawn; a dried flower is the heart of the Schwarzäugiges Amulett against lies.' },
      ],
   },
   'Schwarzer Lotos': {
      inhale: { de: 'Blütenstaub giftig (Stufe 2): 1W3 SP, 1 Stufe Schmerz, sofort; nicht durch mehr Anwendungen steigerbar.', en: 'Pollen poisonous (level 2): 1D3 SP, 1 level of Schmerz, immediate; more applications do not add to it.' },
      eat: { de: 'Einem alchimistischen Rauschmittel beigemischt: dessen QS +1 und 1 Stufe Schmerz für die Wirkungsdauer (einmalig). Pur wie Einatmung.', en: 'Mixed into an alchemical drug: its QS +1 and 1 level of Schmerz for its duration (once). Pure as inhaled.' },
      knowledge: [
         { de: 'Boronheilige Pflanze; der Wehrheimer Index schränkt Besitz und Gebrauch ein.', en: 'A plant holy to Boron; the Wehrheim Index restricts owning and using it.' },
         { de: 'Giftiger Blütenstaub; stark verdünnt als Lotoswein der Boronkirche; Zutat für Antidot und Rauschmittel.', en: 'Poisonous pollen; much diluted it is the Boron church’s Lotoswein; used for Antidot and to strengthen drugs.' },
         { de: 'Daraus entsteht ein starkes, womöglich tödliches Atemgift mit Schmerzen und Halluzinationen.', en: 'It yields a strong, possibly deadly inhaled poison causing pain and hallucinations.' },
      ],
   },
   'Schwarzer Mohn': {
      inhale: { de: 'Verbrannte Samenkapsel: 1 Stufe Betäubung für 1 Stunde.', en: 'Burnt seed capsule: 1 level of Betäubung for 1 hour.' },
      knowledge: [
         { de: 'Grundlage des Schwarzen Weihrauchs der Boronkirche; Essenz für Schlaftrunk und Schlafgift.', en: 'The basis of the Boron church’s black incense; its essence goes into Schlaftrunk and Schlafgift.' },
         { de: 'Wächst nur auf der Zyklopeninsel Pailos nahe den Ruinen von Palakar.', en: 'Only grows on the Cyclops island Pailos near the ruins of Palakar.' },
         { de: 'Der Heilige Nemekath öffnete damit Ungeweihten entrückungsähnliche Zustände.', en: 'The saint Nemekath used it to give the unconsecrated trance-like states.' },
      ],
   },
   'Schwarzer Weinstock': {
      touch: { de: 'Umschlingt und saugt alle außer Belkelel-Dienern (INI 14+1W6, AT 7, TP 1W3 + Gift, RW kurz bis mittel, 30 LeP, RS 0, Haltegriff: Kraftakt 14, 22/18/18). Gift je Treffer bzw. Runde im Griff (Stufe 5, ZK): 2 / 1 Stufe Paralyse, kumulativ; ab 4 Stufen saugt er 1W3 LeP pro Tag. Je 49 ausgesaugten LeP wächst eine Anwendung Schwarze Trauben.', en: 'Entwines and drains everyone but servants of Belkelel (INI 14+1D6, AT 7, TP 1D3 + poison, short to medium reach, 30 LeP, RS 0, grapple: Kraftakt 14, 22/18/18). Poison per hit or round held (level 5, ZK): 2 / 1 level of Paralyse, cumulative; from 4 levels it drains 1D3 LeP a day. Every 49 LeP drained grow one application of black grapes.' },
      eat: { de: 'Trauben giftig (Stufe 4): 1W3 SP, 1 Stufe Betäubung; Belkelel-Paktierer und -Dämonen immun.', en: 'Grapes poisonous (level 4): 1D3 SP, 1 level of Betäubung; Belkelel’s pact-bound and demons are immune.' },
      knowledge: [
         { de: 'Umschlingt bei Berührung seine Opfer und lähmt sie mit Gift.', en: 'Entwines its victims when touched and paralyses them with poison.' },
         { de: 'Aus den Trauben entsteht Schwarzer Wein: Kraft und Ausstrahlung, aber suchterzeugend.', en: 'Its grapes make Schwarzer Wein: strength and presence, but addictive.' },
         { de: 'Übernatürlich und daimonid, saugt Blut; Diener Belkelels verschont er.', en: 'Supernatural and daimonid, it drains blood; it spares servants of Belkelel.' },
      ],
   },
   Seelenhauch: {
      touch: { de: 'Wie Einatmung.', en: 'As inhaled.' },
      inhale: { de: 'Die unsichtbare Pollenblase (etwa 5 Schritt, je nach Wind) wirkt wie eine dämonische GROSSE GIER (RW S. 291): das Opfer will die Blüte essen.', en: 'The invisible pollen bubble (about 5 paces, depending on wind) works like a demonic GROSSE GIER (core rules p. 291): the victim wants to eat the flower.' },
      eat: { de: 'Gift: 8 Stunden lang (2W6 − SK) SP pro Stunde und 1 Stufe Schmerz (innere Blutungen).', en: 'Poison: for 8 hours (2D6 − SK) SP per hour and 1 level of Schmerz (internal bleeding).' },
      knowledge: [
         { de: 'Tiefrote Knospe der Steppen und Grasländer Schwarztobriens, die verlockend duftet.', en: 'A deep red bud of the steppes and grasslands of Black Tobrien with a tempting scent.' },
         { de: 'Magisch: ein Einflusszauber bringt Lebewesen dazu, sie zu essen.', en: 'Magical: an influence spell makes creatures eat it.' },
         { de: 'Ihr Gift verursacht innere Blutungen; Nekromanten machen daraus Tijakools Hauch, der Körper und Seele trennen kann.', en: 'Its poison causes internal bleeding; necromancers make Tijakools Hauch from it, which can tear body and soul apart.' },
      ],
   },
   Shurinstrauch: {
      touch: { de: 'Keine Wirkung; das Gift muss erst konzentriert werden.', en: 'No effect; the poison must first be concentrated.' },
      eat: { de: 'Alle Teile giftig (Stufe 3): 1W6 SP nach 30 Minuten je Anwendung; Achaz immun.', en: 'All parts poisonous (level 3): 1D6 SP after 30 minutes per application; Achaz are immune.' },
      knowledge: [
         { de: 'Mag kargen Boden in ganz Aventurien; gelbe Blüten.', en: 'Likes poor soil all over Aventuria; yellow flowers.' },
         { de: 'Die Früchte heißen Shurinknollen; die ganze Pflanze ist giftig.', en: 'Its fruits are called shurin tubers; the whole plant is poisonous.' },
         { de: 'Shurinknollengift lähmt nach einer halben Stunde langsam die Muskeln bis zum Ersticken; Achaz sind immun.', en: 'Shurin tuber poison slowly paralyses the muscles after half an hour until one suffocates; Achaz are immune.' },
      ],
   },
   Steinrinde: {
      touch: { de: 'Sehr leicht brennbar: ein Funke löst bei 1–5 auf W20 eine Kettenreaktion aus; 1 Stein Rinde brennt wie 3 Stein Feuerholz.', en: 'Very easy to ignite: a spark sets off a chain reaction on 1–5 on a D20; 1 stone of bark burns like 3 stone of firewood.' },
      knowledge: [
         { de: 'Von Steinrinde hat die Heldin noch nie gehört (Zwerge wissen bei QS 1 schon das von QS 2).', en: 'The hero has never heard of Steinrinde (dwarves already know the QS 2 facts at QS 1).' },
         { de: 'Graue Flechte auf Stein in Höhlen, nur bei gutem Licht erkennbar; leicht entflammbar.', en: 'A grey lichen on cave rock, only visible in good light; easily set alight.' },
         { de: 'Wo sie sich auftürmt, ist die Luft schlecht – das Atmen wird gefährlich; oder dort leben viele oder große Wesen.', en: 'Where it piles up the air is bad and breathing becomes dangerous; or many or large creatures live there.' },
      ],
   },
   Talaschin: {
      touch: { de: 'Als Paste auf den ganzen Körper: 1 Stunde kein Körpergeruch (auch für Gegenstände); unter Kleidung nach Spielleitung 1 Stufe Überhitzung (RW S. 348).', en: 'As a paste on the whole body: no body smell for 1 hour (also for objects); under clothing, at the GM’s call, 1 level of Überhitzung (core rules p. 348).' },
      inhale: { de: 'Geruchlos und geruchsneutralisierend.', en: 'Odourless and neutralises smells.' },
      knowledge: [
         { de: 'Flechte extremer Klimata – Ewiges Eis und Wüsten –, kaum zu zerstören.', en: 'A lichen of extreme climates, eternal ice and deserts, and hard to destroy.' },
         { de: 'Verschleiert Gerüche völlig, selbst vor Spürtieren; als Salbe verarbeitbar.', en: 'Hides smells completely, even from tracking animals; can be made into a salve.' },
         { de: 'Braucht nur Luft und alle paar Jahrzehnte Wasser.', en: 'Needs only air and water every few decades.' },
      ],
   },
   Tarnblatt: {
      eat: { de: '1 Stufe Betäubung wie heftige Trunkenheit, dazu eine geschwollene Nase.', en: '1 level of Betäubung like heavy drunkenness, plus a swollen nose.' },
      knowledge: [
         { de: 'Ahmt das Aussehen anderer Pflanzen nach.', en: 'Mimics the look of other plants.' },
         { de: 'Ähnelt je nach Jahreszeit Hirad- oder Olginwurz, die beide nicht auf Maraskan wachsen.', en: 'Depending on the season it resembles Hiradwurz or Olginwurz, neither of which grows on Maraskan.' },
         { de: 'Hat nicht deren Wirkung, sondern berauscht; Alchimisten nutzen seine Tarn- und Verwandlungswirkung.', en: 'Has none of their effects but intoxicates; alchemists use its camouflage and transformation powers.' },
      ],
   },
   Tarnele: {
      touch: { de: 'Auf eine Wunde: +1 LeP in der nächsten Regeneration (mehr Anwendungen nicht); unterdrückt 1 Stunde 1 Stufe Schmerz, nur solange höchstens Stufe I vorliegt.', en: 'On a wound: +1 LeP at the next regeneration (more applications do not add); suppresses 1 level of Schmerz for 1 hour, only while it is at most level I.' },
      inhale: { de: 'Lieblicher Duft, gut gegen üble Gerüche.', en: 'A sweet scent, good against foul smells.' },
      knowledge: [
         { de: 'Bekannte Heilpflanze, „Roter Löwenzahn“; als Brei schmerzlindernde, heilende Wundauflage.', en: 'A well-known healing plant, “red dandelion”; as a paste a soothing, healing dressing.' },
         { de: 'Der Brei wirkt nur kurz, wenn er nicht als Salbe haltbar gemacht wird; häufig in Wundpulvern.', en: 'The paste only works briefly unless preserved as a salve; common in wound powders.' },
         { de: 'Bestandteil von Xordai gegen Zorganpocken und von Narbenpulvern.', en: 'An ingredient of Xordai against Zorgan pox and of scar powders.' },
      ],
   },

   // ---- Batch 6: AdK S. 121–142 (Thonnys … Zwölfblatt)
   Thonnys: {
      eat: { de: 'Zauberer können ohne die SF Astrale Meditation nutzen: mindestens 5 Minuten meditieren, Selbstbeherrschung (Störungen ignorieren), dann bis QS × 3 LeP 1:1 in AsP umwandeln; danach 1W3 LeP Verlust (mit der SF entfällt dieser).', en: 'Spellcasters can use Astrale Meditation without the SF: meditate at least 5 minutes, Selbstbeherrschung (Störungen ignorieren), then convert up to QS × 3 LeP into AsP 1:1; afterwards lose 1D3 LeP (not with the SF).' },
      knowledge: [
         { de: 'Fleischige kleine Blätter, geruchlose rote Blüten (Ingerimm bis Rahja); Zutat für Zaubertränke.', en: 'Fleshy small leaves, odourless red flowers (Ingerimm to Rahja); an ingredient of magic potions.' },
         { de: 'Lässt Zauberer Lebensenergie in Astralenergie umwandeln; getrocknet macht er übel.', en: 'Lets casters turn life energy into astral energy; dried it causes nausea.' },
         { de: 'Vorsichtig ernten: reißen die zarten Wurzeln, erholt sich die Pflanze nicht.', en: 'Harvest carefully: if the delicate roots tear, the plant does not recover.' },
      ],
   },
   Tigermohn: {
      eat: { de: 'Samenkapseln: 1W3+3 Stunden Ängste (Nachteile Angst vor …, Furcht) ignoriert, danach kehren sie zurück. Ab 2 Anwendungen am Tag je W20: jede 20 bedeutet Wachkoma für Anwendungen × 2 × Anzahl der 20 Stunden.', en: 'Seed capsules: fears (disadvantages Angst vor …, Furcht) ignored for 1D3+3 hours, then they return. From 2 doses a day roll a D20 each: every 20 means a waking coma for doses × 2 × number of 20s hours.' },
      knowledge: [
         { de: 'Wiesen, Auen und lichte Wälder; gelbe Blüten mit roten Streifen; Hausmittel zum Schlafen und Entkrampfen.', en: 'Meadows, river plains and open woods; yellow flowers with red stripes; a home remedy for sleep and cramps.' },
         { de: 'Die Samen (Ernte im Travia) beruhigen, trösten und helfen gegen Ängste.', en: 'The seeds (harvested in Travia) calm, comfort and help against fears.' },
         { de: 'Gefahr eines längeren Wachkomas – gezielt für Beruhigungsmittel genutzt; Zutat des Friedenswassers.', en: 'Risk of a longer waking coma, used on purpose in sedatives; an ingredient of Friedenswasser.' },
      ],
   },
   Traschbart: {
      touch: { de: 'Zerstoßen auf die Haut: Gilbe-Kranke bekommen nicht zusätzlich Jahresfieber.', en: 'Crushed onto the skin: people with Gilbe do not also catch annual fever.' },
      eat: { de: 'Bei Fieberkrankheiten (frisch oder als Pulver): −1 SP pro Tag.', en: 'With fevers (fresh or as powder): −1 SP per day.' },
      knowledge: [
         { de: 'Graugrüne Flechte an Bäumen in Finsterkamm, Steineichen- und Eisenwald und Koschbergen; frisch gegen Fieber.', en: 'A grey-green lichen on trees in the Finsterkamm, Steineichenwald, Eisenwald and Kosch mountains; fresh it helps against fever.' },
         { de: 'Leicht mit Schratmoos zu verwechseln, riecht frisch faulig; als Pulver lange haltbar und geruchlos.', en: 'Easily confused with Schratmoos and smells rotten when fresh; as powder it keeps long and has no smell.' },
         { de: 'Das Pulver ersetzt eine Zutat im Fiebersaft.', en: 'The powder can stand in for an ingredient of Fiebersaft.' },
      ],
   },
   Trichterwurzel: {
      touch: { de: 'Blatt erkennen: Sinnesschärfe –2. Wer drauftritt, stürzt in den Trichter (Körperbeherrschung –2, sonst Sturzschaden) und wird von 1W6 Nesselwurzeln getroffen (Stufe 3, je 1 SP und KL −2 für 8 Stunden). KL 8–4: Befreien mit Klettern –3; unter 4: gefangen, 1 SP pro Minute bis zum Tod oder zur Rettung.', en: 'Spotting the leaf: Sinnesschärfe –2. Stepping on it drops one into the funnel (Körperbeherrschung –2, else falling damage) and 1D6 nettle roots strike (level 3, 1 SP and KL −2 each for 8 hours). KL 8–4: climb out with Klettern –3; below 4: trapped, 1 SP per minute until death or rescue.' },
      knowledge: [
         { de: 'Fleischfressende Pflanze Maraskans, die sich in Erdmulden verbirgt.', en: 'A carnivorous plant of Maraskan hidden in hollows in the ground.' },
         { de: 'Tarnt die Mulde mit einem großen Blatt als Fallgrube; die Wurzeln spritzen ein verwirrendes Gift.', en: 'Covers the hollow with a large leaf as a pit trap; its roots inject a confusing poison.' },
         { de: 'Knoblauch kurz danach schwächt das Gift – daher gilt sie als dämonisch; Zutat für Pulver des Klaren Geistes.', en: 'Garlic soon afterwards weakens the poison, so it is thought demonic; an ingredient of Pulver des Klaren Geistes.' },
      ],
   },
   'Tuur-Amash-Kelch': {
      touch: { de: 'Eine Blüte spritzt Säure auf ein zufälliges Ziel in 3 Schritt (FK 12): Brennend auf kleiner Fläche für 1W6 KR; in der nächsten KR greifen alle anderen Blüten an (auch benachbarter Pflanzen). Weitere Treffer: große Fläche, dann ganzer Körper; danach nur längere Dauer.', en: 'A flower sprays acid at a random target within 3 paces (FK 12): Brennend on a small area for 1D6 rounds; next round all other flowers attack (neighbouring plants too). Further hits: large area, then the whole body; after that only a longer duration.' },
      eat: { de: 'Flüssigkeit der frischen Blüte giftig (Stufe 5): 2W6 SP, 1 Stufe Schmerz für 3 Stunden. Frucht: 2W6+6 SP, 2 Stufen Schmerz für 3 Stunden; ihr Gift vergeht bei Berührung mit Gesegnetem oder Geweihtem.', en: 'Liquid of the fresh flower poisonous (level 5): 2D6 SP, 1 level of Schmerz for 3 hours. Fruit: 2D6+6 SP, 2 levels of Schmerz for 3 hours; its poison vanishes on touching anything blessed or consecrated.' },
      knowledge: [
         { de: 'Winzige Trichterblume, die nur in Gegenden starker dämonischer Aktivität wächst.', en: 'A tiny funnel flower that only grows where demonic activity is strong.' },
         { de: 'Spritzt ätzenden Verdauungssaft auf Nahende.', en: 'Sprays caustic digestive juice at anyone approaching.' },
         { de: 'Sprießt aus dämonischer Substanz, sicher aus dem Schleim der Tuur-Amash-Kröte; selten bildet sie Früchte.', en: 'Sprouts from demonic matter, surely from the slime of the Tuur-Amash toad; rarely it bears fruit.' },
      ],
   },
   Ulmenwürger: {
      eat: { de: 'Schmeckt seifig; +2 LeP in der nächsten Ruhephase.', en: 'Tastes of soap; +2 LeP in the next rest.' },
      knowledge: [
         { de: 'Im Norden in jeder Kräuterküche; „Wirselkraut des Nordens“ genannt.', en: 'Found in every herb kitchen of the north; called the “Wirselkraut of the north”.' },
         { de: 'Ungewöhnlich zuverlässig, ohne bekannte Nebenwirkungen.', en: 'Unusually reliable, with no known side effects.' },
         { de: 'Wächst an Bäumen wie Ulmen und vor allem bei Giftpflanzen, die es aushungert – befallene Wälder sind sicherer.', en: 'Grows on trees such as elms and above all near poisonous plants, which it starves; infested woods are safer.' },
      ],
   },
   'Vierblättrige Einbeere': {
      touch: { de: 'Der Saft auf Wunden wirkt wie Verzehr.', en: 'The juice on wounds works as when eaten.' },
      eat: { de: '+2 LeP je Anwendung in der nächsten Regeneration (max. +4). Ab 2 Anwendungen am Tag Einbeerensucht: 1W6 LeP Verlust je Woche ohne Anwendung. Bei 15–20 auf W20 ist der Strauch die giftige Glanzbeere (1W6 SP, Giftstufe 3), erkennbar mit gelungener Bestimmungsprobe.', en: '+2 LeP per application at the next regeneration (max. +4). From 2 doses a day addiction: lose 1D6 LeP each week without a dose. On 15–20 on a D20 the shrub is the poisonous Glanzbeere (1D6 SP, poison level 3), told apart with a successful identification check.' },
      knowledge: [
         { de: 'Eine der bekanntesten Heilpflanzen des Nordens und der Mitte; blaue Beeren bis Wintereinbruch.', en: 'One of the best-known healing plants of the north and centre; blue berries until winter.' },
         { de: 'Äußerlich gegen Verbrennungen und entzündete Wunden, innerlich gegen Gift, Krankheit und Blutungen – nur bei Ruhe.', en: 'Applied against burns and inflamed wounds, taken against poison, disease and bleeding, only if one rests.' },
         { de: 'Schon etwas zu viel macht süchtig, dann wirkt die Heilkraft nicht mehr.', en: 'Even a little too much makes one addicted, and then the healing no longer works.' },
      ],
   },
   Vragieswurzel: {
      eat: { de: 'Giftig (Stufe 2): 2 SP und 1 Stufe Betäubung für 12 Stunden; wiederholtes Erbrechen, weder Wasser noch Nahrung bleiben drin.', en: 'Poisonous (level 2): 2 SP and 1 level of Betäubung for 12 hours; repeated vomiting, neither water nor food stays down.' },
      knowledge: [
         { de: 'Im Süden oft neben Kandiswurzel angebaut; gegessen bringt sie zwölf Stunden Erbrechen.', en: 'Often grown in the south next to candy root; eaten it brings twelve hours of vomiting.' },
         { de: 'Den Boroni Al’Anfas heilig; aus dem weißen, lakritzartigen Saft entsteht Boronwein.', en: 'Holy to Al’Anfa’s Boron priests; its white, liquorice-tasting sap makes Boronwein.' },
         { de: 'Falsch hergestellter Boronwein kann tödlich sein; Zutat für Schlafgift und Regenbogenstaub.', en: 'Badly made Boronwein can be deadly; an ingredient of Schlafgift and Regenbogenstaub.' },
      ],
   },
   Waldwebe: {
      touch: { de: 'Unachtsam hineinlaufen (Sinnesschärfe –3 zum Bemerken): gefangen; befreien mit Fesseln –1, jeder weitere Versuch –1 mehr (max. 3). Sekret wie Säure auf kleiner Fläche.', en: 'Walking in carelessly (Sinnesschärfe –3 to notice): caught; free oneself with Fesseln –1, each further try –1 more (max. 3). Sap acts like acid on a small area.' },
      inhale: { de: 'Duftet leicht süß nach Nektar (keine Wirkung).', en: 'Smells lightly sweet like nectar (no effect).' },
      eat: { de: 'Säure auf kleiner Fläche (nur an der wilden Pflanze); wer nascht, verfängt sich automatisch.', en: 'Acid on a small area (only at the wild plant); whoever nibbles is caught automatically.' },
      knowledge: [
         { de: 'Kommt überall in Wäldern vor.', en: 'Found in forests everywhere.' },
         { de: 'Ein fast unsichtbares Geflecht wie ein Spinnennetz; das klebrige Sekret hält Beute fest und zersetzt sie.', en: 'An almost invisible web like a spider’s; the sticky sap holds prey and dissolves it.' },
         { de: 'Manche nutzen Schlaufen für größere Beute; Ruhe oder eine scharfe Klinge befreien; Kundige machen daraus Waldwebennetz.', en: 'Some use loops for larger prey; calm or a sharp blade frees one; experts make Waldwebennetz from it.' },
      ],
   },
   Wandermoos: {
      eat: { de: 'Leichte Übelkeit und Erbrechen (1 Stufe Betäubung).', en: 'Mild nausea and vomiting (1 level of Betäubung).' },
      knowledge: [
         { de: 'Rollt sich bei Trockenheit zu Ballen und kullert zu Pfützen; in feuchten Höhlen und Gängen.', en: 'Rolls into balls when dry and tumbles to puddles; in damp caves and tunnels.' },
         { de: 'Spürt immer die Richtung zum nächsten Wasser, kommt aber oft vom Weg ab.', en: 'Always senses the direction of the nearest water but often strays.' },
         { de: 'Eingelegt gegessen überträgt es diese Fähigkeit eine Weile auf den Anwender.', en: 'Eaten pickled it passes this ability to the user for a while.' },
      ],
   },
   Wasserrausch: {
      inhale: { de: 'In 5 Schritt um eine offene Blüte: Vergleichsprobe Willenskraft (Betören widerstehen) –1 gegen Betören 12 (12/12/12); misslungen 1 Stufe Verwirrung für 30 Minuten, dann 1 Stufe Betäubung für 3 Stunden. Abgetrennte Blüten wirken nach 1 Minute nicht mehr.', en: 'Within 5 paces of an open flower: competitive Willenskraft (Betören widerstehen) –1 against Betören 12 (12/12/12); on a failure 1 level of Verwirrung for 30 minutes, then 1 level of Betäubung for 3 hours. Cut flowers stop working after 1 minute.' },
      eat: { de: 'Frucht: nach 30 Minuten 1 Stunde starkes Verlangen; Willenskraft (Betören widerstehen) –1.', en: 'Fruit: after 30 minutes strong desire for 1 hour; Willenskraft (Betören widerstehen) –1.' },
      knowledge: [
         { de: 'Strauch, der in Teichen und Seen wurzelt; nur nadelförmige Blätter ragen heraus.', en: 'A shrub rooted in ponds and lakes; only needle-like leaves rise above the water.' },
         { de: 'Rosa Blüten blühen je einen Tag; ihr erregender Duft macht unachtsam und lässt mitunter ertrinken.', en: 'Pink flowers bloom for one day each; their arousing scent makes one careless and sometimes drowns.' },
         { de: 'Nach etwa 500 Blüten eine Fruchtperle, die euphorisch berauscht; getrocknet als Rahjasine gehandelt.', en: 'After about 500 flowers a fruit pearl that brings euphoria; sold dried as Rahjasine.' },
      ],
   },
   Weißdorn: {
      touch: { de: 'Vampire und Feen meiden jeden Kontakt mit frischem Weißdorn.', en: 'Vampires and fey avoid all contact with fresh hawthorn.' },
      inhale: { de: 'Fauliger Geruch: Vampire und Feen kommen frischem Weißdorn nicht näher als 10 Schritt (je nach Wind); geerntet verfliegt er nach 1 Stunde.', en: 'Rotten smell: vampires and fey come no closer than 10 paces to fresh hawthorn (depending on wind); cut, the smell fades after 1 hour.' },
      knowledge: [
         { de: 'Sommergrüner Strauch der Grasländer des Nordens; Vampire sollen ihn meiden.', en: 'A deciduous shrub of the northern grasslands; vampires are said to avoid it.' },
         { de: 'Frisch geschnittenes Holz riecht eine Stunde lang abstoßend für Vampire und Feen; dem lebenden Strauch nähern sie sich nicht.', en: 'Freshly cut wood smells repellent to vampires and fey for an hour; they do not approach the living shrub.' },
         { de: 'Alchimisten extrahieren den Geruch: das Extrakt wirkt wie ein Schutzkreis gegen Vampire und Feen.', en: 'Alchemists extract the smell: the extract works like a protective circle against vampires and fey.' },
      ],
   },
   'Weißer Lotos': {
      inhale: { de: 'Blütenstaub giftig (Stufe 2): 1W3+3 SP, 1 Stufe Schmerz und 1 Stufe Verwirrung für 5 Minuten / 1W3 SP und 1 Stufe Verwirrung für 5 Minuten.', en: 'Pollen poisonous (level 2): 1D3+3 SP, 1 level of Schmerz and 1 level of Verwirrung for 5 minutes / 1D3 SP and 1 level of Verwirrung for 5 minutes.' },
      knowledge: [
         { de: 'Nur alchimistisch vom Weißgelben Lotos zu unterscheiden (dessen Blütenblätter werden dabei gelb).', en: 'Only told apart from the white-yellow lotus by alchemy (whose petals then turn yellow).' },
         { de: 'Der gelbliche Blütenstaub ist giftig und verursacht Schmerzen und Sinnestrübung.', en: 'Its yellowish pollen is poisonous and causes pain and dulled senses.' },
         { de: 'Grundlage für Marbos Odem (starke Trugbilder, hohe Suchtgefahr) und zur Veredelung von Zazamotoxin.', en: 'The basis of Marbos Odem (strong illusions, high risk of addiction) and used to refine Zazamotoxin.' },
      ],
   },
   'Weißgelber Lotos': {
      inhale: { de: 'Pollen giftig: 1W3 SP.', en: 'Pollen poisonous: 1D3 SP.' },
      eat: { de: 'Giftig (Stufe 2): 1W3 SP und 1 Stufe Verwirrung für 15 Minuten, Erinnerungslücken; zusätzlich W20: 17–19 Kopfschmerzen (1 Stufe Schmerz, 3 Stunden), 20 Bewusstlos für 3 Stunden.', en: 'Poisonous (level 2): 1D3 SP and 1 level of Verwirrung for 15 minutes, memory gaps; also roll a D20: 17–19 headache (1 level of Schmerz, 3 hours), 20 unconscious for 3 hours.' },
      knowledge: [
         { de: 'Reinweiße Blüten; nur alchimistisch zu bestimmen, er färbt sich dabei gelblich.', en: 'Pure white flowers; only identified by alchemy, it turns yellowish.' },
         { de: 'Die ganze Blüte ist giftig; gegessen Halluzinationen und Erinnerungslücken.', en: 'The whole flower is poisonous; eaten it causes hallucinations and memory gaps.' },
         { de: 'Taugt für Seide und Lotostrunk, der bei Hellsichtmagie hilft.', en: 'Used for silk and for Lotostrunk, which helps with clairvoyance magic.' },
      ],
   },
   Winselgras: {
      touch: { de: 'Wer in bis zu 250 Schritt Hörweite einer Winselgraswiese schläft, hat keine Regenerationsphase.', en: 'Anyone sleeping within 250 paces’ hearing of a Winselgras meadow gets no regeneration phase.' },
      knowledge: [
         { de: 'Vor allem in den Steppen Araniens und Mhanadistans; nachts winselt es bis hin zu lautem Brüllen.', en: 'Mainly in the steppes of Arania and Mhanadistan; at night it whines, rising to a loud roar.' },
         { de: 'Am schlimmsten bei Vollmond; blüht nach den Regenzeiten und lässt sich leicht umpflanzen.', en: 'Worst at full moon; it blooms after the rainy seasons and is easy to transplant.' },
         { de: 'Wird im Krieg gegen Feinde eingesetzt; es gibt Matten mit eingeflochtenem Winselgras.', en: 'Used in war to wear down enemies; there are mats with Winselgras woven in.' },
      ],
   },
   Wirselkraut: {
      touch: { de: 'Zerstoßen aufgelegt: +1 LeP je Anwendung in der nächsten Regeneration, max. +3 je Phase.', en: 'Crushed and applied: +1 LeP per application at the next regeneration, max. +3 per phase.' },
      eat: { de: '+1 LeP je Anwendung in der nächsten Regeneration, max. +3 je Phase; Zwerge höchstens +1.', en: '+1 LeP per application at the next regeneration, max. +3 per phase; dwarves at most +1.' },
      knowledge: [
         { de: 'Allgemein bekannte, vielseitige Heilpflanze; stillt Blutungen sofort, roh, als Salbe oder Absud.', en: 'A well-known, versatile healing plant; stops bleeding at once, raw, as salve or brew.' },
         { de: 'Wächst überall in größeren Mengen, wo es nicht zu kalt ist; Ernte von Frühling bis Spätherbst.', en: 'Grows in larger patches wherever it is not too cold; harvested from spring to late autumn.' },
         { de: 'Nur Zwergen verstimmt es leicht den Magen; Salben wirken bei ihnen nur halb.', en: 'Only dwarves get a slightly upset stomach; salves work only half as well on them.' },
      ],
   },
   Wolchrauke: {
      touch: { de: 'Zerbrochene Samenkapsel: Pollenwolke, Sicht Stufe 1 (tränende Augen), in 3 Schritt um die Kapsel Stufe 2.', en: 'Broken seed capsule: a pollen cloud, vision level 1 (watering eyes), level 2 within 3 paces of the capsule.' },
      inhale: { de: 'Reizt den Rachen (Giftstufe 1, 1 SP).', en: 'Irritates the throat (poison level 1, 1 SP).' },
      eat: { de: 'Reizt Rachen und Magen (Giftstufe 1, 1W3 SP).', en: 'Irritates throat and stomach (poison level 1, 1D3 SP).' },
      knowledge: [
         { de: 'Nach den violetten Lockblättern dickschalige braune Samenkapseln, oft beides zugleich, mehrmals im Jahr.', en: 'After its violet lure leaves come thick-shelled brown seed capsules, often both at once, several times a year.' },
         { de: 'Aufgebrochen geben die Kapseln quiekend eine brennende weiße Pollenwolke ab.', en: 'Broken open, the capsules squeak and release a burning white pollen cloud.' },
         { de: 'Wächst im Winter unter Schnee und wird so zur Trittfalle; der Pollen sieht dann aus wie Schnee.', en: 'Grows under snow in winter and becomes a trap underfoot; the pollen then looks like snow.' },
      ],
   },
   Würgedattel: {
      touch: { de: 'Greift an (AT 10, 1W6+2 TP pro KR, RW lang, 40 LeP, RS 1; 10 SP trennen eine Ranke; Verteidigung –2): Würgegriff, Eingeengt und Fixiert bis zur Befreiung. Vollständig zerstören nur Feuer oder Säure wie Goldleim.', en: 'Attacks (AT 10, 1D6+2 TP per round, long reach, 40 LeP, RS 1; 10 SP sever a vine; defence –2): a choke hold, Eingeengt and Fixiert until freed. Only fire or acid such as Goldleim destroys it fully.' },
      eat: { de: 'Die Dattel schmeckt enttäuschend durchschnittlich (keine Wirkung).', en: 'The date tastes disappointingly average (no effect).' },
      knowledge: [
         { de: 'Von einer Würgedattel hat die Heldin noch nie gehört.', en: 'The hero has never heard of a Würgedattel.' },
         { de: 'Wächst auf Altoum, selten an Stränden von Sylla bis Brabak und an der Goldenen Bucht; große, mittelmäßige Datteln in Reichweite.', en: 'Grows on Altoum, rarely on beaches from Sylla to Brabak and the Golden Bay; large, mediocre dates within reach.' },
         { de: 'Wer eine Dattel berührt, wird von Lianen im Sand erwürgt und als Dünger eingegraben; lose Datteln verteidigt sie nicht.', en: 'Whoever touches a date is strangled by vines hidden in the sand and buried as fertiliser; loose dates are not defended.' },
      ],
   },
   Yaganstrauch: {
      touch: { de: 'Nesselblätter: 1 SP (aranische), 1W3+1 SP (maraskanische Pflanze).', en: 'Nettle leaves: 1 SP (Aranian), 1D3+1 SP (Maraskan plant).' },
      eat: { de: 'Nuss: Willenskraft (Bedrohungen standhalten) –2; misslungen 5 Minuten Atemlosigkeit (1 Stufe Betäubung), 6 Stunden 3 Stufen Furcht, 7 Stunden Tränen (Sicht Stufe 1), erst nach einem Vierteljahr wieder versuchbar. Sättigt 3 Tage (Achaz 36 Stunden). Öl: KO bei Fertigkeitsproben einen Tag +1, am nächsten Tag 1 Stufe Betäubung.', en: 'Nut: Willenskraft (Bedrohungen standhalten) –2; on a failure 5 minutes breathless (1 level of Betäubung), 6 hours 3 levels of Furcht, 7 hours tears (vision level 1), and no new try for a quarter year. Feeds for 3 days (Achaz 36 hours). Oil: KO +1 for skill checks for a day, then 1 level of Betäubung the next day.' },
      knowledge: [
         { de: 'Wächst an den Küsten Araniens und Maraskans; die Nüsse gibt es auf jedem Markt, ihr Öl stärkt die Ausdauer.', en: 'Grows on the coasts of Arania and Maraskan; its nuts are on every market, its oil raises stamina.' },
         { de: 'Yaganöl gilt auch als Heilmittel; der scharfe Kern treibt Tränen, macht Angst, sättigt aber 3 Tage.', en: 'Yagan oil is also a remedy; the sharp kernel brings tears and fear but feeds for 3 days.' },
         { de: 'Zutat für Aufputschmittel und Schlaftrünke; die Nesselblätter überraschen Sammler.', en: 'An ingredient of stimulants and sleeping draughts; its nettle leaves surprise gatherers.' },
      ],
   },
   Zithabar: {
      inhale: { de: 'Wirkt erst getrocknet und zu Schwarzem Pfeffer verarbeitet (Pflanzliche Rauschmittel).', en: 'Only works dried and made into Schwarzer Pfeffer (plant drugs).' },
      knowledge: [
         { de: 'Aus den getrockneten Blättern entsteht Schwarzer Pfeffer, ein bekanntes entspannendes Rauschkraut.', en: 'Its dried leaves make Schwarzer Pfeffer, a well-known relaxing drug herb.' },
         { de: 'Wächst im Land der Ersten Sonne auf feuchten Böden; frisch gekaut gegen Zahnschmerzen.', en: 'Grows in the Land of the First Sun on damp soil; chewed fresh against toothache.' },
         { de: 'Halluzinogen erst geraucht (Wasserpfeife, Kabasflöte); selten Kopfschmerzen, übermäßig gebraucht süchtig.', en: 'Hallucinogenic only when smoked (water pipe, kabas flute); rarely headaches, addictive with heavy use.' },
      ],
   },
   Zunderschwamm: {
      touch: { de: 'In feuchter Umgebung tritt vielleicht Flüssigkeit aus (keine Wirkung).', en: 'In damp places some liquid may seep out (no effect).' },
      knowledge: [
         { de: 'Wächst an geschwächten Bäumen; ergibt potenten Zunder.', en: 'Grows on weakened trees; yields potent tinder.' },
         { de: 'Stark befallene Bäume sind innen zerfressen und sturzgefährdet.', en: 'Heavily infested trees are rotten inside and may fall.' },
         { de: 'Sammelt Feuchtigkeit: im Notfall bis zu zwei Schank Wasser zum Auslutschen; Grundlage vieler Scherzartikel.', en: 'Collects moisture: in an emergency up to two cups of water to suck out; the basis of many practical jokes.' },
      ],
   },
   Zwölfblatt: {
      inhale: { de: 'Zwischen Rondra und Boron geerntet trägt es Sporen: Magenkrämpfe, Tränen, kurze Atemnot (Giftstufe 3, 1 Stufe Betäubung, 1W3 SP).', en: 'Harvested between Rondra and Boron it carries spores: stomach cramps, tears, brief breathlessness (poison level 3, 1 level of Betäubung, 1D3 SP).' },
      eat: { de: 'Frisch: schützt vier Tage vor Ansteckung mit allen nicht übernatürlichen Krankheiten.', en: 'Fresh: protects against catching any non-supernatural disease for four days.' },
      knowledge: [
         { de: 'Farnähnliche Heilpflanze, deren Blätter vor Ansteckung schützen.', en: 'A fern-like healing plant whose leaves protect against infection.' },
         { de: 'Leicht mit Farn zu verwechseln; frisch am besten, getrocknet als Zwölftee.', en: 'Easily confused with fern; best fresh, dried as Zwölftee.' },
         { de: 'Zwischen Rondra und Boron tragen die Blätter Sporen, die Krämpfe und Atemnot verursachen.', en: 'Between Rondra and Boron the leaves carry spores that cause cramps and breathlessness.' },
      ],
   },
}
