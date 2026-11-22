import type { IEncounterDocument } from '@/models/encounter.model'
import { canControlCombatant, initiativeOrder, npcState } from '@/utils/encounterRules'
import type { PartyRole } from '@/utils/partyRules'

// GM: everything. Players: no hidden NPCs, NPCs only with name, token and rough state (user decision, Nov 2026).
export function encounterView(encounter: IEncounterDocument, viewerId: string, role: PartyRole, heroNames: Map<string, string>) {
   const isGm = role === 'gm'
   const combatants = encounter.combatants.map((entry) => ({
      id: String(entry._id), kind: entry.kind, userId: entry.userId ? String(entry.userId) : null, name: entry.name,
      initiative: entry.initiative ?? null, initiativeBase: entry.initiativeBase, tiebreak: entry.tiebreak, source: entry,
   }))
   const visible = initiativeOrder(combatants).filter((entry) => isGm || !entry.source.hidden)
   const activeId = encounter.activeId ? String(encounter.activeId) : null
   return {
      _id: String(encounter._id),
      status: encounter.status,
      round: encounter.round,
      activeId: visible.some((entry) => entry.id === activeId) ? activeId : null,
      board: { width: encounter.board.width, height: encounter.board.height },
      role,
      combatants: visible.map(({ id, source }) => {
         const base = {
            id, kind: source.kind, initials: source.initials, color: source.color, number: source.number,
            position: source.position && source.position.x !== undefined ? { x: source.position.x, y: source.position.y } : null,
            canControl: canControlCombatant(role, viewerId, { kind: source.kind, userId: source.userId ? String(source.userId) : null }),
         }
         if (source.kind === 'hero') {
            const charId = String(source.charId)
            return { ...base, name: heroNames.get(charId) ?? source.name, charId, mine: String(source.userId) === viewerId,
               initiative: source.initiative ?? null, initiativeBase: source.initiativeBase }
         }
         const npc = source.npc
         const state = npc ? npcState(npc.health, npc.maxHealth) : 'unhurt'
         if (!isGm) return { ...base, name: source.name, state, initiative: null }
         return { ...base, name: source.name, state, hidden: source.hidden, initiative: source.initiative ?? null,
            initiativeBase: source.initiativeBase, npc: npc ? {
               health: npc.health, maxHealth: npc.maxHealth, armor: npc.armor, initiativeBase: npc.initiativeBase,
               attack: npc.attack ?? null, parry: npc.parry ?? null, defense: npc.defense ?? null, dodge: npc.dodge ?? null,
               damage: npc.damage, speed: npc.speed ?? null, notes: npc.notes,
            } : null }
      }),
   }
}
