import { describe, expect, it } from 'vitest'
import { applyEntryValues, entryStatuses, entryValueBonus, entryValueSources, halvesSpeedBase } from './entryDerivedValues'
import { checkModifiers } from './checkModifiers'
import { toPublicStats } from '../views/statsView'

const hero = (advantages: string[] = [], disadvantages: string[] = []) => ({
   advantages, disadvantages, courage: 12, wisdom: 12, intuition: 12, strength: 12, constitution: 12,
   soulPower: { value: -5, bonusMalus: 0, max: 0 }, toughness: { value: -5, bonusMalus: 0, max: 0 },
   fatePoints: { value: 3, bonusMalus: 0, current: 3, max: 0 },
})

describe('SK and ZK from Vor-/Nachteile (S. 166, 167, 174)', () => {
   it.each([
      [[], [], 1, 1],
      [['Hohe Seelenkraft'], [], 2, 1],
      [[], ['Niedrige Seelenkraft'], 0, 1],
      [['Hohe Zähigkeit'], [], 1, 2],
      [[], ['Niedrige Zähigkeit'], 1, 0],
   ])('%j / %j → SK %i, ZK %i (Mensch −5, attributes 12)', (advantages, disadvantages, soulPower, toughness) => {
      const stat = hero(advantages, disadvantages)
      applyEntryValues(stat)
      expect(stat.soulPower.max).toBe(soulPower)
      expect(stat.toughness.max).toBe(toughness)
   })
   it('keeps the manual other modifier on top', () => {
      const stat = hero(['Hohe Seelenkraft'])
      stat.soulPower.bonusMalus = 1
      applyEntryValues(stat)
      expect(stat.soulPower.max).toBe(3)
      expect(entryValueSources(stat, 'soulPower')).toEqual([{ label: 'Hohe Seelenkraft', value: 1, page: 166 }])
   })
})

describe('Schips maximum with Glück / Pech (S. 165, 174)', () => {
   it.each([
      [['Glück I'], [], 4],
      [['Glück III'], [], 6],
      [[], ['Pech II'], 1],
      [[], ['Pech III'], 0],
   ])('%j / %j → %i', (advantages, disadvantages, max) => {
      const stat = hero(advantages, disadvantages)
      applyEntryValues(stat)
      expect(stat.fatePoints.max).toBe(max)
   })
   it('never drops below 0 (S. 174)', () => {
      const stat = hero([], ['Pech III'])
      stat.fatePoints.bonusMalus = -1
      applyEntryValues(stat)
      expect(stat.fatePoints.max).toBe(0)
   })
})

describe('GS-Grundwert: Flink, Behäbig, Einbeinig (S. 165, 171, 179)', () => {
   it('Flink +1, Behäbig −1', () => {
      expect(entryValueBonus(hero(['Flink']), 'speed')).toBe(1)
      expect(entryValueBonus(hero([], ['Behäbig']), 'speed')).toBe(-1)
   })
   it('Einbeinig halves the base', () => {
      expect(halvesSpeedBase(hero([], ['Verstümmelt (Einbeinig)']))).toBe(true)
      expect(halvesSpeedBase(hero([], ['Verstümmelt (Einäugig)']))).toBe(false)
   })
   it('is reported with the check modifiers', () => {
      const result = checkModifiers({ pain: 0, combatConditions: {}, combatSpecialAbilities: [], equipment: [], advantages: [],
         disadvantages: ['Behäbig', 'Verstümmelt (Einbeinig)'] })
      expect(result.speedBase).toEqual({ sources: [{ label: 'Behäbig', value: -1, page: 171 }], halved: { label: 'Verstümmelt (Einbeinig)', page: 179 } })
   })
})

describe('Permanent statuses from Blind, Taub, Stumm (S. 171, 178)', () => {
   it('derives the statuses without storing them', () => {
      expect(entryStatuses(hero([], ['Blind', 'Stumm', 'Behäbig']))).toEqual(['Blind', 'Stumm'])
      const stats = toPublicStats({ ...hero([], ['Taub']), _id: 'a', userId: 'b', charId: 'c', statuses: [], createdAt: new Date(), updatedAt: new Date() })
      expect(stats.statuses).toEqual([])
      expect(stats.permanentStatuses).toEqual(['Taub'])
   })
   it('corrects old heroes on read (SK/Schips)', () => {
      const stats = toPublicStats({ ...hero(['Hohe Seelenkraft', 'Glück II']), _id: 'a', userId: 'b', charId: 'c', createdAt: new Date(), updatedAt: new Date() })
      expect(stats.soulPower.max).toBe(2)
      expect(stats.fatePoints).toMatchObject({ max: 5, current: 3 })
   })
})
