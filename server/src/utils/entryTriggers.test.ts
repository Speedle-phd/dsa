import { describe, expect, it } from 'vitest'
import { activeTriggers, triggerLevels, triggerOptions } from './entryTriggers'
import { checkModifiers } from './checkModifiers'
import { conditionalResistances } from './entryDerivedValues'

const base = { pain: 0, combatConditions: {}, combatSpecialAbilities: [], equipment: [], advantages: [] }

describe('Disadvantage triggers (S. 170, 173, 177)', () => {
   const disadvantages = ['Angst vor (Spinnen) II', 'Lichtempfindlich', 'Sensibler Geruchssinn', 'Behäbig']
   it('lists only disadvantages with a trigger', () => {
      expect(triggerOptions({ disadvantages })).toEqual([
         { key: 'Angst vor (Spinnen) II', condition: 'Furcht', levels: 2, page: 170 },
         { key: 'Lichtempfindlich', condition: 'Schmerz', levels: 1, page: 173 },
         { key: 'Sensibler Geruchssinn', condition: 'Verwirrung', levels: 1, page: 177 },
      ])
   })
   it('counts switched-on triggers and ignores stale ones', () => {
      expect(triggerLevels({ disadvantages, triggers: ['Angst vor (Spinnen) II', 'Angst vor (Blut)'] })).toEqual({ Furcht: 2, Schmerz: 0, Verwirrung: 0 })
      expect(activeTriggers({ disadvantages: [], triggers: ['Lichtempfindlich'] })).toEqual([])
   })
   it('adds Furcht per level of Angst vor to every check, capped at IV', () => {
      const result = checkModifiers({ ...base, combatConditions: { Furcht: 3 }, disadvantages, triggers: ['Angst vor (Spinnen) II'] })
      expect(result.profiles.find((entry) => entry.kind === 'attribute')!.sources).toContainEqual({ label: 'Furcht', value: -4, page: 33 })
   })
   it('Lichtempfindlich adds one level of Schmerz; Sensibler Geruchssinn one level of Verwirrung', () => {
      const result = checkModifiers({ ...base, disadvantages, triggers: ['Lichtempfindlich', 'Sensibler Geruchssinn'] })
      const sources = result.profiles.find((entry) => entry.kind === 'talent')!.sources
      expect(sources).toContainEqual({ label: 'Schmerz', value: -1, page: 34 })
      expect(sources).toContainEqual({ label: 'Verwirrung', value: -1, page: 34 })
      expect(result.effectivePain).toBe(1)
   })
})

describe('SK/ZK against poison, disease and magic (S. 165, 167, 168, 171, 172, 179)', () => {
   it('lists the conditional values per level', () => {
      expect(conditionalResistances({ advantages: ['Giftresistenz II', 'Schwer zu verzaubern'], disadvantages: ['Krankheitsanfällig I', 'Wahrer Name'] })).toEqual([
         { label: 'Giftresistenz II', against: 'poison', value: 2, page: 165 },
         { label: 'Krankheitsanfällig I', against: 'disease', value: -1, page: 172 },
         { label: 'Schwer zu verzaubern', against: 'magic', value: 1, page: 168 },
         { label: 'Wahrer Name', against: 'trueName', value: -4, page: 179 },
      ])
   })
})
