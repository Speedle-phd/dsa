import type { Request, Response } from 'express'
import { ExtendedCheck, type IExtendedCheckDocument } from '@/models/extendedCheck.model'
import { BadRequestError, NotFoundError, UnauthorizedError } from '@/utils/appError'
import { newExtendedCheck, recordAttempt } from '@/utils/extendedCheck'
import { findStatsForUser } from '@/utils/statsPersistence'
import { talentCatalog, talentsWithOwnCritical } from '@/utils/talentCatalog'
import { addExtendedCheckSchema, extendedCheckAttemptSchema, removeExtendedCheckSchema } from '@/validations/extendedCheckValidation'

function view(check: IExtendedCheckDocument) {
   return {
      _id: String(check._id), name: check.name, skill: { kind: check.skill.kind, key: check.skill.key }, interval: check.interval,
      maxAttempts: check.maxAttempts, collected: check.collected, penalty: check.penalty, status: check.status,
      attempts: check.attempts.map(({ outcome, quality, by }) => ({ outcome, quality, by: by ?? null })), createdAt: check.createdAt,
   }
}

async function owner(req: Request) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   return { stat, userId: req.user._id }
}

async function listFor(statsId: unknown, userId: string) {
   const checks = await ExtendedCheck.find({ statsId, userId }).sort({ createdAt: -1 })
   return checks.map(view)
}

export async function getExtendedChecks(req: Request, res: Response) {
   const { stat, userId } = await owner(req)
   res.json({ checks: await listFor(stat._id, userId) })
}

export async function addExtendedCheck(req: Request, res: Response) {
   const { stat, userId } = await owner(req)
   const payload = addExtendedCheckSchema.parse(req.body)
   const known = payload.skill.kind === 'talent'
      ? talentCatalog.some((entry) => entry.key === payload.skill.key)
      : (stat.spells ?? []).some((spell) => spell.key === payload.skill.key)
   if (!known) throw new BadRequestError('Choose a talent or an owned spell for this extended check.')
   await ExtendedCheck.create({ ...payload, ...newExtendedCheck(payload.maxAttempts), userId, statsId: stat._id })
   res.json({ checks: await listFor(stat._id, userId) })
}

export async function recordExtendedCheckAttempt(req: Request, res: Response) {
   const { stat, userId } = await owner(req)
   const { checkId, ...attempt } = extendedCheckAttemptSchema.parse(req.body)
   const check = await ExtendedCheck.findOne({ _id: checkId, statsId: stat._id, userId })
   if (!check) throw new NotFoundError('Extended check not found')
   if (check.status !== 'open') throw new BadRequestError('This extended check is finished.')
   const next = recordAttempt({
      maxAttempts: check.maxAttempts, attempts: check.attempts.map(({ outcome, quality, by }) => ({ outcome, quality, by: by ?? null })),
      collected: check.collected, penalty: check.penalty, status: check.status,
   }, attempt, check.skill.kind === 'talent' && talentsWithOwnCritical.has(check.skill.key))
   check.set({ attempts: next.attempts, collected: next.collected, penalty: next.penalty, status: next.status })
   await check.save()
   res.json({ checks: await listFor(stat._id, userId) })
}

export async function removeExtendedCheck(req: Request, res: Response) {
   const { stat, userId } = await owner(req)
   const { checkId } = removeExtendedCheckSchema.parse(req.body)
   const removed = await ExtendedCheck.findOneAndDelete({ _id: checkId, statsId: stat._id, userId })
   if (!removed) throw new NotFoundError('Extended check not found')
   res.json({ checks: await listFor(stat._id, userId) })
}
