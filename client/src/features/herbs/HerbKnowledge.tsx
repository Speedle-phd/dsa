import { Leaf } from 'lucide-react'
import { useState } from 'react'
import { useBookContext } from '@/features/books/bookApi'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { useHerbReference } from './herbApi'

// "Was weiß mein Held über …?" (AdK S. 9): after a successful Pflanzenkunde check the hero knows the facts of the
// plant up to the QS reached (QS 1, 2, 3+). Only with Archiv der Kräuter switched on.
export function HerbKnowledge({ statsId, quality }: { statsId: string; quality: number }) {
   const language = useLanguageStore((state) => state.language)
   const adk = useBookContext(statsId).data?.rules.adk ?? false
   const reference = useHerbReference(adk)
   const [plant, setPlant] = useState('')
   if (!adk || !reference.data) return null
   const herb = reference.data.herbs.find((entry) => entry.key === plant) ?? null
   const known = herb?.summary?.knowledge.slice(0, Math.min(3, quality)) ?? []
   return <section className='probe-asp herb-knowledge-check'>
      <label className='field-group'><span><Leaf size={15} aria-hidden='true' /> {t('What does the hero know about …? (AdK)', language)}</span>
         <select value={plant} onChange={(event) => setPlant(event.target.value)}>
            <option value=''>{t('Choose a plant', language)}</option>
            {reference.data.herbs.map((entry) => <option key={entry.key} value={entry.key}>{entry.key}</option>)}
         </select></label>
      {herb && (known.length ? <ol className='herb-knowledge'>{known.map((entry, index) =>
         <li key={index}><strong>QS {index === 2 ? '3+' : index + 1}</strong> {entry[language]}</li>)}</ol>
         : <p className='combat-note'>{t('Summary to come: see AdK S. {page}.', language).replace('{page}', String(herb.page))}</p>)}
   </section>
}
