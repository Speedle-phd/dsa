import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, Unlock } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { activatePrepared, createPrepared, deletePrepared, encounterKey, listPrepared, preparedKey } from './encounterApi'

// The GM's prepared fights (user decision, Nov 2026): set up in advance (opponents, terrain, positions), invisible to the
// players until the GM unlocks one; only one fight runs at a time.
export function PreparedFights({ partyId, running = false }: { partyId: string; running?: boolean }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const navigate = useNavigate()
   const fights = useQuery({ queryKey: preparedKey(partyId), queryFn: () => listPrepared(partyId) })
   const [name, setName] = useState('')
   const onError = (error: unknown) => toast.error(getErrorMessage(error))
   const create = useMutation({
      mutationFn: () => createPrepared(partyId, name.trim()),
      onSuccess: (fight) => navigate(`/parties/${partyId}/fight/prepare/${fight.id}`),
      onError,
   })
   const remove = useMutation({
      mutationFn: (encounterId: string) => deletePrepared(partyId, encounterId),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: preparedKey(partyId) }),
      onError,
   })
   const unlock = useMutation({
      mutationFn: (encounterId: string) => activatePrepared(partyId, encounterId),
      onSuccess: (next) => {
         queryClient.setQueryData(encounterKey(partyId), next)
         void queryClient.invalidateQueries({ queryKey: preparedKey(partyId) })
         navigate(`/parties/${partyId}/fight`)
      },
      onError,
   })

   return <section className='prepared-fights' aria-labelledby='prepared-fights-title'>
      <h3 id='prepared-fights-title'>{t('Prepared fights', language)}</h3>
      {fights.data && fights.data.length > 0 ? <ul>
         {fights.data.map((fight) => <li key={fight.id}>
            <span className='prepared-fight-name'><strong>{fight.name}</strong>
               <small>{t('Opponents: {count}', language).replace('{count}', String(fight.opponents))} · {fight.board.width} × {fight.board.height}</small></span>
            <span className='prepared-fight-actions'>
               <Link className='quiet-button' to={`/parties/${partyId}/fight/prepare/${fight.id}`}><Pencil size={15} aria-hidden='true' />{t('Edit', language)}</Link>
               <button className='primary-button' type='button' disabled={running || unlock.isPending} title={running ? t('End the running fight first.', language) : undefined}
                  onClick={() => unlock.mutate(fight.id)}><Unlock size={15} aria-hidden='true' />{t('Unlock for the players', language)}</button>
               <button className='icon-button' type='button' aria-label={`${t('Delete', language)}: ${fight.name}`} disabled={remove.isPending}
                  onClick={() => { if (window.confirm(t('Delete this prepared fight?', language))) remove.mutate(fight.id) }}><Trash2 size={15} aria-hidden='true' /></button>
            </span>
         </li>)}
      </ul> : <p className='party-muted'>{t('No prepared fights yet. Players do not see them until you unlock one.', language)}</p>}
      {running && <small className='party-muted'>{t('A prepared fight can be unlocked when the running fight has ended.', language)}</small>}
      <form className='inline-submit' onSubmit={(event) => { event.preventDefault(); if (name.trim()) create.mutate() }}>
         <label className='field-group prepared-fight-new'><span>{t('New fight', language)}</span>
            <input value={name} maxLength={80} placeholder={t('e.g. Ambush at the ford', language)} onChange={(event) => setName(event.target.value)} /></label>
         <button className='quiet-button' type='submit' disabled={!name.trim() || create.isPending}><Plus size={15} aria-hidden='true' />{t('Prepare', language)}</button>
      </form>
   </section>
}
