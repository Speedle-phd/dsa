import { Check, Monitor, Moon, Palette, Sun } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { useThemeStore, type ThemePreference } from '@/theme/themeStore'
import { themes } from '@/theme/themes'

const options: Array<{ id: ThemePreference; label: string; swatch: readonly string[] | null }> = [
   { id: 'system', label: 'Same as device', swatch: null },
   ...themes.map((theme) => ({ id: theme.id, label: theme.label, swatch: theme.swatch })),
]

// Theme menu in the header (user decision, Nov 2026): every theme with a colour preview, plus "Same as device".
// Menu button pattern: arrow keys, Home/End, Escape returns focus to the button.
export function ThemeToggle() {
   const language = useLanguageStore((state) => state.language)
   const theme = useThemeStore((state) => state.theme)
   const setTheme = useThemeStore((state) => state.setTheme)
   const [open, setOpen] = useState(false)
   const buttonRef = useRef<HTMLButtonElement>(null)
   const menuRef = useRef<HTMLDivElement>(null)
   const menuId = useId()
   const current = options.find((option) => option.id === theme) ?? options[0]
   const label = t('Theme: {current}', language).replace('{current}', t(current.label, language))

   const items = () => [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [])]
   useEffect(() => {
      if (!open) return
      items().find((item) => item.getAttribute('aria-checked') === 'true')?.focus()
      const close = (event: MouseEvent) => {
         if (!menuRef.current?.contains(event.target as Node) && !buttonRef.current?.contains(event.target as Node)) setOpen(false)
      }
      document.addEventListener('mousedown', close)
      return () => document.removeEventListener('mousedown', close)
   }, [open])

   function onMenuKey(event: KeyboardEvent<HTMLDivElement>) {
      const list = items()
      const index = list.indexOf(document.activeElement as HTMLButtonElement)
      const move = (to: number) => { event.preventDefault(); list[(to + list.length) % list.length]?.focus() }
      if (event.key === 'ArrowDown') move(index + 1)
      else if (event.key === 'ArrowUp') move(index - 1)
      else if (event.key === 'Home') move(0)
      else if (event.key === 'End') move(list.length - 1)
      else if (event.key === 'Escape') { event.preventDefault(); setOpen(false); buttonRef.current?.focus() }
      else if (event.key === 'Tab') setOpen(false)
   }
   function choose(id: ThemePreference) {
      setTheme(id)
      setOpen(false)
      buttonRef.current?.focus()
   }

   return <div className='theme-menu-wrap'>
      <button ref={buttonRef} type='button' className='header-control theme-toggle' aria-label={label} title={label}
         aria-haspopup='menu' aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={() => setOpen(!open)}
         onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true) } }}>
         {theme === 'system' ? <Monitor size={17} aria-hidden='true' /> : theme === 'light' ? <Sun size={17} aria-hidden='true' />
            : theme === 'dark' ? <Moon size={17} aria-hidden='true' /> : <Palette size={17} aria-hidden='true' />}
      </button>
      {open && <div ref={menuRef} id={menuId} className='theme-menu' role='menu' aria-label={t('Theme', language)} onKeyDown={onMenuKey}>
         {options.map((option) => <button key={option.id} type='button' role='menuitemradio' aria-checked={option.id === theme} tabIndex={-1}
            className='theme-menu-item' onClick={() => choose(option.id)}>
            {option.swatch ? <span className='theme-swatch' aria-hidden='true'>
               {option.swatch.map((color) => <span key={color} style={{ background: color }} />)}
            </span> : <span className='theme-swatch is-device' aria-hidden='true'><Monitor size={15} /></span>}
            <span>{t(option.label, language)}</span>
            {option.id === theme && <Check size={16} aria-hidden='true' className='theme-menu-check' />}
         </button>)}
      </div>}
   </div>
}
