import { createServer, type Server as HttpServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { io as connect, type Socket } from 'socket.io-client'
import type { CommandAck, RealtimeNotice } from '@/types/socketContracts'
import { createSocketServer } from './index'
import { initRealtime, realtime } from './realtime'

// Token and membership checks are injected, so the socket server runs without a database.
const users: Record<string, { userId: string; username: string }> = {
   'token-gm': { userId: 'aaaaaaaaaaaaaaaaaaaaaaaa', username: 'GM' },
   'token-stranger': { userId: 'bbbbbbbbbbbbbbbbbbbbbbbb', username: 'Stranger' },
}
const partyId = 'cccccccccccccccccccccccc'

let http: HttpServer
let url = ''
const clients: Socket[] = []

beforeAll(async () => {
   http = createServer()
   const io = createSocketServer(http, ['http://localhost'], {
      authenticate: async (token) => users[token] ?? null,
      canJoinParty: async (userId, id) => userId === users['token-gm'].userId && id === partyId,
   })
   initRealtime(io)
   await new Promise<void>((resolve) => http.listen(0, resolve))
   url = `http://localhost:${(http.address() as AddressInfo).port}`
})

afterAll(async () => {
   for (const client of clients) client.close()
   initRealtime(null)
   await new Promise<void>((resolve) => http.close(() => resolve()))
})

function client(token?: string) {
   const socket = connect(url, { transports: ['websocket'], auth: token ? { token } : {}, reconnection: false, forceNew: true })
   clients.push(socket)
   return socket
}
const connected = (socket: Socket) => new Promise<void>((resolve, reject) => {
   socket.once('connect', () => resolve())
   socket.once('connect_error', reject)
})
const command = (socket: Socket, event: 'subscribe' | 'unsubscribe', payload: unknown) =>
   new Promise<CommandAck>((resolve) => socket.emit(event, payload, resolve))
const nextNotice = (socket: Socket) => new Promise<RealtimeNotice>((resolve) => socket.once('notice', resolve))

describe('party realtime (Socket.IO)', () => {
   it('rejects a handshake without a valid token', async () => {
      await expect(connected(client())).rejects.toThrow('unauthorized')
      await expect(connected(client('forged'))).rejects.toThrow('unauthorized')
   })

   it('denies subscribing to a party the user is not part of, and rejects malformed payloads', async () => {
      const stranger = client('token-stranger')
      await connected(stranger)
      expect(await command(stranger, 'subscribe', { partyId })).toEqual({ ok: false, error: 'not-found' })
      expect(await command(stranger, 'subscribe', { partyId: 'not-an-id' })).toEqual({ ok: false, error: 'invalid-payload' })
   })

   it('delivers party notices to subscribed members and user notices to the user room', async () => {
      const gm = client('token-gm')
      await connected(gm)
      expect(await command(gm, 'subscribe', { partyId })).toEqual({ ok: true })
      const partyNotice = nextNotice(gm)
      realtime.toParty(partyId, { topic: 'hero', charId: 'dddddddddddddddddddddddd' })
      expect(await partyNotice).toEqual({ topic: 'hero', charId: 'dddddddddddddddddddddddd' })
      const userNotice = nextNotice(gm)
      realtime.toUser(users['token-gm'].userId, { topic: 'parties' })
      expect(await userNotice).toEqual({ topic: 'parties' })
   })

   it('puts the open connections of an accepted member into the party room without a new subscribe', async () => {
      const member = client('token-stranger')
      await connected(member)
      realtime.joinParty(users['token-stranger'].userId, partyId)
      const notice = nextNotice(member)
      realtime.toParty(partyId, { topic: 'party', partyId })
      expect(await notice).toEqual({ topic: 'party', partyId })
   })

   it('stops party notices once the member leaves the room', async () => {
      const gm = client('token-gm')
      await connected(gm)
      await command(gm, 'subscribe', { partyId })
      realtime.leaveParty(users['token-gm'].userId, partyId)
      const received: RealtimeNotice[] = []
      gm.on('notice', (notice) => received.push(notice))
      realtime.toParty(partyId, { topic: 'party', partyId })
      // A user-room notice sent afterwards arrives; the party notice before it must not have
      const marker = nextNotice(gm)
      realtime.toUser(users['token-gm'].userId, { topic: 'parties' })
      await marker
      expect(received).toEqual([{ topic: 'parties' }])
   })
})
