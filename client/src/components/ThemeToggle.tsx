import { Monitor, Moon, Sun } from 'lucide-react'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { themeOrder, useThemeStore } from '@/theme/themeStore'

const icons = { light: Sun, dark: Moon, system: Monitor }
const labels = { light: 'Light', dark: 'Dark', system: 'System' }

// One compact button: cycles Light → Dark → System; the label names the current and the next mode.
export function ThemeToggle() {
   const language = useLanguageStore((state) => state.language)
   const theme = useThemeStore((state) => state.theme)
   const setTheme = useThemeStore((state) => state.setTheme)
   const next = themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length]
   const Icon = icons[theme]
   const label = t('Theme: {current} (switch to {next})', language)
      .replace('{current}', t(labels[theme], language)).replace('{next}', t(labels[next], language))
   return <button type='button' className='header-control theme-toggle' aria-label={label} title={label} onClick={() => setTheme(next)}>
      <Icon size={17} aria-hidden='true' />
   </button>
}
