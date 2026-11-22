import type { Request, Response } from "express"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Stats } from "../models/stats.model"
import * as persistence from "./statsPersistence"
import { addCharacterEntry, previewCharacterEntry, previewCharacterEntryRemoval, removeCharacterEntry } from "../controllers/characterEntryController"
import { updateExperience, updateStats } from "../controllers/statsController"
import { assertEntryListsPreserved } from "./characterEntryRules"
import { mockStatsLookup } from "./testing/mockStatsLookup"

function heroStats() {
   return new Stats({
      _id: "507f1f77bcf86cd799439010", userId: "507f1f77bcf86cd799439011", charId: "507f1f77bcf86cd799439012",
      experience: { total: 1100, spent: 1000 }, talents: [{ key: "magiekunde", value: 4 }],
      createdAt: new Date(), updatedAt: new Date(),
   })
}
function request(body: Record<string, unknown>) {
   return {
      params: { id: "507f1f77bcf86cd799439010" },
      user: { _id: "507f1f77bcf86cd799439011", username: "Trait test", email: "test@example.invalid" }, body,
   } as Request
}
function setup() {
   const stat = heroStats()
   mockStatsLookup(stat)
   const save = vi.spyOn(persistence, "saveStats").mockImplementation(async (doc) => { await doc.validate() })
   const res = { json: vi.fn(), status: vi.fn().mockReturnThis() } as unknown as Response
   return { stat, save, res }
}

describe("Character entry transactions and safe undo (S. 162, 215–224, 352)", () => {
   beforeEach(() => vi.restoreAllMocks())
   it("persists purchase, actual AP debit and public effect together, then refunds once", async () => {
      const { stat, save, res } = setup()
      await addCharacterEntry(request({ category: "generalSpecialAbilities", mode: "purchase", selection: { category: "generalSpecialAbilities", catalogKey: "Analytiker" } }), res)
      expect(stat.generalSpecialAbilities).toEqual(["Analytiker"])
      expect(stat.experience.spent).toBe(1005)
      expect(stat.entryPurchases[0].ap).toBe(5)
      expect(vi.mocked(res.json).mock.calls[0][0].stats.entryEffects["generalSpecialAbilities:Analytiker"].page).toBe(215)
      await removeCharacterEntry(request({ category: "generalSpecialAbilities", key: "Analytiker" }), res)
      expect(stat.experience.spent).toBe(1000)
      expect(stat.entryPurchases).toHaveLength(0)
      expect(save).toHaveBeenCalledTimes(2)
      await expect(removeCharacterEntry(request({ category: "generalSpecialAbilities", key: "Analytiker" }), res)).rejects.toThrow("not recorded")
      expect(save).toHaveBeenCalledTimes(2)
   })

   describe("Disadvantage creation accounting (S. 39, 46, 177, 352)", () => {
      beforeEach(() => vi.restoreAllMocks())
      const chosen = { category: "disadvantages", catalogKey: "Schlechte Eigenschaft (Goldgier)" }
      it("grants and persists +5 creation AP, previews undo as −5, and reverses once", async () => {
         const { stat, save, res } = setup()
         await previewCharacterEntry(request({ ...chosen, mode: "creation" }), res)
         expect(vi.mocked(res.json).mock.calls[0][0]).toMatchObject({ ap: 5, problems: [] })
         await addCharacterEntry(request({ category: "disadvantages", mode: "creation", selection: chosen }), res)
         expect(stat.experience).toMatchObject({ total: 1105, spent: 1000, gathered: 0, disadvantageCredit: 5 })
         expect(stat.entryCredits[0]).toMatchObject({ key: chosen.catalogKey, ap: 5 })
         expect(stat.disadvantages).toEqual([chosen.catalogKey])
         await previewCharacterEntryRemoval(request({ category: "disadvantages", key: chosen.catalogKey }), res)
         expect(vi.mocked(res.json).mock.lastCall?.[0]).toMatchObject({ creditReversal: 5, refund: 0, buyOff: 5 })
         await removeCharacterEntry(request({ category: "disadvantages", key: chosen.catalogKey }), res)
         expect(stat.experience).toMatchObject({ total: 1100, spent: 1000, disadvantageCredit: 0 })
         expect(stat.entryCredits).toHaveLength(0)
         await expect(removeCharacterEntry(request({ category: "disadvantages", key: chosen.catalogKey }), res)).rejects.toThrow("not recorded")
         expect(save).toHaveBeenCalledTimes(2)
      })
      it("never credits existing/during-play records or accepts a custom disadvantage", async () => {
         const { stat, save, res } = setup()
         await expect(addCharacterEntry(request({ category: "disadvantages", mode: "record", key: "Goldgier" }), res)).rejects.toThrow()
         expect(save).not.toHaveBeenCalled()
         await addCharacterEntry(request({ category: "disadvantages", mode: "record", selection: chosen }), res)
         expect(stat.experience.total).toBe(1100)
         expect(stat.entryCredits).toHaveLength(0)
         await expect(addCharacterEntry(request({ category: "disadvantages", mode: "creation", selection: chosen }), res)).rejects.toThrow("already recorded")
         expect(stat.experience.total).toBe(1100)
      })
      it("normalizes legacy Goldgier, supplies its tooltip and lets it be removed without AP changes", async () => {
         const { stat, res } = setup()
         stat.disadvantages = ["Goldgier"]
         await previewCharacterEntryRemoval(request({ category: "disadvantages", key: chosen.catalogKey }), res)
         expect(vi.mocked(res.json).mock.lastCall?.[0]).toMatchObject({ refund: 0, creditReversal: 0, buyOff: 5 })
         await removeCharacterEntry(request({ category: "disadvantages", key: chosen.catalogKey }), res)
         expect(stat.disadvantages).toEqual([])
         expect(stat.experience.total).toBe(1100)
      })
      it("rejects the creation cap and incompatible traits without altering accounting", async () => {
         const { stat, save, res } = setup()
         stat.disadvantages = ["Blind", "Niedrige Seelenkraft", "Schlechte Eigenschaft (Neugier)"]
         await expect(addCharacterEntry(request({ category: "disadvantages", mode: "creation", selection: chosen }), res)).rejects.toThrow("80 AP")
         stat.disadvantages = []
         stat.advantages = ["Flink"]
         await expect(addCharacterEntry(request({ category: "disadvantages", mode: "creation", selection: { category: "disadvantages", catalogKey: "Behäbig" } }), res)).rejects.toThrow("Flink")
         expect(stat.experience.total).toBe(1100)
         expect(stat.entryCredits).toHaveLength(0)
         expect(save).not.toHaveBeenCalled()
      })
      it("blocks undo if the AP were spent and blocks bulk removal of a credited entry", async () => {
         const { stat, save, res } = setup()
         await addCharacterEntry(request({ category: "disadvantages", mode: "creation", selection: chosen }), res)
         stat.experience.spent = 1103
         await expect(removeCharacterEntry(request({ category: "disadvantages", key: chosen.catalogKey }), res)).rejects.toThrow("undo purchases first")
         expect(() => assertEntryListsPreserved(stat.toObject(), { disadvantages: [] })).toThrow("tracked creation AP")
         expect(stat.experience.total).toBe(1105)
         expect(save).toHaveBeenCalledTimes(1)
      })
      it("charges buy-off once, without also withdrawing the original creation credit", async () => {
         const { stat, res } = setup()
         await addCharacterEntry(request({ category: "disadvantages", mode: "creation", selection: chosen }), res)
         await removeCharacterEntry(request({ category: "disadvantages", key: chosen.catalogKey, mode: "buyOff", gmApproved: true }), res)
         expect(stat.experience).toMatchObject({ total: 1105, spent: 1005, disadvantageCredit: 5 })
         expect(stat.entryCredits).toHaveLength(0)
         expect(stat.disadvantages).toEqual([])
      })
      it("preserves creation credit through both adventure awards and initial-sheet editing", async () => {
         const { stat, res } = setup()
         stat.level = "Erfahren"
         stat.experience.base = 1100
         await addCharacterEntry(request({ category: "disadvantages", mode: "creation", selection: chosen }), res)
         await updateExperience(request({ gathered: 10 }), res)
         expect(stat.experience).toMatchObject({ total: 1115, gathered: 10, disadvantageCredit: 5 })
         await updateStats(request({ experience: { gathered: 20, spent: 1000 } }), res)
         expect(stat.experience).toMatchObject({ total: 1125, gathered: 20, disadvantageCredit: 5 })
         expect(stat.entryCredits).toHaveLength(1)
      })
   })
   it("records custom or initial entries without charge, credit or refund", async () => {
      const { stat, res } = setup()
      await addCharacterEntry(request({ category: "advantages", mode: "record", key: "Custom advantage" }), res)
      await addCharacterEntry(request({ category: "disadvantages", mode: "record", selection: { category: "disadvantages", catalogKey: "Pech", level: 3 } }), res)
      expect(stat.experience.spent).toBe(1000)
      expect(stat.entryPurchases).toHaveLength(0)
      await removeCharacterEntry(request({ category: "advantages", key: "Custom advantage" }), res)
      expect(stat.experience.spent).toBe(1000)
   })
   it("requires GM approval for during-play advantages", async () => {
      const { stat, save, res } = setup()
      const payload = { category: "advantages", mode: "purchase", selection: { category: "advantages", catalogKey: "Zeitgefühl" } }
      await expect(addCharacterEntry(request(payload), res)).rejects.toThrow("GM approval")
      expect(save).not.toHaveBeenCalled()
      expect(stat.advantages).toEqual([])
      await addCharacterEntry(request({ ...payload, gmApproved: true }), res)
      expect(stat.experience.spent).toBe(1002)
   })
   it("never turns an acquired disadvantage into AP income", async () => {
      const { stat, save, res } = setup()
      await expect(addCharacterEntry(request({ category: "disadvantages", mode: "purchase", gmApproved: true, selection: { category: "disadvantages", catalogKey: "Behäbig" } }), res)).rejects.toThrow("give no AP")
      expect(stat.experience.spent).toBe(1000)
      expect(save).not.toHaveBeenCalled()
   })
   it("blocks invalid or unaffordable purchases without mutating the hero", async () => {
      const { stat, save, res } = setup()
      stat.experience.spent = 1100
      await expect(addCharacterEntry(request({ category: "generalSpecialAbilities", mode: "purchase", selection: { category: "generalSpecialAbilities", catalogKey: "Analytiker" } }), res)).rejects.toThrow("Not enough")
      await expect(addCharacterEntry(request({ category: "advantages", mode: "purchase", selection: { category: "scripts", catalogKey: "Chrmk" } }), res)).rejects.toThrow()
      expect(stat.entryPurchases).toHaveLength(0)
      expect(save).not.toHaveBeenCalled()
   })
   it("requires approval and charges the complete disadvantage buy-off cost, not a refund", async () => {
      const { stat, res } = setup()
      stat.disadvantages = ["Pech I", "Pech II", "Pech III"]
      await previewCharacterEntryRemoval(request({ category: "disadvantages", key: "Pech III" }), res)
      expect(vi.mocked(res.json).mock.calls[0][0].buyOff).toBe(60)
      await expect(removeCharacterEntry(request({ category: "disadvantages", key: "Pech III", mode: "buyOff" }), res)).rejects.toThrow("GM approval")
      await removeCharacterEntry(request({ category: "disadvantages", key: "Pech III", mode: "buyOff", gmApproved: true }), res)
      expect(stat.disadvantages).toEqual([])
      expect(stat.experience.spent).toBe(1060)
   })
   it("does not buy off a custom disadvantage or permit an unaffordable buy-off", async () => {
      const { stat, save, res } = setup()
      stat.disadvantages = ["Custom disadvantage", "Pech III"]
      await expect(removeCharacterEntry(request({ category: "disadvantages", key: "Custom disadvantage", mode: "buyOff", gmApproved: true }), res)).rejects.toThrow("verified buy-off")
      stat.experience.spent = 1099
      await expect(removeCharacterEntry(request({ category: "disadvantages", key: "Pech III", mode: "buyOff", gmApproved: true }), res)).rejects.toThrow("Not enough AP")
      expect(save).not.toHaveBeenCalled()
      expect(stat.disadvantages).toHaveLength(2)
   })
   it("blocks prerequisite removal and inconsistent refunds without saving", async () => {
      const { stat, save, res } = setup()
      stat.languages = ["Garethi I", "Garethi II"]
      await expect(removeCharacterEntry(request({ category: "languages", key: "Garethi I" }), res)).rejects.toThrow("dependent")
      stat.generalSpecialAbilities = ["Analytiker"]
      stat.entryPurchases.push({ category: "generalSpecialAbilities", catalogKey: "Analytiker", key: "Analytiker", level: 1, detail: "", application: "", ap: 1200 })
      await expect(removeCharacterEntry(request({ category: "generalSpecialAbilities", key: "Analytiker" }), res)).rejects.toThrow("inconsistent")
      expect(save).not.toHaveBeenCalled()
   })
   it("requires ownership authentication before loading data", async () => {
      const load = vi.spyOn(persistence, "findStatsForUser")
      const req = request({ category: "advantages", key: "Custom", mode: "record" })
      req.user = undefined
      await expect(addCharacterEntry(req, { json: vi.fn() } as Response)).rejects.toThrow("not authenticated")
      expect(load).not.toHaveBeenCalled()
   })
   it("rejects duplicate purchase and duplicate record without changing AP or history", async () => {
      const { stat, save, res } = setup()
      stat.generalSpecialAbilities = ["Analytiker"]
      for (const mode of ["record", "purchase"]) {
         await expect(addCharacterEntry(request({ category: "generalSpecialAbilities", mode, selection: { category: "generalSpecialAbilities", catalogKey: "Analytiker" } }), res)).rejects.toThrow("already recorded")
      }
      expect(stat.experience.spent).toBe(1000)
      expect(stat.entryPurchases).toHaveLength(0)
      expect(save).not.toHaveBeenCalled()
   })
   it("persists language/script acquisitions and guards the last matching language (S. 219–224)", async () => {
      const { stat, res } = setup()
      for (const [category, catalogKey] of [["languages", "Garethi"], ["scripts", "Kusliker Zeichen"]]) {
         await addCharacterEntry(request({ category, mode: "purchase", selection: { category, catalogKey } }), res)
      }
      expect(stat.experience.spent).toBe(1004)
      await expect(removeCharacterEntry(request({ category: "languages", key: "Garethi I" }), res)).rejects.toThrow("Kusliker Zeichen")
      await removeCharacterEntry(request({ category: "scripts", key: "Kusliker Zeichen" }), res)
      await removeCharacterEntry(request({ category: "languages", key: "Garethi I" }), res)
      expect(stat.experience.spent).toBe(1000)
      expect(stat.entryPurchases).toHaveLength(0)
   })
})
