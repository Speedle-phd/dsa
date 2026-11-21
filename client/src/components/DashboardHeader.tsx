import { HandPlatter, LogOut, Sparkles, Store, UserRound, UsersRound, type LucideIcon } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { LanguageToggle } from '@/components/LanguageToggle'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { APToggle } from '@/features/heroes/AdvancementControls'
import { useHeroStore } from '@/features/heroes/heroStore'

type DashboardHeaderProps = {
   onLogout?: () => void
   heroId?: string
}

export function DashboardHeader({ onLogout, heroId }: DashboardHeaderProps) {
   const language = useLanguageStore((state) => state.language)
   // Store and services work for the hero last opened; offer them once there is one.
   const hero = useHeroStore((state) => state.hero)
   const links: Array<{ to: string; label: string; Icon: LucideIcon; end?: boolean }> = [
      { to: '/dashboard', label: t('Heroes', language), Icon: UsersRound, end: true },
      ...hero ? [
         { to: `/heroes/${hero._id}`, label: hero.name, Icon: UserRound },
         { to: '/store', label: t('Store', language), Icon: Store },
         { to: '/services', label: t('Services', language), Icon: HandPlatter },
      ] : [],
   ]

   return (
      <header className='dashboard-header'>
         <Link className='dashboard-brand' to='/dashboard'>
            <span className='brand-tile' aria-hidden='true'><Sparkles size={16} /></span>
            <span>{t('DSA5 Hero Sheet', language)}</span>
         </Link>
         {/* A single link (no hero opened yet) would only repeat the page: no bar then. */}
         {links.length > 1 && <nav className='header-nav' aria-label={t('Main navigation', language)}>
            {links.map(({ to, label, Icon, end }) => <NavLink key={to} to={to} end={end} title={label}
               className={({ isActive }) => isActive ? 'header-nav-link is-active' : 'header-nav-link'}>
               <Icon size={16} aria-hidden='true' /><span>{label}</span>
            </NavLink>)}
         </nav>}
         <div className='header-actions'>
            {heroId && <APToggle heroId={heroId} />}
            <LanguageToggle />
            <ThemeToggle />
            {onLogout && (
               <button
                  className='quiet-button'
                  type='button'
                  onClick={onLogout}
               >
                  <LogOut size={17} /> {t('Sign out', language)}
               </button>
            )}
         </div>
      </header>
   )
}
