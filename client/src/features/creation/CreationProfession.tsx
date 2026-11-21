import { talentDetails } from '@/features/heroes/talentDetails'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { resolvedProfession, usualFor, type ProfessionDefinition, type StepProps } from './creationApi'
import { talentName } from './creationLabels'

const groups: Array<[ProfessionDefinition['group'], string]> = [['worldly', 'Worldly professions'], ['magic', 'Caster professions'], ['divine', 'Priest professions']]

// Schritt 6: Profession (S. 44–45, 127–160). The package is bought as a whole; prerequisites are paid separately (S. 128).
export function ProfessionStep({ data, ledger, reference, update }: StepProps) {
   const language = useLanguageStore((state) => state.language)
   const culture = reference.cultures.find((entry) => entry.key === data.culture)
   const current = data.profession
   const chosen = current.kind === 'package' ? reference.professions.find((entry) => entry.key === current.key) : undefined
   const resolved = chosen && current.kind === 'package' ? resolvedProfession(chosen, current.variant) : null
   const set = (change: Partial<Extract<typeof current, { kind: 'package' }>>) =>
      current.kind === 'package' && update({ profession: { ...current, ...change } })
   const pick = (key: string) => update({ profession: key ? { kind: 'package', key, variant: null, choices: [], application: '', tricks: [] } : { kind: 'none' } })

   return <section className='creation-step'>
      <p className='creation-intro'>{t('A Professionspaket is bought as a whole for its AP. Talents add to the culture package; you can raise or lower every value later in the skills step (S. 45). Prerequisites such as advantages are bought separately (S. 128).', language)}</p>
      <div className='probe-segmented'>
         <button type='button' aria-pressed={current.kind !== 'custom'} className={current.kind !== 'custom' ? 'is-active' : ''} onClick={() => current.kind === 'custom' && update({ profession: { kind: 'none' } })}>
            {t('From the rulebook', language)}</button>
         <button type='button' aria-pressed={current.kind === 'custom'} className={current.kind === 'custom' ? 'is-active' : ''} onClick={() => update({ profession: { kind: 'custom', name: '' } })}>
            {t('Own profession', language)}</button>
      </div>
      {current.kind === 'custom' ? <>
         <p className='fight-note'>{t('Build it yourself in the next steps; an own profession needs the GM’s approval (S. 45).', language)}</p>
         <label className='field-group'><span>{t('Profession', language)}</span>
            <input value={current.name} maxLength={80} placeholder={t('e.g. Söldner', language)} onChange={(event) => update({ profession: { kind: 'custom', name: event.target.value } })} /></label>
      </> : <>
         <label className='field-group'>
            <span>{t('Profession', language)}</span>
            <select value={chosen?.key ?? ''} onChange={(event) => pick(event.target.value)}>
               <option value=''>{t('Choose a profession', language)}</option>
               {groups.map(([group, label]) => {
                  const list = reference.professions.filter((entry) => entry.group === group)
                  return list.length > 0 && <optgroup key={group} label={t(label, language)}>
                     {list.map((entry) => <option key={entry.key} value={entry.key}>
                        {entry.key} · {entry.ap} {t('AP', language)}{usualFor(culture, entry) ? '' : ` · ${t('unusual', language)}`}</option>)}
                  </optgroup>
               })}
            </select>
         </label>
         {chosen && resolved && current.kind === 'package' && <>
            {chosen.variants.length > 0 && <label className='field-group'>
               <span>{t('Variant', language)}</span>
               <select value={current.variant ?? ''} onChange={(event) => set({ variant: event.target.value || null, choices: [] })}>
                  <option value=''>{chosen.key} · {chosen.ap} {t('AP', language)}</option>
                  {chosen.variants.map((variant) => <option key={variant.key} value={variant.key}>{variant.key} · {variant.ap} {t('AP', language)}</option>)}
               </select>
            </label>}
            {resolved.variant?.note && <p className='fight-note'>{t(resolved.variant.note, language)}</p>}
            {resolved.choices.map((slot, index) => {
               const picked = current.choices[index] ?? []
               return <fieldset key={index} className='probe-difficulty creation-choice'>
                  <legend>{t('Choose {count} combat technique(s) at {value}', language).replace('{count}', String(slot.count)).replace('{value}', String(slot.value))}</legend>
                  <div className='probe-check-row'>
                     {slot.options.map((key) => <label key={key}><input type='checkbox' checked={picked.includes(key)}
                        disabled={!picked.includes(key) && picked.length >= slot.count}
                        onChange={(event) => {
                           const next = event.target.checked ? [...picked, key] : picked.filter((item) => item !== key)
                           const choices = [...current.choices]
                           choices[index] = next
                           set({ choices })
                        }} />{t(key, language)}</label>)}
                  </div>
               </fieldset>
            })}
            {resolved.tricks && <fieldset className='probe-difficulty creation-choice'>
               <legend>{t('Choose {count} Zaubertrick(s) from the package', language).replace('{count}', String(resolved.tricks.count))}</legend>
               <div className='probe-check-row'>
                  {resolved.tricks.options.map((key) => {
                     const picked = current.tricks ?? []
                     return <label key={key}><input type='checkbox' checked={picked.includes(key)} disabled={!picked.includes(key) && picked.length >= resolved.tricks!.count}
                        onChange={(event) => set({ tricks: event.target.checked ? [...picked, key] : picked.filter((item) => item !== key) })} />{key}</label>
                  })}
               </div>
            </fieldset>}
            {resolved.specialization && <label className='field-group'>
               <span>{t('Fertigkeitsspezialisierung', language)}: {talentName(resolved.specialization, language)}</span>
               {talentDetails[resolved.specialization]?.applications.length
                  ? <select value={current.application} onChange={(event) => set({ application: event.target.value })}>
                     <option value=''>{t('Choose an application', language)}</option>
                     {talentDetails[resolved.specialization].applications.map((application) => <option key={application} value={application}>{application}</option>)}
                  </select>
                  : <input value={current.application} maxLength={80} onChange={(event) => set({ application: event.target.value })} />}
            </label>}
            <dl className='creation-package-summary'>
               <div><dt>{t('Price', language)}</dt><dd>{resolved.ap} {t('AP', language)} · {t('S.', language)} {chosen.page}</dd></div>
               {(chosen.requiredAdvantages?.length || chosen.requiredSpecies?.length || chosen.requiredAbilities?.length || chosen.requiredDisadvantages?.length) &&
                  <div><dt>{t('Prerequisites (paid separately)', language)}</dt>
                  <dd lang='de'>{[...chosen.requiredSpecies ?? [], ...chosen.requiredAdvantages ?? [], ...chosen.requiredAbilities ?? [],
                     ...(chosen.requiredDisadvantages ?? []).map((item) => `${item.key} ${['I', 'II', 'III', 'IV'][item.level - 1]}`)].join(', ')}</dd></div>}
               <div><dt>{t('Special abilities', language)}</dt>
                  <dd lang='de'>{[...resolved.combatAbilities, ...resolved.abilities,
                     ...(resolved.specialization ? [`Fertigkeitsspezialisierung (${talentName(resolved.specialization, language)})`] : [])].join(', ') || '—'}
                     {chosen.languageBudget > 0 && ` · ${t(chosen.budgetIncludesScripts ? 'Languages and scripts for {ap} AP' : 'Languages for {ap} AP', language).replace('{ap}', String(chosen.languageBudget))}`}</dd></div>
               <div><dt>{t('Combat techniques', language)}</dt>
                  <dd>{Object.entries(resolved.techniques).map(([key, value]) => `${t(key, language)} ${value}`).join(', ') || '—'}</dd></div>
               {Object.keys(resolved.spells).length > 0 && <div><dt>{t('Spells', language)}</dt>
                  <dd lang='de'>{Object.entries(resolved.spells).map(([key, value]) => `${key} ${value}`).join(', ')}
                     {chosen.curseBudget ? ` · ${t('Curses for {ap} AP', language).replace('{ap}', String(chosen.curseBudget))}` : ''}</dd></div>}
               {chosen.liturgies && <div><dt>{t('Liturgies', language)}</dt>
                  <dd lang='de'>{Object.entries(chosen.liturgies).map(([key, value]) => `${key} ${value}`).join(', ')}
                     {chosen.blessings === 'twelve' ? ' · Die Zwölf Segnungen' : ''}</dd></div>}
               <div><dt>{t('Talents', language)}</dt>
                  <dd>{Object.entries(resolved.talents).filter(([, value]) => value > 0).map(([key, value]) => `${talentName(key, language)} ${value}`).join(', ')}</dd></div>
            </dl>
            {ledger.warnings.filter((warning) => warning.key.startsWith('profession:')).map((warning) =>
               <label key={warning.key} className='creation-approval'><input type='checkbox' checked={warning.approved}
                  onChange={(event) => update({ approvals: event.target.checked ? [...data.approvals, warning.key] : data.approvals.filter((key) => key !== warning.key) })} />
                  {t(warning.message, language)} · {t('GM approved', language)}</label>)}
         </>}
      </>}
   </section>
}
