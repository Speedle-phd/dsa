import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dices, HeartCrack, Shield, Sparkles, Users, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { getSummons, summonsKey, updateSummon, type BestiaryAttack, type Summon } from './bestiaryApi'
import { CompanionAttackDialog } from './CompanionAttackDialog'
import { companionsKey, displayDamage, getCompanions, updateCompanions } from './companionApi'
import { defenseTarget, type CombatOutcome, type D20Roll } from './combatRoll'
import { rollD20 } from './d20'
import {
   allyDamage, allyDefensePenalty, allyInitiative, companionFighter, radau, radauFighter, summonFighter, type AllyFighter, type FightAlly,
} from './fightAllies'
import { actionBlocked, actionUse, parseSpeed } from './fightActions'
import { joinFightAs } from './fightHelpers'
import { useFightStore, type Fight } from './fightStore'
import { TurnBar } from './FightTurn'
import { astralSpendNote, useManaSpend } from './magicApi'
import { ProbeStepper } from './ProbeDialog'
import type { Stats } from './statsApi'

const defenseColor = '#2563eb'
const outcomeLabels: Record<CombatOutcome, string> = {
   success: 'Success', failure: 'Failed', critical: 'Critical success', criticalUnconfirmed: 'Critical, not confirmed', botch: 'Botch', botchAverted: 'Botch averted',
}
type FightService = 'fight' | 'fightMany'

// Companions, summoned creatures and Radau brooms on the hero's side: own INI, attacks, defenses and LeP.
export function FightAllySection({ stats, heroId, fight }: { stats: Stats; heroId: string; fight: Fight }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const companions = useQuery({ queryKey: companionsKey(stats._id), queryFn: () => getCompanions(stats._id) }).data ?? []
   const summons = useQuery({ queryKey: summonsKey(stats._id), queryFn: () => getSummons(stats._id) }).data ?? []
   const { updateAlly, log } = useFightStore.getState()
   const allies = [...(fight.allies ?? [])].sort((a, b) => allyInitiative(b) - allyInitiative(a))
   const inFight = new Set(allies.flatMap((ally) => ally.source.kind === 'radau' ? [] : [ally.source.id]))
   const freeCompanions = companions.filter((companion) => !inFight.has(companion.id))
   const freeSummons = summons.filter((summon) => !inFight.has(summon._id) && summon.effective)
   const [choice, setChoice] = useState('')
   const [service, setService] = useState<FightService>('fight')
   const chosenSummon = freeSummons.find((summon) => `summon:${summon._id}` === choice)
   const chosenCompanion = freeCompanions.find((companion) => `companion:${companion.id}` === choice)

   const companionHealth = useMutation({
      mutationFn: ({ companionId, health }: { companionId: string; health: number }) =>
         updateCompanions(stats._id, { action: 'companion-resources', companionId, health }),
      onSuccess: (next) => queryClient.setQueryData(companionsKey(stats._id), next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const summonAction = useMutation({
      mutationFn: (action: Parameters<typeof updateSummon>[1]) => updateSummon(stats._id, action),
      onSuccess: (next) => queryClient.setQueryData(summonsKey(stats._id), next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   // source: DSA5 Regelwerk, S. 265 (Kampf: 1 service; Kampf against several enemies needs 2 and uses all)
   const summonBlocked = chosenSummon && chosenSummon.task !== 'fightMany'
      ? chosenSummon.task ? 'The creature is busy with another task.'
         : chosenSummon.services < (service === 'fightMany' ? 2 : 1) ? 'Not enough services left (S. 265).' : null
      : null

   async function join() {
      try {
         await joinChosen()
      } catch { /* shown by the mutation's toast */ }
      setChoice('')
   }

   async function joinChosen() {
      if (chosenCompanion) await joinFightAs(heroId, { kind: 'companion', id: chosenCompanion.id }, chosenCompanion.name, chosenCompanion.initiative, parseSpeed(chosenCompanion.speed))
      if (chosenSummon?.effective) {
         const creature = chosenSummon.effective
         await summonAction.mutateAsync({ action: 'join-fight', summonId: chosenSummon._id, service })
         await joinFightAs(heroId, { kind: 'summon', id: chosenSummon._id }, chosenSummon.creature, creature.initiative, parseSpeed(creature.speed))
      }
   }

   function leave(ally: FightAlly, name: string) {
      if (ally.source.kind === 'summon') summonAction.mutate({ action: 'fight-over', summonId: ally.source.id })
      updateAlly(heroId, ally.id, null)
      log(heroId, ally.source.kind === 'radau' ? 'Radau ends' : '{name} leaves the fight', { name })
   }

   return <section className='fight-allies' aria-label={t('Allies', language)}>
      <h3 className='fight-allies-title'><Users size={17} />{t('Allies', language)}</h3>
      {allies.length > 0 && <ul className='fight-ally-list'>
         {allies.map((ally) => {
            const source = ally.source
            if (source.kind === 'radau') return <AllyCard key={ally.id} heroId={heroId} ally={ally}
               fighter={radauFighter(source.quality)} subtitle={`${t('Spell', language)} · ${t('QS', language)} ${source.quality}`}
               onLeave={() => leave(ally, 'Radau')}>
               <RadauControls stats={stats} heroId={heroId} fight={fight} ally={ally} onEnd={() => leave(ally, 'Radau')} />
            </AllyCard>
            const companion = source.kind === 'companion' ? companions.find((entry) => entry.id === source.id) : undefined
            const summon = source.kind === 'summon' ? summons.find((entry) => entry._id === source.id) : undefined
            const fighter = companion ? companionFighter(companion) : summon ? summonFighter(summon) : null
            if (!fighter) return <li key={ally.id} className='fight-card'>
               <p className='fight-note'>{t('This ally is no longer with the hero.', language)}</p>
               <button className='quiet-button' type='button' onClick={() => updateAlly(heroId, ally.id, null)}>{t('Remove from the fight', language)}</button>
            </li>
            return <AllyCard key={ally.id} heroId={heroId} ally={ally} fighter={fighter}
               subtitle={companion ? `${companion.species}${companion.familiar ? ` · ${t('Familiar', language)}` : ''}` : summonSubtitle(summon!, language)}
               healthPending={companionHealth.isPending || summonAction.isPending}
               onHealth={(health) => companion ? companionHealth.mutate({ companionId: companion.id, health })
                  : summonAction.mutate({ action: 'health', summonId: summon!._id, current: health })}
               onLeave={() => leave(ally, fighter.name)} />
         })}
      </ul>}

      <div className='fight-card fight-ally-join'>
         {freeCompanions.length + freeSummons.length > 0 ? <>
            <label className='field-group fight-situation-field'>
               <span>{t('Bring into the fight', language)}</span>
               <select value={choice} onChange={(event) => setChoice(event.target.value)}>
                  <option value=''>{t('Choose an ally', language)}</option>
                  {freeCompanions.length > 0 && <optgroup label={t('Companions', language)}>
                     {freeCompanions.map((companion) => <option key={companion.id} value={`companion:${companion.id}`}>{companion.name} ({companion.species})</option>)}
                  </optgroup>}
                  {freeSummons.length > 0 && <optgroup label={t('Summoned creatures', language)}>
                     {freeSummons.map((summon) => <option key={summon._id} value={`summon:${summon._id}`}>{summonSubtitle(summon, language, true)}</option>)}
                  </optgroup>}
               </select>
            </label>
            {chosenSummon && (chosenSummon.task === 'fightMany'
               ? <p className='fight-note'>{t('Already fighting several enemies: joins without another service.', language)}</p>
               : <div className='probe-segmented'>
                  {(['fight', 'fightMany'] as const).map((key) => <button key={key} type='button' aria-pressed={service === key}
                     className={service === key ? 'is-active' : ''} onClick={() => setService(key)}>
                     {t(key === 'fight' ? 'Kampf · 1 service' : 'Kampf (several enemies) · all services', language)}</button>)}
               </div>)}
            {summonBlocked && <p className='fight-note'>{t(summonBlocked, language)}</p>}
            <button className='primary-button' type='button' disabled={!choice || Boolean(summonBlocked) || summonAction.isPending} onClick={() => void join()}>
               <Dices size={16} />{t('Join · roll INI', language)}</button>
         </> : <p className='fight-note'>{t('Companions and summoned creatures can join here.', language)}</p>}
         {stats.spells.some((spell) => spell.key === 'Radau') && <p className='fight-note'>
            {t('Radau: cast it with the spell Probe on the Magic tab; after a success the broom joins this fight.', language)}</p>}
      </div>
   </section>
}

function summonSubtitle(summon: Summon, language: 'de' | 'en', withName = false) {
   const left = summon.task === 'fightMany' ? t('Kampf (several enemies)', language) : `${summon.services} ${t('services', language)}`
   return `${withName ? `${summon.creature} · ` : ''}${summon.ritual} · ${t('QS', language)} ${summon.quality} · ${left}`
}

function AllyCard({ heroId, ally, fighter, subtitle, healthPending = false, onHealth, onLeave, children }: {
   heroId: string; ally: FightAlly; fighter: AllyFighter; subtitle: string
   healthPending?: boolean; onHealth?: (health: number) => void; onLeave: () => void; children?: ReactNode
}) {
   const language = useLanguageStore((state) => state.language)
   const { updateAlly, log, spend } = useFightStore.getState()
   const fight = useFightStore((state) => state.fights[heroId])
   const [attack, setAttack] = useState<BestiaryAttack | null>(null)
   const [defenseKey, setDefenseKey] = useState(fighter.defenses[0]?.key ?? '')
   const [modifier, setModifier] = useState(0)
   const [critical, setCritical] = useState(false)
   const [rolling, setRolling] = useState(false)
   const [result, setResult] = useState<D20Roll | null>(null)
   const [tp, setTp] = useState(0)
   const [halved, setHalved] = useState(false)
   const defense = fighter.defenses.find((entry) => entry.key === defenseKey) ?? fighter.defenses[0]
   const penalty = defense ? allyDefensePenalty(defense, ally.defenses) : 0
   // source: DSA5 Regelwerk, S. 34 (Schmerz −1 per level), S. 231 (a critical attack halves the defense)
   const target = defense ? defenseTarget(defense.value + modifier - fighter.pain, penalty, critical) : 0
   const health = fighter.health
   const sp = allyDamage(tp, fighter.armor, halved)
   const name = fighter.name
   // source: DSA5 Regelwerk, S. 228 (one attack as the action per KR; Radau: one attack per KR, S. 297)
   const attackReason = fight ? actionBlocked(actionUse(ally.turn, fight.round), 'action') : null

   async function rollDefense() {
      if (!defense) return
      setRolling(true)
      const next = await rollD20(defenseColor, target)
      setRolling(false)
      setResult(next)
      updateAlly(heroId, ally.id, { defenses: ally.defenses + 1 })
      log(heroId, '{weapon} {label}: W20 {roll} vs {target} → {outcome}', {
         weapon: name, label: defense.label, roll: next.confirmation === undefined ? next.roll : `${next.roll}/${next.confirmation}`, target, outcome: outcomeLabels[next.outcome],
      })
   }

   function applyHit() {
      if (!health || !onHealth) return
      const after = Math.max(0, health.current - sp)
      if (sp > 0) onHealth(after)
      log(heroId, '{name} hit: {tp} TP − RS {rs} = {sp} SP{half}', {
         name, tp, rs: fighter.armor, sp, half: halved ? ' (½ TP)' : '', ...(sp > 0 ? { before: health.current, after } : { noDamage: 1 }),
      })
      setTp(0)
   }

   return <li className='fight-card fight-ally'>
      <header className='fight-ally-head'>
         <div>
            <h4 lang='de'>{name}</h4>
            <small lang='de'>{subtitle}</small>
         </div>
         <button className='icon-button' type='button' title={t('Leave the fight', language)} aria-label={`${t('Leave the fight', language)}: ${name}`}
            onClick={onLeave}><X size={16} /></button>
      </header>
      <dl className='fight-status fight-ally-status'>
         <div><dt>{t('INI', language)}</dt><dd>{allyInitiative(ally)} <small>({ally.initiative.base} + W6 {ally.initiative.roll})</small></dd></div>
         <div><dt>{t('LeP', language)}</dt><dd>{health ? <>{health.current} <small>/ {health.max}</small></> : <small>{t('Unbreakable', language)}</small>}</dd></div>
         <div><dt>{t('RS', language)}</dt><dd>{fighter.armor}</dd></div>
         <div><dt>{t('Defenses', language)}</dt><dd>{ally.defenses}</dd></div>
      </dl>
      {health && health.current <= 0 && <p className='combat-health-warning' role='status'>{t('No LeP left: the GM decides what happens.', language)}</p>}
      {fighter.pain > 0 && <p className='fight-note'>{t('Schmerz', language)} −{fighter.pain} ({t('applied automatically', language)})</p>}
      {fight && <TurnBar heroId={heroId} fight={fight} allyId={ally.id} name={name} speed={parseSpeed(fighter.speed)} />}

      <div className='fight-options'>
         {fighter.attacks.map((entry) => <button key={entry.name} type='button' className='probe-chip fight-option' disabled={attackReason !== null}
            title={attackReason ? t(attackReason, language) : undefined}
            aria-label={`${t('Roll attack', language)}: ${name}, ${entry.name}`} onClick={() => setAttack(entry)}>
            <strong>{t('AT', language)} {entry.attack - fighter.pain}</strong>
            <small lang='de'>{entry.name} · {displayDamage(entry.damage)}{entry.perRound ? ` · ${entry.perRound}/${t('KR', language)}` : ''}</small>
         </button>)}
      </div>

      {defense ? <div className='fight-ally-defense'>
         {fighter.defenses.length > 1 && <div className='probe-segmented'>
            {fighter.defenses.map((entry) => <button key={entry.key} type='button' aria-pressed={entry.key === defense.key}
               className={entry.key === defense.key ? 'is-active' : ''} onClick={() => { setDefenseKey(entry.key); setResult(null) }}>
               <span lang='de'>{entry.label}</span> {entry.value}</button>)}
         </div>}
         {defense.note && <p className='fight-note'>{t(defense.note, language)}</p>}
         <div className='fight-modifier'>
            <span>{t('Modifier', language)}</span>
            <ProbeStepper value={modifier} min={-20} max={20} label={`${t('Modifier', language)}: ${name}`}
               lowerLabel={t('Harder', language)} raiseLabel={t('Easier', language)} onChange={setModifier} />
         </div>
         <label className='regen-toggle'>
            <input type='checkbox' checked={critical} onChange={(event) => setCritical(event.target.checked)} />
            <span><strong>{t('Critical enemy attack', language)}</strong><small>{t('Defense halved (S. 231).', language)}</small></span>
         </label>
         {result && !rolling && <div className={`fight-roll ${result.success ? 'is-success' : 'is-failure'}`} aria-live='polite'>
            <span className={`fight-die${result.roll === 1 ? ' is-one' : result.roll === 20 ? ' is-twenty' : ''}`}>{result.roll}</span>
            <span><strong>{defense.label}: {t(outcomeLabels[result.outcome], language)}</strong>
               <small>{t('Target', language)} {result.target}{result.confirmation !== undefined && ` · ${t('Confirmation roll', language)} ${result.confirmation}`}</small></span>
         </div>}
         <button className='quiet-button' type='button' disabled={rolling || target <= 0} aria-label={`${t('Roll defense', language)}: ${name}`}
            onClick={() => void rollDefense()}>
            <Shield size={16} />{t('Roll defense', language)} · {target}
            {penalty > 0 && <small> ({t('−{penalty} for earlier defenses', language).replace('{penalty}', String(penalty))})</small>}
         </button>
      </div> : <p className='fight-note'>{t('No defense value.', language)}</p>}

      {health && onHealth && <div className='fight-ally-hit'>
         <div className='fight-modifier'>
            <span>{t('TP of the enemy', language)}</span>
            <ProbeStepper value={tp} min={0} max={200} label={`${t('TP of the enemy', language)}: ${name}`}
               lowerLabel={t('Less', language)} raiseLabel={t('More', language)} onChange={setTp} />
         </div>
         {fighter.creatureKind && <label className='regen-toggle'>
            <input type='checkbox' checked={halved} onChange={(event) => setHalved(event.target.checked)} />
            <span><strong>{t(fighter.creatureKind === 'demon' ? 'Mundane weapon: half TP' : 'Mundane or consecrated weapon: half TP', language)}</strong>
               <small>{t('Halved before RS (S. {page}).', language).replace('{page}', fighter.creatureKind === 'demon' ? '355' : '358')}</small></span>
         </label>}
         <p className='fight-damage'><strong>{sp} {t('SP', language)}</strong>
            <small>{halved ? `½ × ${tp}` : tp} {t('TP', language)} − {t('RS', language)} {fighter.armor}</small></p>
         <button className='quiet-button fight-danger' type='button' disabled={healthPending || tp <= 0} onClick={applyHit}>
            <HeartCrack size={16} />{t('Apply damage', language)}</button>
      </div>}

      {children}
      {attack && <CompanionAttackDialog fighter={fighter} attack={attack} onLog={(key, values) => log(heroId, key, values)}
         onAttack={() => spend(heroId, 'action', ally.id)} blockedReason={attackReason} onClose={() => setAttack(null)} />}
   </li>
}

// source: DSA5 Regelwerk, S. 297 (Radau: 2 AsP per KR; target down → random target within 16 Schritt; Haltegriff, Kraftakt 10 with 14/14/14),
// S. 285–286 (sustained spell: −1 on further spells)
export function RadauControls({ stats, heroId, fight, ally, onEnd }: { stats: Stats; heroId: string; fight: Fight; ally: FightAlly; onEnd: () => void }) {
   const language = useLanguageStore((state) => state.language)
   const { updateAlly, log } = useFightStore.getState()
   const spend = useManaSpend(stats, (amount) => {
      updateAlly(heroId, ally.id, { paidRound: fight.round })
      log(heroId, 'Radau sustained: {asp} AsP', { asp: amount })
   })
   const due = ally.paidRound !== fight.round
   const notes = astralSpendNote(stats)
   return <div className='fight-ally-extra'>
      {due && <div className='fight-confirm' role='status'>
         <p>{t('Combat round {round}: sustaining Radau costs {asp} AsP.', language).replace('{round}', String(fight.round)).replace('{asp}', String(radau.upkeep))}
            {notes.length > 0 && <small> ({notes.map((note) => t(note, language)).join(' · ')})</small>}</p>
         <button className='quiet-button' type='button' onClick={onEnd}>{t('End spell', language)}</button>
         <button className='primary-button' type='button' disabled={spend.isPending || stats.mana.current < radau.upkeep}
            onClick={() => spend.mutate(radau.upkeep)}><Sparkles size={16} />{t('Spend {asp} AsP', language).replace('{asp}', String(radau.upkeep))}</button>
         {stats.mana.current < radau.upkeep && <small>{t('Not enough AsP: the spell ends.', language)}</small>}
      </div>}
      <ul className='fight-ally-notes'>
         <li>{t('One attack per combat round, no combat maneuvers; unbreakable and magical while the spell lasts.', language)}</li>
         <li>{t('If its target is down or gone, it attacks a random target within 16 Schritt, possibly the caster; with nobody in range the spell ends.', language)}</li>
         <li>{t('To hold it: Raufen attack with Haltegriff against its PA; it resists with Kraftakt 10 (14/14/14).', language)}</li>
         <li>{t('While you sustain it, your other spells are 1 harder (S. 285–286).', language)}</li>
      </ul>
   </div>
}
