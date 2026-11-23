import type { Encounter } from './encounterApi'

// What the hero's running party fight wants from it, for the quicklink on the hero page (user request, Nov 2026)
export type FightCallout = 'defend' | 'initiative' | 'turn' | 'fight'

export function fightCallout(encounter: Encounter | null | undefined, charId: string): FightCallout | null {
   const hero = encounter?.combatants.find((entry) => entry.kind === 'hero' && entry.charId === charId)
   if (!encounter || !hero) return null
   const open = encounter.openAttack
   if (open?.stage === 'defense' && open.targetId === hero.id) return 'defend'
   if (hero.initiative === null) return 'initiative'
   if (encounter.round >= 1 && encounter.activeId === hero.id && !open) return 'turn'
   return 'fight'
}
