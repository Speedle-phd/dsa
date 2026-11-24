import { useEffect, useRef } from 'react'
import { useFightStore } from '@/features/heroes/fightStore'
import { savePanel, type Encounter, type HeroCombatant } from './encounterApi'
import { fightFromPanel, panelFromFight } from './heroPanel'

// The player's panel state for the KR goes to the server (user request, Nov 2026): the GM overview applies it and another
// device of the player starts from it. A device first adopts an existing copy, then writes its changes (400 ms debounce).
export function usePanelMirror(encounter: Encounter | null | undefined, hero: HeroCombatant | null, partyId: string) {
   const fight = useFightStore((state) => hero ? state.fights[hero.charId] : undefined)
   const encounterId = encounter?._id
   const linked = Boolean(encounterId && hero && fight?.party?.encounterId === encounterId)
   const synced = linked && fight?.panelSynced === encounterId
   const server = hero?.panel ?? null
   const snapshot = synced && fight ? JSON.stringify(panelFromFight(fight)) : null
   const serverCopy = server ? JSON.stringify(server) : null
   const sent = useRef<string | null>(null)

   // Adopt once per device and fight; an empty server copy means this device starts it
   useEffect(() => {
      if (!linked || synced || !hero || !fight || !encounterId) return
      const store = useFightStore.getState()
      store.update(hero.charId, { ...(server && server.round === fight.round ? fightFromPanel(server, fight) : {}), panelSynced: encounterId })
   }, [linked, synced, hero, fight, server, encounterId])

   useEffect(() => {
      if (!snapshot || !hero || snapshot === serverCopy || snapshot === sent.current) return
      const timer = window.setTimeout(() => {
         sent.current = snapshot
         savePanel(partyId, hero.id, JSON.parse(snapshot)).catch(() => { sent.current = null })
      }, 400)
      return () => window.clearTimeout(timer)
   }, [snapshot, serverCopy, hero, partyId])
}

// A hit applied by the server still disturbs a spell being cast (S. 229), may trigger Blutrausch (S. 171) and goes into
// the panel's own log
export function useHitEffects(encounter: Encounter | null | undefined, hero: HeroCombatant | null) {
   useEffect(() => {
      if (!encounter || !hero) return
      const store = useFightStore.getState()
      const fight = store.fights[hero.charId]
      if (!fight || fight.party?.encounterId !== encounter._id) return
      const seen = new Set(fight.seenHits ?? [])
      const hits = encounter.attacks.filter((attack) => attack.status === 'hit' && attack.targetId === hero.id && !seen.has(attack.id))
      if (!hits.length) return
      let casting = fight.casting ?? null
      for (const hit of hits) {
         const sp = hit.sp ?? 0
         store.log(hero.charId, 'Hit: {tp} TP − RS {rs} = {sp} SP', { tp: hit.tp, rs: hit.rs ?? 0, sp })
         if (sp > 0 && casting && casting.done < casting.total) casting = { ...casting, disturbance: (casting.disturbance ?? 0) + sp }
      }
      const rage = hits.find((hit) => hit.painRaised)
      store.update(hero.charId, { seenHits: [...seen, ...hits.map((hit) => hit.id)].slice(-60), ...(casting !== (fight.casting ?? null) ? { casting } : {}),
         ...(rage ? { rageOffer: rage.id } : {}) })
   }, [encounter, hero])
}

// When the party fight is over, the panels that fought in it start fresh (user decision: no data of a former fight)
export function usePartyFightCleanup(partyId: string, running: boolean) {
   useEffect(() => {
      if (running) return
      const store = useFightStore.getState()
      for (const [heroId, fight] of Object.entries(store.fights)) {
         if (fight.party?.partyId === partyId) store.end(heroId)
      }
   }, [partyId, running])
}
