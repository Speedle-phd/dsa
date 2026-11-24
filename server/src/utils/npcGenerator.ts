import { armorIndex, armorTable } from '@/utils/armorEquipment'
import { calcBaseAttributes } from '@/utils/baseAttributes'
import { combatTechniqueValues, getCombatTechnique, type CombatAttributes } from '@/utils/combatRules'
import { speciesCatalog } from '@/utils/creation/speciesCatalog'
import { emptySheet, legacyFromWeapons, type NpcAttributeKey, type NpcSheet, type NpcWeapon } from '@/utils/npcRules'

// Builds an NPC from species, attributes, combat techniques, weapons and armour with the hero rules (user request,
// Nov 2026); one rule source with the heroes. The roles and experience presets that fill these inputs are an app
// choice on the client (the core rules print no NPC tables, S. 383–391).

export type GeneratorWeapon = {
   name: string
   technique: string
   damage: string
   // Damage bonus: leading attribute(s) and threshold (S. 233), e.g. "GE/KK" 15
   leading: string | null
   threshold: number | null
   attackModifier: number
   parryModifier: number
   reach: 'short' | 'medium' | 'long' | 'ranged'
   range: string | null
   reload: number | null
   shield: boolean
}
export type GeneratorInput = {
   species: string
   attributes: Record<NpcAttributeKey, number>
   techniques: Record<string, number>
   weapons: GeneratorWeapon[]
   armor: string | null
   abilities: string[]
}
export type Part = { label: string; value: number }
export type Derived = {
   maxHealth: number; armor: number; initiativeBase: number; dodge: number; speed: number; defense: null
   attack: number | null; parry: number | null; damage: string; notes: string; sheet: NpcSheet
   breakdown: Record<'maxHealth' | 'soulPower' | 'toughness' | 'dodge' | 'speed' | 'initiativeBase', Part[]>
}

const abbreviations: Record<string, NpcAttributeKey> = { MU: 'courage', KL: 'wisdom', IN: 'intuition', CH: 'charisma', FF: 'fingerDexterity', GE: 'dexterity', KO: 'constitution', KK: 'strength' }
// Level of an owned ability: "Kampfreflexe II" → 2
function abilityLevel(abilities: string[], name: string) {
   const levels = ['I', 'II', 'III']
   return abilities.reduce((best, entry) => {
      const match = new RegExp(`^${name}\\s+(I{1,3})$`).exec(entry.trim())
      return match ? Math.max(best, levels.indexOf(match[1]) + 1) : best
   }, 0)
}
// source: DSA5 Regelwerk, S. 233 (damage bonus: +1 TP per point of the leading attribute above the threshold)
export function damageWithBonus(damage: string, leading: string | null, threshold: number | null, attributes: Record<NpcAttributeKey, number>) {
   if (!leading || threshold === null) return damage
   const values = leading.split('/').map((key) => attributes[abbreviations[key.trim()]]).filter((value) => value !== undefined)
   const bonus = values.length ? Math.max(0, Math.max(...values) - threshold) : 0
   if (!bonus) return damage
   const match = /^(\d+W\d+)\s*([+-]\s*\d+)?$/.exec(damage.replace(/\s/g, ''))
   if (!match) return damage
   const total = Number((match[2] ?? '+0').replace(/\s/g, '')) + bonus
   return `${match[1]}${total > 0 ? `+${total}` : total < 0 ? total : ''}`
}

export function deriveNpc(input: GeneratorInput): Derived {
   const { attributes } = input
   const species = speciesCatalog.find((entry) => entry.key === input.species)
   if (!species) throw new Error('Unknown species')
   // source: DSA5 Regelwerk, S. 32, 246 (armour table; Belastungsgewöhnung: two rows lighter per level for BE, GS, INI)
   const familiarity = abilityLevel(input.abilities, 'Belastungsgewöhnung')
   const index = input.armor ? armorIndex(input.armor) : -1
   const worn = index >= 0 ? armorTable[index] : armorTable[0]
   const effective = index >= 0 ? armorTable[Math.max(0, index - 2 * familiarity)] : armorTable[0]
   const burden = effective.burden
   const extra = effective.extra
   // source: DSA5 Regelwerk, S. 36 (Belastung: AT, defenses, INI and GS −level; ranged attacks are not affected)
   const combat: CombatAttributes = attributes
   const weapons: NpcWeapon[] = input.weapons.map((weapon) => {
      const technique = getCombatTechnique(weapon.technique)
      if (!technique) throw new Error(`Unknown combat technique: ${weapon.technique}`)
      const values = combatTechniqueValues({ key: weapon.technique, value: input.techniques[weapon.technique] ?? 6 }, combat)
      const ranged = weapon.reach === 'ranged'
      // source: DSA5 Regelwerk, S. 233, 236 (a shield's PA bonus counts twice for its own parry)
      const parry = !ranged && values.parry !== null ? values.parry + weapon.parryModifier * (weapon.shield ? 2 : 1) - burden : null
      return {
         name: weapon.name, kind: ranged ? 'ranged' : 'melee',
         attack: Math.max(0, values.attack + (ranged ? 0 : weapon.attackModifier) - (ranged ? 0 : burden)),
         parry: parry === null ? null : Math.max(0, parry),
         damage: damageWithBonus(weapon.damage, weapon.leading, weapon.threshold, attributes),
         reach: weapon.reach === 'ranged' ? null : weapon.reach, range: ranged ? weapon.range : null, reload: ranged ? weapon.reload : null,
         ammo: null, perRound: null,
      }
   })
   const evasion = abilityLevel(input.abilities, 'Verbessertes Ausweichen')
   const reflexes = abilityLevel(input.abilities, 'Kampfreflexe')
   const constitution2 = 2 * attributes.constitution
   const maxHealth = calcBaseAttributes.health(species.health, attributes.constitution, 0, 0)
   const soulPower = calcBaseAttributes.soulPower(species.soulPower, attributes.courage, attributes.wisdom, attributes.intuition, 0)
   const toughness = calcBaseAttributes.toughness(species.toughness, attributes.strength, attributes.constitution, 0)
   const dodgeBase = calcBaseAttributes.dodge(attributes.dexterity, 0)
   // source: DSA5 Regelwerk, S. 56, 248 (INI-Basiswert = (MU + GE) / 2 + Kampfreflexe)
   const iniBase = Math.round((attributes.courage + attributes.dexterity) / 2)
   const sheet: NpcSheet = {
      ...emptySheet(), attributes, soulPower, toughness, burden, armorName: input.armor ?? '', weapons,
      abilities: input.abilities, painThresholds: null,
   }
   return {
      maxHealth, armor: worn.protection,
      initiativeBase: iniBase + reflexes - burden - extra,
      dodge: Math.max(0, dodgeBase - burden + evasion),
      speed: Math.max(0, species.speed - burden - extra),
      defense: null, ...legacyFromWeapons(weapons), notes: '', sheet,
      breakdown: {
         maxHealth: [{ label: input.species, value: species.health }, { label: 'KO × 2', value: constitution2 }],
         soulPower: [{ label: input.species, value: species.soulPower }, { label: '(MU + KL + IN) / 6', value: soulPower - species.soulPower }],
         toughness: [{ label: input.species, value: species.toughness }, { label: '(KO + KO + KK) / 6', value: toughness - species.toughness }],
         dodge: [{ label: 'GE / 2', value: dodgeBase }, { label: 'BE', value: -burden }, { label: 'Verbessertes Ausweichen', value: evasion }].filter((part) => part.value !== 0 || part.label === 'GE / 2'),
         speed: [{ label: input.species, value: species.speed }, { label: 'BE', value: -burden }, { label: worn.names[0], value: -extra }].filter((part) => part.value !== 0 || part.label === input.species),
         initiativeBase: [{ label: '(MU + GE) / 2', value: iniBase }, { label: 'Kampfreflexe', value: reflexes }, { label: 'BE', value: -burden }, { label: worn.names[0], value: -extra }]
            .filter((part) => part.value !== 0 || part.label === '(MU + GE) / 2'),
      },
   }
}
