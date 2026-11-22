import { describe, expect, it } from 'vitest'
import { aventurianStore } from './aventurian_store'
import { bundlePieces } from './storeBundles'

const packageFor = (name: string) => aventurianStore.Equipment_Packages.find((item) => item.name === name)!

// source: DSA5 Regelwerk, S. 364–365 ("Gesamt" rows)
describe('Ausrüstungspakete (S. 364–365)', () => {
   it.each([['Reisepaket', 20, 20], ['Stadtpaket', 1.325, 10], ['Wildnispaket', 22.825, 16]] as const)(
      '%s splits into catalog pieces that weigh the printed total', (name, total, rows) => {
         const pieces = bundlePieces(packageFor(name))
         expect(pieces).toHaveLength(rows)
         expect(pieces.reduce((sum, piece) => sum + piece.unitWeight * piece.amount, 0)).toBeCloseTo(total, 6)
         expect(packageFor(name).weight).toBeCloseTo(total, 6)
      })
   it('uses the catalog items and units: rope per Schritt, provisions per day, bandages per 10', () => {
      const pieces = bundlePieces(packageFor('Reisepaket'))
      expect(pieces).toContainEqual(expect.objectContaining({ item: 'Kletterseil', category: 'Ropes_and_Climbing', amount: 10, unitWeight: 0.5 }))
      expect(pieces).toContainEqual(expect.objectContaining({ item: 'Proviant für einen Tag', amount: 3, unitWeight: 1.5 }))
      expect(pieces).toContainEqual(expect.objectContaining({ item: 'Verband, 10 Stück', amount: 1 }))
      expect(pieces).toContainEqual(expect.objectContaining({ item: 'Amulette, Götterfigürchen und andere persönliche Gegenstände', unitWeight: 2.175 }))
   })
   it('keeps clothing packages whole: the book lists no pieces', () => {
      const clothing = Object.values(aventurianStore).flat().filter((item) => item.name.startsWith('Kleidungspaket'))
      expect(clothing.length).toBeGreaterThan(0)
      expect(clothing.every((item) => bundlePieces(item).length === 0)).toBe(true)
   })
})
