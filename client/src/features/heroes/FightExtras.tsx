import { Dices, Flag, Footprints, HeartCrack, Info, ShieldHalf, Swords, Telescope } from 'lucide-react'
import { useState } from 'react'
import { throwColoredDice } from '@/components/diceEngine'
import { Tooltip } from '@/components/Tooltip'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { armorProtection } from './combatGear'
import { botchDamage, hitPoints, type DamageDice } from './combatRoll'
import { readPatzerTables, roundStarted, rollDamage, useSettings, useWeaponCondition } from './fightHelpers'
import { useFightStore, type Fight, type Stance } from './fightStore'
import { patzerResult, type PatzerEntry, type PatzerTable } from './patzerTables'
import { ProbeStepper } from './ProbeDialog'
import type { Stats } from './statsApi'
import { talentCatalog } from './talentCatalog'
import { TalentProbeDialog } from './TalentProbeDialog'

const damageColor = '#b7791f'
export type ApplyDamage = (sp: number, key: string, values: Record<string, string | number>) => void

// source: DSA5 Regelwerk, S. 250 (Vorstoß / Verteidigungshaltung are announced at the start of the KR; no Vorstoß while Liegend)
export function StanceActions({ stats, heroId, fight }: { stats: Stats; heroId: string; fight: Fight }) {
   const language = useLanguageStore((state) => state.language)
   const { update, log } = useFightStore.getState()
   const owned = (['Vorstoß', 'Verteidigungshaltung'] as Stance[]).filter((key) => stats.combatSpecialAbilities.includes(key))
   if (!owned.length) return null
   const current = fight.stance?.round === fight.round ? fight.stance.kind : null
   return <div className='fight-stances'>
      {owned.map((kind) => {
         const active = current === kind
         const reason = active ? null : current ? 'Only one stance per round.' : roundStarted(fight) ? 'Only at the start of a round.'
            : kind === 'Vorstoß' && stats.statuses.includes('Liegend') ? 'Not while Liegend.' : null
         return <button key={kind} type='button' aria-pressed={active} disabled={active || reason !== null}
            className={`probe-chip fate-round-chip${active ? ' is-active' : ''}`} title={reason ? t(reason, language) : undefined}
            onClick={() => { update(heroId, { stance: { kind, round: fight.round } }); log(heroId, 'Stance: {stance}', { stance: kind }) }}>
            <strong>{kind === 'Vorstoß' ? <Swords size={14} aria-hidden='true' /> : <ShieldHalf size={14} aria-hidden='true' />}<span lang='de'>{kind}</span></strong>
            <small>{active ? t('Active this round', language) : reason ? t(reason, language)
               : t(kind === 'Vorstoß' ? 'AT +2, no defense this round.' : 'Defenses +4, no attacks this round.', language)}</small>
         </button>
      })}
   </div>
}

// source: DSA5 Regelwerk, S. 215 (Anführer: chosen allies get +1 AT, +1 defense and FK +1 in the next KR; not cumulative)
const leaderInfo = 'The hero receiving the bonus does not need the special ability. Anführer (S. 215): a leader spends one action on an Überreden check (Aufschwatzen, Manipulieren or Schmeicheln). Up to QS + 1 allies of their choice who can see and hear them get AT +1, defense +1 and FK +1 in the next combat round. Several leaders do not add up. Switch this on when a leader chose this hero; it lasts only for this round. If this hero is the leader (owns Anführer), roll Überreden on the Talents tab: the result shows how many allies benefit.'
export function LeaderBonus({ heroId, fight }: { heroId: string; fight: Fight }) {
   const language = useLanguageStore((state) => state.language)
   const { update, log } = useFightStore.getState()
   const active = fight.leaderRound === fight.round
   return <div className='fight-leader'>
      <span className='fight-leader-title'>
         <Flag size={15} aria-hidden='true' />{t('Leader bonus', language)}
         <Tooltip clickToToggle className='tooltip-icon-wrapper' lang={language} content={t(leaderInfo, language)}>
            <Info size={15} aria-label={`Anführer: ${t('Rule details', language)}`} />
         </Tooltip>
      </span>
      <button type='button' aria-pressed={active} className={`probe-chip fight-leader-toggle${active ? ' is-active' : ''}`}
         onClick={() => {
            update(heroId, { leaderRound: active ? undefined : fight.round })
            if (!active) log(heroId, 'Anführer bonus this round')
         }}>
         {t(active ? 'AT, defense and FK +1 this round' : 'Bonus received this round', language)}
      </button>
   </div>
}

function talentFor(stats: Stats, key: string) {
   const talent = talentCatalog.find((entry) => entry.key === key)!
   return { talent, value: stats.talents.find((entry) => entry.key === key)?.value ?? null }
}

// A confirmed Patzer: 1W6+2 SP, or with the optional rule a 2W6 table result (S. 231–244).
export function PatzerResolver({ stats, heroId, fight, table, unarmed, dodge, weaponKey, slot, weaponDamage, applyDamage, disabled }: {
   stats: Stats; heroId: string; fight: Fight; table: PatzerTable; unarmed: boolean; dodge: boolean; weaponKey: string | null
   slot: { index: number; item: string } | null
   weaponDamage: DamageDice | null; applyDamage: ApplyDamage; disabled: boolean
}) {
   const language = useLanguageStore((state) => state.language)
   const { update, log } = useFightStore.getState()
   const settings = useSettings(stats)
   const condition = useWeaponCondition(stats)
   const [rolling, setRolling] = useState(false)
   const [entry, setEntry] = useState<PatzerEntry | null>(null)
   const [done, setDone] = useState(false)
   const [falling, setFalling] = useState(false)
   const tables = readPatzerTables()

   async function takeDefault() {
      setRolling(true)
      const rolls = await rollDamage(botchDamage)
      setRolling(false)
      setDone(true)
      applyDamage(hitPoints(rolls, botchDamage, false), 'Botch: {sp} SP to self (W6 {roll} + 2)', { sp: hitPoints(rolls, botchDamage, false), roll: rolls[0] })
   }
   async function rollTable() {
      setRolling(true)
      const [a, b] = await throwColoredDice(6, [damageColor, damageColor])
      setRolling(false)
      const next = patzerResult(table, a + b, { unarmed, dodge })
      setEntry(next)
      log(heroId, 'Patzer table {roll}: {result}', { roll: a + b, result: next.en })
   }
   const finish = () => setDone(true)
   async function selfDamage(double: boolean) {
      // App choice: self-damage from the table is weapon TP, reduced by RS like any hit (S. 234). Unarmed: 1W6 TP.
      const dice = unarmed || !weaponDamage ? { count: 1, sides: 6, bonus: 0 } : weaponDamage
      setRolling(true)
      const rolls = await rollDamage(dice)
      setRolling(false)
      const tp = hitPoints(rolls, dice, double)
      const rs = armorProtection(stats)
      applyDamage(Math.max(0, tp - rs), 'Patzer: {tp} TP − RS {rs} to self', { tp, rs })
      finish()
   }
   function apply(next: PatzerEntry) {
      const action = next.action
      // Damage stays on the item until repaired; a destroyed item leaves the inventory (user decision, Nov 2026).
      if (action.kind === 'weapon' && slot && ['damaged', 'broken', 'destroyed'].includes(action.state)) {
         condition.mutate({ ...slot, state: action.state as 'damaged' | 'broken' | 'destroyed' }, { onSuccess: finish })
      } else if (action.kind === 'weapon' && weaponKey) {
         update(heroId, { weapons: { ...fight.weapons, [weaponKey]: { ...fight.weapons?.[weaponKey], state: action.state,
            until: action.state === 'jammed' ? fight.round + 2 : undefined } } })
         finish()
      }
      if (action.kind === 'stumble') { update(heroId, { nextActionPenalty: -2 }); finish() }
      if (action.kind === 'pain') { update(heroId, { tempPainUntil: fight.round + 2 }); finish() }
      if (action.kind === 'noDefense') { update(heroId, { noDefenseUntilAction: true }); finish() }
      if (action.kind === 'daze') {
         settings.mutate({ conditions: { ...stats.combatConditions, Betäubung: Math.min(4, (stats.combatConditions.Betäubung ?? 0) + 1) } })
         finish()
      }
   }

   if (done) return <p className='fight-note'>{t('Patzer resolved.', language)}</p>
   if (!tables) return <button className='quiet-button fight-danger' type='button' disabled={disabled || rolling} onClick={() => void takeDefault()}>
      <HeartCrack size={16} />{t('Take 1W6+2 SP', language)}
   </button>
   if (!entry) return <button className='quiet-button fight-danger' type='button' disabled={disabled || rolling} onClick={() => void rollTable()}>
      <Dices size={16} />{t('Roll Patzer table (2W6)', language)}
   </button>
   const action = entry.action
   const fall = talentFor(stats, 'koerperbeherrschung')
   return <div className='fight-patzer'>
      <p><strong>{entry.roll}</strong> · {entry[language]}</p>
      <div className='fight-followup'>
         {action.kind === 'self' && <button className='quiet-button fight-danger' type='button' disabled={disabled || rolling} onClick={() => void selfDamage(action.double)}>
            <HeartCrack size={16} />{t(action.double ? 'Roll damage ×2 to self' : 'Roll damage to self', language)}</button>}
         {action.kind === 'ally' && <button className='quiet-button' type='button' disabled={rolling} onClick={() => void (async () => {
            const dice = weaponDamage ?? { count: 1, sides: 6, bonus: 0 }
            setRolling(true)
            const rolls = await rollDamage(dice)
            setRolling(false)
            log(heroId, 'Patzer: stray hit for {tp} TP', { tp: hitPoints(rolls, dice, false) })
            finish()
         })()}><Dices size={16} />{t('Roll damage for the GM', language)}</button>}
         {action.kind === 'fall' && <button className='quiet-button' type='button' onClick={() => setFalling(true)}>
            <Footprints size={16} />{t('Körperbeherrschung (Balance) −2', language)}</button>}
         {['weapon', 'stumble', 'pain', 'noDefense', 'daze'].includes(action.kind) && (action.kind !== 'weapon' || weaponKey) &&
            <button className='primary-button' type='button' disabled={settings.isPending || condition.isPending} onClick={() => apply(entry)}>{t('Apply', language)}</button>}
         {(action.kind === 'none' || (action.kind === 'weapon' && !weaponKey)) && <button className='quiet-button' type='button' onClick={finish}>{t('Done', language)}</button>}
      </div>
      {action.kind === 'weapon' && slot && ['damaged', 'broken'].includes(action.state) && <p className='fight-note'>{t('Stays on the item until it is repaired (equipment tab).', language)}</p>}
      {action.kind === 'weapon' && slot && action.state === 'destroyed' && <p className='fight-note'>{t('Apply removes the destroyed item from the inventory.', language)}</p>}
      {falling && (fall.value === null
         ? <div className='fight-followup'><p className='fight-note'>{t('Körperbeherrschung is not activated: the hero falls.', language)}</p>
            <button className='primary-button' type='button' onClick={() => { settings.mutate({ statuses: [...stats.statuses, 'Liegend'] }); setFalling(false); finish() }}>{t('Set Liegend', language)}</button></div>
         : <TalentProbeDialog stats={stats} talent={fall.talent} value={fall.value} extraSources={[{ label: 'Patzer: fall', value: -2 }]}
            renderResult={({ result }) => result.success ? null : <button className='primary-button' type='button'
               disabled={stats.statuses.includes('Liegend')} onClick={() => settings.mutate({ statuses: [...stats.statuses, 'Liegend'] })}>{t('Set Liegend', language)}</button>}
            onClose={() => { setFalling(false); finish() }} />)}
   </div>
}

// source: DSA5 Regelwerk, S. 237 (Flucht: 1 action, Körperbeherrschung (Kampfmanöver) − enemies in reach; failure: GS/2 and a Passierschlag)
// source: DSA5 Regelwerk, S. 237 (breaking away costs 1 action)
export function FleeAction({ stats, heroId, speed, actionReason }: { stats: Stats; heroId: string; speed: number | null; actionReason: string | null }) {
   const language = useLanguageStore((state) => state.language)
   const log = useFightStore((state) => state.log)
   const spend = useFightStore((state) => state.spend)
   const [open, setOpen] = useState(false)
   const [enemies, setEnemies] = useState(1)
   const [rolling, setRolling] = useState(false)
   const { talent, value } = talentFor(stats, 'koerperbeherrschung')
   return <div className='fight-card fight-flee'>
      <h4><Footprints size={16} />{t('Flee', language)}</h4>
      {!open ? <button className='quiet-button' type='button' onClick={() => setOpen(true)}>{t('Break away from melee', language)}</button> : <>
         <div className='fight-modifier'>
            <span>{t('Enemies in reach', language)}</span>
            <ProbeStepper value={enemies} min={0} max={10} label={t('Enemies in reach', language)} lowerLabel={t('Less', language)} raiseLabel={t('More', language)} onChange={setEnemies} />
         </div>
         {value === null ? <p className='field-error'>{t('Körperbeherrschung is not activated.', language)}</p>
            : <button className='primary-button' type='button' disabled={actionReason !== null} onClick={() => { spend(heroId, 'action'); setRolling(true) }}>{t('Körperbeherrschung (Kampfmanöver)', language)}</button>}
         {actionReason && <small className='fight-note'>{t(actionReason, language)}</small>}
         <button className='quiet-button' type='button' onClick={() => setOpen(false)}>{t('Cancel', language)}</button>
      </>}
      {rolling && value !== null && <TalentProbeDialog stats={stats} talent={talent} value={value}
         extraSources={enemies ? [{ label: 'Enemies in reach', value: -enemies }] : []}
         renderResult={({ result }) => {
            const gs = speed ?? 0
            return <p className={`fight-note${result.success ? '' : ' fight-danger'}`}>{result.success
               ? t('You break away and may move up to {gs} paces.', language).replace('{gs}', () => String(gs))
               : t('Only {gs} paces (GS/2), and one enemy in reach gets a Passierschlag.', language).replace('{gs}', () => String(Math.floor(gs / 2)))}</p>
         }}
         onClose={() => { setRolling(false); setOpen(false); log(heroId, 'Flight attempt against {enemies} enemies', { enemies }) }} />}
   </div>
}

// source: DSA5 Regelwerk, S. 237 (Hinterhalt: Vergleichsprobe Verbergen vs. Sinnesschärfe (Hinterhalt entdecken); the loser is Überrascht), S. 246 (Aufmerksamkeit +2)
export function AmbushAction({ stats }: { stats: Stats }) {
   const language = useLanguageStore((state) => state.language)
   const settings = useSettings(stats)
   const [rolling, setRolling] = useState(false)
   const { talent, value } = talentFor(stats, 'sinnesschaerfe')
   return <>
      <button className='quiet-button' type='button' disabled={value === null} title={value === null ? t('Sinnesschärfe is not activated.', language) : undefined}
         onClick={() => setRolling(true)}><Telescope size={16} />{t('Ambush check', language)}</button>
      {rolling && value !== null && <TalentProbeDialog stats={stats} talent={talent} value={value} opposedRole='passive'
         renderResult={({ contest }) => contest?.winner === 'opponent' ? <div className='fight-followup'>
            <p className='fight-note'>{t('The ambush was not noticed: the hero is Überrascht.', language)}</p>
            <button className='primary-button' type='button' disabled={settings.isPending || stats.statuses.includes('Überrascht')}
               onClick={() => settings.mutate({ statuses: [...stats.statuses, 'Überrascht'] })}>{t('Set Überrascht', language)}</button>
         </div> : contest ? <p className='fight-note'>{t('The ambush was noticed.', language)}</p> : null}
         onClose={() => setRolling(false)} />}
   </>
}
