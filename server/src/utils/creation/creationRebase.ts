import { creationLedger, type CreationDraftData } from './creationLedger'

const rebased = ['talents', 'techniques', 'spells', 'liturgies'] as const

// User decision: values bought before a Kultur-/Professionspaket keep their purchase on top of the package.
// The draft stores absolute values, so when a package base changes (choosing or dropping a culture package or
// profession), every value the player set moves by the same amount (Holzbearbeitung activated at 0 + package +1 = 1).
// Values that would drop below 0 are removed and fall back to the base, or to "not activated".
export function rebaseDraftValues(previous: CreationDraftData, next: CreationDraftData): CreationDraftData {
   const before = creationLedger(previous)
   const after = creationLedger(next)
   const result = { ...next }
   for (const group of rebased) {
      const values: Record<string, number> = {}
      for (const [key, value] of Object.entries(next[group] ?? {})) {
         const shifted = value + (after[group][key]?.base ?? 0) - (before[group][key]?.base ?? 0)
         if (shifted >= 0) values[key] = shifted
      }
      result[group] = values
   }
   return result
}
