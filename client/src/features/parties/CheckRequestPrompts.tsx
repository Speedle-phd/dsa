import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Dices } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthContext'
import { AttributeCheckDialog } from '@/features/heroes/AttributeCheckDialog'
import { getStatsForHero } from '@/features/heroes/statsApi'
import { talentCatalog } from '@/features/heroes/talentCatalog'
import { TalentProbeDialog } from '@/features/heroes/TalentProbeDialog'
import { useMyPartyHeroes, type MyPartyHero } from '@/features/encounter/myPartyFights'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { answerCheckRequest, checkRequestsKey, declineCheckRequest, useCheckRequests, type CheckRequest, type CheckResult } from './checkRequestApi'
import { checkTitle, fromAttributeCheck, fromTalentCheck, isAttribute, openForHero } from './checkRequests'

// Anywhere in the app (user request, Nov 2026): the GM's open check requests for the viewer's heroes, with
// "Roll" (the usual check dialog with the GM's modifier) and "Decline". Mounted once in App.
export function CheckRequestPrompts() {
   const { user } = useAuth()
   const heroes = useMyPartyHeroes(Boolean(user))
   if (!user) return null
   return <div className='check-prompts'>{heroes.map((hero) => <HeroPrompts key={hero.partyId} hero={hero} />)}</div>
}

function HeroPrompts({ hero }: { hero: MyPartyHero }) {
   const language = useLanguageStore((state) => state.language)
   const query = useCheckRequests(hero.partyId)
   const open = openForHero(query.data ?? [], hero.charId)
   // Requests open when the app loads are shown as cards only; new ones also get a toast
   const seen = useRef<Set<string> | null>(null)
   useEffect(() => {
      if (!query.data) return
      const ids = openForHero(query.data, hero.charId).map((request) => request.id)
      if (seen.current === null) {
         seen.current = new Set(ids)
         return
      }
      for (const request of openForHero(query.data, hero.charId)) {
         if (seen.current.has(request.id)) continue
         seen.current.add(request.id)
         toast(t('The game master asks for a check.', language), { description: checkTitle(request, language) })
      }
   }, [query.data, hero.charId, language])
   return <>{open.map((request) => <PromptCard key={request.id} hero={hero} request={request} />)}</>
}

function PromptCard({ hero, request }: { hero: MyPartyHero; request: CheckRequest }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const [rolling, setRolling] = useState(false)
   const stats = useQuery({ queryKey: ['stats', hero.charId], queryFn: () => getStatsForHero(hero.charId) })
   const refresh = () => void queryClient.invalidateQueries({ queryKey: checkRequestsKey(hero.partyId) })
   const answer = useMutation({
      mutationFn: (result: CheckResult) => answerCheckRequest(hero.partyId, request.id, hero.charId, result),
      onSuccess: () => {
         refresh()
         setRolling(false)
         toast.success(t('Result sent to the game master.', language))
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const decline = useMutation({
      mutationFn: () => declineCheckRequest(hero.partyId, request.id, hero.charId),
      onSuccess: refresh,
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const title = checkTitle(request, language)
   const heroName = request.targets.find((target) => target.charId === hero.charId)?.name ?? ''
   const talent = request.kind === 'talent' ? talentCatalog.find((entry) => entry.key === request.key) : undefined
   const extraSources = request.modifier ? [{ label: 'GM request', value: request.modifier }] : []
   const send = (result: CheckResult) => <div className='fight-followup'>
      <button className='primary-button' type='button' disabled={answer.isPending} onClick={() => answer.mutate(result)}>
         <Check size={16} aria-hidden='true' />{t('Send the result to the game master', language)}</button>
   </div>

   return <section className='check-prompt' aria-label={`${t('The game master asks for a check.', language)} ${title}`}>
      <p className='eyebrow'>{t('Check request', language)} · {heroName}</p>
      <h3>{title}</h3>
      {request.note && <p className='party-muted'>{request.note}</p>}
      <div className='check-prompt-actions'>
         <button className='primary-button' type='button' disabled={!stats.data} onClick={() => setRolling(true)}>
            <Dices size={16} aria-hidden='true' />{t('Roll the check', language)}</button>
         <button className='quiet-button' type='button' disabled={decline.isPending} onClick={() => decline.mutate()}>{t('Decline', language)}</button>
      </div>
      {rolling && stats.data && (talent
         ? <TalentProbeDialog stats={stats.data} talent={talent} value={stats.data.talents.find((entry) => entry.key === talent.key)?.value ?? 0}
            extraSources={extraSources} renderResult={(state) => send(fromTalentCheck(state))} onClose={() => setRolling(false)} />
         : isAttribute(request.key) && <AttributeCheckDialog stats={stats.data} attribute={request.key} extraSources={extraSources}
            renderResult={(roll) => send(fromAttributeCheck(roll))} onClose={() => setRolling(false)} />)}
   </section>
}
