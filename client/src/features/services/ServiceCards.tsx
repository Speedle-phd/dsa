import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BedDouble, Coins, Plus, Receipt, Trash2 } from 'lucide-react'
import { QuantityStepper } from '@/components/QuantityStepper'
import { useState } from 'react'
import { toast } from 'sonner'
import { activeEffectsKey } from '@/features/heroes/activeEffectsApi'
import { RegenerationDialog } from '@/features/heroes/RegenerationDialog'
import type { Stats } from '@/features/heroes/statsApi'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { formatKreuzer, formatServicePrice, purchaseService, purseKreuzer, type BillItem, type Service, type ServiceGroup } from './servicesApi'

function usePayment(stats: Stats, onPaid?: (items: BillItem[]) => void) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   return useMutation({
      mutationFn: ({ items, treatmentQuality }: { items: BillItem[]; treatmentQuality?: number }) => purchaseService(stats._id, items, treatmentQuality),
      onSuccess: ({ stats: next, effects, paidKreuzer }, { items }) => {
         queryClient.setQueryData(['stats', stats.charId], next)
         queryClient.setQueryData(activeEffectsKey(stats._id), effects)
         toast.success(t('Paid {amount}.', language).replace('{amount}', formatKreuzer(paidKreuzer)))
         onPaid?.(items)
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
}

const unitQuantityLabel: Record<NonNullable<Service['unit']>, string> = {
   'per hoof': 'Hooves', 'per page': 'Pages', 'per 100 miles': '× 100 miles', 'per night': 'Nights', donation: 'Quantity',
}

// One service with quantity and a pay button (Medicus, Schmiede, Schreibstube, Reise, Sonstiges).
export function ServiceCard({ service, stats }: { service: Service; stats: Stats }) {
   const language = useLanguageStore((state) => state.language)
   // source: DSA5 Regelwerk, S. 382 (a horse is shod per hoof: four by default)
   const [quantity, setQuantity] = useState(service.key === 'Pferd beschlagen' ? 4 : 1)
   const [quality, setQuality] = useState(0)
   const payment = usePayment(stats, () => setQuality(0))
   const total = service.priceKreuzer * quantity
   const affordable = total <= purseKreuzer(stats.purse)
   const treatment = service.effect === 'treatment'
   return <article className='service-card'>
      <header>
         <strong lang='de'>{t(service.key, language)}</strong>
         <span className='service-price'>{formatServicePrice(service.price, language)}{service.unit && <small> {t(service.unit, language)}</small>}</span>
      </header>
      {treatment && <>
         <p className='service-note'>{t('The Medicus rolls Heilkunde Wunden (GM). Enter the QS: it is added to your next LeP regeneration (S. 340).', language)}</p>
         <label className='service-field'>
            <span>{t('QS of the treatment', language)}</span>
            <QuantityStepper value={quality} min={0} max={6} label={t('QS of the treatment', language)} onChange={setQuality} />
         </label>
      </>}
      {service.key === 'Diagnose einer Krankheit' && <p className='service-note'>{t('The Medicus rolls Heilkunde Krankheiten (GM).', language)}</p>}
      {service.key === 'Alchimistische Analyse' && <p className='service-note'>{t('The alchemist rolls Alchimie; from QS 2 the quality of an elixir is known (S. 272).', language)}</p>}
      {(service.unit || !treatment) && service.unit !== 'donation' && <label className='service-field'>
         <span>{t(service.unit ? unitQuantityLabel[service.unit] : 'Quantity', language)}</span>
         <QuantityStepper value={quantity} label={t('Quantity', language)} onChange={setQuantity} />
      </label>}
      <footer>
         <span className='service-total'>{formatKreuzer(total)}</span>
         <button className='primary-button' type='button' disabled={!affordable || payment.isPending}
            title={affordable ? undefined : t('Not enough money', language)}
            onClick={() => payment.mutate({ items: [{ key: service.key, quantity }], treatmentQuality: treatment ? quality : undefined })}>
            <Coins size={16} />{t('Pay', language)}
         </button>
      </footer>
   </article>
}

const restCampsite = (key: string) =>
   // App choice: private rooms count as "Gute Unterkunft" (S. 339); the dialog lets the player change it.
   ['Einzelzimmer', 'Doppelzimmer', 'Suite'].includes(key) ? 'good' as const : 'normal' as const

// The Gasthaus price list as a menu board with a running bill (S. 382).
export function InnMenu({ services, stats, groups }: { services: Service[]; stats: Stats; groups: Array<[ServiceGroup, string]> }) {
   const language = useLanguageStore((state) => state.language)
   const [bill, setBill] = useState<BillItem[]>([])
   const [rest, setRest] = useState<'good' | 'normal' | null>(null)
   const [paidRest, setPaidRest] = useState<'good' | 'normal' | null>(null)
   const payment = usePayment(stats, (items) => {
      const lodging = items.find((item) => services.find((service) => service.key === item.key)?.effect === 'rest')
      setPaidRest(lodging ? restCampsite(lodging.key) : null)
      setBill([])
   })
   const byKey = (key: string) => services.find((service) => service.key === key)!
   const add = (key: string, delta: number) => setBill((current) => {
      const existing = current.find((item) => item.key === key)
      const quantity = Math.max(0, Math.min(100, (existing?.quantity ?? 0) + delta))
      if (!quantity) return current.filter((item) => item.key !== key)
      return existing ? current.map((item) => item.key === key ? { ...item, quantity } : item) : [...current, { key, quantity }]
   })
   const total = bill.reduce((sum, item) => sum + byKey(item.key).priceKreuzer * item.quantity, 0)
   const affordable = total <= purseKreuzer(stats.purse)

   return <div className='inn-layout'>
      <div className='inn-menu'>
         {groups.map(([group, title]) => <section key={group} className='inn-menu-section'>
            <h3>{t(title, language)}</h3>
            <ul>
               {services.filter((service) => service.group === group).map((service) => {
                  const count = bill.find((item) => item.key === service.key)?.quantity ?? 0
                  return <li key={service.key}>
                     <span className='inn-item' lang='de'>{t(service.key, language)}{service.unit && <small> {t(service.unit, language)}</small>}</span>
                     <span className='inn-leader' aria-hidden='true' />
                     <span className='inn-price'>{formatServicePrice(service.price, language)}</span>
                     <button className={`icon-button inn-add${count ? ' is-active' : ''}`} type='button'
                        aria-label={`${t('Add to bill', language)}: ${t(service.key, language)}`} onClick={() => add(service.key, 1)}>
                        {count ? <span>{count}</span> : <Plus size={16} />}
                     </button>
                  </li>
               })}
            </ul>
         </section>)}
      </div>

      <aside className='inn-bill' aria-label={t('Bill', language)}>
         <h3><Receipt size={18} aria-hidden='true' />{t('Bill', language)}</h3>
         {bill.length === 0 ? <p className='service-note'>{t('Add drinks, meals or a room from the menu.', language)}</p>
            : <ul>{bill.map((item) => {
               const service = byKey(item.key)
               return <li key={item.key}>
                  <span lang='de'>{t(item.key, language)}</span>
                  <QuantityStepper value={item.quantity} min={1} label={t(item.key, language)} onChange={(value) => add(item.key, value - item.quantity)} />
                  <span className='inn-price'>{formatKreuzer(service.priceKreuzer * item.quantity)}</span>
                  <button className='icon-button' type='button' aria-label={`${t('Remove', language)}: ${t(item.key, language)}`}
                     onClick={() => add(item.key, -item.quantity)}><Trash2 size={15} /></button>
               </li>
            })}</ul>}
         <div className='inn-bill-total'><span>{t('Total', language)}</span><strong>{formatKreuzer(total)}</strong></div>
         <button className='primary-button' type='button' disabled={bill.length === 0 || !affordable || payment.isPending}
            title={bill.length === 0 ? t('The bill is empty.', language) : affordable ? undefined : t('Not enough money', language)}
            onClick={() => payment.mutate({ items: bill })}><Coins size={16} />{t('Pay bill', language)}</button>
         {paidRest && <button className='quiet-button' type='button' onClick={() => setRest(paidRest)}>
            <BedDouble size={16} />{t('Rest here (regeneration)', language)}</button>}
      </aside>
      {rest && <RegenerationDialog stats={stats} campsite={rest} onClose={() => { setRest(null); setPaidRest(null) }} />}
   </div>
}
