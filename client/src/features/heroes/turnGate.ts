import { useEncounterLink } from './encounterLink'
import { actionBlocked, actionUse, partyActionBlocked, type ActionCost, type Casting } from './fightActions'
import { useFightStore, type Fight } from './fightStore'

// One gate for every turn-bound action of the fight panel (user decision, Nov 2026: everything counts on the shared turn).
// In a party fight the server decides and records the action; alone, the panel's own action bar does (S. 228).
export function useTurnGate(heroId: string, fight: Fight) {
   const link = useEncounterLink()
   const local = actionUse(fight.turn, fight.round)
   return {
      // `casting`: a spell being cast blocks other actions (S. 228); continuing that spell passes null
      reason(cost: ActionCost, casting: Casting | null = fight.casting ?? null) {
         if (!link) return actionBlocked(local, cost, casting)
         return partyActionBlocked(link.gate.reason(cost), local, cost, casting)
      },
      // `label`: English action name for the shared log (translated per viewer); `move`: squares a Flucht allows (S. 237)
      async spend(cost: ActionCost, label: string, detail = '', move?: number) {
         if (link && !(await link.gate.spend(cost, label, detail, move))) return false
         useFightStore.getState().spend(heroId, cost)
         return true
      },
   }
}
