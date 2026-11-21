import { describe, expect, it } from 'vitest'
import { findService, serviceTotalKreuzer, services } from './serviceCatalog'
import { adjustPurse } from './purseAdjustment'
import { purseFromKreuzer } from './equipmentPurchase'

describe('Dienstleistungen (S. 381–382)', () => {
   it('lists every service once', () => {
      // Badehaus 3, Medicus 4, Alchimist 1, Schmiede 1, Schreibstube 3, Reise 7 (Flusskahn both ways), Gasthaus 24, Sonstiges 4
      expect(services).toHaveLength(47)
      expect(new Set(services.map((service) => service.key)).size).toBe(services.length)
   })
   it.each([
      ['Bier, Krug', 16], ['Schnaps, Becherchen', 20], ['Wein, Becher', 30], ['Grütze', 10],
      ['Einzelzimmer', 300], ['Pferd beschlagen', 50], ['Brief vorlesen', 10], ['Suite', 10000],
   ] as const)('prices %s at %i Kreuzer (1 S = 10 H = 100 K, S. 364)', (key, kreuzer) => {
      expect(findService(key)?.priceKreuzer).toBe(kreuzer)
   })
   it('multiplies per-unit services', () => {
      expect(serviceTotalKreuzer(findService('Pferd beschlagen')!, 4)).toBe(200)
      expect(serviceTotalKreuzer(findService('Reisekutsche')!, 3)).toBe(3600)
   })
   it('pays a tavern bill with change', () => {
      const bill = serviceTotalKreuzer(findService('Bier, Krug')!, 3) + serviceTotalKreuzer(findService('Fleischgericht')!, 1)
      expect(adjustPurse({ dukaten: 0, silbertaler: 2, heller: 0, kreuzer: 0 }, { direction: 'lose', coins: purseFromKreuzer(bill) }))
         .toMatchObject({ ok: true, amountKreuzer: 118, purse: { silbertaler: 0, heller: 8, kreuzer: 2 } })
   })
   it('marks Medicus treatment and lodging for their follow-up effects', () => {
      expect(findService('Behandlung (Heilkunde Wunden)')).toMatchObject({ effect: 'treatment', priceKreuzer: 1000 })
      expect(services.filter((service) => service.effect === 'rest').map((service) => service.key))
         .toEqual(['Bett im Gemeinschaftszimmer', 'Doppelzimmer', 'Einzelzimmer', 'Strohsack im Schlafsaal', 'Suite'])
   })
})
