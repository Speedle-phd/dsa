import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ActiveEffect } from '../models/activeEffect.model'
import { Stats } from '../models/stats.model'
import * as persistence from './statsPersistence'
import { updateStats } from '../controllers/statsController'
import {
   addCombatAbility, adjustHealthController, getCombatReference, levelUpCombatTechnique, removeCombatAbility, updateCombatSettings,
} from '../controllers/combatController'
import { mockStatsLookup } from './testing/mockStatsLookup'

function heroStats() {
   return new Stats({
      _id: '507f1f77bcf86cd799439010', userId: '507f1f77bcf86cd799439011', charId: '507f1f77bcf86cd799439012',
      courage: 14, dexterity: 14, strength: 16, intuition: 15, fingerDexterity: 14, constitution: 13,
      health: { current: 28, max: 28 }, experience: { total: 1100, spent: 1097 },
      createdAt: new Date(), updatedAt: new Date(),
   })
}

function request(body: Record<string, unknown>) {
   return {
      params: { id: '507f1f77bcf86cd799439010' },
      user: { _id: '507f1f77bcf86cd799439011', username: 'Combat test', email: 'test@example.invalid' },
      body,
   } as Request
}

describe('Combat controllers save rule changes (S. 39, 50, 54–55, 234, 340)', () => {
   beforeEach(() => { vi.restoreAllMocks() })

   it('saves health and pain while preserving AP, maximum health and equipment', async () => {
      const stat = heroStats()
      mockStatsLookup(stat)
      const save = vi.spyOn(persistence, 'saveStats').mockImplementation(async (doc) => { await doc.validate() })
      const json = vi.fn()
      await adjustHealthController(request({ direction: 'damage', amount: 30 }), { json } as Response)
      expect(save).toHaveBeenCalledWith(stat)
      expect(stat.health.current).toBe(-2)
      expect(stat.health.max).toBe(28)
      expect(stat.pain).toBe(4)
      expect(stat.experience.spent).toBe(1097)
      expect(json.mock.calls[0][0].stats.health.current).toBe(-2)
   })

   it('saves a technique increment and its AP cost together', async () => {
      const stat = heroStats()
      mockStatsLookup(stat)
      const save = vi.spyOn(persistence, 'saveStats').mockImplementation(async (doc) => { await doc.validate() })
      await levelUpCombatTechnique(request({ techniqueKey: 'Dolche' }), { json: vi.fn() } as Response)
      expect(stat.combatTechniques.find((entry) => entry.key === 'Dolche')?.value).toBe(7)
      expect(stat.experience.spent).toBe(1099)
      expect(stat.combatAbilityPurchases).toEqual([])
      expect(save).toHaveBeenCalledOnce()
   })

   it('does not change or save the hero when an advancement is unaffordable', async () => {
      const stat = heroStats()
      stat.experience.spent = 1100
      mockStatsLookup(stat)
      const save = vi.spyOn(persistence, 'saveStats').mockResolvedValue()
      await expect(levelUpCombatTechnique(request({ techniqueKey: 'Dolche' }), { json: vi.fn() } as Response)).rejects.toThrow('Not enough AP')
      expect(stat.experience.spent).toBe(1100)
      expect(stat.combatTechniques.find((entry) => entry.key === 'Dolche')?.value).toBe(6)
      expect(save).not.toHaveBeenCalled()
   })

   it('records an existing custom ability without charging AP', async () => {
      const stat = heroStats()
      mockStatsLookup(stat)
      vi.spyOn(persistence, 'saveStats').mockImplementation(async (doc) => { await doc.validate() })
      await addCombatAbility(request({ abilityKey: 'Custom known ability', mode: 'record' }), { json: vi.fn() } as Response)
      expect(stat.combatSpecialAbilities).toContain('Custom known ability')
      expect(stat.experience.spent).toBe(1097)
   })

   it('rejects unmet purchase prerequisites and leaves AP untouched', async () => {
      const stat = heroStats()
      mockStatsLookup(stat)
      const save = vi.spyOn(persistence, 'saveStats').mockResolvedValue()
      await expect(addCombatAbility(request({ abilityKey: 'Finte II', mode: 'purchase' }), { json: vi.fn() } as Response)).rejects.toThrow('prerequisites')
      expect(stat.combatSpecialAbilities).toEqual([])
      expect(stat.experience.spent).toBe(1097)
      expect(save).not.toHaveBeenCalled()
   })

   it('saves manual conditions and rejects duplicate/missing initial technique entries', async () => {
      const stat = heroStats()
      mockStatsLookup(stat)
      const save = vi.spyOn(persistence, 'saveStats').mockImplementation(async (doc) => { await doc.validate() })
      await updateCombatSettings(request({ conditions: { Furcht: 2 } }), { json: vi.fn() } as Response)
      expect(stat.combatConditions).toEqual({ Furcht: 2 })
      await expect(updateCombatSettings(request({ techniques: [{ key: 'Dolche', value: 10 }] }), { json: vi.fn() } as Response)).rejects.toThrow('exactly once')
      expect(save).toHaveBeenCalledOnce()
   })

   it('requires an authenticated user before loading or saving stats', async () => {
      const load = vi.spyOn(persistence, 'findStatsForActor')
      const req = request({ direction: 'damage', amount: 1 })
      req.user = undefined
      await expect(adjustHealthController(req, { json: vi.fn() } as Response)).rejects.toThrow('User not authenticated')
      expect(load).not.toHaveBeenCalled()
   })
   it('persists worn armor and non-armor burden with derived modifiers (S. 32)', async () => {
      const stat = heroStats()
      stat.equipment.push({ item: 'Kettenrüstung', amount: 1, weight: 12, carriedOn: 'Body', category: 'Armor', description: '' },
         { item: 'Unterkleidung für Metallrüstungen', amount: 1, weight: 2.5, carriedOn: 'Equipped', category: 'Weapon_Accessories', description: '' })
      mockStatsLookup(stat)
      vi.spyOn(persistence, 'saveStats').mockImplementation(async (doc) => { await doc.validate() })
      const json = vi.fn()
      await updateCombatSettings(request({ wornArmor: 'Kettenrüstung', conditions: { Belastung: 1 } }), { json } as Response)
      expect(stat.wornArmor).toBe('Kettenrüstung')
      expect(json.mock.calls[0][0].stats.checkModifiers.burden).toBe(3)
      await updateCombatSettings(request({ wornArmor: null }), { json } as Response)
      expect(stat.wornArmor).toBeNull()
      expect(json.mock.calls.at(-1)?.[0].stats.checkModifiers.burden).toBe(1)
   })
   it('rejects unknown/unowned armor without saving (S. 32)', async () => {
      const stat = heroStats()
      mockStatsLookup(stat)
      const save = vi.spyOn(persistence, 'saveStats').mockResolvedValue()
      for (const wornArmor of ['Kettenrüstung', 'Invented armor']) {
         await expect(updateCombatSettings(request({ wornArmor }), { json: vi.fn() } as Response)).rejects.toThrow('known armor')
      }
      expect(stat.wornArmor).toBeNull()
      expect(save).not.toHaveBeenCalled()
   })
   it('equips armor via inventory and stows the previous armor atomically (S. 32, 374)', async () => {
      const stat = heroStats()
      stat.health.value = 2
      stat.equipment.push(
         { item: 'Kettenrüstung', amount: 1, weight: 12, carriedOn: 'Equipped', category: 'Armor', description: '' },
         { item: 'Plattenrüstung', amount: 1, weight: 25, carriedOn: 'Backpack', category: 'Armor', description: '' },
         { item: 'Unterkleidung für Metallrüstungen', amount: 1, weight: 2.5, carriedOn: 'Equipped', category: 'Weapon_Accessories', description: '' },
      )
      mockStatsLookup(stat)
      vi.spyOn(persistence, 'saveStats').mockImplementation(async (doc) => { await doc.validate() })
      const equipment = stat.toObject().equipment.map((entry) => entry.item === 'Plattenrüstung' ? { ...entry, carriedOn: 'Equipped' } : entry)
      const json = vi.fn()
      const res = { json, status: vi.fn() }
      res.status.mockReturnValue(res)
      await updateStats(request({ equipment }), res as Response)
      expect(stat.equipment.map((entry) => entry.carriedOn)).toEqual(['Other', 'Equipped', 'Equipped'])
      expect(stat.wornArmor).toBe('Plattenrüstung')
      expect(json.mock.calls[0][0].stats.checkModifiers.armorBurden).toBe(3)
      expect(json.mock.calls[0][0].stats.equipment[0].item).toBe('Kettenrüstung')
      await updateStats(request({ equipment: stat.toObject().equipment.map((entry) => ({ ...entry, carriedOn: 'Backpack' })) }), res as Response)
      expect(stat.wornArmor).toBeNull()
      expect(json.mock.calls.at(-1)?.[0].stats.checkModifiers.armorBurden).toBe(0)
   })
   it('clears worn armor when its last inventory item is removed (S. 32)', async () => {
      const stat = heroStats()
      stat.health.value = 2
      stat.wornArmor = 'Kettenrüstung'
      stat.equipment.push({ item: 'Kettenrüstung', amount: 1, weight: 12, carriedOn: 'Body', category: 'Armor', description: '' })
      mockStatsLookup(stat)
      vi.spyOn(persistence, 'saveStats').mockImplementation(async (doc) => { await doc.validate() })
      const json = vi.fn()
      const res = { json, status: vi.fn() }
      res.status.mockReturnValue(res)
      await updateStats(request({ equipment: [] }), res as Response)
      expect(stat.wornArmor).toBeNull()
      expect(json.mock.calls[0][0].stats.checkModifiers.armorBurden).toBe(0)
   })

   it('records the exact paid AP and refunds a purchase only once', async () => {
      const stat = heroStats()
      stat.experience.spent = 1000
      mockStatsLookup(stat)
      const save = vi.spyOn(persistence, 'saveStats').mockImplementation(async (doc) => { await doc.validate() })
      const json = vi.fn()
      await addCombatAbility(request({ abilityKey: 'Haltegriff', mode: 'purchase' }), { json } as Response)
      expect(stat.experience.spent).toBe(1005)
      expect(stat.combatAbilityPurchases.map(({ key, ap }) => ({ key, ap }))).toEqual([{ key: 'Haltegriff', ap: 5 }])
      expect(json.mock.calls[0][0].stats.combatAbilityPurchases[0].ap).toBe(5)
      await removeCombatAbility(request({ abilityKey: 'Haltegriff' }), { json } as Response)
      expect(stat.experience.spent).toBe(1000)
      expect(stat.combatAbilityPurchases).toEqual([])
      expect(stat.combatSpecialAbilities).toEqual([])
      await expect(removeCombatAbility(request({ abilityKey: 'Haltegriff' }), { json } as Response)).rejects.toThrow('not recorded')
      expect(save).toHaveBeenCalledTimes(2)
   })

   it.each(['Custom known ability', 'Haltegriff'])('removes manual or legacy %s without guessing a refund', async (abilityKey) => {
      const stat = heroStats()
      stat.combatSpecialAbilities = [abilityKey]
      mockStatsLookup(stat)
      vi.spyOn(persistence, 'saveStats').mockImplementation(async (doc) => { await doc.validate() })
      await removeCombatAbility(request({ abilityKey }), { json: vi.fn() } as Response)
      expect(stat.combatSpecialAbilities).toEqual([])
      expect(stat.experience.spent).toBe(1097)
   })

   it('requires dependent abilities to be removed first, without changing AP', async () => {
      const stat = heroStats()
      stat.combatSpecialAbilities = ['Finte I', 'Finte II', 'Finte III']
      stat.combatAbilityPurchases = [{ key: 'Finte I', ap: 15 }]
      mockStatsLookup(stat)
      const save = vi.spyOn(persistence, 'saveStats').mockResolvedValue()
      await expect(removeCombatAbility(request({ abilityKey: 'Finte I' }), { json: vi.fn() } as Response)).rejects.toThrow('Finte II')
      expect(stat.experience.spent).toBe(1097)
      expect(stat.combatSpecialAbilities).toHaveLength(3)
      expect(save).not.toHaveBeenCalled()
   })

   it('refuses refunds that exceed the current spent AP', async () => {
      const stat = heroStats()
      stat.combatSpecialAbilities = ['Haltegriff']
      stat.combatAbilityPurchases = [{ key: 'Haltegriff', ap: 5 }]
      stat.experience.spent = 0
      mockStatsLookup(stat)
      const save = vi.spyOn(persistence, 'saveStats').mockResolvedValue()
      await expect(removeCombatAbility(request({ abilityKey: 'Haltegriff' }), { json: vi.fn() } as Response)).rejects.toThrow('inconsistent')
      expect(stat.combatSpecialAbilities).toEqual(['Haltegriff'])
      expect(save).not.toHaveBeenCalled()
   })

   it('supplies a bilingual, page-cited effect for every purchasable ability', () => {
      const json = vi.fn()
      getCombatReference(request({}), { json } as Response)
      const abilities: Array<{ effect: { de: string; en: string; page: number } }> = json.mock.calls[0][0].abilities
      for (const entry of abilities) {
         expect(entry.effect.de.length).toBeGreaterThan(10)
         expect(entry.effect.en.length).toBeGreaterThan(10)
         expect(entry.effect.page).toBeGreaterThanOrEqual(246)
         expect(entry.effect.page).toBeLessThanOrEqual(250)
      }
   })
})

describe('Status settings (S. 34–36)', () => {
   beforeEach(() => { vi.restoreAllMocks() })

   it('stores statuses, adds Handlungsunfähig to Bewusstlos and Betäubung II after Blutrausch', async () => {
      vi.spyOn(ActiveEffect, 'findOneAndDelete').mockResolvedValue(null)
      const stat = heroStats()
      mockStatsLookup(stat)
      vi.spyOn(persistence, 'saveStats').mockImplementation(async (doc) => { await doc.validate() })
      await updateCombatSettings(request({ statuses: ['Blutrausch', 'Bewusstlos'] }), { json: vi.fn() } as Response)
      expect(stat.statuses).toEqual(['Bewusstlos', 'Blutrausch', 'Handlungsunfähig'])
      const json = vi.fn()
      await updateCombatSettings(request({ statuses: [] }), { json } as Response)
      expect(stat.statuses).toEqual([])
      expect(stat.combatConditions.Betäubung).toBe(2)
      expect(json.mock.calls[0][0].stats.statuses).toEqual([])
   })

   it('rejects unknown statuses', async () => {
      const stat = heroStats()
      mockStatsLookup(stat)
      await expect(updateCombatSettings(request({ statuses: ['Versteinert'] }), { json: vi.fn() } as Response)).rejects.toThrow()
   })
})
