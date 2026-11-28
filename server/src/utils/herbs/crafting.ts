// Pflanzliche Rezepte (AdK S. 144): a Pflanzenkunde check turns applications of the main plant into products, one each.
// One check covers the whole batch and a failure loses the plants (user decisions, Nov 2026).
import type { BookRules } from '@/utils/bookRules'
import type { HerbItemState } from '@/utils/herbItem'
import { expiryDay, isSpoiled } from './shelfLife'
import { isPlantRecipeKind, type Recipe, type RecipeFacts } from './recipeTypes'

// Hilfsmittel: the Verarbeitungsschwierigkeit as printed (a modifier like the Brauschwierigkeit, −2 = harder; app reading).
// Gifte and Rauschmittel: harder by half the level, rounded in the hero's favour (S. 144).
export function craftModifier(recipe: Pick<RecipeFacts, 'kind' | 'processing' | 'poison'>) {
   if (recipe.kind === 'hilfsmittel') return recipe.processing ?? 0
   const level = recipe.poison?.level
   return typeof level === 'number' ? -Math.floor(level / 2) : 0
}

type Stack = { item: string; amount: number; herb?: HerbItemState | null }
export type CraftUse = { index: number; amount: number }

// The stacks one product batch uses: per required group `amount` applications of any of its plants, taken from the stacks
// that spoil first; spoiled stacks are skipped (AdK S. 284). Error when the inventory lacks applications.
export function craftUses(recipe: Pick<Recipe, 'kind' | 'mainPlants'>, equipment: readonly Stack[], amount: number,
   rules: Pick<BookRules, 'shelfLife'>, today: number | null): { uses: CraftUse[] } | { error: string } {
   if (!isPlantRecipeKind(recipe.kind)) return { error: 'Alchemical recipes are brewed (Alchimie), not made with Pflanzenkunde.' }
   if (!recipe.mainPlants.length) return { error: 'This recipe names no main plant.' }
   const uses: CraftUse[] = []
   for (const group of recipe.mainPlants) {
      const stacks = equipment.map((entry, index) => ({ entry, index }))
         .filter(({ entry }) => group.includes(entry.item) && entry.amount > 0 && !isSpoiled(entry.herb, rules, today))
         .sort((a, b) => (expiryDay(a.entry.herb, rules) ?? Infinity) - (expiryDay(b.entry.herb, rules) ?? Infinity))
      let missing = amount
      for (const { entry, index } of stacks) {
         if (missing === 0) break
         const take = Math.min(entry.amount, missing)
         uses.push({ index, amount: take })
         missing -= take
      }
      if (missing > 0) return { error: 'Not enough usable applications of the main plant in the inventory.' }
   }
   return { uses }
}
