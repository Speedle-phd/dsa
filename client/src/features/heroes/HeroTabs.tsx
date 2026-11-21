import { useQuery } from '@tanstack/react-query'
import { Backpack, BookOpen, FlaskConical, PawPrint, Skull, Sun, Swords, UserRound, WandSparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SectionNav } from '@/components/SectionNav'
import { useSearchParams } from 'react-router-dom'
import type { Hero } from './heroApi'
import { HeroOverview } from './HeroOverview'
import HeroEquipment from './HeroEquipment'
import { TalentsTab } from './TalentsTab'
import { HeroCombat } from './HeroCombat'
import { HeroArcana } from './HeroArcana'
import { HeroKarma } from './HeroKarma'
import { HeroCompanions } from './HeroCompanions'
import { HeroBestiary } from './HeroBestiary'
import { HeroAlchemy } from './HeroAlchemy'
import { t } from '@/locales/translation'
import { useLanguageStore } from '@/locales/languageStore'
import { useAdvancementMode } from './advancement'
import { getStatsForHero } from './statsApi'
import { hasArcana, hasKarma } from './heroCapabilities'

// Icons follow the tab's content; each tab keeps its own hue (data-hero-theme) as an accent.
const tabs = [
   { id: 'overview', label: 'Overview', Icon: UserRound },
   { id: 'talents', label: 'Talents', Icon: BookOpen },
   { id: 'combat', label: 'Combat', Icon: Swords },
   { id: 'equipment', label: 'Equipment', Icon: Backpack },
   { id: 'companions', label: 'Companions', Icon: PawPrint },
   { id: 'arcana', label: 'Arcana', Icon: WandSparkles },
   { id: 'karma', label: 'Divine works', Icon: Sun },
   { id: 'alchemy', label: 'Alchemy', Icon: FlaskConical },
   { id: 'bestiary', label: 'Bestiary', Icon: Skull },
] as const

export function HeroTabs({ hero }: { hero: Hero }) {
   const language = useLanguageStore((state) => state.language)
   const { spendAP } = useAdvancementMode(hero._id)
   const [searchParams, setSearchParams] = useSearchParams()
   // Arcane and divine tabs only for heroes who can use them; recorded spells or liturgies keep the tab visible
   const stats = useQuery({ queryKey: ['stats', hero._id], queryFn: () => getStatsForHero(hero._id) }).data
   const visibleTabs = tabs.filter((tab) => tab.id === 'arcana' ? Boolean(stats && hasArcana(stats))
      : tab.id === 'karma' ? Boolean(stats && hasKarma(stats)) : true)
   const [activeId, setActiveId] = useState<string>(() => searchParams.get('tab') ?? tabs[0].id)
   const activeTab = Math.max(0, visibleTabs.findIndex((tab) => tab.id === activeId))

   const selectTab = (nextTab: number) => {
      setActiveId(visibleTabs[nextTab].id)
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('tab', visibleTabs[nextTab].id)
      setSearchParams(nextParams)
   }

   function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
      let nextTab = activeTab
      if (event.key === 'ArrowRight') nextTab = (activeTab + 1) % visibleTabs.length
      if (event.key === 'ArrowLeft')
         nextTab = (activeTab - 1 + visibleTabs.length) % visibleTabs.length
      if (event.key === 'Home') nextTab = 0
      if (event.key === 'End') nextTab = visibleTabs.length - 1
      if (nextTab === activeTab) return

      event.preventDefault()
      selectTab(nextTab)
      document.getElementById(`hero-tab-${visibleTabs[nextTab].id}`)?.focus()
   }

   const active = visibleTabs[activeTab]

   // On narrow screens the tabs scroll sideways: fade the edge that hides more tabs, keep the active tab in view.
   const tablistRef = useRef<HTMLDivElement>(null)
   const [edges, setEdges] = useState({ start: false, end: false })
   const updateEdges = useCallback(() => {
      const list = tablistRef.current
      if (!list) return
      setEdges({ start: list.scrollLeft > 4, end: list.scrollLeft + list.clientWidth < list.scrollWidth - 4 })
   }, [])
   useEffect(() => {
      updateEdges()
      window.addEventListener('resize', updateEdges)
      return () => window.removeEventListener('resize', updateEdges)
   }, [updateEdges, visibleTabs.length])
   useEffect(() => {
      document.getElementById(`hero-tab-${active.id}`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
   }, [active.id])

   // Height of the sticky tab bar: section links and jump targets stop below it.
   const tabbarRef = useRef<HTMLDivElement>(null)
   const panelRef = useRef<HTMLDivElement>(null)
   useEffect(() => {
      const bar = tabbarRef.current
      if (!bar) return
      const root = document.documentElement
      const observer = new ResizeObserver(() => root.style.setProperty('--sticky-offset', `${bar.offsetHeight}px`))
      observer.observe(bar)
      return () => { observer.disconnect(); root.style.removeProperty('--sticky-offset') }
   }, [])

   return (
      <section className='hero-tabs-section' data-hero-theme={active.id}>
         <div ref={tabbarRef} className='hero-tabbar'>
            <div
               ref={tablistRef}
               className='hero-tablist'
               role='tablist'
               aria-label={t('Hero sheet sections', language)}
               data-more-start={edges.start || undefined}
               data-more-end={edges.end || undefined}
               onScroll={updateEdges}
            >
               {visibleTabs.map((tab, index) => (
                  <button
                     key={tab.id}
                     id={`hero-tab-${tab.id}`}
                     data-hero-theme={tab.id}
                     className={
                        index === activeTab ? 'hero-tab is-active' : 'hero-tab'
                     }
                     type='button'
                     role='tab'
                     aria-selected={index === activeTab}
                     aria-controls={`hero-panel-${tab.id}`}
                     tabIndex={index === activeTab ? 0 : -1}
                     onClick={() => selectTab(index)}
                     onKeyDown={handleKeyDown}
                  >
                     <tab.Icon size={16} aria-hidden='true' />
                     {t(tab.label, language)}
                  </button>
               ))}
            </div>
         </div>
         {!spendAP && ['overview', 'talents', 'combat', 'arcana'].includes(active.id) && <div className='advancement-toolbar' role='status'>
            <p>{t('AP unchanged: set or correct values, or advance for free. No automatic refunds.', language)}</p>
         </div>}
         <div className='hero-tab-layout'>
            <SectionNav key={active.id} scopeRef={panelRef} idPrefix={`${active.id}-section`} label={`${t('Jump to section', language)}: ${t(active.label, language)}`} />
            <div
               ref={panelRef}
               id={`hero-panel-${active.id}`}
               className='hero-tab-panel'
               lang={language}
               role='tabpanel'
               aria-labelledby={`hero-tab-${active.id}`}
               tabIndex={0}
            >
               {active.id === 'overview' ? (
                  <HeroOverview hero={hero} />
               ) : active.id === 'equipment' ? (
                  <HeroEquipment hero={hero} />
               ) : active.id === 'talents' ? (
                  <TalentsTab hero={hero} />
               ) : active.id === 'combat' ? (
                  <HeroCombat hero={hero} />
               ) : active.id === 'arcana' ? (
                  <HeroArcana hero={hero} />
               ) : active.id === 'karma' ? (
                  <HeroKarma hero={hero} />
               ) : active.id === 'alchemy' ? (
                  <HeroAlchemy hero={hero} />
               ) : active.id === 'bestiary' ? (
                  <HeroBestiary hero={hero} />
               ) : (
                  <HeroCompanions hero={hero} />
               )}
            </div>
         </div>
      </section>
   )
}
