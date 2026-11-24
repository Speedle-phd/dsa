import type { BestiaryCreature } from '@/features/heroes/bestiaryApi'
import type { TalentAttribute } from '@/features/heroes/talentCatalog'
import type { Language } from '@/locales/languageStore'

// Mirrors server/src/utils/npcRules.ts: the full NPC stat block (S. 354; the format of every published adventure)
export type NpcReach = 'short' | 'medium' | 'long'
export type NpcWeapon = {
   name: string
   kind: 'melee' | 'ranged' | 'natural'
   // AT for melee and natural attacks, FK for ranged weapons
   attack: number
   parry: number | null
   damage: string
   reach: NpcReach | null
   range: string | null
   reload: number | null
   ammo: string | null
   perRound: number | null
}
export type NpcSheet = {
   attributes: Record<TalentAttribute, number> | null
   wisdomAnimal: boolean
   mana: number | null
   karma: number | null
   soulPower: number | null
   toughness: number | null
   burden: number
   armorName: string
   weapons: NpcWeapon[]
   actions: number
   abilities: string[]
   traits: string
   talents: Array<{ name: string; value: number }>
   spells: string
   behaviour: string
   flight: string
   fleeAt: number | null
   painThresholds: number[] | null
   size: string
   typus: string
   loot: string
   special: string
   count: string
}
// What the GM edits and saves (the flat values are those of the fight; `health` is set when the NPC joins a fight)
export type NpcDraft = {
   maxHealth: number; armor: number; initiativeBase: number; attack: number | null; parry: number | null
   defense: number | null; dodge: number | null; damage: string; speed: number | null; notes: string
   sheet: NpcSheet | null
}
export type NpcSource = 'manual' | 'import' | 'generator' | 'bestiary'
// What the editor page receives for a new NPC (paste, generator, bestiary, blank)
export type NpcDraftState = { name: string; draft: NpcDraft; source: NpcSource; warnings?: string[] }

export const attributeOrder: TalentAttribute[] = ['courage', 'wisdom', 'intuition', 'charisma', 'fingerDexterity', 'dexterity', 'constitution', 'strength']

export function emptySheet(): NpcSheet {
   return {
      attributes: null, wisdomAnimal: false, mana: null, karma: null, soulPower: null, toughness: null, burden: 0, armorName: '',
      weapons: [], actions: 1, abilities: [], traits: '', talents: [], spells: '', behaviour: '', flight: '', fleeAt: null,
      painThresholds: null, size: '', typus: '', loot: '', special: '', count: '',
   }
}
export function emptyWeapon(kind: NpcWeapon['kind'] = 'melee'): NpcWeapon {
   return { name: '', kind, attack: 10, parry: kind === 'melee' ? 5 : null, damage: '1W6', reach: kind === 'ranged' ? null : 'medium',
      range: kind === 'ranged' ? '10/50/80' : null, reload: kind === 'ranged' ? 1 : null, ammo: null, perRound: null }
}
export function emptyDraft(): NpcDraft {
   return { maxHealth: 30, armor: 0, initiativeBase: 12, attack: null, parry: null, defense: null, dodge: 6, damage: '', speed: 8, notes: '', sheet: emptySheet() }
}

// The NPC's weapons; an NPC from before the stat blocks has one attack (same rule as the server's npcWeapons)
export function draftWeapons(draft: Pick<NpcDraft, 'attack' | 'parry' | 'damage'> & { sheet?: NpcSheet | null }): NpcWeapon[] {
   if (draft.sheet?.weapons.length) return draft.sheet.weapons
   if (draft.attack === null) return []
   return [{ name: 'Attack', kind: 'melee', attack: draft.attack, parry: draft.parry, damage: draft.damage, reach: null, range: null, reload: null, ammo: null, perRound: null }]
}

// Before saving: the flat AT/PA/TP the fight's older parts read come from the first melee (or any) weapon
export function withLegacy(draft: NpcDraft): NpcDraft {
   const weapons = draft.sheet?.weapons ?? []
   const main = weapons.find((weapon) => weapon.kind !== 'ranged') ?? weapons[0]
   return main ? { ...draft, attack: main.attack, parry: main.parry, damage: main.damage } : draft
}

// "kurz"/"short" … as printed in stat blocks and the bestiary
export function toReach(value: string | null | undefined): NpcReach | null {
   const text = (value ?? '').trim().toLowerCase()
   if (/^(kurz|short)/.test(text)) return 'short'
   if (/^(mittel|medium)/.test(text)) return 'medium'
   if (/^(lang|long)/.test(text)) return 'long'
   return null
}

// source: DSA5 Regelwerk, S. 34 (Schmerz I–IV at ≤ ¾, ≤ ½, ≤ ¼ of max LeP and ≤ 5 LeP; same comparison as calcPain)
export const ruleThresholds = (maxHealth: number) => [Math.floor(maxHealth * 3 / 4), Math.floor(maxHealth / 2), Math.floor(maxHealth / 4), 5]

// A bestiary creature as a library NPC: every attack, VW, actions, the printed Schmerz table, behaviour and flight
export function fromBestiary(creature: BestiaryCreature, language: Language): { name: string; draft: NpcDraft } {
   const weapons = creature.attacks.map((attack): NpcWeapon => ({
      name: attack.name, kind: attack.parry == null ? 'natural' : 'melee', attack: attack.attack, parry: attack.parry ?? null, damage: attack.damage,
      reach: toReach(attack.reach), range: null, reload: null, ammo: null, perRound: attack.perRound ?? null,
   }))
   const main = weapons[0]
   return {
      name: creature.key,
      draft: {
         maxHealth: creature.health, armor: creature.armor, initiativeBase: creature.initiative, attack: main?.attack ?? null, parry: main?.parry ?? null,
         defense: creature.defense, dodge: creature.dodge, damage: main?.damage ?? '', speed: Number.parseInt(creature.speed, 10) || null, notes: '',
         sheet: {
            ...emptySheet(), attributes: creature.attributes, wisdomAnimal: creature.animalWisdom, mana: creature.mana,
            soulPower: creature.soulPower, toughness: creature.toughness, weapons, actions: creature.actions,
            abilities: creature.abilities ? creature.abilities.split(/,\s*(?![^()]*\))/).map((entry) => entry.trim()).filter(Boolean) : [],
            traits: creature.traits, talents: creature.talents.filter((talent) => talent.value !== null).map((talent) => ({ name: talent.key, value: talent.value ?? 0 })),
            spells: creature.spells.map((spell) => `${spell.name} ${spell.value}`).join(', '),
            behaviour: creature.behaviour[language], flight: creature.flight[language],
            // [LeP at or below, levels] → one threshold per level; demons and elementals: no Schmerz
            painThresholds: creature.painTable ? creature.painTable.flatMap(([health, levels]) => Array.from({ length: levels }, () => health)) : [],
            size: creature.size, typus: creature.typus, loot: creature.loot?.[language] ?? '',
            special: creature.special.map((rule) => `${rule.name}: ${rule[language]}`).join('\n'), count: creature.count,
         },
      },
   }
}

// Library card: "Säbel 12/7 1W6+3 · Kurzbogen FK 11"
export function weaponSummary(weapons: NpcWeapon[]) {
   return weapons.map((weapon) => weapon.kind === 'ranged' ? `${weapon.name} FK ${weapon.attack}`
      : `${weapon.name} ${weapon.attack}${weapon.parry === null ? '' : `/${weapon.parry}`} ${weapon.damage}`.trim()).join(' · ')
}

// Combat special abilities a GM typically gives an NPC (S. 246–250); suggestions only, any text is allowed
export const abilitySuggestions = [
   'Aufmerksamkeit', 'Belastungsgewöhnung I', 'Beidhändiger Kampf I', 'Entwaffnen', 'Feindgespür', 'Finte I', 'Finte II', 'Finte III', 'Hammerschlag',
   'Kampfreflexe I', 'Kampfreflexe II', 'Präziser Schuss/Wurf I', 'Präziser Schuss/Wurf II', 'Präziser Stich I', 'Präziser Stich II', 'Riposte',
   'Rundumschlag I', 'Schildspalter', 'Schnellladen (Bögen)', 'Schnellladen (Armbrüste)', 'Schnellziehen', 'Sturmangriff', 'Todesstoß',
   'Verbessertes Ausweichen I', 'Verbessertes Ausweichen II', 'Verteidigungshaltung', 'Vorstoß', 'Wuchtschlag I', 'Wuchtschlag II', 'Wuchtschlag III',
   'Zu Fall bringen', 'Flugangriff', 'Verbeißen',
]

// The NPC's Schmerz level (0–4): its printed thresholds, none ([] for demons and elementals) or the S. 34 rule.
// Mirrors server/src/utils/npcRules.ts npcPain.
export function npcPainLevel(health: number, maxHealth: number, thresholds: number[] | null | undefined) {
   if (thresholds && thresholds.length === 0) return 0
   return Math.min(4, (thresholds ?? ruleThresholds(maxHealth)).filter((value) => health <= value).length)
}
