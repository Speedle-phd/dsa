import { throwColoredDice } from '@/components/diceEngine'
import { evaluateCombatRoll, needsConfirmation, type D20Roll, type RollRules } from './combatRoll'

// source: DSA5 Regelwerk, S. 21, 231–233 (1W20 against the value; 1 or 20 needs a Bestätigungswurf with the same modifiers)
export async function rollD20(color: string, target: number, rules: RollRules = {}): Promise<D20Roll> {
   const [roll] = await throwColoredDice(20, [color])
   const confirmation = needsConfirmation(roll, rules) ? (await throwColoredDice(20, [color]))[0] : undefined
   return { roll, confirmation, target, ...evaluateCombatRoll(roll, target, confirmation, rules) }
}

// source: DSA5 Regelwerk, S. 169 (Waffenbegabung: the Bestätigungswurf after a critical or a botch may be rolled again; the new one counts)
export async function rerollConfirmation(result: D20Roll, color: string, rules: RollRules = {}): Promise<D20Roll> {
   const [confirmation] = await throwColoredDice(20, [color])
   return { ...result, confirmation, confirmationRerolled: true, ...evaluateCombatRoll(result.roll, result.target, confirmation, rules) }
}
