import { t, translateRuleLabel } from '@/locales/translation'
import type { MagicSpell } from './magicApi'
import { getAttributeAbbreviation } from './talentCatalog'

type Language = 'de' | 'en'

// Groups catalog entries by their Verbreitung (S. 287–304), e.g. "allgemein", "Elfen", "Gildenmagier, Hexen".
export function groupByDistribution<Entry>(entries: Entry[], getSpell: (entry: Entry) => MagicSpell | undefined) {
   const groups = new Map<string, { distribution: string[]; entries: Entry[] }>()
   for (const entry of entries) {
      const distribution = [...(getSpell(entry)?.traditions ?? [])].sort((left, right) => left.localeCompare(right, 'de'))
      const key = distribution.join('|') || 'unknown'
      const group = groups.get(key) ?? { distribution, entries: [] }
      group.entries.push(entry)
      groups.set(key, group)
   }
   return [...groups.entries()]
      .sort(([, left], [, right]) => left.distribution.join(', ').localeCompare(right.distribution.join(', '), 'de'))
      .map(([key, group]) => ({ key, ...group }))
}

export const distributionLabel = (distribution: string[], language: Language) => distribution.length
   ? distribution.map((origin) => translateRuleLabel(origin, language)).join(', ')
   : t('Unknown distribution', language)

export function rangeLabel(value: string, language: Language) {
   return /^\d+$/.test(value) ? `${value} ${t('Schritt', language)}` : t(value, language)
}

export function castingLabel(spell: MagicSpell, language: Language) {
   if (spell.kind === 'Hexenfluch') return `≥ 1 ${t('Action', language)}`
   return spell.kind === 'Zauberspruch' ? `${spell.castingTime} ${t(spell.castingTime === '1' ? 'Action' : 'Actions', language)}` : spell.castingTime
}

// Catalog facts that don't depend on a hero; label keys go through `t`.
export function spellFactRows(spell: MagicSpell, language: Language): Array<[string, string]> {
   const curse = spell.kind === 'Hexenfluch'
   const rows: Array<[string, string]> = [
      ['Probe', `${spell.probe.map((attribute) => getAttributeAbbreviation(attribute, language)).join('/')} ${spell.resistance ? `− ${spell.resistance}${curse ? '/2' : ''}` : ''}`],
      ['Costs', `${spell.cost} AsP`],
      ['Casting time', castingLabel(spell, language)],
      ['Spell range', rangeLabel(spell.range, language)],
      ['Duration', t(spell.duration, language)],
      ['Target category', spell.target],
      ['Merkmal', translateRuleLabel(spell.property, language)],
      ['Verbreitung', distributionLabel(spell.traditions, language)],
      ['StF', spell.stfClass.toUpperCase()],
   ]
   return rows.filter(([label]) => !curse || label !== 'Target category')
}
