import { Dices, X } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { useLanguageStore } from '@/locales/languageStore'
import { t, translateRuleLabel } from '@/locales/translation'
import { CheckModifierButton } from './CheckValue'
import { useCheckState } from './checkState'
import { improveRoll, type CombatOutcome, type D20Roll } from './combatRoll'
import { rollD20 } from './d20'
import { FateD20Actions, type D20FateUse } from './FateActions'
import { ProbeStepper, type ProbeExtraSource } from './ProbeDialog'
import { attributeDifficultyPresets } from './skillCheck'
import type { Stats } from './statsApi'
import { attributeLabels, getAttributeAbbreviation, type TalentAttribute } from './talentCatalog'

const dieColor = '#c0392b'
const signed = (value: number) => value > 0 ? `+${value}` : `${value}`
const outcomeLabels: Record<CombatOutcome, string> = {
   success: 'Success',
   failure: 'Failed',
   critical: 'Critical success',
   criticalUnconfirmed: 'Critical, not confirmed',
   botch: 'Botch',
   botchAverted: 'Botch averted',
}

// Eigenschaftsprobe: 1W20 against the modified attribute (S. 20–21); setup → roll → result → Done.
// `extraSources` / `renderResult`: a GM check request (its modifier, "Send the result")
export function AttributeCheckDialog({ stats, attribute, extraSources = [], renderResult, onClose }: {
   stats: Stats; attribute: TalentAttribute; extraSources?: ProbeExtraSource[]; renderResult?: (result: D20Roll) => ReactNode; onClose: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const titleId = useId()
   const dialogRef = useModalKeyboard(onClose)
   const check = useCheckState(stats, 'attribute', attribute)
   const [difficulty, setDifficulty] = useState(0)
   const [rolling, setRolling] = useState(false)
   const [result, setResult] = useState<D20Roll | null>(null)
   const [previous, setPrevious] = useState<number | null>(null)
   const [fateUsed, setFateUsed] = useState<D20FateUse | null>(null)
   const name = t(attributeLabels[attribute], language)
   const abbreviation = getAttributeAbbreviation(attribute, language)
   const base = stats[attribute]
   const extra = extraSources.reduce((sum, source) => sum + source.value, 0)
   const target = base + check.total + difficulty + extra
   // source: DSA5 Regelwerk, S. 20 (an effective value of 0 or less allows no check)
   const reasons = [...check.blocked, ...check.unresolved, ...(target <= 0 ? ['Effective target ≤ 0: no check possible.'] : [])]

   async function roll() {
      setRolling(true)
      setFateUsed(null)
      setPrevious(null)
      setResult(await rollD20(dieColor, target))
      setRolling(false)
   }

   async function useFate(use: D20FateUse) {
      if (!result) return
      setFateUsed(use)
      if (use === 'improve') {
         setResult(improveRoll(result) ?? result)
         return
      }
      setPrevious(result.roll)
      setRolling(true)
      setResult(await rollD20(dieColor, result.target))
      setRolling(false)
   }

   return createPortal(
      <div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
         <section ref={dialogRef} className={`hero-editor talent-probe-dialog${rolling ? ' is-rolling' : ''}`} lang={language} role='dialog' aria-modal='true'
            aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
            <header className='editor-header'>
               <div>
                  <p className='eyebrow'>{t('Attribute check', language)}</p>
                  <h2 id={titleId}>{name}</h2>
                  <p className='talent-probe-subtitle'>{abbreviation} {base}{target !== base && ` → ${target}`}</p>
               </div>
               <button className='icon-button editor-close' type='button' onClick={onClose} aria-label={t('Close', language)}><X size={20} /></button>
            </header>

            {!result && !rolling && <>
               <fieldset className='probe-difficulty'>
                  <legend>{t('Difficulty', language)}</legend>
                  <div className='probe-difficulty-presets'>
                     {attributeDifficultyPresets.map((preset) => <button key={preset.value} type='button' aria-pressed={difficulty === preset.value}
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
               </fieldset>
               <div className='probe-modifiers'>
                  <div>
                     <strong>{t('Other modifiers', language)}: {check.total === 0 ? '±0' : signed(check.total)}</strong>
                     <small>{check.sources.length > 0
                        ? check.sources.map((source) => `${translateRuleLabel(source.label, language)} ${signed(source.value)}`).join(' · ')
                        : t('Conditions, Belastung and owned abilities are applied automatically.', language)}
                        {extraSources.map((source) => <span key={source.label}> · {t(source.label, language)} {signed(source.value)}</span>)}</small>
                  </div>
                  <CheckModifierButton check={check} label={name} />
               </div>
               {reasons.length > 0 && <ul className='field-error probe-blocked' role='status'>
                  {reasons.map((reason) => <li key={reason}>{t(reason, language)}</li>)}
               </ul>}
            </>}

            <div className='probe-summary' aria-live='polite'>
               {rolling ? <p className='probe-rolling'>{t('Rolling…', language)}</p>
                  : result ? <div className={`fight-roll ${result.success ? 'is-success' : 'is-failure'}`}>
                     <span className={`fight-die${result.roll === 1 ? ' is-one' : result.roll === 20 ? ' is-twenty' : ''}`}>{result.roll}</span>
                     <span>
                        <strong>{t(outcomeLabels[result.outcome], language)}{result.improved && ` (+2 ${t('Schip', language)})`}</strong>
                        <small>{t('Target', language)} {result.target}
                           {result.confirmation !== undefined && ` · ${t('Confirmation roll', language)} ${result.confirmation}`}
                           {previous !== null && ` · ${t('was', language)} ${previous}`}</small>
                     </span>
                  </div>
                  : <p className='probe-chance'>
                     <span>{t('Target', language)}: <strong>{target}</strong></span>
                     <span>{t('Success chance', language)}: <strong>{reasons.length ? '—' : `${Math.round(Math.min(19, Math.max(1, target)) / 20 * 100)} %`}</strong></span>
                  </p>}
            </div>

            {result && !rolling && <section className='probe-fate' aria-label={t('Fate points', language)}>
               <FateD20Actions stats={stats} result={result} used={fateUsed} onUse={useFate} improveAbility='Eigenschaft verbessern' />
            </section>}
            {result && !rolling && renderResult?.(result)}

            <footer className='editor-actions'>
               {result && !rolling
                  ? <>
                     <button className='quiet-button' type='button' onClick={() => { setResult(null); setPrevious(null) }}><Dices size={18} />{t('Roll again', language)}</button>
                     <button className='primary-button' type='button' autoFocus onClick={onClose}>{t('Done', language)}</button>
                  </>
                  : <>
                     <button className='quiet-button' type='button' onClick={onClose}>{t('Cancel', language)}</button>
                     <button className='primary-button' type='button' disabled={reasons.length > 0 || rolling} onClick={() => void roll()}>
                        <Dices size={18} />{t('Roll check', language)}
                     </button>
                  </>}
            </footer>
         </section>
      </div>, document.body,
   )
}
