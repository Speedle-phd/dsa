import type { Request, Response } from 'express'
import { Char } from '@/models/char.model'
import { CheckRequest, type CheckResult, type ICheckRequestDocument } from '@/models/checkRequest.model'
import { realtime } from '@/socket/realtime'
import { BadRequestError, ConflictError, NotFoundError } from '@/utils/appError'
import { canAnswer, seesRequest } from '@/utils/checkRequestRules'
import { idParam, partyContext, requireGm, type PartyContext } from '@/utils/partyRequest'
import { checkRequestView, targetShapes } from '@/views/checkRequestView'

// GM asks chosen heroes for a check (user request, Nov 2026); players answer from any page, the GM sees results live
const maxOpen = 20
const closedShown = 20

function publish(partyId: unknown) {
   const id = String(partyId)
   realtime.toParty(id, { topic: 'checks', partyId: id })
}
async function heroNames(requests: ICheckRequestDocument[]) {
   const ids = [...new Set(requests.flatMap((request) => request.targets.map((target) => String(target.charId))))]
   const chars = await Char.find({ _id: { $in: ids } }).select('name')
   return new Map(chars.map((char) => [char._id.toString(), char.name]))
}
async function view(request: ICheckRequestDocument, context: PartyContext) {
   return checkRequestView(request, context.viewerId, context.role === 'gm', await heroNames([request]))
}

export async function listCheckRequests(req: Request, res: Response) {
   const context = await partyContext(req)
   const isGm = context.role === 'gm'
   const recent = (await CheckRequest.find({ partyId: context.party._id }).sort({ createdAt: -1 }).limit(100))
      .filter((request) => seesRequest(targetShapes(request), context.viewerId, isGm))
   const shown = [...recent.filter((request) => request.status === 'open'), ...recent.filter((request) => request.status === 'closed').slice(0, closedShown)]
   const names = await heroNames(shown)
   res.json({ requests: shown.map((request) => checkRequestView(request, context.viewerId, isGm, names)) })
}

export async function createCheckRequest(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   const body = req.body as { kind: 'attribute' | 'talent'; key: string; modifier: number; hidden: boolean; note: string; charIds: string[] }
   const members = new Map(context.party.members.filter((member) => member.state === 'accepted').map((member) => [String(member.charId), member]))
   const charIds = [...new Set(body.charIds)]
   if (charIds.some((charId) => !members.has(charId))) throw new BadRequestError('Choose heroes of this party.')
   if (await CheckRequest.countDocuments({ partyId: context.party._id, status: 'open' }) >= maxOpen) {
      throw new BadRequestError('Close older check requests first (at most 20 open).')
   }
   const request = await CheckRequest.create({
      partyId: context.party._id, gmUserId: context.viewerId, kind: body.kind, key: body.key, modifier: body.modifier, hidden: body.hidden, note: body.note,
      targets: charIds.map((charId) => ({ charId, userId: members.get(charId)!.userId })),
   })
   publish(context.party._id)
   res.status(201).json({ request: await view(request, context) })
}

// Answer for an own hero: one atomic update, so a parallel answer or the GM closing the request cannot be overwritten
async function answer(req: Request, res: Response, state: 'rolled' | 'declined', result: CheckResult | null) {
   const context = await partyContext(req)
   const requestId = idParam(req, 'requestId', 'Check request not found')
   const { charId } = req.body as { charId: string }
   const current = await CheckRequest.findOne({ _id: requestId, partyId: context.party._id })
   if (!current || !seesRequest(targetShapes(current), context.viewerId, context.role === 'gm')) throw new NotFoundError('Check request not found')
   if (!canAnswer(current.status, targetShapes(current), context.viewerId, charId)) throw new ConflictError('This check request is no longer open.')
   const updated = await CheckRequest.findOneAndUpdate(
      { _id: requestId, partyId: context.party._id, status: 'open', targets: { $elemMatch: { charId, userId: context.viewerId, state: 'open' } } },
      { $set: { 'targets.$.state': state, 'targets.$.result': result, 'targets.$.answeredAt': new Date() } },
      { new: true },
   )
   if (!updated) throw new ConflictError('This check request is no longer open.')
   publish(context.party._id)
   res.json({ request: await view(updated, context) })
}

export async function answerCheckRequest(req: Request, res: Response) {
   await answer(req, res, 'rolled', (req.body as { result: CheckResult }).result)
}

export async function declineCheckRequest(req: Request, res: Response) {
   await answer(req, res, 'declined', null)
}

export async function closeCheckRequest(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   const request = await CheckRequest.findOneAndUpdate({ _id: idParam(req, 'requestId', 'Check request not found'), partyId: context.party._id },
      { $set: { status: 'closed' } }, { new: true })
   if (!request) throw new NotFoundError('Check request not found')
   publish(context.party._id)
   res.json({ request: await view(request, context) })
}
