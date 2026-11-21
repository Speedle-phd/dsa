import { describe, expect, it } from 'vitest'
import { Stats } from '../models/stats.model'
import { toPublicStats } from '../views/statsView'
import { updateStatsSchema } from '../validations/statsValidation'

describe('Combat model and API contract (S. 50, 234, 340)', () => {
   it('hydrates older heroes with default combat fields', () => {
      const doc = Stats.hydrate({
         _id: '507f1f77bcf86cd799439010',
         userId: '507f1f77bcf86cd799439011',
         charId: '507f1f77bcf86cd799439012',
         createdAt: new Date(), updatedAt: new Date(),
      })
      const response = toPublicStats(doc)
      expect(response.combatTechniques).toHaveLength(14)
      expect(response.combatTechniques.every((entry) => entry.value === 6)).toBe(true)
      expect(response.combatValues).toHaveLength(14)
      expect(response.combatSpecialAbilities).toEqual([])
      expect(response.combatAbilityPurchases).toEqual([])
      expect(response.combatConditions).toEqual({})
      expect(response.wornArmor).toBeNull()
      expect(response.checkModifiers.burden).toBe(0)
      expect(response.checkModifiers.profiles).toHaveLength(21)
      expect(response.combatModifiers).toEqual({ initiative: 0, speed: 0, speedBase: null })
   })
   it('retains negative health, technique values and combat records in stored/response shapes', () => {
      const doc = new Stats({
         userId: '507f1f77bcf86cd799439011', charId: '507f1f77bcf86cd799439012',
         health: { current: -4, max: 28 },
         combatTechniques: [{ key: 'Dolche', value: 9 }],
         combatSpecialAbilities: ['Finte I'], combatConditions: { Furcht: 2 },
         combatModifiers: { initiative: 1, speed: -1, speedBase: 6 },
         createdAt: new Date(), updatedAt: new Date(),
      })
      expect(doc.validateSync()).toBeUndefined()
      expect(doc.toObject().health.current).toBe(-4)
      const response = toPublicStats(doc)
      expect(response.health.current).toBe(-4)
      expect(response.combatTechniques[0].value).toBe(9)
      expect(response.combatSpecialAbilities).toEqual(['Finte I'])
      expect(response.combatConditions).toEqual({ Furcht: 2 })
      expect(response.combatModifiers.speedBase).toBe(6)
   })
   it('lets initial-stat edits preserve negative LeP without allowing negative mana', () => {
      expect(updateStatsSchema.safeParse({ health: { current: -4 } }).success).toBe(true)
      expect(updateStatsSchema.safeParse({ mana: { current: -4 } }).success).toBe(false)
   })
})
