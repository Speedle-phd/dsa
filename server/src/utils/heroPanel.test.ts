import { describe, expect, it } from 'vitest'
import type { HeroPanel } from '@/models/encounter.model'
import { panelSchema } from '@/validations/encounterValidation'
import { panelView } from './encounterRules'

const panel: HeroPanel = {
   round: 2, stance: 'Vorstoß', leader: false, tempPain: false, ignoreConditions: false, fateDefense: true,
   defensePenalty: 3, nextActionPenalty: 0, noDefense: false, casting: null,
   weapons: [{ key: 'Kurzbogen-3', loaded: false, state: null }],
}

describe('hero panel copy', () => {
   it('is shown to the GM and the hero\'s own player only', () => {
      expect(panelView(panel, true, false)).toEqual(panel)
      expect(panelView(panel, false, true)).toEqual(panel)
      expect(panelView(panel, false, false)).toBeNull()
      expect(panelView(undefined, true, false)).toBeNull()
   })

   it('accepts a valid panel and rejects unknown stances, out-of-range values and extra weapons', () => {
      expect(panelSchema.safeParse(panel).success).toBe(true)
      expect(panelSchema.safeParse({ ...panel, stance: 'Wuchtschlag' }).success).toBe(false)
      expect(panelSchema.safeParse({ ...panel, defensePenalty: 99 }).success).toBe(false)
      expect(panelSchema.safeParse({ ...panel, weapons: Array.from({ length: 31 }, (_, index) => ({ key: `w${index}`, loaded: null, state: null })) }).success).toBe(false)
   })
})
