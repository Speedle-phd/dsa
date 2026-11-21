// Dienstleistungen (S. 381–382). Prices are kept in Kreuzer so tavern prices stay exact (1 S = 10 H = 100 K, S. 364).
export type Coin = 'Silbertaler' | 'Heller' | 'Kreuzer'
export type ServiceGroup = 'medicus' | 'bathhouse' | 'alchemist' | 'smithy' | 'drinks' | 'food' | 'lodging' | 'inn' |
   'scriptorium' | 'travel' | 'misc'
export type ServiceUnit = 'per hoof' | 'per page' | 'per 100 miles' | 'per night' | 'donation'
export type Service = {
   key: string
   group: ServiceGroup
   price: { amount: number; coin: Coin }
   priceKreuzer: number
   unit?: ServiceUnit
   page: number
   // Applied in addition to paying (S. 340, 382): a treatment adds its QS to the next LeP regeneration.
   effect?: 'treatment' | 'rest'
}

const kreuzerPerCoin: Record<Coin, number> = { Silbertaler: 100, Heller: 10, Kreuzer: 1 }

const rows: Array<[key: string, group: ServiceGroup, amount: number, coin: Coin, page: number, extra?: Partial<Service>]> = [
   // source: DSA5 Regelwerk, S. 381 (Im Badehaus)
   ['Bad', 'bathhouse', 3, 'Silbertaler', 381],
   ['Einfache Frisur', 'bathhouse', 1, 'Silbertaler', 381],
   ['Rasur/Bartschnitt', 'bathhouse', 0.5, 'Silbertaler', 381],
   // source: DSA5 Regelwerk, S. 382 (Beim Medicus)
   ['Amputation', 'medicus', 50, 'Silbertaler', 382],
   ['Behandlung (Heilkunde Wunden)', 'medicus', 10, 'Silbertaler', 382, { effect: 'treatment' }],
   ['Chirurgischer Eingriff', 'medicus', 150, 'Silbertaler', 382],
   ['Diagnose einer Krankheit', 'medicus', 10, 'Silbertaler', 382],
   // source: DSA5 Regelwerk, S. 382 (Beim Alchimisten, In der Schmiede, In der Schreibstube)
   ['Alchimistische Analyse', 'alchemist', 20, 'Silbertaler', 382],
   ['Pferd beschlagen', 'smithy', 0.5, 'Silbertaler', 382, { unit: 'per hoof' }],
   ['Brief vorlesen', 'scriptorium', 0.1, 'Silbertaler', 382, { unit: 'per page' }],
   ['Brief verfassen', 'scriptorium', 1, 'Silbertaler', 382, { unit: 'per page' }],
   ['Buch kopieren (ohne Illustrationen)', 'scriptorium', 1, 'Silbertaler', 382, { unit: 'per page' }],
   // source: DSA5 Regelwerk, S. 382 (Reise und Transport: per person and 100 Meilen, without food and lodging)
   ['Brief mit Postkutsche', 'travel', 1, 'Silbertaler', 382, { unit: 'per 100 miles' }],
   ['Brief per Beilunker Reiter', 'travel', 12, 'Silbertaler', 382, { unit: 'per 100 miles' }],
   ['Flusskahn (stromabwärts)', 'travel', 1, 'Silbertaler', 382, { unit: 'per 100 miles' }],
   ['Flusskahn (stromaufwärts)', 'travel', 8, 'Silbertaler', 382, { unit: 'per 100 miles' }],
   ['Reisekutsche', 'travel', 12, 'Silbertaler', 382, { unit: 'per 100 miles' }],
   ['Seereise, Hängematte', 'travel', 8, 'Silbertaler', 382, { unit: 'per 100 miles' }],
   ['Seereise, Kabine', 'travel', 150, 'Silbertaler', 382, { unit: 'per 100 miles' }],
   // source: DSA5 Regelwerk, S. 382 (Das aventurische Gasthaus: prices in the coins usually paid)
   ['Bier, Krug', 'drinks', 16, 'Kreuzer', 382],
   ['Kräutertee, Becher', 'drinks', 6, 'Kreuzer', 382],
   ['Schnaps, Becherchen', 'drinks', 2, 'Heller', 382],
   ['Tulamidentee, Becher', 'drinks', 4, 'Heller', 382],
   ['Wasser, Krug', 'drinks', 6, 'Kreuzer', 382],
   ['Wein, Becher', 'drinks', 3, 'Heller', 382],
   ['Ziegenmilch, Becher', 'drinks', 8, 'Kreuzer', 382],
   ['Bratwurst', 'food', 15, 'Kreuzer', 382],
   ['Brotmahlzeit', 'food', 5, 'Heller', 382],
   ['Fischgericht', 'food', 7, 'Heller', 382],
   ['Fleischgericht', 'food', 7, 'Heller', 382],
   ['Gemüseeintopf', 'food', 3, 'Heller', 382],
   ['Grütze', 'food', 1, 'Heller', 382],
   ['Hartwurst', 'food', 5, 'Kreuzer', 382],
   ['Pfannkuchen mit Kompott', 'food', 2, 'Heller', 382],
   ['Rinderkeule (35 Stein)', 'food', 120, 'Silbertaler', 382],
   ['Bett im Gemeinschaftszimmer', 'lodging', 6, 'Heller', 382, { unit: 'per night', effect: 'rest' }],
   ['Doppelzimmer', 'lodging', 5, 'Silbertaler', 382, { unit: 'per night', effect: 'rest' }],
   ['Einzelzimmer', 'lodging', 3, 'Silbertaler', 382, { unit: 'per night', effect: 'rest' }],
   ['Pferd im Stall mit Futter', 'lodging', 6, 'Heller', 382, { unit: 'per night' }],
   ['Strohsack im Schlafsaal', 'lodging', 2, 'Heller', 382, { unit: 'per night', effect: 'rest' }],
   ['Suite', 'lodging', 100, 'Silbertaler', 382, { unit: 'per night', effect: 'rest' }],
   ['Bad im Zuber', 'inn', 3, 'Silbertaler', 382],
   ['Haupthaar scheren', 'inn', 0.5, 'Silbertaler', 382],
   // source: DSA5 Regelwerk, S. 382 (Sonstiges)
   ['Bordellbesuch', 'misc', 5, 'Silbertaler', 382],
   ['Tätowierung', 'misc', 3, 'Silbertaler', 382],
   ['Tempelbibliothek besuchen', 'misc', 2, 'Silbertaler', 382, { unit: 'donation' }],
   ['Tier präparieren (hundsgroß)', 'misc', 26, 'Silbertaler', 382],
]

export const services: Service[] = rows.map(([key, group, amount, coin, page, extra]) => ({
   key, group, price: { amount, coin }, priceKreuzer: Math.round(amount * kreuzerPerCoin[coin]), page, ...extra,
}))

export function findService(key: string) {
   return services.find((service) => service.key === key)
}

export function serviceTotalKreuzer(service: Service, quantity: number) {
   return service.priceKreuzer * quantity
}
