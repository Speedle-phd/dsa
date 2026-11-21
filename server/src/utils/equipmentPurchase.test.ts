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
