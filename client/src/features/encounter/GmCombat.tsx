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
import { boardDistance, inMeleeReach } from './boardGeometry'
import { boardRanged, distanceBand } from '@/features/heroes/boardRanged'
import { defaultRanged, defaultSituation, rangedAttackModifiers } from '@/features/heroes/combatSituation'
import { maneuverEffect, npcManeuvers, withManeuverDice } from '@/features/npcs/npcManeuvers'
import { draftWeapons, npcPainLevel } from '@/features/npcs/npcSheet'
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

const rangedOptions: Array<[Incoming, string]> = [['shot', 'Shot (−4)'], ['thrown', 'Thrown weapon (−2)']]
const signed = (value: number) => value > 0 ? `+${value}` : String(value)
const romanNumerals = ['', 'I', 'II', 'III', 'IV']

// The GM attacks a hero with the active NPC (S. 231): a weapon from its stat block (reach; FK with the board's distance band,
// S. 241–242), a maneuver it knows (S. 247–250) and its Schmerz (S. 34). One click rolls; the GM confirms before the attack goes
// out and the hero's player defends (user decisions, Nov 2026).
// `passing`: a Passierschlag outside the NPC's turn (S. 237: AT −4, no action, no maneuvers, no crit or botch, no defense)
export function NpcAttackForm({ encounter, partyId, npc, passing = false }: { encounter: Encounter; partyId: string; npc: NpcCombatant; passing?: boolean }) {
   const language = useLanguageStore((state) => state.language)
   const mutation = useEncounterMutation(partyId)
   const values = npc.npc
   const weapons = values ? draftWeapons(values).filter((weapon) => !passing || weapon.kind !== 'ranged') : []
   // "max. 1 × Biss": a weapon used up this KR is not offered again (S. 354)
   const used = npc.attacksThisRound?.weapons ?? []
   const available = weapons.filter((weapon) => weapon.perRound === null || used.filter((name) => name === weapon.name).length < weapon.perRound)
   const [weaponName, setWeaponName] = useState('')
   const weapon = available.find((entry) => entry.name === weaponName) ?? available[0] ?? null
   const ranged = weapon?.kind === 'ranged'
   const [thrown, setThrown] = useState(false)
   const incoming: Incoming = ranged ? (thrown ? 'thrown' : 'shot') : 'melee'
   // Melee only against heroes in the weapon's reach; no shooting while in melee (S. 241)
   const engaged = ranged && npc.engagedWith.length > 0
   const heroes = !weapon || engaged ? [] : encounter.combatants.filter((entry) => entry.kind !== 'npc' && (ranged || inMeleeReach(npc.position, entry.position, weapon.reach ?? 'medium')))
   const [chosenId, setTargetId] = useState('')
   const targetEntry = heroes.find((entry) => entry.id === chosenId) ?? heroes[0] ?? null
   const [modifier, setModifier] = useState(0)
   const [maneuverName, setManeuverName] = useState('')
   const [level, setLevel] = useState(1)
   const [rolling, setRolling] = useState(false)
   const [result, setResult] = useState<D20Roll | null>(null)

   if (!values || !weapons.length) return <p className='party-muted'>{t('This opponent has no weapon or attack. Add one in the NPC library or enter an AT value.', language)}</p>
   if (!weapon) return <p className='party-muted'>{t('All attacks of this opponent are used up this round (S. 354).', language)}</p>
   const pain = npcPainLevel(values.health, values.maxHealth, values.sheet?.painThresholds)
   if (pain >= 4) return <p className='fight-note fight-danger'>{t('Schmerz IV: this opponent cannot act (S. 34).', language)}</p>

   const maneuvers = passing ? [] : npcManeuvers(values.sheet?.abilities ?? [], weapon)
   const maneuver = maneuvers.find((entry) => entry.name === maneuverName) ?? null
   const effect = maneuver ? maneuverEffect(maneuver, level) : null
   const squares = targetEntry ? boardDistance(npc.position, targetEntry.position) : null
   const paces = squares === null ? null : squares * encounter.board.scale
   const band = ranged && paces !== null ? distanceBand(weapon.range ?? undefined, paces) : null
   const board = ranged && targetEntry ? rangedAttackModifiers({ ...defaultRanged, ...boardRanged({ paces, moved: targetEntry.moved,
      intoMelee: targetEntry.engagedWith.length > 0 }, { moved: npc.moved }, weapon.range ?? undefined) }, defaultSituation) : null
   const label = ranged ? 'FK' : 'AT'
   const parts: Array<[string, number]> = [
      [t(weapon.name, language), weapon.attack],
      ...(passing ? [['Passierschlag', -4] as [string, number]] : []),
      ...(pain ? [[`Schmerz ${romanNumerals[pain]}`, -pain] as [string, number]] : []),
      ...(effect ? [[t(effect.label, language), effect.attack] as [string, number]] : []),
      ...(board?.sources ?? []).filter((source) => source.value).map((source) => [t(source.label, language), source.value] as [string, number]),
      ...(modifier ? [[t('Situational modifier', language), modifier] as [string, number]] : []),
   ]
   const target = parts.reduce((sum, [, value]) => sum + value, 0)
   const dice = withManeuverDice(parseDamage(weapon.damage), effect, board?.tp ?? 0)
   const recordLabel = [t(weapon.name, language), effect?.label, passing ? 'Passierschlag' : ''].filter(Boolean).join(' · ')
   const maxActions = values.sheet?.actions ?? 1
   const blocked = band === 'beyond' ? 'Out of range: no attack possible (S. 241).' : null

   async function attack() {
      setRolling(true)
      setResult(null)
      const roll = await rollD20(attackColor, target, { noCritical: passing })
      setRolling(false)
      setResult(roll)
   }
   // The GM confirms the roll before it goes out (user decision, Nov 2026); the damage follows only after a failed defense
   function send() {
      if (!result || !targetEntry || !weapon) return
      mutation.mutate(() => submitAttack(partyId, { attackerId: npc.id, targetId: targetEntry.id, incoming, attack: rollRecord(recordLabel, result), dice,
         reach: weapon.reach ?? 'medium', passing, defenseModifier: result.success ? effect?.defense ?? 0 : 0, weapon: weapon.name }),
         { onSuccess: () => { setResult(null); setManeuverName('') } })
   }

   // Schmerz is listed in the breakdown below and in the NPC hints
   return <div className='npc-attack'>
      {!passing && maxActions > 1 && <small className='party-muted'>{t('Attack {count} of {max} this round (S. 354)', language)
         .replace('{count}', String((npc.attacksThisRound?.count ?? 0) + 1)).replace('{max}', String(maxActions))}</small>}
      <div className='initiative-manual'>
         <label className='field-group'><span>{t('Weapon', language)}</span>
            <select value={weapon.name} disabled={result !== null} onChange={(event) => { setWeaponName(event.target.value); setTargetId('') }}>
               {weapons.map((entry) => <option key={entry.name} value={entry.name} disabled={!available.includes(entry)}>
                  {t(entry.name, language)} · {entry.kind === 'ranged' ? 'FK' : 'AT'} {entry.attack}{entry.perRound !== null ? ` · max. ${entry.perRound}×` : ''}</option>)}
            </select></label>
         {ranged && !passing && <label className='field-group'><span>{t('Attack type', language)}</span>
            <select value={incoming} onChange={(event) => setThrown(event.target.value === 'thrown')}>
               {rangedOptions.map(([value, text]) => <option key={value} value={value}>{t(text, language)}</option>)}
            </select></label>}
         <label className='field-group'><span>{t('Target', language)}</span>
            {heroes.length ? <select value={targetEntry?.id ?? ''} onChange={(event) => setTargetId(event.target.value)}>
               {heroes.map((hero) => <option key={hero.id} value={hero.id}>{hero.name}</option>)}
            </select> : <small>{t(engaged ? 'In melee: no ranged attacks (S. 241).' : npc.position ? 'No hero in reach (melee needs a neighbouring square).' : 'Place this opponent on the board to attack in melee.', language)}</small>}</label>
      </div>
      {maneuvers.length > 0 && <div className='initiative-manual'>
         <label className='field-group'><span>{t('Maneuver', language)}</span>
            <select value={maneuver?.name ?? ''} disabled={result !== null} onChange={(event) => { setManeuverName(event.target.value); setLevel(1) }}>
               <option value=''>{t('None', language)}</option>
               {maneuvers.map((entry) => <option key={entry.name} value={entry.name}>{t(entry.name, language)}{entry.levels ? ` ${romanNumerals[entry.maxLevel]}` : ''}</option>)}
            </select></label>
         {maneuver?.levels && maneuver.maxLevel > 1 && <div className='field-group'><span>{t('Level', language)}</span>
            <QuantityStepper value={Math.min(level, maneuver.maxLevel)} min={1} max={maneuver.maxLevel} label={`${t('Level', language)}: ${t(maneuver.name, language)}`} onChange={setLevel} /></div>}
      </div>}
      {effect && <small className='party-muted'>{[`${label} ${signed(effect.attack)}`, effect.tp ? `${t('TP', language)} ${signed(effect.tp)}` : '',
         effect.die ? `${t('TP', language)} +1W6` : '', effect.defense ? `${t('Defense', language)} ${signed(effect.defense)}` : '', `S. ${maneuver?.page}`].filter(Boolean).join(' · ')}</small>}
      <div className='initiative-manual'>
         <span>{t('Situational modifier', language)}</span>
         <QuantityStepper value={modifier} min={-20} max={20} label={`${t('Situational modifier', language)}: ${npc.name}`} onChange={setModifier} />
      </div>
      <small className='party-muted'>{parts.map(([name, value], index) => index === 0 ? `${name} ${value}` : `${name} ${signed(value)}`).join(' · ')}
         {dice && ` · ${t('TP', language)} ${dice.count}W${dice.sides}${dice.bonus ? signed(dice.bonus) : ''}`}</small>
      {blocked && <small className='field-error'>{t(blocked, language)}</small>}
      <button className='primary-button' type='button' disabled={rolling || mutation.isPending || result !== null || target <= 0 || !targetEntry || blocked !== null || (passing && encounter.openAttack !== null)} onClick={() => void attack()}>
         <Crosshair size={15} aria-hidden='true' />{t('Roll attack', language)} ({label} {target})</button>
      {result && !rolling && <p className={result.success ? 'fight-note' : 'fight-note fight-danger'} aria-live='polite'>
         W20 {result.roll}{result.confirmation !== undefined && `/${result.confirmation}`} → {t(outcomeLabels[result.outcome], language)}</p>}
      {result && !rolling && <button className='primary-button' type='button' disabled={mutation.isPending} onClick={send}>
         {result.success ? t('Send attack to {target}', language).replace('{target}', targetEntry?.name ?? '?') : t('Accept the miss', language)}</button>}
   </div>
}

// The defenses an NPC can roll: PA per melee weapon with a PA value, AW, VW (S. 354). Old NPCs: the flat PA.
type DefenseChoice = { kind: 'parry' | 'dodge' | 'defense'; label: string; value: number }
function npcDefenseOptions(values: NonNullable<NpcCombatant['npc']>): DefenseChoice[] {
   const parries = draftWeapons(values).filter((weapon) => weapon.kind !== 'ranged' && weapon.parry !== null)
   const list: DefenseChoice[] = parries.length > 1
      ? parries.map((weapon) => ({ kind: 'parry' as const, label: `PA ${weapon.name}`, value: weapon.parry ?? 0 }))
      : parries.length === 1 ? [{ kind: 'parry' as const, label: 'PA', value: parries[0].parry ?? 0 }] : []
   if (values.dodge !== null) list.push({ kind: 'dodge', label: 'AW', value: values.dodge })
   if (values.defense !== null) list.push({ kind: 'defense', label: 'VW', value: values.defense })
   return list
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
   const options = npc?.npc ? npcDefenseOptions(npc.npc) : []
   // Schmerz −level (S. 34; IV: no defense) and the attacker's Finte (S. 247) before the halving of a critical
   const pain = npc?.npc ? npcPainLevel(npc.npc.health, npc.npc.maxHealth, npc.npc.sheet?.painThresholds) : 0
   const goalOf = (kind: 'parry' | 'dodge' | 'defense', value: number) =>
      npcDefenseTarget(value - pain + (attack.defenseModifier ?? 0), kind, npc?.defensesThisRound ?? 0, attack.critical, attack.incoming)

   async function defend(kind: 'parry' | 'dodge' | 'defense', label: string, value: number) {
      const goal = goalOf(kind, value)
      setRolling(true)
      const roll = await rollD20(defenseColor, goal)
      setRolling(false)
      setShown({ roll, label })
   }

   return <div className='pending-attack'>
      <small>{[attack.weapon, attack.critical ? t('Critical attack: defense halved', language) : '', attack.incoming !== 'melee' ? t(attack.incoming === 'shot' ? 'Shot (−4)' : 'Thrown weapon (−2)', language) : '',
         attack.defenseModifier ? `Finte ${attack.defenseModifier}` : '', pain ? `Schmerz ${romanNumerals[pain]} −${Math.min(pain, 4)}` : '']
         .filter(Boolean).join(' · ')}</small>
      {shown && <p className={shown.roll.success ? 'fight-note' : 'fight-note fight-danger'} aria-live='polite'>
         {shown.label} W20 {shown.roll.roll}{shown.roll.confirmation !== undefined && `/${shown.roll.confirmation}`} → {t(outcomeLabels[shown.roll.outcome], language)}</p>}
      {shown && attack.status === 'pending' && <button className='primary-button' type='button' disabled={mutation.isPending}
         onClick={() => mutation.mutate(() => resolveDefense(partyId, attack.id, { defense: rollRecord(shown.label, shown.roll) }))}>
         {t(shown.roll.success ? 'Report the defense to the fight' : 'Accept the failed defense', language)}</button>}
      {npc && attack.status === 'pending' && !shown ? <div className='gm-actions-buttons'>
         {pain < 4 && options.map(({ kind, label, value }) => {
            const goal = goalOf(kind, value)
            return <button key={label} className='primary-button' type='button' disabled={rolling || mutation.isPending || goal <= 0}
               onClick={() => void defend(kind, label, value)}><Shield size={15} aria-hidden='true' />{label} {goal}</button>
         })}
         {pain >= 4 && <small className='fight-danger'>{t('Schmerz IV: this opponent cannot defend (S. 34).', language)}</small>}
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
