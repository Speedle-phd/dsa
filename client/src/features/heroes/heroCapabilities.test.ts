import { describe, expect, it } from 'vitest'
import { hasArcana, hasKarma } from './heroCapabilities'

const hero = { advantages: [] as string[], generalSpecialAbilities: [] as string[], spells: [] as never[], magicTricks: [] as never[], liturgies: [] as never[], blessings: [] as never[] }

describe('hero tabs for casters and priests', () => {
   it('hides both for a mundane hero', () => {
      expect(hasArcana(hero)).toBe(false)
      expect(hasKarma(hero)).toBe(false)
   })
   it('shows Arcana for Zauberer or a magic tradition, not for a church tradition', () => {
      expect(hasArcana({ ...hero, advantages: ['Zauberer'] })).toBe(true)
      expect(hasArcana({ ...hero, generalSpecialAbilities: ['Tradition (Hexe)'] })).toBe(true)
      expect(hasArcana({ ...hero, generalSpecialAbilities: ['Tradition (Rondrakirche)'] })).toBe(false)
   })
   it('shows Divine works for Geweihter or a church tradition', () => {
      expect(hasKarma({ ...hero, advantages: ['Geweihter'] })).toBe(true)
      expect(hasKarma({ ...hero, generalSpecialAbilities: ['Tradition (Boronkirche)'] })).toBe(true)
   })
   it('keeps a tab visible while it holds recorded spells or liturgies', () => {
      expect(hasArcana({ ...hero, spells: [{ key: 'Armatrutz' }] as never[] })).toBe(true)
      expect(hasKarma({ ...hero, blessings: [{ key: 'Feuersegen' }] as never[] })).toBe(true)
   })
})
