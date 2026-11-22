import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { useAllyRecords } from '@/features/heroes/allyRecords'
import { allyInitiative } from '@/features/heroes/fightAllies'
import { getStatsForHero } from '@/features/heroes/statsApi'
import { useFightStore } from '@/features/heroes/fightStore'
import { getErrorMessage } from '@/utils/errorHandling'
import { addAlly, encounterKey, removeAlly, type Encounter, type HeroCombatant } from './encounterApi'

// The hero's fight panel decides which allies fight (companions, summons, Radau; user decision Nov 2026): each one joins the
// party fight as its own combatant and leaves with it. Only allies this browser added are removed, so another device of the
// same player (with an empty panel) never takes them off.
export function useAllySync(encounter: Encounter | null | undefined, partyId: string, hero: HeroCombatant | null) {
   const queryClient = useQueryClient()
   const allies = useFightStore((state) => hero ? state.fights[hero.charId]?.allies : undefined)
   const stats = useQuery({ queryKey: ['stats', hero?.charId], queryFn: () => getStatsForHero(hero!.charId), enabled: Boolean(hero) }).data
   const records = useAllyRecords(stats?._id)
   const known = useRef(new Set<string>())
   const busy = useRef(new Set<string>())
   useEffect(() => {
      if (!encounter || !hero) return
      const remote = encounter.combatants.filter((entry) => entry.kind === 'ally' && entry.ownerId === hero.id)
      const local = allies ?? []
      const run = (key: string, action: () => Promise<Encounter | null>) => {
         if (busy.current.has(key)) return
         busy.current.add(key)
         action().then((next) => queryClient.setQueryData(encounterKey(partyId), next))
            .catch((error: unknown) => toast.error(getErrorMessage(error)))
            .finally(() => busy.current.delete(key))
      }
      for (const ally of local) {
         known.current.add(ally.id)
         if (remote.some((entry) => entry.kind === 'ally' && entry.allyKey === ally.id)) continue
         // RS and record let the server apply the damage of a hit (companion / summon LeP; Radau is unbreakable)
         const fighter = records.fighterOf(ally)
         if (!fighter && ally.source.kind !== 'radau') continue
         run(ally.id, () => addAlly(partyId, { heroId: hero.id, key: ally.id, name: ally.name ?? 'Ally', initiative: allyInitiative(ally),
            initiativeBase: ally.initiative.base, speed: ally.speed ?? null, armor: fighter?.armor ?? 0, source: ally.source.kind === 'radau' ? { kind: 'radau' } : ally.source }))
      }
      for (const entry of remote) {
         if (entry.kind !== 'ally' || !known.current.has(entry.allyKey) || local.some((ally) => ally.id === entry.allyKey)) continue
         run(entry.allyKey, () => removeAlly(partyId, entry.id))
      }
   }, [encounter, hero, allies, partyId, queryClient, records])
}
