import { useEffect } from 'react'
import { useLanguageStore } from '../locales/languageStore'
import { t } from '../locales/translation'

export function LanguageToggle() {
   const language = useLanguageStore((state) => state.language)
   const setLanguage = useLanguageStore((state) => state.setLanguage)

   useEffect(() => {
      document.documentElement.lang = language
      document.title = t('DSA5 Hero Sheets', language)
   }, [language])

   return (
      <div
         className='language-toggle'
         role='group'
         aria-label={t('Language', language)}
      >
         <button
            className={
               language === 'de'
                  ? 'language-button is-active'
                  : 'language-button'
            }
            type='button'
            onClick={() => setLanguage('de')}
            aria-pressed={language === 'de'}
            aria-label={t('Switch to German', language)}
         >
            DE
         </button>
         <button
            className={
               language === 'en'
                  ? 'language-button is-active'
                  : 'language-button'
            }
            type='button'
            onClick={() => setLanguage('en')}
            aria-pressed={language === 'en'}
            aria-label={t('Switch to English', language)}
         >
            EN
         </button>
      </div>
   )
}
