import { BadRequestError } from '@/utils/appError'

export type ArtifactKind = 'storage' | 'recharging' | 'permanent' | 'weapon'
export type ArtifactRecharge = 'month' | 'week' | 'day'

// source: DSA5 Regelwerk, S. 267 (at most 7 charges in a Zauberspeicher)
export const maxArtifactCharges = 7
// source: DSA5 Regelwerk, S. 267 (ARCANOVI base cost 16 AsP)
export const arcanoviCost = 16
// source: DSA5 Regelwerk, S. 268 (self-recharging: modifier on both checks and spell cost factor)
export const rechargeRules: Record<ArtifactRecharge, { modifier: number; factor: number }> = {
   month: { modifier: -1, factor: 5 },
   week: { modifier: -2, factor: 10 },
   day: { modifier: -3, factor: 25 },
}

export type ArcanoviInput = {
   spellCost: number
   charges: number
   recharge: ArtifactRecharge | null
   iron: boolean
   // Permanent AsP saved with 100 S of matching material each (max. half), or +1 on the ARCANOVI instead
   materialSaved: number
   materialBonus: boolean
}
export type ArcanoviPlan = {
   arcanoviModifier: number
   spellModifier: number
   asp: number
   permanent: number
   permanentSaved: number
   materialSilver: number
}

// source: DSA5 Regelwerk, S. 267–268. App decision: permanent AsP = 1/10 of all AsP spent (ARCANOVI included, as the rule
// text says), rounded normally; the S. 268 recharge example leaves the ARCANOVI out.
export function arcanoviPlan(input: ArcanoviInput): ArcanoviPlan {
   const { spellCost, charges, recharge, iron, materialSaved, materialBonus } = input
   if (!Number.isInteger(spellCost) || spellCost < 1) throw new BadRequestError('Enter the AsP cost of the stored spell.')
   if (!Number.isInteger(charges) || charges < 1 || charges > maxArtifactCharges) throw new BadRequestError('An artifact holds 1–7 charges (S. 267).')
   if (recharge && charges !== 1) throw new BadRequestError('A self-recharging artifact stores one spell (S. 267–268).')
   const charge = recharge ? rechargeRules[recharge] : { modifier: -(charges - 1), factor: charges }
   const asp = arcanoviCost + spellCost * charge.factor
   const permanent = Math.round(asp / 10)
   const saveable = Math.floor(permanent / 2)
   if (!Number.isInteger(materialSaved) || materialSaved < 0 || materialSaved > saveable) {
      throw new BadRequestError(`Material can save at most ${saveable} permanent AsP (S. 268).`)
   }
   if (materialSaved && materialBonus) throw new BadRequestError('Material either saves permanent AsP or eases the ARCANOVI (S. 268).')
   return {
      // source: DSA5 Regelwerk, S. 268 (iron or steel: ritual −2; matching material: +1 instead of saving AsP)
      arcanoviModifier: charge.modifier + (iron ? -2 : 0) + (materialBonus ? 1 : 0),
      spellModifier: charge.modifier,
      asp,
      permanent: permanent - materialSaved,
      permanentSaved: materialSaved,
      materialSilver: materialSaved * 100,
   }
}

// source: DSA5 Regelwerk, S. 269 (10 S per AsP, 100 S per permanent AsP, ×¾ / ×1 / ×1½ by StF, +50 S per QS of the stored spell)
export function artifactPrice(asp: number, permanent: number, stfClass: 'a' | 'b' | 'c' | 'd', quality: number, itemValue = 0) {
   const factor = stfClass === 'a' ? 0.75 : stfClass === 'b' ? 1 : 1.5
   return Math.round((asp * 10 + permanent * 100) * factor + quality * 50 + itemValue)
}

// Using a charge: storage and recharging artifacts need one; permanent artifacts and magical weapons do not (S. 267–268).
export function useCharge(kind: ArtifactKind, charges: { current: number; max: number }) {
   if (kind === 'permanent' || kind === 'weapon') return charges
   if (charges.current < 1) throw new BadRequestError('No charge left.')
   return { ...charges, current: charges.current - 1 }
}

export function rechargeArtifact(kind: ArtifactKind, charges: { current: number; max: number }) {
   if (kind !== 'recharging') throw new BadRequestError('Only self-recharging artifacts regain their charge (S. 267).')
   return { ...charges, current: charges.max }
}
