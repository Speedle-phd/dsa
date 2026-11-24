import { WifiOff } from 'lucide-react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { connectionState, subscribeConnection } from './socket'

// Shown after 2 s without the live connection (user request, Nov 2026); a short blip stays silent.
// RealtimeBridge refetches everything on screen when the connection is back.
export function ConnectionBanner() {
   const { user } = useAuth()
   const language = useLanguageStore((state) => state.language)
   const state = useSyncExternalStore(subscribeConnection, connectionState)
   const [visible, setVisible] = useState(false)

   useEffect(() => {
      if (state !== 'offline') return
      const timer = window.setTimeout(() => setVisible(true), 2000)
      return () => {
         window.clearTimeout(timer)
         setVisible(false)
      }
   }, [state])

   return <div className='connection-banner' role='status' lang={language}>
      {user && state === 'offline' && visible && <span><WifiOff size={16} aria-hidden='true' />{t('Live updates paused – reconnecting…', language)}</span>}
   </div>
}
