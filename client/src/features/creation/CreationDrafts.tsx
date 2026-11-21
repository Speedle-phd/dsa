import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Hammer, Trash2, Wand2, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { getAttributeAbbreviation } from '@/features/heroes/talentCatalog'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { attributeOrder, createCreationDraft, creationDraftsKey, creationSections, deleteCreationDraft, listCreationDrafts, sectionLabels, useCreationReference } from './creationApi'

// "Create hero" on the dashboard: starts a guided creation draft.
export function GuidedCreateButton() {
   const language = useLanguageStore((state) => state.language)
   const navigate = useNavigate()
   const create = useMutation({
      mutationFn: () => createCreationDraft(),
      onSuccess: (draft) => navigate(`/create/${draft._id}`),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   return <button className='primary-button add-hero-button' type='button' disabled={create.isPending} onClick={() => create.mutate()}>
      <Wand2 size={18} /> {t('Create hero', language)}
   </button>
}

// "From an archetype": one of the twelve finished heroes of the core rules (S. 62–85) as a filled draft
export function ArchetypeCreateButton() {
   const language = useLanguageStore((state) => state.language)
   const [open, setOpen] = useState(false)
   return <>
      <button className='quiet-button' type='button' onClick={() => setOpen(true)}><BookOpen size={18} /> {t('From an archetype', language)}</button>
      {open && <ArchetypeDialog onClose={() => setOpen(false)} />}
   </>
}

function ArchetypeDialog({ onClose }: { onClose: () => void }) {
   const language = useLanguageStore((state) => state.language)
   const navigate = useNavigate()
   const dialogRef = useModalKeyboard(onClose)
   const archetypes = useCreationReference().data?.archetypes ?? []
   const create = useMutation({
      mutationFn: (key: string) => createCreationDraft('Erfahren', key),
      onSuccess: (draft) => navigate(`/create/${draft._id}`),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   return <div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
      <section ref={dialogRef} className='hero-editor archetype-dialog' role='dialog' aria-modal='true' aria-labelledby='archetype-title' onMouseDown={(event) => event.stopPropagation()}>
         <header className='editor-header'>
            <div>
               <p className='eyebrow'>{t('Guided creation', language)}</p>
               <h2 id='archetype-title'>{t('Start from an archetype', language)}</h2>
            </div>
            <button className='icon-button editor-close' type='button' onClick={onClose} aria-label={t('Close', language)}><X size={20} /></button>
         </header>
         <p className='creation-intro'>{t('The twelve example heroes of the rulebook (Erfahren, S. 62–85). The draft opens on the summary with its open points; every value stays editable.', language)}</p>
         <ul className='archetype-list'>
            {archetypes.map((archetype) => <li key={archetype.key}>
               <button type='button' disabled={create.isPending} onClick={() => create.mutate(archetype.key)}>
                  <strong>{archetype.key}</strong>
                  <span lang='de'>{archetype.profession}{archetype.variant ? ` (${archetype.variant})` : ''}</span>
                  <small lang='de'>{archetype.species} · {archetype.culture} · {t('S.', language)} {archetype.page}</small>
                  <small className='archetype-attributes'>{attributeOrder.map((key) => `${getAttributeAbbreviation(key, language)} ${archetype.attributes[key]}`).join(' · ')}</small>
                  {archetype.note && <small className='archetype-note' lang='de'>{archetype.note}</small>}
               </button>
            </li>)}
         </ul>
      </section>
   </div>
}

// Heroes still in guided creation: resume or discard.
export function CreationDraftList() {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const drafts = useQuery({ queryKey: creationDraftsKey, queryFn: listCreationDrafts }).data ?? []
   const discard = useMutation({
      mutationFn: deleteCreationDraft,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: creationDraftsKey }),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   if (!drafts.length) return null
   return <section className='creation-drafts' aria-label={t('Heroes in creation', language)}>
      <h2><Hammer size={17} /> {t('Heroes in creation', language)}</h2>
      <ul>
         {drafts.map((draft) => <li key={draft._id}>
            <Link to={`/create/${draft._id}`}>
               <strong>{draft.name || t('New hero', language)}</strong>
               <small>{[draft.species, draft.culture, draft.level].filter(Boolean).join(' · ')} · {t('Step', language)} {creationSections.indexOf(draft.step) + 1}/{creationSections.length}: {t(sectionLabels[draft.step], language)}</small>
            </Link>
            <button className='icon-button' type='button' disabled={discard.isPending} aria-label={`${t('Discard draft', language)}: ${draft.name || t('New hero', language)}`}
               onClick={() => discard.mutate(draft._id)}><Trash2 size={15} /></button>
         </li>)}
      </ul>
   </section>
}
