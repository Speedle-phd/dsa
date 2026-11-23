import { combatProfile } from '@/features/heroes/checkProfiles'
import { armorProtection } from '@/features/heroes/combatGear'
import { gearOptions } from '@/features/heroes/combatOptions'
import { formatDamage } from '@/features/heroes/combatRoll'
import { fightSpeed, heroSpeed } from '@/features/heroes/energy'
import { weaponStatePenalty } from '@/features/heroes/patzerTables'
import type { Stats } from '@/features/heroes/statsApi'

type Bar = { current: number; max: number }
export type OverviewWeapon = { key: string; label: string; ranged: boolean; at: number | null; pa: number | null; tp: string | null; notes: string[] }
export type HeroOverview = {
   health: Bar; mana: Bar | null; karma: Bar | null; fate: Bar
   // Schmerz level after the rules (S. 34); RS of the worn armour (S. 374), Belastung level (S. 36)
   pain: number; armor: number; burden: number
   dodge: number; speed: number | null
   weapons: OverviewWeapon[]
   // Attack/defense blocked by the rules right now (Schmerz IV, Handlungsunfähig …)
   blocked: string[]
   statuses: string[]; conditions: Array<{ name: string; level: number }>
   combatAbilities: string[]
}

const bar = (resource: { current?: number; max: number }) => ({ current: resource.current ?? resource.max, max: resource.max })

// In-fight overview of a party hero for the GM (user request, Nov 2026): the hero's own base values with the rule
// profile (conditions, Schmerz, Belastung) applied. Choices that live only in the player's fight panel (stances, Schips
// spent on defenses, situation, maneuvers) and the hero's active effects (owner only) are not included.
export function heroOverview(stats: Stats, species: string): HeroOverview {
   const { attack, defense } = gearOptions(stats, [])
   const modifier = (kind: 'attack' | 'ranged' | 'defense') => combatProfile(stats, kind)?.total ?? 0
   const defenseOf = (key: string) => defense.find((option) => option.key === key)
   const weapons = attack.map((option): OverviewWeapon => {
      const ranged = option.kind === 'ranged'
      const parry = defenseOf(option.key)
      const at = option.base + modifier(option.kind) + (option.cramped ?? 0) + weaponStatePenalty(option.condition, ranged)
         + (option.oneHanded ? 1 : 0) + (option.bigShield ? -1 : 0)
      const pa = parry ? parry.base + modifier('defense') + (parry.cramped ?? 0) + weaponStatePenalty(parry.condition, false) + (parry.oneHanded ? 1 : 0) : null
      const broken = option.condition === 'broken'
      return { key: option.key, label: option.label, ranged, at: broken ? null : at, pa: broken ? null : pa,
         tp: option.damage ? formatDamage(option.damage) : null, notes: [...(broken ? ['Broken'] : []), ...option.notes] }
   })
   const dodge = defenseOf('dodge')
   const blocked = [...new Set((['attack', 'ranged', 'defense'] as const).flatMap((kind) => combatProfile(stats, kind)?.blocked ?? []))]
   return {
      health: bar(stats.health),
      mana: stats.mana.max > 0 ? bar(stats.mana) : null,
      karma: stats.karmaEnergy.max > 0 ? bar(stats.karmaEnergy) : null,
      fate: bar(stats.fatePoints),
      pain: stats.checkModifiers.effectivePain,
      armor: armorProtection(stats),
      burden: stats.checkModifiers.burden,
      dodge: (dodge?.base ?? stats.dodge.max) + modifier('defense'),
      speed: fightSpeed(stats, heroSpeed(stats, species)),
      weapons,
      blocked,
      statuses: [...new Set([...(stats.statuses ?? []), ...(stats.permanentStatuses ?? [])])],
      conditions: Object.entries(stats.combatConditions ?? {}).filter(([, level]) => level > 0).map(([name, level]) => ({ name, level })),
      combatAbilities: stats.combatSpecialAbilities,
   }
}
