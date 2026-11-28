// Recipes of Archiv der Kräuter (AdK S. 144–178). Facts come from the book's labelled fields (recipeData.ts, generated);
// what a product does is a short summary in own words (recipeSummaries.ts; user decision, Nov 2026).
import type { Localized } from './herbTypes'

// Pflanzliche Rezepte (Pflanzenkunde, S. 144) and Alchimistische Rezepte (Alchimie, S. 158)
export const recipeKinds = ['hilfsmittel', 'gift', 'rauschmittel', 'elixier', 'alchimistischesGift', 'alchimistischesRauschmittel'] as const
export type RecipeKind = (typeof recipeKinds)[number]
export const plantRecipeKinds: readonly RecipeKind[] = ['hilfsmittel', 'gift', 'rauschmittel']
export const isPlantRecipeKind = (kind: RecipeKind) => plantRecipeKinds.includes(kind)

export type RecipeLaboratory = 'Archaisches Labor' | 'Hexenküche' | 'Alchemistenlabor'

// Poison and drug values (RW S. 341; AdK S. 301): level is a number, or "QS" for alchemical ones (the brew's QS)
export type RecipePoison = { level: number | 'QS' | null; type: string | null; resistance: string | null; onset: string | null; duration: string | null }

export type RecipeFacts = {
   name: string
   page: number
   kind: RecipeKind
   aliases: string[]
   // The book's list of Zutaten (plant recipes) or typische Ingredienzien (alchemical recipes)
   ingredients: string | null
   // Plant recipes: typische Hilfsmittel and the Verarbeitungsschwierigkeit (Hilfsmittel only; poisons and drugs use half their level)
   tools?: string | null
   processing?: number | null
   // Alchemical recipes (brewing as in RW S. 270–272)
   costPerLevel?: number | null
   laboratory?: RecipeLaboratory | null
   difficulty?: number | null
   brewPrerequisites?: string | null
   secretAp?: number | null
   secretPrerequisite?: string | null
   poison?: RecipePoison
   legality?: string
   // "Wert / Preis" as printed (S. 301, 303)
   valuePrice?: string
}

// What the product does, in own words; alchemical recipes add one line per QS 1–6
export type RecipeSummary = { effect: Localized; qualities?: Localized[] }

// A talent a plant recipe can be made with and its modifier (Pflanzenkunde by default, S. 144; a few recipes name another)
export type CraftTalent = { talent: string; modifier: number; application?: string }

export type Recipe = RecipeFacts & {
   key: string
   // Plant recipes: the main plants one application of each group is used up for per product (any plant of a group);
   // optional plants are shown only (app choice: not tracked)
   mainPlants: string[][]
   optionalPlants: string[]
   // Store price of one product in Silbertaler (S. 144: Hilfsmittel cost what one application of the main plant costs;
   // poisons and drugs: the printed Preis), per level for alchemical ones; null when not traded or not given
   price: number | null
   pricePerLevel: boolean
   summary: RecipeSummary | null
   // Plant recipes: the talents to choose from; secret = the recipe is a Berufsgeheimnis of its own (Liebesküchlein, S. 148)
   craftTalents: CraftTalent[]
   secret: boolean
}
