import { Dices, X } from 'lucide-react'
import { useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { throwColoredDice } from '@/components/diceEngine'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { displayDamage, type CompanionAttack } from './companionApi'
import { evaluateCombatRoll, formatDamage, hitPoints, needsConfirmation, parseDamage, type CombatOutcome } from './combatRoll'
import { ProbeStepper } from './ProbeDialog'
import { availableManeuvers, heldBiteBonus, maneuverDamage, maneuverPenalty, type CompanionManeuver } from './companionManeuvers'

const attackColor = '#c0392b'
const damageColor = '#b7791f'
const outcomeLabels: Record<CombatOutcome, string> = {
   success: 'Success',
   failure: 'Failed',
   critical: 'Critical success',
   criticalUnconfirmed: 'Critical, not confirmed',
   botch: 'Botch',
   botchAverted: 'Botch averted',
}
const signed = (value: number) => value > 0 ? `+${value}` : `${value}`

type Roll = { roll: number; confirmation?: number; target: number; success: boolean; outcome: CombatOutcome }

type Fighter = { name: string; abilities: string; pain: number }
type FightLog = (key: string, values: Record<string, string | number>) => void

// Attack → damage for one natural weapon of a companion or fight ally; the GM rolls the defense (S. 227–234).
// `onLog` writes the rolls to a running fight's log; `onAttack` uses the ally's action when the attack is rolled.
export function CompanionAttackDialog({ fighter, attack, onLog, onAttack, blockedReason = null, onClose }: {
   fighter: Fighter; attack: CompanionAttack; onLog?: FightLog; onAttack?: () => void; blockedReason?: string | null; onClose: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const titleId = useId()
   const dialogRef = useModalKeyboard(onClose)
   const [modifier, setModifier] = useState(0)
   const [rolling, setRolling] = useState(false)
   const [result, setResult] = useState<Roll | null>(null)
   const [damage, setDamage] = useState<{ rolls: number[]; tp: number } | null>(null)
   const maneuvers = availableManeuvers(fighter.abilities, attack.name)
   const [maneuver, setManeuver] = useState<CompanionManeuver>('none')
   // Verbeißen: round of the held bite (1 = the bite that held), null = not held
   const [heldRound, setHeldRound] = useState<number | null>(null)
   // source: DSA5 Regelwerk, S. 34 (Schmerz: −1 per level on all checks)
   const pain = fighter.pain
   const target = attack.attack + modifier - pain + maneuverPenalty(maneuver)
   const parsed = parseDamage(attack.damage)
   const extra = maneuverDamage(maneuver) + (heldRound === null ? 0 : heldBiteBonus(heldRound))
   const dice = parsed && { ...parsed, bonus: parsed.bonus + extra }
   const critical = result?.outcome === 'critical' && heldRound === null

   async function rollAttack() {
      onAttack?.()
      setRolling(true)
      setDamage(null)
      const [roll] = await throwColoredDice(20, [attackColor])
      // source: DSA5 Regelwerk, S. 231–233 (Bestätigungswurf with the same modifiers)
      const confirmation = needsConfirmation(roll) ? (await throwColoredDice(20, [attackColor]))[0] : undefined
      const next = evaluateCombatRoll(roll, target, confirmation)
      setResult({ roll, confirmation, target, ...next })
      setRolling(false)
      onLog?.('{weapon} {label}: W20 {roll} vs {target} → {outcome}', {
         weapon: `${fighter.name} · ${attack.name}`, label: maneuver === 'none' ? 'AT' : `AT (${maneuver})`,
         roll: confirmation === undefined ? roll : `${roll}/${confirmation}`, target, outcome: outcomeLabels[next.outcome],
      })
   }

   async function rollDamage(nextDice = dice, doubled = critical) {
      if (!nextDice) return
      setRolling(true)
      const rolls = await throwColoredDice(nextDice.sides, Array.from({ length: nextDice.count }, () => damageColor))
      // source: DSA5 Regelwerk, S. 231 (confirmed critical: TP doubled)
      const tp = hitPoints(rolls, nextDice, doubled)
      setDamage({ rolls, tp })
      setRolling(false)
      onLog?.('{weapon} damage: {tp} TP ({dice}: {rolls}){critical}', {
         weapon: `${fighter.name} · ${attack.name}`, tp, dice: formatDamage(nextDice), rolls: rolls.join('+'), critical: doubled ? ' ×2' : '',
      })
   }

   // source: DSA5 Regelwerk, S. 362 (a held bite hits automatically in the next KR, +1 TP per further KR)
   function nextHeldRound() {
      const round = (heldRound ?? 1) + 1
      setHeldRound(round)
      if (parsed) void rollDamage({ ...parsed, bonus: parsed.bonus + heldBiteBonus(round) }, false)
   }

   function reset() {
      setResult(null)
      setDamage(null)
      setHeldRound(null)
   }

   return createPortal(
      <div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
         <section ref={dialogRef} className={`hero-editor talent-probe-dialog${rolling ? ' is-rolling' : ''}`} lang={language} role='dialog' aria-modal='true'
            aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
            <header className='editor-header'>
               <div>
                  <p className='eyebrow'>{t('Attack', language)} · {fighter.name}</p>
                  <h2 id={titleId} lang='de'>{attack.name}</h2>
                  <p className='talent-probe-subtitle'>{t('AT', language)} {attack.attack} · {t('TP', language)} {displayDamage(attack.damage)}{attack.reach && ` · ${t('RW', language)} ${attack.reach}`}</p>
               </div>
               <button className='icon-button editor-close' type='button' onClick={onClose} aria-label={t('Close', language)}><X size={20} /></button>
            </header>

            {!result && !rolling && <fieldset className='probe-difficulty'>
               <legend>{t('Modifier', language)}</legend>
               <div className='probe-difficulty-custom'>
                  <span>{t('Situation (GM)', language)}</span>
                  <ProbeStepper value={modifier} min={-20} max={20} label={t('Modifier', language)}
                     lowerLabel={t('Harder', language)} raiseLabel={t('Easier', language)} onChange={setModifier} />
               </div>
               {pain > 0 && <p className='probe-spell-hint'>{t('Schmerz', language)} −{pain} ({t('applied automatically', language)})</p>}
               {maneuvers.length > 0 && <>
                  <div className='probe-segmented'>
                     {(['none', ...maneuvers] as CompanionManeuver[]).map((entry) => <button key={entry} type='button' aria-pressed={maneuver === entry}
                        className={maneuver === entry ? 'is-active' : ''} onClick={() => setManeuver(entry)}>
                        {entry === 'none' ? t('Normal attack', language) : <span lang='de'>{entry}</span>}</button>)}
                  </div>
                  {maneuver !== 'none' && <p className='probe-segmented-note'>{t(maneuver === 'Flugangriff'
                     ? 'AT −2, +2 TP on a hit. Needs an 8-Schritt approach and GS 4; no Finte. On a miss the defender gets a Passierschlag; on a hit the target’s AT against it is −6 this combat round (S. 362).'
                     : 'AT −2. If the GM confirms the bite was not defended, it holds on: later bites hit automatically with +1 TP per further combat round, the target is Fixiert and the companion’s VW drops to 0 (S. 362).', language)}</p>}
               </>}
            </fieldset>}

            <div className='probe-summary' aria-live='polite'>
               {rolling ? <p className='probe-rolling'>{t('Rolling…', language)}</p>
                  : result ? <div className={`fight-roll ${result.success ? 'is-success' : 'is-failure'}`}>
                     <span className={`fight-die${result.roll === 1 ? ' is-one' : result.roll === 20 ? ' is-twenty' : ''}`}>{result.roll}</span>
                     <span>
                        <strong>{t(outcomeLabels[result.outcome], language)}</strong>
                        <small>{t('Target', language)} {result.target}
                           {result.confirmation !== undefined && ` · ${t('Confirmation roll', language)} ${result.confirmation}`}</small>
                     </span>
                  </div>
                  : <p className='probe-chance'>
                     <span>{t('Modifier', language)} {modifier - pain === 0 ? '±0' : signed(modifier - pain)}</span>
                     <span>{t('Target', language)}: <strong>{target}</strong></span>
                  </p>}
               {result && !rolling && result.outcome === 'botch' && <p className='probe-note'>{t('Botch: consequences are up to the GM.', language)}</p>}
            </div>

            {result?.success && !rolling && <section className='probe-asp' aria-label={t('Damage', language)}>
               {!dice ? <p className='probe-spell-hint'>{t('No dice in this TP value; apply its effect manually.', language)}</p>
                  : damage ? <div className='fight-roll is-success'>
                     <span className='fight-die'>{damage.tp}</span>
                     <span>
                        <strong>{damage.tp} {t('TP', language)}</strong>
                        <small>{formatDamage(dice)}: {damage.rolls.join(' + ')}{dice.bonus ? ` ${signed(dice.bonus)}` : ''}{critical ? ` · ×2 ${t('Critical success', language)}` : ''}</small>
                     </span>
                  </div>
                  : <div className='probe-asp-actions'>
                     <span>{t('Damage', language)}: {formatDamage(dice)}{critical && ` ×2`}</span>
                     <button className='quiet-button' type='button' onClick={() => void rollDamage()}><Dices size={16} />{t('Roll damage', language)}</button>
                  </div>}
               {heldRound === null && <p className='probe-spell-hint'>{t('The defender may still parry or dodge; armor reduces TP to SP.', language)}</p>}
               {maneuver === 'Verbeißen' && damage && heldRound === null && <div className='probe-asp-actions'>
                  <span>{t('Was the bite not defended?', language)}</span>
                  <button className='quiet-button' type='button' onClick={() => setHeldRound(1)}>{t('Bitten in', language)}</button>
               </div>}
               {heldRound !== null && <div className='probe-asp-actions'>
                  <span>{t('Holding on · combat round {round}: target Fixiert, own VW 0 (S. 362).', language).replace('{round}', String(heldRound))}</span>
                  <button className='quiet-button' type='button' onClick={nextHeldRound}><Dices size={16} />{t('Next combat round: automatic bite', language)}</button>
                  <button className='quiet-button' type='button' onClick={reset}>{t('Let go', language)}</button>
               </div>}
            </section>}

            <footer className='editor-actions'>
               {result && !rolling
                  ? <>
                     <button className='quiet-button' type='button' onClick={reset}><Dices size={18} />{t('Roll again', language)}</button>
                     <button className='primary-button' type='button' autoFocus onClick={onClose}>{t('Done', language)}</button>
                  </>
                  : <>
                     <button className='quiet-button' type='button' onClick={onClose}>{t('Cancel', language)}</button>
                     <button className='primary-button' type='button' disabled={rolling || target <= 0 || blockedReason !== null} title={blockedReason ? t(blockedReason, language) : undefined} onClick={() => void rollAttack()}>
                        <Dices size={18} />{t('Roll attack', language)}
                     </button>
                  </>}
            </footer>
         </section>
      </div>, document.body,
   )
}
