import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Info, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { DieIcon } from '@/components/DieIcon'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { useLanguageStore } from '@/locales/languageStore'
import { t, translateRuleLabel } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { AdvancementValue, APToggle } from './AdvancementControls'
import { nextStepCost, useAdvancementMode } from './advancement'
import { AddCharacterEntryDialog, CharacterEntryList } from './CharacterEntryList'
import { ArcanoviPanel, FlyingDevicePanel, PermanentMana, Source, StaffPanel } from './ArcanaPanels'
import { ModificationRules } from './ModificationRules'
import { energyBreakdown } from './energy'
import { useSpellCheck } from './checkState'
import { CheckModifierButton, ModifiedValue } from './CheckValue'
import type { Hero } from './heroApi'
import { astralSpendNote, foreignSource, getMagicReference, knowledgePrefix, propertyKnowledge, spellRules, updateMagic, useManaSpend, type MagicAction, type MagicReference, type MagicSpell } from './magicApi'
import { SpellProbeDialog } from './SpellProbeDialog'
import { castingLabel, distributionLabel, groupByDistribution, rangeLabel, spellFactRows } from './spellInfo'
import { getStatsForHero, purchaseAdditionalVitalResources, type Stats } from './statsApi'
import { StatsEditor } from './StatsEditor'
import { getAttributeAbbreviation, type TalentAttribute } from './talentCatalog'

const attributes: TalentAttribute[] = ['courage', 'wisdom', 'intuition', 'charisma', 'fingerDexterity', 'dexterity', 'constitution', 'strength']
const amountSchema = z.coerce.number().int().positive()
type Dialog = { kind: 'spell' | 'curse' | 'song' | 'trick' | 'settings' } | { kind: 'notes' | 'details'; key: string } |
   { kind: 'remove'; key: string; trick: boolean; paidAP: number }

function MagicDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
   const language = useLanguageStore((state) => state.language)
   const id = useId()
   const ref = useModalKeyboard(onClose)
   return createPortal(<div className='modal-backdrop' onMouseDown={onClose}>
      <section ref={ref} className='hero-editor stats-editor arcana-dialog' lang={language} role='dialog' aria-modal='true'
         aria-labelledby={id} onMouseDown={(event) => event.stopPropagation()}>
         <header className='editor-header'><h2 id={id}>{title}</h2>
            <button className='icon-button' type='button' aria-label={t('Close', language)} onClick={onClose}><X size={20} /></button>
         </header>
         {children}
      </section>
   </div>, document.body)
}

function SpellFacts({ spell, stats, reference, value }: { spell: MagicSpell; stats: Stats; reference: MagicReference; value: number }) {
   const language = useLanguageStore((state) => state.language)
   const rules = spellRules(stats, spell, reference, value)
   const curse = spell.kind === 'Hexenfluch'
   return <div className='arcana-facts'>
      <p>{spell.effect[language]} <Source page={spell.page} /></p>
      <dl className='arcana-fact-grid'>
         {[...spellFactRows(spell, language), ['Maximum', String(rules.maximum)], ['Available modifications', String(rules.modifications)]]
            .map(([label, value]) => <div key={label}><dt>{t(label, language)}</dt><dd>{value}</dd></div>)}
      </dl>
      {rules.foreign && <p className='arcana-warning'>{t('Foreign tradition: check −2. Modifications require the matching Merkmalskenntnis.', language)} <Source page='274, 285' /></p>}
      {rules.elvenDuration && <p>{t('Tradition (Elf): double the duration of spells with Elfen distribution.', language)} <Source page={283} /></p>}
      {spell.resistance && <p>{t(curse ? 'Curses use half the target’s SK or ZK, not the full resistance. FW stays unchanged.'
         : 'Subtract the target’s resistance from all three check attributes; FW stays unchanged.', language)} <Source page={curse ? '281' : '253–254'} /></p>}
      <p>{t('Maximum: highest check attribute +2; above FW 14 requires Merkmalskenntnis. Free corrections may exceed these advancement limits.', language)} <Source page='39, 285' /></p>
      {curse ? <CurseReference /> : <p>{t('One modification per full 4 FW, at most one step per category. No automatic casting or AsP deduction.', language)} <Source page='255–256, 260–261' /></p>}
      {!spell.costModifiable && <p>{t('Costs cannot be modified.', language)}</p>}
      {!spell.rangeModifiable && <p>{t('Range cannot be increased.', language)}</p>}
   </div>
}

function CurseReference() {
   const language = useLanguageStore((state) => state.language)
   return <dl className='arcana-casting-notes'>
      <div><dt>{t('Curse basics', language)} <Source page='274, 281' /></dt>
         <dd>{t('Hexenflüche: separate FW, factor B, no modifications. Effects begin after 24 hours.', language)}</dd></div>
      <div><dt>{t('Direct delivery', language)}</dt>
         <dd>{t('Direct delivery: at least 1 action, up to 64 Schritt. Longer spoken curses need a GM ruling.', language)}</dd></div>
      <div><dt>{t('Other delivery methods', language)}</dt>
         <dd>{t('Other delivery: a one-hour ritual transfers the curse to a familiar with Fluchbote; or use a body sample at midnight while the victim sleeps.', language)}</dd></div>
      <div><dt>{t('Ending a curse', language)}</dt>
         <dd>{t('A curse ends when its demand is fulfilled, the witch releases it for 3 AsP or dies, or appropriate counter-magic removes it.', language)}</dd></div>
   </dl>
}

function ArcanaEditor({ dialog, stats, reference, pending, onSave, onClose }: {
   dialog: Dialog; stats: Stats; reference: MagicReference; pending: boolean; onSave: (action: MagicAction) => void; onClose: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const { spendAP } = useAdvancementMode(stats.charId)
   const [key, setKey] = useState('')
   const [value, setValue] = useState('0')
   const [notes, setNotes] = useState(dialog.kind === 'notes' ? stats.spells.find((entry) => entry.key === dialog.key)?.notes ?? '' : '')
   const [artifacts, setArtifacts] = useState(stats.magicSettings.artifacts)
   const [artifactItems, setArtifactItems] = useState(stats.magicSettings.artifactItems)
   const [guildSpell, setGuildSpell] = useState(stats.magicSettings.guildSpell ?? '')
   const selected = reference.spells.find((entry) => entry.key === key)
   const trick = reference.tricks.find((entry) => entry.key === key)
   const availableAP = stats.experience.total - stats.experience.spent
   const cost = dialog.kind === 'trick' ? 1 : selected ? nextStepCost(null, selected.stfClass) : 0
   const magicUser = stats.advantages.includes('Zauberer')
   const canAcquire = (dialog.kind !== 'curse' || stats.generalSpecialAbilities.includes('Tradition (Hexe)')) &&
      (dialog.kind !== 'song' || stats.generalSpecialAbilities.includes('Tradition (Elf)')) &&
      (!spendAP || magicUser && (dialog.kind === 'trick' ||
         reference.traditions.some((entry) => stats.generalSpecialAbilities.includes(entry.key))))
   if (dialog.kind === 'details') {
      const spell = reference.spells.find((entry) => entry.key === dialog.key)
      const owned = stats.spells.find((entry) => entry.key === dialog.key)
      return <MagicDialog title={dialog.key} onClose={onClose}>
         {spell && owned ? <SpellFacts spell={spell} stats={stats} reference={reference} value={owned.value} /> : <p role='alert'>{t('No verified spell data.', language)}</p>}
      </MagicDialog>
   }
   const title = dialog.kind === 'spell' ? 'Learn spell or ritual' : dialog.kind === 'curse' ? 'Learn Hexenfluch' : dialog.kind === 'song' ? 'Learn Elfenlied' : dialog.kind === 'trick' ? 'Learn Zaubertrick' :
      dialog.kind === 'settings' ? 'Tradition artifacts and creation exception' : dialog.kind === 'notes' ? 'Edit note' : 'Undo a mistaken entry'

   function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      if (dialog.kind === 'settings') {
         const result = z.object({
            artifacts: z.string().trim().max(4000), artifactItems: z.array(z.string().min(1).max(200)).max(100),
            guildSpell: z.string().max(200).nullable(),
         }).safeParse({ artifacts, artifactItems, guildSpell: guildSpell || null })
         if (!result.success) { toast.error(t('Please correct the highlighted values.', language)); return }
         onSave({ action: 'magic-settings', ...result.data })
      } else if (dialog.kind === 'notes') {
         const result = z.string().trim().max(2000).safeParse(notes)
         if (!result.success) { toast.error(t('Please correct the highlighted values.', language)); return }
         onSave({ action: 'spell-notes', key: dialog.key, notes: result.data })
      } else if (dialog.kind === 'remove') {
         onSave({ action: dialog.trick ? 'remove-magic-trick' : 'remove-spell', key: dialog.key, spendAP })
      } else if (dialog.kind === 'trick') {
         if (trick && canAcquire) onSave({ action: 'magic-trick', key, spendAP })
      } else if (selected && canAcquire) {
         const result = z.coerce.number().int().min(0).max(25).safeParse(value)
         if (!result.success) { toast.error(t('Enter a whole number between 0 and 25.', language)); return }
         onSave({ action: 'spell', key, value: spendAP ? 0 : result.data, spendAP })
      }
   }
   return <MagicDialog title={t(title, language)} onClose={onClose}>
      <form className='hero-form' onSubmit={submit}>
         {(['spell', 'curse', 'song', 'trick', 'remove'].includes(dialog.kind)) && <APToggle heroId={stats.charId} disabled={pending} />}
         {(dialog.kind === 'spell' || dialog.kind === 'curse' || dialog.kind === 'song' || dialog.kind === 'trick') && <>
            <label className='field-group'><span>{t(dialog.kind === 'spell' ? 'Zauber/Ritual' : dialog.kind === 'curse' ? 'Hexenfluch' : dialog.kind === 'song' ? 'Elfenlied' : 'Zaubertricks', language)}</span>
               <select value={key} onChange={(event) => setKey(event.target.value)} disabled={pending} required autoFocus>
                  <option value=''>{t('Choose a catalog entry', language)}</option>
                  {dialog.kind !== 'trick' ? (dialog.kind === 'curse' ? ['Hexenfluch'] : dialog.kind === 'song' ? ['Elfenlied'] : ['Zauberspruch', 'Ritual']).flatMap((kind) =>
                     groupByDistribution(reference.spells.filter((entry) => entry.kind === kind &&
                        !stats.spells.some((owned) => owned.key === entry.key)), (entry) => entry)
                        .map((group) => <optgroup key={`${kind}-${group.key}`} label={`${t(kind, language)} · ${t('Verbreitung', language)}: ${distributionLabel(group.distribution, language)}`}>
                           {group.entries.map((entry) => <option key={entry.key} value={entry.key}>
                              {entry.key} · {spendAP ? nextStepCost(null, entry.stfClass) : 0} AP
                           </option>)}
                        </optgroup>)) : reference.tricks.filter((entry) => !stats.magicTricks.some((owned) => owned.key === entry.key))
                     .map((entry) => <option key={entry.key} value={entry.key}>{entry.key} · {spendAP ? 1 : 0} AP</option>)}
               </select>
            </label>
            {dialog.kind !== 'trick' && <p>{t('Activation buys FW 0. Use the row controls for further advancement.', language)} <Source page='25, 50' /></p>}
            {!spendAP && dialog.kind !== 'trick' && <label className='field-group'><span>{t('FW', language)}</span>
               <input type='number' min={0} max={25} required step={1} value={value} onChange={(event) => setValue(event.target.value)} disabled={pending} />
            </label>}
            {!canAcquire && <p className='field-error'>{t(dialog.kind === 'song' ? 'Elfenlieder require Tradition (Elf) (S. 283).'
               : 'Paid spells require Zauberer and a supported magical tradition. Zaubertricks require Zauberer.', language)}</p>}
            {selected && dialog.kind !== 'trick' && <SpellFacts spell={selected} stats={stats} reference={reference} value={spendAP ? 0 : Number(value)} />}
            {trick && dialog.kind === 'trick' && <div className='arcana-facts'>
               <p>{trick.effect[language]} <Source page={trick.page} /></p>
               <p>{rangeLabel(trick.range, language)} · {t(trick.duration, language)} · {translateRuleLabel(trick.property, language)}</p>
               <p>{t('Zaubertricks: 1 AsP, 1 action, no check, QS 1 (QS 2 with Starke Zaubertricks). No modifications.', language)}</p>
            </div>}
            <p>{t('Available', language)}: {availableAP} AP · {t('Costs', language)}: {spendAP ? cost : 0} AP</p>
         </>}
         {dialog.kind === 'remove' && <>
            <p><strong lang='de'>{dialog.key}</strong></p>
            <p>{t('Undo refunds only the AP actually paid in this app. With AP disabled, removal changes no AP counters.', language)}</p>
            <p>{t('AP refund', language)}: {spendAP ? dialog.paidAP : 0} AP</p>
         </>}
         {dialog.kind === 'notes' && <label className='field-group'><span>{dialog.key} · {t('Anmerkung', language)}</span>
            <textarea value={notes} maxLength={2000} rows={5} onChange={(event) => setNotes(event.target.value)} disabled={pending} autoFocus />
         </label>}
         {dialog.kind === 'settings' && <>
            <fieldset className='form-section roll-entry-effects'><legend>{t('Traditionsartefakte', language)}</legend>
               <p>{t('Select physical items from your inventory. Linking records their role, not enchantment, binding or flight readiness.', language)}</p>
               {[...new Set([...stats.equipment.filter((item) => item.amount > 0).map((item) => item.item), ...artifactItems])].map((name) => {
                  const present = stats.equipment.some((item) => item.item === name && item.amount > 0)
                  return <label className='roll-entry-effect' key={name}>
                     <input type='checkbox' checked={artifactItems.includes(name)} disabled={pending || !present && !artifactItems.includes(name)}
                        onChange={(event) => setArtifactItems(event.target.checked ? [...artifactItems, name] : artifactItems.filter((item) => item !== name))} />
                     <span>{name}{!present && <small className='field-error'>{t('Not in the current inventory; unlink this item before saving.', language)}</small>}</span>
                  </label>
               })}
               {!stats.equipment.some((item) => item.amount > 0) && <p>{t('Add the physical item in Equipment first.', language)}</p>}
            </fieldset>
            <label className='field-group'><span>{t('Artifact notes', language)}</span>
               <textarea value={artifacts} rows={5} maxLength={4000} onChange={(event) => setArtifacts(event.target.value)} disabled={pending} autoFocus />
            </label>
            <p>{t('Artifact notes do not bind an item or pay permanent AsP. Inventory and binding costs remain separate.', language)}</p>
            {stats.generalSpecialAbilities.includes('Tradition (Gildenmagier)') && <label className='field-group'>
               <span>{t('Guild creation exception', language)} <Source page={275} /></span>
               <select value={guildSpell} onChange={(event) => setGuildSpell(event.target.value)} disabled={pending}>
                  <option value=''>{t('None', language)}</option>
                  {reference.spells.filter((entry) => entry.kind === 'Zauberspruch' && !entry.traditions.includes('allgemein') &&
                     !entry.traditions.includes('Gildenmagier') && stats.spells.some((owned) => owned.key === entry.key))
                     .map((entry) => <option key={entry.key} value={entry.key}>{entry.key}</option>)}
               </select>
            </label>}
            <p>{t('Record the one foreign spell converted at creation with your GM. This is not a during-play conversion or an AP purchase.', language)}</p>
         </>}
         <footer className='editor-actions'>
            <button className='quiet-button' type='button' onClick={onClose} disabled={pending}>{t('Cancel', language)}</button>
            <button className='primary-button' type='submit' disabled={pending || ((dialog.kind === 'spell' || dialog.kind === 'curse' || dialog.kind === 'song' || dialog.kind === 'trick') &&
               (!key || !canAcquire || (spendAP && cost > availableAP)))}>{t(['spell', 'curse', 'song', 'trick'].includes(dialog.kind) ? 'Add entry' : 'Save', language)}</button>
         </footer>
      </form>
   </MagicDialog>
}

function SpellTargets({ stats, spell, foreign }: { stats: Stats; spell: MagicSpell; foreign: boolean }) {
   const check = useSpellCheck(stats, spell.key)
   return <span className='check-control'>
      <ModifiedValue base={spell.probe.map((attribute) => stats[attribute])} modifier={check.total + (foreign ? foreignSource.value : 0)}
         sources={foreign ? [...check.sources, foreignSource] : check.sources} blocked={check.blocked} contextRequired={check.unresolved} />
      <CheckModifierButton check={check} label={spell.key} />
   </span>
}

function SpellCard({ stats, reference, spell, entry, busy, advanceLocked, onAdvance, onDialog }: {
   stats: Stats; reference: MagicReference; spell: MagicSpell; entry: Stats['spells'][number]
   busy: boolean; advanceLocked: boolean; onAdvance: (value: number) => void; onDialog: (dialog: Dialog) => void
}) {
   const language = useLanguageStore((state) => state.language)
   const { spendAP } = useAdvancementMode(stats.charId)
   const [rolling, setRolling] = useState(false)
   const rules = spellRules(stats, spell, reference, entry.value)
   const curse = spell.kind === 'Hexenfluch'
   const limited = entry.value >= 14 && !stats.generalSpecialAbilities.includes(`${knowledgePrefix}${spell.property})`)
   const facts: Array<[string, ReactNode]> = [
      ['Costs', <>{spell.cost}{' '}AsP{!spell.costModifiable && <small>{t('Not modifiable', language)}</small>}</>],
      ['Casting time', castingLabel(spell, language)],
      ['Spell range', rangeLabel(spell.range, language)],
      ['Duration', <>{t(spell.duration, language)}{rules.elvenDuration && <small>×2 · {t('Tradition', language)}</small>}</>],
   ]
   return <li className='spell-card'>
      <header className='spell-card-head'>
         <button type='button' className='talent-probe-button' aria-label={`${t('Roll check', language)}: ${spell.key}`}
            title={t('Roll check', language)} onClick={() => setRolling(true)}><DieIcon sides={20} /></button>
         <div className='spell-card-title'>
            <h4 lang='de'>{spell.key}</h4>
            <small>{!curse && <>{t(spell.kind, language)} · </>}<span lang='de'>{translateRuleLabel(spell.property, language)}</span> · {t('StF', language)} {spell.stfClass.toUpperCase()}</small>
            {spell.kind !== 'Hexenfluch' && spell.kind !== 'Elfenlied' && <small className='spell-card-origin'>{t('Verbreitung', language)}: {
               spell.traditions.map((origin) => translateRuleLabel(origin, language)).join(', ')}</small>}
         </div>
         <div className='spell-card-actions'>
            <button className='icon-button' type='button' onClick={() => onDialog({ kind: 'details', key: entry.key })}
               aria-label={`${t('Details', language)}: ${entry.key}`} title={t('Details', language)}><Info size={16} /></button>
            <button className='icon-button' type='button' disabled={busy} onClick={() => onDialog({ kind: 'notes', key: entry.key })}
               aria-label={`${t('Edit note', language)}: ${entry.key}`} title={t('Edit note', language)}><Pencil size={16} /></button>
            <button className='icon-button danger-icon' type='button' disabled={busy}
               onClick={() => onDialog({ kind: 'remove', key: entry.key, trick: false, paidAP: entry.paidAP })}
               aria-label={`${t('Remove', language)}: ${entry.key}`} title={t('Remove', language)}><Trash2 size={16} /></button>
         </div>
      </header>
      <div className='spell-card-values'>
         <div>
            <span className='spell-card-label'>{t('Probe', language)}</span>
            <span className='spell-card-probe'>{spell.probe.map((attribute) => getAttributeAbbreviation(attribute, language)).join('/')}
               {spell.resistance && <small> − {spell.resistance}{curse ? '/2' : ''}</small>}</span>
            <SpellTargets stats={stats} spell={spell} foreign={rules.foreign} />
         </div>
         <div className='spell-card-fw'>
            <span className='spell-card-label'>{t('FW', language)}</span>
            <div className='talent-value-inner'><strong>{entry.value}</strong>
               <AdvancementValue label={spell.key} value={entry.value} maximum={spendAP ? rules.maximum : 25} cost={nextStepCost(entry.value, spell.stfClass)}
                  availableAP={stats.experience.total - stats.experience.spent} spendAP={spendAP} pending={advanceLocked} onChange={onAdvance} /></div>
         </div>
      </div>
      {limited && <p className='spell-card-limit'>{t('FW limit 14: needs Merkmalskenntnis ({property})', language).replace('{property}', () => spell.property)}</p>}
      <dl className='spell-card-facts'>
         {facts.map(([label, value]) => <div key={label}><dt>{t(label, language)}</dt><dd>{value}</dd></div>)}
      </dl>
      {entry.notes && <p className='spell-card-note'>{entry.notes}</p>}
      {rolling && <SpellProbeDialog stats={stats} spell={spell} reference={reference} value={entry.value} onClose={() => setRolling(false)} />}
   </li>
}

function PropertyKnowledgePanel({ stats, reference }: { stats: Stats; reference: MagicReference }) {
   const language = useLanguageStore((state) => state.language)
   const { spendAP } = useAdvancementMode(stats.charId)
   const [learning, setLearning] = useState<string | null>(null)
   const { rows, leading, attributeMet, unknown, full } = propertyKnowledge(stats, reference)
   return <section className='arcana-knowledge' aria-labelledby='arcana-knowledge-title'>
      <header>
         <h3 id='arcana-knowledge-title'>{t('Merkmalskenntnis', language)} <Source page={285} /></h3>
         <p>{t('Lifts the FW limit of 14 for spells of one Merkmal and allows modifying foreign spells of it. Requires the tradition’s leading attribute at 15 and three spells of the Merkmal at FW 10.', language)}</p>
      </header>
      <p className={`arcana-knowledge-leading${attributeMet ? ' is-met' : ''}`}>
         {attributeMet ? <Check size={16} aria-hidden='true' /> : <X size={16} aria-hidden='true' />}
         {t('Leading attribute', language)}: {leading.length ? leading.map((entry) =>
            `${getAttributeAbbreviation(entry.attribute, language)} ${entry.value}`).join(' · ') : t('No tradition recorded', language)} / 15
      </p>
      {rows.length ? <ul className='arcana-knowledge-list'>{rows.map((row) => {
         const missing = Math.max(0, 3 - row.ready)
         return <li key={row.property} className={row.known ? 'is-known' : row.eligible ? 'is-eligible' : ''}>
            <div className='arcana-knowledge-head'>
               <strong lang='de'>{translateRuleLabel(row.property, language)}</strong>
               {!row.known && <span className='arcana-knowledge-pips' role='img'
                  aria-label={t('{count} of 3 spells at FW 10', language).replace('{count}', () => String(Math.min(3, row.ready)))}>
                  {[0, 1, 2].map((index) => <span key={index} className={index < row.ready ? 'is-filled' : ''} />)}
               </span>}
            </div>
            <p className='arcana-knowledge-status'>{row.known ? <><Check size={14} aria-hidden='true' />{t('Known: FW limit 14 lifted, foreign spells of this Merkmal can be modified.', language)}</>
               : row.eligible ? t('Prerequisites met. Training with a teacher or academy is still required (GM).', language)
               : [missing > 0 && t(missing === 1 ? '1 more spell at FW 10 needed.' : '{count} more spells at FW 10 needed.', language).replace('{count}', () => String(missing)),
                  !attributeMet && t('Leading attribute 15 needed.', language)].filter(Boolean).join(' ')}</p>
            <p className='arcana-cell-note' lang='de'>{row.spells.length ? row.spells.map((spell) => `${spell.key} ${spell.value}`).join(' · ') : t('No spells of this Merkmal recorded.', language)}</p>
            {!row.known && !full && (row.eligible || !spendAP) && <button className={row.eligible ? 'primary-button' : 'quiet-button'} type='button'
               onClick={() => setLearning(row.property)}><Plus size={16} />{t(spendAP ? 'Learn' : 'Record', language)}</button>}
         </li>
      })}</ul> : <p className='combat-empty'>{t('Learn spells first; their Merkmale appear here.', language)}</p>}
      {full && <p className='combat-note'>{t('All three priced Merkmalskenntnisse are recorded.', language)}</p>}
      {unknown.map((property) => <p key={property} className='arcana-warning'>
         <strong lang='de'>{knowledgePrefix}{property})</strong>: {t('Not a Merkmal of the core rules, so it has no effect. Remove it and choose the Merkmal from the list.', language)}
      </p>)}
      {learning && <AddCharacterEntryDialog stats={stats} category='generalSpecialAbilities' catalogKey='Merkmalskenntnis' detail={learning}
         onClose={() => setLearning(null)} />}
   </section>
}

function ArcanaSheet({ stats, reference }: { stats: Stats; reference: MagicReference }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const { spendAP } = useAdvancementMode(stats.charId)
   const [dialog, setDialog] = useState<Dialog | null>(null)
   const [resources, setResources] = useState(false)
   const [search, setSearch] = useState('')
   const [manaAmount, setManaAmount] = useState('1')
   const [manaDirection, setManaDirection] = useState<'spend' | 'recover'>('spend')
   const saved = (next: Stats) => {
      queryClient.setQueryData(['stats', stats.charId], next)
      void queryClient.invalidateQueries({ queryKey: ['stats', stats.charId] })
   }
   const mutation = useMutation({
      mutationFn: (action: MagicAction) => updateMagic(stats._id, action),
      onSuccess: (next) => { saved(next); setDialog(null) },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const manaPurchase = useMutation({
      mutationFn: (target: number) => purchaseAdditionalVitalResources(stats._id, 'mana', spendAP, target),
      onSuccess: saved,
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const manaSpend = useManaSpend(stats)
   const busy = mutation.isPending || manaPurchase.isPending || manaSpend.isPending
   const availableAP = stats.experience.total - stats.experience.spent
   const mage = stats.advantages.includes('Zauberer')
   const traditions = reference.traditions.filter((entry) => stats.generalSpecialAbilities.includes(entry.key))
   const owns = (key: string) => stats.generalSpecialAbilities.includes(key)
   const witch = owns('Tradition (Hexe)')
   const elf = owns('Tradition (Elf)')
   const guildMage = owns('Tradition (Gildenmagier)')
   const kindOf = (key: string) => reference.spells.find((spell) => spell.key === key)?.kind
   const ownsKind = (kind: MagicSpell['kind']) => stats.spells.some((entry) => kindOf(entry.key) === kind)
   const ownsGroup = (keys: string[]) => stats.generalSpecialAbilities.some((name) => keys.some((key) => name === key || name.startsWith(`${key} (`)))
   const staffKeys = Object.keys(reference.staff.volumes)
   const showStaff = guildMage || ownsGroup(staffKeys)
   const showWitch = witch || ownsKind('Hexenfluch') || ownsGroup(['Vertrautenbindung', 'Flugsalbe'])
   const showSongs = elf || ownsKind('Elfenlied')
   const artifactMagic = stats.spells.some((entry) => entry.key === 'Arcanovi')
   const traditionKeys = reference.traditions.map((entry) => entry.key)
   const owned = stats.spells.filter((entry) => entry.key.toLocaleLowerCase(language).includes(search.toLocaleLowerCase(language)))
   const manaPercent = stats.mana.max > 0 ? Math.min(100, Math.max(0, stats.mana.current / stats.mana.max * 100)) : 0
   function adjust(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const result = amountSchema.safeParse(manaAmount)
      if (!result.success) { toast.error(t('Enter a positive whole number of AsP.', language)); return }
      if (manaDirection === 'spend') manaSpend.mutate(result.data)
      else mutation.mutate({ action: 'adjust-mana', direction: manaDirection, amount: result.data })
   }
   return <div className='hero-arcana'>
      <section className='overview-section'>
         <header className='section-header'><div>
            <h2>{t('Arcana', language)} <Source page={413} /></h2></div>
            <button className='quiet-button' type='button' disabled={busy} onClick={() => setResources(true)}><Pencil size={15} />{t('Edit resources', language)}</button>
         </header>
         {!mage && <p className='arcana-warning'>{t('No Zauberer advantage recorded. Magic can be documented with AP disabled, but this does not grant casting ability.', language)}</p>}
         {mage && !traditions.length && <p className='arcana-warning'>{t('Paid spells require Zauberer and a supported magical tradition. Zaubertricks require Zauberer.', language)}</p>}
         <div className='arcana-summary'>
            <div className='arcana-mana'>
               <div className='resource-label'><span>{t('Astral energy', language)}</span><strong>{stats.mana.current} / {stats.mana.max} AsP</strong></div>
               <small className='arcana-energy-breakdown'>{t('Maximum', language)}: {energyBreakdown(stats, 'mana', language)} <Source page='56–57, 166, 174' /></small>
               <div className='resource-track' role='meter' aria-label={t('Astral energy', language)} aria-valuemin={0} aria-valuemax={stats.mana.max} aria-valuenow={stats.mana.current}>
                  <span style={{ width: `${manaPercent}%` }} />
               </div>
               <form className='arcana-mana-form' onSubmit={adjust}>
                  <select value={manaDirection} onChange={(event) => setManaDirection(event.target.value === 'spend' ? 'spend' : 'recover')} aria-label={t('AsP adjustment', language)} disabled={busy}>
                     <option value='spend'>{t('Spend AsP', language)}</option><option value='recover'>{t('Recover AsP', language)}</option>
                  </select>
                  <input type='number' min={1} step={1} value={manaAmount} onChange={(event) => setManaAmount(event.target.value)} aria-label={t('AsP amount', language)} required disabled={busy} />
                  <button className='quiet-button' type='submit' disabled={busy}>{t('Apply', language)}</button>
               </form>
               {manaDirection === 'spend' && astralSpendNote(stats).map((note) => <small key={note} className='arcana-energy-breakdown'>{t(note, language)}</small>)}
               <div className='arcana-purchase'><span>{t('additional purchase', language)}: <strong>{stats.mana.additionalPurchase}</strong></span>
                  <AdvancementValue label={t('Astral energy', language)} value={stats.mana.additionalPurchase} cost={nextStepCost(stats.mana.additionalPurchase, 'd')}
                     availableAP={availableAP} spendAP={spendAP} pending={busy || (spendAP && !stats.isSorcerer)} onChange={(target) => manaPurchase.mutate(target)} />
               </div>
               {stats.isSorcerer && <PermanentMana stats={stats} />}
            </div>
            <dl className='arcana-summary-values'>
               <div><dt>{t('Tradition', language)}</dt><dd>{traditions.length ? traditions.map((entry) => <span key={entry.key}>{translateRuleLabel(entry.key, language)} <Source page={entry.page} /></span>) : t('Nothing recorded yet.', language)}</dd></div>
               <div><dt>{t('Leading attribute', language)}</dt><dd>{traditions.length ? traditions.map((entry) =>
                  <span key={entry.key}>{getAttributeAbbreviation(entry.attribute, language)} {stats[entry.attribute]}</span>) : '—'}</dd></div>
            </dl>
         </div>
         <div className='attribute-grid arcana-attributes'>
            {attributes.map((attribute) => <div className='attribute-tile' key={attribute}>
               <span>{getAttributeAbbreviation(attribute, language)}</span><strong>{stats[attribute]}</strong>
            </div>)}
         </div>
      </section>

      <section className='overview-section arcana-foundation'>
         <header className='section-header'><div>
            <h3>{t('Magical foundation', language)}</h3>
         </div></header>
         <div className='combat-two-column arcana-foundation-grid'>
            <CharacterEntryList stats={stats} category='generalSpecialAbilities' title='Tradition' catalogKeys={traditionKeys}
               addLabel='Add tradition' />
            <CharacterEntryList stats={stats} category='generalSpecialAbilities' title='Magical special abilities'
               addLabel='Add magical ability' groups={['magic']} />
         </div>
         <PropertyKnowledgePanel stats={stats} reference={reference} />
      </section>

      {showStaff && <section className='overview-section' data-magic-section='staff'>
         <header className='section-header'><h3>{t('Magierstab', language)} <Source page='275–278' /></h3>
            {guildMage && <button className='icon-button' type='button' aria-label={t('Guild creation exception', language)} disabled={busy}
               onClick={() => setDialog({ kind: 'settings' })}><Pencil size={16} /></button>}</header>
         {!guildMage && <p className='arcana-warning'>{t('These staff spells belong to Tradition (Gildenmagier), which is not recorded.', language)}</p>}
         <div className='combat-two-column arcana-foundation-grid'>
            <CharacterEntryList stats={stats} category='generalSpecialAbilities' title='Stabzauber' addLabel='Add staff spell' groups={['staff']} />
            <StaffPanel stats={stats} reference={reference} />
         </div>
         {stats.magicSettings.guildSpell && <p>{t('Guild creation exception', language)}: <strong lang='de'>{stats.magicSettings.guildSpell}</strong> <Source page={275} /></p>}
      </section>}

      {showWitch && <section className='overview-section' data-magic-section='witch'>
         <header className='section-header'><h3>{t('Hexe', language)} <Source page='278–283' /></h3></header>
         {!witch && <p className='arcana-warning'>{t('These entries belong to Tradition (Hexe), which is not recorded.', language)}</p>}
         <div className='combat-two-column arcana-foundation-grid'>
            <CharacterEntryList stats={stats} category='generalSpecialAbilities' title='Familiar and flying device' addLabel='Add witch ability' groups={['witch']} />
            <FlyingDevicePanel stats={stats} />
         </div>
      </section>}

      {(['spells', 'curses', 'songs'] as const).filter((section) => section === 'spells' || (section === 'curses' ? witch || ownsKind('Hexenfluch') : showSongs)).map((section) => {
         const curse = section === 'curses'
         const kinds: Array<MagicSpell['kind']> = section === 'spells' ? ['Zauberspruch', 'Ritual'] : curse ? ['Hexenfluch'] : ['Elfenlied']
         const rows = (section === 'spells' ? owned : stats.spells).filter((entry) => kinds.includes(kindOf(entry.key) ?? 'Zauberspruch'))
         const renderSpellCards = (entries: typeof rows) => <ul className='spell-card-grid'>{entries.map((entry) => {
            const spell = reference.spells.find((definition) => definition.key === entry.key)
            if (!spell) return <li key={entry.key} className='spell-card'>{entry.key} · {t('No verified spell data.', language)}</li>
            return <SpellCard key={entry.key} stats={stats} reference={reference} spell={spell} entry={entry} busy={busy}
               advanceLocked={busy || (spendAP && (!mage || !traditions.length))} onDialog={setDialog}
               onAdvance={(value) => mutation.mutate({ action: 'spell', key: entry.key, value, spendAP })} />
         })}</ul>
         return <section className='overview-section' key={section} data-magic-section={section}>
         <header className='section-header'><h3>{t(curse ? 'Hexenflüche' : section === 'songs' ? 'Elfenlieder' : 'Spells & rituals', language)}
            {curse && <Source page='281–283' />}{section === 'songs' && <Source page='283–284' />}</h3>
            <button className='quiet-button' type='button' onClick={() => setDialog({ kind: curse ? 'curse' : section === 'songs' ? 'song' : 'spell' })} disabled={busy}>
               <Plus size={16} />{t(curse ? 'Learn Hexenfluch' : section === 'songs' ? 'Learn Elfenlied' : 'Learn spell or ritual', language)}</button>
         </header>
         {section === 'songs' && !elf && <p className='arcana-warning'>{t('Elfenlieder belong to Tradition (Elf), which is not recorded.', language)}</p>}
         {section === 'songs' && <p className='combat-note'>{t('Songs follow the ritual rules without modifications or clothing. Before the song you may roll Singen (Zweistimmiger Gesang) or Musizieren: each QS adds 1 FP.', language)}</p>}
         {curse ? <details className='arcana-disclosure'><summary>{t('Curse rules', language)}</summary><CurseReference /></details> : section === 'spells' && !!stats.spells.some((entry) =>
            kinds.includes(kindOf(entry.key) ?? 'Zauberspruch')) && <label className='field-group arcana-search'><span>{t('Search spells and rituals', language)}</span>
            <input type='search' value={search} onChange={(event) => setSearch(event.target.value)} />
         </label>}
         {!rows.length ? <p className='combat-empty'>{t(curse ? 'No Hexenflüche recorded yet.' : section === 'songs' ? 'No Elfenlieder recorded yet.'
            : search ? 'No matching spells or rituals.' : 'No spells or rituals recorded yet.', language)}</p> :
            // One shared grid so cards of different distributions fill the same rows; sorted by distribution, shown on each card.
            renderSpellCards(section !== 'spells' ? rows : groupByDistribution(rows, (entry) =>
               reference.spells.find((spell) => spell.key === entry.key)).flatMap((group) => group.entries))}
      </section>
      })}

      {artifactMagic && <section className='overview-section' data-magic-section='artifacts'>
         <header className='section-header'><h3>{t('Artefaktmagie', language)} <Source page='266–270' /></h3></header>
         <ArcanoviPanel stats={stats} reference={reference} />
      </section>}

         {(stats.magicSettings.artifactItems.length > 0 || stats.magicSettings.artifacts) && <section className='overview-section'>
            <header className='section-header'><h3>{t('Earlier artifact links', language)}</h3>
               <button className='icon-button' type='button' aria-label={t('Tradition artifacts and creation exception', language)} disabled={busy}
                  onClick={() => setDialog({ kind: 'settings' })}><Pencil size={16} /></button>
            </header>
            <p className='combat-note'>{t('Staff and flying device now have their own sections; magical artifacts are on the Equipment tab. Unlink these entries once they are moved.', language)}</p>
            {stats.magicSettings.artifactItems.length ? <ul className='tag-list combat-ability-list character-entry-tags'>
               {stats.magicSettings.artifactItems.map((name) => {
                  const items = stats.equipment.filter((item) => item.item === name && item.amount > 0)
                  return <li key={name}><div><strong>{name}</strong>
                     {items.length ? items.map((item, index) => <p className='arcana-cell-note' key={index}>
                        {item.amount} × · {t(item.carriedOn, language)} · {item.weight} {t('Stein', language)}
                     </p>) : <p className='field-error'>{t('Not in the current inventory; unlink this item before saving.', language)}</p>}
                  </div></li>
               })}
            </ul> : null}
            {stats.magicSettings.artifacts && <><h4>{t('Artifact notes', language)}</h4><p className='arcana-artifacts'>{stats.magicSettings.artifacts}</p></>}
         </section>}
      <section className='overview-section'>
         <header className='section-header'><h3>{t('Zaubertricks', language)} <Source page='286–287' /></h3>
            <button className='quiet-button' type='button' disabled={busy} onClick={() => setDialog({ kind: 'trick' })}><Plus size={16} />{t('Learn Zaubertrick', language)}</button>
         </header>
         <details className='arcana-disclosure'><summary>{t('Zaubertrick rules', language)}</summary>
            <p className='combat-note'>{t('Zaubertricks: 1 AsP, 1 action, no check, QS 1 (QS 2 with Starke Zaubertricks). No modifications.', language)}</p>
         </details>
         {stats.magicTricks.length ? <ul className='arcana-tricks'>{stats.magicTricks.map((entry) => {
            const trick = reference.tricks.find((definition) => definition.key === entry.key)
            return <li key={entry.key}><div><strong lang='de'>{entry.key}</strong>
               {trick && <details className='arcana-disclosure'><summary>{t('Details', language)}</summary>
                  <p>{trick.effect[language]}</p><small>{rangeLabel(trick.range, language)} · {t(trick.duration, language)} · {translateRuleLabel(trick.property, language)} <Source page={trick.page} /></small>
               </details>}
            </div><button className='icon-button' type='button' aria-label={`${t('Remove', language)} ${entry.key}`} disabled={busy}
               onClick={() => setDialog({ kind: 'remove', key: entry.key, trick: true, paidAP: entry.paidAP })}><Trash2 size={14} /></button></li>
         })}</ul> : <p className='combat-empty'>{t('Nothing recorded yet.', language)}</p>}
      </section>
      <section className='overview-section arcana-reference'>
         <details className='arcana-disclosure arcana-reference-disclosure'>
         <summary>{t('Casting reference', language)}</summary>
         <p className='combat-note'>{t('DSA5 Rulebook', language)} <Source page='253–261, 274–286' /></p>
         <dl className='arcana-casting-notes'>
            <div><dt>{t('Before casting', language)}</dt>
               <dd>{t('Check target, range and sight first. Choose modifications before casting. Resistance changes check attributes, not FW.', language)}</dd></div>
            <div><dt>{t('Sustained magic', language)}</dt>
               <dd>{t('Sustaining each spell or liturgy gives −1 to further magical or divine checks, not talents. Failed sustained spells include the first interval in their cost.', language)}</dd></div>
            <div><dt>{t('Failed casting & circumstances', language)}</dt>
               <dd>{t('A failed spell normally costs half; Tradition (Hexe) costs one third. Interruptions, conditions, iron, ritual site and tradition requirements still apply.', language)}</dd></div>
         </dl>
         <ModificationRules ritual={false} />
         <ModificationRules ritual />
         <p className='arcana-casting-reminder'>{t('These are reference values, not a casting calculator. Apply situational effects and spell-specific QS results at the table; adjust AsP manually.', language)}</p>
         </details>
      </section>
      {dialog && <ArcanaEditor key={`${dialog.kind}-${'key' in dialog ? dialog.key : ''}`} dialog={dialog} stats={stats} reference={reference}
         pending={mutation.isPending} onSave={(action) => mutation.mutate(action)} onClose={() => setDialog(null)} />}
      {resources && <StatsEditor stats={stats} scope='resources' onClose={() => setResources(false)} />}
   </div>
}

export function HeroArcana({ hero }: { hero: Hero }) {
   const language = useLanguageStore((state) => state.language)
   const statsQuery = useQuery({ queryKey: ['stats', hero._id], queryFn: () => getStatsForHero(hero._id) })
   const referenceQuery = useQuery({ queryKey: ['magic-reference'], queryFn: getMagicReference, staleTime: Infinity })
   if (statsQuery.isError || referenceQuery.isError) return <div className='state-panel' role='alert'>
      <p>{getErrorMessage(statsQuery.error ?? referenceQuery.error)}</p>
      <button className='quiet-button' type='button' onClick={() => { void statsQuery.refetch(); void referenceQuery.refetch() }}>{t('Retry', language)}</button>
   </div>
   if (!statsQuery.data || !referenceQuery.data) return <p>{t('Loading magic sheet...', language)}</p>
   return <ArcanaSheet stats={statsQuery.data} reference={referenceQuery.data} />
}
