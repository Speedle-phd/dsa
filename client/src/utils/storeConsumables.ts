import { catalogEntry } from './storePricing'

// App choice (Nov 2026, user request), not a rule: catalog items that are used up when used. The inventory offers
// "Use up" with a quantity for them; tools, containers, clothing and weapons have no such action. Elixirs, herbs and
// poisons are consumed through their effect dialog instead (activeEffectsApi `isConsumableItem`).
export const consumableItems: ReadonlySet<string> = new Set([
   // Food and drink
   'Proviant für einen Tag', 'Bier, kleines Fässchen', 'Wein', 'Schnaps', 'Kaffee, geröstet', 'Kakao', 'Schokolade', 'Pfeffer',
   'Hundefutter', 'Pferdefutter', 'Ponyfutter',
   // Light and fire
   'Fackel', 'Kerzen, 10 Stück', 'Lampenöl, 12 Stunden Brennzeit', 'Lampenöl, 8 Stunden Brennzeit', 'Zunder, 25 Portionen',
   // Healing
   'Verband, 10 Stück', 'Blutegel',
   // Writing
   'Kohlestift', 'Kreide', 'Papier, 1 Blatt', 'Pergament, 1 Blatt', 'Siegelwachs', 'Tinte',
   // Care and luxury
   'Badeöl', 'Lippenrot', 'Parfüm', 'Puder', 'Seife', 'Tabak',
   // Crafting supplies
   'Leim', 'Nägel, 10 Stück',
   // Ammunition (shots in the fight panel are deducted automatically)
   'Pfeile', 'Bolzen', 'Kugeln',
])

export function isUsedUpItem(name: string) {
   return consumableItems.has(catalogEntry(name)?.item.name ?? name)
}
