import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Dices, Eraser, Flag, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import type { TerrainTool } from './BattleBoard'
import { changeTurn, encounterKey, endEncounter, obstacleKinds, resizeBoard, rollNpcInitiative, type Encounter } from './encounterApi'
import { NpcForm } from './NpcForm'
import { obstacleLabels } from './obstacleLabels'
import { PreparedFights } from './PreparedFights'

// GM tools beside the board, folded away when not needed: turns, opponents, NPC INI, terrain, board size, end.
// `scope` is the party id (running fight) or a prepared fight's scope; mode 'prepare' leaves out turns and the end.
export function GmTools({ encounter, scope, terrain, onTerrain, mode = 'fight' }: {
   encounter: Encounter; scope: string; terrain: TerrainTool; onTerrain: (tool: TerrainTool) => void; mode?: 'fight' | 'prepare'
}) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const [adding, setAdding] = useState(false)
   const [size, setSize] = useState(encounter.board)
   const unchanged = size.width === encounter.board.width && size.height === encounter.board.height && size.scale === encounter.board.scale
   const mutation = useMutation({
      mutationFn: (action: () => Promise<Encounter | null>) => action(),
      onSuccess: (next) => queryClient.setQueryData(encounterKey(scope), next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const busy = mutation.isPending
   const npcs = encounter.combatants.filter((combatant) => combatant.kind === 'npc')
   const missingIni = npcs.filter((combatant) => combatant.initiative === null).length
   // INI is rolled once per fight (S. 226): the button rolls only opponents without INI and says why it is off
   const iniHint = npcs.length === 0 ? 'Add opponents first.' : missingIni === 0 ? 'All opponents have their INI.' : null
   const locked = encounter.openAttack !== null
   // The fight begins only when every combatant has its INI (user decision, Nov 2026)
   const waiting = encounter.combatants.filter((combatant) => combatant.initiative === null)
   const beginBlocked = !encounter.activeId && waiting.length > 0

   return <details className='overview-section fight-gm-tools' open>
      <summary>{t(mode === 'prepare' ? 'Prepare the fight' : 'Game master tools', language)}</summary>
      <div className='fight-toolbar'>
         {mode === 'fight' && <>
            <div className='fight-toolbar-row'>
               <button className='quiet-button' type='button' disabled={busy || locked || !encounter.activeId} onClick={() => mutation.mutate(() => changeTurn(scope, 'previous'))}>
                  <ChevronLeft size={16} aria-hidden='true' />{t('Previous', language)}</button>
               <button className='quiet-button' type='button' disabled={busy || locked || beginBlocked} aria-describedby='fight-begin-hint'
                  onClick={() => mutation.mutate(() => changeTurn(scope, 'next'))}>
                  {t(encounter.activeId ? 'Next turn' : 'Begin round 1', language)}<ChevronRight size={16} aria-hidden='true' /></button>
            </div>
            {locked && <small className='party-muted'>{t('An open attack holds the fight: defend or cancel it first.', language)}</small>}
            {beginBlocked && <small id='fight-begin-hint' className='party-muted'>
               {t('Waiting for the INI of: {names}', language).replace('{names}', waiting.map((combatant) => combatant.name).join(', '))}</small>}
         </>}
         <div className='fight-toolbar-row'>
            <button className='quiet-button' type='button' disabled={busy} onClick={() => setAdding(!adding)} aria-expanded={adding}>
               <Plus size={16} aria-hidden='true' />{t('Add opponents', language)}</button>
            <button className='quiet-button' type='button' disabled={busy || iniHint !== null} aria-describedby='npc-ini-hint'
               onClick={() => mutation.mutate(() => rollNpcInitiative(scope, true), {
                  onSuccess: () => toast.success(t('INI rolled for {count} opponents.', language).replace('{count}', String(missingIni))),
               })}>
               <Dices size={16} aria-hidden='true' />{t('Roll NPC INI', language)}{missingIni > 0 && ` (${missingIni})`}</button>
         </div>
         {iniHint && <small id='npc-ini-hint' className='party-muted'>{t(iniHint, language)}</small>}
         {adding && <NpcForm partyId={scope} heroes={encounter.combatants.filter((entry) => entry.kind === 'hero').length} onDone={() => setAdding(false)} />}
         <fieldset className='fight-terrain'>
            <legend>{t('Terrain', language)}</legend>
            <div className='fight-toolbar-row'>
               {obstacleKinds.map((kind) => <button key={kind} type='button' aria-pressed={terrain === kind}
                  className={terrain === kind ? 'probe-chip is-active' : 'probe-chip'} onClick={() => onTerrain(terrain === kind ? null : kind)}>
                  <span className={`terrain-swatch obstacle-${kind}`} aria-hidden='true' />{t(obstacleLabels[kind], language)}</button>)}
               <button type='button' aria-pressed={terrain === 'erase'} className={terrain === 'erase' ? 'probe-chip is-active' : 'probe-chip'}
                  onClick={() => onTerrain(terrain === 'erase' ? null : 'erase')}><Eraser size={15} aria-hidden='true' />{t('Erase', language)}</button>
            </div>
            <small className='party-muted'>{t(terrain ? 'Painting: drag over the board. Choose the tool again to stop.' : 'Terrain blocks movement only.', language)}</small>
         </fieldset>
         <form className='fight-toolbar-row fight-board-size' onSubmit={(event) => { event.preventDefault(); mutation.mutate(() => resizeBoard(scope, size)) }}>
            <label>{t('Width', language)} <input type='number' min={5} max={60} value={size.width}
               onChange={(event) => setSize({ ...size, width: Math.min(60, Math.max(5, Math.trunc(event.target.valueAsNumber) || 5)) })} /></label>
            <label>{t('Height', language)} <input type='number' min={5} max={60} value={size.height}
               onChange={(event) => setSize({ ...size, height: Math.min(60, Math.max(5, Math.trunc(event.target.valueAsNumber) || 5)) })} /></label>
            <label>{t('Schritt per square', language)} <input type='number' min={1} max={10} value={size.scale}
               onChange={(event) => setSize({ ...size, scale: Math.min(10, Math.max(1, Math.trunc(event.target.valueAsNumber) || 1)) })} /></label>
            <button className='quiet-button' type='submit' disabled={busy || unchanged}>{t('Apply', language)}</button>
            <small>{t('1 square = {n} Schritt: moves cover GS ÷ {n} squares, ranged distances count squares × {n}.', language).replace(/\{n\}/g, String(encounter.board.scale))}</small>
         </form>
         {mode === 'fight' && <>
            <button className='quiet-button' type='button' disabled={busy}
               onClick={() => { if (window.confirm(t('End the fight for everyone? It is deleted with its board and log.', language))) mutation.mutate(() => endEncounter(scope)) }}>
               <Flag size={16} aria-hidden='true' />{t('End fight', language)}</button>
            <PreparedFights partyId={scope} running />
         </>}
      </div>
   </details>
}
