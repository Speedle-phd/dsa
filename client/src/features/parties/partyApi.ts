import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { axiosInstance } from '@/axios/axios'
import type { Hero } from '@/features/heroes/heroApi'
import type { Stats } from '@/features/heroes/statsApi'
import { subscribeParty } from '@/realtime/socket'

export type Visibility = 'private' | 'summary' | 'full'
export type PartyRole = 'gm' | 'member' | 'pending' | null
type Bar = { current: number; max: number }

// Mirrors server/src/views/partyView.ts
export type PartyHero = {
   name: string; species: string; profession: string
   detail: 'name' | 'summary' | 'full' | 'all'
   canOpenSheet: boolean
   health?: Bar; mana?: Bar; karmaEnergy?: Bar
   pain?: number
   statuses?: string[]
   conditions?: Record<string, number>
   statsId?: string
   storedStatuses?: string[]
   permanentStatuses?: string[]
   fatePoints?: Bar
   dodge?: number
   apAvailable?: number
}
export type PartyMember = {
   charId: string; playerName: string; state: 'pending' | 'accepted'; isSelf: boolean
   visibility?: Visibility; hero: PartyHero
}
export type Party = {
   _id: string; name: string; status: 'active' | 'archived'; role: PartyRole
   gm: { userId: string; username: string }
   inviteCode?: string
   members: PartyMember[]
}
export type PartySummary = {
   _id: string; name: string; status: 'active' | 'archived'; role: PartyRole; gmName: string
   members: number; pendingRequests: number
   myHero?: { charId: string; name: string; state: 'pending' | 'accepted' }
}
export type InvitePreview = { partyId: string; name: string; gmName: string; role: PartyRole }

export const partiesKey = ['parties'] as const
export const partyKey = (partyId: string) => ['parties', partyId] as const
export const partySheetKey = (partyId: string, charId: string) => ['party-sheet', partyId, charId] as const

export async function getParties() {
   return (await axiosInstance.get<{ parties: PartySummary[] }>('/api/parties')).data.parties
}
export async function getParty(partyId: string) {
   return (await axiosInstance.get<{ party: Party }>(`/api/parties/${partyId}`)).data.party
}
export async function createParty(name: string) {
   return (await axiosInstance.post<{ party: Party }>('/api/parties', { name })).data.party
}
export async function updateParty(partyId: string, change: { name?: string; status?: Party['status'] }) {
   return (await axiosInstance.patch<{ party: Party }>(`/api/parties/${partyId}`, change)).data.party
}
export async function rotateInviteCode(partyId: string) {
   return (await axiosInstance.post<{ party: Party }>(`/api/parties/${partyId}/invite-code`)).data.party
}
export async function previewInvite(code: string) {
   return (await axiosInstance.get<{ invite: InvitePreview }>(`/api/parties/join/${encodeURIComponent(code)}`)).data.invite
}
export async function requestJoin(code: string, charId: string) {
   return (await axiosInstance.post<{ partyId: string }>(`/api/parties/join/${encodeURIComponent(code)}`, { charId })).data
}
export async function answerRequest(partyId: string, charId: string, answer: 'accept' | 'deny') {
   return (await axiosInstance.post<{ party: Party }>(`/api/parties/${partyId}/members/${charId}/${answer}`)).data.party
}
export async function removeMember(partyId: string, charId: string) {
   await axiosInstance.delete(`/api/parties/${partyId}/members/${charId}`)
}
export async function setVisibility(partyId: string, charId: string, visibility: Visibility) {
   return (await axiosInstance.patch<{ party: Party }>(`/api/parties/${partyId}/members/${charId}`, { visibility })).data.party
}
export async function getPartySheet(partyId: string, charId: string) {
   return (await axiosInstance.get<{ char: Hero; stats: Stats; canApplyEffects: boolean }>(`/api/parties/${partyId}/heroes/${charId}/sheet`)).data
}

export type UserSettings = { defaultPartyVisibility: Visibility }
export async function getSettings() {
   return (await axiosInstance.get<{ settings: UserSettings }>('/api/users/me/settings')).data.settings
}
export async function updateSettings(settings: UserSettings) {
   return (await axiosInstance.patch<{ settings: UserSettings }>('/api/users/me/settings', settings)).data.settings
}

// The party, kept live: joins the party room while mounted
export function useParty(partyId: string) {
   useEffect(() => subscribeParty(partyId), [partyId])
   return useQuery({ queryKey: partyKey(partyId), queryFn: () => getParty(partyId), retry: false })
}
