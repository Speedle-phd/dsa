import type { Request, Response } from "express"
import { BadRequestError, UnauthorizedError } from "@/utils/appError"
import { findStatsForUser, saveStats } from "@/utils/statsPersistence"
import { buildStatResponse } from "@/views/statsView"
import { characterEntryCatalog, entryTalents, entryTechniques, staffBinding } from "@/utils/characterEntryCatalog"
import { canonicalEntryName, entryName, quoteEntry, removalDependents, selectionFromEntry } from "@/utils/characterEntryRules"
import { addCharacterEntrySchema, entryPreviewSchema, removeCharacterEntrySchema } from "@/validations/characterEntryValidation"

function normalizeDisadvantages(stat: { disadvantages: string[] }) {
   stat.disadvantages = [...new Set(stat.disadvantages.map((key) => canonicalEntryName("disadvantages", key)))]
}

export function getCharacterEntryReference(_req: Request, res: Response) {
   res.json({ entries: characterEntryCatalog, talents: entryTalents, techniques: entryTechniques })
}

export async function previewCharacterEntry(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError("User not authenticated")
   const stat = await findStatsForUser(req.params.id, req.user._id)
   normalizeDisadvantages(stat)
   const { mode, ...selection } = entryPreviewSchema.parse(req.body)
   res.json(quoteEntry(stat, selection, mode))
}

export async function addCharacterEntry(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError("User not authenticated")
   const input = addCharacterEntrySchema.parse(req.body)
   const stat = await findStatsForUser(req.params.id, req.user._id)
   normalizeDisadvantages(stat)
   let key = input.key
   if (input.selection) {
      const quote = quoteEntry(stat, input.selection, input.mode)
      key = quote.key
      if (stat[input.category].includes(key)) throw new BadRequestError("This entry is already recorded.")
      if (input.mode === "creation") {
         if (quote.problems.length) throw new BadRequestError(quote.problems.join(" "))
         if (quote.approval && !input.gmApproved) throw new BadRequestError("Confirm GM approval and the narrative prerequisites.")
         // source: DSA5 Regelwerk, S. 39, 46 (creation credit, not adventure-earned AP)
         stat.experience.disadvantageCredit += quote.ap
         stat.experience.total += quote.ap
         stat.entryCredits.push({ key, ap: quote.ap })
      }
      if (input.mode === "purchase") {
         if (input.category === "disadvantages") throw new BadRequestError("Disadvantages acquired during play give no AP; record them instead (S. 162, 352).")
         if (quote.problems.length) throw new BadRequestError(quote.problems.join(" "))
         if ((input.category === "advantages" || quote.approval) && !input.gmApproved) {
            throw new BadRequestError("Confirm GM approval and the narrative prerequisites (S. 162, 352).")
         }
         stat.experience.spent += quote.ap
         stat.entryPurchases.push({ ...input.selection, key, ap: quote.ap })
         // source: DSA5 Regelwerk, S. 276 (binding the staff costs 2 permanent AsP)
         if (key === staffBinding.key) stat.mana.permanentLoss = (stat.mana.permanentLoss ?? 0) + staffBinding.permanentAsp
      }
   }
   if (!key) throw new BadRequestError("Choose an entry.")
   if (stat[input.category].includes(key)) throw new BadRequestError("This entry is already recorded.")
   stat[input.category].push(key)
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}

export async function previewCharacterEntryRemoval(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError("User not authenticated")
   const input = removeCharacterEntrySchema.parse(req.body)
   const stat = await findStatsForUser(req.params.id, req.user._id)
   normalizeDisadvantages(stat)
   if (!stat[input.category].includes(input.key)) throw new BadRequestError("This entry is not recorded.")
   const selection = selectionFromEntry(input.category, input.key)
   const entry = characterEntryCatalog.find((item) => item.category === input.category && item.key === selection?.catalogKey)
   const buyOff = input.category === "disadvantages" && selection && entry
      ? quoteEntry({ ...stat.toObject(), disadvantages: stat.disadvantages.filter((key) => key !== input.key) }, selection).ap * selection.level
      : null
   res.json({
      dependents: removalDependents(stat.toObject(), input.category, input.key),
      refund: stat.entryPurchases.find((purchase) => purchase.category === input.category && purchase.key === input.key)?.ap ?? 0,
      creditReversal: input.category === "disadvantages" ? stat.entryCredits.find((credit) => credit.key === input.key)?.ap ?? 0 : 0,
      buyOff,
      lowerLevel: entry?.levels && selection && selection.level > 1
         ? entryName(entry, { ...selection, level: selection.level - 1 }) : null,
   })
}

// source: DSA5 Regelwerk, S. 162, 352 (paid buy-off is distinct from undoing a mistaken record)
export async function removeCharacterEntry(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError("User not authenticated")
   const input = removeCharacterEntrySchema.parse(req.body)
   const stat = await findStatsForUser(req.params.id, req.user._id)
   normalizeDisadvantages(stat)
   if (!stat[input.category].includes(input.key)) throw new BadRequestError("This entry is not recorded.")
   const dependents = removalDependents(stat.toObject(), input.category, input.key)
   if (dependents.length) throw new BadRequestError(`Remove dependent entries first: ${dependents.join(", ")}.`)
   if (input.mode === "buyOff") {
      if (!input.gmApproved) throw new BadRequestError("Buying off a disadvantage requires GM approval (S. 352).")
      const selection = selectionFromEntry("disadvantages", input.key)
      if (!selection) throw new BadRequestError("No verified buy-off cost for this custom entry; use manual AP configuration with your GM.")
      const quote = quoteEntry({ ...stat.toObject(), disadvantages: stat.disadvantages.filter((key) => key !== input.key) }, selection)
      // Buy off this recorded level and every lower level of the same disadvantage.
      const cost = quote.ap * selection.level
      if (cost > stat.experience.total - stat.experience.spent) throw new BadRequestError("Not enough AP to buy off this disadvantage.")
      const removed = stat.disadvantages.filter((key) => {
         const item = selectionFromEntry("disadvantages", key)
         return item?.catalogKey === selection.catalogKey && item.detail === selection.detail && item.level <= selection.level
      })
      for (const key of removed) {
         const blockers = removalDependents(stat.toObject(), "disadvantages", key).filter((name) => !removed.includes(name))
         if (blockers.length) throw new BadRequestError(`Remove dependent entries first: ${blockers.join(", ")}.`)
      }
      stat.disadvantages = stat.disadvantages.filter((key) => !removed.includes(key))
      stat.entryCredits = stat.entryCredits.filter((credit) => !removed.includes(credit.key))
      stat.experience.spent += cost
   } else if (input.mode === "record") {
      stat[input.category] = stat[input.category].filter((key) => key !== input.key)
      stat.entryPurchases = stat.entryPurchases.filter((purchase) => purchase.category !== input.category || purchase.key !== input.key)
      if (input.category === "disadvantages") stat.entryCredits = stat.entryCredits.filter((item) => item.key !== input.key)
   } else {
      const credit = input.category === "disadvantages" ? stat.entryCredits.find((item) => item.key === input.key)?.ap ?? 0 : 0
      if (!Number.isSafeInteger(credit) || credit < 0 || credit > stat.experience.disadvantageCredit) {
         throw new BadRequestError("Cannot reverse this creation credit: stored AP accounting is inconsistent.")
      }
      if (stat.experience.total - credit < stat.experience.spent) {
         throw new BadRequestError("Not enough available AP to reverse this creation credit; undo purchases first.")
      }
      const refund = stat.entryPurchases.find((purchase) => purchase.category === input.category && purchase.key === input.key)?.ap ?? 0
      if (!Number.isSafeInteger(refund) || refund < 0 || refund > stat.experience.spent) {
         throw new BadRequestError("Cannot refund this purchase: stored AP accounting is inconsistent.")
      }
      stat[input.category] = stat[input.category].filter((key) => key !== input.key)
      stat.entryPurchases = stat.entryPurchases.filter((purchase) => purchase.category !== input.category || purchase.key !== input.key)
      if (input.category === "disadvantages") stat.entryCredits = stat.entryCredits.filter((item) => item.key !== input.key)
      stat.experience.disadvantageCredit -= credit
      stat.experience.total -= credit
      stat.experience.spent -= refund
      if (input.key === staffBinding.key && refund > 0) {
         stat.mana.permanentLoss = Math.max(0, (stat.mana.permanentLoss ?? 0) - staffBinding.permanentAsp)
      }
   }
   await saveStats(stat)
   res.json(buildStatResponse(stat))
}
