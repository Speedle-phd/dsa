// Shared party fight (encounter): initiative order, turns, NPC damage and tokens. Pure functions, tested without a DB.
import type { HeroPanel } from '@/models/encounter.model'

export type EncounterSide = 'hero' | 'npc' | 'ally'
// Heroes and their allies (companions, summons, Radau) fight together against the NPCs
export const sideOf = (kind: EncounterSide) => kind === 'npc' ? 'foes' : 'party'
export type RuleCombatant = {
   id: string
   kind: EncounterSide
   userId?: string | null
   name: string
   initiative: number | null
   initiativeBase: number
   tiebreak: number
}

// source: DSA5 Regelwerk, S. 226–227: order by INI, then INI-Basiswert, then a 1W6 roll-off repeated until decided.
// App choice: the roll-off is decided once per combatant by a stored random `tiebreak`. Combatants without INI act last.
export function initiativeOrder<T extends RuleCombatant>(combatants: readonly T[]): T[] {
   return [...combatants].sort((a, b) =>
      (a.initiative === null ? 1 : 0) - (b.initiative === null ? 1 : 0)
      || (b.initiative ?? 0) - (a.initiative ?? 0)
      || b.initiativeBase - a.initiativeBase
      || b.tiebreak - a.tiebreak)
}

// Next or previous turn in INI order; passing the last combatant starts the next Kampfrunde (S. 226–227).
export function stepTurn<T extends RuleCombatant>(combatants: readonly T[], activeId: string | null, round: number, direction: 'next' | 'previous') {
   const order = initiativeOrder(combatants)
   if (!order.length) return { activeId: null, round }
   const index = activeId ? order.findIndex((combatant) => combatant.id === activeId) : -1
   if (direction === 'next') {
      if (index < 0) return { activeId: order[0].id, round: Math.max(1, round) }
      if (index === order.length - 1) return { activeId: order[0].id, round: round + 1 }
      return { activeId: order[index + 1].id, round }
   }
   if (index <= 0) return round > 1 ? { activeId: order[order.length - 1].id, round: round - 1 } : { activeId: order[0].id, round: 1 }
   return { activeId: order[index - 1].id, round }
}

// source: DSA5 Regelwerk, S. 230, 233 (Schadenspunkte = Trefferpunkte − Rüstungsschutz, never below 0)
export function damagePoints(hitPoints: number, armor: number, ignoreArmor = false) {
   return Math.max(0, hitPoints - (ignoreArmor ? 0 : armor))
}

// What players see of an NPC's health. App choice (user decision: "name + rough state"; the rules define no such scale).
export type NpcState = 'unhurt' | 'wounded' | 'badlyWounded' | 'down'
export function npcState(health: number, maxHealth: number): NpcState {
   if (health <= 0) return 'down'
   if (health >= maxHealth) return 'unhurt'
   return health > maxHealth / 2 ? 'wounded' : 'badlyWounded'
}

// Tokens: every NPC type gets its own color, copies are numbered ("Ork 1", "Ork 2"). User decision, Nov 2026.
export const tokenColorCount = 8
export function npcGroupName(name: string) {
   return name.trim().replace(/\s+\d+$/, '').trim()
}
export function initialsFor(name: string) {
   const words = npcGroupName(name).split(/\s+/).filter(Boolean)
   const letters = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2)
   return letters.toUpperCase()
}
export function tokenAssignment(existing: ReadonlyArray<{ kind: EncounterSide; group: string; color: number | null; number: number }>, group: string) {
   const npcs = existing.filter((entry) => entry.kind === 'npc')
   const same = npcs.filter((entry) => entry.group === group)
   const used = new Set(npcs.map((entry) => entry.color))
   const color = same.find((entry) => entry.color !== null)?.color
      ?? [...Array(tokenColorCount).keys()].find((index) => !used.has(index))
      ?? new Set(npcs.map((entry) => entry.group)).size % tokenColorCount
   const nextNumber = Math.max(0, ...same.map((entry) => entry.number)) + 1
   return { color, nextNumber }
}

// The GM changes everything; a player moves the token and sets the INI of their own hero only (user decision, Nov 2026).
export function canControlCombatant(role: 'gm' | 'member' | 'pending' | null, viewerId: string, combatant: Pick<RuleCombatant, 'kind' | 'userId'>) {
   if (role === 'gm') return true
   return role === 'member' && combatant.kind !== 'npc' && combatant.userId === viewerId
}

export function clampPosition(position: { x: number; y: number }, board: { width: number; height: number }) {
   return position.x >= 0 && position.y >= 0 && position.x < board.width && position.y < board.height
}

// NPC defense against a hero's attack (the GM rolls it). source: DSA5 Regelwerk, S. 232 (−3 per further defense in the KR),
// S. 354 (VW of creatures is not lowered by several defenses), S. 243–244 (shot −4, thrown weapon −2),
// S. 231 (a critical attack halves the defense, rounded up; the client's defenseTarget does the same)
export type NpcDefenseKind = 'parry' | 'dodge' | 'defense'
export type Incoming = 'melee' | 'shot' | 'thrown'
export const incomingDefenseModifier: Record<Incoming, number> = { melee: 0, shot: -4, thrown: -2 }
export function npcDefenseTarget({ value, kind, previousDefenses, attackerCritical, incoming }: {
   value: number; kind: NpcDefenseKind; previousDefenses: number; attackerCritical: boolean; incoming: Incoming
}) {
   const penalty = kind === 'defense' ? 0 : 3 * previousDefenses
   const reduced = value + incomingDefenseModifier[incoming] - penalty
   return attackerCritical ? Math.ceil(reduced / 2) : reduced
}
// Defenses an NPC already made in this Kampfrunde (the counter resets with the round)
export function previousDefenses(defenses: { round: number; count: number } | null | undefined, round: number) {
   return defenses && defenses.round === round ? defenses.count : 0
}

// Melee on the board: only against a combatant on one of the 8 neighbouring squares (user decision, Nov 2026, house rule:
// the core rules have no grid). Both tokens must be on the board.
export function isAdjacent(a: { x: number; y: number } | null | undefined, b: { x: number; y: number } | null | undefined) {
   if (!a || !b) return false
   const distance = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
   return distance === 1
}

// ---- Turn flow (user decisions, Nov 2026): only the active combatant acts; 1 action + 1 free action per KR (S. 228)
// dual: the first strike of a two-weapon attack is done, the second may follow (S. 238); bonus: squares granted by Flucht (S. 237)
export type TurnState = { round: number; action: boolean; free: boolean; dual?: boolean; bonus?: number }
// Unused actions this round (a stored state from an earlier round counts as fresh)
export function actionsLeft(turn: TurnState | null | undefined, round: number) {
   const current = turn && turn.round === round ? turn : null
   return { action: !current?.action, free: !current?.free }
}
// source: DSA5 Regelwerk, S. 215 (Anführer: 1 action and an Überreden check; up to QS + 1 other persons of the leader's choice
// get AT, defense and FK +1 in the next KR). Allies only: the leader's own side, not the leader, not down. Returns the ids.
export function leaderTargets(leader: { id: string; kind: EncounterSide }, candidates: Array<{ id: string; kind: EncounterSide; down: boolean }>,
   targetIds: string[], quality: number): { ids: string[] } | { error: string } {
   const ids = [...new Set(targetIds)]
   if (ids.length > quality + 1) return { error: 'Anführer reaches at most QS + 1 allies.' }
   for (const id of ids) {
      const target = candidates.find((entry) => entry.id === id)
      if (!target || id === leader.id || sideOf(target.kind) !== sideOf(leader.kind)) return { error: 'Anführer supports only own allies.' }
      if (target.down) return { error: 'This ally cannot act.' }
   }
   return { ids }
}
// A move up to GS uses the free action, a second one the action (sprint, S. 228–229); null when nothing is left
export function moveCost(turn: TurnState | null | undefined, round: number): 'free' | 'action' | null {
   const left = actionsLeft(turn, round)
   return left.free ? 'free' : left.action ? 'action' : null
}
export function spend(turn: TurnState | null | undefined, round: number, kind: 'free' | 'action'): TurnState {
   const left = actionsLeft(turn, round)
   const current = turn && turn.round === round ? turn : null
   return { dual: current?.dual ?? false, bonus: current?.bonus ?? 0, round, action: kind === 'action' ? true : !left.action, free: kind === 'free' ? true : !left.free }
}
// The turn is over once the action is used, unless a second strike or a Flucht move is still open
export function turnDone(turn: TurnState | null | undefined, round: number) {
   const current = turn && turn.round === round ? turn : null
   return !actionsLeft(turn, round).action && !current?.dual && !(current?.bonus ?? 0)
}

// Terrain squares the GM paints on the board; tokens cannot enter them (user decision: movement only)
export const obstacleKinds = ['wall', 'rock', 'tree', 'water', 'bush', 'fire'] as const
export type ObstacleKind = (typeof obstacleKinds)[number]

// Shortest path in squares around blocked squares (8 directions, a diagonal step = 1 Schritt, app choice).
// Returns the number of steps, or null when the target cannot be reached within `limit`.
export function pathLength(board: { width: number; height: number }, blocked: ReadonlySet<string>,
   from: { x: number; y: number }, to: { x: number; y: number }, limit: number) {
   const key = (x: number, y: number) => `${x}:${y}`
   if (blocked.has(key(to.x, to.y))) return null
   if (from.x === to.x && from.y === to.y) return 0
   let frontier = [from]
   const seen = new Set([key(from.x, from.y)])
   for (let steps = 1; steps <= limit && frontier.length; steps++) {
      const next: Array<{ x: number; y: number }> = []
      for (const cell of frontier) {
         for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
            const x = cell.x + dx, y = cell.y + dy
            if ((!dx && !dy) || x < 0 || y < 0 || x >= board.width || y >= board.height) continue
            const id = key(x, y)
            if (seen.has(id) || blocked.has(id)) continue
            if (x === to.x && y === to.y) return steps
            seen.add(id)
            next.push({ x, y })
         }
      }
      frontier = next
   }
   return null
}

// Squares between two tokens, a diagonal step = 1 Schritt (app choice, as for movement)
export function boardDistance(a: { x: number; y: number } | null | undefined, b: { x: number; y: number } | null | undefined) {
   if (!a || !b) return null
   return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
}
// Melee reach on the board: neighbouring squares; weapons with Reichweite lang also 2 squares away
// (house rule, user decision Nov 2026; the core rules have no grid)
export function inMeleeReach(a: { x: number; y: number } | null | undefined, b: { x: number; y: number } | null | undefined, reach: 'short' | 'medium' | 'long' = 'medium') {
   const distance = boardDistance(a, b)
   return distance !== null && distance >= 1 && distance <= (reach === 'long' ? 2 : 1)
}
// source: DSA5 Regelwerk, S. 241 (in melee = in Angriffsdistanz and exchanging attacks or defenses; such a fighter cannot shoot).
// On the board: an opponent on a neighbouring square that attacked or was attacked by this combatant this or the last KR.
export function engagedWith(id: string, round: number, combatants: ReadonlyArray<{ id: string; position: { x: number; y: number } | null }>,
   attacks: ReadonlyArray<{ attackerId: string; targetId: string; round: number; status: string }>) {
   const self = combatants.find((entry) => entry.id === id)
   if (!self?.position) return []
   const partners = new Set(attacks.filter((attack) => attack.status !== 'cancelled' && attack.round >= round - 1 && (attack.attackerId === id || attack.targetId === id))
      .map((attack) => attack.attackerId === id ? attack.targetId : attack.attackerId))
   return combatants.filter((entry) => partners.has(entry.id) && isAdjacent(self.position, entry.position)).map((entry) => entry.id)
}

// Board scale (user decision, Nov 2026): one square stands for `scale` Schritt (default 1). A move of GS Schritt covers
// ⌊GS ÷ scale⌋ squares; distances in Schritt are squares × scale.
export const defaultScale = 1
export const squaresFor = (schritt: number, scale = defaultScale) => Math.floor(schritt / Math.max(1, scale))
export const schrittFor = (squares: number, scale = defaultScale) => squares * Math.max(1, scale)

// A hero's panel copy goes only to the GM and the hero's own player (user request, Nov 2026)
export function panelView(panel: HeroPanel | null | undefined, isGm: boolean, mine: boolean) {
   return isGm || mine ? panel ?? null : null
}
