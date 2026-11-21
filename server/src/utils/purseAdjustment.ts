import {
   purseFromKreuzer,
   purseToKreuzer,
   type EquipmentPurse,
} from './equipmentPurchase'

export type PurseAdjustmentInput = {
   direction: 'receive' | 'lose'
   coins: EquipmentPurse
}

export type PurseAdjustmentResult =
   | { ok: true; purse: EquipmentPurse; amountKreuzer: number }
   | { ok: false; reason: 'invalid-purse' | 'invalid-amount' }
   | {
        ok: false
        reason: 'insufficient-funds'
        amountKreuzer: number
        availableKreuzer: number
     }

// source: DSA5 Regelwerk, S. 364 (currency conversion happens in equipmentPurchase)
export function adjustPurse(
   purse: EquipmentPurse,
   adjustment: PurseAdjustmentInput,
): PurseAdjustmentResult {
   const availableKreuzer = purseToKreuzer(purse)
   if (availableKreuzer === null) {
      return { ok: false, reason: 'invalid-purse' }
   }

   const amountKreuzer = purseToKreuzer(adjustment.coins)
   if (amountKreuzer === null || amountKreuzer < 1) {
      return { ok: false, reason: 'invalid-amount' }
   }

   if (adjustment.direction === 'receive') {
      const next = {
         dukaten: purse.dukaten + adjustment.coins.dukaten,
         silbertaler: purse.silbertaler + adjustment.coins.silbertaler,
         heller: purse.heller + adjustment.coins.heller,
         kreuzer: purse.kreuzer + adjustment.coins.kreuzer,
      }
      if (purseToKreuzer(next) === null) {
         return { ok: false, reason: 'invalid-amount' }
      }
      return { ok: true, purse: next, amountKreuzer }
   }

   if (amountKreuzer > availableKreuzer) {
      return {
         ok: false,
         reason: 'insufficient-funds',
         amountKreuzer,
         availableKreuzer,
      }
   }

   return {
      ok: true,
      purse: purseFromKreuzer(availableKreuzer - amountKreuzer),
      amountKreuzer,
   }
}
