import type { QueryKey } from '@tanstack/react-query'
import type { RealtimeNotice } from './socket'

// Topic notice → query keys to refetch. Views differ per viewer (party privacy), so clients refetch through REST.
export function keysForNotice(notice: RealtimeNotice): QueryKey[] {
   switch (notice.topic) {
      case 'hero':
         return [['stats', notice.charId], ['heroes', notice.charId], ['parties'], ['party-sheet'], ['book-context']]
      case 'party':
         return [['parties', notice.partyId], ['parties'], ['book-context']]
      case 'parties':
         return [['parties'], ['book-context']]
      case 'encounter':
         return [['encounter', notice.partyId]]
      case 'presence':
         return [['presence', notice.partyId]]
      case 'checks':
         return [['check-requests', notice.partyId]]
      case 'herbs':
         return [['herb-finds', notice.partyId]]
   }
}
