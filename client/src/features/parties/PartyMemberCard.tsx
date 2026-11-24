import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown, ChevronUp, FileText, LogOut, UserMinus, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { GmHeroActions } from './GmHeroActions'
import { levelsLabel } from './levels'
import { OnlineDot } from './OnlineDot'
import { usePresence } from '@/realtime/presence'
import { answerRequest, partiesKey, removeMember, setVisibility, type Party, type PartyMember, type Visibility } from './partyApi'

const visibilityLabels: Record<Visibility, string> = {
   private: 'Name only', summary: 'Summary (LeP, statuses)', full: 'Full sheet',
}

export function Meter({ label, value }: { label: string; value?: { current: number; max: number } }) {
   if (!value) return null
   const percent = value.max > 0 ? Math.max(0, Math.min(100, (value.current / value.max) * 100)) : 0
   return <div className='resource-meter'>
      <div className='resource-label'><span>{label}</span><strong>{value.current} <small>/ {value.max}</small></strong></div>
      <div className='resource-track'><span style={{ width: `${percent}%` }} /></div>
   </div>
}

export function PartyMemberCard({ party, member }: { party: Party; member: PartyMember }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const [actionsOpen, setActionsOpen] = useState(false)
   const isGm = party.role === 'gm'
   const { hero } = member
   const refresh = () => void queryClient.invalidateQueries({ queryKey: partiesKey })
   const mutation = useMutation({
      mutationFn: (action: () => Promise<unknown>) => action(),
      onSuccess: refresh,
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const pending = member.state === 'pending'
   const conditions = Object.entries(hero.conditions ?? {})
   const presence = usePresence(party._id)

   return <li className={`party-member${pending ? ' is-pending' : ''}`}>
      <header className='party-member-head'>
         <span className='companion-avatar' aria-hidden='true'>{hero.name.slice(0, 2).toUpperCase()}</span>
         <div className='party-member-title'>
            <h3>{presence && !pending && <OnlineDot online={presence.charIds.includes(member.charId)} />}{hero.name}{member.isSelf && <small> · {t('your hero', language)}</small>}</h3>
            <small>{[hero.species, hero.profession, member.playerName && `${t('Player', language)}: ${member.playerName}`].filter(Boolean).join(' · ')}</small>
         </div>
         {pending && <span className='party-badge'>{t('Waiting for the GM', language)}</span>}
      </header>

      {hero.detail !== 'name' && !pending && <div className='party-member-body'>
         <Meter label={t('Life energy', language)} value={hero.health} />
         <Meter label={t('Astral energy', language)} value={hero.mana} />
         <Meter label={t('Karma energy', language)} value={hero.karmaEnergy} />
         <dl className='party-facts'>
            <div><dt>{t('Pain', language)}</dt><dd>{levelsLabel(hero.pain ?? 0)}</dd></div>
            {hero.fatePoints && <div><dt>{t('Fate points', language)}</dt><dd>{hero.fatePoints.current} / {hero.fatePoints.max}</dd></div>}
            {hero.dodge !== undefined && <div><dt>{t('Dodge', language)}</dt><dd>{hero.dodge}</dd></div>}
            {hero.apAvailable !== undefined && <div><dt>{t('AP available', language)}</dt><dd>{hero.apAvailable}</dd></div>}
         </dl>
         {(hero.statuses?.length || conditions.length) ? <ul className='party-chips' aria-label={t('Status and conditions', language)}>
            {hero.statuses?.map((status) => <li key={status} lang='de'>{status}</li>)}
            {conditions.map(([key, level]) => <li key={key}>{t(key, language)} {levelsLabel(level)}</li>)}
         </ul> : <p className='party-muted'>{t('No statuses or conditions.', language)}</p>}
      </div>}
      {hero.detail === 'name' && !pending && <p className='party-muted'>{t('This player shares only the name.', language)}</p>}

      <div className='party-member-actions'>
         {hero.canOpenSheet && !pending && <Link className='quiet-button' to={`/parties/${party._id}/heroes/${member.charId}`}>
            <FileText size={15} aria-hidden='true' />{t('Open sheet', language)}</Link>}
         {isGm && pending && <>
            <button className='primary-button' type='button' disabled={mutation.isPending}
               onClick={() => mutation.mutate(() => answerRequest(party._id, member.charId, 'accept'))}><Check size={15} aria-hidden='true' />{t('Accept', language)}</button>
            <button className='quiet-button' type='button' disabled={mutation.isPending}
               onClick={() => mutation.mutate(() => answerRequest(party._id, member.charId, 'deny'))}><X size={15} aria-hidden='true' />{t('Deny', language)}</button>
         </>}
         {isGm && !pending && <button className='quiet-button' type='button' aria-expanded={actionsOpen} onClick={() => setActionsOpen(!actionsOpen)}>
            {actionsOpen ? <ChevronUp size={15} aria-hidden='true' /> : <ChevronDown size={15} aria-hidden='true' />}{t('GM actions', language)}</button>}
         {member.isSelf && member.visibility && <label className='party-visibility'>
            <span>{t('Others see', language)}</span>
            <select value={member.visibility} disabled={mutation.isPending}
               onChange={(event) => {
                  // Read now: the controlled select is reset before the mutation runs
                  const next = event.target.value as Visibility
                  mutation.mutate(() => setVisibility(party._id, member.charId, next))
               }}>
               {(Object.keys(visibilityLabels) as Visibility[]).map((key) => <option key={key} value={key}>{t(visibilityLabels[key], language)}</option>)}
            </select>
         </label>}
         {(isGm || member.isSelf) && <button className='quiet-button' type='button' disabled={mutation.isPending}
            onClick={() => {
               const question = member.isSelf ? 'Leave the party with this hero?' : 'Remove this hero from the party?'
               if (window.confirm(t(question, language))) mutation.mutate(() => removeMember(party._id, member.charId))
            }}>
            {member.isSelf ? <LogOut size={15} aria-hidden='true' /> : <UserMinus size={15} aria-hidden='true' />}
            {t(member.isSelf ? (pending ? 'Withdraw request' : 'Leave party') : 'Remove', language)}</button>}
      </div>
      {isGm && actionsOpen && !pending && <GmHeroActions hero={hero} partyId={party._id} />}
   </li>
}
