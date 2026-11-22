import { Utensils } from 'lucide-react'
import { useId, useState } from 'react'
import { QuantityStepper } from '@/components/QuantityStepper'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { equipmentDisplayName } from '@/utils/storePricing'
import type { EquipmentEntry } from './statsApi'

// Using up ordinary consumables (food, light, bandages …): pick how many, then confirm. Effect items use ConsumeDialog.
export function UseItemDialog({ entry, pending, onConfirm, onClose }: {
   entry: EquipmentEntry; pending: boolean; onConfirm: (amount: number) => void; onClose: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const dialogRef = useModalKeyboard(onClose)
   const titleId = useId()
   const [amount, setAmount] = useState(1)
   const name = equipmentDisplayName(entry.item, language)
   const left = entry.amount - amount
   return <div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
      <section ref={dialogRef} className='modal-card use-item-dialog' role='dialog' aria-modal='true' aria-labelledby={titleId}
         onMouseDown={(event) => event.stopPropagation()}>
         <h3 id={titleId}>{t('Use up', language)}: {name}</h3>
         <p>{t('Used items are removed from the inventory.', language)}</p>
         <div className='use-item-amount'>
            <span>{t('Quantity', language)}</span>
            <QuantityStepper value={amount} min={1} max={entry.amount} label={t('Quantity', language)} onChange={setAmount} />
         </div>
         <p className='use-item-left' aria-live='polite'>{t('{count} left afterwards.', language).replace('{count}', String(left))}</p>
         <div className='modal-actions'>
            <button className='quiet-button' type='button' onClick={onClose}>{t('Cancel', language)}</button>
            <button className='primary-button' type='button' disabled={pending} onClick={() => onConfirm(amount)}>
               <Utensils size={15} aria-hidden='true' />{t('Use up', language)}
            </button>
         </div>
      </section>
   </div>
}
