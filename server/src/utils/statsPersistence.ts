import { Stats, type IStatsDocument } from '@/models/stats.model'
import { BadRequestError, NotFoundError } from '@/utils/appError'
import { calcBaseAttributes, calcBurden, calcPain } from '@/utils/baseAttributes'
import { carriedEquipmentWeight } from '@/utils/containers'
import { applyResourceMaxima } from '@/utils/energyRules'

export async function findStatsForUser(id: string | string[], userId: string) {
   const statId = Array.isArray(id) ? id[0] : id
   const stat = await Stats.findOne({ _id: statId, userId })

   if (!stat) {
      throw new NotFoundError('Stats not found')
   }

   syncResources(stat)
   return stat
}

// LeP/AsP/KaP maxima depend on attributes, traditions and advantages, which many endpoints change.
// AW, Tragkraft and Belastung from carried weight are derived here too, so heroes saved without a recalculation (e.g. from guided creation) are correct.
export function syncResources(stat: IStatsDocument) {
   // source: DSA5 Regelwerk, S. 28–29 (AW = GE / 2), S. 348 (Tragkraft = KK × 2 Stein)
   stat.dodge.basicValue = calcBaseAttributes.dodge(stat.dexterity, 0)
   stat.dodge.max = calcBaseAttributes.dodge(stat.dexterity, stat.dodge.bonusMalus)
   stat.dodge.value = stat.dodge.max
   stat.carryingCapacity = calcBaseAttributes.carryingCapacity(stat.strength)
   stat.burden = calcBurden(stat.carryingCapacity, carriedEquipmentWeight(stat.equipment))
   applyResourceMaxima(stat)
   stat.health.current = Math.min(stat.health.current, stat.health.max)
   stat.pain = calcPain(stat.health.current, stat.health.max)
   stat.mana.current = Math.min(stat.mana.current, stat.mana.max)
   if (stat.karmaEnergy.current != null) stat.karmaEnergy.current = Math.min(stat.karmaEnergy.current, stat.karmaEnergy.max)
}

export async function saveStats(stat: IStatsDocument) {
   syncResources(stat)
   try {
      await stat.save()
   } catch (error) {
      throw new BadRequestError(
         error instanceof Error ? error.message : String(error),
      )
   }
}
