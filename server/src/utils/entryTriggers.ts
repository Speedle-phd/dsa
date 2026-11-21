import { selectionFromEntry } from './characterEntryRules'

type TriggerState = { disadvantages?: string[]; triggers?: string[] }
export type TriggerCondition = 'Furcht' | 'Schmerz' | 'Verwirrung'
export type TriggerOption = { key: string; condition: TriggerCondition; levels: number; page: number }

// Disadvantages whose condition only applies while their trigger is present; the GM says when (rule data).
// source: DSA5 Regelwerk, S. 170 (Angst vor …: Furcht per level), S. 173 (Lichtempfindlich: Schmerz I in sunlight),
// S. 177 (Sensibler Geruchssinn: Verwirrung I near foul smells)
const triggerRules: Record<string, { condition: TriggerCondition; perLevel: boolean; page: number }> = {
   'Angst vor': { condition: 'Furcht', perLevel: true, page: 170 },
   Lichtempfindlich: { condition: 'Schmerz', perLevel: false, page: 173 },
   'Sensibler Geruchssinn': { condition: 'Verwirrung', perLevel: false, page: 177 },
}

export function triggerOptions(state: TriggerState): TriggerOption[] {
   return (state.disadvantages ?? []).flatMap((key) => {
      const selection = selectionFromEntry('disadvantages', key)
      const rule = selection && triggerRules[selection.catalogKey]
      return rule ? [{ key, condition: rule.condition, levels: rule.perLevel ? selection.level : 1, page: rule.page }] : []
   })
}

// Only switched-on triggers of owned disadvantages count; stale ones (entry removed) are ignored.
export function activeTriggers(state: TriggerState) {
   return triggerOptions(state).filter((option) => state.triggers?.includes(option.key))
}

export function triggerLevels(state: TriggerState): Record<TriggerCondition, number> {
   const levels: Record<TriggerCondition, number> = { Furcht: 0, Schmerz: 0, Verwirrung: 0 }
   for (const option of activeTriggers(state)) levels[option.condition] += option.levels
   return levels
}
