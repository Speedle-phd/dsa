import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'

// Connected right now (live presence); colour plus an accessible name, so it does not rely on colour alone
export function OnlineDot({ online }: { online: boolean }) {
   const language = useLanguageStore((state) => state.language)
   const label = t(online ? 'online' : 'offline', language)
   return <span className={online ? 'online-dot is-online' : 'online-dot'} role='img' aria-label={label} title={label} />
}
