import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/utils/errorHandling'
import { getSummons, summonsKey, updateSummon } from './bestiaryApi'
import { companionsKey, getCompanions, updateCompanions } from './companionApi'
import { companionFighter, radauFighter, summonFighter, type AllyFighter, type FightAlly } from './fightAllies'

// The live values of a hero's allies and how their LeP change (companion record or summon record), for the party fight
export function useAllyRecords(statsId: string | undefined) {
   const queryClient = useQueryClient()
   const companions = useQuery({ queryKey: companionsKey(statsId ?? ''), queryFn: () => getCompanions(statsId!), enabled: Boolean(statsId) }).data ?? []
   const summons = useQuery({ queryKey: summonsKey(statsId ?? ''), queryFn: () => getSummons(statsId!), enabled: Boolean(statsId) }).data ?? []
   const health = useMutation({
      mutationFn: async ({ ally, value }: { ally: FightAlly; value: number }) => {
         if (!statsId) return
         if (ally.source.kind === 'companion') queryClient.setQueryData(companionsKey(statsId),
            await updateCompanions(statsId, { action: 'companion-resources', companionId: ally.source.id, health: value }))
         if (ally.source.kind === 'summon') queryClient.setQueryData(summonsKey(statsId),
            await updateSummon(statsId, { action: 'health', summonId: ally.source.id, current: value }))
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   function fighterOf(ally: FightAlly): AllyFighter | null {
      const source = ally.source
      if (source.kind === 'radau') return radauFighter(source.quality)
      if (source.kind === 'companion') {
         const companion = companions.find((entry) => entry.id === source.id)
         return companion ? companionFighter(companion) : null
      }
      const summon = summons.find((entry) => entry._id === source.id)
      return summon ? summonFighter(summon) : null
   }
   return { fighterOf, setHealth: (ally: FightAlly, value: number) => health.mutateAsync({ ally, value }), pending: health.isPending }
}
