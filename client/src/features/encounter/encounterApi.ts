import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { axiosInstance } from '@/axios/axios'
import { subscribeParty } from '@/realtime/socket'
import type { PartyRole } from '@/features/parties/partyApi'

export type NpcState = 'unhurt' | 'wounded' | 'badlyWounded' | 'down'
export type NpcValues = {
   health: number; maxHealth: number; armor: number; initiativeBase: number
   attack: number | null; parry: number | null; defense: number | null; dodge: number | null
   damage: string; speed: number | null; notes: string
}
export type NpcInput = Omit<NpcValues, 'health'>
export type Position = { x: number; y: number }

// Mirrors server/src/views/encounterView.ts
// Unused actions in the current Kampfrunde (1 action + 1 free action, S. 228)
// dual: the second strike of a two-weapon attack is open (S. 238); bonus: squares a Flucht still allows (S. 237)
export type Actions = { action: boolean; free: boolean; dual: boolean; bonus: number }
type CombatantBase = {
   id: string; initials: string; color: number | null; number: number; position: Position | null; canControl: boolean; name: string; initiative: number | null; actions: Actions
   // Schritt moved in the latest own turn; opponents in melee with it (ranged rules, S. 241–242)
   moved: number; engagedWith: string[]
}
export type HeroCombatant = CombatantBase & { kind: 'hero'; charId: string; mine: boolean; initiativeBase: number }
export type NpcCombatant = CombatantBase & { kind: 'npc'; state: NpcState; hidden?: boolean; initiativeBase?: number; defensesThisRound?: number; npc?: NpcValues | null }
// Companions, summons and Radau of a hero, with their own INI and token (user decision, Nov 2026)
export type AllyCombatant = CombatantBase & { kind: 'ally'; ownerId: string; allyKey: string; mine: boolean; speed: number | null; initiativeBase: number }
export type Combatant = HeroCombatant | NpcCombatant | AllyCombatant
// Terrain squares that block movement (user decision, Nov 2026)
export const obstacleKinds = ['wall', 'rock', 'tree', 'water', 'bush', 'fire'] as const
export type ObstacleKind = (typeof obstacleKinds)[number]
export type Obstacle = Position & { kind: ObstacleKind }
export type Encounter = {
   _id: string; status: 'active' | 'ended' | 'prepared'; name: string; round: number; activeId: string | null
   // scale: Schritt per square (user decision, Nov 2026)
   board: { width: number; height: number; scale: number }; role: PartyRole
   obstacles: Obstacle[]
   // Passierschläge open for a hero or ally (S. 237): after a critical parry, or granted by the GM
   passingGrants: Array<{ combatantId: string; targetId: string; reason: 'parry' | 'gm' }>
   // The attack that locks the fight until it is defended
   // stage: waiting for the defense, or (after a failed defense) for the attacker's damage roll
   openAttack: { attackerId: string; targetId: string; stage: 'defense' | 'damage' } | null
   // In initiative order (S. 226–227)
   combatants: Combatant[]
   attacks: EncounterAttack[]
   log: EncounterLogEntry[]
}
export type CombatOutcome = 'success' | 'failure' | 'critical' | 'criticalUnconfirmed' | 'botch' | 'botchAverted'
export type Incoming = 'melee' | 'shot' | 'thrown'
export type RollRecord = { label: string; roll: number; confirmation?: number | null; target: number; outcome: CombatOutcome }
export type EncounterAttack = {
   id: string; attackerId: string; targetId: string; incoming: Incoming; critical: boolean; passing: boolean
   status: 'pending' | 'damage' | 'defended' | 'hit' | 'cancelled'; tp: number; sp: number | null
   // The attacker's damage dice; doubled: a confirmed critical doubles the TP (S. 231)
   dice: { count: number; sides: number; bonus: number } | null; doubled: boolean
   // The attack comes from one of the viewer's own combatants
   byMe: boolean
   // RS used for the hit (S. 374); the hit raised the own hero's Schmerz (Blutrausch, S. 171)
   rs: number | null; painRaised: boolean
   attackOutcome: CombatOutcome; weapon: string; defenseOutcome: CombatOutcome | null
   // The attack targets the viewer's own hero
   mine: boolean
}
export type EncounterLogEntry = { round: number; key: string; values: Record<string, string | number> }
export type NpcTemplate = { _id: string; name: string; values: NpcInput }

// A scope is a party id (the running fight) or "partyId:encounterId" (a prepared fight the GM edits)
export const encounterKey = (scope: string) => ['encounter', scope] as const
export const preparedScope = (partyId: string, encounterId: string) => `${partyId}:${encounterId}`
export const partyOf = (scope: string) => scope.split(':')[0]
const base = (scope: string) => {
   const [partyId, encounterId] = scope.split(':')
   return encounterId ? `/api/parties/${partyId}/encounters/${encounterId}/edit` : `/api/parties/${partyId}/encounter`
}
type Reply = { encounter: Encounter | null }

export async function getEncounter(partyId: string) {
   return (await axiosInstance.get<Reply>(base(partyId))).data.encounter
}
export async function startEncounter(partyId: string, board?: { width: number; height: number }) {
   return (await axiosInstance.post<Reply>(base(partyId), board ?? {})).data.encounter
}
export async function endEncounter(partyId: string) {
   return (await axiosInstance.post<Reply>(`${base(partyId)}/end`)).data.encounter
}
export async function changeTurn(partyId: string, direction: 'next' | 'previous') {
   return (await axiosInstance.post<Reply>(`${base(partyId)}/turn`, { direction })).data.encounter
}
export async function addAlly(partyId: string, input: { heroId: string; key: string; name: string; initiative: number; initiativeBase: number; speed: number | null
   armor: number; source: { kind: 'companion' | 'summon'; id: string } | { kind: 'radau' } | null }) {
   return (await axiosInstance.post<Reply>(`${base(partyId)}/allies`, input)).data.encounter
}
export async function removeAlly(partyId: string, combatantId: string) {
   return (await axiosInstance.delete<Reply>(`${base(partyId)}/allies/${combatantId}`)).data.encounter
}
export async function spendAction(partyId: string, combatantId: string, input: { kind: 'action' | 'free'; label: string; detail?: string; move?: number }) {
   return (await axiosInstance.post<Reply>(`${base(partyId)}/combatants/${combatantId}/actions`, input)).data.encounter
}
export async function grantPassing(partyId: string, combatantId: string, targetId: string) {
   return (await axiosInstance.post<Reply>(`${base(partyId)}/passing`, { combatantId, targetId })).data.encounter
}
export async function endTurn(partyId: string) {
   return (await axiosInstance.post<Reply>(`${base(partyId)}/end-turn`)).data.encounter
}
export async function setObstacles(partyId: string, cells: Array<Position & { kind: ObstacleKind | null }>) {
   return (await axiosInstance.put<Reply>(`${base(partyId)}/obstacles`, { cells })).data.encounter
}
export async function resizeBoard(partyId: string, board: { width: number; height: number; scale: number }) {
   return (await axiosInstance.put<Reply>(`${base(partyId)}/board`, board)).data.encounter
}
export async function addNpcs(partyId: string, input: { name: string; count: number; values: NpcInput; saveTemplate: boolean; hidden: boolean }) {
   return (await axiosInstance.post<Reply>(`${base(partyId)}/npcs`, input)).data.encounter
}
export async function rollNpcInitiative(partyId: string, onlyMissing = true) {
   return (await axiosInstance.post<Reply>(`${base(partyId)}/npc-initiative`, { onlyMissing })).data.encounter
}
export async function updateCombatant(partyId: string, combatantId: string,
   change: { name?: string; hidden?: boolean; initiative?: number | null; initiativeBase?: number; values?: Partial<NpcInput> }) {
   return (await axiosInstance.patch<Reply>(`${base(partyId)}/combatants/${combatantId}`, change)).data.encounter
}
export async function damageCombatant(partyId: string, combatantId: string, input: { direction: 'damage' | 'heal'; amount: number; ignoreArmor: boolean }) {
   return (await axiosInstance.post<Reply>(`${base(partyId)}/combatants/${combatantId}/damage`, input)).data.encounter
}
export async function moveCombatant(partyId: string, combatantId: string, position: Position | null) {
   return (await axiosInstance.put<Reply>(`${base(partyId)}/combatants/${combatantId}/position`, { position })).data.encounter
}
export async function removeCombatant(partyId: string, combatantId: string) {
   return (await axiosInstance.delete<Reply>(`${base(partyId)}/combatants/${combatantId}`)).data.encounter
}

export async function getNpcTemplates() {
   return (await axiosInstance.get<{ templates: NpcTemplate[] }>('/api/npc-templates')).data.templates
}
export async function deleteNpcTemplate(templateId: string) {
   await axiosInstance.delete(`/api/npc-templates/${templateId}`)
}

// The party fight, kept live through the party room
export function useEncounter(scope: string) {
   const partyId = partyOf(scope)
   useEffect(() => subscribeParty(partyId), [partyId])
   return useQuery({ queryKey: encounterKey(scope), queryFn: () => getEncounter(scope), retry: false })
}

// Prepared fights (GM): set up in advance, invisible to players until unlocked (user decision, Nov 2026)
export type PreparedFight = { id: string; name: string; board: { width: number; height: number }; opponents: number; updatedAt: string }
export const preparedKey = (partyId: string) => ['prepared-fights', partyId] as const
export async function listPrepared(partyId: string) {
   return (await axiosInstance.get<{ fights: PreparedFight[] }>(`/api/parties/${partyId}/encounters`)).data.fights
}
export async function createPrepared(partyId: string, name: string) {
   return (await axiosInstance.post<{ fight: { id: string; name: string } }>(`/api/parties/${partyId}/encounters`, { name })).data.fight
}
export async function deletePrepared(partyId: string, encounterId: string) {
   await axiosInstance.delete(`/api/parties/${partyId}/encounters/${encounterId}`)
}
export async function activatePrepared(partyId: string, encounterId: string) {
   return (await axiosInstance.post<Reply>(`/api/parties/${partyId}/encounters/${encounterId}/activate`)).data.encounter
}
export async function rollAttackDamage(partyId: string, attackId: string, tp: number) {
   return (await axiosInstance.post<Reply>(`${base(partyId)}/attacks/${attackId}/damage`, { tp })).data.encounter
}

export type Reach = 'short' | 'medium' | 'long'
export async function submitAttack(partyId: string, input: { attackerId: string; targetId: string; incoming: Incoming; attack: RollRecord; reach?: Reach
   dice: { count: number; sides: number; bonus: number } | null; passing?: boolean; dual?: 'first' | 'second' | null }) {
   return (await axiosInstance.post<Reply>(`${base(partyId)}/attacks`, input)).data.encounter
}
export async function resolveDefense(partyId: string, attackId: string, input: { defense: RollRecord | null; halved?: boolean }) {
   return (await axiosInstance.post<Reply>(`${base(partyId)}/attacks/${attackId}/defense`, input)).data.encounter
}
export async function cancelAttack(partyId: string, attackId: string) {
   return (await axiosInstance.delete<Reply>(`${base(partyId)}/attacks/${attackId}`)).data.encounter
}

// A rolled D20 (d20.ts) as the record the fight stores
export function rollRecord(label: string, roll: { roll: number; confirmation?: number; target: number; outcome: CombatOutcome }): RollRecord {
   return { label, roll: roll.roll, confirmation: roll.confirmation ?? null, target: roll.target, outcome: roll.outcome }
}
