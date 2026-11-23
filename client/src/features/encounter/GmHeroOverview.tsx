import { useQuery } from '@tanstack/react-query'
import { FileText, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { heroInitiative } from '@/features/heroes/fightHelpers'
import { levelsLabel } from '@/features/parties/levels'
import { getPartySheet, partySheetKey } from '@/features/parties/partyApi'
import { Meter } from '@/features/parties/PartyMemberCard'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import type { Encounter, HeroCombatant } from './encounterApi'
import { heroOverview } from './heroOverview'
import { TokenBadge } from './Token'

// GM only: the fight-relevant values of every hero in the fight, live from the heroes' sheets (user request, Nov 2026)
export function GmHeroOverview({ encounter, partyId }: { encounter: Encounter; partyId: string }) {
   const language = useLanguageStore((state) => state.language)
   const heroes = encounter.combatants.filter((entry): entry is HeroCombatant => entry.kind === 'hero')
   if (!heroes.length) return null
   return <section className='overview-section gm-hero-overview'>
      <header className='section-heading'><h2>{t('Heroes in the fight', language)}</h2></header>
      <p className='party-muted'>{t('Values with Schmerz, Zustände and Belastung; without the player\'s stance, Schips, situation and active effects.', language)}</p>
      <ul className='gm-hero-list'>
         {heroes.map((hero) => <GmHeroCard key={hero.id} hero={hero} partyId={partyId} active={hero.id === encounter.activeId} />)}
      </ul>
   </section>
}

function GmHeroCard({ hero, partyId, active }: { hero: HeroCombatant; partyId: string; active: boolean }) {
   const language = useLanguageStore((state) => state.language)
   const sheet = useQuery({ queryKey: partySheetKey(partyId, hero.charId), queryFn: () => getPartySheet(partyId, hero.charId), retry: false })
   const stats = sheet.data?.stats
   const overview = stats && sheet.data ? heroOverview(stats, sheet.data.char.species) : null
   const signedLevel = (label: string, level: number) => `${t(label, language)} ${levelsLabel(level)}`

   return <li className={active ? 'gm-hero is-active' : 'gm-hero'}>
      <details>
         <summary>
            <TokenBadge combatant={hero} />
            <span className='gm-hero-title'>
               <strong>{hero.name}</strong>
               <small>{overview
                  ? [`${t('LeP', language)} ${overview.health.current} / ${overview.health.max}`, overview.pain > 0 && signedLevel('Pain', overview.pain),
                     `${t('INI', language)} ${hero.initiative ?? '—'}`].filter(Boolean).join(' · ')
                  : t(sheet.isError ? 'The sheet could not be loaded.' : 'Loading the sheet...', language)}</small>
            </span>
            {overview && overview.blocked.length > 0 && <TriangleAlert className='gm-hero-alert' size={17} aria-label={t('Attack or defense blocked', language)} />}
         </summary>
         {overview && stats && <div className='gm-hero-body'>
            <Meter label={t('Life energy', language)} value={overview.health} />
            {overview.mana && <Meter label={t('Astral energy', language)} value={overview.mana} />}
            {overview.karma && <Meter label={t('Karma energy', language)} value={overview.karma} />}
            <dl className='initiative-stats'>
               <div><dt>{t('Pain', language)}</dt><dd>{levelsLabel(overview.pain)}</dd></div>
               <div><dt>{t('Fate points', language)}</dt><dd>{overview.fate.current} / {overview.fate.max}</dd></div>
               <div><dt>{t('INI', language)}</dt><dd>{hero.initiative ?? '—'} <small>({t('Base', language)} {heroInitiative(stats).base})</small></dd></div>
               <div><dt>{t('AW', language)}</dt><dd>{overview.dodge}</dd></div>
               <div><dt>{t('RS', language)}</dt><dd>{overview.armor}</dd></div>
               <div><dt>{t('BE', language)}</dt><dd>{overview.burden}</dd></div>
               <div><dt>{t('GS', language)}</dt><dd>{overview.speed ?? '—'}</dd></div>
            </dl>
            {overview.blocked.length > 0 && <ul className='field-error probe-blocked'>{overview.blocked.map((reason) => <li key={reason}>{t(reason, language)}</li>)}</ul>}
            <table className='gm-hero-weapons'>
               <thead><tr><th scope='col'>{t('Weapon', language)}</th><th scope='col'>{t('AT', language)}</th><th scope='col'>{t('PA', language)}</th><th scope='col'>{t('TP', language)}</th></tr></thead>
               <tbody>{overview.weapons.map((weapon) => <tr key={weapon.key}>
                  <th scope='row'>{t(weapon.label, language)}{weapon.notes.length > 0 && <small>{weapon.notes.map((note) => t(note, language)).join(' · ')}</small>}</th>
                  <td>{weapon.at ?? '—'}</td><td>{weapon.pa ?? '—'}</td><td>{weapon.tp ?? '—'}</td>
               </tr>)}</tbody>
            </table>
            {overview.statuses.length + overview.conditions.length > 0
               ? <ul className='party-chips' aria-label={t('Status and conditions', language)}>
                  {overview.statuses.map((status) => <li key={status} lang='de'>{status}</li>)}
                  {overview.conditions.map((entry) => <li key={entry.name}>{signedLevel(entry.name, entry.level)}</li>)}
               </ul>
               : <p className='party-muted'>{t('No statuses or conditions.', language)}</p>}
            {overview.combatAbilities.length > 0 && <p className='party-muted'><strong>{t('Combat special abilities', language)}:</strong> <span lang='de'>{overview.combatAbilities.join(', ')}</span></p>}
            <Link className='quiet-button' to={`/parties/${partyId}/heroes/${hero.charId}`}><FileText size={15} aria-hidden='true' />{t('Open sheet', language)}</Link>
         </div>}
      </details>
   </li>
}
