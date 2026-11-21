import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useLanguageStore } from '../locales/languageStore'
import { t } from '../locales/translation'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
   const { user, isRestoring } = useAuth()
   const language = useLanguageStore((state) => state.language)

   if (isRestoring) {
      return (
         <main className='app-loading'>
            {t('Opening your hero sheet...', language)}
         </main>
      )
   }

   return user ? children : <Navigate to='/login' replace />
}
