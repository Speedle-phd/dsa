import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Eye } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DashboardHeader } from '@/components/DashboardHeader'
import { PageHeading } from '@/components/PageHeading'
import type { Stats } from '@/features/heroes/statsApi'
import { getAttributeAbbreviation, talentCatalog, talentCategoryLabels, type TalentAttribute, type TalentCategory } from '@/features/heroes/talentCatalog'
import { getPartySheet, partySheetKey } from '@/features/parties/partyApi'
import { subscribeParty } from '@/realtime/socket'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { equipmentDisplayName } from '@/utils/storePricing'

const attributes: TalentAttribute[] = ['courage', 'wisdom', 'intuition', 'charisma', 'fingerDexterity', 'dexterity', 'constitution', 'strength']

// Read-only sheet of a party hero for the GM, the owner, or members when the owner shares the full sheet.
// A compact view of the stored values; rolling and editing stay on the owner's own hero page.
export function PartySheet() {
   const { partyId = '', charId = '' } = useParams()
   const language = useLanguageStore((state) => state.language)
   useEffect(() => subscribeParty(partyId), [partyId])
   const query = useQuery({ queryKey: partySheetKey(partyId, charId), queryFn: () => getPartySheet(partyId, charId), retry: false })
   const sheet = query.data

   return <main className='dashboard-shell' lang={language}>
      <DashboardHeader />
      <section className='dashboard-content'>
         <Link className='back-link' to={`/parties/${partyId}`}><ArrowLeft size={17} /> {t('Back to the party', language)}</Link>
         {query.isPending && <div className='state-panel'>{t('Loading the sheet...', language)}</div>}
         {query.isError && <div className='state-panel'>{t('This sheet is not shared with you.', language)}</div>}
         {sheet && <>
            <PageHeading Icon={Eye} title={sheet.char.name}
               description={[sheet.char.species, sheet.char.culture, sheet.char.profession].filter(Boolean).join(' · ')} />
            <p className='party-muted'>{t('Read-only view. Values update live.', language)}</p>
            <SheetBody stats={sheet.stats} />
         </>}
      </section>
   </main>
}

function SheetBody({ stats }: { stats: Stats }) {
   const language = useLanguageStore((state) => state.language)
   const talentValue = (key: string) => stats.talents.find((entry) => entry.key === key)?.value ?? 0
   const categories = [...new Set(talentCatalog.map((talent) => talent.category))] as TalentCategory[]
   const bars: Array<[string, { current: number; max: number } | undefined]> = [
      ['Life energy', stats.health], ['Astral energy', stats.mana.max > 0 ? stats.mana : undefined],
      ['Karma energy', stats.karmaEnergy.max > 0 ? { current: stats.karmaEnergy.current ?? stats.karmaEnergy.max, max: stats.karmaEnergy.max } : undefined],
   ]
   const lists: Array<[string, string[]]> = [
      ['Advantages', stats.advantages], ['Disadvantages', stats.disadvantages],
      ['Special abilities', [...stats.generalSpecialAbilities, ...stats.combatSpecialAbilities]],
      ['Spells', stats.spells.map((spell) => `${spell.key} ${spell.value}`)],
      ['Liturgies', (stats.liturgies ?? []).map((liturgy) => `${liturgy.key} ${liturgy.value}`)],
   ]

   return <div className='party-sheet'>
      <section className='overview-section'>
         <header className='section-heading'><h2>{t('Attributes', language)}</h2></header>
         <dl className='party-attributes'>
            {attributes.map((key) => <div key={key}><dt>{getAttributeAbbreviation(key, language)}</dt><dd>{stats[key]}</dd></div>)}
         </dl>
      </section>
      <section className='overview-section'>
         <header className='section-heading'><h2>{t('Resources', language)}</h2></header>
         {bars.map(([label, value]) => value && <div key={label} className='resource-meter'>
            <div className='resource-label'><span>{t(label, language)}</span><strong>{value.current} <small>/ {value.max}</small></strong></div>
            <div className='resource-track'><span style={{ width: `${value.max ? Math.min(100, (value.current / value.max) * 100) : 0}%` }} /></div>
         </div>)}
         <dl className='party-facts'>
            <div><dt>{t('Pain', language)}</dt><dd>{stats.pain}</dd></div>
            <div><dt>{t('Fate points', language)}</dt><dd>{stats.fatePoints.current} / {stats.fatePoints.max}</dd></div>
            <div><dt>{t('Dodge', language)}</dt><dd>{stats.dodge.max}</dd></div>
            <div><dt>SK / ZK</dt><dd>{stats.soulPower.max} / {stats.toughness.max}</dd></div>
         </dl>
         {(stats.statuses.length > 0 || stats.permanentStatuses.length > 0) && <ul className='party-chips'>
            {[...new Set([...stats.statuses, ...stats.permanentStatuses])].map((status) => <li key={status} lang='de'>{status}</li>)}
         </ul>}
      </section>
      <section className='overview-section'>
         <header className='section-heading'><h2>{t('Combat values', language)}</h2></header>
         <table className='party-table'>
            <thead><tr><th>{t('Combat technique', language)}</th><th>AT</th><th>PA</th></tr></thead>
            <tbody>{stats.combatValues.map((row) => <tr key={row.key}><td>{t(row.key, language)}</td><td>{row.attack}</td><td>{row.parry ?? '—'}</td></tr>)}</tbody>
         </table>
      </section>
      <section className='overview-section'>
         <header className='section-heading'><h2>{t('Talents', language)}</h2></header>
         <div className='party-talents'>
            {categories.map((category) => <div key={category}>
               <h3>{t(talentCategoryLabels[category], language)}</h3>
               <table className='party-table'><tbody>
                  {talentCatalog.filter((talent) => talent.category === category).map((talent) =>
                     <tr key={talent.key}><td>{t(talent.label, language)}</td><td>{talentValue(talent.key)}</td></tr>)}
               </tbody></table>
            </div>)}
         </div>
      </section>
      {lists.filter(([, items]) => items.length > 0).map(([title, items]) => <section key={title} className='overview-section'>
         <header className='section-heading'><h2>{t(title, language)}</h2></header>
         <ul className='party-chips'>{items.map((item) => <li key={item} lang='de'>{item}</li>)}</ul>
      </section>)}
      <section className='overview-section'>
         <header className='section-heading'><h2>{t('Equipment', language)}</h2></header>
         {stats.equipment.length === 0 ? <p className='party-muted'>{t('No equipment yet.', language)}</p> : <ul className='party-chips'>
            {stats.equipment.map((entry, index) => <li key={`${entry.item}-${index}`}>{entry.amount > 1 ? `${entry.amount} × ` : ''}{equipmentDisplayName(entry.item, language)}</li>)}
         </ul>}
      </section>
   </div>
}
