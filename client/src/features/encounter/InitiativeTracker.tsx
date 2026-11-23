import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dices, EyeOff, Eye, HeartCrack, HeartPulse, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { throwColoredDice } from '@/components/diceEngine'
import { QuantityStepper } from '@/components/QuantityStepper'
import { heroInitiative } from '@/features/heroes/fightHelpers'
import { useFightStore } from '@/features/heroes/fightStore'
import { getStatsForHero } from '@/features/heroes/statsApi'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { damageCombatant, encounterKey, grantPassing, removeCombatant, updateCombatant, type Combatant, type Encounter, type HeroCombatant, type NpcCombatant } from './encounterApi'
import { NpcAttackForm } from './GmCombat'
import { TokenBadge } from './Token'

const stateLabels = { unhurt: 'unhurt', wounded: 'wounded', badlyWounded: 'badly wounded', down: 'down' } as const

// Initiative order (S. 226–227) with the active combatant; GM controls per row, players set their own hero's INI.
export function InitiativeTracker({ encounter, partyId, selectedId, onSelect }: {
   encounter: Encounter; partyId: string; selectedId: string | null; onSelect: (id: string | null) => void
}) {
   const language = useLanguageStore((state) => state.language)
   const isGm = encounter.role === 'gm'
   return <ol className='initiative-list'>
      {encounter.combatants.map((combatant) => <li key={combatant.id}
         className={['initiative-row', combatant.id === encounter.activeId ? 'is-active' : '', combatant.id === selectedId ? 'is-selected' : ''].filter(Boolean).join(' ')}
         aria-current={combatant.id === encounter.activeId ? 'step' : undefined}>
         <button className='initiative-row-main' type='button' aria-pressed={combatant.id === selectedId}
            onClick={() => onSelect(selectedId === combatant.id ? null : combatant.id)}>
            <TokenBadge combatant={combatant} />
            <span className='initiative-name'>
               <strong>{combatant.name}</strong>
               <small>{combatant.kind === 'npc'
                  ? <>{t(stateLabels[combatant.state], language)}{isGm && combatant.npc && ` · ${combatant.npc.health} / ${combatant.npc.maxHealth} ${t('LeP', language)}`}{combatant.hidden && ` · ${t('hidden', language)}`}</>
                  : combatant.kind === 'ally' ? `${t('Ally', language)} · ${encounter.combatants.find((entry) => entry.id === combatant.ownerId)?.name ?? '?'}`
                  : combatant.mine ? t('your hero', language) : t('Hero', language)}</small>
            </span>
            <span className='initiative-value' aria-label={t('Initiative', language)}>{combatant.initiative ?? '—'}</span>
         </button>
         {combatant.id === selectedId && (isGm || (combatant.canControl && encounter.round < 1)) && <div className='initiative-controls'>
            {combatant.kind === 'hero' && combatant.mine && encounter.round < 1 && <OwnInitiative combatant={combatant} partyId={partyId} />}
            {isGm && <GmControls combatant={combatant} partyId={partyId} encounter={encounter} />}
         </div>}
      </li>)}
   </ol>
}

function useEncounterMutation(partyId: string) {
   const queryClient = useQueryClient()
   return useMutation({
      mutationFn: (action: () => Promise<Encounter | null>) => action(),
      onSuccess: (next) => queryClient.setQueryData(encounterKey(partyId), next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
}

// source: DSA5 Regelwerk, S. 226 (INI = Basiswert + 1W6 ± modifiers, rolled once per fight)
function OwnInitiative({ combatant, partyId }: { combatant: HeroCombatant; partyId: string }) {
   const language = useLanguageStore((state) => state.language)
   const mutation = useEncounterMutation(partyId)
   const stats = useQuery({ queryKey: ['stats', combatant.charId], queryFn: () => getStatsForHero(combatant.charId) })
   const panelFight = useFightStore((state) => state.fights[combatant.charId])
   const [manual, setManual] = useState(combatant.initiative ?? 10)
   const ini = stats.data ? heroInitiative(stats.data) : null
   const send = (initiative: number, initiativeBase: number) => mutation.mutate(() => updateCombatant(partyId, combatant.id, { initiative, initiativeBase }))

   async function roll() {
      if (!ini) return
      const [die] = await throwColoredDice(6, ['#b7791f'])
      send(ini.base + ini.modifier + die, ini.base)
      toast.success(`${t('INI', language)} ${ini.base + ini.modifier + die} (${ini.base}${ini.modifier ? ` ${ini.modifier > 0 ? '+' : ''}${ini.modifier}` : ''} + W6 ${die})`)
   }

   return <div className='initiative-own'>
      <button className='primary-button' type='button' disabled={!ini || mutation.isPending} onClick={() => void roll()}>
         <Dices size={15} aria-hidden='true' />{t('Roll INI', language)}{ini && ` (${ini.base}${ini.modifier ? ` ${ini.modifier > 0 ? '+' : ''}${ini.modifier}` : ''} + 1W6)`}</button>
      {panelFight && ini && <button className='quiet-button' type='button' disabled={mutation.isPending}
         onClick={() => send(panelFight.initiative.base + panelFight.initiative.modifier + panelFight.initiative.roll, panelFight.initiative.base)}>
         {t('Use INI from the fight panel', language)} ({panelFight.initiative.base + panelFight.initiative.modifier + panelFight.initiative.roll})</button>}
      <div className='initiative-manual'>
         <QuantityStepper value={manual} min={-20} max={60} label={t('Initiative', language)} onChange={setManual} />
         <button className='quiet-button' type='button' disabled={mutation.isPending} onClick={() => send(manual, ini?.base ?? 0)}>{t('Set', language)}</button>
      </div>
   </div>
}

function GmControls({ combatant, partyId, encounter }: { combatant: Combatant; partyId: string; encounter: Encounter }) {
   const language = useLanguageStore((state) => state.language)
   const mutation = useEncounterMutation(partyId)
   const [ini, setIni] = useState(combatant.initiative ?? 10)
   const [amount, setAmount] = useState(5)
   const [ignoreArmor, setIgnoreArmor] = useState(false)
   const npc = combatant.kind === 'npc' ? (combatant as NpcCombatant) : null
   const busy = mutation.isPending

   return <div className='initiative-gm'>
      <div className='initiative-manual'>
         <span>{t('Initiative', language)}</span>
         <QuantityStepper value={ini} min={-20} max={60} label={`${t('Initiative', language)}: ${combatant.name}`} onChange={setIni} />
         <button className='quiet-button' type='button' disabled={busy} onClick={() => mutation.mutate(() => updateCombatant(partyId, combatant.id, { initiative: ini }))}>{t('Set', language)}</button>
      </div>
      {npc?.npc && <>
         <dl className='initiative-stats'>
            <div><dt>{t('LeP', language)}</dt><dd>{npc.npc.health} / {npc.npc.maxHealth}</dd></div>
            <div><dt>{t('RS', language)}</dt><dd>{npc.npc.armor}</dd></div>
            {npc.npc.attack !== null && <div><dt>{t('AT', language)}</dt><dd>{npc.npc.attack}</dd></div>}
            {npc.npc.parry !== null && <div><dt>{t('PA', language)}</dt><dd>{npc.npc.parry}</dd></div>}
            {npc.npc.defense !== null && <div><dt>{t('VW', language)}</dt><dd>{npc.npc.defense}</dd></div>}
            {npc.npc.dodge !== null && <div><dt>{t('AW', language)}</dt><dd>{npc.npc.dodge}</dd></div>}
            {npc.npc.damage && <div><dt>{t('TP', language)}</dt><dd>{npc.npc.damage}</dd></div>}
            {npc.npc.speed !== null && <div><dt>{t('GS', language)}</dt><dd>{npc.npc.speed}</dd></div>}
         </dl>
         {npc.npc.notes && <p className='party-muted'>{npc.npc.notes}</p>}
         {encounter.round >= 1 && npc.state !== 'down' && <details className='battle-dock-more'>
            <summary>{t('Passierschlag (AT −4, no action, no defense)', language)}</summary>
            <NpcAttackForm encounter={encounter} partyId={partyId} npc={npc} passing />
         </details>}
         <div className='initiative-manual'>
            <span>{t('TP / LeP', language)}</span>
            <QuantityStepper value={amount} min={1} max={999} label={`${t('Amount', language)}: ${combatant.name}`} onChange={setAmount} />
         </div>
         <label className='initiative-check'>
            <input type='checkbox' checked={ignoreArmor} onChange={(event) => setIgnoreArmor(event.target.checked)} />
            {t('Ignore armor (RS)', language)}
         </label>
         <div className='gm-actions-buttons'>
            <button className='quiet-button' type='button' disabled={busy}
               onClick={() => mutation.mutate(() => damageCombatant(partyId, combatant.id, { direction: 'damage', amount, ignoreArmor }))}>
               <HeartCrack size={15} aria-hidden='true' />{t(ignoreArmor ? 'Damage' : 'Hit (TP − RS)', language)}</button>
            <button className='quiet-button' type='button' disabled={busy}
               onClick={() => mutation.mutate(() => damageCombatant(partyId, combatant.id, { direction: 'heal', amount, ignoreArmor: false }))}>
               <HeartPulse size={15} aria-hidden='true' />{t('Heal', language)}</button>
            <button className='quiet-button' type='button' disabled={busy} aria-pressed={Boolean(npc.hidden)}
               onClick={() => mutation.mutate(() => updateCombatant(partyId, combatant.id, { hidden: !npc.hidden }))}>
               {npc.hidden ? <Eye size={15} aria-hidden='true' /> : <EyeOff size={15} aria-hidden='true' />}{t(npc.hidden ? 'Reveal to players' : 'Hide from players', language)}</button>
         </div>
      </>}
      {combatant.kind === 'hero' && <p className='party-muted'>{t('Damage heroes through the GM actions in the party (it changes their sheet).', language)}</p>}
      {combatant.kind !== 'npc' && encounter.round >= 1 && <GrantPassing combatant={combatant} encounter={encounter} partyId={partyId} />}
      <button className='quiet-button' type='button' disabled={busy}
         onClick={() => { if (window.confirm(t('Remove this combatant from the fight?', language))) mutation.mutate(() => removeCombatant(partyId, combatant.id)) }}>
         <Trash2 size={15} aria-hidden='true' />{t('Remove from the fight', language)}</button>
   </div>
}

// The GM grants a Passierschlag (fleeing opponent, failed manoeuvre, running through the reach; S. 237). A critical parry
// grants one on its own.
function GrantPassing({ combatant, encounter, partyId }: { combatant: Combatant; encounter: Encounter; partyId: string }) {
   const language = useLanguageStore((state) => state.language)
   const mutation = useEncounterMutation(partyId)
   const opponents = encounter.combatants.filter((entry) => entry.kind === 'npc' && entry.state !== 'down')
   const [chosen, setChosen] = useState('')
   const targetId = opponents.find((entry) => entry.id === chosen)?.id ?? opponents[0]?.id ?? ''
   if (!opponents.length) return null
   return <div className='initiative-manual'>
      <label className='field-group'><span>{t('Passierschlag against', language)}</span>
         <select value={targetId} onChange={(event) => setChosen(event.target.value)}>
            {opponents.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
         </select></label>
      <button className='quiet-button' type='button' disabled={mutation.isPending || !targetId}
         onClick={() => mutation.mutate(() => grantPassing(partyId, combatant.id, targetId), {
            onSuccess: () => toast.success(t('{name} may strike a Passierschlag.', language).replace('{name}', combatant.name)),
         })}>{t('Allow Passierschlag', language)}</button>
   </div>
}
