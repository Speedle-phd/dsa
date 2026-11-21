// Action budget per KR (S. 227–229): 1 Aktion, 1 freie Aktion, any number of defenses; longer actions span several KR.
export type ActionUse = { round: number; actions: number; free: number; extra: number }
export type ActionCost = 'action' | 'free'

// A spell being cast as a longer action: `done` of `total` actions spent; the effect comes at the end of the last (S. 229).
export type Casting = { spell: string; total: number; done: number; lastRound: number; modification: CastingModification
   // SP taken while casting: a Selbstbeherrschung check is due (S. 229)
   disturbance?: number }
export type CastingModification = 'none' | 'shorter' | 'longer'

export const actionUse = (use: ActionUse | undefined, round: number): ActionUse =>
   use?.round === round ? use : { round, actions: 0, free: 0, extra: 0 }

// source: DSA5 Regelwerk, S. 228 (one action and one free action per KR); extra actions only when the GM allows them
export const actionsLeft = (use: ActionUse) => 1 + use.extra - use.actions
export const freeLeft = (use: ActionUse) => 1 - use.free
export const canSpend = (use: ActionUse, cost: ActionCost) => cost === 'action' ? actionsLeft(use) > 0 : freeLeft(use) > 0
export const spendAction = (use: ActionUse, cost: ActionCost): ActionUse =>
   cost === 'action' ? { ...use, actions: use.actions + 1 } : { ...use, free: use.free + 1 }

// Why an action cannot be taken now, or null.
export function actionBlocked(use: ActionUse, cost: ActionCost, casting?: Casting | null) {
   if (cost === 'action' && casting) return 'You are casting a spell: continue or abort it first (S. 228).'
   if (!canSpend(use, cost)) return cost === 'action' ? 'No action left this round (S. 228).' : 'No free action left this round (S. 228).'
   return null
}

// source: DSA5 Regelwerk, S. 256 (Zauberdauer steps 1–32 Aktionen: one step shorter or longer per modification), S. 281 (curses: at least 1 action)
// null: not cast in actions (rituals, minutes, hours), so not castable in a fight.
const castingSteps = [1, 2, 4, 8, 16, 32]
export function castingActions(castingTime: string, modification: CastingModification = 'none') {
   const base = castingTime.trim() === '≥ 1' ? 1 : /^\d+$/.test(castingTime.trim()) ? Number(castingTime) : null
   if (base === null) return null
   const step = castingSteps.indexOf(base)
   if (modification === 'none' || step < 0) return base
   return castingSteps[step + (modification === 'shorter' ? -1 : 1)] ?? null
}

// source: DSA5 Regelwerk, S. 229 (disturbance check: the caster takes damage → −SP/3, at least 1), S. 17 (rounding half up)
export const disturbancePenalty = (sp: number) => sp > 0 ? Math.max(1, Math.round(sp / 3)) : 0

// source: DSA5 Regelwerk, S. 228–229 (moving up to GS as an action or as a free action on one's own INI turn; both = sprint, 2 × GS)
export const parseSpeed = (speed: string) => {
   const value = Number.parseInt(speed, 10)
   return Number.isFinite(value) ? value : null
}
