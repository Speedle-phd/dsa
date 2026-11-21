import type { EffectSpec } from './consumables'

type EntryState = { disadvantages?: string[] }

// source: DSA5 Regelwerk, S. 177 (Schwacher Astralkörper: each AsP spend loses 1 AsP more)
// App choice: the extra point is only taken while AsP are left, so a spend of all remaining AsP stays possible.
export function astralSpend(state: EntryState, amount: number, current: number) {
   const extra = state.disadvantages?.includes('Schwacher Astralkörper') ? Math.min(1, Math.max(0, current - amount)) : 0
   return { total: amount + extra, extra }
}

// source: DSA5 Regelwerk, S. 173 (Lästige Mindergeister: W20 ≤ AsP spent → all checks −1 for 10 minutes; several do not add up)
export const minorSpiritsEffect: EffectSpec = {
   key: 'mindergeister', label: 'Lästige Mindergeister', page: 173,
   duration: { de: '10 Minuten', en: '10 minutes' }, values: { checkPenalty: 1 },
   note: { de: 'Alle Fertigkeitsproben −1; die Art der Mindergeister bestimmt der Meister.', en: 'All skill checks −1; the GM decides what kind of minor spirits appear.' },
}
export const hasMinorSpirits = (state: EntryState) => Boolean(state.disadvantages?.includes('Lästige Mindergeister'))
export const minorSpiritsAppear = (state: EntryState, roll: number, spent: number) => hasMinorSpirits(state) && roll <= spent
