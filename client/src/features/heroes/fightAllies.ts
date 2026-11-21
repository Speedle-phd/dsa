import type { BestiaryAttack, Summon } from './bestiaryApi'
import type { Companion } from './companionApi'
import { damagePoints } from './combatRoll'
import type { ActionUse } from './fightActions'

// Companions, summoned creatures and Radau brooms fighting on the hero's side. Their values are read live from the source record.
export type AllySource = { kind: 'companion' | 'summon'; id: string } | { kind: 'radau'; quality: number }
export type FightAlly = {
   id: string
   source: AllySource
   initiative: { base: number; roll: number }
   joinedRound: number
   // Defenses in the current KR (S. 232)
   defenses: number
   // Radau: last KR whose AsP upkeep was paid
   paidRound?: number
   // Actions used in the current KR (S. 228)
   turn?: ActionUse
}

// `penalty`: lowered by 3 per further defense in the KR (PA/AW, S. 232); a VW is not (S. 354).
export type AllyDefense = { key: string; label: string; value: number; penalty: boolean; note?: string }
export type AllyFighter = {
   name: string
   abilities: string
   attacks: BestiaryAttack[]
   defenses: AllyDefense[]
   armor: number
   pain: number
   health: { max: number; current: number } | null
   // GS as printed, e.g. "12" or "12/36" (ground/air)
   speed: string
   // Demons and elementals take half TP from mundane weapons (S. 355, 358)
   creatureKind: 'demon' | 'elemental' | null
}

// source: DSA5 Regelwerk, S. 297 (Radau: INI 12+1W6, AT 10+QS, TP 1W6+3, GS 12, one AT per KR, no maneuvers;
// unbreakable and magical while the spell lasts; PA half the AT only against Haltegriff; 4 AsP + 2 AsP per KR)
export const radau = { initiative: 12, attack: 10, damage: '1W6+3', speed: 12, activation: 4, upkeep: 2, range: 16 } as const

// App choice, not a user decision: the PA (half the AT) is rounded up like the other halved values (S. 231).
export function radauFighter(quality: number): AllyFighter {
   const attack = radau.attack + quality
   return {
      name: 'Radau', abilities: '', armor: 0, pain: 0, health: null, creatureKind: null, speed: String(radau.speed),
      attacks: [{ name: 'Radau', attack, damage: radau.damage, reach: '', perRound: 1 }],
      defenses: [{ key: 'PA', label: 'PA', value: Math.ceil(attack / 2), penalty: true, note: 'Only against Haltegriff (S. 297).' }],
   }
}

export function companionFighter(companion: Companion): AllyFighter {
   return {
      name: companion.name, abilities: companion.abilities, armor: companion.effective.armor, pain: companion.effective.pain,
      health: { max: companion.effective.maxHealth, current: companion.health.current }, creatureKind: null, speed: companion.speed,
      attacks: companion.attacks, defenses: [{ key: 'VW', label: 'VW', value: companion.defense, penalty: false }],
   }
}

// source: DSA5 Regelwerk, S. 354 (VW for non-humanoids, else PA per weapon and AW), S. 355, 358 (demons and elementals: no conditions)
export function summonFighter(summon: Summon): AllyFighter | null {
   const creature = summon.effective
   if (!creature || !summon.health) return null
   const parries = creature.attacks.flatMap((attack) => attack.parry == null ? []
      : [{ key: `PA-${attack.name}`, label: `PA · ${attack.name}`, value: attack.parry, penalty: true }])
   return {
      name: summon.creature, abilities: creature.abilities, armor: creature.armor, pain: 0, health: summon.health, speed: creature.speed,
      creatureKind: creature.kind === 'animal' ? null : creature.kind, attacks: creature.attacks,
      defenses: [
         ...(creature.defense !== null ? [{ key: 'VW', label: 'VW', value: creature.defense, penalty: false }] : []),
         ...parries,
         ...(creature.dodge !== null ? [{ key: 'AW', label: 'AW', value: creature.dodge, penalty: true }] : []),
      ],
   }
}

// source: DSA5 Regelwerk, S. 232 (−3 per further defense in a KR), S. 354 (a VW is not lowered by several defenses)
export const allyDefensePenalty = (defense: AllyDefense, defenses: number) => defense.penalty ? 3 * defenses : 0

// source: DSA5 Regelwerk, S. 355, 358 (mundane weapons, for elementals also consecrated ones: half TP, halved before RS), S. 234 (SP = TP − RS)
// App choice, not a user decision: half TP rounded up like the other halved values (S. 231).
export const allyDamage = (tp: number, armor: number, halved: boolean) => damagePoints(halved ? Math.ceil(tp / 2) : tp, armor)

export const allyInitiative = (ally: FightAlly) => ally.initiative.base + ally.initiative.roll
