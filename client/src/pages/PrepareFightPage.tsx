import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, EyeOff, Unlock } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { DashboardHeader } from '@/components/DashboardHeader'
import { BattleBoard, type TerrainTool } from '@/features/encounter/BattleBoard'
import { GmTools } from '@/features/encounter/GmTools'
import { InitiativeTracker } from '@/features/encounter/InitiativeTracker'
import { activatePrepared, encounterKey, preparedKey, preparedScope, useEncounter } from '@/features/encounter/encounterApi'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'

// The GM prepares a fight in advance (user decision, Nov 2026): opponents, terrain and starting positions; the players
// do not see it until it is unlocked.
export function PrepareFightPage() {
   const { partyId = '', encounterId = '' } = useParams()
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const navigate = useNavigate()
   const scope = preparedScope(partyId, encounterId)
   const query = useEncounter(scope)
   const [selectedId, setSelectedId] = useState<string | null>(null)
   const [terrain, setTerrain] = useState<TerrainTool>(null)
   const encounter = query.data
   const unlock = useMutation({
      mutationFn: () => activatePrepared(partyId, encounterId),
      onSuccess: (next) => {
         queryClient.setQueryData(encounterKey(partyId), next)
         void queryClient.invalidateQueries({ queryKey: preparedKey(partyId) })
         navigate(`/parties/${partyId}/fight`)
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   return <main className='dashboard-shell' lang={language}>
      <DashboardHeader />
      <section className='dashboard-content fight-content'>
         <div className='fight-page-head'>
            <Link className='back-link' to={`/parties/${partyId}/fight`}><ArrowLeft size={17} /> {t('Back to the fight', language)}</Link>
            <h1><EyeOff size={20} aria-hidden='true' />{t('Prepare a fight', language)}{encounter?.name ? `: ${encounter.name}` : ''}</h1>
            {encounter && <button className='primary-button' type='button' disabled={unlock.isPending} onClick={() => unlock.mutate()}>
               <Unlock size={16} aria-hidden='true' />{t('Unlock for the players', language)}</button>}
         </div>
         {query.isPending && <div className='state-panel'>{t('Loading the fight...', language)}</div>}
         {query.isError && <div className='state-panel'>{t('This fight is not available.', language)}</div>}
         {encounter && <>
            <p className='party-muted'>{t('Only you see this fight. Place the opponents and the heroes\' starting squares, paint terrain; unlock it when the fight begins.', language)}</p>
            <div className='fight-layout'>
               <section className='fight-board-section' aria-label={t('Battle board', language)}>
                  <BattleBoard encounter={encounter} partyId={scope} selectedId={selectedId} onSelect={setSelectedId} moveRange={null} terrain={terrain} />
               </section>
               <aside className='fight-side'>
                  <GmTools encounter={encounter} scope={scope} terrain={terrain} onTerrain={setTerrain} mode='prepare' />
                  <section className='overview-section fight-tracker-section'>
                     <header className='section-heading'><h2>{t('Combatants', language)}</h2></header>
                     <InitiativeTracker encounter={encounter} partyId={scope} selectedId={selectedId} onSelect={setSelectedId} />
                  </section>
               </aside>
            </div>
         </>}
      </section>
   </main>
}
