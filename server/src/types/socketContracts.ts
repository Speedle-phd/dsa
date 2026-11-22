// Socket events carry only a topic: clients refetch through REST, where authorization and privacy shaping live.
// The client mirrors these shapes in client/src/realtime/socketContracts.ts.
export type RealtimeNotice =
   | { topic: 'hero'; charId: string }
   | { topic: 'party'; partyId: string }
   | { topic: 'parties' }
   | { topic: 'encounter'; partyId: string }

export type CommandAck = { ok: true } | { ok: false; error: string }

export type ServerToClientEvents = {
   notice: (notice: RealtimeNotice) => void
}

export type ClientToServerEvents = {
   subscribe: (payload: { partyId: string }, ack: (result: CommandAck) => void) => void
   unsubscribe: (payload: { partyId: string }, ack: (result: CommandAck) => void) => void
}

export type SocketData = { userId: string; username: string; budget: { tokens: number; updatedAt: number } }
