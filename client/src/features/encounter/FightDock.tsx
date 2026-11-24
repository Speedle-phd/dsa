import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Columns2, Expand, GripVertical, Hourglass, Maximize2, Minimize2, PanelTop, Shield, Shrink, SkipForward, Swords } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { toast } from 'sonner'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { changeTurn, encounterKey, endTurn, type Actions, type Encounter, type HeroCombatant } from './encounterApi'
import { AllyDefensePanel, AllyTurnPanel } from './AllyFight'
import { BlutrauschOffer } from './BlutrauschOffer'
import { DamageRollPanel, FightLog, NpcAttackForm, OpenAttackPanel } from './GmCombat'
import { NpcFightHints } from './NpcFightHints'
import { clampWindow, useFightWindow } from './fightWindow'
import { HeroFightSection } from './HeroFightSection'

type Tone = 'turn' | 'defend' | 'wait'

// The actions the fight demands right now, on top of the battle board (user decision, Nov 2026): the attack panel only on the
// own turn with the action left, the defense panel only while the own hero is attacked, otherwise who the fight waits for.
export function FightDock({ encounter, partyId, ownHero }: { encounter: Encounter; partyId: string; ownHero: HeroCombatant | null }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const { position, minimized, size, place, setMinimized, setSize } = useFightWindow()
   const full = size === 'full'
   const windowRef = useRef<HTMLElement>(null)
   const [drag, setDrag] = useState<{ pointerId: number; dx: number; dy: number; at: { x: number; y: number } } | null>(null)
   const mutation = useMutation({
      mutationFn: (action: () => Promise<Encounter | null>) => action(),
      onSuccess: (next) => queryClient.setQueryData(encounterKey(partyId), next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const isGm = encounter.role === 'gm'
   const name = (id: string | undefined) => encounter.combatants.find((entry) => entry.id === id)?.name ?? '?'
   const active = encounter.combatants.find((entry) => entry.id === encounter.activeId) ?? null
   const open = encounter.openAttack
   const openAttack = open ? encounter.attacks.find((attack) => (attack.status === 'pending' || attack.status === 'damage')
      && attack.targetId === open.targetId && attack.attackerId === open.attackerId) : undefined
   const defenseStage = open?.stage === 'defense'
   // Who rolls the damage after a failed defense: the GM for NPCs, the owner for heroes and allies
   const attackerKind = encounter.combatants.find((entry) => entry.id === open?.attackerId)?.kind
   const rollsDamage = open?.stage === 'damage' && openAttack && (isGm ? attackerKind === 'npc' : openAttack.byMe)
   // The fight begins only when everyone has rolled the INI (user decision, Nov 2026)
   const missingIni = encounter.combatants.filter((entry) => entry.initiative === null)
   const fill = (key: string, values: Record<string, string>) => Object.entries(values).reduce((text, [k, v]) => text.replace(`{${k}}`, v), t(key, language))

   // Passierschläge open for the player's own hero (critical parry or granted by the GM, S. 237)
   const grants = ownHero ? encounter.passingGrants.filter((grant) => grant.combatantId === ownHero.id) : []
   const myAlly = (id: string) => {
      const entry = encounter.combatants.find((combatant) => combatant.id === id)
      return entry?.kind === 'ally' && entry.mine ? entry : null
   }
   const endTurnButton = (label = 'End turn') => <button className='quiet-button' type='button' disabled={mutation.isPending}
      onClick={() => mutation.mutate(() => endTurn(partyId))}><SkipForward size={15} aria-hidden='true' />{t(label, language)}</button>

   let tone: Tone = 'wait'
   let title: string
   let body: React.ReactNode

   if (!isGm && ownHero && ownHero.initiative === null) {
      tone = 'turn'
      title = t('Roll your initiative', language)
      body = <HeroFightSection encounter={encounter} partyId={partyId} combatant={ownHero} view='attack' />
   } else if (!isGm && ownHero && defenseStage && open?.targetId === ownHero.id) {
      tone = 'defend'
      title = fill('{attacker} attacks you!', { attacker: name(open.attackerId) })
      body = <HeroFightSection encounter={encounter} partyId={partyId} combatant={ownHero} view='defense' />
   } else if (!isGm && open && defenseStage && myAlly(open.targetId) && openAttack) {
      tone = 'defend'
      title = fill('{attacker} attacks {target}!', { attacker: name(open.attackerId), target: name(open.targetId) })
      body = <AllyDefensePanel key={openAttack.id} encounter={encounter} partyId={partyId} ally={myAlly(open.targetId)!} attack={openAttack} />
   } else if (encounter.round < 1) {
      title = t(isGm ? 'Set up the fight' : 'The fight begins soon', language)
      body = <>
         <p className='party-muted'>{t(isGm ? 'Place the tokens, paint terrain and roll the INI of the opponents. Then begin round 1.'
            : 'Place your token on the board. The GM begins round 1 once everyone has the INI.', language)}</p>
         {missingIni.length > 0 && <p className='party-muted'>{t('Waiting for the INI of: {names}', language).replace('{names}', missingIni.map((entry) => entry.name).join(', '))}</p>}
         {isGm && <button className='primary-button' type='button' disabled={mutation.isPending || missingIni.length > 0} onClick={() => mutation.mutate(() => changeTurn(partyId, 'next'))}>
            {t('Begin round 1', language)}<ChevronRight size={16} aria-hidden='true' /></button>}
      </>
   } else if (open && rollsDamage && openAttack) {
      tone = 'turn'
      title = t('Hit! Roll the damage', language)
      body = <DamageRollPanel key={openAttack.id} encounter={encounter} partyId={partyId} attack={openAttack} />
   } else if (open && !defenseStage) {
      title = fill('{attacker} rolls the damage against {target}', { attacker: name(open.attackerId), target: name(open.targetId) })
      body = <>
         <p className='party-muted'>{t('The defense failed.', language)}</p>
         {isGm && openAttack && <OpenAttackPanel key={openAttack.id} attack={openAttack} encounter={encounter} partyId={partyId} />}
      </>
   } else if (open) {
      tone = isGm && openAttack && encounter.combatants.find((entry) => entry.id === open.targetId)?.kind === 'npc' ? 'defend' : 'wait'
      title = fill('{attacker} attacks {target}', { attacker: name(open.attackerId), target: name(open.targetId) })
      body = isGm && openAttack ? <OpenAttackPanel key={openAttack.id} attack={openAttack} encounter={encounter} partyId={partyId} />
         : <p className='party-muted'>{fill('Waiting for {name} to defend.', { name: name(open.targetId) })}</p>
   } else if (!isGm && ownHero && grants.length > 0 && active?.id !== ownHero.id) {
      // A Passierschlag is open (S. 237): it needs no action and comes outside the own turn
      tone = 'turn'
      title = t('Passierschlag possible', language)
      body = <p className='party-muted'>{t(grants.some((grant) => grant.reason === 'parry') ? 'Your critical parry allows a Passierschlag against {target}.'
         : 'The GM allows a Passierschlag against {target}.', language).replace('{target}', grants.map((grant) => name(grant.targetId)).join(', '))}</p>
   } else if (active && !isGm && active.id === ownHero?.id && ownHero) {
      tone = 'turn'
      title = t('Your turn', language)
      body = <>
         <ActionChips actions={ownHero.actions} />
         <p className='party-muted'>{t(ownHero.actions.bonus ? 'Flucht: drag your token up to the marked squares.'
            : ownHero.actions.dual ? 'Second weapon: strike with it now or end the turn.'
            : ownHero.actions.free ? 'Move first if you like (drag your token): your action ends the turn.' : 'Your action ends the turn.', language)}</p>
         {(ownHero.actions.action || ownHero.actions.dual) && <HeroFightSection encounter={encounter} partyId={partyId} combatant={ownHero} view='attack' />}
         {endTurnButton()}
      </>
   } else if (active && !isGm && active.kind === 'ally' && active.mine) {
      tone = 'turn'
      title = fill('{name} acts', { name: active.name })
      body = <>
         <ActionChips actions={active.actions} />
         <p className='party-muted'>{t('Move it first if you like (drag its token): its attack ends the turn.', language)}</p>
         {active.actions.action && <AllyTurnPanel key={active.id} encounter={encounter} partyId={partyId} ally={active} />}
         {endTurnButton()}
      </>
   } else if (active && isGm && active.kind === 'npc') {
      tone = 'turn'
      title = fill('{name} acts', { name: active.name })
      body = <>
         <ActionChips actions={active.actions} />
         <p className='party-muted'>{t('Drag the token to move it. The attack ends the turn.', language)}</p>
         {active.npc && <NpcFightHints values={active.npc} />}
         {active.actions.action && <NpcAttackForm key={active.id} encounter={encounter} partyId={partyId} npc={active} />}
         {endTurnButton()}
      </>
   } else if (active) {
      title = fill('{name}\'s turn', { name: active.name })
      body = <>
         <p className='party-muted'>{t(isGm ? 'Waiting for the player. You can end the turn for them.' : 'Wait for your turn.', language)}</p>
         {isGm && endTurnButton('End this turn')}
      </>
   } else {
      title = t('No one is acting', language)
      body = isGm ? <button className='primary-button' type='button' disabled={mutation.isPending} onClick={() => mutation.mutate(() => changeTurn(partyId, 'next'))}>
         {t('Next turn', language)}<ChevronRight size={16} aria-hidden='true' /></button> : null
   }

   // A minimized window opens by itself when the fight needs this viewer (own turn, defense)
   const attention = tone === 'wait' ? null : `${tone}:${title}`
   useEffect(() => {
      if (attention) useFightWindow.getState().setMinimized(false)
   }, [attention])

   // Dragging by the title bar; the position is relative to the board area and kept on it
   function areaOf() {
      const element = windowRef.current
      const area = element?.offsetParent as HTMLElement | null
      return element && area ? { element, area: { width: area.clientWidth, height: area.clientHeight }, size: { width: element.offsetWidth, height: element.offsetHeight } } : null
   }
   function onPointerDown(event: PointerEvent<HTMLElement>) {
      const target = event.target as HTMLElement
      if (event.button !== 0 || (target.closest('button') && !target.closest('.battle-dock-grip'))) return
      const box = areaOf()
      if (!box || full || getComputedStyle(box.element).position !== 'absolute') return
      event.currentTarget.setPointerCapture(event.pointerId)
      const at = { x: box.element.offsetLeft, y: box.element.offsetTop }
      setDrag({ pointerId: event.pointerId, dx: event.clientX - at.x, dy: event.clientY - at.y, at })
   }
   function onPointerMove(event: PointerEvent<HTMLElement>) {
      const box = areaOf()
      if (!drag || drag.pointerId !== event.pointerId || !box) return
      setDrag({ ...drag, at: clampWindow({ x: event.clientX - drag.dx, y: event.clientY - drag.dy }, box.area, box.size) })
   }
   function onPointerUp(event: PointerEvent<HTMLElement>) {
      if (!drag || drag.pointerId !== event.pointerId) return
      place(drag.at)
      setDrag(null)
   }
   // Keyboard alternative (WCAG 2.5.7): arrow keys move the window, Home puts it back
   // Escape leaves the fullscreen mode
   useEffect(() => {
      if (!full) return
      const leave = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') useFightWindow.getState().setSize('wide') }
      window.addEventListener('keydown', leave)
      return () => window.removeEventListener('keydown', leave)
   }, [full])
   function onGripKey(event: KeyboardEvent<HTMLButtonElement>) {
      const steps: Record<string, [number, number]> = { ArrowLeft: [-32, 0], ArrowRight: [32, 0], ArrowUp: [0, -32], ArrowDown: [0, 32] }
      if (event.key === 'Home') {
         event.preventDefault()
         place(null)
         return
      }
      const step = steps[event.key]
      const box = areaOf()
      if (!step || !box) return
      event.preventDefault()
      place(clampWindow({ x: box.element.offsetLeft + step[0], y: box.element.offsetTop + step[1] }, box.area, box.size))
   }

   const at = full ? null : drag?.at ?? position
   // The rest of the player's fight panel is always at hand in the window (user decision: everything in one panel);
   // a Passierschlag needs no action and may come outside the own turn (S. 237)
   const fighting = !isGm && ownHero && ownHero.initiative !== null
   const more = fighting && <>
      <BlutrauschOffer heroId={ownHero.charId} />
      {grants.length > 0 && !open && tone !== 'defend' && <details className='battle-dock-more is-passing' open>
         <summary>{t('Passierschlag against {target} (AT −4, no action, no defense)', language).replace('{target}', grants.map((grant) => name(grant.targetId)).join(', '))}</summary>
         <HeroFightSection encounter={encounter} partyId={partyId} combatant={ownHero} view='passing' />
      </details>}
      <details className='battle-dock-more' open={size !== 'compact'}>
         <summary>{t('Status, stances, Schips, situation, manual hits', language)}</summary>
         <HeroFightSection encounter={encounter} partyId={partyId} combatant={ownHero} view='extras' />
      </details>
   </>
   const Icon = tone === 'defend' ? Shield : tone === 'turn' ? Swords : Hourglass
   return <section ref={windowRef} className={['battle-dock', `is-${tone}`, `is-${size}`, at ? 'is-placed' : '', minimized ? 'is-minimized' : '', drag ? 'is-dragging' : ''].filter(Boolean).join(' ')}
      role={full ? 'dialog' : undefined} aria-modal={full ? true : undefined}
      aria-labelledby='battle-dock-title' style={at ? { '--dock-x': `${at.x}px`, '--dock-y': `${at.y}px` } as React.CSSProperties : undefined}>
      <header className='battle-dock-head' onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => setDrag(null)}>
         <button className='icon-button battle-dock-grip' type='button' onKeyDown={onGripKey}
            aria-label={t('Move the fight window (arrow keys, Home resets)', language)} title={t('Drag to move', language)}>
            <GripVertical size={18} aria-hidden='true' /></button>
         <Icon size={18} aria-hidden='true' />
         <div aria-live='polite'>
            <p className='eyebrow'>{t('Combat round', language)} {Math.max(1, encounter.round)}{active && encounter.round >= 1 ? ` · ${active.name}` : ''}</p>
            <h2 id='battle-dock-title'>{title}</h2>
         </div>
         <div className='battle-dock-tools'>
            {!full && !minimized && <button className='icon-button battle-dock-width' type='button' aria-pressed={size === 'wide'}
               aria-label={t(size === 'wide' ? 'Narrow fight window' : 'Wide fight window (two columns)', language)} title={t(size === 'wide' ? 'Narrow fight window' : 'Wide fight window (two columns)', language)}
               onClick={() => setSize(size === 'wide' ? 'compact' : 'wide')}>{size === 'wide' ? <PanelTop size={17} aria-hidden='true' /> : <Columns2 size={17} aria-hidden='true' />}</button>}
            {!minimized && <button className='icon-button' type='button' aria-pressed={full}
               aria-label={t(full ? 'Leave fullscreen (Esc)' : 'Fullscreen', language)} title={t(full ? 'Leave fullscreen (Esc)' : 'Fullscreen', language)}
               onClick={() => setSize(full ? 'wide' : 'full')}>{full ? <Shrink size={17} aria-hidden='true' /> : <Expand size={17} aria-hidden='true' />}</button>}
            {!full && <button className='icon-button' type='button' aria-expanded={!minimized} aria-controls='battle-dock-body'
               aria-label={t(minimized ? 'Open the fight window' : 'Minimize the fight window', language)} onClick={() => setMinimized(!minimized)}>
               {minimized ? <Maximize2 size={17} aria-hidden='true' /> : <Minimize2 size={17} aria-hidden='true' />}</button>}
         </div>
      </header>
      {/* Columns as the width allows: the current action | the rest of the panel | the fight log (fullscreen) */}
      <div id='battle-dock-body' className='battle-dock-body' hidden={minimized && !full}>
         <div className='battle-dock-column'>{body}</div>
         {more && <div className='battle-dock-column'>{more}</div>}
         {full && <div className='battle-dock-column'><FightLog encounter={encounter} /></div>}
      </div>
   </section>
}

// What is left of the Kampfrunde: 1 action + 1 free action (S. 228)
function ActionChips({ actions }: { actions: Actions }) {
   const language = useLanguageStore((state) => state.language)
   return <p className='battle-actions'>
      <span className={actions.action ? 'is-open' : 'is-used'}>{t('Action', language)}: {t(actions.action ? 'open' : 'used', language)}</span>
      <span className={actions.free ? 'is-open' : 'is-used'}>{t('Free action', language)}: {t(actions.free ? 'open' : 'used', language)}</span>
   </p>
}
