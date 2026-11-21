// Storage items that can hold other equipment (S. 374–377, 381). `carriedOn` of an entry names the container item.
// Worn containers travel with the hero (their contents count where the container is); external ones (chest, saddle bags,
// vehicles) hold items the hero does not carry. App rule, user decision Nov 2026.
export const wornContainers = [
   'Lederrucksack', 'Lederranzen', 'Kiepe', 'Umhängetasche', 'Gürteltasche', 'Sack', 'Tuchbeutel', 'Geldbeutel', 'Geldkatze',
   'Schmuckkästchen', 'Ledergürtel', 'Lederschürze mit Taschen', 'Hose mit Hosentasche',
   'Köcher, für 20 Pfeile oder Bolzen', 'Dolchscheide', 'Schwertscheide', 'Zunderdose (Platz für 25 Portionen)',
]
export const externalContainers = [
   'Truhe', 'Satteltasche', 'Packsattel', 'Bollerwagen', 'Karren, einachsig', 'Kutsche', 'Kleines Ruderboot', 'Kleines Segelboot',
]
// Placements that are always available.
export const basePlacements = ['Equipped', 'Stash', 'Other'] as const

type Entry = { item: string; amount: number; carriedOn: string }
export type PlacementKind = 'carried' | 'stash' | 'external'

export const isContainer = (name: string) => wornContainers.includes(name) || externalContainers.includes(name)

// Follows nested containers (a Tuchbeutel in a Lederrucksack) to where the item really is.
export function resolvePlacement(carriedOn: string, equipment: readonly Entry[], depth = 0): PlacementKind {
   if (carriedOn === 'Stash') return 'stash'
   if (externalContainers.includes(carriedOn)) return 'external'
   if (!wornContainers.includes(carriedOn) || depth > 6) return 'carried'
   const holder = equipment.find((entry) => entry.item === carriedOn && entry.amount > 0)
   // A missing container leaves its contents with the hero.
   return holder ? resolvePlacement(holder.carriedOn, equipment, depth + 1) : 'carried'
}

// Stash and external containers do not count towards the hero's carried weight (S. 364 weights; app storage policy).
export function carriedEquipmentWeight(equipment: readonly (Entry & { weight: number })[]) {
   return equipment.reduce((sum, entry) => sum + (resolvePlacement(entry.carriedOn, equipment) === 'carried' ? entry.weight * entry.amount : 0), 0)
}

// Armor taken off when another suit is equipped is laid down under "Other" (Sonstiges) (S. 32, 374; user decision).
export const stowPlacement = 'Other'
