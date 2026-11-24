import { describe, expect, it } from 'vitest'
import type { CheckProfile, Stats } from '@/features/heroes/statsApi'
import type { HeroPanel } from './heroPanel'
import { heroOverview } from './heroOverview'

const profile = (kind: CheckProfile['kind'], total: number, blocked: string[] = [], burden = kind !== 'ranged'): CheckProfile =>
   ({ kind, burden, movement: true, pleasing: false, complex: false, total, sources: [], blocked })

function makeStats(change: Partial<Stats> = {}, profiles: CheckProfile[] = [profile('attack', -1), profile('ranged', -1), profile('defense', -1)]): Stats {
   return {
      _id: 's1', charId: 'c1', courage: 13, dexterity: 14, strength: 16,
      health: { current: 21, max: 30 }, mana: { current: 0, max: 0 }, karmaEnergy: { current: 12, max: 20 },
      fatePoints: { current: 2, max: 3 }, dodge: { max: 7 },
      statuses: ['Eingeengt'], permanentStatuses: ['Blind', 'Eingeengt'], combatConditions: { Schmerz: 1, Furcht: 0, Betäubung: 2 },
      combatSpecialAbilities: ['Finte I', 'Wuchtschlag I'],
      combatValues: [{ key: 'Schwerter', attack: 12, parry: 7 }],
      equipment: [{ item: 'Langschwert', weight: 1, amount: 1, carriedOn: 'Equipped', category: 'weapon' }],
      combatModifiers: { speed: 0, initiative: 0 },
      checkModifiers: {
         profiles, entryEffects: [], effectivePain: 1, armor: null, burden: 0, otherBurden: 0, armorBurden: 0, unverifiedConditions: [],
         initiative: { total: 0, sources: [] },
         speed: { total: 0, sources: [], factor: 1, blocked: false, override: null, overrideLabel: null },
         speedBase: { sources: [], halved: null },
      },
      ...change,
   } as unknown as Stats
}

describe('heroOverview', () => {
   it('applies the rule profile to weapon AT/PA and the dodge (S. 34)', () => {
      const overview = heroOverview(makeStats({ statuses: [], permanentStatuses: [] }), 'Mensch')
      // Langschwert: Schwerter 12/7, AT/PA modifier ±0, GE/KK threshold 15 with KK 16 → +1 TP
      expect(overview.weapons.find((weapon) => weapon.label === 'Langschwert')).toMatchObject({ at: 11, pa: 6, tp: '1W6+5', ranged: false })
      expect(overview.dodge).toBe(6)
   })

   it('skips weapons whose combat technique the hero has no values for', () => {
      expect(heroOverview(makeStats(), 'Mensch').weapons.map((weapon) => weapon.label)).toEqual(['Langschwert'])
   })

   it('shows energies only when the hero has them', () => {
      const overview = heroOverview(makeStats(), 'Mensch')
      expect(overview.health).toEqual({ current: 21, max: 30 })
      expect(overview.mana).toBeNull()
      expect(overview.karma).toEqual({ current: 12, max: 20 })
      expect(overview.fate).toEqual({ current: 2, max: 3 })
   })

   it('lists each status once and only conditions with a level', () => {
      const overview = heroOverview(makeStats(), 'Mensch')
      expect(overview.statuses).toEqual(['Eingeengt', 'Blind'])
      expect(overview.conditions).toEqual([{ name: 'Schmerz', level: 1 }, { name: 'Betäubung', level: 2 }])
   })

   it('derives GS from the species (Mensch 8, S. 40) and RS 0 without armour', () => {
      const overview = heroOverview(makeStats(), 'Mensch')
      expect(overview.speed).toBe(8)
      expect(overview.armor).toBe(0)
      expect(heroOverview(makeStats(), 'Unbekannt').speed).toBeNull()
   })

   it('collects blocking reasons once across attack and defense', () => {
      const reason = 'Schmerz IV: handlungsunfähig'
      const overview = heroOverview(makeStats({}, [profile('attack', 0, [reason]), profile('ranged', 0, [reason]), profile('defense', 0, [reason])]), 'Mensch')
      expect(overview.blocked).toEqual([reason])
   })

   it('has no AT/PA for a broken weapon', () => {
      const stats = makeStats({ statuses: [], equipment: [{ item: 'Langschwert', weight: 1, amount: 1, carriedOn: 'Equipped', category: 'weapon', condition: 'broken' }] } as Partial<Stats>)
      expect(heroOverview(stats, 'Mensch').weapons[0]).toMatchObject({ at: null, pa: null, notes: ['Broken'] })
   })

   describe('with the panel copy of the current KR', () => {
      const plain = () => makeStats({ statuses: [], permanentStatuses: [] })
      const panel = (change: Partial<HeroPanel> = {}): HeroPanel => ({
         round: 2, stance: null, leader: false, tempPain: false, ignoreConditions: false, fateDefense: false,
         defensePenalty: 0, nextActionPenalty: 0, noDefense: false, casting: null, weapons: [], ...change,
      })
      const sword = (overview: ReturnType<typeof heroOverview>) => overview.weapons.find((weapon) => weapon.label === 'Langschwert')

      it('Vorstoß: AT +2 and no defense (S. 250)', () => {
         const overview = heroOverview(plain(), 'Mensch', panel({ stance: 'Vorstoß' }), 2)
         expect(sword(overview)).toMatchObject({ at: 13, pa: null })
         expect(overview.dodge).toBeNull()
         expect(overview.blocked).toContain('Vorstoß: no defense this combat round.')
      })

      it('Verteidigungshaltung with a Schip and one earlier defense: no attack, defenses +4 +4 −3 (S. 250, 30, 232)', () => {
         const overview = heroOverview(plain(), 'Mensch', panel({ stance: 'Verteidigungshaltung', fateDefense: true, defensePenalty: 3 }), 2)
         expect(sword(overview)).toMatchObject({ at: null, pa: 11 })
         expect(overview.dodge).toBe(11)
      })

      it('ignores a panel copy from an earlier KR', () => {
         const overview = heroOverview(plain(), 'Mensch', panel({ round: 1, stance: 'Vorstoß' }), 2)
         expect(sword(overview)).toMatchObject({ at: 11, pa: 6 })
         expect(overview.round).toBeNull()
      })

      it('Zustand ignorieren drops the condition penalty for the KR (S. 30)', () => {
         expect(sword(heroOverview(plain(), 'Mensch', panel({ ignoreConditions: true }), 2))).toMatchObject({ at: 12, pa: 7 })
      })
   })
})
