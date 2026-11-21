import { Package } from 'lucide-react'
import { getAttributeAbbreviation } from '@/features/heroes/talentCatalog'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { attributeOrder, type StepProps } from './creationApi'
import { talentName } from './creationLabels'

// Schritt 2: Erfahrungsgrad (S. 38–39)
export function BasicsStep({ data, reference, update }: StepProps) {
   const language = useLanguageStore((state) => state.language)
   return <section className='creation-step'>
      <p className='creation-intro'>{t('The Erfahrungsgrad sets your AP account and the maximum values during creation (S. 39). Most groups start at Erfahren.', language)}</p>
      <div className='creation-cards'>
         {reference.experienceLevels.map((level) => <button key={level.level} type='button' aria-pressed={data.level === level.level}
            className={`creation-card${data.level === level.level ? ' is-active' : ''}`} onClick={() => update({ level: level.level })}>
            <strong lang='de'>{level.level}</strong>
            <span className='creation-card-ap'>{level.ap} {t('AP', language)}</span>
            <small>{t('Attribute', language)} ≤ {level.attribute} · Σ {level.attributeSum}</small>
            <small>{t('Skill', language)} ≤ {level.skill} · {t('Combat technique', language)} ≤ {level.technique}</small>
            <small>{t('Spells', language)} ≤ {level.spells} ({level.foreignSpells} {t('foreign', language)})</small>
         </button>)}
      </div>
   </section>
}

// Schritt 3: Spezies (S. 40, 87–94)
export function SpeciesStep({ data, reference, update }: StepProps) {
   const language = useLanguageStore((state) => state.language)
   const chosen = reference.species.find((entry) => entry.key === data.species)
   return <section className='creation-step'>
      <p className='creation-intro'>{t('The species sets LeP, SK, ZK and GS. Its attribute changes raise or lower only the maximum, not the value (S. 88).', language)}</p>
      <div className='creation-cards'>
         {reference.species.map((species) => <button key={species.key} type='button' aria-pressed={data.species === species.key}
            className={`creation-card${data.species === species.key ? ' is-active' : ''}`}
            onClick={() => update({ species: species.key, speciesChoice: null })}>
            <strong lang='de'>{species.key}</strong>
            <span className='creation-card-ap'>{species.ap} {t('AP', language)}</span>
            <small>LE {species.health} · SK {species.soulPower} · ZK {species.toughness} · GS {species.speed}</small>
            <small>{[...Object.entries(species.attributeMax).map(([key, value]) => `${getAttributeAbbreviation(key as never, language)} +${value}`),
               species.choice.value > 0 ? t('one of choice +1', language)
                  : species.choice.options.map((key) => getAttributeAbbreviation(key, language)).join(` ${t('or', language)} `) + ` ${species.choice.value}`].join(' · ')}</small>
            {species.automatic.advantages.length > 0 && <small lang='de'>{species.automatic.advantages.join(', ')}</small>}
            <small className='creation-page'>{t('S.', language)} {species.page}</small>
         </button>)}
      </div>
      {chosen && <fieldset className='probe-difficulty creation-choice'>
         <legend>{t(chosen.choice.value > 0 ? 'Which maximum rises by 1?' : 'Which maximum drops by 2?', language)}</legend>
         <div className='probe-segmented'>
            {chosen.choice.options.map((key) => <button key={key} type='button' aria-pressed={data.speciesChoice === key}
               className={data.speciesChoice === key ? 'is-active' : ''} onClick={() => update({ speciesChoice: key })}>
               {getAttributeAbbreviation(key, language)}</button>)}
         </div>
         {chosen.recommended.length > 0 && <p className='probe-segmented-note'>
            {t('Strongly recommended (choose them or agree with the GM):', language)} <span lang='de'>{chosen.recommended.join(', ')}</span></p>}
      </fieldset>}
   </section>
}

// Schritt 4: Kultur (S. 40–42, 95–126)
export function CultureStep({ data, ledger, reference, update }: StepProps) {
   const language = useLanguageStore((state) => state.language)
   const species = reference.species.find((entry) => entry.key === data.species)
   const usual = reference.cultures.filter((culture) => species?.cultures.includes(culture.key) ?? true)
   const unusual = reference.cultures.filter((culture) => !usual.includes(culture))
   const chosen = reference.cultures.find((entry) => entry.key === data.culture)
   const pick = (key: string) => {
      const culture = reference.cultures.find((entry) => entry.key === key)!
      update({ culture: key, language: culture.languages[0] ?? null, script: null, culturePackage: false })
   }
   return <section className='creation-step'>
      <p className='creation-intro'>{t('The culture is free: you get its mother tongue at level III and one Ortskenntnis. The Kulturpaket is optional and bought as a whole (S. 40–41).', language)}</p>
      <label className='field-group'>
         <span>{t('Culture', language)}</span>
         <select value={data.culture ?? ''} onChange={(event) => pick(event.target.value)}>
            <option value='' disabled>{t('Choose a culture', language)}</option>
            <optgroup label={t('Usual for the species', language)}>
               {usual.map((culture) => <option key={culture.key} value={culture.key}>{culture.key} · {culture.package.ap} {t('AP', language)}</option>)}
            </optgroup>
            {unusual.length > 0 && <optgroup label={t('Unusual (GM approval)', language)}>
               {unusual.map((culture) => <option key={culture.key} value={culture.key}>{culture.key}</option>)}
            </optgroup>}
         </select>
      </label>
      {chosen && <>
         <div className='creation-row-fields'>
            <label className='field-group'>
               <span>{t('Mother tongue (level III, free)', language)}</span>
               <select value={data.language ?? ''} onChange={(event) => update({ language: event.target.value })}>
                  {chosen.languages.map((key) => <option key={key} value={key}>{key}</option>)}
               </select>
            </label>
            <label className='field-group'>
               <span>{t('Ortskenntnis (free)', language)}</span>
               <input value={data.localKnowledge} maxLength={80} placeholder={t('Home town or region', language)}
                  onChange={(event) => update({ localKnowledge: event.target.value })} />
            </label>
            <label className='field-group'>
               <span>{t('Script (2 AP)', language)}</span>
               <select value={data.script ?? ''} disabled={!chosen.scripts.length} onChange={(event) => update({ script: event.target.value || null })}>
                  <option value=''>{t(chosen.scripts.length ? 'No script' : 'This culture has no script', language)}</option>
                  {chosen.scripts.map((key) => <option key={key} value={key}>{key}</option>)}
               </select>
            </label>
         </div>
         <label className='regen-toggle creation-package'>
            <input type='checkbox' checked={data.culturePackage} onChange={(event) => update({ culturePackage: event.target.checked })} />
            <span><strong><Package size={15} /> {t('Kulturpaket', language)} · {chosen.package.ap} {t('AP', language)}</strong>
               <small>{Object.entries(chosen.package.talents).map(([key, value]) => `${talentName(key, language)} +${value}`).join(', ')}</small></span>
         </label>
         {chosen.socialStatus.length > 0 && <p className='fight-note'>{t('Social status: free by default; {options} through the advantage Adel or the disadvantage Unfrei (S. 41).', language)
            .replace('{options}', chosen.socialStatus.join(' / '))}</p>}
         <p className='fight-note'>{t('Granted', language)}: <span lang='de'>{[...ledger.granted.languages, ...ledger.granted.generalSpecialAbilities].join(', ') || '—'}</span>
            {' '}· {t('S.', language)} {chosen.page}</p>
      </>}
   </section>
}

export function AttributesStep({ data, ledger, update }: StepProps) {
   const language = useLanguageStore((state) => state.language)
   const set = (key: keyof typeof data.attributes, value: number) => update({ attributes: { ...data.attributes, [key]: value } })
   return <section className='creation-step'>
      <p className='creation-intro'>{t('Every attribute starts at 8. Each point costs 15 AP up to 14, then more (column E, S. 43, 50). Quick fill: sum 100 costs 540 AP, with one 15 555 AP, with two 15s 570 AP.', language)}</p>
      <div className='creation-attributes'>
         {attributeOrder.map((key) => {
            const value = data.attributes[key]
            const max = ledger.caps.attributes[key]
            return <div key={key} className={`creation-attribute${value > max ? ' is-over' : ''}`}>
               <span className='creation-attribute-name'>{getAttributeAbbreviation(key, language)}</span>
               <div className='dice-count-control'>
                  <button className='icon-button' type='button' disabled={value <= 8} aria-label={`${getAttributeAbbreviation(key, language)} −1`} onClick={() => set(key, value - 1)}>−</button>
                  <input type='number' min={8} max={25} value={value} aria-label={getAttributeAbbreviation(key, language)}
                     onChange={(event) => set(key, Math.max(8, Math.min(25, Math.trunc(event.target.valueAsNumber) || 8)))} />
                  <button className='icon-button' type='button' disabled={value >= max} aria-label={`${getAttributeAbbreviation(key, language)} +1`} onClick={() => set(key, value + 1)}>+</button>
               </div>
               <small>{t('max', language)} {max}</small>
            </div>
         })}
      </div>
      <p className={`creation-sum${ledger.usage.attributeSum > ledger.caps.attributeSum ? ' is-over' : ''}`}>
         Σ {ledger.usage.attributeSum} / {ledger.caps.attributeSum} · {ledger.costs.attributes} {t('AP', language)}</p>
   </section>
}
