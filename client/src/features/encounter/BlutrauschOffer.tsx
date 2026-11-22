import { useQuery } from '@tanstack/react-query'
import { useSettings } from '@/features/heroes/fightHelpers'
import { useFightStore } from '@/features/heroes/fightStore'
import { getStatsForHero } from '@/features/heroes/statsApi'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'

// source: DSA5 Regelwerk, S. 171 (Blutrausch: triggered when an attack causes a level of Schmerz). In a party fight the
// server applies the hit and reports the raised Schmerz; the status is offered, never set automatically.
export function BlutrauschOffer({ heroId }: { heroId: string }) {
   const language = useLanguageStore((state) => state.language)
   const offer = useFightStore((state) => state.fights[heroId]?.rageOffer ?? null)
   const stats = useQuery({ queryKey: ['stats', heroId], queryFn: () => getStatsForHero(heroId), enabled: offer !== null }).data
   if (!offer || !stats) return null
   const dismiss = () => useFightStore.getState().update(heroId, { rageOffer: null })
   if (!stats.disadvantages.includes('Blutrausch') || stats.statuses.includes('Blutrausch')) return null
   return <BlutrauschPrompt stats={stats} language={language} onDone={dismiss} />
}

function BlutrauschPrompt({ stats, language, onDone }: { stats: NonNullable<Parameters<typeof useSettings>[0]>; language: 'de' | 'en'; onDone: () => void }) {
   const settings = useSettings(stats)
   return <div className='fight-confirm' role='alertdialog' aria-label='Blutrausch'>
      <p>{t('This hit caused Schmerz: the disadvantage Blutrausch triggers the status Blutrausch (S. 171).', language)}</p>
      <button className='quiet-button' type='button' onClick={onDone}>{t('Not now', language)}</button>
      <button className='primary-button' type='button' disabled={settings.isPending}
         onClick={() => settings.mutate({ statuses: [...stats.statuses, 'Blutrausch'] }, { onSuccess: onDone })}>{t('Set Blutrausch', language)}</button>
   </div>
}
