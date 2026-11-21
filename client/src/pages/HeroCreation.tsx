import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Check, ChevronDown, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { DashboardHeader } from '@/components/DashboardHeader'
import { EntriesStep, FinishStep, SkillsStep } from '@/features/creation/CreationBuild'
import { CombatAbilitiesStep } from '@/features/creation/CreationCombat'
import { ProfessionStep } from '@/features/creation/CreationProfession'
import { AttributesStep, BasicsStep, CultureStep, SpeciesStep } from '@/features/creation/CreationOrigin'
import {
   creationDraftsKey, creationSections, finishCreationDraft, sectionLabels, useCreationDraft, useCreationReference, type CreationSection, type StepProps,
} from '@/features/creation/creationApi'
import { issueText } from '@/features/creation/creationLabels'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'

// Guided hero creation (S. 37–59): one section per step, a breadcrumb with each step's state, and the AP account always in view.
export function HeroCreation() {
   const language = useLanguageStore((state) => state.language)
   const { draftId = '' } = useParams()
   const navigate = useNavigate()
   const queryClient = useQueryClient()
   const reference = useCreationReference()
   const { draft, current, isLoading, isError, saving, update, goTo } = useCreationDraft(draftId)
   const [menuOpen, setMenuOpen] = useState(false)
   const finish = useMutation({
      mutationFn: () => finishCreationDraft(draftId),
      onSuccess: ({ charId }) => {
         void queryClient.invalidateQueries({ queryKey: ['heroes'] })
         void queryClient.invalidateQueries({ queryKey: creationDraftsKey })
         toast.success(t('Hero created.', language))
         navigate(`/heroes/${charId}`)
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   if (isError) return <main className='dashboard-shell' lang={language}><DashboardHeader /><section className='dashboard-content'>
      <div className='state-panel'>{t('This draft was not found.', language)} <Link to='/dashboard'>{t('Back to the heroes', language)}</Link></div></section></main>
   if (isLoading || !draft || !current || !reference.data) return <main className='dashboard-shell' lang={language}><DashboardHeader />
      <section className='dashboard-content'><div className='state-panel'>{t('Loading…', language)}</div></section></main>

   const { ledger } = draft
   const step = current.step
   const index = creationSections.indexOf(step)
   const props: StepProps = { data: current.data, ledger, reference: reference.data, update }
   const stateOf = (section: CreationSection) => {
      // Open GM approvals are warnings ("?"), rule violations are errors ("!"); the finish checks count only once you get there.
      if (ledger.violations.some((issue) => issue.section === section && !issue.key.startsWith('approval:') &&
         !(section === 'finish' && index < creationSections.indexOf('finish')))) return 'error'
      if (ledger.warnings.some((warning) => warning.section === section && !warning.approved)) return 'warning'
      return creationSections.indexOf(section) < index ? 'done' : 'todo'
   }
   const balanceClass = ledger.balance < 0 ? ' is-negative' : ledger.balance > 10 ? ' is-high' : ' is-ok'

   return <main className='dashboard-shell' lang={language}>
      <DashboardHeader />
      <section className='dashboard-content creation-shell'>
         <Link className='back-link' to='/dashboard'><ArrowLeft size={17} /> {t('Heroes', language)}</Link>
         <header className='creation-header'>
            <div className='creation-header-top'>
               <h1>{current.data.name || t('New hero', language)}</h1>
               <span className={`creation-balance${balanceClass}`} title={t('AP left: must end between 0 and 10 (S. 38, 56).', language)}>
                  {ledger.balance} / {ledger.apTotal} {t('AP', language)}
               </span>
               {saving && <Loader2 size={16} className='creation-saving' aria-label={t('Saving…', language)} />}
            </div>
            <div className='creation-chips'>
               <span className={ledger.usage.advantageAp > 80 ? 'is-over' : ''}>{t('Advantages', language)} {ledger.usage.advantageAp}/80</span>
               <span className={ledger.usage.disadvantageAp > 80 ? 'is-over' : ''}>{t('Disadvantages', language)} {ledger.usage.disadvantageAp}/80</span>
               <span className={ledger.usage.attributeSum > ledger.caps.attributeSum ? 'is-over' : ''}>Σ {t('Attributes', language)} {ledger.usage.attributeSum}/{ledger.caps.attributeSum}</span>
               {ledger.usage.spells > 0 && <span>{t('Spells', language)} {ledger.usage.spells}/{ledger.caps.spells}</span>}
            </div>
            <nav className='creation-crumbs' aria-label={t('Creation steps', language)}>
               <button type='button' className='creation-crumbs-toggle' aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
                  {t('Step', language)} {index + 1}/{creationSections.length} · {t(sectionLabels[step], language)} <ChevronDown size={15} />
               </button>
               <ol className={menuOpen ? 'is-open' : ''}>
                  {creationSections.map((section, position) => {
                     const state = stateOf(section)
                     return <li key={section}>
                        <button type='button' aria-current={section === step ? 'step' : undefined} className={`creation-crumb is-${state}${section === step ? ' is-current' : ''}`}
                           onClick={() => { goTo(section); setMenuOpen(false) }}>
                           <span className='creation-crumb-mark'>{state === 'done' ? <Check size={12} /> : state === 'error' ? '!' : state === 'warning' ? '?' : position + 1}</span>
                           {t(sectionLabels[section], language)}
                           {ledger.costs[section] !== 0 && <small>{ledger.costs[section]}</small>}
                        </button>
                     </li>
                  })}
               </ol>
            </nav>
         </header>

         <div className='overview-section creation-body'>
            <h2>{t(sectionLabels[step], language)}</h2>
            {ledger.violations.filter((issue) => issue.section === step && step !== 'finish' && !issue.key.startsWith('approval:')).length > 0 && <ul className='creation-issues'>
               {ledger.violations.filter((issue) => issue.section === step && !issue.key.startsWith('approval:')).map((issue, position) =>
                  <li key={position}>{issueText(issue, language)}</li>)}
            </ul>}
            {step === 'basics' && <BasicsStep {...props} />}
            {step === 'species' && <SpeciesStep {...props} />}
            {step === 'culture' && <CultureStep {...props} />}
            {step === 'attributes' && <AttributesStep {...props} />}
            {step === 'profession' && <ProfessionStep {...props} />}
            {step === 'entries' && <EntriesStep {...props} categories={['advantages', 'disadvantages']} />}
            {step === 'skills' && <SkillsStep {...props} />}
            {step === 'abilities' && <>
               <EntriesStep {...props} categories={['generalSpecialAbilities', 'languages', 'scripts']} />
               <CombatAbilitiesStep {...props} />
            </>}
            {step === 'finish' && <FinishStep {...props} startAge={draft.startAge} onGoTo={goTo} onFinish={() => finish.mutate()} finishing={finish.isPending} />}
            {step === 'culture' && ledger.warnings.filter((warning) => warning.section === 'culture').map((warning) =>
               <label key={warning.key} className='creation-approval'><input type='checkbox' checked={warning.approved}
                  onChange={(event) => update({ approvals: event.target.checked ? [...current.data.approvals, warning.key] : current.data.approvals.filter((key) => key !== warning.key) })} />
                  {issueText(warning, language)} · {t('GM approved', language)}</label>)}
         </div>

         <footer className='creation-footer'>
            <button className='quiet-button' type='button' disabled={index === 0} onClick={() => goTo(creationSections[index - 1])}><ArrowLeft size={16} />{t('Back', language)}</button>
            {index < creationSections.length - 1 && <button className='primary-button' type='button' onClick={() => goTo(creationSections[index + 1])}>
               <span className='creation-next-text'>{t('Next', language)}: {t(sectionLabels[creationSections[index + 1]], language)}</span><ArrowRight size={16} /></button>}
         </footer>
      </section>
   </main>
}
