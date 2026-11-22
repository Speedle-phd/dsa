import { t } from '@/locales/translation'
import type { CombatOutcome, EncounterLogEntry } from './encounterApi'

export const outcomeLabels: Record<CombatOutcome, string> = {
   success: 'Success', failure: 'Failed', critical: 'Critical success', criticalUnconfirmed: 'Critical, not confirmed',
   botch: 'Botch', botchAverted: 'Botch averted',
}
export const attackColor = '#c0392b'
export const defenseColor = '#2563eb'

// Log entries keep a translation key plus values and are localized when shown (translations.instructions.md)
export function logText(entry: EncounterLogEntry, language: 'de' | 'en') {
   return t(entry.key, language).replace(/\{(\w+)\}/g, (_, key: string) => {
      const value = entry.values[key]
      if (key === 'outcome' && typeof value === 'string' && value in outcomeLabels) return t(outcomeLabels[value as CombatOutcome], language)
      // Turn-bound actions arrive as English names (Casting, Loading, Aiming, Flucht …)
      if (key === 'action' && typeof value === 'string') return t(value, language)
      return String(value ?? '')
   })
}

// source: DSA5 Regelwerk, S. 232 (−3 per further PA/AW in the KR), S. 354 (VW not lowered), S. 243–244 (shot −4, thrown −2),
// S. 231 (critical attack halves, rounded up). Mirrors server/src/utils/encounterRules.ts npcDefenseTarget.
export function npcDefenseTarget(value: number, kind: 'parry' | 'dodge' | 'defense', previousDefenses: number, critical: boolean, incoming: 'melee' | 'shot' | 'thrown') {
   const penalty = kind === 'defense' ? 0 : 3 * previousDefenses
   const reduced = value + (incoming === 'shot' ? -4 : incoming === 'thrown' ? -2 : 0) - penalty
   return critical ? Math.ceil(reduced / 2) : reduced
}
