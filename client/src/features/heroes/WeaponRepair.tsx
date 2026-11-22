import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Coins, Hammer, Wrench, X } from 'lucide-react'
import { useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { repairWeapon, type RepairPayment } from './combatApi'
import type { EquipmentEntry, Stats } from './statsApi'
import { talentCatalog } from './talentCatalog'
import { TalentProbeDialog } from './TalentProbeDialog'

const coinKeys = ['dukaten', 'silbertaler', 'heller', 'kreuzer'] as const
const coinLabels = { dukaten: 'Dukaten', silbertaler: 'Silbertaler', heller: 'Heller', kreuzer: 'Kreuzer' }
const crafts = ['metallbearbeitung', 'holzbearbeitung', 'lederbearbeitung'] as const

// Craft talent suggested for the material; the GM may choose another one.
function suggestedCraft(item: string) {
   if (/Lederschild/.test(item)) return 'lederbearbeitung'
   if (/Holzschild|bogen|Stab|stab|Keule|Knüppel|Speer|Thorwalerschild|Großschild/.test(item)) return 'holzbearbeitung'
   return 'metallbearbeitung'
}

export function ConditionBadge({ condition }: { condition: EquipmentEntry['condition'] }) {
   const language = useLanguageStore((state) => state.language)
   if (!condition) return null
   return <span className={`weapon-condition is-${condition}`} title={t(condition === 'broken'
      ? 'Badly damaged: not usable until repaired (S. 231).' : 'Damaged: AT and PA −2 (ranged FK −4) until repaired (S. 231, 243).', language)}>
      {t(condition === 'broken' ? 'Broken' : 'Damaged', language)}
   </span>
}

// The core rules give no repair price or check (user decision, Nov 2026): the GM names the smith's price,
// or the hero repairs it with the matching craft talent and a modifier the GM sets.
export function WeaponRepairButton({ stats, entry, index, labeled = false }: { stats: Stats; entry: EquipmentEntry; index: number; labeled?: boolean }) {
   const language = useLanguageStore((state) => state.language)
   const [open, setOpen] = useState(false)
   if (!entry.condition) return null
   return <>
      {labeled ? <button className='primary-button' type='button' onClick={() => setOpen(true)}><Wrench size={16} />{t('Repair', language)}</button>
         : <button className='icon-button' type='button' title={t('Repair', language)} aria-label={`${t('Repair', language)}: ${entry.item}`}
            onClick={() => setOpen(true)}><Wrench size={15} /></button>}
      {open && <RepairDialog stats={stats} entry={entry} index={index} onClose={() => setOpen(false)} />}
   </>
}

function RepairDialog({ stats, entry, index, onClose }: { stats: Stats; entry: EquipmentEntry; index: number; onClose: () => void }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const titleId = useId()
   const dialogRef = useModalKeyboard(onClose)
   const [coins, setCoins] = useState({ dukaten: '', silbertaler: '', heller: '', kreuzer: '' })
   const [craft, setCraft] = useState<string>(suggestedCraft(entry.item))
   const [rolling, setRolling] = useState(false)
   const mutation = useMutation({
      mutationFn: (payment: RepairPayment) => repairWeapon(stats._id, index, entry.item, payment),
      onSuccess: (next) => {
         queryClient.setQueryData(['stats', stats.charId], next)
         toast.success(t('Weapon repaired.', language))
         onClose()
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const price = Object.fromEntries(coinKeys.map((key) => [key, Math.max(0, Math.trunc(Number(coins[key] || 0)))])) as Record<typeof coinKeys[number], number>
   const hasPrice = coinKeys.some((key) => price[key] > 0)
   const talent = talentCatalog.find((item) => item.key === craft)!
   const value = stats.talents.find((item) => item.key === craft)?.value ?? 0

   return createPortal(
      <div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
         <section ref={dialogRef} className='hero-editor' lang={language} role='dialog' aria-modal='true' aria-labelledby={titleId}
            onMouseDown={(event) => event.stopPropagation()}>
            <header className='editor-header'>
               <div><p className='eyebrow'>{t('Repair', language)}</p><h2 id={titleId}>{entry.item} <ConditionBadge condition={entry.condition} /></h2></div>
               <button className='icon-button editor-close' type='button' onClick={onClose} aria-label={t('Close', language)}><X size={20} /></button>
            </header>
            <p className='combat-note'>{t('The core rules give no repair price or check: the GM names the price or sets the modifier for your own repair.', language)}</p>
            <fieldset className='form-section'>
               <legend>{t('Pay a smith', language)}</legend>
               <div className='repair-coins'>
                  {coinKeys.map((key) => <label key={key} className='field-group'>
                     <span>{coinLabels[key]}</span>
                     <input type='number' inputMode='numeric' min={0} step={1} value={coins[key]} onChange={(event) => setCoins({ ...coins, [key]: event.target.value })} />
                  </label>)}
               </div>
               <button className='primary-button' type='button' disabled={!hasPrice || mutation.isPending}
                  onClick={() => mutation.mutate({ method: 'pay', price })}><Coins size={16} />{t('Pay and repair', language)}</button>
            </fieldset>
            <fieldset className='form-section'>
               <legend>{t('Repair it yourself', language)}</legend>
               <label className='field-group'><span>{t('Craft talent', language)}</span>
                  <select value={craft} onChange={(event) => setCraft(event.target.value)}>
                     {crafts.map((key) => <option key={key} value={key}>{t(talentCatalog.find((item) => item.key === key)!.label, language)}</option>)}
                  </select>
               </label>
               <button className='primary-button' type='button' onClick={() => setRolling(true)}><Hammer size={16} />{t('Roll repair check', language)}</button>
            </fieldset>
            {rolling && <TalentProbeDialog stats={stats} talent={talent} value={value}
               renderResult={({ result }) => result.success
                  ? <button className='primary-button' type='button' disabled={mutation.isPending} onClick={() => mutation.mutate({ method: 'self' })}>
                     <Wrench size={16} />{t('Mark as repaired', language)}</button>
                  : <p className='fight-note'>{t('The repair failed. Try again later or pay a smith.', language)}</p>}
               onClose={() => setRolling(false)} />}
         </section>
      </div>, document.body,
   )
}
