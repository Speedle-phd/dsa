import { AlertTriangle, Plus, Swords, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { getAttributeAbbreviation } from '@/features/heroes/talentCatalog'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import type { CombatAbilityDefinition, StepProps } from './creationApi'
import { issueText, talentName } from './creationLabels'

// Kampfsonderfertigkeiten bought besides the profession package (S. 51–55); the server prices and checks them
export function CombatAbilitiesStep({ data, ledger, reference, update }: StepProps) {
   const language = useLanguageStore((state) => state.language)
   const [selected, setSelected] = useState('')
   const bought = data.combatAbilities ?? []
   const owned = new Set([...ledger.granted.combatSpecialAbilities, ...bought])
   const options = reference.combatAbilities.filter((ability) => !owned.has(ability.key))
   const ability = options.find((item) => item.key === selected)
   const add = () => {
      if (!ability) return
      update({ combatAbilities: [...bought, ability.key] })
      setSelected('')
   }
   const remove = (key: string) => update({ combatAbilities: bought.filter((item) => item !== key) })

   return <section className='creation-step creation-combat' aria-labelledby='creation-combat-title'>
      <h3 id='creation-combat-title'><Swords size={17} /> {t('Combat special abilities', language)}</h3>
      {ledger.granted.combatSpecialAbilities.length > 0 && <p className='fight-note'>{t('Granted', language)}: <span lang='de'>{ledger.granted.combatSpecialAbilities.join(', ')}</span></p>}
      <div className='creation-entry-form'>
         <div className='creation-row-fields'>
            <label className='field-group'>
               <span>{t('Combat special ability', language)}</span>
               <select value={selected} onChange={(event) => setSelected(event.target.value)}>
                  <option value=''>{t('Choose an entry', language)}</option>
                  {options.map((item) => <option key={item.key} value={item.key}>{item.key} · {item.ap} {t('AP', language)}</option>)}
               </select>
            </label>
         </div>
         {ability && ability.requirements.length > 0 && <p className='fight-note'>{t('Prerequisites', language)}: {requirementText(ability, language)} ({t('S.', language)} 54–55)</p>}
         <button className='quiet-button' type='button' disabled={!ability} onClick={add}><Plus size={16} />{t('Add', language)}</button>
      </div>
      {ledger.combatAbilities.length > 0 && <ul className='creation-list'>
         {ledger.combatAbilities.map((row) => {
            const issues = ledger.violations.filter((issue) => issue.key === `combat:${row.key}`)
            return <li key={row.key} className={issues.length ? 'is-problem' : ''}>
               <span><strong lang='de'>{row.key}</strong>
                  {issues.map((issue, index) => <small key={index} className='creation-problem'><AlertTriangle size={13} /> {issueText(issue, language)}</small>)}</span>
               <span className='creation-ap'>{row.ap} {t('AP', language)}</span>
               <button className='icon-button' type='button' aria-label={`${t('Remove', language)}: ${row.key}`} onClick={() => remove(row.key)}><Trash2 size={15} /></button>
            </li>
         })}
      </ul>}
   </section>
}

function requirementText(ability: CombatAbilityDefinition, language: 'de' | 'en') {
   return ability.requirements.map((requirement) => 'attribute' in requirement ? `${getAttributeAbbreviation(requirement.attribute, language)} ${requirement.minimum}`
      : 'talent' in requirement ? `${talentName(requirement.talent, language)} ${requirement.minimum}` : requirement.ability).join(', ')
}
