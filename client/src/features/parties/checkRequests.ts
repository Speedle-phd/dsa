import { attributeLabels, talentCatalog, type TalentAttribute } from '@/features/heroes/talentCatalog'
import type { Language } from '@/locales/languageStore'
import { t, translateRuleLabel } from '@/locales/translation'
import type { CheckKind, CheckOutcome, CheckRequest, CheckResult } from './checkRequestApi'

// A rolled talent check (3W20) as the result the GM sees; QS only for a success
export function fromTalentCheck(state: { result: { success: boolean; rolls: number[]; outcome: CheckOutcome }; quality: number | null }): CheckResult {
   return { success: state.result.success, qs: state.result.success ? state.quality : null, rolls: state.result.rolls.slice(0, 3), outcome: state.result.outcome }
}

// A rolled attribute check (W20 with confirmation, S. 20)
export function fromAttributeCheck(roll: { success: boolean; roll: number; confirmation?: number; outcome: CheckOutcome }): CheckResult {
   return { success: roll.success, qs: null, rolls: roll.confirmation === undefined ? [roll.roll] : [roll.roll, roll.confirmation], outcome: roll.outcome }
}

export const isAttribute = (key: string): key is TalentAttribute => key in attributeLabels

// "Sinnesschärfe −2", "Courage +1"
export function checkTitle(request: { kind: CheckKind; key: string; modifier: number }, language: Language) {
   const name = request.kind === 'attribute' && isAttribute(request.key) ? t(attributeLabels[request.key], language)
      : translateRuleLabel(talentCatalog.find((talent) => talent.key === request.key)?.label ?? request.key, language)
   return request.modifier === 0 ? name : `${name} ${request.modifier > 0 ? '+' : '−'}${Math.abs(request.modifier)}`
}

const outcomeLabels: Record<CheckOutcome, string> = {
   success: 'Success', failure: 'Failed', critical: 'Critical success', spectacular: 'Critical success (triple 1)',
   botch: 'Botch', disaster: 'Botch (triple 20)', criticalUnconfirmed: 'Critical, not confirmed', botchAverted: 'Botch averted',
}

// "Gelungen · QS 2", "Patzer"
export function resultSummary(result: CheckResult, language: Language) {
   const outcome = t(outcomeLabels[result.outcome], language)
   return result.qs === null ? outcome : `${outcome} · ${t('QS', language)} ${result.qs}`
}

// Requests the viewer still has to answer for one hero
export const openForHero = (requests: CheckRequest[], charId: string) =>
   requests.filter((request) => request.status === 'open' && request.targets.some((target) => target.mine && target.charId === charId && target.state === 'open'))
