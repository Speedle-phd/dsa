import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { getBestiaryReference } from '@/features/heroes/bestiaryApi'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { addNpcs, encounterKey, getNpcTemplates, type NpcInput } from './encounterApi'

const empty: NpcInput = { maxHealth: 20, armor: 1, initiativeBase: 10, attack: 12, parry: 6, defense: null, dodge: 6, damage: '1W6+3', speed: 8, notes: '' }
const numberFields: Array<[keyof NpcInput, string]> = [
   ['maxHealth', 'LeP'], ['armor', 'RS'], ['initiativeBase', 'INI base'], ['attack', 'AT'], ['parry', 'PA'], ['defense', 'VW'], ['dodge', 'AW'], ['speed', 'GS'],
]

// The GM adds opponents: by hand, from a saved template or from the bestiary (S. 353–362). Copies are numbered.
export function NpcForm({ partyId, onDone }: { partyId: string; onDone: () => void }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const [name, setName] = useState('')
   const [count, setCount] = useState(1)
   const [values, setValues] = useState<NpcInput>(empty)
   const [hidden, setHidden] = useState(false)
   const [saveTemplate, setSaveTemplate] = useState(false)
   const templates = useQuery({ queryKey: ['npc-templates'], queryFn: getNpcTemplates })
   const bestiary = useQuery({ queryKey: ['bestiary-reference'], queryFn: getBestiaryReference, staleTime: Infinity })
   const mutation = useMutation({
      mutationFn: () => addNpcs(partyId, { name: name.trim(), count, values, saveTemplate, hidden }),
      onSuccess: (next) => {
         queryClient.setQueryData(encounterKey(partyId), next)
         if (saveTemplate) void queryClient.invalidateQueries({ queryKey: ['npc-templates'] })
         toast.success(t('Opponents added.', language))
         onDone()
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   function fromTemplate(id: string) {
      const template = templates.data?.find((entry) => entry._id === id)
      if (!template) return
      setName(template.name)
      setValues({ ...empty, ...template.values })
   }
   // Bestiary stat blocks: VW for non-humanoids, the first attack's AT/TP (S. 354)
   function fromBestiary(key: string) {
      const creature = bestiary.data?.creatures.find((entry) => entry.key === key)
      if (!creature) return
      const attack = creature.attacks[0]
      setName(creature.key)
      setValues({ maxHealth: creature.health, armor: creature.armor, initiativeBase: creature.initiative, attack: attack?.attack ?? null,
         parry: attack?.parry ?? null, defense: creature.defense, dodge: creature.dodge, damage: attack?.damage ?? '',
         speed: Number.parseInt(creature.speed, 10) || null, notes: '' })
   }
   function submit(event: FormEvent) {
      event.preventDefault()
      if (name.trim()) mutation.mutate()
   }

   return <form className='npc-form' onSubmit={submit}>
      <div className='npc-form-sources'>
         {Boolean(templates.data?.length) && <label className='field-group'>
            <span>{t('From a template', language)}</span>
            <select value='' onChange={(event) => fromTemplate(event.target.value)}>
               <option value=''>{t('Choose…', language)}</option>
               {templates.data!.map((template) => <option key={template._id} value={template._id}>{template.name}</option>)}
            </select>
         </label>}
         {bestiary.data && <label className='field-group'>
            <span>{t('From the bestiary', language)}</span>
            <select value='' onChange={(event) => fromBestiary(event.target.value)}>
               <option value=''>{t('Choose…', language)}</option>
               {bestiary.data.creatures.map((creature) => <option key={creature.key} value={creature.key}>{creature.key}</option>)}
            </select>
         </label>}
      </div>
      <div className='npc-form-grid'>
         <label className='field-group npc-form-name'>
            <span>{t('Name', language)}</span>
            <input value={name} required maxLength={60} placeholder={t('e.g. Ork', language)} onChange={(event) => setName(event.target.value)} />
         </label>
         <label className='field-group'>
            <span>{t('Count', language)}</span>
            <input type='number' min={1} max={12} value={count} onChange={(event) => setCount(Math.min(12, Math.max(1, Math.trunc(event.target.valueAsNumber) || 1)))} />
         </label>
         {numberFields.map(([key, label]) => <label key={key} className='field-group'>
            <span>{t(label, language)}</span>
            <input type='number' min={key === 'initiativeBase' ? -20 : 0} max={key === 'maxHealth' ? 999 : 60}
               value={values[key] ?? ''} required={key === 'maxHealth'}
               onChange={(event) => setValues({ ...values, [key]: event.target.value === '' ? (key === 'maxHealth' || key === 'armor' || key === 'initiativeBase' ? 0 : null) : Math.trunc(event.target.valueAsNumber) })} />
         </label>)}
         <label className='field-group'>
            <span>TP</span>
            <input value={values.damage} maxLength={40} onChange={(event) => setValues({ ...values, damage: event.target.value })} />
         </label>
         <label className='field-group npc-form-name'>
            <span>{t('Notes', language)}</span>
            <input value={values.notes} maxLength={500} onChange={(event) => setValues({ ...values, notes: event.target.value })} />
         </label>
      </div>
      <label className='initiative-check'><input type='checkbox' checked={hidden} onChange={(event) => setHidden(event.target.checked)} />{t('Hidden from players (ambush)', language)}</label>
      <label className='initiative-check'><input type='checkbox' checked={saveTemplate} onChange={(event) => setSaveTemplate(event.target.checked)} />{t('Save as template', language)}</label>
      <div className='modal-actions'>
         <button className='quiet-button' type='button' onClick={onDone}>{t('Cancel', language)}</button>
         <button className='primary-button' type='submit' disabled={!name.trim() || mutation.isPending}><Plus size={15} aria-hidden='true' />{t('Add opponents', language)}</button>
      </div>
   </form>
}
