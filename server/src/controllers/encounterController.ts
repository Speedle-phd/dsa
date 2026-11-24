import { randomInt } from 'node:crypto'
import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Char } from '@/models/char.model'
import { Companion } from '@/models/companion.model'
import { Summon } from '@/models/summon.model'
import { Encounter, type CombatRollRecord, type HeroPanel, type IEncounterDocument, type NpcValues } from '@/models/encounter.model'
import { NpcTemplate } from '@/models/npcTemplate.model'
import { Stats } from '@/models/stats.model'
import { realtime } from '@/socket/realtime'
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '@/utils/appError'
import { actionsLeft, leaderTargets, schrittFor, sideOf, squaresFor, turnDone, boardDistance, canControlCombatant, clampPosition, damagePoints, engagedWith, initialsFor, inMeleeReach, moveCost, npcGroupName, pathLength, previousDefenses, spend, stepTurn, tokenAssignment } from '@/utils/encounterRules'
import { bestiary } from '@/utils/bestiaryCatalog'
import { armorProtection } from '@/utils/armorEquipment'
import { adjustHealth } from '@/utils/combatRules'
import { heroSpeedFromStats } from '@/utils/heroSpeed'
import { publishHeroChange, saveStats } from '@/utils/statsPersistence'
import { fightOver, improvedCreature, vanishes } from '@/utils/summonRules'
import { buildStatResponse } from '@/views/statsView'
import { legacyFromWeapons, npcAttackTurn, npcPain, npcWeapons } from '@/utils/npcRules'
import { idParam, partyContext, requireGm, userOf, type PartyContext } from '@/utils/partyRequest'
import { encounterView } from '@/views/encounterView'

const tiebreak = () => randomInt(1_000_000_000)

type Context = PartyContext
async function activeEncounter(partyId: unknown) {
   return Encounter.findOne({ partyId, status: 'active' })
}
// The running fight, or (GM routes under /encounters/:encounterId) one of the GM's prepared fights
async function requireEncounter(context: Context, req: Request) {
   if (req.params.encounterId) {
      requireGm(context)
      const prepared = await Encounter.findOne({ _id: idParam(req, 'encounterId', 'Fight not found'), partyId: context.party._id, status: 'prepared' })
      if (!prepared) throw new NotFoundError('Fight not found')
      return prepared
   }
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
   // Settled attacks stay only briefly (the log keeps the history)
   const settled = encounter.attacks.filter((attack) => attack.status !== 'pending' && attack.status !== 'damage')
   for (const attack of settled.slice(0, Math.max(0, settled.length - 20))) encounter.attacks.pull(attack._id)
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

// Shared fight log, newest last, capped. `gmValues` carry NPC values that players do not see.
const logLimit = 150
function addLog(encounter: IEncounterDocument, key: string, values: Record<string, string | number>, gm?: { key: string; values: Record<string, string | number> }) {
   encounter.log.push({ round: encounter.round, key, values, gmKey: gm?.key ?? null, gmValues: gm?.values ?? null, createdAt: new Date() })
   if (encounter.log.length > logLimit) encounter.log.splice(0, encounter.log.length - logLimit)
}
const succeeded = (roll: CombatRollRecord) => ['success', 'critical', 'criticalUnconfirmed'].includes(roll.outcome)
const rollText = (roll: CombatRollRecord) => `${roll.roll}${roll.confirmation ? `/${roll.confirmation}` : ''}`

function heroCombatant(member: { userId: unknown; charId: unknown; statsId: unknown }, name: string) {
   return { kind: 'hero' as const, userId: member.userId, charId: member.charId, statsId: member.statsId, name, group: name,
      initials: initialsFor(name), color: null, number: 0, initiative: null, initiativeBase: 0, tiebreak: tiebreak(), position: null, hidden: false, npc: null }
}

type CombatantDoc = IEncounterDocument['combatants'][number]
const isDown = (entry: CombatantDoc) => entry.kind === 'npc' && !!entry.npc && entry.npc.health <= 0
// source: DSA5 Regelwerk, S. 34 (Schmerz IV: unable to act) — such an NPC's turn is skipped like a downed one
const cannotAct = (entry: CombatantDoc) => isDown(entry) ||
   (entry.kind === 'npc' && !!entry.npc && npcPain(entry.npc.health, entry.npc.maxHealth, entry.npc.sheet?.painThresholds) >= 4)
const controls = (context: Context, entry: CombatantDoc) =>
   canControlCombatant(context.role, context.viewerId, { kind: entry.kind, userId: entry.userId ? String(entry.userId) : null })
const isActive = (encounter: IEncounterDocument, entry: CombatantDoc) => !!encounter.activeId && String(encounter.activeId) === String(entry._id)

// Turn flow (user decision, Nov 2026): only the active combatant acts, an open attack locks the fight until it is defended
function openAttack(encounter: IEncounterDocument) {
   return encounter.attacks.find((attack) => attack.status === 'pending' || attack.status === 'damage') ?? null
}
function requireNoOpenAttack(encounter: IEncounterDocument) {
   if (openAttack(encounter)) throw new ConflictError('Wait until the open attack is defended.')
}
function requireTurn(encounter: IEncounterDocument, entry: CombatantDoc) {
   if (encounter.round < 1 || !isActive(encounter, entry)) throw new BadRequestError('It is not this combatant\'s turn.')
}
// Next combatant in INI order; downed opponents are skipped
function step(encounter: IEncounterDocument, direction: 'next' | 'previous') {
   const fighters = encounter.combatants.map((entry) => ({ id: String(entry._id), kind: entry.kind, name: entry.name,
      initiative: entry.initiative ?? null, initiativeBase: entry.initiativeBase, tiebreak: entry.tiebreak, down: cannotAct(entry) }))
   let next = { activeId: encounter.activeId ? String(encounter.activeId) : null, round: encounter.round }
   for (let guard = 0; guard <= fighters.length; guard++) {
      next = stepTurn(fighters, next.activeId, next.round, direction)
      if (!fighters.find((entry) => entry.id === next.activeId)?.down) break
   }
   if (next.round !== encounter.round) {
      encounter.round = next.round
      addLog(encounter, 'Combat round {round} begins', { round: next.round })
      // App choice: an unused Passierschlag expires after the following Kampfrunde
      encounter.passingGrants = (encounter.passingGrants ?? []).filter((grant) => grant.round >= next.round - 1)
   }
   encounter.activeId = next.activeId ? new mongoose.Types.ObjectId(next.activeId) : null
   const active = next.activeId ? encounter.combatants.id(next.activeId) : null
   if (active && encounter.round >= 1) active.lastTurn = { round: encounter.round, squares: 0 }
}
// Movement on the own turn counts for the ranged modifiers (S. 242)
function countMove(encounter: IEncounterDocument, entry: CombatantDoc, from: { x: number; y: number } | null | undefined, to: { x: number; y: number } | null) {
   if (encounter.round < 1 || !isActive(encounter, entry) || !from || from.x === undefined || !to) return
   const blocked = new Set(encounter.obstacles.map((cell) => `${cell.x}:${cell.y}`))
   const squares = schrittFor(pathLength(encounter.board, blocked, from, to, encounter.board.width * encounter.board.height) ?? boardDistance(from, to) ?? 0, encounter.board.scale ?? 1)
   const current = entry.lastTurn && entry.lastTurn.round === encounter.round ? entry.lastTurn.squares : 0
   entry.lastTurn = { round: encounter.round, squares: current + squares }
}
// Using the action ends the turn once no defense is open (user decision: "after the action + End turn button")
function finishIfDone(encounter: IEncounterDocument, entry: CombatantDoc | null | undefined) {
   if (!entry || !isActive(encounter, entry) || openAttack(encounter)) return
   if (turnDone(entry.turn, encounter.round)) step(encounter, 'next')
}
function engagedOf(encounter: IEncounterDocument, entry: CombatantDoc) {
   return engagedWith(String(entry._id), encounter.round,
      encounter.combatants.map((item) => ({ id: String(item._id), position: item.position && item.position.x !== undefined ? item.position : null })),
      encounter.attacks.map((attack) => ({ attackerId: String(attack.attackerId), targetId: String(attack.targetId), round: attack.round, status: attack.status })))
}
async function heroSpeed(entry: CombatantDoc) {
   if (entry.kind === 'ally') return entry.speed ?? null
   const [stats, char] = await Promise.all([Stats.findById(entry.statsId), Char.findById(entry.charId).select('species')])
   return stats ? heroSpeedFromStats(stats, char?.species ?? '') : null
}

export async function getPreparedEncounter(req: Request, res: Response) {
   const context = await partyContext(req)
   await respond(res, await requireEncounter(context, req), context)
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
   const encounter = await requireEncounter(context, req)
   // User decision (Nov 2026): an ended fight is deleted with its board, attacks and log, nothing carries over
   await releaseSummons(encounter)
   await Encounter.deleteOne({ _id: encounter._id })
   publish(encounter.partyId)
   await respond(res, null, context)
}

export async function addNpcs(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   const encounter = await requireEncounter(context, req)
   const body = req.body as { name: string; count: number; values: Omit<NpcValues, 'health'>; saveTemplate: boolean; hidden: boolean }
   const { name, count, saveTemplate, hidden } = body
   // A full stat block also fills the flat AT/PA/TP the older screens read (first melee weapon)
   const values = body.values.sheet?.weapons.length ? { ...body.values, ...legacyFromWeapons(body.values.sheet.weapons) } : body.values
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
      await NpcTemplate.findOneAndUpdate({ userId: context.viewerId, name: group }, { $set: { values }, $setOnInsert: { source: 'manual', tags: [] } }, { upsert: true })
   }
   await respond(res, encounter, context, 201)
}

// GM: everything; a player: the INI of the own hero only
export async function updateCombatant(req: Request, res: Response) {
   const context = await partyContext(req)
   const encounter = await requireEncounter(context, req)
   const combatant = combatantOf(encounter, req)
   if (!canControlCombatant(context.role, context.viewerId, { kind: combatant.kind, userId: combatant.userId ? String(combatant.userId) : null })) {
      throw new NotFoundError('Combatant not found')
   }
   const body = req.body as { name?: string; hidden?: boolean; initiative?: number | null; initiativeBase?: number; values?: Partial<NpcValues> }
   if (context.role !== 'gm' && Object.keys(body).some((key) => !['initiative', 'initiativeBase'].includes(key))) {
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
   const encounter = await requireEncounter(context, req)
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
   const encounter = await requireEncounter(context, req)
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
   const encounter = await requireEncounter(context, req)
   const combatant = combatantOf(encounter, req)
   if (!canControlCombatant(context.role, context.viewerId, { kind: combatant.kind, userId: combatant.userId ? String(combatant.userId) : null })) {
      throw new NotFoundError('Combatant not found')
   }
   const position = req.body.position as { x: number; y: number } | null
   if (position) {
      if (!clampPosition(position, encounter.board)) throw new BadRequestError('This square is outside the board.')
      if (encounter.obstacles.some((cell) => cell.x === position.x && cell.y === position.y)) throw new BadRequestError('This square is blocked by terrain.')
      if (encounter.combatants.some((entry) => String(entry._id) !== String(combatant._id) && entry.position?.x === position.x && entry.position?.y === position.y)) {
         throw new BadRequestError('This square is taken.')
      }
   }
   // The GM moves freely, and before the first round everyone sets up freely
   if ((context.role === 'gm' || encounter.round < 1) && !(encounter.round >= 1 && isActive(encounter, combatant))) {
      await Encounter.updateOne({ _id: encounter._id, 'combatants._id': combatant._id }, { $set: { 'combatants.$.position': position } })
      publish(encounter.partyId)
      await respond(res, await Encounter.findById(encounter._id), context)
      return
   }
   // The GM moves the active combatant freely; the movement still counts for ranged modifiers
   if (context.role === 'gm') {
      countMove(encounter, combatant, combatant.position, position)
      combatant.position = position
      await saveEncounter(encounter)
      await respond(res, encounter, context)
      return
   }
   // Players during the fight: on the own turn, up to GS squares per move (S. 228–229), around terrain
   requireTurn(encounter, combatant)
   requireNoOpenAttack(encounter)
   if (!position) throw new ForbiddenError('Only the game master can take a token off the board during the fight.')
   if (combatant.position && combatant.position.x !== undefined) {
      const current = combatant.turn && combatant.turn.round === encounter.round ? combatant.turn : null
      const bonus = current?.bonus ?? 0
      const cost = bonus ? null : moveCost(combatant.turn, encounter.round)
      if (!bonus && !cost) throw new BadRequestError('No action left to move this round.')
      const speed = bonus || await heroSpeed(combatant)
      const blocked = new Set(encounter.obstacles.map((cell) => `${cell.x}:${cell.y}`))
      const limit = speed === null ? encounter.board.width * encounter.board.height : squaresFor(speed, encounter.board.scale ?? 1)
      if (pathLength(encounter.board, blocked, combatant.position, position, limit) === null) {
         throw new BadRequestError('This square is out of reach (GS) or cut off by terrain.')
      }
      if (cost) combatant.turn = spend(combatant.turn, encounter.round, cost)
      else if (current) combatant.turn = { ...current, bonus: 0 }
      addLog(encounter, !cost ? '{name} flees' : cost === 'free' ? '{name} moves' : '{name} sprints', { name: combatant.name })
      countMove(encounter, combatant, combatant.position, position)
   }
   combatant.position = position
   finishIfDone(encounter, combatant)
   await saveEncounter(encounter)
   await respond(res, encounter, context)
}

export async function removeCombatant(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   const encounter = await requireEncounter(context, req)
   const combatant = combatantOf(encounter, req)
   encounter.combatants.pull(combatant._id)
   await saveEncounter(encounter)
   await respond(res, encounter, context)
}

export async function changeTurn(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   const encounter = await requireEncounter(context, req)
   requireNoOpenAttack(encounter)
   // source: DSA5 Regelwerk, S. 226 (INI is rolled before the fight); user decision: the fight begins only when everyone has it
   if (!encounter.activeId) {
      const missing = encounter.combatants.filter((entry) => entry.initiative === null || entry.initiative === undefined)
      if (missing.length) throw new ConflictError(`Every combatant needs an INI first: ${missing.map((entry) => entry.name).join(', ')}.`)
   }
   step(encounter, req.body.direction)
   await saveEncounter(encounter)
   await respond(res, encounter, context)
}

// The active combatant's player (or the GM) ends the turn, e.g. to skip the free action
export async function endTurn(req: Request, res: Response) {
   const context = await partyContext(req)
   const encounter = await requireEncounter(context, req)
   const active = encounter.activeId ? encounter.combatants.id(encounter.activeId) : null
   if (!active || encounter.round < 1) throw new BadRequestError('The fight has not begun yet.')
   if (!controls(context, active)) throw new ForbiddenError('It is not your turn.')
   requireNoOpenAttack(encounter)
   addLog(encounter, '{name} ends the turn', { name: active.name })
   step(encounter, 'next')
   await saveEncounter(encounter)
   await respond(res, encounter, context)
}

// The GM paints terrain: a kind sets the square, null clears it. Squares with a token stay free.
export async function setObstacles(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   const encounter = await requireEncounter(context, req)
   const cells = req.body.cells as Array<{ x: number; y: number; kind: string | null }>
   const taken = new Set(encounter.combatants.filter((entry) => entry.position && entry.position.x !== undefined).map((entry) => `${entry.position!.x}:${entry.position!.y}`))
   const map = new Map(encounter.obstacles.map((cell) => [`${cell.x}:${cell.y}`, { x: cell.x, y: cell.y, kind: cell.kind }]))
   for (const cell of cells) {
      const key = `${cell.x}:${cell.y}`
      if (!cell.kind) map.delete(key)
      else if (!taken.has(key) && clampPosition(cell, encounter.board)) map.set(key, { x: cell.x, y: cell.y, kind: cell.kind })
   }
   encounter.obstacles = [...map.values()]
   await saveEncounter(encounter)
   await respond(res, encounter, context)
}

// Resizing drops tokens that no longer fit back to the tray
export async function resizeBoard(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   const encounter = await requireEncounter(context, req)
   encounter.board = { width: req.body.width, height: req.body.height, scale: req.body.scale ?? encounter.board.scale ?? 1 }
   for (const combatant of encounter.combatants) {
      if (combatant.position && !clampPosition(combatant.position, encounter.board)) combatant.position = null
   }
   encounter.obstacles = encounter.obstacles.filter((cell) => clampPosition(cell, encounter.board))
   await saveEncounter(encounter)
   await respond(res, encounter, context)
}

// Party changes during a running fight (called by the party controller and the cleanup)
export async function addHeroToEncounter(partyId: unknown, member: { userId: unknown; charId: unknown; statsId: unknown }) {
   const encounter = await activeEncounter(partyId)
   if (!encounter || encounter.combatants.some((entry) => entry.kind === 'hero' && String(entry.charId) === String(member.charId))) return
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
// source: DSA5 Regelwerk, S. 265 (the service Kampf ends with the fight; without services left the creature leaves)
// Same as "Release from the fight" on the Bestiarium card (user decision, Nov 2026).
async function releaseSummons(encounter: IEncounterDocument) {
   for (const ally of encounter.combatants) {
      const source = ally.source
      if (ally.kind !== 'ally' || source?.kind !== 'summon' || !source.id || !mongoose.isValidObjectId(source.id)) continue
      const summon = await Summon.findOne({ _id: source.id, statsId: ally.statsId })
      if (!summon) continue
      const next = fightOver({ services: summon.services, task: summon.task ?? null })
      if (vanishes(next)) await summon.deleteOne()
      else {
         summon.set(next)
         await summon.save()
      }
      await publishHeroChange({ _id: ally.statsId as mongoose.Types.ObjectId, userId: ally.userId as mongoose.Types.ObjectId, charId: ally.charId as mongoose.Types.ObjectId })
   }
}

export async function endPartyEncounters(partyId: unknown) {
   for (const encounter of await Encounter.find({ partyId, status: 'active' })) await releaseSummons(encounter)
   const result = await Encounter.deleteMany({ partyId, status: { $in: ['active', 'prepared', 'ended'] } })
   if (result.deletedCount) publish(partyId)
}

// Allies of a hero join with their own INI and token (user decision, Nov 2026). Idempotent per panel ally id.
export async function addAlly(req: Request, res: Response) {
   const context = await partyContext(req)
   const encounter = await requireEncounter(context, req)
   const { heroId, key, name, initiative, initiativeBase, speed, armor, source } = req.body as { heroId: string; key: string; name: string; initiative: number; initiativeBase: number
      speed: number | null; armor: number; source: { kind: 'companion' | 'summon' | 'radau'; id?: string } | null }
   const hero = encounter.combatants.id(heroId)
   if (!hero || hero.kind !== 'hero' || !controls(context, hero)) throw new NotFoundError('Combatant not found')
   if (!encounter.combatants.some((entry) => entry.kind === 'ally' && String(entry.ownerId) === String(hero._id) && entry.allyKey === key)) {
      if (encounter.combatants.length >= 60) throw new BadRequestError('A fight can have at most 60 combatants.')
      encounter.combatants.push({ kind: 'ally', userId: hero.userId, charId: hero.charId, statsId: hero.statsId, ownerId: hero._id, allyKey: key, speed, armor, source,
         name, group: name, initials: initialsFor(name), color: null, number: 0, initiative, initiativeBase, tiebreak: tiebreak(), position: null, hidden: false, npc: null })
      addLog(encounter, '{name} joins the fight', { name })
      await saveEncounter(encounter)
   }
   await respond(res, encounter, context, 201)
}

export async function removeAlly(req: Request, res: Response) {
   const context = await partyContext(req)
   const encounter = await requireEncounter(context, req)
   const ally = combatantOf(encounter, req)
   if (ally.kind !== 'ally' || !controls(context, ally)) throw new NotFoundError('Combatant not found')
   for (const attack of encounter.attacks) {
      if (attack.status === 'pending' && (String(attack.attackerId) === String(ally._id) || String(attack.targetId) === String(ally._id))) attack.status = 'cancelled'
   }
   if (isActive(encounter, ally)) step(encounter, 'next')
   addLog(encounter, '{name} leaves the fight', { name: ally.name })
   encounter.combatants.pull(ally._id)
   await saveEncounter(encounter)
   await respond(res, encounter, context)
}

// Casting, loading, aiming, Flucht and other turn-bound actions (user decision: everything counts on the shared turn)
export async function spendAction(req: Request, res: Response) {
   const context = await partyContext(req)
   const encounter = await requireEncounter(context, req)
   const combatant = combatantOf(encounter, req)
   if (!controls(context, combatant)) throw new NotFoundError('Combatant not found')
   requireTurn(encounter, combatant)
   requireNoOpenAttack(encounter)
   const { kind, label, detail, move, leader } = req.body as { kind: 'action' | 'free'; label: string; detail: string; move?: number
      leader?: { quality: number; targetIds: string[] } }
   const left = actionsLeft(combatant.turn, encounter.round)
   // source: DSA5 Regelwerk, S. 228 (1 action + 1 free action per KR)
   if (!left[kind]) throw new BadRequestError(kind === 'action' ? 'The action of this round is already used.' : 'The free action of this round is already used.')
   // Anführer (S. 215): the action and the bonus for the chosen allies in the next KR go in one write
   if (leader) {
      if (kind !== 'action') throw new BadRequestError('Anführer costs an action.')
      const visible = encounter.combatants.filter((entry) => context.role === 'gm' || !entry.hidden)
      const granted = leaderTargets({ id: String(combatant._id), kind: combatant.kind }, visible.map((entry) => ({ id: String(entry._id), kind: entry.kind, down: cannotAct(entry) })),
         leader.targetIds, leader.quality)
      if ('error' in granted) throw new BadRequestError(granted.error)
      for (const id of granted.ids) {
         const target = encounter.combatants.id(id)
         if (target) target.leaderRound = encounter.round + 1
      }
   }
   combatant.turn = { ...spend(combatant.turn, encounter.round, kind), ...(move ? { bonus: move } : {}) }
   addLog(encounter, '{name}: {action}{detail}', { name: combatant.name, action: label, detail: detail ? ` · ${detail}` : '' })
   finishIfDone(encounter, combatant)
   await saveEncounter(encounter)
   await respond(res, encounter, context)
}

// The player's panel copy for the GM overview (user request, Nov 2026): own hero only, an atomic write that does not
// touch the fight's version (no 409 for the GM's parallel changes)
export async function updatePanel(req: Request, res: Response) {
   const context = await partyContext(req)
   const encounter = await activeEncounter(context.party._id)
   if (!encounter) throw new NotFoundError('No fight is running.')
   const combatant = combatantOf(encounter, req)
   if (combatant.kind !== 'hero' || String(combatant.userId) !== context.viewerId) throw new NotFoundError('Combatant not found')
   await Encounter.updateOne({ _id: encounter._id, 'combatants._id': combatant._id }, { $set: { 'combatants.$.panel': req.body as HeroPanel } })
   publish(encounter.partyId)
   res.status(204).end()
}


// An attack between the sides (user decisions, Nov 2026): the attacker rolls AT/FK; a success waits for the defender's roll
// (PA/AW/VW through the GM for NPCs, through the owner for heroes and allies); only after a failed defense the attacker
// rolls the damage, and the server applies SP = TP − RS (S. 230, 233). A Passierschlag skips the defense (S. 237).
export async function submitAttack(req: Request, res: Response) {
   const context = await partyContext(req)
   const encounter = await requireEncounter(context, req)
   const { attackerId, targetId, incoming, attack, reach, passing, dual, dice, defenseModifier, weapon: weaponName } = req.body as { attackerId: string; targetId: string; incoming: 'melee' | 'shot' | 'thrown'
      attack: CombatRollRecord; reach: 'short' | 'medium' | 'long'; passing: boolean; dual: 'first' | 'second' | null; dice: { count: number; sides: number; bonus: number } | null
      defenseModifier: number; weapon: string | null }
   const attacker = encounter.combatants.id(attackerId)
   const target = encounter.combatants.id(targetId)
   if (!attacker || !controls(context, attacker)) throw new NotFoundError('Combatant not found')
   // Players cannot target what they cannot see
   if (!target || (target.hidden && context.role !== 'gm')) throw new NotFoundError('Target not found')
   if (sideOf(attacker.kind) === sideOf(target.kind)) throw new BadRequestError('Heroes attack opponents and opponents attack heroes.')
   if (isDown(target)) throw new BadRequestError('This opponent is already down.')
   requireNoOpenAttack(encounter)
   if (passing) {
      // source: DSA5 Regelwerk, S. 237 (Passierschlag: a melee attack without an action, any number per KR, outside the own turn)
      if (incoming !== 'melee' || dual) throw new BadRequestError('A Passierschlag is a single melee attack.')
      if (encounter.round < 1) throw new BadRequestError('The fight has not begun yet.')
      const grants = encounter.passingGrants ?? []
      const grant = grants.findIndex((entry) => String(entry.combatantId) === String(attacker._id) && String(entry.targetId) === String(target._id))
      if (grant < 0 && context.role !== 'gm') throw new BadRequestError('No Passierschlag against this opponent right now (S. 237).')
      if (grant >= 0) encounter.passingGrants = grants.filter((_entry, index) => index !== grant)
   } else {
      requireTurn(encounter, attacker)
      const current = attacker.turn && attacker.turn.round === encounter.round ? attacker.turn : null
      // source: DSA5 Regelwerk, S. 354 (creatures: "Aktionen: 2", per-attack limits such as "max. 1 × Biss")
      const maxActions = attacker.kind === 'npc' ? Math.max(1, attacker.npc?.sheet?.actions ?? 1) : 1
      if (maxActions > 1 && dual !== 'second') {
         const next = npcAttackTurn(current, encounter.round, maxActions, attacker.npc ? npcWeapons(attacker.npc) : [], weaponName)
         if ('error' in next) throw new BadRequestError(next.error)
         attacker.turn = next.turn
      } else if (dual === 'second') {
         // source: DSA5 Regelwerk, S. 238 (both strikes of a two-weapon attack share one action)
         if (!current?.dual) throw new BadRequestError('There is no open second strike.')
         attacker.turn = { ...current, dual: false }
      } else {
         // source: DSA5 Regelwerk, S. 228 (an attack is the action of the Kampfrunde)
         if (!actionsLeft(attacker.turn, encounter.round).action) throw new BadRequestError('The action of this round is already used.')
         attacker.turn = { ...spend(attacker.turn, encounter.round, 'action'), dual: dual === 'first' }
      }
   }
   if (incoming === 'melee' && !inMeleeReach(attacker.position, target.position, reach)) {
      throw new BadRequestError(reach === 'long' ? 'A long weapon reaches 2 squares (diagonals count).' : 'A melee attack needs the target on a neighbouring square (diagonals count).')
   }
   if (incoming !== 'melee' && engagedOf(encounter, attacker).length) throw new BadRequestError('In melee: no ranged attacks (S. 241).')
   // An ambusher that attacks is revealed
   if (attacker.hidden) {
      attacker.hidden = false
      addLog(encounter, '{name} appears', { name: attacker.name })
   }
   const success = succeeded(attack)
   // source: DSA5 Regelwerk, S. 231 (a critical attack, confirmed or not, halves the defense)
   const critical = !passing && (attack.outcome === 'critical' || attack.outcome === 'criticalUnconfirmed')
   const weapon = passing ? `${attack.label} · Passierschlag` : attack.label
   addLog(encounter, '{attacker} attacks {target} ({weapon}): {outcome}', { attacker: attacker.name, target: target.name, weapon, outcome: attack.outcome },
      { key: '{attacker} attacks {target} ({weapon}): W20 {roll} vs {value} → {outcome}', values: { attacker: attacker.name, target: target.name, weapon, roll: rollText(attack), value: attack.target, outcome: attack.outcome } })
   if (success) {
      encounter.attacks.push({ attackerId: attacker._id, targetId: target._id, incoming, attack, critical, passing, tp: 0, dice, halved: false, defenseModifier,
         status: passing ? 'damage' : 'pending', defense: null, sp: null, round: encounter.round, createdAt: new Date() })
   }
   finishIfDone(encounter, attacker)
   await saveEncounter(encounter)
   await respond(res, encounter, context, 201)
}

export async function resolveDefense(req: Request, res: Response) {
   const context = await partyContext(req)
   const encounter = await requireEncounter(context, req)
   const pending = encounter.attacks.id(idParam(req, 'attackId'))
   if (!pending || pending.status !== 'pending') throw new NotFoundError('This attack is no longer open.')
   const target = encounter.combatants.id(pending.targetId)
   const attacker = encounter.combatants.id(pending.attackerId)
   if (!target) throw new NotFoundError('Target not found')
   // NPCs defend through the GM, heroes and allies through their owner
   const allowed = target.kind === 'npc' ? context.role === 'gm' : controls(context, target)
   if (!allowed) throw new NotFoundError('This attack is no longer open.')
   const { defense, halved } = req.body as { defense: CombatRollRecord | null; halved: boolean }
   const defended = defense !== null && succeeded(defense)
   if (defense) target.defenses = { round: encounter.round, count: previousDefenses(target.defenses, encounter.round) + 1 }
   // source: DSA5 Regelwerk, S. 237 (a critical success of the defender's parry allows a Passierschlag)
   if (defense?.outcome === 'critical' && defense.label.startsWith('PA') && pending.incoming === 'melee' && attacker && target.kind !== 'npc') {
      encounter.passingGrants = [...(encounter.passingGrants ?? []), { combatantId: target._id, targetId: attacker._id, reason: 'parry', round: encounter.round }]
      addLog(encounter, '{name} may strike a Passierschlag against {target} (critical parry)', { name: target.name, target: attacker.name })
   }
   pending.defense = defense
   pending.halved = halved
   // A failed defense hands the damage roll back to the attacker
   pending.status = defended ? 'defended' : 'damage'
   const names = { attacker: attacker?.name ?? '?', target: target.name }
   if (defense) {
      addLog(encounter, '{target} defends ({defense}): {outcome}', { ...names, defense: defense.label, outcome: defense.outcome },
         { key: '{target} defends ({defense}): W20 {roll} vs {value} → {outcome}', values: { ...names, defense: defense.label, roll: rollText(defense), value: defense.target, outcome: defense.outcome } })
   } else {
      addLog(encounter, '{target} cannot defend', names)
   }
   if (defended) finishIfDone(encounter, attacker)
   await saveEncounter(encounter)
   await respond(res, encounter, context)
}

// The GM grants a Passierschlag (fleeing opponent, failed manoeuvre, running through the reach, S. 237)
export async function grantPassing(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   const encounter = await requireEncounter(context, req)
   const { combatantId, targetId } = req.body as { combatantId: string; targetId: string }
   const combatant = encounter.combatants.id(combatantId)
   const target = encounter.combatants.id(targetId)
   if (!combatant || !target || combatant.kind === 'npc' || target.kind !== 'npc') throw new NotFoundError('Combatant not found')
   encounter.passingGrants = [...(encounter.passingGrants ?? []), { combatantId: combatant._id, targetId: target._id, reason: 'gm', round: encounter.round }]
   addLog(encounter, '{name} may strike a Passierschlag against {target}', { name: combatant.name, target: target.name })
   await saveEncounter(encounter)
   await respond(res, encounter, context)
}

// LeP of an ally's record (companion or summon); Radau is unbreakable while the spell lasts (S. 297)
async function woundAlly(ally: CombatantDoc, sp: number) {
   const source = ally.source
   if (!source || source.kind === 'radau' || !source.id || sp <= 0 || !mongoose.isValidObjectId(source.id)) return null
   if (source.kind === 'companion') {
      const companion = await Companion.findOne({ _id: source.id, statsId: ally.statsId })
      if (!companion) return null
      const before = companion.health.current
      companion.health.current = Math.max(0, before - sp)
      await companion.save()
      return { before, after: companion.health.current }
   }
   const summon = await Summon.findOne({ _id: source.id, statsId: ally.statsId })
   const creature = summon ? bestiary.find((entry) => entry.key === summon.creature) : undefined
   if (!summon || !creature) return null
   const before = summon.health ?? improvedCreature(creature, summon.improvements).health
   summon.health = Math.max(0, before - sp)
   await summon.save()
   return { before, after: summon.health }
}

// The attacker's damage after a failed defense: SP = TP − RS on the target (S. 230, 233; ½ TP first for demons and
// elementals hit by mundane weapons, S. 355, 358). Heroes lose LeP on their sheet, allies on their record.
export async function rollAttackDamage(req: Request, res: Response) {
   const context = await partyContext(req)
   const encounter = await requireEncounter(context, req)
   const pending = encounter.attacks.id(idParam(req, 'attackId'))
   if (!pending || pending.status !== 'damage') throw new NotFoundError('This attack is no longer open.')
   const attacker = encounter.combatants.id(pending.attackerId)
   const target = encounter.combatants.id(pending.targetId)
   if (!attacker || !controls(context, attacker)) throw new NotFoundError('This attack is no longer open.')
   if (!target) throw new NotFoundError('Target not found')
   const tp = (req.body as { tp: number }).tp
   const names = { attacker: attacker.name, target: target.name }
   pending.tp = tp
   pending.status = 'hit'
   if (target.kind === 'npc' && target.npc) {
      const points = damagePoints(tp, target.npc.armor)
      const before = target.npc.health
      target.npc.health -= points
      pending.sp = points
      addLog(encounter, '{target} is hit: {sp} SP', { ...names, sp: points },
         { key: '{target} is hit: {tp} TP − RS {rs} = {sp} SP (LeP {before} → {after})', values: { ...names, tp, rs: target.npc.armor, sp: points, before, after: target.npc.health } })
   } else {
      // Heroes: RS of the worn armor (S. 374) read on the server; allies: the RS sent when they joined
      const stat = target.kind === 'hero' ? await Stats.findById(target.statsId) : null
      const rs = stat ? armorProtection(buildStatResponse(stat).stats.checkModifiers.armor) : target.armor ?? 0
      const points = damagePoints(target.kind === 'ally' && pending.halved ? Math.ceil(tp / 2) : tp, rs)
      pending.sp = points
      pending.rs = rs
      if (target.kind === 'hero' && points > 0) {
         const result = stat ? adjustHealth(stat.health.current, stat.health.max, 'damage', points) : null
         if (stat && result?.ok) {
            const before = stat.health.current
            // source: DSA5 Regelwerk, S. 171 (Blutrausch triggers when an attack causes a level of Schmerz)
            pending.painRaised = result.pain > (stat.pain ?? 0)
            stat.health.current = result.current
            stat.pain = result.pain
            await saveStats(stat)
            addLog(encounter, '{target} is hit: {tp} TP − RS {rs} = {sp} SP (LeP {before} → {after})', { ...names, tp, rs, sp: points, before, after: result.current })
         }
      } else if (target.kind === 'ally') {
         const change = await woundAlly(target, points)
         if (change) await publishHeroChange({ _id: target.statsId as mongoose.Types.ObjectId, userId: target.userId as mongoose.Types.ObjectId, charId: target.charId as mongoose.Types.ObjectId })
         addLog(encounter, change ? '{target} is hit: {tp} TP − RS {rs} = {sp} SP (LeP {before} → {after})' : '{target} is hit: {tp} TP, {sp} SP',
            { ...names, tp, rs, sp: points, ...(change ?? {}) })
      }
      if (points === 0) addLog(encounter, '{target} is hit: {tp} TP, {sp} SP', { ...names, tp, sp: 0 })
   }
   finishIfDone(encounter, attacker)
   await saveEncounter(encounter)
   await respond(res, encounter, context)
}

export async function cancelAttack(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   const encounter = await requireEncounter(context, req)
   const pending = encounter.attacks.id(idParam(req, 'attackId'))
   if (!pending || (pending.status !== 'pending' && pending.status !== 'damage')) throw new NotFoundError('This attack is no longer open.')
   pending.status = 'cancelled'
   const attacker = encounter.combatants.id(pending.attackerId)
   const target = encounter.combatants.id(pending.targetId)
   addLog(encounter, 'GM cancels the attack of {attacker} on {target}', { attacker: attacker?.name ?? '?', target: target?.name ?? '?' })
   finishIfDone(encounter, attacker)
   await saveEncounter(encounter)
   await respond(res, encounter, context)
}

// ---- Prepared fights (user decision, Nov 2026): the GM sets up several fights; players see one only once it is unlocked
export async function listPrepared(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   const prepared = await Encounter.find({ partyId: context.party._id, status: 'prepared' }).sort({ updatedAt: -1 })
   res.json({ fights: prepared.map((entry) => ({ id: String(entry._id), name: entry.name, board: entry.board,
      opponents: entry.combatants.filter((item) => item.kind === 'npc').length, updatedAt: entry.updatedAt })) })
}
export async function createPrepared(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   if (await Encounter.countDocuments({ partyId: context.party._id, status: 'prepared' }) >= 20) throw new BadRequestError('A party can have at most 20 prepared fights.')
   const members = context.party.members.filter((member) => member.state === 'accepted')
   const chars = await Char.find({ _id: { $in: members.map((member) => member.charId) } }).select('name')
   const names = new Map(chars.map((char) => [char._id.toString(), char.name]))
   const encounter = await Encounter.create({
      partyId: context.party._id, status: 'prepared', name: req.body.name,
      board: { width: req.body.width ?? 20, height: req.body.height ?? 14 },
      combatants: members.map((member) => heroCombatant(member, names.get(String(member.charId)) ?? '?')),
   })
   res.status(201).json({ fight: { id: String(encounter._id), name: encounter.name } })
}
export async function deletePrepared(req: Request, res: Response) {
   const context = await partyContext(req)
   requireGm(context)
   const result = await Encounter.deleteOne({ _id: idParam(req, 'encounterId', 'Fight not found'), partyId: context.party._id, status: 'prepared' })
   if (!result.deletedCount) throw new NotFoundError('Fight not found')
   res.json({ ok: true })
}
// Unlocking makes the prepared fight the running one; the party's current heroes are synced in (positions kept)
export async function activatePrepared(req: Request, res: Response) {
   const context = await partyContext(req)
   const encounter = await requireEncounter(context, req)
   if (await activeEncounter(context.party._id)) throw new ConflictError('A fight is already running.')
   const members = context.party.members.filter((member) => member.state === 'accepted')
   const memberIds = new Set(members.map((member) => String(member.charId)))
   for (const entry of [...encounter.combatants]) {
      if (entry.kind !== 'npc' && !memberIds.has(String(entry.charId))) encounter.combatants.pull(entry._id)
   }
   const missing = members.filter((member) => !encounter.combatants.some((entry) => entry.kind === 'hero' && String(entry.charId) === String(member.charId)))
   const chars = await Char.find({ _id: { $in: missing.map((member) => member.charId) } }).select('name')
   const names = new Map(chars.map((char) => [char._id.toString(), char.name]))
   for (const member of missing) encounter.combatants.push(heroCombatant(member, names.get(String(member.charId)) ?? '?'))
   encounter.status = 'active'
   encounter.round = 0
   encounter.activeId = null
   try {
      await saveEncounter(encounter)
   } catch (error) {
      if ((error as { code?: number }).code === 11000) throw new ConflictError('A fight is already running.')
      throw error
   }
   await respond(res, encounter, context)
}
