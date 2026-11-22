import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { z } from 'zod'
import type { ClientToServerEvents, CommandAck, ServerToClientEvents, SocketData } from '@/types/socketContracts'
import { partyRoom, userRoom } from './realtime'

export type SocketAccess = {
   // Same credential as REST (Bearer token); null when invalid or the user no longer exists
   authenticate: (token: string) => Promise<{ userId: string; username: string } | null>
   // GM or accepted member of an active party
   canJoinParty: (userId: string, partyId: string) => Promise<boolean>
}

const partyCommand = z.object({ partyId: z.string().regex(/^[a-f0-9]{24}$/) })
// Commands per socket: 20 at once, refilled at 2 per second
const bucketSize = 20
const refillPerMs = 2 / 1000

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

      const command = (handler: (partyId: string) => Promise<CommandAck>) =>
         (payload: unknown, ack: unknown) => {
            const reply = typeof ack === 'function' ? ack as (result: CommandAck) => void : () => undefined
            if (!takeToken(socket.data)) return reply({ ok: false, error: 'rate-limited' })
            const parsed = partyCommand.safeParse(payload)
            if (!parsed.success) return reply({ ok: false, error: 'invalid-payload' })
            handler(parsed.data.partyId).then(reply, (error: unknown) => {
               console.error('Socket command failed:', error)
               reply({ ok: false, error: 'server-error' })
            })
         }

      socket.on('subscribe', command(async (partyId) => {
         if (!await access.canJoinParty(socket.data.userId, partyId)) return { ok: false, error: 'not-found' }
         await socket.join(partyRoom(partyId))
         return { ok: true }
      }))
      socket.on('unsubscribe', command(async (partyId) => {
         await socket.leave(partyRoom(partyId))
         return { ok: true }
      }))
   })

   return io
}
