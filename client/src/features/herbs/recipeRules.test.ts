import { describe, expect, it } from 'vitest'
import type { Recipe } from './herbApi'
import { adkElixirItems, craftableAmount } from './recipeRules'

const tables = { coreShelfDays: 90, rawShelfDays: 7 }
const base = { aliases: [], ingredients: null, optionalPlants: [], price: null, pricePerLevel: false, summary: null, craftModifier: null, craftTalents: [], secret: false }
const plantRecipe = { ...base, key: 'Schlängelbeutel', name: 'Schlängelbeutel', page: 150, kind: 'hilfsmittel', mainPlants: [['Braunschlinge', 'Krakenseerose']] } as Recipe
const elixir = { ...base, key: '1001 Rausch', name: '1001 Rausch', page: 159, kind: 'elixier', mainPlants: [], laboratory: 'Alchemistenlabor',
   difficulty: -2, costPerLevel: 60 } as Recipe
const entry = (item: string, amount: number, obtainedDay: number) => ({ item, amount, weight: 0, carriedOn: 'Other', category: 'Archiv_der_Kraeuter',
   herb: { form: 'raw' as const, obtainedDay, keepsUntilDay: null } })

describe('recipes in the client (AdK S. 144, 158)', () => {
   it('counts usable applications of any plant of a group, without spoiled ones', () => {
      const equipment = [entry('Braunschlinge', 2, 100), entry('Krakenseerose', 3, 100), entry('Krakenseerose', 4, 10)]
      expect(craftableAmount(plantRecipe, equipment, true, tables, 105)).toBe(5)
      expect(craftableAmount(plantRecipe, equipment, true, tables, null)).toBe(9)
      expect(craftableAmount(elixir, equipment, true, tables, 105)).toBe(0)
   })

   it('turns alchemical recipes into brewable elixirs; QS lines point to the page until summarised', () => {
      const [item] = adkElixirItems([plantRecipe, elixir])
      expect(item).toMatchObject({ name: '1001 Rausch', sourceBook: 'AdK', sourcePage: 159,
         alchemy: { laboratory: 'Alchemistenlabor', brewingDifficulty: -2, ingredientCostPerLevel: 60 } })
      expect(item.alchemy?.levels).toHaveLength(6)
      expect(item.alchemy?.levels[0].en).toBe('See AdK p. 159.')
   })
})
