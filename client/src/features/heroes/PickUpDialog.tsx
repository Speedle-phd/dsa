import { PackageSearch, PenLine, Search, X } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { QuantityStepper } from '@/components/QuantityStepper'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { aventurianStore, type AventurianStoreItem } from '@/utils/aventurian_store'
import { getPurchaseDescription } from '@/utils/storeDisplay'
import { purchaseName, type StoreVariant } from '@/utils/storePricing'
import { defaultPlacement } from './containers'
import { PlacementSelect } from './PlacementSelect'
import type { EquipmentEntry } from './statsApi'

type CatalogPick = AventurianStoreItem & { category: string }
const catalog: CatalogPick[] = Object.entries(aventurianStore).flatMap(([category, items]) => items.map((item) => ({ ...item, category })))
const categories = [...Object.keys(aventurianStore), 'Other']

// Picking up adds an item without paying: anything from the store catalog (arrows after a fight, loot) or a custom item.
export function PickUpDialog({ equipment, pending, onAdd, onClose }: {
   equipment: readonly EquipmentEntry[]; pending: boolean; onAdd: (entry: EquipmentEntry) => void; onClose: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const titleId = useId()
   const dialogRef = useModalKeyboard(onClose)
   const [query, setQuery] = useState('')
   const debounced = useDebouncedValue(query)
   const [picked, setPicked] = useState<CatalogPick | null>(null)
   const [variant, setVariant] = useState<StoreVariant | undefined>()
   const [custom, setCustom] = useState({ category: 'Other', weight: 0 })
   const [amount, setAmount] = useState(1)
   const [placement, setPlacement] = useState<string | null>(null)
   const [description, setDescription] = useState('')

   const results = useMemo(() => {
      const needle = debounced.trim().toLowerCase()
      if (needle.length < 2) return []
      return catalog.filter((item) => [item.name, t(item.name, language)].some((name) => name.toLowerCase().includes(needle))).slice(0, 8)
   }, [debounced, language])

   const name = picked ? purchaseName(picked, variant) : query.trim()
   const effectivePlacement = placement ?? defaultPlacement(equipment, name || 'item', amount)
   const invalid = !name ? t('Enter an item name or pick one from the catalog.', language)
      : !Number.isFinite(custom.weight) || custom.weight < 0 ? t('Enter a valid amount and weight.', language) : null

   function pick(item: CatalogPick) {
      setPicked(item)
      setVariant(item.variants?.[0])
      setPlacement(null)
      setDescription(getPurchaseDescription(item))
   }

   function submit() {
      if (invalid) return
      onAdd({
         item: name, category: picked?.category ?? custom.category, weight: picked?.weight ?? custom.weight, amount,
         carriedOn: effectivePlacement, ...(description.trim() ? { description: description.trim() } : {}),
         ...(variant?.quality ? { quality: variant.quality } : {}),
      })
   }

   return createPortal(
      <div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
         <section ref={dialogRef} className='hero-editor store-purchase pickup-dialog' lang={language} role='dialog' aria-modal='true'
            aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
            <header className='editor-header'>
               <div><p className='eyebrow'>{t('Inventory', language)}</p><h2 id={titleId}>{t('Pick up item', language)}</h2></div>
               <button className='icon-button editor-close' type='button' onClick={onClose} aria-label={t('Close', language)}><X size={20} /></button>
            </header>
            <div className='store-purchase-body'>
               {picked ? <div className='pickup-picked'>
                  <PackageSearch size={20} aria-hidden='true' />
                  <div>
                     <strong>{t(picked.name, language)}</strong>
                     <small>{t(picked.category.replace(/_/g, ' '), language)} · {picked.weight} s</small>
                  </div>
                  <button className='quiet-button' type='button' onClick={() => { setPicked(null); setVariant(undefined); setDescription('') }}>
                     {t('Change', language)}
                  </button>
               </div> : <>
                  <label className='search-field search-field--wide'>
                     <Search size={16} />
                     <input type='text' autoFocus value={query} placeholder={t('Search the store catalog or name a custom item…', language)}
                        aria-label={t('Item', language)} onChange={(event) => setQuery(event.target.value)} />
                  </label>
                  {results.length > 0 && <ul className='pickup-results' aria-label={t('Store catalog', language)}>
                     {results.map((item) => <li key={`${item.category}-${item.name}`}>
                        <button type='button' onClick={() => pick(item)}>
                           <strong>{t(item.name, language)}</strong>
                           <small>{t(item.category.replace(/_/g, ' '), language)} · {item.weight} s</small>
                        </button>
                     </li>)}
                  </ul>}
                  {query.trim() && <div className='pickup-custom'>
                     <p className='eyebrow'><PenLine size={14} aria-hidden='true' /> {t('Custom item', language)}: <strong>{query.trim()}</strong></p>
                     <div className='store-purchase-fields'>
                        <label className='field-group'><span>{t('Category', language)}</span>
                           <select value={custom.category} onChange={(event) => setCustom({ ...custom, category: event.target.value })}>
                              {categories.map((category) => <option key={category} value={category}>{t(category.replace(/_/g, ' '), language)}</option>)}
                           </select>
                        </label>
                        <label className='field-group'><span>{t('Weight (s)', language)}</span>
                           <input type='number' min={0} step={0.05} value={custom.weight}
                              onChange={(event) => setCustom({ ...custom, weight: event.target.valueAsNumber })} />
                        </label>
                     </div>
                  </div>}
               </>}

               {picked?.variants && <fieldset className='form-section'>
                  <legend>{t(picked.kind === 'elixir' ? 'Quality level (QS)' : 'Training', language)}</legend>
                  <div className={`probe-segmented${picked.kind === 'elixir' ? ' store-quality-picker' : ''}`}>
                     {picked.variants.map((option) => <button key={option.id} type='button' aria-pressed={variant?.id === option.id}
                        className={variant?.id === option.id ? 'is-active' : undefined} onClick={() => setVariant(option)}>
                        {picked.kind === 'elixir' ? option.label : t(option.label, language)}
                     </button>)}
                  </div>
               </fieldset>}

               <div className='store-purchase-fields'>
                  <label className='field-group'><span>{t('Amount', language)}</span>
                     <QuantityStepper value={amount} max={999} label={t('Amount', language)} onChange={setAmount} />
                  </label>
                  <label className='field-group'><span>{t('Place or equip in', language)}</span>
                     <PlacementSelect equipment={equipment} item={name || 'item'} amount={amount} value={effectivePlacement} onChange={setPlacement} />
                  </label>
               </div>
               <label className='field-group'><span>{t('Description (optional)', language)}</span>
                  <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
               </label>
            </div>
            <footer className='store-purchase-footer'>
               <span className='combat-note'>{t('Picked up items cost nothing.', language)}</span>
               <div className='modal-actions'>
                  <button type='button' className='quiet-button' onClick={onClose}>{t('Cancel', language)}</button>
                  <button type='button' className='primary-button' disabled={pending || invalid !== null} title={invalid ?? undefined} onClick={submit}>
                     {t('Pick up', language)}
                  </button>
               </div>
            </footer>
         </section>
      </div>,
      document.body,
   )
}
