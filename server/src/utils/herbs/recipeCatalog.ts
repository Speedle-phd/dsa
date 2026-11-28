// The recipes of Archiv der Kräuter for the app: generated facts + main plants + prices + summaries.
// source: Archiv der Kräuter (AdK), S. 144 (Pflanzliche Rezepte), S. 145–158, S. 158 (Alchimistische Rezepte), S. 159–178
import { herbs } from './herbCatalog'
import { recipeData } from './recipeData'
import { recipeSummaries } from './recipeSummaries'
import { craftModifier } from './crafting'
import { isPlantRecipeKind, type CraftTalent, type Recipe, type RecipeFacts } from './recipeTypes'

// Plant recipes that name more than one plant (S. 146, 148, 150): which plant is required and which are optional
// additions that change the effect. Every other plant recipe needs the one plant whose page lists it.
const plantGroups: Record<string, { main: string[][]; optional: string[] }> = {
   // "Chonchinis, Salbenfett, Wirselkraut (optional)"
   Brandsalbe: { main: [['Chonchinis']], optional: ['Wirselkraut'] },
   // "Joruga mit Gulmond und/oder Traschbart und/oder Belmart"; pure Joruga works like the raw plant
   Fiebersaft: { main: [['Joruga']], optional: ['Gulmond', 'Traschbart', 'Belmart'] },
   // "Kairan, Wasser von dessen Fundort, optional Mibelrohr"
   Kairantrunk: { main: [['Kairan']], optional: ['Mibelrohr'] },
   // "Braunschlinge oder Krakenseerose"
   Schlängelbeutel: { main: [['Braunschlinge', 'Krakenseerose']], optional: [] },
}

// Plant recipes made with another talent (S. 148–149): Liebesküchlein is baked with Lebensmittelbearbeitung (Backen) instead
// of Pflanzenkunde and is a Berufsgeheimnis itself; Menchal-Rüstung may also be made with Lederbearbeitung ±0
const otherTalents: Record<string, { talents: CraftTalent[]; keepPlantKnowledge: boolean; secret?: boolean }> = {
   Liebesküchlein: { talents: [{ talent: 'lebensmittelbearbeitung', modifier: 0, application: 'Backen' }], keepPlantKnowledge: false, secret: true },
   'Menchal-Rüstung': { talents: [{ talent: 'lederbearbeitung', modifier: 0 }], keepPlantKnowledge: true },
}

// Plants whose page lists the recipe (the plant pages' Rezepte field)
function plantsOf(name: string) {
   return herbs.filter((herb) => herb.recipes.some((recipe) => recipe.book === 'AdK' && recipe.name === name)).map((herb) => herb.key)
}

// "20 Silbertaler / 85 Silbertaler", "1,2 Silbertaler", "1.200 Silbertaler", "60 Silbertaler pro Stufe / 80 …": the Preis
// (second value) in Silbertaler; null when it is not a number ("vielfaches des Wertes")
export function printedPrice(valuePrice: string | undefined) {
   if (!valuePrice) return { price: null, perLevel: false }
   const parts = valuePrice.split('/')
   const priceText = (parts[1] ?? parts[0]).trim()
   const match = priceText.match(/^([\d.]+(?:,\d+)?)/)
   if (!match) return { price: null, perLevel: false }
   const price = Number(match[1].replace(/\./g, '').replace(',', '.'))
   return { price: Number.isFinite(price) ? price : null, perLevel: /pro Stufe/.test(priceText) }
}

function recipeOf(facts: RecipeFacts): Recipe {
   const plant = isPlantRecipeKind(facts.kind)
   const groups = plantGroups[facts.name]
   const listed = plantsOf(facts.name)
   const mainPlants = plant ? groups?.main ?? (listed.length ? [listed] : []) : []
   const optionalPlants = plant ? groups?.optional ?? [] : []
   let price: number | null = null
   let pricePerLevel = false
   if (facts.valuePrice) {
      ({ price, perLevel: pricePerLevel } = printedPrice(facts.valuePrice))
   } else if (facts.kind === 'hilfsmittel') {
      // S. 144: the store price of a Hilfsmittel is what one application of its main plant costs at a merchant (raw price;
      // app reading: the plant as the merchant sells it)
      const main = herbs.find((herb) => herb.key === mainPlants[0]?.[0])
      price = main?.price.raw ?? main?.price.processed ?? null
   }
   const other = otherTalents[facts.name]
   const plantKnowledge: CraftTalent = { talent: 'pflanzenkunde', modifier: plant ? craftModifier(facts) : 0 }
   const craftTalents = !plant ? [] : other ? [...(other.keepPlantKnowledge ? [plantKnowledge] : []), ...other.talents] : [plantKnowledge]
   return { ...facts, key: facts.name, mainPlants, optionalPlants, price, pricePerLevel, summary: recipeSummaries[facts.name] ?? null,
      craftTalents, secret: other?.secret ?? false }
}

export const recipes: Recipe[] = recipeData.map(recipeOf)

export const recipeByName = (name: string) => recipes.find((recipe) => recipe.key === name) ?? null

// Alchemical recipes in the brewing shape of the core elixirs (RW S. 270–272); the lab and difficulty are always printed
export const alchemicalRecipes = recipes.filter((recipe) => !isPlantRecipeKind(recipe.kind) && recipe.laboratory && recipe.difficulty !== null
   && recipe.difficulty !== undefined && recipe.costPerLevel)

// Berufsgeheimnis prerequisite "Alchimie 6" → the talent value; null when the book gives none
export function secretTalentMinimum(recipe: Recipe) {
   const match = recipe.secretPrerequisite?.match(/Alchimie\s+(\d+)/)
   return match ? Number(match[1]) : null
}
