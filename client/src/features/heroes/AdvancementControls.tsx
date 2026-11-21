import { Check, Pencil, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { useAdvancementMode } from './advancement'

export function APToggle({ heroId, disabled = false }: { heroId: string; disabled?: boolean }) {
   const language = useLanguageStore((state) => state.language)
   const { spendAP, setSpendAP } = useAdvancementMode(heroId)
   return <button className='advancement-switch' type='button' role='switch'
      aria-checked={spendAP} aria-label={t('Spend AP', language)} disabled={disabled}
      title={t(spendAP
         ? 'Advancement spends AP. Disable this for corrections or GM-approved free advancement.'
         : 'AP unchanged: set or correct values, or advance for free. No automatic refunds.', language)}
      onClick={() => setSpendAP(!spendAP)}>
      <span>{t('Spend AP', language)}</span>
      <span className='advancement-switch-track' aria-hidden='true'><span /></span>
   </button>
}

export function AdvancementValue({ label, value, minimum = 0, maximum = 25, cost, availableAP, spendAP, pending, onChange }: {
   label: string
   value: number | null
   minimum?: number
   maximum?: number
   cost: number
   availableAP: number
   spendAP: boolean
   pending: boolean
   onChange: (value: number) => void
}) {
   const language = useLanguageStore((state) => state.language)
   const [editing, setEditing] = useState(false)
   const [draft, setDraft] = useState('')
   const next = value === null ? minimum : value + 1
   const capped = next > maximum
   const price = spendAP ? cost : 0
   function save() {
      const target = Number(draft)
      if (draft.trim() === '' || !Number.isInteger(target) || target < minimum || target > maximum) {
         toast.error(t('Enter a whole number from {min} to {max}.', language).replace('{min}', String(minimum)).replace('{max}', String(maximum)))
         return
      }
      onChange(target)
      setEditing(false)
   }
   return <div className='advancement-value'>
      {editing && !spendAP ? <>
         <input type='number' min={minimum} max={maximum} step={1} value={draft} disabled={pending}
            aria-label={`${t('Edit value', language)}: ${label}`} onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
               if (event.key === 'Enter') { event.preventDefault(); save() }
               if (event.key === 'Escape') { event.stopPropagation(); setEditing(false) }
            }} autoFocus />
         <button className='icon-button' type='button' disabled={pending} aria-label={t('Save', language)} onClick={save}><Check size={16} /></button>
         <button className='icon-button' type='button' disabled={pending} aria-label={t('Cancel', language)} onClick={() => setEditing(false)}><X size={16} /></button>
      </> : <>
         <button className='talent-level-up-button' type='button' disabled={pending || capped || (spendAP && cost > availableAP)}
            aria-busy={pending}
            aria-label={`${t('Level up', language)} ${label} (${price} AP)`}
            title={capped ? `${t('Maximum', language)}: ${maximum}` : spendAP && cost > availableAP
               ? t('Not enough AP for this advancement.', language) : `${value ?? '—'} → ${next}: ${price} AP`}
            onClick={() => onChange(next)}><Plus size={16} /></button>
         {!spendAP && <button className='icon-button' type='button' disabled={pending} aria-label={`${t('Edit value', language)}: ${label}`}
            onClick={() => { setDraft(String(value ?? minimum)); setEditing(true) }}><Pencil size={16} /></button>}
         <small>{capped ? t('Maximum', language) : `${price} AP`}</small>
      </>}
   </div>
}
