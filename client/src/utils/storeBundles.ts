import { aventurianStore, type AventurianStoreItem } from './aventurian_store'
import { getPurchaseDescription } from './storeDisplay'

export type BundlePiece = { item: string; category: string; unitWeight: number; amount: number; description?: string }

const catalogWithCategory = Object.entries(aventurianStore).flatMap(([category, items]) => items.map((item) => ({ category, item })))

// source: DSA5 Regelwerk, S. 364–365. An equipment package is bought at its price, but every piece goes into the
// inventory on its own, with the catalog's category, weight and details. Pieces the catalog does not sell carry the
// package table's weight. Bundles without listed contents (Kleidungspakete) stay one item.
export function bundlePieces(bundle: AventurianStoreItem): BundlePiece[] {
   return (bundle.contents ?? []).map(({ name, amount, weight }) => {
      const found = catalogWithCategory.find(({ item }) => item.name === name)
      const unitWeight = weight ?? found?.item.weight
      if (unitWeight === undefined) throw new Error(`Bundle piece without catalog entry or weight: ${name}`)
      const description = found ? getPurchaseDescription(found.item) : ''
      return { item: name, category: found?.category ?? 'Equipment_Packages', unitWeight, amount, ...(description ? { description } : {}) }
   })
}
