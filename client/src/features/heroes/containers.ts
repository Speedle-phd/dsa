import type { Language } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { catalogEntry, equipmentDisplayName } from '@/utils/storePricing'

// UX mirror of server/src/utils/containers.ts (the server computes the carried weight).
// Storage items that can hold other equipment (S. 374–377, 381); `carriedOn` names the container item.
type ContainerRule = {
   // Worn containers must be Angelegt (or inside another usable container); external ones only need to be owned.
   external?: boolean
   // Only these items or weapons of these combat techniques fit (Köcher, Scheiden, Zunderdose).
   accepts?: { items?: string[]; techniques?: string[] }
   // Units per container; the rulebook gives a size only for these (S. 374, 376).
   capacity?: number
   // Short placement label for long catalog names.
   label?: string
}

export const containerRules: Record<string, ContainerRule> = {
   Lederrucksack: {}, Lederranzen: {}, Kiepe: {}, Umhängetasche: {}, Gürteltasche: {}, Sack: {}, Tuchbeutel: {},
   Geldbeutel: {}, Geldkatze: {}, Schmuckkästchen: {}, Ledergürtel: {}, 'Lederschürze mit Taschen': {}, 'Hose mit Hosentasche': {},
   // source: DSA5 Regelwerk, S. 374 (Köcher für 20 Pfeile oder Bolzen; Scheiden for Schnellziehen)
   'Köcher, für 20 Pfeile oder Bolzen': { accepts: { items: ['Pfeile', 'Bolzen'] }, capacity: 20, label: 'Köcher' },
   Dolchscheide: { accepts: { techniques: ['Dolche'] }, capacity: 1 },
   Schwertscheide: { accepts: { techniques: ['Schwerter', 'Fechtwaffen'] }, capacity: 1 },
   // source: DSA5 Regelwerk, S. 376 (Zunderdose: room for 25 portions = one Zunder pack)
   'Zunderdose (Platz für 25 Portionen)': { accepts: { items: ['Zunder, 25 Portionen'] }, capacity: 1, label: 'Zunderdose' },
   Truhe: { external: true }, Satteltasche: { external: true }, Packsattel: { external: true },
   Bollerwagen: { external: true }, 'Karren, einachsig': { external: true }, Kutsche: { external: true },
   'Kleines Ruderboot': { external: true }, 'Kleines Segelboot': { external: true },
}
// Always selectable; the old fixed placements stay valid for items that already use them.
export const basePlacements = ['Equipped', 'Stash', 'Other'] as const
export const legacyPlacements = ['Backpack', 'Belt', 'Pouch', 'Saddlebag']
const backpacks = ['Lederrucksack', 'Lederranzen', 'Kiepe', 'Umhängetasche']

type Entry = { item: string; amount: number; carriedOn: string; weight?: number }

const owned = (equipment: readonly Entry[], name: string) => equipment.filter((entry) => entry.item === name && entry.amount > 0)

export function resolvePlacement(carriedOn: string, equipment: readonly Entry[], depth = 0): 'carried' | 'stash' | 'external' {
   if (carriedOn === 'Stash') return 'stash'
   const rule = containerRules[carriedOn]
   if (!rule) return 'carried'
   if (rule.external) return 'external'
   const holder = owned(equipment, carriedOn)[0]
   return holder && depth < 6 ? resolvePlacement(holder.carriedOn, equipment, depth + 1) : 'carried'
}

export function carriedEquipmentWeight(equipment: readonly (Entry & { weight: number })[]) {
   return equipment.reduce((sum, entry) => sum + (resolvePlacement(entry.carriedOn, equipment) === 'carried' ? entry.weight * entry.amount : 0), 0)
}

// A worn container is usable when it is Angelegt or sits in another usable container.
function usable(name: string, equipment: readonly Entry[], depth = 0): boolean {
   const rule = containerRules[name]
   if (!rule || depth > 6) return false
   return owned(equipment, name).some((entry) => rule.external || entry.carriedOn === 'Equipped' ||
      (Boolean(containerRules[entry.carriedOn]) && !containerRules[entry.carriedOn].external && usable(entry.carriedOn, equipment, depth + 1)))
}

// True if `container` is (directly or nested) stored inside `item`, which would make a loop.
function inside(container: string, item: string, equipment: readonly Entry[], depth = 0): boolean {
   if (container === item) return true
   const holder = owned(equipment, container)[0]
   return Boolean(holder && containerRules[holder.carriedOn] && depth < 6 && inside(holder.carriedOn, item, equipment, depth + 1))
}

function accepts(rule: ContainerRule, item: string) {
   if (!rule.accepts) return true
   const base = catalogEntry(item)?.item
   return Boolean(rule.accepts.items?.includes(base?.name ?? item) ||
      (base?.weapon && rule.accepts.techniques?.includes(base.weapon.combatTechnique) && base.kind !== 'shield'))
}

export type PlacementOption = { value: string; full?: boolean }

// Placements offered for `item`: Angelegt, Lager, Sonstiges, every usable container that accepts it, and the current value.
export function placementOptions(equipment: readonly Entry[], item: string, amount: number, current?: string): PlacementOption[] {
   const options: PlacementOption[] = basePlacements.map((value) => ({ value }))
   for (const [name, rule] of Object.entries(containerRules)) {
      if (!usable(name, equipment) || inside(name, item, equipment) || !accepts(rule, item)) continue
      const full = rule.capacity !== undefined && (() => {
         const room = rule.capacity * owned(equipment, name).reduce((sum, entry) => sum + entry.amount, 0)
         const used = equipment.filter((entry) => entry.carriedOn === name && !(entry.item === item && current === name))
            .reduce((sum, entry) => sum + entry.amount, 0)
         return used + amount > room
      })()
      options.push({ value: name, full })
   }
   if (current && !options.some((option) => option.value === current)) options.push({ value: current })
   return options
}

// Suggested placement for something new: a fitting quiver or sheath, else a worn backpack, else Sonstiges.
export function defaultPlacement(equipment: readonly Entry[], item: string, amount = 1) {
   const kind = catalogEntry(item)?.item.kind
   if (kind === 'animal' || kind === 'vehicle') return 'Other'
   const options = placementOptions(equipment, item, amount).filter((option) => !option.full)
   const special = options.find((option) => containerRules[option.value]?.accepts)
   return special?.value ?? options.find((option) => backpacks.includes(option.value))?.value ?? 'Other'
}

// Dropping the last of a container leaves its contents with the hero under Sonstiges.
export function releaseContents<T extends Entry>(equipment: readonly T[], container: string): T[] {
   if (!containerRules[container] || owned(equipment, container).length) return [...equipment]
   return equipment.map((entry) => entry.carriedOn === container ? { ...entry, carriedOn: 'Other' } : entry)
}

export const isContainerItem = (name: string) => Boolean(containerRules[name])

export const placementLabel = (placement: string, language: Language) =>
   containerRules[placement]?.label ? t(containerRules[placement].label!, language)
      : containerRules[placement] ? equipmentDisplayName(placement, language) : t(placement, language)
