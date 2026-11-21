import { describe, expect, it } from 'vitest'
import { consumableFor, diceTotal, parseConsumableName, stackEffect } from './consumables'
import { calcRegeneration } from './regeneration'

describe('Heiltrank and Zaubertrank (S. 272, 274)', () => {
   it.each([[1, '1W3'], [2, '1W6'], [3, '1W6+2'], [4, '1W6+4'], [5, '1W6+6'], [6, '1W6+8']] as const)('QS %i uses %s', (quality, dice) => {
      for (const name of ['Heiltrank', 'Zaubertrank']) {
         const consumable = consumableFor(`${name} (QS ${quality})`)
         if (!consumable || (consumable.kind !== 'heal' && consumable.kind !== 'mana')) throw new Error('missing potion')
         const { count, sides, bonus } = consumable.dice
         expect(`${count}W${sides}${bonus ? `+${bonus}` : ''}`).toBe(dice)
      }
   })
   it('adds the bonus and rejects rolls that do not fit the dice', () => {
      const dice = { count: 1, sides: 6, bonus: 2 }
      expect(diceTotal(dice, [4])).toBe(6)
      expect(diceTotal(dice, [7])).toBeNull()
      expect(diceTotal(dice, [])).toBeNull()
      expect(diceTotal({ count: 1, sides: 3, bonus: 0 }, [4])).toBeNull()
   })
   it('needs a QS', () => {
      expect(consumableFor('Heiltrank')).toBeNull()
      expect(parseConsumableName('Heiltrank (QS 4)')).toEqual({ name: 'Heiltrank', quality: 4 })
   })
})

describe('Timed elixirs (S. 273–274)', () => {
   it.each([[1, 1, 5], [2, 2, 10], [3, 2, 15], [4, 2, 20], [5, 3, 30], [6, 3, 45]] as const)('Willenstrunk QS %i: SK +%i for %i minutes', (quality, bonus, time) => {
      const consumable = consumableFor('Willenstrunk', quality)
      expect(consumable).toMatchObject({ kind: 'effect', effect: { values: { soulPower: bonus }, duration: { de: `${time} Minuten` } } })
   })
   it('Waffenbalsam: +1 TP from QS 3, unbreakable from QS 5, per weapon', () => {
      expect(consumableFor('Waffenbalsam', 2, 'Säbel')).toMatchObject({ needsWeapon: true, effect: { key: 'weapon-balm:Säbel', values: { magicalWeapon: true } } })
      expect(consumableFor('Waffenbalsam', 2, 'Säbel')).not.toMatchObject({ effect: { values: { damageBonus: 1 } } })
      expect(consumableFor('Waffenbalsam', 3, 'Säbel')).toMatchObject({ effect: { values: { damageBonus: 1 } } })
      expect(consumableFor('Waffenbalsam', 5, 'Säbel')).toMatchObject({ effect: { values: { damageBonus: 1, unbreakable: true }, duration: { en: '1 day' } } })
   })
   it('Unsichtbarkeitselixier switches the status on; Verwandlung brings one level of Schmerz while transforming', () => {
      expect(consumableFor('Unsichtbarkeitselixier', 6)).toMatchObject({ effect: { setsStatus: 'Unsichtbar', duration: { de: '20 Minuten' } } })
      expect(consumableFor('Verwandlungselixier', 1)).toMatchObject({ effect: { values: { transitionPain: 1 }, duration: { de: '1 Minute' } } })
   })
})

describe('Herbs and poisons (S. 342, 345–346)', () => {
   it('Gulmond ignores two levels of Betäubung for 12 hours', () => {
      expect(consumableFor('Gulmond')).toMatchObject({ kind: 'effect', effect: { values: { ignoreStupor: 2 }, duration: { de: '12 Stunden' } } })
   })
   it('weapon poisons go on a chosen weapon', () => {
      expect(consumableFor('Wurara', undefined, 'Dolch')).toMatchObject({ needsWeapon: true, effect: { key: 'weapon-poison:Dolch', weapon: 'Dolch' } })
   })
   it('cures without a disease system are information only', () => {
      expect(consumableFor('Donf')).toMatchObject({ kind: 'info', page: 345 })
      expect(consumableFor('Seife')).toBeNull()
   })
})

describe('Gestapelte Alchimieeffekte (S. 272)', () => {
   const willpower = (quality: number) => {
      const consumable = consumableFor('Willenstrunk', quality)
      if (consumable?.kind !== 'effect') throw new Error('missing')
      return consumable.effect
   }
   it('only the strongest effect counts', () => {
      const running = [{ id: 'a', key: 'soulPower', quality: 5, values: { soulPower: 3 } }]
      expect(stackEffect(running, willpower(2))).toEqual({ action: 'weaker' })
      expect(stackEffect(running, willpower(6))).toEqual({ action: 'replace', existingId: 'a' })
      expect(stackEffect([], willpower(1))).toEqual({ action: 'add' })
   })
   it('Wirselkraut adds +1 per application up to +3', () => {
      const herb = consumableFor('Wirselkraut')
      if (herb?.kind !== 'effect') throw new Error('missing')
      expect(stackEffect([{ id: 'h', key: 'herbHealth', values: { herbHealth: 2 } }], herb.effect))
         .toEqual({ action: 'increase', existingId: 'h', values: { herbHealth: 3 } })
      expect(stackEffect([{ id: 'h', key: 'herbHealth', values: { herbHealth: 3 } }], herb.effect)).toEqual({ action: 'weaker' })
   })
   it('regeneration adds the herb bonus to LeP only, capped at +3 and not while Vergiftet', () => {
      const situation = { campsite: 'normal', interruption: 'none', environment: 'normal', poisonedOrSick: false,
         ironStone: 0, treatmentQuality: 0, otherModifier: 0, reducedHealth: false } as const
      const entries = { advantages: [], disadvantages: [] }
      expect(calcRegeneration('health', 4, situation, entries, { herbHealth: 5 })).toMatchObject({ herb: 3, amount: 7 })
      expect(calcRegeneration('mana', 4, situation, entries, { herbHealth: 2 })).toMatchObject({ herb: 0, amount: 4 })
      expect(calcRegeneration('health', 4, { ...situation, poisonedOrSick: true }, entries, { herbHealth: 2 })).toMatchObject({ amount: 0 })
   })
})
