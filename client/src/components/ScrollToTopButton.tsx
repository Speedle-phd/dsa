import { ArrowUp } from 'lucide-react'
import { useLanguageStore } from '../locales/languageStore'
import { t } from '../locales/translation'
import { useScrolledPast, useScrollingDown } from './scrollHooks'

// Shown once the page is scrolled more than one screen (at least 400 px)
const threshold = (viewportHeight: number) => Math.max(400, viewportHeight)

export function ScrollToTopButton() {
   const language = useLanguageStore((state) => state.language)
   const visible = useScrolledPast(threshold)
   // On phones it steps aside while scrolling down, like the dice launcher (CSS, ≤ 760 px)
   const scrollingDown = useScrollingDown()
   if (!visible) return null

   function toTop() {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
      // The button disappears at the top: continue keyboard navigation from the start of the page
      const main = document.querySelector<HTMLElement>('main')
      if (main) {
         if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1')
         main.focus({ preventScroll: true })
      }
   }

   const label = t('Back to top', language)
   return <button type='button' className={scrollingDown ? 'scroll-top-button is-tucked' : 'scroll-top-button'}
      aria-label={label} title={label} onClick={toTop}>
      <ArrowUp size={20} aria-hidden='true' />
   </button>
}
