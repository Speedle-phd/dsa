import { Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Hero } from './heroApi'
import { t } from '@/locales/translation'
import { useLanguageStore } from '@/locales/languageStore'

type HeroCardProps = {
   hero: Hero
   onEdit: (hero: Hero) => void
   onDelete: (hero: Hero) => void
}

export function HeroCard({ hero, onEdit, onDelete }: HeroCardProps) {
   const navigate = useNavigate()
   const language = useLanguageStore((state) => state.language)
   const statusLabel = {
      active: t('Active', language),
      retired: t('Retired', language),
      deceased: t('Deceased', language),
   }[hero.status]

   return (
      <article className='hero-card'>
         <div className='hero-card-top'>
            <span className={`status-dot status-${hero.status}`} />
            <span className={`hero-status status-${hero.status}`}>
               {statusLabel}
            </span>
            <div className='hero-card-actions'>
               <button
                  className='icon-button'
                  type='button'
                  onClick={() => onEdit(hero)}
                  aria-label={`${t('Edit', language)} ${hero.name}`}
               >
                  <Pencil size={17} />
               </button>
               <button
                  className='icon-button danger-icon'
                  type='button'
                  onClick={() => onDelete(hero)}
                  aria-label={`${t('Delete', language)} ${hero.name}`}
               >
                  <Trash2 size={17} />
               </button>
            </div>
         </div>
         <button
            className='hero-card-content'
            type='button'
            onClick={() => navigate(`/heroes/${hero._id}`)}
            aria-label={`${t('Open hero sheet', language)}: ${hero.name}`}
         >
            <h2>{hero.name}</h2>
            <p className='hero-title'>{hero.title || hero.profession}</p>
            <dl className='hero-details'>
               <div>
                  <dt>{t('Culture', language)}</dt>
                  <dd>{hero.culture}</dd>
               </div>
               <div>
                  <dt>{t('Age', language)}</dt>
                  <dd>{hero.age} {t('years', language)}</dd>
               </div>
               <div>
                  <dt>{t('Species', language)}</dt>
                  <dd>{hero.species}</dd>
               </div>
               <div>
                  <dt>{t('Origin', language)}</dt>
                  <dd>{hero.placeOfOrigin || t('Unknown', language)}</dd>
               </div>
               <div>
                  <dt>{t('Standing', language)}</dt>
                  <dd>{hero.socialStatus}</dd>
               </div>
            </dl>
         </button>
      </article>
   )
}
