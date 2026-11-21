import type { Request, Response } from 'express'
import { Char } from '@/models/char.model'
import { Stats } from '@/models/stats.model'
import { Companion } from '@/models/companion.model'
import { Summon } from '@/models/summon.model'
import { ExtendedCheck } from '@/models/extendedCheck.model'
import { NotFoundError, UnauthorizedError } from '@/utils/appError'
import { buildCharResponse, buildCharsResponse } from '@/views/charView'
import { Artifact } from '@/models/artifact.model'
import { ActiveEffect } from '@/models/activeEffect.model'

async function ensureCharacterStats(userId: string, charId: unknown) {
   await Stats.findOneAndUpdate(
      { userId, charId },
      { $setOnInsert: { userId, charId } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
   )
}

export async function getCharacters(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const chars = await Char.find({ userId: req.user._id }).sort({
      createdAt: -1,
   })
   await Promise.all(
      chars.map((char) => ensureCharacterStats(req.user!._id, char._id)),
   )
   res.status(200).json(buildCharsResponse(chars))
}

export async function getCharacterById(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const { id } = req.params
   const char = await Char.findOne({ _id: id, userId: req.user._id })

   if (!char) {
      throw new NotFoundError('Character not found')
   }

   await ensureCharacterStats(req.user._id, char._id)
   res.status(200).json(buildCharResponse(char))
}

export async function createCharacter(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const payload = req.body
   const char = await Char.create({
      ...payload,
      userId: req.user._id,
   })

   await ensureCharacterStats(req.user._id, char._id)

   res.status(201).json(buildCharResponse(char))
}

export async function updateCharacter(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const { id } = req.params
   const char = await Char.findOne({ _id: id, userId: req.user._id })

   if (!char) {
      throw new NotFoundError('Character not found')
   }

   Object.assign(char, req.body)
   await char.save()

   res.status(200).json(buildCharResponse(char))
}

export async function deleteCharacter(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const { id } = req.params
   const char = await Char.findOne({ _id: id, userId: req.user._id })

   if (!char) {
      throw new NotFoundError('Character not found')
   }

   const stat = await Stats.findOne({ userId: req.user._id, charId: char._id }, { _id: 1 })
   await Promise.all([
      char.deleteOne(),
      Stats.deleteOne({ userId: req.user._id, charId: char._id }),
      ...(stat ? [
         ExtendedCheck.deleteMany({ userId: req.user._id, statsId: stat._id }),
         Companion.deleteMany({ userId: req.user._id, statsId: stat._id }),
         Summon.deleteMany({ userId: req.user._id, statsId: stat._id }),
         Artifact.deleteMany({ userId: req.user._id, statsId: stat._id }),
         ActiveEffect.deleteMany({ userId: req.user._id, statsId: stat._id }),
      ] : []),
   ])

   res.status(200).json({
      message: 'Character deleted successfully',
   })
}
