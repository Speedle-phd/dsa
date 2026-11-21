import { describe, expect, it } from 'vitest'
import {
   defaultRanged, defaultSituation, defenseModifiers, maneuverDamage, meleeAttackModifiers, nextDefensePenalty, passiveParryBonus,
   rangeBands, rangedAttackModifiers, reachPenalty, reloadActions, sourceTotal, twoWeaponPenalty, isTwoHanded,
   canGripTwoHanded, twoHandedGrip, visionOf, withVision, type Situation,
} from './combatSituation'

const sword = { technique: 'Schwerter', parryModifier: 0 }

describe('Nahkampfreichweite (S. 230–231)', () => {
   it.each([
      ['short', 'medium', -2], ['short', 'long', -4], ['medium', 'long', -2],
      ['medium', 'short', 0], ['long', 'long', 0],
   ] as const)('%s against %s → %i AT', (own, enemy, value) => expect(reachPenalty(own, enemy)).toBe(value))
})

describe('Melee situation (S. 237–239)', () => {
   it('adds sight, tiny targets, position and water; sight 4 halves the attack', () => {
      const result = meleeAttackModifiers({ ...defaultSituation, sight: 2, enemySize: 'tiny', advantage: true, water: 'waist' }, 'medium')
      expect(sourceTotal(result.sources)).toBe(-2 - 4 + 2 - 2)
      expect(meleeAttackModifiers({ ...defaultSituation, sight: 4 }, 'medium').rule).toBe('halve')
   })
   it('Arbosch: shield parry 12 − 2 Belastung is a plain defense without situation modifiers (S. 230)', () => {
      expect(defenseModifiers(defaultSituation, { shield: true, technique: 'Schilde', parryModifier: 1 }, { incoming: 'melee', fromBehind: false, crossBlock: false }).sources).toEqual([])
   })
})

describe('Verteidigung (S. 235, 238–239, 243–244)', () => {
   const melee = { incoming: 'melee' as const, fromBehind: false, crossBlock: false }
   it('ranged attacks allow only dodge or an active shield parry, −4 shot / −2 thrown', () => {
      expect(defenseModifiers(defaultSituation, sword, { ...melee, incoming: 'shot' }).blocked).toHaveLength(1)
      expect(sourceTotal(defenseModifiers(defaultSituation, { dodge: true, ...sword }, { ...melee, incoming: 'shot' }).sources)).toBe(-4)
      expect(sourceTotal(defenseModifiers(defaultSituation, { shield: true, technique: 'Schilde', parryModifier: 2 }, { ...melee, incoming: 'thrown' }).sources)).toBe(-2)
   })
   it('large enemies allow shield or dodge, huge only dodge', () => {
      expect(defenseModifiers({ ...defaultSituation, enemySize: 'large' }, sword, melee).blocked).toHaveLength(1)
      expect(defenseModifiers({ ...defaultSituation, enemySize: 'large' }, { shield: true, ...sword }, melee).blocked).toHaveLength(0)
      expect(defenseModifiers({ ...defaultSituation, enemySize: 'huge' }, { shield: true, ...sword }, melee).blocked).toHaveLength(1)
   })
   it('enemy weapon rules: Fechtwaffe −1, Kettenwaffe PA −2 and shield bonus once, light weapons cannot parry heavy ones', () => {
      expect(sourceTotal(defenseModifiers({ ...defaultSituation, enemyWeapon: 'fencing' }, { dodge: true, ...sword }, melee).sources)).toBe(-1)
      expect(sourceTotal(defenseModifiers({ ...defaultSituation, enemyWeapon: 'chain' }, { shield: true, technique: 'Schilde', parryModifier: 2 }, melee).sources)).toBe(-4)
      const dagger = { technique: 'Dolche', parryModifier: 0 }
      expect(defenseModifiers({ ...defaultSituation, enemyWeapon: 'longOrTwoHanded' }, dagger, melee).blocked).toHaveLength(1)
      expect(defenseModifiers({ ...defaultSituation, enemyWeapon: 'longOrTwoHanded' }, dagger, { ...melee, crossBlock: true }).blocked).toHaveLength(0)
   })
   it('from behind −4, sight 4 only on a 1', () => {
      expect(sourceTotal(defenseModifiers(defaultSituation, sword, { ...melee, fromBehind: true }).sources)).toBe(-4)
      expect(defenseModifiers({ ...defaultSituation, sight: 4 }, sword, melee).rule).toBe('one')
   })
   it('Layariel: a confirmed critical ranged defense spares the next −3; unconfirmed only −2 (S. 244)', () => {
      expect(nextDefensePenalty('shot', 'critical')).toBe(0)
      expect(nextDefensePenalty('shot', 'criticalUnconfirmed')).toBe(2)
      expect(nextDefensePenalty('shot', 'success')).toBe(3)
      expect(nextDefensePenalty('melee', 'critical')).toBe(3)
   })
})

describe('Fernkampf (S. 241–242, 245)', () => {
   it('parses the weapon range into nah/mittel/weit', () => {
      expect(rangeBands('10/50/80')).toEqual([10, 50, 80])
      expect(rangeBands(undefined)).toBeNull()
   })
   it('Geron: nah +2 (+1 TP), Haken −4, slow target ±0, sight 1 per table −2 (S. 241–242, 245)', () => {
      const result = rangedAttackModifiers({ ...defaultRanged, distance: 'near', zigzag: true }, { ...defaultSituation, sight: 1 })
      expect(14 + sourceTotal(result.sources)).toBe(14 + 2 - 4 - 2)
      expect(result.tp).toBe(1)
   })
   it('size, movement, aiming (max +4) and shooting into melee', () => {
      const result = rangedAttackModifiers({ distance: 'far', size: 'small', targetMove: 'still', zigzag: false, shooterMove: 'walk', aim: 2, intoMelee: true }, defaultSituation)
      expect(sourceTotal(result.sources)).toBe(-2 - 4 + 2 - 2 + 4 - 2)
      expect(result.tp).toBe(-1)
      expect(rangedAttackModifiers(defaultRanged, { ...defaultSituation, water: 'under' }).blocked).toHaveLength(1)
   })
})

describe('Waffen (S. 233, 238, 245–250, 366)', () => {
   it('Arbosch: the passive Holzschild adds +1 to the Streitaxt parry (S. 233)', () => {
      const axe = { name: 'Streitaxt', technique: 'Hiebwaffen', shield: false }
      const shield = { name: 'Holzschild', technique: 'Schilde', parryModifier: 1, shield: true }
      expect(passiveParryBonus(axe, [axe, shield], [])).toBe(1)
   })
   it('Linkhand +1, Klingenfänger +1 more; only the highest bonus counts', () => {
      const rapier = { name: 'Rapier', technique: 'Fechtwaffen', shield: false }
      const linkhand = { name: 'Linkhand', technique: 'Dolche', shield: false }
      const thorwaler = { name: 'Thorwalerschild', technique: 'Schilde', parryModifier: 2, shield: true }
      expect(passiveParryBonus(rapier, [rapier, linkhand], [])).toBe(1)
      expect(passiveParryBonus(rapier, [rapier, linkhand], ['Klingenfänger'])).toBe(2)
      expect(passiveParryBonus(rapier, [rapier, linkhand, thorwaler], [])).toBe(2)
      expect(passiveParryBonus(rapier, [rapier], [])).toBe(0)
   })
   it('Arbosch with two axes: right −2, left −6 (S. 238)', () => {
      expect(twoWeaponPenalty([], false, false)).toBe(-2)
      expect(twoWeaponPenalty([], false, true)).toBe(-6)
      expect(twoWeaponPenalty(['Beidhändiger Kampf I'], true, true)).toBe(-1)
      expect(twoWeaponPenalty(['Beidhändiger Kampf I', 'Beidhändiger Kampf II'], false, false)).toBe(0)
      // S. 54: the SF covers Dolche, Fecht, Hieb, Raufen, Schilde, Schwerter only
      expect(twoWeaponPenalty(['Beidhändiger Kampf II'], false, false, 'Schilde')).toBe(0)
      expect(twoWeaponPenalty(['Beidhändiger Kampf II'], false, false, 'Kettenwaffen')).toBe(-2)
      expect(twoWeaponPenalty(['Beidhändiger Kampf I'], false, true, 'Stangenwaffen')).toBe(-6)
   })
   it('two-handed weapons', () => {
      expect(isTwoHanded('Zweihänder (2H)')).toBe(true)
      expect(isTwoHanded('Dreizack (2H)')).toBe(true)
      expect(isTwoHanded('Speer')).toBe(false)
   })
   it('Layariel: Elfenbogen reload 1 → 0 with Schnellladen; crossbows half (S. 246, 249)', () => {
      expect(reloadActions(1, 'Bögen', [])).toBe(1)
      expect(reloadActions(1, 'Bögen', ['Schnellladen (Bögen)'])).toBe(0)
      expect(reloadActions(15, 'Armbrüste', ['Schnellladen (Armbrüste)'])).toBe(8)
      expect(reloadActions('2/10', 'Armbrüste', [])).toBeNull()
   })
   it('maneuver damage: +TP, extra W6, ½ GS, 1W3 (S. 247–250)', () => {
      expect(maneuverDamage([{ label: 'Wuchtschlag II', damage: { bonus: 4 } }, { label: 'Hammerschlag', damage: { dice: 1 } }], 8))
         .toMatchObject({ bonus: 4, dice: 1, replace: null })
      expect(maneuverDamage([{ label: 'Sturmangriff', damage: { bonus: 2, halfSpeed: true } }], 7).bonus).toBe(2 + 4)
      expect(maneuverDamage([{ label: 'Zu Fall bringen', damage: { replace: '1W3' } }], 8).replace).toBe('1W3')
   })
})

describe('Einhändige Waffen zweihändig geführt (S. 366)', () => {
   const sword = { technique: 'Schwerter', ranged: false, shield: false, unarmed: false, twoHanded: false }
   it('+1 TP and PA −1', () => {
      expect(twoHandedGrip).toEqual({ damage: 1, parry: -1 })
   })
   it('needs a one-handed melee weapon and a free second hand', () => {
      expect(canGripTwoHanded(sword, 1)).toBe(true)
      expect(canGripTwoHanded({ ...sword, technique: 'Hiebwaffen' }, 1)).toBe(true)
      expect(canGripTwoHanded(sword, 2)).toBe(false)
      expect(canGripTwoHanded({ ...sword, twoHanded: true }, 1)).toBe(false)
      expect(canGripTwoHanded({ ...sword, shield: true, technique: 'Schilde' }, 1)).toBe(false)
      expect(canGripTwoHanded({ ...sword, ranged: true }, 1)).toBe(false)
   })
   it('does not apply to Dolche and Fechtwaffen', () => {
      expect(canGripTwoHanded({ ...sword, technique: 'Dolche' }, 1)).toBe(false)
      expect(canGripTwoHanded({ ...sword, technique: 'Fechtwaffen' }, 1)).toBe(false)
   })
})

describe('Dunkelsicht and Nachtblind on darkness (S. 164, 173, 239)', () => {
   const dark = (sight: Situation['sight'], darkness = true): Situation => ({ ...defaultSituation, sight, darkness })
   it.each([
      [2, { darkvision: 1, nightBlind: false }, 1],
      [1, { darkvision: 1, nightBlind: false }, 0],
      [3, { darkvision: 2, nightBlind: false }, 0],
      [4, { darkvision: 2, nightBlind: false }, 4],
      [1, { darkvision: 0, nightBlind: true }, 2],
      [3, { darkvision: 0, nightBlind: true }, 4],
      [0, { darkvision: 0, nightBlind: true }, 0],
   ] as const)('darkness level %i with %j → %i', (sight, vision, expected) => {
      expect(withVision(dark(sight), vision).sight).toBe(expected)
   })
   it('does not change sight that is not caused by darkness (fog, foliage)', () => {
      expect(withVision(dark(2, false), { darkvision: 2, nightBlind: false }).sight).toBe(2)
   })
   it('reads the levels from the hero entries', () => {
      expect(visionOf(['Dunkelsicht II'], [])).toEqual({ darkvision: 2, nightBlind: false })
      expect(visionOf([], ['Nachtblind'])).toEqual({ darkvision: 0, nightBlind: true })
   })
})
