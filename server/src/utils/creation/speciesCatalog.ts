import type { TalentAttribute } from '../talentCatalog'

export const speciesKeys = ['Mensch', 'Elf', 'Halbelf', 'Zwerg'] as const
export type SpeciesKey = typeof speciesKeys[number]

// Species modifiers change only the attribute maximum, never the value (S. 88).
// `choice`: +1 on any attribute (Mensch, Halbelf) or −2 on one of two (Elf, Zwerg).
export type SpeciesDefinition = {
   key: SpeciesKey
   page: number
   ap: number
   health: number
   soulPower: number
   toughness: number
   speed: number
   attributeMax: Partial<Record<TalentAttribute, number>>
   choice: { value: number; options: TalentAttribute[] }
   // Entries included in the species AP; the advantages count toward the 80 AP limit (S. 91)
   automatic: { advantages: string[]; disadvantages: string[]; advantageAp: number }
   // "Dringend empfohlen": choose them or agree with the GM why not (S. 91, 94)
   recommended: string[]
   cultures: string[]
}

const allAttributes: TalentAttribute[] = ['courage', 'wisdom', 'intuition', 'charisma', 'fingerDexterity', 'dexterity', 'constitution', 'strength']
const humanCultures = ['Andergast', 'Aranien', 'Bornland', 'Fjarninger', 'Horasreich', 'Maraskan', 'Mhanadistan', 'Mittelreich', 'Nivesen', 'Norbarden',
   'Nordaventurien', 'Nostria', 'Novadis', 'Südaventurien', 'Svellttal', 'Thorwal', 'Utulus', 'Waldmenschen', 'Zyklopeninseln']

// source: DSA5 Regelwerk, S. 40, 87–94 (species values, overview S. 94)
export const speciesCatalog: SpeciesDefinition[] = [
   { key: 'Mensch', page: 89, ap: 0, health: 5, soulPower: -5, toughness: -5, speed: 8, attributeMax: {}, choice: { value: 1, options: allAttributes },
      automatic: { advantages: [], disadvantages: [], advantageAp: 0 }, recommended: [], cultures: humanCultures },
   { key: 'Elf', page: 91, ap: 18, health: 2, soulPower: -4, toughness: -6, speed: 8, attributeMax: { intuition: 1, dexterity: 1 },
      choice: { value: -2, options: ['wisdom', 'strength'] },
      automatic: { advantages: ['Zauberer', 'Zweistimmiger Gesang'], disadvantages: [], advantageAp: 30 },
      recommended: ['Altersresistenz', 'Dunkelsicht I', 'Nichtschläfer', 'Sensibler Geruchssinn', 'Unfähig (Zechen)'],
      cultures: ['Auelfen', 'Firnelfen', 'Waldelfen'] },
   { key: 'Halbelf', page: 92, ap: 0, health: 5, soulPower: -4, toughness: -6, speed: 8, attributeMax: {}, choice: { value: 1, options: allAttributes },
      automatic: { advantages: [], disadvantages: [], advantageAp: 0 }, recommended: [],
      cultures: ['Andergast', 'Auelfen', 'Bornland', 'Firnelfen', 'Horasreich', 'Mittelreich', 'Nivesen', 'Nordaventurien', 'Nostria', 'Svellttal', 'Thorwal', 'Waldelfen'] },
   { key: 'Zwerg', page: 93, ap: 61, health: 8, soulPower: -4, toughness: -4, speed: 6, attributeMax: { constitution: 1, strength: 1 },
      choice: { value: -2, options: ['charisma', 'dexterity'] },
      automatic: { advantages: [], disadvantages: [], advantageAp: 0 },
      recommended: ['Dunkelsicht I', 'Immunität gegen Tulmadron', 'Unfähig (Schwimmen)'],
      cultures: ['Ambosszwerge', 'Brillantzwerge', 'Erzzwerge', 'Hügelzwerge'] },
]
export const speciesFor = (key: string | null | undefined) => speciesCatalog.find((entry) => entry.key === key) ?? null
