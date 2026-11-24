import { describe, expect, it } from 'vitest'
import { abilityLevel, maneuverEffect, npcManeuvers, withManeuverDice } from './npcManeuvers'
import { npcPainLevel } from './npcSheet'

describe('NPC maneuvers (S. 247–250)', () => {
   it('reads the highest level from the printed forms', () => {
      expect(abilityLevel(['Finte I'], 'Finte', true)).toBe(1)
      expect(abilityLevel(['Finte I+II (Schwert, Waffenlos)'], 'Finte', true)).toBe(2)
      expect(abilityLevel(['Wuchtschlag I-III'], 'Wuchtschlag', true)).toBe(3)
      expect(abilityLevel(['Finte'], 'Finte', true)).toBe(1)
      expect(abilityLevel(['Fintenreich'], 'Finte', true)).toBe(0)
      expect(abilityLevel(['Präziser Schuss/Wurf II'], 'Präziser Schuss/Wurf', true)).toBe(2)
   })
   it('offers only maneuvers that fit the weapon', () => {
      const abilities = ['Finte II', 'Wuchtschlag I', 'Präziser Schuss/Wurf I', 'Hammerschlag']
      expect(npcManeuvers(abilities, { kind: 'melee' }).map((entry) => entry.name)).toEqual(['Finte', 'Wuchtschlag', 'Hammerschlag'])
      expect(npcManeuvers(abilities, { kind: 'ranged' }).map((entry) => entry.name)).toEqual(['Präziser Schuss/Wurf'])
      expect(npcManeuvers(abilities, { kind: 'natural' }).map((entry) => entry.name)).toEqual(['Finte', 'Wuchtschlag'])
   })
   it('Finte II: AT −2, defense −4; Wuchtschlag I: AT −2, TP +2; level capped', () => {
      const [finte, wucht] = npcManeuvers(['Finte II', 'Wuchtschlag I'], { kind: 'melee' })
      expect(maneuverEffect(finte, 2)).toMatchObject({ attack: -2, defense: -4, tp: 0, label: 'Finte II' })
      expect(maneuverEffect(wucht, 3)).toMatchObject({ attack: -2, defense: 0, tp: 2, label: 'Wuchtschlag I' })
   })
   it('Hammerschlag adds 1W6 to W6 dice', () => {
      const [hammer] = npcManeuvers(['Hammerschlag'], { kind: 'melee' })
      expect(withManeuverDice({ count: 1, sides: 6, bonus: 4 }, maneuverEffect(hammer, 1))).toEqual({ count: 2, sides: 6, bonus: 4 })
      expect(withManeuverDice({ count: 1, sides: 6, bonus: 4 }, null, -1)).toEqual({ count: 1, sides: 6, bonus: 3 })
   })
})

describe('NPC Schmerz (S. 34)', () => {
   it('uses the rule, printed thresholds or none', () => {
      expect(npcPainLevel(31, 31, null)).toBe(0)
      expect(npcPainLevel(23, 31, null)).toBe(1)
      expect(npcPainLevel(15, 31, null)).toBe(2)
      expect(npcPainLevel(5, 31, null)).toBe(4)
      expect(npcPainLevel(17, 33, [25, 17, 8, 5])).toBe(2)
      expect(npcPainLevel(1, 33, [])).toBe(0)
   })
})
