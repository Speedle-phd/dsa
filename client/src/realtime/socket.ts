import { io, type Socket } from 'socket.io-client'
import { TOKEN_STORAGE_KEY } from '@/auth/AuthContext'

// Mirrors server/src/types/socketContracts.ts
export type RealtimeNotice =
   | { topic: 'hero'; charId: string }
   | { topic: 'party'; partyId: string }
   | { topic: 'parties' }
   | { topic: 'encounter'; partyId: string }
type CommandAck = { ok: true } | { ok: false; error: string }
type ServerToClientEvents = { notice: (notice: RealtimeNotice) => void }
type ClientToServerEvents = {
   subscribe: (payload: { partyId: string }, ack: (result: CommandAck) => void) => void
   unsubscribe: (payload: { partyId: string }, ack: (result: CommandAck) => void) => void
}

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null
// Party rooms this tab wants; a new connection loses its rooms, so they are joined again on every connect
const parties = new Map<string, number>()

// One socket per tab. Dev: the API port (VITE_API_URL); production: same origin, nginx forwards /socket.io/.
export function realtimeSocket() {
   socket ??= io(import.meta.env.VITE_API_URL || undefined, {
      autoConnect: false,
      transports: ['websocket'],
      // Read on every (re)connect, so a new login is used
      auth: (send) => send({ token: localStorage.getItem(TOKEN_STORAGE_KEY) ?? '' }),
   })
   return socket
}

export function connectRealtime() {
   const current = realtimeSocket()
   if (!current.connected) current.connect()
   return current
}

export function disconnectRealtime() {
   socket?.disconnect()
}

function join(partyId: string) {
   if (socket?.connected) socket.emit('subscribe', { partyId }, () => undefined)
}

export function resubscribeParties() {
   for (const partyId of parties.keys()) join(partyId)
}

// Reference-counted, so two components showing the same party share the room
export function subscribeParty(partyId: string) {
   parties.set(partyId, (parties.get(partyId) ?? 0) + 1)
   if (parties.get(partyId) === 1) join(partyId)
   return () => {
      const left = (parties.get(partyId) ?? 1) - 1
      if (left > 0) return void parties.set(partyId, left)
      parties.delete(partyId)
      if (socket?.connected) socket.emit('unsubscribe', { partyId }, () => undefined)
   }
}
