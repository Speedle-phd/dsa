import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Companion, type ICompanionDocument } from '../models/companion.model'
import { Stats } from '../models/stats.model'
import * as persistence from './statsPersistence'
import { addCompanion, addCompanionTrick, removeCompanion, removeCompanionTrick, setCompanionResources, updateCompanion } from '../controllers/companionController'
import type { CompanionsResponse } from '../types/apiContracts'
import { mockStatsLookup } from './testing/mockStatsLookup'

const statsId = '507f1f77bcf86cd799439010'
const userId = '507f1f77bcf86cd799439011'

function request(body: Record<string, unknown>) {
   return { params: { id: statsId }, user: { _id: userId }, body } as unknown as Request
}
// In-memory companion collection: documents are validated on save like in MongoDB.
function companionStore() {
   const docs: ICompanionDocument[] = []
   const owned = (filter: Record<string, unknown>) => docs.filter((doc) =>
      String(doc.statsId) === String(filter.statsId) && String(doc.userId) === String(filter.userId) &&
      (filter._id === undefined || String(doc._id) === String(filter._id)) && (filter.familiar === undefined || doc.familiar === filter.familiar))
   vi.spyOn(Companion, 'find').mockImplementation(((filter: Record<string, unknown>) => ({ sort: async () => owned(filter) })) as never)
   vi.spyOn(Companion, 'findOne').mockImplementation((async (filter: Record<string, unknown>) => owned(filter)[0] ?? null) as never)
   vi.spyOn(Companion, 'exists').mockImplementation((async (filter: Record<string, unknown>) => owned(filter).length ? { _id: owned(filter)[0]._id } : null) as never)
   vi.spyOn(Companion, 'create').mockImplementation((async (input: object) => {
      const doc = new Companion(input)
      await doc.validate()
      docs.push(doc)
      return doc
   }) as never)
   vi.spyOn(Companion.prototype, 'save').mockImplementation(async function (this: ICompanionDocument) { await this.validate(); return this })
   vi.spyOn(Companion.prototype, 'deleteOne').mockImplementation(function (this: ICompanionDocument) {
      docs.splice(docs.indexOf(this), 1)
      return Promise.resolve({ acknowledged: true, deletedCount: 1 })
   } as never)
   return docs
}
function setup(abilities: string[] = ['Tradition (Hexe)', 'Vertrautenbindung']) {
   const stat = new Stats({
      _id: statsId, userId, charId: '507f1f77bcf86cd799439012',
      generalSpecialAbilities: abilities, experience: { base: 1100, total: 1100, gathered: 0, spent: 1000 },
      createdAt: new Date(), updatedAt: new Date(),
   })
   mockStatsLookup(stat)
   const saveStats = vi.spyOn(persistence, 'saveStats')
   const docs = companionStore()
   const res = { json: vi.fn() } as unknown as Response
   const last = () => (res.json as ReturnType<typeof vi.fn>).mock.lastCall![0] as CompanionsResponse
   return { stat, docs, res, last, saveStats }
}

describe('Companions and familiars (S. 278–280, 360–362)', () => {
   beforeEach(() => vi.restoreAllMocks())

   it('adds a book animal with its stat block and full LeP, outside the stats document', async () => {
      const { docs, res, last, saveStats } = setup([])
      await addCompanion(request({ species: 'Pferd', name: 'Blitz' }), res)
      const horse = last().companions[0]
      expect(horse).toMatchObject({ name: 'Blitz', species: 'Pferd', familiar: false, health: { max: 65, current: 65 } })
      expect(horse.attacks.map((attack) => attack.name)).toEqual(['Tritt', 'Biss', 'Niederreiten'])
      expect(horse.effective.pain).toBe(0)
      expect(horse.tricks).toEqual([])
      expect(horse.loyalty).toBeNull()
      expect(horse).not.toHaveProperty('statsId')
      expect(String(docs[0].statsId)).toBe(statsId)
      expect(saveStats).not.toHaveBeenCalled()
   })

   it('requires Vertrautenbindung, a familiar species and only one familiar', async () => {
      const without = setup(['Tradition (Hexe)'])
      await expect(addCompanion(request({ species: 'Katze', name: 'Mira', familiar: true }), without.res)).rejects.toThrow('Vertrautenbindung')
      vi.restoreAllMocks()
      const { res, last } = setup()
      await expect(addCompanion(request({ species: 'Hund', name: 'Rex', familiar: true }), res)).rejects.toThrow('familiar species')
      await addCompanion(request({ species: 'Katze', name: 'Mira', familiar: true }), res)
      const cat = last().companions[0]
      expect(cat.effective).toMatchObject({ maxHealth: 20, maxMana: 15, armor: 1 })
      expect(cat.tricks).toEqual([{ key: 'Hexensinn', paidAP: 0, free: true }, { key: 'Zwiegespräch', paidAP: 0, free: true }])
      await expect(addCompanion(request({ species: 'Rabe', name: 'Kra', familiar: true }), res)).rejects.toThrow('more than one familiar')
   })

   it('buys tricks from the familiar’s own AP and refunds them on undo', async () => {
      const { stat, docs, res, last } = setup()
      await addCompanion(request({ species: 'Kröte', name: 'Quax', familiar: true }), res)
      const id = last().companions[0].id
      await expect(addCompanionTrick(request({ companionId: id, key: 'Tarnung' }), res)).rejects.toThrow('Not enough companion AP')
      docs[0].experience.total = 30
      await addCompanionTrick(request({ companionId: id, key: 'Krötenschlag' }), res)
      expect(docs[0].experience.spent).toBe(25)
      await expect(addCompanionTrick(request({ companionId: id, key: 'Zwiegespräch' }), res)).rejects.toThrow('already known')
      await removeCompanionTrick(request({ companionId: id, key: 'Krötenschlag' }), res)
      expect(docs[0].experience.spent).toBe(0)
      expect(stat.experience.spent).toBe(1000)
   })

   it('keeps LeP within the maximum and recomputes Schmerz', async () => {
      const { res, last } = setup([])
      await addCompanion(request({ species: 'Hund', name: 'Rex' }), res)
      const id = last().companions[0].id
      await setCompanionResources(request({ companionId: id, health: 7 }), res)
      expect(last().companions[0].effective.pain).toBe(2)
      await expect(setCompanionResources(request({ companionId: id, health: 14 }), res)).rejects.toThrow('maximum')
   })

   it('saves manual values, clamps current LeP and removes the companion', async () => {
      const { docs, res, last } = setup([])
      await addCompanion(request({ species: 'Hund', name: 'Rex' }), res)
      const dog = last().companions[0]
      await updateCompanion(request({
         companionId: dog.id, name: 'Rex II', attributes: { ...dog.attributes, courage: 13 }, healthMax: 10, manaBase: 0,
         initiative: 13, defense: 8, soulPower: 1, toughness: 0, speed: '12', armor: 0, actions: 1, attacks: dog.attacks,
         talents: [{ key: 'sinnesschaerfe', value: 9, note: '' }], traits: '', abilities: 'Verbeißen', special: '', notes: 'Guter Hund', experienceTotal: 0, loyalty: 12,
      }), res)
      expect(last().companions[0]).toMatchObject({ name: 'Rex II', health: { max: 10, current: 10 }, defense: 8, loyalty: 12,
         talents: [{ key: 'sinnesschaerfe', value: 9, targets: [11, 14, 14] }] })
      await removeCompanion(request({ companionId: dog.id }), res)
      expect(docs).toHaveLength(0)
      expect(last().companions).toEqual([])
   })

   it('rejects a companion of another hero', async () => {
      const { docs, res } = setup([])
      await addCompanion(request({ species: 'Hund', name: 'Rex' }), res)
      docs[0].statsId = new Stats()._id as never
      await expect(removeCompanion(request({ companionId: String(docs[0]._id) }), res)).rejects.toThrow('not recorded')
   })
})
