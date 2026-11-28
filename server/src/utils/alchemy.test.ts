import { describe, expect, it } from 'vitest'
import { aventurianStore } from '../../../client/src/utils/aventurian_store'
import { analysisModifier, bestLaboratory, brewedQuality, brewPlan, brewRecipe, elixirRecipes, laboratoryModifier } from './alchemy'

describe('Alchemy (S. 270–274)', () => {
   it('mirrors the store’s Alchimica data', () => {
      for (const item of aventurianStore.Alchimica) {
         expect(elixirRecipes[item.name]).toEqual({
            // The store text says Alchimistenlabor (S. 274), the lab item is sold as Alchemistenlabor.
            laboratory: item.alchemy!.laboratory.replace('Alchimistenlabor', 'Alchemistenlabor'), difficulty: item.alchemy!.brewingDifficulty, costPerLevel: item.alchemy!.ingredientCostPerLevel,
         })
      }
      expect(Object.keys(elixirRecipes)).toHaveLength(aventurianStore.Alchimica.length)
   })
   it('rates laboratories', () => {
      expect(bestLaboratory(['Seil', 'Hexenküche', 'Archaisches Labor'])).toBe('Hexenküche')
      expect(laboratoryModifier('Archaisches Labor', 'Alchemistenlabor')).toBeNull()
      expect(laboratoryModifier('Hexenküche', 'Alchemistenlabor')).toBe(-3)
      expect(laboratoryModifier('Alchemistenlabor', 'Archaisches Labor')).toBe(2)
   })
   it('Rowena example: Heiltrank in a Hexenküche, level 4 ingredients, 8 AsP → +3, 160 S, QS capped at 4', () => {
      expect(brewPlan({ elixir: 'Heiltrank', level: 4, asp: 8, laboratory: 'Hexenküche' })).toEqual({ modifier: 3, ingredientCost: 160, aspBonus: 2 })
      expect(brewedQuality(5, 4)).toBe(4)
      expect(() => brewPlan({ elixir: 'Zaubertrank', level: 2, asp: 0, laboratory: 'Archaisches Labor' })).toThrow()
      expect(() => brewPlan({ elixir: 'Heiltrank', level: 7, asp: 0, laboratory: 'Hexenküche' })).toThrow()
   })
   it('analyses with half the Brauschwierigkeit and lab bonuses', () => {
      expect(analysisModifier('Zaubertrank', 'Alchemistenlabor', true)).toBe(1)
      expect(analysisModifier('Antidot', 'Archaisches Labor', false)).toBe(-3)
   })

   it('brews the alchemical recipes of Archiv der Kräuter only with the book switched on (AdK S. 158)', () => {
      // 1001 Rausch, S. 159: alchimistisches Labor, −2, 60 S per level
      expect(() => brewPlan({ elixir: '1001 Rausch', level: 2, asp: 0, laboratory: 'Alchemistenlabor' })).toThrow()
      expect(brewPlan({ elixir: '1001 Rausch', level: 2, asp: 0, laboratory: 'Alchemistenlabor', adk: true })).toEqual({ modifier: -2, ingredientCost: 120, aspBonus: 0 })
      expect(brewRecipe('Heiltrank', true)).toEqual(brewRecipe('Heiltrank', false))
   })

   it('Äquivalenzlehre: −1 per 10 % of the ingredient cost saved, at most 50 % (AdK S. 297)', () => {
      // Heiltrank 40 S per level, level 3 = 120 S; 2 points: −2 and 96 S; 5 points: −5 and 60 S
      expect(brewPlan({ elixir: 'Heiltrank', level: 3, asp: 0, laboratory: 'Archaisches Labor', substitution: 2 })).toEqual({ modifier: -2, ingredientCost: 96, aspBonus: 0 })
      expect(brewPlan({ elixir: 'Heiltrank', level: 3, asp: 0, laboratory: 'Archaisches Labor', substitution: 5 }).ingredientCost).toBe(60)
      expect(() => brewPlan({ elixir: 'Heiltrank', level: 3, asp: 0, laboratory: 'Archaisches Labor', substitution: 6 })).toThrow()
      // Heilsalbe 25 S per level, level 1 with 1 point: 22.5 S
      expect(brewPlan({ elixir: 'Heilsalbe', level: 1, asp: 0, laboratory: 'Archaisches Labor', adk: true, substitution: 1 }).ingredientCost).toBe(22.5)
   })
})
