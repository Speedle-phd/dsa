import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { themeById, themeClasses, type ResolvedMode, type ThemeId } from './themes'

// 'system' follows the device between the default Light and Dark themes
export type ThemePreference = 'system' | ThemeId
export type ResolvedTheme = ResolvedMode

// Per-browser preference; `index.html` reads the same key before the first paint (no flash of the wrong theme).
export const useThemeStore = create<{ theme: ThemePreference; setTheme: (theme: ThemePreference) => void }>()(
   persist((set) => ({ theme: 'system', setTheme: (theme) => set({ theme }) }), { name: 'dsa5.theme' }),
)

const systemQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

// Applies the theme to <html> (class `dark` for dark themes, the theme's own class, native color-scheme) and follows the
// OS while set to "system". Returns light/dark for components that only need the mode (toasts).
export function useAppliedTheme(): ResolvedTheme {
   const preference = useThemeStore((state) => state.theme)
   const [systemDark, setSystemDark] = useState(() => systemQuery().matches)
   useEffect(() => {
      const query = systemQuery()
      const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
      query.addEventListener('change', onChange)
      return () => query.removeEventListener('change', onChange)
   }, [])
   const theme = themeById(preference === 'system' ? (systemDark ? 'dark' : 'light') : preference)
   useEffect(() => {
      const root = document.documentElement
      root.classList.toggle('dark', theme.mode === 'dark')
      root.classList.remove(...themeClasses)
      if (theme.className) root.classList.add(theme.className)
      root.style.colorScheme = theme.mode
   }, [theme])
   return theme.mode
}
