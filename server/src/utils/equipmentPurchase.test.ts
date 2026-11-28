import { describe, expect, it } from 'vitest'
import {
   purchaseEquipment,
   carriedEquipmentWeight,
   type EquipmentPurchaseEntry,
   type EquipmentPurse,
} from './equipmentPurchase'

const emptyInventory: EquipmentPurchaseEntry[] = []

describe('Stash placement (app storage policy)', () => {
   it('excludes stored stacks while retaining carried stacks of the same item', () => {
      expect(carriedEquipmentWeight([
         { carriedOn: 'Stash', weight: 100, amount: 3 },
         { carriedOn: 'Backpack', weight: 2, amount: 4 },
         { carriedOn: 'Equipped', weight: 3, amount: 1 },
      ])).toBe(11)
      expect(carriedEquipmentWeight([])).toBe(0)
   })
   it('purchases into storage without adding carried weight or skipping payment', () => {
      const result = purchaseEquipment({ dukaten: 10, silbertaler: 0, heller: 0, kreuzer: 0 }, [], {
         item: 'Stored item', category: 'Other', unitWeight: 50, amount: 2, carriedOn: 'Stash', unitPriceSilbertaler: 1,
      })
      expect(result).toMatchObject({ ok: true, totalWeight: 0, totalCostKreuzer: 200,
         equipment: [{ item: 'Stored item', amount: 2, carriedOn: 'Stash', weight: 50 }] })
   })
})

describe('equipment purchases and currency (S. 364)', () => {
   it('deducts total price and returns change in standard denominations', () => {
      const purse: EquipmentPurse = {
         dukaten: 1,
         silbertaler: 0,
         heller: 0,
         kreuzer: 0,
      }

      const result = purchaseEquipment(purse, emptyInventory, {
         item: 'Becher',
         category: 'Traveling_and_Tools',
         unitWeight: 0.1,
         amount: 2,
         carriedOn: 'Backpack',
         unitPriceSilbertaler: 0.3,
      })

      expect(result).toEqual({
         ok: true,
         purse: { dukaten: 0, silbertaler: 9, heller: 4, kreuzer: 0 },
         equipment: [
            {
               item: 'Becher',
               category: 'Traveling_and_Tools',
               weight: 0.1,
               amount: 2,
               carriedOn: 'Backpack',
               description: '',
            },
         ],
         totalWeight: 0.2,
         totalCostKreuzer: 60,
      })
   })

   it('rejects a purchase that exceeds the available purse', () => {
      const result = purchaseEquipment(
         { dukaten: 0, silbertaler: 0, heller: 0, kreuzer: 9 },
         emptyInventory,
         {
            item: 'Becher',
            category: 'Traveling_and_Tools',
            unitWeight: 0.1,
            amount: 1,
            carriedOn: 'Backpack',
            unitPriceSilbertaler: 0.3,
         },
      )

      expect(result).toEqual({
         ok: false,
         reason: 'insufficient-funds',
         totalCostKreuzer: 30,
         availableKreuzer: 9,
      })
   })

   it('merges matching items using their unit weight', () => {
      const inventory: EquipmentPurchaseEntry[] = [
         {
            item: 'Becher',
            category: 'Traveling_and_Tools',
            weight: 0.1,
            amount: 2,
            carriedOn: 'Backpack',
            description: '',
         },
      ]

      const result = purchaseEquipment(
         { dukaten: 0, silbertaler: 1, heller: 0, kreuzer: 0 },
         inventory,
         {
            item: 'Becher',
            category: 'Traveling_and_Tools',
            unitWeight: 0.1,
            amount: 3,
            carriedOn: 'Backpack',
            unitPriceSilbertaler: 0.3,
         },
      )

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.equipment).toHaveLength(1)
      expect(result.equipment[0]).toMatchObject({ weight: 0.1, amount: 5 })
      expect(result.totalWeight).toBeCloseTo(0.5)
   })

   it('rejects prices that cannot be represented as whole Kreuzer', () => {
      const result = purchaseEquipment(
         { dukaten: 0, silbertaler: 1, heller: 0, kreuzer: 0 },
         emptyInventory,
         {
            item: 'Unpriced item',
            category: 'Other',
            unitWeight: 1,
            amount: 1,
            carriedOn: 'Backpack',
            unitPriceSilbertaler: 0.001,
         },
      )

      expect(result).toEqual({ ok: false, reason: 'invalid-purchase' })
   })
})

describe('equipment packages (S. 364–365)', () => {
   const purse: EquipmentPurse = { dukaten: 0, silbertaler: 500, heller: 0, kreuzer: 0 }
   const contents = [
      { item: 'Proviant für einen Tag', category: 'Traveling_and_Tools', unitWeight: 1.5, amount: 3 },
      { item: 'Kletterseil', category: 'Ropes_and_Climbing', unitWeight: 0.5, amount: 10 },
      { item: 'Messer', category: 'Traveling_and_Tools', unitWeight: 0.25, amount: 1, description: 'Weapon' },
   ]
   it('charges the package price once and adds every piece on its own, times the amount', () => {
      const result = purchaseEquipment(purse, [], {
         item: 'Reisepaket', category: 'Equipment_Packages', unitWeight: 20, amount: 2, carriedOn: 'Equipped', unitPriceSilbertaler: 120, contents,
      })
      // 500 S − 2 × 120 S = 260 S, returned in standard coins (S. 364)
      expect(result).toMatchObject({ ok: true, totalCostKreuzer: 24000, purse: { dukaten: 26, silbertaler: 0, heller: 0, kreuzer: 0 } })
      if (!result.ok) return
      expect(result.equipment.map(({ item, amount, weight }) => ({ item, amount, weight }))).toEqual([
         { item: 'Proviant für einen Tag', amount: 6, weight: 1.5 },
         { item: 'Kletterseil', amount: 20, weight: 0.5 },
         { item: 'Messer', amount: 2, weight: 0.25 },
      ])
      expect(result.equipment.some((entry) => entry.item === 'Reisepaket')).toBe(false)
      // 2 × (4.5 + 5 + 0.25)
      expect(result.totalWeight).toBeCloseTo(19.5)
   })
   it('merges pieces into identical stacks at the same place', () => {
      const owned: EquipmentPurchaseEntry[] = [{ item: 'Kletterseil', category: 'Ropes_and_Climbing', weight: 0.5, amount: 4, carriedOn: 'Equipped', description: '' }]
      const result = purchaseEquipment(purse, owned, {
         item: 'Reisepaket', category: 'Equipment_Packages', unitWeight: 20, amount: 1, carriedOn: 'Equipped', unitPriceSilbertaler: 120, contents,
      })
      expect(result.ok && result.equipment.filter((entry) => entry.item === 'Kletterseil')).toEqual([expect.objectContaining({ amount: 14 })])
   })
})

describe('plant items (AdK)', () => {
   const purse = { dukaten: 10, silbertaler: 0, heller: 0, kreuzer: 0 }
   const buy = (equipment: EquipmentPurchaseEntry[], obtainedDay: number) => purchaseEquipment(purse, equipment, {
      item: 'Wirselkraut', category: 'Healing_Herbs', unitWeight: 0, amount: 2, carriedOn: 'Backpack', unitPriceSilbertaler: 2,
      herb: { form: 'raw', obtainedDay, keepsUntilDay: obtainedDay + 7 } })
   it('herbs picked on the same day share a stack, herbs of another day stay apart', () => {
      const first = buy([], 100)
      if (!first.ok) throw new Error('purchase failed')
      const same = buy(first.equipment, 100)
      const other = buy(first.equipment, 103)
      expect(same.ok && same.equipment).toEqual([expect.objectContaining({ amount: 4, herb: { form: 'raw', obtainedDay: 100, keepsUntilDay: 107 } })])
      expect(other.ok && other.equipment.map((entry) => entry.herb?.obtainedDay)).toEqual([100, 103])
   })
})
