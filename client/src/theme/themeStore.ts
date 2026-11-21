import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

// Per-browser preference; `index.html` reads the same key before the first paint (no light flash in dark mode).
export const useThemeStore = create<{ theme: ThemePreference; setTheme: (theme: ThemePreference) => void }>()(
   persist((set) => ({ theme: 'system', setTheme: (theme) => set({ theme }) }), { name: 'dsa5.theme' }),
)

export const themeOrder: ThemePreference[] = ['light', 'dark', 'system']

const systemQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

// Applies the theme to <html> (class `dark`, native color-scheme) and follows the OS while set to "system".
export function useAppliedTheme(): ResolvedTheme {
   const theme = useThemeStore((state) => state.theme)
   const [systemDark, setSystemDark] = useState(() => systemQuery().matches)
   useEffect(() => {
      const query = systemQuery()
      const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
      query.addEventListener('change', onChange)
      return () => query.removeEventListener('change', onChange)
   }, [])
   const resolved: ResolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme
   useEffect(() => {
      const root = document.documentElement
      root.classList.toggle('dark', resolved === 'dark')
      root.style.colorScheme = resolved
   }, [resolved])
   return resolved
}
