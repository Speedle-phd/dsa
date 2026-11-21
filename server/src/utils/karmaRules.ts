import { BadRequestError } from './appError'
import { churchTradition, churches, liturgyAvailable, type Church, type Liturgy } from './karmaCatalog'
import type { MagicAttribute } from './magicCatalog'

type KarmaState = Partial<Record<MagicAttribute, number>> & { advantages: string[]; disadvantages?: string[]; generalSpecialAbilities: string[] }

// The church of the owned divine tradition (only one is allowed, S. 165)
export const heroChurch = (state: Pick<KarmaState, 'generalSpecialAbilities'>): Church | null =>
   churches.find((church) => state.generalSpecialAbilities.includes(churchTradition(church))) ?? null

// source: DSA5 Regelwerk, S. 165, 308, 322 (Geweihter with a divine tradition; only general liturgies and those of the own church)
export function assertPriest(state: KarmaState, liturgy?: Liturgy) {
   if (!state.advantages.includes('Geweihter')) throw new BadRequestError('Liturgies and blessings need the advantage Geweihter (S. 165).')
   const church = heroChurch(state)
   if (!church) throw new BadRequestError('Record the divine tradition of your church first (S. 316–320).')
   if (liturgy && !liturgyAvailable(liturgy, church)) throw new BadRequestError(`${liturgy.key} is not a liturgy of your church (S. 322).`)
   return church
}

// source: DSA5 Regelwerk, S. 39 (highest check attribute + 2), S. 321 (Aspektkenntnis lifts the limit of 14 for its aspect)
export function liturgyMaximum(state: KarmaState, liturgy: Liturgy) {
   const church = heroChurch(state)
   const aspects = liturgy.distribution.filter((entry) => entry.church === church || entry.church === 'allgemein')
      .flatMap((entry) => entry.church === 'allgemein' ? ['allgemein'] : entry.aspects)
   const knowledge = aspects.some((aspect) => state.generalSpecialAbilities.includes(`Aspektkenntnis (${aspect})`))
   return Math.min(25, Math.max(...liturgy.probe.map((attribute) => state[attribute] ?? 0)) + 2, knowledge ? 25 : 14)
}

// source: DSA5 Regelwerk, S. 177 (Schwacher Karmalkörper: every KaP spend costs one more)
export function karmaSpend(state: Pick<KarmaState, 'disadvantages'>, amount: number, current: number) {
   const extra = state.disadvantages?.includes('Schwacher Karmalkörper') ? Math.min(1, Math.max(0, current - amount)) : 0
   return { total: amount + extra, extra }
}
