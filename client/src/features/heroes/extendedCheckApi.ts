import { axiosInstance } from '@/axios/axios'
import type { SkillCheckOutcome } from './skillCheck'

export type ExtendedOutcome = 'success' | 'failure' | 'critical' | 'botch'
export type ExtendedCheck = {
   _id: string
   name: string
   skill: { kind: 'talent' | 'spell'; key: string }
   interval: string
   maxAttempts: number
   attempts: Array<{ outcome: ExtendedOutcome; quality: number; by: string | null }>
   collected: number
   penalty: number
   status: 'open' | 'done' | 'failed'
}
export type NewExtendedCheck = Pick<ExtendedCheck, 'name' | 'skill' | 'interval' | 'maxAttempts'>

// source: DSA5 Regelwerk, S. 26–27 (6 QS = Teilerfolg, 10 QS = Aufgabe erfüllt; attempts 5 schwer / 7 durchschnitt / 10 leicht)
export const partialQuality = 6
export const goalQuality = 10
export const attemptPresets = [
   { value: 5, label: 'hard' },
   { value: 7, label: 'average' },
   { value: 10, label: 'easy' },
] as const

// Doppel-/Dreifach-1 count as Kritischer Erfolg, Doppel-/Dreifach-20 as Patzer (S. 24, 27).
export const extendedOutcome = (outcome: SkillCheckOutcome): ExtendedOutcome =>
   outcome === 'critical' || outcome === 'spectacular' ? 'critical' : outcome === 'botch' || outcome === 'disaster' ? 'botch' : outcome

export const extendedChecksKey = (statsId: string) => ['extended-checks', statsId]

type ChecksResponse = { checks: ExtendedCheck[] }

export async function getExtendedChecks(statsId: string) {
   const response = await axiosInstance.get<ChecksResponse>(`/api/stats/extended-checks/${statsId}`)
   return response.data.checks
}
export async function addExtendedCheck(statsId: string, check: NewExtendedCheck) {
   const response = await axiosInstance.put<ChecksResponse>(`/api/stats/add-extended-check/${statsId}`, check)
   return response.data.checks
}
export async function recordExtendedAttempt(statsId: string, checkId: string, outcome: ExtendedOutcome, quality: number, by: string | null = null) {
   const response = await axiosInstance.put<ChecksResponse>(`/api/stats/extended-check-attempt/${statsId}`, { checkId, outcome, quality, by })
   return response.data.checks
}
export async function removeExtendedCheck(statsId: string, checkId: string) {
   const response = await axiosInstance.put<ChecksResponse>(`/api/stats/remove-extended-check/${statsId}`, { checkId })
   return response.data.checks
}
