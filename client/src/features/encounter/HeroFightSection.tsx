import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { throwColoredDice } from '@/components/diceEngine'
import { heroSpeed } from '@/features/heroes/energy'
import { EncounterLinkContext, type EncounterLink } from '@/features/heroes/encounterLink'
import { FightPanel } from '@/features/heroes/FightPanel'
import { heroInitiative } from '@/features/heroes/fightHelpers'
import { useFightStore } from '@/features/heroes/fightStore'
import { getHero } from '@/features/heroes/heroApi'
import { getStatsForHero } from '@/features/heroes/statsApi'
import { getErrorMessage } from '@/utils/errorHandling'
import { boardDistance, isAdjacent } from './boardGeometry'
import { encounterKey, partyOf, resolveDefense, rollRecord, spendAction, submitAttack, updateCombatant, type Encounter, type HeroCombatant } from './encounterApi'

// The player's own fight panel on the fight page (user decision, Nov 2026). It keeps all rules of the hero's panel;
// the party fight supplies the targets, the attacks on the hero, the INI and the Kampfrunde.
export function HeroFightSection({ encounter, partyId, combatant, view }: {
   encounter: Encounter; partyId: string; combatant: HeroCombatant; view: 'attack' | 'defense' | 'extras' | 'passing'
}) {
   const queryClient = useQueryClient()
   const heroId = combatant.charId
   const stats = useQuery({ queryKey: ['stats', heroId], queryFn: () => getStatsForHero(heroId) })
   const hero = useQuery({ queryKey: ['heroes', heroId], queryFn: () => getHero(heroId) })
   const fight = useFightStore((state) => state.fights[heroId])
   const mutation = useMutation({
      mutationFn: (action: () => Promise<Encounter | null>) => action(),
      onSuccess: (next) => queryClient.setQueryData(encounterKey(partyId), next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   // The panel's Kampfrunde follows the party fight (action budget and defenses reset per KR, S. 228, 232)
   // (read fresh from the store: the page shows several parts of the panel at once)
   useEffect(() => {
      const current = () => useFightStore.getState().fights[heroId]
      while (current() && current()!.round < encounter.round) useFightStore.getState().nextRound(heroId)
   }, [encounter.round, fight, heroId])

   // A panel left from another (simulated or former party) fight starts fresh: no data carries over (user decision, Nov 2026)
   const encounterId = encounter._id
   useEffect(() => {
      const current = useFightStore.getState().fights[heroId]
      if (current && current.party?.encounterId !== encounterId) useFightStore.getState().end(heroId)
   }, [encounterId, fight, heroId])
   // An INI already in the party fight (rolled here or on another device) opens the panel without a new roll
   const { initiative, initiativeBase } = combatant
   const partyTag = { partyId: partyOf(partyId), encounterId }
   useEffect(() => {
      const store = useFightStore.getState()
      if (initiative === null || store.fights[heroId]) return
      store.start(heroId, { base: initiativeBase, modifier: 0, roll: initiative - initiativeBase })
      useFightStore.getState().update(heroId, { party: { partyId: partyOf(partyId), encounterId } })
   }, [fight, heroId, initiative, initiativeBase, partyId, encounterId])

   const link = useMemo<EncounterLink>(() => {
      const names = new Map(encounter.combatants.map((entry) => [entry.id, entry.name]))
      const incoming = encounter.attacks.find((attack) => attack.status === 'pending' && attack.targetId === combatant.id)
      // The party fight decides (user decision, Nov 2026): own turn, the action left, no open attack
      const turnReason = (cost: 'action' | 'free') => encounter.round < 1 ? 'The fight has not begun yet.' : encounter.activeId !== combatant.id ? 'Wait for your turn.'
         : encounter.openAttack ? 'Wait until the open attack is defended.'
         : !combatant.actions[cost] ? (cost === 'action' ? 'The action of this round is already used.' : 'The free action of this round is already used.') : null
      const run = async (action: () => Promise<Encounter | null>) => {
         try {
            await mutation.mutateAsync(action)
            return true
         } catch {
            return false
         }
      }
      return {
         targets: encounter.combatants.filter((entry) => entry.kind === 'npc' && entry.state !== 'down')
            .map((entry) => ({ id: entry.id, name: entry.name, distance: boardDistance(combatant.position, entry.position), moved: entry.moved,
               paces: (() => { const squares = boardDistance(combatant.position, entry.position); return squares === null ? null : squares * encounter.board.scale })(),
               intoMelee: encounter.combatants.some((other) => other.kind !== 'npc' && other.id !== combatant.id && isAdjacent(other.position, entry.position)) })),
         onBoard: combatant.position !== null,
         self: { moved: encounter.activeId === combatant.id ? combatant.moved : 0, engaged: combatant.engagedWith.length > 0 },
         // The party fight decides (user decision, Nov 2026): own turn, action left, no open attack
         actionReason: turnReason('action'),
         passingReason: encounter.round < 1 ? 'The fight has not begun yet.' : encounter.openAttack ? 'Wait until the open attack is defended.'
            : !encounter.passingGrants.some((grant) => grant.combatantId === combatant.id) ? 'No Passierschlag right now (S. 237).' : null,
         passingTargets: encounter.passingGrants.filter((grant) => grant.combatantId === combatant.id).map((grant) => grant.targetId),
         dualOpen: encounter.activeId === combatant.id && combatant.actions.dual,
         gate: {
            reason: turnReason,
            spend: (cost, label, detail = '', move) => run(() => spendAction(partyId, combatant.id, { kind: cost, label, detail, ...(move ? { move } : {}) })),
         },
         incoming: incoming ? { id: incoming.id, attackerName: names.get(incoming.attackerId) ?? '?', weapon: incoming.weapon,
            critical: incoming.critical, incoming: incoming.incoming, passing: incoming.passing } : null,
         busy: mutation.isPending,
         sendAttack: ({ targetId, incoming: kind, weapon, roll, dice, reach, passing = false, dual = null }) => run(() => submitAttack(partyId, {
            attackerId: combatant.id, targetId, incoming: kind, attack: rollRecord(weapon, roll), dice, reach: reach ?? 'medium', passing, dual })),
         sendDefense: (attackId, defense) => run(() => resolveDefense(partyId, attackId, { defense: defense ? rollRecord(defense.label, defense.roll) : null })),
      }
   }, [encounter, combatant, partyId, mutation])

   // source: DSA5 Regelwerk, S. 226 (INI = Basiswert + 1W6, once per fight): an INI already in the party fight is taken over
   async function startPanel() {
      if (!stats.data) return
      const { start } = useFightStore.getState()
      if (combatant.initiative !== null) {
         start(heroId, { base: combatant.initiativeBase, modifier: 0, roll: combatant.initiative - combatant.initiativeBase })
         useFightStore.getState().update(heroId, { party: partyTag })
         return
      }
      const ini = heroInitiative(stats.data)
      const [roll] = await throwColoredDice(6, ['#b7791f'])
      start(heroId, { base: ini.base, modifier: ini.modifier, roll })
      useFightStore.getState().update(heroId, { party: partyTag })
      mutation.mutate(() => updateCombatant(partyId, combatant.id, { initiative: ini.base + ini.modifier + roll, initiativeBase: ini.base }))
   }

   if (!stats.data || !hero.data) return null
   return <EncounterLinkContext.Provider value={link}>
      <FightPanel stats={stats.data} heroId={heroId} speed={heroSpeed(stats.data, hero.data.species)} onRollInitiative={() => void startPanel()} view={view} />
   </EncounterLinkContext.Provider>
}
