import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { DashboardHeader } from '../components/DashboardHeader'
import { HeroTabs } from '../features/heroes/HeroTabs'
import { ActiveEffectsStrip } from '../features/heroes/ActiveEffectsStrip'
import { FightQuicklink } from '@/features/encounter/FightQuicklink'
import { getHero } from '../features/heroes/heroApi'
import { useHeroStore } from '@/features/heroes/heroStore'
import { useEffect } from 'react'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'

// Up to two initials for the avatar tile ("Alrike von Grauenfels" → "AG").
function initials(name: string) {
   const words = name.split(/[\s-]+/).filter((word) => /^\p{Lu}/u.test(word))
   return (words.length ? [words[0], words[words.length - 1]] : [name]).map((word) => word[0]).join('').slice(0, 2).toUpperCase()
}

export function HeroPage() {
   const { heroId = '' } = useParams()
   const { setHero } = useHeroStore()
   const language = useLanguageStore((state) => state.language)
   const heroQuery = useQuery({
      queryKey: ['heroes', heroId],
      queryFn: () => getHero(heroId),
      enabled: Boolean(heroId),
   })
   useEffect(() => {
      if (heroQuery.data) {
         setHero(heroQuery.data)
      }
   }, [heroQuery.data, setHero])

   return (
      <main className='dashboard-shell' lang={language}>
         <DashboardHeader heroId={heroQuery.data?._id} />
         <section className='dashboard-content hero-page-content'>
            <Link className='back-link' to='/dashboard'>
               <ArrowLeft size={17} /> {t('All heroes', language)}
            </Link>
            {heroQuery.isPending && (
               <div className='state-panel'>
                  {t('Opening hero sheet...', language)}
               </div>
            )}
            {heroQuery.isError && (
               <div className='state-panel'>
                  <p>
                     {t('We could not open this hero sheet.', language)}
                  </p>
                  <Link className='quiet-button' to='/dashboard'>
                     {t('Return to heroes', language)}
                  </Link>
               </div>
            )}
            {heroQuery.data && (
               <>
                  <header className='hero-page-heading'>
                     <span className='hero-avatar' aria-hidden='true'>{initials(heroQuery.data.name)}</span>
                     <div>
                        <p className='eyebrow'>
                           {heroQuery.data.culture} {heroQuery.data.species}
                        </p>
                        <h1>{heroQuery.data.name}</h1>
                        <p>
                           {heroQuery.data.placeOfOrigin
                              ? t('{title} from {origin}', language)
                                 .replace('{title}', heroQuery.data.title || heroQuery.data.profession)
                                 .replace('{origin}', heroQuery.data.placeOfOrigin)
                              : heroQuery.data.title || heroQuery.data.profession}
                        </p>
                     </div>
                     <span
                        className={`hero-page-status status-${heroQuery.data.status}`}
                     >
                        {t(heroQuery.data.status, language)}
                     </span>
                  </header>
                  <ActiveEffectsStrip heroId={heroQuery.data._id} />
                  <HeroTabs hero={heroQuery.data} />
                  <FightQuicklink heroId={heroQuery.data._id} />
               </>
            )}
         </section>
      </main>
   )
}
