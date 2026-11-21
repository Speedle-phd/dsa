import translations from './translation.json'
import type { Language } from './languageStore'

export const t = (key: string, language: Language = 'en') => {
   return (
      (translations as Record<string, Record<string, string>>)[key]?.[
         language
      ] ?? key
   )
}

export const translateRuleLabel = (label: string, language: Language): string => {
   const translated = t(label, language)
   if (translated !== label) return translated
   const level = /^(.*?) (I|II|III|IV|V|VI|VII|VIII|IX|X)$/.exec(label)
   if (level) return `${translateRuleLabel(level[1], language)} ${level[2]}`
   const parameter = /^(.*?) (\(.+\))$/.exec(label)
   if (parameter) return `${translateRuleLabel(parameter[1], language)} ${parameter[2]}`
   return label
}
