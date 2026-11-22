import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { useCheckState } from './checkState'
import { ProbeDialog, ProbeStepper, type ProbeExtraSource, type ProbeResultState } from './ProbeDialog'
import { isPatzer, type OpposedRole } from './skillCheck'
import type { Stats } from './statsApi'
import { getTalentBurdenLevel, talentCriticalRules, type TalentDefinition } from './talentCatalog'
import { talentDetails } from './talentDetails'
import { applicationLabel } from './talentApplicationGlosses'
import { TalentResultActions } from './TalentResultActions'
import { ownsEntry, useTalentProbe } from './talentOptions'

type Tools = 'proper' | 'poor' | 'none'

// `extraSources` / `renderResult`: used by a running Sammelprobe (penalty, "Record attempt").
// `fixedApplication`: the caller needs exactly this application (store haggling = Feilschen); no picker is shown.
export function TalentProbeDialog({ stats, talent, value, extraSources = [], opposedRole, fixedApplication, renderResult, onClose }: {
   stats: Stats; talent: TalentDefinition; value: number; extraSources?: ProbeExtraSource[]; opposedRole?: OpposedRole
   fixedApplication?: string; renderResult?: (state: ProbeResultState) => ReactNode; onClose: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const burdenLevel = getTalentBurdenLevel(talent.key)
   const probe = useTalentProbe(talent)
   const check = useCheckState(stats, 'talent', talent.key, {
      burden: burdenLevel === 'maybe' ? 'maybe' : burdenLevel === 'yes', complex: talent.category === 'knowledge',
   })
   const details = talentDetails[talent.key]
   const [application, setApplication] = useState(fixedApplication ?? '')
   const hintId = useId()
   const [allowUnknown, setAllowUnknown] = useState(false)
   const [tools, setTools] = useState<Tools>('proper')
   const [toolPenalty, setToolPenalty] = useState(1)

   // source: DSA5 Regelwerk, S. 186 (a new application needs its advantage/SF; without it only if the GM allows, at least −3)
   const newApplication = details.newApplications.find((entry) => entry.name === application)
   const locked = newApplication !== undefined && !ownsEntry(stats, newApplication.unlockedBy)
   // source: DSA5 Regelwerk, S. 184 (poor tools −1 to −5, no tools: no check), S. 218 (Meister der Improvisation offsets up to 2)
   const improvises = talent.category === 'craft' && stats.generalSpecialAbilities.includes('Meister der Improvisation')
   const sources: ProbeExtraSource[] = [...extraSources,
      ...(locked && allowUnknown ? [{ label: 'Without the application (GM allows)', value: -3 }] : []),
      ...(tools === 'poor' ? [{ label: 'Poor tools', value: -toolPenalty }] : []),
      ...(tools === 'poor' && improvises ? [{ label: 'Meister der Improvisation', value: Math.min(2, toolPenalty) }] : [])]
   const blocked = [
      ...(locked && !allowUnknown ? [t('New application not unlocked: needs {entry} (S. 186).', language).replace('{entry}', newApplication.unlockedBy)] : []),
      ...(tools === 'none' ? ['No tools: the check is not possible (S. 184).'] : [])]

   // Picking an application selects the hero's matching Fertigkeitsspezialisierung (+2 FW, S. 216) and drops the others.
   function selectSpecialization(next: string) {
      const specializations = check.effects.filter((effect) => effect.group === 'specialization')
      const match = next ? specializations.find((effect) => effect.label.endsWith(`: ${next})`)) : undefined
      check.save({ ...check.context, effects: [...check.context.effects.filter((id) => !specializations.some((effect) => effect.id === id)),
         ...(match ? [match.id] : [])] })
   }
   function chooseApplication(next: string) {
      setApplication(next)
      setAllowUnknown(false)
      selectSpecialization(next)
   }

   // On open, the selected Fertigkeitsspezialisierung follows the application shown (the fixed one, else "General use"):
   // the check context outlives the dialog, so an earlier choice (e.g. store haggling) must not carry over unseen.
   const synced = useRef(false)
   useEffect(() => {
      if (synced.current) return
      synced.current = true
      const initial = fixedApplication ?? ''
      const specializations = check.effects.filter((effect) => effect.group === 'specialization')
      const selected = specializations.filter((effect) => check.context.effects.includes(effect.id))
      const wanted = initial ? specializations.filter((effect) => effect.label.endsWith(`: ${initial})`)) : []
      if (selected.length !== wanted.length || selected.some((effect) => !wanted.includes(effect))) selectSpecialization(initial)
   })

   const specializationEffect = application
      ? check.effects.find((effect) => effect.group === 'specialization' && effect.label.endsWith(`: ${application})`))
      : undefined
   const specialization = specializationEffect !== undefined && check.context.effects.includes(specializationEffect.id)

   const setup = <fieldset className='probe-difficulty probe-talent-setup'>
      <legend>{t('Application', language)}</legend>
      {fixedApplication ? <p className='probe-fixed-application'>{applicationLabel(fixedApplication, language)}</p> : <select value={application} aria-label={t('Application', language)} aria-describedby={hintId} onChange={(event) => chooseApplication(event.target.value)}>
         <option value=''>{t('General use', language)}</option>
         {details.applications.map((name) => <option key={name} value={name}>{applicationLabel(name, language)}</option>)}
         {details.newApplications.length > 0 && <optgroup label={t('New applications (S. 186)', language)}>
            {details.newApplications.map((entry) => <option key={entry.name} value={entry.name}>
               {applicationLabel(entry.name, language)}{ownsEntry(stats, entry.unlockedBy) ? '' : ` (${t('not unlocked', language)})`}
            </option>)}
         </optgroup>}
      </select>}
      <small id={hintId} className='probe-segmented-note'>{t(fixedApplication
         ? 'This check always uses this application. If the hero has a Fertigkeitsspezialisierung for it, its +2 FW is applied (S. 216).'
         : 'What is the hero doing with the talent? If they have a Fertigkeitsspezialisierung for it, its +2 FW is applied (S. 216). New applications need their advantage or special ability (S. 186). “General use” rolls without either.', language)}</small>
      {specialization && <small className='probe-segmented-note is-active'>{t('Fertigkeitsspezialisierung applied: +2 FW.', language)}</small>}
      {locked && <label className='probe-difficulty-custom'>
         <input type='checkbox' checked={allowUnknown} onChange={(event) => setAllowUnknown(event.target.checked)} />
         {t('GM allows the check without it (−3 or more)', language)}
      </label>}
      {details.tools && <>
         <p className='probe-segmented-note'>{t('Tools', language)}: <span lang='de'>{details.tools}</span></p>
         <div className='probe-segmented'>
            {(['proper', 'poor', 'none'] as const).map((key) => <button key={key} type='button' aria-pressed={tools === key}
               className={tools === key ? 'is-active' : ''} onClick={() => setTools(key)}>
               {t(key === 'proper' ? 'Proper tools' : key === 'poor' ? 'Poor tools' : 'No tools', language)}
            </button>)}
         </div>
         {tools === 'poor' && <div className='probe-difficulty-custom'>
            <span>{t('Tool penalty', language)}</span>
            <ProbeStepper value={toolPenalty} min={1} max={5} label={t('Tool penalty', language)}
               lowerLabel={t('Less', language)} raiseLabel={t('More', language)} onChange={setToolPenalty} />
            {improvises && <small>{t('Meister der Improvisation offsets up to 2 (S. 218).', language)}</small>}
         </div>}
      </>}
   </fieldset>

   // The book's examples for this talent's failed, critical and botched checks (S. 188–213).
   function notes({ result, routine }: ProbeResultState) {
      if (routine) return null
      const critical = result.outcome === 'critical' || result.outcome === 'spectacular'
      const text = isPatzer(result) ? details.botch : critical ? details.critical : result.success ? null : details.failure
      return text && <p className='probe-talent-notes' lang='de'>{text} <small>(S. {details.page})</small></p>
   }

   return <ProbeDialog stats={stats} eyebrow='Skill check' title={t(talent.label, language)} probe={probe}
      value={value} routine criticalRule={talentCriticalRules[talent.key]} check={check} extraSources={sources} blocked={blocked}
      examples={{ page: details.page, rows: details.examples }} setup={setup} opposedRole={opposedRole}
      renderResult={(state) => <>{notes(state)}<TalentResultActions stats={stats} talentKey={talent.key} state={state} />{renderResult?.(state)}</>} onClose={onClose} />
}
