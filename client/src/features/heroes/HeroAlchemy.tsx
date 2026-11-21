import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Dices, FlaskConical, FlaskRound, Plus, Search, X } from 'lucide-react'
import { useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { axiosInstance } from '@/axios/axios'
import { throwColoredDice } from '@/components/diceEngine'
import { useModalKeyboard } from '@/components/useModalKeyboard'
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
import { getStatsForHero, type EquipmentEntry, type Stats } from './statsApi'
import { talentCatalog } from './talentCatalog'
import { TalentProbeDialog } from './TalentProbeDialog'

const elixirs = aventurianStore.Alchimica ?? []
type Elixir = (typeof elixirs)[number]
const alchimie = talentCatalog.find((talent) => talent.key === 'alchimie')!
const recipeKey = (name: string) => `Berufsgeheimnis (${name})`

type BrewInput = { elixir: string; level: number; asp: 0 | 4 | 8; success: boolean; quality: number; placement: string }
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
   const stats = statsQuery.data
   if (statsQuery.isError) return <p className='field-error'>{getErrorMessage(statsQuery.error)}</p>
   if (!stats) return <p>{t('Loading...', language)}</p>
   const owned = stats.equipment.filter((item) => item.amount > 0)
   const supplies = owned.filter((item) => isConsumableItem(item.item))
   const lab = bestLaboratory(owned.map((item) => item.item))
   const talentValue = stats.talents.find((entry) => entry.key === 'alchimie')?.value ?? null
   const known = (name: string) => stats.generalSpecialAbilities.includes(recipeKey(name))

   return <div className='hero-alchemy'>
      <section className='overview-section'>
         <header className='section-heading'><FlaskRound size={19} /><div><p className='eyebrow'>{t('Alchemy', language)}</p><h2>{t('Elixirs, herbs and poisons', language)}</h2></div></header>
         {supplies.length ? <ul className='alchemy-supplies'>{supplies.map((entry) => <li key={`${entry.item}-${entry.carriedOn}-${entry.quality ?? ''}`}>
            <FlaskRound size={16} aria-hidden='true' />
            <span><strong>{equipmentDisplayName(entry.item, language)}</strong><small>{entry.amount} × · {t(entry.carriedOn, language)}</small></span>
            <button className='quiet-button' type='button' onClick={() => setConsume(entry)}>{t('Use', language)}</button>
         </li>)}</ul> : <p className='combat-empty'>{t('No elixirs, herbs or poisons in the inventory.', language)}</p>}
      </section>

      <section className='overview-section'>
         <header className='section-heading'><FlaskConical size={19} /><div><p className='eyebrow'>{t('S.', language)} 270–274</p><h2>{t('Laboratory and recipes', language)}</h2></div></header>
         <p className='combat-note'>{lab ? `${t('Best laboratory', language)}: ${lab}` : t('No laboratory in the inventory (Archaisches Labor, Hexenküche or Alchemistenlabor).', language)}
            {' · '}{talentValue === null ? t('Talent Alchimie not activated.', language) : `${t('Alchimie', language)} FW ${talentValue}`}</p>
         <p className='combat-note'>{t('Brewing needs the recipe (a Berufsgeheimnis), ingredients and a laboratory. One elixir per day; the ingredient level caps the QS. The GM may roll secretly (S. 271).', language)}</p>
         <div className='table-scroll'><table className='talent-table alchemy-table'>
            <thead><tr><th>{t('Elixir', language)}</th><th>{t('Laboratory', language)}</th><th>{t('Brauschwierigkeit', language)}</th>
               <th>{t('Ingredients', language)}</th><th>{t('Recipe', language)}</th><th /></tr></thead>
            <tbody>{elixirs.map((elixir) => {
               const needed = normalizeLaboratory(elixir.alchemy!.laboratory)
               const labModifier = laboratoryModifier(lab, needed)
               return <tr key={elixir.name}>
                  <td lang='de' className='alchemy-name'>{elixir.name}</td>
                  <td data-label={t('Laboratory', language)}>{needed}{lab && <small> ({labModifier === null ? t('impossible', language) : labModifier > 0 ? `+${labModifier}` : labModifier})</small>}</td>
                  <td data-label={t('Brauschwierigkeit', language)}>{elixir.alchemy!.brewingDifficulty}</td>
                  <td data-label={t('Ingredients', language)}>{elixir.alchemy!.ingredientCostPerLevel} S / {t('level', language)}</td>
                  <td data-label={t('Recipe', language)}>{known(elixir.name) ? <Check size={16} aria-label={t('Known', language)} /> : <button className='quiet-button' type='button'
                     onClick={() => setLearning(recipeKey(elixir.name))}><Plus size={14} />{t('Learn', language)}</button>}</td>
                  <td className='alchemy-actions'>
                     <button className='quiet-button' type='button' disabled={!known(elixir.name) || labModifier === null || talentValue === null}
                        onClick={() => setBrewing(elixir)}><FlaskConical size={15} />{t('Brew', language)}</button>
                     <button className='quiet-button' type='button' disabled={talentValue === null} onClick={() => setAnalysing(elixir)}>
                        <Search size={15} />{t('Analyse', language)}</button>
                  </td>
               </tr>
            })}</tbody>
         </table></div>
      </section>

      {consume && <ConsumeDialog stats={stats} entry={consume} index={stats.equipment.indexOf(consume)} onClose={() => setConsume(null)} />}
      {brewing && lab && <BrewDialog stats={stats} elixir={brewing} lab={lab} onClose={() => setBrewing(null)} />}
      {analysing && <TalentProbeDialog stats={stats} talent={alchimie} value={talentValue ?? 0} onClose={() => setAnalysing(null)}
         extraSources={analysisModifiers(analysing.alchemy!.brewingDifficulty, lab, known(analysing.name))}
         renderResult={({ result, quality }) => result.success ? <p className='probe-asp-spent'><Check size={16} />
            {t(quality && quality >= 2 ? 'Identified: {name}, and its quality is known (S. 272).' : 'Identified: {name}; the quality stays unknown (needs QS 2).', language)
               .replace('{name}', analysing.name)}</p> : <p className='field-error'>{t('The analysis gives no result. The elixir is not used up.', language)}</p>} />}
      {learning && <AddCharacterEntryDialog stats={stats} category='generalSpecialAbilities' catalogKey={learning} detail='' onClose={() => setLearning(null)} />}
   </div>
}

// source: DSA5 Regelwerk, S. 271 (ingredient level, lab, AsP with Alraune, Brauschwierigkeit; failure table)
function BrewDialog({ stats, elixir, lab, onClose }: { stats: Stats; elixir: Elixir; lab: Laboratory; onClose: () => void }) {
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
   const cost = level * recipe.ingredientCostPerLevel
   const hasAlraune = stats.equipment.some((item) => item.item === 'Alraune' && item.amount > 0)
   const brew = useMutation({
      mutationFn: (input: { success: boolean; quality: number }) => brewElixir(stats._id, { elixir: elixir.name, level, asp, placement, ...input }),
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
               <small>{cost} S {t('from the purse', language)} · {recipe.levels[level - 1]?.[language]}</small></div>
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
                           .replace('{qs}', String(Math.min(quality ?? 1, level))).replace('{cost}', String(cost))}</button>
                     : <>
                        <button className='quiet-button' type='button' disabled={brew.isPending} onClick={() => { brew.mutate({ success: false, quality: 0 }); void rollFailure(botch) }}>
                           <Dices size={16} />{t('Ingredients lost: roll the failure table', language)}{botch && ' (+5)'}</button>
                     </>}
               </section>
            }} />}
      </section>
   </div>, document.body)
}
