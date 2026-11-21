import { describe, expect, it } from 'vitest'
import {
   aptitudeRolls, bestDieIndex, canUseAptitude, criticalSkillPoints, evaluateSkillCheck, hardestRoutineModifier, improvedSpent, improveResult, betterResult, inabilityRolls,
   routineCheck, routineMinimum,
} from './skillCheck'

describe('Wilde Magie: a 19 counts as a 20 for spell botches (S. 179)', () => {
   it.each([
      [[19, 20, 5], 20, 'failure'],
      [[19, 20, 5], 19, 'botch'],
      [[19, 19, 19], 19, 'disaster'],
      [[19, 3, 4], 19, 'success'],
   ] as const)('rolls %j with botchFrom %i → %s', (rolls, botchFrom, outcome) => {
      expect(evaluateSkillCheck([...rolls], [12, 12, 12], 10, botchFrom).outcome).toBe(outcome)
   })
})

describe('Begabung: one die again, the better result counts (S. 164)', () => {
   it.each([
      [[15, 8, 3], 0, 7, [7, 8, 3]],
      [[15, 8, 3], 0, 18, [15, 8, 3]],
      [[15, 8, 3], 2, 1, [15, 8, 1]],
   ])('rolls %j, die %i rerolled to %i → %j', (rolls, index, reroll, expected) => {
      expect(aptitudeRolls(rolls, index, reroll)).toEqual(expected)
   })
   it('cannot be used after a double or triple 20', () => {
      expect(canUseAptitude(evaluateSkillCheck([20, 20, 4], [12, 12, 12], 5))).toBe(false)
      expect(canUseAptitude(evaluateSkillCheck([20, 20, 20], [12, 12, 12], 5))).toBe(false)
      expect(canUseAptitude(evaluateSkillCheck([20, 13, 4], [12, 12, 12], 5))).toBe(true)
   })
})

describe('Unfähig: the best (lowest) die is rolled again, the second result is binding (S. 178, user decision)', () => {
   it.each([
      [[4, 12, 9], 0],
      [[14, 2, 9], 1],
      [[7, 12, 7], 0],
   ])('best die of %j is %i', (rolls, index) => {
      expect(bestDieIndex(rolls)).toBe(index)
   })
   it('keeps the new result even when it is worse', () => {
      expect(inabilityRolls([4, 12, 9], 17)).toEqual([17, 12, 9])
      expect(inabilityRolls([4, 12, 9], 1)).toEqual([1, 12, 9])
   })
})

describe('Routineprobe (S. 184–185)', () => {
   it.each([[5, 1], [3, 1], [2, 4], [1, 7], [0, 10], [-1, 13], [-2, 16], [-3, 19], [-4, null]] as const)('modifier %i needs FW %s', (modifier, minimum) => {
      expect(routineMinimum(modifier)).toBe(minimum)
   })
   it('Geron example: FW 11 at ±0 keeps 6 FP', () => {
      expect(routineCheck([13, 13, 13], 11, 0)).toMatchObject({ allowed: true, skillPoints: 6, quality: 2 })
   })
   it('needs 13 in every probe attribute', () => {
      expect(routineCheck([13, 13, 12], 20, 0).allowed).toBe(false)
   })
   it('optional Verrechnung: 13/13/12 needs FW 10 at +1', () => {
      expect(routineCheck([13, 13, 12], 9, 1, true).allowed).toBe(false)
      expect(routineCheck([13, 13, 12], 10, 1, true)).toMatchObject({ allowed: true, minimum: 10 })
   })
   it('finds the hardest allowed modifier', () => {
      expect(hardestRoutineModifier([14, 13, 15], 11)).toBe(0)
      expect(hardestRoutineModifier([14, 13, 15], 3)).toBe(3)
      expect(hardestRoutineModifier([12, 13, 15], 11)).toBeNull()
   })
})

describe('talent-specific Kritischer Erfolg (S. 189–212)', () => {
   it('FP = doppelter FW', () => expect(criticalSkillPoints(2, 9, 'doubleSkill')).toBe(18))
   it('crafting: FP doubled, at least 5', () => {
      expect(criticalSkillPoints(4, 9, 'doubleFp')).toBe(8)
      expect(criticalSkillPoints(1, 9, 'doubleFp')).toBe(5)
      expect(criticalSkillPoints(-3, 9, 'doubleFp')).toBe(5)
   })
   it('without a rule the remaining FP count', () => expect(criticalSkillPoints(-2, 9, undefined)).toBe(0))
})

describe('Eigenschaft verbessern in a Fertigkeitsprobe (S. 222)', () => {
   it('lowers the cost of one Teilprobe by up to 2', () => {
      expect(improvedSpent([3, 1, 0], 0)).toEqual([1, 1, 0])
      expect(improvedSpent([3, 1, 0], 1)).toEqual([3, 0, 0])
   })
   it('can turn a failure into a success but keeps a Patzer', () => {
      const failed = evaluateSkillCheck([14, 10, 10], [12, 12, 12], 1)
      expect(improveResult(failed, 0, 1)).toMatchObject({ outcome: 'success', skillPoints: 1, quality: 1 })
      const botch = evaluateSkillCheck([20, 20, 14], [12, 12, 12], 10)
      expect(improveResult(botch, 2, 10).outcome).toBe('botch')
   })
})

describe('Rosstäuscher: roll twice, keep the better result (S. 218)', () => {
   it('prefers a success, then more FP', () => {
      const failed = evaluateSkillCheck([18, 18, 18], [12, 12, 12], 5)
      const low = evaluateSkillCheck([13, 10, 10], [12, 12, 12], 5)
      const high = evaluateSkillCheck([3, 10, 10], [12, 12, 12], 5)
      expect(betterResult(failed, low)).toBe(low)
      expect(betterResult(high, low)).toBe(high)
      expect(betterResult(low, failed)).toBe(low)
   })
})
