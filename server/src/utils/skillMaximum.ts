import { getCombatTechnique } from './combatRules'
import { selectionFromEntry } from './characterEntryRules'
import { talentCatalog, type TalentAttribute } from './talentCatalog'

type MaximumState = Record<TalentAttribute, number> & { advantages?: string[] }

// Herausragende Fertigkeit/Kampftechnik picks recorded for this skill (levels count as picks).
function outstandingPicks(state: MaximumState, entry: 'Herausragende Fertigkeit' | 'Herausragende Kampftechnik', key: string) {
   return (state.advantages ?? []).reduce((sum, name) => {
      const selection = selectionFromEntry('advantages', name)
      return selection?.catalogKey === entry && selection.detail === key ? sum + selection.level : sum
   }, 0)
}

// source: DSA5 Regelwerk, S. 39 (highest probe attribute + 2), S. 166 (Herausragende Fertigkeit +1 per pick, at most 2)
export function talentMaximum(state: MaximumState, talentKey: string) {
   const talent = talentCatalog.find((entry) => entry.key === talentKey)
   if (!talent) return null
   return Math.max(...talent.probe.map((attribute) => state[attribute] ?? 0)) + 2 + outstandingPicks(state, 'Herausragende Fertigkeit', talentKey)
}

// source: DSA5 Regelwerk, S. 39 (Leiteigenschaft + 2), S. 166 (Herausragende Kampftechnik +1)
export function combatTechniqueMaximum(state: MaximumState, techniqueKey: string) {
   const technique = getCombatTechnique(techniqueKey)
   if (!technique) return null
   return Math.max(...technique.attributes.map((attribute) => state[attribute] ?? 0)) + 2 + outstandingPicks(state, 'Herausragende Kampftechnik', techniqueKey)
}
