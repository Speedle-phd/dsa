import { describe, expect, it } from 'vitest'
import { patzerResult, patzerTables, weaponStatePenalty, weaponUnusable } from './patzerTables'
import { evaluateCombatRoll, defenseTarget } from './combatRoll'

describe('Patzertabellen (S. 231–232, 234, 243–244)', () => {
   it('has one entry for every 2W6 result', () => {
      for (const table of Object.values(patzerTables)) expect(table.map((entry) => entry.roll)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
   })
   it('unarmed fighters add 5 below 7 (S. 231, 234)', () => {
      expect(patzerResult('melee', 3, { unarmed: true }).roll).toBe(8)
      expect(patzerResult('melee', 7, { unarmed: true }).roll).toBe(7)
   })
   it('dodging a ranged attack adds 5 on 2–6 (S. 244)', () => {
      expect(patzerResult('rangedDefense', 6, { dodge: true }).roll).toBe(11)
      expect(patzerResult('rangedDefense', 6).action).toEqual({ kind: 'weapon', state: 'stuck' })
   })
   it('a damaged weapon: melee AT/PA −2, ranged FK −4', () => {
      expect(weaponStatePenalty('damaged', false)).toBe(-2)
      expect(weaponStatePenalty('damaged', true)).toBe(-4)
      expect(weaponUnusable('lost')).toBe(true)
      expect(weaponUnusable(undefined)).toBe(false)
   })
})

describe('Kampfwürfe (S. 231, 235, 237)', () => {
   it('Kettenwaffen botch already on 19', () => {
      expect(evaluateCombatRoll(19, 15, 18, { botchFrom: 19 }).outcome).toBe('botch')
      expect(evaluateCombatRoll(19, 15, 18).outcome).toBe('failure')
   })
   it('a Passierschlag knows no critical or botch', () => {
      expect(evaluateCombatRoll(1, 11, undefined, { noCritical: true }).outcome).toBe('success')
      expect(evaluateCombatRoll(20, 11, undefined, { noCritical: true }).outcome).toBe('failure')
   })
   it('defense penalty accumulates; a critical attack halves rounding up (S. 231–232)', () => {
      expect(defenseTarget(12, 3, false)).toBe(9)
      expect(defenseTarget(7, 0, true)).toBe(4)
   })
})
