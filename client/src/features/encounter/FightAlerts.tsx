import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthContext'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { useEncounter } from './encounterApi'
import { alertFor, fightCallout, tabAttention, tabTitle, type FightCallout } from './fightCallout'
import { setTabBadge } from './tabBadge'
import { useMyPartyHeroes, type MyPartyHero } from './myPartyFights'

const titles: Record<FightCallout, string> = { defend: 'Defend!', initiative: 'Roll your initiative', turn: 'Your turn', fight: 'Party fight' }

// Anywhere in the app (user request, Nov 2026): a toast when the party fight needs one of the viewer's heroes; while it is
// the hero's turn or the hero must defend, the tab title starts with a symbol and the message and the tab icon gets a
// coloured dot (red: defend, amber: turn). Mounted once in App.
export function FightAlerts() {
   const { user } = useAuth()
   const language = useLanguageStore((state) => state.language)
   const heroes = useMyPartyHeroes(Boolean(user))
   const [callouts, setCallouts] = useState<Record<string, FightCallout | null>>({})
   const attention = user ? tabAttention(heroes.map((hero) => callouts[hero.partyId] ?? null)) : null

   useEffect(() => {
      document.title = tabTitle(attention, t('DSA5 Hero Sheets', language), attention ? t(titles[attention], language) : '')
      void setTabBadge(attention)
   }, [attention, language])
   // Signing out leaves a plain tab
   useEffect(() => () => void setTabBadge(null), [])

   if (!user) return null
   return <>{heroes.map((hero) => <PartyFightWatcher key={hero.partyId} hero={hero}
      onCallout={(value) => setCallouts((current) => current[hero.partyId] === value ? current : { ...current, [hero.partyId]: value })} />)}</>
}

function PartyFightWatcher({ hero, onCallout }: { hero: MyPartyHero; onCallout: (value: FightCallout | null) => void }) {
   const language = useLanguageStore((state) => state.language)
   const navigate = useNavigate()
   const { pathname } = useLocation()
   const fightPath = `/parties/${hero.partyId}/fight`
   const callout = fightCallout(useEncounter(hero.partyId).data, hero.charId)
   const previous = useRef<FightCallout | null | undefined>(undefined)
   const onFightPage = pathname === fightPath

   useEffect(() => {
      const alert = alertFor(previous.current, callout, onFightPage)
      previous.current = callout
      if (!alert) return
      // One toast per party: a newer state replaces the older one
      toast(t(titles[alert], language), {
         id: `fight-${hero.partyId}`, description: `${t('Party fight', language)} · ${hero.partyName}`,
         duration: alert === 'initiative' ? 8000 : 15000,
         action: { label: t('Go to the party fight', language), onClick: () => navigate(fightPath) },
      })
   }, [callout, onFightPage, language, hero.partyId, hero.partyName, fightPath, navigate])

   useEffect(() => onCallout(callout), [callout, onCallout])
   return null
}
