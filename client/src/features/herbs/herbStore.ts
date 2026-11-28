import type { AventurianStoreItem } from '@/utils/aventurian_store'
import type { Herb } from './herbApi'

export const adkStoreCategory = 'Archiv_der_Kraeuter'

// The plants of Archiv der Kräuter as store items (AdK S. 11–142): the book prices one application raw / processed.
// Plants that are not traded (no price) are left out; their page says why.
export function adkStoreItems(herbs: Herb[]): AventurianStoreItem[] {
   return herbs.filter((herb) => herb.price.raw !== null || herb.price.processed !== null).map((herb) => {
      const raw = herb.price.raw
      const processed = herb.price.processed
      const variants = [
         ...(raw !== null ? [{ id: 'raw', label: 'roh', silbertaler: raw, herbForm: 'raw' as const }] : []),
         ...(processed !== null ? [{ id: 'processed', label: 'verarbeitet', silbertaler: processed, herbForm: 'preserved' as const }] : []),
      ]
      return {
         name: herb.key,
         price: { silbertaler: raw ?? processed ?? 0 },
         weight: 0,
         kind: 'herb' as const,
         sourcePage: herb.page,
         sourceBook: 'AdK' as const,
         variants,
         ...(herb.search !== null && herb.identify !== null && herb.applications ? { herb: {
            search: herb.search, identify: herb.identify, applications: herb.applications.join('/'),
            effect: herbEffectText(herb), rawPrice: raw ?? 0 } } : {}),
      }
   })
}

// One line per raw route for the store card and the use dialog; plants without a summary point to their page
export function herbEffectText(herb: Herb) {
   const summary = herb.summary
   const lines = (['touch', 'inhale', 'eat'] as const).flatMap((route) => summary?.[route] ? [{ route, text: summary[route] }] : [])
   const prefix = { touch: { de: 'Berührung', en: 'Touch' }, inhale: { de: 'Einatmung', en: 'Inhaled' }, eat: { de: 'Verzehr', en: 'Eaten' } }
   if (!lines.length) return { de: `Wirkung: siehe AdK S. ${herb.page}.`, en: `Effect: see AdK p. ${herb.page}.` }
   return {
      de: lines.map(({ route, text }) => `${prefix[route].de}: ${text?.de}`).join(' '),
      en: lines.map(({ route, text }) => `${prefix[route].en}: ${text?.en}`).join(' '),
   }
}
