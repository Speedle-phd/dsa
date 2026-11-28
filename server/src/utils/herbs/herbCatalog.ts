// The plants of Archiv der Kräuter for the app: generated facts + hand corrections + summaries.
// source: Archiv der Kräuter (AdK), S. 9–142 (plant pages), S. 266–270 (effect types)
import { herbData } from './herbData'
import { herbSummaries } from './herbSummaries'
import { herbLandscapes, type Herb, type HerbFacts, type HerbLandscape } from './herbTypes'

// Fields the generator cannot read as numbers keep the book's wording in a note; long notes are shortened here
const corrections: Record<string, Partial<HerbFacts>> = {
   Boronie: { price: { raw: null, processed: null, note: 'Handel von der Boronkirche Al’Anfas verboten; Schwarzmarktpreise schwanken' } },
   'Grüne Schleimschlange': { price: { raw: 0.1, processed: null, note: 'Kenner zahlen bis zu 2 Silbertaler (vermuteter Schmuck im Inneren)' } },
   Madablüte: { price: { raw: null, processed: null, note: 'wird nicht gehandelt (Frevel gegen Hesinde), bis zu 100 Dukaten' } },
   Basilamine: { identifyNote: 'zum Entdecken: Sinnesschärfe (Suchen oder Wahrnehmen) –3' },
}

// Landscape types of a plant for filters and the herb search: "alle"/"überall" means every type above ground
function landscapesOf(text: string | null): HerbLandscape[] {
   if (!text) return []
   const lower = text.toLowerCase()
   if (lower.includes('unterirdisch') || lower.startsWith('höhlen')) return ['Höhlen']
   if (/^(alle|überall)/.test(lower)) {
      // "überall (außer in Ewigem Eis und in Wüsten)": a type is left out when its last word follows "außer"
      const except = lower.split('außer')[1] ?? ''
      return herbLandscapes.filter((entry) => entry !== 'Höhlen' && !except.includes(entry.toLowerCase().split(' ').at(-1) ?? ''))
   }
   return herbLandscapes.filter((entry) => {
      if (entry === 'Wälder') return /wälder|wald(?!rand)/.test(lower.replace(/regenwälder|regenwald/g, ''))
      if (entry === 'Regenwälder') return /regenw(ä|a)ld/.test(lower)
      if (entry === 'Höhlen') return lower.includes('höhle')
      return lower.includes(entry.toLowerCase().split(',')[0].split(' ')[0])
   })
}

export const herbs: Herb[] = herbData.map((facts) => {
   const merged = { ...facts, ...corrections[facts.name] }
   return { ...merged, key: facts.name, landscapes: landscapesOf(merged.landscape), summary: herbSummaries[facts.name] ?? null }
})

export const herbByName = (name: string) => herbs.find((herb) => herb.key === name) ?? null
