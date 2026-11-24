import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { axiosInstance } from '@/axios/axios'
import { subscribeParty } from '@/realtime/socket'

// Mirrors server/src/views/checkRequestView.ts
export type CheckKind = 'attribute' | 'talent'
export type CheckOutcome = 'success' | 'failure' | 'critical' | 'spectacular' | 'botch' | 'disaster' | 'criticalUnconfirmed' | 'botchAverted'
export type CheckResult = { success: boolean; qs: number | null; rolls: number[]; outcome: CheckOutcome }
// `result` is null for a hidden request's other heroes (only the GM and the hero's player see it)
export type CheckRequestTarget = { charId: string; name: string; state: 'open' | 'rolled' | 'declined'; mine: boolean; result: CheckResult | null }
export type CheckRequest = {
   id: string; kind: CheckKind; key: string; modifier: number; hidden: boolean; note: string
   status: 'open' | 'closed'; createdAt: string; targets: CheckRequestTarget[]
}
export type NewCheckRequest = { kind: CheckKind; key: string; modifier: number; hidden: boolean; note: string; charIds: string[] }

export const checkRequestsKey = (partyId: string) => ['check-requests', partyId] as const
const base = (partyId: string) => `/api/parties/${partyId}/check-requests`

export async function getCheckRequests(partyId: string) {
   return (await axiosInstance.get<{ requests: CheckRequest[] }>(base(partyId))).data.requests
}
export async function createCheckRequest(partyId: string, input: NewCheckRequest) {
   return (await axiosInstance.post<{ request: CheckRequest }>(base(partyId), input)).data.request
}
export async function answerCheckRequest(partyId: string, requestId: string, charId: string, result: CheckResult) {
   return (await axiosInstance.post<{ request: CheckRequest }>(`${base(partyId)}/${requestId}/result`, { charId, result })).data.request
}
export async function declineCheckRequest(partyId: string, requestId: string, charId: string) {
   return (await axiosInstance.post<{ request: CheckRequest }>(`${base(partyId)}/${requestId}/decline`, { charId })).data.request
}
export async function closeCheckRequest(partyId: string, requestId: string) {
   return (await axiosInstance.post<{ request: CheckRequest }>(`${base(partyId)}/${requestId}/close`)).data.request
}

// The party's check requests, live through the party room (`checks` notice)
export function useCheckRequests(partyId: string, enabled = true) {
   useEffect(() => enabled ? subscribeParty(partyId) : undefined, [partyId, enabled])
   return useQuery({ queryKey: checkRequestsKey(partyId), queryFn: () => getCheckRequests(partyId), enabled, retry: false })
}
