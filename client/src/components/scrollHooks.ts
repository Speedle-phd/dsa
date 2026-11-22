import { useEffect, useState } from 'react'

// True while the page scrolls down (away from the top and the end), so floating buttons can step aside.
export function useScrollingDown() {
   const [down, setDown] = useState(false)
   useEffect(() => {
      let last = window.scrollY
      const onScroll = () => {
         const y = window.scrollY
         const atEnd = y + window.innerHeight >= document.documentElement.scrollHeight - 8
         if (Math.abs(y - last) < 8 && !atEnd) return
         setDown(y > last && y > 80 && !atEnd)
         last = y
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      return () => window.removeEventListener('scroll', onScroll)
   }, [])
   return down
}

// True once the page is scrolled further than the threshold (in px, or a function of the viewport height).
export function useScrolledPast(threshold: number | ((viewportHeight: number) => number)) {
   const [past, setPast] = useState(false)
   useEffect(() => {
      const limit = () => (typeof threshold === 'function' ? threshold(window.innerHeight) : threshold)
      const update = () => setPast(window.scrollY > limit())
      update()
      window.addEventListener('scroll', update, { passive: true })
      window.addEventListener('resize', update)
      return () => {
         window.removeEventListener('scroll', update)
         window.removeEventListener('resize', update)
      }
   }, [threshold])
   return past
}
