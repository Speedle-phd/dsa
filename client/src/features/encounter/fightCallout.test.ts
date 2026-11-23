import { describe, expect, it } from 'vitest'
import type { Combatant, Encounter } from './encounterApi'
import { fightCallout } from './fightCallout'

const actions = { action: true, free: true, dual: false, bonus: 0 }
const base = { initials: 'X', color: null, number: 1, position: null, canControl: false, moved: 0, engagedWith: [], actions }
const hero = (id: string, charId: string, initiative: number | null = 12): Combatant =>
   ({ ...base, id, kind: 'hero', charId, mine: true, initiativeBase: 12, name: id, initiative })
const npc: Combatant = { ...base, id: 'n1', kind: 'npc', state: 'unhurt', name: 'Ork', initiative: 10 }

function fight(change: Partial<Encounter> = {}): Encounter {
   return {
      _id: 'e1', status: 'active', name: '', round: 1, activeId: 'n1', board: { width: 10, height: 10, scale: 1 }, role: 'member',
      obstacles: [], passingGrants: [], openAttack: null, combatants: [hero('h1', 'char-1'), hero('h2', 'char-2'), npc], attacks: [], log: [],
      ...change,
   }
}

describe('fightCallout', () => {
   it('is null without a fight or when the hero is not in it', () => {
      expect(fightCallout(null, 'char-1')).toBeNull()
      expect(fightCallout(fight(), 'char-9')).toBeNull()
   })

   it('names the fight while another combatant acts', () => {
      expect(fightCallout(fight(), 'char-1')).toBe('fight')
   })

   it('asks for the initiative before anything else but a defense', () => {
      expect(fightCallout(fight({ round: 0, combatants: [hero('h1', 'char-1', null), npc] }), 'char-1')).toBe('initiative')
   })

   it('marks the own turn, but not while an attack is open', () => {
      expect(fightCallout(fight({ activeId: 'h1' }), 'char-1')).toBe('turn')
      expect(fightCallout(fight({ activeId: 'h1', openAttack: { attackerId: 'h1', targetId: 'n1', stage: 'defense' } }), 'char-1')).toBe('fight')
      expect(fightCallout(fight({ activeId: 'h1', round: 0 }), 'char-1')).toBe('fight')
   })

   it('calls for a defense only when this hero is attacked', () => {
      expect(fightCallout(fight({ openAttack: { attackerId: 'n1', targetId: 'h1', stage: 'defense' } }), 'char-1')).toBe('defend')
      expect(fightCallout(fight({ openAttack: { attackerId: 'n1', targetId: 'h1', stage: 'damage' } }), 'char-1')).toBe('fight')
      expect(fightCallout(fight({ openAttack: { attackerId: 'n1', targetId: 'h2', stage: 'defense' } }), 'char-1')).toBe('fight')
   })
})
