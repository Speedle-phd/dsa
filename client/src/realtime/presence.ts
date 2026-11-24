import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { connectionState, requestPresence, subscribeConnection } from './socket'

export const presenceKey = (partyId: string) => ['presence', partyId] as const

// Online heroes of a party (user request, Nov 2026): refetched on the `presence` notice; nothing while this tab is offline
export function usePresence(partyId: string) {
   const connected = useSyncExternalStore(subscribeConnection, connectionState) === 'connected'
   const query = useQuery({ queryKey: presenceKey(partyId), queryFn: () => requestPresence(partyId), enabled: connected && Boolean(partyId), retry: false })
   return connected ? query.data ?? null : null
}
