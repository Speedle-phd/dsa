import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Leaf, Search, X } from 'lucide-react'
import { useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { useBookContext } from '@/features/books/bookApi'
import { ProbeStepper } from '@/features/heroes/ProbeDialog'
import type { Stats } from '@/features/heroes/statsApi'
import { talentCatalog } from '@/features/heroes/talentCatalog'
import { TalentProbeDialog } from '@/features/heroes/TalentProbeDialog'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { searchHerbs, useHerbReference, type Herb, type HerbSearchInput, type HerbSearchResult } from './herbApi'
import { frequencyLabels, landscapeSuggestions, searchPlan, searchYield, type QualityUse, type SearchKind, type SearchWeather } from './herbSearchRules'

const plantKnowledge = talentCatalog.find((talent) => talent.key === 'pflanzenkunde')
const perception = talentCatalog.find((talent) => talent.key === 'sinnesschaerfe')
const weathers: Array<[SearchWeather, string]> = [['clear', 'No bad weather'], ['rain', 'Rain or snow'], ['storm', 'Storm'], ['hurricane', 'Hurricane']]
const signed = (value: number) => (value > 0 ? `+${value}` : value === 0 ? '±0' : `−${Math.abs(value)}`)

type Step = 'setup' | 'plantCheck' | 'senseCheck' | 'pick' | 'done'

// Kräutersuche (AdK S. 275–278), three steps: landscape, Pflanzenkunde (its QS shorten the search and ease Sinnesschärfe,
// or raise the yield), Sinnesschärfe (Suchen). Finds go into the inventory; in a party the GM picks the species of a
// general search (user decision, Nov 2026).
export function HerbSearchDialog({ stats, initialPlant, onClose }: { stats: Stats; initialPlant?: string; onClose: () => void }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const reference = useHerbReference().data
   const context = useBookContext(stats._id).data
   const [step, setStep] = useState<Step>('setup')
   const [kind, setKind] = useState<SearchKind>(initialPlant ? 'specific' : 'general')
   const initialHerb = reference?.herbs.find((herb) => herb.key === initialPlant)
   // A specific search starts where the plant is most common (AdK S. 261); on a tie, in the easiest landscape (AdK S. 277)
   const [landscapeIndex, setLandscapeIndex] = useState(() => {
      const values = initialHerb?.distribution ?? []
      const modifier = (index: number) => reference?.search.landscapeModifiers[reference.search.landscapes[index]] ?? 0
      return values.reduce<number>((best, value, index) => {
         const better = (value ?? 0) > (values[best] ?? 0) || ((value ?? 0) === (values[best] ?? 0) && modifier(index) > modifier(best))
         return value !== null && better ? index : best
      }, 0)
   })
   const [weather, setWeather] = useState<SearchWeather>('clear')
   const [plant, setPlant] = useState(initialPlant ?? '')
   const [use, setUse] = useState<QualityUse>('yield')
   const [hoursTaken, setHoursTaken] = useState<number | null>(null)
   const [picks, setPicks] = useState<string[]>([])
   const [result, setResult] = useState<HerbSearchResult | null>(null)
   const [nothing, setNothing] = useState<string | null>(null)
   const plantResult = useRef<{ success: boolean; quality: number } | null>(null)
   const [plantCheck, setPlantCheck] = useState<{ success: boolean; quality: number } | null>(null)
   const senseResult = useRef<boolean | null>(null)

   const mutation = useMutation({
      mutationFn: (input: HerbSearchInput) => searchHerbs(stats._id, input),
      onSuccess: (next) => {
         queryClient.setQueryData(['stats', stats.charId], next.stats)
         setResult(next)
         setStep('done')
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   if (!reference || !context || !plantKnowledge || !perception) return null
   const search = reference.search
   const landscape = search.landscapes[landscapeIndex]
   const growing = reference.herbs.filter((herb) => herb.search !== null && herb.distribution?.[landscapeIndex] != null)
      .sort((a, b) => a.key.localeCompare(b.key, 'de'))
   const herb = kind === 'specific' ? growing.find((entry) => entry.key === plant) ?? null : null
   const sources = [
      { label: landscape, value: search.landscapeModifiers[landscape] ?? 0 },
      ...(search.weatherModifiers[weather] ? [{ label: t(weathers.find(([key]) => key === weather)?.[1] ?? '', language), value: search.weatherModifiers[weather] }] : []),
      kind === 'general' ? { label: t('General herb search', language), value: search.generalSearchModifier }
         : { label: `${t('Search difficulty', language)}: ${herb?.key ?? '—'}`, value: herb?.search ?? 0 },
   ]
   const quality = plantCheck?.quality ?? 0
   const plan = searchPlan(search.baseHours[kind], quality, use, hoursTaken ?? undefined)
   const found = searchYield(kind, quality, use, herb?.applications)
   const inParty = context.source === 'party'
   const base: Omit<HerbSearchInput, 'sensesSuccess'> = { kind, landscape, weather, ...(herb ? { plant: herb.key } : {}),
      plantCheck: plantCheck ?? { success: false, quality: 0 }, use, ...(plan.taken < plan.hours ? { hoursTaken: plan.taken } : {}) }

   function afterSenses() {
      const success = senseResult.current
      if (success === null) { setStep('senseCheck'); return }
      if (!success) { setNothing(t('The Sinnesschärfe check failed: no herbs today, but tomorrow the hero knows where to look (AdK S. 278).', language)); setStep('done'); return }
      if (kind === 'general' && !inParty) { setStep('pick'); return }
      mutation.mutate({ ...base, sensesSuccess: true })
   }

   // Distinct keys: both checks render at the same place, and React would otherwise keep the first roll
   if (step === 'plantCheck') return <TalentProbeDialog key='plant-check' stats={stats} talent={plantKnowledge} value={talentValue(stats, 'pflanzenkunde')} extraSources={sources}
      renderResult={({ result: roll, quality: q }) => {
         plantResult.current = { success: roll.success, quality: roll.success ? q ?? 0 : 0 }
         if (!roll.success) return <p className='fight-note fight-danger'>{t('No usable herbs today (AdK S. 276).', language)}</p>
         return <QualityChoice kind={kind} quality={q ?? 0} use={use} onUse={setUse} herb={herb} baseHours={search.baseHours[kind]} hoursTaken={hoursTaken} onHours={setHoursTaken} />
      }}
      onClose={() => {
         const done = plantResult.current
         if (!done) { setStep('setup'); return }
         setPlantCheck(done)
         if (!done.success) { setNothing(t('The Pflanzenkunde check failed: no usable herbs today (AdK S. 276).', language)); setStep('done'); return }
         senseResult.current = null
         setStep('senseCheck')
      }} />

   if (step === 'senseCheck') return <TalentProbeDialog key='sense-check' stats={stats} talent={perception} value={talentValue(stats, 'sinnesschaerfe')} fixedApplication='Suchen'
      extraSources={[...(plan.senses ? [{ label: t('Herb search: QS of Pflanzenkunde', language), value: plan.senses }] : []),
         ...(plan.shortened ? [{ label: t('Shortened search', language), value: plan.shortened }] : [])]}
      renderResult={({ result: roll }) => { senseResult.current = roll.success; return null }}
      onClose={afterSenses} />

   return <SearchModal title={t('Herb search', language)} onClose={onClose}>
      {step === 'setup' && <>
         <p className='party-muted'>{t('Choose the landscape and the weather, then what the hero looks for. A specific plant uses its search difficulty; a general search is −1 (AdK S. 277).', language)}</p>
         <div className='probe-segmented' role='group' aria-label={t('Kind of search', language)}>
            {(['specific', 'general'] as const).map((entry) => <button key={entry} type='button' aria-pressed={kind === entry} className={kind === entry ? 'is-active' : ''}
               onClick={() => setKind(entry)}>{t(entry === 'specific' ? 'A specific plant' : 'Anything useful', language)}</button>)}
         </div>
         <div className='herb-search-fields'>
            <label className='field-group'><span>{t('Landscape', language)}</span>
               <select value={landscapeIndex} onChange={(event) => setLandscapeIndex(Number(event.target.value))}>
                  {search.landscapes.map((entry, index) => <option key={entry} value={index}>{entry} ({signed(search.landscapeModifiers[entry] ?? 0)})</option>)}
               </select></label>
            <label className='field-group'><span>{t('Weather', language)}</span>
               <select value={weather} onChange={(event) => setWeather(event.target.value as SearchWeather)}>
                  {weathers.map(([key, label]) => <option key={key} value={key}>{t(label, language)} ({signed(search.weatherModifiers[key])})</option>)}
               </select></label>
            {kind === 'specific' && <label className='field-group'><span>{t('Plant', language)}</span>
               <select value={herb ? herb.key : ''} onChange={(event) => setPlant(event.target.value)}>
                  <option value=''>{t('Choose a plant', language)}</option>
                  {growing.map((entry) => <option key={entry.key} value={entry.key}>{entry.key} ({signed(entry.search ?? 0)})</option>)}
               </select></label>}
         </div>
         {kind === 'specific' && plant && !herb && <p className='field-error'>{t('{plant} does not grow wild in this landscape; choose another landscape or plant.', language).replace('{plant}', plant)}</p>}
         <p className='herb-search-sum'>{t('Pflanzenkunde', language)}: {sources.map((source) => `${source.label} ${signed(source.value)}`).join(' · ')}
            {' = '}<strong>{signed(sources.reduce((sum, source) => sum + source.value, 0))}</strong> · {t('Base time', language)} {search.baseHours[kind]} h</p>
         <footer className='store-purchase-footer'>
            <span />
            <div className='modal-actions'>
               <button type='button' className='quiet-button' onClick={onClose}>{t('Cancel', language)}</button>
               <button type='button' className='primary-button' disabled={kind === 'specific' && !herb}
                  onClick={() => { plantResult.current = null; setStep('plantCheck') }}><Search size={16} aria-hidden='true' />{t('Roll Pflanzenkunde', language)}</button>
            </div>
         </footer>
      </>}

      {step === 'pick' && <>
         <p>{t('The hero found up to {count} kinds of plants with {applications} each. Choose them from what grows in {landscape} (most common first, AdK S. 261–266):', language)
            .replace('{count}', String(found.species)).replace('{applications}', t('the smallest number of applications', language)).replace('{landscape}', landscape)}</p>
         <ul className='herb-pick-list'>{landscapeSuggestions(reference.herbs, landscapeIndex).map(({ herb: entry, frequency }) => {
            const active = picks.includes(entry.key)
            return <li key={entry.key}><button type='button' aria-pressed={active} className={`probe-chip${active ? ' is-active' : ''}`}
               disabled={!active && picks.length >= found.species} title={entry.distributionNote ?? undefined}
               onClick={() => setPicks(active ? picks.filter((name) => name !== entry.key) : [...picks, entry.key])}>
               <strong lang='de'>{entry.key}</strong><small>{frequencyLabels[frequency]}{entry.distributionNote ? ' *' : ''} · {entry.applications?.[0] ?? 1} {t('applications', language)}</small></button></li>
         })}</ul>
         <p className='party-muted herb-pick-legend'>{t('* only under a condition (e.g. in caves); point at the plant for the remark.', language)}</p>
         <footer className='store-purchase-footer'>
            <span className='combat-note'>{picks.length} / {found.species}</span>
            <div className='modal-actions'>
               <button type='button' className='quiet-button' onClick={onClose}>{t('Cancel', language)}</button>
               <button type='button' className='primary-button' disabled={!picks.length || mutation.isPending}
                  onClick={() => mutation.mutate({ ...base, sensesSuccess: true, picks })}><Leaf size={16} aria-hidden='true' />{t('Take the plants', language)}</button>
            </div>
         </footer>
      </>}

      {step === 'done' && <>
         {nothing && <p className='fight-note fight-danger' role='status'>{nothing}</p>}
         {result && result.found.length > 0 && <div role='status'><p><strong>{t('Found after {hours} hours:', language).replace('{hours}', String(result.hours))}</strong></p>
            <ul className='herb-found-list'>{result.found.map((entry) => <li key={entry.name}><Leaf size={15} aria-hidden='true' /> {entry.amount} × <span lang='de'>{entry.name}</span></li>)}</ul>
            <p className='party-muted'>{t('In the inventory as raw plants, picked today.', language)}</p></div>}
         {result?.pending && <p role='status'>{t('The hero found up to {count} kinds of plants. The GM now chooses which ones; they appear in the inventory.', language).replace('{count}', String(result.pending.count))}</p>}
         <footer className='store-purchase-footer'><span /><div className='modal-actions'>
            <button type='button' className='primary-button' onClick={onClose}>{t('Done', language)}</button></div></footer>
      </>}
   </SearchModal>
}

function talentValue(stats: Stats, key: string) {
   return stats.talents.find((entry) => entry.key === key)?.value ?? 0
}

// In the Pflanzenkunde result: use the QS for time and Sinnesschärfe, or for the yield (AdK S. 276–277)
function QualityChoice({ kind, quality, use, onUse, herb, baseHours, hoursTaken, onHours }: {
   kind: SearchKind; quality: number; use: QualityUse; onUse: (use: QualityUse) => void; herb: Herb | null
   baseHours: number; hoursTaken: number | null; onHours: (hours: number | null) => void
}) {
   const language = useLanguageStore((state) => state.language)
   const improve = searchPlan(baseHours, quality, 'improve')
   const yieldPlan = searchPlan(baseHours, quality, 'yield')
   const plan = use === 'improve' ? improve : yieldPlan
   const yieldText = kind === 'specific'
      ? t('{n} applications of {plant}', language).replace('{n}', String(searchYield(kind, quality, 'yield', herb?.applications).applications)).replace('{plant}', herb?.key ?? '')
      : t('up to {n} kinds of plants', language).replace('{n}', String(searchYield(kind, quality, 'yield').species))
   const minimum = kind === 'specific'
      ? t('{n} applications of {plant}', language).replace('{n}', String(searchYield(kind, quality, 'improve', herb?.applications).applications)).replace('{plant}', herb?.key ?? '')
      : t('1 kind of plant', language)
   return <fieldset className='herb-quality-choice'>
      <legend>{t('Use the QS for …', language)}</legend>
      <label className='regen-toggle'><input type='radio' name='herb-qs' checked={use === 'yield'} onChange={() => { onUse('yield'); onHours(null) }} />
         <span><strong>{t('More plants', language)}</strong><small>{yieldText} · {yieldPlan.hours} h · {t('Sinnesschärfe', language)} ±0</small></span></label>
      <label className='regen-toggle'><input type='radio' name='herb-qs' checked={use === 'improve'} onChange={() => { onUse('improve'); onHours(null) }} />
         <span><strong>{t('A quicker, easier search', language)}</strong><small>{improve.hours} h · {t('Sinnesschärfe', language)} {signed(improve.senses)} · {minimum}</small></span></label>
      <div className='fight-modifier'>
         <span>{t('Hours available (fewer: Sinnesschärfe −1 per 2 hours saved)', language)}</span>
         <ProbeStepper value={hoursTaken ?? plan.hours} min={2} max={plan.hours} label={t('Hours available', language)} lowerLabel={t('Less', language)} raiseLabel={t('More', language)}
            onChange={(value) => onHours(value >= plan.hours ? null : value)} />
      </div>
      {plan.shortened < 0 && <small className='fight-note'>{t('Shortened search: Sinnesschärfe {value}', language).replace('{value}', signed(plan.shortened))}</small>}
   </fieldset>
}

function SearchModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
   const language = useLanguageStore((state) => state.language)
   const titleId = useId()
   const dialogRef = useModalKeyboard(onClose)
   return createPortal(
      <div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
         <section ref={dialogRef} className='hero-editor herb-search-dialog' lang={language} role='dialog' aria-modal='true' aria-labelledby={titleId}
            onMouseDown={(event) => event.stopPropagation()}>
            <header className='editor-header'>
               <div><p className='eyebrow'>Archiv der Kräuter · AdK S. 275–278</p><h2 id={titleId}>{title}</h2></div>
               <button className='icon-button editor-close' type='button' onClick={onClose} aria-label={t('Close', language)}><X size={20} /></button>
            </header>
            <div className='store-purchase-body'>{children}</div>
         </section>
      </div>,
      document.body,
   )
}
