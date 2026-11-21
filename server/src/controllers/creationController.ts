import type { Request, Response } from 'express'
import { Char } from '@/models/char.model'
import { CreationDraft, type ICreationDraftDocument } from '@/models/creationDraft.model'
import { Stats } from '@/models/stats.model'
import { BadRequestError, NotFoundError, UnauthorizedError } from '@/utils/appError'
import { magicTricks } from '@/utils/magicCatalog'
import { combatAbilities } from '@/utils/combatRules'
import { archetypeCatalog, archetypeDraft, archetypeFor } from '@/utils/creation/archetypeCatalog'
import { creationLedger, emptyDraft, type CreationDraftData } from '@/utils/creation/creationLedger'
import { finishedHero } from '@/utils/creation/creationFinish'
import { rebaseDraftValues } from '@/utils/creation/creationRebase'
import { cultureCatalog } from '@/utils/creation/cultureCatalog'
import { professionCatalog } from '@/utils/creation/professionCatalog'
import { experienceCaps, creationLimits } from '@/utils/creation/experienceCaps'
import { speciesCatalog } from '@/utils/creation/speciesCatalog'
import { startAge, startMoney } from '@/utils/creation/startTables'
import { saveStats } from '@/utils/statsPersistence'
import { createCreationDraftSchema, creationDraftSchema, updateCreationDraftSchema } from '@/validations/creationValidation'

function userOf(req: Request) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   return req.user._id
}

function view(draft: ICreationDraftDocument) {
   const data = creationDraftSchema.parse(draft.data) as CreationDraftData
   return { _id: String(draft._id), step: draft.step, data, ledger: creationLedger(data), updatedAt: draft.updatedAt,
      startAge: data.species ? startAge(data.species, data.level) : null }
}

async function findDraft(req: Request) {
   const draft = await CreationDraft.findOne({ _id: req.params.id, userId: userOf(req) })
   if (!draft) throw new NotFoundError('Creation draft not found')
   return draft
}

export function getCreationReference(_req: Request, res: Response) {
   res.json({ experienceLevels: experienceCaps, limits: creationLimits, species: speciesCatalog, cultures: cultureCatalog, professions: professionCatalog, startMoney,
      tricks: magicTricks.map((trick) => trick.key), combatAbilities,
      archetypes: archetypeCatalog.map(({ key, page, sex, species, culture, profession, variant, attributes, note }) => ({ key, page, sex, species, culture, profession, variant, attributes, note: note ?? null })) })
}

export async function listCreationDrafts(req: Request, res: Response) {
   const drafts = await CreationDraft.find({ userId: userOf(req) }).sort({ updatedAt: -1 })
   res.json({ drafts: drafts.map((draft) => ({ _id: String(draft._id), step: draft.step, name: draft.data.name, species: draft.data.species,
      culture: draft.data.culture, level: draft.data.level, updatedAt: draft.updatedAt })) })
}

export async function createCreationDraft(req: Request, res: Response) {
   const { level, archetype: archetypeKey } = createCreationDraftSchema.parse(req.body)
   // An archetype (S. 62–85) starts as a filled Erfahren draft on the summary, where its open points are listed
   const archetype = archetypeKey ? archetypeFor(archetypeKey) : null
   if (archetypeKey && !archetype) throw new BadRequestError('Unknown archetype.')
   const draft = await CreationDraft.create({ userId: userOf(req), data: archetype ? archetypeDraft(archetype) : emptyDraft(level), step: archetype ? 'finish' : 'basics' })
   res.status(201).json(view(draft))
}

export async function getCreationDraft(req: Request, res: Response) {
   res.json(view(await findDraft(req)))
}

export async function updateCreationDraft(req: Request, res: Response) {
   const input = updateCreationDraftSchema.parse(req.body)
   const draft = await findDraft(req)
   const previous = creationDraftSchema.parse(draft.data) as CreationDraftData
   draft.data = rebaseDraftValues(previous, input.data as CreationDraftData)
   draft.step = input.step
   draft.markModified('data')
   await draft.save()
   res.json(view(draft))
}

export async function deleteCreationDraft(req: Request, res: Response) {
   const draft = await findDraft(req)
   await draft.deleteOne()
   res.status(204).end()
}

// Turns a complete draft into a hero. No transaction (the app runs without a replica set): if the stats cannot be saved,
// the new character is removed again.
export async function finishCreationDraft(req: Request, res: Response) {
   const userId = userOf(req)
   const draft = await findDraft(req)
   const data = creationDraftSchema.parse(draft.data) as CreationDraftData
   const ledger = creationLedger(data)
   if (ledger.violations.length) throw new BadRequestError(`The hero is not complete yet: ${ledger.violations.length} open points.`)
   const hero = finishedHero(data, ledger)
   const char = await Char.create({ ...hero.char, userId })
   try {
      const stats = new Stats({ ...hero.stats, userId, charId: char._id })
      await saveStats(stats)
   } catch (error) {
      await char.deleteOne()
      throw error
   }
   await draft.deleteOne()
   res.status(201).json({ charId: String(char._id) })
}
