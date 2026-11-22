export { carriedEquipmentWeight } from './containers'
import { carriedEquipmentWeight } from './containers'

export type EquipmentPurse = {
   dukaten: number
   silbertaler: number
   heller: number
   kreuzer: number
}

export type EquipmentPurchaseEntry = {
   item: string
   category: string
   weight: number
   amount: number
   carriedOn: string
   description: string
   quality?: number
}

export type EquipmentPurchaseInput = {
   item: string
   category: string
   unitWeight: number
   amount: number
   carriedOn: string
   unitPriceSilbertaler: number
   description?: string
   quality?: number
   // Equipment package (S. 364–365): paid once at the package price, each piece is added on its own (× amount)
   contents?: Array<{ item: string; category: string; unitWeight: number; amount: number; description?: string }>
}

type EquipmentPurchaseFailure =
   | { ok: false; reason: 'invalid-purse' | 'invalid-purchase' }
   | {
        ok: false
        reason: 'insufficient-funds'
        totalCostKreuzer: number
        availableKreuzer: number
     }

export type EquipmentPurchaseResult =
   | EquipmentPurchaseFailure
   | {
        ok: true
        purse: EquipmentPurse
        equipment: EquipmentPurchaseEntry[]
        totalWeight: number
        totalCostKreuzer: number
     }

// source: DSA5 Regelwerk, S. 364
const currencyInKreuzer = {
   dukaten: 1000,
   silbertaler: 100,
   heller: 10,
   kreuzer: 1,
} as const

export function purseToKreuzer(purse: EquipmentPurse) {
   const coins = [
      purse.dukaten,
      purse.silbertaler,
      purse.heller,
      purse.kreuzer,
   ]

   if (coins.some((coin) => !Number.isSafeInteger(coin) || coin < 0)) {
      return null
   }

   const total =
      purse.dukaten * currencyInKreuzer.dukaten +
      purse.silbertaler * currencyInKreuzer.silbertaler +
      purse.heller * currencyInKreuzer.heller +
      purse.kreuzer

   return Number.isSafeInteger(total) ? total : null
}

export function purseFromKreuzer(total: number): EquipmentPurse {
   const dukaten = Math.floor(total / currencyInKreuzer.dukaten)
   const afterDukaten = total % currencyInKreuzer.dukaten
   const silbertaler = Math.floor(
      afterDukaten / currencyInKreuzer.silbertaler,
   )
   const afterSilbertaler = afterDukaten % currencyInKreuzer.silbertaler
   const heller = Math.floor(afterSilbertaler / currencyInKreuzer.heller)

   return {
      dukaten,
      silbertaler,
      heller,
      kreuzer: afterSilbertaler % currencyInKreuzer.heller,
   }
}

export function purchaseEquipment(
   purse: EquipmentPurse,
   equipment: readonly EquipmentPurchaseEntry[],
   purchase: EquipmentPurchaseInput,
): EquipmentPurchaseResult {
   const availableKreuzer = purseToKreuzer(purse)
   if (availableKreuzer === null) {
      return { ok: false, reason: 'invalid-purse' }
   }

   const priceInKreuzer = purchase.unitPriceSilbertaler * 100
   const roundedPriceInKreuzer = Math.round(priceInKreuzer)
   if (
      !Number.isFinite(priceInKreuzer) ||
      purchase.unitPriceSilbertaler < 0 ||
      !Number.isSafeInteger(roundedPriceInKreuzer) ||
      Math.abs(priceInKreuzer - roundedPriceInKreuzer) > 1e-8 ||
      !Number.isSafeInteger(purchase.amount) ||
      purchase.amount < 1 ||
      !Number.isFinite(purchase.unitWeight) ||
      purchase.unitWeight < 0
   ) {
      return { ok: false, reason: 'invalid-purchase' }
   }

   const totalCostKreuzer = roundedPriceInKreuzer * purchase.amount
   if (!Number.isSafeInteger(totalCostKreuzer)) {
      return { ok: false, reason: 'invalid-purchase' }
   }
   if (totalCostKreuzer > availableKreuzer) {
      return {
         ok: false,
         reason: 'insufficient-funds',
         totalCostKreuzer,
         availableKreuzer,
      }
   }

   const pieces = purchase.contents?.length
      ? purchase.contents.map((piece) => ({ ...piece, amount: piece.amount * purchase.amount, quality: undefined }))
      : [{ item: purchase.item, category: purchase.category, unitWeight: purchase.unitWeight, amount: purchase.amount,
         description: purchase.description, quality: purchase.quality }]
   if (pieces.some((piece) => !Number.isSafeInteger(piece.amount) || piece.amount < 1 || !Number.isFinite(piece.unitWeight) || piece.unitWeight < 0)) {
      return { ok: false, reason: 'invalid-purchase' }
   }

   const nextEquipment = equipment.map((entry) => ({ ...entry }))
   for (const piece of pieces) {
      // Merges into an identical stack at the same place (same quality)
      const existingIndex = nextEquipment.findIndex(
         (entry) =>
            entry.item === piece.item &&
            entry.category === piece.category &&
            entry.carriedOn === purchase.carriedOn &&
            entry.quality === piece.quality,
      )

      if (existingIndex >= 0) {
         const nextAmount = nextEquipment[existingIndex].amount + piece.amount
         if (!Number.isSafeInteger(nextAmount)) {
            return { ok: false, reason: 'invalid-purchase' }
         }
         nextEquipment[existingIndex] = { ...nextEquipment[existingIndex], amount: nextAmount }
      } else {
         nextEquipment.push({
            item: piece.item,
            category: piece.category,
            weight: piece.unitWeight,
            amount: piece.amount,
            carriedOn: purchase.carriedOn,
            description: piece.description?.trim() ?? '',
            ...(piece.quality ? { quality: piece.quality } : {}),
         })
      }
   }

   const totalWeight = carriedEquipmentWeight(nextEquipment)
   if (!Number.isFinite(totalWeight)) {
      return { ok: false, reason: 'invalid-purchase' }
   }

   return {
      ok: true,
      purse: purseFromKreuzer(availableKreuzer - totalCostKreuzer),
      equipment: nextEquipment,
      totalWeight,
      totalCostKreuzer,
   }
}
