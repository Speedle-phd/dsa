import { useEffect } from 'react'
import { useFightStore } from '@/features/heroes/fightStore'
import type { Encounter, HeroCombatant } from './encounterApi'

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
