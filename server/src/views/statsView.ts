import { defaultTalents, talentKeys } from '@/utils/talentCatalog'
import { combatTechniqueValues, defaultCombatTechniques } from '@/utils/combatRules'
import { checkModifiers } from '@/utils/checkModifiers'
import { normalizeStatuses } from '@/utils/statusRules'
import { equippedArmor, normalizeArmorEquipment } from '@/utils/armorEquipment'
import { entryCategories } from '@/utils/characterEntryCatalog'
import { canonicalEntryName, entryEffect } from '@/utils/characterEntryRules'
import { energyAdvantageBonus, energyMaximum, permanentEnergyLoss, healthMaximum, leadingAttribute, type EnergyKind } from '@/utils/energyRules'
import { calcPain } from '@/utils/baseAttributes'
import { applyEntryValues, conditionalResistances, entryStatuses, entryValueSources } from '@/utils/entryDerivedValues'
import { combatTechniqueMaximum, talentMaximum } from '@/utils/skillMaximum'
import { activeTriggers, triggerOptions } from '@/utils/entryTriggers'
import type {
   PublicStats,
   StatsListResponse,
   StatsResponse,
} from '@/types/stats.types'

// Derived on read so heroes saved before the change show the rule-conform maximum (S. 56–57).
function energyPool(stats: any, kind: EnergyKind, active: boolean) {
   const pool = stats[kind] ?? {}
   const bonusMalus = pool.bonusMalus ?? 0
   const additionalPurchase = pool.additionalPurchase ?? 0
   const max = Math.max(0, energyMaximum(stats, kind, bonusMalus, additionalPurchase, active) - permanentEnergyLoss(pool))
   const leading = leadingAttribute(stats, kind)
   return {
      professionValue: pool.professionValue ?? 20,
      bonusMalus,
      additionalPurchase,
      traditionAttributeBonus: leading?.value ?? 0,
      leadingAttribute: leading?.attribute ?? null,
      advantageBonus: energyAdvantageBonus(stats, kind),
      permanentLoss: pool.permanentLoss ?? 0,
      permanentBuyback: pool.permanentBuyback ?? 0,
      current: Math.min(pool.current ?? max, max),
      max,
   }
}

// source: DSA5 Regelwerk, S. 34, 57, 166, 174 (LeP max incl. Hohe/Niedrige Lebenskraft; Schmerz from the derived max)
function derivedHealth(stats: any) {
   const max = healthMaximum(stats, stats.health?.value ?? 0, stats.health?.bonusMalus ?? 0, stats.health?.additionalPurchase ?? 0)
   const current = Math.min(stats.health?.current ?? 0, max)
   return { max, current, pain: calcPain(current, max) }
}

// source: DSA5 Regelwerk, S. 165–167, 174 (SK/ZK/Schips maxima incl. Vor-/Nachteile, also for heroes saved before)
function derivedValues(stats: any) {
   const values = {
      courage: stats.courage, wisdom: stats.wisdom, intuition: stats.intuition, strength: stats.strength, constitution: stats.constitution,
      advantages: stats.advantages ?? [], disadvantages: stats.disadvantages ?? [],
      soulPower: { value: stats.soulPower?.value ?? 0, bonusMalus: stats.soulPower?.bonusMalus ?? 0, max: 0 },
      toughness: { value: stats.toughness?.value ?? 0, bonusMalus: stats.toughness?.bonusMalus ?? 0, max: 0 },
      fatePoints: { value: stats.fatePoints?.value ?? 3, bonusMalus: stats.fatePoints?.bonusMalus ?? 0, max: 0 },
   }
   applyEntryValues(values)
   return { soulPower: values.soulPower.max, toughness: values.toughness.max, fatePoints: values.fatePoints.max }
}

export function toPublicStats(stats: any): PublicStats {
   const health = derivedHealth(stats)
   const derived = derivedValues(stats)
   const permanentStatuses = entryStatuses(stats)
   const statuses = normalizeStatuses(stats.statuses ?? [])
   const activeStatuses = normalizeStatuses([...statuses, ...permanentStatuses])
   const equipment = normalizeArmorEquipment<PublicStats['equipment'][number]>(
      typeof stats.toObject === 'function' ? stats.toObject().equipment ?? [] : stats.equipment ?? [], [], stats.wornArmor,
   )
   const wornArmor = equippedArmor(equipment)
   return {
      _id: String(stats._id),
      userId: String(stats.userId),
      charId: String(stats.charId),
      strength: stats.strength ?? 0,
      courage: stats.courage ?? 0,
      intuition: stats.intuition ?? 0,
      dexterity: stats.dexterity ?? 0,
      fingerDexterity: stats.fingerDexterity ?? 0,
      wisdom: stats.wisdom ?? 0,
      charisma: stats.charisma ?? 0,
      constitution: stats.constitution ?? 0,
      level: stats.level ?? 'Unerfahren',
      experience: {
         base: stats.experience?.base ?? 0,
         total: stats.experience?.total ?? 0,
         gathered: stats.experience?.gathered ?? 0,
         spent: stats.experience?.spent ?? 0,
         disadvantageCredit: stats.experience?.disadvantageCredit ?? 0,
      },
      health: {
         value: stats.health?.value ?? 0,
         basicValue: stats.health?.basicValue ?? 0,
         bonusMalus: stats.health?.bonusMalus ?? 0,
         additionalPurchase: stats.health?.additionalPurchase ?? 0,
         advantageBonus: energyAdvantageBonus(stats, 'health'),
         current: health.current,
         max: health.max,
      },
      mana: energyPool(stats, 'mana', stats.isSorcerer ?? false),
      karmaEnergy: energyPool(stats, 'karmaEnergy', stats.isConsecratedPerson ?? false),
      soulPower: {
         value: stats.soulPower?.value ?? 0,
         basicValue: stats.soulPower?.basicValue ?? 0,
         bonusMalus: stats.soulPower?.bonusMalus ?? 0,
         entrySources: entryValueSources(stats, 'soulPower'),
         max: derived.soulPower,
      },
      toughness: {
         value: stats.toughness?.value ?? 0,
         basicValue: stats.toughness?.basicValue ?? 0,
         bonusMalus: stats.toughness?.bonusMalus ?? 0,
         entrySources: entryValueSources(stats, 'toughness'),
         max: derived.toughness,
      },
      dodge: {
         value: stats.dodge?.value ?? 0,
         basicValue: stats.dodge?.basicValue ?? 0,
         bonusMalus: stats.dodge?.bonusMalus ?? 0,
         max: stats.dodge?.max ?? 0,
      },
      fatePoints: {
         value: stats.fatePoints?.value ?? 3,
         bonusMalus: stats.fatePoints?.bonusMalus ?? 0,
         entrySources: entryValueSources(stats, 'fatePoints'),
         current: Math.min(stats.fatePoints?.current ?? 3, derived.fatePoints),
         max: derived.fatePoints,
      },
      pain: health.pain,
      burden: stats.burden ?? 0,
      equipment,
      purse: {
         dukaten: stats.purse?.dukaten ?? 0,
         silbertaler: stats.purse?.silbertaler ?? 0,
         heller: stats.purse?.heller ?? 0,
         kreuzer: stats.purse?.kreuzer ?? 0,
      },
      carryingCapacity: stats.carryingCapacity ?? 0,
      advantages: stats.advantages ?? [],
      disadvantages: [...new Set<string>((stats.disadvantages ?? []).map((key: string) => canonicalEntryName('disadvantages', key)))],
      generalSpecialAbilities: stats.generalSpecialAbilities ?? [],
      combatTechniques: stats.combatTechniques?.length ? stats.combatTechniques : defaultCombatTechniques(),
      combatSpecialAbilities: stats.combatSpecialAbilities ?? [],
      combatAbilityPurchases: stats.combatAbilityPurchases ?? [],
      entryPurchases: stats.entryPurchases ?? [],
      entryCredits: stats.entryCredits ?? [],
      entryEffects: Object.fromEntries(entryCategories.flatMap((category) =>
         (stats[category] ?? []).flatMap((key: string) => {
            const effect = entryEffect(category, key)
            return effect ? [[`${category}:${canonicalEntryName(category, key)}`, effect]] : []
         }))),
      combatConditions: stats.combatConditions ?? {},
      statuses,
      permanentStatuses,
      triggerOptions: triggerOptions(stats),
      triggers: activeTriggers(stats).map((option) => option.key),
      conditionalResistances: conditionalResistances(stats),
      wornArmor,
      checkModifiers: checkModifiers({
         pain: derivedHealth(stats).pain, combatConditions: stats.combatConditions ?? {}, statuses: activeStatuses, triggers: stats.triggers ?? [],
         combatSpecialAbilities: stats.combatSpecialAbilities ?? [],
         equipment, advantages: stats.advantages ?? [], disadvantages: stats.disadvantages ?? [],
         generalSpecialAbilities: stats.generalSpecialAbilities ?? [],
      }),
      combatModifiers: {
         initiative: stats.combatModifiers?.initiative ?? 0,
         speed: stats.combatModifiers?.speed ?? 0,
         speedBase: stats.combatModifiers?.speedBase ?? null,
      },
      combatValues: (stats.combatTechniques?.length ? stats.combatTechniques : defaultCombatTechniques())
         .map((entry: { key: string; value: number }) => combatTechniqueValues(entry, stats)),
      skillMaxima: {
         talents: Object.fromEntries(talentKeys.map((key) => [key, talentMaximum(stats, key) ?? 0])),
         combatTechniques: Object.fromEntries(defaultCombatTechniques().map(({ key }) => [key, combatTechniqueMaximum(stats, key) ?? 0])),
      },
      talents:
         stats.talents && stats.talents.length > 0
            ? stats.talents
            : defaultTalents(),
      languages: stats.languages ?? [],
      scripts: stats.scripts ?? [],
      spells: (stats.spells ?? []).map((entry: PublicStats['spells'][number]) => ({
         key: entry.key, value: entry.value, notes: entry.notes ?? '', paidAP: entry.paidAP ?? 0,
      })),
      magicTricks: (stats.magicTricks ?? []).map((entry: PublicStats['magicTricks'][number]) => ({ key: entry.key, paidAP: entry.paidAP ?? 0 })),
      liturgies: (stats.liturgies ?? []).map((entry: PublicStats['liturgies'][number]) => ({
         key: entry.key, value: entry.value, notes: entry.notes ?? '', paidAP: entry.paidAP ?? 0,
      })),
      blessings: (stats.blessings ?? []).map((entry: PublicStats['blessings'][number]) => ({ key: entry.key, paidAP: entry.paidAP ?? 0 })),
      magicSettings: {
         artifacts: stats.magicSettings?.artifacts ?? '', artifactItems: stats.magicSettings?.artifactItems ?? [],
         guildSpell: stats.magicSettings?.guildSpell ?? null,
         staffItem: stats.magicSettings?.staffItem ?? null, staffActive: stats.magicSettings?.staffActive ?? null,
         staffInHand: stats.magicSettings?.staffInHand ?? true, flyingDevice: stats.magicSettings?.flyingDevice ?? null,
      },
      isSorcerer: stats.isSorcerer ?? false,
      isConsecratedPerson: stats.isConsecratedPerson ?? false,
      createdAt: new Date(stats.createdAt).toISOString(),
      updatedAt: new Date(stats.updatedAt).toISOString(),
   }
}

export function buildStatResponse(stats: any): StatsResponse {
   return { stats: toPublicStats(stats) }
}

export function buildStatsResponse(stats: any[]): StatsListResponse {
   return {
      stats: stats.map(toPublicStats),
      count: stats.length,
   }
}
