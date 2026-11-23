import { useQuery } from '@tanstack/react-query'
import { Shield, Swords } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useScrollingDown } from '@/components/scrollHooks'
import { getParties, partiesKey } from '@/features/parties/partyApi'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { useEncounter } from './encounterApi'
import { fightCallout, type FightCallout } from './fightCallout'

const labels: Record<FightCallout, string> = { defend: 'Defend!', initiative: 'Roll your initiative', turn: 'Your turn', fight: 'Party fight' }

// Floating link above the dice launcher while the hero fights in its party (a hero is in at most one active party)
export function FightQuicklink({ heroId }: { heroId: string }) {
   const parties = useQuery({ queryKey: partiesKey, queryFn: getParties })
   const party = parties.data?.find((entry) => entry.status === 'active' && entry.myHero?.charId === heroId && entry.myHero.state === 'accepted')
   return party ? <PartyFightLink partyId={party._id} heroId={heroId} /> : null
}

function PartyFightLink({ partyId, heroId }: { partyId: string; heroId: string }) {
   const language = useLanguageStore((state) => state.language)
   const scrollingDown = useScrollingDown()
   const callout = fightCallout(useEncounter(partyId).data, heroId)
   if (!callout) return null
   const label = t(labels[callout], language)
   const Icon = callout === 'defend' ? Shield : Swords
   return <Link to={`/parties/${partyId}/fight`} className={['fight-quicklink', `is-${callout}`, scrollingDown ? 'is-tucked' : ''].filter(Boolean).join(' ')}
      aria-label={`${t('Go to the party fight', language)}: ${label}`} title={t('Go to the party fight', language)}>
      <Icon size={18} aria-hidden='true' /><span>{label}</span>
   </Link>
}
