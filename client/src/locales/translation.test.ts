/// <reference types="node" />
// Every literal t('…') key in the client has an entry with both languages; a missing key shows the English text in German.
import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import translations from './translation.json'

const dictionary = translations as Record<string, { de?: string; en?: string }>
const srcDir = new URL('../', import.meta.url)

function literalKeys() {
   const keys = new Map<string, string>()
   const files = (readdirSync(srcDir, { recursive: true }) as string[])
      .filter((file) => /\.(ts|tsx)$/.test(file) && !/\.test\.tsx?$/.test(file))
   // t('key', …) or t("key") with a plain string as the first argument (no template substitutions)
   const call = /(?<![\w.])t\(\s*(['"])((?:\\.|(?!\1)[^\\\n])*)\1\s*[,)]/g
   for (const file of files) {
      const source = readFileSync(new URL(file.replace(/\\/g, '/'), srcDir), 'utf8')
      for (const match of source.matchAll(call)) {
         const key = match[2].replace(/\\(['"\\])/g, '$1')
         if (!keys.has(key)) keys.set(key, file)
      }
   }
   return keys
}

describe('translations', () => {
   it('has a German and an English text for every literal t() key', () => {
      const keys = literalKeys()
      expect(keys.size).toBeGreaterThan(1000)
      const missing = [...keys].filter(([key]) => !dictionary[key]?.de || !dictionary[key]?.en).map(([key, file]) => `${file}: ${key}`)
      expect(missing).toEqual([])
   })

   it('has no entry with an empty text', () => {
      const empty = Object.entries(dictionary).filter(([, entry]) => !entry.de?.trim() || !entry.en?.trim()).map(([key]) => key)
      expect(empty).toEqual([])
   })
})
