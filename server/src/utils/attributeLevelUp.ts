export const aLevelUpCosts = {
   '0': 1,
   '1': 1,
   '2': 1,
   '3': 1,
   '4': 1,
   '5': 1,
   '6': 1,
   '7': 1,
   '8': 1,
   '9': 1,
   '10': 1,
   '11': 1,
   '12': 1,
   '13': 2,
   '14': 3,
   '15': 4,
   '16': 5,
   '17': 6,
   '18': 7,
   '19': 8,
   '20': 9,
   '21': 10,
   '22': 11,
   '23': 12,
   '24': 13,
   '25': 14,
} as Record<string, number>
export const bLevelUpCosts = {
   '0': 2,
   '1': 2,
   '2': 2,
   '3': 2,
   '4': 2,
   '5': 2,
   '6': 2,
   '7': 2,
   '8': 2,
   '9': 2,
   '10': 2,
   '11': 2,
   '12': 2,
   '13': 4,
   '14': 6,
   '15': 8,
   '16': 10,
   '17': 12,
   '18': 14,
   '19': 16,
   '20': 18,
   '21': 20,
   '22': 22,
   '23': 24,
   '24': 26,
   '25': 28,
} as Record<string, number>
export const cLevelUpCosts = {
   '0': 3,
   '1': 3,
   '2': 3,
   '3': 3,
   '4': 3,
   '5': 3,
   '6': 3,
   '7': 3,
   '8': 3,
   '9': 3,
   '10': 3,
   '11': 3,
   '12': 3,
   '13': 6,
   '14': 9,
   '15': 12,
   '16': 15,
   '17': 18,
   '18': 21,
   '19': 24,
   '20': 27,
   '21': 30,
   '22': 33,
   '23': 36,
   '24': 39,
   '25': 42,
} as Record<string, number>
export const dLevelUpCosts = {
   '0': 4,
   '1': 4,
   '2': 4,
   '3': 4,
   '4': 4,
   '5': 4,
   '6': 4,
   '7': 4,
   '8': 4,
   '9': 4,
   '10': 4,
   '11': 4,
   '12': 4,
   '13': 8,
   '14': 12,
   '15': 16,
   '16': 20,
   '17': 24,
   '18': 28,
   '19': 32,
   '20': 36,
   '21': 40,
   '22': 44,
   '23': 48,
   '24': 52,
   '25': 56,
} as Record<string, number>
export const eLevelUpCosts = {
   '0': 0,
   '1': 15,
   '2': 15,
   '3': 15,
   '4': 15,
   '5': 15,
   '6': 15,
   '7': 15,
   '8': 15,
   '9': 15,
   '10': 15,
   '11': 15,
   '12': 15,
   '13': 15,
   '14': 15,
   '15': 30,
   '16': 45,
   '17': 60,
   '18': 75,
   '19': 90,
   '20': 105,
   '21': 120,
   '22': 135,
   '23': 150,
   '24': 165,
   '25': 180,
} as Record<string, number>

export const maxAttributeLevel = 25
export const minAttributeLevel = 0

// source: DSA5 Regelwerk, S. 50 (Aktivierung auf 0)
export const activationCosts = { a: 1, b: 2, c: 3, d: 4 } as const
export const activationCost = (
   stfClass: keyof typeof activationCosts,
): number => activationCosts[stfClass]
export const attributeLevelUp = (
   currentLevel: number,
   attributeType: 'a' | 'b' | 'c' | 'd' | 'e',
): [number, number] => {
   if (currentLevel < minAttributeLevel || currentLevel >= maxAttributeLevel) {
      throw new Error('Invalid attribute level')
   }
   const nextLevel = currentLevel + 1
   const cost: number =
      attributeType === 'a'
         ? aLevelUpCosts[nextLevel.toString()]
         : attributeType === 'b'
           ? bLevelUpCosts[nextLevel.toString()]
           : attributeType === 'c'
             ? cLevelUpCosts[nextLevel.toString()]
             : attributeType === 'd'
               ? dLevelUpCosts[nextLevel.toString()]
               : eLevelUpCosts[nextLevel.toString()]
   return [nextLevel, cost]
}
