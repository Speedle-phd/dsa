import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Check, Info, Pencil, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DieIcon } from '@/components/DieIcon'
import { Tooltip } from '@/components/Tooltip'
import { toast } from 'sonner'
import { getErrorMessage } from '@/utils/errorHandling'
import { t } from '@/locales/translation'
import { useLanguageStore } from '@/locales/languageStore'
import type { Hero } from './heroApi'
import {
   getStatsForHero,
   levelUpTalent,
   updateTalents,
   type Stats,
   type TalentEntry,
} from './statsApi'
import { AdvancementValue } from './AdvancementControls'
import { nextStepCost, useAdvancementMode } from './advancement'
import { CheckValue, TalentSkillValue } from './CheckValue'
import { CharacterEntryList } from './CharacterEntryList'
import { TalentProbeDialog } from './TalentProbeDialog'
import { talentDetails } from './talentDetails'
import { hardestRoutineModifier } from './skillCheck'
import { useTalentOptions, useTalentProbe } from './talentOptions'
import { ExtendedChecks } from './ExtendedChecks'
import {
   attributeLabels,
   attributeModifierColumns,
   attributeModifierRows,
   baseAttributeOrder,
   getAttributeAbbreviation,
   getTalentBurdenLevel,
   qualityLevelTable,
   talentCategories,
   talentCategoryLabels,
   talentsByCategory,
   type BurdenLevel,
   type TalentDefinition,
} from './talentCatalog'

function burdenLabelKey(level: BurdenLevel) {
   return level === 'yes' ? 'Yes' : level === 'maybe' ? 'Maybe' : 'No'
}

// source: DSA5 Regelwerk, S. 184–185 (routine FP and the hardest modifier that still allows a routine check)
function RoutineCell({ attributes, value, language }: { attributes: number[]; value: number | null; language: 'de' | 'en' }) {
   const trade = useTalentOptions((state) => state.routineTrade)
   if (value === null) return <>—</>
   const hardest = hardestRoutineModifier(attributes, value, trade)
   if (hardest === null) return <span title={t(attributes.some((attribute) => attribute < 13) && !trade
      ? 'Routine needs 13 or more in every probe attribute.' : 'FW too low for a routine check at this modifier.', language)}>—</span>
   return <span title={t('Routine FP, allowed up to this modifier', language)}>
      {Math.ceil(value / 2)} <small>({hardest === 0 ? '±0' : hardest > 0 ? `+${hardest}` : hardest})</small>
   </span>
}

function TalentRow({
   talent,
   entry,
   onLevelUp,
   isLevelingUp,
   onSaveNote,
   isSavingNote,
   language,
   stats,
   spendAP,
}: {
   talent: TalentDefinition
   entry: TalentEntry | undefined
   onLevelUp: (input: { key: string; value: number }) => void
   isLevelingUp: boolean
   onSaveNote: (key: string, notes: string) => void
   isSavingNote: boolean
   language: 'de' | 'en'
   stats: Stats
   spendAP: boolean
}) {
   const value = entry?.value ?? null
   const isLocked = value === null
   const [isEditingNote, setIsEditingNote] = useState(false)
   const [noteDraft, setNoteDraft] = useState(entry?.notes ?? '')
   const [isRolling, setIsRolling] = useState(false)
   const probe = useTalentProbe(talent)

   function startEditing() {
      setNoteDraft(entry?.notes ?? '')
      setIsEditingNote(true)
   }

   function submitNote() {
      onSaveNote(talent.key, noteDraft)
      setIsEditingNote(false)
   }

   return (
      <tr className={isLocked ? 'talent-row is-locked' : 'talent-row'}>
         <td data-label={t('Talent', language)}>
            <div className='talent-name-cell'>
               <button type='button' className='talent-probe-button' disabled={isLocked}
                  aria-label={`${t('Roll check', language)}: ${t(talent.label, language)}`}
                  title={t(isLocked ? 'Activate this talent to roll a check.' : 'Roll check', language)}
                  onClick={() => setIsRolling(true)}>
                  <DieIcon sides={20} />
               </button>
               <span className='talent-name'>{t(talent.label, language)} <TalentInfo talent={talent} language={language} /></span>
               <CheckValue stats={stats} base={probe.map((attr) => stats[attr])} kind='talent'
                  checkKey={talent.key} label={t(talent.label, language)} complex={talent.category === 'knowledge'}
                  burden={getTalentBurdenLevel(talent.key) === 'maybe' ? 'maybe' : getTalentBurdenLevel(talent.key) === 'yes'} />
            </div>
            {isRolling && value !== null && <TalentProbeDialog stats={stats} talent={talent} value={value} onClose={() => setIsRolling(false)} />}
         </td>
         <td className='talent-probe-cell' data-label={t('Probe', language)}>
            {probe
               .map((attr) => getAttributeAbbreviation(attr, language))
               .join('/')}
         </td>
         <td data-label={t('BE', language)}>
            {t(burdenLabelKey(getTalentBurdenLevel(talent.key)), language)}
         </td>
         <td data-label={t('StF', language)}>{talent.stfClass.toUpperCase()}</td>
         <td data-label={t('FW', language)}>
            <div className='talent-value-inner'>
               {value === null ? <span>—</span> : <TalentSkillValue stats={stats} checkKey={talent.key} value={value} />}
               <AdvancementValue label={t(talent.label, language)} value={value}
                  maximum={spendAP ? Math.min(25, stats.skillMaxima.talents[talent.key] ?? 25) : 25}
                  cost={nextStepCost(value, talent.stfClass)} availableAP={stats.experience.total - stats.experience.spent}
                  spendAP={spendAP} pending={isLevelingUp} onChange={(target) => onLevelUp({ key: talent.key, value: target })} />
            </div>
         </td>
         <td data-label={t('RPr', language)}><RoutineCell attributes={probe.map((attr) => stats[attr])} value={value} language={language} /></td>
         <td
            className='talent-notes-cell'
            data-label={t('Anmerkung', language)}
         >
            {isEditingNote ? (
               <div className='talent-note-edit'>
                  <input
                     value={noteDraft}
                     onChange={(event) => setNoteDraft(event.target.value)}
                     autoFocus
                  />
                  <button
                     type='button'
                     className='icon-button'
                     aria-label={t('Save note', language)}
                     disabled={isSavingNote}
                     onClick={submitNote}
                  >
                     <Check size={14} />
                  </button>
                  <button
                     type='button'
                     className='icon-button'
                     aria-label={t('Cancel', language)}
                     onClick={() => setIsEditingNote(false)}
                  >
                     <X size={14} />
                  </button>
               </div>
            ) : (
               <div className='talent-note-display'>
                  <span>{entry?.notes || ''}</span>
                  <button
                     type='button'
                     className='icon-button'
                     aria-label={t('Edit note', language)}
                     onClick={startEditing}
                  >
                     <Pencil size={13} />
                  </button>
               </div>
            )}
         </td>
      </tr>
   )
}

function ReferenceTables({
   stats,
   language,
}: {
   stats: Stats
   language: 'de' | 'en'
}) {
   // Rule lookup, not part of the sheet: collapsed so the talents come first
   return (
      <details className='overview-section arcana-disclosure talent-reference-disclosure' data-nav-label={t('Rule tables', language)}>
         <summary>{t('Rule tables: quality levels and attribute modifiers', language)}</summary>
         <div className='overview-split reference-section'>
         <div>
            <h3>{t('Skill points → Quality level', language)}</h3>
            <table className='talent-table reference-table reference-table-compact'>
               <thead>
                  <tr>
                     <th>{t('Skill points', language)}</th>
                     <th>{t('Quality level', language)}</th>
                  </tr>
               </thead>
               <tbody>
                  {qualityLevelTable.map((row) => (
                     <tr key={row.pointsLabel}>
                        <td>{row.pointsLabel}</td>
                        <td>{row.quality}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         <div>
            <h3>{t('Attribute modifiers', language)}</h3>
            <div className='table-scroll'>
               <table className='talent-table reference-table reference-table-compact'>
                  <thead>
                     <tr>
                        <th />
                        {attributeModifierColumns.map((modifier) => (
                           <th key={modifier}>
                              {modifier > 0 ? `+${modifier}` : modifier}
                           </th>
                        ))}
                     </tr>
                  </thead>
                  <tbody>
                     {attributeModifierRows.map((attribute) => (
                        <tr key={attribute}>
                           <th scope='row'>
                              {getAttributeAbbreviation(attribute, language)}
                           </th>
                           {attributeModifierColumns.map((modifier) => (
                              <td key={modifier}>
                                 {stats[attribute] + modifier}
                              </td>
                           ))}
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
         </div>
      </details>
   )
}

function BaseAttributesReference({
   stats,
   language,
}: {
   stats: Stats
   language: 'de' | 'en'
}) {
   return (
      <section className='overview-section'>
         <h3>{t('Base attributes', language)}</h3>
         <div className='reference-attribute-grid'>
            {baseAttributeOrder.map((attribute) => (
               <div
                  className='attribute-tile reference-attribute-tile'
                  key={attribute}
               >
                  <span>{getAttributeAbbreviation(attribute, language)}</span>
                  <CheckValue stats={stats} base={stats[attribute]} kind='attribute' checkKey={attribute}
                     label={getAttributeAbbreviation(attribute, language)} />
                  <small>{t(attributeLabels[attribute], language)}</small>
               </div>
            ))}
         </div>
      </section>
   )
}

// source: DSA5 Regelwerk, S. 188–213 (applications, new applications and tools from the talent description)
function TalentInfo({ talent, language }: { talent: TalentDefinition; language: 'de' | 'en' }) {
   const details = talentDetails[talent.key]
   const parts = [`${t('Applications', language)}: ${details.applications.join(', ')}`,
      ...(details.newApplications.length ? [`${t('New applications (S. 186)', language)}: ${details.newApplications.map((entry) => `${entry.name} (${entry.unlockedBy})`).join(', ')}`] : []),
      ...(details.uses.length ? [`${t('Uses from SF', language)}: ${details.uses.join(', ')}`] : []),
      ...(details.tools ? [`${t('Tools', language)}: ${details.tools}`] : []),
      `${t('DSA5 Rulebook', language)}, ${t('S.', language)} ${details.page}`]
   return <Tooltip clickToToggle className='tooltip-icon-wrapper' lang='de' content={parts.join(' · ')}>
      <Info size={15} aria-label={`${t('Rule details', language)}: ${t(talent.label, language)}`} />
   </Tooltip>
}

function TalentOptionToggles({ language }: { language: 'de' | 'en' }) {
   const { routineTrade, groupProbe, set } = useTalentOptions()
   return <div className='talent-options'>
      <label><input type='checkbox' checked={groupProbe} onChange={(event) => set({ groupProbe: event.target.checked })} />
         {t('Optional rule: Talentgruppenprobe (one probe per talent group)', language)} <small>{t('S.', language)} 184</small></label>
      <label><input type='checkbox' checked={routineTrade} onChange={(event) => set({ routineTrade: event.target.checked })} />
         {t('Optional rule: routine with attributes below 13 (+3 FW per missing point)', language)} <small>{t('S.', language)} 185</small></label>
   </div>
}

export function TalentsTab({ hero }: { hero: Hero }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const { spendAP } = useAdvancementMode(hero._id)
   const statsQuery = useQuery({
      queryKey: ['stats', hero._id],
      queryFn: () => getStatsForHero(hero._id),
   })
   const stats = statsQuery.data
   const queryKey = ['stats', hero._id]

   const talentsByKey = useMemo(
      () => new Map((stats?.talents ?? []).map((entry) => [entry.key, entry])),
      [stats?.talents],
   )

   const levelUpMutation = useMutation({
      mutationFn: ({ key, value }: { key: string; value: number }) => levelUpTalent(stats!._id, key, spendAP, value),
      onSuccess: (next) => queryClient.setQueryData(queryKey, next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   const notesMutation = useMutation({
      mutationFn: (talents: TalentEntry[]) =>
         updateTalents(stats!._id, talents),
      onSuccess: () => queryClient.invalidateQueries({ queryKey }),
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   if (statsQuery.isPending) {
      return (
         <div className='overview-loading'>
            {t('Loading talents...', language)}
         </div>
      )
   }
   if (statsQuery.isError || !stats) {
      return (
         <div className='overview-loading'>
            {t('Talents are not available yet.', language)}
         </div>
      )
   }

   function saveNote(key: string, notes: string) {
      const nextTalents = stats!.talents.map((entry) =>
         entry.key === key ? { ...entry, notes } : entry,
      )
      if (!nextTalents.some((entry) => entry.key === key)) nextTalents.push({ key, value: null, notes })
      notesMutation.mutate(nextTalents)
   }

   return (
      <div className='hero-overview'>
         <BaseAttributesReference stats={stats} language={language} />
         <ReferenceTables stats={stats} language={language} />
         {stats.checkModifiers.unverifiedConditions.length > 0 && <p className='field-error' role='status'>
            {t('No verified automatic modifiers for these conditions; enter their effects manually', language)}:
            {' '}<span lang='de'>{stats.checkModifiers.unverifiedConditions.join(', ')}</span>
         </p>}
         <section className='overview-section'>
            <div className='section-heading'>
               <BookOpen size={19} />
               <div>
                  <p className='eyebrow'>{t('Skills & knowledge', language)}</p>
                  <h2>{t('Talents', language)}</h2>
               </div>
               <span className='section-action'>{stats.experience.total - stats.experience.spent} {t('AP available', language)}</span>
            </div>
            <p className='talent-burden-note'>
               <strong>{t('BE', language)}:</strong> {stats.checkModifiers.burden} —{' '}
               {t(
                  'Burden increases the difficulty of affected talent checks by this value.',
                  language,
               )}
               {' '}{t('Talent modifiers change all three attribute targets, not FW.', language)}
            </p>
            <TalentOptionToggles language={language} />
            {talentCategories.map((category) => (
               <div className='talent-category' key={category} data-nav-label={t(talentCategoryLabels[category], language)}>
                  <h3 id={`talent-category-${category}`}>{t(talentCategoryLabels[category], language)}</h3>
                  <div className='talent-table-scroll'>
                  <table className='talent-table talent-main-table'>
                     <thead>
                        <tr>
                           <th>{t('Talent', language)}</th>
                           <th>{t('Probe', language)}</th>
                           <th>{t('BE', language)}</th>
                           <th>{t('StF', language)}</th>
                           <th>{t('FW', language)}</th>
                           <th>{t('RPr', language)}</th>
                           <th>{t('Anmerkung', language)}</th>
                        </tr>
                     </thead>
                     <tbody>
                        {talentsByCategory(category).map((talent) => (
                           <TalentRow
                              key={talent.key}
                              talent={talent}
                              entry={talentsByKey.get(talent.key)}
                              onLevelUp={levelUpMutation.mutate}
                              isLevelingUp={levelUpMutation.isPending}
                              onSaveNote={saveNote}
                              isSavingNote={notesMutation.isPending}
                              language={language}
                              stats={stats}
                              spendAP={spendAP}
                           />
                        ))}
                     </tbody>
                  </table>
                  </div>
               </div>
            ))}
         </section>
         <ExtendedChecks stats={stats} />
         <section className='overview-section overview-split' data-nav-label={t('Languages & scripts', language)}>
            <CharacterEntryList stats={stats} category='languages' />
            <CharacterEntryList stats={stats} category='scripts' />
         </section>
      </div>
   )
}
