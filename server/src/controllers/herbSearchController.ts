import type { Request, Response } from 'express'
import { Char } from '@/models/char.model'
import { HerbFind, type IHerbFindDocument } from '@/models/herbFind.model'
import { Stats, type IStatsDocument } from '@/models/stats.model'
import { realtime } from '@/socket/realtime'
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '@/utils/appError'
import { bookContext } from '@/utils/bookContext'
import { purchaseEquipment } from '@/utils/equipmentPurchase'
import { herbByName, herbs } from '@/utils/herbs/herbCatalog'
import { canSearchFor, landscapeSuggestions, searchPlan, searchYield, type QualityUse, type SearchKind } from '@/utils/herbs/herbSearch'
import type { SearchLandscape } from '@/utils/herbs/herbTypes'
import { idParam, partyContext, requireGm, type PartyContext } from '@/utils/partyRequest'
import { findStatsForUser, saveStats } from '@/utils/statsPersistence'
import { buildStatResponse } from '@/views/statsView'

// Kräutersuche (AdK S. 275–278; Fokusregel I, switched on per party or solo hero). The player rolls Pflanzenkunde and
// Sinnesschärfe; the server checks the rule switch, computes the finds and puts them into the inventory.
const herbCategory = 'Archiv_der_Kraeuter'

function publish(partyId: unknown) {
   const id = String(partyId)
   realtime.toParty(id, { topic: 'herbs', partyId: id })
}

// Found plants are raw, picked on the current in-game day; stacks merge by day (equipmentPurchase, herbItem)
function addFinds(stat: IStatsDocument, finds: Array<{ name: string; amount: number }>, day: number | null) {
   let equipment = stat.toObject().equipment
   for (const find of finds) {
      const result = purchaseEquipment(stat.purse, equipment, {
         item: find.name, category: herbCategory, unitWeight: 0, amount: find.amount, carriedOn: 'Other', unitPriceSilbertaler: 0,
         herb: { form: 'raw', obtainedDay: day, keepsUntilDay: null },
      })
      if (!result.ok) throw new BadRequestError('The found plants could not be added.')
      equipment = result.equipment
   }
   stat.equipment = equipment as IStatsDocument['equipment']
}

const smallestApplications = (name: string) => herbByName(name)?.applications?.[0] ?? 1

export async function searchHerbs(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   const context = await bookContext(stat)
   if (!context.rules.herbSearch) throw new BadRequestError('The herb search (Archiv der Kräuter) is not switched on for this hero.')
   const body = req.body as { kind: SearchKind; landscape: SearchLandscape; plant?: string; plantCheck: { success: boolean; quality: number }
      use: QualityUse; hoursTaken?: number; sensesSuccess: boolean; picks?: string[] }
   const herb = body.kind === 'specific' ? herbByName(body.plant ?? '') : null
   if (body.kind === 'specific' && (!herb || !canSearchFor(herb, body.landscape))) throw new BadRequestError('This plant does not grow wild in this landscape.')
   const plan = searchPlan({ kind: body.kind, quality: body.plantCheck.quality, use: body.use, hoursTaken: body.hoursTaken })
   if ('error' in plan) throw new BadRequestError(plan.error)
   // source: AdK S. 276, 278 (a failed Pflanzenkunde or Sinnesschärfe check finds nothing that day)
   if (!body.plantCheck.success || !body.sensesSuccess) return res.json({ found: [], pending: null, hours: plan.hours, stats: buildStatResponse(stat).stats })

   const found = searchYield({ kind: body.kind, quality: body.plantCheck.quality, use: body.use, applications: herb?.applications })
   if (herb) {
      addFinds(stat, [{ name: herb.key, amount: found.applications ?? 1 }], context.calendarDay)
      await saveStats(stat)
      return res.json({ found: [{ name: herb.key, amount: found.applications ?? 1 }], pending: null, hours: plan.hours, stats: buildStatResponse(stat).stats })
   }
   // General search in a party: the GM picks the species (user decision, Nov 2026)
   if (context.source === 'party' && context.party) {
      const find = await HerbFind.create({ partyId: context.party._id, userId: req.user._id, charId: stat.charId, statsId: stat._id,
         landscape: body.landscape, count: found.species })
      publish(context.party._id)
      return res.json({ found: [], pending: { _id: String(find._id), count: found.species }, hours: plan.hours, stats: buildStatResponse(stat).stats })
   }
   // Without a party the player picks from the plants of the landscape
   const allowed = new Set(landscapeSuggestions(herbs, body.landscape).map((entry) => entry.key))
   const picks = [...new Set(body.picks ?? [])]
   if (!picks.length || picks.length > found.species || picks.some((name) => !allowed.has(name))) {
      throw new BadRequestError('Choose plants that grow in this landscape, at most as many as were found.')
   }
   const finds = picks.map((name) => ({ name, amount: smallestApplications(name) }))
   addFinds(stat, finds, context.calendarDay)
   await saveStats(stat)
   res.json({ found: finds, pending: null, hours: plan.hours, stats: buildStatResponse(stat).stats })
}

async function findView(find: IHerbFindDocument, names: Map<string, string>) {
   return {
      _id: String(find._id), charId: String(find.charId), heroName: names.get(String(find.charId)) ?? '?', landscape: find.landscape,
      count: find.count, status: find.status, picks: find.picks, createdAt: find.createdAt,
      // The GM's choice: plants of the landscape, most common first (AdK S. 261–266, 278)
      suggestions: find.status === 'open' ? landscapeSuggestions(herbs, find.landscape) : [],
   }
}
async function views(finds: IHerbFindDocument[]) {
   const chars = await Char.find({ _id: { $in: finds.map((find) => find.charId) } }).select('name')
   const names = new Map(chars.map((char) => [char._id.toString(), char.name]))
   return Promise.all(finds.map((find) => findView(find, names)))
}

// GM: all finds of the party; a player: the finds of their own heroes
export async function listHerbFinds(req: Request, res: Response) {
   const context = await partyContext(req)
   const filter = context.role === 'gm' ? { partyId: context.party._id } : { partyId: context.party._id, userId: context.viewerId }
   const finds = await HerbFind.find(filter).sort({ createdAt: -1 }).limit(30)
   res.json({ finds: await views(finds) })
}

async function openFind(req: Request, context: PartyContext) {
   const find = await HerbFind.findOne({ _id: idParam(req, 'findId', 'Herb find not found'), partyId: context.party._id })
   if (!find) throw new NotFoundError('Herb find not found')
   if (find.status !== 'open') throw new ConflictError('This find was already handled.')
   return find
}

export async function assignHerbFind(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   const find = await openFind(req, context)
   const allowed = new Set(landscapeSuggestions(herbs, find.landscape).map((entry) => entry.key))
   const picks = [...new Set((req.body as { picks: string[] }).picks)]
   if (picks.length > find.count || picks.some((name) => !allowed.has(name))) {
      throw new BadRequestError('Choose plants that grow in this landscape, at most as many as were found.')
   }
   const member = context.party.members.find((entry) => String(entry.statsId) === String(find.statsId) && entry.state === 'accepted')
   const stat = member ? await Stats.findById(find.statsId) : null
   if (!stat) throw new NotFoundError('The hero is no longer in this party.')
   // Claim the find first, so a second click cannot add the plants twice
   const claimed = await HerbFind.findOneAndUpdate({ _id: find._id, status: 'open' }, { status: 'assigned', picks }, { new: true })
   if (!claimed) throw new ConflictError('This find was already handled.')
   const day = context.party.calendarDay ?? null
   addFinds(stat, picks.map((name) => ({ name, amount: smallestApplications(name) })), day)
   await saveStats(stat)
   publish(context.party._id)
   res.json({ find: (await views([claimed]))[0] })
}

export async function dismissHerbFind(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   const find = await openFind(req, context)
   find.status = 'dismissed'
   await find.save()
   publish(context.party._id)
   res.json({ find: (await views([find]))[0] })
}
