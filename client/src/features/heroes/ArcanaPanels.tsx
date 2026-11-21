import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Broom, Check, Dices, Gem, Hammer, Info, Power, Wand } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { throwColoredDice } from '@/components/diceEngine'
import { Tooltip } from '@/components/Tooltip'
import { useLanguageStore } from '@/locales/languageStore'
import { t, translateRuleLabel } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { useAdvancementMode } from './advancement'
import { artifactsKey, createArtifact } from './artifactApi'
import { updateMagic, useManaSpend, type MagicAction, type MagicReference } from './magicApi'
import { arcanoviPlan, artifactPrice, sideEffectFor, staffActivationCost, staffFoci, staffVolume, type ArtifactRecharge } from './magicRules'
import { ProbeStepper, type ProbeResultState } from './ProbeDialog'
import { SpellProbeDialog } from './SpellProbeDialog'
import type { Stats } from './statsApi'

export function Source({ page }: { page: number | string }) {
   const language = useLanguageStore((state) => state.language)
   return <Tooltip content={`${t('DSA5 Rulebook', language)}, ${t('S.', language)} ${page}`} clickToToggle className='tooltip-icon-wrapper' lang={language}>
      <Info size={15} aria-label={t('Rule source', language)} />
   </Tooltip>
}

function useMagicSave(stats: Stats) {
   const queryClient = useQueryClient()
   return useMutation({
      mutationFn: (action: MagicAction) => updateMagic(stats._id, action),
      onSuccess: (next) => queryClient.setQueryData(['stats', stats.charId], next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
}

// source: DSA5 Regelwerk, S. 251, 262, 352 (permanently spent AsP lower the maximum; buy back for 2 AP each)
export function PermanentMana({ stats }: { stats: Stats }) {
   const language = useLanguageStore((state) => state.language)
   const { spendAP } = useAdvancementMode(stats.charId)
   const save = useMagicSave(stats)
   const [amount, setAmount] = useState(1)
   const loss = stats.mana.permanentLoss ?? 0
   const bought = stats.mana.permanentBuyback ?? 0
   const open = Math.max(0, loss - bought)
   const available = stats.experience.total - stats.experience.spent
   const run = (mode: 'lose' | 'buy-back' | 'correct') => save.mutate({ action: 'permanent-mana', mode, amount, spendAP })
   return <div className='arcana-permanent'>
      <p><strong>{t('Permanent AsP', language)}</strong> <Source page='262, 352' />: {t('spent {loss}, bought back {bought}, open {open}', language)
         .replace('{loss}', String(loss)).replace('{bought}', String(bought)).replace('{open}', String(open))}</p>
      <div className='probe-asp-actions'>
         <ProbeStepper value={amount} min={1} max={50} label={t('Permanent AsP', language)} lowerLabel={t('Less', language)}
            raiseLabel={t('More', language)} onChange={setAmount} />
         <button className='quiet-button' type='button' disabled={save.isPending} onClick={() => run('lose')}>{t('Record permanent loss', language)}</button>
         <button className='quiet-button' type='button' disabled={save.isPending || amount > open || (spendAP && amount * 2 > available)}
            onClick={() => run('buy-back')}>{t('Buy back', language)} · {spendAP ? amount * 2 : 0} AP</button>
         <button className='quiet-button' type='button' disabled={save.isPending || amount > open} onClick={() => run('correct')}>{t('Correct a mistaken loss', language)}</button>
      </div>
   </div>
}

// source: DSA5 Regelwerk, S. 275–278 (Magierstab: volume 18, one active staff spell besides the foci, 1 action to activate)
export function StaffPanel({ stats, reference }: { stats: Stats; reference: MagicReference }) {
   const language = useLanguageStore((state) => state.language)
   const save = useMagicSave(stats)
   const spend = useManaSpend(stats)
   const owned = stats.generalSpecialAbilities
   const bound = owned.includes('Bindung des Stabes')
   const volume = staffVolume(owned, reference.staff.volumes)
   const foci = staffFoci(stats)
   const active = stats.magicSettings.staffActive
   const items = [...new Set(stats.equipment.filter((item) => item.amount > 0).map((item) => item.item))]
   const spells = reference.staff.activatable.filter((key) => owned.includes(key))
   const settings = (values: Omit<Extract<MagicAction, { action: 'magic-settings' }>, 'action'>) => save.mutate({ action: 'magic-settings', ...values })
   async function activate(key: string) {
      const cost = staffActivationCost[key] ?? 0
      if (cost) await spend.mutateAsync(cost).catch(() => undefined)
      settings({ staffActive: key })
   }
   if (!bound) return <p className='combat-note'>{t('Learn Bindung des Stabes first: it binds the staff (2 permanent AsP) and carries all other staff spells.', language)} <Source page={276} /></p>
   return <div className='arcana-staff'>
      <div className='arcana-staff-head'>
         <label className='field-group'><span>{t('Staff (inventory item)', language)}</span>
            <select value={stats.magicSettings.staffItem ?? ''} disabled={save.isPending} onChange={(event) => settings({ staffItem: event.target.value || null })}>
               <option value=''>{t('Not linked', language)}</option>
               {items.map((name) => <option key={name} value={name}>{name}</option>)}
            </select></label>
         <label className='probe-check-row'><input type='checkbox' checked={stats.magicSettings.staffInHand} disabled={save.isPending}
            onChange={(event) => settings({ staffInHand: event.target.checked })} />{t('Staff in hand', language)}</label>
         <div className='arcana-volume' role='meter' aria-valuemin={0} aria-valuemax={reference.staff.capacity} aria-valuenow={volume}
            aria-label={t('Staff volume', language)}>
            <span>{t('Volume', language)} {volume} / {reference.staff.capacity}</span>
            <div className='resource-track'><span style={{ width: `${Math.min(100, volume / reference.staff.capacity * 100)}%` }} /></div>
         </div>
      </div>
      {stats.magicSettings.staffItem && !items.includes(stats.magicSettings.staffItem) &&
         <p className='field-error'>{t('The linked staff is no longer in the inventory.', language)}</p>}
      <p className='combat-note'>{foci.powerFocus || foci.properties.length
         ? [foci.powerFocus && t('Kraftfokus: spells cost 1 AsP less (at least 1).', language),
            foci.properties.length && `${t('Merkmalsfokus', language)}: ${foci.properties.join(', ')} +1`].filter(Boolean).join(' · ')
         : owned.some((name) => name === 'Kraftfokus' || name.startsWith('Merkmalsfokus'))
            ? t('Foci work only while the untransformed staff is in your hand (S. 277).', language)
            : t('No focus on the staff.', language)}</p>
      {spells.length > 0 && <ul className='arcana-staff-spells'>
         {spells.map((key) => <li key={key} className={active === key ? 'is-active' : ''}>
            <span lang='de'>{translateRuleLabel(key, language)}</span>
            <small>{staffActivationCost[key] ? `${staffActivationCost[key]} AsP` : ''}{key === 'Flammenschwert' && ` + 1 / 2 AsP ${t('per KR', language)}`}</small>
            {active === key
               ? <button className='quiet-button' type='button' disabled={save.isPending} onClick={() => settings({ staffActive: null })}>{t('End (free action)', language)}</button>
               : <button className='quiet-button' type='button' disabled={save.isPending || spend.isPending || active !== null ||
                  (staffActivationCost[key] ?? 0) > stats.mana.current} onClick={() => void activate(key)}><Power size={15} />{t('Activate (1 action)', language)}</button>}
         </li>)}
      </ul>}
      {active && <p className='combat-note'>{t('Only one staff spell at a time; end it before activating another (S. 276).', language)}
         {active === 'Flammenschwert' && ` ${t('The Flammenschwert is available as a weapon in the fight panel.', language)}`}</p>}
   </div>
}

// source: DSA5 Regelwerk, S. 281 (Flugsalbe: one anointed wooden object for a year; start 1 AsP; 50 Meilen/h; 25 Stein)
export function FlyingDevicePanel({ stats }: { stats: Stats }) {
   const language = useLanguageStore((state) => state.language)
   const save = useMagicSave(stats)
   const spend = useManaSpend(stats)
   const items = [...new Set(stats.equipment.filter((item) => item.amount > 0).map((item) => item.item))]
   const device = stats.magicSettings.flyingDevice
   if (!stats.generalSpecialAbilities.includes('Flugsalbe')) return <p className='combat-note'>{t('Learn Flugsalbe to anoint a wooden flying device.', language)} <Source page={281} /></p>
   return <div className='arcana-staff'>
      <label className='field-group'><span className='label-with-icon'><Broom size={15} aria-hidden='true' />{t('Flying device (wooden inventory item)', language)}</span>
         <select value={device ?? ''} disabled={save.isPending} onChange={(event) => save.mutate({ action: 'magic-settings', flyingDevice: event.target.value || null })}>
            <option value=''>{t('Not anointed', language)}</option>
            {items.map((name) => <option key={name} value={name}>{name}</option>)}
         </select></label>
      {device && !items.includes(device) && <p className='field-error'>{t('The flying device is lost; a new one can only be anointed at the next Hexenfest.', language)}</p>}
      <p className='combat-note'>{t('Up to 50 Meilen/h and 25 Stein besides the witch. Fliegen checks only for fast flights, unusual manoeuvres and fights. Only the anointing witch can fly it; the salve lasts a year.', language)}</p>
      <button className='quiet-button' type='button' disabled={!device || spend.isPending || stats.mana.current < 1} onClick={() => spend.mutate(1)}>
         <Gem size={15} />{t('Take off (1 AsP)', language)}</button>
   </div>
}

type Step = 'setup' | 'arcanovi' | 'spell' | 'done'
// source: DSA5 Regelwerk, S. 267–269 (ARCANOVI: Zauberspeicher or self-recharging artifact)
export function ArcanoviPanel({ stats, reference }: { stats: Stats; reference: MagicReference }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const own = stats.spells.filter((entry) => reference.spells.some((spell) => spell.key === entry.key && spell.kind === 'Zauberspruch'))
   const arcanovi = reference.spells.find((spell) => spell.key === 'Arcanovi')
   const arcanoviValue = stats.spells.find((entry) => entry.key === 'Arcanovi')?.value ?? 0
   const [form, setForm] = useState({ name: '', item: '', spell: own[0]?.key ?? '', spellCost: 8, charges: 1, recharge: '' as '' | ArtifactRecharge,
      iron: false, material: 'none' as 'none' | 'save' | 'bonus', materialSaved: 0, duration: '', trigger: '' })
   const [step, setStep] = useState<Step>('setup')
   const [arcanoviResult, setArcanoviResult] = useState<{ quality: number; skillPoints: number } | null>(null)
   const [sideEffect, setSideEffect] = useState('')
   const spell = reference.spells.find((entry) => entry.key === form.spell)
   const plan = arcanoviPlan({ spellCost: form.spellCost, charges: form.recharge ? 1 : form.charges, recharge: form.recharge || null, iron: form.iron,
      materialSaved: form.material === 'save' ? form.materialSaved : 0, materialBonus: form.material === 'bonus' })
   const create = useMutation({
      mutationFn: (skillPoints: number) => createArtifact(stats._id, {
         name: form.name.trim() || `${form.spell}-Artefakt`, item: form.item || null, spell: form.spell, spellCost: form.spellCost, skillPoints,
         duration: form.duration, charges: form.recharge ? 1 : form.charges, recharge: form.recharge || null, iron: form.iron,
         materialSaved: form.material === 'save' ? form.materialSaved : 0, materialBonus: form.material === 'bonus', trigger: form.trigger, sideEffect,
      }),
      onSuccess: ({ stats: next, artifacts }) => {
         queryClient.setQueryData(['stats', stats.charId], next)
         queryClient.setQueryData(artifactsKey(stats._id), artifacts)
         setStep('done')
         toast.success(t('Artifact created. It is listed on the Equipment tab.', language))
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const set = (values: Partial<typeof form>) => setForm({ ...form, ...values })
   const items = [...new Set(stats.equipment.filter((item) => item.amount > 0).map((item) => item.item))]
   const quality = arcanoviResult?.quality ?? 0
   function arcanoviDone({ result, quality: qs }: ProbeResultState) {
      return result.success && qs ? <button className='primary-button' type='button' onClick={() => {
         setArcanoviResult({ quality: qs, skillPoints: Math.max(0, result.skillPoints) }); setStep('spell')
      }}><Check size={16} />{t('Continue with the stored spell', language)}</button> : <p className='field-error'>{t('The enchantment failed; no permanent AsP are lost (S. 267).', language)}</p>
   }
   function spellDone({ result, quality: qs }: ProbeResultState) {
      return result.success && qs ? <button className='primary-button' type='button' disabled={create.isPending} onClick={() => create.mutate(Math.max(0, result.skillPoints))}>
         <Wand size={16} />{t('Create the artifact ({asp} AsP, {permanent} permanent)', language).replace('{asp}', String(plan.asp)).replace('{permanent}', String(plan.permanent))}
      </button> : <p className='field-error'>{t('The enchantment failed; no permanent AsP are lost (S. 267).', language)}</p>
   }
   if (!arcanovi) return null
   return <div className='arcana-workshop'>
      <div className='arcana-workshop-grid'>
         <label className='field-group'><span>{t('Name', language)}</span><input value={form.name} maxLength={120} onChange={(event) => set({ name: event.target.value })} /></label>
         <label className='field-group'><span>{t('Object (inventory item)', language)}</span>
            <select value={form.item} onChange={(event) => set({ item: event.target.value })}>
               <option value=''>{t('Not linked', language)}</option>
               {items.map((name) => <option key={name} value={name}>{name}</option>)}
            </select></label>
         <label className='field-group'><span>{t('Stored spell', language)}</span>
            <select value={form.spell} onChange={(event) => set({ spell: event.target.value })}>
               {own.map((entry) => <option key={entry.key} value={entry.key}>{entry.key} (FW {entry.value})</option>)}
            </select></label>
         <label className='field-group'><span>{t('AsP of the spell per charge', language)} {spell && <small>({spell.cost})</small>}</span>
            <input type='number' min={1} max={200} value={form.spellCost} onChange={(event) => set({ spellCost: Math.max(1, Math.trunc(event.target.valueAsNumber) || 1) })} /></label>
         <label className='field-group'><span>{t('Kind', language)}</span>
            <select value={form.recharge} onChange={(event) => set({ recharge: event.target.value as typeof form.recharge })}>
               <option value=''>{t('Zauberspeicher (charges)', language)}</option>
               <option value='month'>{t('Recharges monthly', language)}</option>
               <option value='week'>{t('Recharges weekly', language)}</option>
               <option value='day'>{t('Recharges daily', language)}</option>
            </select></label>
         {!form.recharge && <div className='field-group'><span>{t('Charges', language)}</span>
            <ProbeStepper value={form.charges} min={1} max={7} label={t('Charges', language)} lowerLabel={t('Less', language)} raiseLabel={t('More', language)}
               onChange={(charges) => set({ charges })} /></div>}
         <label className='field-group'><span>{t('Duration of each effect', language)}</span><input value={form.duration} maxLength={120} onChange={(event) => set({ duration: event.target.value })} /></label>
         <label className='field-group'><span>{t('Trigger (key word or gesture)', language)}</span><input value={form.trigger} maxLength={200} onChange={(event) => set({ trigger: event.target.value })} /></label>
      </div>
      <div className='probe-check-row'>
         <label><input type='checkbox' checked={form.iron} onChange={(event) => set({ iron: event.target.checked })} />{t('At least half iron or steel (ARCANOVI −2)', language)}</label>
         <select value={form.material} onChange={(event) => set({ material: event.target.value as typeof form.material, materialSaved: 0 })} aria-label={t('Material', language)}>
            <option value='none'>{t('No special material', language)}</option>
            <option value='save'>{t('Material saves permanent AsP (100 S each)', language)}</option>
            <option value='bonus'>{t('Material eases the ARCANOVI (+1)', language)}</option>
         </select>
         {form.material === 'save' && <ProbeStepper value={form.materialSaved} min={0} max={plan.saveable} label={t('Saved permanent AsP', language)}
            lowerLabel={t('Less', language)} raiseLabel={t('More', language)} onChange={(materialSaved) => set({ materialSaved })} />}
         <small>{t('S.', language)} 268</small>
      </div>
      <dl className='arcana-fact-grid'>
         <div><dt>ARCANOVI</dt><dd>{plan.arcanoviModifier > 0 ? '+' : ''}{plan.arcanoviModifier}</dd></div>
         <div><dt>{t('Stored spell', language)}</dt><dd>{plan.spellModifier}</dd></div>
         <div><dt>{t('AsP', language)}</dt><dd>{plan.asp} {plan.asp > stats.mana.current && <small className='field-error'>{t('Not enough AsP.', language)}</small>}</dd></div>
         <div><dt>{t('Permanent AsP', language)}</dt><dd>{plan.permanent}{plan.materialSilver ? ` (−${form.materialSaved}, ${plan.materialSilver} S)` : ''}</dd></div>
         {spell && <div><dt>{t('Price estimate', language)}</dt><dd>{artifactPrice(plan.asp, plan.permanent, spell.stfClass, 3)} S <small>({t('QS 3, without the object', language)})</small></dd></div>}
      </dl>
      <p className='combat-note'>{t('Roll the ARCANOVI first, then the stored spell. Both must succeed; then the AsP and permanent AsP are paid. One permanent AsP per 10 AsP (S. 267).', language)}</p>
      {step === 'done' ? <p className='probe-asp-spent'><Check size={16} />{t('Artifact created. It is listed on the Equipment tab.', language)}</p>
         : <button className='primary-button' type='button' disabled={!spell || plan.asp > stats.mana.current} onClick={() => { setArcanoviResult(null); setSideEffect(''); setStep('arcanovi') }}>
            <Hammer size={16} />{t('Start the ARCANOVI', language)}</button>}
      {arcanoviResult && quality <= 1 && step !== 'setup' && <div className='probe-asp'>
         <p>{t('ARCANOVI with QS 1: the GM rolls for side effects (1W20 + FP, S. 268).', language)}</p>
         {sideEffect ? <p lang='de'>{sideEffect}</p> : <button className='quiet-button' type='button'
            onClick={() => void throwColoredDice(20, ['#7c3aed']).then(([roll]) => setSideEffect(`${roll + arcanoviResult.skillPoints}: ${sideEffectFor(roll + arcanoviResult.skillPoints).de}`))}>
            <Dices size={16} />{t('Roll side effects', language)}</button>}
      </div>}
      {step === 'arcanovi' && <SpellProbeDialog stats={stats} spell={arcanovi} reference={reference} value={arcanoviValue} costMode='failure'
         extraSources={plan.arcanoviModifier ? [{ label: 'Artifact (ARCANOVI)', value: plan.arcanoviModifier }] : []}
         renderAfter={arcanoviDone} onClose={() => setStep((current) => current === 'arcanovi' ? 'setup' : current)} />}
      {step === 'spell' && spell && <SpellProbeDialog stats={stats} spell={spell} reference={reference}
         value={stats.spells.find((entry) => entry.key === spell.key)?.value ?? 0} costMode='failure'
         extraSources={plan.spellModifier ? [{ label: 'Artifact charges', value: plan.spellModifier }] : []}
         renderAfter={spellDone} onClose={() => setStep((current) => current === 'spell' ? 'setup' : current)} />}
   </div>
}
