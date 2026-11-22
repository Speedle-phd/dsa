import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Settings as SettingsIcon } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardHeader } from '@/components/DashboardHeader'
import { PageHeading } from '@/components/PageHeading'
import { getSettings, updateSettings, type Visibility } from '@/features/parties/partyApi'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'

const options: Array<[Visibility, string, string]> = [
   ['private', 'Name only', 'Other players see only the hero\'s name.'],
   ['summary', 'Summary (LeP, statuses)', 'Name, species, profession, energy bars, pain, statuses and conditions.'],
   ['full', 'Full sheet', 'Everything above plus the read-only character sheet.'],
]

export function Settings() {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const query = useQuery({ queryKey: ['settings'], queryFn: getSettings })
   const mutation = useMutation({
      mutationFn: updateSettings,
      onSuccess: (settings) => {
         queryClient.setQueryData(['settings'], settings)
         toast.success(t('Settings saved.', language))
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   return <main className='dashboard-shell' lang={language}>
      <DashboardHeader />
      <section className='dashboard-content'>
         <PageHeading Icon={SettingsIcon} title={t('Settings', language)} />
         <section className='overview-section'>
            <header className='section-heading'><h2>{t('Privacy in parties', language)}</h2></header>
            <p className='party-muted'>{t('What other players see of a hero that joins a party. The game master always sees everything. You can change it per hero in the party.', language)}</p>
            {query.isError && <p className='field-error'>{t('We could not load your settings.', language)}</p>}
            {query.data && <fieldset className='settings-options'>
               <legend className='sr-only'>{t('Default visibility', language)}</legend>
               {options.map(([value, label, hint]) => <label key={value} className='settings-option'>
                  <input type='radio' name='visibility' value={value} checked={query.data.defaultPartyVisibility === value}
                     disabled={mutation.isPending} onChange={() => mutation.mutate({ defaultPartyVisibility: value })} />
                  <span><strong>{t(label, language)}</strong><small>{t(hint, language)}</small></span>
               </label>)}
            </fieldset>}
         </section>
      </section>
   </main>
}
