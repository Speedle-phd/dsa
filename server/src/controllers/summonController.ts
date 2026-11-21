import type { Request, Response } from 'express'
import type { BestiaryReferenceResponse } from '@/types/apiContracts'
import { Summon, type ISummonDocument } from '@/models/summon.model'
import { NotFoundError, UnauthorizedError } from '@/utils/appError'
import {
   animalWisdomTable, bestiary, counterElements, creatureManeuvers, creatureRules, demonSpells, summonImprovements, summonServices, summoningFailures, summoningRituals,
} from '@/utils/bestiaryCatalog'
import {
   afterSunrise, assertSummon, assertSummonHealth, fightOver, improvedCreature, joinFight, servicesFor, summonHealth, useService, vanishes,
} from '@/utils/summonRules'
import { findStatsForUser } from '@/utils/statsPersistence'
import { addSummonSchema, summonActionSchema } from '@/validations/summonValidation'

export function getBestiaryReference(_req: Request, res: Response) {
   const reference: BestiaryReferenceResponse = {
      creatures: bestiary, creatureRules, counterElements, animalWisdomTable, creatureManeuvers, demonSpells,
      summoningRituals, summonImprovements: [...summonImprovements], summonServices: [...summonServices], summoningFailures,
   }
   res.json(reference)
}

function view(summon: ISummonDocument) {
   const creature = bestiary.find((entry) => entry.key === summon.creature)
   const effective = creature ? improvedCreature(creature, summon.improvements) : null
   return {
      _id: String(summon._id), creature: summon.creature, ritual: summon.ritual, quality: summon.quality,
      improvements: [...summon.improvements], services: summon.services, task: summon.task ?? null, createdAt: summon.createdAt,
      effective, health: effective ? summonHealth(effective.health, summon.health) : null,
   }
}

async function owner(req: Request) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   return { stat, userId: req.user._id }
}

async function listFor(statsId: unknown, userId: string) {
   const summons = await Summon.find({ statsId, userId }).sort({ createdAt: 1 })
   return { summons: summons.map(view) }
}

export async function getSummons(req: Request, res: Response) {
   const { stat, userId } = await owner(req)
   res.json(await listFor(stat._id, userId))
}

// source: DSA5 Regelwerk, S. 264–265 (the summoner records the successful ritual's QS and the improvements bought with them)
export async function addSummon(req: Request, res: Response) {
   const { stat, userId } = await owner(req)
   const input = addSummonSchema.parse(req.body)
   assertSummon(stat, input)
   await Summon.create({ ...input, services: servicesFor(input.quality, input.improvements.length), task: null, statsId: stat._id, userId })
   res.json(await listFor(stat._id, userId))
}

export async function summonAction(req: Request, res: Response) {
   const { stat, userId } = await owner(req)
   const input = summonActionSchema.parse(req.body)
   const summon = await Summon.findOne({ _id: input.summonId, statsId: stat._id, userId })
   if (!summon) throw new NotFoundError('Summoned creature not found')
   // LeP lost in a fight are kept on the creature; reaching 0 does not dismiss it (the GM decides).
   if (input.action === 'health') {
      const creature = bestiary.find((entry) => entry.key === summon.creature)
      if (!creature) throw new NotFoundError('Creature not found')
      summon.health = assertSummonHealth(improvedCreature(creature, summon.improvements).health, input.current)
      await summon.save()
      res.json(await listFor(stat._id, userId))
      return
   }
   const state = { services: summon.services, task: summon.task ?? null }
   const next = input.action === 'dismiss' ? { services: 0, task: null }
      : input.action === 'sunrise' ? afterSunrise(state)
      : input.action === 'join-fight' ? joinFight(state, input.service)
      : input.action === 'fight-over' ? fightOver(state) : useService(state, input.service)
   if (vanishes(next)) await summon.deleteOne()
   else {
      summon.set(next)
      await summon.save()
   }
   res.json(await listFor(stat._id, userId))
}
