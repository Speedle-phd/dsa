import { describe, expect, it } from 'vitest'
import { newExtendedCheck, recordAttempt, type ExtendedAttempt, type ExtendedCheckState } from './extendedCheck'

const play = (state: ExtendedCheckState, ...attempts: Array<Omit<ExtendedAttempt, 'by'>>) =>
   attempts.reduce((current, attempt) => recordAttempt(current, { ...attempt, by: null }), state)

describe('Sammelprobe (S. 26–27)', () => {
   it('Rowena example: 10 attempts allowed, a failure makes the next attempts 1 harder', () => {
      const state = play(newExtendedCheck(10), { outcome: 'success', quality: 2 }, { outcome: 'failure', quality: 0 }, { outcome: 'failure', quality: 0 })
      expect(state).toMatchObject({ collected: 2, penalty: 2, status: 'open' })
      expect(state.attempts).toHaveLength(3)
   })
   it('reaches the goal at 10 QS; 6 QS alone is only a Teilerfolg', () => {
      expect(play(newExtendedCheck(7), { outcome: 'success', quality: 6 }).status).toBe('open')
      expect(play(newExtendedCheck(7), { outcome: 'success', quality: 6 }, { outcome: 'success', quality: 4 }).status).toBe('done')
   })
   it('a talent with its own critical rule counts the QS once but still clears the penalties (S. 189–212)', () => {
      const failed = play(newExtendedCheck(10), { outcome: 'failure', quality: 0 })
      expect(recordAttempt(failed, { outcome: 'critical', quality: 4, by: null }, true)).toMatchObject({ collected: 4, penalty: 0 })
      expect(recordAttempt(failed, { outcome: 'critical', quality: 4, by: null })).toMatchObject({ collected: 8, penalty: 0 })
   })
   it('a critical success doubles its QS and clears the failure penalties', () => {
      const state = play(newExtendedCheck(10), { outcome: 'failure', quality: 0 }, { outcome: 'critical', quality: 3 })
      expect(state).toMatchObject({ collected: 6, penalty: 0 })
   })
   it('a Patzer resets the collected QS and fails the check', () => {
      const state = play(newExtendedCheck(10), { outcome: 'success', quality: 5 }, { outcome: 'botch', quality: 0 })
      expect(state).toMatchObject({ collected: 0, status: 'failed' })
      expect(() => recordAttempt(state, { outcome: 'success', quality: 1, by: null })).toThrow()
   })
   it('fails when the allowed attempts are used up (5 = schwer)', () => {
      const state = play(newExtendedCheck(5), ...Array.from({ length: 5 }, () => ({ outcome: 'success' as const, quality: 1 })))
      expect(state).toMatchObject({ collected: 5, status: 'failed' })
   })
   it('a success with 0 FP still counts as QS 1 (S. 23)', () => {
      expect(play(newExtendedCheck(5), { outcome: 'success', quality: 0 }).collected).toBe(1)
   })
   it('group members add to the same pool (Gruppensammelprobe, S. 27)', () => {
      const state = recordAttempt(play(newExtendedCheck(10), { outcome: 'success', quality: 4 }), { outcome: 'success', quality: 3, by: 'Mirhiban' })
      expect(state.collected).toBe(7)
      expect(state.attempts[1].by).toBe('Mirhiban')
   })
})
