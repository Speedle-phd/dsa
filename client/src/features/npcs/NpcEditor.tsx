import { Plus, Trash2, X } from 'lucide-react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { attributeLabels, getAttributeAbbreviation, talentCatalog } from '@/features/heroes/talentCatalog'
import { useLanguageStore } from '@/locales/languageStore'
import { t, translateRuleLabel } from '@/locales/translation'
import { abilitySuggestions, attributeOrder, emptySheet, emptyWeapon, ruleThresholds, withLegacy, type NpcDraft, type NpcSheet, type NpcWeapon } from './npcSheet'

type Props = {
   initialName: string; initialTags: string[]; initial: NpcDraft
   pending: boolean; warnings?: string[]
   onSave: (input: { name: string; tags: string[]; values: NpcDraft }) => void; onCancel: () => void
}
type PainMode = 'rule' | 'printed' | 'none'
const numberOrNull = (value: string) => value.trim() === '' ? null : Number(value)
const kindLabels: Record<NpcWeapon['kind'], string> = { melee: 'Melee weapon', ranged: 'Ranged weapon', natural: 'Natural attack' }

// Full NPC stat block (S. 354) for the GM's library (user request, Nov 2026): every field of a published stat block,
// all optional except name and LeP. Imported or generated NPCs open here for checking.
export function NpcEditor({ initialName, initialTags, initial, pending, warnings = [], onSave, onCancel }: Props) {
   const language = useLanguageStore((state) => state.language)
   const [name, setName] = useState(initialName)
   const [tags, setTags] = useState(initialTags.join(', '))
   const [draft, setDraft] = useState<NpcDraft>(initial)
   const sheet = draft.sheet ?? emptySheet()
   const painMode: PainMode = sheet.painThresholds === null ? 'rule' : sheet.painThresholds.length ? 'printed' : 'none'
   const set = (change: Partial<NpcDraft>) => setDraft((current) => ({ ...current, ...change }))
   const setSheet = (change: Partial<NpcSheet>) => setDraft((current) => ({ ...current, sheet: { ...(current.sheet ?? emptySheet()), ...change } }))
   const setWeapon = (index: number, change: Partial<NpcWeapon>) => setSheet({ weapons: sheet.weapons.map((weapon, slot) => slot === index ? { ...weapon, ...change } : weapon) })

   function submit(event: FormEvent) {
      event.preventDefault()
      onSave({ name: name.trim(), tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 12), values: withLegacy(draft) })
   }

   return <form className='npc-editor' onSubmit={submit} lang={language}>
      {warnings.length > 0 && <section className='overview-section npc-editor-warnings' role='status'>
         <h2>{t('Please check these lines', language)}</h2>
         <p className='party-muted'>{t('They could not be read automatically and were not taken over:', language)}</p>
         <ul>{warnings.map((warning) => <li key={warning}><code>{warning}</code></li>)}</ul>
      </section>}

      <Section title={t('Basics', language)}>
         <div className='npc-editor-grid'>
            <Field label={t('Name', language)} wide><input value={name} required maxLength={80} onChange={(event) => setName(event.target.value)} /></Field>
            <Field label={t('Tags (comma-separated)', language)} wide><input value={tags} maxLength={300} placeholder={t('e.g. robbers, chapter 2', language)} onChange={(event) => setTags(event.target.value)} /></Field>
            <Field label={t('Type', language)}><input value={sheet.typus} maxLength={80} placeholder={t('e.g. Kulturschaffender', language)} onChange={(event) => setSheet({ typus: event.target.value })} /></Field>
            <Field label={t('Size category', language)}><input value={sheet.size} maxLength={40} onChange={(event) => setSheet({ size: event.target.value })} /></Field>
            <Field label={t('Number', language)}><input value={sheet.count} maxLength={80} placeholder={t('e.g. heroes + 1', language)} onChange={(event) => setSheet({ count: event.target.value })} /></Field>
         </div>
      </Section>

      <Section title={t('Attributes', language)}>
         <label className='regen-toggle'>
            <input type='checkbox' checked={sheet.attributes !== null}
               onChange={(event) => setSheet({ attributes: event.target.checked ? { courage: 12, wisdom: 11, intuition: 12, charisma: 11, fingerDexterity: 12, dexterity: 12, constitution: 12, strength: 12 } : null })} />
            <span><strong>{t('Record attributes', language)}</strong><small>{t('Needed for checks of the NPC; the fight uses the values below.', language)}</small></span>
         </label>
         {sheet.attributes && <div className='npc-editor-attributes'>
            {attributeOrder.map((key) => <Field key={key} label={getAttributeAbbreviation(key, language)} title={t(attributeLabels[key], language)}>
               <input type='number' min={0} max={40} value={sheet.attributes![key]} onChange={(event) => setSheet({ attributes: { ...sheet.attributes!, [key]: Number(event.target.value) } })} />
            </Field>)}
            <label className='regen-toggle'><input type='checkbox' checked={sheet.wisdomAnimal} onChange={(event) => setSheet({ wisdomAnimal: event.target.checked })} />
               <span><strong>{t('Animal cleverness (t)', language)}</strong><small>S. 355</small></span></label>
         </div>}
      </Section>

      <Section title={t('Combat values', language)}>
         <div className='npc-editor-grid npc-editor-numbers'>
            <Num label={t('LeP', language)} value={draft.maxHealth} min={1} required onChange={(value) => set({ maxHealth: value ?? 1 })} />
            <Num label={t('AsP', language)} value={sheet.mana} onChange={(value) => setSheet({ mana: value })} />
            <Num label={t('KaP', language)} value={sheet.karma} onChange={(value) => setSheet({ karma: value })} />
            <Num label={t('INI base', language)} value={draft.initiativeBase} min={-20} required onChange={(value) => set({ initiativeBase: value ?? 0 })} />
            <Num label={t('AW', language)} value={draft.dodge} onChange={(value) => set({ dodge: value })} />
            <Num label={t('VW', language)} title={t('Defense of non-humanoid creatures (S. 354)', language)} value={draft.defense} onChange={(value) => set({ defense: value })} />
            <Num label={t('SK', language)} value={sheet.soulPower} min={-10} onChange={(value) => setSheet({ soulPower: value })} />
            <Num label={t('ZK', language)} value={sheet.toughness} min={-10} onChange={(value) => setSheet({ toughness: value })} />
            <Num label={t('GS', language)} value={draft.speed} onChange={(value) => set({ speed: value })} />
            <Num label={t('RS', language)} value={draft.armor} required onChange={(value) => set({ armor: value ?? 0 })} />
            <Num label={t('BE', language)} value={sheet.burden} max={4} required onChange={(value) => setSheet({ burden: value ?? 0 })} />
            <Num label={t('Actions', language)} title={t('Actions per combat round (creatures, S. 354)', language)} value={sheet.actions} min={1} max={6} required onChange={(value) => setSheet({ actions: value ?? 1 })} />
            <Field label={t('Armor', language)} wide><input value={sheet.armorName} maxLength={80} onChange={(event) => setSheet({ armorName: event.target.value })} /></Field>
         </div>
         <p className='party-muted'>{t('Enter the values as printed: armour, Belastung and Schmerz are not deducted again.', language)}</p>
      </Section>

      <Section title={t('Weapons and attacks', language)} action={<div className='npc-editor-add'>
         {(['melee', 'ranged', 'natural'] as const).map((kind) => <button key={kind} type='button' className='quiet-button' onClick={() => setSheet({ weapons: [...sheet.weapons, emptyWeapon(kind)] })}>
            <Plus size={15} aria-hidden='true' />{t(kindLabels[kind], language)}</button>)}
      </div>}>
         {sheet.weapons.length === 0 && <p className='party-muted'>{t('No weapons yet. Without a weapon the NPC cannot attack.', language)}</p>}
         <ul className='npc-weapon-list'>
            {sheet.weapons.map((weapon, index) => <li key={index} className='npc-weapon'>
               <Field label={t('Name', language)} wide><input value={weapon.name} required maxLength={60} onChange={(event) => setWeapon(index, { name: event.target.value })} /></Field>
               <Field label={t('Kind', language)}>
                  <select value={weapon.kind} onChange={(event) => setWeapon(index, { ...emptyWeapon(event.target.value as NpcWeapon['kind']), name: weapon.name, attack: weapon.attack, damage: weapon.damage })}>
                     {(['melee', 'ranged', 'natural'] as const).map((kind) => <option key={kind} value={kind}>{t(kindLabels[kind], language)}</option>)}
                  </select>
               </Field>
               <Num label={t(weapon.kind === 'ranged' ? 'FK' : 'AT', language)} value={weapon.attack} required onChange={(value) => setWeapon(index, { attack: value ?? 0 })} />
               {weapon.kind === 'melee' && <Num label={t('PA', language)} value={weapon.parry} onChange={(value) => setWeapon(index, { parry: value })} />}
               <Field label={t('TP', language)}><input value={weapon.damage} maxLength={40} placeholder='1W6+3' onChange={(event) => setWeapon(index, { damage: event.target.value })} /></Field>
               {weapon.kind === 'ranged'
                  ? <>
                     <Field label={t('Range', language)}><input value={weapon.range ?? ''} maxLength={20} placeholder='10/50/80' pattern='\d+/\d+/\d+' onChange={(event) => setWeapon(index, { range: event.target.value || null })} /></Field>
                     <Num label={t('LZ', language)} title={t('Reload time in actions (S. 245)', language)} value={weapon.reload} onChange={(value) => setWeapon(index, { reload: value })} />
                     <Field label={t('Ammunition', language)}><input value={weapon.ammo ?? ''} maxLength={80} onChange={(event) => setWeapon(index, { ammo: event.target.value || null })} /></Field>
                  </>
                  : <Field label={t('Reach', language)}>
                     <select value={weapon.reach ?? ''} onChange={(event) => setWeapon(index, { reach: (event.target.value || null) as NpcWeapon['reach'] })}>
                        <option value=''>—</option>
                        {(['short', 'medium', 'long'] as const).map((reach) => <option key={reach} value={reach}>{t(reach, language)}</option>)}
                     </select>
                  </Field>}
               <Num label={t('Max. per round', language)} value={weapon.perRound} min={1} max={10} onChange={(value) => setWeapon(index, { perRound: value })} />
               <button type='button' className='icon-button npc-weapon-remove' aria-label={`${t('Remove', language)}: ${weapon.name || t(kindLabels[weapon.kind], language)}`}
                  onClick={() => setSheet({ weapons: sheet.weapons.filter((_, slot) => slot !== index) })}><Trash2 size={16} aria-hidden='true' /></button>
            </li>)}
         </ul>
      </Section>

      <Section title={t('Special abilities', language)}>
         <AbilityChips abilities={sheet.abilities} onChange={(abilities) => setSheet({ abilities })} />
      </Section>

      <Section title={t('Talents', language)} action={<button type='button' className='quiet-button' onClick={() => setSheet({ talents: [...sheet.talents, { name: '', value: 5 }] })}>
         <Plus size={15} aria-hidden='true' />{t('Add talent', language)}</button>}>
         <datalist id='npc-talents'>{talentCatalog.map((talent) => <option key={talent.key} value={talent.label} />)}</datalist>
         <ul className='npc-talent-list'>
            {sheet.talents.map((talent, index) => <li key={index}>
               <input list='npc-talents' value={talent.name} required maxLength={60} aria-label={t('Talent', language)}
                  onChange={(event) => setSheet({ talents: sheet.talents.map((entry, slot) => slot === index ? { ...entry, name: event.target.value } : entry) })} />
               <input type='number' min={-5} max={30} value={talent.value} aria-label={`${t('FW', language)} ${talent.name}`}
                  onChange={(event) => setSheet({ talents: sheet.talents.map((entry, slot) => slot === index ? { ...entry, value: Number(event.target.value) } : entry) })} />
               <button type='button' className='icon-button' aria-label={`${t('Remove', language)}: ${talent.name}`}
                  onClick={() => setSheet({ talents: sheet.talents.filter((_, slot) => slot !== index) })}><X size={15} aria-hidden='true' /></button>
            </li>)}
         </ul>
      </Section>

      <Section title={t('Behaviour, flight and Schmerz', language)}>
         <Field label={t('Combat behaviour', language)} wide><textarea rows={3} maxLength={2000} value={sheet.behaviour} onChange={(event) => setSheet({ behaviour: event.target.value })} /></Field>
         <div className='npc-editor-grid'>
            <Field label={t('Flight', language)} wide><input value={sheet.flight} maxLength={500} placeholder={t('e.g. after losing 50 % of LeP', language)} onChange={(event) => setSheet({ flight: event.target.value })} /></Field>
            <Num label={t('Flees at LeP', language)} value={sheet.fleeAt} onChange={(value) => setSheet({ fleeAt: value })} />
         </div>
         <fieldset className='npc-pain'>
            <legend>{t('Schmerz', language)}</legend>
            <div className='probe-segmented'>
               {(['rule', 'printed', 'none'] as const).map((mode) => <button key={mode} type='button' aria-pressed={painMode === mode} className={`probe-chip${painMode === mode ? ' is-active' : ''}`}
                  onClick={() => setSheet({ painThresholds: mode === 'rule' ? null : mode === 'none' ? [] : ruleThresholds(draft.maxHealth) })}>
                  {t(mode === 'rule' ? 'By the rule' : mode === 'printed' ? 'As printed' : 'No Schmerz', language)}</button>)}
            </div>
            <p className='probe-segmented-note'>{painMode === 'rule'
               ? `${t('Schmerz +1 at', language)} ${ruleThresholds(draft.maxHealth).join(', ')} ${t('LeP', language)} (S. 34)`
               : t(painMode === 'none' ? 'Demons and elementals feel no Schmerz (S. 355, 358).' : 'LeP at or below which the NPC gains one level each:', language)}</p>
            {painMode === 'printed' && <div className='npc-pain-values'>
               {(sheet.painThresholds ?? []).map((value, index) => <input key={index} type='number' min={0} max={999} value={value} aria-label={`${t('Schmerz', language)} ${index + 1}`}
                  onChange={(event) => setSheet({ painThresholds: sheet.painThresholds!.map((entry, slot) => slot === index ? Number(event.target.value) : entry) })} />)}
            </div>}
         </fieldset>
      </Section>

      <Section title={t('More', language)}>
         <Field label={t('Advantages/disadvantages', language)} wide><textarea rows={2} maxLength={2000} value={sheet.traits} onChange={(event) => setSheet({ traits: event.target.value })} /></Field>
         <Field label={t('Spells and liturgies', language)} wide><textarea rows={2} maxLength={2000} value={sheet.spells} onChange={(event) => setSheet({ spells: event.target.value })} /></Field>
         <Field label={t('Special rules', language)} wide><textarea rows={2} maxLength={2000} value={sheet.special} onChange={(event) => setSheet({ special: event.target.value })} /></Field>
         <Field label={t('Loot', language)} wide><input value={sheet.loot} maxLength={500} onChange={(event) => setSheet({ loot: event.target.value })} /></Field>
         <Field label={t('Notes', language)} wide><textarea rows={2} maxLength={2000} value={draft.notes} onChange={(event) => set({ notes: event.target.value })} /></Field>
      </Section>

      <footer className='editor-actions npc-editor-actions'>
         <button className='quiet-button' type='button' onClick={onCancel}>{t('Cancel', language)}</button>
         <button className='primary-button' type='submit' disabled={pending || !name.trim()}>{t('Save NPC', language)}</button>
      </footer>
   </form>
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
   return <section className='overview-section npc-editor-section'>
      <header className='section-heading npc-editor-heading'><h2>{title}</h2>{action}</header>
      {children}
   </section>
}

function Field({ label, title, wide = false, children }: { label: string; title?: string; wide?: boolean; children: ReactNode }) {
   return <label className={wide ? 'field-group is-wide' : 'field-group'} title={title}><span>{label}</span>{children}</label>
}

function Num({ label, title, value, min = 0, max = 999, required = false, onChange }: {
   label: string; title?: string; value: number | null; min?: number; max?: number; required?: boolean; onChange: (value: number | null) => void
}) {
   return <Field label={label} title={title}>
      <input type='number' inputMode='numeric' min={min} max={max} required={required} value={value ?? ''}
         onChange={(event) => onChange(numberOrNull(event.target.value))} />
   </Field>
}

export function AbilityChips({ abilities, onChange }: { abilities: string[]; onChange: (abilities: string[]) => void }) {
   const language = useLanguageStore((state) => state.language)
   const [entry, setEntry] = useState('')
   const listId = useId()
   const add = () => {
      const value = entry.trim()
      if (value && !abilities.includes(value)) onChange([...abilities, value].slice(0, 60))
      setEntry('')
   }
   return <div className='npc-abilities'>
      {abilities.length > 0 && <ul className='party-chips'>
         {abilities.map((ability) => <li key={ability} lang='de'>{translateRuleLabel(ability, language)}
            <button type='button' className='npc-chip-remove' aria-label={`${t('Remove', language)}: ${ability}`} onClick={() => onChange(abilities.filter((item) => item !== ability))}>
               <X size={12} aria-hidden='true' /></button></li>)}
      </ul>}
      <div className='npc-ability-add'>
         <input list={listId} value={entry} maxLength={80} placeholder={t('e.g. Finte I', language)} aria-label={t('Add special ability', language)}
            onChange={(event) => setEntry(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add() } }} />
         <datalist id={listId}>{abilitySuggestions.map((ability) => <option key={ability} value={ability} />)}</datalist>
         <button type='button' className='quiet-button' onClick={add} disabled={!entry.trim()}><Plus size={15} aria-hidden='true' />{t('Add', language)}</button>
      </div>
   </div>
}
