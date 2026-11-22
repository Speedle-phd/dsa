import type { Combatant } from './encounterApi'
import { tokenClass } from './tokenStyle'

export function TokenFace({ combatant }: { combatant: Combatant }) {
   return <>
      <span className='token-initials' aria-hidden='true'>{combatant.initials}</span>
      {combatant.kind === 'npc' && combatant.number > 0 && <span className='token-number' aria-hidden='true'>{combatant.number}</span>}
   </>
}

// Small non-interactive token for lists (tracker, tray labels)
export function TokenBadge({ combatant }: { combatant: Combatant }) {
   return <span className={tokenClass(combatant, 'is-badge')} aria-hidden='true'><TokenFace combatant={combatant} /></span>
}
