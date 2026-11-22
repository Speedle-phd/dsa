import { randomInt } from 'node:crypto'
import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Char } from '@/models/char.model'
import { Encounter, type IEncounterDocument, type NpcValues } from '@/models/encounter.model'
import { NpcTemplate } from '@/models/npcTemplate.model'
import { Party, type IPartyDocument } from '@/models/party.model'
import { realtime } from '@/socket/realtime'
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '@/utils/appError'
import { canControlCombatant, clampPosition, damagePoints, initialsFor, npcGroupName, stepTurn, tokenAssignment } from '@/utils/encounterRules'
import { toRuleShape } from '@/utils/partyAccess'
import { canViewParty, partyRole, type PartyRole } from '@/utils/partyRules'
import { objectId } from '@/validations/partyValidation'
import { encounterView } from '@/views/encounterView'

const tiebreak = () => randomInt(1_000_000_000)

function userOf(req: Request) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   return req.user._id
}
function idParam(req: Request, key: string, message = 'Not found') {
   const parsed = objectId.safeParse(req.params[key])
   if (!parsed.success) throw new NotFoundError(message)
   return parsed.data
}

type Context = { party: IPartyDocument; viewerId: string; role: PartyRole }
// GM and accepted members of an active party; 404 for everyone else (no existence leak)
async function partyContext(req: Request): Promise<Context> {
   const viewerId = userOf(req)
   const party = await Party.findById(idParam(req, 'id', 'Party not found'))
   if (!party || !canViewParty(toRuleShape(party), viewerId)) throw new NotFoundError('Party not found')
   return { party, viewerId, role: partyRole(toRuleShape(party), viewerId) }
}
function requireGm(context: Context) {
   if (context.role !== 'gm') throw new ForbiddenError('Only the game master can do this.')
}
async function activeEncounter(partyId: unknown) {
   return Encounter.findOne({ partyId, status: 'active' })
}
async function requireEncounter(context: Context) {
   const encounter = await activeEncounter(context.party._id)
   if (!encounter) throw new NotFoundError('No fight is running.')
   return encounter
}

async function heroNames(encounter: IEncounterDocument) {
   const ids = encounter.combatants.filter((entry) => entry.kind === 'hero').map((entry) => entry.charId)
   const chars = await Char.find({ _id: { $in: ids } }).select('name')
   return new Map(chars.map((char) => [char._id.toString(), char.name]))
}
async function respond(res: Response, encounter: IEncounterDocument | null, context: Context, status = 200) {
   if (!encounter) return res.status(status).json({ encounter: null })
   res.status(status).json({ encounter: encounterView(encounter, context.viewerId, context.role, await heroNames(encounter)) })
}
function publish(partyId: unknown) {
   const id = String(partyId)
   realtime.toParty(id, { topic: 'encounter', partyId: id })
}
// Concurrent writers: a stale whole-document save becomes 409, the client refetches
async function saveEncounter(encounter: IEncounterDocument) {
   try {
      await encounter.save()
   } catch (error) {
      if (error instanceof mongoose.Error.VersionError) throw new ConflictError('The fight changed in the meantime. Try again.')
      throw error
   }
   publish(encounter.partyId)
}
function combatantOf(encounter: IEncounterDocument, req: Request) {
   const combatant = encounter.combatants.id(idParam(req, 'combatantId'))
   if (!combatant) throw new NotFoundError('Combatant not found')
   return combatant
}

function heroCombatant(member: { userId: unknown; charId: unknown; statsId: unknown }, name: string) {
   return { kind: 'hero' as const, userId: member.userId, charId: member.charId, statsId: member.statsId, name, group: name,
      initials: initialsFor(name), color: null, number: 0, initiative: null, initiativeBase: 0, tiebreak: tiebreak(), position: null, hidden: false, npc: null }
}

export async function getEncounter(req: Request, res: Response) {
   const context = await partyContext(req)
   await respond(res, await activeEncounter(context.party._id), context)
}

// The GM starts a fight with every accepted hero of the party
export async function startEncounter(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   if (await activeEncounter(context.party._id)) throw new ConflictError('A fight is already running.')
   const members = context.party.members.filter((member) => member.state === 'accepted')
   const chars = await Char.find({ _id: { $in: members.map((member) => member.charId) } }).select('name')
   const names = new Map(chars.map((char) => [char._id.toString(), char.name]))
   try {
      const encounter = await Encounter.create({
         partyId: context.party._id,
         board: { width: req.body.width ?? 20, height: req.body.height ?? 14 },
         combatants: members.map((member) => heroCombatant(member, names.get(String(member.charId)) ?? '?')),
      })
      publish(context.party._id)
      await respond(res, encounter, context, 201)
   } catch (error) {
      if ((error as { code?: number }).code === 11000) throw new ConflictError('A fight is already running.')
      throw error
   }
}

export async function endEncounter(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   const encounter = await requireEncounter(context)
   encounter.status = 'ended'
   await saveEncounter(encounter)
   await respond(res, null, context)
}

export async function addNpcs(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   const encounter = await requireEncounter(context)
   const { name, count, values, saveTemplate, hidden } = req.body as { name: string; count: number; values: Omit<NpcValues, 'health'>; saveTemplate: boolean; hidden: boolean }
   const group = npcGroupName(name) || name
   const { color, nextNumber } = tokenAssignment(encounter.combatants.map((entry) => ({ kind: entry.kind, group: entry.group, color: entry.color ?? null, number: entry.number })), group)
   if (encounter.combatants.length + count > 60) throw new BadRequestError('A fight can have at most 60 combatants.')
   for (let index = 0; index < count; index++) {
      const number = nextNumber + index
      encounter.combatants.push({ kind: 'npc', name: `${group} ${number}`, group, initials: initialsFor(group), color, number,
         initiative: null, initiativeBase: values.initiativeBase, tiebreak: tiebreak(), position: null, hidden,
         npc: { ...values, health: values.maxHealth } })
   }
   await saveEncounter(encounter)
   if (saveTemplate) {
      await NpcTemplate.findOneAndUpdate({ userId: context.viewerId, name: group }, { $set: { values } }, { upsert: true })
   }
   await respond(res, encounter, context, 201)
}

// GM: everything; a player: the INI of the own hero only
export async function updateCombatant(req: Request, res: Response) {
   const context = await partyContext(req)
   const encounter = await requireEncounter(context)
   const combatant = combatantOf(encounter, req)
   if (!canControlCombatant(context.role, context.viewerId, { kind: combatant.kind, userId: combatant.userId ? String(combatant.userId) : null })) {
      throw new NotFoundError('Combatant not found')
   }
   const body = req.body as { name?: string; hidden?: boolean; initiative?: number | null; initiativeBase?: number; values?: Partial<NpcValues> }
   if (context.role !== 'gm' && Object.keys(body).some((key) => key !== 'initiative' && key !== 'initiativeBase')) {
      throw new ForbiddenError('Players can only set the initiative of their own hero.')
   }
   if (body.name !== undefined && combatant.kind === 'npc') combatant.name = body.name
   if (body.hidden !== undefined && combatant.kind === 'npc') combatant.hidden = body.hidden
   if (body.initiative !== undefined) combatant.initiative = body.initiative
   if (body.initiativeBase !== undefined) combatant.initiativeBase = body.initiativeBase
   if (body.values && combatant.npc) {
      const npc = combatant.npc
      Object.assign(npc, body.values)
      npc.health = Math.min(npc.health, npc.maxHealth)
   }
   await saveEncounter(encounter)
   await respond(res, encounter, context)
}

// source: DSA5 Regelwerk, S. 226 (INI = Basiswert + 1W6). The GM rolls the NPCs at once.
export async function rollNpcInitiative(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   const encounter = await requireEncounter(context)
   for (const combatant of encounter.combatants) {
      if (combatant.kind !== 'npc' || (req.body.onlyMissing && combatant.initiative !== null && combatant.initiative !== undefined)) continue
      combatant.initiative = combatant.initiativeBase + randomInt(1, 7)
   }
   await saveEncounter(encounter)
   await respond(res, encounter, context)
}

// NPC hits: TP − RS (S. 230, 233); healing up to the maximum. Heroes take damage on their own sheet (effects path).
export async function damageCombatant(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   const encounter = await requireEncounter(context)
   const combatant = combatantOf(encounter, req)
   if (combatant.kind !== 'npc' || !combatant.npc) throw new BadRequestError('Damage heroes on their sheet (GM actions in the party).')
   const { direction, amount, ignoreArmor } = req.body as { direction: 'damage' | 'heal'; amount: number; ignoreArmor: boolean }
   const npc = combatant.npc
   npc.health = direction === 'damage'
      ? npc.health - damagePoints(amount, npc.armor, ignoreArmor)
      : Math.min(npc.maxHealth, npc.health + amount)
   await saveEncounter(encounter)
   await respond(res, encounter, context)
}

// A single atomic update, so the GM and players can move different tokens at the same time
export async function moveCombatant(req: Request, res: Response) {
   const context = await partyContext(req)
   const encounter = await requireEncounter(context)
   const combatant = combatantOf(encounter, req)
   if (!canControlCombatant(context.role, context.viewerId, { kind: combatant.kind, userId: combatant.userId ? String(combatant.userId) : null })) {
      throw new NotFoundError('Combatant not found')
   }
   const position = req.body.position as { x: number; y: number } | null
   if (position && !clampPosition(position, encounter.board)) throw new BadRequestError('This square is outside the board.')
   await Encounter.updateOne({ _id: encounter._id, 'combatants._id': combatant._id }, { $set: { 'combatants.$.position': position } })
   publish(encounter.partyId)
   const updated = await activeEncounter(context.party._id)
   await respond(res, updated, context)
}

export async function removeCombatant(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   const encounter = await requireEncounter(context)
   const combatant = combatantOf(encounter, req)
   encounter.combatants.pull(combatant._id)
   await saveEncounter(encounter)
   await respond(res, encounter, context)
}

export async function changeTurn(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   const encounter = await requireEncounter(context)
   const fighters = encounter.combatants.map((entry) => ({ id: String(entry._id), kind: entry.kind, name: entry.name,
      initiative: entry.initiative ?? null, initiativeBase: entry.initiativeBase, tiebreak: entry.tiebreak }))
   const next = stepTurn(fighters, encounter.activeId ? String(encounter.activeId) : null, encounter.round, req.body.direction)
   encounter.activeId = next.activeId ? new mongoose.Types.ObjectId(next.activeId) : null
   encounter.round = next.round
   await saveEncounter(encounter)
   await respond(res, encounter, context)
}

// Resizing drops tokens that no longer fit back to the tray
export async function resizeBoard(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   const encounter = await requireEncounter(context)
   encounter.board = { width: req.body.width, height: req.body.height }
   for (const combatant of encounter.combatants) {
      if (combatant.position && !clampPosition(combatant.position, encounter.board)) combatant.position = null
   }
   await saveEncounter(encounter)
   await respond(res, encounter, context)
}

// Party changes during a running fight (called by the party controller and the cleanup)
export async function addHeroToEncounter(partyId: unknown, member: { userId: unknown; charId: unknown; statsId: unknown }) {
   const encounter = await activeEncounter(partyId)
   if (!encounter || encounter.combatants.some((entry) => String(entry.charId) === String(member.charId))) return
   const char = await Char.findById(member.charId).select('name')
   await Encounter.updateOne({ _id: encounter._id }, { $push: { combatants: heroCombatant(member, char?.name ?? '?') } })
   publish(partyId)
}
export async function removeHeroFromEncounters(charId: unknown) {
   const encounters = await Encounter.find({ status: 'active', 'combatants.charId': charId }).select('partyId')
   if (!encounters.length) return
   await Encounter.updateMany({ status: 'active', 'combatants.charId': charId }, { $pull: { combatants: { charId } } })
   for (const encounter of encounters) publish(encounter.partyId)
}
export async function endPartyEncounters(partyId: unknown) {
   const result = await Encounter.updateMany({ partyId, status: 'active' }, { $set: { status: 'ended' } })
   if (result.modifiedCount) publish(partyId)
}

// NPC templates of the signed-in GM
export async function listNpcTemplates(req: Request, res: Response) {
   const templates = await NpcTemplate.find({ userId: userOf(req) }).sort({ name: 1 })
   res.json({ templates: templates.map((template) => ({ _id: String(template._id), name: template.name, values: template.values })) })
}
export async function saveNpcTemplate(req: Request, res: Response) {
   const template = await NpcTemplate.findOneAndUpdate({ userId: userOf(req), name: req.body.name }, { $set: { values: req.body.values } }, { upsert: true, new: true })
   res.status(201).json({ template: { _id: String(template._id), name: template.name, values: template.values } })
}
export async function deleteNpcTemplate(req: Request, res: Response) {
   const result = await NpcTemplate.deleteOne({ _id: idParam(req, 'templateId'), userId: userOf(req) })
   if (!result.deletedCount) throw new NotFoundError('Template not found')
   res.json({ ok: true })
}
