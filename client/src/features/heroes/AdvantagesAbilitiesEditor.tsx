import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateAdvantagesAbilities, type AdvantagesAbilities } from './statsApi'
import { X } from 'lucide-react'
import { type Resolver, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useModalKeyboard } from '../../components/useModalKeyboard'
import { getApiErrorMessage } from './heroApi'
import {
   type Stats
} from './statsApi'
import { t } from '@/locales/translation'
import { useLanguageStore } from '@/locales/languageStore'

type StatsEditorProps = { stats: Stats; onClose: () => void }

const statsFormSchema = z.object({
      advantages: z.string(),
      disadvantages: z.string(),
      specialAbilities: z.string(),
   })

type StatsFormValues = z.infer<typeof statsFormSchema>

function listFrom(value: string) {
   return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
}

function defaultsFrom(stats: Stats): StatsFormValues {
   return {
      advantages: stats.advantages.join(', '),
      disadvantages: stats.disadvantages.join(', '),
      specialAbilities: stats.generalSpecialAbilities.join(', '),
   }
}

export function AdvantagesAbilitiesEditor({ stats, onClose }: StatsEditorProps) {
   const language = useLanguageStore((state) => state.language)
   const dialogRef = useModalKeyboard(onClose)
   const queryClient = useQueryClient()
   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm<StatsFormValues>({
      resolver: zodResolver(statsFormSchema) as Resolver<StatsFormValues>,
      defaultValues: defaultsFrom(stats),
   })
   const mutation = useMutation({
      mutationFn: (values: AdvantagesAbilities) =>
         updateAdvantagesAbilities(stats._id, values),
      onSuccess: async () => {
         await queryClient.invalidateQueries({
            queryKey: ['stats', stats.charId],
         })
         toast.success(t('Advantages and abilities were updated', language))
         onClose()
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
   })
   
   function submit(values: StatsFormValues) {
      const { advantages, disadvantages, specialAbilities } = values
      mutation.mutate({
         advantages: listFrom(advantages),
         disadvantages: listFrom(disadvantages),
         generalSpecialAbilities: listFrom(specialAbilities),
      })
   }

   return (
      <div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
         <section
            ref={dialogRef}
            className='hero-editor stats-editor'
            role='dialog'
            aria-modal='true'
            aria-labelledby='stats-editor-title'
            onMouseDown={(event) => event.stopPropagation()}
         >
            <header className='editor-header'>
               <div>
                  <p className='eyebrow'>{t('Manual configuration', language)}</p>
                  <h2 id='stats-editor-title'>{t('Edit Advantages and Abilities', language)}</h2>
               </div>
               <button
                  className='icon-button editor-close'
                  type='button'
                  onClick={onClose}
                  aria-label={t('Close stats editor', language)}
               >
                  <X size={20} />
               </button>
            </header>
            <form
               className='hero-form'
               onSubmit={handleSubmit(submit)}
               noValidate
            >
               <fieldset className='form-section'>
                  <legend>{t('Advantages and Abilities', language)}</legend>
                  <div className='stats-form-grid'>
                     <label className='field-group field-wide'>
                        <span>{t('Advantages', language)}</span>
                        <input
                           placeholder={t('Separate entries with commas', language)}
                           {...register('advantages')}
                        />
                     </label>
                     <label className='field-group field-wide'>
                        <span>{t('Disadvantages', language)}</span>
                        <input
                           placeholder={t('Separate entries with commas', language)}
                           {...register('disadvantages')}
                        />
                     </label>
                     <label className='field-group field-wide'>
                        <span>{t('Special abilities', language)}</span>
                        <input
                           placeholder={t('Separate entries with commas', language)}
                           {...register('specialAbilities')}
                        />
                     </label>
                  </div>
               </fieldset>
               {Object.keys(errors).length > 0 && (
                  <p className='field-error'>
                     {t('Please correct the highlighted values.', language)}
                  </p>
               )}
               <footer className='editor-actions'>
                  <button
                     className='quiet-button'
                     type='button'
                     onClick={onClose}
                  >
                     {t('Cancel', language)}
                  </button>
                  <button
                     className='primary-button'
                     type='submit'
                     disabled={mutation.isPending}
                  >
                     {t(mutation.isPending ? 'Saving...' : 'Save Advantages & Abilities', language)}
                  </button>
               </footer>
            </form>
         </section>
      </div>
   )
}
