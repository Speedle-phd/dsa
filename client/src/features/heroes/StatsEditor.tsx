import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { type FormEvent } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { t } from '@/locales/translation'
import { useLanguageStore } from '@/locales/languageStore'
import { getApiErrorMessage } from './heroApi'
import { type Stats, updateStatsForHero, type UpdateStatsInput } from './statsApi'
import { APToggle } from './AdvancementControls'
import { useAdvancementMode } from './advancement'
import { energyBreakdown, fateBreakdown, healthBreakdown, resistanceBreakdown } from './energy'

type Scope = 'resources' | 'experience' | 'fatePoints'
type Field = { name: string; label: string; value: number; min?: number; max?: number }
const wholeNumber = z.number().int().min(0)
const modifier = z.number().int()
const purchased = wholeNumber.max(25)
const resourcesSchema = z.object({
   health: z.object({ value: wholeNumber, bonusMalus: modifier, additionalPurchase: purchased, current: modifier }),
   soulPower: z.object({ value: modifier, bonusMalus: modifier }),
   toughness: z.object({ value: modifier, bonusMalus: modifier }),
   dodge: z.object({ bonusMalus: modifier }),
   mana: z.object({ bonusMalus: modifier, additionalPurchase: purchased, current: wholeNumber }),
   karmaEnergy: z.object({ bonusMalus: modifier, additionalPurchase: purchased, current: wholeNumber }),
   isSorcerer: z.boolean(),
   isConsecratedPerson: z.boolean(),
})
// source: DSA5 Regelwerk, S. 39
const startingLevels = ['Unerfahren', 'Durchschnittlich', 'Erfahren', 'Kompetent', 'Meisterlich', 'Brillant', 'Legendär'] as const
const experienceSchema = z.object({
   experience: z.object({ gathered: wholeNumber, spent: wholeNumber }),
   level: z.enum(startingLevels).optional(),
})
const fateSchema = z.object({ fatePoints: z.object({ value: wholeNumber, bonusMalus: modifier, current: wholeNumber }) })
const titles: Record<Scope, string> = { resources: 'Edit resources', experience: 'Edit experience', fatePoints: 'Edit fate points' }

export function StatsEditor({ stats, scope, onClose }: { stats: Stats; scope: Scope; onClose: () => void }) {
   const dialogRef = useModalKeyboard(onClose)
   const language = useLanguageStore((state) => state.language)
   const { spendAP } = useAdvancementMode(stats.charId)
   const queryClient = useQueryClient()
   const mutation = useMutation({
      mutationFn: (values: Partial<UpdateStatsInput>) => updateStatsForHero(stats._id, { ...values, spendAP: scope === 'resources' && spendAP }),
      onSuccess: async (next) => {
         queryClient.setQueryData(['stats', stats.charId], next)
         await queryClient.invalidateQueries({ queryKey: ['stats', stats.charId] })
         toast.success(t('Stats were updated', language))
         onClose()
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
   })
   const groups: Array<{ title: string; fields: Field[]; note?: string }> = scope === 'experience' ? [{
      title: 'Experience',
      fields: [
         { name: 'experience.gathered', label: 'Experience gained', value: stats.experience.gathered, min: 0 },
         // Shown net of the disadvantage AP, as on the overview; the stored value adds them back on save
         { name: 'experience.spent', label: 'Experience spent', value: stats.experience.spent - stats.experience.disadvantageCredit, min: -stats.experience.disadvantageCredit },
      ],
   }] : scope === 'fatePoints' ? [{
      title: 'Fate points', note: fateBreakdown(stats, language),
      fields: [
         { name: 'fatePoints.value', label: 'Fate point base value', value: stats.fatePoints.value, min: 0 },
         { name: 'fatePoints.bonusMalus', label: 'Fate point modifier', value: stats.fatePoints.bonusMalus },
         { name: 'fatePoints.current', label: 'Fate points current', value: stats.fatePoints.current, min: 0 },
      ],
   }] : [
      { title: 'Health', note: healthBreakdown(stats, language), fields: [
         { name: 'health.value', label: 'base value', value: stats.health.value, min: 0 },
         { name: 'health.bonusMalus', label: 'Other LeP modifiers', value: stats.health.bonusMalus },
         { name: 'health.additionalPurchase', label: 'additional purchase', value: stats.health.additionalPurchase, min: 0, max: 25 },
         { name: 'health.current', label: 'Current', value: stats.health.current },
      ] },
      { title: 'Soul power', note: resistanceBreakdown(stats, 'soulPower', language), fields: [
         { name: 'soulPower.value', label: 'base value', value: stats.soulPower.value },
         { name: 'soulPower.bonusMalus', label: 'Modifier', value: stats.soulPower.bonusMalus },
      ] },
      { title: 'Toughness', note: resistanceBreakdown(stats, 'toughness', language), fields: [
         { name: 'toughness.value', label: 'base value', value: stats.toughness.value },
         { name: 'toughness.bonusMalus', label: 'Modifier', value: stats.toughness.bonusMalus },
      ] },
      { title: 'Dodge', fields: [{ name: 'dodge.bonusMalus', label: 'Dodge modifier', value: stats.dodge.bonusMalus }] },
      { title: 'Mana', note: energyBreakdown(stats, 'mana', language), fields: [
         { name: 'mana.bonusMalus', label: 'Other AsP modifiers', value: stats.mana.bonusMalus },
         { name: 'mana.additionalPurchase', label: 'Mana additional purchase', value: stats.mana.additionalPurchase, min: 0, max: 25 },
         { name: 'mana.current', label: 'Mana current', value: stats.mana.current, min: 0 },
      ] },
      { title: 'Karma energy', note: energyBreakdown(stats, 'karmaEnergy', language), fields: [
         { name: 'karmaEnergy.bonusMalus', label: 'Other KaP modifiers', value: stats.karmaEnergy.bonusMalus },
         { name: 'karmaEnergy.additionalPurchase', label: 'Karma additional purchase', value: stats.karmaEnergy.additionalPurchase, min: 0, max: 25 },
         { name: 'karmaEnergy.current', label: 'Karma current', value: stats.karmaEnergy.current, min: 0 },
      ] },
   ]

   function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      const values: Record<string, Record<string, number> | boolean | string> = {}
      for (const { fields } of groups) {
         for (const field of fields) {
            const [group, key] = field.name.split('.')
            const existing = values[group]
            values[group] = { ...(typeof existing === 'object' ? existing : {}), [key]: Number(data.get(field.name)) }
         }
      }
      if (scope === 'resources') {
         values.isSorcerer = data.has('isSorcerer')
         values.isConsecratedPerson = data.has('isConsecratedPerson')
      }
      if (scope === 'experience' && data.get('level')) values.level = String(data.get('level'))
      const experience = values.experience
      if (scope === 'experience' && typeof experience === 'object') values.experience = { ...experience, spent: experience.spent + stats.experience.disadvantageCredit }
      const result = (scope === 'resources' ? resourcesSchema : scope === 'experience' ? experienceSchema : fateSchema).safeParse(values)
      if (!result.success) { toast.error(t('Please correct the highlighted values.', language)); return }
      mutation.mutate(result.data)
   }

   return <div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
      <section ref={dialogRef} className='hero-editor stats-editor' role='dialog' aria-modal='true'
         aria-labelledby='stats-editor-title' onMouseDown={(event) => event.stopPropagation()}>
         <header className='editor-header'>
            <h2 id='stats-editor-title'>{t(titles[scope], language)}</h2>
            <button className='icon-button editor-close' type='button' onClick={onClose} aria-label={t('Close stats editor', language)}><X size={20} /></button>
         </header>
         <form className='hero-form' onSubmit={submit}>
            {scope === 'experience' && <label className='field-group'>
               <span>{t('Starting experience level', language)}</span>
               <select name='level' defaultValue='' disabled={mutation.isPending}>
                  <option value=''>{t('Keep starting AP ({ap} AP)', language).replace('{ap}', String(stats.experience.base))}</option>
                  {startingLevels.map((level) => <option key={level} value={level}>{t(level, language)}</option>)}
               </select>
            </label>}
            {scope === 'resources' && <>
               <APToggle heroId={stats.charId} disabled={mutation.isPending} />
               <p className='combat-note'>{t('Resource bases, modifiers and current pools are manual values. The AP toggle applies to additional purchases.', language)}</p>
               <label className='checkbox-field'><input name='isSorcerer' type='checkbox' defaultChecked={stats.isSorcerer} disabled={mutation.isPending} />{t('Sorcerer', language)}</label>
               <label className='checkbox-field'><input name='isConsecratedPerson' type='checkbox' defaultChecked={stats.isConsecratedPerson} disabled={mutation.isPending} />{t('Consecrated person', language)}</label>
            </>}
            {groups.map((group) => <fieldset className='form-section' key={group.title}>
               <legend>{t(group.title, language)}</legend>
               {group.note && <p className='combat-note'>{group.note}</p>}
               <div className='stats-form-grid'>{group.fields.map((field) => <label className='field-group' key={field.name}>
                  <span>{t(field.label, language)}</span>
                  <input name={field.name} type='number' step={1} min={field.min} max={field.max}
                     defaultValue={field.value} required disabled={mutation.isPending} />
               </label>)}</div>
            </fieldset>)}
            <footer className='editor-actions'>
               <button className='quiet-button' type='button' onClick={onClose} disabled={mutation.isPending}>{t('Cancel', language)}</button>
               <button className='primary-button' type='submit' disabled={mutation.isPending}>{t(mutation.isPending ? 'Saving...' : 'Save', language)}</button>
            </footer>
         </form>
      </section>
   </div>
}
