import type { EffectDamage } from './combatSituation'
import { axiosInstance } from '@/axios/axios'
export type VitalResourcesType = 'health' | 'mana' | 'karmaEnergy'
import type { EntryEffect, EntryPurchase } from './characterEntryApi'
import type { TalentAttribute } from './talentCatalog'

export type Resource = {
   value: number
   basicValue: number
   bonusMalus: number
   additionalPurchase: number
   current: number
   max: number
   // AsP/KaP only, derived on the server (S. 56–57, 166, 174)
   traditionAttributeBonus?: number
   leadingAttribute?: TalentAttribute | null
   advantageBonus?: number
   // Mana only: permanently spent AsP and those bought back (S. 262, 352)
   permanentLoss?: number
   permanentBuyback?: number
}

export type FatePoints = {
   value: number
   bonusMalus: number
   // Glück/Pech (S. 165, 174), derived on the server
   entrySources?: ModifierSource[]
   current: number
   max: number
}

// SK/ZK carry Hohe/Niedrige Seelenkraft/Zähigkeit as entrySources (S. 166–167, 174)
export type StaticResource = Omit<Resource, 'current'> & { entrySources?: ModifierSource[] }

export type EquipmentEntry = {
   item: string
   weight: number
   amount: number
   carriedOn: string
   category: string
   description?: string
   // Weapon damage from a Patzer table until repaired (S. 231, 234, 243–244)
   condition?: 'damaged' | 'broken'
   // Qualitätsstufe of an alchemical elixir (S. 271, 379)
   quality?: number
}

export type EquipmentPurchaseInput = {
   item: string
   category: string
   unitWeight: number
   amount: number
   carriedOn: string
   unitPriceSilbertaler: number
   description?: string
   quality?: number
   contents?: Array<{ item: string; category: string; unitWeight: number; amount: number; description?: string }>
}

export type TalentEntry = {
   key: string
   value: number
   notes: string
}
export type ModifierSource = { label: string; value: number; page: number }
export type RollEffect = {
   id: string
   label: string
   kind: CheckProfile['kind']
   keys?: string[]
   value: number
   skillPoints: number
   automatic: boolean
   page: number
   de: string
   en: string
   group?: string
   excludes?: string[]
   blocked?: boolean
   offsetPenalty?: number
   exceptKeys?: string[]
   targetRule?: TargetRule
   // Maneuver damage on a hit (S. 247–250)
   damage?: EffectDamage
   // Offered in the dice dialogs (S. 164, 169, 178)
   reroll?: 'begabung' | 'unfaehig' | 'waffenbegabung' | 'falschspielen' | 'rosstaeuscher'
}
// Status rules that replace a target: halved (rounded up) or only a rolled 1 succeeds (S. 35).
export type TargetRule = 'halve' | 'one'
export type CheckProfile = {
   kind: 'attribute' | 'attack' | 'ranged' | 'defense' | 'talent'
   burden: boolean
   movement: boolean
   pleasing: boolean
   complex: boolean
   total: number
   sources: ModifierSource[]
   blocked: string[]
}
export type CheckContext = {
   modifier: number
   burden: boolean | null
   movement: boolean | null
   pleasing: boolean | null
   preserveAction: boolean
   preserveActionCheck: boolean
   effects: string[]
}
export type CheckModifiers = {
   profiles: CheckProfile[]
   entryEffects: RollEffect[]
   effectivePain: number
   armor: string | null
   burden: number
   otherBurden: number
   armorBurden: number
   unverifiedConditions: string[]
   initiative: { total: number; sources: ModifierSource[] }
   speed: { total: number; sources: ModifierSource[]; factor: number; blocked: boolean; override: number | null; overrideLabel: string | null }
   // GS-Grundwert: Flink/Behäbig, then halved (rounded up) by Verstümmelt (Einbeinig) (S. 165, 171, 179)
   speedBase: { sources: ModifierSource[]; halved: { label: string; page: number } | null }
}

export type Stats = {
   _id: string
   charId: string
   strength: number
   courage: number
   intuition: number
   dexterity: number
   fingerDexterity: number
   wisdom: number
   charisma: number
   constitution: number
   level: string
   experience: { gathered: number; spent: number; total: number; base: number; disadvantageCredit: number }
   health: Resource
   mana: Resource
   karmaEnergy: Resource
   soulPower: StaticResource
   toughness: StaticResource
   dodge: StaticResource
   fatePoints: FatePoints
   pain: number
   burden: number
   purse: {
      dukaten: number
      silbertaler: number
      heller: number
      kreuzer: number
   }
   equipment: EquipmentEntry[]
   carryingCapacity: number
   advantages: string[]
   disadvantages: string[]
   generalSpecialAbilities: string[]
   combatTechniques: Array<{ key: string; value: number }>
   combatSpecialAbilities: string[]
   combatAbilityPurchases: Array<{ key: string; ap: number }>
   entryPurchases: EntryPurchase[]
   entryCredits: Array<{ key: string; ap: number }>
   entryEffects: Record<string, EntryEffect>
   combatConditions: Record<string, number>
   statuses: string[]
   // From Blind/Taub/Stumm (S. 171, 178): always on, not stored
   permanentStatuses: string[]
   // Disadvantages whose condition applies while their trigger is present (S. 170, 173, 177)
   triggerOptions: Array<{ key: string; condition: 'Furcht' | 'Schmerz' | 'Verwirrung'; levels: number; page: number }>
   triggers: string[]
   // SK/ZK that only count against poison, disease or magic (S. 165–179); display only
   conditionalResistances: Array<{ label: string; against: 'poison' | 'disease' | 'magic' | 'trueName'; value: number; page: number }>
   wornArmor: string | null
   checkModifiers: CheckModifiers
   combatModifiers: { initiative: number; speed: number; speedBase: number | null }
   combatValues: Array<{ key: string; attack: number; parry: number | null }>
   // Highest value reachable with AP: probe/Leiteigenschaft + 2, Herausragende Fertigkeit/Kampftechnik (S. 39, 166)
   skillMaxima: { talents: Record<string, number>; combatTechniques: Record<string, number> }
   talents: TalentEntry[]
   languages: string[]
   scripts: string[]
   spells: Array<{ key: string; value: number; notes: string; paidAP: number }>
   magicTricks: Array<{ key: string; paidAP: number }>
   liturgies: Array<{ key: string; value: number; notes: string; paidAP: number }>
   blessings: Array<{ key: string; paidAP: number }>
   magicSettings: {
      artifacts: string; artifactItems: string[]; guildSpell: string | null
      // Bound Magierstab (S. 275–278) and the witch's flying device (S. 281)
      staffItem: string | null; staffActive: string | null; staffInHand: boolean; flyingDevice: string | null
   }
   isSorcerer: boolean
   isConsecratedPerson: boolean
}

export type UpdateStatsInput = {
   strength: number
   courage: number
   intuition: number
   dexterity: number
   fingerDexterity: number
   wisdom: number
   charisma: number
   constitution: number
   level: string
   experience: { gathered: number; spent: number }
   health: {
      value: number
      bonusMalus: number
      additionalPurchase: number
      current: number
   }
   mana: {
      bonusMalus: number
      additionalPurchase: number
      current: number
   }
   karmaEnergy: {
      bonusMalus: number
      additionalPurchase: number
      current: number
   }
   soulPower: { value: number; bonusMalus: number }
   toughness: { value: number; bonusMalus: number }
   dodge: { bonusMalus: number }
   fatePoints: Omit<FatePoints, 'max'>
   purse: {
      dukaten: number
      silbertaler: number
      heller: number
      kreuzer: number
   }
   equipment?: EquipmentEntry[]
   advantages: string[]
   disadvantages: string[]
   generalSpecialAbilities: string[]
   isSorcerer: boolean
   isConsecratedPerson: boolean
}
export type AdvantagesAbilities = Pick<
   Stats,
   'advantages' | 'disadvantages' | 'generalSpecialAbilities'
>
export type ExperienceGathered = {
   gathered: number
}
export type AdditionalVitalResourcesPurchase = {
   health: number
   mana: number
   karmaEnergy: number
}

async function putStats<TPayload>(path: string, payload?: TPayload) {
   const response = await axiosInstance.put<{ stats: Stats }>(path, payload)
   return response.data.stats
}

export async function getStatsForHero(charId: string) {
   const response = await axiosInstance.get<{ stats: Stats }>(
      `/api/stats/character/${charId}`,
   )
   return response.data.stats
}

export async function updateStatsForHero(id: string, values: Partial<UpdateStatsInput> & { spendAP?: boolean }) {
   return putStats(`/api/stats/update/${id}`, values)
}

export async function levelUpAttribute(
   id: string,
   values: { attribute: string; value?: number; spendAP?: boolean },
) {
   return putStats(`/api/stats/attribute-level-up/${id}`, values)
}

export async function updateAdvantagesAbilities(
   id: string,
   values: AdvantagesAbilities,
) {
   return putStats(`/api/stats/advantages-abilities/${id}`, values)
}

export async function updateExperience(id: string, values: ExperienceGathered) {
   return putStats(`/api/stats/experience/${id}`, values)
}

export async function incrementFatePoints(id: string) {
   const stats = await putStats(`/api/stats/increment-fate-points/${id}`)
   return stats.fatePoints
}

export async function spendFatePoint(id: string) {
   return putStats(`/api/stats/spend-fate-point/${id}`)
}

export type RegenerationResource = 'health' | 'mana' | 'karmaEnergy'
export type RegenerationSituation = {
   campsite: 'bad' | 'normal' | 'good'
   interruption: 'none' | 'short' | 'long'
   environment: 'normal' | 'bad' | 'terrible'
   poisonedOrSick: boolean
   ironStone: number
   treatmentQuality: number
   otherModifier: number
   reducedHealth: boolean
}
export type RegenerationOutcome = {
   roll: number
   base: number
   modifiers: Array<{ label: string; value: number; ignored?: boolean }>
   subtotal: number
   environment: RegenerationSituation['environment']
   blocked: string | null
   treatment: number
   herb?: number
   amount: number
   gained: number
}

export async function regenerate(id: string, payload: RegenerationSituation & { rolls: Partial<Record<RegenerationResource, number>> }) {
   const response = await axiosInstance.put<{ stats: Stats; regeneration: Partial<Record<RegenerationResource, RegenerationOutcome>> }>(
      `/api/stats/regenerate/${id}`, payload)
   return response.data
}

export async function purchaseAdditionalVitalResources(
   id: string,
   value: VitalResourcesType,
   spendAP = true,
   target?: number,
) {
   return putStats(`/api/stats/purchase-additional-vital-resources/${id}`, {
      value,
      spendAP,
      target,
   })
}

export async function updateEquipmentForHero(
   id: string,
   values: Pick<Stats, 'equipment' | 'purse'>,
) {
   return putStats(`/api/stats/update/${id}`, values)
}

export async function purchaseEquipmentForHero(
   id: string,
   purchase: EquipmentPurchaseInput,
) {
   return putStats(`/api/stats/purchase-equipment/${id}`, purchase)
}

export type PurseAdjustmentInput = {
   direction: 'receive' | 'lose'
   coins: Stats['purse']
}

export async function adjustPurseForHero(
   id: string,
   adjustment: PurseAdjustmentInput,
) {
   return putStats(`/api/stats/adjust-purse/${id}`, adjustment)
}

export async function updateTalents(id: string, talents: TalentEntry[]) {
   return putStats(`/api/stats/talents/${id}`, { talents })
}

export async function levelUpTalent(id: string, talentKey: string, spendAP = true, value?: number) {
   return putStats(`/api/stats/talent-level-up/${id}`, { talentKey, spendAP, value })
}

export async function updateLanguagesScripts(
   id: string,
   values: { languages: string[]; scripts: string[] },
) {
   return putStats(`/api/stats/languages-scripts/${id}`, values)
}

export async function restoreFatePoints(id: string) {
   return putStats(`/api/stats/restore-fate-points/${id}`)
}
