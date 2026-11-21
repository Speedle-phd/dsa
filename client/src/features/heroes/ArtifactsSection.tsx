import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Gem, Plus, RotateCcw, Search, Trash2, X, Zap } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { addArtifact, artifactAction, artifactsKey, getArtifacts, type Artifact, type ArtifactFields, type ArtifactKind } from './artifactApi'
import { getMagicReference } from './magicApi'
import { analysisQualityCap, type ArtifactRecharge } from './magicRules'
import { ProbeDialog, ProbeStepper } from './ProbeDialog'
import type { Stats } from './statsApi'
import { talentCatalog, type TalentAttribute } from './talentCatalog'
import { TalentProbeDialog } from './TalentProbeDialog'

const kindLabels: Record<ArtifactKind, string> = {
   storage: 'Zauberspeicher', recharging: 'Self-recharging', permanent: 'Permanent effect', weapon: 'Magical weapon',
}
const rechargeLabels: Record<ArtifactRecharge, string> = { month: 'monthly', week: 'weekly', day: 'daily' }
// source: DSA5 Regelwerk, S. 267 (the artifact rolls with attributes of 14 and its stored FP)
const artifactAttributes: Record<TalentAttribute, number> = {
   courage: 14, wisdom: 14, intuition: 14, charisma: 14, dexterity: 14, fingerDexterity: 14, constitution: 14, strength: 14,
}
// source: DSA5 Regelwerk, S. 269–270 (Informationen der Magischen Analyse, artifact column)
const analysisTable = [
   'More or fewer than 10 FP.', 'FP within 3.', 'Kind of artifact.', 'Tradition of the creator.', 'Detailed effect.', 'Side effects.',
]

// Magical artifacts of the hero (S. 266–270): usable by every hero, created in the Arcana tab.
export function ArtifactsSection({ stats }: { stats: Stats }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const key = artifactsKey(stats._id)
   const artifacts = useQuery({ queryKey: key, queryFn: () => getArtifacts(stats._id) })
   const reference = useQuery({ queryKey: ['magic-reference'], queryFn: getMagicReference, staleTime: Infinity })
   const [adding, setAdding] = useState(false)
   const [rolling, setRolling] = useState<Artifact | null>(null)
   const [analysing, setAnalysing] = useState(false)
   const [analysisSpell, setAnalysisSpell] = useState(0)
   const [removing, setRemoving] = useState<string | null>(null)
   const action = useMutation({
      mutationFn: ({ id, kind }: { id: string; kind: 'use' | 'recharge' | 'remove' }) => artifactAction(stats._id, id, kind),
      onSuccess: (next) => queryClient.setQueryData(key, next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const add = useMutation({
      mutationFn: (fields: ArtifactFields) => addArtifact(stats._id, fields),
      onSuccess: (next) => { queryClient.setQueryData(key, next); setAdding(false) },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const analytiker = stats.generalSpecialAbilities.includes('Analytiker')
   const cap = analysisQualityCap(analytiker, analysisSpell)
   const magiekunde = talentCatalog.find((talent) => talent.key === 'magiekunde')!

   async function activate(artifact: Artifact) {
      if (artifact.kind === 'storage' || artifact.kind === 'recharging') {
         try { await action.mutateAsync({ id: artifact._id, kind: 'use' }) } catch { return }
      }
      setRolling(artifact)
   }

   const list = artifacts.data ?? []
   return <section className='overview-section artifacts-section'>
      <header className='section-heading'>
         <Gem size={19} />
         <div><p className='eyebrow'>{t('Arcana', language)}</p><h2>{t('Magical artifacts', language)}</h2></div>
         <button className='quiet-button section-action' type='button' onClick={() => setAdding(true)}><Plus size={16} />{t('Add found artifact', language)}</button>
      </header>
      <p className='combat-note'>{t('Activating takes a free action; the artifact rolls its stored spell with attributes 14 and its stored FP, and the effect starts next KR (S. 267).', language)}</p>
      {artifacts.isError && <p className='field-error'>{getErrorMessage(artifacts.error)}</p>}
      {list.length ? <ul className='artifact-list'>{list.map((artifact) => {
         const charged = artifact.kind === 'storage' || artifact.kind === 'recharging'
         return <li key={artifact._id} className='artifact-card'>
            <header>
               <Gem size={18} aria-hidden='true' />
               <div><strong>{artifact.name}</strong>
                  <small>{t(kindLabels[artifact.kind], language)}{artifact.recharge && ` · ${t(rechargeLabels[artifact.recharge], language)}`}
                     {artifact.item && ` · ${artifact.item}`}</small></div>
               <button className='icon-button danger-icon' type='button' aria-label={`${t('Remove', language)}: ${artifact.name}`} disabled={action.isPending}
                  onClick={() => setRemoving(artifact._id)}><Trash2 size={15} /></button>
            </header>
            {removing === artifact._id && <div className='fight-confirm' role='alertdialog' aria-label={t('Remove', language)}>
               <p>{t('Remove this artifact?', language)}</p>
               <button className='quiet-button' type='button' onClick={() => setRemoving(null)}>{t('Cancel', language)}</button>
               <button className='primary-button' type='button' disabled={action.isPending}
                  onClick={() => { action.mutate({ id: artifact._id, kind: 'remove' }); setRemoving(null) }}>{t('Remove', language)}</button>
            </div>}
            <dl className='arcana-fact-grid'>
               {artifact.spell && <div><dt>{t('Spell', language)}</dt><dd lang='de'>{artifact.spell}</dd></div>}
               {artifact.kind !== 'weapon' && <div><dt>{t('FP', language)}</dt><dd>{artifact.skillPoints}</dd></div>}
               {charged && <div><dt>{t('Charges', language)}</dt><dd>{artifact.charges.current} / {artifact.charges.max}</dd></div>}
               {artifact.duration && <div><dt>{t('Duration', language)}</dt><dd>{artifact.duration}</dd></div>}
               {artifact.trigger && <div><dt>{t('Trigger', language)}</dt><dd>{artifact.trigger}</dd></div>}
               {artifact.permanentAsp > 0 && <div><dt>{t('Permanent AsP', language)}</dt><dd>{artifact.permanentAsp}</dd></div>}
            </dl>
            {artifact.sideEffect && <p className='arcana-warning' lang='de'>{artifact.sideEffect}</p>}
            {artifact.notes && <p className='spell-card-note'>{artifact.notes}</p>}
            {artifact.item && !stats.equipment.some((item) => item.item === artifact.item && item.amount > 0) &&
               <p className='field-error'>{t('The linked object is no longer in the inventory.', language)}</p>}
            <div className='probe-asp-actions'>
               {artifact.kind !== 'weapon' && <button className='primary-button' type='button' disabled={action.isPending || (charged && artifact.charges.current < 1)}
                  onClick={() => void activate(artifact)}><Zap size={15} />{t('Activate', language)}</button>}
               {artifact.kind === 'recharging' && artifact.charges.current < artifact.charges.max && <button className='quiet-button' type='button'
                  disabled={action.isPending} onClick={() => action.mutate({ id: artifact._id, kind: 'recharge' })}><RotateCcw size={15} />{t('Recharged', language)}</button>}
               {artifact.kind === 'weapon' && <small>{t('Counts as a magical weapon while its magic lasts (S. 268).', language)}</small>}
            </div>
         </li>
      })}</ul> : <p className='combat-empty'>{t('No magical artifacts.', language)}</p>}

      <details className='arcana-disclosure'>
         <summary>{t('Magical analysis', language)} <small>{t('S.', language)} 269</small></summary>
         <p className='combat-note'>{t('Magiekunde check. Without Analytiker or a Hellsicht spell no QS can be gained; Analytiker allows 1 more, a spell such as ANALYS allows its QS.', language)}</p>
         <div className='probe-asp-actions'>
            <span>{t('QS of ANALYS or another Hellsicht spell', language)}</span>
            <ProbeStepper value={analysisSpell} min={0} max={6} label={t('QS of ANALYS or another Hellsicht spell', language)}
               lowerLabel={t('Less', language)} raiseLabel={t('More', language)} onChange={setAnalysisSpell} />
            <button className='quiet-button' type='button' disabled={cap < 1 || (stats.talents.find((entry) => entry.key === 'magiekunde')?.value ?? null) === null}
               onClick={() => setAnalysing(true)}><Search size={15} />{t('Analyse (max. QS {cap})', language).replace('{cap}', String(cap))}</button>
         </div>
         <ol className='artifact-analysis'>{analysisTable.map((line, index) => <li key={line}>QS {index + 1}: {t(line, language)}</li>)}</ol>
      </details>

      {rolling && <ProbeDialog stats={stats} eyebrow='Artifact' title={`${rolling.name}${rolling.spell ? ` · ${rolling.spell}` : ''}`}
         probe={reference.data?.spells.find((spell) => spell.key === rolling.spell)?.probe ?? ['courage', 'wisdom', 'intuition']}
         attributes={artifactAttributes} value={rolling.skillPoints} fate={false} onClose={() => setRolling(null)}
         renderResult={() => <p className='probe-talent-notes'>{t('The effect starts at the beginning of the next combat round (S. 267).', language)}</p>} />}
      {analysing && <TalentProbeDialog stats={stats} talent={magiekunde} value={stats.talents.find((entry) => entry.key === 'magiekunde')?.value ?? 0}
         onClose={() => setAnalysing(false)}
         renderResult={({ result, quality }) => result.success && quality ? <p className='probe-asp-spent'>
            {t('Usable QS: {qs}', language).replace('{qs}', String(Math.min(quality, cap)))} · {t(analysisTable[Math.min(quality, cap) - 1], language)}</p> : null} />}
      {adding && <AddArtifactDialog pending={add.isPending} stats={stats} spells={reference.data?.spells.map((spell) => spell.key) ?? []}
         onSave={(fields) => add.mutate(fields)} onClose={() => setAdding(false)} />}
   </section>
}

function AddArtifactDialog({ stats, spells, pending, onSave, onClose }: {
   stats: Stats; spells: string[]; pending: boolean; onSave: (fields: ArtifactFields) => void; onClose: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const titleId = useId()
   const dialogRef = useModalKeyboard(onClose)
   const [fields, setFields] = useState<ArtifactFields>({ name: '', item: null, kind: 'storage', spell: '', skillPoints: 7, duration: '', charges: 1,
      recharge: null, trigger: '', sideEffect: '', notes: '' })
   const set = (values: Partial<ArtifactFields>) => setFields({ ...fields, ...values })
   const items = [...new Set(stats.equipment.filter((item) => item.amount > 0).map((item) => item.item))]
   function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      if (!fields.name.trim()) return
      onSave({ ...fields, recharge: fields.kind === 'recharging' ? fields.recharge ?? 'week' : null })
   }
   return createPortal(<div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
      <section ref={dialogRef} className='hero-editor' lang={language} role='dialog' aria-modal='true' aria-labelledby={titleId}
         onMouseDown={(event) => event.stopPropagation()}>
         <header className='editor-header'><div><p className='eyebrow'>{t('Magical artifacts', language)}</p><h2 id={titleId}>{t('Add found artifact', language)}</h2></div>
            <button className='icon-button editor-close' type='button' onClick={onClose} aria-label={t('Close', language)}><X size={20} /></button></header>
         <form className='hero-form' onSubmit={submit}>
            <label className='field-group'><span>{t('Name', language)}</span>
               <input required maxLength={120} autoFocus value={fields.name} onChange={(event) => set({ name: event.target.value })} /></label>
            <label className='field-group'><span>{t('Object (inventory item)', language)}</span>
               <select value={fields.item ?? ''} onChange={(event) => set({ item: event.target.value || null })}>
                  <option value=''>{t('Not linked', language)}</option>
                  {items.map((name) => <option key={name} value={name}>{name}</option>)}
               </select></label>
            <label className='field-group'><span>{t('Kind', language)}</span>
               <select value={fields.kind} onChange={(event) => set({ kind: event.target.value as ArtifactKind })}>
                  {(Object.keys(kindLabels) as ArtifactKind[]).map((kind) => <option key={kind} value={kind}>{t(kindLabels[kind], language)}</option>)}
               </select></label>
            {fields.kind === 'recharging' && <label className='field-group'><span>{t('Recharges', language)}</span>
               <select value={fields.recharge ?? 'week'} onChange={(event) => set({ recharge: event.target.value as ArtifactRecharge })}>
                  {(Object.keys(rechargeLabels) as ArtifactRecharge[]).map((value) => <option key={value} value={value}>{t(rechargeLabels[value], language)}</option>)}
               </select></label>}
            {fields.kind !== 'weapon' && <>
               <label className='field-group'><span>{t('Stored spell', language)}</span>
                  <input list='artifact-spells' maxLength={120} value={fields.spell} onChange={(event) => set({ spell: event.target.value })} />
                  <datalist id='artifact-spells'>{spells.map((spell) => <option key={spell} value={spell} />)}</datalist></label>
               <div className='field-group'><span>{t('Stored FP', language)}</span>
                  <ProbeStepper value={fields.skillPoints} min={0} max={40} label={t('Stored FP', language)} lowerLabel={t('Less', language)}
                     raiseLabel={t('More', language)} onChange={(skillPoints) => set({ skillPoints })} /></div>
            </>}
            {fields.kind === 'storage' && <div className='field-group'><span>{t('Charges', language)}</span>
               <ProbeStepper value={fields.charges} min={1} max={7} label={t('Charges', language)} lowerLabel={t('Less', language)}
                  raiseLabel={t('More', language)} onChange={(charges) => set({ charges })} /></div>}
            <label className='field-group'><span>{t('Duration of each effect', language)}</span>
               <input maxLength={120} value={fields.duration} onChange={(event) => set({ duration: event.target.value })} /></label>
            <label className='field-group'><span>{t('Trigger (key word or gesture)', language)}</span>
               <input maxLength={200} value={fields.trigger} onChange={(event) => set({ trigger: event.target.value })} /></label>
            <label className='field-group'><span>{t('Notes', language)}</span>
               <textarea maxLength={2000} rows={3} value={fields.notes} onChange={(event) => set({ notes: event.target.value })} /></label>
            <footer className='editor-actions'>
               <button className='quiet-button' type='button' onClick={onClose}>{t('Cancel', language)}</button>
               <button className='primary-button' type='submit' disabled={pending || !fields.name.trim()}><Plus size={16} />{t('Add entry', language)}</button>
            </footer>
         </form>
      </section>
   </div>, document.body)
}
