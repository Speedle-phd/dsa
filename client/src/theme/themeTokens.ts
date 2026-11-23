// Reads the colour tokens of every theme from index.css and computes WCAG contrast (used by themes.test.ts).
// Tokens are bare HSL triplets ("161 17% 17%") as the app writes them inside `hsl(var(--token))`.
import type { Theme } from './themes'

export const colorToken = /^--(?:(?:text|background|primary|secondary|accent)-\d+|danger|success|warning|shadow-color)$/

function block(css: string, selector: string) {
   const start = css.search(new RegExp(`(^|\\n)\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{`))
   if (start < 0) return null
   const open = css.indexOf('{', start)
   const close = css.indexOf('}', open)
   const tokens: Record<string, string> = {}
   for (const match of css.slice(open + 1, close).matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
      if (colorToken.test(match[1])) tokens[match[1]] = match[2].trim()
   }
   return tokens
}

// The tokens a theme renders with: light themes on top of :root, dark themes on top of :root and .dark
export function themeTokens(css: string, theme: Theme) {
   const root = block(css, ':root') ?? {}
   const dark = theme.mode === 'dark' ? block(css, '.dark') ?? {} : {}
   const own = theme.className ? block(css, `.${theme.className}`) : theme.id === 'dark' ? dark : root
   return { own, all: { ...root, ...dark, ...(own ?? {}) } }
}
export const rootTokens = (css: string) => block(css, ':root') ?? {}

function luminance(triplet: string) {
   const [h, s, l] = triplet.replace(/%/g, '').split(/\s+/).map(Number)
   const a = (s / 100) * Math.min(l / 100, 1 - l / 100)
   const f = (n: number) => {
      const k = (n + h / 30) % 12
      return l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
   }
   const channel = (c: number) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
   return 0.2126 * channel(f(0)) + 0.7152 * channel(f(8)) + 0.0722 * channel(f(4))
}
export function contrast(a: string, b: string) {
   const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
   return (x + 0.05) / (y + 0.05)
}

// The colour pairs the app renders (counted from index.css: text-600…900 on the page and cards, primary text and links,
// filled buttons, status text, focus ring and the gold summary marker). min: 4.5 for text, 3 for icons and outlines.
export const pairs: Array<{ fg: string; bg: string; min: number; note: string }> = [
   ...['--text-900', '--text-800', '--text-700', '--text-600'].flatMap((fg) => ['--background-50', '--background-100'].map((bg) => ({ fg, bg, min: 4.5, note: 'text' }))),
   { fg: '--text-600', bg: '--background-200', min: 4.5, note: 'muted text on raised surfaces' },
   { fg: '--text-900', bg: '--primary-100', min: 4.5, note: 'text on hovered / selected rows' },
   { fg: '--text-600', bg: '--primary-50', min: 4.5, note: 'muted text on tinted panels' },
   ...['--primary-600', '--primary-700', '--primary-800'].flatMap((fg) => ['--background-50', '--background-100'].map((bg) => ({ fg, bg, min: 4.5, note: 'primary text and links' }))),
   { fg: '--primary-700', bg: '--primary-100', min: 4.5, note: 'primary text on tinted chips' },
   { fg: '--secondary-700', bg: '--background-50', min: 4.5, note: 'secondary text' },
   { fg: '--accent-800', bg: '--accent-100', min: 4.5, note: 'gold badges' },
   { fg: '--primary-50', bg: '--primary-700', min: 4.5, note: 'filled primary button' },
   { fg: '--background-50', bg: '--primary-700', min: 4.5, note: 'text on filled surfaces' },
   ...['--danger', '--success', '--warning'].flatMap((fg) => ['--background-50', '--background-100'].map((bg) => ({ fg, bg, min: 4.5, note: 'status text' }))),
   { fg: '--primary-500', bg: '--background-50', min: 3, note: 'focus ring and outlines' },
   { fg: '--accent-500', bg: '--background-50', min: 3, note: 'summary marker (sword icon)' },
]

