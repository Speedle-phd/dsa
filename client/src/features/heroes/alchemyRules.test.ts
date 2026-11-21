import { describe, expect, it } from 'vitest'
import { analysisModifiers, bestLaboratory, brewFailureFor, laboratoryModifier, normalizeLaboratory } from './alchemyRules'

describe('Alchemy (S. 270–272)', () => {
   it('rates labs like the server', () => {
      expect(bestLaboratory(['Hexenküche', 'Archaisches Labor'])).toBe('Hexenküche')
      expect(laboratoryModifier('Hexenküche', normalizeLaboratory('Alchimistenlabor'))).toBe(-3)
      expect(laboratoryModifier('Archaisches Labor', 'Alchemistenlabor')).toBeNull()
      expect(laboratoryModifier(null, 'Archaisches Labor')).toBeNull()
   })
   it('builds the analysis modifiers', () => {
      expect(analysisModifiers(-2, 'Alchemistenlabor', true)).toEqual([
         { label: 'Half the Brauschwierigkeit', value: -1 }, { label: 'Laboratory', value: 1 }, { label: 'Recipe known', value: 1 }])
      expect(analysisModifiers(0, 'Hexenküche', false)).toEqual([])
   })
   it('looks up the failure table including the Patzer bonus', () => {
      expect(brewFailureFor(5).en).toBe('Nothing else happens.')
      expect(brewFailureFor(18).en).toContain('QS 3')
      expect(brewFailureFor(20 + 5).en).toContain('eats through')
   })
})
