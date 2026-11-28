import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Leaf } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { Party } from '@/features/parties/partyApi'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { assignHerbFind, dismissHerbFind, getHerbFinds, herbFindsKey, type HerbFind } from './herbApi'
import { frequencyLabels } from './herbSearchRules'

// Herb finds of general herb searches (AdK S. 278): the GM picks which plants a hero found, the app suggests the plants
// of the landscape by frequency (user decision, Nov 2026). Players see their own finds. Live via the 'herbs' topic.
export function HerbFindsPanel({ party }: { party: Party }) {
   const language = useLanguageStore((state) => state.language)
   const query = useQuery({ queryKey: herbFindsKey(party._id), queryFn: () => getHerbFinds(party._id) })
   const isGm = party.role === 'gm'
   if (query.isError) return <section className='overview-section'><p className='field-error'>{getErrorMessage(query.error)}</p>
      <button className='quiet-button' type='button' onClick={() => void query.refetch()}>{t('Try again', language)}</button></section>
   const finds = query.data ?? []
   const open = finds.filter((find) => find.status === 'open')
   const done = finds.filter((find) => find.status !== 'open').slice(0, 5)
   if (!finds.length && !isGm) return null
   return <section className='overview-section herb-finds' data-nav-label={t('Herb finds', language)}>
      <header className='section-heading'><Leaf size={19} aria-hidden='true' /><div><p className='eyebrow'>Archiv der Kräuter · AdK S. 278</p><h2>{t('Herb finds', language)}</h2></div></header>
      {!finds.length && <p className='party-muted'>{t('When a hero searches for anything useful, you choose here which plants were found.', language)}</p>}
      {open.map((find) => isGm ? <OpenFind key={find._id} party={party} find={find} />
         : <p key={find._id} className='party-muted'>{t('{hero} searched {landscape}: the GM is choosing the plants.', language).replace('{hero}', find.heroName).replace('{landscape}', find.landscape)}</p>)}
      {done.length > 0 && <ul className='herb-finds-done'>{done.map((find) => <li key={find._id}>
         <strong>{find.heroName}</strong> · {find.landscape} · {find.status === 'assigned' ? find.picks.join(', ') : t('Dismissed', language)}</li>)}</ul>}
   </section>
}

function OpenFind({ party, find }: { party: Party; find: HerbFind }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const [picks, setPicks] = useState<string[]>([])
   const mutation = useMutation({
      mutationFn: (action: () => Promise<HerbFind>) => action(),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: herbFindsKey(party._id) }),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   return <article className='herb-find'>
      <p><strong>{find.heroName}</strong> {t('searched {landscape} and found up to {count} kinds of plants (the smallest number of applications each).', language)
         .replace('{landscape}', find.landscape).replace('{count}', String(find.count))}</p>
      <ul className='herb-pick-list'>{find.suggestions.map((entry) => {
         const active = picks.includes(entry.key)
         return <li key={entry.key}><button type='button' aria-pressed={active} className={`probe-chip${active ? ' is-active' : ''}`}
            disabled={!active && picks.length >= find.count} title={entry.note ?? undefined}
            onClick={() => setPicks(active ? picks.filter((name) => name !== entry.key) : [...picks, entry.key])}>
            <strong lang='de'>{entry.key}</strong><small>{frequencyLabels[entry.frequency]}{entry.note ? ' *' : ''}</small></button></li>
      })}</ul>
      <p className='party-muted herb-pick-legend'>{t('* only under a condition (e.g. in caves); point at the plant for the remark.', language)}</p>
      <div className='modal-actions'>
         <button className='quiet-button' type='button' disabled={mutation.isPending} onClick={() => mutation.mutate(() => dismissHerbFind(party._id, find._id))}>{t('Nothing found', language)}</button>
         <button className='primary-button' type='button' disabled={!picks.length || mutation.isPending}
            onClick={() => mutation.mutate(() => assignHerbFind(party._id, find._id, picks))}><Leaf size={15} aria-hidden='true' />
            {t('Give {count} of {max}', language).replace('{count}', String(picks.length)).replace('{max}', String(find.count))}</button>
      </div>
   </article>
}
