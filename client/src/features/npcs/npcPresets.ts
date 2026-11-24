import { combatStoreItems, unarmedWeapon, type StoreWeapon } from '@/features/heroes/combatGear'
import type { TalentAttribute } from '@/features/heroes/talentCatalog'

// Generator presets (user request, Nov 2026). App choice, not a rule: the core rules print no NPC tables (S. 383–391),
// so roles and experience only fill in typical attributes, weapons, armour and abilities. Everything stays editable,
// and the server derives all values with the hero rules (npcGenerator.ts).

export type Role = 'commoner' | 'fighter' | 'guard' | 'archer' | 'rogue' | 'caster'
export type Tier = 'weak' | 'average' | 'experienced' | 'dangerous'
export type GeneratorWeapon = {
   name: string; technique: string; damage: string; leading: string | null; threshold: number | null
   attackModifier: number; parryModifier: number; reach: 'short' | 'medium' | 'long' | 'ranged'
   range: string | null; reload: number | null; shield: boolean
}
export type GeneratorInput = {
   species: string; attributes: Record<TalentAttribute, number>; techniques: Record<string, number>
   weapons: GeneratorWeapon[]; armor: string | null; abilities: string[]
}

export const roles: Role[] = ['commoner', 'fighter', 'guard', 'archer', 'rogue', 'caster']
export const tiers: Tier[] = ['weak', 'average', 'experienced', 'dangerous']
export const roleLabels: Record<Role, string> = { commoner: 'Commoner', fighter: 'Fighter', guard: 'Guard', archer: 'Archer', rogue: 'Rogue', caster: 'Spellcaster' }
export const tierLabels: Record<Tier, string> = { weak: 'Weak', average: 'Average', experienced: 'Experienced', dangerous: 'Dangerous' }
// Species with values in the creation catalog (server speciesCatalog)
export const speciesOptions = ['Mensch', 'Elf', 'Halbelf', 'Zwerg']
// Armour rows of the armour table (S. 32), lightest first
export const armorOptions = ['Normale Kleidung', 'Schwere Kleidung', 'Stoffrüstung', 'Gambeson', 'Lederrüstung', 'Kettenrüstung', 'Schuppenrüstung', 'Plattenrüstung']

// Attribute bonus over 11 and combat technique value per experience
const tierValues: Record<Tier, { attribute: number; technique: number }> = {
   weak: { attribute: 0, technique: 8 }, average: { attribute: 1, technique: 10 }, experienced: { attribute: 2, technique: 12 }, dangerous: { attribute: 3, technique: 14 },
}
type RolePreset = { primary: TalentAttribute[]; weapons: string[]; armor: Record<Tier, string | null>; abilities: Record<Tier, string[]> }
const none = { weak: [], average: [], experienced: [], dangerous: [] }
const presets: Record<Role, RolePreset> = {
   commoner: { primary: ['constitution'], weapons: ['Knüppel'], armor: { weak: null, average: null, experienced: 'Schwere Kleidung', dangerous: 'Schwere Kleidung' }, abilities: none },
   fighter: {
      primary: ['courage', 'dexterity', 'constitution', 'strength'], weapons: ['Säbel'],
      armor: { weak: 'Schwere Kleidung', average: 'Stoffrüstung', experienced: 'Lederrüstung', dangerous: 'Kettenrüstung' },
      abilities: { weak: [], average: ['Wuchtschlag I'], experienced: ['Finte I', 'Wuchtschlag I'], dangerous: ['Belastungsgewöhnung I', 'Finte I', 'Wuchtschlag II'] },
   },
   guard: {
      primary: ['courage', 'intuition', 'constitution', 'strength'], weapons: ['Speer (2H)'],
      armor: { weak: 'Stoffrüstung', average: 'Lederrüstung', experienced: 'Kettenrüstung', dangerous: 'Kettenrüstung' },
      abilities: { weak: [], average: ['Wuchtschlag I'], experienced: ['Aufmerksamkeit', 'Wuchtschlag I'], dangerous: ['Aufmerksamkeit', 'Belastungsgewöhnung I', 'Wuchtschlag II'] },
   },
   archer: {
      primary: ['intuition', 'fingerDexterity', 'dexterity'], weapons: ['Kurzbogen', 'Dolch'],
      armor: { weak: null, average: 'Schwere Kleidung', experienced: 'Stoffrüstung', dangerous: 'Lederrüstung' },
      abilities: { weak: [], average: [], experienced: ['Präziser Schuss/Wurf I'], dangerous: ['Präziser Schuss/Wurf II'] },
   },
   rogue: {
      primary: ['intuition', 'fingerDexterity', 'dexterity'], weapons: ['Dolch'], armor: { weak: null, average: null, experienced: null, dangerous: null },
      abilities: { weak: [], average: ['Verbessertes Ausweichen I'], experienced: ['Finte I', 'Verbessertes Ausweichen I'], dangerous: ['Finte II', 'Verbessertes Ausweichen II'] },
   },
   caster: { primary: ['wisdom', 'intuition', 'charisma'], weapons: ['Dolch'], armor: { weak: null, average: null, experienced: null, dangerous: null }, abilities: none },
}

// A store weapon as generator input (technique, damage bonus, AT/PA modifiers, reach or range)
export function weaponInput(name: string, weapon: StoreWeapon, shield = false): GeneratorWeapon {
   const reload = typeof weapon.reloadActions === 'number' ? weapon.reloadActions : null
   return {
      name, technique: weapon.combatTechnique, damage: weapon.damage, leading: weapon.leadingAttribute ?? null, threshold: weapon.threshold ?? null,
      attackModifier: weapon.attackModifier ?? 0, parryModifier: weapon.parryModifier ?? 0, reach: weapon.reach,
      range: weapon.reach === 'ranged' ? weapon.range ?? null : null, reload: weapon.reach === 'ranged' ? reload : null, shield,
   }
}
export function storeWeapon(name: string): GeneratorWeapon | null {
   const item = combatStoreItems.find((entry) => entry.name === name && entry.weapon)
   return item?.weapon ? weaponInput(item.name, item.weapon, item.kind === 'shield') : null
}
// Weapons the generator offers (melee, shields, ranged) from the store catalog
export const generatorWeapons = combatStoreItems.filter((item) => item.weapon).map((item) => item.name)

export function presetInput(role: Role, tier: Tier, species = 'Mensch'): GeneratorInput {
   const preset = presets[role]
   const values = tierValues[tier]
   const attributes = Object.fromEntries((['courage', 'wisdom', 'intuition', 'charisma', 'fingerDexterity', 'dexterity', 'constitution', 'strength'] as TalentAttribute[])
      .map((key) => [key, 11 + (preset.primary.includes(key) ? 1 + values.attribute : 0)])) as Record<TalentAttribute, number>
   const weapons = [weaponInput('Waffenlos', unarmedWeapon), ...preset.weapons.flatMap((name) => storeWeapon(name) ?? [])]
   // Main techniques at the tier's value; brawling a little lower (most NPCs are no trained brawlers)
   const techniques = Object.fromEntries(weapons.map((weapon) => [weapon.technique, weapon.technique === 'Raufen' && weapons.length > 1 ? values.technique - 2 : values.technique]))
   return { species, attributes, techniques, weapons, armor: preset.armor[tier], abilities: preset.abilities[tier] }
}
