import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Skull } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { DashboardHeader } from '@/components/DashboardHeader'
import { PageHeading } from '@/components/PageHeading'
import { createNpc, npcLibraryKey, updateNpc, useNpcLibrary } from '@/features/npcs/npcApi'
import { NpcEditor } from '@/features/npcs/NpcEditor'
import { emptyDraft, emptySheet, type NpcDraftState } from '@/features/npcs/npcSheet'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'

// Create (`/npcs/new`, draft from the library page) or edit (`/npcs/:templateId`) one NPC of the library
export function NpcEditPage() {
   const language = useLanguageStore((state) => state.language)
   const { templateId } = useParams()
   const navigate = useNavigate()
   const queryClient = useQueryClient()
   const draftState = useLocation().state as NpcDraftState | null
   const library = useNpcLibrary()
   const existing = templateId ? library.data?.find((template) => template._id === templateId) : undefined
   const save = useMutation({
      mutationFn: (input: { name: string; tags: string[]; values: Parameters<typeof createNpc>[0]['values'] }) => existing
         ? updateNpc(existing._id, { ...input, source: existing.source })
         : createNpc({ ...input, source: draftState?.source ?? 'manual' }),
      onSuccess: (template) => {
         void queryClient.invalidateQueries({ queryKey: npcLibraryKey })
         toast.success(t('NPC saved: {name}', language).replace('{name}', template.name))
         navigate('/npcs')
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   const waiting = templateId && library.isPending
   const missing = templateId && library.isSuccess && !existing
   const initial = existing ? { ...existing.values, sheet: existing.values.sheet ?? { ...emptySheet() } } : draftState?.draft ?? emptyDraft()

   return <main className='dashboard-shell' lang={language}>
      <DashboardHeader />
      <section className='dashboard-content'>
         <Link className='back-link' to='/npcs'><ArrowLeft size={17} /> {t('NPC library', language)}</Link>
         <PageHeading Icon={Skull} title={existing ? existing.name : t('New NPC', language)}
            description={t('A stat block as printed in adventures (S. 354). Only name and LeP are required.', language)} />
         {waiting && <div className='state-panel'>{t('Loading…', language)}</div>}
         {missing && <div className='state-panel'>{t('This NPC was not found.', language)}</div>}
         {!waiting && !missing && <NpcEditor key={existing?._id ?? 'new'} initialName={existing?.name ?? draftState?.name ?? ''} initialTags={existing?.tags ?? []}
            initial={initial} warnings={existing ? [] : draftState?.warnings} pending={save.isPending}
            onSave={(input) => save.mutate(input)} onCancel={() => navigate('/npcs')} />}
      </section>
   </main>
}
