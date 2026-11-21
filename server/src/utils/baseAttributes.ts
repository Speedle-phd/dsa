const roundHalfUp = (value: number) => Math.floor(value + 0.5)

export const calcBaseAttributes = {
   health: (
      baseValue: number,
      constitution: number,
      bonusMalus: number,
      additionalPurchase: number,
   ) => baseValue + 2 * constitution + bonusMalus + additionalPurchase,
   soulPower: (
      baseValue: number,
      courage: number,
      wisdom: number,
      intuition: number,
      bonusMalus: number,
   ) =>
      roundHalfUp(baseValue + (courage + wisdom + intuition) / 6 + bonusMalus),
   toughness: (
      baseValue: number,
      strength: number,
      constitution: number,
      bonusMalus: number,
   ) =>
      roundHalfUp(
         baseValue + (constitution + constitution + strength) / 6 + bonusMalus,
      ),
   carryingCapacity: (strength: number) => 2 * strength,
   dodge: (dexterity: number, bonusMalus: number) =>
      roundHalfUp(dexterity / 2 + bonusMalus),
}

// source: DSA5 Regelwerk, S. 348 (KK × 2 Stein without trouble; one level of Belastung for every 4 full Stein above), S. 34 (at most IV)
export const calcBurden = (carryingCapacity: number, weight: number) => {
   const excess = weight - carryingCapacity
   if (excess <= 0) return 0
   return Math.min(Math.floor(excess / 4), 4)
}

// source: DSA5 Regelwerk, S. 34, 56 (one level each at ≤¾, ≤½, ≤¼ of max LeP, plus one at ≤5 LeP)
export const calcPain = (health: number, maxHealth: number) => {
   let pain = 0
   if (health * 4 <= maxHealth * 3) pain++
   if (health * 2 <= maxHealth) pain++
   if (health * 4 <= maxHealth) pain++
   if (health <= 5) pain++
   return pain
}

export const calcExperience = (
   stat: { experience: { total: number; gathered: number; base: number; disadvantageCredit?: number } },
   gain: number,
) => {
   const baseExperience = stat.experience.base
   const experienceGained = stat.experience.gathered + gain
   const totalExperience = baseExperience + experienceGained + (stat.experience.disadvantageCredit ?? 0)
   return {
      totalExperience,
      experienceGained,
   }
}

export const incrementFatePoints = (fatePoints: {
   current: number
   max: number
}) => {
   return Math.min(fatePoints.current + 1, fatePoints.max)
}

// source: DSA5 Regelwerk, S. 29 (each use costs 1 Schip; none left → no use)
export const spendFatePoint = (fatePoints: { current: number }) => {
   return Math.max(fatePoints.current - 1, 0)
}

export const calcMaxFatePoints = (fatePoints: {
   value: number
   bonusMalus: number
}) => {
   return fatePoints.value + fatePoints.bonusMalus
}
