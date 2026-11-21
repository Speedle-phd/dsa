import { isAxiosError } from 'axios'
import { useLanguageStore } from '../locales/languageStore'
import { t } from '../locales/translation'

function translateDynamicServerError(message: string, language: 'de' | 'en') {
   const patterns: Array<[RegExp, string]> = [
      [
         /^Remove dependent combat abilities first: (.+)\.$/,
         'Remove dependent combat abilities first: {names}.',
      ],
      [/^Remove dependent entries first: (.+)\.$/, 'Remove dependent entries first: {names}.'],
      [
         /^(.+?) current value cannot exceed its maximum value\.$/,
         '{name} current value cannot exceed its maximum value.',
      ],
      [
         /^Additional purchase value must be between (.+) and (.+)\.$/,
         'Additional purchase value must be between {min} and {max}.',
      ],
      [/^Cannot update derived fields: (.+)$/, 'Cannot update derived fields: {fields}'],
      [
         /^This purchase costs (.+) kreuzer, but you only have (.+) kreuzer available\.$/,
         'This purchase costs {cost} kreuzer, but you only have {available} kreuzer available.',
      ],
      [
         /^You cannot lose (.+) kreuzer, but you only have (.+) kreuzer available\.$/,
         'You cannot lose {amount} kreuzer, but you only have {available} kreuzer available.',
      ],
      [/^Unknown talents: (.+)$/, 'Unknown talents: {keys}'],
   ]

   for (const [pattern, template] of patterns) {
      const match = pattern.exec(message)
      if (!match) continue

      const translatedTemplate = t(template, language)
      if (template.includes('{names}')) {
         return translatedTemplate.replace('{names}', () => match[1])
      }
      if (template.includes('{name}')) {
         return translatedTemplate.replace('{name}', () => match[1])
      }
      if (template.includes('{min}')) {
         return translatedTemplate
            .replace('{min}', () => match[1])
            .replace('{max}', () => match[2])
      }
      if (template.includes('{fields}')) {
         return translatedTemplate.replace('{fields}', () => match[1])
      }
      if (template.includes('{cost}')) {
         return translatedTemplate
            .replace('{cost}', () => match[1])
            .replace('{available}', () => match[2])
      }
      if (template.includes('{amount}')) {
         return translatedTemplate
            .replace('{amount}', () => match[1])
            .replace('{available}', () => match[2])
      }
      return translatedTemplate.replace('{keys}', () => match[1])
   }

   return t(message, language)
}

export function getErrorMessage(error: unknown): string {
   const language = useLanguageStore.getState().language

   if (isAxiosError<{ message?: string }>(error)) {
      const message = error.response?.data?.message
      return message
         ? translateDynamicServerError(message, language)
         : t('Unable to reach the server', language)
   }

   if (error instanceof Error) {
      return translateDynamicServerError(error.message, language)
   }

   return t('Something went wrong. Please try again.', language)
}
