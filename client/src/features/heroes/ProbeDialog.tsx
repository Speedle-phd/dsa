import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Dices, Minus, Plus, RotateCcw, Sparkles, Star, Undo2, X } from 'lucide-react'
import { useId, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { throwColoredDice, throwD20s } from '@/components/diceEngine'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { useLanguageStore } from '@/locales/languageStore'
import { t, translateRuleLabel } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { CheckModifierButton } from './CheckValue'
import type { useCheckState } from './checkState'
import { spendFatePoint, type Stats } from './statsApi'
import { fateImprovement } from './combatRoll'
import {
   aptitudeRolls, bestDieIndex, betterResult, canUseAptitude, criticalSkillPoints, difficultyPresets, evaluateOpposed, evaluateSkillCheck, improveResult,
   inabilityRolls, isPatzer, qualityLevel, routineCheck, routineResult, successChance,
   type OpposedResult, type OpposedRole, type SkillCheckOutcome, type SkillCheckResult,
} from './skillCheck'
import { getAttributeAbbreviation, type TalentAttribute, type TalentCriticalRule } from './talentCatalog'
import { useTalentOptions } from './talentOptions'

// source: DSA5 Regelwerk, S. 22 (Schnellerer Fertigkeitsprobenwurf: red/blue/green for the 1st/2nd/3rd attribute)
const dieColors = ['#c0392b', '#2563eb', '#15803d'] as const
const bonusDieColor = '#b7791f'
const signed = (value: number) => value > 0 ? `+${value}` : `${value}`
const outcomeLabels: Record<SkillCheckOutcome, string> = {
   success: 'Success',
   failure: 'Failed',
   critical: 'Critical success (double 1)',
   spectacular: 'Critical success (triple 1)',
   botch: 'Botch (double 20)',
   disaster: 'Botch (triple 20)',
}
const outcomeNotes: Partial<Record<SkillCheckOutcome, string>> = {
   critical: 'Automatic success, regardless of skill points. The GM decides the extra effect.',
   spectacular: 'Automatic success with a spectacular, memorable effect.',
   botch: 'Automatic failure, even with skill points left.',
   disaster: 'A terrible mishap that puts the hero in danger.',
}

// 'attribute': Eigenschaft verbessern on one Teilprobe (S. 222)
type FateUse = 'reroll' | 'quality' | 'attribute'
// One die rolled again by Begabung or Unfähig (S. 164, 178)
type DieReroll = { index: number; before: number; after: number }
type OpponentOutcome = 'failure' | 'success' | 'critical' | 'botch'
const opponentOutcomes: Array<{ key: OpponentOutcome; label: string }> = [
   { key: 'failure', label: 'Failed' }, { key: 'success', label: 'Success' },
   { key: 'critical', label: 'Critical success' }, { key: 'botch', label: 'Botch' },
]
const roles: Array<{ key: OpposedRole; label: string; note: string }> = [
   { key: 'active', label: 'Active side', note: 'Ties go to the opponent.' },
   { key: 'passive', label: 'Passive side', note: 'You react; ties go to you.' },
   { key: 'none', label: 'No passive side', note: 'Ties are a draw.' },
]
export type ProbeExtraSource = { label: string; value: number }
export type ProbeResultState = { result: SkillCheckResult; quality: number | null; contest: OpposedResult | null; routine: boolean }

// Shared 3W20 Fertigkeitsprobe flow (talents, spells): setup → roll → result → Done.
const noCheck = { total: 0, skillPoints: 0, blocked: [], unresolved: [], sources: [] } as const

// `attributes` replaces the hero's values (e.g. a companion); without `check` no hero modifier profile applies; `fate` shows Schips.
// `routine` offers the Routineprobe (talents, S. 184); `criticalRule` is the talent's own Kritischer Erfolg (S. 189–212).
export function ProbeDialog({ stats, eyebrow, title, probe, value, check, attributes, fate = true, extraSources = [], setup, criticalBonus = false, botchFrom = 20, opposedRole, routine: allowRoutine = false, criticalRule, examples, blocked = [], extraSkillPoints = [], renderResult, onReset, onClose }: {
   stats: Stats; eyebrow: string; title: string; probe: TalentAttribute[]; value: number; check?: ReturnType<typeof useCheckState>
   attributes?: Record<TalentAttribute, number>; fate?: boolean
   // Wilde Magie: 19 counts as 20 for the botch (S. 179)
   botchFrom?: number
   extraSources?: ProbeExtraSource[]; setup?: ReactNode; criticalBonus?: boolean
   // Starts as a Vergleichsprobe with this side (e.g. Hinterhalt, S. 237).
   opposedRole?: OpposedRole
   routine?: boolean; criticalRule?: TalentCriticalRule
   // Book "Talentanwendung" rows as difficulty presets (S. 188–213) and reasons from the caller's setup that block the roll.
   examples?: { page: number; rows: Array<{ label: string; value: number }> }; blocked?: string[]
   // FP added by the caller, e.g. an Elfenlied pre-check (S. 283)
   extraSkillPoints?: ProbeExtraSource[]
   renderResult?: (state: ProbeResultState) => ReactNode; onReset?: () => void; onClose: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const titleId = useId()
   const dialogRef = useModalKeyboard(onClose)
   const [difficulty, setDifficulty] = useState(0)
   const [rollingSlots, setRollingSlots] = useState<boolean[] | null>(null)
   const [rolls, setRolls] = useState<number[] | null>(null)
   const [previousRolls, setPreviousRolls] = useState<number[] | null>(null)
   const [fateUse, setFateUse] = useState<FateUse | null>(null)
   const [pickingReroll, setPickingReroll] = useState(false)
   const [rerollPick, setRerollPick] = useState([false, false, false])
   const [failedAttempts, setFailedAttempts] = useState(0)
   const [retryApplied, setRetryApplied] = useState(false)
   const [bonusRoll, setBonusRoll] = useState<number | 'rolling' | null>(null)
   // source: DSA5 Regelwerk, S. 25–27 (Erfolgsprobe or Vergleichsprobe; Gruppenprobe adds the members' QS)
   const [opposed, setOpposed] = useState(opposedRole !== undefined)
   const [role, setRole] = useState<OpposedRole>(opposedRole ?? 'active')
   const [groupQuality, setGroupQuality] = useState(0)
   const [opponent, setOpponent] = useState<{ outcome: OpponentOutcome; quality: number }>({ outcome: 'success', quality: 1 })
   const [aptitudeUse, setAptitudeUse] = useState<DieReroll | 'picking' | null>(null)
   const [inabilityUse, setInabilityUse] = useState<DieReroll | null>(null)
   const [routineTaken, setRoutineTaken] = useState(false)
   const [improvedDie, setImprovedDie] = useState<number | null>(null)
   const [pickingImprove, setPickingImprove] = useState(false)
   // Falschspielen repeat or Rosstäuscher second roll, once per check (S. 216, 218)
   const [secondRoll, setSecondRoll] = useState<{ before: number[]; kept: 'first' | 'second' | null } | null>(null)
   const routineTrade = useTalentOptions((state) => state.routineTrade)

   const base = probe.map((attribute) => (attributes ?? stats)[attribute])
   const checkState = check ?? noCheck
   // source: DSA5 Regelwerk, S. 25–26 (retry only if the GM allows it; −1 per failed attempt for 24 h)
   const retryPenalty = retryApplied ? failedAttempts : 0
   const extraTotal = extraSources.reduce((sum, source) => sum + source.value, 0)
   const otherTotal = checkState.total + extraTotal
   const modifier = otherTotal + difficulty - retryPenalty
   const targets = base.map((attribute) => attribute + modifier)
   const skillValue = value + checkState.skillPoints + extraSkillPoints.reduce((sum, source) => sum + source.value, 0)
   const reasons = [...checkState.blocked, ...checkState.unresolved, ...blocked,
      ...(targets.some((target) => target <= 0) ? ['Effective target ≤ 0: no check possible.'] : [])]
   const [first, second, third] = targets
   const chance = successChance([first, second, third], skillValue)
   // source: DSA5 Regelwerk, S. 184–185 (Routineprobe: base attributes 13+, minimum FW by the full modifier, no time pressure)
   const routine = allowRoutine ? routineCheck(base, skillValue, modifier, routineTrade) : null
   const rawResult: SkillCheckResult | null = rolls ? evaluateSkillCheck(rolls, targets, skillValue, botchFrom)
      : routineTaken && routine ? routineResult(targets, routine.skillPoints) : null
   const evaluated = rawResult && improvedDie !== null ? improveResult(rawResult, improvedDie, skillValue) : rawResult
   const ownsImprove = fate && stats.generalSpecialAbilities.includes('Eigenschaft verbessern')
   // source: DSA5 Regelwerk, S. 164, 178 (Begabung/Unfähig recorded for this skill)
   const aptitude = check?.activeEffects.find((effect) => effect.reroll === 'begabung')
   const inability = check?.activeEffects.find((effect) => effect.reroll === 'unfaehig')
   const cheating = check?.activeEffects.find((effect) => effect.reroll === 'falschspielen')
   const horseTrading = check?.activeEffects.find((effect) => effect.reroll === 'rosstaeuscher')
   // Unfähig: the first result is not final until its best die was rolled again.
   const inabilityPending = Boolean(inability && rolls && evaluated && !inabilityUse)
   const result = inabilityPending ? null : evaluated
   const critical = result?.outcome === 'critical' || result?.outcome === 'spectacular'
   const bonus = critical && typeof bonusRoll === 'number' ? bonusRoll : 0
   const skillPoints = result ? (critical ? criticalSkillPoints(result.skillPoints, skillValue, criticalRule) : Math.max(0, result.skillPoints)) + bonus : 0
   const quality = result?.quality == null ? null : qualityLevel(skillPoints) + (fateUse === 'quality' ? 1 : 0)
   const fatePoints = stats.fatePoints.current
   const rolling = rollingSlots !== null || bonusRoll === 'rolling'
   const contest = opposed && result && quality !== undefined ? evaluateOpposed(
      { success: result.success || groupQuality > 0, quality: (quality ?? 0) + groupQuality, critical, botch: isPatzer(result) },
      { success: opponent.outcome !== 'failure' && opponent.outcome !== 'botch', quality: opponent.quality,
         critical: opponent.outcome === 'critical', botch: opponent.outcome === 'botch' }, role) : null
   const otherSources = [...checkState.sources.map((source) => ({ label: translateRuleLabel(source.label, language), value: source.value })),
      ...extraSources.map((source) => ({ label: t(source.label, language), value: source.value }))]

   const spendMutation = useMutation({
      mutationFn: () => spendFatePoint(stats._id),
      onSuccess: (next) => queryClient.setQueryData(['stats', stats.charId], next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   async function roll(slots: boolean[]) {
      setRollingSlots(slots)
      const thrown = await throwD20s(dieColors.filter((_, index) => slots[index]))
      setRolls((current) => {
         let next = 0
         return slots.map((reroll, index) => reroll ? thrown[next++] : current![index])
      })
      setRollingSlots(null)
   }

   function reset() {
      setRolls(null)
      setPreviousRolls(null)
      setFateUse(null)
      setPickingReroll(false)
      setBonusRoll(null)
      setAptitudeUse(null)
      setInabilityUse(null)
      setRoutineTaken(false)
      setImprovedDie(null)
      setPickingImprove(false)
      setSecondRoll(null)
      onReset?.()
   }

   async function rerollDie(index: number): Promise<DieReroll> {
      const before = rolls![index]
      setRollingSlots(rolls!.map((_, slot) => slot === index))
      const [after] = await throwD20s([dieColors[index]])
      setRollingSlots(null)
      return { index, before, after }
   }

   async function rollAptitude(index: number) {
      const use = await rerollDie(index)
      setRolls((current) => aptitudeRolls(current!, index, use.after))
      setAptitudeUse(use)
   }

   async function rollInability() {
      const use = await rerollDie(bestDieIndex(rolls!))
      setRolls((current) => inabilityRolls(current!, use.after))
      setInabilityUse(use)
   }

   function startProbe() {
      reset()
      void roll([true, true, true])
   }

   // source: DSA5 Regelwerk, S. 216 (Falschspielen: a failed check may be repeated, not a Patzer; the repeat is binding)
   async function repeatCheck() {
      const before = rolls!
      setSecondRoll({ before, kept: null })
      await roll([true, true, true])
   }

   // source: DSA5 Regelwerk, S. 218 (Rosstäuscher: roll twice and keep the better result)
   async function rollTwice() {
      const before = rolls!
      setRollingSlots([true, true, true])
      const thrown = await throwD20s([...dieColors])
      setRollingSlots(null)
      const kept = betterResult(evaluateSkillCheck(before, targets, skillValue, botchFrom), evaluateSkillCheck(thrown, targets, skillValue, botchFrom))
      const second = kept.rolls === thrown
      setRolls(second ? thrown : before)
      setSecondRoll({ before: second ? before : thrown, kept: second ? 'second' : 'first' })
   }

   function takeRoutine() {
      reset()
      setRoutineTaken(true)
   }

   async function improveDie(index: number) {
      try {
         await spendMutation.mutateAsync()
      } catch {
         return
      }
      setFateUse('attribute')
      setImprovedDie(index)
      setPickingImprove(false)
   }

   async function rollBonus() {
      setBonusRoll('rolling')
      const [rolled] = await throwColoredDice(6, [bonusDieColor])
      setBonusRoll(rolled)
   }

   async function spendFate(use: FateUse) {
      try {
         await spendMutation.mutateAsync()
      } catch {
         return
      }
      setFateUse(use)
      if (use === 'reroll') {
         // source: DSA5 Regelwerk, S. 30 (Neuer Wurf: 1–3 dice, the second result is binding)
         setPreviousRolls(rolls)
         setPickingReroll(false)
         await roll(rerollPick)
      }
   }

   function newAttempt() {
      if (result && !result.success) setFailedAttempts(failedAttempts + 1)
      reset()
   }

   function startReroll() {
      // Preselect the dice that cost FP.
      const costly = result!.spent.map((points) => points > 0)
      setRerollPick(costly.some(Boolean) ? costly : [true, true, true])
      setPickingReroll(true)
   }

   // source: DSA5 Regelwerk, S. 29–30 (1 Schip per check; no Neuer Wurf on a Patzer; Qualität verbessern only on success)
   const fateLocked = fateUse !== null || fatePoints < 1 || rolling || spendMutation.isPending
   const rerollReason = fateUse ? 'A fate point was already used for this check.' : fatePoints < 1 ? 'No fate points left.'
      : result && isPatzer(result) ? 'Not allowed on a botch.' : null
   const qualityReason = fateUse ? 'A fate point was already used for this check.' : fatePoints < 1 ? 'No fate points left.'
      : result && !result.success ? 'Only a successful check can be improved.' : null
   const improveReason = fateUse ? 'A fate point was already used for this check.' : fatePoints < 1 ? 'No fate points left.'
      : result && isPatzer(result) ? 'Not allowed on a botch.' : result && !result.spent.some((points) => points > 0) ? 'No die cost any FP.' : null

   return createPortal(
      <div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
         <section ref={dialogRef} className={`hero-editor talent-probe-dialog${rolling ? ' is-rolling' : ''}`} lang={language} role='dialog' aria-modal='true'
            aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
            <header className='editor-header'>
               <div>
                  <p className='eyebrow'>{t(eyebrow, language)}</p>
                  <h2 id={titleId} lang='de'>{title}</h2>
                  <p className='talent-probe-subtitle'>
                     {probe.map((attribute) => getAttributeAbbreviation(attribute, language)).join('/')} · {t('FW', language)} {skillValue}
                     {skillValue !== value && <small> ({value} {signed(skillValue - value)})</small>}
                  </p>
               </div>
               <button className='icon-button editor-close' type='button' onClick={onClose} aria-label={t('Close', language)}>
                  <X size={20} />
               </button>
            </header>

            <ol className='probe-dice'>
               {probe.map((attribute, index) => {
                  const rolled = rolls?.[index]
                  const spent = result?.spent[index] ?? 0
                  const previous = fateUse === 'reroll' && rerollPick[index] ? previousRolls?.[index] : undefined
                  const improved = improvedDie === index && rawResult ? rawResult.spent[index] - spent : 0
                  const content = <>
                     <span className='probe-die-attribute'>
                        <span className='probe-die-color' style={{ background: dieColors[index] }} aria-hidden='true' />
                        {getAttributeAbbreviation(attribute, language)}
                     </span>
                     <span className='probe-die-target'>
                        {targets[index] !== base[index] && <s>{base[index]}</s>}
                        <strong className={targets[index] < base[index] ? 'is-harder' : targets[index] > base[index] ? 'is-easier' : ''}>{targets[index]}</strong>
                     </span>
                     <span className={`probe-die-roll${rolled === 1 ? ' is-one' : rolled !== undefined && rolled >= botchFrom ? ' is-twenty' : ''}`}>
                        {rollingSlots?.[index] ? '…' : rolled ?? '—'}
                     </span>
                     <span className='probe-die-cost'>
                        {result && !rolling && !routineTaken ? spent > 0 ? `−${spent} ${t('FP', language)}` : '✓' : ' '}
                        {improved > 0 && !rolling && <small>{t('Schip', language)} +{improved}</small>}
                        {previous !== undefined && !rolling && <small>{t('was', language)} {previous}</small>}
                        {!rolling && [inabilityUse, aptitudeUse].map((use, slot) => use && use !== 'picking' && use.index === index &&
                           <small key={slot}>{t('was', language)} {use.before}</small>)}
                     </span>
                  </>
                  return <li key={attribute + index} className={`probe-die${spent > 0 ? ' is-costly' : ''}`} style={{ '--die-color': dieColors[index] } as CSSProperties}>
                     {pickingImprove ? <button type='button' className='probe-die-pick' disabled={spent === 0}
                        aria-label={`${translateRuleLabel('Eigenschaft verbessern', language)} · ${getAttributeAbbreviation(attribute, language)} ${rolled}`}
                        onClick={() => void improveDie(index)}>{content}</button>
                     : aptitudeUse === 'picking' ? <button type='button' className='probe-die-pick'
                        aria-label={`${t('Begabung: reroll this die', language)} · ${getAttributeAbbreviation(attribute, language)} ${rolled}`}
                        onClick={() => void rollAptitude(index)}>{content}</button>
                     : pickingReroll ? <label className={`probe-die-pick${rerollPick[index] ? ' is-picked' : ''}`}>
                        <input type='checkbox' checked={rerollPick[index]}
                           onChange={(event) => setRerollPick((current) => current.map((picked, slot) => slot === index ? event.target.checked : picked))} />
                        {content}
                     </label> : content}
                  </li>
               })}
            </ol>

            {!evaluated && !rolling && <>
               <fieldset className='probe-difficulty'>
                  <legend>{t('Difficulty', language)}</legend>
                  <div className='probe-difficulty-presets'>
                     {difficultyPresets.map((preset) => <button key={preset.value} type='button' aria-pressed={difficulty === preset.value}
                        className={`probe-chip${difficulty === preset.value ? ' is-active' : ''}`} onClick={() => setDifficulty(preset.value)}>
                        <strong>{preset.value === 0 ? '±0' : signed(preset.value)}</strong>
                        <small>{t(preset.label, language)}</small>
                     </button>)}
                  </div>
                  <div className='probe-difficulty-custom'>
                     <span>{t('Custom', language)}</span>
                     <ProbeStepper value={difficulty} min={-20} max={20} label={t('Difficulty', language)}
                        lowerLabel={t('Harder', language)} raiseLabel={t('Easier', language)} onChange={setDifficulty} />
                  </div>
                  {examples && examples.rows.length > 0 && <details className='probe-examples'>
                     <summary>{t('Book examples', language)} <small>· {t('S.', language)} {examples.page}</small></summary>
                     <ul>
                        {examples.rows.map((row) => <li key={row.label}><button type='button' aria-pressed={difficulty === row.value}
                           className={difficulty === row.value ? 'is-active' : ''} onClick={() => setDifficulty(row.value)}>
                           <strong>{row.value === 0 ? '±0' : signed(row.value)}</strong><span lang='de'>{row.label}</span>
                        </button></li>)}
                     </ul>
                  </details>}
                  {/* source: DSA5 Regelwerk, S. 26 (no retry for a Vergleichsprobe) */}
                  {failedAttempts > 0 && !opposed && <div className='probe-retry'>
                     <RotateCcw size={18} aria-hidden='true' />
                     <span>
                        <strong>{t('Retry · attempt {count}', language).replace('{count}', () => String(failedAttempts + 1))}</strong>
                        <small>{t('Only if the GM allows it · −1 per failed attempt', language)}</small>
                     </span>
                     <button type='button' aria-pressed={retryApplied} className={`probe-chip${retryApplied ? ' is-active' : ''}`}
                        onClick={() => setRetryApplied(!retryApplied)}>
                        <strong>−{failedAttempts}</strong>
                        <small>{t(retryApplied ? 'Applied' : 'Apply', language)}</small>
                     </button>
                  </div>}
               </fieldset>
               <fieldset className='probe-difficulty'>
                  <legend>{t('Check type', language)}</legend>
                  <div className='probe-segmented'>
                     {[false, true].map((value) => <button key={String(value)} type='button' aria-pressed={opposed === value}
                        className={opposed === value ? 'is-active' : ''} onClick={() => setOpposed(value)}>
                        {t(value ? 'Opposed check' : 'Standard check', language)}
                     </button>)}
                  </div>
                  <p className='probe-segmented-note'>{t(opposed ? 'Compare QS with an opponent' : 'Success and QS', language)}</p>
                  {opposed && <>
                     <div className='probe-segmented'>
                        {roles.map((entry) => <button key={entry.key} type='button' aria-pressed={role === entry.key}
                           className={role === entry.key ? 'is-active' : ''} onClick={() => setRole(entry.key)}>
                           {t(entry.label, language)}
                        </button>)}
                     </div>
                     <p className='probe-segmented-note'>{t(roles.find((entry) => entry.key === role)!.note, language)}</p>
                     <div className='probe-difficulty-custom'>
                        <span>{t('QS of other group members', language)}</span>
                        <ProbeStepper value={groupQuality} min={0} max={60} label={t('QS of other group members', language)}
                           lowerLabel={t('Less', language)} raiseLabel={t('More', language)} onChange={setGroupQuality} />
                     </div>
                  </>}
               </fieldset>
               {setup}
               <div className='probe-modifiers'>
                  <div>
                     <strong>{t('Other modifiers', language)}: {otherTotal === 0 ? '±0' : signed(otherTotal)}</strong>
                     <small>{otherSources.length > 0
                        ? otherSources.map((source) => `${source.label} ${signed(source.value)}`).join(' · ')
                        : t(check ? 'Conditions, Belastung and owned abilities are applied automatically.' : 'None', language)}</small>
                  </div>
                  {check && <CheckModifierButton check={check} label={title} />}
               </div>
               {reasons.length > 0 && <ul className='field-error probe-blocked' role='status'>
                  {reasons.map((reason) => <li key={reason}>{t(reason, language)}</li>)}
               </ul>}
            </>}

            <div className='probe-summary' aria-live='polite'>
               {rolling ? <p className='probe-rolling'>{t('Rolling…', language)}</p>
                  : inabilityPending && rolls ? <div className='probe-outcome is-failure'>
                     <span className='probe-quality'><Undo2 size={26} /></span>
                     <span>
                        <strong>{translateRuleLabel(inability!.label, language)}</strong>
                        <small>{t('Roll the best die ({roll}) again; the new result is binding (S. 178).', language).replace('{roll}', String(rolls[bestDieIndex(rolls)]))}</small>
                     </span>
                  </div>
                  : result && quality !== null ? <div className={`probe-outcome is-success${result.outcome !== 'success' ? ' is-critical' : ''}`}>
                     <span className='probe-quality' aria-hidden='true'>{quality}</span>
                     <span>
                        <span className='probe-quality-label'>{t('QS', language)} {quality}</span>
                        <strong>{t(routineTaken ? 'Routine check' : outcomeLabels[result.outcome], language)}</strong>
                        <small>{t('FP', language)} {skillPoints} / {skillValue}
                           {critical && criticalRule && ` · ${t(criticalRule === 'doubleSkill' ? 'Critical: FP = double FW' : 'Critical: FP doubled, at least 5', language)}`}
                           {bonus > 0 && ` · ${t('Critical bonus', language)} +${bonus}`}
                           {fateUse === 'quality' && ` · ${t('Quality improved (+1 QS)', language)}`}</small>
                     </span>
                  </div>
                  : result ? <div className={`probe-outcome is-failure${isPatzer(result) ? ' is-critical' : ''}`}>
                     <span className='probe-quality'><X size={28} /></span>
                     <span>
                        <strong>{t(outcomeLabels[result.outcome], language)}</strong>
                        <small>{result.outcome === 'failure' ? `${t('Missing FP', language)}: ${-result.skillPoints}` : ' '}</small>
                     </span>
                  </div>
                  : <p className='probe-chance'>
                     <span>{t('Modifier', language)} {modifier === 0 ? '±0' : signed(modifier)}</span>
                     <span>{t('Success chance', language)}: <strong>{reasons.length > 0 ? '—' : `${Math.round(chance * 100)} %`}</strong></span>
                  </p>}
               {result && !rolling && outcomeNotes[result.outcome] && <p className='probe-note'>{t(outcomeNotes[result.outcome]!, language)}</p>}
               {/* source: DSA5 Regelwerk, S. 258 (critical spell: optionally add 1W6 FP if useful) */}
               {result && !rolling && criticalBonus && critical && bonusRoll === null && <div className='probe-bonus'>
                  <span>{t('Optional: add 1W6 FP if it helps the effect.', language)}</span>
                  <button className='quiet-button' type='button' onClick={() => void rollBonus()}><Dices size={16} />{t('Roll 1W6 FP', language)}</button>
               </div>}
            </div>

            {contest && !rolling && <section className='probe-opposed' aria-label={t('Opposed check', language)}>
               <p className='probe-opposed-label'>{t('Opponent result', language)}</p>
               <div className='probe-segmented'>
                  {opponentOutcomes.map((entry) => <button key={entry.key} type='button' aria-pressed={opponent.outcome === entry.key}
                     className={opponent.outcome === entry.key ? 'is-active' : ''} onClick={() => setOpponent({ ...opponent, outcome: entry.key })}>
                     {t(entry.label, language)}
                  </button>)}
               </div>
               {(opponent.outcome === 'success' || opponent.outcome === 'critical') && <div className='probe-difficulty-custom'>
                  <span>{t('Opponent QS', language)}</span>
                  <ProbeStepper value={opponent.quality} min={1} max={60} label={t('Opponent QS', language)}
                     lowerLabel={t('Less', language)} raiseLabel={t('More', language)} onChange={(value) => setOpponent({ ...opponent, quality: value })} />
               </div>}
               <div className={`probe-outcome ${contest.winner === 'own' ? 'is-success' : 'is-failure'}`} role='status'>
                  <span>
                     <strong>{t(contest.winner === 'own' ? 'You win' : contest.winner === 'opponent' ? 'The opponent wins' : 'Draw', language)}
                        {contest.netQuality !== null && contest.winner !== 'draw' && (contest.netQuality > 0 ? ` · ${t('Net QS', language)} ${contest.netQuality}` : ` · ${t('tie', language)}`)}</strong>
                     <small>{t(contest.reason, language)}{groupQuality > 0 && ` · ${t('Your QS', language)}: ${(quality ?? 0) + groupQuality} (${t('group', language)} +${groupQuality})`}</small>
                  </span>
               </div>
            </section>}

            {result && !rolling && renderResult?.({ result, quality, contest, routine: routineTaken })}

            {inabilityPending && !rolling && <section className='probe-fate' aria-label={translateRuleLabel(inability!.label, language)}>
               <div className='probe-fate-actions'>
                  <button className='primary-button' type='button' autoFocus onClick={() => void rollInability()}>
                     <Undo2 size={16} />{t('Roll the best die again', language)}
                  </button>
               </div>
            </section>}

            {(cheating || horseTrading) && result && !routineTaken && !rolling && fateUse === null && <section className='probe-fate'
               aria-label={translateRuleLabel((cheating ?? horseTrading)!.label, language)}>
               <p className='probe-fate-balance'><RotateCcw size={16} /><span lang='de'>{translateRuleLabel((cheating ?? horseTrading)!.label, language)}</span>
                  <small> · {t('S.', language)} {cheating ? 216 : 218}</small>
                  {secondRoll && <small> · {secondRoll.kept === null ? t('Repeated; the new result is binding.', language)
                     : t('Rolled twice ({other}); the better result counts.', language).replace('{other}', secondRoll.before.join('/'))}</small>}</p>
               {!secondRoll && <div className='probe-fate-actions'>
                  {cheating ? <button className='quiet-button' type='button' disabled={result.success || isPatzer(result)} onClick={() => void repeatCheck()}>
                     <RotateCcw size={16} />{t('Repeat the failed check', language)}
                  </button> : <button className='quiet-button' type='button' onClick={() => void rollTwice()}>
                     <Dices size={16} />{t('Roll again, keep the better', language)}
                  </button>}
                  {cheating && (result.success || isPatzer(result)) && <small>{t(isPatzer(result) ? 'Not allowed on a botch.' : 'Only after a failed check.', language)}</small>}
               </div>}
            </section>}

            {aptitude && result && !routineTaken && !rolling && <section className='probe-fate' aria-label={translateRuleLabel(aptitude.label, language)}>
               <p className='probe-fate-balance'><Dices size={16} />{translateRuleLabel(aptitude.label, language)} <small>· {t('S.', language)} 164</small>
                  {aptitudeUse && aptitudeUse !== 'picking' && <small> · {t('Used: {before} → {after}, the better result counts.', language)
                     .replace('{before}', String(aptitudeUse.before)).replace('{after}', String(aptitudeUse.after))}</small>}</p>
               {aptitudeUse === 'picking' ? <div className='probe-fate-actions'>
                  <p>{t('Choose one die. The better of both results counts.', language)}</p>
                  <button className='quiet-button' type='button' onClick={() => setAptitudeUse(null)}>{t('Cancel', language)}</button>
               </div> : aptitudeUse === null && <div className='probe-fate-actions'>
                  <button className='quiet-button' type='button' disabled={!canUseAptitude(result) || pickingReroll} onClick={() => setAptitudeUse('picking')}>
                     <Dices size={16} />{t('Reroll one die', language)}
                  </button>
                  {!canUseAptitude(result) && <small>{t('Not after a double or triple 20.', language)}</small>}
               </div>}
            </section>}

            {fate && result && !routineTaken && !rolling && <section className='probe-fate' aria-label={t('Fate points', language)}>
               <p className='probe-fate-balance'><Star size={16} />{t('Fate points', language)}: <strong>{fatePoints} / {stats.fatePoints.max}</strong>
                  {fateUse && <small> · {fateUse === 'attribute' ? translateRuleLabel('Eigenschaft verbessern', language)
                     : t(fateUse === 'reroll' ? 'Reroll used' : 'Quality improved (+1 QS)', language)}</small>}</p>
               {pickingImprove ? <div className='probe-fate-actions'>
                  <p>{t('Choose one die that cost FP. It counts {value} better (S. 222).', language).replace('{value}', String(fateImprovement))}</p>
                  <button className='quiet-button' type='button' onClick={() => setPickingImprove(false)}>{t('Cancel', language)}</button>
               </div> : pickingReroll ? <div className='probe-fate-actions'>
                  <p>{t('Choose the dice to reroll. The new result is binding.', language)}</p>
                  <button className='quiet-button' type='button' onClick={() => setPickingReroll(false)}>{t('Cancel', language)}</button>
                  <button className='primary-button' type='button' disabled={!rerollPick.some(Boolean) || fateLocked} onClick={() => void spendFate('reroll')}>
                     <RotateCcw size={16} />{t('Reroll selected (1 fate point)', language)}
                  </button>
               </div> : <div className='probe-fate-actions'>
                  <button className='quiet-button' type='button' disabled={fateLocked || rerollReason !== null || aptitudeUse === 'picking'} onClick={startReroll}>
                     <RotateCcw size={16} />{t('Reroll', language)}
                  </button>
                  <button className='quiet-button' type='button' disabled={fateLocked || qualityReason !== null} onClick={() => void spendFate('quality')}>
                     <Sparkles size={16} />{t('Improve quality (+1 QS)', language)}
                  </button>
                  {ownsImprove && <button className='quiet-button' type='button' disabled={fateLocked || improveReason !== null || aptitudeUse === 'picking'}
                     onClick={() => setPickingImprove(true)}><Sparkles size={16} />{translateRuleLabel('Eigenschaft verbessern', language)} (+{fateImprovement})</button>}
                  {!fateUse && [...new Set([rerollReason, qualityReason, ...(ownsImprove ? [improveReason] : [])])].filter((reason) => reason !== null)
                     .map((reason) => <small key={reason}>{t(reason, language)}</small>)}
               </div>}
            </section>}

            <footer className='editor-actions'>
               {evaluated && !rolling
                  ? <>
                     <button className='quiet-button' type='button' onClick={newAttempt}><Dices size={18} />{t('Roll again', language)}</button>
                     <button className='primary-button' type='button' autoFocus onClick={onClose}>{t('Done', language)}</button>
                  </>
                  : <>
                     <button className='quiet-button' type='button' onClick={onClose}>{t('Cancel', language)}</button>
                     {routine && <button className='quiet-button' type='button' disabled={reasons.length > 0 || rolling || !routine.allowed}
                        title={t(routine.reason ?? 'Not under time pressure (S. 184).', language)} onClick={takeRoutine}>
                        <Check size={18} />{t('Take routine', language)}{routine.allowed && ` · ${t('FP', language)} ${routine.skillPoints}`}
                     </button>}
                     <button className='primary-button' type='button' disabled={reasons.length > 0 || rolling} onClick={startProbe}>
                        <Dices size={18} />{t('Roll check', language)}
                     </button>
                  </>}
            </footer>
         </section>
      </div>, document.body,
   )
}

export function ProbeStepper({ value, min, max, label, lowerLabel, raiseLabel, onChange }: {
   value: number; min: number; max: number; label: string; lowerLabel: string; raiseLabel: string; onChange: (value: number) => void
}) {
   return <div className='dice-count-control'>
      <button className='icon-button' type='button' aria-label={lowerLabel} disabled={value <= min} onClick={() => onChange(value - 1)}><Minus size={16} /></button>
      <input type='number' inputMode='numeric' min={min} max={max} value={value} aria-label={label}
         onFocus={(event) => event.target.select()}
         onChange={(event) => onChange(Math.max(min, Math.min(max, Math.trunc(event.target.valueAsNumber) || 0)))} />
      <button className='icon-button' type='button' aria-label={raiseLabel} disabled={value >= max} onClick={() => onChange(value + 1)}><Plus size={16} /></button>
   </div>
}
