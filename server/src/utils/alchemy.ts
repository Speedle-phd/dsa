import { BadRequestError } from '@/utils/appError'
import { alchemicalRecipes } from '@/utils/herbs/recipeCatalog'

// source: DSA5 Regelwerk, S. 270 (three laboratory levels, also sold as Werkzeugsammlungen, S. 369)
export const laboratories = ['Archaisches Labor', 'Hexenküche', 'Alchemistenlabor'] as const
export type Laboratory = typeof laboratories[number]

// source: DSA5 Regelwerk, S. 272–274 (lab, Brauschwierigkeit, ingredient cost per level). Mirrors the store's Alchimica data.
export const elixirRecipes: Record<string, { laboratory: Laboratory; difficulty: number; costPerLevel: number }> = {
   Antidot: { laboratory: 'Hexenküche', difficulty: -1, costPerLevel: 40 },
   Heiltrank: { laboratory: 'Archaisches Labor', difficulty: 0, costPerLevel: 40 },
   Liebestrunk: { laboratory: 'Hexenküche', difficulty: -1, costPerLevel: 55 },
   Unsichtbarkeitselixier: { laboratory: 'Hexenküche', difficulty: -2, costPerLevel: 55 },
   Verwandlungselixier: { laboratory: 'Hexenküche', difficulty: -2, costPerLevel: 55 },
   Waffenbalsam: { laboratory: 'Alchemistenlabor', difficulty: -2, costPerLevel: 65 },
   Willenstrunk: { laboratory: 'Alchemistenlabor', difficulty: -2, costPerLevel: 55 },
   Zaubertrank: { laboratory: 'Alchemistenlabor', difficulty: -2, costPerLevel: 55 },
}

type BrewRecipe = { laboratory: Laboratory; difficulty: number; costPerLevel: number }

// The core elixirs, plus with Archiv der Kräuter switched on its alchemical recipes (AdK S. 158–178, brewed the same way)
export function brewRecipe(elixir: string, adk: boolean): BrewRecipe | null {
   const core = elixirRecipes[elixir]
   if (core) return core
   if (!adk) return null
   const recipe = alchemicalRecipes.find((entry) => entry.key === elixir)
   return recipe?.laboratory && typeof recipe.difficulty === 'number' && recipe.costPerLevel
      ? { laboratory: recipe.laboratory, difficulty: recipe.difficulty, costPerLevel: recipe.costPerLevel } : null
}

export function bestLaboratory(items: readonly string[]): Laboratory | null {
   return [...laboratories].reverse().find((lab) => items.includes(lab)) ?? null
}

// source: DSA5 Regelwerk, S. 271 (one level too low −3, two levels too low impossible, higher +1 / +2)
export function laboratoryModifier(owned: Laboratory | null, needed: Laboratory) {
   if (!owned) return null
   const difference = laboratories.indexOf(owned) - laboratories.indexOf(needed)
   return difference <= -2 ? null : difference === -1 ? -3 : difference
}

// substitution: points of extra difficulty taken with the Alchimistische Äquivalenzlehre (AdK S. 297), each saving 10 % of the cost
export type BrewInput = { elixir: string; level: number; asp: number; laboratory: Laboratory | null; adk?: boolean; substitution?: number }
export type BrewPlan = { modifier: number; ingredientCost: number; aspBonus: number }

// source: DSA5 Regelwerk, S. 271 (ingredient level 1–6 caps the QS; +1 per 4 AsP with an Alraune, max +2)
export function brewPlan({ elixir, level, asp, laboratory, adk = false, substitution = 0 }: BrewInput): BrewPlan {
   const recipe = brewRecipe(elixir, adk)
   if (!recipe) throw new BadRequestError('Choose one of the known elixir recipes (S. 272–274).')
   if (!Number.isInteger(level) || level < 1 || level > 6) throw new BadRequestError('Ingredient level must be 1–6 (S. 271).')
   if (![0, 4, 8].includes(asp)) throw new BadRequestError('Charge 0, 4 or 8 AsP (S. 271).')
   const lab = laboratoryModifier(laboratory, recipe.laboratory)
   if (lab === null) throw new BadRequestError(`This elixir needs at least a ${laboratories[Math.max(0, laboratories.indexOf(recipe.laboratory) - 1)]} (S. 271).`)
   // AdK S. 297: 10 % of the ingredient cost saved per point of extra difficulty, at most 50 % (5 points)
   if (!Number.isInteger(substitution) || substitution < 0 || substitution > 5) throw new BadRequestError('The Äquivalenzlehre saves 10 % per point, at most 50 % (AdK S. 297).')
   const aspBonus = asp / 4
   return { modifier: recipe.difficulty + lab + aspBonus - substitution, ingredientCost: level * recipe.costPerLevel * (10 - substitution) / 10, aspBonus }
}

// The QS of a successful brew is capped by the ingredient level (S. 271).
export const brewedQuality = (quality: number, level: number) => Math.max(1, Math.min(quality, level))

// source: DSA5 Regelwerk, S. 272 (analysis: half the Brauschwierigkeit, archaic lab −2, Hexenküche ±0, alchemist lab +1, known recipe +1).
// App decision: half the Brauschwierigkeit is rounded toward the harder side (−1 → −1, −2 → −1).
export function analysisModifier(elixir: string, laboratory: Laboratory | null, recipeKnown: boolean, adk = false) {
   const recipe = brewRecipe(elixir, adk)
   if (!recipe) throw new BadRequestError('Choose one of the known elixir recipes (S. 272–274).')
   const half = Math.floor(recipe.difficulty / 2)
   const lab = laboratory === 'Alchemistenlabor' ? 1 : laboratory === 'Hexenküche' ? 0 : -2
   return half + lab + (recipeKnown ? 1 : 0)
}
