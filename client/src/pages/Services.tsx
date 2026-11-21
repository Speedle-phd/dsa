import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BedDouble, Hammer, HandPlatter, PackagePlus, ScrollText, Stethoscope } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { DashboardHeader } from '@/components/DashboardHeader'
import { PageHeading } from '@/components/PageHeading'
import { useHeroStore } from '@/features/heroes/heroStore'
import { getStatsForHero, type Stats } from '@/features/heroes/statsApi'
import { ConditionBadge, WeaponRepairButton } from '@/features/heroes/WeaponRepair'
import { InnMenu, ServiceCard } from '@/features/services/ServiceCards'
import { formatKreuzer, getServiceReference, purseKreuzer, type Service, type ServiceGroup } from '@/features/services/servicesApi'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { equipmentDisplayName } from '@/utils/storePricing'

type Tab = { id: string; label: string; hint: string; icon: LucideIcon; groups: Array<[ServiceGroup, string]> }

// source: DSA5 Regelwerk, S. 381–382 (Dienstleistungen)
const tabs: Tab[] = [
   { id: 'medicus', label: 'Medicus', hint: 'Treatment, surgery, bathhouse and alchemist', icon: Stethoscope,
      groups: [['medicus', 'At the Medicus'], ['bathhouse', 'At the bathhouse'], ['alchemist', 'At the alchemist']] },
   { id: 'smithy', label: 'Smithy', hint: 'Horseshoes and weapon repairs', icon: Hammer, groups: [['smithy', 'At the smithy']] },
   { id: 'inn', label: 'Guesthouse', hint: 'Drinks, meals and a bed for the night', icon: BedDouble,
      groups: [['drinks', 'Drinks'], ['food', 'Food'], ['lodging', 'Lodging per night'], ['inn', 'Other services']] },
   { id: 'more', label: 'More services', hint: 'Scriptorium, travel and more', icon: ScrollText,
      groups: [['scriptorium', 'At the scriptorium'], ['travel', 'Travel and transport (per person)'], ['misc', 'Miscellaneous']] },
]

export function Services() {
   const language = useLanguageStore((state) => state.language)
   const { hero } = useHeroStore()
   const [searchParams, setSearchParams] = useSearchParams()
   const statsQuery = useQuery({ queryKey: ['stats', hero?._id], queryFn: () => getStatsForHero(hero!._id), enabled: Boolean(hero) })
   const referenceQuery = useQuery({ queryKey: ['service-reference'], queryFn: getServiceReference, staleTime: Infinity })
   if (!hero) return <Navigate to='/dashboard' replace />

   const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.id === searchParams.get('tab')))
   const active = tabs[activeIndex]
   const select = (index: number) => {
      setSearchParams({ tab: tabs[index].id }, { replace: true })
      document.getElementById(`service-tab-${tabs[index].id}`)?.focus()
   }
   const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      const next = { ArrowRight: activeIndex + 1, ArrowLeft: activeIndex - 1, Home: 0, End: tabs.length - 1 }[event.key]
      if (next === undefined) return
      event.preventDefault()
      select((next + tabs.length) % tabs.length)
   }
   const stats = statsQuery.data
   const services = referenceQuery.data ?? []

   return <main className='dashboard-shell' lang={language}>
      <DashboardHeader />
      <section className='dashboard-content'>
         <Link className='back-link' to={`/heroes/${hero._id}?tab=equipment`}><ArrowLeft size={17} /> {hero.name}</Link>
         <PageHeading Icon={HandPlatter} title={t('Services', language)}
            description={t('Pay the Medicus, the smith or the innkeeper. Prices as in the rulebook (S. 381–382).', language)}>
            <Link className='quiet-button' to='/store'><PackagePlus size={16} /> {t('Store', language)}</Link>
         </PageHeading>
         <div className='panel-grid'>
            <div className='state-panel'>
               <div className='resource-label'><span>{t('Available purse', language)}</span>
                  <strong>{stats ? formatKreuzer(purseKreuzer(stats.purse)) : '—'}</strong></div>
               <small>{stats ? `${stats.purse.dukaten}D / ${stats.purse.silbertaler}S / ${stats.purse.heller}H / ${stats.purse.kreuzer}K` : t('No stats loaded yet', language)}</small>
            </div>
            <div className='state-panel'>
               <div className='resource-label'><span>{t('Health', language)}</span>
                  <strong>{stats ? `${stats.health.current} / ${stats.health.max}` : '—'}</strong></div>
               <small>{t('LeP', language)}{stats?.pain ? ` · ${t('Pain', language)} ${stats.pain}` : ''}</small>
            </div>
         </div>

         <div className='service-tablist' role='tablist' aria-label={t('Services', language)}>
            {tabs.map((tab, index) => {
               const Icon = tab.icon
               return <button key={tab.id} id={`service-tab-${tab.id}`} type='button' role='tab' aria-selected={index === activeIndex}
                  aria-controls={`service-panel-${tab.id}`} tabIndex={index === activeIndex ? 0 : -1}
                  className={`service-tab${index === activeIndex ? ' is-active' : ''}`} onClick={() => select(index)} onKeyDown={onKeyDown}>
                  <Icon size={22} aria-hidden='true' />
                  <span><strong>{t(tab.label, language)}</strong><small>{t(tab.hint, language)}</small></span>
               </button>
            })}
         </div>

         <div id={`service-panel-${active.id}`} className='service-panel' role='tabpanel' aria-labelledby={`service-tab-${active.id}`} tabIndex={0}>
            {!stats || referenceQuery.isPending ? <p>{t('Loading...', language)}</p>
               : referenceQuery.isError ? <p role='alert'>{t('Services are unavailable.', language)}</p>
                  : active.id === 'inn' ? <InnMenu services={services} stats={stats} groups={active.groups} />
                     : <>
                        {active.groups.map(([group, title]) => <ServiceGroupSection key={group} title={title}
                           services={services.filter((service) => service.group === group)} stats={stats} />)}
                        {active.id === 'smithy' && <DamagedWeapons stats={stats} />}
                     </>}
         </div>
      </section>
   </main>
}

function ServiceGroupSection({ title, services, stats }: { title: string; services: Service[]; stats: Stats }) {
   const language = useLanguageStore((state) => state.language)
   return <section className='service-section'>
      <h2>{t(title, language)}</h2>
      <div className='service-grid'>{services.map((service) => <ServiceCard key={service.key} service={service} stats={stats} />)}</div>
   </section>
}

// The core rules give no repair price: the smith names it (see WeaponRepair).
function DamagedWeapons({ stats }: { stats: Stats }) {
   const language = useLanguageStore((state) => state.language)
   const damaged = stats.equipment.map((entry, index) => ({ entry, index })).filter(({ entry }) => entry.condition)
   return <section className='service-section'>
      <h2>{t('Weapon repairs', language)}</h2>
      {damaged.length === 0 ? <p className='service-note'>{t('No damaged weapons: nothing to repair.', language)}</p>
         : <div className='service-grid'>{damaged.map(({ entry, index }) => <article key={`${entry.item}-${index}`} className='service-card'>
            <header><strong>{equipmentDisplayName(entry.item, language)}</strong><ConditionBadge condition={entry.condition} /></header>
            <p className='service-note'>{t('The core rules give no repair price: the smith names it.', language)}</p>
            <footer><WeaponRepairButton stats={stats} entry={entry} index={index} labeled /></footer>
         </article>)}</div>}
   </section>
}
