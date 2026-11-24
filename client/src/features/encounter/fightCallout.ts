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

// The fight needs this viewer right now (own turn or a defense): the tab title and icon get a marker
export type TabAttention = 'defend' | 'turn'
// The most urgent demand over all of the viewer's party fights: a defense before a turn
export function tabAttention(callouts: Array<FightCallout | null>): TabAttention | null {
   if (callouts.includes('defend')) return 'defend'
   return callouts.includes('turn') ? 'turn' : null
}
// "🛡️ Verteidigen! · DSA5 Heldenbögen" (symbol and message are translated by the caller)
export const tabTitle = (attention: TabAttention | null, base: string, message: string) =>
   attention ? `${attention === 'defend' ? '🛡️' : '⚔️'} ${message} · ${base}` : base

// Toast when the fight starts to need the viewer (user request, Nov 2026): not on that fight page (the window shows it),
// not again for the same state, not for the plain "a fight is running" state
export function alertFor(previous: FightCallout | null | undefined, next: FightCallout | null, onFightPage: boolean): FightCallout | null {
   if (onFightPage || !next || next === 'fight' || next === previous) return null
   return next
}
