import { describe, expect, it } from 'vitest'
import { adjustPurse } from './purseAdjustment'

const purse = { dukaten: 1, silbertaler: 0, heller: 0, kreuzer: 0 }
const coins = (silbertaler: number) => ({
   dukaten: 0,
   silbertaler,
   heller: 0,
   kreuzer: 0,
})

describe('purse adjustments (S. 364)', () => {
   it('adds received coins by denomination', () => {
      expect(
         adjustPurse(purse, { direction: 'receive', coins: coins(5) }),
      ).toEqual({
         ok: true,
         purse: { dukaten: 1, silbertaler: 5, heller: 0, kreuzer: 0 },
         amountKreuzer: 500,
      })
   })

   it('deducts lost money and breaks larger coins', () => {
      expect(
         adjustPurse(purse, { direction: 'lose', coins: coins(3) }),
      ).toEqual({
         ok: true,
         purse: { dukaten: 0, silbertaler: 7, heller: 0, kreuzer: 0 },
         amountKreuzer: 300,
      })
   })

   it('rejects losing more than the purse holds', () => {
      expect(
         adjustPurse(purse, { direction: 'lose', coins: coins(11) }),
      ).toEqual({
         ok: false,
         reason: 'insufficient-funds',
         amountKreuzer: 1100,
         availableKreuzer: 1000,
      })
   })

   it('rejects empty or fractional amounts', () => {
      expect(
         adjustPurse(purse, { direction: 'receive', coins: coins(0) }).ok,
      ).toBe(false)
      expect(
         adjustPurse(purse, { direction: 'receive', coins: coins(0.5) }).ok,
      ).toBe(false)
   })
})
