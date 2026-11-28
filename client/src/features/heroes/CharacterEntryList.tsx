import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Info, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Tooltip } from '@/components/Tooltip'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { t, translateRuleLabel } from '@/locales/translation'
import { useLanguageStore } from '@/locales/languageStore'
import { getErrorMessage } from '@/utils/errorHandling'
import { useBookContext } from '@/features/books/bookApi'
import {
   addEntry, getEntryReference, previewEntry, previewEntryRemoval, removeEntry,
   type AddEntryInput, type EntryCategory, type EntryEffect, type EntryGroup, type EntryReference,
   type EntrySelection, type RemoveEntryInput,
} from './characterEntryApi'
import type { Stats } from './statsApi'
import { getAttributeAbbreviation, talentCatalog } from './talentCatalog'
import { APToggle } from './AdvancementControls'
import { useAdvancementMode } from './advancement'
import { talentDetails } from './talentDetails'
import { applicationLabel } from './talentApplicationGlosses'
import { DetailInput, SuggestionChips } from './SuggestedDetail'
import { entryAvailability } from './entryOwnership'

const titles: Record<EntryCategory, string> = {
   advantages: 'Advantages', disadvantages: 'Disadvantages', generalSpecialAbilities: 'Special abilities',
   languages: 'Sprachen', scripts: 'Schriften',
}
const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

function readableName(value: string, language: 'de' | 'en'): string {
   const rating = /^(.*?) FW (≥ )?(\d+)$/.exec(value)
   if (rating) return `${rating[1].split(' + ').map((name) => readableName(name, language)).join(' + ')} ${t('FW', language)} ${rating[2] ?? ''}${rating[3]}`
   const attribute = /^(MU|IN|FF) (\d+)$/.exec(value)
   if (attribute) {
      const key = attribute[1] === 'MU' ? 'courage' : attribute[1] === 'IN' ? 'intuition' : 'fingerDexterity'
      return `${getAttributeAbbreviation(key, language)} ${attribute[2]}`
   }
   if (value.startsWith('Nicht / not: ')) return `${t('Not', language)}: ${translateRuleLabel(value.slice(13), language)}`
   if (value.startsWith('Sprache / language: ')) return `${t('Language', language)}: ${value.slice(19).split(' / ').map((name) => translateRuleLabel(name, language)).join(' / ')}`
   const ranged = /^Fernkampf \/ ranged KtW ≥ (\d+)$/.exec(value)
   if (ranged) return `${t('Ranged combat', language)} ${t('KtW', language)} ≥ ${ranged[1]}`
   const talent = talentCatalog.find(
      (entry) => entry.key === value || entry.label === value,
   )
   return talent ? translateRuleLabel(talent.label, language) : translateRuleLabel(value, language)
}

// Stored entries keep the talent key ("Fertigkeitsspezialisierung (goetterUndKulte: Praios)"); show the talent's name instead.
function entryName(name: string, language: 'de' | 'en'): string {
   const specialization = /^(.*) \(([^:()]+): (.+)\)$/.exec(name)
   const talent = specialization && talentCatalog.find((entry) => entry.key === specialization[2])
   if (specialization && talent) return `${translateRuleLabel(specialization[1], language)} (${translateRuleLabel(talent.label, language)}: ${specialization[3]})`
   return translateRuleLabel(name, language)
}

function translateEntryProblem(
   problem: string,
   language: 'de' | 'en',
   knownCatalogNames: ReadonlySet<string>,
) {
   const selectionLimit = problem.match(/^Maximum (\d+) selections reached\.$/)
   if (selectionLimit) {
      return t('Maximum {count} selections reached.', language).replace(
         '{count}',
         selectionLimit[1],
      )
   }

   const categoryLimit = problem.match(/^Maximum (\d+): (.+)\.$/)
   if (categoryLimit) {
      const [, maximum, prefix] = categoryLimit
      const displayPrefix = knownCatalogNames.has(prefix)
         ? translateRuleLabel(prefix, language)
         : prefix
      return t('Maximum {maximum}: {entry}.', language)
         .replace('{maximum}', maximum)
         .replace('{entry}', () => displayPrefix)
   }

   return readableName(problem, language)
}

function EntryHint({ effect, name, language }: { effect?: EntryEffect; name: string; language: 'de' | 'en' }) {
   return <Tooltip clickToToggle className='tooltip-icon-wrapper' lang={language}
      content={effect ? `${entryName(name, language)}:${effect[language]} · ${t(effect.book === 'AdK' ? 'Archiv der Kräuter' : 'DSA5 Rulebook', language)}, ${t('S.', language)} ${effect.page}`
         : t('No verified rule description for this custom entry.', language)}>
      <Info size={16} aria-label={`${t('Ability effect', language)}: ${entryName(name, language)}`} />
   </Tooltip>
}

function EntryDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
   const dialogRef = useModalKeyboard(onClose)
   const titleId = useId()
   return <div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
      <section ref={dialogRef} className='hero-editor stats-editor character-entry-dialog' role='dialog'
         aria-modal='true' aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
         <header className='editor-header'>
            <h2 id={titleId}>{title}</h2>
            <button className='icon-button editor-close' type='button' onClick={onClose} aria-label={t('Close', useLanguageStore.getState().language)}>
               <X size={20} />
            </button>
         </header>
         {children}
      </section>
   </div>
}

function AddEntryDialog({ stats, category, reference, initial, onClose }: {
   stats: Stats; category: EntryCategory; reference: EntryReference; initial?: { catalogKey: string; detail: string }; onClose: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const { spendAP } = useAdvancementMode(stats.charId)
   const mode = !spendAP ? 'record' : category === 'disadvantages' ? 'creation' : 'purchase'
   const [customEnabled, setCustom] = useState(false)
   const custom = mode === 'record' && customEnabled
   const [customName, setCustomName] = useState('')
   const [catalogKey, setCatalogKey] = useState(initial?.catalogKey ?? '')
   const [level, setLevel] = useState(1)
   const [detail, setDetail] = useState(initial?.detail ?? '')
   const [application, setApplication] = useState('')
   const [potency, setPotency] = useState('')
   const [gmApproved, setGmApproved] = useState(false)
   // Hide what the hero already has; leveled entries offer only higher levels, subject lists only new subjects
   const availability = (item: { key: string; levels?: number; parameter?: string; choices?: string[] }) => entryAvailability(stats[category], item)
   // Entries of an optional book (Archiv der Kräuter's Berufsgeheimnisse) only with that book switched on, or when asked for directly
   const adk = useBookContext(stats._id).data?.rules.adk ?? false
   const entries = reference.entries.filter((item) => item.category === category && availability(item).available
      && (!item.book || adk || item.key === initial?.catalogKey))
   const knownCatalogNames = new Set(reference.entries.map((item) => item.key))
   const entry = entries.find((item) => item.key === catalogKey)
   const open = entry ? availability(entry) : null
   const parameter = entry?.parameter
   const selection: EntrySelection = {
      category, catalogKey, level, detail: detail.trim(), application: application.trim(),
      ...(parameter === 'immunity' && potency ? { potency: Number(potency) } : {}),
   }
   const [debounced, setDebounced] = useState(selection)
   const serialized = JSON.stringify(selection)
   useEffect(() => {
      const timer = setTimeout(() => setDebounced({
         category, catalogKey, level, detail: detail.trim(), application: application.trim(),
         ...(parameter === 'immunity' && potency ? { potency: Number(potency) } : {}),
      }), 250)
      return () => clearTimeout(timer)
   }, [category, catalogKey, level, detail, application, parameter, potency])
   const complete = !custom && Boolean(entry) &&
      (!(entry?.parameter || entry?.choices) || Boolean(selection.detail)) &&
      (entry?.parameter !== 'specialization' || Boolean(selection.application)) &&
      (entry?.parameter !== 'immunity' || (Number.isInteger(selection.potency) && Number(selection.potency) > 0))
   const quoteQuery = useQuery({
      queryKey: ['character-entry-quote', stats._id, debounced, mode, stats],
      queryFn: () => previewEntry(stats._id, debounced, mode),
      enabled: complete && serialized === JSON.stringify(debounced),
      retry: false,
   })
   const quote = complete && serialized === JSON.stringify(debounced) ? quoteQuery.data : undefined
   const mutation = useMutation({
      mutationFn: (input: AddEntryInput) => addEntry(stats._id, input),
      onSuccess: async (next) => {
         queryClient.setQueryData(['stats', stats.charId], next)
         await queryClient.invalidateQueries({ queryKey: ['stats', stats.charId] })
         onClose()
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const approvalRequired = mode !== 'record' && (category === 'advantages' || Boolean(quote?.approval))
   const canSubmit = !mutation.isPending && (custom ? Boolean(customName.trim()) : Boolean(quote) && !quoteQuery.isFetching) &&
      (mode === 'record' || (quote?.problems.length === 0 && (!approvalRequired || gmApproved)))
   function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      if (!canSubmit) { toast.error(t('Check the entry and its prerequisites first.', language)); return }
      mutation.mutate({ category, mode, gmApproved, ...(custom ? { key: customName.trim() } : { selection }) })
   }
   return <EntryDialog title={`${t('Add entry', language)} · ${t(titles[category], language)}`} onClose={onClose}>
      <form className='hero-form' onSubmit={submit}>
         <div className='character-entry-fields'>
            <APToggle heroId={stats.charId} disabled={mutation.isPending} />
            {mode === 'record' && category !== 'disadvantages' && <label className='character-entry-checkbox'>
               <input type='checkbox' checked={custom} disabled={mutation.isPending} onChange={(event) => setCustom(event.target.checked)} />
               {t('Custom entry', language)}
            </label>}
            {custom ? <label className='field-group'>
               <span>{t('Entry name', language)}</span>
               <input value={customName} maxLength={200} required disabled={mutation.isPending} onChange={(event) => setCustomName(event.target.value)} />
            </label> : <label className='field-group'>
               <span>{t('Catalog entry', language)}</span>
               <select value={catalogKey} required disabled={mutation.isPending} onChange={(event) => {
                  const next = entries.find((item) => item.key === event.target.value)
                  setCatalogKey(event.target.value); setLevel(next ? availability(next).minLevel : 1); setDetail(''); setApplication(''); setPotency(''); setGmApproved(false)
               }}>
                  <option value=''>{t('Choose an entry', language)}</option>
                  {entries.map((item) => <option key={item.key} value={item.key}>{translateRuleLabel(item.key, language)}</option>)}
               </select>
            </label>}
            {!custom && entry?.levels && <label className='field-group'>
               <span>{t('Level', language)}</span>
               <select value={level} disabled={mutation.isPending} onChange={(event) => setLevel(Number(event.target.value))}>
                  {romans.slice(0, entry.levels).map((roman, index) => index + 1 >= (open?.minLevel ?? 1) && <option key={roman} value={index + 1}>{roman}</option>)}
               </select>
            </label>}
            {!custom && (entry?.parameter || entry?.choices) && <label className='field-group'>
               <span>{t('Specialization / subject', language)}</span>
               {entry.choices || ['talent', 'technique', 'specialization'].includes(entry.parameter ?? '') ?
                  <select value={detail} required disabled={mutation.isPending} onChange={(event) => setDetail(event.target.value)}>
                     <option value=''>{t('Choose a subject', language)}</option>
                     {(entry.choices ?? (entry.parameter === 'technique' ? reference.techniques : reference.talents)).filter((key) => !open?.takenSubjects.has(key)).map((key) =>
                        <option key={key} value={key}>{translateRuleLabel(key, language)}</option>)}
                  </select> : <DetailInput value={detail} onChange={setDetail} hasSuggestions={Boolean(entry.suggestions?.length)} disabled={mutation.isPending} language={language} />}
            </label>}
            {!custom && entry?.parameter === 'text' && <SuggestionChips suggestions={entry.suggestions ?? []} value={detail} disabled={mutation.isPending} language={language}
               onPick={(suggestion) => { setDetail(suggestion.value); if (suggestion.level) setLevel(suggestion.level) }} />}
            {!custom && entry?.parameter === 'specialization' && <label className='field-group'>
               <span>{t('Talent application', language)}</span>
               {/* source: DSA5 Regelwerk, S. 216 (the talent's listed applications; the lists are not closed) */}
               <input value={application} maxLength={200} required disabled={mutation.isPending} list='talent-applications'
                  onChange={(event) => setApplication(event.target.value)} />
               <datalist id='talent-applications'>
                  {(talentDetails[detail]?.applications ?? []).map((name) => <option key={name} value={name} label={applicationLabel(name, language)} />)}
               </datalist>
            </label>}
            {!custom && entry?.parameter === 'immunity' && <label className='field-group'>
               <span>{t('Poison / disease level', language)}</span>
               <input type='number' min={1} max={100} step={1} value={potency} required disabled={mutation.isPending} onChange={(event) => setPotency(event.target.value)} />
            </label>}
         </div>
         {!custom && entry && <div className='character-entry-preview'>
            <div className='combat-selected-ability'>
               <strong>{translateRuleLabel(quote?.key ?? entry.key, language)}</strong>
               <EntryHint effect={entry.effect} name={entry.key} language={language} />
               {quote && <span>{mode === 'record' ? '0' : `${mode === 'creation' ? '+' : ''}${quote.ap}`} AP</span>}
            </div>
            <p className='combat-note'>{entry.effect[language]} · {entry.effect.book === 'AdK' ? 'AdK ' : ''}{t('S.', language)} {entry.effect.page}</p>
            {quote && <p className='combat-note'>{t('Prerequisites', language)}: {quote.requirements.map((requirement) => readableName(requirement, language)).join(', ') || t('None', language)}</p>}
            {mode !== 'record' && quote?.problems.length ? <ul className='field-error' role='status'>
            {quote.problems.map((problem) => <li key={problem}>{translateEntryProblem(problem, language, knownCatalogNames)}</li>)}
            </ul> : null}
            {quote?.approval && <p className='combat-note'>{quote.approval[language]}</p>}
         </div>}
         {!custom && complete && quoteQuery.isPending && <p role='status'>{t('Checking entry...', language)}</p>}
         {quoteQuery.isError && !custom && <div role='alert'>
            <p className='field-error'>{getErrorMessage(quoteQuery.error)}</p>
            <button className='quiet-button' type='button' onClick={() => void quoteQuery.refetch()}>{t('Retry', language)}</button>
         </div>}
         <p className='combat-note'>{t(mode === 'record'
            ? 'Record mode is initial/manual setup: no AP charged or granted, and prerequisites are not enforced.'
            : 'Available AP', language)}{mode !== 'record' ? `: ${stats.experience.total - stats.experience.spent}` : ''}</p>
         <p className='combat-note'>{t('Effects are rule reminders; adjust affected values and roll modifiers separately.', language)}</p>
         {mode === 'creation' && <p className='combat-note'>{t('Creation disadvantages grant AP, up to 80 AP in total. Only new levels are credited; existing entries receive no retroactive credit.', language)} · S. 39, 46</p>}
         {category === 'disadvantages' && <p className='combat-note'>{t('During play, new disadvantages grant no AP. Buy-off requires GM approval and costs AP.', language)} · S. 162, 352</p>}
         {approvalRequired && <label className='character-entry-checkbox'>
            <input type='checkbox' checked={gmApproved} disabled={mutation.isPending} onChange={(event) => setGmApproved(event.target.checked)} />
            {t('GM approved; narrative prerequisites are met.', language)}
         </label>}
         <footer className='editor-actions'>
            <button className='quiet-button' type='button' disabled={mutation.isPending} onClick={onClose}>{t('Cancel', language)}</button>
            <button className='primary-button' type='submit' disabled={!canSubmit}>
               {t(mode === 'creation' ? 'Add disadvantage and gain AP' : mode === 'purchase' ? 'Purchase entry' : 'Record entry', language)}
            </button>
         </footer>
      </form>
   </EntryDialog>
}

function RemoveEntryDialog({ stats, category, name, onClose }: {
   stats: Stats; category: EntryCategory; name: string; onClose: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const { spendAP } = useAdvancementMode(stats.charId)
   const [gmApproved, setGmApproved] = useState(false)
   const quote = useQuery({
      queryKey: ['character-entry-removal', stats._id, category, name, stats],
      queryFn: () => previewEntryRemoval(stats._id, category, name),
      retry: false,
   })
   const mutation = useMutation({
      mutationFn: (input: RemoveEntryInput) => removeEntry(stats._id, input),
      onSuccess: async (next) => {
         queryClient.setQueryData(['stats', stats.charId], next)
         await queryClient.invalidateQueries({ queryKey: ['stats', stats.charId] })
         onClose()
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const blocked = mutation.isPending || quote.isFetching || !quote.data || quote.data.dependents.length > 0
   return <EntryDialog title={`${t('Remove', language)} · ${entryName(name, language)}`} onClose={onClose}>
      <APToggle heroId={stats.charId} disabled={mutation.isPending} />
      {quote.isPending && <p role='status'>{t('Checking entry...', language)}</p>}
      {quote.isError && <div role='alert'>
         <p className='field-error'>{getErrorMessage(quote.error)}</p>
         <button className='quiet-button' type='button' onClick={() => void quote.refetch()}>{t('Retry', language)}</button>
      </div>}
      {quote.data && <>
         <p>{t('Undo a mistaken entry', language)}: {t('AP refund', language)} <strong>{spendAP ? quote.data.refund : 0}</strong> AP.</p>
         {!spendAP && <p className='combat-note'>{t('AP unchanged: set or correct values, or advance for free. No automatic refunds.', language)}</p>}
         {spendAP && quote.data.creditReversal > 0 && <p className='combat-note'>
            {t('Undo removes the creation AP credit', language)}: <strong>−{quote.data.creditReversal} AP</strong>.
         </p>}
         {spendAP && <p className='combat-note'>{t('Only AP paid through this app are refunded. Existing or custom entries have no refund.', language)}</p>}
         {quote.data.dependents.length > 0 && <p className='field-error' role='alert'>
            {t('Remove dependent entries first', language)}: <span lang='de'>{quote.data.dependents.join(', ')}</span>
         </p>}
         {spendAP && category === 'disadvantages' && <div className='character-entry-preview'>
            <p>{t('Buy off during play', language)}: <strong>{quote.data.buyOff ?? '—'}</strong> AP · S. 352</p>
            <p className='combat-note'>{t('Buy-off removes all recorded levels of this disadvantage and never refunds AP.', language)}</p>
            {quote.data.buyOff === null ? <p className='combat-note'>{t('No verified buy-off cost for this custom entry; agree manual AP accounting with your GM.', language)}</p>
               : <label className='character-entry-checkbox'>
                  <input type='checkbox' checked={gmApproved} disabled={mutation.isPending} onChange={(event) => setGmApproved(event.target.checked)} />
                  {t('GM approved; narrative prerequisites are met.', language)}
               </label>}
         </div>}
      </>}
      <footer className='editor-actions'>
         <button className='quiet-button' type='button' disabled={mutation.isPending} onClick={onClose}>{t('Cancel', language)}</button>
         <button className='quiet-button' type='button' disabled={blocked || (spendAP && (quote.data?.creditReversal ?? 0) > stats.experience.total - stats.experience.spent)} onClick={() => mutation.mutate({ category, key: name, mode: spendAP ? 'undo' : 'record', gmApproved: false })}>
            {t('Undo a mistaken entry', language)}
         </button>
         {spendAP && (quote.data?.creditReversal ?? 0) > stats.experience.total - stats.experience.spent && <p className='field-error'>
            {t('Not enough available AP to reverse this creation credit; undo purchases first.', language)}
         </p>}
         {spendAP && category === 'disadvantages' && <button className='primary-button' type='button'
            disabled={blocked || !gmApproved || quote.data?.buyOff === null || Number(quote.data?.buyOff) > stats.experience.total - stats.experience.spent}
            onClick={() => mutation.mutate({ category, key: name, mode: 'buyOff', gmApproved })}>
            {t('Buy off during play', language)}
         </button>}
      </footer>
   </EntryDialog>
}

// "Name" counts as level I of "Name <roman>".
function entryLevel(name: string) {
   const roman = romans.find((item) => name.endsWith(` ${item}`))
   return roman ? { base: name.slice(0, -roman.length - 1), level: romans.indexOf(roman) + 1 } : { base: name, level: 1 }
}
const isHigherLevel = (other: string, name: string) => {
   const a = entryLevel(other)
   const b = entryLevel(name)
   return a.base === b.base && a.level > b.level
}

// `groups` limits special abilities to Overview or Arcana groups; owned custom entries without a catalog group stay visible.
export function CharacterEntryList({ stats, category, title, catalogKeys: keys, groups, description, addLabel }: {
   stats: Stats; category: EntryCategory; title?: string; catalogKeys?: string[]; groups?: EntryGroup[]; description?: string; addLabel?: string
}) {
   const language = useLanguageStore((state) => state.language)
   const [adding, setAdding] = useState(false)
   const [removing, setRemoving] = useState<string | null>(null)
   const reference = useQuery({ queryKey: ['character-entry-reference'], queryFn: getEntryReference, staleTime: Infinity })
   const sameCategory = reference.data?.entries.filter((entry) => entry.category === category) ?? []
   const catalogKeys = keys ?? (groups && reference.data ? sameCategory.filter((entry) => entry.group && groups.includes(entry.group)).map((entry) => entry.key) : undefined)
   const filtered = reference.data && catalogKeys ? {
      ...reference.data, entries: reference.data.entries.filter((entry) => entry.category !== category || catalogKeys.includes(entry.key)),
   } : reference.data
   const matches = (name: string, key: string) => name === key || name.startsWith(`${key} (`) || romans.some((roman) => name === `${key} ${roman}`)
   const owned = catalogKeys ? stats[category].filter((name) => catalogKeys.some((key) => matches(name, key)) ||
      (groups !== undefined && !keys && !sameCategory.some((entry) => matches(name, entry.key)))) : stats[category]
   // Each bought level is recorded separately; show only the highest. Removing it uncovers the level below.
   const entries = owned.filter((name) => !owned.some((other) => isHigherLevel(other, name)))
   const heading = title ?? titles[category]
   return <section className='overview-list character-entry-list'>
      <header>
         <h3>{t(heading, language)}</h3>
         {/* Icon only: the list title says what gets added; the full name is in the tooltip and for screen readers. */}
         <button type='button' className='quiet-button entry-add-button' disabled={!reference.data}
            aria-label={`${t(addLabel ?? 'Add entry', language)}: ${t(heading, language)}`}
            title={`${t(addLabel ?? 'Add entry', language)}: ${t(heading, language)}`} onClick={() => setAdding(true)}>
            <Plus size={18} aria-hidden='true' />
         </button>
      </header>
      {description && <p className='character-entry-description'>{t(description, language)}</p>}
      {reference.isError && <div role='alert'>
         <p className='field-error'>{getErrorMessage(reference.error)}</p>
         <button className='quiet-button' type='button' onClick={() => void reference.refetch()}>{t('Retry', language)}</button>
      </div>}
      {entries.length ? <ul className='tag-list combat-ability-list character-entry-tags'>
         {entries.map((name, index) => <li key={`${name}-${index}`}>
            <span>{stats.entryEffects?.[`${category}:${name}`] ? entryName(name, language) : name}</span>
            <EntryHint effect={stats.entryEffects?.[`${category}:${name}`]} name={name} language={language} />
            <button className='icon-button' type='button' aria-label={`${t('Remove', language)} ${entryName(name, language)}`} onClick={() => setRemoving(name)}>
               <Trash2 size={14} />
            </button>
         </li>)}
      </ul> : <p>{t('Nothing recorded yet.', language)}</p>}
      {adding && filtered && <AddEntryDialog stats={stats} category={category} reference={filtered} onClose={() => setAdding(false)} />}
      {removing && <RemoveEntryDialog stats={stats} category={category} name={removing} onClose={() => setRemoving(null)} />}
   </section>
}

// Opens the add dialog with a catalog entry and subject already chosen (e.g. "Merkmalskenntnis" + "Telekinese").
export function AddCharacterEntryDialog({ stats, category, catalogKey, detail, onClose }: {
   stats: Stats; category: EntryCategory; catalogKey: string; detail: string; onClose: () => void
}) {
   const reference = useQuery({ queryKey: ['character-entry-reference'], queryFn: getEntryReference, staleTime: Infinity })
   return reference.data ? <AddEntryDialog stats={stats} category={category} reference={reference.data} initial={{ catalogKey, detail }} onClose={onClose} /> : null
}
