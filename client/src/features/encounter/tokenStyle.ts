import { t } from '@/locales/translation'
import type { Combatant, Position } from './encounterApi'

// A combatant's token: initials plus number, NPC types in their own color, heroes with a ring (user decision, Nov 2026).
// Color is never the only cue: initials and number are always shown.
export function tokenClass(combatant: Combatant, extra = '') {
   // Allies: hero-like token with a dashed ring (companions, summons, Radau)
   const classes = ['battle-token', combatant.kind === 'npc' ? `token-color-${combatant.color ?? 0}` : combatant.kind === 'ally' ? 'is-hero is-ally' : 'is-hero']
   if (combatant.kind === 'npc' && combatant.state === 'down') classes.push('is-down')
   if (combatant.kind === 'npc' && combatant.hidden) classes.push('is-hidden')
   if (combatant.kind !== 'npc' && combatant.mine) classes.push('is-mine')
   return [...classes, extra].filter(Boolean).join(' ')
}

const stateLabels = { unhurt: 'unhurt', wounded: 'wounded', badlyWounded: 'badly wounded', down: 'down' } as const

export function tokenLabel(combatant: Combatant, language: 'de' | 'en', position: Position | null) {
   const state = combatant.kind === 'npc' ? `, ${t(stateLabels[combatant.state], language)}` : ''
   const where = position ? `, ${t('column', language)} ${position.x + 1}, ${t('row', language)} ${position.y + 1}` : `, ${t('not on the board', language)}`
   return `${combatant.name}${state}${where}`
}

