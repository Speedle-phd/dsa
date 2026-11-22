import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Award, HeartCrack, HeartPulse, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { QuantityStepper } from '@/components/QuantityStepper'
import { adjustHealth, getCombatReference, updateCombatSettings } from '@/features/heroes/combatApi'
import { statusInfo } from '@/features/heroes/conditionInfo'
import { updateExperience } from '@/features/heroes/statsApi'
import { axiosInstance } from '@/axios/axios'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { partiesKey, type PartyHero } from './partyApi'

const levels = ['—', 'I', 'II', 'III', 'IV']

// Game effects the party GM may apply to an accepted hero (user decision, Nov 2026). The server checks the GM role
// on the same endpoints the owner uses; AsP/KaP losses from the GM are plain losses (no casting surcharges).
export function GmHeroActions({ hero, partyId }: { hero: PartyHero; partyId: string }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const statsId = hero.statsId ?? ''
   const [amount, setAmount] = useState(1)
   const [ap, setAp] = useState(10)
   const reference = useQuery({ queryKey: ['combat-reference'], queryFn: getCombatReference, staleTime: Infinity })
   const mutation = useMutation({
      mutationFn: (action: () => Promise<unknown>) => action(),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...partiesKey, partyId] }),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const busy = mutation.isPending
   const run = (action: () => Promise<unknown>, message: string) => mutation.mutate(action, { onSuccess: () => toast.success(t(message, language)) })
   const energy = (path: 'adjust-mana' | 'adjust-karma', direction: 'spend' | 'recover') =>
      () => axiosInstance.put(`/api/stats/${path}/${statsId}`, { direction, amount })
   const stored = hero.storedStatuses ?? []
   const permanent = hero.permanentStatuses ?? []
   const conditions = hero.conditions ?? {}

   return <div className='gm-actions'>
      <div className='gm-actions-row'>
         <span>{t('Amount', language)}</span>
         <QuantityStepper value={amount} min={1} max={200} label={t('Amount', language)} onChange={setAmount} />
      </div>
      <div className='gm-actions-buttons'>
         <button className='quiet-button' type='button' disabled={busy} onClick={() => run(() => adjustHealth(statsId, 'damage', amount), 'LeP lost.')}>
            <HeartCrack size={15} aria-hidden='true' />{t('LeP damage', language)}</button>
         <button className='quiet-button' type='button' disabled={busy} onClick={() => run(() => adjustHealth(statsId, 'heal', amount), 'LeP healed.')}>
            <HeartPulse size={15} aria-hidden='true' />{t('Heal LeP', language)}</button>
         {hero.mana && <>
            <button className='quiet-button' type='button' disabled={busy} onClick={() => run(energy('adjust-mana', 'spend'), 'AsP changed.')}>
               <Minus size={15} aria-hidden='true' />{t('AsP', language)}</button>
            <button className='quiet-button' type='button' disabled={busy} onClick={() => run(energy('adjust-mana', 'recover'), 'AsP changed.')}>
               <Plus size={15} aria-hidden='true' />{t('AsP', language)}</button>
         </>}
         {hero.karmaEnergy && <>
            <button className='quiet-button' type='button' disabled={busy} onClick={() => run(energy('adjust-karma', 'spend'), 'KaP changed.')}>
               <Minus size={15} aria-hidden='true' />{t('KaP', language)}</button>
            <button className='quiet-button' type='button' disabled={busy} onClick={() => run(energy('adjust-karma', 'recover'), 'KaP changed.')}>
               <Plus size={15} aria-hidden='true' />{t('KaP', language)}</button>
         </>}
      </div>

      <fieldset className='gm-actions-group'>
         <legend>{t('Status', language)}</legend>
         <ul className='combat-status-list'>
            {Object.keys(statusInfo).map((key) => {
               const fixed = permanent.includes(key)
               const active = fixed || stored.includes(key)
               return <li key={key} className={active ? 'is-active' : ''}>
                  <label title={fixed ? `${t('From the disadvantage', language)} ${key}` : undefined}>
                     <input type='checkbox' checked={active} disabled={busy || fixed} onChange={() => run(() => updateCombatSettings(statsId, {
                        statuses: active ? stored.filter((status) => status !== key) : [...stored, key],
                     }), 'Status changed.')} />
                     <span lang='de'>{key}</span>
                  </label>
               </li>
            })}
         </ul>
      </fieldset>

      {reference.data && <fieldset className='gm-actions-group'>
         <legend>{t('Conditions', language)}</legend>
         <div className='gm-conditions'>
            {reference.data.conditions.map((key) => <label key={key} className='gm-condition'>
               <span>{t(key, language)}</span>
               <select className='combat-condition-select' value={conditions[key] ?? 0} disabled={busy}
                  onChange={(event) => {
                     // Read now: the controlled select is reset before the mutation runs
                     const level = Number(event.target.value)
                     run(() => updateCombatSettings(statsId, { conditions: { ...conditions, [key]: level } }), 'Condition changed.')
                  }}>
                  {levels.map((label, value) => <option key={value} value={value}>{label}</option>)}
               </select>
            </label>)}
         </div>
      </fieldset>}

      <div className='gm-actions-row'>
         <span>{t('Award AP', language)}</span>
         <QuantityStepper value={ap} min={1} max={1000} label={t('Award AP', language)} onChange={setAp} />
         <button className='primary-button' type='button' disabled={busy} onClick={() => run(() => updateExperience(statsId, { gathered: ap }), 'AP awarded.')}>
            <Award size={15} aria-hidden='true' />{t('Award', language)}</button>
      </div>
   </div>
}
