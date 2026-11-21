import { RotateCcw, Shield, Sparkles, Star, Zap } from 'lucide-react'
import { useState } from 'react'
import { useLanguageStore } from '@/locales/languageStore'
import { t, translateRuleLabel } from '@/locales/translation'
import type { useCheckState } from './checkState'
import { fateImprovement, improveRoll, type D20Roll, type RollRules } from './combatRoll'
import { rerollConfirmation } from './d20'
import { useFatePoint } from './fate'
import { useFightStore, type Fight } from './fightStore'
import type { Stats } from './statsApi'

export type D20FateUse = 'reroll' | 'improve'

function FateBalance({ stats }: { stats: Stats }) {
   const language = useLanguageStore((state) => state.language)
   return <span className='fate-inline-balance'><Star size={14} aria-hidden='true' />{t('Fate points', language)}: <strong>{stats.fatePoints.current} / {stats.fatePoints.max}</strong></span>
}

// source: DSA5 Regelwerk, S. 29–30, 220–222 (one Schip per roll: Neuer Wurf, or "… verbessern" with the SF; neither on a Patzer)
export function FateD20Actions({ stats, result, improveAbility, used, onUse }: {
   stats: Stats; result: D20Roll; improveAbility: string | null; used: D20FateUse | null; onUse: (use: D20FateUse) => Promise<void> | void
}) {
   const language = useLanguageStore((state) => state.language)
   const fate = useFatePoint(stats)
   const [busy, setBusy] = useState(false)
   const ownsImprove = improveAbility !== null && stats.generalSpecialAbilities.includes(improveAbility)
   const botch = result.outcome === 'botch'
   const common = used ? 'A fate point was already used for this roll.' : fate.available < 1 ? 'No fate points left.' : botch ? 'Not allowed on a botch.' : null
   const improveReason = common ?? (improveRoll(result) ? null : result.success ? 'The roll already succeeded.' : 'An improvement of 2 is not enough.')
   async function use(kind: D20FateUse) {
      setBusy(true)
      if (await fate.spend()) await onUse(kind)
      setBusy(false)
   }
   return <div className='fate-actions'>
      <FateBalance stats={stats} />
      {used ? <small>{t(used === 'reroll' ? 'Reroll used (binding).' : 'Result improved by 2.', language)}</small> : <>
         <button className='quiet-button' type='button' disabled={busy || fate.pending || common !== null} onClick={() => void use('reroll')}>
            <RotateCcw size={16} />{t('Reroll (1 fate point)', language)}</button>
         {ownsImprove && <button className='quiet-button' type='button' disabled={busy || fate.pending || improveReason !== null}
            onClick={() => void use('improve')}><Sparkles size={16} />{translateRuleLabel(improveAbility, language)} (+{fateImprovement})</button>}
         {common && <small>{t(common, language)}</small>}
      </>}
   </div>
}

// source: DSA5 Regelwerk, S. 30 (Schadenswurf wiederholen: reroll one W6 of your own damage once)
export function FateDamageReroll({ stats, rolls, sides, used, onReroll }: {
   stats: Stats; rolls: number[]; sides: number; used: boolean; onReroll: (index: number) => Promise<void> | void
}) {
   const language = useLanguageStore((state) => state.language)
   const fate = useFatePoint(stats)
   const [busy, setBusy] = useState(false)
   if (sides !== 6) return null
   async function reroll(index: number) {
      setBusy(true)
      if (await fate.spend()) await onReroll(index)
      setBusy(false)
   }
   return <div className='fate-actions'>
      <FateBalance stats={stats} />
      {used ? <small>{t('Damage die rerolled.', language)}</small> : <>
         <span>{t('Reroll one W6 (1 fate point)', language)}:</span>
         {rolls.map((roll, index) => <button key={index} className='quiet-button' type='button' disabled={busy || fate.pending || fate.available < 1}
            onClick={() => void reroll(index)}><RotateCcw size={14} />W6 {rolls.length > 1 ? `#${index + 1} ` : ''}({roll})</button>)}
         {fate.available < 1 && <small>{t('No fate points left.', language)}</small>}
      </>}
   </div>
}

const roundUses = [
   { key: 'first', label: 'Act first', note: 'Announce at the start of the round.', icon: Zap, log: 'Schip: acts first this round' },
   { key: 'defense', label: 'Defense +4', note: 'All defenses +4 until the end of the round.', icon: Shield, log: 'Schip: defenses +4 this round' },
   { key: 'ignoreConditions', label: 'Ignore conditions', note: 'All conditions are ignored for this round.', icon: Sparkles, log: 'Schip: conditions ignored this round' },
] as const

// source: DSA5 Regelwerk, S. 29–30 (Erster, Verteidigung, Zustand ignorieren: 1 Schip each, for the current KR)
export function FateRoundActions({ stats, heroId, fight }: { stats: Stats; heroId: string; fight: Fight }) {
   const language = useLanguageStore((state) => state.language)
   const fate = useFatePoint(stats)
   const { update, log } = useFightStore.getState()
   const [busy, setBusy] = useState(false)
   // Erster must be announced before anything happens in the round.
   const roundStarted = fight.log.some((entry) => entry.round === fight.round && !entry.key.startsWith('Schip:') &&
      entry.key !== 'Combat round {round} begins' && !entry.key.startsWith('Fight started'))
   async function use(key: (typeof roundUses)[number]['key'], message: string) {
      setBusy(true)
      if (await fate.spend()) {
         update(heroId, { fate: { ...fight.fate, [key]: fight.round } })
         log(heroId, message)
      }
      setBusy(false)
   }
   return <div className='fate-round'>
      <FateBalance stats={stats} />
      <div className='fate-round-actions'>
         {roundUses.map(({ key, label, note, icon: Icon, log: message }) => {
            const active = fight.fate?.[key] === fight.round
            const reason = active ? null : fate.available < 1 ? 'No fate points left.' : key === 'first' && roundStarted ? 'Only at the start of a round.' : null
            return <button key={key} type='button' aria-pressed={active} className={`probe-chip fate-round-chip${active ? ' is-active' : ''}`}
               disabled={busy || fate.pending || active || reason !== null} title={reason ? t(reason, language) : t(note, language)}
               onClick={() => void use(key, message)}>
               <strong><Icon size={14} aria-hidden='true' />{t(label, language)}</strong>
               <small>{active ? t('Active this round', language) : reason ? t(reason, language) : t(note, language)}</small>
            </button>
         })}
      </div>
   </div>
}

// source: DSA5 Regelwerk, S. 169 (Waffenbegabung: the Bestätigungswurf after a critical or a botch may be rolled again once)
export function ConfirmationReroll({ check, result, color, rules, onReroll }: {
   check: ReturnType<typeof useCheckState>; result: D20Roll; color: string; rules?: RollRules; onReroll: (next: D20Roll) => void
}) {
   const language = useLanguageStore((state) => state.language)
   const [busy, setBusy] = useState(false)
   const aptitude = check.activeEffects.find((effect) => effect.reroll === 'waffenbegabung')
   if (!aptitude || result.confirmation === undefined) return null
   async function reroll() {
      setBusy(true)
      onReroll(await rerollConfirmation(result, color, rules))
      setBusy(false)
   }
   return <div className='fate-actions'>
      <span className='fate-inline-balance'>{translateRuleLabel(aptitude.label, language)}</span>
      {result.confirmationRerolled ? <small>{t('Confirmation roll repeated; the new result counts (S. 169).', language)}</small>
         : <button className='quiet-button' type='button' disabled={busy} onClick={() => void reroll()}>
            <RotateCcw size={16} />{t('Roll the confirmation again', language)}</button>}
   </div>
}
