import { resolvePlacement } from './containers'

// Ammunition sold per projectile (S. 373). Shot arrows, bolts and bullets are unusable afterwards (S. 246),
// so each shot uses one carried projectile. Thrown weapons are picked up again and are not consumed.
// source: DSA5 Regelwerk, S. 246, 373
export const ammunitionItems = ['Pfeile', 'Bolzen', 'Kugeln'] as const
export type AmmunitionItem = typeof ammunitionItems[number]

type Entry = { item: string; amount: number; carriedOn: string }

export function consumeAmmunition<T extends Entry>(equipment: readonly T[], item: AmmunitionItem) {
   // Only carried ammunition can be shot: not stashed, not in a chest, saddle bag or vehicle (app placement policy).
   // A quiver is used first (S. 374).
   const carried = (entry: typeof equipment[number]) => entry.item === item && entry.amount > 0 && resolvePlacement(entry.carriedOn, equipment) === 'carried'
   const quiver = equipment.findIndex((entry) => carried(entry) && entry.carriedOn === 'Köcher, für 20 Pfeile oder Bolzen')
   const index = quiver >= 0 ? quiver : equipment.findIndex(carried)
   if (index < 0) return { ok: false as const }
   const next = equipment.map((entry, slot) => slot === index ? { ...entry, amount: entry.amount - 1 } : entry)
   return { ok: true as const, equipment: next.filter((entry) => entry.amount > 0), left: next[index].amount }
}
