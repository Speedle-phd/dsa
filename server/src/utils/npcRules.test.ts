import { describe, expect, it } from 'vitest'
import { emptySheet, fleeThreshold, legacyFromWeapons, npcAttackTurn, npcPain, npcWeapons, type NpcWeapon } from './npcRules'

const sword: NpcWeapon = { name: 'Säbel', kind: 'melee', attack: 13, parry: 7, damage: '1W6+3', reach: 'medium', range: null, reload: null, ammo: null, perRound: null }
const bow: NpcWeapon = { name: 'Kurzbogen', kind: 'ranged', attack: 12, parry: null, damage: '1W6+4', reach: null, range: '10/50/80', reload: 1, ammo: null, perRound: null }

describe('NPC rules', () => {
   it('turns an NPC from before the stat blocks into one attack', () => {
      expect(npcWeapons({ attack: 12, parry: 6, damage: '1W6+3' })).toMatchObject([{ kind: 'melee', attack: 12, parry: 6, damage: '1W6+3' }])
      expect(npcWeapons({ attack: null, parry: null, damage: '' })).toEqual([])
      expect(npcWeapons({ attack: 1, parry: 1, damage: '', sheet: { ...emptySheet(), weapons: [bow, sword] } })).toEqual([bow, sword])
   })

   it('keeps the flat values of the older screens on the first melee weapon', () => {
      expect(legacyFromWeapons([bow, sword])).toEqual({ attack: 13, parry: 7, damage: '1W6+3' })
      expect(legacyFromWeapons([bow])).toEqual({ attack: 12, parry: null, damage: '1W6+4' })
   })

   it('counts Schmerz from the printed thresholds, else by the rule (S. 34)', () => {
      expect(npcPain(23, 31, [23, 16, 8, 5])).toBe(1)
      expect(npcPain(5, 31, [23, 16, 8, 5])).toBe(4)
      expect(npcPain(31, 31, [23, 16, 8, 5])).toBe(0)
      // rule: ≤ ¾ of 32 = 24 → I, ≤ ½ = 16 → II
      expect(npcPain(16, 32, null)).toBe(2)
      expect(npcPain(1, 40, [])).toBe(0)
   })

   it('derives the flight LeP from a percentage of lost LeP', () => {
      expect(fleeThreshold(31, 50)).toBe(15)
      expect(fleeThreshold(28, 25)).toBe(21)
   })
})

// source: DSA5 Regelwerk, S. 354 ("Aktionen: 2 (max. 1 × Biss)")
describe('creature actions per KR', () => {
   const bite: NpcWeapon = { name: 'Biss', kind: 'natural', attack: 12, parry: null, damage: '1W6+2', reach: 'short', range: null, reload: null, ammo: null, perRound: 1 }
   const claw: NpcWeapon = { ...bite, name: 'Pranke', perRound: null }
   it('allows two attacks, the second spends the action', () => {
      const first = npcAttackTurn(null, 3, 2, [bite, claw], 'Biss')
      expect(first).toEqual({ turn: { round: 3, free: false, dual: false, bonus: 0, attacks: 1, weapons: ['Biss'], action: false } })
      if (!('turn' in first)) throw new Error('expected a turn')
      const second = npcAttackTurn(first.turn, 3, 2, [bite, claw], 'Pranke')
      expect(second).toMatchObject({ turn: { attacks: 2, weapons: ['Biss', 'Pranke'], action: true } })
      if (!('turn' in second)) throw new Error('expected a turn')
      expect(npcAttackTurn(second.turn, 3, 2, [bite, claw], 'Pranke')).toEqual({ error: 'The action of this round is already used.' })
   })
   it('refuses a second bite (max. 1 × Biss)', () => {
      const first = npcAttackTurn(null, 1, 2, [bite, claw], 'Biss')
      if (!('turn' in first)) throw new Error('expected a turn')
      expect(npcAttackTurn(first.turn, 1, 2, [bite, claw], 'Biss')).toEqual({ error: 'This attack is used up for this round (S. 354).' })
   })
   it('keeps a used free action and refuses after the action went to a sprint', () => {
      expect(npcAttackTurn({ round: 1, action: false, free: true }, 1, 2, [claw], 'Pranke')).toMatchObject({ turn: { free: true, attacks: 1 } })
      expect(npcAttackTurn({ round: 1, action: true, free: true }, 1, 2, [claw], 'Pranke')).toEqual({ error: 'The action of this round is already used.' })
   })
})
