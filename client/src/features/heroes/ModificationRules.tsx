import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { modificationLabel, modificationSteps, ritualModifications } from './magicRules'

// Regelhinweis: Zauber- und Ritualmodifikationen (S. 255–256, 260–261, 285).
// `available`: modifications this caster may use for the spell (one per full 4 FW); omitted in the general reference.
export function ModificationRules({ ritual, available }: { ritual: boolean; available?: number }) {
   const language = useLanguageStore((state) => state.language)
   const steps = modificationSteps[ritual ? 'ritual' : 'spell']
   const effects: Record<string, string> = {
      force: 'Costs one step higher, check +1 (not for every spell).',
      cheaper: 'Costs one step lower, check −1 (not for every spell).',
      range: 'Range one step higher, check −1.',
      longer: ritual ? 'Ritual duration one step longer, check +1.' : 'Casting time one step longer, check +1.',
      shorter: ritual ? 'Ritual duration one step shorter, check −1.' : 'Casting time one step shorter, check −1.',
   }
   return <details className='arcana-disclosure probe-rule-note'>
      <summary>{t(ritual ? 'Rule note: ritual modifications' : 'Rule note: spell modifications', language)} <small>{t('S.', language)} {ritual ? '260–261' : '255–256'}</small></summary>
      <p>{t('One modification per full 4 FW (FW 4: 1, FW 8: 2, FW 12: 3 …).', language)}
         {available !== undefined && ` ${t('Available here: {count}.', language).replace('{count}', String(available))}`}</p>
      <ul>
         {ritualModifications.map((entry) => <li key={entry.key}><strong lang='de'>{modificationLabel(entry.key, ritual)}</strong>: {t(effects[entry.key], language)}</li>)}
         {!ritual && <li><strong lang='de'>Geste oder Formel weglassen</strong>: {t('check −2 each.', language)}</li>}
      </ul>
      <div className='table-scroll'><table className='talent-table reference-table reference-table-compact probe-rule-steps'>
         <caption>{t('Steps', language)} ({t('S.', language)} {steps.page})</caption>
         <tbody>{steps.rows.map(([label, values]) => <tr key={label}><th scope='row' lang='de'>{label}</th>
            {values.map((value) => <td key={value} lang='de'>{value}</td>)}</tr>)}</tbody>
      </table></div>
      <ul>
         <li>{t('Each category moves at most one step; each modification can be chosen only once, but they can be combined.', language)}</li>
         <li>{t('Range can never be lowered, and not raised for range “selbst”.', language)}</li>
         <li>{t('Sustaining costs one step below the casting cost per interval, never below 1 AsP; lowering the cost lowers both.', language)}</li>
         <li>{t('Foreign-tradition spells and rituals cannot be modified; with the matching Merkmalskenntnis they can (S. 285).', language)}</li>
         {ritual ? <li>{t('Gestures and formulas of a ritual cannot be left out.', language)}</li>
            : <li>{t('Touch: touching the clothes is enough, or the bound tradition artifact.', language)}</li>}
         <li>{t('Curses and Elfenlieder cannot be modified.', language)}</li>
      </ul>
   </details>
}
