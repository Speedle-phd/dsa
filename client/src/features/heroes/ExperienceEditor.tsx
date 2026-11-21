import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { type Path, type Resolver, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { getApiErrorMessage } from './heroApi'
import { t } from '@/locales/translation'
import { useLanguageStore } from '@/locales/languageStore'
import {
   type ExperienceGathered,
   type Stats,
   updateExperience,
} from './statsApi'

type StatsEditorProps = { stats: Stats; onClose: () => void }

const valueSchema = z.number()

const statsFormSchema = z.object({
   experience: z.object({
      gathered: valueSchema,
   }),
})

type StatsFormValues = z.infer<typeof statsFormSchema>

function defaultsFrom(): StatsFormValues {
   return {
      experience: {
         gathered: 0,
      },
   }
}
export function ExperienceEditor({ stats, onClose }: StatsEditorProps) {
   const language = useLanguageStore((state) => state.language)
   const dialogRef = useModalKeyboard(onClose)
   const queryClient = useQueryClient()
   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm<StatsFormValues>({
      resolver: zodResolver(statsFormSchema) as Resolver<StatsFormValues>,
      defaultValues: defaultsFrom(),
   })
   const mutation = useMutation({
      mutationFn: (values: ExperienceGathered) =>
         updateExperience(stats._id, values),
      onSuccess: async () => {
         await queryClient.invalidateQueries({
            queryKey: ['stats', stats.charId],
         })
         toast.success(t('Experience updated', language))
         onClose()
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
   })
   const number = (name: Path<StatsFormValues>) =>
      register(name, { valueAsNumber: true })

   function submit(values: StatsFormValues) {
      const { experience } = values
      mutation.mutate({
         gathered: experience.gathered,
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
                  <h2 id='stats-editor-title'>{t('Increase Experience', language)}</h2>
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
                  <legend>{t('Experience', language)}</legend>
                  <div className='stats-form-grid'>
                     <label className='field-group'>
                        <span>{t('Experience gained', language)}</span>
                        <input
                           type='number'
                           min='0'
                           {...number('experience.gathered')}
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
                     {t(mutation.isPending ? 'Saving...' : 'Save Experience', language)}
                  </button>
               </footer>
            </form>
         </section>
      </div>
   )
}
