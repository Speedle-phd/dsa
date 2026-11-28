import { Tooltip } from '@/components/Tooltip'
import { ConditionBadge, WeaponRepairButton } from './WeaponRepair'
import { getErrorMessage } from '@/utils/errorHandling'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
   ArrowDownAZ,
   ArrowUpAZ,
   Backpack,
   Coins,
   HandCoins,
   HandPlatter,
   Info,
   Minus,
   PackagePlus,
   Plus,
   Trash2,
   Utensils,
} from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import type { Hero } from './heroApi'
import { carriedEquipmentWeight } from './equipmentOptions'
import { releaseContents } from './containers'
import { PickUpDialog } from './PickUpDialog'
import { ArtifactsSection } from './ArtifactsSection'
import { PlacementSelect } from './PlacementSelect'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { aventurianStore } from '@/utils/aventurian_store'
import { getPurchaseDescription } from '@/utils/storeDisplay'
import { catalogEntry, equipmentDisplayName } from '@/utils/storePricing'
import { isConsumableItem } from './activeEffectsApi'
import { ConsumeDialog } from './ConsumeDialog'
import { UseItemDialog } from './UseItemDialog'
import { isUsedUpItem } from '@/utils/storeConsumables'
import {
   adjustPurseForHero,
   getStatsForHero,
   type EquipmentEntry,
   updateEquipmentForHero,
} from './statsApi'

type SortKey = 'item' | 'category' | 'weight' | 'carriedOn'
type SortDirection = 'ascending' | 'descending'

type EquipmentPurse = {
   dukaten: number
   silbertaler: number
   heller: number
   kreuzer: number
}

const emptyCoins = { dukaten: '', silbertaler: '', heller: '', kreuzer: '' }

const coinLabels = {
   dukaten: 'Dukaten',
   silbertaler: 'Silbertaler',
   heller: 'Heller',
   kreuzer: 'Kreuzer',
} as const
const catalogCategories: string[] = [...Object.keys(aventurianStore), 'Other']

const toKreuzer = (purse: EquipmentPurse) =>
   purse.dukaten * 1000 +
   purse.silbertaler * 100 +
   purse.heller * 10 +
   purse.kreuzer

const formatPurse = (purse: EquipmentPurse) =>
   `${purse.dukaten} D / ${purse.silbertaler} S / ${purse.heller} H / ${purse.kreuzer} K`

function sortEquipment(
   equipment: EquipmentEntry[],
   sortKey: SortKey,
   direction: SortDirection,
) {
   const sorted = [...equipment].sort((left, right) => {
      const leftValue = left[sortKey]
      const rightValue = right[sortKey]

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
         return leftValue - rightValue
      }

      return String(leftValue).localeCompare(String(rightValue), undefined, {
         sensitivity: 'base',
      })
   })

   return direction === 'ascending' ? sorted : sorted.reverse()
}

export default function HeroEquipment({ hero }: { hero: Hero }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const [sortKey, setSortKey] = useState<SortKey>('item')
   const [sortDirection, setSortDirection] =
      useState<SortDirection>('ascending')
   const [dropTarget, setDropTarget] = useState<EquipmentEntry | null>(null)
   const [consumeTarget, setConsumeTarget] = useState<EquipmentEntry | null>(null)
   const [useTarget, setUseTarget] = useState<EquipmentEntry | null>(null)
   const [dropAmount, setDropAmount] = useState(1)
   const [isPickUpOpen, setIsPickUpOpen] = useState(false)
   const [purseMode, setPurseMode] = useState<'receive' | 'lose' | null>(null)
   const [coinInput, setCoinInput] = useState(emptyCoins)
   const statsQuery = useQuery({
      queryKey: ['stats', hero._id],
      queryFn: () => getStatsForHero(hero._id),
   })

   const equipment = useMemo(
      () => statsQuery.data?.equipment ?? [],
      [statsQuery.data?.equipment],
   )
   const sortedEquipment = useMemo(
      () => sortEquipment(equipment, sortKey, sortDirection),
      [equipment, sortDirection, sortKey],
   )
   const totalWeight = carriedEquipmentWeight(equipment)
   const carryingCapacity = statsQuery.data?.carryingCapacity ?? 0
   const burden = statsQuery.data?.burden ?? 0
   const purse = statsQuery.data?.purse

   const saveEquipmentMutation = useMutation({
      mutationFn: (nextEquipment: EquipmentEntry[]) =>
         updateEquipmentForHero(statsQuery.data!._id, {
            equipment: nextEquipment,
            purse: statsQuery.data!.purse,
         }),
      onSuccess: async () => {
         await queryClient.invalidateQueries({ queryKey: ['stats', hero._id] })
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   const adjustPurseMutation = useMutation({
      mutationFn: (adjustment: {
         direction: 'receive' | 'lose'
         coins: EquipmentPurse
      }) => adjustPurseForHero(statsQuery.data!._id, adjustment),
      onSuccess: async (_stats, adjustment) => {
         await queryClient.invalidateQueries({ queryKey: ['stats', hero._id] })
         toast.success(
            adjustment.direction === 'receive'
               ? t('Money received.', language)
               : t('Money deducted.', language),
         )
         setPurseMode(null)
         setCoinInput(emptyCoins)
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   const submitPurseAdjustment = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!purseMode) return
      const coins = {
         dukaten: Number(coinInput.dukaten || 0),
         silbertaler: Number(coinInput.silbertaler || 0),
         heller: Number(coinInput.heller || 0),
         kreuzer: Number(coinInput.kreuzer || 0),
      }
      if (
         Object.values(coins).some(
            (coin) => !Number.isInteger(coin) || coin < 0,
         ) ||
         toKreuzer(coins) < 1
      ) {
         toast.error(t('Enter a whole, non-empty coin amount.', language))
         return
      }
      adjustPurseMutation.mutate({ direction: purseMode, coins })
   }

   const moveItem = (entry: EquipmentEntry, carriedOn: string) => {
      if (carriedOn === entry.carriedOn) return
      const moved = { ...entry, carriedOn }
      const target = equipment.find(
         (current) =>
            current !== entry &&
            current.item === moved.item &&
            current.category === moved.category &&
            current.condition === moved.condition &&
            current.quality === moved.quality &&
            current.carriedOn === carriedOn,
      )
      const nextEquipment = equipment.flatMap((current) => {
         if (current === entry) return target ? [] : [moved]
         if (current === target) {
            return [{ ...current, amount: current.amount + entry.amount }]
         }
         return [current]
      })
      updateEquipment(nextEquipment, t('Item moved.', language))
   }

   const toggleSort = (nextKey: SortKey) => {
      if (sortKey === nextKey) {
         setSortDirection((current) =>
            current === 'ascending' ? 'descending' : 'ascending',
         )
         return
      }

      setSortKey(nextKey)
      setSortDirection('ascending')
   }

   const updateEquipment = (
      nextEquipment: EquipmentEntry[],
      message: string,
   ) => {
      saveEquipmentMutation.mutate(nextEquipment, {
         onSuccess: () => toast.success(message),
      })
   }

   const consumeItem = (entry: EquipmentEntry, amount: number) => {
      // The list may have been refetched while the dialog was open: find the same stack again
      const target = equipment.includes(entry) ? entry : equipment.find((current) => current.item === entry.item &&
         current.carriedOn === entry.carriedOn && current.quality === entry.quality && current.condition === entry.condition)
      if (!target || target.amount < amount) {
         toast.error(t('This item is no longer in the inventory in that amount.', language))
         setUseTarget(null)
         return
      }
      const nextEquipment = equipment.flatMap((current) => {
         if (current !== target) return [current]
         const remaining = current.amount - amount
         return remaining > 0 ? [{ ...current, amount: remaining }] : []
      })
      saveEquipmentMutation.mutate(nextEquipment, {
         onSuccess: () => {
            toast.success(t('Item used.', language))
            setUseTarget(null)
         },
      })
   }

   const dropItem = () => {
      if (!dropTarget) return
      const nextEquipment = releaseContents(equipment.flatMap((current) => {
         if (current !== dropTarget) return [current]
         const remaining = current.amount - dropAmount
         return remaining > 0 ? [{ ...current, amount: remaining }] : []
      }), dropTarget.item)
      updateEquipment(
         nextEquipment,
         t('Item dropped.', language),
      )
      setDropTarget(null)
      setDropAmount(1)
   }

   // Picked-up items merge into an identical stack in the same place (same quality, undamaged).
   const pickUp = (entry: EquipmentEntry) => {
      const target = equipment.find((current) => current.item === entry.item && current.category === entry.category &&
         current.carriedOn === entry.carriedOn && current.quality === entry.quality && !current.condition)
      const nextEquipment = target
         ? equipment.map((current) => current === target ? { ...current, amount: current.amount + entry.amount } : current)
         : [...equipment, entry]
      saveEquipmentMutation.mutate(nextEquipment, {
         onSuccess: () => {
            toast.success(t('Item added to equipment.', language))
            setIsPickUpOpen(false)
         },
      })
   }

   if (statsQuery.isLoading) {
      return <p className='equipment-status'>{t('Loading equipment...', language)}</p>
   }

   if (statsQuery.isError || !statsQuery.data) {
      return <p className='equipment-status'>{t('Unable to load equipment.', language)}</p>
   }

   return (
      <div className='equipment-manager'>
         <div className='equipment-toolbar'>
            <div>
               <p className='eyebrow'>{t('Inventory', language)}</p>
               <h2>{t("{name}'s equipment", language).replace('{name}', () => hero.name)}</h2>
            </div>
            <div className='equipment-actions'>
               <Link className='quiet-button' to='/store'>
                  <PackagePlus size={16} /> {t('Store', language)}
               </Link>
               <Link className='quiet-button' to='/services'>
                  <HandPlatter size={16} /> {t('Services', language)}
               </Link>
               <button
                  className='primary-button'
                  type='button'
                  onClick={() => setIsPickUpOpen(true)}
               >
                  <Plus size={16} /> {t('Pick up item', language)}
               </button>
            </div>
         </div>

         <div className='equipment-summary-grid'>
            <div className='state-panel'>
               <div className='resource-label'>
                  <span>
                     <Backpack size={15} /> {t('Carrying capacity', language)}
                  </span>
                  <strong>
                     {totalWeight.toFixed(1)} / {carryingCapacity} s
                  </strong>
               </div>
               <small>{t('Burden', language)}: {burden}</small>
            </div>
            <div className='state-panel'>
               <div className='resource-label'>
                  <span>
                     <Coins size={15} /> {t('Purse', language)}
                  </span>
                  <strong>{purse ? `${toKreuzer(purse)} K` : '0 K'}</strong>
               </div>
               <small>{purse ? formatPurse(purse) : t('No purse data', language)}</small>
               {purseMode ? (
                  <form className='purse-form' onSubmit={submitPurseAdjustment}>
                     <div className='purse-form-grid'>
                        {(Object.keys(coinLabels) as (keyof typeof coinLabels)[]).map(
                           (coin) => (
                              <label key={coin}>
                                 {t(coinLabels[coin], language)}
                                 <input
                                    type='number'
                                    min={0}
                                    step={1}
                                    placeholder='0'
                                    value={coinInput[coin]}
                                    onChange={(event) =>
                                       setCoinInput({
                                          ...coinInput,
                                          [coin]: event.target.value,
                                       })
                                    }
                                 />
                              </label>
                           ),
                        )}
                     </div>
                     <div className='modal-actions'>
                        <button
                           className='quiet-button'
                           type='button'
                           onClick={() => {
                              setPurseMode(null)
                              setCoinInput(emptyCoins)
                           }}
                        >
                           {t('Cancel', language)}
                        </button>
                        <button
                           className='primary-button'
                           type='submit'
                           disabled={adjustPurseMutation.isPending}
                        >
                           {purseMode === 'receive'
                              ? t('Receive money', language)
                              : t('Lose money', language)}
                        </button>
                     </div>
                  </form>
               ) : (
                  <div className='purse-actions'>
                     <button
                        className='quiet-button'
                        type='button'
                        onClick={() => setPurseMode('receive')}
                     >
                        <HandCoins size={15} /> {t('Receive', language)}
                     </button>
                     <button
                        className='quiet-button'
                        type='button'
                        onClick={() => setPurseMode('lose')}
                     >
                        <Minus size={15} /> {t('Lose / give', language)}
                     </button>
                  </div>
               )}
            </div>
         </div>

         {isPickUpOpen && (
            <PickUpDialog equipment={equipment} pending={saveEquipmentMutation.isPending}
               onAdd={pickUp} onClose={() => setIsPickUpOpen(false)} />
         )}

         <p className='combat-note'>{t('Set armor to Equipped to wear it. The previously worn armor is taken off and moved to Other.', language)}</p>
         <div className='equipment-table-wrap'>
            <table className='equipment-table'>
               <thead>
                  <tr>
                     {(
                        ['item', 'category', 'weight', 'carriedOn'] as const
                     ).map((key) => (
                        <th key={key} scope='col'>
                           <button
                              type='button'
                              className='table-sort-button'
                              onClick={() => toggleSort(key)}
                           >
                              {key === 'item'
                                 ? t('Item', language)
                                 : key === 'carriedOn'
                                   ? t('Carried on', language)
                                   : t(key[0].toUpperCase() + key.slice(1), language)}
                              {sortKey === key &&
                                 (sortDirection === 'ascending' ? (
                                    <ArrowDownAZ size={14} />
                                 ) : (
                                    <ArrowUpAZ size={14} />
                                 ))}
                           </button>
                        </th>
                     ))}
                     <th scope='col'>{t('Amount', language)}</th>
                     <th scope='col'>{t('Actions', language)}</th>
                  </tr>
               </thead>
               <tbody>
                  {sortedEquipment.map((entry, index) => (
                     <tr key={`${entry.item}-${entry.carriedOn}-${index}`}>
                        <td>
                           <span className='equipment-item-name'>
                              <span>{equipmentDisplayName(entry.item, language)}</span>
                              {entry.description && (
                                 <Tooltip
                                    content={(() => {
                                       const item = catalogEntry(entry.item)?.item
                                       if (item && entry.description === getPurchaseDescription(item)) return getPurchaseDescription(item, language)
                                       return item?.description === entry.description ? t(entry.description, language) : entry.description
                                    })()}
                                    clickToToggle
                                    className='tooltip-icon-wrapper'
                                 >
                                    <span className='equipment-tooltip-target'>
                                       <Info
                                          size={17}
                                          aria-label={t('Description available', language)}
                                       />
                                    </span>
                                 </Tooltip>
                              )}
                              <ConditionBadge condition={entry.condition} />
                           </span>
                        </td>
                        <td>{catalogCategories.includes(entry.category) ? t(entry.category.replace(/_/g, ' '), language) : entry.category}</td>
                        <td>{entry.weight} s</td>
                        <td>
                           <PlacementSelect
                              className='equipment-placement-select'
                              ariaLabel={t('Move {item} to', language).replace('{item}', () => entry.item)}
                              equipment={equipment}
                              item={entry.item}
                              amount={entry.amount}
                              value={entry.carriedOn}
                              onChange={(placement) => moveItem(entry, placement)}
                              disabled={saveEquipmentMutation.isPending}
                           />
                        </td>
                        <td>{entry.amount}</td>
                        <td>
                           <div className='equipment-row-actions'>
                              {statsQuery.data && <WeaponRepairButton stats={statsQuery.data} entry={entry} index={equipment.indexOf(entry)} />}
                              {/* Only consumables can be used up: effect items open their dialog, the others ask how many */}
                              {(isConsumableItem(entry.item, entry.herb) || isUsedUpItem(entry.item)) && <button
                                 className='icon-button'
                                 type='button'
                                 aria-haspopup='dialog'
                                 title={t('Use up', language)}
                                 aria-label={`${t('Use up', language)}: ${equipmentDisplayName(entry.item, language)}`}
                                 onClick={() => isConsumableItem(entry.item, entry.herb) ? setConsumeTarget(entry) : setUseTarget(entry)}
                                 disabled={saveEquipmentMutation.isPending}
                              >
                                 <Utensils size={15} />
                              </button>}
                              <button
                                 className='icon-button'
                                 type='button'
                                 title={t('Drop items', language)}
                                 aria-label={t('Drop item', language)}
                                 onClick={() => {
                                    setDropTarget(entry)
                                    setDropAmount(1)
                                 }}
                                 disabled={saveEquipmentMutation.isPending}
                              >
                                 <Trash2 size={15} />
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
            {equipment.length === 0 && (
               <p className='equipment-empty'>
                  {t('No equipment yet. Visit the store or add a custom item.', language)}
               </p>
            )}
         </div>

         {statsQuery.data && <ArtifactsSection stats={statsQuery.data} />}
         {consumeTarget && statsQuery.data && (
            <ConsumeDialog stats={statsQuery.data} entry={consumeTarget} index={equipment.indexOf(consumeTarget)}
               onClose={() => setConsumeTarget(null)} />
         )}
         {useTarget && (
            <UseItemDialog entry={useTarget} pending={saveEquipmentMutation.isPending}
               onConfirm={(amount) => consumeItem(useTarget, amount)} onClose={() => setUseTarget(null)} />
         )}
         {dropTarget && (
            <div className='modal-backdrop'>
               <section
                  className='modal-card'
                  role='dialog'
                  aria-modal='true'
                  aria-labelledby='drop-item-title'
               >
                  <h3 id='drop-item-title'>{t('Drop item', language)} {dropTarget.item}</h3>
                  <p>
                     {t('Choose how many carried items to drop.', language)} ({dropTarget.amount})
                  </p>
                  <label>
                     {t('Quantity', language)}: {dropAmount}
                     <input
                        type='range'
                        min={1}
                        max={dropTarget.amount}
                        value={dropAmount}
                        onChange={(event) =>
                           setDropAmount(Number(event.target.value))
                        }
                     />
                  </label>
                  <div className='modal-actions'>
                     <button
                        className='quiet-button'
                        type='button'
                        onClick={() => setDropTarget(null)}
                     >
                        {t('Cancel', language)}
                     </button>
                     <button
                        className='primary-button'
                        type='button'
                        onClick={dropItem}
                        disabled={saveEquipmentMutation.isPending}
                     >
                        <Trash2 size={15} /> {t('Drop items', language)}
                     </button>
                  </div>
               </section>
            </div>
         )}
      </div>
   )
}
