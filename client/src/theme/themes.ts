// Colour themes (user decision, Nov 2026: Parchment and Ember next to the green Light and Dark). Each theme is one token
// block in index.css (`:root` for light, `.dark`, `.theme-<id>`); dark themes also keep the class `dark` on <html>.
// Swatch colours (page, card, main colour) mirror the token values; they are an app choice like the tokens.
export const themes = [
   { id: 'light', label: 'Light', mode: 'light', className: null, swatch: ['#f5f7f5', '#ffffff', '#3e6f60'] },
   { id: 'dark', label: 'Dark', mode: 'dark', className: null, swatch: ['#161d1a', '#1f2824', '#a4c1b2'] },
   { id: 'parchment', label: 'Parchment', mode: 'light', className: 'theme-parchment', swatch: ['#f1e9da', '#faf7ef', '#7c1d2a'] },
   { id: 'ember', label: 'Ember', mode: 'dark', className: 'theme-ember', swatch: ['#1b1513', '#26201d', '#f69b55'] },
] as const

export type Theme = (typeof themes)[number]
export type ThemeId = Theme['id']
export type ResolvedMode = Theme['mode']

// A stored id that no longer exists (a removed theme) falls back to the default instead of an unstyled page
export const themeById = (id: string): Theme => themes.find((theme) => theme.id === id) ?? themes[0]
export const themeClasses = themes.flatMap((theme) => theme.className ? [theme.className] : [])
