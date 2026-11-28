import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Timer, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { formatAventurianDate } from '@/features/books/aventurianCalendar'
import type { EquipmentEntry, Stats } from '@/features/heroes/statsApi'
import { talentCatalog } from '@/features/heroes/talentCatalog'
import { TalentProbeDialog } from '@/features/heroes/TalentProbeDialog'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { preserveHerb, type PreserveInput } from './herbApi'
import { durationLabel, type ShelfLifeTables } from './shelfLifeRules'

const plantKnowledge = talentCatalog.find((talent) => talent.key === 'pflanzenkunde')

// Haltbarmachung of a whole stack of raw plants (AdK S. 284–286): by a Pflanzenkunde check (Fokusregel I: 1 month + 1 per
// QS, 5 Kreuzer material per application), or by plant part and method without a check (Fokusregel II; the player
// picks the part: user decision, Nov 2026)
export function PreserveHerbDialog({ stats, entry, index, today, partsAllowed, tables, onClose }: {
   stats: Stats; entry: EquipmentEntry; index: number; today: number; partsAllowed: boolean; tables: ShelfLifeTables; onClose: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const titleId = useId()
   const dialogRef = useModalKeyboard(onClose)
   const [way, setWay] = useState<'check' | 'part'>('check')
   const [rolling, setRolling] = useState(false)
   const [partKey, setPartKey] = useState(tables.plantParts[0].key)
   const part = tables.plantParts.find((entryPart) => entryPart.key === partKey) ?? tables.plantParts[0]
   const [methodKey, setMethodKey] = useState(part.methods[0].key)
   const method = part.methods.find((entryMethod) => entryMethod.key === methodKey) ?? part.methods[0]
   const checkResult = useRef<{ success: boolean; quality: number; critical: boolean } | null>(null)
   const cost = tables.preserveCostKreuzer * entry.amount
   const mutation = useMutation({
      mutationFn: (input: PreserveInput) => preserveHerb(stats._id, input),
      onSuccess: (result) => {
         queryClient.setQueryData(['stats', stats.charId], result.stats)
         toast.success(result.preserved
            ? t('Preserved: keeps until {date}.', language).replace('{date}', result.keepsUntilDay === null ? durationLabel(null, language) : formatAventurianDate(result.keepsUntilDay, language))
            : t('The check failed: the plants stay raw, the material is used up.', language))
         onClose()
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   function start() {
      if (way === 'part') { mutation.mutate({ method: 'part', index, item: entry.item, part: part.key, methodKey: method.key }); return }
      checkResult.current = null
      setRolling(true)
   }

   if (rolling && plantKnowledge) return <TalentProbeDialog stats={stats} talent={plantKnowledge} value={stats.talents.find((talent) => talent.key === 'pflanzenkunde')?.value ?? 0}
      renderResult={({ result, quality }) => {
         checkResult.current = { success: result.success, quality: result.success ? quality ?? 0 : 0, critical: result.outcome === 'critical' || result.outcome === 'spectacular' }
         return null
      }}
      onClose={() => {
         setRolling(false)
         const done = checkResult.current
         if (done) mutation.mutate({ method: 'check', index, item: entry.item, check: done })
      }} />

   return createPortal(
      <div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
         <section ref={dialogRef} className='hero-editor herb-search-dialog' lang={language} role='dialog' aria-modal='true' aria-labelledby={titleId}
            onMouseDown={(event) => event.stopPropagation()}>
            <header className='editor-header'>
               <div><p className='eyebrow'>Archiv der Kräuter · AdK S. 284–286</p><h2 id={titleId}>{t('Preserve', language)}: <span lang='de'>{entry.item}</span></h2></div>
               <button className='icon-button editor-close' type='button' onClick={onClose} aria-label={t('Close', language)}><X size={20} /></button>
            </header>
            <div className='store-purchase-body'>
               {partsAllowed && <div className='probe-segmented' role='group' aria-label={t('How to preserve', language)}>
                  <button type='button' aria-pressed={way === 'check'} className={way === 'check' ? 'is-active' : ''} onClick={() => setWay('check')}>{t('With a Pflanzenkunde check', language)}</button>
                  <button type='button' aria-pressed={way === 'part'} className={way === 'part' ? 'is-active' : ''} onClick={() => setWay('part')}>{t('By plant part', language)}</button>
               </div>}
               {way === 'check' ? <>
                  <p>{t('One Pflanzenkunde check preserves all {amount} applications: 1 month plus 1 month per QS (a critical success doubles it). Material: {cost} Kreuzer, used up also on a failure.', language)
                     .replace('{amount}', String(entry.amount)).replace('{cost}', String(cost))}</p>
               </> : <>
                  <p>{t('Choose the part you keep and the method. Each application takes 5 minutes; no check. Some methods need a vessel, oil, vinegar or alcohol (GM).', language)}</p>
                  <div className='herb-search-fields herb-preserve-fields'>
                     <label className='field-group'><span>{t('Plant part', language)}</span>
                        <select value={part.key} onChange={(event) => { const next = tables.plantParts.find((p) => p.key === event.target.value); setPartKey(event.target.value); setMethodKey(next?.methods[0].key ?? '') }}>
                           {tables.plantParts.map((entryPart) => <option key={entryPart.key} value={entryPart.key}>{t(entryPart.label, language)} ({t('raw', language)} {durationLabel(entryPart.rawDays, language)})</option>)}
                        </select></label>
                     <label className='field-group'><span>{t('Method', language)}</span>
                        <select value={method.key} onChange={(event) => setMethodKey(event.target.value)}>
                           {part.methods.map((entryMethod) => <option key={entryMethod.key} value={entryMethod.key}>{t(entryMethod.label, language)} · {durationLabel(entryMethod.days, language)}</option>)}
                        </select></label>
                  </div>
                  <p className='herb-search-sum'>{t('Keeps until', language)} <strong>{method.days === null ? durationLabel(null, language) : formatAventurianDate(today + method.days, language)}</strong>
                     {part.note ? ` · ${t(part.note, language)}` : ''}</p>
               </>}
               <footer className='store-purchase-footer'>
                  <span className='combat-note'>{entry.amount} × <span lang='de'>{entry.item}</span></span>
                  <div className='modal-actions'>
                     <button type='button' className='quiet-button' onClick={onClose}>{t('Cancel', language)}</button>
                     <button type='button' className='primary-button' disabled={mutation.isPending}
                        onClick={start}>
                        <Timer size={16} aria-hidden='true' />{t(way === 'check' ? 'Roll Pflanzenkunde' : 'Preserve', language)}</button>
                  </div>
               </footer>
            </div>
         </section>
      </div>,
      document.body,
   )
}
