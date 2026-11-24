import type { Server } from 'socket.io'
import type { ClientToServerEvents, RealtimeNotice, ServerToClientEvents, SocketData } from '@/types/socketContracts'

type RealtimeServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>

let io: RealtimeServer | null = null

// Controllers publish through this module only. Until initRealtime runs (unit tests, scripts) every call is a no-op.
export function initRealtime(server: RealtimeServer | null) {
   io = server
}

export const partyRoom = (partyId: string) => `party:${partyId}`
export const userRoom = (userId: string) => `user:${userId}`

export const realtime = {
   enabled() {
      return io !== null
   },
   toParty(partyId: string, notice: RealtimeNotice) {
      io?.to(partyRoom(partyId)).emit('notice', notice)
   },
   toUser(userId: string, notice: RealtimeNotice) {
      io?.to(userRoom(userId)).emit('notice', notice)
   },
   // An accepted member's open tabs join the room at once (their earlier subscribe was refused while pending).
   joinParty(userId: string, partyId: string) {
      io?.in(userRoom(userId)).socketsJoin(partyRoom(partyId))
      io?.to(partyRoom(partyId)).emit('notice', { topic: 'presence', partyId })
   },
   // Removed members and players who left must stop receiving the party's notices at once.
   leaveParty(userId: string, partyId: string) {
      io?.in(userRoom(userId)).socketsLeave(partyRoom(partyId))
      io?.to(partyRoom(partyId)).emit('notice', { topic: 'presence', partyId })
   },
   closeParty(partyId: string) {
      io?.in(partyRoom(partyId)).socketsLeave(partyRoom(partyId))
   },
}
