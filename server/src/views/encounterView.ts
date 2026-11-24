import type { IEncounterDocument } from '@/models/encounter.model'
import { actionsLeft, canControlCombatant, engagedWith, initiativeOrder, npcState, panelView, previousDefenses } from '@/utils/encounterRules'
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
   const positions = encounter.combatants.map((item) => ({ id: String(item._id), position: item.position && item.position.x !== undefined ? item.position : null }))
   const attackRecords = encounter.attacks.map((attack) => ({ attackerId: String(attack.attackerId), targetId: String(attack.targetId), round: attack.round, status: attack.status }))
   const visibleIds = new Set(visible.map((entry) => entry.id))
   return {
      _id: String(encounter._id),
      status: encounter.status,
      name: encounter.name ?? '',
      round: encounter.round,
      activeId: visible.some((entry) => entry.id === activeId) ? activeId : null,
      board: { width: encounter.board.width, height: encounter.board.height, scale: encounter.board.scale ?? 1 },
      obstacles: (encounter.obstacles ?? []).map((cell) => ({ x: cell.x, y: cell.y, kind: cell.kind })),
      // Open Passierschläge: the GM sees all, a player those of the own hero and allies
      passingGrants: (encounter.passingGrants ?? [])
         .filter((grant) => isGm || encounter.combatants.some((entry) => String(entry._id) === String(grant.combatantId) && String(entry.userId) === viewerId))
         .map((grant) => ({ combatantId: String(grant.combatantId), targetId: String(grant.targetId), reason: grant.reason })),
      // The attack that currently locks the fight (everyone sees who waits for whom)
      openAttack: openAttackView(encounter, visible.map((entry) => entry.id)),
      role,
      combatants: visible.map(({ id, source }) => {
         const base = {
            id, kind: source.kind, initials: source.initials, color: source.color, number: source.number,
            position: source.position && source.position.x !== undefined ? { x: source.position.x, y: source.position.y } : null,
            canControl: canControlCombatant(role, viewerId, { kind: source.kind, userId: source.userId ? String(source.userId) : null }),
            actions: { ...actionsLeft(source.turn, encounter.round),
               dual: Boolean(source.turn?.round === encounter.round && source.turn.dual), bonus: source.turn?.round === encounter.round ? source.turn.bonus ?? 0 : 0 },
            // Schritt moved in the latest own turn; opponents in melee with it (ranged rules, S. 241–242)
            moved: source.lastTurn?.squares ?? 0,
            engagedWith: engagedWith(id, encounter.round, positions, attackRecords).filter((other) => visibleIds.has(other)),
            // Anführer (S. 215): the KR with AT, defense and FK +1 (this or the next one; older rounds are dropped)
            leaderRound: source.leaderRound != null && source.leaderRound >= encounter.round ? source.leaderRound : null,
         }
         if (source.kind === 'ally') {
            return { ...base, name: source.name, ownerId: String(source.ownerId), allyKey: source.allyKey ?? '', mine: String(source.userId) === viewerId,
               speed: source.speed ?? null, initiative: source.initiative ?? null, initiativeBase: source.initiativeBase }
         }
         if (source.kind === 'hero') {
            const charId = String(source.charId)
            const mine = String(source.userId) === viewerId
            return { ...base, name: heroNames.get(charId) ?? source.name, charId, mine,
               initiative: source.initiative ?? null, initiativeBase: source.initiativeBase, panel: panelView(source.panel, isGm, mine) }
         }
         const npc = source.npc
         const state = npc ? npcState(npc.health, npc.maxHealth) : 'unhurt'
         if (!isGm) return { ...base, name: source.name, state, initiative: null }
         return { ...base, name: source.name, state, hidden: source.hidden, initiative: source.initiative ?? null,
            initiativeBase: source.initiativeBase, defensesThisRound: previousDefenses(source.defenses, encounter.round),
            // Attacks this KR and the weapons used, for "Aktionen: 2 (max. 1 × Biss)" (S. 354)
            attacksThisRound: source.turn?.round === encounter.round ? { count: source.turn.attacks ?? 0, weapons: source.turn.weapons ?? [] } : { count: 0, weapons: [] },
            npc: npc ? {
               health: npc.health, maxHealth: npc.maxHealth, armor: npc.armor, initiativeBase: npc.initiativeBase,
               attack: npc.attack ?? null, parry: npc.parry ?? null, defense: npc.defense ?? null, dodge: npc.dodge ?? null,
               damage: npc.damage, speed: npc.speed ?? null, notes: npc.notes, sheet: npc.sheet ?? null,
            } : null }
      }),
      attacks: attacksView(encounter, viewerId, isGm, visible.map((entry) => entry.id)),
      log: encounter.log.slice(-60).map((entry) => isGm && entry.gmKey
         ? { round: entry.round, key: entry.gmKey, values: entry.gmValues ?? {} }
         : { round: entry.round, key: entry.key, values: entry.values ?? {} }),
   }
}

function openAttackView(encounter: IEncounterDocument, visibleIds: string[]) {
   const open = encounter.attacks.find((attack) => attack.status === 'pending' || attack.status === 'damage')
   if (!open || !visibleIds.includes(String(open.attackerId)) || !visibleIds.includes(String(open.targetId))) return null
   // stage: waiting for the defense, or for the attacker's damage roll
   return { attackerId: String(open.attackerId), targetId: String(open.targetId), stage: open.status === 'damage' ? 'damage' as const : 'defense' as const }
}

// Open and recent attacks. The GM sees all; a player only those of or against the own hero (to defend or follow them).
function attacksView(encounter: IEncounterDocument, viewerId: string, isGm: boolean, visibleIds: string[]) {
   const ownHeroes = new Set(encounter.combatants.filter((entry) => entry.kind !== 'npc' && String(entry.userId) === viewerId).map((entry) => String(entry._id)))
   return encounter.attacks
      // Settled attacks of this and the last KR: a hit that ends a turn (and the round) still reaches the target's page
      .filter((attack) => attack.status === 'pending' || attack.status === 'damage' || attack.round >= encounter.round - 1)
      .filter((attack) => isGm || ownHeroes.has(String(attack.attackerId)) || ownHeroes.has(String(attack.targetId)))
      .filter((attack) => visibleIds.includes(String(attack.attackerId)) && visibleIds.includes(String(attack.targetId)))
      .map((attack) => ({
         id: String(attack._id),
         attackerId: String(attack.attackerId),
         targetId: String(attack.targetId),
         incoming: attack.incoming,
         critical: attack.critical,
         passing: Boolean(attack.passing),
         dice: attack.dice && attack.dice.count ? { count: attack.dice.count, sides: attack.dice.sides, bonus: attack.dice.bonus } : null,
         // A confirmed critical doubles the TP (S. 231)
         doubled: attack.attack?.outcome === 'critical' && !attack.passing,
         status: attack.status,
         tp: attack.tp,
         sp: attack.sp ?? null,
         attackOutcome: attack.attack?.outcome ?? 'success',
         weapon: attack.attack?.label ?? '',
         // Finte: the defense of the target −2 per level (S. 247)
         defenseModifier: attack.defenseModifier ?? 0,
         defenseOutcome: attack.defense?.outcome ?? null,
         mine: ownHeroes.has(String(attack.targetId)),
         byMe: ownHeroes.has(String(attack.attackerId)),
         rs: attack.rs ?? null,
         // The hit raised the hero's Schmerz: Blutrausch may trigger (S. 171); only for the hero's own player
         painRaised: Boolean(attack.painRaised) && ownHeroes.has(String(attack.targetId)),
      }))
}
