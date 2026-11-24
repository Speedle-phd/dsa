import { create } from 'zustand'
import { useLanguageStore } from '@/locales/languageStore'
import { translateRuleLabel } from '@/locales/translation'
import { effectBonus, useActiveEffects } from './activeEffectsApi'
import { findProfile, roundSources } from './checkProfiles'
import { useFightStore } from './fightStore'
import type { CheckContext, CheckProfile, Stats, TargetRule } from './statsApi'
import { talentCatalog } from './talentCatalog'

type ContextStore = { entries: Record<string, CheckContext>; set: (key: string, context: CheckContext) => void }
export const emptyContext: CheckContext = { modifier: 0, burden: null, movement: null, pleasing: null, preserveAction: false, preserveActionCheck: false, effects: [] }
// Temporary play-session inputs, shared across tabs; never change the hero's permanent base values.
const useCheckContext = create<ContextStore>((set) => ({
   entries: {}, set: (key, context) => set((state) => ({ entries: { ...state.entries, [key]: context } })),
}))

// 'spell:*' matches every spell check (Artefaktgebunden, Magische Einstimmung/Einschränkung, S. 167, 171, 173).
function matchingEffects(stats: Stats, kind: CheckProfile['kind'], checkKey: string) {
   return stats.checkModifiers.entryEffects.filter((effect) => effect.kind === kind &&
      (!effect.keys?.length || effect.keys.includes(checkKey) || (checkKey.startsWith('spell:') && effect.keys.includes('spell:*'))) &&
      !effect.exceptKeys?.includes(checkKey))
}

// source: DSA5 Regelwerk, S. 35 (Blind: melee attack halved; ranged attacks and defenses succeed only on a rolled 1)
export function applyTargetRule(value: number, rule: TargetRule | null) {
   return rule === 'one' ? Math.min(value, 1) : rule === 'halve' ? Math.ceil(value / 2) : value
}

export type CheckOptions = { burden?: boolean | 'maybe'; complex?: boolean }

// Effective modifiers for one check: rule profile, owned effects and the temporary context.
export function useCheckState(stats: Stats, kind: CheckProfile['kind'], checkKey: string, { burden = false, complex = false }: CheckOptions = {}) {
   const language = useLanguageStore((state) => state.language)
   const key = `${stats.charId}:${kind}:${checkKey}`
   const context = useCheckContext((state) => state.entries[key] ?? emptyContext)
   // source: DSA5 Regelwerk, S. 30 (Zustand ignorieren: 1 Schip, all conditions ignored for one KR)
   const ignoreConditions = useFightStore((state) => {
      const fight = state.fights[stats.charId]
      return fight?.fate?.ignoreConditions !== undefined && fight.fate.ignoreConditions === fight.round
   })
   // Round stances (S. 250) and temporary Schmerz from a Patzer table (S. 231–244) live in the fight.
   const stance = useFightStore((state) => {
      const fight = state.fights[stats.charId]
      return fight?.stance && fight.stance.round === fight.round ? fight.stance.kind : null
   })
   const leader = useFightStore((state) => {
      const fight = state.fights[stats.charId]
      return fight?.leaderRound !== undefined && fight.leaderRound === fight.round
   })
   const tempPain = useFightStore((state) => {
      const fight = state.fights[stats.charId]
      return fight?.tempPainUntil !== undefined && fight.round <= fight.tempPainUntil
   })
   const setContext = useCheckContext((state) => state.set)
   const running = useActiveEffects(stats)
   const effects = matchingEffects(stats, kind, checkKey)
   const activeEffects = effects.filter((effect) => effect.automatic || context.effects.includes(effect.id))
   const options: Array<'burden' | 'movement' | 'pleasing' | 'preserveAction' | 'preserveActionCheck'> = []
   const unresolved: string[] = []
   const combat = kind === 'attack' || kind === 'ranged' || kind === 'defense'
   if (burden === 'maybe') {
      options.push('burden')
      if (context.burden === null && stats.checkModifiers.burden > 0) unresolved.push('Choose whether Belastung applies to this use.')
   }
   if (!combat && (stats.combatConditions.Paralyse ?? 0) > 0) {
      options.push('movement')
      if (context.movement === null) unresolved.push('Choose whether this check requires movement or speech.')
   }
   if (kind === 'talent' && (stats.combatConditions.Entrückung ?? 0) > 0) {
      options.push('pleasing')
      if (context.pleasing === null) unresolved.push('Choose whether this talent is pleasing to the deity.')
   }
   if (stats.pain >= 4 || stats.checkModifiers.effectivePain >= 4) options.push('preserveAction')
   if ((stats.pain >= 4 || stats.checkModifiers.effectivePain >= 4) && kind === 'talent' && checkKey === 'selbstbeherrschung') options.push('preserveActionCheck')
   const profile = findProfile(stats, kind, {
      burden: combat ? kind !== 'ranged' : kind === 'talent' && (burden === 'maybe' ? context.burden === true : burden),
      movement: combat || context.movement === true,
      pleasing: kind === 'talent' && context.pleasing === true, complex })
   // source: DSA5 Regelwerk, S. 219 (Schmerzen unterdrücken: one Schmerz level per QS is ignored for the fight)
   const suppressed = effectBonus(running, 'ignorePain')
   const painLevel = stats.checkModifiers.effectivePain
   const blocked = [...(ignoreConditions ? [] : profile?.blocked ?? ['Modifier data is unavailable.'])]
      .filter((reason) => !(suppressed && painLevel - suppressed.value < 4 && reason.startsWith('Schmerz IV:')))
      .filter((reason) => !((context.preserveAction || (kind === 'talent' && checkKey === 'selbstbeherrschung' && context.preserveActionCheck)) &&
         reason.startsWith('Schmerz IV:')))
   for (const effect of activeEffects) if (effect.blocked) blocked.push(`${translateRuleLabel(effect.label, language)}: ${effect[language]}`)
   // Stance, Patzer Schmerz and Anführer of this KR (shared with the GM overview, checkProfiles.ts)
   const round = roundSources(kind, checkKey, { stance, leader, tempPain, ignoreConditions })
   blocked.push(...round.blocked)
   const fightSources: Array<{ label: string; value: number; page: number }> = [...round.sources]
   // source: DSA5 Regelwerk, S. 273 (Verwandlungselixier: one level of Schmerz while transforming)
   const transition = effectBonus(running, 'transitionPain')
   if (transition && !ignoreConditions) fightSources.push({ label: 'Schmerz (Verwandlung)', value: -transition.value, page: 273 })
   // source: DSA5 Regelwerk, S. 345 (Gulmond: ignore the penalties of two levels of Betäubung; IV still blocks)
   const stupor = effectBonus(running, 'ignoreStupor')
   const stuporPenalty = -(profile?.sources.find((source) => source.label === 'Betäubung')?.value ?? 0)
   if (stupor && stuporPenalty > 0 && !ignoreConditions) {
      const limit = profile?.sources.find((source) => source.label === 'Condition penalty limit')?.value ?? 0
      const offset = Math.max(0, Math.min(stupor.value, stuporPenalty) - limit)
      if (offset) fightSources.push({ label: stupor.label, value: offset, page: stupor.page })
   }
   const painPenalty = -(profile?.sources.find((source) => source.label === 'Schmerz')?.value ?? 0)
   if (suppressed && painPenalty > 0 && !ignoreConditions) {
      const limit = profile?.sources.find((source) => source.label === 'Condition penalty limit')?.value ?? 0
      const offset = Math.max(0, Math.min(suppressed.value, painPenalty) - limit)
      if (offset) fightSources.push({ label: suppressed.label, value: offset, page: suppressed.page })
   }
   // source: DSA5 Regelwerk, S. 216 (Eiserner Wille: all other checks −level while focusing; Selbstbeherrschung keeps the focus)
   const focus = effectBonus(running, 'ironWill')
   if (focus && !(kind === 'talent' && checkKey === 'selbstbeherrschung')) fightSources.push({ label: focus.label, value: -focus.value, page: focus.page })
   // source: DSA5 Regelwerk, S. 284 (Aura verbergen: no spells; Zaubermelodie: spells/rituals +1/+2; Melodie der Kunstfertigkeit: crafts +QS)
   const magical = kind === 'talent' && checkKey.startsWith('spell:')
   if (magical && running.some((effect) => effect.values.blocksSpells)) blocked.push('Aura verbergen: no spells while the aura is hidden (S. 284).')
   const spellSong = magical ? effectBonus(running, 'spellBonus') : null
   if (spellSong) fightSources.push({ label: spellSong.label, value: spellSong.value, page: spellSong.page })
   const craftSong = kind === 'talent' && talentCatalog.some((talent) => talent.key === checkKey && talent.category === 'craft') ? effectBonus(running, 'craftBonus') : null
   if (craftSong) fightSources.push({ label: craftSong.label, value: craftSong.value, page: craftSong.page })
   // source: DSA5 Regelwerk, S. 173 (Lästige Mindergeister: all skill checks −1 while they stay; not a Zustand)
   const spirits = kind === 'talent' ? effectBonus(running, 'checkPenalty') : null
   if (spirits) fightSources.push({ label: spirits.label, value: -spirits.value, page: spirits.page })
   const sources = [...(ignoreConditions ? [] : profile?.sources ?? []), ...fightSources,
      ...activeEffects.filter((effect) => effect.value !== 0).map((effect) => ({ label: effect.label, value: effect.value, page: effect.page })),
      ...(context.modifier ? [{ label: 'Situational modifier', value: context.modifier, page: 0 }] : [])]
   const entryModifier = activeEffects.reduce((sum, effect) => sum + effect.value, 0)
   const total = (ignoreConditions ? 0 : profile?.total ?? 0) + context.modifier + entryModifier +
      fightSources.reduce((sum, source) => sum + source.value, 0)
   const skillPointSources = activeEffects.filter((effect) => effect.skillPoints !== 0)
      .map((effect) => ({ label: effect.label, value: effect.skillPoints, page: effect.page }))
   const skillPoints = skillPointSources.reduce((sum, source) => sum + source.value, 0)
   const rules = activeEffects.flatMap((effect) => effect.targetRule ? [effect.targetRule] : [])
   const targetRule: TargetRule | null = rules.includes('one') ? 'one' : rules.includes('halve') ? 'halve' : null
   return { context, effects, options, unresolved: ignoreConditions ? [] : unresolved, blocked, sources, total, skillPoints, skillPointSources, ignoreConditions, targetRule, activeEffects,
      save: (next: CheckContext) => setContext(key, next) }
}

// Spells share the talent profile: Entrückung covers "Talente und Zauber" (S. 33), Verwirrung III blocks spells (S. 34).
export const useSpellCheck = (stats: Stats, spellKey: string) => useCheckState(stats, 'talent', `spell:${spellKey}`, { complex: true })
