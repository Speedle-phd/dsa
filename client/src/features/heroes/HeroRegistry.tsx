import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, UsersRound } from 'lucide-react'
import { toast } from 'sonner'
import { DeleteHeroDialog } from './DeleteHeroDialog'
import { HeroCard } from './HeroCard'
import { HeroEditor } from './HeroEditor'
import {
   createHero,
   deleteHero,
   getApiErrorMessage,
   getHeroes,
   type HeroInput,
   updateHero,
} from './heroApi'
import { useHeroStore } from './heroStore'
import { ArchetypeCreateButton, CreationDraftList, GuidedCreateButton } from '@/features/creation/CreationDrafts'
import { t } from '@/locales/translation'
import { PageHeading } from '@/components/PageHeading'
import { useLanguageStore } from '@/locales/languageStore'

export function HeroRegistry() {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const isEditorOpen = useHeroStore((state) => state.isEditorOpen)
   const editingHero = useHeroStore((state) => state.editingHero)
   const deletingHero = useHeroStore((state) => state.deletingHero)
   const openCreate = useHeroStore((state) => state.openCreate)
   const openEdit = useHeroStore((state) => state.openEdit)
   const closeEditor = useHeroStore((state) => state.closeEditor)
   const requestDelete = useHeroStore((state) => state.requestDelete)
   const closeDeleteDialog = useHeroStore((state) => state.closeDeleteDialog)
   const heroesQuery = useQuery({ queryKey: ['heroes'], queryFn: getHeroes })
   const refreshHeroes = () =>
      queryClient.invalidateQueries({ queryKey: ['heroes'] })
   const createMutation = useMutation({
      mutationFn: createHero,
      onSuccess: refreshHeroes,
   })
   const updateMutation = useMutation({
      mutationFn: ({ id, hero }: { id: string; hero: HeroInput }) =>
         updateHero(id, hero),
      onSuccess: refreshHeroes,
   })
   const deleteMutation = useMutation({
      mutationFn: deleteHero,
      onSuccess: refreshHeroes,
   })

   async function saveHero(values: HeroInput) {
      try {
         if (editingHero) {
            await updateMutation.mutateAsync({
               id: editingHero._id,
               hero: values,
            })
            toast.success(t('Hero updated', language))
         } else {
            await createMutation.mutateAsync(values)
            toast.success(t('Hero added to your registry', language))
         }
         closeEditor()
      } catch (error) {
         toast.error(getApiErrorMessage(error))
      }
   }

   async function confirmDelete() {
      if (!deletingHero) return
      try {
         await deleteMutation.mutateAsync(deletingHero._id)
         toast.success(t('Hero removed', language))
         closeDeleteDialog()
      } catch (error) {
         toast.error(getApiErrorMessage(error))
      }
   }

   return (
      <>
         <PageHeading Icon={UsersRound} title={t('Your heroes', language)} description={t('Keep every adventurer ready for the next tale.', language)}>
            <div className='add-hero-actions'>
               <GuidedCreateButton />
               <ArchetypeCreateButton />
               <button className='quiet-button' type='button' onClick={openCreate}>
                  <Plus size={18} /> {t('Quick create', language)}
               </button>
            </div>
         </PageHeading>
         <CreationDraftList />
         {heroesQuery.isPending && (
            <div className='state-panel'>{t('Loading your heroes...', language)}</div>
         )}
         {heroesQuery.isError && (
            <div className='state-panel'>
               <p>{t('We could not load your hero registry.', language)}</p>
               <button
                  className='quiet-button'
                  type='button'
                  onClick={() => heroesQuery.refetch()}
               >
                  {t('Try again', language)}
               </button>
            </div>
         )}
         {heroesQuery.data?.length === 0 && (
            <div className='empty-state'>
               <UsersRound size={30} />
               <h2>{t('Your registry is waiting', language)}</h2>
               <p>{t('Add your first hero to begin their chronicle.', language)}</p>
            </div>
         )}
         {heroesQuery.data && heroesQuery.data.length > 0 && (
            <div className='hero-grid'>
               {heroesQuery.data.map((hero) => (
                  <HeroCard
                     key={hero._id}
                     hero={hero}
                     onEdit={openEdit}
                     onDelete={requestDelete}
                  />
               ))}
            </div>
         )}
         {isEditorOpen && (
            <HeroEditor
               key={editingHero?._id ?? 'new'}
               hero={editingHero}
               isSaving={createMutation.isPending || updateMutation.isPending}
               onClose={closeEditor}
               onSave={saveHero}
            />
         )}
         {deletingHero && (
            <DeleteHeroDialog
               hero={deletingHero}
               isDeleting={deleteMutation.isPending}
               onCancel={closeDeleteDialog}
               onConfirm={confirmDelete}
            />
         )}
      </>
   )
}
