import { fateImprovement } from './combatRoll'

// Client mirror of the Fertigkeitsprobe for rolling UX; it never changes stored values.
export type SkillCheckOutcome = 'success' | 'failure' | 'critical' | 'spectacular' | 'botch' | 'disaster'

export type SkillCheckResult = {
   rolls: number[]
   targets: number[]
   spent: number[]
   skillPoints: number
   success: boolean
   outcome: SkillCheckOutcome
   quality: number | null
}

// source: DSA5 Regelwerk, S. 24 (Erleichterung/Erschwernis examples)
export const difficultyPresets = [
   { value: 5, label: 'Extremely easy' },
   { value: 3, label: 'Very easy' },
   { value: 1, label: 'Easy' },
   { value: 0, label: 'Challenging' },
   { value: -1, label: 'Difficult' },
   { value: -3, label: 'Very difficult' },
   { value: -5, label: 'Extremely difficult' },
] as const

// source: DSA5 Regelwerk, S. 19 (Eigenschaftsmodifikatoren examples)
export const attributeDifficultyPresets = [
   { value: 6, label: 'Extremely easy' },
   { value: 4, label: 'Very easy' },
   { value: 2, label: 'Easy' },
   { value: 0, label: 'Challenging' },
   { value: -2, label: 'Hard' },
   { value: -4, label: 'Very hard' },
   { value: -6, label: 'Extremely hard' },
] as const

// source: DSA5 Regelwerk, S. 23 (FP → QS; a success with 0 FP counts as 1 FP)
export function qualityLevel(skillPoints: number) {
   if (skillPoints >= 16) return 6
   return Math.max(1, Math.ceil(skillPoints / 3))
}

// source: DSA5 Regelwerk, S. 21–24; S. 179 (Wilde Magie: a 19 counts as a 20 for spell botches, botchFrom 19)
export function evaluateSkillCheck(rolls: number[], targets: number[], skillValue: number, botchFrom = 20): SkillCheckResult {
   const spent = rolls.map((roll, index) => Math.max(0, roll - targets[index]))
   const skillPoints = skillValue - spent.reduce((sum, value) => sum + value, 0)
   const ones = rolls.filter((roll) => roll === 1).length
   const twenties = rolls.filter((roll) => roll >= botchFrom).length
   // Doppel-20 fails and Doppel-1 succeeds regardless of the remaining FP (S. 24).
   const outcome: SkillCheckOutcome = twenties === 3 ? 'disaster' : twenties === 2 ? 'botch'
      : ones === 3 ? 'spectacular' : ones === 2 ? 'critical' : skillPoints >= 0 ? 'success' : 'failure'
   const success = outcome !== 'failure' && outcome !== 'botch' && outcome !== 'disaster'
   // The book leaves extra crit effects to the GM; the QS comes from the remaining FP, at least QS 1.
   return { rolls, targets, spent, skillPoints, success, outcome, quality: success ? qualityLevel(Math.max(0, skillPoints)) : null }
}

// source: DSA5 Regelwerk, S. 189–212 (talent-specific Kritischer Erfolg; without a rule the remaining FP count, S. 24)
export function criticalSkillPoints(skillPoints: number, skillValue: number, rule: 'doubleSkill' | 'doubleFp' | undefined) {
   const remaining = Math.max(0, skillPoints)
   return rule === 'doubleSkill' ? 2 * skillValue : rule === 'doubleFp' ? Math.max(5, 2 * remaining) : remaining
}

// source: DSA5 Regelwerk, S. 222 (Eigenschaft verbessern: one Teilprobe counts up to 2 better, only for its FP cost)
// App interpretation, as for single W20 rolls: the outcome class (critical, Patzer) stays that of the rolled dice.
export function improvedSpent(spent: readonly number[], index: number) {
   return spent.map((points, slot) => slot === index ? Math.max(0, points - fateImprovement) : points)
}
export function improveResult(result: SkillCheckResult, index: number, skillValue: number): SkillCheckResult {
   const spent = improvedSpent(result.spent, index)
   const skillPoints = skillValue - spent.reduce((sum, value) => sum + value, 0)
   const outcome = result.outcome === 'failure' && skillPoints >= 0 ? 'success' : result.outcome
   const success = outcome !== 'failure' && outcome !== 'botch' && outcome !== 'disaster'
   return { ...result, spent, skillPoints, outcome, success, quality: success ? qualityLevel(Math.max(0, skillPoints)) : null }
}

// Routine result: no dice, the FP are fixed (S. 184).
export const routineResult = (targets: number[], skillPoints: number): SkillCheckResult =>
   ({ rolls: [], targets, spent: [0, 0, 0], skillPoints, success: true, outcome: 'success', quality: qualityLevel(skillPoints) })

// source: DSA5 Regelwerk, S. 184–185 (Routinevoraussetzungen: hardest modifier → minimum FW)
const routineTable = [[3, 1], [2, 4], [1, 7], [0, 10], [-1, 13], [-2, 16], [-3, 19]] as const
export function routineMinimum(modifier: number) {
   return modifier < -3 ? null : routineTable.find(([limit]) => modifier >= limit)![1]
}
export type RoutineCheck = { allowed: boolean; reason: string | null; minimum: number | null; skillPoints: number; quality: number }
// All probe attributes 13+ (optional "Verrechnung": +3 FW minimum per missing point); FP = half the FW, rounded up.
export function routineCheck(attributes: readonly number[], skillValue: number, modifier: number, trade = false): RoutineCheck {
   const skillPoints = Math.ceil(skillValue / 2)
   const quality = qualityLevel(skillPoints)
   const base = routineMinimum(modifier)
   const deficit = attributes.reduce((sum, value) => sum + Math.max(0, 13 - value), 0)
   if (base === null) return { allowed: false, reason: 'Routine is not possible for checks harder than −3.', minimum: null, skillPoints, quality }
   if (deficit > 0 && !trade) return { allowed: false, reason: 'Routine needs 13 or more in every probe attribute.', minimum: null, skillPoints, quality }
   const minimum = base + 3 * deficit
   return skillValue >= minimum
      ? { allowed: true, reason: null, minimum, skillPoints, quality }
      : { allowed: false, reason: 'FW too low for a routine check at this modifier.', minimum, skillPoints, quality }
}
// Hardest modifier that still allows a routine check, or null.
export function hardestRoutineModifier(attributes: readonly number[], skillValue: number, trade = false) {
   for (let modifier = -3; modifier <= 3; modifier++) if (routineCheck(attributes, skillValue, modifier, trade).allowed) return modifier
   return null
}

// source: DSA5 Regelwerk, S. 218 (Rosstäuscher: roll twice, the better result counts): success first, then more FP
export function betterResult(first: SkillCheckResult, second: SkillCheckResult) {
   if (first.success !== second.success) return first.success ? first : second
   return second.skillPoints > first.skillPoints ? second : first
}

export function isPatzer(result: SkillCheckResult) {
   return result.outcome === 'botch' || result.outcome === 'disaster'
}

// source: DSA5 Regelwerk, S. 164 (Begabung: one die again, the better result counts; not after a Doppel-/Dreifach-20)
export const canUseAptitude = (result: SkillCheckResult) => !isPatzer(result)
export function aptitudeRolls(rolls: readonly number[], index: number, reroll: number) {
   return rolls.map((roll, slot) => slot === index ? Math.min(roll, reroll) : roll)
}

// source: DSA5 Regelwerk, S. 178 (Unfähig: the best die is rolled again and the second result is binding)
// User decision: "best" is the lowest number; on a tie the first of them.
export const bestDieIndex = (rolls: readonly number[]) => rolls.indexOf(Math.min(...rolls))
export function inabilityRolls(rolls: readonly number[], reroll: number) {
   const index = bestDieIndex(rolls)
   return rolls.map((roll, slot) => slot === index ? reroll : roll)
}

export type OpposedSide = { success: boolean; quality: number; critical: boolean; botch: boolean }
export type OpposedRole = 'active' | 'passive' | 'none'
// netQuality null: decided by a critical/botch, the book gives no QS for that case.
export type OpposedResult = { winner: 'own' | 'opponent' | 'draw'; netQuality: number | null; reason: string }

// source: DSA5 Regelwerk, S. 25–26 (Vergleichsprobe), S. 27 (Gruppenprobe: QS of all members are added)
export function evaluateOpposed(own: OpposedSide, opponent: OpposedSide, role: OpposedRole): OpposedResult {
   const passive = role === 'passive' ? 'own' : role === 'active' ? 'opponent' : null
   if (own.critical && opponent.critical) return { winner: 'draw', netQuality: null, reason: 'Both critical: a true draw.' }
   if (own.critical || opponent.critical) return { winner: own.critical ? 'own' : 'opponent', netQuality: null, reason: 'A critical success wins automatically.' }
   if (own.botch && opponent.botch) return { winner: 'draw', netQuality: null, reason: 'Both botched: a draw.' }
   if (own.botch || opponent.botch) return { winner: own.botch ? 'opponent' : 'own', netQuality: null, reason: 'A botch loses the contest.' }
   if (!own.success && !opponent.success) return passive
      ? { winner: passive, netQuality: 1, reason: 'Both failed: the passive side wins with a slight success (QS 1).' }
      : { winner: 'draw', netQuality: null, reason: 'Both failed and there is no passive side.' }
   const ownQuality = own.success ? own.quality : 0
   const opponentQuality = opponent.success ? opponent.quality : 0
   if (ownQuality === opponentQuality) return passive
      ? { winner: passive, netQuality: 0, reason: 'Tie: the passive side wins.' }
      : { winner: 'draw', netQuality: 0, reason: 'Tie: a draw.' }
   return ownQuality > opponentQuality
      ? { winner: 'own', netQuality: ownQuality - opponentQuality, reason: 'More QS wins; the result is the net QS.' }
      : { winner: 'opponent', netQuality: opponentQuality - ownQuality, reason: 'More QS wins; the result is the net QS.' }
}

// Exact chance over all 20³ dice combinations.
export function successChance(targets: number[], skillValue: number) {
   if (targets.length !== 3 || targets.some((target) => target <= 0)) return 0
   let successes = 0
   for (let a = 1; a <= 20; a++) for (let b = 1; b <= 20; b++) for (let c = 1; c <= 20; c++)
      if (evaluateSkillCheck([a, b, c], targets, skillValue).success) successes++
   return successes / 8000
}
