import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { DieIcon } from '@/components/DieIcon'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { nextStepCost, useAdvancementMode } from './advancement'
import { APToggle, AdvancementValue } from './AdvancementControls'
import { Source } from './ArcanaPanels'
import type { Hero } from './heroApi'
import {
   getKarmaReference, heroChurch, karmaReferenceKey, liturgyAvailable, liturgyMaximum, updateKarma, useKarmaSpend,
   type KarmaAction, type KarmaReference, type Liturgy,
} from './karmaApi'
import { LiturgyProbeDialog } from './LiturgyProbeDialog'
import { getStatsForHero, type Stats } from './statsApi'
import { getAttributeAbbreviation } from './talentCatalog'

function LiturgyCard({ stats, liturgy, entry, maximum, busy, onAdvance, onRemove }: {
   stats: Stats; liturgy: Liturgy; entry: Stats['liturgies'][number]; maximum: number; busy: boolean
   onAdvance: (value: number) => void; onRemove: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const { spendAP } = useAdvancementMode(stats.charId)
   const [rolling, setRolling] = useState(false)
   const facts: Array<[string, string]> = [
      ['Costs', liturgy.cost], ['Casting time', liturgy.castingTime], ['Range', liturgy.range], ['Duration', liturgy.duration], ['Target category', liturgy.target],
   ]
   return <li className='spell-card'>
      <header className='spell-card-head'>
         <button type='button' className='talent-probe-button' aria-label={`${t('Roll check', language)}: ${liturgy.key}`}
            title={t('Roll check', language)} onClick={() => setRolling(true)}><DieIcon sides={20} /></button>
         <div className='spell-card-title'>
            <h4 lang='de'>{liturgy.key}</h4>
            <small>{t(liturgy.kind === 'Zeremonie' ? 'Ceremony' : 'Liturgy', language)} · {t('StF', language)} {liturgy.stfClass.toUpperCase()}</small>
            <small className='spell-card-origin' lang='de'>{t('Verbreitung', language)}: {liturgy.distribution
               .map((item) => item.aspects.length ? `${item.church} (${item.aspects.join(', ')})` : item.church).join(', ')}</small>
         </div>
         <div className='spell-card-actions'>
            <button className='icon-button danger-icon' type='button' disabled={busy} onClick={onRemove}
               aria-label={`${t('Remove', language)}: ${liturgy.key}`} title={t('Remove', language)}><Trash2 size={16} /></button>
         </div>
      </header>
      <div className='spell-card-values'>
         <div>
            <span className='spell-card-label'>{t('Probe', language)}</span>
            <span className='spell-card-probe'>{liturgy.probe.map((attribute) => getAttributeAbbreviation(attribute, language)).join('/')}
               {liturgy.resistance && <small> − {liturgy.resistance}</small>}</span>
         </div>
         <div className='spell-card-fw'>
            <span className='spell-card-label'>{t('FW', language)}</span>
            <div className='talent-value-inner'><strong>{entry.value}</strong>
               <AdvancementValue label={liturgy.key} value={entry.value} maximum={spendAP ? maximum : 25} cost={nextStepCost(entry.value, liturgy.stfClass)}
                  availableAP={stats.experience.total - stats.experience.spent} spendAP={spendAP} pending={busy} onChange={onAdvance} /></div>
         </div>
      </div>
      {entry.value >= 14 && maximum <= 14 && <p className='spell-card-limit'>{t('FW limit 14: needs Aspektkenntnis of one of its aspects (S. 321).', language)}</p>}
      <dl className='spell-card-facts'>
         {facts.map(([label, value]) => <div key={label}><dt>{t(label, language)}</dt><dd lang='de'>{value}</dd></div>)}
      </dl>
      <p className='spell-card-note'>{liturgy.effect[language]} <small>({t('S.', language)} {liturgy.page})</small></p>
      {rolling && <LiturgyProbeDialog stats={stats} liturgy={liturgy} value={entry.value} onClose={() => setRolling(false)} />}
   </li>
}

function KarmaSheet({ stats, reference }: { stats: Stats; reference: KarmaReference }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const { spendAP } = useAdvancementMode(stats.charId)
   const [learn, setLearn] = useState('')
   const [blessing, setBlessing] = useState('')
   const [amount, setAmount] = useState('1')
   const [direction, setDirection] = useState<'spend' | 'recover'>('spend')
   const mutation = useMutation({
      mutationFn: (action: KarmaAction) => updateKarma(stats._id, action),
      onSuccess: (next) => queryClient.setQueryData(['stats', stats.charId], next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const karma = useKarmaSpend(stats)
   const busy = mutation.isPending || karma.isPending
   const priest = stats.advantages.includes('Geweihter')
   const church = heroChurch(stats, reference)
   const current = stats.karmaEnergy.current ?? stats.karmaEnergy.max
   const percent = stats.karmaEnergy.max > 0 ? Math.min(100, Math.max(0, current / stats.karmaEnergy.max * 100)) : 0
   const owned = stats.liturgies.map((entry) => ({ entry, liturgy: reference.liturgies.find((item) => item.key === entry.key) }))
   const learnable = reference.liturgies.filter((item) => liturgyAvailable(item, church) && !stats.liturgies.some((entry) => entry.key === item.key))
   const missingBlessings = reference.blessings.filter((item) => !stats.blessings.some((entry) => entry.key === item.key))
   // source: DSA5 Regelwerk, S. 322 (a blessing: 1 KaP, 1 action, no check, QS 1; Starke Segnungen: QS 2)
   const blessingQuality = stats.generalSpecialAbilities.includes('Starke Segnungen') ? 2 : 1

   function adjust(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const value = Number(amount)
      if (!Number.isInteger(value) || value <= 0) { toast.error(t('Enter a positive whole number of KaP.', language)); return }
      karma.mutate({ amount: value, direction })
   }

   return <div className='hero-arcana'>
      <section className='overview-section'>
         <header className='section-header'><div><h2>{t('Divine works', language)} <Source page={305} /></h2></div><APToggle heroId={stats.charId} disabled={busy} /></header>
         {!priest && <p className='arcana-warning'>{t('No Geweihter advantage recorded. Liturgies can be documented with AP disabled, but this does not grant the ability to use them.', language)}</p>}
         {priest && !church && <p className='arcana-warning'>{t('Record the divine tradition of your church (special abilities) to learn liturgies (S. 316–320).', language)}</p>}
         <div className='arcana-summary'>
            <div className='arcana-mana'>
               <div className='resource-label'><span>{t('Karma energy', language)}{church && <small lang='de'> · {church}</small>}</span><strong>{current} / {stats.karmaEnergy.max} KaP</strong></div>
               <div className='resource-track' role='meter' aria-label={t('Karma energy', language)} aria-valuemin={0} aria-valuemax={stats.karmaEnergy.max} aria-valuenow={current}>
                  <span style={{ width: `${percent}%` }} />
               </div>
               <form className='arcana-mana-form' onSubmit={adjust}>
                  <select value={direction} aria-label={t('Direction', language)} onChange={(event) => setDirection(event.target.value as 'spend' | 'recover')}>
                     <option value='spend'>{t('Spend', language)}</option><option value='recover'>{t('Recover', language)}</option>
                  </select>
                  <input type='number' min={1} value={amount} aria-label={t('KaP amount', language)} onChange={(event) => setAmount(event.target.value)} />
                  <button className='quiet-button' type='submit' disabled={busy}>{t('Apply', language)}</button>
               </form>
            </div>
         </div>
      </section>

      <section className='overview-section'>
         <header className='section-header'><div><h3>{t('Blessings', language)} <Source page={322} /></h3>
            <small>{t('1 KaP, 1 action, no check; they count as QS {quality}.', language).replace('{quality}', String(blessingQuality))}</small></div></header>
         {stats.blessings.length > 0 && <ul className='karma-blessings'>
            {stats.blessings.map((entry) => {
               const info = reference.blessings.find((item) => item.key === entry.key)
               return <li key={entry.key}>
                  <span><strong lang='de'>{entry.key}</strong>{info && <small>{info.effect[language]}</small>}</span>
                  <button className='quiet-button' type='button' disabled={busy || current < 1} aria-label={`${t('Use', language)}: ${entry.key}`}
                     onClick={() => karma.mutate({ amount: 1 })}><Sparkles size={14} />{t('Use · 1 KaP', language)}</button>
                  <button className='icon-button danger-icon' type='button' disabled={busy} aria-label={`${t('Remove', language)}: ${entry.key}`} title={t('Remove', language)}
                     onClick={() => mutation.mutate({ action: 'remove-blessing', key: entry.key, spendAP })}><Trash2 size={15} /></button>
               </li>
            })}
         </ul>}
         {missingBlessings.length > 0 && <div className='creation-inline-add'>
            <select value={blessing} aria-label={t('Blessing', language)} onChange={(event) => setBlessing(event.target.value)}>
               <option value=''>{t('Add a blessing (1 AP)', language)}</option>
               {missingBlessings.map((item) => <option key={item.key} value={item.key}>{item.key} ({item.god})</option>)}
            </select>
            <button className='quiet-button' type='button' disabled={!blessing || busy} onClick={() => { mutation.mutate({ action: 'blessing', key: blessing, spendAP }); setBlessing('') }}>
               <Plus size={15} />{t('Add', language)}</button>
            {missingBlessings.length === reference.blessings.length && <button className='quiet-button' type='button' disabled={busy}
               onClick={() => mutation.mutate({ action: 'blessing', key: reference.twelveBlessings.key, spendAP })}>
               <Plus size={15} />{t('Die Zwölf Segnungen ({ap} AP)', language).replace('{ap}', String(reference.twelveBlessings.ap))}</button>}
         </div>}
      </section>

      <section className='overview-section'>
         <header className='section-header'><div><h3>{t('Liturgies and ceremonies', language)} <Source page={324} /></h3></div></header>
         {owned.length > 0 ? <ul className='spell-card-grid'>
            {owned.map(({ entry, liturgy }) => liturgy && <LiturgyCard key={entry.key} stats={stats} liturgy={liturgy} entry={entry} busy={busy}
               maximum={liturgyMaximum(stats, liturgy, church)}
               onAdvance={(value) => mutation.mutate({ action: 'liturgy', key: entry.key, value, spendAP })}
               onRemove={() => mutation.mutate({ action: 'remove-liturgy', key: entry.key, spendAP })} />)}
         </ul> : <p className='fight-note'>{t('No liturgies recorded yet.', language)}</p>}
         <div className='creation-inline-add'>
            <select value={learn} aria-label={t('Learn a liturgy', language)} onChange={(event) => setLearn(event.target.value)}>
               <option value=''>{t(church ? 'Learn a liturgy of your church' : 'Learn a liturgy', language)}</option>
               {(church ? learnable : reference.liturgies.filter((item) => !stats.liturgies.some((entry) => entry.key === item.key))).map((item) =>
                  <option key={item.key} value={item.key}>{item.key} · {t(item.kind === 'Zeremonie' ? 'Ceremony' : 'Liturgy', language)} · {item.stfClass.toUpperCase()}</option>)}
            </select>
            <button className='quiet-button' type='button' disabled={!learn || busy} onClick={() => { mutation.mutate({ action: 'liturgy', key: learn, value: 0, spendAP }); setLearn('') }}>
               <Plus size={15} />{t('Activate', language)}</button>
         </div>
      </section>
   </div>
}

export function HeroKarma({ hero }: { hero: Hero }) {
   const language = useLanguageStore((state) => state.language)
   const statsQuery = useQuery({ queryKey: ['stats', hero._id], queryFn: () => getStatsForHero(hero._id) })
   const referenceQuery = useQuery({ queryKey: karmaReferenceKey, queryFn: getKarmaReference, staleTime: Infinity })
   if (statsQuery.isError || referenceQuery.isError) return <div className='state-panel' role='alert'>
      <p>{getErrorMessage(statsQuery.error ?? referenceQuery.error)}</p>
      <button className='quiet-button' type='button' onClick={() => { void statsQuery.refetch(); void referenceQuery.refetch() }}>{t('Retry', language)}</button>
   </div>
   if (!statsQuery.data || !referenceQuery.data) return <p>{t('Loading…', language)}</p>
   return <KarmaSheet stats={statsQuery.data} reference={referenceQuery.data} />
}
