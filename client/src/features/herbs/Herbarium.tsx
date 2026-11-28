import { Leaf, Search, Sprout } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import type { Stats } from '@/features/heroes/statsApi'
import { routeLabels, useHerbReference, type Herb } from './herbApi'
import { HerbSearchDialog } from './HerbSearchDialog'

const signed = (value: number) => (value > 0 ? `+${value}` : value === 0 ? '±0' : `−${Math.abs(value)}`)
const silver = (value: number | null) => (value === null ? '—' : `${String(value).replace('.', ',')} S`)

// The plants of Archiv der Kräuter (AdK S. 11–142): values from the book, effects as short summaries with the page.
// Shown in the Alchemy tab when the book is switched on for the hero (party or own rules). With the Kräutersuche switched
// on, the hero can search for herbs here (AdK S. 275–278).
export function Herbarium({ stats, searchEnabled }: { stats: Stats; searchEnabled: boolean }) {
   const language = useLanguageStore((state) => state.language)
   const reference = useHerbReference()
   const [query, setQuery] = useState('')
   const [effectType, setEffectType] = useState('')
   const [landscape, setLandscape] = useState('')
   const search = useDeferredValue(query.trim().toLowerCase())
   // null: closed; '': a general search; a plant name: a specific search for it
   const [searching, setSearching] = useState<string | null>(null)

   if (reference.isError) return <section className='overview-section'><p className='field-error'>{getErrorMessage(reference.error)}</p>
      <button className='quiet-button' type='button' onClick={() => void reference.refetch()}>{t('Try again', language)}</button></section>
   if (!reference.data) return <section className='overview-section'><p>{t('Loading...', language)}</p></section>
   const { herbs, effectTypes, landscapes } = reference.data
   const shown = herbs.filter((herb) => (!search || herb.key.toLowerCase().includes(search))
      && (!effectType || herb.effectTypes.includes(effectType)) && (!landscape || herb.landscapes.includes(landscape)))

   return <section className='overview-section herbarium' data-nav-label={t('Herbarium', language)}>
      <header className='section-heading'><Leaf size={19} aria-hidden='true' /><div><p className='eyebrow'>Archiv der Kräuter · AdK S. 11–142</p><h2>{t('Herbarium', language)}</h2></div>
         {searchEnabled && <button className='quiet-button section-action' type='button' onClick={() => setSearching('')}><Sprout size={16} aria-hidden='true' />{t('Search for herbs', language)}</button>}</header>
      <div className='toolbar-row'>
         <label className='search-field search-field--wide'><Search size={17} aria-hidden='true' />
            <input type='search' value={query} placeholder={t('Plant name', language)} aria-label={t('Search plants', language)} onChange={(event) => setQuery(event.target.value)} /></label>
         <select value={effectType} aria-label={t('Effect type', language)} onChange={(event) => setEffectType(event.target.value)}>
            <option value=''>{t('All effect types', language)}</option>
            {effectTypes.map((type) => <option key={type} value={type}>{t(type, language)}</option>)}
         </select>
         <select value={landscape} aria-label={t('Landscape', language)} onChange={(event) => setLandscape(event.target.value)}>
            <option value=''>{t('All landscapes', language)}</option>
            {landscapes.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
         </select>
      </div>
      <p className='party-muted' role='status'>{t('{count} of {total} plants', language).replace('{count}', String(shown.length)).replace('{total}', String(herbs.length))}</p>
      {shown.length ? <ul className='herb-grid'>{shown.map((herb) => <li key={herb.key}><HerbCard herb={herb}
         onSearch={searchEnabled && herb.search !== null && herb.distribution?.some((value) => value !== null) ? () => setSearching(herb.key) : undefined} /></li>)}</ul>
         : <p className='combat-empty'>{t('No plant matches these filters.', language)}</p>}
      {searching !== null && <HerbSearchDialog stats={stats} initialPlant={searching || undefined} onClose={() => setSearching(null)} />}
   </section>
}

function HerbCard({ herb, onSearch }: { herb: Herb; onSearch?: () => void }) {
   const language = useLanguageStore((state) => state.language)
   const summary = herb.summary
   const routes = (['touch', 'inhale', 'eat'] as const).filter((route) => summary?.[route])
   return <article className='herb-card'>
      <header>
         <h3 lang='de'>{herb.key}</h3>
         <small>AdK {t('S.', language)} {herb.page}</small>
      </header>
      <ul className='herb-types' aria-label={t('Effect type', language)}>{herb.effectTypes.map((type) => <li key={type}>{t(type, language)}</li>)}</ul>
      <dl className='herb-values'>
         <div><dt>{t('Search', language)}</dt><dd>{herb.search === null ? '—' : signed(herb.search)}</dd></div>
         <div><dt>{t('Identification', language)}</dt><dd>{herb.identify === null ? '—' : signed(herb.identify)}</dd></div>
         <div><dt>{t('Applications per QS', language)}</dt><dd>{herb.applications ? herb.applications.join('/') : '—'}</dd></div>
         <div><dt>{t('Price raw / processed', language)}</dt><dd>{silver(herb.price.raw)} / {silver(herb.price.processed)}</dd></div>
      </dl>
      {[herb.searchNote, herb.identifyNote, herb.applicationsNote, herb.price.note].filter(Boolean).map((note) => <p key={note} className='herb-note' lang='de'>{note}</p>)}
      <p className='herb-landscape'><strong>{t('Landscape', language)}:</strong> <span lang='de'>{herb.landscape ?? '—'}</span></p>
      {routes.length > 0 ? <dl className='herb-effects'>
         {routes.map((route) => <div key={route}><dt lang='de'>{routeLabels[route]}</dt><dd>{summary?.[route]?.[language]}</dd></div>)}
      </dl> : <p className='herb-note'>{summary ? t('No raw effect.', language) : t('Effect: see the plant page (summary to come).', language)}</p>}
      {herb.recipes.length > 0 && <p className='herb-recipes'><strong>{t('Recipes', language)}:</strong> {herb.recipes.map((recipe) =>
         `${recipe.name} (${recipe.book === 'RW' ? t('Rulebook', language) : 'AdK'} ${t('S.', language)} ${recipe.page})`).join(', ')}</p>}
      {onSearch && <button className='quiet-button herb-search-button' type='button' onClick={onSearch} aria-label={`${t('Search for this plant', language)}: ${herb.key}`}>
         <Sprout size={15} aria-hidden='true' />{t('Search for this plant', language)}</button>}
      {(summary?.knowledge.length || herb.regions) && <details className='herb-more'>
         <summary>{t('Knowledge and regions', language)}</summary>
         {summary && summary.knowledge.length > 0 && <ol className='herb-knowledge'>{summary.knowledge.map((entry, index) =>
            <li key={index}><strong>QS {index === 2 ? '3+' : index + 1}</strong> {entry[language]}</li>)}</ol>}
         {herb.regions && <p className='herb-note'><strong>{t('Regions', language)}:</strong> <span lang='de'>{herb.regions}</span></p>}
      </details>}
   </article>
}
