import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Crown, Plus, Skull, UsersRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { DashboardHeader } from '@/components/DashboardHeader'
import { PageHeading } from '@/components/PageHeading'
import { createParty, getParties, partiesKey, type PartySummary } from '@/features/parties/partyApi'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'

export function Parties() {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const navigate = useNavigate()
   const [name, setName] = useState('')
   const query = useQuery({ queryKey: partiesKey, queryFn: getParties })
   const create = useMutation({
      mutationFn: () => createParty(name.trim()),
      onSuccess: (party) => {
         void queryClient.invalidateQueries({ queryKey: partiesKey })
         navigate(`/parties/${party._id}`)
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const led = query.data?.filter((party) => party.role === 'gm') ?? []
   const joined = query.data?.filter((party) => party.role !== 'gm') ?? []

   function submit(event: FormEvent) {
      event.preventDefault()
      if (name.trim()) create.mutate()
   }

   return <main className='dashboard-shell' lang={language}>
      <DashboardHeader />
      <section className='dashboard-content'>
         <PageHeading Icon={UsersRound} title={t('Parties', language)}
            description={t('Play together: a game master leads the party and sees the heroes live.', language)}>
            <div className='add-hero-actions'>
               <Link className='quiet-button' to='/npcs'><Skull size={16} aria-hidden='true' />{t('NPC library', language)}</Link>
            </div>
         </PageHeading>
         <section className='overview-section'>
            <header className='section-heading'><h2>{t('Lead a new party', language)}</h2></header>
            <form className='party-create' onSubmit={submit}>
               <label className='field-group'>
                  <span>{t('Party name', language)}</span>
                  <input value={name} maxLength={80} required onChange={(event) => setName(event.target.value)} />
               </label>
               <button className='primary-button' type='submit' disabled={create.isPending || !name.trim()}>
                  <Plus size={16} aria-hidden='true' />{t('Create party', language)}</button>
            </form>
            <p className='party-muted'>{t('To join someone else\'s party, open the invite link the game master sends you.', language)}</p>
         </section>
         {query.isPending && <div className='state-panel'>{t('Loading your parties...', language)}</div>}
         {query.isError && <div className='state-panel'>
            <p>{t('We could not load your parties.', language)}</p>
            <button className='quiet-button' type='button' onClick={() => query.refetch()}>{t('Try again', language)}</button>
         </div>}
         {query.data && <>
            <PartyList title='As game master' parties={led} empty='You do not lead a party yet.' />
            <PartyList title='As player' parties={joined} empty='None of your heroes is in a party yet.' />
         </>}
      </section>
   </main>
}

function PartyList({ title, parties, empty }: { title: string; parties: PartySummary[]; empty: string }) {
   const language = useLanguageStore((state) => state.language)
   return <section className='overview-section'>
      <header className='section-heading'><h2>{t(title, language)}</h2></header>
      {parties.length === 0 ? <p className='party-muted'>{t(empty, language)}</p> : <ul className='party-list'>
         {parties.map((party) => <li key={party._id}>
            <Link to={`/parties/${party._id}`} className='party-list-item'>
               <strong>{party.name}</strong>
               <small>
                  {party.role === 'gm' ? <><Crown size={13} aria-hidden='true' /> {t('Game master', language)}</> : `${t('Game master', language)}: ${party.gmName}`}
                  {' · '}{party.members} {t(party.members === 1 ? 'hero' : 'heroes', language)}
                  {party.myHero && ` · ${party.myHero.name}${party.myHero.state === 'pending' ? ` (${t('waiting for the GM', language)})` : ''}`}
                  {party.status === 'archived' && ` · ${t('archived', language)}`}
               </small>
               {party.pendingRequests > 0 && <span className='party-badge'>{party.pendingRequests} {t('join requests', language)}</span>}
            </Link>
         </li>)}
      </ul>}
   </section>
}
