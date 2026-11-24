import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getParties, partiesKey } from '@/features/parties/partyApi'

export type MyPartyHero = { partyId: string; partyName: string; charId: string }

// The viewer's heroes that play in an active party (a hero is in at most one); the source for the fight quicklink and alerts
export function useMyPartyHeroes(enabled = true) {
   const parties = useQuery({ queryKey: partiesKey, queryFn: getParties, enabled })
   return useMemo(() => (parties.data ?? []).flatMap((party): MyPartyHero[] =>
      party.status === 'active' && party.myHero?.state === 'accepted' ? [{ partyId: party._id, partyName: party.name, charId: party.myHero.charId }] : []),
   [parties.data])
}
