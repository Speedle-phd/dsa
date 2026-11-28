import { BookOpen, Hammer, Search } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import type { Stats } from '@/features/heroes/statsApi'
import { talentCatalog } from '@/features/heroes/talentCatalog'
import { CraftHerbalDialog } from './CraftHerbalDialog'
import { useHerbReference, type Recipe, type RecipeKind } from './herbApi'
import { craftableAmount, isPlantRecipe, recipeKindLabels } from './recipeRules'

const signed = (value: number) => (value > 0 ? `+${value}` : value === 0 ? '±0' : `−${Math.abs(value)}`)
const silver = (value: number) => `${String(value).replace('.', ',')} S`

// The recipes of Archiv der Kräuter (AdK S. 144–178): plant recipes are made here with Pflanzenkunde (S. 144); alchemical ones
// are Berufsgeheimnisse brewed in the laboratory table above (S. 158). Shown when the book is switched on for the hero.
export function RecipeBook({ stats, shelfLife, today }: { stats: Stats; shelfLife: boolean; today: number | null }) {
   const language = useLanguageStore((state) => state.language)
   const reference = useHerbReference()
   const [query, setQuery] = useState('')
   const [kind, setKind] = useState<RecipeKind | ''>('')
   const [crafting, setCrafting] = useState<Recipe | null>(null)
   const search = useDeferredValue(query.trim().toLowerCase())

   if (reference.isError) return <section className='overview-section'><p className='field-error'>{getErrorMessage(reference.error)}</p>
      <button className='quiet-button' type='button' onClick={() => void reference.refetch()}>{t('Try again', language)}</button></section>
   if (!reference.data) return <section className='overview-section'><p>{t('Loading...', language)}</p></section>
   const { recipes, shelfLife: tables } = reference.data
   const shown = recipes.filter((recipe) => (!kind || recipe.kind === kind) && (!search || recipe.key.toLowerCase().includes(search)
      || recipe.aliases.some((alias) => alias.toLowerCase().includes(search)) || (recipe.ingredients ?? '').toLowerCase().includes(search)))

   return <section className='overview-section recipe-book' data-nav-label={t('Recipes', language)}>
      <header className='section-heading'><BookOpen size={19} aria-hidden='true' /><div><p className='eyebrow'>Archiv der Kräuter · AdK S. 144–178</p><h2>{t('Recipes', language)}</h2></div></header>
      <p className='combat-note'>{t('Plant recipes are made with a Pflanzenkunde check: one application of the main plant gives one product, a failure loses the plants (S. 144). Alchemical recipes are Berufsgeheimnisse and are brewed in the laboratory table (S. 158).', language)}</p>
      <div className='toolbar-row'>
         <label className='search-field search-field--wide'><Search size={17} aria-hidden='true' />
            <input type='search' value={query} placeholder={t('Recipe, plant or ingredient', language)} aria-label={t('Search recipes', language)} onChange={(event) => setQuery(event.target.value)} /></label>
         <select value={kind} aria-label={t('Recipe kind', language)} onChange={(event) => setKind(event.target.value as RecipeKind | '')}>
            <option value=''>{t('All recipe kinds', language)}</option>
            {(Object.keys(recipeKindLabels) as RecipeKind[]).map((entry) => <option key={entry} value={entry}>{t(recipeKindLabels[entry], language)}</option>)}
         </select>
      </div>
      <p className='party-muted' role='status'>{t('{count} of {total} recipes', language).replace('{count}', String(shown.length)).replace('{total}', String(recipes.length))}</p>
      {shown.length ? <ul className='herb-grid'>{shown.map((recipe) => <li key={recipe.key}>
         <RecipeCard recipe={recipe} available={isPlantRecipe(recipe) ? craftableAmount(recipe, stats.equipment, shelfLife, tables, today) : null}
            onCraft={() => setCrafting(recipe)} /></li>)}</ul>
         : <p className='combat-empty'>{t('No recipe matches these filters.', language)}</p>}
      {crafting && <CraftHerbalDialog stats={stats} recipe={crafting} available={craftableAmount(crafting, stats.equipment, shelfLife, tables, today)}
         onClose={() => setCrafting(null)} />}
   </section>
}

function RecipeCard({ recipe, available, onCraft }: { recipe: Recipe; available: number | null; onCraft: () => void }) {
   const language = useLanguageStore((state) => state.language)
   const plant = isPlantRecipe(recipe)
   const poison = recipe.poison
   return <article className='herb-card'>
      <header>
         <h3 lang='de'>{recipe.key}</h3>
         <small>AdK {t('S.', language)} {recipe.page}</small>
      </header>
      <ul className='herb-types'><li>{t(recipeKindLabels[recipe.kind], language)}</li>{recipe.legality && <li lang='de'>{recipe.legality}</li>}</ul>
      {recipe.aliases.length > 0 && <p className='herb-note'><strong>{t('Also called', language)}:</strong> <span lang='de'>{recipe.aliases.join(', ')}</span></p>}
      <dl className='herb-values'>
         {plant && recipe.craftTalents.map((option) => <div key={option.talent}>
            <dt>{t(talentCatalog.find((entry) => entry.key === option.talent)?.label ?? option.talent, language)}{option.application ? ` (${option.application})` : ''}</dt>
            <dd>{signed(option.modifier)}</dd></div>)}
         {!plant && recipe.laboratory && <div><dt>{t('Laboratory', language)}</dt><dd lang='de'>{recipe.laboratory}</dd></div>}
         {!plant && typeof recipe.difficulty === 'number' && <div><dt>{t('Brauschwierigkeit', language)}</dt><dd>{signed(recipe.difficulty)}</dd></div>}
         {!plant && recipe.costPerLevel && <div><dt>{t('Ingredients', language)}</dt><dd>{recipe.costPerLevel} S / {t('level', language)}</dd></div>}
         {!plant && recipe.secretAp && <div><dt>{t('Berufsgeheimnis', language)}</dt><dd>{recipe.secretAp} AP{recipe.secretPrerequisite ? ` · ${recipe.secretPrerequisite}` : ''}</dd></div>}
         {poison?.level !== undefined && poison.level !== null && <div><dt>{t('Level', language)}</dt><dd>{poison.level}</dd></div>}
         {recipe.price !== null && <div><dt>{t('Price', language)}</dt><dd>{silver(recipe.price)}{recipe.pricePerLevel ? ` / ${t('level', language)}` : ''}</dd></div>}
      </dl>
      {poison && <p className='herb-note' lang='de'>{[poison.type, poison.resistance && `${t('Resistance', language)}: ${poison.resistance}`,
         poison.onset && `${t('Onset', language)}: ${poison.onset}`, poison.duration && `${t('Duration', language)}: ${poison.duration}`].filter(Boolean).join(' · ')}</p>}
      {recipe.ingredients && <p className='herb-landscape'><strong>{t(plant ? 'Ingredients' : 'Typical ingredients', language)}:</strong> <span lang='de'>{recipe.ingredients}</span></p>}
      {plant && recipe.tools && <p className='herb-note'><strong>{t('Typical tools', language)}:</strong> <span lang='de'>{recipe.tools}</span></p>}
      {recipe.brewPrerequisites && recipe.brewPrerequisites !== 'keine' && <p className='herb-note'><strong>{t('Brewing conditions', language)}:</strong> <span lang='de'>{recipe.brewPrerequisites}</span></p>}
      <p className='herb-recipes'>{recipe.summary ? recipe.summary.effect[language] : t('Effect: see the recipe page (summary to come).', language)}</p>
      {recipe.summary?.qualities && <details className='herb-more'>
         <summary>{t('Quality levels', language)}</summary>
         <ol className='herb-knowledge'>{recipe.summary.qualities.map((entry, index) => <li key={index}><strong>QS {index + 1}</strong> {entry[language]}</li>)}</ol>
      </details>}
      {plant && <>
         <button className='quiet-button herb-search-button' type='button' disabled={!available} onClick={onCraft}
            aria-label={`${t('Make', language)}: ${recipe.key}`}><Hammer size={15} aria-hidden='true' />{t('Make', language)}</button>
         {!available && <p className='herb-note'>{t('Needs', language)} <span lang='de'>{recipe.mainPlants.map((group) => group.join(` ${t('or', language)} `)).join(', ')}</span> {t('in the inventory (not spoiled).', language)}</p>}
      </>}
   </article>
}
