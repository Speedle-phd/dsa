import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { DashboardHeader } from '@/components/DashboardHeader'
import { PageHeading } from '@/components/PageHeading'
import { getHeroes } from '@/features/heroes/heroApi'
import { getParties, partiesKey, previewInvite, requestJoin } from '@/features/parties/partyApi'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'

export function JoinParty() {
   const { code = '' } = useParams()
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const navigate = useNavigate()
   const [charId, setCharId] = useState('')
   const invite = useQuery({ queryKey: ['party-invite', code], queryFn: () => previewInvite(code), retry: false })
   const heroes = useQuery({ queryKey: ['heroes'], queryFn: getHeroes })
   const parties = useQuery({ queryKey: partiesKey, queryFn: getParties })
   // A hero can be in one active party at a time (pending requests count)
   const taken = new Set((parties.data ?? []).filter((party) => party.status === 'active' && party.myHero).map((party) => party.myHero!.charId))
   const available = (heroes.data ?? []).filter((hero) => !taken.has(hero._id))
   const join = useMutation({
      mutationFn: () => requestJoin(code, charId),
      onSuccess: ({ partyId }) => {
         void queryClient.invalidateQueries({ queryKey: partiesKey })
         toast.success(t('Request sent. The game master decides.', language))
         navigate(`/parties/${partyId}`)
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   return <main className='dashboard-shell' lang={language}>
      <DashboardHeader />
      <section className='dashboard-content'>
         <PageHeading Icon={UsersRound} title={invite.data ? invite.data.name : t('Join a party', language)}
            description={invite.data ? `${t('Game master', language)}: ${invite.data.gmName}` : undefined} />
         {invite.isPending && <div className='state-panel'>{t('Checking the invite...', language)}</div>}
         {invite.isError && <div className='state-panel'>{t('This invite link is not valid (any more). Ask the game master for a new one.', language)}</div>}
         {invite.data?.role === 'gm' && <div className='state-panel'>
            <p>{t('You are the game master of this party.', language)}</p>
            <Link className='quiet-button' to={`/parties/${invite.data.partyId}`}>{t('Open the party', language)}</Link>
         </div>}
         {invite.data && invite.data.role !== 'gm' && <section className='overview-section'>
            <header className='section-heading'><h2>{t('Choose your hero', language)}</h2></header>
            {heroes.data && available.length === 0
               ? <p className='party-muted'>{t('All your heroes are already in a party. Create a hero or leave a party first.', language)}</p>
               : <form className='party-create' onSubmit={(event) => { event.preventDefault(); if (charId) join.mutate() }}>
                  <label className='field-group'>
                     <span>{t('Hero', language)}</span>
                     <select value={charId} required onChange={(event) => setCharId(event.target.value)}>
                        <option value=''>{t('Choose a hero', language)}</option>
                        {available.map((hero) => <option key={hero._id} value={hero._id}>{hero.name}</option>)}
                     </select>
                  </label>
                  <button className='primary-button' type='submit' disabled={!charId || join.isPending}>
                     <Send size={16} aria-hidden='true' />{t('Send join request', language)}</button>
               </form>}
            <p className='party-muted'>{t('The game master will see your hero live and can apply damage, conditions and AP. You choose what the other players see.', language)}</p>
         </section>}
      </section>
   </main>
}
