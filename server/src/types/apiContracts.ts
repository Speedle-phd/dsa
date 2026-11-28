import type { HerbItemState } from '@/utils/herbItem'
export type PublicUser = {
   _id: string
   username: string
   email: string
}

export type AuthenticatedUser = PublicUser

export type UserRecord = { _id: unknown } & Omit<PublicUser, '_id'>

export type AuthResponse = {
   message: string
   token: string
   user: PublicUser
}

export type PasswordResetResponse = Pick<AuthResponse, 'message' | 'token'>

export type UserResponse = Pick<AuthResponse, 'user'>

export type ErrorResponse = {
   statusCode: number
   message: string
   stack?: string
}

export type JwtPayload = Partial<
   Pick<PublicUser, 'username'> & {
      sub: string
      iat: number
      exp: number
   }
> & {
   [key: string]: unknown
}

export type RegisterInput = {
   username: string
   email: string
   password: string
}

export type LoginInput = Omit<RegisterInput, 'username'>

export type ResetPasswordInput = {
   currentPassword: string
   newPassword: string
}

export type UserUpdateInput = Partial<Pick<PublicUser, 'username'>> & {
   currentPassword?: string
   newPassword?: string
}

export type CharacterSex = 'male' | 'female' | 'other'
export type CharacterStatus = 'active' | 'retired' | 'deceased'

export type PublicChar = {
   _id: string
   userId: string
   name: string
   title?: string
   sex: CharacterSex
   age: number
   species: string
   placeOfOrigin?: string
   culture: string
   profession: string
   socialStatus: string
   height?: number
   weight?: number
   build?: string
   eyeColor?: string
   hairColor?: string
   appearance?: string
   background?: string
   biography?: string
   familyTree?: {
      parents?: string[]
      siblings?: string[]
      partner?: string | null
      children?: string[]
      notes?: string
   }
   status: CharacterStatus
   createdAt: string
   updatedAt: string
}

export type CharResponse = {
   char: PublicChar
}

export type CharsResponse = {
   chars: PublicChar[]
   count: number
}

export type CreateCharInput = {
   name: string
   title?: string
   sex: CharacterSex
   age: number
   species: string
   placeOfOrigin: string
   culture: string
   profession: string
   socialStatus: string
   height?: number
   weight?: number
   build?: string
   eyeColor?: string
   hairColor?: string
   appearance?: string
   background?: string
   biography?: string
   familyTree?: {
      parents?: string[]
      siblings?: string[]
      partner?: string | null
      children?: string[]
      notes?: string
   }
   status?: CharacterStatus
}

export type UpdateCharInput = Partial<CreateCharInput>

export type Equipments = {
   item: string
   amount: number
   weight?: number
   carriedOn: string
   category: string
   description?: string
   quality?: number
   herb?: HerbItemState
}

export type TalentEntry = {
   key: string
   value: number
   notes: string
}

export type PublicCompanion = Omit<import('../utils/companionRules').OwnedCompanion, '_id' | 'talents' | 'tricks'> & {
   id: string
   talents: Array<import('../utils/companionCatalog').CompanionTalent & { targets: number[] | null; probe: string[] | null }>
   tricks: Array<{ key: string; paidAP: number; free: boolean }>
   effective: ReturnType<typeof import('../utils/companionRules').effectiveCompanion> & { pain: number }
}
export type CompanionReferenceResponse = {
   species: import('../utils/companionCatalog').CompanionSpecies[]
   tricks: import('../utils/companionCatalog').FamiliarTrick[]
   talentKeys: string[]
}
export type BestiaryReferenceResponse = {
   creatures: import('../utils/bestiaryCatalog').BestiaryCreature[]
   creatureRules: typeof import('../utils/bestiaryCatalog').creatureRules
   counterElements: Array<[string, string]>
   animalWisdomTable: Array<[number, number]>
   creatureManeuvers: typeof import('../utils/bestiaryCatalog').creatureManeuvers
   demonSpells: typeof import('../utils/bestiaryCatalog').demonSpells
   summoningRituals: typeof import('../utils/bestiaryCatalog').summoningRituals
   summonImprovements: Array<typeof import('../utils/bestiaryCatalog').summonImprovements[number]>
   summonServices: Array<typeof import('../utils/bestiaryCatalog').summonServices[number]>
   summoningFailures: typeof import('../utils/bestiaryCatalog').summoningFailures
}
export type CompanionsResponse = {
   companions: PublicCompanion[]
}
export type MagicReferenceResponse = {
   spells: import('../utils/magicCatalog').MagicSpell[]
   tricks: import('../utils/magicCatalog').MagicTrick[]
   traditions: Array<typeof import('../utils/magicCatalog').magicTraditions[number]>
   abilityKeys: string[]
   staff: { volumes: Record<string, number>; capacity: number; activatable: string[] }
}
export type SpellChangeInput = { key: string; value?: number; spendAP?: boolean }
export type MagicRemovalInput = Pick<SpellChangeInput, 'key' | 'spendAP'>
export type SpellNotesInput = { key: string; notes: string }
export type MagicSettingsInput = Partial<import('../utils/magicCatalog').MagicSettings>
export type ManaAdjustmentInput = { direction: 'spend' | 'recover'; amount: number }

export type PublicStats = {
   _id: string
   userId: string
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
   experience: {
      base: number
      total: number
      gathered: number
      spent: number
      disadvantageCredit: number
   }
   health: {
      value: number
      basicValue: number
      bonusMalus: number
      additionalPurchase: number
      // Hohe/Niedrige Lebenskraft levels (S. 166, 174)
      advantageBonus: number
      current: number
      max: number
   }
   mana: {
      professionValue: number
      bonusMalus: number
      additionalPurchase: number
      // Value of the tradition's Leiteigenschaft (derived, S. 56–57)
      traditionAttributeBonus: number
      leadingAttribute: 'courage' | 'wisdom' | 'intuition' | 'charisma' | null
      // Hohe/Niedrige Astralkraft or Karmalkraft levels (S. 166, 174)
      advantageBonus: number
      current: number
      max: number
   }
   karmaEnergy: {
      professionValue: number
      bonusMalus: number
      additionalPurchase: number
      // Value of the tradition's Leiteigenschaft (derived, S. 56–57)
      traditionAttributeBonus: number
      leadingAttribute: 'courage' | 'wisdom' | 'intuition' | 'charisma' | null
      // Hohe/Niedrige Astralkraft or Karmalkraft levels (S. 166, 174)
      advantageBonus: number
      current: number
      max: number
   }
   soulPower: {
      value: number
      basicValue: number
      bonusMalus: number
      entrySources: import('../utils/entryDerivedValues').ValueSource[]
      max: number
   }
   toughness: {
      value: number
      basicValue: number
      bonusMalus: number
      entrySources: import('../utils/entryDerivedValues').ValueSource[]
      max: number
   }
   dodge: {
      value: number
      basicValue: number
      bonusMalus: number
      max: number
   }
   fatePoints: {
      value: number
      bonusMalus: number
      entrySources: import('../utils/entryDerivedValues').ValueSource[]
      current: number
      max: number
   }
   pain: number
   burden: number
   purse: {
      dukaten: number
      silbertaler: number
      heller: number
      kreuzer: number
   }
   equipment: Equipments[]
   carryingCapacity: number
   advantages: string[]
   disadvantages: string[]
   generalSpecialAbilities: string[]
   combatTechniques: Array<{ key: string; value: number }>
   combatSpecialAbilities: string[]
   combatAbilityPurchases: Array<{ key: string; ap: number }>
   entryPurchases: import('../utils/characterEntryCatalog').EntryPurchase[]
   entryCredits: import('../utils/characterEntryCatalog').EntryCredit[]
   entryEffects: Record<string, import('../utils/characterEntryCatalog').EntryEffect>
   combatConditions: Record<string, number>
   statuses: import('../utils/statusRules').StatusName[]
   // Statuses given permanently by disadvantages (Blind, Taub, Stumm); not stored, cannot be switched off.
   permanentStatuses: import('../utils/statusRules').StatusName[]
   // Disadvantages with a trigger (S. 170, 173, 177) and the ones switched on
   triggerOptions: import('../utils/entryTriggers').TriggerOption[]
   triggers: string[]
   // SK/ZK against poison, disease or magic only (S. 165–179); shown, not applied
   conditionalResistances: ReturnType<typeof import('../utils/entryDerivedValues').conditionalResistances>
   wornArmor: string | null
   checkModifiers: ReturnType<typeof import('../utils/checkModifiers').checkModifiers>
   combatModifiers: { initiative: number; speed: number; speedBase: number | null }
   combatValues: Array<{ key: string; attack: number; parry: number | null }>
   // Highest value reachable with AP (S. 39, 166)
   skillMaxima: { talents: Record<string, number>; combatTechniques: Record<string, number> }
   talents: TalentEntry[]
   languages: string[]
   scripts: string[]
   spells: import('../utils/magicCatalog').OwnedSpell[]
   magicTricks: import('../utils/magicCatalog').OwnedTrick[]
   magicSettings: import('../utils/magicCatalog').MagicSettings
   liturgies: import('../utils/karmaCatalog').OwnedLiturgy[]
   blessings: import('../utils/karmaCatalog').OwnedBlessing[]
   isSorcerer: boolean
   isConsecratedPerson: boolean
   createdAt: string
   updatedAt: string
}

export type StatsResponse = {
   stats: PublicStats
}

export type StatsListResponse = {
   stats: PublicStats[]
   count: number
}

export type CreateStatsInput = {
   charId: string
   strength?: number
   courage?: number
   intuition?: number
   dexterity?: number
   fingerDexterity?: number
   wisdom?: number
   charisma?: number
   constitution?: number
   level?: string
   experience?: {
      base?: number
      total?: number
      gathered?: number
      spent?: number
   }
   health?: {
      value?: number
      basicValue?: number
      bonusMalus?: number
      additionalPurchase?: number
      current?: number
      max?: number
   }
   mana?: {
      value?: number
      professionValue?: number
      bonusMalus?: number
      additionalPurchase?: number
      current?: number
      max?: number
   }
   karmaEnergy?: {
      value?: number
      professionValue?: number
      bonusMalus?: number
      additionalPurchase?: number
      current?: number
      max?: number
   }
   soulPower?: {
      value?: number
      basicValue?: number
      bonusMalus?: number
      max?: number
   }
   toughness?: {
      value?: number
      basicValue?: number
      bonusMalus?: number
      max?: number
   }
   dodge?: {
      value?: number
      basicValue?: number
      bonusMalus?: number
      max?: number
   }
   fatePoints?: {
      value?: number
      bonusMalus?: number
      current?: number
      max?: number
   }
   pain?: number
   burden?: number
   purse?: {
      dukaten?: number
      silbertaler?: number
      heller?: number
      kreuzer?: number
   }
   carryingCapacity?: number
   advantages?: string[]
   disadvantages?: string[]
   generalSpecialAbilities?: string[]
   talents?: TalentEntry[]
   languages?: string[]
   scripts?: string[]
}

export type VitalResourcesType = 'health' | 'mana' | 'karmaEnergy'
