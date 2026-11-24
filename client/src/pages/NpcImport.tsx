import { ArrowLeft, ClipboardPaste, TriangleAlert } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DashboardHeader } from '@/components/DashboardHeader'
import { PageHeading } from '@/components/PageHeading'
import { weaponSummary, type NpcDraftState } from '@/features/npcs/npcSheet'
import { parseStatBlock } from '@/features/npcs/statBlockParser'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'

// Paste one stat block from an adventure (user request, Nov 2026): read live, checked and completed in the editor
export function NpcImport() {
   const language = useLanguageStore((state) => state.language)
   const navigate = useNavigate()
   const [text, setText] = useState('')
   const deferred = useDeferredValue(text)
   const parsed = useMemo(() => deferred.trim() ? parseStatBlock(deferred) : null, [deferred])
   const sheet = parsed?.draft.sheet

   function takeOver() {
      if (!parsed) return
      const state: NpcDraftState = { name: parsed.name, draft: parsed.draft, source: 'import', warnings: parsed.warnings }
      navigate('/npcs/new', { state })
   }

   return <main className='dashboard-shell' lang={language}>
      <DashboardHeader />
      <section className='dashboard-content'>
         <Link className='back-link' to='/npcs'><ArrowLeft size={17} /> {t('NPC library', language)}</Link>
         <PageHeading Icon={ClipboardPaste} title={t('Paste a stat block', language)}
            description={t('Copy one stat block from an adventure (from the name line to "Schmerz +1 bei") and paste it here. German and English labels are read.', language)} />
         <div className='npc-import'>
            <section className='overview-section npc-import-input field-group'>
               <header className='section-heading'><h2 id='npc-import-text'>{t('Stat block', language)}</h2></header>
               <textarea rows={18} aria-labelledby='npc-import-text' value={text} spellCheck={false} placeholder={'Name\nMU 13 KL 11 IN 13 CH 12\nFF 11 GE 13 KO 13 KK 13\nLeP 31 AsP – KaP – INI 12+1W6\n…'}
                  onChange={(event) => setText(event.target.value)} />
            </section>
            <section className='overview-section npc-import-preview' aria-live='polite'>
               <header className='section-heading'><h2>{t('Recognised', language)}</h2></header>
               {!parsed && <p className='party-muted'>{t('The preview appears once you paste a stat block.', language)}</p>}
               {parsed && sheet && <>
                  <p><strong>{parsed.name || t('(no name found)', language)}</strong></p>
                  <dl className='initiative-stats'>
                     <div><dt>{t('LeP', language)}</dt><dd>{parsed.draft.maxHealth}</dd></div>
                     <div><dt>{t('INI', language)}</dt><dd>{parsed.draft.initiativeBase}+1W6</dd></div>
                     {parsed.draft.dodge !== null && <div><dt>{t('AW', language)}</dt><dd>{parsed.draft.dodge}</dd></div>}
                     {parsed.draft.defense !== null && <div><dt>{t('VW', language)}</dt><dd>{parsed.draft.defense}</dd></div>}
                     <div><dt>{t('RS', language)}/{t('BE', language)}</dt><dd>{parsed.draft.armor}/{sheet.burden}</dd></div>
                     {parsed.draft.speed !== null && <div><dt>{t('GS', language)}</dt><dd>{parsed.draft.speed}</dd></div>}
                     {sheet.actions > 1 && <div><dt>{t('Actions', language)}</dt><dd>{sheet.actions}</dd></div>}
                  </dl>
                  {sheet.weapons.length > 0 && <p className='npc-card-weapons'>{weaponSummary(sheet.weapons)}</p>}
                  <ul className='npc-import-counts'>
                     <li>{t('Attributes', language)}: {sheet.attributes ? '✓' : '—'}</li>
                     <li>{t('Special abilities', language)}: {sheet.abilities.length}</li>
                     <li>{t('Talents', language)}: {sheet.talents.length}</li>
                     <li>{t('Schmerz', language)}: {sheet.painThresholds?.length ? sheet.painThresholds.join(', ') : t('By the rule', language)}</li>
                     {sheet.fleeAt !== null && <li>{t('Flees at LeP', language)}: {sheet.fleeAt}</li>}
                  </ul>
                  {parsed.warnings.length > 0 && <div className='npc-import-warnings'>
                     <p><TriangleAlert size={16} aria-hidden='true' /> {t('Not read ({count}) — shown again in the editor:', language).replace('{count}', String(parsed.warnings.length))}</p>
                     <ul>{parsed.warnings.map((warning) => <li key={warning}><code>{warning}</code></li>)}</ul>
                  </div>}
               </>}
               <button className='primary-button' type='button' disabled={!parsed} onClick={takeOver}>{t('Check and save', language)}</button>
            </section>
         </div>
      </section>
   </main>
}
