import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Archive, Copy, RefreshCw, Swords, UsersRound } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { DashboardHeader } from '@/components/DashboardHeader'
import { PageHeading } from '@/components/PageHeading'
import { PartyBookSettings } from '@/features/books/BookSettings'
import { CheckRequestPanel } from '@/features/parties/CheckRequestPanel'
import { OnlineDot } from '@/features/parties/OnlineDot'
import { PartyMemberCard } from '@/features/parties/PartyMemberCard'
import { usePresence } from '@/realtime/presence'
import { partiesKey, rotateInviteCode, updateParty, useParty, type Party } from '@/features/parties/partyApi'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'

export function PartyPage() {
   const { partyId = '' } = useParams()
   const language = useLanguageStore((state) => state.language)
   const query = useParty(partyId)
   const party = query.data

   return <main className='dashboard-shell' lang={language}>
      <DashboardHeader />
      <section className='dashboard-content'>
         <Link className='back-link' to='/parties'><ArrowLeft size={17} /> {t('All parties', language)}</Link>
         {query.isPending && <div className='state-panel'>{t('Loading the party...', language)}</div>}
         {query.isError && <div className='state-panel'>
            <p>{t('This party is not available. You may have left it, or the invitation was not accepted yet.', language)}</p>
            <button className='quiet-button' type='button' onClick={() => query.refetch()}>{t('Try again', language)}</button>
         </div>}
         {party && <PartyContent party={party} />}
      </section>
   </main>
}

function PartyContent({ party }: { party: Party }) {
   const language = useLanguageStore((state) => state.language)
   const isGm = party.role === 'gm'
   const pending = party.members.filter((member) => member.state === 'pending')
   const accepted = party.members.filter((member) => member.state === 'accepted')
   const ownPending = !isGm ? pending.filter((member) => member.isSelf) : []
   const presence = usePresence(party.role === 'pending' ? '' : party._id)

   return <>
      <PageHeading Icon={UsersRound} title={party.name}
         description={`${t(isGm ? 'You lead this party as game master.' : 'Game master', language)}${isGm ? '' : `: ${party.gm.username}`}`}>
         {party.role !== 'pending' && party.status === 'active' && <div className='add-hero-actions'>
            <Link className='primary-button' to={`/parties/${party._id}/fight`}><Swords size={16} aria-hidden='true' />{t('Fight & battle board', language)}</Link>
         </div>}
      </PageHeading>
      {!isGm && party.role === 'member' && presence && <p className='party-presence'>
         <OnlineDot online={presence.gmOnline} />{t(presence.gmOnline ? 'The game master is online.' : 'The game master is offline.', language)}</p>}
      {party.status === 'archived' && <p className='state-panel'>{t('This party is archived.', language)}</p>}
      {isGm && <GmPanel party={party} />}
      {party.role !== 'pending' && <PartyBookSettings party={party} />}
      {party.role !== 'pending' && party.status === 'active' && <CheckRequestPanel party={party} />}
      {isGm && pending.length > 0 && <section className='overview-section'>
         <header className='section-heading'><h2>{t('Join requests', language)}</h2></header>
         <ul className='party-grid'>{pending.map((member) => <PartyMemberCard key={member.charId} party={party} member={member} />)}</ul>
      </section>}
      {ownPending.length > 0 && <section className='overview-section'>
         <ul className='party-grid'>{ownPending.map((member) => <PartyMemberCard key={member.charId} party={party} member={member} />)}</ul>
      </section>}
      {/* Players with a pending request see only their own request until the GM answers */}
      {party.role !== 'pending' && <section className='overview-section'>
         <header className='section-heading'><h2>{t('Heroes', language)}</h2></header>
         {accepted.length === 0
            ? <p className='party-muted'>{t(isGm ? 'No heroes yet. Share the invite link with your players.' : 'No heroes have joined yet.', language)}</p>
            : <ul className='party-grid'>{accepted.map((member) => <PartyMemberCard key={member.charId} party={party} member={member} />)}</ul>}
      </section>}
   </>
}

function GmPanel({ party }: { party: Party }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const link = `${window.location.origin}/join/${party.inviteCode ?? ''}`
   const mutation = useMutation({
      mutationFn: (action: () => Promise<unknown>) => action(),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: partiesKey }),
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   async function copy() {
      try {
         await navigator.clipboard.writeText(link)
         toast.success(t('Invite link copied.', language))
      } catch {
         toast.error(t('Copying failed. Select the link and copy it by hand.', language))
      }
   }

   return <section className='overview-section party-invite'>
      <header className='section-heading'><h2>{t('Invite players', language)}</h2></header>
      <p className='party-muted'>{t('Players open the link, choose one of their heroes and send a request. You accept or deny it here.', language)}</p>
      <div className='party-invite-row'>
         <input readOnly value={link} aria-label={t('Invite link', language)} onFocus={(event) => event.target.select()} />
         <button className='primary-button' type='button' onClick={() => void copy()}><Copy size={15} aria-hidden='true' />{t('Copy link', language)}</button>
         <button className='quiet-button' type='button' disabled={mutation.isPending}
            onClick={() => { if (window.confirm(t('Create a new link? The old one stops working.', language))) mutation.mutate(() => rotateInviteCode(party._id)) }}>
            <RefreshCw size={15} aria-hidden='true' />{t('New link', language)}</button>
         <button className='quiet-button' type='button' disabled={mutation.isPending}
            onClick={() => mutation.mutate(() => updateParty(party._id, { status: party.status === 'active' ? 'archived' : 'active' }))}>
            <Archive size={15} aria-hidden='true' />{t(party.status === 'active' ? 'Archive party' : 'Reactivate party', language)}</button>
      </div>
   </section>
}
