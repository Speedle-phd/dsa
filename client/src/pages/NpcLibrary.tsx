import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Copy, FilePlus2, Pencil, Search, Skull, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { DashboardHeader } from '@/components/DashboardHeader'
import { PageHeading } from '@/components/PageHeading'
import { getBestiaryReference } from '@/features/heroes/bestiaryApi'
import { deleteNpc, duplicateNpc, npcLibraryKey, useNpcLibrary, type NpcTemplate } from '@/features/npcs/npcApi'
import { draftWeapons, emptyDraft, fromBestiary, weaponSummary, type NpcDraftState, type NpcSource } from '@/features/npcs/npcSheet'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'

const sourceLabels: Record<NpcSource, string> = { manual: 'Manual', import: 'Imported', generator: 'Generated', bestiary: 'Bestiary' }

// The GM's NPC library (user request, Nov 2026): NPCs for every party and fight, made by pasting a stat block,
// by the generator, from the bestiary, or by hand
export function NpcLibrary() {
   const language = useLanguageStore((state) => state.language)
   const navigate = useNavigate()
   const query = useNpcLibrary()
   const [search, setSearch] = useState('')
   const bestiary = useQuery({ queryKey: ['bestiary-reference'], queryFn: getBestiaryReference, staleTime: Infinity })
   const start = (state: NpcDraftState) => navigate('/npcs/new', { state })
   const needle = search.trim().toLowerCase()
   const shown = (query.data ?? []).filter((template) => !needle || template.name.toLowerCase().includes(needle)
      || template.tags.some((tag) => tag.toLowerCase().includes(needle)))

   return <main className='dashboard-shell' lang={language}>
      <DashboardHeader />
      <section className='dashboard-content'>
         <Link className='back-link' to='/parties'><ArrowLeft size={17} /> {t('All parties', language)}</Link>
         <PageHeading Icon={Skull} title={t('NPC library', language)}
            description={t('Your opponents and NPCs for every party: paste a stat block from an adventure, generate one, or take a creature from the bestiary.', language)}>
            <div className='add-hero-actions'>
               <Link className='primary-button' to='/npcs/import'><FilePlus2 size={16} aria-hidden='true' />{t('Paste a stat block', language)}</Link>
               <Link className='quiet-button' to='/npcs/generate'>{t('Generate', language)}</Link>
               <button className='quiet-button' type='button' onClick={() => start({ name: '', draft: emptyDraft(), source: 'manual' })}>{t('Blank NPC', language)}</button>
               {bestiary.data && <label className='field-group npc-library-bestiary'>
                  <span className='sr-only'>{t('From the bestiary', language)}</span>
                  <select value='' aria-label={t('From the bestiary', language)} onChange={(event) => {
                     const creature = bestiary.data.creatures.find((entry) => entry.key === event.target.value)
                     if (creature) start({ ...fromBestiary(creature, language), source: 'bestiary' })
                  }}>
                     <option value=''>{t('From the bestiary', language)}…</option>
                     {bestiary.data.creatures.map((creature) => <option key={creature.key} value={creature.key}>{creature.key}</option>)}
                  </select>
               </label>}
            </div>
         </PageHeading>

         {query.isPending && <div className='state-panel'>{t('Loading…', language)}</div>}
         {query.isError && <div className='state-panel'>{t('The NPC library is not available.', language)}
            <button className='quiet-button' type='button' onClick={() => query.refetch()}>{t('Try again', language)}</button></div>}
         {query.data && query.data.length === 0 && <div className='state-panel'>{t('No NPCs yet. Paste a stat block or generate one to begin.', language)}</div>}
         {query.data && query.data.length > 0 && <>
            <label className='npc-library-search'>
               <Search size={16} aria-hidden='true' />
               <input type='search' value={search} placeholder={t('Search by name or tag', language)} aria-label={t('Search by name or tag', language)}
                  onChange={(event) => setSearch(event.target.value)} />
            </label>
            <ul className='npc-library-grid'>{shown.map((template) => <NpcCard key={template._id} template={template} />)}</ul>
            {shown.length === 0 && <p className='party-muted'>{t('No NPC matches the search.', language)}</p>}
         </>}
      </section>
   </main>
}

function NpcCard({ template }: { template: NpcTemplate }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const refresh = () => void queryClient.invalidateQueries({ queryKey: npcLibraryKey })
   const duplicate = useMutation({ mutationFn: () => duplicateNpc(template._id), onSuccess: refresh, onError: (error) => toast.error(getErrorMessage(error)) })
   const remove = useMutation({ mutationFn: () => deleteNpc(template._id), onSuccess: refresh, onError: (error) => toast.error(getErrorMessage(error)) })
   const { values } = template
   const weapons = draftWeapons(values)
   return <li className='npc-card'>
      <header>
         <h2>{template.name}</h2>
         <span className='party-badge'>{t(sourceLabels[template.source], language)}</span>
      </header>
      <dl className='initiative-stats'>
         <div><dt>{t('LeP', language)}</dt><dd>{values.maxHealth}</dd></div>
         <div><dt>{t('INI', language)}</dt><dd>{values.initiativeBase}+1W6</dd></div>
         <div><dt>{t('RS', language)}</dt><dd>{values.armor}</dd></div>
         {values.dodge !== null && <div><dt>{t('AW', language)}</dt><dd>{values.dodge}</dd></div>}
         {values.defense !== null && <div><dt>{t('VW', language)}</dt><dd>{values.defense}</dd></div>}
      </dl>
      {weapons.length > 0 && <p className='npc-card-weapons'>{weaponSummary(weapons)}</p>}
      {template.tags.length > 0 && <ul className='party-chips'>{template.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
      <div className='npc-card-actions'>
         <Link className='quiet-button' to={`/npcs/${template._id}`}><Pencil size={15} aria-hidden='true' />{t('Edit', language)}</Link>
         <button className='icon-button' type='button' disabled={duplicate.isPending} aria-label={`${t('Duplicate', language)}: ${template.name}`} title={t('Duplicate', language)}
            onClick={() => duplicate.mutate()}><Copy size={16} aria-hidden='true' /></button>
         <button className='icon-button' type='button' disabled={remove.isPending} aria-label={`${t('Delete', language)}: ${template.name}`} title={t('Delete', language)}
            onClick={() => { if (window.confirm(t('Delete this NPC from your library?', language))) remove.mutate() }}><Trash2 size={16} aria-hidden='true' /></button>
      </div>
   </li>
}
