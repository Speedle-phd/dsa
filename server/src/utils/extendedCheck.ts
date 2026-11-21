// Sammelprobe (extended check): collect QS over time intervals until a goal is reached.
export type ExtendedOutcome = 'success' | 'failure' | 'critical' | 'botch'
export type ExtendedStatus = 'open' | 'done' | 'failed'
export type ExtendedAttempt = { outcome: ExtendedOutcome; quality: number; by: string | null }
export type ExtendedCheckState = {
   maxAttempts: number
   attempts: ExtendedAttempt[]
   collected: number
   penalty: number
   status: ExtendedStatus
}

// source: DSA5 Regelwerk, S. 26–27 (6 QS = Teilerfolg, 10 QS = Aufgabe erfüllt)
export const partialQuality = 6
export const goalQuality = 10
// source: DSA5 Regelwerk, S. 27 (suggested number of attempts: 5 schwer, 7 durchschnitt, 10 leicht)
export const attemptPresets = [
   { value: 5, label: 'schwer' },
   { value: 7, label: 'durchschnitt' },
   { value: 10, label: 'leicht' },
] as const

export function newExtendedCheck(maxAttempts: number): ExtendedCheckState {
   return { maxAttempts, attempts: [], collected: 0, penalty: 0, status: 'open' }
}

// source: DSA5 Regelwerk, S. 26–27
// Success adds its QS. Failure adds −1 to all later attempts (cumulative, until the end). Critical doubles this QS and
// clears the failure penalties; with `ownCritical` (the talent's own critical rule already set the FP, S. 189–212) the QS
// counts once. Patzer drops the collected QS to 0 and fails the whole check (also for a group, S. 27).
// Contributions of other group members (`by`) count as attempts of the shared pool (Gruppensammelprobe, S. 27).
export function recordAttempt(state: ExtendedCheckState, attempt: ExtendedAttempt, ownCritical = false): ExtendedCheckState {
   if (state.status !== 'open') throw new Error('This extended check is finished.')
   const quality = Math.max(1, Math.trunc(attempt.quality))
   const attempts = [...state.attempts, { ...attempt, quality: attempt.outcome === 'success' || attempt.outcome === 'critical' ? quality : 0 }]
   let { collected, penalty } = state
   let status: ExtendedStatus = 'open'
   if (attempt.outcome === 'success') collected += quality
   else if (attempt.outcome === 'critical') { collected += ownCritical ? quality : quality * 2; penalty = 0 }
   else if (attempt.outcome === 'failure') penalty += 1
   else { collected = 0; status = 'failed' }
   if (status === 'open' && collected >= goalQuality) status = 'done'
   else if (status === 'open' && attempts.length >= state.maxAttempts) status = 'failed'
   return { ...state, attempts, collected, penalty, status }
}
