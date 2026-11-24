import { io, type Socket } from 'socket.io-client'
import { TOKEN_STORAGE_KEY } from '@/auth/AuthContext'

// Mirrors server/src/types/socketContracts.ts
export type RealtimeNotice =
   | { topic: 'hero'; charId: string }
   | { topic: 'party'; partyId: string }
   | { topic: 'parties' }
   | { topic: 'encounter'; partyId: string }
   | { topic: 'presence'; partyId: string }
   | { topic: 'checks'; partyId: string }
type CommandAck<T = never> = { ok: true; data?: T } | { ok: false; error: string }
// Online heroes of a party and whether the GM is online (no user ids)
export type PresenceView = { charIds: string[]; gmOnline: boolean }
// A square marked on the battle board for everyone in the party (not stored)
export type PingEvent = { partyId: string; x: number; y: number; by: string }
type ServerToClientEvents = { notice: (notice: RealtimeNotice) => void; ping: (event: PingEvent) => void }
type ClientToServerEvents = {
   subscribe: (payload: { partyId: string }, ack: (result: CommandAck) => void) => void
   unsubscribe: (payload: { partyId: string }, ack: (result: CommandAck) => void) => void
   presence: (payload: { partyId: string }, ack: (result: CommandAck<PresenceView>) => void) => void
   ping: (payload: { partyId: string; x: number; y: number }, ack: (result: CommandAck) => void) => void
}

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null

// Connection state for the "live updates paused" banner (useSyncExternalStore): idle = signed out or not started
export type ConnectionState = 'idle' | 'connected' | 'offline'
let connection: ConnectionState = 'idle'
const connectionListeners = new Set<() => void>()
function setConnection(next: ConnectionState) {
   if (next === connection) return
   connection = next
   for (const listener of connectionListeners) listener()
}
export const connectionState = () => connection
export function subscribeConnection(listener: () => void) {
   connectionListeners.add(listener)
   return () => { connectionListeners.delete(listener) }
}
// Party rooms this tab wants; a new connection loses its rooms, so they are joined again on every connect
const parties = new Map<string, number>()

// One socket per tab. Dev: the API port (VITE_API_URL); production: same origin, nginx forwards /socket.io/.
export function realtimeSocket() {
   if (socket) return socket
   socket = io(import.meta.env.VITE_API_URL || undefined, {
      autoConnect: false,
      transports: ['websocket'],
      // Read on every (re)connect, so a new login is used
      auth: (send) => send({ token: localStorage.getItem(TOKEN_STORAGE_KEY) ?? '' }),
   })
   socket.on('connect', () => setConnection('connected'))
   // Our own disconnect (sign-out, user switch) is not an outage; anything else is, while socket.io retries
   socket.on('disconnect', (reason) => setConnection(reason === 'io client disconnect' ? 'idle' : 'offline'))
   socket.on('connect_error', () => setConnection('offline'))
   return socket
}

export function connectRealtime() {
   const current = realtimeSocket()
   if (!current.connected) current.connect()
   return current
}

export function disconnectRealtime() {
   socket?.disconnect()
   setConnection('idle')
}

function join(partyId: string) {
   if (socket?.connected) socket.emit('subscribe', { partyId }, () => undefined)
}

export function resubscribeParties() {
   for (const partyId of parties.keys()) join(partyId)
}

// Who of the party is online (the server checks membership); fails while offline so the query shows no stale state
export async function requestPresence(partyId: string) {
   if (!socket?.connected) throw new Error('offline')
   const result = await socket.timeout(5000).emitWithAck('presence', { partyId })
   if (!result.ok || !result.data) throw new Error(result.ok ? 'no-data' : result.error)
   return result.data
}

// Board ping (user request, Nov 2026); the server limits it to one per second
export async function sendPing(partyId: string, x: number, y: number) {
   if (!socket?.connected) return { ok: false as const, error: 'offline' }
   return socket.timeout(3000).emitWithAck('ping', { partyId, x, y })
}

export function onPing(listener: (event: PingEvent) => void) {
   const current = realtimeSocket()
   current.on('ping', listener)
   return () => { current.off('ping', listener) }
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
