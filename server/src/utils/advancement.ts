import { attributeLevelUp, activationCost } from './attributeLevelUp'
import { BadRequestError } from './appError'

// source: DSA5 Regelwerk, S. 50 (sum of individual target-step costs)
export function advancementCost(
   current: number | null,
   target: number,
   factor: 'a' | 'b' | 'c' | 'd' | 'e',
   spendAP: boolean,
) {
   if (!Number.isInteger(target) || target < 0 || target > 25) {
      throw new BadRequestError('Enter a whole number between 0 and 25.')
   }
   if (!spendAP) return 0
   if (current !== null && target < current) {
      throw new BadRequestError('Disable Spend AP to correct or lower a value. No AP are refunded.')
   }
   let cost = current === null && factor !== 'e' ? activationCost(factor) : 0
   for (let step = current ?? 0; step < target; step++) {
      cost += attributeLevelUp(step, factor)[1]
   }
   return cost
}

export function assertAffordable(cost: number, total: number, spent: number) {
   if (cost > total - spent) throw new BadRequestError('Not enough AP for this advancement.')
}
