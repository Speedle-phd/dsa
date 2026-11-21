import { describe, expect, it } from 'vitest'
import { aventurianStore } from '../../../client/src/utils/aventurian_store'
import { purchaseEquipment } from './equipmentPurchase'

const items = Object.values(aventurianStore).flat()
function item(name: string) {
   const entry = items.find((entry) => entry.name === name)
   if (!entry) throw new Error(`Missing catalog item: ${name}`)
   return entry
}

describe('Core equipment catalog (S. 366–381)', () => {
   it('contains complete fixed-price and fixed-weight noncombat table groups', () => {
      for (const [category, count] of [
         ['Clothing', 49], ['Weapon_Accessories', 6], ['Writing_Supplies', 10], ['Gemstones', 19],
         ['Jewelry', 21], ['Musical_Instruments', 12], ['Luxury_and_Leisure', 32], ['Animal_Equipment', 9],
      ] as const) expect(aventurianStore[category]).toHaveLength(count)
      expect(new Set(items.map((entry) => entry.name)).size).toBe(items.length)
      for (const entry of items) {
         expect(Number.isFinite(entry.weight) && entry.weight >= 0).toBe(true)
         expect(Number.isFinite(entry.price.silbertaler) && entry.price.silbertaler >= 0).toBe(true)
      }
   })

   describe('Ammunition purchases (S. 373)', () => {
      it('contains all three ammunition rows', () => {
         expect(aventurianStore.Ammunition).toHaveLength(3)
      })

      describe('Clothing packages and provisions (S. 375)', () => {
         it.each([
            ['Unfrei', 5], ['Frei', 25], ['Niederadel', 150], ['Adel', 1000], ['Hochadel', 1500],
         ] as const)('offers one %s clothing set without invented pieces or weight', (status, price) => {
            const clothing = item(`Kleidungspaket (${status})`)
            expect(clothing).toMatchObject({ kind: 'bundle', weight: 0, sourcePage: 375, price: { silbertaler: price } })
            expect(clothing.contents).toBeUndefined()
            const result = purchaseEquipment({ dukaten: 300, silbertaler: 0, heller: 0, kreuzer: 0 }, [], {
               item: clothing.name, category: 'Clothing', unitWeight: clothing.weight,
               unitPriceSilbertaler: clothing.price.silbertaler, amount: 2, carriedOn: 'Backpack',
            })
            expect(result).toMatchObject({
               ok: true, totalCostKreuzer: price * 200, totalWeight: 0,
               equipment: [{ item: clothing.name, amount: 2, weight: 0 }],
            })
         })
         it('keeps daily provisions unique and charges and weighs each daily ration', () => {
            expect(items.filter((entry) => entry.name === 'Proviant für einen Tag')).toHaveLength(1)
            const provisions = item('Proviant für einen Tag')
            expect(provisions).toMatchObject({ weight: 1.5, price: { silbertaler: 0.5 }, sourcePage: 375 })
            const result = purchaseEquipment({ dukaten: 1, silbertaler: 0, heller: 0, kreuzer: 0 }, [], {
               item: provisions.name, category: 'Traveling_and_Tools', unitWeight: provisions.weight,
               unitPriceSilbertaler: provisions.price.silbertaler, amount: 3, carriedOn: 'Backpack',
            })
            expect(result).toMatchObject({
               ok: true, totalCostKreuzer: 150, totalWeight: 4.5,
               equipment: [{ item: provisions.name, amount: 3, weight: 1.5 }],
            })
         })
      })
      it.each([
         ['Pfeile', 0.4, 800],
         ['Bolzen', 0.2, 400],
         ['Kugeln', 0.5, 1000],
      ] as const)('charges %s per projectile and uses the approved zero-weight policy', (name, silbertaler, totalCostKreuzer) => {
         const ammunition = item(name)
         expect(ammunition).toMatchObject({ weight: 0, price: { silbertaler }, sourcePage: 373, kind: 'equipment' })
         const result = purchaseEquipment({ dukaten: 1, silbertaler: 0, heller: 0, kreuzer: 0 }, [], {
            item: name, category: 'Ammunition', unitWeight: ammunition.weight,
            unitPriceSilbertaler: ammunition.price.silbertaler, amount: 20, carriedOn: 'Backpack',
         })
         expect(result).toMatchObject({
            ok: true, totalWeight: 0, totalCostKreuzer,
            equipment: [{ item: name, amount: 20, weight: 0, carriedOn: 'Backpack' }],
         })
         if (result.ok) {
            const { dukaten, silbertaler: remainingSilver, heller, kreuzer } = result.purse
            expect(dukaten * 1000 + remainingSilver * 100 + heller * 10 + kreuzer).toBe(1000 - totalCostKreuzer)
         }
      })
   })
   it.each([
      ['Lederhandschuhe', 1, 0.3, 374],
      ['Seidenstrümpfe', 0.1, 80, 375],
      ['Amethyst, 10 Karat', 0.002, 1.5, 378],
      ['Ring (Gold)', 0.05, 55, 378],
      ['Spinett', 100, 4000, 380],
      ['Bier, kleines Fässchen', 2, 0.16, 380],
      ['Reitsattel', 6, 60, 381],
      ['Lederrüstung', 6, 150, 374],
      ['Schuppenrüstung', 18, 400, 374],
   ])('preserves %s weight, price and source', (name, weight, silbertaler, sourcePage) => {
      expect(item(String(name))).toMatchObject({ weight, price: { silbertaler }, sourcePage })
   })
   it('covers all purchasable combat rows without duplicating the existing knife', () => {
      // 53 table rows (S. 366–368) plus the Firnklinge artifact Säbel (S. 270, 379)
      expect(items.filter((entry) => entry.weapon && entry.weapon.reach !== 'ranged' && entry.kind !== 'shield')).toHaveLength(54)
      expect(aventurianStore.Shields).toHaveLength(4)
      expect(aventurianStore.Ranged_Weapons).toHaveLength(16)
      expect(items.filter((entry) => entry.name === 'Messer')).toHaveLength(1)
      expect(item('Messer').weapon).toMatchObject({ combatTechnique: 'Dolche', damage: '1W6+1', parryModifier: -2 })
      expect(item('Kriegslanze').weapon).toMatchObject({ damage: '2W6+6', canParry: false })
      expect(item('Morgenstern').weapon).toMatchObject({ canParry: false })
      expect(item('Eisenwalder').weapon).toMatchObject({ reloadActions: '2/10', range: '10/50/80' })
      expect(item('Rabenschnabel (profan)').price.silbertaler).toBe(90)
      expect(item('Haumesser').price.silbertaler).toBe(20)
      expect(item('Haumesser (Waffe)').price.silbertaler).toBe(100)
   })
   it('new items use normal purse, quantity and stash purchase behavior', () => {
      const saddle = item('Reitsattel')
      const result = purchaseEquipment({ dukaten: 20, silbertaler: 0, heller: 0, kreuzer: 0 }, [], {
         item: saddle.name, category: 'Animal_Equipment', unitWeight: saddle.weight,
         unitPriceSilbertaler: saddle.price.silbertaler, amount: 2, carriedOn: 'Stash',
      })
      expect(result).toMatchObject({ ok: true, totalWeight: 0, totalCostKreuzer: 12000,
         purse: { dukaten: 8, silbertaler: 0, heller: 0, kreuzer: 0 },
         equipment: [{ item: 'Reitsattel', amount: 2, weight: 6, carriedOn: 'Stash' }] })
   })
})

describe('Alchimica, Gifte, Heilkräuter, Bücher, Artefakte, Tiere, Fortbewegungsmittel (S. 379–381)', () => {
   it('contains every listed row', () => {
      for (const [category, count] of [
         ['Alchimica', 8], ['Poisons', 4], ['Healing_Herbs', 7], ['Books', 4], ['Magic_Artifacts', 2],
         ['Animals', 4], ['Animal_Feed', 3], ['Vehicles', 5],
      ] as const) expect(aventurianStore[category]).toHaveLength(count)
   })
   it.each([
      ['Antidot', 65], ['Heiltrank', 60], ['Liebestrunk', 80], ['Unsichtbarkeitselixier', 80],
      ['Verwandlungselixier', 80], ['Waffenbalsam', 110], ['Willenstrunk', 100], ['Zaubertrank', 100],
   ] as const)('prices %s at %i S per QS for QS 1–6 (S. 379)', (name, perQuality) => {
      const elixir = item(name)
      expect(elixir.variants?.map((variant) => [variant.quality, variant.silbertaler]))
         .toEqual([1, 2, 3, 4, 5, 6].map((quality) => [quality, perQuality * quality]))
      expect(elixir.alchemy?.levels).toHaveLength(6)
   })
   it('takes laboratory and Brauschwierigkeit from the recipes (S. 272–274)', () => {
      expect(item('Heiltrank').alchemy).toMatchObject({ laboratory: 'Archaisches Labor', brewingDifficulty: 0, ingredientCostPerLevel: 40 })
      expect(item('Antidot').alchemy).toMatchObject({ laboratory: 'Hexenküche', brewingDifficulty: -1, ingredientCostPerLevel: 40 })
      expect(item('Waffenbalsam').alchemy).toMatchObject({ laboratory: 'Alchimistenlabor', brewingDifficulty: -2, ingredientCostPerLevel: 65 })
   })
   it('prices mounts untrained, trained +20 % and combat-trained ×2 (S. 381)', () => {
      expect(item('Pferd').variants?.map((variant) => variant.silbertaler)).toEqual([750, 900, 1500])
      expect(item('Pony').variants?.map((variant) => variant.silbertaler)).toEqual([250, 300, 500])
      expect(item('Hund')).toMatchObject({ price: { silbertaler: 4 } })
      expect(item('Hund').variants).toBeUndefined()
   })
   it('uses the alchemist/herbalist price for herbs and the store price for poisons (S. 380)', () => {
      expect(item('Wirselkraut')).toMatchObject({ price: { silbertaler: 2.2 }, herb: { rawPrice: 2 } })
      expect(item('Axordabaum')).toMatchObject({ price: { silbertaler: 80 }, herb: { rawPrice: 16 } })
      expect(item('Tulmadron')).toMatchObject({ price: { silbertaler: 1250 }, poison: { level: 4, resistance: 'ZK' } })
   })
   it('marks book ranges and "unterschiedlich" armor as agreed prices (S. 374, 379)', () => {
      expect(item('Codex Albyricus').priceVaries).toEqual({ min: 300, max: 700 })
      expect(item('Winterkleidung')).toMatchObject({ priceVaries: {}, armor: { protection: 1, burden: 0, movementPenalty: 1, initiativePenalty: 1 } })
   })
   it('keeps different QS of the same elixir in separate stacks', () => {
      const purse = { dukaten: 100, silbertaler: 0, heller: 0, kreuzer: 0 }
      const buy = (quality: number, equipment: Parameters<typeof purchaseEquipment>[1] = []) => purchaseEquipment(purse, equipment, {
         item: 'Heiltrank', category: 'Alchimica', unitWeight: 0, unitPriceSilbertaler: 60 * quality, amount: 1, carriedOn: 'Belt', quality,
      })
      const first = buy(3)
      if (!first.ok) throw new Error('purchase failed')
      const second = buy(4, first.equipment)
      const third = buy(3, first.equipment)
      expect(second.ok && second.equipment.map((entry) => [entry.quality, entry.amount])).toEqual([[3, 1], [4, 1]])
      expect(third.ok && third.equipment.map((entry) => [entry.quality, entry.amount])).toEqual([[3, 2]])
      expect(first).toMatchObject({ totalCostKreuzer: 18000 })
   })
})
