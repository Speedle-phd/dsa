import type { Request, Response } from 'express'
import { Artifact, type IArtifactDocument } from '@/models/artifact.model'
import { BadRequestError, NotFoundError, UnauthorizedError } from '@/utils/appError'
import { arcanoviPlan, rechargeArtifact, useCharge } from '@/utils/artifacts'
import { magicSpells } from '@/utils/magicCatalog'
import { adjustPurse } from '@/utils/purseAdjustment'
import { findStatsForUser, saveStats } from '@/utils/statsPersistence'
import { artifactActionSchema, artifactFieldsSchema, createArtifactSchema, updateArtifactSchema } from '@/validations/artifactValidation'
import { buildStatResponse } from '@/views/statsView'

function view(artifact: IArtifactDocument) {
   return {
      _id: String(artifact._id), name: artifact.name, item: artifact.item ?? null, kind: artifact.kind, spell: artifact.spell,
      skillPoints: artifact.skillPoints, duration: artifact.duration,
      charges: { current: artifact.charges?.current ?? 0, max: artifact.charges?.max ?? 0 }, recharge: artifact.recharge ?? null,
      trigger: artifact.trigger, permanentAsp: artifact.permanentAsp, sideEffect: artifact.sideEffect, notes: artifact.notes,
      origin: artifact.origin, createdAt: artifact.createdAt,
   }
}

async function owner(req: Request) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   return { stat, userId: req.user._id }
}

async function listFor(statsId: unknown, userId: string) {
   return (await Artifact.find({ statsId, userId }).sort({ createdAt: 1 })).map(view)
}

// Storage artifacts start full; permanent artifacts and weapons have no charges (S. 267–268).
function chargesFor(kind: IArtifactDocument['kind'], charges: number, recharge: IArtifactDocument['recharge']) {
   if (kind === 'permanent' || kind === 'weapon') return { current: 0, max: 0 }
   const max = kind === 'recharging' ? 1 : charges
   if (max < 1) throw new BadRequestError('A Zauberspeicher needs 1–7 charges (S. 267).')
   if (kind === 'recharging' && !recharge) throw new BadRequestError('Choose how often the artifact recharges (S. 268).')
   return { current: max, max }
}

export async function getArtifacts(req: Request, res: Response) {
   const { stat, userId } = await owner(req)
   res.json({ artifacts: await listFor(stat._id, userId) })
}

export async function addArtifact(req: Request, res: Response) {
   const { stat, userId } = await owner(req)
   const payload = artifactFieldsSchema.parse(req.body)
   const { charges, ...fields } = payload
   await Artifact.create({ ...fields, charges: chargesFor(payload.kind, charges, payload.recharge), origin: 'found', userId, statsId: stat._id })
   res.json({ artifacts: await listFor(stat._id, userId) })
}

export async function updateArtifact(req: Request, res: Response) {
   const { stat, userId } = await owner(req)
   const { artifactId, charges, ...fields } = updateArtifactSchema.parse(req.body)
   const artifact = await Artifact.findOne({ _id: artifactId, statsId: stat._id, userId })
   if (!artifact) throw new NotFoundError('Artifact not found')
   artifact.set(fields)
   if (charges !== undefined || fields.kind !== undefined) {
      const next = chargesFor(artifact.kind, charges ?? artifact.charges.max, artifact.recharge)
      artifact.charges = { current: Math.min(artifact.charges.current, next.max), max: next.max }
   }
   await artifact.save()
   res.json({ artifacts: await listFor(stat._id, userId) })
}

export async function artifactAction(req: Request, res: Response) {
   const { stat, userId } = await owner(req)
   const { artifactId, action } = artifactActionSchema.parse(req.body)
   const artifact = await Artifact.findOne({ _id: artifactId, statsId: stat._id, userId })
   if (!artifact) throw new NotFoundError('Artifact not found')
   if (action === 'remove') await artifact.deleteOne()
   else {
      artifact.charges = action === 'use' ? useCharge(artifact.kind, artifact.charges) : rechargeArtifact(artifact.kind, artifact.charges)
      await artifact.save()
   }
   res.json({ artifacts: await listFor(stat._id, userId) })
}

// ARCANOVI succeeded (both checks): spend the AsP, book the permanent AsP, pay the material, store the artifact (S. 267–268).
export async function createArtifact(req: Request, res: Response) {
   const { stat, userId } = await owner(req)
   const payload = createArtifactSchema.parse(req.body)
   if (!stat.spells.some((entry) => entry.key === 'Arcanovi')) throw new BadRequestError('Creating artifacts needs the ritual ARCANOVI (S. 267).')
   const spell = magicSpells.find((entry) => entry.key === payload.spell)
   if (!spell || spell.kind !== 'Zauberspruch' || !stat.spells.some((entry) => entry.key === spell.key)) {
      throw new BadRequestError('Store one of your Zaubersprüche; rituals cannot be bound (S. 267).')
   }
   const plan = arcanoviPlan(payload)
   if (plan.asp > stat.mana.current) throw new BadRequestError(`Not enough AsP: ${plan.asp} needed.`)
   if (plan.materialSilver) {
      const paid = adjustPurse(stat.purse, { direction: 'lose', coins: { dukaten: 0, silbertaler: plan.materialSilver, heller: 0, kreuzer: 0 } })
      if (!paid.ok) throw new BadRequestError('Not enough money for the material.')
      stat.purse = paid.purse
   }
   stat.mana.current -= plan.asp
   stat.mana.permanentLoss = (stat.mana.permanentLoss ?? 0) + plan.permanent
   await saveStats(stat)
   await Artifact.create({
      userId, statsId: stat._id, name: payload.name, item: payload.item, kind: payload.recharge ? 'recharging' : 'storage',
      spell: spell.key, skillPoints: payload.skillPoints, duration: payload.duration,
      charges: { current: payload.charges, max: payload.charges }, recharge: payload.recharge, trigger: payload.trigger,
      permanentAsp: plan.permanent, sideEffect: payload.sideEffect, origin: 'created',
   })
   res.json({ ...buildStatResponse(stat), artifacts: await listFor(stat._id, userId) })
}
