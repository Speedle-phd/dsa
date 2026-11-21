import { BadRequestError } from './appError'
import { bestiary, summonImprovements, summonServices, type BestiaryCreature, type SummonImprovement, type SummonService, type SummoningRitual } from './bestiaryCatalog'

// source: DSA5 Regelwerk, S. 264–265 (one service for success, one more per QS; improvements are paid with QS instead)
export const servicesFor = (quality: number, improvements: number) => 1 + quality - improvements

export function assertSummon(state: { spells: Array<{ key: string }> }, input: { creature: string; ritual: SummoningRitual; quality: number; improvements: SummonImprovement[] }) {
   const creature = bestiary.find((entry) => entry.key === input.creature)
   if (!creature?.summonedBy) throw new BadRequestError('This creature cannot be summoned (S. 262–264).')
   if (creature.summonedBy !== input.ritual) throw new BadRequestError(`${creature.key} is called with ${creature.summonedBy} (S. 263, 300).`)
   if (!state.spells.some((entry) => entry.key === input.ritual)) throw new BadRequestError(`Record the ritual ${input.ritual} first.`)
   if (new Set(input.improvements).size !== input.improvements.length) throw new BadRequestError('Each improvement can be chosen only once (S. 264).')
   if (input.improvements.length > input.quality) throw new BadRequestError('Each improvement costs 1 QS (S. 264).')
   return creature
}

const addDamage = (damage: string, bonus: number) => {
   const match = /^(\d+W\d+)([+-]\d+)?$/.exec(damage)
   return match ? `${match[1]}${(Number(match[2] ?? 0) + bonus) >= 0 ? '+' : ''}${Number(match[2] ?? 0) + bonus}` : `${damage} +${bonus}`
}

// source: DSA5 Regelwerk, S. 264 (improvements; mental/physical +2 do not change derived values)
// App choice: for creatures with a single VW (no PA/AW), "+2 PA" raises the VW and "+2 AW" does nothing.
export function improvedCreature(creature: BestiaryCreature, improvements: readonly SummonImprovement[]): BestiaryCreature {
   const has = (key: SummonImprovement) => improvements.includes(key)
   const plus = (value: number, bonus: number, active: boolean) => active ? value + bonus : value
   const a = creature.attributes
   return {
      ...creature,
      attributes: {
         courage: plus(a.courage, 2, has('mental')), wisdom: plus(a.wisdom, 2, has('mental')), intuition: plus(a.intuition, 2, has('mental')), charisma: plus(a.charisma, 2, has('mental')),
         fingerDexterity: plus(a.fingerDexterity, 2, has('physical')), dexterity: plus(a.dexterity, 2, has('physical')),
         constitution: plus(a.constitution, 2, has('physical')), strength: plus(a.strength, 2, has('physical')),
      },
      health: plus(creature.health, 10, has('defensive')),
      armor: plus(creature.armor, 2, has('defensive')),
      defense: creature.defense === null ? null : plus(creature.defense, 2, has('defensive')),
      dodge: creature.dodge === null ? null : plus(creature.dodge, 2, has('speed')),
      speed: has('speed') ? creature.speed.split('/').map((value) => String(Number(value) + 2)).join('/') : creature.speed,
      soulPower: plus(creature.soulPower, 2, has('resistance')),
      toughness: plus(creature.toughness, 2, has('resistance')),
      attacks: creature.attacks.map((attack) => ({
         ...attack,
         attack: plus(attack.attack, 2, has('offensive')),
         damage: has('offensive') ? addDamage(attack.damage, 4) : attack.damage,
         ...(attack.parry != null ? { parry: plus(attack.parry, 2, has('defensive')) } : {}),
      })),
      spells: creature.spells.map((spell) => ({ ...spell, value: plus(spell.value, 4, has('magic')) })),
   }
}

// source: DSA5 Regelwerk, S. 265 (services; Kampf against several targets and Wache need 2 and use all; Wache ignores sunrise)
export function useService(state: { services: number; task: string | null }, key: SummonService) {
   const service = summonServices.find((entry) => entry.key === key)!
   if (state.task) throw new BadRequestError('The creature is still busy with a task that used all services; dismiss it first.')
   if (state.services < service.minimum) throw new BadRequestError(`${service.name} needs at least ${service.minimum} services (S. 265).`)
   return service.usesAll ? { services: 0, task: key as string } : { services: state.services - 1, task: null }
}
// source: DSA5 Regelwerk, S. 265 (every sunrise costs one remaining service; a guard keeps its post)
export const afterSunrise = (state: { services: number; task: string | null }) =>
   state.task === 'guard' ? state : { ...state, services: Math.max(0, state.services - 1) }
// source: DSA5 Regelwerk, S. 265 (Kampf lasts at most 1 hour)
// App choice: a Kampf started in the fight panel runs as a task until the fight is over, so the creature (and its LeP) stays while it fights.
// A running Kampf against several enemies needs no further service.
export function joinFight(state: { services: number; task: string | null }, key: 'fight' | 'fightMany') {
   if (state.task === 'fightMany') return state
   const next = useService(state, key)
   return key === 'fight' ? { ...next, task: 'fight' } : next
}
export const fightOver = (state: { services: number; task: string | null }) => state.task === 'fight' ? { ...state, task: null } : state

// The creature leaves when no service is left and it has no running task.
export const vanishes = (state: { services: number; task: string | null }) => state.services <= 0 && !state.task

// Current LeP of a summoned creature: stored only after it was hurt, never above the (improved) maximum (S. 264, 354).
export const summonHealth = (max: number, current: number | null | undefined) => ({ max, current: Math.min(max, current ?? max) })
export function assertSummonHealth(max: number, current: number) {
   if (current > max) throw new BadRequestError('LeP cannot exceed the maximum.')
   return current
}

export const improvementKeys = summonImprovements.map((entry) => entry.key)
export const serviceKeys = summonServices.map((entry) => entry.key)
