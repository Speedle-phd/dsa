import { describe, expect, it } from 'vitest'
import { checkModifiers, type CheckProfile } from './checkModifiers'

const stats = {
   pain: 0, combatConditions: {}, combatSpecialAbilities: [] as string[],
   wornArmor: null as string | null, equipment: [{ item: 'Kettenrüstung', amount: 1 }, { item: 'Plattenrüstung', amount: 1 },
      { item: 'Unterkleidung für Metallrüstungen', amount: 1, carriedOn: 'Equipped' }],
}
function getProfile(result: ReturnType<typeof checkModifiers>, kind: CheckProfile['kind'], overrides: Partial<CheckProfile> = {}) {
   const context = { kind, burden: kind === 'attack' || kind === 'defense', movement: ['attack', 'defense', 'ranged'].includes(kind),
      pleasing: false, complex: false, ...overrides }
   return result.profiles.find((entry) => entry.kind === context.kind && entry.burden === context.burden &&
      entry.movement === context.movement && entry.pleasing === context.pleasing && entry.complex === context.complex)!
}
describe('Condition and worn armor modifiers (S. 23, 32–34, 246)', () => {
   it('does not apply armor merely because it is owned', () => {
      const result = checkModifiers(stats)
      expect(result.burden).toBe(0)
      expect(getProfile(result, 'attack').total).toBe(0)
   })
   it('applies worn chain armor once to AT, defense, affected talents, INI and GS, not FK or attributes', () => {
      const result = checkModifiers({ ...stats, wornArmor: 'Kettenrüstung' })
      expect(result.burden).toBe(2)
      for (const kind of ['attack', 'defense'] as const) expect(getProfile(result, kind).total).toBe(-2)
      expect(getProfile(result, 'talent', { burden: true }).total).toBe(-2)
      expect(getProfile(result, 'talent').total).toBe(0)
      expect(getProfile(result, 'ranged').total).toBe(0)
      expect(getProfile(result, 'attribute').total).toBe(0)
      expect(result.initiative.total).toBe(-2)
      expect(result.speed.total).toBe(-2)
   })
   it.each([
      [[], 3, -3], [['Belastungsgewöhnung I'], 2, -2], [['Belastungsgewöhnung II'], 1, -1],
   ])('moves plate armor two rows per familiarity level', (abilities, burden, initiative) => {
      const result = checkModifiers({ ...stats, wornArmor: 'Plattenrüstung', combatSpecialAbilities: abilities })
      expect(result.armorBurden).toBe(burden)
      expect(result.initiative.total).toBe(initiative)
   })
   it('preserves the extra movement/initiative penalty of the effective armor row', () => {
      const result = checkModifiers({ ...stats, wornArmor: 'Lederrüstung', equipment: [{ item: 'Lederrüstung', amount: 1 }],
         combatSpecialAbilities: ['Belastungsgewöhnung I'] })
      expect(result.armorBurden).toBe(0)
      expect(result.initiative.total).toBe(-1)
      expect(getProfile(result, 'attack').total).toBe(0)
   })
   it('combines non-armor burden without reducing it via armor familiarity', () => {
      const result = checkModifiers({ ...stats, wornArmor: 'Plattenrüstung', combatConditions: { Belastung: 2 },
         combatSpecialAbilities: ['Belastungsgewöhnung II'] })
      expect(result.burden).toBe(3)
      expect(result.otherBurden).toBe(2)
      expect(getProfile(result, 'attack').total).toBe(-3)
   })
   it('caps condition penalties at five, with a matching source breakdown', () => {
      const result = checkModifiers({ ...stats, pain: 2, combatConditions: { Betäubung: 2, Furcht: 2 } })
      const profile = getProfile(result, 'ranged')
      expect(profile.total).toBe(-5)
      expect(profile.sources.reduce((sum, entry) => sum + entry.value, 0)).toBe(-5)
      expect(profile.blocked).toEqual([])
   })
   it('blocks all checks at eight total levels, even if some conditions do not modify that check', () => {
      const result = checkModifiers({ ...stats, pain: 2, combatConditions: { Belastung: 3, Furcht: 3 } })
      expect(getProfile(result, 'ranged').blocked).toContain('Eight condition levels: incapacitated.')
   })
   it('applies Paralyse only to movement/speech and scales GS', () => {
      const result = checkModifiers({ ...stats, combatConditions: { Paralyse: 2 } })
      expect(getProfile(result, 'attribute').total).toBe(0)
      expect(getProfile(result, 'attribute', { movement: true }).total).toBe(-2)
      expect(getProfile(result, 'ranged').total).toBe(-2)
      expect(result.speed.factor).toBe(0.5)
   })
   it('allows motionless checks at Paralyse IV, but not attacks or moving checks', () => {
      const result = checkModifiers({ ...stats, combatConditions: { Paralyse: 4 } })
      expect(getProfile(result, 'attribute').blocked).toEqual([])
      expect(getProfile(result, 'attack').blocked).toContain('Paralyse IV: movement and speech unavailable.')
   })
   it('Entrückung IV is not incapacitation; it modifies talents according to deity context, not combat', () => {
      const result = checkModifiers({ ...stats, combatConditions: { Entrückung: 4 } })
      expect(getProfile(result, 'talent').total).toBe(-4)
      expect(getProfile(result, 'talent', { pleasing: true }).total).toBe(3)
      expect(getProfile(result, 'talent', { pleasing: true }).blocked).toEqual([])
      expect(getProfile(result, 'attack').total).toBe(0)
   })
   it('Verwirrung III blocks complex knowledge checks, but not simple checks', () => {
      const result = checkModifiers({ ...stats, combatConditions: { Verwirrung: 3 } })
      expect(getProfile(result, 'talent').blocked).toEqual([])
      expect(getProfile(result, 'talent', { complex: true }).blocked).toContain('Verwirrung III: knowledge, spells and liturgies unavailable.')
   })
   it('reports pain IV and ignores armor that is no longer present', () => {
      const result = checkModifiers({ ...stats, pain: 4, wornArmor: 'Kettenrüstung', equipment: [] })
      expect(result.armor).toBeNull()
      expect(result.armorBurden).toBe(0)
      expect(getProfile(result, 'attribute').blocked).toContain('Schmerz IV: Selbstbeherrschung required to remain capable of acting.')
   })
   it('reports condition names whose effects are not covered by the core rulebook', () => {
      const result = checkModifiers({ ...stats, combatConditions: { Berauscht: 1, Trance: 0, Furcht: 1 } })
      expect(result.unverifiedConditions).toEqual(['Berauscht'])
   })
})

describe('Unterkleidung für Metallrüstungen (S. 374)', () => {
   const chain = { pain: 0, combatConditions: {}, combatSpecialAbilities: [] as string[] }
   it('raises BE by 1 when metal armor is worn without equipped underclothes', () => {
      const result = checkModifiers({ ...chain, equipment: [{ item: 'Kettenrüstung', amount: 1, carriedOn: 'Equipped' }] })
      expect(result.burden).toBe(3)
      expect(getProfile(result, 'attack').sources).toContainEqual({ label: 'Ohne Unterkleidung', value: -1, page: 374 })
   })
   it('does not count underclothes kept in the backpack', () => {
      const result = checkModifiers({ ...chain, equipment: [{ item: 'Kettenrüstung', amount: 1, carriedOn: 'Equipped' },
         { item: 'Unterkleidung für Metallrüstungen', amount: 1, carriedOn: 'Backpack' }] })
      expect(result.burden).toBe(3)
   })
   it('leaves leather armor alone', () => {
      expect(checkModifiers({ ...chain, equipment: [{ item: 'Lederrüstung', amount: 1, carriedOn: 'Equipped' }] }).burden).toBe(1)
   })
})
