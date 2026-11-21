import type { Hero } from './heroApi'
import { useModalKeyboard } from '../../components/useModalKeyboard'
import { t } from '@/locales/translation'
import { useLanguageStore } from '@/locales/languageStore'

type DeleteHeroDialogProps = {
   hero: Hero
   isDeleting: boolean
   onCancel: () => void
   onConfirm: () => void
}

export function DeleteHeroDialog({
   hero,
   isDeleting,
   onCancel,
   onConfirm,
}: DeleteHeroDialogProps) {
   const dialogRef = useModalKeyboard(onCancel)
   const language = useLanguageStore((state) => state.language)

   return (
      <div
         className='modal-backdrop'
         role='presentation'
         onMouseDown={onCancel}
      >
         <section
            ref={dialogRef}
            className='confirm-dialog'
            role='dialog'
            aria-modal='true'
            aria-labelledby='delete-title'
            onMouseDown={(event) => event.stopPropagation()}
         >
            <p className='eyebrow'>{t('Irreversible action', language)}</p>
            <h2 id='delete-title'>{t('Remove hero?', language)} {hero.name}</h2>
            <p>
               {t('This removes the hero and their associated stats from your registry.', language)}
            </p>
            <div className='editor-actions'>
               <button
                  className='quiet-button'
                  type='button'
                  onClick={onCancel}
               >
                  {t('Cancel', language)}
               </button>
               <button
                  className='danger-button'
                  type='button'
                  disabled={isDeleting}
                  onClick={onConfirm}
               >
                  {t(isDeleting ? 'Removing...' : 'Remove hero', language)}
               </button>
            </div>
         </section>
      </div>
   )
}
