import type { EquipmentEntry } from '@/features/heroes/statsApi'
import type { AventurianStoreItem } from '@/utils/aventurian_store'
import { plantRecipeKinds, type Recipe, type RecipeKind } from './herbApi'
import { isSpoiled, type ShelfLifeTables } from './shelfLifeRules'

// Translation keys of the six recipe sections (AdK S. 145, 152, 154, 159, 172, 175)
export const recipeKindLabels: Record<RecipeKind, string> = {
   hilfsmittel: 'Plant remedy', gift: 'Plant poison', rauschmittel: 'Plant drug',
   elixier: 'Elixir', alchimistischesGift: 'Alchemical poison', alchimistischesRauschmittel: 'Alchemical drug',
}

export const isPlantRecipe = (recipe: Pick<Recipe, 'kind'>) => plantRecipeKinds.includes(recipe.kind)

// The alchemical recipes of Archiv der Kräuter in the brewing shape of the core elixirs (AdK S. 158–178, RW S. 270–272),
// so the laboratory table, the brew dialog and the analysis use them unchanged. QS lines without a summary point to the page.
export function adkElixirItems(recipes: readonly Recipe[]): AventurianStoreItem[] {
   return recipes.filter((recipe) => !isPlantRecipe(recipe) && recipe.laboratory && typeof recipe.difficulty === 'number' && recipe.costPerLevel)
      .map((recipe) => ({
         name: recipe.key, kind: 'elixir' as const, weight: 0, price: { silbertaler: 0 }, sourcePage: recipe.page, sourceBook: 'AdK' as const,
         alchemy: {
            laboratory: recipe.laboratory!, brewingDifficulty: recipe.difficulty!, ingredientCostPerLevel: recipe.costPerLevel!,
            levels: recipe.summary?.qualities ?? Array.from({ length: 6 }, () => ({ de: `Siehe AdK S. ${recipe.page}.`, en: `See AdK p. ${recipe.page}.` })),
         },
      }))
}

// Applications of each main-plant group a hero can use now (not spoiled, AdK S. 284); the batch is limited by the scarcest group
export function craftableAmount(recipe: Pick<Recipe, 'mainPlants'>, equipment: readonly EquipmentEntry[], shelfLife: boolean,
   tables: Pick<ShelfLifeTables, 'coreShelfDays' | 'rawShelfDays'>, today: number | null) {
   if (!recipe.mainPlants.length) return 0
   return Math.min(...recipe.mainPlants.map((group) => equipment
      .filter((entry) => group.includes(entry.item) && !isSpoiled(entry.herb, shelfLife, tables, today))
      .reduce((sum, entry) => sum + entry.amount, 0)))
}
