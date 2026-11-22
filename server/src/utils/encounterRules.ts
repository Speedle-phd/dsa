// Shared party fight (encounter): initiative order, turns, NPC damage and tokens. Pure functions, tested without a DB.

export type EncounterSide = 'hero' | 'npc'
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
   return role === 'member' && combatant.kind === 'hero' && combatant.userId === viewerId
}

export function clampPosition(position: { x: number; y: number }, board: { width: number; height: number }) {
   return position.x >= 0 && position.y >= 0 && position.x < board.width && position.y < board.height
}
