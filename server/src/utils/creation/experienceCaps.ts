import { levelExpMapping } from '../levelExpMapping'

export const experienceLevels = ['Unerfahren', 'Durchschnittlich', 'Erfahren', 'Kompetent', 'Meisterlich', 'Brillant', 'Legendär'] as const
export type ExperienceLevel = typeof experienceLevels[number]
export type ExperienceCaps = {
   level: ExperienceLevel; ap: number; attribute: number; skill: number; technique: number; attributeSum: number; spells: number; foreignSpells: number
}

// source: DSA5 Regelwerk, S. 39 (Erfahrungsgrade: AP and the maxima that apply during creation)
const caps: Array<[ExperienceLevel, number, number, number, number, number, number]> = [
   ['Unerfahren', 12, 10, 8, 95, 8, 0],
   ['Durchschnittlich', 13, 10, 10, 98, 10, 1],
   ['Erfahren', 14, 10, 12, 100, 12, 2],
   ['Kompetent', 15, 13, 14, 102, 14, 3],
   ['Meisterlich', 16, 16, 16, 105, 16, 4],
   ['Brillant', 17, 19, 18, 109, 18, 5],
   ['Legendär', 18, 20, 20, 114, 20, 6],
]
export const experienceCaps: ExperienceCaps[] = caps.map(([level, attribute, skill, technique, attributeSum, spells, foreignSpells]) => ({
   level, ap: levelExpMapping[level.toLowerCase()], attribute, skill, technique, attributeSum, spells, foreignSpells,
}))
export const capsFor = (level: ExperienceLevel) => experienceCaps.find((entry) => entry.level === level)!

// source: DSA5 Regelwerk, S. 38–39, 46 (creation rules that hold for every EG)
export const creationLimits = { attributeStart: 8, techniqueStart: 6, advantageAp: 80, disadvantageAp: 80, leftoverAp: 10 } as const
