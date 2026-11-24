import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Swords } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { DashboardHeader } from '@/components/DashboardHeader'
import { BattleBoard, type TerrainTool } from '@/features/encounter/BattleBoard'
import { FightDock } from '@/features/encounter/FightDock'
import { FightLog } from '@/features/encounter/GmCombat'
import { GmTools } from '@/features/encounter/GmTools'
import { GmHeroOverview } from '@/features/encounter/GmHeroOverview'
import { CheckRequestPanel } from '@/features/parties/CheckRequestPanel'
import { InitiativeTracker } from '@/features/encounter/InitiativeTracker'
import { PreparedFights } from '@/features/encounter/PreparedFights'
import { useAllySync } from '@/features/encounter/allySync'
import { useHitEffects, usePanelMirror, usePartyFightCleanup } from '@/features/encounter/partyFightSync'
import { useHeroFightSpeed } from '@/features/encounter/useHeroFightSpeed'
import { encounterKey, startEncounter, useEncounter, type HeroCombatant } from '@/features/encounter/encounterApi'
import { useParty } from '@/features/parties/partyApi'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'

// Shared party fight (user decisions, Nov 2026): the board fills the view with the actions the fight demands on top of it;
// initiative, GM tools and the log sit beside it. Turns, attacks and defenses are driven by the server and arrive live.
export function FightPage() {
   const { partyId = '' } = useParams()
   const language = useLanguageStore((state) => state.language)
   const party = useParty(partyId)
   const query = useEncounter(partyId)
   const [selectedId, setSelectedId] = useState<string | null>(null)
   const [terrain, setTerrain] = useState<TerrainTool>(null)
   const isGm = party.data?.role === 'gm'
   const encounter = query.data
   const ownHero = (encounter?.combatants.find((combatant) => combatant.kind === 'hero' && combatant.mine) ?? null) as HeroCombatant | null
   const player = isGm ? null : ownHero
   const moveRange = useHeroFightSpeed(ownHero?.charId ?? null)
   // The hero's companions, summons and Radau join from the fight panel; hits and the end of the fight reach the panel
   useAllySync(encounter, partyId, player)
   useHitEffects(encounter, player)
   usePanelMirror(encounter, player, partyId)
   usePartyFightCleanup(partyId, !query.isSuccess || Boolean(encounter))

   return <main className='dashboard-shell' lang={language}>
      <DashboardHeader />
      <section className='dashboard-content fight-content'>
         <div className='fight-page-head'>
            <Link className='back-link' to={`/parties/${partyId}`}><ArrowLeft size={17} /> {t('Back to the party', language)}</Link>
            <h1><Swords size={20} aria-hidden='true' />{party.data ? `${t('Fight', language)}: ${party.data.name}` : t('Fight', language)}</h1>
         </div>
         {(query.isPending || party.isPending) && <div className='state-panel'>{t('Loading the fight...', language)}</div>}
         {(query.isError || party.isError) && <div className='state-panel'>{t('This fight is not available.', language)}</div>}
         {query.isSuccess && !encounter && <NoFight partyId={partyId} isGm={isGm} />}
         {encounter && <div className='fight-layout'>
            <section className='fight-board-section' aria-label={t('Battle board', language)}>
               <BattleBoard encounter={encounter} partyId={partyId} selectedId={selectedId} onSelect={setSelectedId} moveRange={moveRange}
                  terrain={isGm ? terrain : null} overlay={<FightDock encounter={encounter} partyId={partyId} ownHero={player} />} />
            </section>
            <aside className='fight-side'>
               {isGm && <GmTools encounter={encounter} scope={partyId} terrain={terrain} onTerrain={setTerrain} />}
               <section className='overview-section fight-tracker-section'>
                  <header className='section-heading'><h2>{t('Initiative', language)}</h2></header>
                  <InitiativeTracker encounter={encounter} partyId={partyId} selectedId={selectedId} onSelect={setSelectedId} />
               </section>
               {isGm && <GmHeroOverview encounter={encounter} partyId={partyId} />}
               {isGm && party.data && <CheckRequestPanel party={party.data} compact />}
               <FightLog encounter={encounter} />
            </aside>
         </div>}
      </section>
   </main>
}

function NoFight({ partyId, isGm }: { partyId: string; isGm: boolean }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const start = useMutation({
      mutationFn: () => startEncounter(partyId),
      onSuccess: (next) => queryClient.setQueryData(encounterKey(partyId), next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   return <div className='state-panel fight-none'>
      <p>{t(isGm ? 'No fight is running. Start one now (all heroes of the party join), or unlock a prepared fight.' : 'No fight is running. The game master starts it; it appears here live.', language)}</p>
      {isGm && <button className='primary-button' type='button' disabled={start.isPending} onClick={() => start.mutate()}>
         <Swords size={16} aria-hidden='true' />{t('Start fight', language)}</button>}
      {isGm && <PreparedFights partyId={partyId} />}
   </div>
}
