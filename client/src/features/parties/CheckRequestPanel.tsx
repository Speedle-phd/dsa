import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dices, EyeOff, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { QuantityStepper } from '@/components/QuantityStepper'
import { attributeLabels, talentCatalog, talentCategoryLabels, type TalentAttribute, type TalentCategory } from '@/features/heroes/talentCatalog'
import { useLanguageStore } from '@/locales/languageStore'
import { t, translateRuleLabel } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { checkRequestsKey, closeCheckRequest, createCheckRequest, useCheckRequests, type CheckRequest, type CheckRequestTarget } from './checkRequestApi'
import { checkTitle, resultSummary } from './checkRequests'
import type { Party } from './partyApi'

const attributes = Object.keys(attributeLabels) as TalentAttribute[]
const categories = [...new Set(talentCatalog.map((talent) => talent.category))] as TalentCategory[]

// GM asks chosen heroes for a check and sees the results live (user request, Nov 2026); players see the list read-only.
// `compact`: folded into the fight page's side column.
export function CheckRequestPanel({ party, compact = false }: { party: Party; compact?: boolean }) {
   const language = useLanguageStore((state) => state.language)
   const isGm = party.role === 'gm'
   const query = useCheckRequests(party._id)
   const requests = query.data ?? []
   const open = requests.filter((request) => request.status === 'open')
   const closed = requests.filter((request) => request.status === 'closed')
   if (!isGm && requests.length === 0) return null

   const body = <>
      {isGm && <RequestForm party={party} />}
      {query.isError && <p className='field-error'>{t('Check requests are not available.', language)}</p>}
      {open.length > 0 && <ul className='check-request-list'>{open.map((request) => <RequestItem key={request.id} party={party} request={request} />)}</ul>}
      {closed.length > 0 && <details className='check-request-closed'>
         <summary>{t('Closed check requests', language)} ({closed.length})</summary>
         <ul className='check-request-list'>{closed.map((request) => <RequestItem key={request.id} party={party} request={request} />)}</ul>
      </details>}
   </>
   const title = t(isGm ? 'Request a check' : 'Check requests', language)
   return compact
      ? <details className='overview-section check-request-panel'><summary>{title}{open.length > 0 && ` (${open.length})`}</summary>{body}</details>
      : <section className='overview-section check-request-panel'><header className='section-heading'><h2>{title}</h2></header>{body}</section>
}

function RequestForm({ party }: { party: Party }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const heroes = party.members.filter((member) => member.state === 'accepted')
   // null = every hero of the party
   const [picked, setPicked] = useState<string[] | null>(null)
   const [check, setCheck] = useState('talent:sinnesschaerfe')
   const [modifier, setModifier] = useState(0)
   const [hidden, setHidden] = useState(false)
   const [note, setNote] = useState('')
   const charIds = picked ?? heroes.map((member) => member.charId)
   const create = useMutation({
      mutationFn: () => {
         const [kind, key] = check.split(':') as ['attribute' | 'talent', string]
         return createCheckRequest(party._id, { kind, key, modifier, hidden, note, charIds })
      },
      onSuccess: () => {
         void queryClient.invalidateQueries({ queryKey: checkRequestsKey(party._id) })
         setNote('')
         toast.success(t('Check requested.', language))
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   function toggle(charId: string, on: boolean) {
      setPicked(on ? [...new Set([...charIds, charId])] : charIds.filter((entry) => entry !== charId))
   }
   function submit(event: FormEvent) {
      event.preventDefault()
      create.mutate()
   }

   if (heroes.length === 0) return <p className='party-muted'>{t('No heroes have joined yet.', language)}</p>
   return <form className='check-request-form' onSubmit={submit}>
      <fieldset className='check-request-heroes'>
         <legend>{t('Heroes', language)}</legend>
         {heroes.map((member) => <label key={member.charId} className='regen-toggle'>
            <input type='checkbox' checked={charIds.includes(member.charId)} onChange={(event) => toggle(member.charId, event.target.checked)} />
            <span><strong>{member.hero.name}</strong></span>
         </label>)}
      </fieldset>
      <label className='field-group'>
         <span>{t('Check', language)}</span>
         <select value={check} onChange={(event) => setCheck(event.target.value)}>
            <optgroup label={t('Attributes', language)}>
               {attributes.map((attribute) => <option key={attribute} value={`attribute:${attribute}`}>{t(attributeLabels[attribute], language)}</option>)}
            </optgroup>
            {categories.map((category) => <optgroup key={category} label={t(talentCategoryLabels[category], language)}>
               {talentCatalog.filter((talent) => talent.category === category).map((talent) =>
                  <option key={talent.key} value={`talent:${talent.key}`}>{translateRuleLabel(talent.label, language)}</option>)}
            </optgroup>)}
         </select>
      </label>
      <div className='field-group'>
         <span>{t('Modifier (+ easier, − harder)', language)}</span>
         <QuantityStepper value={modifier} min={-10} max={10} label={t('Modifier', language)} onChange={setModifier} />
      </div>
      <label className='regen-toggle'>
         <input type='checkbox' checked={hidden} onChange={(event) => setHidden(event.target.checked)} />
         <span><strong>{t('Hidden', language)}</strong><small>{t('Only you see all results; each player sees their own.', language)}</small></span>
      </label>
      <label className='field-group'>
         <span>{t('Note (optional)', language)}</span>
         <input value={note} maxLength={120} onChange={(event) => setNote(event.target.value)} />
      </label>
      <button className='primary-button' type='submit' disabled={create.isPending || charIds.length === 0}>
         <Dices size={16} aria-hidden='true' />{t('Request the check', language)}</button>
      {charIds.length === 0 && <small className='party-muted'>{t('Choose at least one hero.', language)}</small>}
   </form>
}

function RequestItem({ party, request }: { party: Party; request: CheckRequest }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const close = useMutation({
      mutationFn: () => closeCheckRequest(party._id, request.id),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: checkRequestsKey(party._id) }),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const title = checkTitle(request, language)
   return <li className='check-request'>
      <div className='check-request-head'>
         <strong>{title}</strong>
         {request.hidden && <span className='party-badge'><EyeOff size={13} aria-hidden='true' />{t('Hidden', language)}</span>}
         {party.role === 'gm' && request.status === 'open' && <button className='icon-button' type='button' disabled={close.isPending}
            aria-label={`${t('Close the check request', language)}: ${title}`} title={t('Close the check request', language)} onClick={() => close.mutate()}>
            <X size={16} aria-hidden='true' /></button>}
      </div>
      {request.note && <p className='party-muted'>{request.note}</p>}
      <ul className='check-request-results' aria-live='polite'>
         {request.targets.map((target) => <li key={target.charId} className={`is-${target.state}${target.result && !target.result.success ? ' is-failed' : ''}`}>
            <span>{target.name}</span><span>{targetState(target, language)}</span>
         </li>)}
      </ul>
   </li>
}

function targetState(target: CheckRequestTarget, language: 'de' | 'en') {
   if (target.state === 'open') return t('waiting…', language)
   if (target.state === 'declined') return t('declined', language)
   return target.result ? resultSummary(target.result, language) : t('rolled (hidden)', language)
}
