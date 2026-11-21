import { describe, expect, it } from 'vitest'
import { creationLedger, emptyDraft, type CreationDraftData } from './creationLedger'
import { cultureCatalog } from './cultureCatalog'
import { rebaseDraftValues } from './creationRebase'

const culture = cultureCatalog[0]
const [talent, bonus] = Object.entries(culture.package.talents)[0]
const draft = (change: Partial<CreationDraftData> = {}): CreationDraftData =>
   ({ ...emptyDraft(), culture: culture.key, language: culture.languages[0], ...change })

describe('values bought before a Kulturpaket stay on top of it', () => {
   it('a talent activated at 0 rises by the package bonus', () => {
      const next = rebaseDraftValues(draft({ talents: { [talent]: 0 } }), draft({ culturePackage: true, talents: { [talent]: 0 } }))
      expect(next.talents[talent]).toBe(bonus)
      expect(creationLedger(next).talents[talent]).toMatchObject({ base: bonus, value: bonus, cost: 0 })
   })
   it('raised steps are kept and dropping the package restores the old value', () => {
      const withPackage = rebaseDraftValues(draft({ talents: { [talent]: 3 } }), draft({ culturePackage: true, talents: { [talent]: 3 } }))
      expect(withPackage.talents[talent]).toBe(3 + bonus)
      expect(rebaseDraftValues(withPackage, { ...withPackage, culturePackage: false }).talents[talent]).toBe(3)
   })
   it('leaves values alone when no base changes', () => {
      const data = draft({ culturePackage: true, talents: { [talent]: 5 } })
      expect(rebaseDraftValues(data, data).talents).toEqual({ [talent]: 5 })
   })
})
