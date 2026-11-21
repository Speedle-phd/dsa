import { Check, Dices, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { throwColoredDice } from '@/components/diceEngine'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { useCheckState } from './checkState'
import { liturgyBotchTable, suggestedLiturgyCost, useKarmaSpend, type Liturgy } from './karmaApi'
import { ProbeDialog, ProbeStepper, type ProbeExtraSource, type ProbeResultState } from './ProbeDialog'
import type { Stats } from './statsApi'

type Modification = 'shorter' | 'longer' | 'range' | 'cheaper' | 'force'
// source: DSA5 Regelwerk, S. 310, 313–314 (one step each; −1 / +1; cost changes not for liturgies with fixed costs, no range increase for "selbst")
const modifications: Array<{ key: Modification; label: string; value: number }> = [
   { key: 'shorter', label: 'Shorter casting time', value: -1 },
   { key: 'longer', label: 'Longer casting time', value: 1 },
   { key: 'range', label: 'Greater range', value: -1 },
   { key: 'cheaper', label: 'Lower costs', value: -1 },
   { key: 'force', label: 'Force (higher costs)', value: 1 },
]
// source: DSA5 Regelwerk, S. 313 (Zeremonie: place and time, only one of each; consecrated tradition artefact +1)
const places = [['None', 0], ['Holy site of the deity', 2], ['Temple of the deity', 1], ['Temple outside the pantheon', -1], ['Temple of a hostile god', -2],
   ['Unholy site of an archdemon', -3], ['Unholy site of the Nameless One', -4], ['Unholy site of the deity’s adversary', -5]] as const
const times = [['None', 0], ['Month of the deity', 1], ['Holiday of the deity', 2], ['Nameless Days', -5]] as const
const botchColors = ['#7c3aed', '#b7791f']

export function LiturgyProbeDialog({ stats, liturgy, value, onClose }: { stats: Stats; liturgy: Liturgy; value: number; onClose: () => void }) {
   const language = useLanguageStore((state) => state.language)
   const check = useCheckState(stats, 'talent', `liturgy:${liturgy.key}`, { complex: true })
   const ceremony = liturgy.kind === 'Zeremonie'
   const [resistance, setResistance] = useState(0)
   const [sustained, setSustained] = useState(0)
   const [omitted, setOmitted] = useState({ prayer: false, gesture: false })
   const [mods, setMods] = useState<Modification[]>([])
   const [place, setPlace] = useState(0)
   const [time, setTime] = useState(0)
   const [artifact, setArtifact] = useState(false)
   const [kapDraft, setKapDraft] = useState<string | null>(null)
   const [spent, setSpent] = useState<number | null>(null)
   const [botch, setBotch] = useState<number | null>(null)
   const spend = useKarmaSpend(stats, setSpent)
   // source: DSA5 Regelwerk, S. 309 (one modification per 4 full FW)
   const allowed = Math.floor(value / 4)
   const available = (key: Modification) => (key !== 'cheaper' && key !== 'force') || liturgy.costModifiable
   const blockedMod = (key: Modification) => !available(key) || (key === 'range' && liturgy.range === 'selbst') ||
      (key === 'shorter' && mods.includes('longer')) || (key === 'longer' && mods.includes('shorter')) ||
      (key === 'cheaper' && mods.includes('force')) || (key === 'force' && mods.includes('cheaper'))
   // source: DSA5 Regelwerk, S. 308, 311, 314 (SK/ZK of the target; −1 per sustained liturgy; prayer/gesture omitted −2 each, not for ceremonies)
   const extraSources: ProbeExtraSource[] = [
      ...(resistance ? [{ label: `Target ${liturgy.resistance}`, value: -resistance }] : []),
      ...(sustained ? [{ label: 'Sustained liturgies', value: -sustained }] : []),
      ...(!ceremony && omitted.prayer ? [{ label: 'Without prayer', value: -2 }] : []),
      ...(!ceremony && omitted.gesture ? [{ label: 'Without gesture', value: -2 }] : []),
      ...mods.map((key) => ({ label: modifications.find((entry) => entry.key === key)!.label, value: modifications.find((entry) => entry.key === key)!.value })),
      ...(ceremony && place ? [{ label: 'Place', value: places[place][1] }] : []),
      ...(ceremony && time ? [{ label: 'Time', value: times[time][1] }] : []),
      ...(ceremony && artifact ? [{ label: 'Consecrated tradition artefact', value: 1 }] : []),
   ]
   const toggle = (key: Modification) => setMods((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])

   const setup = <fieldset className='probe-difficulty probe-spell-modifiers'>
      <legend>{t(ceremony ? 'Ceremony modifiers' : 'Liturgy modifiers', language)}</legend>
      {liturgy.resistance && <div className='probe-difficulty-custom'>
         <span>{t(`Target ${liturgy.resistance}`, language)}<small>{t('Lowers all three attributes, not FW.', language)}</small></span>
         <ProbeStepper value={resistance} min={0} max={20} label={t(`Target ${liturgy.resistance}`, language)} lowerLabel={t('Less', language)} raiseLabel={t('More', language)} onChange={setResistance} />
      </div>}
      <div className='probe-difficulty-custom'>
         <span>{t('Sustained liturgies', language)}<small>{t('−1 per liturgy or spell you are sustaining (S. 321).', language)}</small></span>
         <ProbeStepper value={sustained} min={0} max={10} label={t('Sustained liturgies', language)} lowerLabel={t('Less', language)} raiseLabel={t('More', language)} onChange={setSustained} />
      </div>
      {!ceremony && <div className='probe-check-row'>
         {(['prayer', 'gesture'] as const).map((key) => <label key={key}><input type='checkbox' checked={omitted[key]}
            onChange={(event) => setOmitted({ ...omitted, [key]: event.target.checked })} />{t(key === 'prayer' ? 'Without prayer (−2)' : 'Without gesture (−2)', language)}</label>)}
         <small>{t('S.', language)} 310</small>
      </div>}
      {ceremony && <div className='creation-row-fields'>
         <label className='field-group'><span>{t('Place', language)}</span>
            <select value={place} onChange={(event) => setPlace(Number(event.target.value))}>
               {places.map(([name, modifier], index) => <option key={name} value={index}>{t(name, language)}{modifier ? ` (${modifier > 0 ? '+' : ''}${modifier})` : ''}</option>)}
            </select></label>
         <label className='field-group'><span>{t('Time', language)}</span>
            <select value={time} onChange={(event) => setTime(Number(event.target.value))}>
               {times.map(([name, modifier], index) => <option key={name} value={index}>{t(name, language)}{modifier ? ` (${modifier > 0 ? '+' : ''}${modifier})` : ''}</option>)}
            </select></label>
         <label className='probe-check-row'><input type='checkbox' checked={artifact} onChange={(event) => setArtifact(event.target.checked)} />
            {t('Consecrated tradition artefact (+1)', language)}</label>
      </div>}
      <div className='probe-check-row'>
         <span>{t('Modifications: {used} / {count}', language).replace('{used}', String(mods.length)).replace('{count}', String(allowed))}</span>
         {modifications.map((entry) => <label key={entry.key}><input type='checkbox' checked={mods.includes(entry.key)}
            disabled={!mods.includes(entry.key) && (mods.length >= allowed || blockedMod(entry.key))} onChange={() => toggle(entry.key)} />
            {t(entry.label, language)} ({entry.value > 0 ? '+' : ''}{entry.value})</label>)}
         <small>{t('S.', language)} {ceremony ? 313 : 310}</small>
      </div>
      {!liturgy.costModifiable && <p className='probe-spell-hint'>{t('The costs of this liturgy cannot be modified.', language)}</p>}
   </fieldset>

   function karmaCost({ result }: ProbeResultState) {
      const outcome = result.outcome === 'critical' || result.outcome === 'spectacular' ? 'critical' : result.success ? 'success' : 'failure'
      const suggested = suggestedLiturgyCost(liturgy.cost, outcome)
      const draft = kapDraft ?? String(suggested ?? '')
      const amount = Number(draft)
      const valid = Number.isInteger(amount) && amount > 0
      const current = stats.karmaEnergy.current ?? stats.karmaEnergy.max
      const basis = outcome === 'success' ? 'Success: full costs.' : outcome === 'critical' ? 'Critical success: half costs, +1W6 FP if useful (S. 314).'
         : 'Failed: half of base costs + first interval (S. 311).'
      const isBotch = result.outcome === 'botch' || result.outcome === 'disaster'
      return <>
         <section className='probe-asp' aria-label={t('Karma energy', language)}>
            <p className='probe-fate-balance'><Sparkles size={16} />{t('Karma energy', language)}: <strong>{current} / {stats.karmaEnergy.max} KaP</strong>
               <small> · {t('Costs', language)} {liturgy.cost}</small></p>
            <p className='probe-spell-hint'>{t(basis, language)}{suggested === null && ` ${t('Variable costs: check the liturgy and adjust the amount.', language)}`}</p>
            {spent !== null ? <p className='probe-asp-spent'><Check size={16} />{t('{amount} KaP spent.', language).replace('{amount}', String(spent))}</p>
               : <div className='probe-asp-actions'>
                  <input type='number' inputMode='numeric' min={1} step={1} value={draft} aria-label={t('KaP amount', language)}
                     onFocus={(event) => event.target.select()} onChange={(event) => setKapDraft(event.target.value)} />
                  <button className='primary-button' type='button' disabled={!valid || amount > current || spend.isPending}
                     onClick={() => spend.mutate({ amount })}>{t('Spend KaP', language)}</button>
                  {valid && amount > current && <small>{t('Not enough KaP: the liturgy fails (S. 306).', language)}</small>}
               </div>}
            {/* source: DSA5 Regelwerk, S. 315 (one level of Entrückung per 10 full KaP spent within a day) */}
            <p className='probe-spell-hint'>{t('Every 10 full KaP spent within a day give one level of Entrückung (S. 315); set it in the Zustände.', language)}</p>
         </section>
         {isBotch && <section className='probe-asp' aria-label={t('Liturgy botch table', language)}>
            <p className='probe-spell-hint'>{t('Optional rule: your group may play without botches on liturgies (S. 311).', language)}</p>
            {botch !== null ? <><p className='probe-fate-balance'><Dices size={16} />2W6 = {botch}</p><p lang='de'>{liturgyBotchTable[botch][language]}</p></>
               : <button className='quiet-button' type='button' onClick={() => void throwColoredDice(6, botchColors).then(([a, b]) => setBotch(a + b))}>
                  <Dices size={16} />{t('Roll the liturgy botch table (2W6)', language)}</button>}
         </section>}
      </>
   }

   return <ProbeDialog stats={stats} eyebrow={t(ceremony ? 'Ceremony check' : 'Liturgy check', language)} title={liturgy.key} probe={liturgy.probe} value={value}
      check={check} extraSources={extraSources} setup={setup} criticalBonus
      onReset={() => { setKapDraft(null); setSpent(null); setBotch(null) }} onClose={onClose} renderResult={karmaCost} />
}

