export type LocalizedText = { de: string; en: string }

export type AventurianStoreItem = {
   name: string
   price: {
      silbertaler: number
   }
   weight: number
   sourcePage?: number
   duration?: number | 'unlimited'
   description?: string
   kind?: 'equipment' | 'weapon' | 'shield' | 'armor' | 'bundle' | 'elixir' | 'poison' | 'herb' | 'book' | 'artifact' |
      'animal' | 'vehicle' | 'feed'
   // Priced options picked in the purchase dialog (Alchimica QS, trained mounts); the option label is appended to the name.
   variants?: Array<{ id: string; label: string; silbertaler: number; quality?: number }>
   // The rulebook lists no fixed price ("unterschiedlich" or a range): the buyer enters the agreed price.
   priceVaries?: { min?: number; max?: number }
   priceUnit?: 'per week' | 'per volume'
   magical?: boolean
   alchemy?: { laboratory: string; brewingDifficulty: number; ingredientCostPerLevel: number; levels: LocalizedText[] }
   poison?: { level: number; type: string; resistance: 'ZK' | 'SK'; onset: string; duration: string; effect: [LocalizedText, LocalizedText] }
   herb?: { search: number; identify: number; applications: string; effect: LocalizedText; rawPrice: number }
   book?: { script: string }
   // Bundle contents by catalog name; each becomes its own inventory entry (S. 364–365). `weight` only for pieces the
   // catalog does not sell on their own (taken from the package table).
   contents?: Array<{
      name: string
      amount: number
      weight?: number
   }>
   weapon?: {
      combatTechnique: string
      damage: string
      leadingAttribute?: string
      threshold?: number
      attackModifier?: number
      parryModifier?: number
      canParry?: boolean
      reach: 'short' | 'medium' | 'long' | 'ranged'
      length?: number
      reloadActions?: number | string
      range?: string
      ammunition?: string
      structurePoints?: number
   }
   armor?: {
      protection: number
      burden: number
      movementPenalty?: number
      initiativePenalty?: number
   }
}

export const aventurianStore: Record<string, AventurianStoreItem[]> = {
   // Reisebedarf und Werkzeuge (Traveling and Tools)
   Traveling_and_Tools: [
      {
         name: 'Angel mit Angelschnur',
         price: {
            silbertaler: 3,
         },
         weight: 0.5,
      },
      {
         name: 'Becher',
         price: {
            silbertaler: 0.3,
         },
         weight: 0.1,
      },
      {
         name: 'Beil/Handaxt',
         price: {
            silbertaler: 20,
         },
         weight: 0.75,
      },
      {
         name: 'Besen',
         price: {
            silbertaler: 0.5,
         },
         weight: 0.75,
      },
      {
         name: 'Bratspieß, Eisen',
         price: {
            silbertaler: 16,
         },
         weight: 3,
      },
      {
         name: 'Dreizack',
         price: {
            silbertaler: 50,
         },
         weight: 2,
      },
      {
         name: 'Dreschflegel',
         price: {
            silbertaler: 15,
         },
         weight: 1.5,
      },
      {
         name: 'Essbesteck',
         price: {
            silbertaler: 0.5,
         },
         weight: 0.1,
      },
      {
         name: 'Feile',
         price: {
            silbertaler: 15,
         },
         weight: 0.5,
      },
      {
         name: 'Flaschenzug für 250 Stein',
         price: {
            silbertaler: 55,
         },
         weight: 5,
      },
      {
         name: 'Hammer',
         price: {
            silbertaler: 3,
         },
         weight: 0.5,
      },
      {
         name: 'Handbohrer',
         price: {
            silbertaler: 7,
         },
         weight: 1,
      },
      {
         name: 'Handsäge',
         price: {
            silbertaler: 5,
         },
         weight: 0.5,
      },
      {
         name: 'Hängematte',
         price: {
            silbertaler: 2,
         },
         weight: 2,
      },
      {
         name: 'Haumesser',
         price: {
            silbertaler: 20,
         },
         weight: 0.75,
      },
      {
         name: 'Holzfälleraxt',
         price: {
            silbertaler: 80,
         },
         weight: 1.5,
      },
      {
         name: 'Holzschale',
         price: {
            silbertaler: 0.8,
         },
         weight: 0.2,
      },
      {
         name: 'Holzteller',
         price: {
            silbertaler: 0.9,
         },
         weight: 0.25,
      },
      {
         name: 'Kletterhaken (10x)',
         price: {
            silbertaler: 27,
         },
         weight: 1,
      },
      {
         name: 'Krug',
         price: {
            silbertaler: 1.5,
         },
         weight: 0.75,
      },
      {
         name: 'Kupferkessel',
         price: {
            silbertaler: 24,
         },
         weight: 4,
      },
      {
         name: 'Leim',
         price: {
            silbertaler: 1,
         },
         weight: 1,
      },
      {
         name: 'Meißel',
         price: {
            silbertaler: 5.5,
         },
         weight: 0.2,
      },
      {
         name: 'Messer',
         price: {
            silbertaler: 10,
         },
         weight: 0.25,
      },
      {
         name: 'Nadel- und Zwirnset',
         price: {
            silbertaler: 4.5,
         },
         weight: 0.1,
      },
      {
         name: 'Nägel, 10 Stück',
         price: {
            silbertaler: 0.6,
         },
         weight: 0.1,
      },
      {
         name: 'Pfanne',
         price: {
            silbertaler: 12,
         },
         weight: 2,
      },
      {
         // source: DSA5 Regelwerk, S. 375
         name: 'Proviant für einen Tag',
         price: {
            silbertaler: 0.5,
         },
         weight: 1.5,
         sourcePage: 375,
         description: 'Provisions for one person for one day.',
      },
      {
         name: 'Schaufel',
         price: {
            silbertaler: 8.5,
         },
         weight: 2,
      },
      {
         name: 'Schere',
         price: {
            silbertaler: 5,
         },
         weight: 0.25,
      },
      {
         name: 'Schlafsack',
         price: {
            silbertaler: 7,
         },
         weight: 2,
      },
      {
         name: 'Schneeschuhe',
         price: {
            silbertaler: 6.5,
         },
         weight: 1,
      },
      {
         name: 'Spaten',
         price: {
            silbertaler: 8.5,
         },
         weight: 2,
      },
      {
         name: 'Spitzhacke',
         price: {
            silbertaler: 20,
         },
         weight: 2.75,
      },
      {
         name: 'Strickleiter, pro Schritt',
         price: {
            silbertaler: 2.5,
         },
         weight: 0.5,
      },
      {
         name: 'Wolldecke',
         price: {
            silbertaler: 2,
         },
         weight: 1.5,
      },
      {
         name: 'Zange',
         price: {
            silbertaler: 6,
         },
         weight: 0.5,
      },
      {
         name: 'Zelt, 1 Person',
         price: {
            silbertaler: 14.5,
         },
         weight: 3,
      },
      {
         name: 'Zelt, 2 Personen',
         price: {
            silbertaler: 25,
         },
         weight: 6,
      },
   ],
   //Beleuchtung in english "Lighting"
   Sources_of_Light: [
      {
         name: 'Fackel',
         sourcePage: 376,
         price: {
            silbertaler: 0.5,
         },
         weight: 0.5,
         duration: 1.5,
      },
      {
         name: 'Gwen-Petryl-Stein',
         sourcePage: 376,
         price: {
            silbertaler: 1000,
         },
         weight: 0.75,
         duration: 'unlimited',
         description:
            'Bei einem Gwen-Petryl-Stein handelt es sich um einen bläulich leuchtenden Stein. Die Steine fallen vom Himmel oder werden an die Küsten der Meere gespült. Sie gelten als heilig und alle Steine, die größer als eine Faust sind, müssen der Efferdkirche übergeben werden. Man erzählt sich, dass die Steine Bruchstücke der Festung Alverans seien und aus der Sphäre der Götter stammen. Die Helligkeit des Lichts, das ein Gwen Petryl ausstrahlt, ist in etwa mit dem einer Fackel vergleichbar.',
      },
      {
         name: 'Kerzen, 10 Stück',
         sourcePage: 376,
         price: {
            silbertaler: 6,
         },
         weight: 0.5,
         duration: 10,
      },
      {
         name: 'Laterne',
         sourcePage: 376,
         price: {
            silbertaler: 8,
         },
         weight: 0.5,
         duration: 12,
      },
      {
         name: 'Öllampe',
         sourcePage: 376,
         price: {
            silbertaler: 0.5,
         },
         weight: 0.25,
         duration: 8,
      },
      {
         name: 'Abblendlaterne',
         sourcePage: 376,
         price: {
            silbertaler: 15,
         },
         weight: 1.5,
         duration: 12,
      },
   ],
   // "Nachfüllbedarf und Zubehör" in english for Beleuchtung is "Refills_and_Accessories"
   Refills_and_Accessories: [
      {
         name: 'Feuerstein und Stahl',
         price: {
            silbertaler: 3,
         },
         weight: 0.25,
      },
      {
         name: 'Kerzenständer',
         price: {
            silbertaler: 11.5,
         },
         weight: 0.75,
      },
      {
         name: 'Lampenöl, 12 Stunden Brennzeit',
         price: {
            silbertaler: 0.2,
         },
         weight: 0.5,
      },
      {
         name: 'Zunder, 25 Portionen',
         price: {
            silbertaler: 0.2,
         },
         weight: 0.025,
      },
      {
         name: 'Zunderdose (Platz für 25 Portionen)',
         price: {
            silbertaler: 1,
         },
         weight: 0.2,
      },
   ],
   // Verbandszeug und Heilmittel in english for "Bandages_and_Remedies"
   Bandages_and_Remedies: [
      {
         name: 'Blutegel',
         price: {
            silbertaler: 0.3,
         },
         weight: 0.001,
      },
      {
         name: 'Chirurgische Instrumente',
         price: {
            silbertaler: 80,
         },
         weight: 1.5,
      },
      {
         name: 'Schädelbohrer',
         price: {
            silbertaler: 17,
         },
         weight: 1,
      },
      {
         name: 'Schröpfglas',
         price: {
            silbertaler: 2,
         },
         weight: 0.25,
      },
      {
         name: 'Verband, 10 Stück',
         price: {
            silbertaler: 12.5,
         },
         weight: 0.05,
      },
      {
         name: 'Wundnähzeug',
         price: {
            silbertaler: 4.5,
         },
         weight: 0.1,
      },
   ],
   //Behältnisse in english for "Containers"
   Containers: [
      {
         name: 'Feldflasche',
         price: {
            silbertaler: 6,
         },
         weight: 0.25,
      },
      {
         name: 'Geldbeutel',
         price: {
            silbertaler: 1,
         },
         weight: 0.05,
      },
      {
         name: 'Geldkatze',
         price: {
            silbertaler: 2,
         },
         weight: 0.1,
      },
      {
         name: 'Gürteltasche',
         price: {
            silbertaler: 4,
         },
         weight: 0.25,
      },
      {
         name: 'Kiepe',
         price: {
            silbertaler: 7,
         },
         weight: 2,
      },
      {
         name: 'Lederranzen',
         price: {
            silbertaler: 17,
         },
         weight: 1,
      },
      {
         name: 'Lederrucksack',
         price: {
            silbertaler: 34,
         },
         weight: 2,
      },
      {
         name: 'Phiole',
         price: {
            silbertaler: 2,
         },
         weight: 0.1,
      },
      {
         name: 'Puderdöschen',
         price: {
            silbertaler: 6,
         },
         weight: 0.25,
      },
      {
         name: 'Sack',
         price: {
            silbertaler: 1,
         },
         weight: 0.75,
      },
      {
         name: 'Schmuckkästchen',
         price: {
            silbertaler: 20,
         },
         weight: 1,
      },
      {
         name: 'Tiegel',
         price: {
            silbertaler: 0.5,
         },
         weight: 0.25,
      },
      {
         name: 'Trinkhorn',
         price: {
            silbertaler: 0.5,
         },
         weight: 0.25,
      },
      {
         name: 'Truhe',
         price: {
            silbertaler: 18,
         },
         weight: 5,
      },
      {
         name: 'Tuchbeutel',
         price: {
            silbertaler: 0.75,
         },
         weight: 0.5,
      },
      {
         name: 'Umhängetasche',
         price: {
            silbertaler: 8.5,
         },
         weight: 0.5,
      },
      {
         name: 'Vase',
         price: {
            silbertaler: 1,
         },
         weight: 2,
      },
      {
         name: 'Wasserschlauch',
         price: {
            silbertaler: 5.5,
         },
         weight: 0.25,
      },
   ],
   Ropes_and_Climbing: [
      {
         name: 'Fesselseil',
         price: {
            silbertaler: 0.3,
         },
         weight: 0.25,
      },
      {
         name: 'Kette',
         price: {
            silbertaler: 12,
         },
         weight: 2,
      },
      {
         name: 'Kletterseil',
         price: {
            silbertaler: 1,
         },
         weight: 0.5,
      },
      {
         name: 'Schnur pro 10 Schritt',
         price: {
            silbertaler: 0.5,
         },
         weight: 0.1,
      },
   ],
   //Diebeswerkzeug
   Thieves_Tools: [
      {
         name: 'Brecheisen',
         price: {
            silbertaler: 26,
         },
         weight: 5,
      },
      {
         name: 'Dietriche',
         price: {
            silbertaler: 5,
         },
         weight: 0.25,
      },
      {
         name: 'Falscher Bart',
         price: {
            silbertaler: 2,
         },
         weight: 0.2,
      },
      {
         name: 'Wurfhaken',
         price: {
            silbertaler: 7,
         },
         weight: 1,
      },
   ],
   // source: DSA5 Regelwerk, S. 366–368
   Melee_Weapons: [
      {
         name: 'Schwerer Dolch',
         kind: 'weapon',
         price: { silbertaler: 60 },
         weight: 0.75,
         weapon: {
            combatTechnique: 'Dolche',
            damage: '1W6+2',
            leadingAttribute: 'GE',
            threshold: 14,
            attackModifier: 0,
            parryModifier: -1,
            reach: 'short',
            length: 35,
         },
      },
      {
         name: 'Langschwert',
         kind: 'weapon',
         price: { silbertaler: 200 },
         weight: 1,
         weapon: {
            combatTechnique: 'Schwerter',
            damage: '1W6+4',
            leadingAttribute: 'GE/KK',
            threshold: 15,
            attackModifier: 0,
            parryModifier: 0,
            reach: 'medium',
            length: 100,
         },
      },
      {
         name: 'Streitkolben',
         kind: 'weapon',
         price: { silbertaler: 105 },
         weight: 1.5,
         weapon: {
            combatTechnique: 'Hiebwaffen',
            damage: '1W6+4',
            leadingAttribute: 'KK',
            threshold: 14,
            attackModifier: 0,
            parryModifier: -1,
            reach: 'medium',
            length: 60,
         },
      },
   ],
   // source: DSA5 Regelwerk, S. 367
   Shields: [
      {
         name: 'Holzschild',
         kind: 'shield',
         price: { silbertaler: 50 },
         weight: 3.5,
         weapon: {
            combatTechnique: 'Schilde',
            damage: '1W6',
            leadingAttribute: 'KK',
            threshold: 16,
            attackModifier: -4,
            parryModifier: 1,
            reach: 'short',
            structurePoints: 20,
         },
      },
   ],
   // source: DSA5 Regelwerk, S. 372
   Ranged_Weapons: [
      {
         name: 'Kurzbogen',
         kind: 'weapon',
         price: { silbertaler: 45 },
         weight: 0.5,
         weapon: {
            combatTechnique: 'Bögen',
            damage: '1W6+4',
            reach: 'ranged',
            length: 130,
            reloadActions: 1,
            range: '10/50/80',
            ammunition: 'Pfeile',
         },
      },
      {
         name: 'Leichte Armbrust',
         kind: 'weapon',
         price: { silbertaler: 180 },
         weight: 3.25,
         weapon: {
            combatTechnique: 'Armbrüste',
            damage: '1W6+6',
            reach: 'ranged',
            length: 110,
            reloadActions: 8,
            range: '10/50/80',
            ammunition: 'Bolzen',
         },
      },
   ],
   // source: DSA5 Regelwerk, S. 374
   Armor: [
      {
         name: 'Gambeson',
         kind: 'armor',
         price: { silbertaler: 75 },
         weight: 3,
         armor: { protection: 2, burden: 1 },
      },
      {
         name: 'Kettenrüstung',
         kind: 'armor',
         price: { silbertaler: 250 },
         weight: 12,
         armor: { protection: 4, burden: 2 },
      },
      {
         name: 'Plattenrüstung',
         kind: 'armor',
         price: { silbertaler: 750 },
         weight: 25,
         armor: { protection: 6, burden: 3 },
      },
   ],
   // source: DSA5 Regelwerk, S. 364–365
   Equipment_Packages: [
      {
         name: 'Reisepaket',
         kind: 'bundle',
         price: { silbertaler: 120 },
         weight: 20,
         description: 'Ready-made travel equipment package.',
         contents: [
            // source: DSA5 Regelwerk, S. 364 (Reisepaket, 20 Stein, 120 S)
            { name: 'Amulette, Götterfigürchen und andere persönliche Gegenstände', amount: 1, weight: 2.175 },
            { name: 'Becher', amount: 1 },
            { name: 'Beil/Handaxt', amount: 1 },
            { name: 'Essbesteck', amount: 1 },
            { name: 'Wolldecke', amount: 1 },
            { name: 'Feuerstein und Stahl', amount: 1 },
            { name: 'Geldbeutel', amount: 1 },
            { name: 'Kletterseil', amount: 10 },
            { name: 'Lederrucksack', amount: 1 },
            { name: 'Messer', amount: 1 },
            { name: 'Nadel- und Zwirnset', amount: 1 },
            { name: 'Fackel', amount: 1 },
            { name: 'Proviant für einen Tag', amount: 3 },
            { name: 'Holzschale', amount: 1 },
            { name: 'Verband, 10 Stück', amount: 1 },
            { name: 'Waffenpflegeset (Schleifstein, Tücher)', amount: 1 },
            { name: 'Wasserschlauch', amount: 1 },
            { name: 'Wurfhaken', amount: 1 },
            { name: 'Zunder, 25 Portionen', amount: 1 },
            { name: 'Zunderdose (Platz für 25 Portionen)', amount: 1 },
         ],
      },
      {
         name: 'Stadtpaket',
         kind: 'bundle',
         price: { silbertaler: 31.1 },
         weight: 1.325,
         description: 'Ready-made city equipment package.',
         contents: [
            // source: DSA5 Regelwerk, S. 365 (Stadtpaket, 1,325 Stein, 31,1 S)
            { name: 'Geldkatze', amount: 1 },
            { name: 'Kohlestift', amount: 1 },
            { name: 'Lampenöl, 8 Stunden Brennzeit', amount: 1, weight: 0.25 },
            { name: 'Messer', amount: 1 },
            { name: 'Nadel- und Zwirnset', amount: 1 },
            { name: 'Öllampe', amount: 1 },
            { name: 'Papier, 1 Blatt', amount: 1 },
            { name: 'Verband, 10 Stück', amount: 1 },
            { name: 'Zunder, 25 Portionen', amount: 1 },
            { name: 'Zunderdose (Platz für 25 Portionen)', amount: 1 },
         ],
      },
      {
         name: 'Wildnispaket',
         kind: 'bundle',
         price: { silbertaler: 133.5 },
         weight: 22.825,
         description: 'Ready-made wilderness equipment package.',
         contents: [
            // source: DSA5 Regelwerk, S. 365 (Wildnispaket, 22,825 Stein, 133,5 S)
            { name: 'Beil/Handaxt', amount: 1 },
            { name: 'Wolldecke', amount: 1 },
            { name: 'Feuerstein und Stahl', amount: 1 },
            { name: 'Kletterseil', amount: 10 },
            { name: 'Lederrucksack', amount: 1 },
            { name: 'Messer', amount: 1 },
            { name: 'Nadel- und Zwirnset', amount: 1 },
            { name: 'Fackel', amount: 1 },
            { name: 'Proviant für einen Tag', amount: 5 },
            { name: 'Holzschale', amount: 1 },
            { name: 'Verband, 10 Stück', amount: 1 },
            { name: 'Wasserschlauch', amount: 2 },
            { name: 'Wurfhaken', amount: 1 },
            { name: 'Zelt, 1 Person', amount: 1 },
            { name: 'Zunder, 25 Portionen', amount: 1 },
            { name: 'Zunderdose (Platz für 25 Portionen)', amount: 1 },
         ],
      },
   ],
   //Werkzeugsammlungen in english
   Tool_Collections: [
      {
         name: 'Archaisches Labor',
         price: {
            silbertaler: 200,
         },
         weight: 30,
      },
      {
         name: 'Hexenküche',
         price: {
            silbertaler: 1000,
         },
         weight: 200,
      },
      {
         name: 'Alchemistenlabor',
         price: {
            silbertaler: 5000,
         },
         weight: 1000,
      },
      {
         name: 'Feinmechanikerwerkzeug',
         price: {
            silbertaler: 100,
         },
         weight: 0.5,
      },
      {
         name: 'Gravurwerkzeug',
         price: {
            silbertaler: 30,
         },
         weight: 0.5,
      },
      {
         name: 'Kartographiewerkzeug',
         price: {
            silbertaler: 50,
         },
         weight: 0.25,
      },
      {
         name: 'Nähkästchen',
         price: {
            silbertaler: 10,
         },
         weight: 0.25,
      },
      {
         name: 'Tätowierwerkzeug',
         price: {
            silbertaler: 20,
         },
         weight: 0.5,
      },
      {
         name: 'Zimmermannskasten',
         price: {
            silbertaler: 50,
         },
         weight: 5,
      },
   ],
   //Orientierungshilfen in english
   Orientation_Aids: [
      {
         name: 'Abakus',
         price: {
            silbertaler: 10,
         },
         weight: 0.5,
      },
      {
         name: 'Astrolabium',
         price: {
            silbertaler: 250,
         },
         weight: 3,
         description:
            'Dient zur Messung am Sternenhimmel und Navigation auf See',
      },
      {
         name: 'Bernsteinbrille',
         price: {
            silbertaler: 1000,
         },
         weight: 0.1,
      },
      {
         name: 'Fernrohr',
         price: {
            silbertaler: 150,
         },
         weight: 1.25,
      },
      {
         name: 'Kompass (Südweiser)',
         price: {
            silbertaler: 6,
         },
         weight: 0.25,
         description: 'Weist stets mit seiner Nadel Richtigung Praios',
      },
      {
         name: 'Quadrant',
         price: {
            silbertaler: 70,
         },
         weight: 0.75,
         description: 'Dient zur Messung am Sternenhimmel und Navigation auf See',
      },
      {
         name: 'Stundenglas',
         price: {
            silbertaler: 40,
         },
         weight: 0.5,
      },
      {
         name: 'Taschenuhr (Vinsalter Ei)',
         price: {
            silbertaler: 800,
         },
         weight: 0.25,
      },
   ],
}

type EquipmentRow = [name: string, weight: number, silbertaler: number]
function equipmentRows(rows: EquipmentRow[], sourcePage: number): AventurianStoreItem[] {
   return rows.map(([name, weight, silbertaler]) => ({ name, weight, price: { silbertaler }, sourcePage, kind: 'equipment' }))
}

// source: DSA5 Regelwerk, S. 373; weight 0 is an app policy because no weight is listed.
aventurianStore.Ammunition = equipmentRows([
   ['Pfeile', 0, 0.4], ['Bolzen', 0, 0.2], ['Kugeln', 0, 0.5],
], 373).map((item) => ({
   ...item,
   description: 'Price per projectile. No weight listed in the rulebook; treated as 0 for carrying weight.',
}))

// source: DSA5 Regelwerk, S. 374–375
aventurianStore.Clothing = [
   ...equipmentRows([
      ['Ballkleid', 1.5, 350], ['Barett', 0.1, 1], ['Brusttuch', 0.2, 0.3], ['Filzhut', 0.1, 0.5],
      ['Gugel', 0.2, 2], ['Halstuch', 0.1, 4], ['Hemd', 0.5, 3], ['Hose', 0.75, 3],
      ['Hose mit Hosentasche', 0.75, 3], ['Jacke', 1, 5], ['Kaftan', 1.25, 7.5],
      ['Kapuzenumhang', 2, 6], ['Kleid', 1.5, 6], ['Korsett', 1, 150], ['Kutte', 2, 2.5],
      ['Ledergürtel', 0.2, 3], ['Lederhandschuhe', 1, 0.3], ['Lederhut mit breiter Krempe', 0.5, 10],
      ['Ledermantel', 3, 75], ['Lederschuhe', 1, 5], ['Lederschürze mit Taschen', 1, 7],
      ['Lederstiefel', 1, 12], ['Lendenschurz', 0.2, 0.3], ['Magierrobe', 3, 120],
      ['Mantel', 1.5, 7], ['Nachthemd', 0.5, 1.5], ['Pelzfäustlinge', 0.5, 6],
      ['Pelzgefütterte Stiefel', 2.5, 24], ['Pelzmütze', 0.75, 6], ['Rock', 1, 3],
   ], 374),
   ...equipmentRows([
      ['Sandalen', 0.75, 2], ['Schal', 0.2, 0.5], ['Schleier', 0.05, 20], ['Schnürmieder', 0.5, 20],
      ['Seidenschärpe', 0.1, 20], ['Seidenstrümpfe', 0.1, 80], ['Strohhut', 0.5, 0.2],
      ['Tunika', 1, 1.5], ['Turban', 0.75, 0.8], ['Unterhosen', 0.5, 1], ['Unterkleid', 0.5, 5],
      ['Wappenrock', 0.75, 5], ['Weste', 0.5, 3], ['Wollstrümpfe', 0.1, 0.5],
   ], 375),
   // source: DSA5 Regelwerk, S. 375; weight 0 is the user-approved app policy.
   ...equipmentRows([
      ['Kleidungspaket (Unfrei)', 0, 5], ['Kleidungspaket (Frei)', 0, 25],
      ['Kleidungspaket (Niederadel)', 0, 150], ['Kleidungspaket (Adel)', 0, 1000],
      ['Kleidungspaket (Hochadel)', 0, 1500],
   ], 375).map((item) => ({
      ...item,
      kind: 'bundle' as const,
      description: 'One clothing set appropriate to social status and culture. Individual pieces are not specified; spare clothing is purchased separately. No weight listed; treated as 0 for carrying weight.',
   })),
]
// source: DSA5 Regelwerk, S. 374
aventurianStore.Weapon_Accessories = equipmentRows([
   ['Bogensehne', 0.05, 1], ['Dolchscheide', 0.25, 5], ['Köcher, für 20 Pfeile oder Bolzen', 0.75, 15],
   ['Schwertscheide', 0.75, 12], ['Unterkleidung für Metallrüstungen', 2.5, 12],
   ['Waffenpflegeset (Schleifstein, Tücher)', 1, 1],
], 374)
// source: DSA5 Regelwerk, S. 378–379
aventurianStore.Writing_Supplies = [
   ...equipmentRows([
      ['Federkiel', 0.05, 0.1], ['Federmesser', 0.2, 3], ['Kohlestift', 0.05, 0.2], ['Kreide', 0.05, 0.2],
      ['Papier, 1 Blatt', 0.05, 0.1], ['Pergament, 1 Blatt', 0.05, 1],
   ], 378),
   ...equipmentRows([['Pinsel', 0.05, 1], ['Siegelwachs', 0.1, 3], ['Tagebuch', 1.5, 11], ['Tinte', 0.1, 1]], 379),
]
// source: DSA5 Regelwerk, S. 378 (uncut gems, 10 Karat = 2 Gramm)
aventurianStore.Gemstones = equipmentRows([
   ['Amethyst, 10 Karat', 0.002, 1.5], ['Aquamarin, 10 Karat', 0.002, 18], ['Aventurin, 10 Karat', 0.002, 2.5],
   ['Bergkristall, 10 Karat', 0.002, 2], ['Bernstein, 10 Karat', 0.002, 90], ['Diamant, 10 Karat', 0.002, 150],
   ['Granat, 10 Karat', 0.002, 8], ['Grüne Jade, 10 Karat', 0.002, 20], ['Karneol, 10 Karat', 0.002, 2],
   ['Lapislazuli, 10 Karat', 0.002, 17], ['Mondstein, 10 Karat', 0.002, 1], ['Onyx, 10 Karat', 0.002, 1.5],
   ['Opal, 10 Karat', 0.002, 22], ['Perle, 10 Karat', 0.002, 70], ['Rubin, 10 Karat', 0.002, 140],
   ['Saphir, 10 Karat', 0.002, 120], ['Smaragd, 10 Karat', 0.002, 110], ['Topas, 10 Karat', 0.002, 20],
   ['Türkis, 10 Karat', 0.002, 15],
], 378).map((item) => ({ ...item, description: 'Uncut gemstone, 10 Karat (2 grams). Cut stones can cost two to five times as much.' }))
// source: DSA5 Regelwerk, S. 378 (Bronze / Silber / Gold)
const jewelryRows: [string, number, number, number, number, number, number][] = [
   ['Amulett', 0.05, 0.05, 0.1, 7.5, 12, 107], ['Armreif', 0.05, 0.05, 0.1, 5.5, 10, 105],
   ['Fibel', 0.025, 0.025, 0.05, 5.25, 7.5, 55], ['Halskette', 0.15, 0.15, 0.3, 6.5, 22, 157],
   ['Ohrring', 0.025, 0.025, 0.05, 7.25, 9.5, 57], ['Ring', 0.025, 0.025, 0.05, 5.25, 7.5, 55],
   ['Stirnreif', 0.1, 0.1, 0.2, 8, 17, 207],
]
aventurianStore.Jewelry = jewelryRows.flatMap(([name, bronze, silver, gold, bronzePrice, silverPrice, goldPrice]) =>
   equipmentRows([[`${name} (Bronze)`, bronze, bronzePrice], [`${name} (Silber)`, silver, silverPrice], [`${name} (Gold)`, gold, goldPrice]], 378))
// source: DSA5 Regelwerk, S. 380
aventurianStore.Musical_Instruments = equipmentRows([
   ['Drehleier', 2, 200], ['Fanfare', 1, 50], ['Flöte', 0.25, 2], ['Handharfe', 1, 100],
   ['Kabasflöte', 0.75, 4], ['Laute', 2, 150], ['Sackpfeife', 2, 30], ['Schelle', 0.05, 1],
   ['Signalhorn', 1, 3], ['Spinett', 100, 4000], ['Standharfe', 5.5, 550], ['Trommel', 0.5, 15],
], 380)
// source: DSA5 Regelwerk, S. 380–381
aventurianStore.Luxury_and_Leisure = [
   ...equipmentRows([
      ['Badeöl', 1, 100], ['Bier, kleines Fässchen', 2, 0.16], ['Brennglas', 0.1, 65], ['Brettspiel', 1, 5],
      ['Bürste', 0.25, 4], ['Götterfigürchen', 0.2, 3], ['Handspiegel', 0.5, 60], ['Jonglierball', 0.2, 0.5],
      ['Kaffee, geröstet', 0.1, 20], ['Kakao', 0.1, 4], ['Kamm', 0.1, 1], ['Kristallkugel', 1.5, 2000],
   ], 380),
   ...equipmentRows([
      ['Lippenrot', 0.05, 10], ['Nagelfeile', 0.05, 20], ['Parfüm', 0.1, 120], ['Pfeffer', 0.1, 4.5],
      ['Puder', 0.05, 5], ['Schnaps', 1, 2], ['Schokolade', 0.1, 5], ['Schwamm', 0.1, 2],
      ['Seife', 0.5, 1], ['Spielkarten', 0.25, 5], ['Spieluhr', 0.25, 400], ['Steckenpferd', 1, 3],
      ['Stoffpuppe', 0.25, 1], ['Tabak', 0.1, 0.1], ['Tabakdose', 0.05, 3], ['Tabakspfeife', 0.1, 5],
      ['Taschentuch', 0.1, 2], ['Wasserpfeife', 1, 30], ['Wein', 1, 0.45], ['Würfel', 0.05, 0.5],
   ], 381),
]
// source: DSA5 Regelwerk, S. 381
aventurianStore.Animal_Equipment = equipmentRows([
   ['Halsband und Leine', 0.5, 1], ['Hufeisen', 0.5, 4], ['Packsattel', 10, 30], ['Reitsattel', 6, 60],
   ['Satteldecke', 0.75, 1], ['Satteltasche', 1, 17], ['Sporen', 0.25, 6], ['Striegelzeug', 1, 16],
   ['Zügel und Zaumzeug', 1, 15],
], 381)

type MeleeRow = [
   name: string, damage: string, leadingAttribute: string | undefined, threshold: number | undefined,
   attackModifier: number | undefined, parryModifier: number | undefined,
   reach: 'short' | 'medium' | 'long', weight: number, length: number, price: number,
]
function meleeRows(rows: MeleeRow[], combatTechnique: string, sourcePage: number): AventurianStoreItem[] {
   return rows.map(([name, damage, leadingAttribute, threshold, attackModifier, parryModifier, reach, weight, length, silbertaler]) => ({
      name, kind: 'weapon', weight, price: { silbertaler }, sourcePage,
      weapon: { combatTechnique, damage, leadingAttribute, threshold, attackModifier, parryModifier, reach, length,
         canParry: combatTechnique !== 'Kettenwaffen' && combatTechnique !== 'Lanzen' },
   }))
}
// source: DSA5 Regelwerk, S. 366–368
aventurianStore.Melee_Weapons.push(
   ...meleeRows([
      ['Basiliskenzunge', '1W6+2', 'GE', 14, 0, -1, 'short', 0.5, 30, 50],
      ['Dolch', '1W6+1', 'GE', 14, 0, 0, 'short', 0.5, 30, 45],
      ['Drachenzahn', '1W6+2', 'GE', 14, 0, -1, 'short', 0.75, 40, 70],
      ['Linkhand', '1W6+1', 'GE', 14, 0, 0, 'short', 0.75, 30, 90],
      ['Waqqif', '1W6+2', 'GE', 14, 0, -1, 'short', 0.5, 45, 60],
   ], 'Dolche', 366),
   ...meleeRows([
      ['Florett', '1W6+2', 'GE', 14, 1, 0, 'medium', 0.5, 100, 300],
      ['Rapier', '1W6+3', 'GE', 15, 1, 0, 'medium', 1, 100, 200],
      ['Wolfsmesser', '1W6+3', 'GE', 15, 1, 1, 'medium', 0.5, 100, 300],
   ], 'Fechtwaffen', 366),
   ...meleeRows([
      ['Brabakbengel', '1W6+5', 'KK', 14, -1, -2, 'medium', 2, 90, 170],
      ['Keule', '1W6+3', 'KK', 14, 0, -1, 'medium', 0.75, 80, 3],
      ['Knüppel', '1W6+2', 'KK', 14, 0, -2, 'medium', 0.5, 80, 0],
      ['Lindwurmschläger', '1W6+4', 'KK', 14, 0, -1, 'short', 1, 50, 90],
      ['Magierstab, kurz', '1W6+1', 'KK', 14, 0, -1, 'short', 0.75, 50, 40],
   ], 'Hiebwaffen', 366),
   ...meleeRows([
      ['Magierstab, mittel', '1W6+2', 'KK', 14, 0, -1, 'medium', 0.75, 100, 60],
      ['Molokdeschnaja', '1W6+4', 'KK', 14, 0, -1, 'medium', 1.25, 100, 95],
      ['Orknase', '1W6+5', 'KK', 14, -1, -2, 'medium', 1.75, 110, 120],
      ['Rabenschnabel', '1W6+4', 'KK', 14, 0, -1, 'medium', 1.5, 110, 105],
      ['Rabenschnabel (profan)', '1W6+4', 'KK', 14, 0, -1, 'medium', 1.5, 110, 90],
      ['Sonnenzepter', '1W6+3', 'KK', 14, 0, -1, 'medium', 1.25, 70, 250],
      ['Streitaxt', '1W6+4', 'KK', 14, 0, -1, 'medium', 1.5, 100, 105],
   ], 'Hiebwaffen', 367),
   ...meleeRows([['Morgenstern', '1W6+5', 'KK', 14, 0, undefined, 'medium', 1.5, 100, 110]], 'Kettenwaffen', 367),
   ...meleeRows([['Kriegslanze', '2W6+6', undefined, undefined, undefined, undefined, 'long', 3.75, 300, 100]], 'Lanzen', 367),
   ...meleeRows([['Schlagring', '1W6+1', 'GE/KK', 15, 0, 0, 'short', 0.25, 10, 25]], 'Raufen', 367),
   ...meleeRows([
      ['Barbarenschwert', '1W6+5', 'GE/KK', 15, -1, -1, 'medium', 1.5, 90, 140],
      ['Entermesser', '1W6+3', 'GE/KK', 15, 0, -1, 'medium', 0.75, 75, 120],
      ['Haumesser (Waffe)', '1W6+3', 'GE/KK', 15, 0, -1, 'medium', 0.75, 70, 100],
      ['Khunchomer', '1W6+4', 'GE/KK', 15, 0, 0, 'medium', 1.25, 80, 210],
      ['Kurzschwert', '1W6+2', 'GE/KK', 15, 0, 0, 'short', 0.75, 60, 140],
      ['Robbentöter', '1W6+4', 'GE/KK', 15, 0, 0, 'medium', 1, 90, 200],
      ['Säbel', '1W6+3', 'GE/KK', 15, 0, 0, 'medium', 0.75, 90, 180],
      ['Sklaventod', '1W6+4', 'GE/KK', 15, 0, 0, 'medium', 1.25, 90, 210],
   ], 'Schwerter', 368),
   ...meleeRows([
      ['Dreizack (2H)', '1W6+4', 'GE/KK', 15, 0, 0, 'long', 2, 200, 80],
      ['Dschadra (2H)', '1W6+5', 'GE/KK', 15, 0, -1, 'long', 2, 200, 60],
      ['Hellebarde (2H)', '1W6+6', 'GE/KK', 15, 0, -2, 'long', 2.5, 200, 160],
      ['Holzspeer (2H)', '1W6+2', 'GE/KK', 15, 0, 0, 'long', 1, 150, 1],
      ['Kampfstab (2H)', '1W6+2', 'GE/KK', 15, 0, 2, 'long', 1, 150, 40],
      ['Magierstab, lang (2H)', '1W6+2', 'GE/KK', 16, -1, 2, 'long', 0.75, 150, 80],
      ['Speer (2H)', '1W6+4', 'GE/KK', 15, 0, 0, 'long', 2, 200, 45],
      ['Zweililien (2H)', '1W6+4', 'GE/KK', 15, 0, 2, 'medium', 2, 150, 200],
   ], 'Stangenwaffen', 368),
   ...meleeRows([
      ['Anderthalbhänder (2H)', '1W6+6', 'KK', 14, 0, 0, 'medium', 2, 140, 320],
      ['Doppelkhunchomer (2H)', '2W6+3', 'KK', 14, 0, -2, 'medium', 2, 130, 320],
      ['Großer Sklaventod (2H)', '2W6+3', 'KK', 14, 0, -2, 'medium', 2, 140, 320],
      ['Rondrakamm (2H)', '2W6+2', 'KK', 14, 0, -1, 'medium', 2, 130, 340],
      ['Tuzakmesser (2H)', '1W6+6', 'KK', 14, 0, 0, 'medium', 1.75, 130, 360],
      ['Zweihänder (2H)', '2W6+4', 'KK', 14, 0, -3, 'medium', 2.5, 160, 360],
   ], 'Zweihandschwerter', 368),
   ...meleeRows([
      ['Barbarenstreitaxt (2H)', '2W6+4', 'KK', 13, 0, -4, 'medium', 3.5, 120, 175],
      ['Felsspalter (2H)', '2W6+2', 'KK', 13, 0, -2, 'medium', 3, 120, 200],
      ['Kriegshammer (2H)', '2W6+3', 'KK', 13, 0, -3, 'medium', 3, 120, 170],
      ['Zwergenschlägel (2H)', '1W6+6', 'KK', 13, 0, -1, 'medium', 3, 120, 100],
   ], 'Zweihandhiebwaffen', 368),
)
// source: DSA5 Regelwerk, S. 366 (existing tool with the same price and weight, not a duplicate)
const knife = aventurianStore.Traveling_and_Tools.find((item) => item.name === 'Messer')
if (!knife) throw new Error('Missing Messer catalog entry')
knife.kind = 'weapon'
knife.weapon = { combatTechnique: 'Dolche', damage: '1W6+1', leadingAttribute: 'GE', threshold: 14,
   attackModifier: 0, parryModifier: -2, reach: 'short', length: 25 }
knife.sourcePage = 366
// source: DSA5 Regelwerk, S. 367
aventurianStore.Shields.push(...([
   ['Lederschild', 2, 30, -4, 1, 20, '1W6'],
   ['Thorwalerschild', 4.5, 70, -5, 2, 25, '1W6+1'],
   ['Großschild', 6, 100, -6, 3, 30, '1W6+1'],
] satisfies [string, number, number, number, number, number, string][]).map(([name, weight, silbertaler, attackModifier, parryModifier, structurePoints, damage]): AventurianStoreItem => ({
   name, weight, price: { silbertaler }, sourcePage: 367, kind: 'shield',
   weapon: { combatTechnique: 'Schilde', damage, leadingAttribute: 'KK', threshold: 16, attackModifier, parryModifier, structurePoints, reach: 'short' },
})))
// source: DSA5 Regelwerk, S. 372
type RangedRow = [string, string, number | string, string, string | undefined, number, number, number]
function rangedRows(rows: RangedRow[], combatTechnique: string): AventurianStoreItem[] {
   return rows.map(([name, damage, reloadActions, range, ammunition, weight, length, silbertaler]) => ({
      name, weight, price: { silbertaler }, kind: 'weapon', sourcePage: 372,
      weapon: { combatTechnique, damage, reloadActions, range, ammunition, length, reach: 'ranged' },
   }))
}
aventurianStore.Ranged_Weapons.push(
   ...rangedRows([
      ['Balestrina', '1W6+4', 2, '5/25/40', 'Kugeln', 0.75, 40, 120],
      ['Eisenwalder', '1W6+4', '2/10', '10/50/80', 'Bolzen', 3.75, 90, 500],
      ['Handarmbrust', '1W6+3', 3, '5/25/40', 'Bolzen', 0.75, 40, 100],
      ['Schwere Armbrust', '2W6+6', 15, '20/100/160', 'Bolzen', 7.25, 80, 360],
   ], 'Armbrüste'),
   ...rangedRows([
      ['Elfenbogen', '1W6+5', 1, '50/100/200', 'Pfeile', 0.5, 180, 400],
      ['Kompositbogen', '1W6+7', 2, '20/100/160', 'Pfeile', 0.75, 140, 160],
      ['Langbogen', '1W6+8', 2, '20/100/160', 'Pfeile', 0.75, 200, 80],
   ], 'Bögen'),
   ...rangedRows([
      ['Schneidzahn', '1W6+4', 1, '2/10/15', undefined, 1, 50, 80],
      ['Stein', '1W6', 1, '2/10/15', undefined, 1, 45, 0],
      ['Wurfbeil', '1W6+3', 1, '2/10/15', undefined, 0.75, 40, 50],
      ['Wurfdolch', '1W6+1', 1, '2/10/15', undefined, 0.5, 30, 45],
      ['Wurfkeule', '1W6+2', 1, '2/10/15', undefined, 1, 50, 5],
      ['Wurfring, -scheibe, -stern', '1W6+1', 1, '2/10/15', undefined, 0.25, 10, 30],
      ['Wurfspeer', '2W6+2', 2, '5/25/40', undefined, 0.75, 110, 40],
   ], 'Wurfwaffen'),
)
// source: DSA5 Regelwerk, S. 374
aventurianStore.Armor.push(
   { name: 'Lederrüstung', kind: 'armor', weight: 6, price: { silbertaler: 150 }, sourcePage: 374,
      armor: { protection: 3, burden: 1, movementPenalty: 1, initiativePenalty: 1 } },
   { name: 'Schuppenrüstung', kind: 'armor', weight: 18, price: { silbertaler: 400 }, sourcePage: 374,
      armor: { protection: 5, burden: 2, movementPenalty: 1, initiativePenalty: 1 } },
)

// source: DSA5 Regelwerk, S. 366–368, 372 (reference-only restrictions and special weapon handling)
const weaponNotes: Record<string, string> = {
   Basiliskenzunge: 'Consecrated Hesinde weapon; acquisition is restricted. No automatic consecration effects.',
   Drachenzahn: 'Creation acquisition requires a dwarven culture.',
   Lindwurmschläger: 'Creation acquisition requires a dwarven culture.',
   'Felsspalter (2H)': 'Creation acquisition requires a dwarven culture.',
   'Zwergenschlägel (2H)': 'Creation acquisition requires a dwarven culture.',
   Wolfsmesser: 'Creation acquisition requires Auelfen or Waldelfen culture.',
   Robbentöter: 'Creation acquisition requires Firnelfen culture.',
   'Magierstab, kurz': 'Creation acquisition requires Tradition (Gildenmagier). Binding is separate.',
   'Magierstab, mittel': 'Creation acquisition requires Tradition (Gildenmagier). Binding is separate.',
   'Magierstab, lang (2H)': 'Creation acquisition requires Tradition (Gildenmagier). Binding is separate.',
   Linkhand: 'Parrying weapon: +1 PA to the main weapon while equipped (applied in fights).',
   Großschild: 'Large shield: −1 AT to the main weapon while equipped (applied in fights).',
   Kriegslanze: 'Only usable for a lance attack.',
   Rabenschnabel: 'Consecrated Boron weapon; acquisition is restricted. No automatic consecration effects.',
   Sonnenzepter: 'Consecrated Praios weapon; acquisition is restricted. No automatic consecration effects.',
   'Rondrakamm (2H)': 'Consecrated Rondra weapon; acquisition is restricted. No automatic consecration effects.',
   Eisenwalder: 'Magazine holds 10 shots: 2 actions per shot, 10 actions to replace the magazine.',
}
for (const item of [...aventurianStore.Melee_Weapons, ...aventurianStore.Shields, ...aventurianStore.Ranged_Weapons]) {
   if (weaponNotes[item.name]) item.description = weaponNotes[item.name]
}
// source: DSA5 Regelwerk, S. 379 (price per QS), S. 272–274 (laboratory, Brauschwierigkeit, ingredients, QS effects)
const qualityVariants = (perQuality: number) => [1, 2, 3, 4, 5, 6].map((quality) => ({
   id: `QS ${quality}`, label: `QS ${quality}`, silbertaler: perQuality * quality, quality,
}))
const elixir = (name: string, perQuality: number, laboratory: string, brewingDifficulty: number,
   ingredientCostPerLevel: number, levels: LocalizedText[], description: string): AventurianStoreItem => ({
   name, kind: 'elixir', weight: 0, price: { silbertaler: perQuality }, sourcePage: 379, description,
   variants: qualityVariants(perQuality), alchemy: { laboratory, brewingDifficulty, ingredientCostPerLevel, levels },
})
const transformDe = ['10 Minuten', '5 Minuten', '2 Minuten', '1 Minute', '30 Sekunden', '15 Sekunden']
const transformEn = ['10 minutes', '5 minutes', '2 minutes', '1 minute', '30 seconds', '15 seconds']
const timedTransformation = (values: number[], de: string, en: string, firstNote: LocalizedText = { de: '', en: '' }): LocalizedText[] =>
   values.map((value, index) => ({
      de: `${de} ${value} Minute${value === 1 ? '' : 'n'}. Übergang jeweils ${transformDe[index]}${index === 0 ? firstNote.de : ''}.`,
      en: `${en} ${value} minute${value === 1 ? '' : 's'}. Transition ${transformEn[index]} each way${index === 0 ? firstNote.en : ''}.`,
   }))
const healDice = ['1W3', '1W6', '1W6+2', '1W6+4', '1W6+6', '1W6+8']
aventurianStore.Alchimica = [
   elixir('Antidot', 65, 'Hexenküche', -1, 40, [1, 2, 3, 4, 5, 6].map((level) => ({
      de: `Hebt Gifte bis Stufe ${level} auf.`, en: `Neutralizes poisons up to level ${level}.`,
   })), 'Counters most weaker poisons; very strong alchemical poisons cannot be neutralized.'),
   elixir('Heiltrank', 60, 'Archaisches Labor', 0, 40, healDice.map((dice) => ({
      de: `Heilt bei Einnahme ${dice} LeP.`, en: `Heals ${dice} LeP when drunk.`,
   })), 'Heals LeP instantly and can save someone at death’s door.'),
   elixir('Liebestrunk', 80, 'Hexenküche', -1, 55, [
      { de: 'Steigert Potenz oder Fruchtbarkeit.', en: 'Increases potency or fertility.' },
      { de: 'Zudem freundschaftlich verbunden mit der ersten erblickten Person.', en: 'Also feels friendly towards the first person seen.' },
      { de: 'Zudem eine Stunde lang stark erregt.', en: 'Also strongly aroused for one hour.' },
      { de: 'Zudem romantische Gefühle für die erste erblickte Person.', en: 'Also romantic feelings for the first person seen.' },
      { de: 'Zudem einen Tag lang verliebt in die erste erblickte Person.', en: 'Also in love with the first person seen for one day.' },
      { de: 'Zudem eine Woche lang verliebt in die erste erblickte Person.', en: 'Also in love with the first person seen for one week.' },
   ], 'Cannot create true love. Effects are cumulative per QS.'),
   elixir('Unsichtbarkeitselixier', 80, 'Hexenküche', -2, 55,
      timedTransformation([1, 3, 5, 10, 15, 20], 'Unsichtbar für', 'Invisible for'),
      'The body becomes invisible from the outside in over the transition time.'),
   elixir('Verwandlungselixier', 80, 'Hexenküche', -2, 55,
      timedTransformation([1, 2, 5, 10, 15, 20], 'Verwandlung für', 'Transformed for', {
         de: '; Finger, Ohren oder Zehen verwandeln sich nicht ganz', en: '; fingers, ears or toes do not fully change',
      }),
      'Turns the drinker into the animal chosen when brewing (not supernatural, not larger than a human). One level of Schmerz during each transition.'),
   elixir('Waffenbalsam', 110, 'Alchimistenlabor', -2, 65, [
      { de: 'Waffe gilt 5 Minuten als magisch.', en: 'Weapon counts as magical for 5 minutes.' },
      { de: 'Waffe gilt 15 Minuten als magisch.', en: 'Weapon counts as magical for 15 minutes.' },
      { de: 'Waffe gilt 2 Stunden als magisch, +1 TP.', en: 'Weapon counts as magical for 2 hours, +1 TP.' },
      { de: 'Waffe gilt 8 Stunden als magisch, +1 TP.', en: 'Weapon counts as magical for 8 hours, +1 TP.' },
      { de: 'Waffe gilt einen Tag als magisch und ist unzerbrechlich, +1 TP.', en: 'Weapon counts as magical for one day and is unbreakable, +1 TP.' },
      { de: 'Waffe gilt eine Woche als magisch und ist unzerbrechlich, +1 TP.', en: 'Weapon counts as magical for one week and is unbreakable, +1 TP.' },
   ], 'Rubbing a weapon with the balm takes 5 combat rounds.'),
   elixir('Willenstrunk', 100, 'Alchimistenlabor', -2, 55, ([[1, 5], [2, 10], [2, 15], [2, 20], [3, 30], [3, 45]] as const).map(([bonus, time]) => ({
      de: `Seelenkraft +${bonus} für ${time} Minuten.`, en: `Spirit (SK) +${bonus} for ${time} minutes.`,
   })), 'Protects the mind against influence.'),
   elixir('Zaubertrank', 100, 'Alchimistenlabor', -2, 55, healDice.map((dice) => ({
      de: `Regeneriert bei Einnahme ${dice} AsP.`, en: `Restores ${dice} AsP when drunk.`,
   })), 'Refills astral energy.'),
]

// source: DSA5 Regelwerk, S. 380 (price), S. 342 (Stufe, Art, Widerstand, Wirkung, Beginn, Dauer)
const poison = (name: string, silbertaler: number, level: number, type: string, onset: string, duration: string,
   effect: [LocalizedText, LocalizedText]): AventurianStoreItem => ({
   name, kind: 'poison', weight: 0, price: { silbertaler }, sourcePage: 380,
   description: 'One dose. Weapon poisons act only on the first undefended hit and stay on the weapon for at most 5 attacks; after three months only the weaker effect remains, after six months none (S. 342).',
   poison: { level, type, resistance: 'ZK', onset, duration, effect },
})
aventurianStore.Poisons = [
   poison('Arax', 100, 3, 'Waffengift, tierisch', '10 Minuten', '1 Tag / 12 Stunden', [
      { de: '2 Stufen Paralyse', en: '2 levels of Paralyse' }, { de: '1 Stufe Paralyse', en: '1 level of Paralyse' }]),
   poison('Kelmon', 300, 2, 'Kontakt- und Waffengift, pflanzlich', '5 KR', '30 Minuten / 15 Minuten', [
      { de: '4W6 SP; 4 Stufen Paralyse', en: '4W6 SP; 4 levels of Paralyse' }, { de: '2W6 SP; 1 Stufe Paralyse', en: '2W6 SP; 1 level of Paralyse' }]),
   poison('Tulmadron', 1250, 4, 'Einnahme- und Waffengift, mineralisch', '20 KR', '50 KR / 25 KR', [
      { de: '1W6 SP/KR, 1 Stufe Verwirrung, 2 Stufen Schmerz', en: '1W6 SP per KR, 1 level of Verwirrung, 2 levels of Schmerz' },
      { de: '1W3 SP/KR, 1 Stufe Schmerz', en: '1W3 SP per KR, 1 level of Schmerz' }]),
   poison('Wurara', 100, 2, 'Einnahme- und Waffengift, pflanzlich', '3 KR', '4 Stunden / 2 Stunden', [
      { de: '1W6 SP/Stunde, 2 Stufen Verwirrung', en: '1W6 SP per hour, 2 levels of Verwirrung' },
      { de: '1W3 SP/Stunde, 1 Stufe Verwirrung', en: '1W3 SP per hour, 1 level of Verwirrung' }]),
]

// source: DSA5 Regelwerk, S. 380 (raw / herbalist price), S. 344–346 (search, identification, applications, effect)
const herb = (name: string, rawPrice: number, silbertaler: number, search: number, identify: number, applications: string,
   effect: LocalizedText): AventurianStoreItem => ({
   name, kind: 'herb', weight: 0, price: { silbertaler }, sourcePage: 380,
   description: 'One application bought from an alchemist or herbalist. Keeps three months when processed; herb effects do not stack within one regeneration phase (S. 344–345).',
   herb: { search, identify, applications, effect, rawPrice },
})
aventurianStore.Healing_Herbs = [
   herb('Alraune', 3, 5, -3, -2, '1/1/1/1/1/1', { de: 'Vor allem alchimistische Zutat (z. B. AsP-Aufladung beim Brauen).', en: 'Mainly an alchemical ingredient (e.g. charging AsP while brewing).' }),
   herb('Axordabaum', 16, 80, -3, 0, '1/1/1/1/2/2', { de: 'Gegenmittel gegen Zorganpocken (Xordaiabsud).', en: 'Cure for Zorganpocken (Xordai decoction).' }),
   herb('Donf', 2, 4, 0, 3, '1/1/2/2/3/3', { de: 'Gegenmittel gegen Sumpffieber (Dauer −2 Tage).', en: 'Cure for Sumpffieber (duration −2 days).' }),
   herb('Egelschreck', 4, 12, 0, 0, '4/4/5/5/5/6', { de: 'Vertreibt Parasiten, stillt kleine Blutungen.', en: 'Repels parasites, stops small bleedings.' }),
   herb('Gulmond', 6, 6.2, -2, 0, '2/2/3/3/3/4', { de: '12 Stunden die Abzüge von zwei Stufen Betäubung ignorieren; bei Stufe IV dennoch handlungsunfähig.', en: 'Ignore the penalties of two levels of Betäubung for 12 hours; still incapacitated at level IV.' }),
   herb('Lulanie', 5, 10, 0, 1, '1/1/1/1/2/2', { de: 'Gegenmittel gegen Lutanas und Raschen Wahn.', en: 'Cure for Lutanas and Rascher Wahn.' }),
   herb('Wirselkraut', 2, 2.2, -1, -2, '3/3/3/4/4/5', { de: '+1 LeP bei der nächsten Regeneration je Anwendung, höchstens +3 je Regenerationsphase.', en: '+1 LeP at the next regeneration per application, at most +3 per regeneration phase.' }),
]

// source: DSA5 Regelwerk, S. 379 (books: script and price; no weight listed, treated as 0)
aventurianStore.Books = [
   { name: 'Brevier der zwölfgöttlichen Unterweisung', kind: 'book', weight: 0, price: { silbertaler: 75 }, sourcePage: 379,
      book: { script: 'Garethi / Kusliker Zeichen' }, description: 'Stories of the gods, the creation myth and legends; owned by nearly every consecrated priest.' },
   { name: 'Codex Albyricus', kind: 'book', weight: 0, price: { silbertaler: 300 }, sourcePage: 379, priceUnit: 'per volume',
      priceVaries: { min: 300, max: 700 }, book: { script: 'Bosparano / Kusliker Zeichen' }, description: 'Law code, including which weapons and armor guild mages may carry (S. 365).' },
   { name: 'Encyclopaedia Magica', kind: 'book', weight: 0, price: { silbertaler: 800 }, sourcePage: 379, priceUnit: 'per volume',
      book: { script: 'varies by edition' }, description: 'Seven volumes of magical knowledge; required reading for guild mages.' },
   { name: 'Hilffreycher Leytfaden des wandernden Adepten', kind: 'book', weight: 0, price: { silbertaler: 150 }, sourcePage: 379,
      book: { script: 'Garethi / Kusliker Zeichen' }, description: 'Legends and practical (partly outdated) tips for travelling adepts.' },
]

// source: DSA5 Regelwerk, S. 379 (price), S. 270 (description and effect)
aventurianStore.Magic_Artifacts = [
   { name: 'Armreif der Willensstärke', kind: 'artifact', weight: 0.1, price: { silbertaler: 1050 }, sourcePage: 379, magical: true,
      description: 'Engraved gold bracelet: spell store with 3 × PSYCHOSTABILIS (FP 9, 20 minutes), triggered by turning it. Weight as a gold Armreif (S. 378).' },
   // The book calls the Firnklinge a slim Säbel; the Säbel table values (S. 368) are used for its combat stats.
   { name: 'Firnklinge', kind: 'weapon', weight: 0.75, price: { silbertaler: 1680 }, sourcePage: 379, magical: true,
      description: 'Säbel enchanted with ZAUBERKLINGE: counts as a magical weapon for the next 80 years. Combat values of a Säbel (S. 368).',
      weapon: { combatTechnique: 'Schwerter', damage: '1W6+3', leadingAttribute: 'GE/KK', threshold: 15, attackModifier: 0, parryModifier: 0,
         reach: 'medium', length: 90, canParry: true } },
]

// source: DSA5 Regelwerk, S. 381 (mounts are sold untrained; trained +20 %, combat-trained ×2)
const mountVariants = (silbertaler: number) => [
   { id: 'untrained', label: 'unausgebildet', silbertaler },
   { id: 'trained', label: 'ausgebildet', silbertaler: silbertaler * 1.2 },
   { id: 'combat-trained', label: 'kampfausgebildet', silbertaler: silbertaler * 2 },
]
aventurianStore.Animals = [
   { name: 'Hund', kind: 'animal', weight: 0, price: { silbertaler: 4 }, sourcePage: 381 },
   { name: 'Maultier', kind: 'animal', weight: 0, price: { silbertaler: 250 }, sourcePage: 381, variants: mountVariants(250) },
   { name: 'Pferd', kind: 'animal', weight: 0, price: { silbertaler: 750 }, sourcePage: 381, variants: mountVariants(750),
      description: 'Usually a Warunker; Tralloper Riese, Elenviner and Shadif are notable breeds.' },
   { name: 'Pony', kind: 'animal', weight: 0, price: { silbertaler: 250 }, sourcePage: 381, variants: mountVariants(250) },
]
// source: DSA5 Regelwerk, S. 381 (feed is priced per week; no weight listed)
aventurianStore.Animal_Feed = ([['Hundefutter', 0.2], ['Pferdefutter', 0.5], ['Ponyfutter', 0.3]] as const)
   .map(([name, silbertaler]): AventurianStoreItem => ({ name, kind: 'feed', weight: 0, price: { silbertaler }, sourcePage: 381, priceUnit: 'per week' }))
// source: DSA5 Regelwerk, S. 381
aventurianStore.Vehicles = ([
   ['Bollerwagen', 60], ['Karren, einachsig', 180], ['Kleines Ruderboot', 1200], ['Kleines Segelboot', 6500], ['Kutsche', 2000],
] as const).map(([name, silbertaler]): AventurianStoreItem => ({ name, kind: 'vehicle', weight: 0, price: { silbertaler }, sourcePage: 381 }))

// source: DSA5 Regelwerk, S. 374 (RS 1, BE 0, −1 GS, −1 INI, 2 Stein; price "unterschiedlich")
aventurianStore.Armor.push(...['Schwere Kleidung', 'Winterkleidung'].map((name): AventurianStoreItem => ({
   name, kind: 'armor', weight: 2, price: { silbertaler: 0 }, sourcePage: 374, priceVaries: {},
   armor: { protection: 1, burden: 0, movementPenalty: 1, initiativePenalty: 1 },
})))

