import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Dices, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { throwColoredDice } from '@/components/diceEngine'
import { getEntryReference, type EntryCategory, type EntrySelection } from '@/features/heroes/characterEntryApi'
import { getKarmaReference, karmaReferenceKey, liturgyAvailable, type Church } from '@/features/heroes/karmaApi'
import { entryAvailability } from '@/features/heroes/entryOwnership'
import { getMagicReference, type MagicSpell } from '@/features/heroes/magicApi'
import { ProbeStepper } from '@/features/heroes/ProbeDialog'
import { DetailInput, SuggestionChips } from '@/features/heroes/SuggestedDetail'
import { talentCatalog, talentCategoryLabels, type TalentCategory } from '@/features/heroes/talentCatalog'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { creationSections, sectionLabels, type CreationSection, type StepProps } from './creationApi'
import { issueText } from './creationLabels'
import { CreationSpellPicker } from './CreationSpellPicker'

// Vor-/Nachteile (S. 46–49) and Sonderfertigkeiten, Sprachen, Schriften (S. 51–55): chosen from the catalog, priced by the server
export function EntriesStep({ data, ledger, update, categories }: StepProps & { categories: EntryCategory[] }) {
   const language = useLanguageStore((state) => state.language)
   const reference = useQuery({ queryKey: ['character-entry-reference'], queryFn: getEntryReference, staleTime: Infinity }).data
   const [category, setCategory] = useState<EntryCategory>(categories[0])
   const [catalogKey, setCatalogKey] = useState('')
   const [level, setLevel] = useState(1)
   const [detail, setDetail] = useState('')
   // Hide what the hero already has (granted by species, culture or profession, or already chosen); entries with a
   // specification stay available, since another specification is a new entry
   const ownedNames = [...(category in ledger.granted ? ledger.granted[category as keyof typeof ledger.granted] : []),
      ...(category === 'scripts' && data.script ? [data.script] : []),
      ...ledger.entries.filter((row) => row.category === category).map((row) => row.name)]
   const owned = (key: string) => ownedNames.some((name) => name === key || name.startsWith(`${key} `))
   const options = reference?.entries.filter((entry) => entry.category === category &&
      ((entry.parameter || entry.choices) ? entryAvailability(ownedNames, entry).available : !owned(entry.key))) ?? []
   const entry = options.find((item) => item.key === catalogKey)
   const needsDetail = Boolean(entry?.parameter || entry?.choices)
   const listed = data.entries.map((selection, index) => ({ selection, index, row: ledger.entries[index] }))
      .filter((item) => categories.includes(item.selection.category))
   const add = () => {
      if (!entry) return
      const selection: EntrySelection = { category, catalogKey: entry.key, level: entry.levels ? level : 1, detail: needsDetail ? detail.trim() : '', application: '' }
      update({ entries: [...data.entries, selection] })
      setCatalogKey('')
      setDetail('')
      setLevel(1)
   }
   const remove = (index: number) => update({ entries: data.entries.filter((_, position) => position !== index) })
   const warnings = ledger.warnings.filter((warning) => warning.key.startsWith('entry:') || warning.key.startsWith('recommended:'))
      .filter((warning) => categories.includes('advantages') || !warning.key.startsWith('recommended:'))
   const toggleApproval = (key: string, approved: boolean) =>
      update({ approvals: approved ? [...data.approvals, key] : data.approvals.filter((item) => item !== key) })
   const granted = categories.includes('advantages') ? [...ledger.granted.advantages, ...ledger.granted.disadvantages]
      : [...ledger.granted.languages, ...ledger.granted.generalSpecialAbilities]

   return <section className='creation-step'>
      {categories.includes('advantages') ? <p className='creation-intro'>
         {t('Advantages cost AP, disadvantages give AP; each at most 80 AP (S. 39, 46). The species’ automatic advantages count.', language)}
         {' '}<strong>{t('Advantages', language)} {ledger.usage.advantageAp}/80 · {t('Disadvantages', language)} {ledger.usage.disadvantageAp}/80</strong></p>
         : <p className='creation-intro'>{t('Special abilities need their prerequisites (S. 51–55). Casters and priests buy their Tradition here; languages and scripts are bought like special abilities.', language)}
            {ledger.profession && ledger.profession.languageBudget > 0 && <> <strong>{t(ledger.profession.budgetIncludesScripts ? 'Profession: languages and scripts for {ap} AP' : 'Profession: languages for {ap} AP', language)
               .replace('{ap}', String(ledger.profession.languageBudget))} · {t('used', language)} {ledger.profession.budgetUsed}</strong></>}</p>}
      {granted.length > 0 && <p className='fight-note'>{t('Granted', language)}: <span lang='de'>{granted.join(', ')}</span></p>}
      <div className='creation-entry-form'>
         {categories.length > 1 && <div className='probe-segmented'>
            {categories.map((key) => <button key={key} type='button' aria-pressed={category === key} className={category === key ? 'is-active' : ''}
               onClick={() => { setCategory(key); setCatalogKey('') }}>{t(categoryLabels[key], language)}</button>)}
         </div>}
         <div className='creation-row-fields'>
            <label className='field-group'>
               <span>{t(categoryLabels[category], language)}</span>
               <select value={catalogKey} onChange={(event) => { setCatalogKey(event.target.value); setDetail(''); setLevel(1) }}>
                  <option value=''>{t('Choose an entry', language)}</option>
                  {options.map((item) => <option key={item.key} value={item.key}>{item.key} · {item.ap} {t('AP', language)}{item.levels ? ` / ${t('level', language)}` : ''}</option>)}
               </select>
            </label>
            {entry?.levels && <label className='field-group'>
               <span>{t('Level', language)}</span>
               <select value={level} onChange={(event) => setLevel(Number(event.target.value))}>
                  {Array.from({ length: entry.levels }, (_, index) => <option key={index} value={index + 1}>{['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][index]}</option>)}
               </select>
            </label>}
            {needsDetail && <label className='field-group'>
               <span>{t('Specification', language)}</span>
               {entry?.choices || entry?.parameter === 'talent' || entry?.parameter === 'technique'
                  ? <select value={detail} onChange={(event) => setDetail(event.target.value)}>
                     <option value=''>{t('Choose', language)}</option>
                     {(entry.choices ?? (entry.parameter === 'technique' ? reference?.techniques ?? [] : reference?.talents ?? []))
                        .filter((key) => !entryAvailability(ownedNames, entry).takenSubjects.has(key)).map((key) =>
                        <option key={key} value={key}>{entry.parameter === 'talent' ? talentLabelOf(key, language) : key}</option>)}
                  </select>
                  : <DetailInput value={detail} onChange={setDetail} hasSuggestions={Boolean(entry?.suggestions?.length)} language={language} />}
            </label>}
         </div>
         {needsDetail && <SuggestionChips suggestions={entry?.suggestions ?? []} value={detail} language={language}
            onPick={(suggestion) => { setDetail(suggestion.value); if (suggestion.level) setLevel(suggestion.level) }} />}
         {entry && <p className='fight-note'>{entry.effect[language]} ({t('S.', language)} {entry.effect.page})</p>}
         <button className='quiet-button' type='button' disabled={!entry || (needsDetail && !detail.trim())} onClick={add}><Plus size={16} />{t('Add', language)}</button>
      </div>
      {listed.length > 0 && <ul className='creation-list'>
         {listed.map(({ selection, index, row }) => {
            const warning = warnings.find((item) => item.key === `entry:${row?.name}`)
            return <li key={index} className={row?.problems.length ? 'is-problem' : ''}>
               <span><strong lang='de'>{row?.name ?? selection.catalogKey}</strong>
                  {row?.problems.map((problem) => <small key={problem} className='creation-problem'><AlertTriangle size={13} /> {t(problem, language)}</small>)}
                  {warning && <label className='creation-approval'><input type='checkbox' checked={warning.approved}
                     onChange={(event) => toggleApproval(warning.key, event.target.checked)} />{t('GM approved', language)}</label>}</span>
               <span className={`creation-ap${row && row.ap < 0 ? ' is-refund' : ''}`}>{row ? `${row.ap < 0 ? '+' : ''}${Math.abs(row.ap)} ${t('AP', language)}` : ''}</span>
               <button className='icon-button' type='button' aria-label={`${t('Remove', language)}: ${row?.name ?? selection.catalogKey}`} onClick={() => remove(index)}><Trash2 size={15} /></button>
            </li>
         })}
      </ul>}
      {categories.includes('advantages') && warnings.filter((warning) => warning.key.startsWith('recommended:')).map((warning) =>
         <label key={warning.key} className='creation-approval'><input type='checkbox' checked={warning.approved} onChange={(event) => toggleApproval(warning.key, event.target.checked)} />
            {issueText(warning, language)} · {t('GM approved', language)}</label>)}
   </section>
}

const categoryLabels: Record<EntryCategory, string> = {
   advantages: 'Advantages', disadvantages: 'Disadvantages', generalSpecialAbilities: 'Special abilities', languages: 'Languages', scripts: 'Scripts',
}
function talentLabelOf(key: string, language: 'de' | 'en') {
   const talent = talentCatalog.find((entry) => entry.key === key)
   return talent ? t(talent.label, language) : key
}

// Steigerungen (S. 50–51): package values are the base; lowering refunds, raising costs
export function SkillsStep({ data, ledger, reference, update }: StepProps) {
   const language = useLanguageStore((state) => state.language)
   const magic = useQuery({ queryKey: ['magic-reference'], queryFn: getMagicReference, staleTime: Infinity }).data
   const karma = useQuery({ queryKey: karmaReferenceKey, queryFn: getKarmaReference, staleTime: Infinity }).data
   const [liturgy, setLiturgy] = useState('')
   const [blessing, setBlessing] = useState('')
   // The church comes from the Tradition SF bought in the abilities step (S. 316–320)
   const church = (karma?.churches.find((entry) => data.entries.some((item) => item.category === 'generalSpecialAbilities' && item.catalogKey === entry.tradition))?.church ?? null) as Church | null
   const priest = data.entries.some((item) => item.category === 'advantages' && item.catalogKey === 'Geweihter') || Object.keys(ledger.liturgies).length > 0
   const ownedBlessings = [...ledger.granted.blessings, ...(data.blessings ?? [])]
   const [trick, setTrick] = useState('')
   const caster = ledger.granted.advantages.includes('Zauberer') || data.entries.some((entry) => entry.category === 'advantages' && entry.catalogKey === 'Zauberer') ||
      Object.keys(ledger.spells).length > 0
   const hasTradition = (key: string) => ledger.granted.generalSpecialAbilities.includes(key) ||
      data.entries.some((entry) => entry.category === 'generalSpecialAbilities' && entry.catalogKey === key)
   const spellKind = (key: string) => magic?.spells.find((entry) => entry.key === key)?.kind ?? 'Zauberspruch'
   const ownsKind = (kind: MagicSpell['kind']) => Object.keys(ledger.spells).some((key) => spellKind(key) === kind)
   const spellSections: Array<{ title: string; placeholder: string; kinds: Array<MagicSpell['kind']>; show: boolean }> = [
      { title: 'Spells and rituals', placeholder: 'Activate a spell', kinds: ['Zauberspruch', 'Ritual'], show: true },
      { title: 'Hexenflüche', placeholder: 'Activate a Hexenfluch', kinds: ['Hexenfluch'], show: hasTradition('Tradition (Hexe)') || ownsKind('Hexenfluch') },
      { title: 'Elfenlieder', placeholder: 'Activate an Elfenlied', kinds: ['Elfenlied'], show: hasTradition('Tradition (Elf)') || ownsKind('Elfenlied') },
   ]
   const categories = [...new Set(talentCatalog.map((talent) => talent.category))] as TalentCategory[]
   const setTalent = (key: string, value: number) => update({ talents: { ...data.talents, [key]: value } })
   const setTechnique = (key: string, value: number) => update({ techniques: { ...data.techniques, [key]: value } })
   return <section className='creation-step'>
      <p className='creation-intro'>{t('All talents are active from FW 0; packages add their values. Combat techniques start at 6. Raising costs AP, lowering a package value refunds it (S. 25, 45, 50). Maximum: the Erfahrungsgrad and the highest attribute of the check + 2.', language)}</p>
      <div className='creation-skill-groups'>
         {categories.map((category) => <div key={category} className='creation-skill-group'>
            <h3>{t(talentCategoryLabels[category], language)}</h3>
            {talentCatalog.filter((talent) => talent.category === category).map((talent) => {
               const row = ledger.talents[talent.key]
               if (!row) return null
               const label = t(talent.label, language)
               return <SkillRow key={talent.key} label={label} base={row.base} value={row.value} cost={row.cost} maximum={row.maximum} min={0}
                  onChange={(value) => setTalent(talent.key, value)} />
            })}
         </div>)}
         <div className='creation-skill-group'>
            <h3>{t('Combat techniques', language)}</h3>
            {Object.entries(ledger.techniques).map(([key, row]) => <SkillRow key={key} label={t(key, language)} base={row.base} value={row.value} cost={row.cost}
               maximum={row.maximum} min={reference.limits.techniqueStart} onChange={(value) => setTechnique(key, value)} />)}
         </div>
         {caster && magic && <div className='creation-skill-group'>
            <h3>{t('Spells', language)} · {ledger.usage.spells}/{ledger.caps.spells}</h3>
            {/* Hexenflüche and Elfenlieder are tradition-bound (S. 278, 281, 283): own sections, shown with the tradition */}
            {spellSections.filter((section) => section.show).map((section) => <div key={section.title} className='creation-spell-section'>
               <h4>{t(section.title, language)}</h4>
               {section.kinds.includes('Hexenfluch') && ledger.profession && ledger.profession.curseBudget > 0 && <p className='fight-note'>{t('Profession: curses for {ap} AP', language)
                  .replace('{ap}', String(ledger.profession.curseBudget))} · {t('used', language)} {ledger.profession.curseUsed}</p>}
               {Object.entries(ledger.spells).filter(([key]) => section.kinds.includes(spellKind(key))).map(([key, row]) => <SkillRow key={key} label={key} base={row.base ?? 0}
                  value={row.value} cost={row.cost} maximum={row.maximum} min={0}
                  onChange={(value) => update({ spells: { ...data.spells, [key]: value } })}
                  onRemove={row.base === null ? () => update({ spells: Object.fromEntries(Object.entries(data.spells).filter(([name]) => name !== key)) }) : undefined} />)}
               <CreationSpellPicker spells={magic.spells} kinds={section.kinds} owned={Object.keys(ledger.spells)} placeholder={section.placeholder}
                  onAdd={(key) => update({ spells: { ...data.spells, [key]: 0 } })} />
            </div>)}
            <div className='creation-inline-add'>
               <select value={trick} aria-label={t('Zaubertrick', language)} onChange={(event) => setTrick(event.target.value)}>
                  <option value=''>{t('Zaubertrick (1 AP)', language)}</option>
                  {reference.tricks.filter((key) => !data.tricks.includes(key) && !ledger.granted.tricks.includes(key)).map((key) => <option key={key} value={key}>{key}</option>)}
               </select>
               <button className='quiet-button' type='button' disabled={!trick} onClick={() => { update({ tricks: [...data.tricks, trick] }); setTrick('') }}><Plus size={15} />{t('Add', language)}</button>
            </div>
            {ledger.granted.tricks.length > 0 && <p className='fight-note'>{t('From the profession', language)}: {ledger.granted.tricks.join(', ')}</p>}
            {data.tricks.length > 0 && <p className='fight-note'>{data.tricks.map((key) => <button key={key} type='button' className='creation-tag'
               onClick={() => update({ tricks: data.tricks.filter((item) => item !== key) })}>{key} ×</button>)}</p>}
         </div>}
         {priest && karma && <div className='creation-skill-group'>
            <h3>{t('Liturgies', language)} · {ledger.usage.liturgies}/{ledger.caps.spells}</h3>
            {!church && <p className='fight-note'>{t('Buy the Tradition of your church in the special abilities step to see its liturgies (S. 316–320).', language)}</p>}
            {Object.entries(ledger.liturgies).map(([key, row]) => <SkillRow key={key} label={key} base={row.base ?? 0} value={row.value} cost={row.cost} maximum={row.maximum} min={0}
               onChange={(value) => update({ liturgies: { ...data.liturgies, [key]: value } })}
               onRemove={row.base === null ? () => update({ liturgies: Object.fromEntries(Object.entries(data.liturgies ?? {}).filter(([name]) => name !== key)) }) : undefined} />)}
            <div className='creation-inline-add'>
               <select value={liturgy} aria-label={t('Liturgy', language)} onChange={(event) => setLiturgy(event.target.value)}>
                  <option value=''>{t('Activate a liturgy', language)}</option>
                  {karma.liturgies.filter((entry) => !(entry.key in ledger.liturgies) && (!church || liturgyAvailable(entry, church))).map((entry) =>
                     <option key={entry.key} value={entry.key}>{entry.key} ({t(entry.kind === 'Zeremonie' ? 'Ceremony' : 'Liturgy', language)}, {entry.stfClass.toUpperCase()})</option>)}
               </select>
               <button className='quiet-button' type='button' disabled={!liturgy} onClick={() => { update({ liturgies: { ...data.liturgies, [liturgy]: 0 } }); setLiturgy('') }}>
                  <Plus size={15} />{t('Add', language)}</button>
            </div>
            <h3>{t('Blessings', language)} · {ownedBlessings.length}/12</h3>
            {ledger.granted.blessings.length > 0 && <p className='fight-note'>{t('From the profession', language)}: Die Zwölf Segnungen</p>}
            {ownedBlessings.length < karma.blessings.length && <div className='creation-inline-add'>
               <select value={blessing} aria-label={t('Blessing', language)} onChange={(event) => setBlessing(event.target.value)}>
                  <option value=''>{t('Add a blessing (1 AP)', language)}</option>
                  {karma.blessings.filter((entry) => !ownedBlessings.includes(entry.key)).map((entry) => <option key={entry.key} value={entry.key}>{entry.key} ({entry.god})</option>)}
               </select>
               <button className='quiet-button' type='button' disabled={!blessing} onClick={() => { update({ blessings: [...(data.blessings ?? []), blessing] }); setBlessing('') }}>
                  <Plus size={15} />{t('Add', language)}</button>
               <button className='quiet-button' type='button' onClick={() => update({ blessings: karma.blessings.map((entry) => entry.key).filter((key) => !ledger.granted.blessings.includes(key)) })}>
                  <Plus size={15} />{t('Die Zwölf Segnungen ({ap} AP)', language).replace('{ap}', String(karma.blessings.length - ledger.granted.blessings.length))}</button>
            </div>}
            {(data.blessings ?? []).length > 0 && <p className='fight-note'>{(data.blessings ?? []).map((key) => <button key={key} type='button' className='creation-tag'
               onClick={() => update({ blessings: (data.blessings ?? []).filter((item) => item !== key) })}>{key} ×</button>)}</p>}
         </div>}
      </div>
   </section>
}

function SkillRow({ label, base, value, cost, maximum, min, onChange, onRemove }: {
   label: string; base: number; value: number; cost: number; maximum: number; min: number; onChange: (value: number) => void; onRemove?: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   return <div className={`creation-skill${value > maximum ? ' is-over' : ''}${value !== base ? ' is-changed' : ''}`}>
      <span className='creation-skill-name'>
         <span>{label}{base > 0 && <small> · {t('package', language)} {base}</small>}</span>
         {onRemove && <button className='icon-button creation-skill-remove' type='button' aria-label={`${t('Remove', language)}: ${label}`} title={t('Remove', language)}
            onClick={onRemove}><Trash2 size={14} /></button>}
      </span>
      <ProbeStepper value={value} min={min} max={25} label={label} lowerLabel={`${label} −1`} raiseLabel={`${label} +1`} onChange={onChange} />
      <span className={`creation-ap${cost < 0 ? ' is-refund' : ''}`}>{cost ? `${cost < 0 ? '+' : ''}${Math.abs(cost)} ${t('AP', language)}` : ''}</span>
      <small className='creation-skill-max'>≤ {maximum}</small>
   </div>
}

// Schritte 12–15 (S. 56–59): base values, age, name; then every open point is listed with its step
export function FinishStep({ data, ledger, update, startAge, onGoTo, onFinish, finishing }: StepProps & {
   startAge: { base: number; count: number; sides: number } | null; onGoTo: (section: CreationSection) => void; onFinish: () => void; finishing: boolean
}) {
   const language = useLanguageStore((state) => state.language)
   async function rollAge() {
      if (!startAge) return
      const rolls = await throwColoredDice(startAge.sides === 3 ? 6 : startAge.sides, Array.from({ length: startAge.count }, () => '#2f855a'))
      update({ age: startAge.base + rolls.reduce((sum, roll) => sum + (startAge.sides === 3 ? Math.ceil(roll / 2) : roll), 0) })
   }
   const derived = ledger.derived
   const rows: Array<[keyof typeof derived, string]> = [['health', 'LeP'], ['mana', 'AsP'], ['karma', 'KaP'], ['soulPower', 'SK'], ['toughness', 'ZK'],
      ['dodge', 'AW'], ['initiative', 'INI'], ['speed', 'GS'], ['fatePoints', 'Schips']]
   return <section className='creation-step'>
      <div className='creation-row-fields'>
         <label className='field-group'><span>{t('Name', language)}</span>
            <input value={data.name} maxLength={100} onChange={(event) => update({ name: event.target.value })} /></label>
         <label className='field-group'><span>{t('Sex', language)}</span>
            <select value={data.sex} onChange={(event) => update({ sex: event.target.value as typeof data.sex })}>
               <option value='female'>{t('Female', language)}</option><option value='male'>{t('Male', language)}</option><option value='other'>{t('Other', language)}</option>
            </select></label>
         <label className='field-group'><span>{t('Age', language)}{startAge && <small> ({startAge.base}+{startAge.count}W{startAge.sides}, S. 58)</small>}</span>
            <span className='creation-age'>
               <input type='number' min={1} max={500} value={data.age ?? ''} placeholder={startAge ? String(startAge.base) : ''}
                  onChange={(event) => update({ age: event.target.value ? Math.max(1, Math.trunc(event.target.valueAsNumber)) : null })} />
               <button className='quiet-button' type='button' disabled={!startAge} onClick={() => void rollAge()}><Dices size={15} />{t('Roll', language)}</button>
            </span></label>
      </div>
      <label className='field-group'><span>{t('Background', language)}</span>
         <textarea rows={3} maxLength={4000} value={data.background} onChange={(event) => update({ background: event.target.value })} /></label>
      <h3 className='creation-subheading'>{t('Base values', language)} <small>(S. 56–57)</small></h3>
      <dl className='creation-derived'>
         {rows.filter(([key]) => key !== 'karma' || derived.karma.value > 0).filter(([key]) => key !== 'mana' || derived.mana.value > 0).map(([key, label]) =>
            <div key={key}><dt>{t(label, language)}</dt><dd>{derived[key].value}</dd>
               <small>{derived[key].parts.filter((part) => part.value !== 0).map((part) => `${part.value} (${t(part.label, language)})`).join(' + ') || '—'}</small></div>)}
      </dl>
      <p className='fight-note'>{t('Start money: 750 Silbertaler (S. 58).', language)}</p>
      <h3 className='creation-subheading'>{t('Open points', language)} · {ledger.violations.length}</h3>
      {ledger.violations.length === 0 ? <p className='creation-ready'>{t('Everything is in order. Finish to create the hero.', language)}</p>
         : <ul className='creation-list'>
            {creationSections.flatMap((section) => ledger.violations.filter((issue) => issue.section === section).map((issue, index) =>
               <li key={`${section}-${index}`} className='is-problem'>
                  <span><small className='creation-problem'><AlertTriangle size={13} /> {issueText(issue, language)}</small></span>
                  <button className='quiet-button' type='button' onClick={() => onGoTo(section)}>{t(sectionLabels[section], language)}</button>
               </li>))}
         </ul>}
      <button className='primary-button creation-finish' type='button' disabled={ledger.violations.length > 0 || finishing} onClick={onFinish}>
         {t('Create hero', language)}</button>
   </section>
}
