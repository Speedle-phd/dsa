import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { z } from 'zod'
import type { ClientToServerEvents, CommandAck, PresenceView, ServerToClientEvents, SocketData } from '@/types/socketContracts'
import { partyRoom, userRoom } from './realtime'

export type SocketAccess = {
   // Same credential as REST (Bearer token); null when invalid or the user no longer exists
   authenticate: (token: string) => Promise<{ userId: string; username: string } | null>
   // GM or accepted member of an active party
   canJoinParty: (userId: string, partyId: string) => Promise<boolean>
   // Which of the party's heroes belong to the connected users, and whether the GM is among them
   onlineMembers: (partyId: string, userIds: string[]) => Promise<PresenceView>
}

const objectId = z.string().regex(/^[a-f0-9]{24}$/)
const partyCommand = z.object({ partyId: objectId })
// Board squares go up to 60 × 60 (encounterValidation boardSize)
const pingCommand = z.object({ partyId: objectId, x: z.number().int().min(0).max(59), y: z.number().int().min(0).max(59) })
// Commands per socket: 20 at once, refilled at 2 per second
const bucketSize = 20
const refillPerMs = 2 / 1000
// One board ping per second and socket, on top of the command budget
const pingIntervalMs = 1000

function takeToken(data: SocketData) {
   const now = Date.now()
   data.budget.tokens = Math.min(bucketSize, data.budget.tokens + (now - data.budget.updatedAt) * refillPerMs)
   data.budget.updatedAt = now
   if (data.budget.tokens < 1) return false
   data.budget.tokens -= 1
   return true
}

export function createSocketServer(httpServer: HttpServer, origins: string[], access: SocketAccess) {
   const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
      cors: { origin: origins, credentials: true },
      transports: ['websocket'],
      maxHttpBufferSize: 10_000,
   })
   // Members refetch who is online (topic only; the presence command applies the membership check)
   const presenceChanged = (partyId: string) => io.to(partyRoom(partyId)).emit('notice', { topic: 'presence', partyId })

   io.use(async (socket, next) => {
      const token = typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : ''
      try {
         const user = token ? await access.authenticate(token) : null
         if (!user) return next(new Error('unauthorized'))
         socket.data.userId = user.userId
         socket.data.username = user.username
         socket.data.budget = { tokens: bucketSize, updatedAt: Date.now() }
         next()
      } catch {
         next(new Error('unauthorized'))
      }
   })

   io.on('connection', (socket) => {
      void socket.join(userRoom(socket.data.userId))

      const command = <S extends z.ZodTypeAny, T>(schema: S, handler: (payload: z.infer<S>) => Promise<CommandAck<T>>) =>
         (payload: unknown, ack: unknown) => {
            const reply = typeof ack === 'function' ? ack as (result: CommandAck<T>) => void : () => undefined
            if (!takeToken(socket.data)) return reply({ ok: false, error: 'rate-limited' })
            const parsed = schema.safeParse(payload)
            if (!parsed.success) return reply({ ok: false, error: 'invalid-payload' })
            handler(parsed.data).then(reply, (error: unknown) => {
               console.error('Socket command failed:', error)
               reply({ ok: false, error: 'server-error' })
            })
         }

      socket.on('subscribe', command(partyCommand, async ({ partyId }) => {
         if (!await access.canJoinParty(socket.data.userId, partyId)) return { ok: false, error: 'not-found' }
         await socket.join(partyRoom(partyId))
         presenceChanged(partyId)
         return { ok: true }
      }))
      socket.on('unsubscribe', command(partyCommand, async ({ partyId }) => {
         await socket.leave(partyRoom(partyId))
         presenceChanged(partyId)
         return { ok: true }
      }))

      // Who of the party is connected right now (user request, Nov 2026): derived from the room, nothing stored
      socket.on('presence', command(partyCommand, async ({ partyId }): Promise<CommandAck<PresenceView>> => {
         if (!await access.canJoinParty(socket.data.userId, partyId)) return { ok: false, error: 'not-found' }
         const sockets = await io.in(partyRoom(partyId)).fetchSockets()
         return { ok: true, data: await access.onlineMembers(partyId, [...new Set(sockets.map((entry) => entry.data.userId))]) }
      }))

      // Mark a square on the battle board for everyone in the party; only from inside the party room
      socket.on('ping', command(pingCommand, async ({ partyId, x, y }) => {
         if (!socket.rooms.has(partyRoom(partyId))) return { ok: false, error: 'not-found' }
         const now = Date.now()
         if (socket.data.lastPing !== undefined && now - socket.data.lastPing < pingIntervalMs) return { ok: false, error: 'rate-limited' }
         socket.data.lastPing = now
         io.to(partyRoom(partyId)).emit('ping', { partyId, x, y, by: socket.data.username })
         return { ok: true }
      }))

      // The rooms are already empty in 'disconnect': remember the parties while still inside them
      let parties: string[] = []
      socket.on('disconnecting', () => {
         parties = [...socket.rooms].filter((room) => room.startsWith('party:')).map((room) => room.slice('party:'.length))
      })
      socket.on('disconnect', () => {
         for (const partyId of parties) presenceChanged(partyId)
      })
   })

   return io
}
