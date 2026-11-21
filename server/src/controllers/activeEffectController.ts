import type { Request, Response } from 'express'
import { ActiveEffect, type IActiveEffectDocument } from '@/models/activeEffect.model'
import { BadRequestError, NotFoundError, UnauthorizedError } from '@/utils/appError'
import { calcBurden } from '@/utils/baseAttributes'
import { adjustHealth } from '@/utils/combatRules'
import { consumableFor, diceTotal, stackEffect, type EffectSpec } from '@/utils/consumables'
import { carriedEquipmentWeight } from '@/utils/equipmentPurchase'
import { findStatsForUser, saveStats } from '@/utils/statsPersistence'
import { normalizeStatuses } from '@/utils/statusRules'
import { abilityEffectSchema, activeEffectActionSchema, consumeItemSchema } from '@/validations/activeEffectValidation'
import { abilityEffectSpec, conditionsAfterEffect } from '@/utils/abilityEffects'
import { buildStatResponse } from '@/views/statsView'

export function viewEffect(effect: IActiveEffectDocument) {
   const values = effect.toObject().values ?? {}
   return {
      _id: String(effect._id), key: effect.key, label: effect.label, quality: effect.quality ?? null, page: effect.page,
      duration: { de: effect.duration?.de ?? '', en: effect.duration?.en ?? '' }, values,
      weapon: effect.weapon ?? null, setsStatus: effect.setsStatus ?? null,
      note: effect.note?.de || effect.note?.en ? { de: effect.note.de, en: effect.note.en } : null,
      createdAt: effect.createdAt,
   }
}

async function owner(req: Request) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   return { stat, userId: req.user._id }
}

export async function listEffects(statsId: unknown, userId: string) {
   const effects = await ActiveEffect.find({ statsId, userId }).sort({ createdAt: 1 })
   return effects.map(viewEffect)
}

export async function createEffect(statsId: unknown, userId: string, spec: EffectSpec) {
   await ActiveEffect.create({ ...spec, userId, statsId })
}

export async function getActiveEffects(req: Request, res: Response) {
   const { stat, userId } = await owner(req)
   res.json({ effects: await listEffects(stat._id, userId) })
}

// source: DSA5 Regelwerk, S. 270–274, 342–346 (Alchimica, poisons and herbs are used up when applied)
export async function consumeItemController(req: Request, res: Response) {
   const { stat, userId } = await owner(req)
   const input = consumeItemSchema.parse(req.body)
   const equipment = stat.toObject().equipment
   const entry = equipment[input.index]
   if (!entry || entry.item !== input.item || entry.amount < 1) throw new BadRequestError('This item is no longer in the equipment.')
   const consumable = consumableFor(entry.item, entry.quality, input.weapon)
   if (!consumable) throw new BadRequestError('This item has no consumable rule effect.')
   const outcome: { kind: string; amount?: number; cured?: boolean } = { kind: consumable.kind }

   if (consumable.kind === 'heal' || consumable.kind === 'mana') {
      const amount = diceTotal(consumable.dice, input.rolls)
      if (amount === null) throw new BadRequestError('Roll the potion dice first.')
      if (consumable.kind === 'heal') {
         // source: DSA5 Regelwerk, S. 272 (healed LeP never exceed the maximum)
         const result = adjustHealth(stat.health.current, stat.health.max, 'heal', amount)
         if (!result.ok) throw new BadRequestError('The LeP values of this hero are invalid.')
         outcome.amount = result.current - stat.health.current
         stat.health.current = result.current
         stat.pain = result.pain
      } else {
         if (!(stat.mana.max > 0)) throw new BadRequestError('This hero has no astral energy to restore.')
         const next = Math.min(stat.mana.max, stat.mana.current + amount)
         outcome.amount = next - stat.mana.current
         stat.mana.current = next
      }
   } else if (consumable.kind === 'antidote') {
      if (input.cure) {
         if (!(stat.statuses ?? []).includes('Vergiftet')) throw new BadRequestError('This hero is not Vergiftet.')
         stat.statuses = normalizeStatuses((stat.statuses ?? []).filter((status) => status !== 'Vergiftet'))
         outcome.cured = true
      }
   } else if (consumable.kind === 'effect') {
      if (consumable.needsWeapon) {
         if (!input.weapon || !equipment.some((item) => item.item === input.weapon && item.amount > 0)) {
            throw new BadRequestError('Choose a weapon from the equipment.')
         }
      }
      const existing = (await ActiveEffect.find({ statsId: stat._id, userId })).map((effect) => ({
         id: String(effect._id), key: effect.key, quality: effect.quality, values: effect.toObject().values ?? {},
      }))
      const decision = stackEffect(existing, consumable.effect)
      if (decision.action === 'weaker' && !input.confirmWeaker) {
         throw new BadRequestError('A stronger effect of this kind is already active: only the strongest counts (S. 272).')
      }
      if (decision.action === 'replace') await ActiveEffect.deleteOne({ _id: decision.existingId, userId })
      if (decision.action === 'increase') await ActiveEffect.updateOne({ _id: decision.existingId, userId }, { $set: { values: decision.values } })
      if (decision.action === 'add' || decision.action === 'replace') {
         await createEffect(stat._id, userId, consumable.effect)
         if (consumable.effect.setsStatus) stat.statuses = normalizeStatuses([...(stat.statuses ?? []), consumable.effect.setsStatus])
      }
   }

   const next = equipment.flatMap((item, index) => index !== input.index ? [item] : item.amount > 1 ? [{ ...item, amount: item.amount - 1 }] : [])
   stat.equipment = next
   stat.burden = calcBurden(stat.carryingCapacity, carriedEquipmentWeight(next))
   await saveStats(stat)
   res.json({ ...buildStatResponse(stat), effects: await listEffects(stat._id, userId), outcome })
}

export async function activeEffectActionController(req: Request, res: Response) {
   const { stat, userId } = await owner(req)
   const { effectId, action } = activeEffectActionSchema.parse(req.body)
   const effect = await ActiveEffect.findOne({ _id: effectId, statsId: stat._id, userId })
   if (!effect) throw new NotFoundError('Effect not found')
   if (action === 'end-transition') {
      effect.set('values.transitionPain', 0)
      await effect.save()
   } else {
      // An effect that switched a status on (Unsichtbar) switches it off again when it ends.
      if (effect.setsStatus) stat.statuses = (stat.statuses ?? []).filter((status) => status !== effect.setsStatus)
      const values = effect.toObject().values ?? {}
      if (values.stuporOnEnd || values.confusionOnEnd) stat.combatConditions = conditionsAfterEffect(stat.combatConditions ?? {}, values)
      if (effect.setsStatus || values.stuporOnEnd || values.confusionOnEnd) await saveStats(stat)
      await effect.deleteOne()
   }
   res.json({ ...buildStatResponse(stat), effects: await listEffects(stat._id, userId) })
}

// Starts Eiserner Wille or Schmerzen unterdrücken; a running one of the same kind is replaced (S. 216, 219).
export async function startAbilityEffectController(req: Request, res: Response) {
   const { stat, userId } = await owner(req)
   const { ability, quality, weapon } = abilityEffectSchema.parse(req.body)
   const spec = abilityEffectSpec({ generalSpecialAbilities: stat.generalSpecialAbilities, pain: stat.pain ?? 0, spells: stat.spells,
      weapons: stat.equipment.filter((item) => item.amount > 0).map((item) => item.item) }, ability, quality, weapon)
   await ActiveEffect.deleteMany({ statsId: stat._id, userId, key: spec.key })
   await createEffect(stat._id, userId, spec)
   res.json({ ...buildStatResponse(stat), effects: await listEffects(stat._id, userId) })
}
