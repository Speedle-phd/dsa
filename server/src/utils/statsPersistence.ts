import { isValidObjectId } from 'mongoose'
import { Stats, type IStatsDocument } from '@/models/stats.model'
import { realtime } from '@/socket/realtime'
import { BadRequestError, NotFoundError } from '@/utils/appError'
import { activePartyOfHero, toRuleShape } from '@/utils/partyAccess'
import { canApplyEffects } from '@/utils/partyRules'
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

// Owner, or the GM of the hero's active party for the game-effect endpoints only (LeP/AsP/KaP, statuses and
// Zustände, AP awards; user decision, Nov 2026). Anyone else gets 404, as for a foreign hero.
export async function findStatsForActor(id: string | string[], userId: string) {
   const statId = Array.isArray(id) ? id[0] : id
   if (!isValidObjectId(statId)) throw new NotFoundError('Stats not found')
   const own = await Stats.findOne({ _id: statId, userId })
   if (own) {
      syncResources(own)
      return { stat: own, actor: 'owner' as const }
   }
   const party = await activePartyOfHero({ statsId: statId })
   const stat = party && canApplyEffects(toRuleShape(party), userId, statId) ? await Stats.findById(statId) : null
   if (!stat) throw new NotFoundError('Stats not found')
   syncResources(stat)
   return { stat, actor: 'gm' as const }
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
   await publishHeroChange(stat)
}

// After a committed save: the owner's other tabs and the hero's party refetch (topic notice, see socketContracts).
export async function publishHeroChange(stat: Pick<IStatsDocument, '_id' | 'userId' | 'charId'>) {
   if (!realtime.enabled()) return
   const notice = { topic: 'hero' as const, charId: String(stat.charId) }
   realtime.toUser(String(stat.userId), notice)
   try {
      const party = await activePartyOfHero({ statsId: String(stat._id) })
      if (party) realtime.toParty(String(party._id), notice)
   } catch (error) {
      // The save already succeeded; a missed notice heals on the next refetch.
      console.error('Publishing a hero change failed:', error)
   }
}
