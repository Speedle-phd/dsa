import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Coins, FlaskConical, Skull, Leaf, X } from 'lucide-react'
import { useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { companionsKey, updateCompanions } from '@/features/heroes/companionApi'
import { defaultPlacement } from '@/features/heroes/containers'
import { useHeroStore } from '@/features/heroes/heroStore'
import { PlacementSelect } from '@/features/heroes/PlacementSelect'
import { formatKreuzer } from '@/features/services/servicesApi'
import { purchaseEquipmentForHero, type Stats } from '@/features/heroes/statsApi'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import type { AventurianStoreItem } from '@/utils/aventurian_store'
import { getItemDetails, getPurchaseDescription } from '@/utils/storeDisplay'
import { defaultVariant, purchaseName, unitPrice, withRate, type StoreVariant } from '@/utils/storePricing'
import { conversionTable, getErrorMessage } from '@/utils/utils'

export type StoreSelection = AventurianStoreItem & { category: string }

// Core-rule companion stat blocks exist for these animals (S. 360–362); buying one can add it as a companion.
const companionAnimals = ['Hund', 'Pferd']

// source: DSA5 Regelwerk, S. 364
const toKreuzer = (silbertaler: number) => Math.round(conversionTable.currency.calcSilbertalerToKreuzer(silbertaler))

export function StorePurchaseDialog({ item, stats, heroId, onClose }: {
   item: StoreSelection; stats: Stats; heroId: string; onClose: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const titleId = useId()
   const dialogRef = useModalKeyboard(onClose)
   const [variant, setVariant] = useState<StoreVariant | undefined>(defaultVariant(item))
   const [agreedPrice, setAgreedPrice] = useState(item.priceVaries?.min ?? 0)
   const [quantity, setQuantity] = useState(1)
   const [placement, setPlacement] = useState<string | null>(null)
   const marketRate = useHeroStore((state) => state.marketRate)
   // A custom price (bargain, gift, shady dealer) replaces the list or market price per unit.
   const [customPrice, setCustomPrice] = useState<number | null>(null)
   const listPrice = unitPrice(item, variant, agreedPrice)
   // The market rate does not touch prices that were agreed individually (S. 208).
   const ratedPrice = item.priceVaries ? listPrice : withRate(listPrice, marketRate)
   // Prices are paid in whole Kreuzer (S. 364).
   const price = customPrice !== null ? Math.round(customPrice * 100) / 100 : ratedPrice
   const { min, max } = item.priceVaries ?? {}
   const priceInvalid = (Boolean(item.priceVaries) && (!Number.isFinite(agreedPrice) || agreedPrice <= 0 ||
      (min !== undefined && agreedPrice < min) || (max !== undefined && agreedPrice > max))) ||
      (customPrice !== null && (!Number.isFinite(customPrice) || customPrice < 0))
   const cost = toKreuzer(price) * quantity
   const name = purchaseName(item, variant)
   const effectivePlacement = placement ?? defaultPlacement(stats.equipment, name, quantity)

   const companionMutation = useMutation({
      mutationFn: () => updateCompanions(stats._id, { action: 'add-companion', species: item.name, name: t(item.name, language), familiar: false }),
      onSuccess: () => {
         void queryClient.invalidateQueries({ queryKey: companionsKey(stats._id) })
         toast.success(t('Companion added.', language))
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const mutation = useMutation({
      mutationFn: () => {
         const description = getPurchaseDescription(item)
         return purchaseEquipmentForHero(stats._id, {
            item: name, category: item.category, unitWeight: item.weight, amount: quantity, carriedOn: effectivePlacement,
            unitPriceSilbertaler: price, ...(description ? { description } : {}),
            ...(variant?.quality ? { quality: variant.quality } : {}),
         })
      },
      onSuccess: () => {
         void queryClient.invalidateQueries({ queryKey: ['stats', heroId] })
         toast.success(t('Purchase saved to the hero equipment.', language), companionAnimals.includes(item.name) ? {
            action: { label: t('Add as companion', language), onClick: () => companionMutation.mutate() },
            duration: 10000,
         } : undefined)
         onClose()
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   const qualityIndex = (variant?.quality ?? 1) - 1
   const effect = item.alchemy?.levels[qualityIndex]

   return createPortal(
      <div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
         <section ref={dialogRef} className='hero-editor store-purchase' lang={language} role='dialog' aria-modal='true'
            aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
            <header className='editor-header'>
               <div>
                  <p className='eyebrow'>{t(item.category.replace(/_/g, ' '), language)}{item.kind && ` · ${t(item.kind, language)}`}</p>
                  <h2 id={titleId}>{t(item.name, language)}</h2>
               </div>
               <button className='icon-button editor-close' type='button' onClick={onClose} aria-label={t('Close', language)}><X size={20} /></button>
            </header>

            <div className='store-purchase-body'>
               {item.description && <p className='store-purchase-lead'>{t(item.description, language)}</p>}
               {getItemDetails(item, language).length > 0 && <ul className='store-purchase-facts'>
                  {getItemDetails(item, language).map((detail) => <li key={detail}>{detail}</li>)}
               </ul>}

               {item.variants && <fieldset className='form-section'>
                  <legend>{t(item.kind === 'elixir' ? 'Quality level (QS)' : 'Training', language)}</legend>
                  <div className={`probe-segmented${item.kind === 'elixir' ? ' store-quality-picker' : ''}`}>
                     {item.variants.map((option) => <button key={option.id} type='button' aria-pressed={variant?.id === option.id}
                        className={variant?.id === option.id ? 'is-active' : undefined} onClick={() => setVariant(option)}>
                        {item.kind === 'elixir' ? option.label : t(option.label, language)}
                        <small>{option.silbertaler} S</small>
                     </button>)}
                  </div>
               </fieldset>}

               {effect && <div className='store-effect-card'>
                  <FlaskConical size={18} aria-hidden='true' />
                  <div>
                     <strong>{t('Effect at', language)} {variant?.label}</strong>
                     <p>{effect[language]}</p>
                  </div>
               </div>}
               {item.poison && <div className='store-effect-card is-poison'>
                  <Skull size={18} aria-hidden='true' />
                  <dl>
                     <div><dt>{t('Check succeeds', language)}</dt><dd>{item.poison.effect[0][language]}</dd></div>
                     <div><dt>{t('Check fails', language)}</dt><dd>{item.poison.effect[1][language]}</dd></div>
                  </dl>
               </div>}
               {item.herb && <div className='store-effect-card is-herb'>
                  <Leaf size={18} aria-hidden='true' />
                  <div><strong>{t('Effect', language)}</strong><p>{item.herb.effect[language]}</p></div>
               </div>}

               {item.kind === 'bundle' && item.contents && <section className='bundle-preview' aria-label={t('Bundle contents', language)}>
                  <h4>{t('Included in this bundle', language)}</h4>
                  <ul>{item.contents.map(({ name: content, amount }) => <li key={content}>{amount > 1 && <span>{amount} × </span>}{t(content, language)}</li>)}</ul>
               </section>}

               <div className='store-purchase-fields'>
                  {item.priceVaries && <label className='field-group'>
                     <span>{t('Agreed price (S)', language)}</span>
                     <input type='number' inputMode='decimal' min={min ?? 0} max={max} step={0.1} value={agreedPrice}
                        aria-invalid={priceInvalid} onChange={(event) => setAgreedPrice(event.target.valueAsNumber)} />
                     <small>{min !== undefined && max !== undefined ? `${min}–${max} S ${t(item.priceUnit ?? '', language)}`
                        : t('The rulebook lists no fixed price: agree on it with the GM.', language)}</small>
                  </label>}
                  <label className='field-group'>
                     <span>{t('Quantity', language)}</span>
                     <input type='number' inputMode='numeric' min={1} max={99} value={quantity}
                        onChange={(event) => setQuantity(Math.min(99, Math.max(1, Math.trunc(event.target.valueAsNumber) || 1)))} />
                  </label>
                  <label className='field-group'>
                     <span>{t('Place or equip in', language)}</span>
                     <PlacementSelect equipment={stats.equipment} item={name} amount={quantity} value={effectivePlacement} onChange={setPlacement} />
                  </label>
               </div>

               <fieldset className='form-section store-price-section'>
                  <legend>{t('Price per unit', language)}</legend>
                  <dl className='store-price-lines'>
                     <div className={customPrice !== null || ratedPrice !== listPrice ? 'is-replaced' : undefined}>
                        <dt>{t(item.priceVaries ? 'Agreed price' : 'List price', language)}</dt><dd>{listPrice} S</dd>
                     </div>
                     {ratedPrice !== listPrice && <div className={customPrice !== null ? 'is-replaced' : undefined}>
                        <dt>{t('Market rate', language)} {marketRate > 0 ? '+' : '−'}{Math.abs(marketRate)} %</dt><dd>{ratedPrice} S</dd>
                     </div>}
                  </dl>
                  <label className='regen-toggle'>
                     <input type='checkbox' checked={customPrice !== null}
                        onChange={(event) => setCustomPrice(event.target.checked ? ratedPrice : null)} />
                     <span><strong>{t('Custom price', language)}</strong>
                        <small>{t('A bargain, a gift or a special offer: enter what you actually pay per unit.', language)}</small></span>
                  </label>
                  {customPrice !== null && <label className='field-group'>
                     <span>{t('Price per unit (S)', language)}</span>
                     <input type='number' inputMode='decimal' min={0} step={0.01} value={customPrice} autoFocus
                        aria-invalid={priceInvalid} onChange={(event) => setCustomPrice(event.target.valueAsNumber)} />
                  </label>}
               </fieldset>
            </div>

            <footer className='store-purchase-footer'>
               <div className='store-purchase-total'>
                  <Coins size={18} aria-hidden='true' />
                  <span>{t('Cost', language)}</span>
                  <strong>{Number.isFinite(cost) ? formatKreuzer(cost) : '—'}</strong>
               </div>
               <div className='modal-actions'>
                  <button type='button' className='quiet-button' onClick={onClose}>{t('Cancel', language)}</button>
                  <button type='button' className='primary-button' disabled={mutation.isPending || priceInvalid}
                     title={priceInvalid ? t('Enter a valid price.', language) : undefined}
                     onClick={() => mutation.mutate()}>
                     {mutation.isPending ? t('Saving...', language) : t('Save to equipment', language)}
                  </button>
               </div>
            </footer>
         </section>
      </div>,
      document.body,
   )
}
