/// <reference types="node" />
// Reads the stylesheet as a file: in tests Vite delivers CSS imports (also ?raw) empty
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contrast, pairs, rootTokens, themeTokens } from './themeTokens'
import { themeById, themes } from './themes'

const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')
const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')


describe('themes', () => {
   it('defines every colour token in every theme (a missing one would silently inherit from Light)', () => {
      const reference = Object.keys(rootTokens(css)).sort()
      expect(reference.length).toBeGreaterThan(50)
      for (const theme of themes) expect(Object.keys(themeTokens(css, theme).own ?? {}).sort(), theme.id).toEqual(reference)
   })

   it('knows every theme in the pre-paint script of index.html with its mode', () => {
      for (const theme of themes) expect(html, theme.id).toContain(`${theme.id}: '${theme.mode}'`)
   })

   it('falls back to the default theme for an unknown stored id', () => {
      expect(themeById('removed-theme').id).toBe('light')
   })

   for (const theme of themes) {
      it(`meets the contrast of every rendered pair in ${theme.id} (WCAG 1.4.3, 1.4.11)`, () => {
         const tokens = themeTokens(css, theme).all
         const failures = pairs.filter((pair) => contrast(tokens[pair.fg], tokens[pair.bg]) < pair.min)
            .map((pair) => `${pair.fg} on ${pair.bg}: ${contrast(tokens[pair.fg], tokens[pair.bg]).toFixed(2)} < ${pair.min} (${pair.note})`)
         expect(failures).toEqual([])
      })
   }
})
