import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Char } from '../models/char.model'
import { Companion } from '../models/companion.model'
import { Summon } from '../models/summon.model'
import { Artifact } from '../models/artifact.model'
import { ActiveEffect } from '../models/activeEffect.model'
import { ExtendedCheck } from '../models/extendedCheck.model'
import { CreationDraft } from '../models/creationDraft.model'
import { Stats } from '../models/stats.model'
import { User } from '../models/user.model'
import { Party } from '../models/party.model'
import { Encounter } from '../models/encounter.model'
import { deleteCharacter } from '../controllers/charController'
import { deleteCurrentUser } from '../controllers/userController'

const userId = '507f1f77bcf86cd799439011'
const request = (params: Record<string, string> = {}) =>
   ({ params, user: { _id: userId, username: 'Delete test', email: 'test@example.invalid' } }) as unknown as Request
const response = () => { const res = { status: vi.fn(), json: vi.fn() }; res.status.mockReturnValue(res); return res as unknown as Response }
const deleted = { acknowledged: true, deletedCount: 1 } as never
// Party.find(...).select(...) resolves to the given parties
const partyQuery = (parties: unknown[] = []) => ({ select: vi.fn().mockResolvedValue(parties) }) as never

describe('Deleting removes all hero data', () => {
   beforeEach(() => { vi.restoreAllMocks() })

   it('an account deletion removes heroes, stats, Sammelproben, companions, summons, artifacts, active effects and creation drafts', async () => {
      const deleteOne = vi.fn()
      vi.spyOn(User, 'findById').mockResolvedValue({ _id: userId, deleteOne } as never)
      const chars = vi.spyOn(Char, 'deleteMany').mockResolvedValue(deleted)
      const stats = vi.spyOn(Stats, 'deleteMany').mockResolvedValue(deleted)
      const checks = vi.spyOn(ExtendedCheck, 'deleteMany').mockResolvedValue(deleted)
      const companions = vi.spyOn(Companion, 'deleteMany').mockResolvedValue(deleted)
      const summons = vi.spyOn(Summon, 'deleteMany').mockResolvedValue(deleted)
      const artifacts = vi.spyOn(Artifact, 'deleteMany').mockResolvedValue(deleted)
      const effects = vi.spyOn(ActiveEffect, 'deleteMany').mockResolvedValue(deleted)
      const drafts = vi.spyOn(CreationDraft, 'deleteMany').mockResolvedValue(deleted)
      vi.spyOn(Party, 'find').mockReturnValue(partyQuery())
      const ledParties = vi.spyOn(Party, 'deleteMany').mockResolvedValue(deleted)
      const memberships = vi.spyOn(Party, 'updateMany').mockResolvedValue({} as never)
      const fights = vi.spyOn(Encounter, 'deleteMany').mockResolvedValue(deleted)
      const fightSeats = vi.spyOn(Encounter, 'updateMany').mockResolvedValue({} as never)
      await deleteCurrentUser(request(), response())
      for (const spy of [chars, stats, checks, companions, summons, artifacts, effects, drafts]) expect(spy).toHaveBeenCalledWith({ userId })
      // Parties the user led are deleted; their heroes leave other parties
      expect(ledParties).toHaveBeenCalledWith({ gmUserId: userId })
      expect(memberships).toHaveBeenCalledWith({ 'members.userId': userId }, { $pull: { members: { userId } } })
      // Fights of the led parties are deleted; the user's heroes leave other fights
      expect(fights).toHaveBeenCalled()
      expect(fightSeats).toHaveBeenCalledWith({ 'combatants.userId': userId }, { $pull: { combatants: { userId } } })
      expect(deleteOne).toHaveBeenCalled()
   })

   it('a hero deletion removes its stats, Sammelproben, companions, summons, artifacts and active effects', async () => {
      const charId = '507f1f77bcf86cd799439012'
      const statsId = '507f1f77bcf86cd799439010'
      const charDelete = vi.fn()
      vi.spyOn(Char, 'findOne').mockResolvedValue({ _id: charId, deleteOne: charDelete } as never)
      vi.spyOn(Stats, 'findOne').mockResolvedValue({ _id: statsId } as never)
      const stats = vi.spyOn(Stats, 'deleteOne').mockResolvedValue(deleted)
      const checks = vi.spyOn(ExtendedCheck, 'deleteMany').mockResolvedValue(deleted)
      const companions = vi.spyOn(Companion, 'deleteMany').mockResolvedValue(deleted)
      const summons = vi.spyOn(Summon, 'deleteMany').mockResolvedValue(deleted)
      const artifacts = vi.spyOn(Artifact, 'deleteMany').mockResolvedValue(deleted)
      const effects = vi.spyOn(ActiveEffect, 'deleteMany').mockResolvedValue(deleted)
      vi.spyOn(Party, 'find').mockReturnValue(partyQuery([{ _id: 'p1', gmUserId: 'gm' }]))
      const leave = vi.spyOn(Party, 'updateMany').mockResolvedValue({} as never)
      const leaveFight = vi.spyOn(Encounter, 'updateMany').mockResolvedValue({} as never)
      await deleteCharacter(request({ id: charId }), response())
      // The hero leaves its party
      expect(leave).toHaveBeenCalledWith({ 'members.charId': charId }, { $pull: { members: { charId } } })
      expect(leaveFight).toHaveBeenCalledWith({ 'combatants.charId': charId }, { $pull: { combatants: { charId } } })
      expect(charDelete).toHaveBeenCalled()
      expect(stats).toHaveBeenCalledWith({ userId, charId })
      expect(checks).toHaveBeenCalledWith({ userId, statsId })
      expect(companions).toHaveBeenCalledWith({ userId, statsId })
      expect(summons).toHaveBeenCalledWith({ userId, statsId })
      expect(artifacts).toHaveBeenCalledWith({ userId, statsId })
      expect(effects).toHaveBeenCalledWith({ userId, statsId })
   })
})
