import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Stats } from '../models/stats.model'
import * as persistence from './statsPersistence'
import { levelUpAttribute, levelUpTalent, purchaseAdditionalVitalResources, updateStats } from '../controllers/statsController'
import { levelUpCombatTechnique, removeCombatAbility } from '../controllers/combatController'
import { addCharacterEntry, removeCharacterEntry } from '../controllers/characterEntryController'
import { mockStatsLookup } from './testing/mockStatsLookup'

function request(body: Record<string, unknown>) {
   return {
      params: { id: '507f1f77bcf86cd799439010' },
      user: { _id: '507f1f77bcf86cd799439011', username: 'Advancement test', email: 'test@example.invalid' },
      body,
   } as Request
}

function setup() {
   const stat = new Stats({
      _id: '507f1f77bcf86cd799439010', userId: '507f1f77bcf86cd799439011', charId: '507f1f77bcf86cd799439012',
      courage: 14, wisdom: 14, dexterity: 14, strength: 14, constitution: 14,
      level: 'Kompetent',
      experience: { base: 1100, total: 1250, gathered: 150, spent: 1200 },
      health: { value: 5, current: 33, max: 33 },
      talents: [{ key: 'gassenwissen', value: 7, notes: 'Keep this note' }],
      createdAt: new Date(), updatedAt: new Date(),
   })
   mockStatsLookup(stat)
   const save = vi.spyOn(persistence, 'saveStats').mockImplementation(async (doc) => { await doc.validate() })
   const res = { json: vi.fn(), status: vi.fn().mockReturnThis() } as Response
   return { stat, save, res }
}

describe('Section-level advancement persists values and AP (S. 28–29, 39, 50)', () => {
   beforeEach(() => vi.restoreAllMocks())

   it('charges the attribute target step by default and recalculates derived values', async () => {
      const { stat, res } = setup()
      await levelUpAttribute(request({ attribute: 'constitution' }), res)
      expect(stat.constitution).toBe(15)
      expect(stat.health.max).toBe(35)
      expect(stat.health.current).toBe(33)
      expect(stat.experience.spent).toBe(1230)
   })

   it('supports wisdom advancement through validated attribute names', async () => {
      const { stat, res } = setup()
      await levelUpAttribute(request({ attribute: 'wisdom', spendAP: false }), res)
      expect(stat.wisdom).toBe(15)
      expect(stat.experience.spent).toBe(1200)
   })

   it('allows free advancement without available AP and a downward correction without a refund', async () => {
      const { stat, res } = setup()
      stat.experience.spent = 1250
      await levelUpAttribute(request({ attribute: 'courage', spendAP: false }), res)
      expect(stat.courage).toBe(15)
      await levelUpAttribute(request({ attribute: 'courage', value: 10, spendAP: false }), res)
      expect(stat.courage).toBe(10)
      expect(stat.experience).toMatchObject({ base: 1100, total: 1250, gathered: 150, spent: 1250 })
   })

   it('rejects unaffordable attribute changes before mutating or saving', async () => {
      const { stat, save, res } = setup()
      stat.experience.spent = 1250
      await expect(levelUpAttribute(request({ attribute: 'courage' }), res)).rejects.toThrow('Not enough AP')
      expect(stat.courage).toBe(14)
      expect(save).not.toHaveBeenCalled()
   })

   it('charges talent costs and preserves notes during a free correction', async () => {
      const { stat, res } = setup()
      await levelUpTalent(request({ talentKey: 'gassenwissen' }), res)
      expect(stat.experience.spent).toBe(1203)
      await levelUpTalent(request({ talentKey: 'gassenwissen', value: 3, spendAP: false }), res)
      expect(stat.talents[0]).toMatchObject({ value: 3, notes: 'Keep this note' })
      expect(stat.experience.spent).toBe(1203)
   })

   it('stops AP raises at the talent maximum (S. 39), but not free corrections', async () => {
      const { stat, res } = setup()
      stat.talents[0].value = 16
      await expect(levelUpTalent(request({ talentKey: 'gassenwissen' }), res)).rejects.toThrow('maximum 16')
      stat.advantages = ['Herausragende Fertigkeit (gassenwissen)']
      await levelUpTalent(request({ talentKey: 'gassenwissen' }), res)
      expect(stat.talents[0].value).toBe(17)
      await levelUpTalent(request({ talentKey: 'gassenwissen', value: 20, spendAP: false }), res)
      expect(stat.talents[0].value).toBe(20)
   })

   it('records a previously unset talent without AP when disabled', async () => {
      const { stat, res } = setup()
      await levelUpTalent(request({ talentKey: 'schwimmen', value: 8, spendAP: false }), res)
      expect(stat.talents.find((entry) => entry.key === 'schwimmen')?.value).toBe(8)
      expect(stat.experience.spent).toBe(1200)
   })

   it('keeps AP and notes untouched when a talent advancement is unaffordable', async () => {
      const { stat, save, res } = setup()
      stat.experience.spent = 1250
      await expect(levelUpTalent(request({ talentKey: 'gassenwissen' }), res)).rejects.toThrow('Not enough AP')
      expect(stat.talents[0]).toMatchObject({ value: 7, notes: 'Keep this note' })
      expect(save).not.toHaveBeenCalled()
   })

   it('charges multi-step combat advancement and permits correction above the rule cap only without AP', async () => {
      const { stat, res } = setup()
      await levelUpCombatTechnique(request({ techniqueKey: 'Dolche', value: 9 }), res)
      expect(stat.experience.spent).toBe(1206)
      await expect(levelUpCombatTechnique(request({ techniqueKey: 'Dolche', value: 20 }), res)).rejects.toThrow('maximum')
      await levelUpCombatTechnique(request({ techniqueKey: 'Dolche', value: 20, spendAP: false }), res)
      expect(stat.combatTechniques.find((entry) => entry.key === 'Dolche')?.value).toBe(20)
      expect(stat.experience.spent).toBe(1206)
   })

   it('increases resource maximum and current pool together, paid or free', async () => {
      const { stat, res } = setup()
      await purchaseAdditionalVitalResources(request({ value: 'health' }), res)
      expect(stat.health).toMatchObject({ additionalPurchase: 1, max: 34, current: 34 })
      expect(stat.experience.spent).toBe(1204)
      await purchaseAdditionalVitalResources(request({ value: 'health', target: 3, spendAP: false }), res)
      expect(stat.health).toMatchObject({ additionalPurchase: 3, max: 36, current: 36 })
      expect(stat.experience.spent).toBe(1204)
   })

   it('corrects resource purchases downward without refunding AP', async () => {
      const { stat, res } = setup()
      stat.health.additionalPurchase = 3
      stat.health.max = stat.health.current = 36
      await purchaseAdditionalVitalResources(request({ value: 'health', target: 0, spendAP: false }), res)
      expect(stat.health).toMatchObject({ additionalPurchase: 0, max: 33, current: 33 })
      expect(stat.experience.spent).toBe(1200)
   })

   it('never rebases AP on the attained level when correcting resources', async () => {
      const { stat, res } = setup()
      await updateStats(request({ health: { bonusMalus: 1 }, spendAP: false }), res)
      expect(stat.health.max).toBe(34)
      expect(stat.experience).toMatchObject({ base: 1100, total: 1250, gathered: 150, spent: 1200 })
      expect(stat.level).toBe('Kompetent')
   })

   it('charges additional purchases in the scoped resource editor but not other modifiers', async () => {
      const { stat, res } = setup()
      await updateStats(request({ health: { additionalPurchase: 2, bonusMalus: 1 }, spendAP: true }), res)
      expect(stat.health.max).toBe(36)
      expect(stat.experience.spent).toBe(1208)
      expect(stat.experience.total).toBe(1250)
   })

   it('corrects explicit AP bookkeeping without touching other sections', async () => {
      const { stat, res } = setup()
      await updateStats(request({ experience: { gathered: 200, spent: 1190 } }), res)
      expect(stat.experience).toMatchObject({ base: 1100, gathered: 200, total: 1300, spent: 1190 })
      expect(stat.courage).toBe(14)
      expect(stat.talents[0].notes).toBe('Keep this note')
   })

   it('does not refund tracked combat abilities when AP is disabled', async () => {
      const { stat, res } = setup()
      stat.combatSpecialAbilities = ['Aufmerksamkeit']
      stat.combatAbilityPurchases = [{ key: 'Aufmerksamkeit', ap: 10 }]
      await removeCombatAbility(request({ abilityKey: 'Aufmerksamkeit', spendAP: false }), res)
      expect(stat.combatSpecialAbilities).toEqual([])
      expect(stat.combatAbilityPurchases).toEqual([])
      expect(stat.experience.spent).toBe(1200)
   })

   it('changes starting AP only when the local experience editor explicitly selects a starting level', async () => {
      const { stat, res } = setup()
      await updateStats(request({ level: 'Meisterlich', experience: { gathered: 150, spent: 1200 } }), res)
      expect(stat.experience).toMatchObject({ base: 1400, total: 1550, gathered: 150, spent: 1200 })
      expect(stat.level).toBe('Meisterlich')
   })

   it('does not refund a tracked entry or reverse creation credit during no-AP corrections', async () => {
      const { stat, res } = setup()
      stat.generalSpecialAbilities = ['Analytiker']
      stat.entryPurchases.push({ category: 'generalSpecialAbilities', key: 'Analytiker', catalogKey: 'Analytiker', ap: 5, level: 1, detail: '', application: '' })
      await removeCharacterEntry(request({ category: 'generalSpecialAbilities', key: 'Analytiker', mode: 'record' }), res)
      expect(stat.experience.spent).toBe(1200)
      const key = 'Schlechte Eigenschaft (Goldgier)'
      await addCharacterEntry(request({ category: 'disadvantages', mode: 'creation', selection: { category: 'disadvantages', catalogKey: key } }), res)
      const credited = { ...stat.toObject().experience }
      await removeCharacterEntry(request({ category: 'disadvantages', key, mode: 'record' }), res)
      expect(stat.toObject().experience).toEqual(credited)
      expect(stat.disadvantages).toEqual([])
   })
})
