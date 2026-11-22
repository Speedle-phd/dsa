import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Stats } from '../models/stats.model'
import { ActiveEffect } from '../models/activeEffect.model'
import * as persistence from './statsPersistence'
import { adjustMana, changeSpell, changeTrick, removeSpell, removeTrick, updateMagicSettings, updateSpellNotes } from '../controllers/magicController'
import { toPublicStats } from '../views/statsView'
import { spellChangeSchema, magicSettingsSchema, manaAdjustmentSchema } from '../validations/magicValidation'
import { mockStatsLookup } from './testing/mockStatsLookup'

function request(body: Record<string, unknown>) {
   return { params: { id: '507f1f77bcf86cd799439010' }, user: { _id: '507f1f77bcf86cd799439011' }, body } as Request
}
function setup() {
   const stat = new Stats({
      _id: '507f1f77bcf86cd799439010', userId: '507f1f77bcf86cd799439011', charId: '507f1f77bcf86cd799439012',
      wisdom: 15, courage: 14, intuition: 14, charisma: 14, fingerDexterity: 14, constitution: 14,
      isSorcerer: true, advantages: ['Zauberer'], generalSpecialAbilities: ['Tradition (Gildenmagier)'],
      experience: { base: 1100, total: 1100, gathered: 0, spent: 1000 },
      mana: { current: 12, max: 35 },
      createdAt: new Date(), updatedAt: new Date(),
   })
   const find = mockStatsLookup(stat)
   const save = vi.spyOn(persistence, 'saveStats').mockImplementation(async (doc) => { await doc.validate() })
   const res = { json: vi.fn() } as Response
   return { stat, find, save, res }
}

describe('Magic transactions and AP persistence (S. 25, 39, 50, 274–275, 285–286)', () => {
   beforeEach(() => vi.restoreAllMocks())

   it('activates at FW 0, charges once and sums all target steps on advancement', async () => {
      const { stat, res, find, save } = setup()
      await changeSpell(request({ key: 'Ignifaxius' }), res)
      expect(stat.spells[0]).toMatchObject({ key: 'Ignifaxius', value: 0, paidAP: 3 })
      expect(stat.experience.spent).toBe(1003)
      await changeSpell(request({ key: 'Ignifaxius', value: 3 }), res)
      expect(stat.spells[0]).toMatchObject({ value: 3, paidAP: 12 })
      expect(stat.experience.spent).toBe(1012)
      await changeSpell(request({ key: 'Ignifaxius', value: 3 }), res)
      expect(stat.experience.spent).toBe(1012)
      expect(find).toHaveBeenCalledWith('507f1f77bcf86cd799439010', '507f1f77bcf86cd799439011')
      expect(save).toHaveBeenCalledTimes(3)
      expect(res.json).toHaveBeenLastCalledWith(expect.objectContaining({
         stats: expect.objectContaining({ spells: [{ key: 'Ignifaxius', value: 3, notes: '', paidAP: 12 }] }),
      }))
   })
   it('free recording, increases and downward corrections leave all AP counters unchanged', async () => {
      const { stat, res } = setup()
      stat.experience.spent = 1100
      await changeSpell(request({ key: 'Arcanovi', value: 20, spendAP: false }), res)
      await changeSpell(request({ key: 'Arcanovi', value: 8, spendAP: false }), res)
      expect(stat.spells[0]).toMatchObject({ value: 8, paidAP: 0 })
      expect(stat.experience).toMatchObject({ base: 1100, total: 1100, gathered: 0, spent: 1100 })
   })
   it('allows GM documentation without magic prerequisites only in no-AP mode', async () => {
      const { stat, res } = setup()
      stat.advantages = []
      stat.generalSpecialAbilities = []
      await expect(changeSpell(request({ key: 'Ignifaxius' }), res)).rejects.toThrow('Zauberer')
      await changeSpell(request({ key: 'Ignifaxius', spendAP: false }), res)
      expect(stat.spells).toHaveLength(1)
      expect(stat.experience.spent).toBe(1000)
   })
   it('rejects paid acquisition without a tradition and unaffordable activation before mutation', async () => {
      const { stat, res, save } = setup()
      stat.generalSpecialAbilities = []
      await expect(changeSpell(request({ key: 'Ignifaxius' }), res)).rejects.toThrow('tradition')
      stat.generalSpecialAbilities = ['Tradition (Gildenmagier)']
      stat.experience.spent = 1100
      await expect(changeSpell(request({ key: 'Ignifaxius' }), res)).rejects.toThrow('Not enough AP')
      expect(stat.spells).toHaveLength(0)
      expect(save).not.toHaveBeenCalled()
   })
   it('enforces FW 14 until matching knowledge is acquired, then charges the higher step price', async () => {
      const { stat, res } = setup()
      stat.spells = [{ key: 'Bannbaladin', value: 14, paidAP: 0, notes: '' }]
      await expect(changeSpell(request({ key: 'Bannbaladin' }), res)).rejects.toThrow('maximum')
      stat.generalSpecialAbilities.push('Merkmalskenntnis (Einfluss)')
      await changeSpell(request({ key: 'Bannbaladin' }), res)
      expect(stat.spells[0].value).toBe(15)
      expect(stat.experience.spent).toBe(1008)
      await expect(changeSpell(request({ key: 'Bannbaladin', value: 17 }), res)).rejects.toThrow('maximum')
   })
   it('does not permit a paid decrease or values outside app bounds', async () => {
      const { stat, res, save } = setup()
      stat.spells = [{ key: 'Armatrutz', value: 8, paidAP: 0, notes: 'Preserve' }]
      await expect(changeSpell(request({ key: 'Armatrutz', value: 7 }), res)).rejects.toThrow('Disable Spend AP')
      for (const value of [-1, 26, 1.5]) await expect(changeSpell(request({ key: 'Armatrutz', value, spendAP: false }), res)).rejects.toThrow()
      expect(stat.spells[0].value).toBe(8)
      expect(save).not.toHaveBeenCalled()
   })
   it('undo refunds tracked payments only; free edits do not invent refundable AP', async () => {
      const { stat, res } = setup()
      await changeSpell(request({ key: 'Ignifaxius', value: 3 }), res)
      await changeSpell(request({ key: 'Ignifaxius', value: 10, spendAP: false }), res)
      await removeSpell(request({ key: 'Ignifaxius' }), res)
      expect(stat.experience.spent).toBe(1000)
      expect(stat.spells).toHaveLength(0)
   })
   it('removal with AP disabled discards tracking without a refund', async () => {
      const { stat, res } = setup()
      await changeSpell(request({ key: 'Ignifaxius', value: 3 }), res)
      await removeSpell(request({ key: 'Ignifaxius', spendAP: false }), res)
      expect(stat.experience.spent).toBe(1012)
      expect(stat.spells).toHaveLength(0)
   })
   it('protects knowledge dependencies on removal and downward correction before saving', async () => {
      const { stat, res, save } = setup()
      stat.generalSpecialAbilities.push('Merkmalskenntnis (Heilung)')
      stat.spells = ['Armatrutz', 'Balsam Salabunde', 'Psychostabilis'].map((key) => ({ key, value: 10, notes: '', paidAP: 0 }))
      await expect(removeSpell(request({ key: 'Armatrutz', spendAP: false }), res)).rejects.toThrow('dependent')
      await expect(changeSpell(request({ key: 'Armatrutz', value: 9, spendAP: false }), res)).rejects.toThrow('dependent')
      expect(stat.spells).toHaveLength(3)
      expect(save).not.toHaveBeenCalled()
   })
   it('tricks cost exactly 1 AP, do not have a FW and reject duplicates', async () => {
      const { stat, res } = setup()
      stat.generalSpecialAbilities = []
      await changeTrick(request({ key: 'Abkühlung' }), res)
      expect(stat.magicTricks[0]).toMatchObject({ key: 'Abkühlung', paidAP: 1 })
      expect(stat.experience.spent).toBe(1001)
      await expect(changeTrick(request({ key: 'Abkühlung' }), res)).rejects.toThrow('already')
      await removeTrick(request({ key: 'Abkühlung' }), res)
      expect(stat.experience.spent).toBe(1000)
   })
   it('recorded tricks and free removal do not change AP; paid tricks still require Zauberer', async () => {
      const { stat, res } = setup()
      stat.advantages = []
      await expect(changeTrick(request({ key: 'Duft' }), res)).rejects.toThrow('Zauberer')
      await changeTrick(request({ key: 'Duft', spendAP: false }), res)
      await removeTrick(request({ key: 'Duft', spendAP: false }), res)
      expect(stat.experience.spent).toBe(1000)
   })
   it('rejects inconsistent refunds before deleting a spell', async () => {
      const { stat, res, save } = setup()
      stat.spells = [{ key: 'Arcanovi', value: 1, paidAP: 1001, notes: '' }]
      await expect(removeSpell(request({ key: 'Arcanovi' }), res)).rejects.toThrow('inconsistent')
      expect(stat.spells).toHaveLength(1)
      expect(save).not.toHaveBeenCalled()
   })
   it('notes and artifact settings persist without changing AP or AsP', async () => {
      const { stat, res } = setup()
      stat.spells = [{ key: 'Armatrutz', value: 8, paidAP: 0, notes: '' }]
      await updateSpellNotes(request({ key: 'Armatrutz', notes: ' User note ' }), res)
      await updateMagicSettings(request({ artifacts: ' My staff\nNo binding implied ' }), res)
      expect(toPublicStats(stat)).toMatchObject({
         spells: [{ key: 'Armatrutz', value: 8, paidAP: 0, notes: 'User note' }],
         magicSettings: { artifacts: 'My staff\nNo binding implied', guildSpell: null },
      })
      expect(stat.experience.spent).toBe(1000)
      expect(stat.mana.current).toBe(12)
   })
   it('records only an owned foreign spell for the guild creation exception', async () => {
      const { stat, res } = setup()
      stat.spells = [{ key: 'Adlerauge', value: 8, paidAP: 0, notes: '' }]
      for (const guildSpell of ['Arcanovi', 'Ignifaxius', 'Falkenauge']) {
         await expect(updateMagicSettings(request({ guildSpell }), res)).rejects.toThrow('owned foreign')
      }
      await updateMagicSettings(request({ guildSpell: 'Adlerauge' }), res)
      expect(stat.magicSettings.guildSpell).toBe('Adlerauge')
      await removeSpell(request({ key: 'Adlerauge', spendAP: false }), res)
      expect(stat.magicSettings.guildSpell).toBeNull()
   })
   it('manual AsP changes stay within the pool and never spend AP', async () => {
      const { stat, res } = setup()
      await adjustMana(request({ direction: 'spend', amount: 12 }), res)
      expect(stat.mana.current).toBe(0)
      await expect(adjustMana(request({ direction: 'spend', amount: 1 }), res)).rejects.toThrow('maximum')
      await adjustMana(request({ direction: 'recover', amount: 35 }), res)
      expect(stat.mana.current).toBe(35)
      await expect(adjustMana(request({ direction: 'recover', amount: 1 }), res)).rejects.toThrow('maximum')
      expect(stat.experience.spent).toBe(1000)
   })
   it('Schwacher Astralkörper takes 1 AsP more per spend while AsP are left (S. 177)', async () => {
      const { stat, res } = setup()
      stat.disadvantages = ['Schwacher Astralkörper']
      await adjustMana(request({ direction: 'spend', amount: 5 }), res)
      expect(stat.mana.current).toBe(6)
      await adjustMana(request({ direction: 'spend', amount: 6 }), res)
      expect(stat.mana.current).toBe(0)
      expect((res.json as ReturnType<typeof vi.fn>).mock.lastCall![0].spend).toEqual({ total: 6, extra: 0, minorSpirits: false })
   })
   it('Lästige Mindergeister: W20 ≤ AsP spent starts the −1 effect once (S. 173)', async () => {
      const { stat, res } = setup()
      stat.disadvantages = ['Lästige Mindergeister']
      const create = vi.spyOn(ActiveEffect, 'create').mockResolvedValue({} as never)
      const exists = vi.spyOn(ActiveEffect, 'exists').mockResolvedValue(null)
      await expect(adjustMana(request({ direction: 'spend', amount: 4 }), res)).rejects.toThrow('W20')
      await adjustMana(request({ direction: 'spend', amount: 4, spiritRoll: 5 }), res)
      expect(create).not.toHaveBeenCalled()
      await adjustMana(request({ direction: 'spend', amount: 4, spiritRoll: 4 }), res)
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ key: 'mindergeister', values: { checkPenalty: 1 } }))
      exists.mockResolvedValue({ _id: 'running' } as never)
      await adjustMana(request({ direction: 'spend', amount: 4, spiritRoll: 1 }), res)
      expect(create).toHaveBeenCalledTimes(1)
      await adjustMana(request({ direction: 'recover', amount: 3 }), res)
      expect(stat.mana.current).toBe(3)
   })
   it('rejects unknown entries, absent entries, invalid requests and unauthenticated access', async () => {
      const { res, save } = setup()
      await expect(changeSpell(request({ key: 'Custom' }), res)).rejects.toThrow('verified')
      await expect(changeTrick(request({ key: 'Custom' }), res)).rejects.toThrow('verified')
      await expect(removeSpell(request({ key: 'Ignifaxius' }), res)).rejects.toThrow('not recorded')
      await expect(removeTrick(request({ key: 'Duft' }), res)).rejects.toThrow('not recorded')
      const req = request({ key: 'Ignifaxius' })
      delete req.user
      await expect(changeSpell(req, res)).rejects.toThrow('not authenticated')
      expect(save).not.toHaveBeenCalled()
      expect(spellChangeSchema.safeParse({ key: '', value: 26 }).success).toBe(false)
      expect(magicSettingsSchema.safeParse({ artifacts: 'x'.repeat(4001) }).success).toBe(false)
      expect(manaAdjustmentSchema.safeParse({ direction: 'recover', amount: 0 }).success).toBe(false)
   })
   it('exposes compatible defaults for an old saved hero without magic collections', () => {
      const { stat } = setup()
      const raw = stat.toObject()
      delete (raw as Partial<typeof raw>).spells
      delete (raw as Partial<typeof raw>).magicTricks
      delete (raw as Partial<typeof raw>).magicSettings
      expect(toPublicStats(raw)).toMatchObject({ spells: [], magicTricks: [], magicSettings: { artifacts: '', artifactItems: [], guildSpell: null } })
   })
})

describe('Witch curse transactions (S. 274, 278, 281–283, 50)', () => {
   beforeEach(() => vi.restoreAllMocks())
   it('requires Tradition (Hexe), including free recording, before any mutation', async () => {
      const { stat, res, save } = setup()
      await expect(changeSpell(request({ key: 'Hexenschuss' }), res)).rejects.toThrow('Tradition (Hexe)')
      await expect(changeSpell(request({ key: 'Hexenschuss', spendAP: false }), res)).rejects.toThrow('Tradition (Hexe)')
      expect(stat.spells).toHaveLength(0)
      expect(save).not.toHaveBeenCalled()
   })
   it('activates at 2 AP, advances with B costs and persists notes and free corrections', async () => {
      const { stat, res } = setup()
      stat.generalSpecialAbilities = ['Tradition (Hexe)']
      await changeSpell(request({ key: 'Hexenschuss' }), res)
      expect(stat.spells[0]).toMatchObject({ value: 0, paidAP: 2 })
      await changeSpell(request({ key: 'Hexenschuss', value: 3 }), res)
      await updateSpellNotes(request({ key: 'Hexenschuss', notes: ' My demand ' }), res)
      await changeSpell(request({ key: 'Hexenschuss', value: 1, spendAP: false }), res)
      expect(toPublicStats(stat).spells[0]).toEqual({ key: 'Hexenschuss', value: 1, notes: 'My demand', paidAP: 8 })
      expect(stat.experience.spent).toBe(1008)
      await removeSpell(request({ key: 'Hexenschuss' }), res)
      expect(stat.experience.spent).toBe(1000)
   })
})

describe('Inventory-linked tradition artifacts (S. 278, 281; app recording policy)', () => {
   beforeEach(() => vi.restoreAllMocks())
   it('links existing physical items without duplicating equipment or granting flight', async () => {
      const { stat, res } = setup()
      stat.equipment = [{ item: 'Besen', amount: 1, weight: 1, carriedOn: 'Backpack', category: 'Misc', description: '' }]
      await updateMagicSettings(request({ artifactItems: ['Besen'], artifacts: 'Existing note' }), res)
      expect(toPublicStats(stat).magicSettings).toMatchObject({ artifactItems: ['Besen'], artifacts: 'Existing note' })
      expect(stat.equipment).toHaveLength(1)
      expect(stat.generalSpecialAbilities).not.toContain('Flugsalbe')
      expect(stat.experience.spent).toBe(1000)
      expect(stat.mana.current).toBe(12)
   })
   it('rejects absent, zero-quantity and duplicate item selections before saving', async () => {
      const { stat, res, save } = setup()
      stat.equipment = [{ item: 'Besen', amount: 1, weight: 1, carriedOn: 'Backpack', category: 'Misc', description: '' }]
      await expect(updateMagicSettings(request({ artifactItems: ['Stuhl'] }), res)).rejects.toThrow('inventory')
      await expect(updateMagicSettings(request({ artifactItems: ['Besen', 'Besen'] }), res)).rejects.toThrow('once')
      stat.equipment[0].amount = 0
      await expect(updateMagicSettings(request({ artifactItems: ['Besen'] }), res)).rejects.toThrow('inventory')
      expect(stat.magicSettings.artifactItems).toEqual([])
      expect(save).not.toHaveBeenCalled()
   })
   it('retains existing notes and marks links through public data even when an item leaves inventory; allows explicit unlink', async () => {
      const { stat, res } = setup()
      stat.magicSettings.artifacts = 'Legacy notes'
      stat.magicSettings.artifactItems = ['Besen']
      expect(toPublicStats(stat).magicSettings).toMatchObject({ artifacts: 'Legacy notes', artifactItems: ['Besen'] })
      await updateMagicSettings(request({ artifactItems: [] }), res)
      expect(stat.magicSettings.artifactItems).toEqual([])
      expect(stat.magicSettings.artifacts).toBe('Legacy notes')
   })
})
