import { t } from '@/locales/translation'
import type { EntrySuggestion } from './characterEntryApi'

const romans = ['I', 'II', 'III', 'IV', 'V']

// The free-text subject field; it keeps the height of its neighbours in a row of fields
export function DetailInput({ value, onChange, hasSuggestions, disabled, language }: {
   value: string; onChange: (value: string) => void; hasSuggestions: boolean; disabled?: boolean; language: 'de' | 'en'
}) {
   return <input value={value} maxLength={100} required disabled={disabled}
      placeholder={hasSuggestions ? t('Pick a suggestion or type your own', language) : undefined} onChange={(event) => onChange(event.target.value)} />
}

// The book's examples as chips below the fields: a click fills the subject (and the level, if the book gives one)
export function SuggestionChips({ suggestions, value, onPick, disabled, language }: {
   suggestions: EntrySuggestion[]; value: string; onPick: (suggestion: EntrySuggestion) => void; disabled?: boolean; language: 'de' | 'en'
}) {
   if (!suggestions.length) return null
   return <div className='suggestion-chips' role='group' aria-label={t('Suggestions', language)}>
      <span>{t('Suggestions', language)}:</span>
      {suggestions.map((suggestion) => {
         const picked = suggestion.value === value.trim()
         return <button key={suggestion.label ?? suggestion.value} type='button' className={picked ? 'is-active' : ''} aria-pressed={picked} disabled={disabled}
            onClick={() => onPick(suggestion)}>
            {suggestion.label ?? suggestion.value}{suggestion.level ? <small>{romans[suggestion.level - 1]}</small> : null}
         </button>
      })}
   </div>
}
