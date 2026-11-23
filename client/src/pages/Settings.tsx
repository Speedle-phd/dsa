import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Settings as SettingsIcon } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardHeader } from '@/components/DashboardHeader'
import { useDiceSettings } from '@/components/diceSettings'
import { useThemeStore, type ThemePreference } from '@/theme/themeStore'
import { themes } from '@/theme/themes'
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

// Theme choices (user decision, Nov 2026); saved in this browser like the header menu
const themeHints: Record<string, string> = {
   light: 'Light green, the default.', dark: 'Dark green.', parchment: 'Warm parchment with ink and deep red.', ember: 'Charcoal and dark wood with ember orange.',
}
const themeChoices: Array<{ id: ThemePreference; label: string; hint: string; swatch: readonly string[] | null }> = [
   { id: 'system', label: 'Same as device', hint: 'Light or Dark, as your device is set.', swatch: null },
   ...themes.map((theme) => ({ id: theme.id, label: theme.label, hint: themeHints[theme.id] ?? '', swatch: theme.swatch })),
]

export function Settings() {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const query = useQuery({ queryKey: ['settings'], queryFn: getSettings })
   const theme = useThemeStore((state) => state.theme)
   const setTheme = useThemeStore((state) => state.setTheme)
   const quick = useDiceSettings((state) => state.quick)
   const setQuick = useDiceSettings((state) => state.setQuick)
   const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
         <section className='overview-section'>
            <header className='section-heading'><h2>{t('Theme', language)}</h2></header>
            <fieldset className='settings-options'>
               <legend className='sr-only'>{t('Theme', language)}</legend>
               {themeChoices.map(({ id, label, hint, swatch }) => <label key={id} className='settings-option'>
                  <input type='radio' name='theme' value={id} checked={theme === id} onChange={() => setTheme(id)} />
                  <span><strong className='settings-theme-label'>{swatch && <span className='theme-swatch' aria-hidden='true'>
                     {swatch.map((color) => <span key={color} style={{ background: color }} />)}</span>}{t(label, language)}</strong>
                     <small>{t(hint, language)}</small></span>
               </label>)}
            </fieldset>
         </section>
         <section className='overview-section'>
            <header className='section-heading'><h2>{t('Dice', language)}</h2></header>
            <label className='settings-option'>
               <input type='checkbox' checked={quick || reducedMotion} disabled={reducedMotion} onChange={(event) => setQuick(event.target.checked)} />
               <span><strong>{t('Quick rolls', language)}</strong>
                  <small>{t(reducedMotion ? 'Your system asks for reduced motion, so dice roll without animation.' : 'Roll instantly without the 3D dice animation. Saved in this browser.', language)}</small></span>
            </label>
         </section>
      </section>
   </main>
}
