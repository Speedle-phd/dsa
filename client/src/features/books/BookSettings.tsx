import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, CalendarDays } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { getHeroes } from '@/features/heroes/heroApi'
import { useHeroStore } from '@/features/heroes/heroStore'
import { getStatsForHero } from '@/features/heroes/statsApi'
import { partyKey, type Party } from '@/features/parties/partyApi'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { calendarMonths, daysInMonth, formatAventurianDate, fromAventurianDate, toAventurianDate } from './aventurianCalendar'
import { bookContextKey, updateBookSettings, updatePartyCalendar, updatePartyRules, useBookContext, type CalendarAction } from './bookApi'
import { bookRuleInfo, bookRuleKeys, type BookRules } from './bookRules'

type Props = {
   // e.g. the hero picker in the settings, shown under the heading
   picker?: ReactNode
   rules: BookRules
   calendarDay: number | null
   editable: boolean
   pending: boolean
   note?: string
   onRules: (change: Partial<BookRules>) => void
   onCalendar: (change: CalendarAction) => void
}

// Book rules and in-game date (user decisions, Nov 2026): the GM sets both for the party; a hero without a party
// sets its own. Rules the app does not apply yet are shown but cannot be switched on.
function BookSettingsCard({ picker, rules, calendarDay, editable, pending, note, onRules, onCalendar }: Props) {
   const language = useLanguageStore((state) => state.language)
   return <section className='overview-section book-settings'>
      <header className='section-heading'><BookOpen size={19} aria-hidden='true' /><div><p className='eyebrow'>{t('Game world', language)}</p><h2>{t('Date and book rules', language)}</h2></div></header>
      {picker}
      {note && <p className='party-muted'>{note}</p>}
      <CalendarControl key={calendarDay ?? 'none'} calendarDay={calendarDay} editable={editable} pending={pending} onCalendar={onCalendar} />
      <div className='book-rules'>
         <h3>{t('Book rules', language)}</h3>
         {bookRuleKeys.map((key) => {
            const info = bookRuleInfo[key]
            const blockedBy = info.requires && !rules[info.requires] ? bookRuleInfo[info.requires].label : null
            return <label key={key} className='regen-toggle'>
               <input type='checkbox' checked={rules[key]} disabled={!editable || pending || !info.available || blockedBy !== null}
                  onChange={(event) => onRules({ [key]: event.target.checked })} />
               <span><strong lang='de'>{info.label}</strong>
                  <small>{[info.level ? `${t('Fokusregel', language)} ${info.level === 1 ? 'I' : 'II'}` : '', info.page ? `AdK S. ${info.page}` : '',
                     t(info.hint, language)].filter(Boolean).join(' · ')}</small>
                  {!info.available ? <small>{t('Not built yet.', language)}</small> : blockedBy && <small>{t('Needs {rule}.', language).replace('{rule}', blockedBy)}</small>}
               </span>
            </label>
         })}
      </div>
   </section>
}

function CalendarControl({ calendarDay, editable, pending, onCalendar }: Pick<Props, 'calendarDay' | 'editable' | 'pending' | 'onCalendar'>) {
   const language = useLanguageStore((state) => state.language)
   const current = calendarDay === null ? null : toAventurianDate(calendarDay)
   const [draft, setDraft] = useState({ day: String(current?.day ?? ''), month: current?.month ?? 0, year: String(current?.year ?? '') })
   const dayNumber = fromAventurianDate({ year: Number(draft.year), month: draft.month, day: Number(draft.day) })
   const steps: Array<[number, string]> = [[-1, '−1 day'], [1, '+1 day'], [7, '+1 week'], [30, '+1 month']]
   return <div className='book-calendar'>
      <p className='book-calendar-today'><CalendarDays size={18} aria-hidden='true' />
         <strong>{calendarDay === null ? t('No date set', language) : formatAventurianDate(calendarDay, language)}</strong></p>
      {editable && <>
         {calendarDay !== null && <div className='book-calendar-steps' role='group' aria-label={t('Advance the date', language)}>
            {steps.map(([days, label]) => <button key={days} className='quiet-button' type='button' disabled={pending}
               onClick={() => onCalendar({ action: 'advance', days })}>{t(label, language)}</button>)}
         </div>}
         <form className='book-calendar-set' onSubmit={(event) => { event.preventDefault(); if (dayNumber !== null) onCalendar({ action: 'set', day: dayNumber }) }}>
            <label className='field-group'><span>{t('Day', language)}</span>
               <input type='number' inputMode='numeric' min={1} max={daysInMonth(draft.month)} value={draft.day} onChange={(event) => setDraft({ ...draft, day: event.target.value })} /></label>
            <label className='field-group'><span>{t('Month', language)}</span>
               <select value={draft.month} onChange={(event) => setDraft({ ...draft, month: Number(event.target.value) })}>
                  {calendarMonths.map((month, index) => <option key={month} value={index}>{month}</option>)}
               </select></label>
            <label className='field-group'><span>{t('Year (BF)', language)}</span>
               <input type='number' inputMode='numeric' min={0} value={draft.year} onChange={(event) => setDraft({ ...draft, year: event.target.value })} /></label>
            <button className='primary-button' type='submit' disabled={pending || dayNumber === null}>{t('Set date', language)}</button>
         </form>
      </>}
   </div>
}

// The GM's card on the party page; members see the same values read-only
export function PartyBookSettings({ party }: { party: Party }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const isGm = party.role === 'gm'
   const mutation = useMutation({
      mutationFn: (action: () => Promise<Party>) => action(),
      onSuccess: (next) => queryClient.setQueryData(partyKey(party._id), next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   return <BookSettingsCard rules={party.rules} calendarDay={party.calendarDay} editable={isGm && party.status === 'active'} pending={mutation.isPending}
      note={isGm ? t('These apply to every hero of the party.', language) : t('The GM sets the date and the book rules.', language)}
      onRules={(change) => mutation.mutate(() => updatePartyRules(party._id, change))}
      onCalendar={(change) => mutation.mutate(() => updatePartyCalendar(party._id, change))} />
}

// A hero's card (settings page): its own values without a party, the party's (read-only) while it plays in one
export function HeroBookSettings({ statsId, picker }: { statsId: string; picker?: ReactNode }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const context = useBookContext(statsId)
   const mutation = useMutation({
      mutationFn: (change: Parameters<typeof updateBookSettings>[1]) => updateBookSettings(statsId, change),
      onSuccess: (next) => queryClient.setQueryData(bookContextKey(statsId), next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   if (context.isError) return <p className='field-error'>{getErrorMessage(context.error)}</p>
   if (!context.data) return null
   const data = context.data
   return <BookSettingsCard picker={picker} rules={data.rules} calendarDay={data.calendarDay} editable={data.source === 'hero'} pending={mutation.isPending}
      note={data.party ? t('Set by the GM of {party}.', language).replace('{party}', data.party.name) : t('This hero plays without a party: you set the date and the book rules.', language)}
      onRules={(rules) => mutation.mutate({ rules })} onCalendar={(calendar) => mutation.mutate({ calendar })} />
}

// Settings page: date and book rules of one of the user's heroes (user request, Nov 2026: in the settings, per hero).
// Starts with the active hero; a hero in a party shows the party's values read-only.
export function HeroBookSettingsPicker() {
   const language = useLanguageStore((state) => state.language)
   const activeHero = useHeroStore((state) => state.hero)
   const heroes = useQuery({ queryKey: ['heroes'], queryFn: getHeroes })
   const [chosen, setChosen] = useState('')
   const list = heroes.data ?? []
   const charId = list.some((hero) => hero._id === chosen) ? chosen : list.find((hero) => hero._id === activeHero?._id)?._id ?? list[0]?._id
   const stats = useQuery({ queryKey: ['stats', charId], queryFn: () => getStatsForHero(charId ?? ''), enabled: Boolean(charId) })
   if (heroes.isError) return <p className='field-error'>{getErrorMessage(heroes.error)}</p>
   if (heroes.data && !list.length) return <section className='overview-section'><header className='section-heading'><h2>{t('Date and book rules', language)}</h2></header>
      <p className='party-muted'>{t('Create a hero first: date and book rules belong to a hero or its party.', language)}</p></section>
   if (!charId || !stats.data) return null
   const picker = list.length > 1 ? <label className='field-group book-hero-picker'><span>{t('Hero', language)}</span>
      <select value={charId} onChange={(event) => setChosen(event.target.value)}>
         {list.map((hero) => <option key={hero._id} value={hero._id}>{hero.name}</option>)}
      </select></label> : <p className='book-hero-picker'><strong>{list[0].name}</strong></p>
   return <HeroBookSettings key={stats.data._id} statsId={stats.data._id} picker={picker} />
}
