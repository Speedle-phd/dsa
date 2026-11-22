import { describe, expect, it } from 'vitest'
import { applicationGlosses, applicationLabel } from './talentApplicationGlosses'
import { talentDetails } from './talentDetails'

// Proper nouns stay as printed: regions (Geographie, Geschichtswissen, Rechtskunde, Sagen & Legenden), gods (Götter & Kulte), the Limbus
const properNouns = new Set(['AlʼAnfanisches Imperium', 'Andergast', 'Aranien', 'Bornland', 'Gjalskerland', 'Horasreich', 'Kalifat',
   'Maraskan', 'Nostria', 'Orkland', 'Schattenlande', 'Svellttal', 'Thorwal', 'Tulamidenlande', 'Zyklopeninseln',
   'Praios', 'Rondra', 'Efferd', 'Travia', 'Boron', 'Hesinde', 'Firun', 'Tsa', 'Phex', 'Peraine', 'Ingerimm', 'Rahja', 'Swafnir', 'Rastullah', 'Limbus'])

describe('talent application glosses (user decision, Nov 2026)', () => {
   it('covers every application except proper nouns', () => {
      const names = Object.values(talentDetails).flatMap((details) => [...details.applications, ...details.newApplications.map((entry) => entry.name)])
      expect(names.filter((name) => !applicationGlosses[name] && !properNouns.has(name))).toEqual([])
   })
   it('shows the German term with the gloss in English, only the term in German', () => {
      expect(applicationLabel('Feilschen', 'en')).toBe('Feilschen (haggling)')
      expect(applicationLabel('Feilschen', 'de')).toBe('Feilschen')
      expect(applicationLabel('Praios', 'en')).toBe('Praios')
   })
})
