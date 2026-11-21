import { createPortal } from 'react-dom'
import { useId, useRef, useState, type FormEvent } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { z } from 'zod'
import { toast } from 'sonner'
import { Tooltip } from '@/components/Tooltip'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { useLanguageStore } from '@/locales/languageStore'
import { t, translateRuleLabel } from '@/locales/translation'
import type { CheckProfile, CheckContext, ModifierSource, RollEffect, Stats, TargetRule } from './statsApi'
import { applyTargetRule, emptyContext, useCheckState } from './checkState'

type Context = CheckContext
const contextSchema = z.object({
   modifier: z.coerce.number().int().min(-100).max(100),
   effects: z.array(z.string()),
   burden: z.boolean().nullable(), movement: z.boolean().nullable(), pleasing: z.boolean().nullable(), preserveAction: z.boolean(), preserveActionCheck: z.boolean(),
})
const signed = (value: number) => value > 0 ? `+${value}` : `${value}`

function ContextEditor({ context, onSave, onClose, label, options, effects }: {
   context: Context; onSave: (context: Context) => void; onClose: () => void; label: string
   options: Array<'burden' | 'movement' | 'pleasing' | 'preserveAction' | 'preserveActionCheck'>
   effects: RollEffect[]
}) {
   const language = useLanguageStore((state) => state.language)
   const id = useId()
   const ref = useModalKeyboard(onClose)
   const labels = {
      burden: 'Apply Belastung to this use',
      movement: 'This check requires movement or speech',
      pleasing: 'This talent is pleasing to the deity',
      preserveAction: 'Schmerz IV: capable of acting after Selbstbeherrschung',
      preserveActionCheck: 'This is Selbstbeherrschung (Handlungsfähigkeit bewahren)',
   }
   function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const form = new FormData(event.currentTarget)
      const selected = form.getAll('effects').filter((value): value is string => typeof value === 'string')
      const active = effects.filter((effect) => !effect.automatic && selected.includes(effect.id))
      const incompatible = active.some((effect, index) => active.some((other, otherIndex) => index !== otherIndex &&
         ((effect.group && effect.group === other.group) ||
            effect.excludes?.some((key) => other.label.startsWith(key) || other.group === key))))
      if (incompatible) {
         toast.error(t('Choose compatible effects: one option per maneuver, stance or context group.', language))
         return
      }
      const reduction = active.reduce((sum, effect) => sum + (effect.offsetPenalty ?? 0), 0)
      if (reduction > 0 && Number(form.get('modifier')) > -reduction) {
         toast.error(t('Enter the original situational penalty before selecting a penalty reduction.', language))
         return
      }
      const next = { ...context, modifier: form.get('modifier'), effects: selected }
      for (const key of options) {
         const raw = form.get(key)
         if (key === 'preserveAction' || key === 'preserveActionCheck') next[key] = raw === 'true'
         else next[key] = raw === '' ? null : raw === 'true'
      }
      const result = contextSchema.safeParse(next)
      if (!result.success) { toast.error(t('Please correct the highlighted values.', language)); return }
      onSave(result.data)
      onClose()
   }
   return createPortal(
      <div className='modal-backdrop' onMouseDown={onClose}>
         <section ref={ref} className='hero-editor check-context-editor' role='dialog' aria-modal='true'
            aria-labelledby={id} onMouseDown={(event) => event.stopPropagation()} lang={language}>
            <header className='editor-header'><h2 id={id}>{t('Roll modifiers', language)}: {label}</h2>
               <button type='button' className='icon-button' aria-label={t('Close', language)} onClick={onClose}><X size={20} /></button>
            </header>
            <form className='hero-form' onSubmit={submit}>
               <label className='field-group'><span>{t('Situational modifier', language)}</span>
                  <input autoFocus name='modifier' type='number' step={1} min={-100} max={100} required defaultValue={context.modifier} />
               </label>
               <p>{t('Positive = easier, negative = harder. Temporary until page reload; shared across tabs. Include only effects not already listed in the breakdown.', language)}</p>
               {effects.length > 0 && <fieldset className='form-section roll-entry-effects'>
                  <legend>{t('Owned rule effects', language)}</legend>
                  <p className='combat-note'>{t('Automatic effects are included. Select conditional effects only when their rule requirements apply. FW bonuses do not change attribute targets.', language)}</p>
                  <p className='combat-note'>{t('Checkboxes apply only to this check after Apply. Uncheck or reset when the situation changes. Selections reset on page reload.', language)}</p>
                  {effects.map((effect) => <label className='roll-entry-effect' key={effect.id}>
                     {!effect.automatic && <input type='checkbox' name='effects' value={effect.id} defaultChecked={context.effects.includes(effect.id)} />}
                     <span>
                        <strong>{translateRuleLabel(effect.label, language)}</strong>
                        {effect.automatic && <small>{t('Automatic', language)}</small>}
                        <small>{effect.value ? `${signed(effect.value)} · ` : ''}{effect.skillPoints ? `${t('FW', language)} +${effect.skillPoints} · ` : ''}{t('S.', language)} {effect.page}</small>
                        <small>{effect[language]}</small>
                     </span>
                  </label>)}
               </fieldset>}
               {options.map((key) => <label className='field-group' key={key}>
                  <span>{t(labels[key], language)}</span>
                  <select name={key} defaultValue={context[key] === null ? '' : String(context[key])}>
                     {key !== 'preserveAction' && key !== 'preserveActionCheck' && <option value=''>{t('Choose for this check', language)}</option>}
                     <option value='false'>{t('No', language)}</option><option value='true'>{t('Yes', language)}</option>
                  </select>
               </label>)}
               <footer className='editor-actions'>
                  <button className='quiet-button' type='button' onClick={() => { onSave(emptyContext); onClose() }}>{t('Reset modifiers', language)}</button>
                  <button className='primary-button' type='submit'>{t('Apply', language)}</button>
               </footer>
            </form>
         </section>
      </div>, document.body,
   )
}

export function ModifiedValue({ base, modifier, sources, blocked = [], factor = 1, checkTarget = true, minimum, contextRequired = [], targetRule = null }: {
   base: number | number[]; modifier: number; sources: ModifierSource[]; blocked?: string[]; factor?: number; checkTarget?: boolean; minimum?: number; contextRequired?: string[]
   targetRule?: TargetRule | null
}) {
   const language = useLanguageStore((state) => state.language)
   const values = Array.isArray(base) ? base : [base]
   // source: DSA5 Regelwerk, S. 17, 33 (round fractional GS after Paralyse)
   const effective = values.map((value) => applyTargetRule(Math.max(minimum ?? -Infinity, Math.round((value + modifier) * factor)), targetRule))
   const noCheck = blocked.length > 0 || (checkTarget && effective.some((value) => value <= 0))
   const changed = effective.some((value, index) => value !== values[index])
   const breakdown = [
      `${t('Base value', language)}: ${values.join('/')}`,
      ...sources.map((source) => `${translateRuleLabel(source.label, language)}: ${signed(source.value)}${source.page ? ` · ${t('S.', language)} ${source.page}` : ''}`),
      ...(factor !== 1 ? [`${t('Paralyse', language)}: ×${factor} · S. 17, 33`] : []),
      ...(targetRule ? [`${t('Blind', language)}: ${t(targetRule === 'one' ? 'only a rolled 1 succeeds' : 'halved', language)} · ${t('S.', language)} 35`] : []),
      ...blocked.map((reason) => t(reason, language)),
      ...contextRequired.map((reason) => t(reason, language)),
      ...(checkTarget && effective.some((value) => value <= 0) ? [t('Effective target ≤ 0: no check possible.', language)] : []),
   ].join(' · ')
   return <span className='check-value'>
      <span>{values.join('/')}</span>
      {(changed || noCheck || contextRequired.length > 0) && <Tooltip content={breakdown} clickToToggle lang={language} className='check-result-tooltip'>
         <span className={`check-modifier ${noCheck || effective.some((value, index) => value < values[index]) ? 'is-harder'
            : effective.some((value, index) => value > values[index]) ? 'is-easier' : ''}`}>
            {noCheck ? t('Unavailable', language) : contextRequired.length > 0 ? t('Set context', language) : effective.join('/')}
         </span>
      </Tooltip>}
   </span>
}

export function CheckModifierButton({ check, label }: { check: ReturnType<typeof useCheckState>; label: string }) {
   const language = useLanguageStore((state) => state.language)
   const [editing, setEditing] = useState(false)
   const triggerRef = useRef<HTMLButtonElement>(null)
   return <>
      <button ref={triggerRef} className='icon-button check-settings' type='button' aria-label={`${t('Roll modifiers', language)}: ${label}`}
         title={t('Roll modifiers', language)} onClick={() => setEditing(true)}><SlidersHorizontal size={14} /></button>
      {editing && <ContextEditor label={label} context={check.context} options={check.options} effects={check.effects} onClose={() => {
         setEditing(false)
         triggerRef.current?.focus()
      }} onSave={check.save} />}
   </>
}

export function CheckValue({ stats, base, kind, checkKey, label, burden = false, complex = false }: {
   stats: Stats; base: number | number[]; kind: CheckProfile['kind']; checkKey: string; label: string
   burden?: boolean | 'maybe'; complex?: boolean
}) {
   const check = useCheckState(stats, kind, checkKey, { burden, complex })
   return <span className='check-control'>
      <ModifiedValue base={base} modifier={check.total} sources={check.sources} blocked={check.blocked} contextRequired={check.unresolved} targetRule={check.targetRule} />
      <CheckModifierButton check={check} label={label} />
   </span>
}

export function TalentSkillValue({ stats, checkKey, value }: { stats: Stats; checkKey: string; value: number }) {
   const check = useCheckState(stats, 'talent', checkKey)
   return <ModifiedValue base={value} modifier={check.skillPoints} checkTarget={false} sources={check.skillPointSources} />
}
