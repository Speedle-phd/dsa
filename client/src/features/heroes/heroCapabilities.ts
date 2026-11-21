import type { Stats } from './statsApi'

// source: DSA5 Regelwerk, S. 165, 274, 306 (spells need the advantage Zauberer and a tradition; liturgies Geweihter and a church tradition)
export function hasArcana(stats: Pick<Stats, 'advantages' | 'generalSpecialAbilities' | 'spells' | 'magicTricks'>) {
   return stats.advantages.includes('Zauberer') || stats.spells.length > 0 || stats.magicTricks.length > 0 ||
      stats.generalSpecialAbilities.some((name) => name.startsWith('Tradition (') && !name.endsWith('kirche)'))
}
export function hasKarma(stats: Pick<Stats, 'advantages' | 'generalSpecialAbilities' | 'liturgies' | 'blessings'>) {
   return stats.advantages.includes('Geweihter') || (stats.liturgies?.length ?? 0) > 0 || (stats.blessings?.length ?? 0) > 0 ||
      stats.generalSpecialAbilities.some((name) => name.startsWith('Tradition (') && name.endsWith('kirche)'))
}
