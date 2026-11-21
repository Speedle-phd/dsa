import { getAttributeAbbreviation, talentCatalog, type TalentAttribute } from '@/features/heroes/talentCatalog'
import { t } from '@/locales/translation'
import { attributeOrder, type CreationIssue } from './creationApi'

export function talentName(key: string, language: 'de' | 'en') {
   const talent = talentCatalog.find((entry) => entry.key === key)
   return talent ? t(talent.label, language) : key
}

// Server issues are English templates; values may be attribute or talent keys.
export function issueText(issue: CreationIssue, language: 'de' | 'en') {
   const value = (raw: string | number) => {
      const text = String(raw)
      if (attributeOrder.includes(text as TalentAttribute)) return getAttributeAbbreviation(text as TalentAttribute, language)
      return talentCatalog.some((entry) => entry.key === text) ? talentName(text, language) : t(text, language)
   }
   return Object.entries(issue.values ?? {}).reduce((text, [key, raw]) => text.replace(`{${key}}`, value(raw)), t(issue.message, language))
}
