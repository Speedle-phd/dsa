import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Hourglass, Plus, Trash2, UsersRound, X } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { DieIcon } from '@/components/DieIcon'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import {
   addExtendedCheck, attemptPresets, extendedChecksKey, extendedOutcome, getExtendedChecks, goalQuality, partialQuality,
   recordExtendedAttempt, removeExtendedCheck, type ExtendedCheck, type ExtendedOutcome, type NewExtendedCheck,
} from './extendedCheckApi'
import { getMagicReference } from './magicApi'
import { ProbeStepper, type ProbeResultState } from './ProbeDialog'
import { SpellProbeDialog } from './SpellProbeDialog'
import type { Stats } from './statsApi'
import { talentCatalog, talentCriticalRules } from './talentCatalog'
import { talentDetails } from './talentDetails'
import { TalentProbeDialog } from './TalentProbeDialog'

const outcomeLabels: Record<ExtendedOutcome, string> = { success: 'Success', failure: 'Failed', critical: 'Critical success', botch: 'Botch' }
type RecordEntry = { outcome: ExtendedOutcome; quality: number }
type OnRecord = (entry: RecordEntry, done: () => void) => void

// Sammelprobe and Gruppensammelprobe (S. 26–27): QS are collected over GM-set intervals, saved per hero on the server.
export function ExtendedChecks({ stats }: { stats: Stats }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const key = extendedChecksKey(stats._id)
   const checksQuery = useQuery({ queryKey: key, queryFn: () => getExtendedChecks(stats._id) })
   const [creating, setCreating] = useState(false)
   const setChecks = (checks: ExtendedCheck[]) => queryClient.setQueryData(key, checks)
   const onError = (error: unknown) => toast.error(getErrorMessage(error))
   const add = useMutation({ mutationFn: (check: NewExtendedCheck) => addExtendedCheck(stats._id, check), onSuccess: setChecks, onError })
   const checks = checksQuery.data ?? []

   return <section className='overview-section'>
      <header className='section-heading'>
         <Hourglass size={19} />
         <div><p className='eyebrow'>{t('Extended checks', language)}</p><h2>{t('Sammelproben', language)}</h2></div>
         <button className='quiet-button section-action' type='button' onClick={() => setCreating(true)}><Plus size={16} />{t('New extended check', language)}</button>
      </header>
      <p className='combat-note'>{t('Collect 10 QS within the allowed attempts; 6 QS is a partial success. Each failure makes later attempts 1 harder, a critical success doubles its QS and clears that penalty, a botch loses everything (S. 26–27).', language)}</p>
      {checksQuery.isError && <p className='field-error'>{t('Extended checks are not available.', language)}</p>}
      {checks.length === 0 && !checksQuery.isPending && <p className='empty-state'>{t('No extended checks yet.', language)}</p>}
      {checks.length > 0 && <ul className='extended-check-grid'>
         {checks.map((check) => <ExtendedCheckCard key={check._id} stats={stats} check={check} onChange={setChecks} />)}
      </ul>}
      {creating && <NewExtendedCheckDialog stats={stats} pending={add.isPending} onClose={() => setCreating(false)}
         onSave={(check) => add.mutate(check, { onSuccess: () => setCreating(false) })} />}
   </section>
}

function skillLabel(check: Pick<ExtendedCheck, 'skill'>, language: 'de' | 'en') {
   if (check.skill.kind === 'spell') return check.skill.key
   const talent = talentCatalog.find((entry) => entry.key === check.skill.key)
   return talent ? t(talent.label, language) : check.skill.key
}

function ExtendedCheckCard({ stats, check, onChange }: { stats: Stats; check: ExtendedCheck; onChange: (checks: ExtendedCheck[]) => void }) {
   const language = useLanguageStore((state) => state.language)
   const [rolling, setRolling] = useState(false)
   const [member, setMember] = useState(false)
   const [confirmRemove, setConfirmRemove] = useState(false)
   const onError = (error: unknown) => toast.error(getErrorMessage(error))
   const record = useMutation({
      mutationFn: ({ outcome, quality, by }: { outcome: ExtendedOutcome; quality: number; by?: string }) =>
         recordExtendedAttempt(stats._id, check._id, outcome, quality, by ?? null),
      onSuccess: onChange, onError,
   })
   const remove = useMutation({ mutationFn: () => removeExtendedCheck(stats._id, check._id), onSuccess: onChange, onError })
   const name = skillLabel(check, language)
   const talent = check.skill.kind === 'talent' ? talentCatalog.find((entry) => entry.key === check.skill.key) : undefined
   const ownCritical = Boolean(talent && talentCriticalRules[talent.key])
   const value = talent ? stats.talents.find((entry) => entry.key === talent.key)?.value ?? null
      : stats.spells.find((spell) => spell.key === check.skill.key)?.value ?? null
   const open = check.status === 'open'
   // source: DSA5 Regelwerk, S. 25 (inactive skills cannot be rolled)
   const rollReason = !open ? null : value === null ? (talent ? 'This talent is not activated.' : 'This spell is not owned.') : null
   const status = check.status === 'done' ? 'Task completed' : check.status === 'failed'
      ? check.collected >= partialQuality ? 'Failed after a partial success' : 'Failed'
      : check.collected >= partialQuality ? 'Partial success reached' : 'In progress'
   const penaltySource = check.penalty ? [{ label: 'Sammelprobe: failed attempts', value: -check.penalty }] : []
   const recordRoll: OnRecord = (entry, done) => record.mutate(entry, { onSuccess: done })

   return <li className={`extended-check-card is-${check.status}`}>
      <header className='extended-check-header'>
         <button type='button' className='talent-probe-button' disabled={!open || rollReason !== null}
            aria-label={`${t('Roll check', language)}: ${check.name}`} title={rollReason ? t(rollReason, language) : t('Roll check', language)}
            onClick={() => setRolling(true)}><DieIcon sides={20} /></button>
         <div>
            <h3>{check.name}</h3>
            <small><span lang='de'>{name}</span>{check.interval && ` · ${t('every', language)} ${check.interval}`}</small>
         </div>
         <button type='button' className='icon-button' aria-label={`${t('Remove', language)}: ${check.name}`} title={t('Remove', language)}
            onClick={() => setConfirmRemove(true)}><Trash2 size={16} /></button>
      </header>
      <div className='extended-progress' role='meter' aria-valuemin={0} aria-valuemax={goalQuality} aria-valuenow={Math.min(goalQuality, check.collected)}
         aria-label={`${t('Collected QS', language)}: ${check.collected} / ${goalQuality}`}>
         <span style={{ width: `${Math.min(100, check.collected / goalQuality * 100)}%` }} />
         <i style={{ left: `${partialQuality / goalQuality * 100}%` }} aria-hidden='true' />
      </div>
      <dl className='extended-check-values'>
         <div><dt>{t('QS', language)}</dt><dd>{check.collected} / {goalQuality}</dd></div>
         <div><dt>{t('Attempts', language)}</dt><dd>{check.attempts.length} / {check.maxAttempts}</dd></div>
         <div><dt>{t('Penalty', language)}</dt><dd>{check.penalty ? `−${check.penalty}` : '±0'}</dd></div>
      </dl>
      <p className={`extended-check-status${check.status === 'done' ? ' is-done' : check.status === 'failed' ? ' is-failed' : ''}`}>{t(status, language)}</p>
      {rollReason && <p className='combat-note'>{t(rollReason, language)}</p>}
      {/* Talents with their own critical rule already set the FP; the server counts that QS once (S. 189–212). */}
      {check.attempts.length > 0 && <ol className='extended-check-log'>
         {check.attempts.map((attempt, index) => <li key={index}>
            {index + 1}. {attempt.by ?? t('Hero', language)}: {t(outcomeLabels[attempt.outcome], language)}{attempt.quality > 0 && ` · ${t('QS', language)} ${attempt.quality}${attempt.outcome === 'critical' && !ownCritical ? ' ×2' : ''}`}
         </li>)}
      </ol>}
      {open && !member && <button className='quiet-button' type='button' onClick={() => setMember(true)}><UsersRound size={16} />{t('Add group member', language)}</button>}
      {open && member && <MemberForm pending={record.isPending} onCancel={() => setMember(false)}
         onSave={(entry) => record.mutate(entry, { onSuccess: () => setMember(false) })} />}
      {confirmRemove && <div className='fight-confirm' role='alertdialog' aria-label={t('Remove', language)}>
         <p>{t('Remove this extended check and its collected QS?', language)}</p>
         <button className='quiet-button' type='button' onClick={() => setConfirmRemove(false)}>{t('Cancel', language)}</button>
         <button className='primary-button' type='button' disabled={remove.isPending} onClick={() => remove.mutate()}>{t('Remove', language)}</button>
      </div>}
      {rolling && value !== null && (talent
         ? <TalentProbeDialog stats={stats} talent={talent} value={value} extraSources={penaltySource}
            renderResult={(state) => <RecordAttempt check={check} state={state} onRecord={recordRoll} pending={record.isPending} />} onClose={() => setRolling(false)} />
         : <SpellAttempt stats={stats} check={check} value={value} extraSources={penaltySource} pending={record.isPending}
            onRecord={recordRoll} onClose={() => setRolling(false)} />)}
   </li>
}

function SpellAttempt({ stats, check, value, extraSources, pending, onRecord, onClose }: {
   stats: Stats; check: ExtendedCheck; value: number; extraSources: Array<{ label: string; value: number }>; pending: boolean
   onRecord: OnRecord; onClose: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const reference = useQuery({ queryKey: ['magic-reference'], queryFn: getMagicReference, staleTime: Infinity })
   const spell = reference.data?.spells.find((entry) => entry.key === check.skill.key)
   if (!reference.data || !spell) return reference.isPending ? null : <p className='field-error'>{t('This spell is not owned.', language)}</p>
   return <SpellProbeDialog stats={stats} spell={spell} reference={reference.data} value={value} extraSources={extraSources}
      renderAfter={(state) => <RecordAttempt check={check} state={state} onRecord={onRecord} pending={pending} />} onClose={onClose} />
}

// One attempt per roll: "Roll again" remounts this block (no result), so each Probe can be recorded once.
function RecordAttempt({ check, state, pending, onRecord }: {
   check: ExtendedCheck; state: ProbeResultState; pending: boolean; onRecord: OnRecord
}) {
   const language = useLanguageStore((state) => state.language)
   const [recorded, setRecorded] = useState(false)
   const outcome = extendedOutcome(state.result.outcome)
   if (recorded || check.status !== 'open') return <p className='probe-asp-spent'><Check size={16} />
      {t('Recorded in', language)} {check.name}: {check.collected} / {goalQuality} {t('QS', language)}</p>
   return <section className='probe-asp' aria-label={t('Sammelproben', language)}>
      <p className='probe-fate-balance'><Hourglass size={16} />{check.name}: <strong>{check.collected} / {goalQuality} {t('QS', language)}</strong>
         <small> · {t('Attempt', language)} {check.attempts.length + 1} / {check.maxAttempts}</small></p>
      <button className='primary-button' type='button' disabled={pending} onClick={() => onRecord({ outcome, quality: state.quality ?? 0 }, () => setRecorded(true))}><Check size={16} />{t('Record attempt', language)}: {t(outcomeLabels[outcome], language)}{state.quality !== null && ` · ${t('QS', language)} ${state.quality}`}</button>
   </section>
}

function MemberForm({ pending, onSave, onCancel }: {
   pending: boolean; onSave: (entry: { outcome: ExtendedOutcome; quality: number; by: string }) => void; onCancel: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const [by, setBy] = useState('')
   const [outcome, setOutcome] = useState<ExtendedOutcome>('success')
   const [quality, setQuality] = useState(1)
   const scored = outcome === 'success' || outcome === 'critical'
   return <form className='extended-member-form' onSubmit={(event) => {
      event.preventDefault()
      if (!by.trim()) { toast.error(t('Enter the group member’s name.', language)); return }
      onSave({ outcome, quality: scored ? quality : 0, by: by.trim() })
   }}>
      <label className='field-group'><span>{t('Group member', language)}</span>
         <input value={by} maxLength={80} onChange={(event) => setBy(event.target.value)} autoFocus /></label>
      <div className='probe-segmented'>
         {(Object.keys(outcomeLabels) as ExtendedOutcome[]).map((key) => <button key={key} type='button' aria-pressed={outcome === key}
            className={outcome === key ? 'is-active' : ''} onClick={() => setOutcome(key)}>{t(outcomeLabels[key], language)}</button>)}
      </div>
      {scored && <div className='probe-difficulty-custom'><span>{t('QS', language)}</span>
         <ProbeStepper value={quality} min={1} max={6} label={t('QS', language)} lowerLabel={t('Less', language)} raiseLabel={t('More', language)} onChange={setQuality} />
      </div>}
      <div className='editor-actions'>
         <button className='quiet-button' type='button' onClick={onCancel}>{t('Cancel', language)}</button>
         <button className='primary-button' type='submit' disabled={pending}>{t('Record attempt', language)}</button>
      </div>
   </form>
}

const newCheckSchema = z.object({
   name: z.string().trim().min(1).max(120),
   skill: z.object({ kind: z.enum(['talent', 'spell']), key: z.string().min(1) }),
   interval: z.string().trim().max(60),
   maxAttempts: z.number().int().min(1).max(50),
})

function NewExtendedCheckDialog({ stats, pending, onSave, onClose }: {
   stats: Stats; pending: boolean; onSave: (check: NewExtendedCheck) => void; onClose: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const titleId = useId()
   const dialogRef = useModalKeyboard(onClose)
   const [maxAttempts, setMaxAttempts] = useState(7)
   const [skill, setSkill] = useState('talent:sphaerenkunde')
   const [name, setName] = useState('')
   const [timeInterval, setTimeInterval] = useState('')
   // source: DSA5 Regelwerk, S. 204–213 (the talent's Sammelprobe examples: interval and allowed attempts)
   const examples = skill.startsWith('talent:') ? talentDetails[skill.slice(7)]?.extended ?? [] : []
   const skills = [
      ...talentCatalog.map((talent) => ({ value: `talent:${talent.key}`, label: t(talent.label, language) })),
      ...stats.spells.map((spell) => ({ value: `spell:${spell.key}`, label: spell.key })),
   ]
   function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const [kind, ...rest] = skill.split(':')
      const result = newCheckSchema.safeParse({ name, interval: timeInterval, maxAttempts, skill: { kind, key: rest.join(':') } })
      if (!result.success) { toast.error(t('Please correct the highlighted values.', language)); return }
      onSave(result.data)
   }
   return createPortal(
      <div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
         <section ref={dialogRef} className='hero-editor' lang={language} role='dialog' aria-modal='true' aria-labelledby={titleId}
            onMouseDown={(event) => event.stopPropagation()}>
            <header className='editor-header'>
               <div><p className='eyebrow'>{t('Sammelproben', language)}</p><h2 id={titleId}>{t('New extended check', language)}</h2></div>
               <button className='icon-button editor-close' type='button' onClick={onClose} aria-label={t('Close', language)}><X size={20} /></button>
            </header>
            <form className='hero-form' onSubmit={submit}>
               <label className='field-group'><span>{t('Name', language)}</span>
                  <input name='name' required maxLength={120} autoFocus value={name} onChange={(event) => setName(event.target.value)}
                     placeholder={t('e.g. Library research', language)} /></label>
               <label className='field-group'><span>{t('Talent or spell', language)}</span>
                  <select name='skill' required value={skill} onChange={(event) => setSkill(event.target.value)}>
                     {skills.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
                  </select></label>
               {examples.length > 0 && <details className='probe-examples'>
                  <summary>{t('Book examples', language)}</summary>
                  <ul>
                     {examples.map((example) => <li key={example.label}><button type='button' onClick={() => {
                        setName(example.label); setTimeInterval(example.interval); setMaxAttempts(example.attempts ?? 50)
                     }}>
                        <strong>{example.attempts ?? '∞'}</strong><span lang='de'>{example.label} · {example.interval}</span>
                     </button></li>)}
                  </ul>
               </details>}
               <label className='field-group'><span>{t('Time interval (set by the GM)', language)}</span>
                  <input name='interval' maxLength={60} value={timeInterval} onChange={(event) => setTimeInterval(event.target.value)}
                     placeholder={t('e.g. 4 hours', language)} /></label>
               <fieldset className='probe-difficulty'>
                  <legend>{t('Allowed attempts', language)}</legend>
                  <div className='probe-segmented'>
                     {attemptPresets.map((preset) => <button key={preset.value} type='button' aria-pressed={maxAttempts === preset.value}
                        className={maxAttempts === preset.value ? 'is-active' : ''} onClick={() => setMaxAttempts(preset.value)}>
                        {preset.value} · {t(preset.label, language)}
                     </button>)}
                  </div>
                  <div className='probe-difficulty-custom'><span>{t('Custom', language)}</span>
                     <ProbeStepper value={maxAttempts} min={1} max={50} label={t('Allowed attempts', language)}
                        lowerLabel={t('Less', language)} raiseLabel={t('More', language)} onChange={setMaxAttempts} />
                  </div>
               </fieldset>
               <footer className='editor-actions'>
                  <button className='quiet-button' type='button' onClick={onClose}>{t('Cancel', language)}</button>
                  <button className='primary-button' type='submit' disabled={pending}><Plus size={16} />{t('Start', language)}</button>
               </footer>
            </form>
         </section>
      </div>, document.body,
   )
}
