import type { Request, Response } from 'express'
import { NpcTemplate, type INpcTemplateDocument } from '@/models/npcTemplate.model'
import { BadRequestError, NotFoundError } from '@/utils/appError'
import { deriveNpc, type GeneratorInput } from '@/utils/npcGenerator'
import { idParam, userOf } from '@/utils/partyRequest'

// The GM's NPC library (user request, Nov 2026): only the owner sees and changes an entry (404 for everyone else)
const libraryLimit = 500

function templateView(template: INpcTemplateDocument) {
   return {
      _id: String(template._id), name: template.name, values: template.values, source: template.source ?? 'manual', tags: template.tags ?? [],
      updatedAt: template.updatedAt?.toISOString() ?? null,
   }
}
async function ownTemplate(req: Request) {
   const template = await NpcTemplate.findOne({ _id: idParam(req, 'templateId', 'Template not found'), userId: userOf(req) })
   if (!template) throw new NotFoundError('Template not found')
   return template
}

export async function listNpcTemplates(req: Request, res: Response) {
   const templates = await NpcTemplate.find({ userId: userOf(req) }).sort({ name: 1 }).limit(libraryLimit)
   res.json({ templates: templates.map(templateView) })
}

export async function createNpcTemplate(req: Request, res: Response) {
   const { name, values, source, tags } = req.body as Pick<INpcTemplateDocument, 'name' | 'values' | 'source' | 'tags'>
   const template = await NpcTemplate.create({ userId: userOf(req), name, values, source, tags })
   res.status(201).json({ template: templateView(template) })
}

export async function updateNpcTemplate(req: Request, res: Response) {
   const template = await ownTemplate(req)
   const { name, values, source, tags } = req.body as Pick<INpcTemplateDocument, 'name' | 'values' | 'source' | 'tags'>
   template.set({ name, values, source, tags })
   await template.save()
   res.json({ template: templateView(template) })
}

export async function duplicateNpcTemplate(req: Request, res: Response) {
   const original = await ownTemplate(req)
   const copy = await NpcTemplate.create({ userId: userOf(req), name: `${original.name} (2)`.slice(0, 80), values: original.toObject().values,
      source: original.source, tags: original.tags })
   res.status(201).json({ template: templateView(copy) })
}

export async function deleteNpcTemplate(req: Request, res: Response) {
   const result = await NpcTemplate.deleteOne({ _id: idParam(req, 'templateId', 'Template not found'), userId: userOf(req) })
   if (!result.deletedCount) throw new NotFoundError('Template not found')
   res.json({ ok: true })
}

// The generator's values by the hero rules (no storage; the GM checks them in the editor and saves)
export async function deriveNpcTemplate(req: Request, res: Response) {
   try {
      res.json({ npc: deriveNpc(req.body as GeneratorInput) })
   } catch (error) {
      if (error instanceof Error && /^Unknown (species|combat technique)/.test(error.message)) throw new BadRequestError(error.message)
      throw error
   }
}
