import { resolvePlacement } from './containers'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { encounterKey, getEncounter } from '@/features/encounter/encounterApi'
import { Crosshair, Dices, Eye, Flag, HeartCrack, Minus, Plus, RotateCcw, Shield, SkipForward, Swords } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DieIcon } from '@/components/DieIcon'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { CheckModifierButton } from './CheckValue'
import { applyTargetRule, useCheckState } from './checkState'
import { adjustHealth, spendAmmunition, updateCombatSettings } from './combatApi'
import { armorProtection, combatStoreItems, damageBonus, unarmedWeapon, type StoreWeapon } from './combatGear'
import { activeEffectsKey, updateActiveEffect, useActiveEffects, weaponEffects, type ActiveEffect } from './activeEffectsApi'
import {
   crampedModifier, damagePoints, defenseTarget, formatDamage, hitPoints, improveRoll, parseDamage,
   type CombatOutcome, type D20Roll, type DamageDice,
} from './combatRoll'
import {
   defenseModifiers, isTwoHanded, maneuverDamage, meleeAttackModifiers, nextDefensePenalty, passingStrike, passiveParryBonus,
   rangedAttackModifiers, reloadActions, sourceTotal, twoWeaponPenalty, type Incoming, type RangedSituation, type Reach, type Source,
   canGripTwoHanded, twoHandedGrip as twoHandedGripValues, visionOf, withVision,
} from './combatSituation'
import { rollD20 } from './d20'
import { useFatePoint } from './fate'
import { ConfirmationReroll, FateD20Actions, FateDamageReroll, FateRoundActions, type D20FateUse } from './FateActions'
import { AmbushAction, FleeAction, LeaderBonus, PatzerResolver, StanceActions, type ApplyDamage } from './FightExtras'
import { actionBlocked, actionUse } from './fightActions'
import { FightAllySection } from './FightAllySection'
import { readPatzerTables, rollDamage, useSettings, useSummonFightOver, writePatzerTables } from './fightHelpers'
import { RangedControls, SituationCard, SourceList } from './FightSituation'
import { defensePenaltyOf, rangedOf, situationOf, useFightStore, type Fight } from './fightStore'
import { CastingCard, TurnBar } from './FightTurn'
import { boardRanged, distanceBand } from './boardRanged'
import { useEncounterLink, type EncounterLink, type IncomingAttack } from './encounterLink'
import { fightSpeed } from './energy'
import { useTurnGate } from './turnGate'
import { weaponStatePenalty, weaponUnusable } from './patzerTables'
import type { Stats, TargetRule } from './statsApi'

const attackColor = '#c0392b'
const defenseColor = '#2563eb'
const damageColor = '#b7791f'

type AttackOption = {
   key: string; label: string; technique: string; kind: 'attack' | 'ranged'; base: number; damage: DamageDice | null
   // Eingeengt modifier (S. 36); null = reach or shield size unknown.
   cramped: number | null; reach: Reach | null; shield: boolean; unarmed: boolean; twoHanded: boolean
   // Inventory slot and stored damage (Patzer tables, until repaired)
   slot: { index: number; item: string } | null; condition?: 'damaged' | 'broken'
   range?: string; ammunition?: string; reload: number | null | undefined; oneHanded: boolean
   // Magic weapon, Waffenbalsam and weapon poison notes (S. 270, 274, 342)
   notes: string[]
   // May be held in both hands (S. 366); a Großschild in the other hand costs the main weapon AT −1 (S. 367).
   gripAllowed: boolean; bigShield: boolean
}
type DefenseOption = {
   key: string; label: string; checkKey: string; technique: string; base: number; cramped: number | null; parryModifier: number
   passive: number; shield?: boolean; dodge?: boolean; unarmed?: boolean; oneHanded?: boolean; gripAllowed?: boolean
   slot: { index: number; item: string } | null; condition?: 'damaged' | 'broken'
}
type CombatRoll = D20Roll

const outcomeLabels: Record<CombatOutcome, string> = {
   success: 'Success',
   failure: 'Failed',
   critical: 'Critical success',
   criticalUnconfirmed: 'Critical, not confirmed',
   botch: 'Botch',
   botchAverted: 'Botch averted',
}
const signed = (value: number) => value > 0 ? `+${value}` : `${value}`
const format = (template: string, values: Record<string, string | number>) =>
   template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))
const strongerRule = (a: TargetRule | null, b: TargetRule | null): TargetRule | null =>
   a === 'one' || b === 'one' ? 'one' : a ?? b

// source: DSA5 Regelwerk, S. 374 (Scheiden hold a weapon ready for Schnellziehen)
const sheaths = ['Dolchscheide', 'Schwertscheide']

function gearOptions(stats: Stats, effects: readonly ActiveEffect[]) {
   const attack: AttackOption[] = []
   const defense: DefenseOption[] = []
   const statuses = stats.statuses ?? []
   // Angelegt weapons plus weapons in a worn Dolch-/Schwertscheide (S. 249, 374): the sheathed ones are not held until drawn.
   const equipped = stats.equipment.flatMap((entry, index) => {
      const sheathed = sheaths.includes(entry.carriedOn) && resolvePlacement(entry.carriedOn, stats.equipment) === 'carried'
      if ((entry.carriedOn !== 'Equipped' && !sheathed) || entry.amount <= 0) return []
      const item = combatStoreItems.find((candidate) => candidate.name === entry.item)
      return item?.weapon ? [{ key: `${entry.item}-${index}`, name: entry.item, weapon: item.weapon, shield: item.kind === 'shield',
         slot: { index, item: entry.item }, condition: entry.condition, sheathed }] : []
   })
   const held = equipped.filter((entry) => entry.weapon.reach !== 'ranged' && !entry.sheathed)
      .map((entry) => ({ name: entry.name, technique: entry.weapon.combatTechnique, parryModifier: entry.weapon.parryModifier, shield: entry.shield }))
   // source: DSA5 Regelwerk, S. 247 (Einhändiger Kampf: only one weapon, no shield, Parierwaffe or second weapon)
   const single = held.length === 1 && ['Fechtwaffen', 'Schwerter'].includes(held[0].technique) && stats.combatSpecialAbilities.includes('Einhändiger Kampf')
   const add = (key: string, label: string, weapon: StoreWeapon, shield: boolean, unarmed = false,
      slot: AttackOption['slot'] = null, condition?: AttackOption['condition'], sheathed = false) => {
      const values = stats.combatValues.find((value) => value.key === weapon.combatTechnique)
      if (!values) return
      const ranged = weapon.reach === 'ranged'
      const cramped = statuses.includes('Eingeengt') ? crampedModifier(label, weapon.reach, shield) : { attack: 0, parry: 0 }
      // source: DSA5 Regelwerk, S. 35 (Blutrausch: +2 TP)
      const rage = statuses.includes('Blutrausch') && !ranged ? 2 : 0
      // source: DSA5 Regelwerk, S. 274 (Waffenbalsam from QS 3: +1 TP), S. 270 (artifact weapons count as magical)
      const balm = unarmed ? { damageBonus: 0, magical: false, poisoned: [] } : weaponEffects(effects, label)
      const parsed = parseDamage(weapon.damage, (damageBonus(weapon, stats) ?? 0) + rage + balm.damageBonus)
      const notes = [
         ...(sheathed ? [stats.combatSpecialAbilities.includes('Schnellziehen') ? 'In the sheath: draw it with a free action (Schnellziehen, S. 249).'
            : 'In the sheath: drawing it takes one action (S. 249).'] : []),
         ...(balm.damageBonus ? [`Waffenbalsam +${balm.damageBonus} TP`] : []),
         ...(balm.magical || combatStoreItems.find((item) => item.name === label)?.magical ? ['magical weapon'] : []),
         ...balm.poisoned.map((poison) => `poisoned: ${poison}`),
      ]
      const oneHanded = single && !unarmed && !shield && !ranged
      const gripAllowed = canGripTwoHanded({ technique: weapon.combatTechnique, ranged, shield, unarmed, twoHanded: isTwoHanded(label) }, held.length)
      // source: DSA5 Regelwerk, S. 367 (Großschild: additionally −1 AT on the main weapon)
      const bigShield = !shield && !ranged && !unarmed && held.some((item) => item.shield && item.name === 'Großschild')
      attack.push({ key, label, technique: weapon.combatTechnique, kind: ranged ? 'ranged' : 'attack',
         base: values.attack + (ranged ? 0 : weapon.attackModifier ?? 0), damage: parsed, cramped: cramped?.attack ?? null,
         reach: ranged ? null : weapon.reach as Reach, shield, unarmed, twoHanded: isTwoHanded(label),
         range: weapon.range, ammunition: weapon.ammunition, oneHanded, slot, condition, notes, gripAllowed, bigShield,
         reload: ranged ? reloadActions(weapon.reloadActions, weapon.combatTechnique, stats.combatSpecialAbilities) : undefined })
      if (!ranged && weapon.canParry !== false && values.parry != null) {
         // source: DSA5 Regelwerk, S. 233, 236 (active shield parry: twice the PA bonus; a second shield/Parierwaffe adds its passive bonus)
         const passive = shield || unarmed ? 0 : passiveParryBonus({ name: label, technique: weapon.combatTechnique, shield }, held, stats.combatSpecialAbilities)
         defense.push({ key, label, checkKey: weapon.combatTechnique, technique: weapon.combatTechnique,
            base: values.parry + (weapon.parryModifier ?? 0) * (shield ? 2 : 1) + passive, passive, parryModifier: weapon.parryModifier ?? 0,
            cramped: cramped?.parry ?? null, shield, unarmed, oneHanded, slot, condition, gripAllowed })
      }
   }
   for (const entry of equipped) add(entry.key, entry.name, entry.weapon, entry.shield, false, entry.slot, entry.condition, entry.sheathed)
   add('unarmed', 'Unarmed', unarmedWeapon, false, true)
   // source: DSA5 Regelwerk, S. 277 (Flammenschwert: Langschwert values with 1W6+7 TP, a magical weapon; 1 AsP per KR, 2 when flying;
   // a botch turns it back into the staff)
   const sword = stats.magicSettings?.staffActive === 'Flammenschwert' ? combatStoreItems.find((item) => item.name === 'Langschwert')?.weapon : undefined
   if (sword) {
      add('flame-sword', 'Flammenschwert', { ...sword, damage: '1W6+7' }, false)
      attack.find((option) => option.key === 'flame-sword')?.notes.push('magical weapon', 'Flammenschwert: 1 AsP per KR (2 when flying); a botch turns it back into the staff (S. 277).')
   }
   defense.push({ key: 'dodge', label: 'Dodge', checkKey: 'AW', technique: 'AW', base: stats.dodge.max, cramped: 0, parryModifier: 0, passive: 0, dodge: true, slot: null })
   return { attack, defense, crossBlock: stats.combatSpecialAbilities.includes('Kreuzblock') && held.length >= 2 }
}

// source: DSA5 Regelwerk, S. 238 (no two-handed weapons; Kettenwaffen only together with a shield)
function canPair(main: AttackOption, other: AttackOption) {
   if (main.kind !== 'attack' || other.kind !== 'attack' || main.key === other.key || main.unarmed || other.unarmed) return false
   if (main.twoHanded || other.twoHanded) return false
   if ((main.technique === 'Kettenwaffen' && !other.shield) || (other.technique === 'Kettenwaffen' && !main.shield)) return false
   return true
}

// source: DSA5 Regelwerk, S. 366 (switching the grip costs no action, on the hero's own turn, at most once per KR)
function GripToggle({ heroId, fight, option }: { heroId: string; fight: Fight; option: AttackOption }) {
   const language = useLanguageStore((state) => state.language)
   const active = fight.grip?.key === option.key
   const switched = fight.grip?.changedRound === fight.round
   return <label className='regen-toggle'>
      <input type='checkbox' checked={active} disabled={switched}
         onChange={(event) => useFightStore.getState().update(heroId, { grip: { key: event.target.checked ? option.key : null, changedRound: fight.round } })} />
      <span><strong>{t('Two-handed grip', language)}</strong>
         <small>{t(switched ? 'Grip already switched this round; switch again next round (S. 366).' : '+1 TP, PA −1; switch on your turn, once per round (S. 366).', language)}</small></span>
   </label>
}

// source: DSA5 Regelwerk, S. 30 (Schip: +4 to all defenses until the end of the KR)
const fateDefenseBonus = (fight?: Fight) => fight?.fate?.defense !== undefined && fight.fate.defense === fight.round ? 4 : 0

// source: DSA5 Regelwerk, S. 36 (Überrascht: no defense against the surprise action)
const surprisedReason = 'Überrascht: no defense against the surprise action.'

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
   const clamp = (next: number) => Math.max(min, Math.min(max, Math.trunc(next) || 0))
   return <div className='dice-count-control'>
      <button className='icon-button' type='button' aria-label={`${label} −1`} disabled={value <= min} onClick={() => onChange(clamp(value - 1))}><Minus size={16} /></button>
      <input type='number' inputMode='numeric' min={min} max={max} value={value} aria-label={label}
         onFocus={(event) => event.target.select()} onChange={(event) => onChange(clamp(event.target.valueAsNumber))} />
      <button className='icon-button' type='button' aria-label={`${label} +1`} disabled={value >= max} onClick={() => onChange(clamp(value + 1))}><Plus size={16} /></button>
   </div>
}

function RollResult({ result, label }: { result: CombatRoll; label: string }) {
   const language = useLanguageStore((state) => state.language)
   return <div className={`fight-roll ${result.success ? 'is-success' : 'is-failure'}`} aria-live='polite'>
      <span className={`fight-die${result.roll === 1 ? ' is-one' : result.roll === 20 ? ' is-twenty' : ''}`}>{result.roll}</span>
      <span>
         <strong>{label}: {t(outcomeLabels[result.outcome], language)}</strong>
         <small>{t('Target', language)} {result.target}
            {result.confirmation !== undefined && ` · ${t('Confirmation roll', language)} ${result.confirmation}`}</small>
      </span>
   </div>
}

const maneuverGroups = ['basic', 'special']

// Everything that changes an attack target besides the hero's rule profile: situation, weapon state, two weapons …
function useAttack(stats: Stats, fight: Fight, option: AttackOption, { passing = false, offHand = false, dual = false, board = {} as Partial<RangedSituation> } = {}) {
   const check = useCheckState(stats, option.kind, option.technique)
   const situation = withVision(situationOf(fight), visionOf(stats.advantages, stats.disadvantages))
   const rangedMods = option.kind === 'ranged' ? rangedAttackModifiers({ ...rangedOf(fight), ...board }, situation) : null
   const mods = rangedMods ?? meleeAttackModifiers(situation, option.reach)
   const weapon = fight.weapons?.[option.key]
   // source: DSA5 Regelwerk, S. 237 (a Passierschlag cannot be combined with combat maneuvers)
   const maneuvers = check.activeEffects.filter((effect) => effect.group && maneuverGroups.includes(effect.group))
   const sources: Source[] = [...mods.sources]
   if (option.cramped) sources.push({ label: 'Eingeengt', value: option.cramped, page: 36 })
   if (passing) {
      sources.push(passingStrike)
      const removed = maneuvers.reduce((sum, effect) => sum + effect.value, 0)
      if (removed) sources.push({ label: 'No maneuvers in a Passierschlag', value: -removed, page: 237 })
   }
   if (dual) sources.push({ label: offHand ? 'Two weapons, off hand' : 'Two weapons', value: twoWeaponPenalty(stats.combatSpecialAbilities, stats.advantages.includes('Beidhändig'), offHand, option.technique), page: 238 })
   const damaged = weaponStatePenalty(option.condition ?? weapon?.state, option.kind === 'ranged')
   if (damaged) sources.push({ label: 'Damaged weapon', value: damaged, page: option.kind === 'ranged' ? 243 : 231 })
   if (fight.nextActionPenalty) sources.push({ label: 'Stumbled (Patzer)', value: fight.nextActionPenalty, page: 231 })
   // A ticked Einhändiger Kampf effect already adds AT +1 via the check; its TP +1 still goes into the damage roll (S. 247).
   const manualOneHanded = check.activeEffects.some((effect) => effect.label === 'Einhändiger Kampf')
   const oneHanded = option.oneHanded && !manualOneHanded
   if (oneHanded) sources.push({ label: 'Einhändiger Kampf', value: 1, page: 247 })
   if (option.bigShield) sources.push({ label: 'Großschild', value: -1, page: 367 })
   const blocked = [...check.blocked, ...check.unresolved, ...mods.blocked,
      ...(option.cramped === null ? ['Eingeengt: weapon reach or shield size unknown; enter the modifier by hand.'] : []),
      ...(option.condition === 'broken' ? ['This weapon is broken: repair it in the equipment tab.'] : []),
      ...(weaponUnusable(weapon?.state) &&!(weapon?.state === 'jammed' && weapon.until !== undefined && fight.round > weapon.until)
         ? ['This weapon is not usable after a Patzer.'] : [])]
   const twoHandedGrip = option.gripAllowed && fight.grip?.key === option.key
   return { check, sources, maneuvers: passing ? [] : maneuvers, oneHanded: oneHanded || manualOneHanded, twoHandedGrip, blocked,
      value: option.base + check.total + sourceTotal(sources), rule: strongerRule(check.targetRule, mods.rule), tp: rangedMods?.tp ?? 0 }
}

function OptionChip({ stats, fight, option, active, onSelect }: { stats: Stats; fight: Fight; option: AttackOption; active: boolean; onSelect: () => void }) {
   const language = useLanguageStore((state) => state.language)
   const attack = useAttack(stats, fight, option)
   return <button type='button' aria-pressed={active} className={`probe-chip fight-option${active ? ' is-active' : ''}`} onClick={onSelect}
      title={attack.blocked.length ? attack.blocked.map((reason) => t(reason, language)).join(' · ') : undefined}>
      <strong>{attack.blocked.length ? '—' : applyTargetRule(attack.value, attack.rule)}</strong>
      <small>{t(option.label, language)}</small>
   </button>
}

function AttackCard({ stats, heroId, fight, option, offHand = false, dual = false, speed, applyDamage, pending, forcePassing = false }: {
   stats: Stats; heroId: string; fight: Fight; option: AttackOption; offHand?: boolean; dual?: boolean; speed: number | null
   applyDamage: ApplyDamage; pending: boolean; forcePassing?: boolean
}) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const { log, update, spend } = useFightStore.getState()
   const gate = useTurnGate(heroId, fight)
   const [chosenPassing, setPassing] = useState(forcePassing)
   const passing = forcePassing || chosenPassing
   // Shared party fight: the opponent this attack goes to; each roll can be sent once
   const link = useEncounterLink()
   const [targetId, setTargetId] = useState('')
   const ranged = option.kind === 'ranged'
   // Melee only against opponents in reach on the board (neighbours; Reichweite lang 2 squares, house rule); ranged at any opponent
   const reachable = link ? link.targets.filter((entry) => (!passing || link.passingTargets.includes(entry.id)) &&
      (ranged ? entry.distance !== null : entry.distance !== null && entry.distance >= 1 && entry.distance <= (option.reach === 'long' ? 2 : 1))) : []
   const encounterTarget = reachable.find((entry) => entry.id === targetId) ?? reachable[0] ?? null
   // The board suggests distance, movement and "into melee" (S. 241–242); the player may change them for this attack
   const [override, setOverride] = useState<Partial<RangedSituation>>({})
   const suggested = link && ranged && encounterTarget ? boardRanged(encounterTarget, link.self, option.range) : undefined
   const board = suggested ? { ...suggested, ...override } : undefined
   const attack = useAttack(stats, fight, option, { passing, offHand, dual, board })
   const [modifier, setModifier] = useState(0)
   const [rolling, setRolling] = useState(false)
   const [result, setResult] = useState<CombatRoll | null>(null)
   const [damage, setDamage] = useState<{ rolls: number[]; tp: number; dice: DamageDice } | null>(null)
   const [fateUsed, setFateUsed] = useState<D20FateUse | null>(null)
   const [damageRerolled, setDamageRerolled] = useState(false)
   const [rollCount, setRollCount] = useState(0)
   const [sent, setSent] = useState(false)
   // source: DSA5 Regelwerk, S. 241 (no shooting in melee; beyond the maximum range only unaimed area shots)
   const beyond = link && ranged && encounterTarget?.paces != null && distanceBand(option.range, encounterTarget.paces) === 'beyond'
   const targetReason = !link ? null
      : ranged ? (link.self.engaged ? 'In melee: no ranged attacks (S. 241).' : !reachable.length ? (link.onBoard ? 'No opponent on the board.' : 'Place your token on the board to attack.')
         : beyond ? 'Out of range: beyond the maximum only unaimed area shots (S. 241). Ask the GM.' : null)
      : reachable.length ? null
      : !link.onBoard ? 'Place your token on the board to attack in melee.'
      : option.reach === 'long' ? 'Stand at most 2 squares from an opponent (long weapon, house rule).' : 'Stand next to an opponent on the board to attack in melee (diagonals count).'
   const target = applyTargetRule(attack.value + modifier, attack.rule)
   const label = t(ranged ? 'FK' : 'AT', language)
   const weapon = fight.weapons?.[option.key]
   const ammo = option.ammunition ? stats.equipment.filter((entry) => entry.item === option.ammunition && resolvePlacement(entry.carriedOn, stats.equipment) === 'carried')
      .reduce((sum, entry) => sum + entry.amount, 0) : null
   const needsLoad = ranged && typeof option.reload === 'number' && !weapon?.loaded
   // source: DSA5 Regelwerk, S. 228 (an attack is the action; both attacks of a two-weapon attack share it, S. 238; a Passierschlag needs none, S. 237)
   const use = actionUse(fight.turn, fight.round)
   const usesAction = !passing && !offHand
   const actionReason = link ? (passing ? link.passingReason : offHand ? (link.dualOpen ? null : 'Strike with the first weapon first (S. 238).') : link.actionReason)
      : usesAction ? actionBlocked(use, 'action', fight.casting) : null
   // source: DSA5 Regelwerk, S. 245 (each reload step is an action; a reload time of 0 needs a free action)
   const loadReason = needsLoad ? gate.reason(option.reload === 0 ? 'free' : 'action') : null
   const unconfirmed = Boolean(link && result && !sent)
   const blocked = [...attack.blocked, ...(actionReason ? [actionReason] : []), ...(targetReason ? [targetReason] : []),
      ...(unconfirmed ? ['Confirm the roll first.'] : []),
      ...(target <= 0 ? ['Effective target ≤ 0: no check possible.'] : []),
      ...(ammo === 0 ? ['No ammunition carried.'] : []),
      ...(needsLoad ? ['Load the weapon first.'] : []),
      ...(offHand && fight.dualBotchRound === fight.round ? ['A botch on the first attack ends the two-weapon attack.'] : [])]
   // source: DSA5 Regelwerk, S. 245 (Fernkampf TP by distance), S. 247–250 (maneuver TP)
   const extra = maneuverDamage(attack.maneuvers, speed ?? 0)
   const dice: DamageDice | null = extra.replace ? { count: 1, sides: 3, bonus: 0 }
      : option.damage && { ...option.damage, count: option.damage.count + (option.damage.sides === 6 ? extra.dice : 0),
         bonus: option.damage.bonus + extra.bonus + (ranged ? attack.tp : 0) + (attack.oneHanded ? 1 : 0) +
            (attack.twoHandedGrip ? twoHandedGripValues.damage : 0) }
   const ammoMutation = useMutation({
      mutationFn: () => spendAmmunition(stats._id, option.ammunition!),
      onSuccess: (next) => queryClient.setQueryData(['stats', stats.charId], next),
   })

   async function rollAttack() {
      if (option.ammunition) {
         try {
            await ammoMutation.mutateAsync()
         } catch (error) {
            toast.error(getErrorMessage(error))
            return
         }
      }
      if (usesAction) spend(heroId, 'action')
      setRolling(true)
      setDamage(null)
      setFateUsed(null)
      setDamageRerolled(false)
      setSent(false)
      // source: DSA5 Regelwerk, S. 235 (Kettenwaffen botch from 19), S. 237 (Passierschlag: no crit or botch)
      const next = await rollD20(attackColor, target, { botchFrom: option.technique === 'Kettenwaffen' ? 19 : 20, noCritical: passing })
      setRolling(false)
      setResult(next)
      setRollCount((count) => count + 1)
      update(heroId, {
         nextActionPenalty: undefined, noDefenseUntilAction: undefined,
         ...(dual ? { dualRound: fight.round, ...(!offHand && next.outcome === 'botch' ? { dualBotchRound: fight.round } : {}) } : {}),
         ...(ranged && typeof option.reload === 'number' ? { weapons: { ...fight.weapons, [option.key]: { ...weapon, loaded: false, progress: 0 } } } : {}),
      })
      log(heroId, '{weapon} {label}: W20 {roll} vs {target} → {outcome}', {
         weapon: option.label, label: passing ? `${label} (Passierschlag)` : label,
         roll: next.confirmation === undefined ? next.roll : `${next.roll}/${next.confirmation}`, target, outcome: outcomeLabels[next.outcome],
      })
   }

   // Party fight (user decision, Nov 2026): the player confirms each roll before it goes out (Schips and Waffenbegabung first)
   const strike: 'first' | 'second' | null = offHand ? 'second' : dual ? 'first' : null
   function afterSend() {
      setSent(true)
      // source: DSA5 Regelwerk, S. 242 (aiming counts for the next shot only)
      if (ranged && rangedOf(fight).aim > 0) update(heroId, { ranged: { ...rangedOf(fight), aim: 0 } })
   }

   // source: DSA5 Regelwerk, S. 30 (Neuer Wurf is binding; same target), S. 220–222 ("… verbessern")
   async function useFate(use: D20FateUse) {
      if (!result) return
      setFateUsed(use)
      setDamage(null)
      if (use === 'improve') {
         const improved = improveRoll(result)
         if (improved) setResult(improved)
         log(heroId, 'Schip: {label} improved by 2 → {outcome}', { label, outcome: outcomeLabels.success })
         return
      }
      setRolling(true)
      const next = await rollD20(attackColor, result.target, { botchFrom: option.technique === 'Kettenwaffen' ? 19 : 20, noCritical: passing })
      setRolling(false)
      setResult(next)
      setRollCount((count) => count + 1)
      log(heroId, 'Schip: {label} rerolled · W20 {roll} vs {target} → {outcome}', {
         label, roll: next.confirmation === undefined ? next.roll : `${next.roll}/${next.confirmation}`, target: next.target, outcome: outcomeLabels[next.outcome],
      })
   }

   async function rerollDamageDie(index: number) {
      if (!damage || !result) return
      setRolling(true)
      const [value] = await rollDamage({ ...damage.dice, count: 1 })
      setRolling(false)
      const rolls = damage.rolls.map((roll, slot) => slot === index ? value : roll)
      const tp = hitPoints(rolls, damage.dice, result.outcome === 'critical')
      setDamage({ ...damage, rolls, tp })
      setDamageRerolled(true)
      log(heroId, 'Schip: damage die rerolled {old} → {new} · {tp} TP', { old: damage.rolls[index], new: value, tp })
   }

   async function roll(hit = result) {
      if (!dice || !hit) return null
      setRolling(true)
      const rolls = await rollDamage(dice, damageColor)
      setRolling(false)
      const critical = hit.outcome === 'critical'
      const tp = hitPoints(rolls, dice, critical)
      setDamage({ rolls, tp, dice })
      log(heroId, '{weapon} damage: {tp} TP ({dice}: {rolls}){critical}', {
         weapon: option.label, tp, dice: formatDamage(dice), rolls: rolls.join('+'), critical: critical ? ' ×2' : '',
      })
      return tp
   }

   // source: DSA5 Regelwerk, S. 245 (Ladezeit; 0 actions = 1 free action; reloading is a longer action)
   async function load() {
      if (!await gate.spend(option.reload === 0 ? 'free' : 'action', 'Loading', option.label)) return
      const progress = (weapon?.progress ?? 0) + 1
      const ready = typeof option.reload === 'number' && progress >= option.reload
      update(heroId, { weapons: { ...fight.weapons, [option.key]: { ...weapon, progress: ready ? 0 : progress, loaded: ready } } })
      log(heroId, ready ? '{weapon} loaded' : '{weapon} loading {progress}/{total}', { weapon: option.label, progress, total: option.reload ?? 0 })
   }

   const finte = attack.maneuvers.find((effect) => effect.label.startsWith('Finte'))
   const risky = attack.maneuvers.find((effect) => /^(Hammerschlag|Todesstoß|Sturmangriff)/.test(effect.label))
   const knockdown = attack.maneuvers.find((effect) => /^(Zu Fall bringen|Wurf|Entwaffnen)/.test(effect.label))

   return <div className='fight-card'>
      <h4><Swords size={16} />{t(forcePassing ? 'Passierschlag' : offHand ? 'Second weapon' : 'Your action', language)}{dual && <small> · {t(option.label, language)}</small>}</h4>
      <p className='fight-values'>
         <span>{label} <strong>{target}</strong><small> ({option.base}{attack.check.total !== 0 && ` ${signed(attack.check.total)}`}
            {sourceTotal(attack.sources) !== 0 && ` ${signed(sourceTotal(attack.sources))}`}{modifier !== 0 && ` ${signed(modifier)}`}
            {attack.rule && ` · ${t(attack.rule === 'one' ? 'only a rolled 1 succeeds' : 'halved', language)}`})</small></span>
         <span>{t('TP', language)} <strong>{dice ? formatDamage(dice) : '—'}</strong>{extra.labels.length > 0 && <small> · {extra.labels.join(', ')}</small>}</span>
         <CheckModifierButton check={attack.check} label={`${t(option.label, language)} ${label}`} />
      </p>
      <SourceList sources={attack.sources} />
      {option.notes.length > 0 && <p className='fight-note'>{option.notes.map((note) => note.startsWith('poisoned: ')
         ? `${t('poisoned', language)}: ${t(note.slice('poisoned: '.length), language)}` : t(note, language)).join(' · ')}</p>}
      {ranged && <RangedControls heroId={heroId} fight={fight} range={option.range} board={suggested} override={override} onOverride={setOverride} />}
      {option.gripAllowed && !offHand && <GripToggle heroId={heroId} fight={fight} option={option} />}
      {!ranged && !forcePassing && !offHand && !link && <label className='regen-toggle'>
         <input type='checkbox' checked={passing} onChange={(event) => setPassing(event.target.checked)} />
         <span><strong>{t('Passierschlag', language)}</strong><small>{t('AT −4, no action, no defense, no maneuvers, no crit or botch (S. 237).', language)}</small></span>
      </label>}
      <div className='fight-modifier'>
         <span>{t('Situational modifier', language)}</span>
         <Stepper label={t('Situational modifier', language)} value={modifier} min={-20} max={20} onChange={setModifier} />
      </div>
      {ranged && <p className='fight-note'>
         {ammo !== null && `${t(option.ammunition!, language)}: ${ammo} · `}
         {typeof option.reload === 'number' ? (weapon?.loaded ? t('Loaded', language)
            : `${t('Reload', language)}: ${option.reload === 0 ? t('1 free action', language) : `${weapon?.progress ?? 0}/${option.reload} ${t('actions', language)}`}`)
            : option.reload === null ? t('Reload time varies: track it by hand (S. 372).', language) : ''}
      </p>}
      {needsLoad && <div className='fight-followup'>
         <button className='quiet-button' type='button' disabled={loadReason !== null} title={loadReason ? t(loadReason, language) : undefined} onClick={() => void load()}><RotateCcw size={16} />{t(option.reload === 0 ? 'Load (free action)' : 'Load (1 action)', language)}</button>
         <button className='quiet-button' type='button' onClick={() => update(heroId, { weapons: { ...fight.weapons, [option.key]: { ...weapon, loaded: true, progress: 0 } } })}>{t('Already loaded', language)}</button>
         {loadReason && <small>{t(loadReason, language)}</small>}
      </div>}
      {link && <label className='field-group fight-situation-field'>
         <span>{t('Target', language)}</span>
         {reachable.length ? <select value={encounterTarget?.id ?? ''} onChange={(event) => { setTargetId(event.target.value); setOverride({}) }}>
            {reachable.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}{entry.paces !== null && ` · ${entry.paces} ${t('paces', language)}`}</option>)}
         </select> : <small>{t(link.targets.length ? 'No opponent in reach.' : 'No opponent on the field.', language)}</small>}
      </label>}
      {blocked.length > 0 && <ul className='field-error probe-blocked'>{blocked.map((reason) => <li key={reason}>{t(reason, language)}</li>)}</ul>}
      <button className='primary-button' type='button' disabled={rolling || ammoMutation.isPending || blocked.length > 0} onClick={() => void rollAttack()}>
         <Crosshair size={16} />{t(ranged ? 'Roll ranged attack' : passing ? 'Roll Passierschlag' : 'Roll attack', language)}
      </button>
      {rolling && <p className='probe-rolling'>{t('Rolling…', language)}</p>}
      {result && !rolling && <RollResult result={result} label={label} />}
      {result && !rolling && !passing && <FateD20Actions stats={stats} result={result} used={fateUsed} onUse={useFate}
         improveAbility={ranged ? 'Fernkampf verbessern' : 'Attacke verbessern'} />}
      {result && !rolling && !sent && <ConfirmationReroll check={attack.check} result={result} color={attackColor}
         rules={{ botchFrom: option.technique === 'Kettenwaffen' ? 19 : 20, noCritical: passing }}
         onReroll={(next) => {
            setResult(next)
            setDamage(null)
            log(heroId, '{label}: Waffenbegabung · confirmation roll {roll} → {outcome}', { label, roll: next.confirmation ?? '', outcome: outcomeLabels[next.outcome] })
         }} />}
      {result && !rolling && (result.outcome === 'critical' || result.outcome === 'criticalUnconfirmed') &&
         <p className='fight-note'>{t(result.outcome === 'critical' ? 'The enemy\'s defense is halved and TP are doubled.' : 'The enemy\'s defense is halved.', language)}</p>}
      {result?.success && !rolling && finte && <p className='fight-note'>{t('Finte: the enemy\'s defense is {value} harder (S. 247).', language).replace('{value}', () => String(-2 * finte.value))}</p>}
      {result?.success && !rolling && knockdown && <p className='fight-note'>{t(knockdown.label.startsWith('Entwaffnen')
         ? 'If the defense fails, the enemy drops the weapon (S. 247).' : 'If the defense fails, the enemy falls: Liegend (S. 250).', language)}</p>}
      {result && !result.success && !rolling && risky && <p className='fight-note fight-danger'>{t('Failed maneuver: the defender gets a Passierschlag (S. 248–250).', language)}</p>}
      {result && !result.success && !rolling && ranged && fight.ranged?.intoMelee && <p className='fight-note'>{t('Missed into the melee: nobody is hit (S. 242).', language)}</p>}
      {result?.success && !rolling && !link && <div className='fight-followup'>
         <p className='fight-note'>{t('If the enemy fails to defend, roll damage.', language)}</p>
         {<button className='quiet-button' type='button' disabled={!dice || damage !== null} onClick={() => void roll()}>
            <Dices size={16} />{t('Roll damage', language)}
         </button>}
         {damage && <p className='fight-damage'><strong>{damage.tp} {t('TP', language)}</strong>
            <small>{damage.rolls.join(' + ')} {signed(damage.dice.bonus)}{result.outcome === 'critical' && ' × 2'}</small></p>}
         {damage && damage.dice.sides === 6 && !link && <FateDamageReroll stats={stats} rolls={damage.rolls} sides={6} used={damageRerolled} onReroll={rerollDamageDie} />}
      </div>}
      {link && result && !rolling && encounterTarget && <EncounterAttackSend key={rollCount} link={link} target={encounterTarget} weapon={option.label}
         incoming={incomingOf(option)} reach={option.reach} passing={passing} dual={passing ? null : strike} result={result} dice={dice} sent={sent} onSent={afterSend} />}
      {result?.outcome === 'botch' && !rolling && <PatzerResolver stats={stats} heroId={heroId} fight={fight} table={ranged ? 'ranged' : 'melee'}
         unarmed={option.unarmed} dodge={false} weaponKey={option.unarmed ? null : option.key} slot={option.slot} weaponDamage={option.damage} applyDamage={applyDamage} disabled={pending} />}
   </div>
}

function DefenseChip({ stats, fight, option, incoming, active, crossBlock, onSelect }: {
   stats: Stats; fight: Fight; option: DefenseOption; incoming: Incoming; active: boolean; crossBlock: boolean; onSelect: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const defense = useDefense(stats, fight, option, { incoming, fromBehind: false, crossBlock, riposte: false })
   const target = applyTargetRule(defenseTarget(defense.value, defensePenaltyOf(fight), false), defense.rule)
   return <button type='button' aria-pressed={active} className={`probe-chip fight-option${active ? ' is-active' : ''}`} onClick={onSelect}
      title={defense.blocked.length ? defense.blocked.map((reason) => t(reason, language)).join(' · ') : undefined}>
      <strong>{defense.blocked.length ? '—' : target}</strong>
      <small>{t(option.label, language)}</small>
   </button>
}

function useDefense(stats: Stats, fight: Fight, option: DefenseOption, context: { incoming: Incoming; fromBehind: boolean; crossBlock: boolean; riposte: boolean }) {
   const check = useCheckState(stats, 'defense', option.checkKey)
   const mods = defenseModifiers(withVision(situationOf(fight), visionOf(stats.advantages, stats.disadvantages)), option, context)
   const sources: Source[] = [...mods.sources]
   if (option.cramped) sources.push({ label: 'Eingeengt', value: option.cramped, page: 36 })
   if (option.passive) sources.push({ label: 'Passive parry bonus', value: 0, page: 233 })
   const bonus = fateDefenseBonus(fight)
   if (bonus) sources.push({ label: 'Schip: Verteidigung', value: bonus, page: 30 })
   // source: DSA5 Regelwerk, S. 249 (Riposte: parry −2)
   if (context.riposte) sources.push({ label: 'Riposte', value: -2, page: 249 })
   // source: DSA5 Regelwerk, S. 238 (two-weapon attack: defenses −2 this KR, not with a shield)
   if (fight.dualRound === fight.round && !option.shield) sources.push({ label: 'Two-weapon attack this round',
      value: twoWeaponPenalty(stats.combatSpecialAbilities, stats.advantages.includes('Beidhändig'), false), page: 238 })
   const weapon = fight.weapons?.[option.key]
   const damaged = weaponStatePenalty(option.condition ?? weapon?.state, false)
   if (damaged) sources.push({ label: 'Damaged weapon', value: damaged, page: 234 })
   if (fight.nextActionPenalty) sources.push({ label: 'Stumbled (Patzer)', value: fight.nextActionPenalty, page: 231 })
   const oneHanded = option.oneHanded && !check.activeEffects.some((effect) => effect.label === 'Einhändiger Kampf')
   if (oneHanded) sources.push({ label: 'Einhändiger Kampf', value: 1, page: 247 })
   if (option.gripAllowed && fight.grip?.key === option.key) sources.push({ label: 'Two-handed grip', value: twoHandedGripValues.parry, page: 366 })
   const blocked = [...check.blocked, ...check.unresolved, ...mods.blocked,
      ...(option.cramped === null ? ['Eingeengt: weapon reach or shield size unknown; enter the modifier by hand.'] : []),
      ...(option.condition === 'broken' ? ['This weapon is broken: repair it in the equipment tab.'] : []),
      ...(weaponUnusable(weapon?.state) ? ['This weapon is not usable after a Patzer.'] : []),
      ...((stats.statuses ?? []).includes('Überrascht') ? [surprisedReason] : []),
      ...(fight.noDefenseRound === fight.round ? ['Riposte: no further defenses this round.'] : []),
      ...(fight.noDefenseUntilAction ? ['Too focused (Patzer): no defense until your next action.'] : [])]
   return { check, sources: sources.filter((source) => source.value !== 0 || source.label === 'Passive parry bonus'), blocked,
      value: option.base + check.total + sourceTotal(sources), rule: strongerRule(check.targetRule, mods.rule) }
}

function DefenseCard({ stats, heroId, fight, option, incoming, crossBlock, applyDamage, pending }: {
   stats: Stats; heroId: string; fight: Fight; option: DefenseOption; incoming: Incoming; crossBlock: boolean; applyDamage: ApplyDamage; pending: boolean
}) {
   const language = useLanguageStore((state) => state.language)
   const log = useFightStore((state) => state.log)
   const update = useFightStore((state) => state.update)
   // Shared party fight: an attack on this hero waits for the defense roll
   const link = useEncounterLink()
   const pendingAttack = link?.incoming ?? null
   const [rollCount, setRollCount] = useState(0)
   const [attackerCritical, setAttackerCritical] = useState(pendingAttack?.critical ?? false)
   const [fromBehind, setFromBehind] = useState(false)
   const [riposte, setRiposte] = useState(false)
   const canRiposte = stats.combatSpecialAbilities.includes('Riposte') && ['Dolche', 'Fechtwaffen'].includes(option.technique) &&
      !option.dodge && !option.shield && incoming === 'melee'
   const defense = useDefense(stats, fight, option, { incoming, fromBehind, crossBlock, riposte: riposte && canRiposte })
   const [rolling, setRolling] = useState(false)
   const [result, setResult] = useState<CombatRoll | null>(null)
   const [fateUsed, setFateUsed] = useState<D20FateUse | null>(null)
   const [reported, setReported] = useState(false)
   const penalty = defensePenaltyOf(fight)
   const target = applyTargetRule(defenseTarget(defense.value, penalty, attackerCritical), defense.rule)
   const label = t(option.dodge ? 'AW' : 'PA', language)
   const surprised = (stats.statuses ?? []).includes('Überrascht')
   const blocked = [...defense.blocked, ...(target <= 0 ? ['This defense value is 0 or lower and cannot be used.'] : []),
      ...(link && pendingAttack && result && !reported ? ['Confirm the roll first.'] : []),
      ...(pendingAttack?.passing ? ['No defense against a Passierschlag (S. 237).'] : [])]

   async function defend() {
      setRolling(true)
      setFateUsed(null)
      const next = await rollD20(defenseColor, target)
      setRolling(false)
      setResult(next)
      setRollCount((count) => count + 1)
      // source: DSA5 Regelwerk, S. 228–229 (a defense interrupts a longer action such as reloading)
      const interrupted = Object.entries(fight.weapons ?? {}).filter(([, state]) => !state.loaded && (state.progress ?? 0) > 0)
      update(heroId, {
         defenses: fight.defenses + 1, defensePenalty: penalty + nextDefensePenalty(incoming, next.outcome), nextActionPenalty: undefined,
         ...(riposte && canRiposte ? { noDefenseRound: fight.round } : {}),
         ...(interrupted.length ? { weapons: Object.fromEntries(Object.entries(fight.weapons ?? {}).map(([key, state]) => [key, state.loaded ? state : { ...state, progress: 0 }])) } : {}),
      })
      if (interrupted.length) log(heroId, 'Reloading interrupted by a defense')
      // source: DSA5 Regelwerk, S. 229 (defending aborts a spell being cast)
      if (fight.casting) {
         update(heroId, { casting: null })
         log(heroId, 'Casting {spell} aborted by a defense', { spell: fight.casting.spell })
      }
      log(heroId, '{defense} {label}: W20 {roll} vs {target} → {outcome}', {
         defense: option.label, label, roll: next.confirmation === undefined ? next.roll : `${next.roll}/${next.confirmation}`,
         target, outcome: outcomeLabels[next.outcome],
      })
   }

   async function useFate(use: D20FateUse) {
      if (!result) return
      setFateUsed(use)
      if (use === 'improve') {
         const improved = improveRoll(result)
         if (improved) setResult(improved)
         log(heroId, 'Schip: {label} improved by 2 → {outcome}', { label, outcome: outcomeLabels.success })
         return
      }
      setRolling(true)
      const next = await rollD20(defenseColor, result.target)
      setRolling(false)
      setResult(next)
      setRollCount((count) => count + 1)
      log(heroId, 'Schip: {label} rerolled · W20 {roll} vs {target} → {outcome}', {
         label, roll: next.confirmation === undefined ? next.roll : `${next.roll}/${next.confirmation}`, target: next.target, outcome: outcomeLabels[next.outcome],
      })
   }

   return <div className={pendingAttack ? 'fight-card is-incoming' : 'fight-card'}>
      <h4><Shield size={16} />{t('Defense', language)}</h4>
      {pendingAttack && link && <IncomingAttackBanner link={link} attack={pendingAttack} stats={stats} />}
      <p className='fight-values'>
         <span>{label} <strong>{target}</strong><small> ({option.base}{defense.check.total !== 0 && ` ${signed(defense.check.total)}`}
            {sourceTotal(defense.sources) !== 0 && ` ${signed(sourceTotal(defense.sources))}`}{penalty > 0 && ` −${penalty}`}{attackerCritical && ' ½'}
            {defense.rule === 'one' && ` · ${t('only a rolled 1 succeeds', language)}`})</small></span>
         <span>{t('Defenses this round', language)} <strong>{fight.defenses}</strong></span>
         <CheckModifierButton check={defense.check} label={`${t(option.label, language)} ${label}`} />
      </p>
      <SourceList sources={defense.sources.filter((source) => source.label !== 'Passive parry bonus')} />
      {option.passive > 0 && <p className='fight-note'>{t('Includes the passive parry bonus +{value} of your shield or Parierwaffe (S. 233).', language).replace('{value}', () => String(option.passive))}</p>}
      <label className='regen-toggle'>
         <input type='checkbox' checked={attackerCritical} onChange={(event) => setAttackerCritical(event.target.checked)} />
         <span><strong>{t('Critical enemy attack', language)}</strong><small>{t('Your defense is halved for this attack.', language)}</small></span>
      </label>
      <label className='regen-toggle'>
         <input type='checkbox' checked={fromBehind} onChange={(event) => setFromBehind(event.target.checked)} />
         <span><strong>{t('Attacked from behind', language)}</strong><small>{t('Defense −4 (S. 238).', language)}</small></span>
      </label>
      {canRiposte && <label className='regen-toggle'>
         <input type='checkbox' checked={riposte} onChange={(event) => setRiposte(event.target.checked)} />
         <span><strong>{t('Riposte', language)}</strong><small>{t('Announce before the attack: PA −2; on success an immediate Passierschlag; no further defense this round (S. 249).', language)}</small></span>
      </label>}
      {defense.rule === 'one' && incoming === 'melee' && <p className='fight-note'>{t('Blind: defenses against ranged attacks are impossible.', language)}</p>}
      {surprised && <WatchfulnessButton stats={stats} heroId={heroId} />}
      {option.unarmed && <p className='fight-note'>{t('Parrying an armed attacker with Raufen still deals full damage; dodging is better.', language)}</p>}
      {blocked.length > 0 && <ul className='field-error probe-blocked'>{blocked.map((reason) => <li key={reason}>{t(reason, language)}</li>)}</ul>}
      {fight.casting && <p className='fight-note fight-danger'>{t('Defending aborts casting {spell} (S. 229).', language).replace('{spell}', fight.casting.spell)}</p>}
      <button className='primary-button' type='button' disabled={rolling || blocked.length > 0} onClick={() => void defend()}>
         <Shield size={16} />{t(fight.casting ? (option.dodge ? 'Abort casting and dodge' : 'Abort casting and parry') : option.dodge ? 'Roll dodge' : 'Roll parry', language)}
      </button>
      {rolling && <p className='probe-rolling'>{t('Rolling…', language)}</p>}
      {result && !rolling && <RollResult result={result} label={label} />}
      {result && !rolling && <FateD20Actions stats={stats} result={result} used={fateUsed} onUse={useFate}
         improveAbility={option.dodge ? 'Ausweichen verbessern' : 'Parade verbessern'} />}
      {result && !rolling && !reported && <ConfirmationReroll check={defense.check} result={result} color={defenseColor}
         onReroll={(next) => {
            setResult(next)
            log(heroId, '{label}: Waffenbegabung · confirmation roll {roll} → {outcome}', { label, roll: next.confirmation ?? '', outcome: outcomeLabels[next.outcome] })
         }} />}
      {link && pendingAttack && result && !rolling && <EncounterDefenseReport key={rollCount} link={link} attack={pendingAttack} result={result}
         label={label} reported={reported} onReported={() => setReported(true)} />}
      {result?.outcome === 'critical' && !rolling && <p className='fight-note'>{t(incoming === 'melee'
         ? 'Critical defense: you may make an immediate free attack (Passierschlag).' : 'Critical defense: your next defense this round is not 3 harder (S. 244).', language)}</p>}
      {result?.outcome === 'criticalUnconfirmed' && !rolling && incoming !== 'melee' && <p className='fight-note'>{t('Your next defense this round is only 2 harder (S. 244).', language)}</p>}
      {result?.success && !rolling && riposte && canRiposte && <p className='fight-note'>{t('Riposte: make your Passierschlag now (use the Passierschlag option).', language)}</p>}
      {result?.outcome === 'botch' && !rolling && <PatzerResolver stats={stats} heroId={heroId} fight={fight} table={incoming === 'melee' ? 'defense' : 'rangedDefense'}
         unarmed={!!option.unarmed} dodge={!!option.dodge} weaponKey={option.dodge || option.unarmed ? null : option.key} slot={option.slot} weaponDamage={null} applyDamage={applyDamage} disabled={pending} />}
   </div>
}

// source: DSA5 Regelwerk, S. 222 (SF Wachsamkeit: 1 Schip removes the status Überrascht immediately)
function WatchfulnessButton({ stats, heroId }: { stats: Stats; heroId: string }) {
   const language = useLanguageStore((state) => state.language)
   const fate = useFatePoint(stats)
   const clear = useClearSurprise(stats)
   const log = useFightStore((state) => state.log)
   if (!stats.generalSpecialAbilities.includes('Wachsamkeit')) return null
   const reason = fate.available < 1 ? 'No fate points left.' : null
   return <div className='fight-followup'>
      <button className='quiet-button' type='button' disabled={reason !== null || fate.pending || clear.isPending} onClick={() => void (async () => {
         if (!await fate.spend()) return
         clear.mutate()
         log(heroId, 'Schip: Wachsamkeit removes Überrascht')
      })()}><Eye size={16} />{t('Wachsamkeit (1 fate point)', language)}</button>
      {reason && <small>{t(reason, language)}</small>}
   </div>
}

// The surprise action happens before the regular KR (S. 36): Überrascht ends with the next round or the fight.
function useClearSurprise(stats: Stats) {
   const queryClient = useQueryClient()
   return useMutation({
      mutationFn: () => updateCombatSettings(stats._id, { statuses: (stats.statuses ?? []).filter((status) => status !== 'Überrascht') }),
      onSuccess: (next) => queryClient.setQueryData(['stats', stats.charId], next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
}

const hitLogKey = 'Hit: {tp} TP − RS {rs} = {sp} SP'

function HitCard({ stats, applyDamage, pending }: { stats: Stats; applyDamage: ApplyDamage; pending: boolean }) {
   const language = useLanguageStore((state) => state.language)
   const [tp, setTp] = useState(0)
   const protection = armorProtection(stats)
   const sp = damagePoints(tp, protection)
   return <div className='fight-card fight-hit'>
      <h4><HeartCrack size={16} />{t('Take a hit', language)}</h4>
      <p className='fight-note'>{t('When a defense fails or is not possible, enter the TP the GM rolled.', language)}</p>
      <div className='fight-modifier'>
         <span>{t('TP of the enemy', language)}</span>
         <Stepper label={t('TP of the enemy', language)} value={tp} min={0} max={200} onChange={setTp} />
      </div>
      <p className='fight-damage'>
         <strong>{sp} {t('SP', language)}</strong>
         <small>{tp} {t('TP', language)} − {t('RS', language)} {protection}{stats.checkModifiers.armor && ` (${t(stats.checkModifiers.armor, language)})`}</small>
      </p>
      <button className='primary-button' type='button' disabled={pending || tp <= 0} onClick={() => {
         applyDamage(sp, hitLogKey, { tp, rs: protection, sp })
         setTp(0)
      }}><HeartCrack size={16} />{t('Apply damage', language)}</button>
   </div>
}

const incomingChoices: Array<{ value: Incoming; label: string }> = [
   { value: 'melee', label: 'Melee attack' }, { value: 'shot', label: 'Shot (−4)' }, { value: 'thrown', label: 'Thrown weapon (−2)' },
]

// `view` (party fight, user decision Nov 2026): 'attack' / 'defense' show only that part on the battle board when the fight
// demands it; 'extras' shows the rest (status, stances, Schips, situation, manual hits) without the turn-bound actions.
export function FightPanel({ stats, heroId, speed, onRollInitiative, view = 'full' }: {
   stats: Stats; heroId: string; speed: number | null; onRollInitiative: () => void; view?: 'full' | 'attack' | 'defense' | 'extras' | 'passing'
}) {
   const [tab, setTab] = useState<'attack' | 'magic' | 'move'>('attack')
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const fight = useFightStore((state) => state.fights[heroId])
   const { update, nextRound, end, log } = useFightStore.getState()
   const [confirmEnd, setConfirmEnd] = useState(false)
   const [chosenIncoming, setIncoming] = useState<Incoming>('melee')
   const link = useEncounterLink()
   // An attack from the party fight sets melee / shot / thrown
   const incoming = link?.incoming?.incoming ?? chosenIncoming
   const [patzerTables, setPatzerTables] = useState(readPatzerTables)
   const [rageOffer, setRageOffer] = useState(false)
   const settings = useSettings(stats)
   const effects = useActiveEffects(stats)
   const { attack, defense, crossBlock } = gearOptions(stats, effects)
   // Effective GS (S. 29, 32–36): status overrides, else base + modifiers, scaled by Paralyse.
   const effectiveSpeed = fightSpeed(stats, speed)
   const clearSurprise = useClearSurprise(stats)
   const summonFightOver = useSummonFightOver(stats)
   const surprised = (stats.statuses ?? []).includes('Überrascht')
   const leaveSurprise = () => { if (surprised) clearSurprise.mutate() }
   // source: DSA5 Regelwerk, S. 219 (Schmerzen unterdrücken lasts one fight; ending it gives Betäubung I)
   const painSuppression = effects.find((effect) => effect.key === 'painSuppression')
   const endSuppression = useMutation({
      mutationFn: (effectId: string) => updateActiveEffect(stats._id, effectId, 'end'),
      onSuccess: ({ stats: next, effects: list }) => {
         queryClient.setQueryData(['stats', heroId], next)
         queryClient.setQueryData(activeEffectsKey(stats._id), list)
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   const damageMutation = useMutation({
      mutationFn: ({ sp }: { sp: number; key: string; values: Record<string, string | number> }) => adjustHealth(stats._id, 'damage', sp),
      onSuccess: (next, { sp, key, values }) => {
         queryClient.setQueryData(['stats', heroId], next)
         log(heroId, key, { ...values, before: stats.health.current, after: next.health.current })
         // source: DSA5 Regelwerk, S. 229 (damage while casting: Selbstbeherrschung check)
         const casting = useFightStore.getState().fights[heroId]?.casting
         if (casting && casting.done < casting.total) update(heroId, { casting: { ...casting, disturbance: (casting.disturbance ?? 0) + sp } })
         // source: DSA5 Regelwerk, S. 171 (Blutrausch: triggered when an attack causes a level of Schmerz); offered, never set automatically
         if (key === hitLogKey && next.pain > stats.pain && stats.disadvantages.includes('Blutrausch') && !next.statuses.includes('Blutrausch')) setRageOffer(true)
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const applyDamage: ApplyDamage = (sp, key, values) => {
      if (sp > 0) damageMutation.mutate({ sp, key, values })
      else log(heroId, key, { ...values, noDamage: 1 })
   }

   // A panel that fights in a party fight is run on the fight page; here it only points there (user decision, Nov 2026)
   if (!link && fight?.party) return <PartyFightNotice heroId={heroId} party={fight.party} />
   if (!fight) return <section className='overview-section fight-panel'>
      <header className='section-heading'><Swords size={19} /><div><p className='eyebrow'>{t('Fight', language)}</p><h2>{t('Combat simulation', language)}</h2></div></header>
      <div className='fight-idle'>
         <p>{t('Roll initiative to start a fight. Your equipped weapons, shields and dodge are available; the GM rolls for the enemies.', language)}</p>
         <div className='fight-followup'>
            <button className='primary-button' type='button' onClick={onRollInitiative}>
               <DieIcon sides={6} />{t('Start fight · roll INI', language)}
            </button>
            <AmbushAction stats={stats} />
         </div>
      </div>
   </section>

   const attackOption = attack.find((option) => option.key === fight.attackWeapon) ?? attack[0]
   const partners = attack.filter((option) => canPair(attackOption, option))
   const offHandOption = partners.find((option) => option.key === fight.offHand) ?? null
   const defenseOption = defense.find((option) => option.key === fight.defense) ?? defense[0]
   const iniTotal = fight.initiative.base + fight.initiative.modifier + fight.initiative.roll
   const pending = damageMutation.isPending

   const weaponChoice = <fieldset className='probe-difficulty'>
      <legend>{t('Weapon', language)}</legend>
      <div className='fight-options'>
         {attack.map((option) => <OptionChip key={option.key} stats={stats} fight={fight} option={option}
            active={option.key === attackOption.key} onSelect={() => update(heroId, { attackWeapon: option.key, offHand: null })} />)}
      </div>
      {partners.length > 0 && view !== 'passing' && <label className='field-group fight-situation-field'>
         <span>{t('Two-weapon attack (S. 238)', language)}</span>
         <select value={offHandOption?.key ?? ''} onChange={(event) => update(heroId, { offHand: event.target.value || null })}>
            <option value=''>{t('One weapon', language)}</option>
            {partners.map((option) => <option key={option.key} value={option.key}>{t('Also with', language)} {t(option.label, language)}</option>)}
         </select>
      </label>}
   </fieldset>
   const dualOption = view === 'passing' ? null : offHandOption
   const attackCards = <>
      <AttackCard key={`${attackOption.key}-${dualOption?.key ?? ''}`} stats={stats} heroId={heroId} fight={fight} option={attackOption}
         dual={dualOption !== null} speed={effectiveSpeed} applyDamage={applyDamage} pending={pending} />
      {dualOption && <AttackCard key={`off-${dualOption.key}`} stats={stats} heroId={heroId} fight={fight} option={dualOption}
         dual offHand speed={effectiveSpeed} applyDamage={applyDamage} pending={pending} />}
   </>
   const defenseChoice = <fieldset className='probe-difficulty'>
      <legend>{t('Defense', language)}</legend>
      {!link?.incoming && <div className='probe-segmented'>
         {incomingChoices.map((choice) => <button key={choice.value} type='button' aria-pressed={incoming === choice.value}
            className={incoming === choice.value ? 'is-active' : ''} onClick={() => setIncoming(choice.value)}>{t(choice.label, language)}</button>)}
      </div>}
      <div className='fight-options'>
         {defense.map((option) => <DefenseChip key={option.key} stats={stats} fight={fight} option={option} incoming={incoming} crossBlock={crossBlock}
            active={option.key === defenseOption.key} onSelect={() => update(heroId, { defense: option.key })} />)}
      </div>
      {incoming !== 'melee' && <p className='fight-note'>{t('Against ranged attacks only dodge or an active shield parry is possible.', language)}</p>}
   </fieldset>
   const defenseCard = <DefenseCard key={`${defenseOption.key}-${link?.incoming?.id ?? ''}`} stats={stats} heroId={heroId} fight={fight} option={defenseOption} incoming={incoming}
      crossBlock={crossBlock} applyDamage={applyDamage} pending={pending} />

   // The own turn in the party fight: attack, magic, or another action (Flucht); every one counts on the shared turn
   if (view === 'attack') return <div className='fight-dock-panel'>
      <div className='probe-segmented fight-dock-tabs' role='group' aria-label={t('Action', language)}>
         {(['attack', 'magic', 'move'] as const).map((key) => <button key={key} type='button' aria-pressed={tab === key}
            className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>{t(key === 'attack' ? 'Attack' : key === 'magic' ? 'Magic' : 'Flee', language)}</button>)}
      </div>
      {tab === 'attack' && <>{weaponChoice}{attackCards}</>}
      {tab === 'magic' && (hasMagic(stats) ? <CastingCard stats={stats} heroId={heroId} fight={fight} /> : <p className='fight-note'>{t('No spells to cast in a fight.', language)}</p>)}
      {tab === 'move' && <FleeAction stats={stats} heroId={heroId} fight={fight} speed={effectiveSpeed} />}
   </div>
   // Passierschlag outside the own turn (S. 237)
   if (view === 'passing') return <div className='fight-dock-panel'>{weaponChoice}
      <AttackCard key={`passing-${attackOption.key}`} stats={stats} heroId={heroId} fight={fight} option={attackOption} speed={effectiveSpeed}
         applyDamage={applyDamage} pending={pending} forcePassing /></div>
   if (view === 'defense') return <div className='fight-dock-panel'>{defenseChoice}{defenseCard}</div>
   const extras = view === 'extras'

   return <section className='overview-section fight-panel'>
      <header className='section-heading'>
         <Swords size={19} />
         <div><p className='eyebrow'>{t(link ? 'Party fight' : 'Simulated fight', language)}</p><h2>{t('Combat round', language)} {fight.round}</h2></div>
         {!link && <button className='quiet-button section-action' type='button' onClick={() => { nextRound(heroId); leaveSurprise() }}><SkipForward size={16} />{t('Next round', language)}</button>}
         {!link && <button className='quiet-button section-action' type='button' onClick={() => setConfirmEnd(true)}><Flag size={16} />{t('End fight', language)}</button>}
      </header>
      <dl className='fight-status'>
         <div><dt>{t('INI', language)}</dt><dd>{iniTotal} <small>({fight.initiative.base}{fight.initiative.modifier !== 0 && ` ${signed(fight.initiative.modifier)}`} + W6 {fight.initiative.roll})</small></dd></div>
         <div><dt>{t('LeP', language)}</dt><dd>{stats.health.current} <small>/ {stats.health.max}</small></dd></div>
         <div><dt>{t('Pain', language)}</dt><dd>{stats.pain} <small>/ IV</small></dd></div>
         <div><dt>{t('RS', language)}</dt><dd>{armorProtection(stats)}</dd></div>
      </dl>
      {!extras && <TurnBar heroId={heroId} fight={fight} name={t('Hero', language)} speed={effectiveSpeed} />}
      <FateRoundActions stats={stats} heroId={heroId} fight={fight} />
      <StanceActions stats={stats} heroId={heroId} fight={fight} />
      <LeaderBonus heroId={heroId} fight={fight} />
      {fight.fate?.ignoreConditions === fight.round && <p className='fight-note'>{t('Conditions are ignored this round (also for talent and spell checks).', language)}</p>}
      {rageOffer && <div className='fight-confirm' role='alertdialog' aria-label='Blutrausch'>
         <p>{t('This hit caused Schmerz: the disadvantage Blutrausch triggers the status Blutrausch (S. 171).', language)}</p>
         <button className='quiet-button' type='button' onClick={() => setRageOffer(false)}>{t('Not now', language)}</button>
         <button className='primary-button' type='button' disabled={settings.isPending} onClick={() => {
            settings.mutate({ statuses: [...stats.statuses, 'Blutrausch'] })
            setRageOffer(false)
         }}>{t('Set Blutrausch', language)}</button>
      </div>}
      {confirmEnd && <div className='fight-confirm' role='alertdialog' aria-label={t('End fight', language)}>
         <p>{t('End this fight? Round, INI and log are cleared; LeP stay as they are.', language)}
            {painSuppression && ` ${t('Schmerzen unterdrücken ends too (Betäubung I).', language)}`}</p>
         <button className='quiet-button' type='button' onClick={() => setConfirmEnd(false)}>{t('Cancel', language)}</button>
         <button className='primary-button' type='button' onClick={() => {
            const summonIds = (fight.allies ?? []).flatMap((ally) => ally.source.kind === 'summon' ? [ally.source.id] : [])
            if (summonIds.length) summonFightOver.mutate(summonIds)
            end(heroId); setConfirmEnd(false); leaveSurprise()
            if (painSuppression) endSuppression.mutate(painSuppression._id)
         }}>{t('End fight', language)}</button>
      </div>}
      {stats.health.current <= 0 && <p className='combat-health-warning' role='status'>
         {t(stats.health.current < -stats.constitution ? 'Below negative KO: death threshold reached.' : 'Dying: treatment must begin within KO combat rounds.', language)}
         {` (KO ${stats.constitution})`}
      </p>}
      <SituationCard heroId={heroId} fight={fight} vision={visionOf(stats.advantages, stats.disadvantages)} />
      <label className='regen-toggle fight-optional'>
         <input type='checkbox' checked={patzerTables} onChange={(event) => { writePatzerTables(event.target.checked); setPatzerTables(event.target.checked) }} />
         <span><strong>{t('Optional rule: Patzer tables', language)}</strong><small>{t('2W6 tables instead of 1W6+2 SP (S. 231, 234, 243, 244). Remembered in this browser.', language)}</small></span>
      </label>

      {extras ? null : <div className='fight-grid'>
         <div className='fight-column'>
            {weaponChoice}
            {attackCards}
            <CastingCard stats={stats} heroId={heroId} fight={fight} />
            <FleeAction stats={stats} heroId={heroId} fight={fight} speed={effectiveSpeed} />
         </div>
         <div className='fight-column'>
            {defenseChoice}
            {defenseCard}
            <HitCard stats={stats} applyDamage={applyDamage} pending={pending} />
            <div className='fight-card'><AmbushAction stats={stats} /></div>
         </div>
      </div>}
      <FightAllySection stats={stats} heroId={heroId} fight={fight} />

      {fight.log.length > 0 && <details className='fight-log' open>
         <summary>{t('Fight log', language)}</summary>
         <ol>{fight.log.map((entry) => <li key={entry.id}>
            <span className='fight-log-round'>{t('KR', language)} {entry.round}</span>
            <span>{format(t(entry.key, language), Object.fromEntries(Object.entries(entry.values).map(([key, value]) =>
               [key, typeof value === 'string' && ['outcome', 'weapon', 'defense', 'cost'].includes(key) ? t(value, language) : value])))}
               {'after' in entry.values && ` · ${t('LeP', language)} ${entry.values.before} → ${entry.values.after}`}
               {'noDamage' in entry.values && ` · ${t('No damage', language)}`}</span>
         </li>)}</ol>
      </details>}
   </section>
}

const incomingOf = (option: AttackOption): Incoming => option.kind !== 'ranged' ? 'melee' : option.technique === 'Wurfwaffen' ? 'thrown' : 'shot'

// The rolled attack waits for the player's confirmation (user decision, Nov 2026); Schips and Waffenbegabung come first.
function EncounterAttackSend({ link, target, weapon, incoming, reach, passing, dual, result, dice, sent, onSent }: {
   link: EncounterLink; target: { id: string; name: string }; weapon: string; incoming: Incoming; reach: Reach | null
   passing: boolean; dual: 'first' | 'second' | null; result: CombatRoll; dice: DamageDice | null
   sent: boolean; onSent: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   if (sent) return <p className='fight-note'>{t(!result.success ? 'Reported to the fight.' : passing ? 'Sent: no defense, you roll the damage next.'
      : 'Sent: waiting for the defense. On a failure you roll the damage.', language)}</p>
   const send = async () => { if (await link.sendAttack({ targetId: target.id, incoming, weapon, roll: result, dice, reach, passing, dual })) onSent() }
   return <div className='fight-followup'>
      <button className={result.success ? 'primary-button' : 'quiet-button'} type='button' disabled={link.busy} onClick={() => void send()}>
         {result.success ? <><Crosshair size={16} />{t('Send attack to {target}', language).replace('{target}', target.name)}</> : t('Accept the miss', language)}</button>
   </div>
}

// An attack on the hero from the shared fight: who attacks, critical, TP on a hit; "cannot defend" takes the hit at once
function IncomingAttackBanner({ link, attack, stats }: { link: EncounterLink; attack: IncomingAttack; stats: Stats }) {
   const language = useLanguageStore((state) => state.language)
   return <div className='fight-incoming' role='alert'>
      <strong>{t('{attacker} attacks you with {weapon}.', language).replace('{attacker}', attack.attackerName).replace('{weapon}', attack.weapon)}</strong>
      {attack.critical && <small>{t('Critical attack: your defense is halved.', language)}</small>}
      <small>{t('If the defense fails, the attacker rolls the damage; you take TP − RS {rs} automatically.', language).replace('{rs}', String(armorProtection(stats)))}</small>
      <button className='quiet-button' type='button' disabled={link.busy} onClick={() => void link.sendDefense(attack.id, null)}>
         <HeartCrack size={16} />{t('Cannot defend', language)}</button>
   </div>
}

// After the defense roll: report a success, or apply TP − RS of the worn armor and report the hit
// After the defense roll the player confirms it (user decision, Nov 2026); Schips and Waffenbegabung come first
function EncounterDefenseReport({ link, attack, result, label, reported, onReported }: {
   link: EncounterLink; attack: IncomingAttack; result: CombatRoll; label: string; reported: boolean; onReported: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   if (reported) return <p className='fight-note'>{t(result.success ? 'Reported to the fight.' : 'Reported: the attacker rolls the damage.', language)}</p>
   return <div className='fight-followup'>
      <button className={result.success ? 'primary-button' : 'quiet-button'} type='button' disabled={link.busy} onClick={() => void (async () => {
         if (await link.sendDefense(attack.id, { label, roll: result })) onReported()
      })()}>{result.success ? <><Shield size={16} />{t('Report the defense to the fight', language)}</> : t('Accept the failed defense', language)}</button>
   </div>
}

// Spells or Zaubertricks to use in a fight (the Magic tab shows the casting card)
const hasMagic = (stats: Stats) => stats.spells.length > 0 || stats.magicTricks.length > 0

// The hero fights in a party fight: the panel lives on the fight page. A party fight that has ended (or been replaced)
// clears this panel, so nothing of a former fight is picked up.
function PartyFightNotice({ heroId, party }: { heroId: string; party: { partyId: string; encounterId: string } }) {
   const language = useLanguageStore((state) => state.language)
   const running = useQuery({ queryKey: encounterKey(party.partyId), queryFn: () => getEncounter(party.partyId), retry: false })
   const over = running.isSuccess && running.data?._id !== party.encounterId
   useEffect(() => {
      if (over) useFightStore.getState().end(heroId)
   }, [over, heroId])
   return <section className='overview-section fight-panel'>
      <header className='section-heading'><Swords size={19} /><div><p className='eyebrow'>{t('Party fight', language)}</p><h2>{t('This hero is in a party fight', language)}</h2></div></header>
      <p className='fight-note'>{t('Attacks, defenses and turns run on the party\'s fight page, together with the GM and the other players.', language)}</p>
      <Link className='primary-button' to={`/parties/${party.partyId}/fight`}><Swords size={16} />{t('Go to the party fight', language)}</Link>
   </section>
}
