import { describe, expect, it } from 'vitest'
import { aventurianStore } from '../../../client/src/utils/aventurian_store'
import { analysisModifier, bestLaboratory, brewedQuality, brewPlan, elixirRecipes, laboratoryModifier } from './alchemy'

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
})
