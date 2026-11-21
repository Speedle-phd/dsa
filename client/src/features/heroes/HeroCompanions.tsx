import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart, Info, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { DieIcon } from '@/components/DieIcon'
import { Tooltip } from '@/components/Tooltip'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { useAdvancementMode } from './advancement'
import { APToggle } from './AdvancementControls'
import { CompanionAttackDialog } from './CompanionAttackDialog'
import {
   companionTricks, companionsKey, customSpecies, displayDamage, getCompanionReference, getCompanions, updateCompanions,
   type Companion, type CompanionAction, type CompanionAttack, type CompanionReference, type CompanionTalent,
} from './companionApi'
import type { Hero } from './heroApi'
import { ProbeDialog } from './ProbeDialog'
import { getStatsForHero, type Stats } from './statsApi'
import { attributeLabels, getAttributeAbbreviation, talentCatalog, type TalentAttribute } from './talentCatalog'

const attributes: TalentAttribute[] = ['courage', 'wisdom', 'intuition', 'charisma', 'fingerDexterity', 'dexterity', 'constitution', 'strength']
type Dialog = { kind: 'add' } | { kind: 'edit' | 'remove'; id: string }

function Source({ page }: { page: number | string }) {
   const language = useLanguageStore((state) => state.language)
   return <Tooltip content={`${t('DSA5 Rulebook', language)}, ${t('S.', language)} ${page}`} clickToToggle className='tooltip-icon-wrapper' lang={language}>
      <Info size={15} aria-label={t('Rule source', language)} />
   </Tooltip>
}

function talentLabel(key: string, language: 'de' | 'en') {
   const talent = talentCatalog.find((entry) => entry.key === key)
   return talent ? t(talent.label, language) : key
}

function CompanionDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
   const language = useLanguageStore((state) => state.language)
   const id = useId()
   const ref = useModalKeyboard(onClose)
   return createPortal(<div className='modal-backdrop' onMouseDown={onClose}>
      <section ref={ref} className='hero-editor stats-editor companion-dialog' lang={language} role='dialog' aria-modal='true'
         aria-labelledby={id} onMouseDown={(event) => event.stopPropagation()}>
         <header className='editor-header'><h2 id={id}>{title}</h2>
            <button className='icon-button' type='button' aria-label={t('Close', language)} onClick={onClose}><X size={20} /></button>
         </header>
         {children}
      </section>
   </div>, document.body)
}

function AddCompanionForm({ stats, companions, reference, pending, onSave, onClose }: {
   stats: Stats; companions: Companion[]; reference: CompanionReference; pending: boolean; onSave: (action: CompanionAction) => void; onClose: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const [species, setSpecies] = useState(reference.species[0]?.key ?? customSpecies)
   const [name, setName] = useState('')
   const [familiar, setFamiliar] = useState(false)
   const template = reference.species.find((entry) => entry.key === species)
   // source: DSA5 Regelwerk, S. 278–279 (Vertrautenbindung; one familiar; Katze, Kröte, Rabe in this book)
   const familiarReason = !stats.generalSpecialAbilities.includes('Vertrautenbindung') ? 'Requires the special ability Vertrautenbindung.'
      : companions.some((entry) => entry.familiar) ? 'A witch can bind only one familiar.'
      : template && !template.familiar ? 'Familiar species in this book: Katze, Kröte, Rabe.' : null
   function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      if (!name.trim()) return
      onSave({ action: 'add-companion', species, name: name.trim(), familiar: familiar && !familiarReason })
   }
   return <form className='hero-form' onSubmit={submit}>
      <label className='field-group'><span>{t('Animal species', language)}</span>
         <select value={species} disabled={pending} onChange={(event) => { setSpecies(event.target.value); setFamiliar(false) }} autoFocus>
            {reference.species.map((entry) => <option key={entry.key} value={entry.key}>{entry.key}</option>)}
            <option value={customSpecies}>{t('Custom animal (enter values)', language)}</option>
         </select>
      </label>
      <label className='field-group'><span>{t('Name', language)}</span>
         <input value={name} maxLength={100} required disabled={pending} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className='character-entry-checkbox'>
         <input type='checkbox' checked={familiar && !familiarReason} disabled={pending || familiarReason !== null} onChange={(event) => setFamiliar(event.target.checked)} />
         {t('Familiar (Vertrautentier)', language)}
      </label>
      {familiarReason ? <p className='combat-note'>{t(familiarReason, language)}</p>
         : <p className='combat-note'>{t('Familiar: attributes +1, +10 LeP, +1 RS, SK and ZK, 15 AsP, own AP and tricks.', language)} <Source page='278–280' /></p>}
      {species === customSpecies && <p className='combat-note'>{t('Starts with placeholder values. Enter the stat block from your source with Edit.', language)}</p>}
      <footer className='editor-actions'>
         <button className='quiet-button' type='button' onClick={onClose} disabled={pending}>{t('Cancel', language)}</button>
         <button className='primary-button' type='submit' disabled={pending || !name.trim()}>{t('Add companion', language)}</button>
      </footer>
   </form>
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
   return <label className='field-group'><span>{label}</span>
      <input type='number' inputMode='numeric' min={min} max={max} step={1} value={value} required
         onChange={(event) => onChange(Math.trunc(event.target.valueAsNumber) || 0)} />
   </label>
}

function EditCompanionForm({ companion, reference, pending, onSave, onClose }: {
   companion: Companion; reference: CompanionReference; pending: boolean; onSave: (action: CompanionAction) => void; onClose: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const [draft, setDraft] = useState({
      name: companion.name, attributes: { ...companion.attributes }, healthMax: companion.health.max, manaBase: companion.mana.base,
      initiative: companion.initiative, defense: companion.defense, soulPower: companion.soulPower, toughness: companion.toughness,
      speed: companion.speed, armor: companion.armor, actions: companion.actions,
      attacks: companion.attacks.map((attack) => ({ ...attack })),
      talents: companion.talents.map(({ key, value, note }): CompanionTalent => ({ key, value, note })),
      traits: companion.traits, abilities: companion.abilities, special: companion.special, notes: companion.notes,
      experienceTotal: companion.experience.total,
      loyalty: companion.loyalty,
   })
   const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => setDraft((current) => ({ ...current, [key]: value }))
   const setAttack = (index: number, patch: Partial<CompanionAttack>) =>
      set('attacks', draft.attacks.map((attack, slot) => slot === index ? { ...attack, ...patch } : attack))
   const setTalent = (index: number, patch: Partial<CompanionTalent>) =>
      set('talents', draft.talents.map((talent, slot) => slot === index ? { ...talent, ...patch } : talent))
   const unusedTalents = reference.talentKeys.filter((key) => !draft.talents.some((talent) => talent.key === key))
   function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      onSave({ action: 'update-companion', companionId: companion.id, ...draft, name: draft.name.trim(),
         attacks: draft.attacks.filter((attack) => attack.name.trim()) })
   }
   return <form className='hero-form companion-edit' onSubmit={submit}>
      <label className='field-group'><span>{t('Name', language)}</span>
         <input value={draft.name} maxLength={100} required onChange={(event) => set('name', event.target.value)} />
      </label>
      {companion.familiar && <p className='combat-note'>{t('Enter base values. Familiar bonuses (+1 attributes, +10 LeP, +1 RS/SK/ZK, 15 AsP) are added automatically.', language)} <Source page={279} /></p>}
      <fieldset className='form-section'><legend>{t('Attributes', language)}</legend>
         <div className='companion-edit-grid'>
            {attributes.map((attribute) => <NumberField key={attribute} label={getAttributeAbbreviation(attribute, language)} value={draft.attributes[attribute]}
               min={0} max={40} onChange={(value) => set('attributes', { ...draft.attributes, [attribute]: value })} />)}
         </div>
      </fieldset>
      <fieldset className='form-section'><legend>{t('Base values', language)}</legend>
         <div className='companion-edit-grid'>
            <NumberField label={t('LeP max', language)} value={draft.healthMax} min={1} max={999} onChange={(value) => set('healthMax', value)} />
            <NumberField label={t('AsP (base)', language)} value={draft.manaBase} min={0} max={999} onChange={(value) => set('manaBase', value)} />
            <NumberField label={`${t('INI', language)} (+1W6)`} value={draft.initiative} min={0} max={50} onChange={(value) => set('initiative', value)} />
            <NumberField label={t('VW', language)} value={draft.defense} min={0} max={30} onChange={(value) => set('defense', value)} />
            <NumberField label={t('SK', language)} value={draft.soulPower} min={-10} max={20} onChange={(value) => set('soulPower', value)} />
            <NumberField label={t('ZK', language)} value={draft.toughness} min={-10} max={20} onChange={(value) => set('toughness', value)} />
            <NumberField label={t('RS', language)} value={draft.armor} min={0} max={20} onChange={(value) => set('armor', value)} />
            <NumberField label={t('Actions', language)} value={draft.actions} min={1} max={5} onChange={(value) => set('actions', value)} />
            <label className='field-group'><span>{t('GS', language)}</span>
               <input value={draft.speed} maxLength={20} onChange={(event) => set('speed', event.target.value)} />
            </label>
         </div>
      </fieldset>
      <fieldset className='form-section'><legend>{t('Attacks', language)}</legend>
         {draft.attacks.map((attack, index) => <div className='companion-edit-row' key={index}>
            <label className='field-group'><span>{t('Name', language)}</span><input value={attack.name} maxLength={60} onChange={(event) => setAttack(index, { name: event.target.value })} /></label>
            <NumberField label={t('AT', language)} value={attack.attack} min={0} max={30} onChange={(value) => setAttack(index, { attack: value })} />
            <label className='field-group'><span>{t('TP', language)}</span><input value={attack.damage} maxLength={30} placeholder='1W6+2' onChange={(event) => setAttack(index, { damage: event.target.value })} /></label>
            <label className='field-group'><span>{t('RW', language)}</span><input value={attack.reach} maxLength={30} onChange={(event) => setAttack(index, { reach: event.target.value })} /></label>
            <button className='icon-button danger-icon' type='button' aria-label={`${t('Remove', language)}: ${attack.name}`}
               onClick={() => set('attacks', draft.attacks.filter((_, slot) => slot !== index))}><Trash2 size={16} /></button>
         </div>)}
         {draft.attacks.length < 10 && <button className='quiet-button' type='button'
            onClick={() => set('attacks', [...draft.attacks, { name: '', attack: 10, damage: '1W6', reach: 'kurz' }])}><Plus size={16} />{t('Add attack', language)}</button>}
      </fieldset>
      <fieldset className='form-section'><legend>{t('Talents', language)}</legend>
         {draft.talents.map((talent, index) => <div className='companion-edit-row' key={talent.key}>
            <label className='field-group'><span>{t('Talent', language)}</span>
               <select value={talent.key} onChange={(event) => setTalent(index, { key: event.target.value })}>
                  {[talent.key, ...unusedTalents].map((key) => <option key={key} value={key}>{talentLabel(key, language)}</option>)}
               </select>
            </label>
            <label className='field-group'><span>{t('FW', language)}</span>
               <input type='number' min={0} max={25} step={1} value={talent.value ?? ''} placeholder='—'
                  onChange={(event) => setTalent(index, { value: event.target.value === '' ? null : Math.trunc(event.target.valueAsNumber) || 0 })} />
            </label>
            <label className='field-group'><span>{t('Note', language)}</span><input value={talent.note} maxLength={200} onChange={(event) => setTalent(index, { note: event.target.value })} /></label>
            <button className='icon-button danger-icon' type='button' aria-label={`${t('Remove', language)}: ${talentLabel(talent.key, language)}`}
               onClick={() => set('talents', draft.talents.filter((_, slot) => slot !== index))}><Trash2 size={16} /></button>
         </div>)}
         <p className='combat-note'>{t('Leave FW empty when no check is allowed (e.g. dogs cannot climb).', language)}</p>
         {unusedTalents.length > 0 && <button className='quiet-button' type='button'
            onClick={() => set('talents', [...draft.talents, { key: unusedTalents[0], value: 0, note: '' }])}><Plus size={16} />{t('Add talent', language)}</button>}
      </fieldset>
      {(['traits', 'abilities', 'special', 'notes'] as const).map((key) => <label className='field-group' key={key}>
         <span>{t({ traits: 'Advantages/disadvantages', abilities: 'Special abilities', special: 'Special rules', notes: 'Notes' }[key], language)}</span>
         <textarea rows={key === 'notes' ? 4 : 2} maxLength={key === 'notes' ? 4000 : 2000} value={draft[key]} onChange={(event) => set(key, event.target.value)} />
      </label>)}
      <div className='companion-edit-grid'>
         <label className='field-group'><span>{t('LO (Loyalität)', language)}</span>
            <input type='number' inputMode='numeric' min={-999} max={999} step={1} value={draft.loyalty ?? ''} placeholder='—'
               onChange={(event) => set('loyalty', event.target.value === '' ? null : Math.trunc(event.target.valueAsNumber) || 0)} />
         </label>
         <NumberField label={t('AP (total)', language)} value={draft.experienceTotal} min={companion.experience.spent} max={100000}
            onChange={(value) => set('experienceTotal', value)} />
      </div>
      <footer className='editor-actions'>
         <button className='quiet-button' type='button' onClick={onClose} disabled={pending}>{t('Cancel', language)}</button>
         <button className='primary-button' type='submit' disabled={pending}>{t('Save', language)}</button>
      </footer>
   </form>
}

function ResourceControl({ label, unit, current, max, pending, onSet }: {
   label: string; unit: string; current: number; max: number; pending: boolean; onSet: (value: number) => void
}) {
   const language = useLanguageStore((state) => state.language)
   const [amount, setAmount] = useState('1')
   const value = Math.max(1, Math.trunc(Number(amount)) || 1)
   const percent = max > 0 ? Math.min(100, Math.max(0, current / max * 100)) : 0
   return <div className='companion-resource'>
      <div className='resource-label'><span>{label}</span><strong>{current} / {max} {unit}</strong></div>
      <div className='resource-track' role='meter' aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={current}>
         <span style={{ width: `${percent}%` }} />
      </div>
      <div className='companion-resource-actions'>
         <input type='number' inputMode='numeric' min={1} step={1} value={amount} aria-label={`${label}: ${t('Amount', language)}`}
            onFocus={(event) => event.target.select()} onChange={(event) => setAmount(event.target.value)} />
         <button className='quiet-button' type='button' disabled={pending || current <= 0} onClick={() => onSet(Math.max(0, current - value))}>−{value}</button>
         <button className='quiet-button' type='button' disabled={pending || current >= max} onClick={() => onSet(Math.min(max, current + value))}>+{value}</button>
      </div>
   </div>
}

function CompanionCard({ stats, companion, reference, busy, onAction, onDialog }: {
   stats: Stats; companion: Companion; reference: CompanionReference; busy: boolean
   onAction: (action: CompanionAction) => void; onDialog: (dialog: Dialog) => void
}) {
   const language = useLanguageStore((state) => state.language)
   const { spendAP } = useAdvancementMode(stats.charId)
   const [attack, setAttack] = useState<CompanionAttack | null>(null)
   const [talent, setTalent] = useState<Companion['talents'][number] | null>(null)
   const species = reference.species.find((entry) => entry.key === companion.species)
   const { effective } = companion
   const tricks = companionTricks(reference, companion)
   const learnable = tricks.filter((entry) => entry.ap !== null && !companion.tricks.some((owned) => owned.key === entry.key))
   const availableAP = companion.experience.total - companion.experience.spent
   const painSource = effective.pain ? [{ label: 'Schmerz', value: -effective.pain }] : []
   const combat: Array<[string, string, string | number]> = [
      ['INI', 'Initiative', `${companion.initiative}+1W6`], ['VW', 'Defense', companion.defense], ['SK', 'Soul power', effective.soulPower],
      ['ZK', 'Toughness', effective.toughness], ['GS', 'Movement', companion.speed], ['RS', 'Protection', effective.armor],
      ['Actions', 'per combat round', companion.actions],
   ]
   return <li className='companion-card'>
      <header className='companion-head'>
         <span className='companion-avatar' aria-hidden='true'>{companion.familiar ? <Sparkles size={20} /> : <Heart size={20} />}</span>
         <div className='companion-title'>
            <h3>{companion.name}</h3>
            <small><span lang='de'>{species ? species.key : t('Custom animal', language)}</span>
               {species && <> · {t('Size', language)} <span lang='de'>{species.size}</span> <Source page={species.page} /></>}</small>
            {companion.familiar && <span className='companion-badge'>{t('Familiar', language)}</span>}
         </div>
         <div className='spell-card-actions'>
            <button className='icon-button' type='button' disabled={busy} onClick={() => onDialog({ kind: 'edit', id: companion.id })}
               aria-label={`${t('Edit', language)}: ${companion.name}`} title={t('Edit', language)}><Pencil size={16} /></button>
            <button className='icon-button danger-icon' type='button' disabled={busy} onClick={() => onDialog({ kind: 'remove', id: companion.id })}
               aria-label={`${t('Remove', language)}: ${companion.name}`} title={t('Remove', language)}><Trash2 size={16} /></button>
         </div>
      </header>

      <div className='companion-body'>
         <div className='companion-column'>
            <div className='companion-resources'>
               <ResourceControl label={t('Life energy', language)} unit='LeP' current={companion.health.current} max={effective.maxHealth} pending={busy}
                  onSet={(health) => onAction({ action: 'companion-resources', companionId: companion.id, health })} />
               {effective.maxMana > 0 && <ResourceControl label={t('Astral energy', language)} unit='AsP' current={companion.mana.current} max={effective.maxMana} pending={busy}
                  onSet={(mana) => onAction({ action: 'companion-resources', companionId: companion.id, mana })} />}
            </div>
            {effective.pain > 0 && <p className={`companion-pain${effective.pain >= 4 ? ' is-severe' : ''}`}>
               {t('Schmerz', language)} {['I', 'II', 'III', 'IV'][effective.pain - 1]}: {effective.pain >= 4 ? t('incapacitated', language) : `${t('all checks', language)} −${effective.pain}`}
               <Source page={companion.familiar || !species ? 34 : species.page} />
            </p>}
            <section className='companion-block'>
               <h4>{t('Attributes', language)}</h4>
               <dl className='companion-tiles'>
                  {attributes.map((attribute) => <div key={attribute}>
                     <dt>{getAttributeAbbreviation(attribute, language)}{attribute === 'wisdom' && species && <sup title={t('Animal intelligence (S. 354)', language)}>t</sup>}</dt>
                     <dd>{effective.attributes[attribute]}</dd>
                     <small>{t(attributeLabels[attribute], language)}</small>
                  </div>)}
               </dl>
            </section>
            <section className='companion-block'>
               <h4>{t('Combat values', language)}</h4>
               <dl className='companion-tiles'>
                  {combat.map(([label, name, value]) => <div key={label}><dt>{t(label, language)}</dt><dd>{value}</dd><small>{t(name, language)}</small></div>)}
               </dl>
            </section>
            <section className='companion-block'>
               <h4>{t('Loyalty & adventure points', language)}</h4>
               <dl className='companion-tiles'>
                  <div><dt>LO</dt><dd>{companion.loyalty ?? '—'}</dd><small lang='de'>{t('Loyalität', language)}</small></div>
                  {([['AP', 'Total', companion.experience.total], ['AP', 'Spent', companion.experience.spent], ['AP', 'Available', availableAP]] as const)
                     .map(([label, name, value]) => <div key={name}><dt>{label}</dt><dd>{value}</dd><small>{t(name, language)}</small></div>)}
               </dl>
               <p className='combat-note'>{t(companion.familiar ? '¼ of the witch’s AP gained after creation; not deducted from her.'
                  : 'Record the AP your GM awards. The core rules give own AP only to familiars.', language)} <Source page={279} /></p>
            </section>
         </div>

         <div className='companion-column'>
            {companion.attacks.length > 0 && <section className='companion-block'>
               <h4>{t('Attacks', language)}</h4>
               <ul className='companion-list'>{companion.attacks.map((entry, index) => <li key={`${entry.name}-${index}`}>
                  <button type='button' className='talent-probe-button' aria-label={`${t('Roll attack', language)}: ${companion.name}, ${entry.name}`} title={t('Roll attack', language)}
                     disabled={effective.pain >= 4} onClick={() => setAttack(entry)}><DieIcon sides={20} /></button>
                  <strong lang='de'>{entry.name}</strong>
                  <span className='companion-stats'>
                     <span><small>{t('Attack value', language)}</small>{entry.attack}</span>
                     <span><small>{t('Hit points', language)}</small>{displayDamage(entry.damage)}</span>
                     <span><small>{t('Reach', language)}</small><span lang='de'>{entry.reach}</span></span>
                  </span>
               </li>)}</ul>
            </section>}

            {companion.talents.length > 0 && <section className='companion-block'>
               <h4>{t('Talents', language)}</h4>
               <ul className='companion-list'>{companion.talents.map((entry) => <li key={entry.key} className={entry.value === null ? 'is-locked' : ''}>
                  <button type='button' className='talent-probe-button' disabled={entry.value === null || !entry.probe || effective.pain >= 4}
                     aria-label={`${t('Roll check', language)}: ${companion.name}, ${talentLabel(entry.key, language)}`}
                     title={t(entry.value === null ? 'No check allowed.' : 'Roll check', language)} onClick={() => setTalent(entry)}><DieIcon sides={20} /></button>
                  <strong>{talentLabel(entry.key, language)}</strong>
                  <span className='companion-stats'>
                     {entry.value === null ? <span><small>{t('FW', language)}</small>—</span> : <>
                        <span><small>{t('FW', language)}</small>{entry.value}</span>
                        {entry.probe && entry.targets && <span><small>{entry.probe.map((attribute) => getAttributeAbbreviation(attribute, language)).join('/')}</small>{entry.targets.join('/')}</span>}
                     </>}
                  </span>
                  {entry.note && <small lang='de'>{entry.note}</small>}
               </li>)}</ul>
            </section>}
         </div>
      </div>

      {(companion.traits || companion.abilities || companion.special) && <dl className='companion-texts'>
         {companion.traits && <div><dt>{t('Advantages/disadvantages', language)}</dt><dd lang='de'>{companion.traits}</dd></div>}
         {companion.abilities && <div><dt>{t('Special abilities', language)}</dt><dd lang='de'>{companion.abilities}</dd></div>}
         {companion.special && <div><dt>{t('Special rules', language)}</dt><dd lang='de'>{companion.special}</dd></div>}
      </dl>}

      {companion.familiar && <section className='companion-block'>
         <h4>{t('Familiar tricks', language)} <Source page='279–280' /></h4>
         <p className='combat-note'>{t('No check, one action; count as QS 1. Paid with the familiar’s AsP; learned with its AP.', language)}</p>
         <ul className='companion-tricks'>{companion.tricks.map((owned) => {
            const definition = reference.tricks.find((entry) => entry.key === owned.key)
            return <li key={owned.key}>
               <span><strong lang='de'>{owned.key}</strong>{owned.free && <small className='companion-badge'>{t('Known from the start', language)}</small>}</span>
               {definition && <small>{definition.cost} · {definition.duration} · <span lang='de'>{definition.property}</span></small>}
               {definition && <small>{definition.effect[language]}</small>}
               {!owned.free && <button className='icon-button danger-icon' type='button' disabled={busy} aria-label={`${t('Remove', language)}: ${owned.key}`}
                  onClick={() => onAction({ action: 'remove-companion-trick', companionId: companion.id, key: owned.key, spendAP })}><Trash2 size={14} /></button>}
            </li>
         })}</ul>
         {learnable.length > 0 && <>
            <h4>{t('Learnable tricks', language)}</h4>
            {spendAP && learnable.every((entry) => (entry.ap ?? 0) > availableAP) && <p className='companion-learn-hint'>
               {t('Not enough familiar AP ({available} available). Raise the familiar’s total AP with Edit, or turn off “Spend AP” to record a trick for free.', language)
                  .replace('{available}', () => String(availableAP))}</p>}
            <ul className='companion-tricks is-learnable'>{learnable.map((entry) => {
               const cost = spendAP ? entry.ap ?? 0 : 0
               return <li key={entry.key}>
                  <span><strong lang='de'>{entry.key}</strong></span>
                  <small>{entry.cost} · {entry.duration} · <span lang='de'>{entry.property}</span></small>
                  <small>{entry.effect[language]}</small>
                  <button className='quiet-button' type='button' disabled={busy || cost > availableAP}
                     title={cost > availableAP ? t('Not enough familiar AP.', language) : undefined}
                     onClick={() => onAction({ action: 'companion-trick', companionId: companion.id, key: entry.key, spendAP })}>
                     <Plus size={16} />{t('Learn', language)} · {cost} AP</button>
               </li>
            })}</ul>
         </>}
      </section>}

      {companion.notes && <p className='spell-card-note'>{companion.notes}</p>}

      {attack && <CompanionAttackDialog fighter={{ name: companion.name, abilities: companion.abilities, pain: companion.effective.pain }} attack={attack} onClose={() => setAttack(null)} />}
      {talent?.probe && talent.value !== null && <ProbeDialog stats={stats} eyebrow={`${t('Skill check', language)} · ${companion.name}`}
         title={talentLabel(talent.key, language)} probe={talent.probe} value={talent.value} attributes={effective.attributes} fate={false}
         extraSources={painSource} onClose={() => setTalent(null)} />}
   </li>
}

function CompanionSheet({ stats, companions, reference }: { stats: Stats; companions: Companion[]; reference: CompanionReference }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const [dialog, setDialog] = useState<Dialog | null>(null)
   const mutation = useMutation({
      mutationFn: (action: CompanionAction) => updateCompanions(stats._id, action),
      onSuccess: (next) => { queryClient.setQueryData(companionsKey(stats._id), next); setDialog(null) },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const selected = dialog && dialog.kind !== 'add' ? companions.find((entry) => entry.id === dialog.id) : undefined
   const bond = stats.generalSpecialAbilities.includes('Vertrautenbindung')
   return <div className='hero-companions'>
      <section className='overview-section'>
         <header className='section-header'>
            <div><h2>{t('Companions', language)} <Source page='278–280, 354–362' /></h2></div>
            <button className='quiet-button' type='button' disabled={mutation.isPending} onClick={() => setDialog({ kind: 'add' })}>
               <Plus size={16} />{t('Add companion', language)}</button>
         </header>
         <p className='combat-note'>{t(bond ? 'Vertrautenbindung recorded: you can bind one familiar.'
            : 'Animals use their stat block; the GM decides what they do. Familiars need the special ability Vertrautenbindung.', language)}</p>
         <APToggle heroId={stats.charId} disabled={mutation.isPending} />
         {companions.length ? <ul className='companion-grid'>{companions.map((companion) =>
            <CompanionCard key={companion.id} stats={stats} companion={companion} reference={reference} busy={mutation.isPending}
               onAction={(action) => mutation.mutate(action)} onDialog={setDialog} />)}</ul>
            : <p className='combat-empty'>{t('No companions recorded yet.', language)}</p>}
      </section>
      {dialog?.kind === 'add' && <CompanionDialog title={t('Add companion', language)} onClose={() => setDialog(null)}>
         <AddCompanionForm stats={stats} companions={companions} reference={reference} pending={mutation.isPending} onSave={(action) => mutation.mutate(action)} onClose={() => setDialog(null)} />
      </CompanionDialog>}
      {dialog?.kind === 'edit' && selected && <CompanionDialog title={`${t('Edit', language)}: ${selected.name}`} onClose={() => setDialog(null)}>
         <EditCompanionForm companion={selected} reference={reference} pending={mutation.isPending} onSave={(action) => mutation.mutate(action)} onClose={() => setDialog(null)} />
      </CompanionDialog>}
      {dialog?.kind === 'remove' && selected && <CompanionDialog title={t('Remove companion', language)} onClose={() => setDialog(null)}>
         <p><strong>{selected.name}</strong></p>
         <p>{t('This deletes the companion with all values, tricks and notes. Hero AP are not affected.', language)}</p>
         <footer className='editor-actions'>
            <button className='quiet-button' type='button' onClick={() => setDialog(null)} disabled={mutation.isPending}>{t('Cancel', language)}</button>
            <button className='danger-button' type='button' disabled={mutation.isPending}
               onClick={() => mutation.mutate({ action: 'remove-companion', companionId: selected.id })}>{t('Remove', language)}</button>
         </footer>
      </CompanionDialog>}
   </div>
}

export function HeroCompanions({ hero }: { hero: Hero }) {
   const language = useLanguageStore((state) => state.language)
   const statsQuery = useQuery({ queryKey: ['stats', hero._id], queryFn: () => getStatsForHero(hero._id) })
   const referenceQuery = useQuery({ queryKey: ['companion-reference'], queryFn: getCompanionReference, staleTime: Infinity })
   const statsId = statsQuery.data?._id
   const companionsQuery = useQuery({ queryKey: companionsKey(statsId), queryFn: () => getCompanions(statsId!), enabled: Boolean(statsId) })
   if (statsQuery.isError || referenceQuery.isError || companionsQuery.isError) return <div className='state-panel' role='alert'>
      <p>{getErrorMessage(statsQuery.error ?? referenceQuery.error ?? companionsQuery.error)}</p>
      <button className='quiet-button' type='button' onClick={() => { void statsQuery.refetch(); void referenceQuery.refetch(); void companionsQuery.refetch() }}>{t('Retry', language)}</button>
   </div>
   if (!statsQuery.data || !referenceQuery.data || !companionsQuery.data) return <p>{t('Loading companions...', language)}</p>
   return <CompanionSheet stats={statsQuery.data} companions={companionsQuery.data} reference={referenceQuery.data} />
}
