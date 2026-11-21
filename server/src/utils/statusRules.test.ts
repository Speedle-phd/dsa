import { describe, expect, it } from 'vitest'
import { checkModifiers } from './checkModifiers'
import { endBloodRage, normalizeStatuses, statusRollEffects, statusSpeed } from './statusRules'

const base = { pain: 0, combatConditions: {}, combatSpecialAbilities: [] as string[], wornArmor: null, equipment: [] }
const effects = (statuses: string[], kind: string, key = '') => statusRollEffects(statuses).filter((effect) =>
   effect.kind === kind && (!effect.keys?.length || effect.keys.includes(key)) && !effect.exceptKeys?.includes(key))
const total = (statuses: string[], kind: string, key = '') => effects(statuses, kind, key).reduce((sum, effect) => sum + effect.value, 0)

describe('Status (S. 34–36)', () => {
   it('Liegend: attacks −4, defense −2, GS 1 (S. 36)', () => {
      expect(total(['Liegend'], 'attack')).toBe(-4)
      expect(total(['Liegend'], 'ranged')).toBe(-4)
      expect(total(['Liegend'], 'defense', 'AW')).toBe(-2)
      expect(statusSpeed(['Liegend']).override).toBe(1)
   })
   it('Fixiert: only Ausweichen −4, GS 0 (S. 36)', () => {
      expect(total(['Fixiert'], 'defense', 'AW')).toBe(-4)
      expect(total(['Fixiert'], 'defense', 'Langschwert')).toBe(0)
      expect(statusSpeed(['Fixiert', 'Liegend']).override).toBe(0)
   })
   it('Handlungsunfähig blocks every check; Bewusstlos implies it (S. 34, 36)', () => {
      for (const kind of ['attribute', 'attack', 'ranged', 'defense', 'talent']) expect(effects(['Handlungsunfähig'], kind).some((effect) => effect.blocked)).toBe(true)
      expect(normalizeStatuses(['Bewusstlos'])).toEqual(['Bewusstlos', 'Handlungsunfähig'])
      expect(normalizeStatuses(['Unbekannt', 'Taub'])).toEqual(['Taub'])
   })
   it('Bewegungsunfähig blocks combat; for other checks it is a choice (S. 34)', () => {
      expect(effects(['Bewegungsunfähig'], 'attack')[0]).toMatchObject({ blocked: true, automatic: true })
      expect(effects(['Bewegungsunfähig'], 'talent', 'magiekunde')[0]).toMatchObject({ blocked: true, automatic: false })
   })
   it('Blutrausch: AT +4, no defense/FK, only Körpertalente and Einschüchtern, Kraftakt +2 (S. 35)', () => {
      expect(total(['Blutrausch'], 'attack')).toBe(4)
      expect(effects(['Blutrausch'], 'defense').some((effect) => effect.blocked)).toBe(true)
      expect(effects(['Blutrausch'], 'ranged').some((effect) => effect.blocked)).toBe(true)
      expect(effects(['Blutrausch'], 'talent', 'etikette').some((effect) => effect.blocked)).toBe(true)
      expect(effects(['Blutrausch'], 'talent', 'spell:ignifaxius').some((effect) => effect.blocked)).toBe(true)
      expect(effects(['Blutrausch'], 'talent', 'einschuechtern').some((effect) => effect.blocked)).toBe(false)
      expect(total(['Blutrausch'], 'talent', 'kraftakt')).toBe(2)
   })
   it('Blutrausch ignores Schmerz penalties (S. 35)', () => {
      const result = checkModifiers({ ...base, pain: 2, statuses: ['Blutrausch'] })
      expect(result.profiles.find((profile) => profile.kind === 'attack')!.total).toBe(0)
      expect(result.speed.total).toBe(0)
      expect(checkModifiers({ ...base, pain: 2 }).profiles.find((profile) => profile.kind === 'attack')!.total).toBe(-2)
   })
   it('ending Blutrausch adds two levels of Betäubung, at most IV (S. 35)', () => {
      expect(endBloodRage(['Blutrausch'], [], { Betäubung: 1 })).toEqual({ Betäubung: 3 })
      expect(endBloodRage(['Blutrausch'], [], { Betäubung: 3 })).toEqual({ Betäubung: 4 })
      expect(endBloodRage(['Blutrausch'], ['Blutrausch'], {})).toEqual({})
      expect(endBloodRage([], [], {})).toEqual({})
   })
   it('Blind: melee AT halved, FK and defense only on a 1 (S. 35)', () => {
      expect(effects(['Blind'], 'attack')[0].targetRule).toBe('halve')
      expect(effects(['Blind'], 'ranged')[0].targetRule).toBe('one')
      expect(effects(['Blind'], 'defense', 'AW')[0].targetRule).toBe('one')
   })
   it('Taub: Sinnesschärfe (Hinterhalte entdecken) −3 is a conditional choice (S. 36)', () => {
      expect(effects(['Taub'], 'talent', 'sinnesschaerfe')[0]).toMatchObject({ value: -3, automatic: false })
      expect(effects(['Taub'], 'talent', 'klettern')).toHaveLength(0)
   })
   it('statuses are part of the derived entry effects', () => {
      expect(checkModifiers({ ...base, statuses: ['Liegend'] }).entryEffects.some((effect) => effect.label === 'Liegend')).toBe(true)
      expect(checkModifiers({ ...base, statuses: ['Liegend'] }).speed.override).toBe(1)
   })
})
