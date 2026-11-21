import { BadRequestError } from "./appError"

export const levelExpMapping = {
   "unerfahren": 900,
   "durchschnittlich": 1000,
   "erfahren": 1100,
   "kompetent": 1200,
   "meisterlich": 1400,
   "brillant": 1700,
   "legendär": 2100
} as Record<string, number>

function assertAvailableLevel(level: string): void {
   if (!(level.toLowerCase() in levelExpMapping)) {
      throw new BadRequestError(`Level "${level}" is not available in the levelExpMapping.`)
   }
}

export function getExpForLevel(level: string): number {
   assertAvailableLevel(level)
   return levelExpMapping[level.toLowerCase()]
}

export function getLevelForExp(exp: number): string {
   //actually I need the element before the one that exceeds the experience
   for (const [level, requiredExp] of Object.entries(levelExpMapping)) {
      if (exp < requiredExp) {
         const levels = Object.keys(levelExpMapping)
         const index = levels.indexOf(level)
         const previousLevel = index > 0 ? levels[index - 1] : levels[0]
         return previousLevel[0].toUpperCase() + previousLevel.slice(1)
      }
   }
   // If experience exceeds all defined levels, return the highest level
   const highestLevel = Object.keys(levelExpMapping).pop() as string
   return highestLevel[0].toUpperCase() + highestLevel.slice(1)
}