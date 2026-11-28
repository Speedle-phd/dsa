import { DashboardHeader } from '@/components/DashboardHeader'
import { Tooltip } from '@/components/Tooltip'
import { useHeroStore } from '@/features/heroes/heroStore'
import { carriedEquipmentWeight } from '@/features/heroes/equipmentOptions'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { getStatsForHero, type Stats } from '@/features/heroes/statsApi'
import { StorePurchaseDialog, type StoreSelection } from '@/features/store/StorePurchaseDialog'
import { MarketRatePanel } from '@/features/store/MarketRatePanel'
import { aventurianStore, type AventurianStoreItem } from '@/utils/aventurian_store'
import { useBookContext } from '@/features/books/bookApi'
import { useHerbReference } from '@/features/herbs/herbApi'
import { adkStoreCategory, adkStoreItems } from '@/features/herbs/herbStore'
import { useQuery } from '@tanstack/react-query'
import {
   ArrowLeft,
   Axe,
   Backpack,
   BookOpen,
   Box,
   BriefcaseBusiness,
   Caravan,
   Coins,
   Compass,
   FlaskConical,
   HandPlatter,
   Store,
   HeartPulse,
   Info,
   Lamp,
   Leaf,
   LockKeyhole,
   PackageOpen,
   PawPrint,
   Search,
   Shield,
   Shirt,
   Skull,
   Sparkles,
   Sword,
   Wheat,
   Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { PageHeading } from '@/components/PageHeading'
import { SectionNav } from '@/components/SectionNav'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getItemDetails, getItemInfo } from '@/utils/storeDisplay'
import { priceLabel } from '@/utils/storePricing'
import { formatKreuzer } from '@/features/services/servicesApi'

type CurrencyPurse = Stats['purse']

// source: DSA5 Regelwerk, S. 364
const purseToKreuzer = (purse: CurrencyPurse) =>
   purse.dukaten * 1000 +
   purse.silbertaler * 100 +
   purse.heller * 10 +
   purse.kreuzer


const categoryIcons: Record<string, LucideIcon> = {
   [adkStoreCategory]: Leaf,
   Traveling_and_Tools: Wrench,
   Sources_of_Light: Lamp,
   Refills_and_Accessories: PackageOpen,
   Bandages_and_Remedies: HeartPulse,
   Containers: Box,
   Ropes_and_Climbing: Axe,
   Thieves_Tools: LockKeyhole,
   Tool_Collections: BriefcaseBusiness,
   Orientation_Aids: Compass,
   Melee_Weapons: Sword,
   Ranged_Weapons: Sword,
   Ammunition: PackageOpen,
   Shields: Shield,
   Armor: Shirt,
   Equipment_Packages: Backpack,
   Clothing: Shirt,
   Weapon_Accessories: Sword,
   Writing_Supplies: BriefcaseBusiness,
   Gemstones: Coins,
   Jewelry: Coins,
   Musical_Instruments: BriefcaseBusiness,
   Luxury_and_Leisure: PackageOpen,
   Animal_Equipment: Backpack,
   Alchimica: FlaskConical,
   Poisons: Skull,
   Healing_Herbs: Leaf,
   Books: BookOpen,
   Magic_Artifacts: Sparkles,
   Animals: PawPrint,
   Animal_Feed: Wheat,
   Vehicles: Caravan,
}

export const AdventurianStore = () => {
   const language = useLanguageStore((state) => state.language)
   const { hero, storeFilters, setStoreFilters, resetStoreFilters, marketRate } =
      useHeroStore()
   const [searchParams, setSearchParams] = useSearchParams()
   const [selectedItem, setSelectedItem] = useState<StoreSelection | null>(null)
   const catalogRef = useRef<HTMLDivElement>(null)

   const selectedCategory =
      searchParams.get('category') ?? storeFilters.category ?? 'all'
   const searchTerm = searchParams.get('q') ?? storeFilters.query ?? ''
   const debouncedSearchTerm = useDebouncedValue(searchTerm)

   const statsQuery = useQuery({
      queryKey: ['stats', hero?._id],
      queryFn: () => getStatsForHero(hero!._id),
      enabled: Boolean(hero),
   })

   // With Archiv der Kräuter switched on (party or hero), its plants replace the core herbs (same plants, more data)
   const adk = useBookContext(statsQuery.data?._id).data?.rules.adk ?? false
   const herbReference = useHerbReference(adk)
   const catalog = useMemo<Record<string, AventurianStoreItem[]>>(() => {
      if (!adk || !herbReference.data) return aventurianStore
      const rest = Object.fromEntries(Object.entries(aventurianStore).filter(([name]) => name !== 'Healing_Herbs'))
      return { ...rest, [adkStoreCategory]: adkStoreItems(herbReference.data.herbs) }
   }, [adk, herbReference.data])
   const categoryNames = Object.keys(catalog)

   const categories = useMemo(() => {
      return Object.keys(catalog).map((categoryName) => ({
         name: categoryName,
         items: (catalog[categoryName] ?? []).filter((item) => {
            const normalizedQuery = debouncedSearchTerm.trim().toLowerCase()
            const matchesQuery = [item.name, t(item.name, language)].some(
               (name) => name.toLowerCase().includes(normalizedQuery),
            )
            const matchesCategory =
               selectedCategory === 'all' || categoryName === selectedCategory
            return matchesQuery && matchesCategory
         }),
      }))
   }, [catalog, debouncedSearchTerm, language, selectedCategory])

   if (!hero) {
      return <Navigate to='/dashboard' replace />
   }

   const applyFilterState = (nextQuery: string, nextCategory: string) => {
      const nextParams = new URLSearchParams(searchParams)

      if (nextQuery.trim()) {
         nextParams.set('q', nextQuery.trim())
      } else {
         nextParams.delete('q')
      }

      if (nextCategory !== 'all') {
         nextParams.set('category', nextCategory)
      } else {
         nextParams.delete('category')
      }

      setSearchParams(nextParams)
      setStoreFilters({ query: nextQuery.trim(), category: nextCategory })
   }

   const purseAmount = statsQuery.data
      ? purseToKreuzer(statsQuery.data.purse)
      : 0
   const totalEquipmentWeight = carriedEquipmentWeight(statsQuery.data?.equipment ?? [])

   return (
      <main className='dashboard-shell' lang={language}>
         <DashboardHeader />
         <section className='dashboard-content'>
            <Link
               className='back-link'
               to={`/heroes/${hero._id}?tab=equipment`}
            >
               <ArrowLeft size={17} /> {hero.name}
            </Link>

            <PageHeading Icon={Store} title={t('Adventurian Store', language)}
               description={t('Buy gear and equip it without breaking your purse.', language)}>
               <Link className='quiet-button' to='/services'>
                  <HandPlatter size={16} /> {t('Services', language)}
               </Link>
            </PageHeading>

            <div className='panel-grid'>
               <div className='state-panel'>
                  <div className='resource-label'>
                     <span>{t('Available purse', language)}</span>
                     <strong>{formatKreuzer(purseAmount)}</strong>
                  </div>
                  <small>
                     {statsQuery.data?.purse
                        ? `${statsQuery.data.purse.dukaten}D / ${statsQuery.data.purse.silbertaler}S / ${statsQuery.data.purse.heller}H / ${statsQuery.data.purse.kreuzer}K`
                        : t('No stats loaded yet', language)}
                  </small>
               </div>
               <div className='state-panel'>
                  <div className='resource-label'>
                     <span>{t('Equipment weight', language)}</span>
                     <strong>{totalEquipmentWeight.toFixed(1)} s</strong>
                  </div>
                  <small>
                     {statsQuery.data?.carryingCapacity
                        ? `${t('Carry limit', language)}: ${statsQuery.data.carryingCapacity} s`
                        : t('Carry limit unavailable', language)}
                  </small>
               </div>
               {statsQuery.data && <MarketRatePanel stats={statsQuery.data} />}
            </div>

            <div className='state-panel toolbar-panel'>
               <div className='toolbar-row'>
                  <label className='search-field search-field--wide'>
                     <Search size={16} />
                     <input
                        type='text'
                        value={searchTerm}
                        placeholder={t('Search gear...', language)}
                        aria-label={t('Search gear...', language)}
                        onChange={(event) =>
                           applyFilterState(
                              event.target.value,
                              selectedCategory,
                           )
                        }
                     />
                  </label>

                  <select
                     value={selectedCategory}
                     aria-label={t('Filter by category', language)}
                     onChange={(event) =>
                        applyFilterState(searchTerm, event.target.value)
                     }
                  >
                     <option value='all'>
                        {t('All categories', language)}
                     </option>
                     {categoryNames.map((categoryName) => (
                        <option key={categoryName} value={categoryName}>
                           {t(categoryName.replace(/_/g, ' '), language)}
                        </option>
                     ))}
                  </select>

                  <button
                     type='button'
                     className='quiet-button'
                     onClick={() => {
                        resetStoreFilters()
                        setSearchParams({})
                     }}
                  >
                     {t('Reset', language)}
                  </button>
               </div>
            </div>

            <div className='section-layout'>
            <SectionNav scopeRef={catalogRef} idPrefix='store-category' label={t('Jump to section', language)} />
            <div ref={catalogRef} className='store-catalog'>
            {categories
               .filter((section) => section.items.length > 0)
               .map((section) => (
                  <section key={section.name} className='store-section' data-nav-label={t(section.name.replace(/_/g, ' '), language)}>
                     <header className='section-heading'>
                        {(() => {
                           const CategoryIcon = categoryIcons[section.name]
                           return CategoryIcon ? (
                              <CategoryIcon size={18} />
                           ) : null
                        })()}
                        <div>
                           <p className='eyebrow'>
                              {t('Category', language)}
                           </p>
                           <h2>
                              {t(section.name.replace(/_/g, ' '), language)}
                           </h2>
                        </div>
                     </header>

                     <div className='store-grid'>
                        {section.items.map((item, index) => (
                           <button
                              key={`${section.name}-${item.name}-${index}`}
                              type='button'
                              className='store-card'
                              onClick={() =>
                                 setSelectedItem({
                                    ...item,
                                    category: section.name,
                                 })
                              }
                           >
                              <div className='store-card-header'>
                                 <strong lang={language}>
                                    {t(item.name, language)}
                                 </strong>
                                 <span className='store-card-weight'>
                                    {item.weight} s
                                    {getItemInfo(item, language) && (
                                       <Tooltip
                                          content={getItemInfo(item, language)}
                                          clickToToggle
                                          className='tooltip-icon-wrapper'
                                          lang={language}
                                       >
                                          <Info
                                             size={17}
                                             aria-label={t(
                                                'Description available',
                                                language,
                                             )}
                                          />
                                       </Tooltip>
                                    )}
                                 </span>
                              </div>
                              {item.kind && (
                                 <small className='store-item-kind'>
                                    {t(item.kind, language)}
                                 </small>
                              )}
                              {item.kind === 'bundle' && item.contents && (
                                 <small className='store-item-details'>
                                    {item.contents.length}{' '}
                                    {t('included item types', language)} ·{' '}
                                    {t('preview before purchase', language)}
                                 </small>
                              )}
                              {getItemDetails(item, language).length > 0 && (
                                 <small className='store-item-details'>
                                    {getItemDetails(item, language).join(' · ')}
                                 </small>
                              )}
                              {item.kind === 'elixir' && (
                                 <span className='store-quality-pips' aria-label={t('Available in QS 1–6', language)}>
                                    {[1, 2, 3, 4, 5, 6].map((quality) => <i key={quality} aria-hidden='true' />)}
                                    <small>{t('QS', language)} 1–6</small>
                                 </span>
                              )}
                              <div className='store-card-meta'>
                                 <Coins size={14} />
                                 <span>{priceLabel(item, language, item.priceVaries ? 0 : marketRate)}</span>
                              </div>
                           </button>
                        ))}
                     </div>
                  </section>
               ))}
            </div>
            </div>

            {selectedItem && statsQuery.data && (
               <StorePurchaseDialog
                  item={selectedItem}
                  stats={statsQuery.data}
                  heroId={hero._id}
                  onClose={() => setSelectedItem(null)}
               />
            )}
         </section>
      </main>
   )
}
