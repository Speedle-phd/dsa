import { useQuery } from '@tanstack/react-query'
import { Footprints, Hourglass, Plus, Sparkles, Wand2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { actionBlocked, actionUse, actionsLeft, castingActions, disturbancePenalty, freeLeft, type ActionCost, type CastingModification } from './fightActions'
import { useFightStore, type Fight } from './fightStore'
import { getMagicReference, spellRules, useManaSpend, type MagicReference } from './magicApi'
import { SpellProbeDialog } from './SpellProbeDialog'
import type { Stats } from './statsApi'
import { talentCatalog } from './talentCatalog'
import { TalentProbeDialog } from './TalentProbeDialog'
import { useTurnGate } from './turnGate'

// Action and free action of the current KR, movement and the GM's extra action (S. 227–229). Without `allyId` it is the hero's.
export function TurnBar({ heroId, fight, allyId, name, speed }: { heroId: string; fight: Fight; allyId?: string; name: string; speed: number | null }) {
   const language = useLanguageStore((state) => state.language)
   const { spend, log } = useFightStore.getState()
   const ally = allyId ? fight.allies?.find((entry) => entry.id === allyId) : undefined
   const use = actionUse(allyId ? ally?.turn : fight.turn, fight.round)
   const casting = allyId ? null : fight.casting
   const left = actionsLeft(use)

   function move(cost: ActionCost) {
      spend(heroId, cost, allyId)
      log(heroId, allyId ? '{name} moves up to {gs} Schritt ({cost})' : 'Move up to {gs} Schritt ({cost})',
         { name, gs: speed ?? '?', cost: cost === 'action' ? 'action' : 'free action' })
   }

   return <div className='fight-turn' aria-label={`${t('Actions this round', language)}: ${name}`}>
      <span className={`fight-turn-pill${left > 0 ? '' : ' is-used'}`}>{t('Action', language)} {Math.max(0, left)}/{1 + use.extra}</span>
      <span className={`fight-turn-pill${freeLeft(use) > 0 ? '' : ' is-used'}`}>{t('Free action', language)} {freeLeft(use)}/1</span>
      {(['free', 'action'] as const).map((cost) => {
         const reason = actionBlocked(use, cost, casting)
         return <button key={cost} type='button' className='quiet-button fight-turn-move' disabled={reason !== null}
            title={reason ? t(reason, language) : t('Move up to GS Schritt; as a free action only on your own INI turn (S. 228).', language)}
            aria-label={`${t(cost === 'free' ? 'Move (free action)' : 'Move (action)', language)}: ${name}`} onClick={() => move(cost)}>
            <Footprints size={15} />{t(cost === 'free' ? 'Move (free action)' : 'Move (action)', language)}{speed !== null && ` · ${speed}`}
         </button>
      })}
      {left <= 0 && <button type='button' className='quiet-button fight-turn-move' aria-label={`${t('GM: one more action', language)}: ${name}`}
         onClick={() => { spend(heroId, 'extra', allyId); log(heroId, allyId ? 'GM allows {name} one more action' : 'GM allows one more action', { name }) }}>
         <Plus size={15} />{t('GM: one more action', language)}</button>}
   </div>
}

type CastOption = { key: string; time: string }

// Spells as longer actions (S. 228–229, 255–256): each KR's action until the last, then the spell Probe; defending or a failed
// Selbstbeherrschung check aborts. Zaubertricks take one action and 1 AsP without a check (S. 285).
export function CastingCard({ stats, heroId, fight }: { stats: Stats; heroId: string; fight: Fight }) {
   const language = useLanguageStore((state) => state.language)
   const reference = useQuery({ queryKey: ['magic-reference'], queryFn: getMagicReference, staleTime: Infinity }).data
   const { update, log } = useFightStore.getState()
   const gate = useTurnGate(heroId, fight)
   const use = actionUse(fight.turn, fight.round)
   const casting = fight.casting ?? null
   const [choice, setChoice] = useState('')
   const [modification, setModification] = useState<CastingModification>('none')
   const [trick, setTrick] = useState('')
   const [probeOpen, setProbeOpen] = useState(false)
   const [concentration, setConcentration] = useState(false)
   const failed = useRef(false)
   const mana = useManaSpend(stats)
   if (!reference) return null
   const options = castOptions(stats, reference)
   const tricks = stats.magicTricks.map((entry) => entry.key)
   if (!options.length && !tricks.length && !casting) return null

   const chosen = reference.spells.find((spell) => spell.key === choice)
   const chosenValue = stats.spells.find((spell) => spell.key === choice)?.value ?? 0
   const modifiable = chosen?.kind === 'Zauberspruch' && spellRules(stats, chosen, reference, chosenValue).modifications > 0
   const total = chosen ? castingActions(chosen.castingTime, modifiable ? modification : 'none') : null
   const startBlocked = gate.reason('action', casting)
   const castSpell = casting ? reference.spells.find((spell) => spell.key === casting.spell) : undefined
   const castValue = stats.spells.find((spell) => spell.key === casting?.spell)?.value ?? 0
   const complete = casting !== null && casting.done >= casting.total
   const continueBlocked = casting && !complete
      ? casting.lastRound === fight.round && actionsLeft(use) <= 0 ? 'Continue casting in the next combat round.' : gate.reason('action', null) : null
   const selfControl = talentCatalog.find((entry) => entry.key === 'selbstbeherrschung')!
   const selfControlValue = stats.talents.find((entry) => entry.key === 'selbstbeherrschung')?.value ?? 0
   const penalty = disturbancePenalty(casting?.disturbance ?? 0)

   async function start() {
      if (!chosen || !total) return
      if (!await gate.spend('action', 'Casting', `${chosen.key} 1/${total}`)) return
      update(heroId, { casting: { spell: chosen.key, total, done: 1, lastRound: fight.round, modification: modifiable ? modification : 'none' } })
      log(heroId, 'Casting {spell}: action {done}/{total}', { spell: chosen.key, done: 1, total })
      setChoice('')
      setModification('none')
      if (total === 1) setProbeOpen(true)
   }
   async function proceed() {
      if (!casting) return
      const done = casting.done + 1
      if (!await gate.spend('action', 'Casting', `${casting.spell} ${done}/${casting.total}`)) return
      update(heroId, { casting: { ...casting, done, lastRound: fight.round } })
      log(heroId, 'Casting {spell}: action {done}/{total}', { spell: casting.spell, done, total: casting.total })
      if (done >= casting.total) setProbeOpen(true)
   }
   function abort(reason: string) {
      if (!casting) return
      update(heroId, { casting: null })
      log(heroId, reason, { spell: casting.spell })
   }

   return <div className='fight-card fight-casting'>
      <h4><Wand2 size={16} />{t('Magic', language)}</h4>
      {casting ? <>
         <p className='fight-casting-progress'>
            <Hourglass size={15} /><strong lang='de'>{casting.spell}</strong>
            <span>{t('{done} of {total} actions', language).replace('{done}', String(casting.done)).replace('{total}', String(casting.total))}</span>
            {casting.modification !== 'none' && <small>· <span lang='de'>{casting.modification === 'shorter' ? 'Zauberdauer senken' : 'Zauberdauer erhöhen'}</span></small>}
         </p>
         <p className='fight-note'>{t('Free actions are still possible; defending aborts the spell (S. 229).', language)}</p>
         {casting.disturbance !== undefined && !complete && <div className='fight-confirm' role='status'>
            <p>{t('You took {sp} SP while casting: a Selbstbeherrschung (Störungen ignorieren) check keeps the concentration, −{penalty} (S. 229).', language)
               .replace('{sp}', String(casting.disturbance)).replace('{penalty}', String(penalty))}</p>
            <button className='primary-button' type='button' onClick={() => setConcentration(true)}>{t('Selbstbeherrschung', language)}</button>
         </div>}
         <div className='fight-followup'>
            {complete ? <button className='primary-button' type='button' onClick={() => setProbeOpen(true)}><Sparkles size={16} />{t('Roll the spell Probe', language)}</button>
               : <button className='primary-button' type='button' disabled={continueBlocked !== null} onClick={() => void proceed()}>
                  <Hourglass size={16} />{t('Continue casting (action {next}/{total})', language).replace('{next}', String(casting.done + 1)).replace('{total}', String(casting.total))}</button>}
            {casting.disturbance === undefined && !complete && <button className='quiet-button' type='button'
               onClick={() => setConcentration(true)}>{t('Disturbed: Selbstbeherrschung', language)}</button>}
            <button className='quiet-button' type='button' onClick={() => abort('Casting {spell} aborted')}><X size={16} />{t('Abort', language)}</button>
         </div>
         {continueBlocked && <small className='fight-note'>{t(continueBlocked, language)}</small>}
      </> : <>
         {options.length > 0 && <>
            <label className='field-group fight-situation-field'>
               <span>{t('Cast a spell', language)}</span>
               <select value={choice} onChange={(event) => { setChoice(event.target.value); setModification('none') }}>
                  <option value=''>{t('Choose a spell', language)}</option>
                  {options.map((option) => <option key={option.key} value={option.key}>
                     {option.key} · {option.time === '≥ 1' ? 1 : option.time} {t('actions', language)}</option>)}
               </select>
            </label>
            {modifiable && <div className='probe-segmented'>
               {(['none', 'shorter', 'longer'] as const).map((key) => {
                  const actions = castingActions(chosen!.castingTime, key)
                  return <button key={key} type='button' aria-pressed={modification === key} disabled={actions === null}
                     className={modification === key ? 'is-active' : ''} onClick={() => setModification(key)}>
                     {key === 'none' ? t('Normal', language) : <span lang='de'>{key === 'shorter' ? 'Zauberdauer senken (−1)' : 'Zauberdauer erhöhen (+1)'}</span>}
                     {actions !== null && ` · ${actions}`}</button>
               })}
            </div>}
            {chosen && total && <p className='fight-note'>{t(total === 1 ? 'Takes this round’s action; the spell Probe follows right away.'
               : 'Takes {total} actions, one per combat round starting now; the spell Probe comes at the end (S. 228–229).', language).replace('{total}', String(total))}</p>}
            <button className='primary-button' type='button' disabled={!chosen || !total || startBlocked !== null} onClick={() => void start()}>
               <Wand2 size={16} />{t('Start casting', language)}</button>
            {startBlocked && chosen && <small className='fight-note'>{t(startBlocked, language)}</small>}
         </>}
         {tricks.length > 0 && <div className='fight-followup'>
            <select value={trick} aria-label={t('Zaubertrick', language)} onChange={(event) => setTrick(event.target.value)}>
               <option value=''>{t('Zaubertrick', language)}</option>
               {tricks.map((key) => <option key={key} value={key}>{key}</option>)}
            </select>
            <button className='quiet-button' type='button' disabled={!trick || startBlocked !== null || mana.isPending || stats.mana.current < 1}
               onClick={() => void (async () => {
                  if (!await gate.spend('action', 'Zaubertrick', trick)) return
                  mana.mutate(1)
                  log(heroId, 'Zaubertrick {spell}: 1 action, 1 AsP', { spell: trick })
                  setTrick('')
               })()}><Sparkles size={16} />{t('Use · 1 action, 1 AsP', language)}</button>
         </div>}
      </>}

      {probeOpen && castSpell && <SpellProbeDialog stats={stats} spell={castSpell} reference={reference} value={castValue}
         initialModifications={casting?.modification === 'none' || !casting ? [] : [casting.modification]}
         onClose={() => { setProbeOpen(false); update(heroId, { casting: null }) }} />}
      {concentration && <TalentProbeDialog stats={stats} talent={selfControl} value={selfControlValue}
         extraSources={penalty ? [{ label: 'Damage while casting', value: -penalty }] : []}
         renderResult={({ result }) => {
            failed.current = !result.success
            return <p className={`fight-note${result.success ? '' : ' fight-danger'}`}>{t(result.success ? 'Concentration kept: keep casting.' : 'Concentration lost: the spell is aborted (S. 229).', language)}</p>
         }}
         onClose={() => {
            setConcentration(false)
            if (failed.current) abort('Casting {spell} aborted: concentration lost')
            else if (casting) update(heroId, { casting: { ...casting, disturbance: undefined } })
            failed.current = false
         }} />}
   </div>
}

function castOptions(stats: Stats, reference: MagicReference): CastOption[] {
   return stats.spells.flatMap((entry) => {
      const spell = reference.spells.find((candidate) => candidate.key === entry.key)
      return spell && castingActions(spell.castingTime) !== null
         ? [{ key: spell.key, time: spell.castingTime }] : []
   })
}
