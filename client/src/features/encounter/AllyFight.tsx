import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HeartCrack, Shield } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { type BestiaryAttack } from '@/features/heroes/bestiaryApi'
import { CompanionAttackDialog } from '@/features/heroes/CompanionAttackDialog'
import { defenseTarget } from '@/features/heroes/combatRoll'
import { rollD20 } from '@/features/heroes/d20'
import { allyDefensePenalty } from '@/features/heroes/fightAllies'
import { RadauControls } from '@/features/heroes/FightAllySection'
import { useAllyRecords } from '@/features/heroes/allyRecords'
import { useFightStore } from '@/features/heroes/fightStore'
import { getStatsForHero } from '@/features/heroes/statsApi'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { boardDistance } from './boardGeometry'
import { defenseColor, outcomeLabels } from './combatLabels'
import { encounterKey, resolveDefense, rollRecord, submitAttack, type AllyCombatant, type Encounter, type EncounterAttack } from './encounterApi'

function useAlly(encounter: Encounter, ally: AllyCombatant) {
   const owner = encounter.combatants.find((entry) => entry.id === ally.ownerId)
   const charId = owner?.kind === 'hero' ? owner.charId : ''
   const stats = useQuery({ queryKey: ['stats', charId], queryFn: () => getStatsForHero(charId), enabled: Boolean(charId) }).data
   const local = useFightStore((state) => state.fights[charId]?.allies?.find((entry) => entry.id === ally.allyKey))
   const records = useAllyRecords(stats?._id)
   const fighter = local ? records.fighterOf(local) : null
   return { charId, stats, local, fighter, records }
}
function useEncounterMutation(partyId: string) {
   const queryClient = useQueryClient()
   return useMutation({
      mutationFn: (action: () => Promise<Encounter | null>) => action(),
      onSuccess: (next) => queryClient.setQueryData(encounterKey(partyId), next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
}
// Bestiary reach "lang" reaches 2 squares like long weapons (house rule, user decision Nov 2026)
const reachOf = (attack: BestiaryAttack) => /lang|long/i.test(attack.reach ?? '') ? 'long' : 'medium'

// The ally's own turn: pick an opponent in reach and attack; the roll, damage and sending run on their own
export function AllyTurnPanel({ encounter, partyId, ally }: { encounter: Encounter; partyId: string; ally: AllyCombatant }) {
   const language = useLanguageStore((state) => state.language)
   const mutation = useEncounterMutation(partyId)
   const { charId, stats, local, fighter } = useAlly(encounter, ally)
   const fight = useFightStore((state) => state.fights[charId])
   const [attack, setAttack] = useState<BestiaryAttack | null>(null)
   const [chosen, setChosen] = useState('')
   if (!local || !fighter || !stats || !fight) return <p className='party-muted'>{t('This ally is fought from its hero\'s fight panel on the device that brought it in.', language)}</p>
   const opponents = encounter.combatants.filter((entry) => entry.kind === 'npc' && entry.state !== 'down')
   const inReach = (entry: BestiaryAttack) => opponents.filter((npc) => {
      const distance = boardDistance(ally.position, npc.position)
      return distance !== null && distance >= 1 && distance <= (reachOf(entry) === 'long' ? 2 : 1)
   })
   const anyReach = fighter.attacks.flatMap(inReach)
   const target = anyReach.find((npc) => npc.id === chosen) ?? anyReach[0] ?? null
   const reason = encounter.openAttack ? 'Wait until the open attack is defended.' : !ally.actions.action ? 'The action of this round is already used.'
      : !target ? (ally.position ? 'Stand next to an opponent on the board to attack in melee (diagonals count).' : 'Place your token on the board to attack in melee.') : null

   return <div className='fight-dock-panel'>
      {anyReach.length > 1 && <label className='field-group fight-situation-field'>
         <span>{t('Target', language)}</span>
         <select value={target?.id ?? ''} onChange={(event) => setChosen(event.target.value)}>
            {[...new Set(anyReach)].map((npc) => <option key={npc.id} value={npc.id}>{npc.name}</option>)}
         </select>
      </label>}
      <div className='fight-options'>
         {fighter.attacks.map((entry) => {
            const blocked = reason ?? (target && !inReach(entry).includes(target) ? 'No opponent in reach.' : null)
            return <button key={entry.name} type='button' className='probe-chip fight-option' disabled={blocked !== null || mutation.isPending}
               title={blocked ? t(blocked, language) : undefined} aria-label={`${t('Roll attack', language)}: ${fighter.name}, ${entry.name}`} onClick={() => setAttack(entry)}>
               <strong>{t('AT', language)} {entry.attack - fighter.pain}</strong><small lang='de'>{entry.name}</small>
            </button>
         })}
      </div>
      {reason && <small className='fight-note'>{t(reason, language)}</small>}
      {local.source.kind === 'radau' && <RadauControls stats={stats} heroId={charId} fight={fight} ally={local}
         onEnd={() => useFightStore.getState().updateAlly(charId, local.id, null)} />}
      {attack && target && <CompanionAttackDialog fighter={fighter} attack={attack} blockedReason={null}
         onLog={(key, values) => useFightStore.getState().log(charId, key, values)} onClose={() => setAttack(null)}
         onSettled={(roll, dice) => mutation.mutate(() => submitAttack(partyId, { attackerId: ally.id, targetId: target.id, incoming: 'melee',
            attack: rollRecord(`${fighter.name} · ${attack.name}`, roll), dice, reach: reachOf(attack) }), { onSuccess: () => setAttack(null) })} />}
   </div>
}

// An attack on the ally: its owner rolls VW / PA / AW (S. 232, 354; halved after a critical, S. 231); a hit costs TP − RS on its record
export function AllyDefensePanel({ encounter, partyId, ally, attack }: { encounter: Encounter; partyId: string; ally: AllyCombatant; attack: EncounterAttack }) {
   const language = useLanguageStore((state) => state.language)
   const mutation = useEncounterMutation(partyId)
   const { charId, local, fighter } = useAlly(encounter, ally)
   const [key, setKey] = useState('')
   const [halved, setHalved] = useState(false)
   const [rolling, setRolling] = useState(false)
   const [shown, setShown] = useState<Awaited<ReturnType<typeof rollD20>> | null>(null)
   if (!local || !fighter) return <p className='party-muted'>{t('This ally is fought from its hero\'s fight panel on the device that brought it in.', language)}</p>
   const defense = fighter.defenses.find((entry) => entry.key === key) ?? fighter.defenses[0]
   const penalty = defense ? allyDefensePenalty(defense, local.defenses) : 0
   const target = defense ? defenseTarget(defense.value - fighter.pain, penalty, attack.critical) : 0
   const health = fighter.health

   // The player confirms the defense (user decision, Nov 2026); on a failure the attacker rolls the damage, the server applies TP − RS
   async function defend() {
      if (!defense) return
      setRolling(true)
      const roll = await rollD20(defenseColor, target)
      setRolling(false)
      setShown(roll)
      useFightStore.getState().updateAlly(charId, local!.id, { defenses: local!.defenses + 1 })
   }

   return <div className='fight-dock-panel'>
      <p className='fight-incoming'><strong>{attack.weapon}</strong>
         <small>{[attack.critical ? t('Critical attack: defense halved', language) : '', `${t('RS', language)} ${fighter.armor}`,
            health ? '' : t('Unbreakable', language)].filter(Boolean).join(' · ')}</small></p>
      {shown && <p className={shown.success ? 'fight-note' : 'fight-note fight-danger'} aria-live='polite'>
         {defense?.label} W20 {shown.roll} → {t(outcomeLabels[shown.outcome], language)}</p>}
      {shown && defense && <button className='primary-button' type='button' disabled={mutation.isPending}
         onClick={() => mutation.mutate(() => resolveDefense(partyId, attack.id, { defense: rollRecord(defense.label, shown), halved }))}>
         {t(shown.success ? 'Report the defense to the fight' : 'Accept the failed defense', language)}</button>}
      {fighter.creatureKind && <label className='regen-toggle'>
         <input type='checkbox' checked={halved} onChange={(event) => setHalved(event.target.checked)} />
         <span><strong>{t(fighter.creatureKind === 'demon' ? 'Mundane weapon: half TP' : 'Mundane or consecrated weapon: half TP', language)}</strong></span>
      </label>}
      {fighter.defenses.length > 1 && <div className='probe-segmented'>
         {fighter.defenses.map((entry) => <button key={entry.key} type='button' aria-pressed={entry.key === defense?.key}
            className={entry.key === defense?.key ? 'is-active' : ''} onClick={() => setKey(entry.key)}><span lang='de'>{entry.label}</span> {entry.value}</button>)}
      </div>}
      <div className='gm-actions-buttons'>
         {defense && <button className='primary-button' type='button' disabled={rolling || mutation.isPending || shown !== null || target <= 0} onClick={() => void defend()}>
            <Shield size={15} aria-hidden='true' />{defense.label} {target}</button>}
         <button className='quiet-button' type='button' disabled={rolling || mutation.isPending || shown !== null}
            onClick={() => mutation.mutate(() => resolveDefense(partyId, attack.id, { defense: null, halved }))}>
            <HeartCrack size={15} aria-hidden='true' />{t('Cannot defend', language)}</button>
      </div>
      {penalty > 0 && <small className='party-muted'>{t('−{penalty} for earlier defenses', language).replace('{penalty}', String(penalty))}</small>}
   </div>
}
