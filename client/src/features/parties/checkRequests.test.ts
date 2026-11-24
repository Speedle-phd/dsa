import { describe, expect, it } from 'vitest'
import type { CheckRequest } from './checkRequestApi'
import { checkTitle, fromAttributeCheck, fromTalentCheck, openForHero, resultSummary } from './checkRequests'

describe('GM check requests (client)', () => {
   it('sends a talent check with its QS only when it succeeded', () => {
      expect(fromTalentCheck({ result: { success: true, rolls: [4, 11, 9], outcome: 'success' }, quality: 2 }))
         .toEqual({ success: true, qs: 2, rolls: [4, 11, 9], outcome: 'success' })
      expect(fromTalentCheck({ result: { success: false, rolls: [20, 20, 3], outcome: 'botch' }, quality: null }))
         .toEqual({ success: false, qs: null, rolls: [20, 20, 3], outcome: 'botch' })
   })

   it('sends an attribute check with the confirmation roll when there was one (S. 20)', () => {
      expect(fromAttributeCheck({ success: true, roll: 1, confirmation: 7, outcome: 'critical' })).toEqual({ success: true, qs: null, rolls: [1, 7], outcome: 'critical' })
      expect(fromAttributeCheck({ success: false, roll: 15, outcome: 'failure' }).rolls).toEqual([15])
   })

   it('names the check with its modifier', () => {
      expect(checkTitle({ kind: 'talent', key: 'sinnesschaerfe', modifier: -2 }, 'de')).toBe('Sinnesschärfe −2')
      expect(checkTitle({ kind: 'attribute', key: 'courage', modifier: 1 }, 'en')).toBe('Courage +1')
      expect(checkTitle({ kind: 'attribute', key: 'courage', modifier: 0 }, 'de')).toBe('Mut')
   })

   it('summarises a result for the GM', () => {
      expect(resultSummary({ success: true, qs: 3, rolls: [1, 2, 3], outcome: 'success' }, 'de')).toBe('Gelungen · QS 3')
      expect(resultSummary({ success: false, qs: null, rolls: [20], outcome: 'botch' }, 'de')).toBe('Patzer')
   })

   it('lists only the open requests the viewer must answer for that hero', () => {
      const request = (id: string, status: CheckRequest['status'], state: 'open' | 'rolled', mine = true): CheckRequest => ({
         id, kind: 'talent', key: 'sinnesschaerfe', modifier: 0, hidden: false, note: '', status, createdAt: '',
         targets: [{ charId: 'hero', name: 'Alrike', state, mine, result: null }],
      })
      const requests = [request('a', 'open', 'open'), request('b', 'open', 'rolled'), request('c', 'closed', 'open'), request('d', 'open', 'open', false)]
      expect(openForHero(requests, 'hero').map((entry) => entry.id)).toEqual(['a'])
   })
})
