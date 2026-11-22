import { describe, expect, it } from 'vitest'
import { canApplyEffects, canViewParty, canViewSheet, heroIsTaken, partyRole, rosterDetail, type PartyRuleMember, type PartyRuleShape } from './partyRules'

const member = (userId: string, charId: string, change: Partial<PartyRuleMember> = {}): PartyRuleMember =>
   ({ userId, charId, statsId: `s-${charId}`, state: 'accepted', visibility: 'summary', ...change })
const party = (change: Partial<PartyRuleShape> = {}): PartyRuleShape => ({
   gmUserId: 'gm', status: 'active',
   members: [member('alice', 'a'), member('bob', 'b', { visibility: 'full' }), member('carol', 'c', { visibility: 'private' }),
      member('dave', 'd', { state: 'pending' })],
   ...change,
})

describe('party roles and access (user decisions, Nov 2026)', () => {
   it('knows the GM, accepted members, pending requests and strangers', () => {
      expect([partyRole(party(), 'gm'), partyRole(party(), 'alice'), partyRole(party(), 'dave'), partyRole(party(), 'eve')])
         .toEqual(['gm', 'member', 'pending', null])
   })
   it('shows the party only to the GM and accepted members of an active party', () => {
      expect(canViewParty(party(), 'gm')).toBe(true)
      expect(canViewParty(party(), 'alice')).toBe(true)
      expect(canViewParty(party(), 'dave')).toBe(false)
      expect(canViewParty(party(), 'eve')).toBe(false)
      expect(canViewParty(party({ status: 'archived' }), 'gm')).toBe(false)
   })
   it('opens full sheets to the GM, the owner and members when the owner chose "full"', () => {
      expect(canViewSheet(party(), 'gm', 'c')).toBe(true)
      expect(canViewSheet(party(), 'alice', 'a')).toBe(true)
      expect(canViewSheet(party(), 'alice', 'b')).toBe(true)
      expect(canViewSheet(party(), 'bob', 'a')).toBe(false)
      expect(canViewSheet(party(), 'alice', 'c')).toBe(false)
      // pending heroes and pending viewers have no sheet access
      expect(canViewSheet(party(), 'gm', 'd')).toBe(false)
      expect(canViewSheet(party(), 'dave', 'b')).toBe(false)
   })
   it('lets only the GM apply game effects, and only to accepted heroes', () => {
      expect(canApplyEffects(party(), 'gm', 's-a')).toBe(true)
      expect(canApplyEffects(party(), 'gm', 's-d')).toBe(false)
      expect(canApplyEffects(party(), 'alice', 's-b')).toBe(false)
      expect(canApplyEffects(party({ status: 'archived' }), 'gm', 's-a')).toBe(false)
   })
   it('shapes the roster by the owner\'s choice; GM and owner see everything', () => {
      const p = party()
      const [alice, bob, carol, dave] = p.members
      expect(rosterDetail(p, 'gm', carol)).toBe('all')
      expect(rosterDetail(p, 'alice', alice)).toBe('all')
      expect(rosterDetail(p, 'alice', bob)).toBe('full')
      expect(rosterDetail(p, 'bob', alice)).toBe('summary')
      expect(rosterDetail(p, 'alice', carol)).toBe('name')
      expect(rosterDetail(p, 'alice', dave)).toBe('name')
   })
   it('allows a hero in one active party at a time (pending requests count)', () => {
      expect(heroIsTaken([party()], 'd')).toBe(true)
      expect(heroIsTaken([party({ status: 'archived' })], 'a')).toBe(false)
      expect(heroIsTaken([party()], 'z')).toBe(false)
   })
})
