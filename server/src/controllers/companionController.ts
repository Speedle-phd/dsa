import type { Request, Response } from 'express'
import type { CompanionReferenceResponse, CompanionsResponse, PublicCompanion } from '@/types/apiContracts'
import { Companion, type ICompanionDocument } from '@/models/companion.model'
import { findStatsForUser } from '@/utils/statsPersistence'
import { BadRequestError, UnauthorizedError } from '@/utils/appError'
import { companionSpecies, companionTalentProbes, familiarTricks, freeFamiliarTricks } from '@/utils/companionCatalog'
import {
   availableTricks, companionPain, companionProbe, companionTalentTargets, customSpecies, effectiveCompanion, newCompanion, type OwnedCompanion,
} from '@/utils/companionRules'
import {
   companionAddSchema, companionRemoveSchema, companionResourcesSchema, companionTrickSchema, companionUpdateSchema,
} from '@/validations/companionValidation'

export function getCompanionReference(_req: Request, res: Response) {
   const reference: CompanionReferenceResponse = { species: companionSpecies, tricks: familiarTricks, talentKeys: Object.keys(companionTalentProbes) }
   res.json(reference)
}

export function publicCompanion(companion: ICompanionDocument): PublicCompanion {
   const { _id, userId: _userId, statsId: _statsId, createdAt: _createdAt, updatedAt: _updatedAt, __v: _v, talents, tricks, ...rest } =
      companion.toObject() as OwnedCompanion & Record<string, unknown>
   const plain = { ...rest, talents, tricks } as OwnedCompanion
   return {
      ...plain,
      loyalty: plain.loyalty ?? null,
      id: String(_id),
      talents: talents.map((talent) => ({ key: talent.key, value: talent.value ?? null, note: talent.note ?? '',
         targets: talent.value === null ? null : companionTalentTargets(plain, talent.key), probe: companionProbe(plain, talent.key) })),
      tricks: [...(plain.familiar ? freeFamiliarTricks.map((key) => ({ key, paidAP: 0, free: true })) : []),
         ...tricks.map((entry) => ({ key: entry.key, paidAP: entry.paidAP ?? 0, free: false }))],
      effective: { ...effectiveCompanion(plain), pain: companionPain(plain) },
   }
}

async function owner(req: Request) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   return { stat, userId: req.user._id }
}

// Oldest first: _id order is creation order, also for companions moved out of the stats document.
async function listFor(statsId: unknown, userId: string): Promise<CompanionsResponse> {
   const companions = await Companion.find({ statsId, userId }).sort({ _id: 1 })
   return { companions: companions.map(publicCompanion) }
}

async function findCompanion(req: Request, companionId: string) {
   const { stat, userId } = await owner(req)
   const companion = await Companion.findOne({ _id: companionId, statsId: stat._id, userId })
   if (!companion) throw new BadRequestError('This companion is not recorded.')
   return { companion, statsId: stat._id, userId }
}

export async function getCompanions(req: Request, res: Response) {
   const { stat, userId } = await owner(req)
   res.json(await listFor(stat._id, userId))
}

export async function addCompanion(req: Request, res: Response) {
   const { stat, userId } = await owner(req)
   const { species, name, familiar } = companionAddSchema.parse(req.body)
   if (familiar) {
      // source: DSA5 Regelwerk, S. 278–279 (Vertrautenbindung required; only one familiar at a time)
      if (!stat.generalSpecialAbilities.includes('Vertrautenbindung')) throw new BadRequestError('A familiar requires the special ability Vertrautenbindung (S. 279).')
      if (await Companion.exists({ statsId: stat._id, userId, familiar: true })) throw new BadRequestError('A witch cannot bind more than one familiar (S. 278).')
      if (species !== customSpecies && !companionSpecies.find((entry) => entry.key === species)?.familiar) {
         throw new BadRequestError('This core-rule species is not a familiar species (Katze, Kröte, Rabe; S. 278).')
      }
   }
   await Companion.create({ ...newCompanion(species, name, familiar), statsId: stat._id, userId })
   res.json(await listFor(stat._id, userId))
}

export async function updateCompanion(req: Request, res: Response) {
   const input = companionUpdateSchema.parse(req.body)
   const { companion, statsId, userId } = await findCompanion(req, input.companionId)
   if (input.experienceTotal < companion.experience.spent) throw new BadRequestError('Total AP cannot be lower than the AP already spent.')
   companion.set({
      name: input.name, attributes: input.attributes, initiative: input.initiative, defense: input.defense,
      soulPower: input.soulPower, toughness: input.toughness, speed: input.speed, armor: input.armor, actions: input.actions,
      attacks: input.attacks, talents: input.talents, traits: input.traits, abilities: input.abilities,
      special: input.special, notes: input.notes, loyalty: input.loyalty,
   })
   companion.health.max = input.healthMax
   companion.mana.base = input.manaBase
   companion.experience.total = input.experienceTotal
   const effective = effectiveCompanion(companion)
   companion.health.current = Math.min(companion.health.current, effective.maxHealth)
   companion.mana.current = Math.min(companion.mana.current, effective.maxMana)
   await companion.save()
   res.json(await listFor(statsId, userId))
}

export async function setCompanionResources(req: Request, res: Response) {
   const { companionId, health, mana } = companionResourcesSchema.parse(req.body)
   const { companion, statsId, userId } = await findCompanion(req, companionId)
   const effective = effectiveCompanion(companion)
   if (health !== undefined) {
      if (health > effective.maxHealth) throw new BadRequestError('LeP cannot exceed the maximum.')
      companion.health.current = health
   }
   if (mana !== undefined) {
      if (mana > effective.maxMana) throw new BadRequestError('AsP cannot exceed the maximum.')
      companion.mana.current = mana
   }
   await companion.save()
   res.json(await listFor(statsId, userId))
}

// source: DSA5 Regelwerk, S. 279 (familiars pay tricks from their own AP pool)
export async function addCompanionTrick(req: Request, res: Response) {
   const { companionId, key, spendAP } = companionTrickSchema.parse(req.body)
   const { companion, statsId, userId } = await findCompanion(req, companionId)
   const trick = availableTricks(companion).find((entry) => entry.key === key)
   if (!trick) throw new BadRequestError('This trick is not available for this companion (S. 279–280).')
   if (trick.ap === null || companion.tricks.some((entry) => entry.key === key)) throw new BadRequestError('This trick is already known.')
   const cost = spendAP ? trick.ap : 0
   if (cost > companion.experience.total - companion.experience.spent) throw new BadRequestError('Not enough companion AP.')
   companion.tricks.push({ key, paidAP: cost })
   companion.experience.spent += cost
   await companion.save()
   res.json(await listFor(statsId, userId))
}

export async function removeCompanionTrick(req: Request, res: Response) {
   const { companionId, key, spendAP } = companionTrickSchema.parse(req.body)
   const { companion, statsId, userId } = await findCompanion(req, companionId)
   const owned = companion.tricks.find((entry) => entry.key === key)
   if (!owned) throw new BadRequestError('This trick is not recorded.')
   const refund = spendAP ? owned.paidAP : 0
   companion.tricks = companion.tricks.filter((entry) => entry.key !== key)
   companion.experience.spent = Math.max(0, companion.experience.spent - refund)
   await companion.save()
   res.json(await listFor(statsId, userId))
}

export async function removeCompanion(req: Request, res: Response) {
   const { companionId } = companionRemoveSchema.parse(req.body)
   const { companion, statsId, userId } = await findCompanion(req, companionId)
   await companion.deleteOne()
   res.json(await listFor(statsId, userId))
}
