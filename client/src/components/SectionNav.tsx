import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

type NavSection = { id: string; label: string; element: HTMLElement }

// Keep in sync with the `.hero-tab-layout` rail media query in index.css.
const railBreakpoint = 1100

// Explicit targets win; otherwise every card (.overview-section) that isn't nested in another card.
const explicitSelector = '[data-nav-label]'
const cardSelector = '.overview-section'

// A card's label is its first heading without the rule-source tooltip inside it.
function headingLabel(element: HTMLElement) {
   const heading = element.querySelector('h2, h3, summary')
   if (!heading) return ''
   const clone = heading.cloneNode(true) as HTMLElement
   clone.querySelectorAll('.tooltip-wrapper, svg').forEach((node) => node.remove())
   return clone.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

function collectSections(scope: HTMLElement, idPrefix: string): NavSection[] {
   const explicit = [...scope.querySelectorAll<HTMLElement>(explicitSelector)]
   const cards = [...scope.querySelectorAll<HTMLElement>(cardSelector)].filter((card) =>
      !card.parentElement?.closest(cardSelector) && !card.querySelector(explicitSelector) && !card.closest(explicitSelector))
   const elements = [...explicit, ...cards].sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
   return elements.flatMap((element, index) => {
      const label = element.dataset.navLabel ?? headingLabel(element)
      if (!label) return []
      if (!element.id) element.id = `${idPrefix}-${index}`
      return [{ id: element.id, label, element }]
   })
}

// Quick links for a long page: a vertical rail beside the content on wide screens, a sticky chip row on smaller ones.
// The section at the top of the view is marked active while scrolling. Hidden with fewer than three sections.
export function SectionNav({ scopeRef, label, idPrefix }: { scopeRef: RefObject<HTMLElement | null>; label: string; idPrefix: string }) {
   const [sections, setSections] = useState<NavSection[]>([])
   const [activeId, setActiveId] = useState<string | null>(null)
   const navRef = useRef<HTMLElement>(null)
   const listRef = useRef<HTMLOListElement>(null)

   // Sections appear after data loads and change with the hero: rescan when the content changes.
   useEffect(() => {
      const scope = scopeRef.current
      if (!scope) return
      let frame = 0
      const scan = () => {
         cancelAnimationFrame(frame)
         frame = requestAnimationFrame(() => setSections((current) => {
            const next = collectSections(scope, idPrefix)
            const same = next.length === current.length && next.every((section, index) => section.id === current[index].id && section.label === current[index].label)
            return same ? current : next
         }))
      }
      scan()
      const observer = new MutationObserver(scan)
      observer.observe(scope, { childList: true, subtree: true, characterData: true })
      return () => { observer.disconnect(); cancelAnimationFrame(frame) }
   }, [scopeRef, idPrefix])

   // Active section: the last one whose top has passed the sticky bars; at the very end, the last one.
   const updateActive = useCallback(() => {
      if (!sections.length) return
      const offset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sticky-offset')) || 0
      // Below the rail breakpoint the chip row sticks under the tab bar and covers the content too.
      const chipRow = !window.matchMedia(`(min-width: ${railBreakpoint}px)`).matches
      const stickyBottom = offset + (chipRow ? navRef.current?.offsetHeight ?? 0 : 0) + 24
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      let current = sections[0].id
      for (const section of sections) if (section.element.getBoundingClientRect().top - stickyBottom <= 0) current = section.id
      setActiveId(atEnd ? sections[sections.length - 1].id : current)
   }, [sections])

   useEffect(() => {
      let frame = 0
      const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(updateActive) }
      onScroll()
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onScroll)
      return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(frame) }
   }, [updateActive])

   // Chip row: keep the active chip visible without moving the page.
   useEffect(() => {
      const list = listRef.current
      const chip = activeId ? list?.querySelector<HTMLElement>(`[data-target="${CSS.escape(activeId)}"]`) : null
      if (!list || !chip || list.scrollWidth <= list.clientWidth) return
      const left = chip.offsetLeft - list.clientWidth / 2 + chip.offsetWidth / 2
      list.scrollTo({ left, behavior: 'smooth' })
   }, [activeId])

   if (sections.length < 3) return null
   return <nav ref={navRef} className='section-nav' aria-label={label}>
      <ol ref={listRef}>
         {sections.map((section) => <li key={section.id}>
            <a href={`#${section.id}`} data-target={section.id} aria-current={section.id === activeId ? 'location' : undefined}
               onClick={(event) => {
                  event.preventDefault()
                  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
                  section.element.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
                  setActiveId(section.id)
                  // Keyboard users continue inside the section they jumped to.
                  if (!section.element.hasAttribute('tabindex')) section.element.setAttribute('tabindex', '-1')
                  section.element.focus({ preventScroll: true })
               }}>{section.label}</a>
         </li>)}
      </ol>
   </nav>
}
