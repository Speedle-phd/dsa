import type { ExperienceLevel } from './experienceCaps'
import type { SpeciesKey } from './speciesCatalog'

export type AgeRoll = { base: number; count: number; sides: 3 | 6 }

// source: DSA5 Regelwerk, S. 58 (Startalter by species and Erfahrungsgrad; free choice or rolled)
const ages: Record<'human' | 'Elf' | 'Zwerg', Array<[number, number, 3 | 6]>> = {
   human: [[12, 1, 3], [14, 1, 3], [16, 1, 3], [20, 1, 6], [25, 1, 6], [30, 1, 6], [35, 1, 6]],
   Elf: [[12, 1, 6], [19, 1, 6], [26, 2, 6], [39, 3, 6], [58, 4, 6], [83, 5, 6], [113, 6, 6]],
   Zwerg: [[20, 1, 6], [27, 2, 6], [40, 3, 6], [59, 4, 6], [84, 5, 6], [105, 6, 6], [142, 7, 6]],
}
const levelIndex: Record<ExperienceLevel, number> = { Unerfahren: 0, Durchschnittlich: 1, Erfahren: 2, Kompetent: 3, Meisterlich: 4, Brillant: 5, Legendär: 6 }

export function startAge(species: SpeciesKey, level: ExperienceLevel): AgeRoll {
   const [base, count, sides] = ages[species === 'Elf' || species === 'Zwerg' ? species : 'human'][levelIndex[level]]
   return { base, count, sides }
}

// source: DSA5 Regelwerk, S. 58 (750 Silbertaler start money; Reich/Arm change it; optional ±200 S per EG step from Erfahren)
export const startMoney = { silver: 750, perLevelStep: 200 } as const
export const optionalStartMoney = (level: ExperienceLevel) => startMoney.silver + (levelIndex[level] - levelIndex.Erfahren) * startMoney.perLevelStep
