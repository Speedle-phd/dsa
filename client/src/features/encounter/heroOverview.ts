import { combatProfile, roundSources, type RoundState } from '@/features/heroes/checkProfiles'
import { armorProtection } from '@/features/heroes/combatGear'
import { gearOptions } from '@/features/heroes/combatOptions'
import { formatDamage } from '@/features/heroes/combatRoll'
import { fightSpeed, heroSpeed } from '@/features/heroes/energy'
import { weaponStatePenalty, weaponUnusable } from '@/features/heroes/patzerTables'
import type { Stats } from '@/features/heroes/statsApi'
import { roundStateOf, type HeroPanel } from './heroPanel'

type Bar = { current: number; max: number }
type CombatKind = 'attack' | 'ranged' | 'defense'
// `loaded`: null when the weapon needs no loading or the panel has not reported it
export type OverviewWeapon = { key: string; label: string; ranged: boolean; at: number | null; pa: number | null; tp: string | null; loaded: boolean | null; notes: string[] }
// The player's choices of the current KR, when the panel copy belongs to it
export type OverviewRound = {
   stance: RoundState['stance']; fateDefense: boolean; defensePenalty: number; nextActionPenalty: number; noDefense: boolean
   ignoreConditions: boolean; casting: HeroPanel['casting']
}
export type HeroOverview = {
   health: Bar; mana: Bar | null; karma: Bar | null; fate: Bar
   // Schmerz level after the rules (S. 34); RS of the worn armour (S. 374), Belastung level (S. 36)
   pain: number; armor: number; burden: number
   dodge: number | null; speed: number | null
   weapons: OverviewWeapon[]
   // Attack/defense blocked by the rules right now (Schmerz IV, Handlungsunfähig, a stance …)
   blocked: string[]
   statuses: string[]; conditions: Array<{ name: string; level: number }>
   combatAbilities: string[]
   round: OverviewRound | null
}

const bar = (resource: { current?: number; max: number }) => ({ current: resource.current ?? resource.max, max: resource.max })
const sum = (sources: Array<{ value: number }>) => sources.reduce((total, source) => total + source.value, 0)

// In-fight overview of a party hero for the GM (user request, Nov 2026): the hero's own base values with the rule
// profile (conditions, Schmerz, Belastung) and, when the player's panel copy belongs to the current KR (`panel`, `round`),
// the panel's choices: stance, Anführer, Schips on defense, the defense penalty, Patzer effects, loading and casting.
// Not included: situation and maneuvers of a single attack, and the hero's active effects (owner only).
export function heroOverview(stats: Stats, species: string, panel: HeroPanel | null = null, round = 0): HeroOverview {
   const { attack, defense } = gearOptions(stats, [])
   const state = roundStateOf(panel, round)
   const live = state ? panel : null
   // Zustand ignorieren (Schip, S. 30) drops the condition profile for this KR, as in the player's panel
   const profile = (kind: CombatKind) => state?.ignoreConditions ? null : combatProfile(stats, kind)
   const fight = (kind: CombatKind, key: string) => state ? roundSources(kind, key, state) : { sources: [], blocked: [] }
   // source: DSA5 Regelwerk, S. 30 (Schip: defenses +4 this KR), S. 232 (−3 per earlier defense), S. 231 (−2 on the next action after a Patzer)
   const defenseExtra = live ? (live.fateDefense ? 4 : 0) - live.defensePenalty + live.nextActionPenalty : 0
   const attackExtra = live?.nextActionPenalty ?? 0
   const modifier = (kind: CombatKind, key: string) => (profile(kind)?.total ?? 0) + sum(fight(kind, key).sources)
   const weaponState = (key: string) => live?.weapons.find((weapon) => weapon.key === key)
   const defenseOf = (key: string) => defense.find((option) => option.key === key)

   const weapons = attack.map((option): OverviewWeapon => {
      const ranged = option.kind === 'ranged'
      const parry = defenseOf(option.key)
      const reported = weaponState(option.key)
      const condition = option.condition ?? (reported?.state === 'damaged' ? 'damaged' : undefined)
      const at = option.base + modifier(option.kind, option.technique) + (option.cramped ?? 0) + weaponStatePenalty(condition, ranged)
         + (option.oneHanded ? 1 : 0) + (option.bigShield ? -1 : 0) + attackExtra
      const pa = parry ? parry.base + modifier('defense', parry.checkKey) + (parry.cramped ?? 0) + weaponStatePenalty(condition, false)
         + (parry.oneHanded ? 1 : 0) + defenseExtra : null
      const afterPatzer = weaponUnusable(reported?.state ?? undefined)
      const unusable = option.condition === 'broken' || afterPatzer
      // A stance can forbid attacks this KR (Verteidigungshaltung, S. 250)
      const attackBlocked = fight(option.kind, option.technique).blocked.length > 0
      const needsLoading = ranged && typeof option.reload === 'number'
      return {
         key: option.key, label: option.label, ranged, at: unusable || attackBlocked ? null : at, pa: unusable ? null : pa,
         tp: option.damage ? formatDamage(option.damage) : null,
         loaded: needsLoading && reported ? reported.loaded : null,
         notes: [...(option.condition === 'broken' ? ['Broken'] : []), ...(afterPatzer ? ['This weapon is not usable after a Patzer.'] : []),
            ...(condition === 'damaged' ? ['Damaged'] : []), ...option.notes],
      }
   })
   const dodge = defenseOf('dodge')
   const blocked = [...new Set([
      ...(['attack', 'ranged', 'defense'] as const).flatMap((kind) => [...(profile(kind)?.blocked ?? []), ...fight(kind, '').blocked]),
      ...(live?.noDefense ? ['No defense this round (Riposte or Patzer).'] : []),
   ])]
   const defenseBlocked = live?.noDefense || fight('defense', '').blocked.length > 0
   return {
      health: bar(stats.health),
      mana: stats.mana.max > 0 ? bar(stats.mana) : null,
      karma: stats.karmaEnergy.max > 0 ? bar(stats.karmaEnergy) : null,
      fate: bar(stats.fatePoints),
      pain: stats.checkModifiers.effectivePain,
      armor: armorProtection(stats),
      burden: stats.checkModifiers.burden,
      dodge: defenseBlocked ? null : (dodge?.base ?? stats.dodge.max) + modifier('defense', 'AW') + defenseExtra,
      speed: fightSpeed(stats, heroSpeed(stats, species)),
      weapons: defenseBlocked ? weapons.map((weapon) => ({ ...weapon, pa: null })) : weapons,
      blocked,
      statuses: [...new Set([...(stats.statuses ?? []), ...(stats.permanentStatuses ?? [])])],
      conditions: Object.entries(stats.combatConditions ?? {}).filter(([, level]) => level > 0).map(([name, level]) => ({ name, level })),
      combatAbilities: stats.combatSpecialAbilities,
      round: live ? {
         stance: live.stance, fateDefense: live.fateDefense, defensePenalty: live.defensePenalty, nextActionPenalty: live.nextActionPenalty,
         noDefense: live.noDefense, ignoreConditions: live.ignoreConditions, casting: live.casting,
      } : null,
   }
}
