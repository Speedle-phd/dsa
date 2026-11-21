import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dices, Minus, Moon, Plus, X } from 'lucide-react'
import { useId, useState, type CSSProperties } from 'react'
import { activeEffectsKey, useActiveEffects } from './activeEffectsApi'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { throwColoredDice } from '@/components/diceEngine'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { useLanguageStore } from '@/locales/languageStore'
import { t, translateRuleLabel } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import {
   regenerate,
   type RegenerationOutcome,
   type RegenerationResource,
   type RegenerationSituation,
   type Stats,
} from './statsApi'

const energies: Array<{ key: RegenerationResource; label: string; short: string; color: string }> = [
   { key: 'health', label: 'Health', short: 'LeP', color: '#c0392b' },
   { key: 'mana', label: 'Mana', short: 'AsP', color: '#2563eb' },
   { key: 'karmaEnergy', label: 'Karma energy', short: 'KaP', color: '#b7791f' },
]

// source: DSA5 Regelwerk, S. 339 (Regeneration table)
const situationOptions = {
   campsite: [
      { value: 'bad', label: 'Bad campsite', modifier: '−1' },
      { value: 'normal', label: 'Normal', modifier: '±0' },
      { value: 'good', label: 'Good lodging', modifier: '+1' },
   ],
   interruption: [
      { value: 'none', label: 'Undisturbed', modifier: '±0' },
      { value: 'short', label: 'Interrupted', modifier: '−1' },
      { value: 'long', label: 'Long interruption', modifier: '−2' },
   ],
   environment: [
      { value: 'normal', label: 'Normal', modifier: '' },
      { value: 'bad', label: 'Wet, cold, restless', modifier: '½' },
      { value: 'terrible', label: 'Storm, tied to a horse', modifier: '0' },
   ],
} as const
const situationLegends = { campsite: 'Campsite', interruption: 'Night\'s rest', environment: 'Environment' } as const

const reducedRuleKey = 'dsa:regeneration:reduced-health'
const initialSituation: RegenerationSituation = {
   campsite: 'normal', interruption: 'none', environment: 'normal', poisonedOrSick: false,
   ironStone: 0, treatmentQuality: 0, otherModifier: 0, reducedHealth: false,
}
const signed = (value: number) => value > 0 ? `+${value}` : `${value}`

function readReducedRule() {
   try {
      return localStorage.getItem(reducedRuleKey) === 'true'
   } catch {
      return false
   }
}

function Stepper({ label, value, min, max, step = 1, onChange }: {
   label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void
}) {
   const language = useLanguageStore((state) => state.language)
   const clamp = (next: number) => Math.max(min, Math.min(max, next))
   return <div className='dice-count-control'>
      <button className='icon-button' type='button' aria-label={`${t('Remove one', language)}: ${label}`}
         disabled={value <= min} onClick={() => onChange(clamp(value - step))}><Minus size={16} /></button>
      <input type='number' inputMode='decimal' min={min} max={max} step={step} value={value} aria-label={label}
         onFocus={(event) => event.target.select()} onChange={(event) => onChange(clamp(event.target.valueAsNumber || 0))} />
      <button className='icon-button' type='button' aria-label={`${t('Add one', language)}: ${label}`}
         disabled={value >= max} onClick={() => onChange(clamp(value + step))}><Plus size={16} /></button>
   </div>
}

export function RegenerationDialog({ stats, onClose, campsite }: {
   stats: Stats; onClose: () => void; campsite?: RegenerationSituation['campsite']
}) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const titleId = useId()
   const dialogRef = useModalKeyboard(onClose)
   const available = energies.filter(({ key }) => key === 'health' || (key === 'mana' ? stats.isSorcerer : stats.isConsecratedPerson))
   const [selected, setSelected] = useState(() => available.filter(({ key }) => stats[key].current < stats[key].max).map(({ key }) => key))
   // source: DSA5 Regelwerk, S. 36 (status Vergiftet/Krank: no normal regeneration; the server enforces it too)
   const sickStatus = stats.statuses.find((status) => status === 'Vergiftet' || status === 'Krank')
   const [situation, setSituation] = useState<RegenerationSituation>(() => ({ ...initialSituation, ...(campsite ? { campsite } : {}), reducedHealth: readReducedRule(), poisonedOrSick: sickStatus !== undefined }))
   const [rolling, setRolling] = useState(false)
   const [result, setResult] = useState<Partial<Record<RegenerationResource, RegenerationOutcome>> | null>(null)
   const [before, setBefore] = useState<Partial<Record<RegenerationResource, number>>>({})
   const owned = [...stats.advantages, ...stats.disadvantages].filter((entry) => / Regeneration \(/.test(entry))
   // Wirselkraut (S. 346) and a paid Medicus treatment (S. 382) wait for the next LeP regeneration; the server uses them up.
   const running = useActiveEffects(stats)
   const herbHealth = Math.min(3, running.reduce((sum, effect) => sum + (effect.values.herbHealth ?? 0), 0))
   const medicus = Math.max(0, ...running.map((effect) => effect.values.treatmentQuality ?? 0))

   const mutation = useMutation({
      mutationFn: (rolls: Partial<Record<RegenerationResource, number>>) => regenerate(stats._id, { ...situation, rolls }),
      onSuccess: ({ stats: next, regeneration }) => {
         queryClient.setQueryData(['stats', stats.charId], next)
         void queryClient.invalidateQueries({ queryKey: activeEffectsKey(stats._id) })
         setResult(regeneration)
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   function update<K extends keyof RegenerationSituation>(key: K, value: RegenerationSituation[K]) {
      setSituation((current) => ({ ...current, [key]: value }))
      if (key === 'reducedHealth') {
         try {
            localStorage.setItem(reducedRuleKey, String(value))
         } catch {
            // The optional rule simply is not remembered.
         }
      }
   }

   async function rest() {
      const rolled = energies.filter(({ key }) => selected.includes(key))
      setRolling(true)
      setBefore(Object.fromEntries(rolled.map(({ key }) => [key, stats[key].current])))
      const values = await throwColoredDice(6, rolled.map(({ color }) => color))
      setRolling(false)
      mutation.mutate(Object.fromEntries(rolled.map(({ key }, index) => [key, values[index]])))
   }

   const busy = rolling || mutation.isPending
   const resting = (key: RegenerationResource) => selected.includes(key)

   return createPortal(
      <div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
         <section ref={dialogRef} className={`hero-editor regeneration-dialog${busy ? ' is-rolling' : ''}`} lang={language} role='dialog'
            aria-modal='true' aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
            <header className='editor-header'>
               <div>
                  <p className='eyebrow'>{t('Regeneration phase', language)}</p>
                  <h2 id={titleId}>{t('Rest & regenerate', language)}</h2>
                  <p className='talent-probe-subtitle'>{t('At least 6 hours of rest and sleep · at most 2 phases per day', language)}</p>
               </div>
               <button className='icon-button editor-close' type='button' onClick={onClose} aria-label={t('Close', language)}>
                  <X size={20} />
               </button>
            </header>

            <ul className='regen-energies'>
               {available.map(({ key, label, short, color }) => {
                  const resource = stats[key]
                  const outcome = result?.[key]
                  const full = resource.current >= resource.max
                  return <li key={key} className={`regen-energy${resting(key) ? ' is-selected' : ''}`} style={{ '--die-color': color } as CSSProperties}>
                     {result ? <div className='regen-energy-head'>
                        <span className='probe-die-attribute'><span className='probe-die-color' style={{ background: color }} aria-hidden='true' />{t(label, language)}</span>
                        <strong>{outcome ? `${before[key]} → ${resource.current}` : resource.current} <small>/ {resource.max}</small></strong>
                     </div> : <label className='regen-energy-head'>
                        <input type='checkbox' checked={resting(key)} disabled={busy || full}
                           onChange={(event) => setSelected((current) => event.target.checked ? [...current, key] : current.filter((entry) => entry !== key))} />
                        <span className='probe-die-attribute'><span className='probe-die-color' style={{ background: color }} aria-hidden='true' />{t(label, language)}</span>
                        <strong>{resource.current} <small>/ {resource.max}</small></strong>
                     </label>}
                     {!result && full && <small className='regen-energy-note'>{t('Already at maximum', language)}</small>}
                     {busy && resting(key) && <span className='probe-die-roll'>…</span>}
                     {outcome && <div className='regen-outcome'>
                        <span className='regen-gain'>+{outcome.gained} <small>{short}</small></span>
                        <ul className='regen-steps'>
                           <li><span>{situation.reducedHealth && key === 'health' ? t('1W3 (from W6 {roll})', language).replace('{roll}', () => String(outcome.roll)) : t('1W6', language)}</span><strong>{outcome.base}</strong></li>
                           {outcome.modifiers.map((step) => <li key={step.label} className={step.ignored ? 'is-ignored' : undefined}>
                              <span lang='de'>{translateRuleLabel(step.label, language)}</span><strong>{signed(step.value)}</strong>
                           </li>)}
                           {outcome.blocked ? <li className='is-blocked'><span>{t(outcome.blocked, language)}</span><strong>0</strong></li>
                              : outcome.environment === 'bad' && <li><span>{t('Bad environment: halved', language)}</span><strong>{Math.floor(outcome.subtotal / 2)}</strong></li>}
                           {outcome.treatment > 0 && <li><span lang='de'>{t('Heilkunde Wunden (Heilung fördern)', language)}</span><strong>+{outcome.treatment}</strong></li>}
                           {(outcome.herb ?? 0) > 0 && <li><span lang='de'>{t('Wirselkraut', language)}</span><strong>+{outcome.herb}</strong></li>}
                           {outcome.gained < outcome.amount && <li className='is-capped'><span>{t('Capped at maximum', language)}</span><strong>{outcome.amount} → {outcome.gained}</strong></li>}
                        </ul>
                     </div>}
                  </li>
               })}
            </ul>

            {!result && !busy && <>
               {(Object.keys(situationOptions) as Array<keyof typeof situationOptions>).map((key) => <fieldset className='probe-difficulty' key={key}>
                  <legend>{t(situationLegends[key], language)}</legend>
                  <div className='regen-options'>
                     {situationOptions[key].map((option) => <button key={option.value} type='button' aria-pressed={situation[key] === option.value}
                        className={`probe-chip${situation[key] === option.value ? ' is-active' : ''}`}
                        onClick={() => update(key, option.value as never)}>
                        {option.modifier && <strong>{option.modifier}</strong>}
                        <small>{t(option.label, language)}</small>
                     </button>)}
                  </div>
               </fieldset>)}

               <fieldset className='probe-difficulty regen-extras'>
                  <legend>{t('Further circumstances', language)}</legend>
                  {/* source: DSA5 Regelwerk, S. 168 (Nichtschläfer), S. 175 (Schlafwandler): GM-dependent, so only reminders */}
                  {stats.advantages.includes('Nichtschläfer') && <p className='combat-note'>{t('Nichtschläfer: no regeneration by rest while staying awake; sleep must be made up later (S. 168).', language)}</p>}
                  {stats.disadvantages.includes('Schlafwandler') && <p className='combat-note'>{t('Schlafwandler: a night of sleepwalking regenerates 1 point less (enter it as a modifier) and gives Betäubung I for 24 hours (S. 175).', language)}</p>}
                  {resting('health') && <label className='regen-toggle'>
                     <input type='checkbox' checked={situation.poisonedOrSick} disabled={sickStatus !== undefined} onChange={(event) => update('poisonedOrSick', event.target.checked)} />
                     <span><strong>{t('Poisoned or sick', language)}</strong><small>{sickStatus
                        ? `${t('Set by the status', language)} ${sickStatus} (${t('Combat', language)})`
                        : t('No LeP regeneration while the effect lasts.', language)}</small></span>
                  </label>}
                  {resting('health') && !situation.poisonedOrSick && <div className='regen-field'>
                     <span><strong lang='de'>{t('Heilkunde Wunden (Heilung fördern)', language)}</strong><small>{t('QS of a treatment before this phase; added to LeP.', language)}</small></span>
                     <Stepper label={t('QS', language)} value={situation.treatmentQuality} min={0} max={6} onChange={(value) => update('treatmentQuality', value)} />
                  </div>}
                  {resting('health') && !situation.poisonedOrSick && (herbHealth > 0 || medicus > 0) && <p className='combat-note regen-pending'>
                     {[herbHealth > 0 ? `${t('Wirselkraut', language)}: +${herbHealth} LeP (S. 346)` : '',
                        medicus > 0 ? `${t('Medicus treatment', language)}: QS ${medicus} (S. 382)` : '']
                        .filter(Boolean).join(' · ')} — {t('applied automatically and used up by this LeP regeneration.', language)}
                  </p>}
                  {resting('mana') && <div className='regen-field'>
                     <span><strong>{t('Iron carried (Stein)', language)}</strong><small>{t('Carried over an hour: −1 AsP per full 2 Stein.', language)}</small></span>
                     <Stepper label={t('Iron carried (Stein)', language)} value={situation.ironStone} min={0} max={100} step={0.5} onChange={(value) => update('ironStone', value)} />
                  </div>}
                  <div className='regen-field'>
                     <span><strong>{t('Other modifier', language)}</strong><small>{t('Further GM bonuses or penalties for all energies.', language)}</small></span>
                     <Stepper label={t('Other modifier', language)} value={situation.otherModifier} min={-10} max={10} onChange={(value) => update('otherModifier', value)} />
                  </div>
                  {resting('health') && <label className='regen-toggle'>
                     <input type='checkbox' checked={situation.reducedHealth} onChange={(event) => update('reducedHealth', event.target.checked)} />
                     <span><strong>{t('Optional rule: Weniger Regeneration', language)}</strong><small>{t('LeP regenerate with 1W3 and without bonus points.', language)}</small></span>
                  </label>}
               </fieldset>

               {owned.length > 0 && <p className='regen-owned'>
                  <strong>{t('Applied automatically', language)}:</strong> <span lang='de'>{owned.map((entry) => translateRuleLabel(entry, language)).join(' · ')}</span>
               </p>}
            </>}

            <div className='probe-summary' aria-live='polite'>
               {busy && <p className='probe-rolling'>{t('Rolling…', language)}</p>}
            </div>

            <footer className='editor-actions'>
               {result ? <button className='primary-button' type='button' autoFocus onClick={onClose}>{t('Done', language)}</button>
                  : <>
                     <button className='quiet-button' type='button' onClick={onClose}>{t('Cancel', language)}</button>
                     <button className='primary-button' type='button' disabled={busy || selected.length === 0} onClick={() => void rest()}>
                        <Moon size={18} />{t('Rest and roll', language)}<Dices size={18} />
                     </button>
                  </>}
            </footer>
         </section>
      </div>, document.body,
   )
}
