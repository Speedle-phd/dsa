import { t, translateRuleLabel } from '@/locales/translation'
import type { Stats } from './statsApi'
import { getAttributeAbbreviation } from './talentCatalog'

// source: DSA5 Regelwerk, S. 56–57 (20 + Leiteigenschaft ± Vor-/Nachteile, plus Zukauf); values derived on the server
export function energyBreakdown(stats: Stats, kind: 'mana' | 'karmaEnergy', language: 'de' | 'en') {
   const pool = stats[kind]
   const leading = pool.leadingAttribute
      ? `${getAttributeAbbreviation(pool.leadingAttribute, language)} ${pool.traditionAttributeBonus ?? 0}`
      : `${t('no tradition', language)} 0`
   const parts: Array<[number, string]> = [
      [pool.advantageBonus ?? 0, t('Advantages/disadvantages', language)],
      [pool.bonusMalus, t('other', language)],
      [pool.additionalPurchase, t('purchased', language)],
   ]
   const extras = parts.filter(([value]) => value !== 0).map(([value, label]) => `${value < 0 ? '−' : '+'} ${Math.abs(value)} (${label})`)
   return [`20 (${kind === 'mana' ? 'Zauberer' : 'Geweihter'})`, `+ ${leading}`, ...extras, `= ${pool.max}`].join(' ')
}

// source: DSA5 Regelwerk, S. 57, 166, 174 (LE-Grundwert + 2 × KO ± Vor-/Nachteile, plus Zukauf)
export function healthBreakdown(stats: Stats, language: 'de' | 'en') {
   const ko = getAttributeAbbreviation('constitution', language)
   const parts: Array<[number, string]> = [
      [stats.health.advantageBonus ?? 0, t('Advantages/disadvantages', language)],
      [stats.health.bonusMalus, t('other', language)],
      [stats.health.additionalPurchase, t('purchased', language)],
   ]
   const extras = parts.filter(([value]) => value !== 0).map(([value, label]) => `${value < 0 ? '−' : '+'} ${Math.abs(value)} (${label})`)
   return [`${stats.health.value} (${t('species', language)})`, `+ 2 × ${ko} ${stats.constitution}`, ...extras, `= ${stats.health.max}`].join(' ')
}

const signedPart = (value: number, label: string) => `${value < 0 ? '−' : '+'} ${Math.abs(value)} (${label})`
function entryParts(sources: Stats['soulPower']['entrySources'], other: number, language: 'de' | 'en') {
   return [...(sources ?? []).map((source) => signedPart(source.value, translateRuleLabel(source.label, language))),
      ...(other ? [signedPart(other, t('other', language))] : [])]
}

// source: DSA5 Regelwerk, S. 28, 166–167, 174 (Grundwert + (MU + KL + IN) / 6 or (KO + KO + KK) / 6, rounded, ± Vor-/Nachteile)
export function resistanceBreakdown(stats: Stats, kind: 'soulPower' | 'toughness', language: 'de' | 'en') {
   const attributes = kind === 'soulPower' ? (['courage', 'wisdom', 'intuition'] as const) : (['constitution', 'constitution', 'strength'] as const)
   const pool = stats[kind]
   const average = `(${attributes.map((key) => `${getAttributeAbbreviation(key, language)} ${stats[key]}`).join(' + ')}) / 6`
   return [`${pool.value} (${t('species', language)})`, `+ ${average}`, ...entryParts(pool.entrySources, pool.bonusMalus, language), `= ${pool.max}`].join(' ')
}

// source: DSA5 Regelwerk, S. 29, 165, 174 (3 Schips ± Glück/Pech, never below 0)
export function fateBreakdown(stats: Stats, language: 'de' | 'en') {
   const pool = stats.fatePoints
   return [`${pool.value} (${t('base value', language)})`, ...entryParts(pool.entrySources, pool.bonusMalus, language), `= ${pool.max}`].join(' ')
}

// source: DSA5 Regelwerk, S. 165, 171, 179 (GS-Grundwert ± Flink/Behäbig, Einbeinig halves it; rounding up is a user decision)
export function speedBaseBreakdown(stats: Stats, base: number, language: 'de' | 'en') {
   const { sources, halved } = stats.checkModifiers.speedBase
   if (!sources.length && !halved) return null
   const sum = [`${base} (${t('species', language)})`, ...entryParts(sources, 0, language)].join(' ')
   return `${t('Movement base', language)}: ${halved ? `(${sum}) / 2, ${t('rounded up', language)} (${translateRuleLabel(halved.label, language)})` : sum} = ${speedBaseValue(stats, base)}`
}

export function speedBaseValue(stats: Stats, base: number) {
   const adjusted = base + stats.checkModifiers.speedBase.sources.reduce((sum, source) => sum + source.value, 0)
   return stats.checkModifiers.speedBase.halved ? Math.ceil(adjusted / 2) : adjusted
}
