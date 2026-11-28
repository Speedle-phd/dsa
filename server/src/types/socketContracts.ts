// Socket events carry only a topic: clients refetch through REST, where authorization and privacy shaping live.
// Exceptions are short-lived, unstored events (presence queries, board pings). The client mirrors these shapes in
// client/src/realtime/socket.ts.
export type RealtimeNotice =
   | { topic: 'hero'; charId: string }
   | { topic: 'party'; partyId: string }
   | { topic: 'parties' }
   | { topic: 'encounter'; partyId: string }
   // Someone's connection joined or left the party room: refetch who is online
   | { topic: 'presence'; partyId: string }
   // GM check requests of the party changed (new, answered, closed)
   | { topic: 'checks'; partyId: string }
   // Herb finds of the party changed (a general herb search waits for the GM, or the GM assigned it)
   | { topic: 'herbs'; partyId: string }

export type CommandAck<T = never> = { ok: true; data?: T } | { ok: false; error: string }

// Online heroes of a party (their charIds) and whether the GM is online; never other users' ids
export type PresenceView = { charIds: string[]; gmOnline: boolean }
// A square marked on the battle board for everyone in the party (not stored)
export type PingEvent = { partyId: string; x: number; y: number; by: string }

export type ServerToClientEvents = {
   notice: (notice: RealtimeNotice) => void
   ping: (event: PingEvent) => void
}

export type ClientToServerEvents = {
   subscribe: (payload: { partyId: string }, ack: (result: CommandAck) => void) => void
   unsubscribe: (payload: { partyId: string }, ack: (result: CommandAck) => void) => void
   presence: (payload: { partyId: string }, ack: (result: CommandAck<PresenceView>) => void) => void
   ping: (payload: { partyId: string; x: number; y: number }, ack: (result: CommandAck) => void) => void
}

export type SocketData = { userId: string; username: string; budget: { tokens: number; updatedAt: number }; lastPing?: number }
