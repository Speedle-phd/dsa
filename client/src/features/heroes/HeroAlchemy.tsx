import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Dices, FlaskConical, FlaskRound, Leaf, Plus, Search, Timer, Trash2, X } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { axiosInstance } from '@/axios/axios'
import { throwColoredDice } from '@/components/diceEngine'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { useBookContext } from '@/features/books/bookApi'
import { Herbarium } from '@/features/herbs/Herbarium'
import { RecipeBook } from '@/features/herbs/RecipeBook'
import { adkElixirItems } from '@/features/herbs/recipeRules'
import { useHerbReference } from '@/features/herbs/herbApi'
import { PreserveHerbDialog } from '@/features/herbs/PreserveHerbDialog'
import { herbShelf } from '@/features/herbs/shelfLifeRules'
import { useLanguageStore } from '@/locales/languageStore'
import { t, translateRuleLabel } from '@/locales/translation'
import { aventurianStore } from '@/utils/aventurian_store'
import { equipmentDisplayName } from '@/utils/storePricing'
import { getErrorMessage } from '@/utils/errorHandling'
import { isConsumableItem } from './activeEffectsApi'
import { analysisModifiers, bestLaboratory, brewFailureFor, laboratoryModifier, normalizeLaboratory, type Laboratory } from './alchemyRules'
import { AddCharacterEntryDialog } from './CharacterEntryList'
import { ConsumeDialog } from './ConsumeDialog'
import type { Hero } from './heroApi'
import { PlacementSelect } from './PlacementSelect'
import { ProbeStepper } from './ProbeDialog'
import { getStatsForHero, updateEquipmentForHero, type EquipmentEntry, type Stats } from './statsApi'
import { talentCatalog } from './talentCatalog'
import { TalentProbeDialog } from './TalentProbeDialog'

const elixirs = aventurianStore.Alchimica ?? []
type Elixir = (typeof elixirs)[number]
const alchimie = talentCatalog.find((talent) => talent.key === 'alchimie')!
const recipeKey = (name: string) => `Berufsgeheimnis (${name})`

type BrewInput = { elixir: string; level: number; asp: 0 | 4 | 8; success: boolean; quality: number; placement: string; substitution: number }
async function brewElixir(statsId: string, input: BrewInput) {
   return (await axiosInstance.put<{ stats: Stats; brewed: number | null }>(`/api/stats/brew-elixir/${statsId}`, input)).data
}

// Alchemy tab (S. 270–274, 342–346): supplies, laboratory, recipes, brewing and analysis.
export function HeroAlchemy({ hero }: { hero: Hero }) {
   const language = useLanguageStore((state) => state.language)
   const statsQuery = useQuery({ queryKey: ['stats', hero._id], queryFn: () => getStatsForHero(hero._id) })
   const [consume, setConsume] = useState<EquipmentEntry | null>(null)
   const [brewing, setBrewing] = useState<Elixir | null>(null)
   const [analysing, setAnalysing] = useState<Elixir | null>(null)
   const [learning, setLearning] = useState<string | null>(null)
   const [preserving, setPreserving] = useState<EquipmentEntry | null>(null)
   const stats = statsQuery.data
   // Archiv der Kräuter switched on for this hero (its party's rules or its own), the in-game date and the shelf-life tables
   const bookContext = useBookContext(stats?._id).data
   const bookRules = bookContext?.rules
   const adk = bookRules?.adk ?? false
   const today = bookContext?.calendarDay ?? null
   const herbReference = useHerbReference(adk).data
   const shelfTables = herbReference?.shelfLife
   // Archiv der Kräuter adds its alchemical recipes to the laboratory table (AdK S. 158–178)
   const brewable = useMemo(() => [...elixirs, ...(adk && herbReference ? adkElixirItems(herbReference.recipes) : [])], [adk, herbReference])
   const queryClient = useQueryClient()
   // A spoiled plant can only be thrown away (user decision, Nov 2026)
   const discard = useMutation({
      mutationFn: (entry: EquipmentEntry) => updateEquipmentForHero(stats?._id ?? '', {
         equipment: (stats?.equipment ?? []).filter((item) => item !== entry), purse: stats?.purse ?? { dukaten: 0, silbertaler: 0, heller: 0, kreuzer: 0 } }),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['stats', hero._id] }),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   if (statsQuery.isError) return <p className='field-error'>{getErrorMessage(statsQuery.error)}</p>
   if (!stats) return <p>{t('Loading...', language)}</p>
   const owned = stats.equipment.filter((item) => item.amount > 0)
   const supplies = owned.filter((item) => isConsumableItem(item.item, item.herb, item.category))
   const lab = bestLaboratory(owned.map((item) => item.item))
   const talentValue = stats.talents.find((entry) => entry.key === 'alchimie')?.value ?? 0
   const known = (name: string) => stats.generalSpecialAbilities.includes(recipeKey(name))

   return <div className='hero-alchemy'>
      <section className='overview-section'>
         <header className='section-heading'><FlaskRound size={19} /><div><p className='eyebrow'>{t('Alchemy', language)}</p><h2>{t('Elixirs, herbs and poisons', language)}</h2></div></header>
         {supplies.length ? <ul className='alchemy-supplies'>{supplies.map((entry) => {
            // Plants (Archiv der Kräuter): form, day and shelf life by the calendar (AdK S. 284–286)
            const shelf = entry.herb && shelfTables ? herbShelf(entry, bookRules?.shelfLife ?? false, shelfTables, today, language) : null
            const canPreserve = Boolean(entry.herb?.form === 'raw' && bookRules?.shelfLife && today !== null && shelf && !shelf.spoiled)
            return <li key={`${entry.item}-${entry.carriedOn}-${entry.quality ?? ''}-${entry.herb?.form ?? ''}-${entry.herb?.obtainedDay ?? ''}-${entry.herb?.keepsUntilDay ?? ''}`}
               className={shelf?.spoiled ? 'is-spoiled' : undefined}>
               {entry.herb ? <Leaf size={16} aria-hidden='true' /> : <FlaskRound size={16} aria-hidden='true' />}
               <span><strong>{equipmentDisplayName(entry.item, language)}</strong><small>{entry.amount} × · {t(entry.carriedOn, language)}{shelf && ` · ${shelf.text}`}</small></span>
               {shelf?.spoiled
                  ? <button className='quiet-button' type='button' disabled={discard.isPending} onClick={() => discard.mutate(entry)}
                     aria-label={`${t('Throw away', language)}: ${entry.item}`}><Trash2 size={15} aria-hidden='true' />{t('Throw away', language)}</button>
                  : <>
                     {canPreserve && <button className='quiet-button' type='button' onClick={() => setPreserving(entry)}
                        aria-label={`${t('Preserve', language)}: ${entry.item}`}><Timer size={15} aria-hidden='true' />{t('Preserve', language)}</button>}
                     <button className='quiet-button' type='button' onClick={() => setConsume(entry)}>{t('Use', language)}</button>
                  </>}
            </li>
         })}</ul> : <p className='combat-empty'>{t('No elixirs, herbs or poisons in the inventory.', language)}</p>}
         {adk && supplies.some((entry) => entry.herb) && today === null && <p className='combat-note'>{t('No in-game date is set: plants cannot spoil or be preserved until one is (settings or party page).', language)}</p>}
      </section>

      <section className='overview-section'>
         <header className='section-heading'><FlaskConical size={19} /><div><p className='eyebrow'>{t('S.', language)} 270–274</p><h2>{t('Laboratory and recipes', language)}</h2></div></header>
         <p className='combat-note'>{lab ? `${t('Best laboratory', language)}: ${lab}` : t('No laboratory in the inventory (Archaisches Labor, Hexenküche or Alchemistenlabor).', language)}
            {' · '}{`${t('Alchimie', language)} FW ${talentValue}`}</p>
         <p className='combat-note'>{t('Brewing needs the recipe (a Berufsgeheimnis), ingredients and a laboratory. One elixir per day; the ingredient level caps the QS. The GM may roll secretly (S. 271).', language)}</p>
         <div className='table-scroll'><table className='talent-table alchemy-table'>
            <thead><tr><th>{t('Elixir', language)}</th><th>{t('Laboratory', language)}</th><th>{t('Brauschwierigkeit', language)}</th>
               <th>{t('Ingredients', language)}</th><th>{t('Recipe', language)}</th><th /></tr></thead>
            <tbody>{brewable.map((elixir) => {
               const needed = normalizeLaboratory(elixir.alchemy!.laboratory)
               const labModifier = laboratoryModifier(lab, needed)
               return <tr key={elixir.name}>
                  <td lang='de' className='alchemy-name'>{elixir.name}{elixir.sourceBook === 'AdK' && <small> AdK {t('S.', language)} {elixir.sourcePage}</small>}</td>
                  <td data-label={t('Laboratory', language)}>{needed}{lab && <small> ({labModifier === null ? t('impossible', language) : labModifier > 0 ? `+${labModifier}` : labModifier})</small>}</td>
                  <td data-label={t('Brauschwierigkeit', language)}>{elixir.alchemy!.brewingDifficulty}</td>
                  <td data-label={t('Ingredients', language)}>{elixir.alchemy!.ingredientCostPerLevel} S / {t('level', language)}</td>
                  <td data-label={t('Recipe', language)}>{known(elixir.name) ? <Check size={16} aria-label={t('Known', language)} /> : <button className='quiet-button' type='button'
                     onClick={() => setLearning(recipeKey(elixir.name))}><Plus size={14} />{t('Learn', language)}</button>}</td>
                  <td className='alchemy-actions'>
                     <button className='quiet-button' type='button' disabled={!known(elixir.name) || labModifier === null}
                        onClick={() => setBrewing(elixir)}><FlaskConical size={15} />{t('Brew', language)}</button>
                     <button className='quiet-button' type='button' onClick={() => setAnalysing(elixir)}>
                        <Search size={15} />{t('Analyse', language)}</button>
                  </td>
               </tr>
            })}</tbody>
         </table></div>
      </section>

      {adk && <RecipeBook stats={stats} shelfLife={bookRules?.shelfLife ?? false} today={today} />}
      {adk ? <Herbarium stats={stats} searchEnabled={bookRules?.herbSearch ?? false} /> : <p className='party-muted alchemy-book-hint'>{t('More plants and recipes: switch on Archiv der Kräuter under Settings → Date and book rules (for a party: the GM on the party page).', language)} <Link to='/settings'>{t('Settings', language)}</Link></p>}

      {preserving && shelfTables && today !== null && <PreserveHerbDialog stats={stats} entry={preserving} index={stats.equipment.indexOf(preserving)} today={today}
         partsAllowed={bookRules?.shelfLifeParts ?? false} tables={shelfTables} onClose={() => setPreserving(null)} />}
      {consume && <ConsumeDialog stats={stats} entry={consume} index={stats.equipment.indexOf(consume)} onClose={() => setConsume(null)} />}
      {brewing && lab && <BrewDialog stats={stats} elixir={brewing} lab={lab} onClose={() => setBrewing(null)}
         canSubstitute={adk && stats.generalSpecialAbilities.includes('Alchimistische Äquivalenzlehre')} />}
      {analysing && <TalentProbeDialog stats={stats} talent={alchimie} value={talentValue} onClose={() => setAnalysing(null)}
         extraSources={analysisModifiers(analysing.alchemy!.brewingDifficulty, lab, known(analysing.name))}
         renderResult={({ result, quality }) => result.success ? <p className='probe-asp-spent'><Check size={16} />
            {t(quality && quality >= 2 ? 'Identified: {name}, and its quality is known (S. 272).' : 'Identified: {name}; the quality stays unknown (needs QS 2).', language)
               .replace('{name}', analysing.name)}</p> : <p className='field-error'>{t('The analysis gives no result. The elixir is not used up.', language)}</p>} />}
      {learning && <AddCharacterEntryDialog stats={stats} category='generalSpecialAbilities' catalogKey={learning} detail='' onClose={() => setLearning(null)} />}
   </div>
}

// source: DSA5 Regelwerk, S. 271 (ingredient level, lab, AsP with Alraune, Brauschwierigkeit; failure table)
// canSubstitute: the hero has the Alchimistische Äquivalenzlehre (AdK S. 297) and the book is switched on
function BrewDialog({ stats, elixir, lab, canSubstitute, onClose }: { stats: Stats; elixir: Elixir; lab: Laboratory; canSubstitute: boolean; onClose: () => void }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const titleId = useId()
   const dialogRef = useModalKeyboard(onClose)
   const recipe = elixir.alchemy!
   const [level, setLevel] = useState(3)
   const [asp, setAsp] = useState<0 | 4 | 8>(0)
   const [placement, setPlacement] = useState('Other')
   const [rolling, setRolling] = useState(false)
   const [failure, setFailure] = useState<{ total: number; text: string } | null>(null)
   const labModifier = laboratoryModifier(lab, normalizeLaboratory(recipe.laboratory)) ?? 0
   const [substitution, setSubstitution] = useState(0)
   // AdK S. 297: each point of extra difficulty saves 10 % of the ingredient cost, at most 50 %
   const cost = level * recipe.ingredientCostPerLevel * (10 - substitution) / 10
   const costLabel = new Intl.NumberFormat(language).format(cost)
   const hasAlraune = stats.equipment.some((item) => item.item === 'Alraune' && item.amount > 0)
   const brew = useMutation({
      mutationFn: (input: { success: boolean; quality: number }) => brewElixir(stats._id, { elixir: elixir.name, level, asp, placement, substitution, ...input }),
      onSuccess: ({ stats: next, brewed }) => {
         queryClient.setQueryData(['stats', stats.charId], next)
         toast.success(brewed ? t('{name} (QS {qs}) added to the inventory.', language).replace('{name}', elixir.name).replace('{qs}', String(brewed))
            : t('The ingredients are lost.', language))
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const sources = [
      { label: 'Brauschwierigkeit', value: recipe.brewingDifficulty },
      ...(labModifier ? [{ label: 'Laboratory', value: labModifier }] : []),
      ...(asp ? [{ label: 'AsP charge (Alraune)', value: asp / 4 }] : []),
      ...(substitution ? [{ label: 'Äquivalenzlehre (AdK S. 297)', value: -substitution }] : []),
   ]
   async function rollFailure(botch: boolean) {
      const [roll] = await throwColoredDice(20, ['#b7791f'])
      const total = roll + (botch ? 5 : 0)
      setFailure({ total, text: brewFailureFor(total)[language] })
   }
   return createPortal(<div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
      <section ref={dialogRef} className='hero-editor' lang={language} role='dialog' aria-modal='true' aria-labelledby={titleId}
         onMouseDown={(event) => event.stopPropagation()}>
         <header className='editor-header'><div><p className='eyebrow'>{t('Brew', language)}</p><h2 id={titleId} lang='de'>{elixir.name}</h2></div>
            <button className='icon-button editor-close' type='button' onClick={onClose} aria-label={t('Close', language)}><X size={20} /></button></header>
         <div className='hero-form'>
            <div className='field-group'><span>{t('Ingredient level (caps the QS)', language)}</span>
               <ProbeStepper value={level} min={1} max={6} label={t('Ingredient level (caps the QS)', language)} lowerLabel={t('Less', language)}
                  raiseLabel={t('More', language)} onChange={setLevel} />
               <small>{costLabel} S {t('from the purse', language)} · {recipe.levels[level - 1]?.[language]}</small></div>
            {canSubstitute && <fieldset className='probe-difficulty'><legend>{t('Substitute ingredients (Äquivalenzlehre, AdK S. 297)', language)}</legend>
               <div className='probe-segmented'>{[0, 1, 2, 3, 4, 5].map((value) => <button key={value} type='button' aria-pressed={substitution === value}
                  className={substitution === value ? 'is-active' : ''} onClick={() => setSubstitution(value)}>
                  {value ? `−${value} · −${value * 10} %` : t('None', language)}</button>)}</div>
               <small>{t('Each point of extra difficulty saves 10 % of the ingredient cost.', language)}</small></fieldset>}
            {stats.isSorcerer && <fieldset className='probe-difficulty'><legend>{t('Charge with AsP (uses an Alraune)', language)}</legend>
               <div className='probe-segmented'>{([0, 4, 8] as const).map((value) => <button key={value} type='button' aria-pressed={asp === value}
                  className={asp === value ? 'is-active' : ''} disabled={value > 0 && (!hasAlraune || value > stats.mana.current)} onClick={() => setAsp(value)}>
                  {value ? `${value} AsP (+${value / 4})` : t('None', language)}</button>)}</div>
               {!hasAlraune && <small>{t('No Alraune in the inventory.', language)}</small>}</fieldset>}
            <label className='field-group'><span>{t('Placement of the elixir', language)}</span>
               <PlacementSelect equipment={stats.equipment} item={elixir.name} amount={1} value={placement} onChange={setPlacement} /></label>
            <p className='combat-note'>{translateRuleLabel('Alchimie', language)}: {sources.map((source) => `${t(source.label, language)} ${source.value > 0 ? '+' : ''}${source.value}`).join(' · ')}</p>
            {brew.isSuccess ? <p className='probe-asp-spent'><Check size={16} />{t('Recorded.', language)}</p> : null}
            {failure && <p className='arcana-warning'>1W20 = {failure.total}: <span lang={language}>{failure.text}</span></p>}
            <footer className='editor-actions'>
               <button className='quiet-button' type='button' onClick={onClose}>{t('Close', language)}</button>
               <button className='primary-button' type='button' disabled={brew.isPending || brew.isSuccess} onClick={() => setRolling(true)}>
                  <Dices size={16} />{t('Roll Alchimie', language)}</button>
            </footer>
         </div>
         {rolling && <TalentProbeDialog stats={stats} talent={alchimie} value={stats.talents.find((entry) => entry.key === 'alchimie')?.value ?? 0}
            extraSources={sources} onClose={() => setRolling(false)}
            renderResult={({ result, quality }) => {
               const botch = result.outcome === 'botch' || result.outcome === 'disaster'
               return brew.isSuccess ? <p className='probe-asp-spent'><Check size={16} />{t('Recorded.', language)}</p> : <section className='probe-asp'>
                  {result.success
                     ? <button className='primary-button' type='button' disabled={brew.isPending} onClick={() => brew.mutate({ success: true, quality: quality ?? 1 })}>
                        <FlaskConical size={16} />{t('Add {name} with QS {qs} ({cost} S)', language).replace('{name}', elixir.name)
                           .replace('{qs}', String(Math.min(quality ?? 1, level))).replace('{cost}', costLabel)}</button>
                     : <>
                        <button className='quiet-button' type='button' disabled={brew.isPending} onClick={() => { brew.mutate({ success: false, quality: 0 }); void rollFailure(botch) }}>
                           <Dices size={16} />{t('Ingredients lost: roll the failure table', language)}{botch && ' (+5)'}</button>
                     </>}
               </section>
            }} />}
      </section>
   </div>, document.body)
}
