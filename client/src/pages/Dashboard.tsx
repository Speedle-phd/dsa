import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthContext'
import { DashboardHeader } from '../components/DashboardHeader'
import { HeroRegistry } from '../features/heroes/HeroRegistry'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'

export function Dashboard() {
   const { logout, user } = useAuth()
   const navigate = useNavigate()
   const language = useLanguageStore((state) => state.language)

   function handleLogout() {
      logout()
      toast.success(t('You have left the hero registry', language))
      navigate('/login', { replace: true })
   }

   return (
      <main className='dashboard-shell' lang={language}>
         <DashboardHeader onLogout={handleLogout} />
         <section className='dashboard-content'>
            <p className='eyebrow'>
               {t('Welcome', language)}, {user?.username}
            </p>
            <HeroRegistry />
         </section>
      </main>
   )
}
