import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Source } from '@/features/heroes/ArcanaPanels'
import type { MagicSpell } from '@/features/heroes/magicApi'
import { distributionLabel, groupByDistribution, spellFactRows } from '@/features/heroes/spellInfo'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'

// Choose a catalog spell grouped by Verbreitung; the chosen spell's facts show before it is added.
export function CreationSpellPicker({ spells, kinds, owned, placeholder, onAdd }: {
   spells: MagicSpell[]; kinds: Array<MagicSpell['kind']>; owned: string[]; placeholder: string; onAdd: (key: string) => void
}) {
   const language = useLanguageStore((state) => state.language)
   const [key, setKey] = useState('')
   const selected = spells.find((entry) => entry.key === key)
   return <>
      <div className='creation-inline-add'>
         <select value={key} aria-label={t(placeholder, language)} onChange={(event) => setKey(event.target.value)}>
            <option value=''>{t(placeholder, language)}</option>
            {kinds.flatMap((kind) => groupByDistribution(spells.filter((entry) => entry.kind === kind && !owned.includes(entry.key)), (entry) => entry)
               .map((group) => <optgroup key={`${kind}-${group.key}`} label={`${t(kind, language)} · ${t('Verbreitung', language)}: ${distributionLabel(group.distribution, language)}`}>
                  {group.entries.map((entry) => <option key={entry.key} value={entry.key}>{entry.key} ({entry.stfClass.toUpperCase()})</option>)}
               </optgroup>))}
         </select>
         <button className='quiet-button' type='button' disabled={!selected} onClick={() => { onAdd(key); setKey('') }}><Plus size={15} />{t('Add', language)}</button>
      </div>
      {selected && <div className='arcana-facts creation-spell-facts' aria-live='polite'>
         <p><strong>{selected.key}</strong> · {selected.effect[language]} <Source page={selected.page} /></p>
         <dl className='arcana-fact-grid'>
            {spellFactRows(selected, language).map(([label, value]) => <div key={label}><dt>{t(label, language)}</dt><dd>{value}</dd></div>)}
         </dl>
      </div>}
   </>
}
