import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { QuantityStepper } from '@/components/QuantityStepper'
import { getBestiaryReference } from '@/features/heroes/bestiaryApi'
import { npcLibraryKey, useNpcLibrary } from '@/features/npcs/npcApi'
import { draftWeapons, emptySheet, fromBestiary, weaponSummary, withLegacy, type NpcDraft } from '@/features/npcs/npcSheet'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { addNpcs, encounterKey } from './encounterApi'

type Mode = 'library' | 'bestiary' | 'quick'
type QuickField = 'maxHealth' | 'armor' | 'initiativeBase' | 'attack' | 'parry' | 'defense' | 'dodge' | 'speed'
const quickFields: Array<[QuickField, string]> = [
   ['maxHealth', 'LeP'], ['armor', 'RS'], ['initiativeBase', 'INI base'], ['attack', 'AT'], ['parry', 'PA'], ['defense', 'VW'], ['dodge', 'AW'], ['speed', 'GS'],
]
const quickStart: NpcDraft = { maxHealth: 20, armor: 1, initiativeBase: 10, attack: 12, parry: 6, defense: null, dodge: 6, damage: '1W6+3', speed: 8, notes: '', sheet: null }

// The GM adds opponents to the running or a prepared fight (user request, Nov 2026): from the NPC library (the usual way),
// a bestiary creature, or a quick entry. `heroes`: the party's heroes in the fight, for "number of heroes + n".
export function NpcForm({ partyId, heroes, onDone }: { partyId: string; heroes: number; onDone: () => void }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const library = useNpcLibrary()
   const bestiary = useQuery({ queryKey: ['bestiary-reference'], queryFn: getBestiaryReference, staleTime: Infinity })
   const [mode, setMode] = useState<Mode>('library')
   const [templateId, setTemplateId] = useState('')
   const [creatureKey, setCreatureKey] = useState('')
   const [quickName, setQuickName] = useState('')
   const [quick, setQuick] = useState<NpcDraft>(quickStart)
   const [count, setCount] = useState(1)
   const [hidden, setHidden] = useState(false)
   const [saveTemplate, setSaveTemplate] = useState(false)

   const template = library.data?.find((entry) => entry._id === templateId)
   const creature = bestiary.data?.creatures.find((entry) => entry.key === creatureKey)
   const chosen: { name: string; values: NpcDraft } | null = mode === 'library' ? (template ? { name: template.name, values: template.values } : null)
      : mode === 'bestiary' ? (creature ? { name: creature.key, values: fromBestiary(creature, language).draft } : null)
      // A quick entry is one weapon "Angriff" with its AT/PA/TP
      : quickName.trim() ? { name: quickName.trim(), values: withLegacy({ ...quick, sheet: { ...emptySheet(), weapons: quick.attack === null ? []
         : [{ name: t('Attack', language), kind: 'melee', attack: quick.attack, parry: quick.parry, damage: quick.damage, reach: null, range: null, reload: null, ammo: null, perRound: null }] } }) }
      : null

   const mutation = useMutation({
      mutationFn: () => addNpcs(partyId, { name: chosen!.name, count, values: chosen!.values, saveTemplate: mode !== 'library' && saveTemplate, hidden }),
      onSuccess: (next) => {
         queryClient.setQueryData(encounterKey(partyId), next)
         if (saveTemplate) void queryClient.invalidateQueries({ queryKey: npcLibraryKey })
         toast.success(t('Opponents added.', language))
         onDone()
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   function submit(event: FormEvent) {
      event.preventDefault()
      if (chosen) mutation.mutate()
   }
   const setQuickNumber = (key: QuickField, value: string) =>
      setQuick({ ...quick, [key]: value === '' ? (key === 'maxHealth' || key === 'armor' || key === 'initiativeBase' ? 0 : null) : Math.trunc(Number(value)) })

   return <form className='npc-form' onSubmit={submit}>
      <div className='probe-segmented' role='group' aria-label={t('Source', language)}>
         {(['library', 'bestiary', 'quick'] as const).map((value) => <button key={value} type='button' aria-pressed={mode === value}
            className={`probe-chip${mode === value ? ' is-active' : ''}`} onClick={() => setMode(value)}>
            {t(value === 'library' ? 'NPC library' : value === 'bestiary' ? 'Bestiary' : 'Quick entry', language)}</button>)}
      </div>

      {mode === 'library' && <>
         {library.data?.length === 0 && <p className='party-muted'>{t('Your library is empty.', language)}</p>}
         {Boolean(library.data?.length) && <label className='field-group'>
            <span>{t('NPC', language)}</span>
            <select value={templateId} required onChange={(event) => setTemplateId(event.target.value)}>
               <option value=''>{t('Choose…', language)}</option>
               {library.data!.map((entry) => <option key={entry._id} value={entry._id}>{entry.name}{entry.tags.length ? ` · ${entry.tags.join(', ')}` : ''}</option>)}
            </select>
         </label>}
         <Link className='quiet-button npc-form-library' to='/npcs'><BookOpen size={15} aria-hidden='true' />{t('Open the NPC library', language)}</Link>
      </>}

      {mode === 'bestiary' && bestiary.data && <label className='field-group'>
         <span>{t('Creature', language)}</span>
         <select value={creatureKey} required onChange={(event) => setCreatureKey(event.target.value)}>
            <option value=''>{t('Choose…', language)}</option>
            {bestiary.data.creatures.map((entry) => <option key={entry.key} value={entry.key}>{entry.key}</option>)}
         </select>
      </label>}

      {mode === 'quick' && <div className='npc-form-grid'>
         <label className='field-group npc-form-name'>
            <span>{t('Name', language)}</span>
            <input value={quickName} required maxLength={60} placeholder={t('e.g. Ork', language)} onChange={(event) => setQuickName(event.target.value)} />
         </label>
         {quickFields.map(([key, label]) => <label key={key} className='field-group'>
            <span>{t(label, language)}</span>
            <input type='number' min={key === 'initiativeBase' ? -20 : 0} max={key === 'maxHealth' ? 999 : 60} value={quick[key] ?? ''} required={key === 'maxHealth'}
               onChange={(event) => setQuickNumber(key, event.target.value)} />
         </label>)}
         <label className='field-group'>
            <span>{t('TP', language)}</span>
            <input value={quick.damage} maxLength={40} onChange={(event) => setQuick({ ...quick, damage: event.target.value })} />
         </label>
      </div>}

      {chosen && mode !== 'quick' && <p className='npc-form-preview'>
         <strong>{chosen.name}</strong> · {t('LeP', language)} {chosen.values.maxHealth} · {t('RS', language)} {chosen.values.armor}
         {draftWeapons(chosen.values).length > 0 && ` · ${weaponSummary(draftWeapons(chosen.values))}`}</p>}

      <div className='npc-form-count'>
         <span>{t('Count', language)}</span>
         <QuantityStepper value={count} min={1} max={12} label={t('Count', language)} onChange={setCount} />
         {heroes > 0 && [0, 1, 2].map((extra) => <button key={extra} type='button' className={`probe-chip${count === heroes + extra ? ' is-active' : ''}`}
            aria-pressed={count === heroes + extra} onClick={() => setCount(Math.min(12, heroes + extra))}>
            {extra === 0 ? t('Heroes', language) : `${t('Heroes', language)} +${extra}`}</button>)}
      </div>
      <label className='initiative-check'><input type='checkbox' checked={hidden} onChange={(event) => setHidden(event.target.checked)} />{t('Hidden from players (ambush)', language)}</label>
      {mode !== 'library' && <label className='initiative-check'><input type='checkbox' checked={saveTemplate} onChange={(event) => setSaveTemplate(event.target.checked)} />{t('Also save in the NPC library', language)}</label>}
      <div className='modal-actions'>
         <button className='quiet-button' type='button' onClick={onDone}>{t('Cancel', language)}</button>
         <button className='primary-button' type='submit' disabled={!chosen || mutation.isPending}><Plus size={15} aria-hidden='true' />{t('Add opponents', language)}</button>
      </div>
   </form>
}
