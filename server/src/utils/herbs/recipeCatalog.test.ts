import { describe, expect, it } from 'vitest'
import { craftModifier, craftUses } from './crafting'
import { alchemicalRecipes, printedPrice, recipeByName, recipes, secretTalentMinimum } from './recipeCatalog'
import { recipeSummaries } from './recipeSummaries'

describe('recipe catalog (AdK S. 144–178)', () => {
   it('has every recipe of the chapter once, in its section', () => {
      expect(recipes).toHaveLength(125)
      expect(new Set(recipes.map((recipe) => recipe.key)).size).toBe(125)
      const count = (kind: string) => recipes.filter((recipe) => recipe.kind === kind).length
      expect([count('hilfsmittel'), count('gift'), count('rauschmittel')]).toEqual([42, 10, 17])
      expect([count('elixier'), count('alchimistischesGift'), count('alchimistischesRauschmittel')]).toEqual([39, 10, 7])
      expect(recipes.every((recipe) => recipe.page >= 145 && recipe.page <= 178)).toBe(true)
   })

   it('reads the book values (spot checks against the pages)', () => {
      // S. 145: Atanax, Verarbeitungsschwierigkeit +1
      expect(recipeByName('Atanax')).toMatchObject({ page: 145, kind: 'hilfsmittel', processing: 1, mainPlants: [['Atan-Kiefer']] })
      // S. 159: 1001 Rausch, alchimistisches Labor, −2, 60 S per level, 4 AP (Alchimie 4)
      expect(recipeByName('1001 Rausch')).toMatchObject({ laboratory: 'Alchemistenlabor', difficulty: -2, costPerLevel: 60, secretAp: 4 })
      // S. 171: Wachtrunk is printed without effect icons and still found
      expect(recipeByName('Wachtrunk')).toMatchObject({ page: 171, laboratory: 'Archaisches Labor', difficulty: 0, costPerLevel: 30, secretAp: 3 })
      expect(secretTalentMinimum(recipeByName('Unverwundbarkeitselixier')!)).toBe(12)
      // S. 152: Boabungaha, level 5, 800 / 1.200 Silbertaler
      expect(recipeByName('Boabungaha')).toMatchObject({ poison: { level: 5, resistance: 'Zähigkeit' }, price: 1200, pricePerLevel: false })
      // S. 172: alchemical poisons have the brew's QS as their level
      expect(recipeByName('Angstgift')).toMatchObject({ poison: { level: 'QS' }, price: 80, pricePerLevel: true })
   })

   it('knows which plants a plant recipe needs', () => {
      expect(recipes.filter((recipe) => ['hilfsmittel', 'gift', 'rauschmittel'].includes(recipe.kind)).every((recipe) => recipe.mainPlants.length > 0)).toBe(true)
      expect(recipeByName('Fiebersaft')).toMatchObject({ mainPlants: [['Joruga']], optionalPlants: ['Gulmond', 'Traschbart', 'Belmart'] })
      expect(recipeByName('Schlängelbeutel')?.mainPlants).toEqual([['Braunschlinge', 'Krakenseerose']])
      expect(recipeByName('Heilsalbe')?.mainPlants).toEqual([])
   })

   it('prices: Hilfsmittel cost one application of the main plant (S. 144), poisons their printed Preis', () => {
      expect(printedPrice('1 Silbertaler / 1,2 Silbertaler')).toEqual({ price: 1.2, perLevel: false })
      expect(printedPrice('2.500 Silbertaler / vielfaches des Wertes (Untergrundmärkte)')).toEqual({ price: null, perLevel: false })
      expect(recipes.filter((recipe) => recipe.kind === 'hilfsmittel').every((recipe) => recipe.price === null || recipe.price > 0)).toBe(true)
   })

   it('brews every alchemical recipe with lab, difficulty and cost', () => {
      expect(alchemicalRecipes).toHaveLength(56)
   })

   it('summaries belong to recipes and give six QS lines for alchemical ones', () => {
      for (const [name, summary] of Object.entries(recipeSummaries)) {
         const recipe = recipeByName(name)
         expect(recipe, name).not.toBeNull()
         expect(summary.effect.de && summary.effect.en, name).toBeTruthy()
         if (summary.qualities) expect(summary.qualities, name).toHaveLength(6)
      }
   })

   it('plant recipes are made with Pflanzenkunde, a few with another talent (S. 148–149)', () => {
      expect(recipeByName('Atanax')?.craftTalents).toEqual([{ talent: 'pflanzenkunde', modifier: 1 }])
      expect(recipeByName('Liebesküchlein')).toMatchObject({ secret: true, craftTalents: [{ talent: 'lebensmittelbearbeitung', modifier: 0, application: 'Backen' }] })
      expect(recipeByName('Menchal-Rüstung')?.craftTalents).toEqual([{ talent: 'pflanzenkunde', modifier: -2 }, { talent: 'lederbearbeitung', modifier: 0 }])
      expect(recipeByName('Heilsalbe')?.craftTalents).toEqual([])
   })

   it('every recipe has a summary, every elixir its six QS lines', () => {
      expect(recipes.filter((recipe) => !recipe.summary).map((recipe) => recipe.key)).toEqual([])
      expect(recipes.filter((recipe) => recipe.kind === 'elixier' && recipe.summary?.qualities?.length !== 6).map((recipe) => recipe.key)).toEqual([])
      // Lotosöl, S. 174: the footnote after the price is not part of it
      expect(recipeByName('Lotosöl')).toMatchObject({ poison: { resistance: 'Seelenkraft' }, price: 500, pricePerLevel: true })
   })
})

describe('crafting plant recipes (AdK S. 144)', () => {
   const rules = { shelfLife: true }
   it('modifier: Verarbeitungsschwierigkeit, or half the poison level in the hero’s favour', () => {
      expect(craftModifier(recipeByName('Finagebast')!)).toBe(-2)
      expect(craftModifier(recipeByName('Boabungaha')!)).toBe(-2)
      expect(craftModifier(recipeByName('Margolasch-Abführmittel')!)).toBe(-3)
      expect(craftModifier(recipeByName('Axorda-Katzensäckchen')!)).toBe(-1)
   })

   it('uses the stacks that spoil first and skips spoiled ones', () => {
      const atanax = recipeByName('Atanax')!
      const equipment = [
         { item: 'Atan-Kiefer', amount: 2, herb: { form: 'raw' as const, obtainedDay: 10, keepsUntilDay: null } },
         { item: 'Atan-Kiefer', amount: 3, herb: { form: 'preserved' as const, obtainedDay: 10, keepsUntilDay: 200 } },
         { item: 'Atan-Kiefer', amount: 5, herb: { form: 'raw' as const, obtainedDay: 100, keepsUntilDay: null } },
      ]
      // day 105: the first stack (raw, day 10 + 7) is spoiled; the fresh raw stack keeps until 107, the preserved one until 200
      expect(craftUses(atanax, equipment, 6, rules, 105)).toEqual({ uses: [{ index: 2, amount: 5 }, { index: 1, amount: 1 }] })
      expect(craftUses(atanax, equipment, 9, rules, 105)).toHaveProperty('error')
   })

   it('takes any plant of a group and refuses alchemical recipes', () => {
      const equipment = [{ item: 'Krakenseerose', amount: 2 }]
      expect(craftUses(recipeByName('Schlängelbeutel')!, equipment, 2, rules, null)).toEqual({ uses: [{ index: 0, amount: 2 }] })
      expect(craftUses(recipeByName('Heilsalbe')!, equipment, 1, rules, null)).toHaveProperty('error')
   })
})
