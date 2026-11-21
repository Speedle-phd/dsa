// Client mirror of the combat situation rules (S. 230–250) for the GM-driven fight panel.
// Every GM-dependent fact (distance, enemy weapon, sight …) is an input; nothing here is guessed.
import type { TargetRule } from './statsApi'

export type Source = { label: string; value: number; page: number }
export type Reach = 'short' | 'medium' | 'long'
export type EnemyWeapon = 'normal' | 'fencing' | 'chain' | 'longOrTwoHanded'
export type SizeCategory = 'tiny' | 'small' | 'medium' | 'large' | 'huge'
export type Sight = 0 | 1 | 2 | 3 | 4
export type Water = 'none' | 'waist' | 'under'
export type Incoming = 'melee' | 'shot' | 'thrown'

export type Situation = {
   enemyReach: Reach | null
   enemyWeapon: EnemyWeapon
   enemySize: SizeCategory
   sight: Sight
   // The sight level comes from darkness (Dunkelsicht/Nachtblind apply; level 4 = complete darkness)
   darkness: boolean
   advantage: boolean
   water: Water
}
export const defaultSituation: Situation = { enemyReach: null, enemyWeapon: 'normal', enemySize: 'medium', sight: 0, darkness: false, advantage: false, water: 'none' }

export type Vision = { darkvision: 0 | 1 | 2; nightBlind: boolean }
export function visionOf(advantages: readonly string[], disadvantages: readonly string[]): Vision {
   return { darkvision: advantages.includes('Dunkelsicht II') ? 2 : advantages.includes('Dunkelsicht I') ? 1 : 0, nightBlind: disadvantages.includes('Nachtblind') }
}
// source: DSA5 Regelwerk, S. 164 (Dunkelsicht I: darkness one level lower, II: ignored; no help in complete darkness),
// S. 173 (Nachtblind: one level more once darkness gives at least one level)
export function withVision(situation: Situation, vision: Vision): Situation {
   if (!situation.darkness || situation.sight === 0 || situation.sight === 4) return situation
   const reduced = vision.darkvision === 2 ? 0 : situation.sight - vision.darkvision
   return { ...situation, sight: Math.min(4, Math.max(0, reduced + (vision.nightBlind ? 1 : 0))) as Sight }
}

export type RangedSituation = {
   distance: 'near' | 'medium' | 'far'
   size: SizeCategory
   targetMove: 'still' | 'slow' | 'fast'
   zigzag: boolean
   shooterMove: 'still' | 'walk' | 'run'
   aim: 0 | 1 | 2
   intoMelee: boolean
}
export const defaultRanged: RangedSituation = { distance: 'medium', size: 'medium', targetMove: 'slow', zigzag: false, shooterMove: 'still', aim: 0, intoMelee: false }

type Result = { sources: Source[]; rule: TargetRule | null; blocked: string[] }
const add = (sources: Source[], label: string, value: number, page: number) => { if (value) sources.push({ label, value, page }) }
export const sourceTotal = (sources: Source[]) => sources.reduce((sum, source) => sum + source.value, 0)

// source: DSA5 Regelwerk, S. 230–231 (Nahkampfreichweite: AT penalty for the shorter weapon)
const reachOrder: Reach[] = ['short', 'medium', 'long']
export function reachPenalty(own: Reach, enemy: Reach) {
   const gap = reachOrder.indexOf(enemy) - reachOrder.indexOf(own)
   return gap <= 0 ? 0 : gap * -2
}

// source: DSA5 Regelwerk, S. 239 (melee sight: −1/−2/−3 AT and defense; level 4 AT halved, defense only on a 1)
const meleeSight: Record<Sight, number> = { 0: 0, 1: -1, 2: -2, 3: -3, 4: 0 }
// source: DSA5 Regelwerk, S. 239 (water: waist-deep −2, under water −6 on AT and PA)
const waterPenalty: Record<Water, number> = { none: 0, waist: -2, under: -6 }

export function meleeAttackModifiers(situation: Situation, ownReach: Reach | null): Result {
   const sources: Source[] = []
   if (ownReach && situation.enemyReach) add(sources, 'Reach', reachPenalty(ownReach, situation.enemyReach), 231)
   if (situation.sight > 0 && situation.sight < 4) add(sources, 'Sight', meleeSight[situation.sight], 239)
   // source: DSA5 Regelwerk, S. 239 (size category: tiny targets −4 AT)
   if (situation.enemySize === 'tiny') add(sources, 'Tiny target', -4, 239)
   // source: DSA5 Regelwerk, S. 238 (advantageous position +2 on AT and defenses)
   if (situation.advantage) add(sources, 'Advantageous position', 2, 238)
   add(sources, 'Water', waterPenalty[situation.water], 239)
   return { sources, rule: situation.sight === 4 ? 'halve' : null, blocked: [] }
}

// source: DSA5 Regelwerk, S. 237 (Passierschlag: AT −4, no action, no defense, no maneuvers, no crit or botch)
export const passingStrike: Source = { label: 'Passierschlag', value: -4, page: 237 }

export type DefenseOption = { shield?: boolean; dodge?: boolean; technique: string; parryModifier: number }
export type DefenseContext = { incoming: Incoming; fromBehind: boolean; crossBlock: boolean }

// source: DSA5 Regelwerk, S. 235 (Dolche/Fechtwaffen cannot parry Ketten-, Stangen-, Zweihandwaffen), S. 248 (Kreuzblock)
const lightTechniques = ['Dolche', 'Fechtwaffen']

export function defenseModifiers(situation: Situation, option: DefenseOption, context: DefenseContext): Result {
   const sources: Source[] = []
   const blocked: string[] = []
   const parry = !option.dodge
   if (context.incoming !== 'melee') {
      // source: DSA5 Regelwerk, S. 243–244 (ranged: only dodge or active shield parry; shot −4, thrown −2)
      if (parry && !option.shield) blocked.push('Ranged attacks: only dodge or an active shield parry.')
      add(sources, context.incoming === 'shot' ? 'Shot' : 'Thrown weapon', context.incoming === 'shot' ? -4 : -2, 244)
   } else {
      // source: DSA5 Regelwerk, S. 239 (large: only shield parry or dodge; huge: only dodge)
      if (situation.enemySize === 'large' && parry && !option.shield) blocked.push('Large enemy: only a shield parry or dodge.')
      if (situation.enemySize === 'huge' && parry) blocked.push('Huge enemy: only dodge.')
      // source: DSA5 Regelwerk, S. 235 (defense against Fechtwaffen −1)
      if (situation.enemyWeapon === 'fencing') add(sources, 'Against Fechtwaffe', -1, 235)
      if (situation.enemyWeapon === 'chain' && parry) {
         // source: DSA5 Regelwerk, S. 235 (parry against Kettenwaffen −2; shields only their single bonus)
         add(sources, 'Against Kettenwaffe', -2, 235)
         if (option.shield) add(sources, 'Shield bonus only once', -option.parryModifier, 235)
      }
      if (parry && !option.shield && lightTechniques.includes(option.technique) &&
         (situation.enemyWeapon === 'chain' || situation.enemyWeapon === 'longOrTwoHanded') && !context.crossBlock) {
         blocked.push('Dolche and Fechtwaffen cannot parry Ketten-, Stangen- or Zweihandwaffen (Kreuzblock with two weapons can).')
      }
      if (situation.sight > 0 && situation.sight < 4) add(sources, 'Sight', meleeSight[situation.sight], 239)
      // source: DSA5 Regelwerk, S. 239 (water penalty applies to AT and PA, not to dodging)
      if (parry) add(sources, 'Water', waterPenalty[situation.water], 239)
   }
   // source: DSA5 Regelwerk, S. 238 (attack from behind: defense −4)
   if (context.fromBehind) add(sources, 'Attacked from behind', -4, 238)
   if (situation.advantage) add(sources, 'Advantageous position', 2, 238)
   return { sources, rule: context.incoming === 'melee' && situation.sight === 4 ? 'one' : null, blocked }
}

// source: DSA5 Regelwerk, S. 244 (ranged-defense crit: next defense not −3; unconfirmed: only −2)
export function nextDefensePenalty(incoming: Incoming, outcome: string) {
   if (incoming === 'melee') return 3
   return outcome === 'critical' ? 0 : outcome === 'criticalUnconfirmed' ? 2 : 3
}

// source: DSA5 Regelwerk, S. 241, 245 (Reichweite nah/mittel/weit from the weapon's range, e.g. "10/50/80")
export function rangeBands(range: string | undefined) {
   const parts = range?.split('/').map(Number)
   return parts?.length === 3 && parts.every((value) => Number.isFinite(value) && value > 0) ? parts as [number, number, number] : null
}

// source: DSA5 Regelwerk, S. 241–242
const distance = { near: { fk: 2, tp: 1 }, medium: { fk: 0, tp: 0 }, far: { fk: -2, tp: -1 } } as const
const rangedSize: Record<SizeCategory, number> = { tiny: -8, small: -4, medium: 0, large: 4, huge: 8 }
const targetMove = { still: 2, slow: 0, fast: -2 } as const
const shooterMove = { still: 0, walk: -2, run: -4 } as const
// source: DSA5 Regelwerk, S. 242 (ranged sight: −2/−4/−6; level 4 only on a 1)
const rangedSight: Record<Sight, number> = { 0: 0, 1: -2, 2: -4, 3: -6, 4: 0 }

export function rangedAttackModifiers(ranged: RangedSituation, situation: Situation): Result & { tp: number } {
   const sources: Source[] = []
   add(sources, 'Distance', distance[ranged.distance].fk, 241)
   add(sources, 'Target size', rangedSize[ranged.size], 241)
   add(sources, 'Target movement', targetMove[ranged.targetMove], 242)
   if (ranged.zigzag) add(sources, 'Target zigzags', -4, 242)
   add(sources, 'Shooter movement', shooterMove[ranged.shooterMove], 242)
   if (situation.sight > 0 && situation.sight < 4) add(sources, 'Sight', rangedSight[situation.sight], 242)
   // source: DSA5 Regelwerk, S. 242 (aiming +2 per action, max +4; shooting into melee −2)
   add(sources, 'Aiming', Math.min(4, ranged.aim * 2), 242)
   if (ranged.intoMelee) add(sources, 'Into melee', -2, 242)
   // source: DSA5 Regelwerk, S. 239 (no ranged weapons under water)
   const blocked = situation.water === 'under' ? ['Under water: no ranged attacks.'] : []
   return { sources, rule: situation.sight === 4 ? 'one' : null, blocked, tp: distance[ranged.distance].tp }
}

// source: DSA5 Regelwerk, S. 54 (Beidhändiger Kampf techniques), S. 238 (both attacks −2; wrong hand −4 more unless Beidhändig),
// S. 246 (Beidhändiger Kampf I −1, II 0)
const dualWieldTechniques = ['Dolche', 'Fechtwaffen', 'Hiebwaffen', 'Raufen', 'Schilde', 'Schwerter']
export function twoWeaponPenalty(abilities: readonly string[], ambidextrous: boolean, offHand: boolean, technique?: string) {
   const trained = technique === undefined || dualWieldTechniques.includes(technique)
   const base = !trained ? -2 : abilities.includes('Beidhändiger Kampf II') ? 0 : abilities.includes('Beidhändiger Kampf I') ? -1 : -2
   return base + (offHand && !ambidextrous ? -4 : 0)
}

// source: DSA5 Regelwerk, S. 238 (no two-handed weapons); two-handed = store items marked "(2H)", which covers every
// Zweihandhiebwaffe and Zweihandschwert plus the two-handed Stangenwaffen (user decision, Nov 2026).
export const isTwoHanded = (name: string) => name.includes('(2H)')

// source: DSA5 Regelwerk, S. 366 (one-handed melee weapon held in both hands: +1 TP, PA −1; not Dolche or Fechtwaffen)
export const twoHandedGrip = { damage: 1, parry: -1 } as const
export function canGripTwoHanded(option: { technique: string; ranged: boolean; shield: boolean; unarmed: boolean; twoHanded: boolean },
   heldCount: number) {
   return !option.ranged && !option.shield && !option.unarmed && !option.twoHanded && heldCount === 1 &&
      // App choice: a Schlagring (Raufen) is worn on the fist, so it is excluded like Dolche and Fechtwaffen.
      !['Dolche', 'Fechtwaffen', 'Raufen'].includes(option.technique)
}

// source: DSA5 Regelwerk, S. 366 (Linkhand: Parierwaffe, PA bonus +1 for the main weapon)
export const parryWeapons: Record<string, number> = { Linkhand: 1 }

type Held = { name: string; technique: string; parryModifier?: number; shield: boolean }
// source: DSA5 Regelwerk, S. 233 (passive PA bonus of a second Parierwaffe or shield; only the highest counts), S. 248 (Klingenfänger +1)
export function passiveParryBonus(main: Held, held: readonly Held[], abilities: readonly string[]) {
   const bonuses = held.filter((item) => item !== main && item.name !== main.name).map((item) => item.shield ? item.parryModifier ?? 0
      : parryWeapons[item.name] !== undefined ? parryWeapons[item.name] + (abilities.includes('Klingenfänger') ? 1 : 0) : 0)
   return Math.max(0, ...bonuses)
}

// source: DSA5 Regelwerk, S. 245–246, 249 (Ladezeit; Schnellladen: Bögen/Wurfwaffen −1 action, Armbrüste half)
export function reloadActions(reload: number | string | undefined, technique: string, abilities: readonly string[]) {
   if (typeof reload !== 'number') return null
   if (!abilities.includes(`Schnellladen (${technique})`)) return reload
   // App choice: half rounds half up (S. 17).
   return technique === 'Armbrüste' ? Math.round(reload / 2) : Math.max(0, reload - 1)
}

export type EffectDamage = { bonus?: number; dice?: number; replace?: '1W3'; halfSpeed?: boolean }
// source: DSA5 Regelwerk, S. 247–250 (maneuver TP); ½ GS rounds half up (S. 17, app choice)
export function maneuverDamage(effects: ReadonlyArray<{ label: string; damage?: EffectDamage }>, speed: number) {
   let bonus = 0
   let dice = 0
   let replace: '1W3' | null = null
   const labels: string[] = []
   for (const effect of effects) {
      if (!effect.damage) continue
      labels.push(effect.label)
      bonus += (effect.damage.bonus ?? 0) + (effect.damage.halfSpeed ? Math.round(speed / 2) : 0)
      dice += effect.damage.dice ?? 0
      if (effect.damage.replace) replace = effect.damage.replace
   }
   return { bonus, dice, replace, labels }
}
