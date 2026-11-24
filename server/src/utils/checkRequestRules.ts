import type { CheckResult } from '@/models/checkRequest.model'

export type CheckTargetShape = { charId: string; userId: string; state: 'open' | 'rolled' | 'declined'; result: CheckResult | null }

// Who sees a request: the GM all of them, a player those asking one of their heroes
export function seesRequest(targets: CheckTargetShape[], viewerId: string, isGm: boolean) {
   return isGm || targets.some((target) => target.userId === viewerId)
}

// A hidden request's results go only to the GM and each hero's own player; the others see that it was answered, not how
export function visibleTargets(targets: CheckTargetShape[], viewerId: string, isGm: boolean, hidden: boolean) {
   return targets.map((target) => ({
      charId: target.charId,
      state: target.state,
      mine: target.userId === viewerId,
      result: isGm || !hidden || target.userId === viewerId ? target.result : null,
   }))
}

// The player may answer for an own hero whose answer is still open, while the GM keeps the request open
export function canAnswer(status: 'open' | 'closed', targets: CheckTargetShape[], viewerId: string, charId: string) {
   return status === 'open' && targets.some((target) => target.charId === charId && target.userId === viewerId && target.state === 'open')
}
