import { createServer, type Server as HttpServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { io as connect, type Socket } from 'socket.io-client'
import type { CommandAck, RealtimeNotice } from '@/types/socketContracts'
import { createSocketServer } from './index'
import { initRealtime, realtime } from './realtime'

// Token and membership checks are injected, so the socket server runs without a database.
const users: Record<string, { userId: string; username: string }> = {
   'token-gm': { userId: 'aaaaaaaaaaaaaaaaaaaaaaaa', username: 'GM' },
   'token-stranger': { userId: 'bbbbbbbbbbbbbbbbbbbbbbbb', username: 'Stranger' },
   'token-player': { userId: 'eeeeeeeeeeeeeeeeeeeeeeee', username: 'Player' },
}
const partyId = 'cccccccccccccccccccccccc'
const playerCharId = 'ffffffffffffffffffffffff'
const members = [users['token-gm'].userId, users['token-player'].userId]

let http: HttpServer
let server: ReturnType<typeof createSocketServer>
let url = ''
const clients: Socket[] = []

beforeAll(async () => {
   http = createServer()
   const io = server = createSocketServer(http, ['http://localhost'], {
      authenticate: async (token) => users[token] ?? null,
      canJoinParty: async (userId, id) => members.includes(userId) && id === partyId,
      onlineMembers: async (_id, userIds) => ({ charIds: userIds.includes(users['token-player'].userId) ? [playerCharId] : [], gmOnline: userIds.includes(users['token-gm'].userId) }),
   })
   initRealtime(io)
   await new Promise<void>((resolve) => http.listen(0, resolve))
   url = `http://localhost:${(http.address() as AddressInfo).port}`
})

// Every test starts without leftover connections (presence counts them)
afterEach(async () => {
   for (const socket of clients.splice(0)) socket.close()
   for (let attempt = 0; attempt < 50 && (await server.fetchSockets()).length > 0; attempt++) await new Promise((resolve) => setTimeout(resolve, 10))
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
const command = (socket: Socket, event: 'subscribe' | 'unsubscribe' | 'presence' | 'ping', payload: unknown) =>
   new Promise<CommandAck<unknown>>((resolve) => socket.emit(event, payload, resolve))
const nextNotice = (socket: Socket) => new Promise<RealtimeNotice>((resolve) => socket.once('notice', resolve))
// Presence notices may arrive in between: wait for the first notice of one topic
const noticeOf = (socket: Socket, topic: RealtimeNotice['topic']) => new Promise<RealtimeNotice>((resolve) => {
   const listener = (notice: RealtimeNotice) => {
      if (notice.topic !== topic) return
      socket.off('notice', listener)
      resolve(notice)
   }
   socket.on('notice', listener)
})

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
      const partyNotice = noticeOf(gm, 'hero')
      realtime.toParty(partyId, { topic: 'hero', charId: 'dddddddddddddddddddddddd' })
      expect(await partyNotice).toEqual({ topic: 'hero', charId: 'dddddddddddddddddddddddd' })
      const userNotice = noticeOf(gm, 'parties')
      realtime.toUser(users['token-gm'].userId, { topic: 'parties' })
      expect(await userNotice).toEqual({ topic: 'parties' })
   })

   it('puts the open connections of an accepted member into the party room without a new subscribe', async () => {
      const member = client('token-stranger')
      await connected(member)
      realtime.joinParty(users['token-stranger'].userId, partyId)
      const notice = noticeOf(member, 'party')
      realtime.toParty(partyId, { topic: 'party', partyId })
      expect(await notice).toEqual({ topic: 'party', partyId })
   })

   it('stops party notices once the member leaves the room', async () => {
      const gm = client('token-gm')
      await connected(gm)
      await command(gm, 'subscribe', { partyId })
      realtime.leaveParty(users['token-gm'].userId, partyId)
      const received: RealtimeNotice[] = []
      gm.on('notice', (notice) => { if (notice.topic !== 'presence') received.push(notice) })
      realtime.toParty(partyId, { topic: 'party', partyId })
      // A user-room notice sent afterwards arrives; the party notice before it must not have
      const marker = noticeOf(gm, 'parties')
      realtime.toUser(users['token-gm'].userId, { topic: 'parties' })
      await marker
      expect(received).toEqual([{ topic: 'parties' }])
   })

   it('tells members who is online by hero, never by user id, and refuses outsiders', async () => {
      const gm = client('token-gm')
      const player = client('token-player')
      const stranger = client('token-stranger')
      await Promise.all([connected(gm), connected(player), connected(stranger)])
      await command(gm, 'subscribe', { partyId })
      expect(await command(gm, 'presence', { partyId })).toEqual({ ok: true, data: { charIds: [], gmOnline: true } })
      const joined = noticeOf(gm, 'presence')
      await command(player, 'subscribe', { partyId })
      expect(await joined).toEqual({ topic: 'presence', partyId })
      expect(await command(gm, 'presence', { partyId })).toEqual({ ok: true, data: { charIds: [playerCharId], gmOnline: true } })
      expect(await command(stranger, 'presence', { partyId })).toEqual({ ok: false, error: 'not-found' })
   })

   it('announces a member whose connection drops', async () => {
      const gm = client('token-gm')
      const player = client('token-player')
      await Promise.all([connected(gm), connected(player)])
      await command(gm, 'subscribe', { partyId })
      await command(player, 'subscribe', { partyId })
      const left = noticeOf(gm, 'presence')
      player.close()
      expect(await left).toEqual({ topic: 'presence', partyId })
      expect(await command(gm, 'presence', { partyId })).toEqual({ ok: true, data: { charIds: [], gmOnline: true } })
   })

   it('delivers a board ping to the party room only, within the board, at most once per second', async () => {
      const gm = client('token-gm')
      const player = client('token-player')
      const stranger = client('token-stranger')
      await Promise.all([connected(gm), connected(player), connected(stranger)])
      await command(gm, 'subscribe', { partyId })
      await command(player, 'subscribe', { partyId })
      const strangerPings: unknown[] = []
      stranger.on('ping', (event) => strangerPings.push(event))
      const seen = new Promise((resolve) => gm.once('ping', resolve))
      expect(await command(player, 'ping', { partyId, x: 3, y: 4 })).toEqual({ ok: true })
      expect(await seen).toEqual({ partyId, x: 3, y: 4, by: 'Player' })
      expect(await command(player, 'ping', { partyId, x: 3, y: 5 })).toEqual({ ok: false, error: 'rate-limited' })
      expect(await command(gm, 'ping', { partyId, x: 60, y: 0 })).toEqual({ ok: false, error: 'invalid-payload' })
      expect(await command(stranger, 'ping', { partyId, x: 1, y: 1 })).toEqual({ ok: false, error: 'not-found' })
      expect(strangerPings).toEqual([])
   })
})
