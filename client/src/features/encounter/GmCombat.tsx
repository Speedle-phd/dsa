import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, Crosshair, Dices, Shield, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { QuantityStepper } from '@/components/QuantityStepper'
import { hitPoints, parseDamage, type D20Roll } from '@/features/heroes/combatRoll'
import { rollD20 } from '@/features/heroes/d20'
import { rollDamage } from '@/features/heroes/fightHelpers'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { attackColor, defenseColor, logText, npcDefenseTarget, outcomeLabels } from './combatLabels'
import { inMeleeReach } from './boardGeometry'
import { FateDamageReroll } from '@/features/heroes/FateActions'
import { getStatsForHero } from '@/features/heroes/statsApi'
import { cancelAttack, encounterKey, resolveDefense, rollAttackDamage, rollRecord, submitAttack, type Encounter, type EncounterAttack, type Incoming, type NpcCombatant } from './encounterApi'

function useEncounterMutation(partyId: string) {
   const queryClient = useQueryClient()
   return useMutation({
      mutationFn: (action: () => Promise<Encounter | null>) => action(),
      onSuccess: (next) => queryClient.setQueryData(encounterKey(partyId), next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
}

const incomingOptions: Array<[Incoming, string]> = [['melee', 'Melee attack'], ['shot', 'Shot (−4)'], ['thrown', 'Thrown weapon (−2)']]

// The GM attacks a hero with the active NPC: AT with Bestätigungswurf (S. 231), TP on a hit (doubled on a confirmed critical).
// One click rolls everything and sends it; the hero's player then defends (user decisions, Nov 2026).
// `passing`: a Passierschlag outside the NPC's turn (S. 237: AT −4, no action, no crit or botch, the target cannot defend)
export function NpcAttackForm({ encounter, partyId, npc, passing = false }: { encounter: Encounter; partyId: string; npc: NpcCombatant; passing?: boolean }) {
   const language = useLanguageStore((state) => state.language)
   const mutation = useEncounterMutation(partyId)
   const [chosenIncoming, setIncoming] = useState<Incoming>('melee')
   const incoming = passing ? 'melee' : chosenIncoming
   const [long, setLong] = useState(false)
   // Melee only against heroes in reach (neighbours; a long weapon 2 squares, house rule); no shooting in melee (S. 241)
   const engaged = incoming !== 'melee' && npc.engagedWith.length > 0
   const heroes = engaged ? [] : encounter.combatants.filter((entry) => entry.kind !== 'npc' && (incoming !== 'melee' || inMeleeReach(npc.position, entry.position, long ? 'long' : 'medium')))
   const [chosenId, setTargetId] = useState('')
   const targetId = heroes.find((entry) => entry.id === chosenId)?.id ?? heroes[0]?.id ?? ''
   const [modifier, setModifier] = useState(0)
   const [rolling, setRolling] = useState(false)
   const [result, setResult] = useState<D20Roll | null>(null)
   const values = npc.npc
   if (!values || values.attack === null) return <p className='party-muted'>{t('Enter an AT value for this opponent to attack.', language)}</p>
   const target = values.attack + modifier - (passing ? 4 : 0)
   const dice = parseDamage(values.damage)
   const weapon = `${values.damage ? `${t('Attack', language)} (${values.damage})` : t('Attack', language)}${passing ? ' · Passierschlag' : ''}`

   async function attack() {
      setRolling(true)
      setResult(null)
      const roll = await rollD20(attackColor, target, { noCritical: passing })
      setRolling(false)
      setResult(roll)
   }
   // The GM confirms the roll before it goes out (user decision, Nov 2026); the damage follows only after a failed defense
   function send() {
      if (!result) return
      mutation.mutate(() => submitAttack(partyId, { attackerId: npc.id, targetId, incoming, attack: rollRecord(weapon, result), dice,
         reach: long ? 'long' : 'medium', passing }), { onSuccess: () => setResult(null) })
   }

   return <div className='npc-attack'>
      <div className='initiative-manual'>
         <label className='field-group'><span>{t('Target', language)}</span>
            {heroes.length ? <select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
               {heroes.map((hero) => <option key={hero.id} value={hero.id}>{hero.name}</option>)}
            </select> : <small>{t(engaged ? 'In melee: no ranged attacks (S. 241).' : npc.position ? 'No hero in reach (melee needs a neighbouring square).' : 'Place this opponent on the board to attack in melee.', language)}</small>}</label>
         {!passing && <label className='field-group'><span>{t('Attack type', language)}</span>
            <select value={incoming} onChange={(event) => setIncoming(event.target.value as Incoming)}>
               {incomingOptions.map(([value, label]) => <option key={value} value={value}>{t(label, language)}</option>)}
            </select></label>}
      </div>
      {incoming === 'melee' && <label className='initiative-check'>
         <input type='checkbox' checked={long} onChange={(event) => setLong(event.target.checked)} />
         {t('Long weapon: reaches 2 squares (house rule)', language)}
      </label>}
      <div className='initiative-manual'>
         <span>{t('Situational modifier', language)}</span>
         <QuantityStepper value={modifier} min={-20} max={20} label={`${t('Situational modifier', language)}: ${npc.name}`} onChange={setModifier} />
      </div>
      <button className='primary-button' type='button' disabled={rolling || mutation.isPending || result !== null || target <= 0 || !targetId || (passing && encounter.openAttack !== null)} onClick={() => void attack()}>
         <Crosshair size={15} aria-hidden='true' />{t('Roll attack', language)} (AT {target})</button>
      {result && !rolling && <p className={result.success ? 'fight-note' : 'fight-note fight-danger'} aria-live='polite'>
         W20 {result.roll}{result.confirmation !== undefined && `/${result.confirmation}`} → {t(outcomeLabels[result.outcome], language)}</p>}
      {result && !rolling && <button className='primary-button' type='button' disabled={mutation.isPending} onClick={send}>
         {result.success ? t('Send attack to {target}', language).replace('{target}', heroes.find((hero) => hero.id === targetId)?.name ?? '?') : t('Accept the miss', language)}</button>}
   </div>
}

// The attack that locks the fight, for the GM: an NPC target defends here (PA/AW/VW with all modifiers), a hero target
// defends in the player's panel. The GM can always cancel.
export function OpenAttackPanel({ attack, encounter, partyId }: { attack: EncounterAttack; encounter: Encounter; partyId: string }) {
   const language = useLanguageStore((state) => state.language)
   const mutation = useEncounterMutation(partyId)
   const [rolling, setRolling] = useState(false)
   const [shown, setShown] = useState<{ roll: D20Roll; label: string } | null>(null)
   const target = encounter.combatants.find((entry) => entry.id === attack.targetId)
   const npc = target?.kind === 'npc' ? target : null
   const options: Array<['parry' | 'dodge' | 'defense', string, number | null]> = npc?.npc
      ? [['parry', 'PA', npc.npc.parry], ['dodge', 'AW', npc.npc.dodge], ['defense', 'VW', npc.npc.defense]] : []

   async function defend(kind: 'parry' | 'dodge' | 'defense', label: string, value: number) {
      const goal = npcDefenseTarget(value, kind, npc?.defensesThisRound ?? 0, attack.critical, attack.incoming)
      setRolling(true)
      const roll = await rollD20(defenseColor, goal)
      setRolling(false)
      setShown({ roll, label })
   }

   return <div className='pending-attack'>
      <small>{[attack.weapon, attack.critical ? t('Critical attack: defense halved', language) : '', attack.incoming !== 'melee' ? t(attack.incoming === 'shot' ? 'Shot (−4)' : 'Thrown weapon (−2)', language) : '']
         .filter(Boolean).join(' · ')}</small>
      {shown && <p className={shown.roll.success ? 'fight-note' : 'fight-note fight-danger'} aria-live='polite'>
         {shown.label} W20 {shown.roll.roll}{shown.roll.confirmation !== undefined && `/${shown.roll.confirmation}`} → {t(outcomeLabels[shown.roll.outcome], language)}</p>}
      {shown && attack.status === 'pending' && <button className='primary-button' type='button' disabled={mutation.isPending}
         onClick={() => mutation.mutate(() => resolveDefense(partyId, attack.id, { defense: rollRecord(shown.label, shown.roll) }))}>
         {t(shown.roll.success ? 'Report the defense to the fight' : 'Accept the failed defense', language)}</button>}
      {npc && attack.status === 'pending' && !shown ? <div className='gm-actions-buttons'>
         {options.filter(([, , value]) => value !== null).map(([kind, label, value]) => {
            const goal = npcDefenseTarget(value!, kind, npc.defensesThisRound ?? 0, attack.critical, attack.incoming)
            return <button key={kind} className='primary-button' type='button' disabled={rolling || mutation.isPending || goal <= 0}
               onClick={() => void defend(kind, label, value!)}><Shield size={15} aria-hidden='true' />{label} {goal}</button>
         })}
         <button className='quiet-button' type='button' disabled={rolling || mutation.isPending}
            onClick={() => mutation.mutate(() => resolveDefense(partyId, attack.id, { defense: null }))}><Ban size={15} aria-hidden='true' />{t('No defense', language)}</button>
      </div> : attack.status === 'pending' && !npc && <p className='party-muted'>{t('Waiting for {name} to defend.', language).replace('{name}', target?.name ?? '?')}</p>}
      {npc && (npc.defensesThisRound ?? 0) > 0 && <small className='party-muted'>{t('{name} already defended {count}× this round (PA/AW −3 each).', language)
         .replace('{name}', npc.name).replace('{count}', String(npc.defensesThisRound))}</small>}
      <button className='quiet-button' type='button' disabled={mutation.isPending} onClick={() => mutation.mutate(() => cancelAttack(partyId, attack.id))}>
         <X size={15} aria-hidden='true' />{t('Cancel the attack', language)}</button>
   </div>
}

// After a failed defense the attacker rolls the damage (user decision, Nov 2026): TP from the stored dice, doubled after a
// confirmed critical (S. 231); the server applies SP = TP − RS to the target. Without dice the TP are entered by hand.
export function DamageRollPanel({ encounter, partyId, attack }: { encounter: Encounter; partyId: string; attack: EncounterAttack }) {
   const language = useLanguageStore((state) => state.language)
   const mutation = useEncounterMutation(partyId)
   const [rolling, setRolling] = useState(false)
   const [damage, setDamage] = useState<{ rolls: number[]; tp: number; rerolled: boolean } | null>(null)
   const [manual, setManual] = useState(1)
   const target = encounter.combatants.find((entry) => entry.id === attack.targetId)
   const attacker = encounter.combatants.find((entry) => entry.id === attack.attackerId)
   // A hero may spend a Schip to reroll one damage die (W6); then the TP wait for the player's choice
   const heroId = attacker?.kind === 'hero' && attacker.mine ? attacker.charId : null
   const stats = useQuery({ queryKey: ['stats', heroId], queryFn: () => getStatsForHero(heroId!), enabled: heroId !== null }).data
   const dice = attack.dice
   const send = (total: number) => mutation.mutate(() => rollAttackDamage(partyId, attack.id, total))
   const schipChoice = (rerolled: boolean) => Boolean(stats && dice?.sides === 6 && !rerolled && stats.fatePoints.current >= 1)
   async function roll() {
      if (!dice) return
      setRolling(true)
      const rolls = await rollDamage(dice)
      const total = hitPoints(rolls, dice, attack.doubled)
      setRolling(false)
      setDamage({ rolls, tp: total, rerolled: false })
   }
   async function reroll(index: number) {
      if (!dice || !damage) return
      setRolling(true)
      const [value] = await rollDamage({ ...dice, count: 1 })
      setRolling(false)
      const rolls = damage.rolls.map((entry, slot) => slot === index ? value : entry)
      const total = hitPoints(rolls, dice, attack.doubled)
      setDamage({ rolls, tp: total, rerolled: true })
   }
   const tp = damage?.tp ?? null
   return <div className='fight-dock-panel'>
      <p className='fight-incoming'><strong>{t('{target} failed to defend.', language).replace('{target}', target?.name ?? '?')}</strong>
         <small>{[attack.weapon, dice ? `${t('TP', language)} ${dice.count}W${dice.sides}${dice.bonus ? (dice.bonus > 0 ? `+${dice.bonus}` : dice.bonus) : ''}` : '',
            attack.doubled ? t('Critical: TP × 2', language) : ''].filter(Boolean).join(' · ')}</small></p>
      {tp !== null ? <>
         <p className='fight-damage' aria-live='polite'><strong>{tp} {t('TP', language)}</strong>
            <small>{damage!.rolls.join(' + ')}{dice && dice.bonus ? ` ${dice.bonus > 0 ? '+' : ''}${dice.bonus}` : ''}{attack.doubled && ' × 2'}</small></p>
         {stats && damage && schipChoice(damage.rerolled) && !mutation.isPending &&
            <FateDamageReroll stats={stats} rolls={damage.rolls} sides={6} used={damage.rerolled} onReroll={reroll} />}
         <button className='primary-button' type='button' disabled={rolling || mutation.isPending} onClick={() => send(tp)}>
            {t('Accept {tp} TP', language).replace('{tp}', String(tp))}</button>
      </>
         : dice ? <button className='primary-button' type='button' disabled={rolling || mutation.isPending} onClick={() => void roll()}>
            <Dices size={16} aria-hidden='true' />{t('Roll damage', language)}</button>
         : <div className='initiative-manual'>
            <span>{t('TP', language)}</span>
            <QuantityStepper value={manual} min={0} max={300} label={t('TP', language)} onChange={setManual} />
            <button className='primary-button' type='button' disabled={mutation.isPending} onClick={() => mutation.mutate(() => rollAttackDamage(partyId, attack.id, manual))}>
               {t('Apply damage', language)}</button>
         </div>}
   </div>
}

export function FightLog({ encounter }: { encounter: Encounter }) {
   const language = useLanguageStore((state) => state.language)
   if (!encounter.log.length) return null
   return <details className='fight-log' open>
      <summary>{t('Fight log', language)}</summary>
      <ol>{[...encounter.log].reverse().map((entry, index) => <li key={`${encounter.log.length - index}`}>
         <span className='fight-log-round'>{t('KR', language)} {entry.round}</span>
         <span>{logText(entry, language)}</span>
      </li>)}</ol>
   </details>
}
