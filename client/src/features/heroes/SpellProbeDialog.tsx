import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Dices, Gem, Music, Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { throwColoredDice } from '@/components/diceEngine'
import { useLanguageStore } from '@/locales/languageStore'
import { t, translateRuleLabel } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { activeEffectsKey, startAbilityEffect, type AbilityEffect } from './activeEffectsApi'
import { useSpellCheck } from './checkState'
import { adjustHealth } from './combatApi'
import { joinFightAs, useSettings } from './fightHelpers'
import { radau } from './fightAllies'
import { useFightStore } from './fightStore'
import { astralSpendNote, foreignSource, spellRules, suggestedSpellCost, useManaSpend, type MagicReference, type MagicSpell } from './magicApi'
import { modificationLabel, propertyProbes, ritualModifications, ritualSiteOptions, spellPatzerTable, staffFoci, withPowerFocus } from './magicRules'
import { ModificationRules } from './ModificationRules'
import { ProbeDialog, ProbeStepper, type ProbeExtraSource, type ProbeResultState } from './ProbeDialog'
import type { Stats } from './statsApi'
import { talentCatalog } from './talentCatalog'
import { TalentProbeDialog } from './TalentProbeDialog'
import { useTalentOptions } from './talentOptions'

const patzerColors = ['#7c3aed', '#b7791f']
const songEffects: AbilityEffect[] = ['Melodie der Kunstfertigkeit', 'Zaubermelodie']

// `extraSources` / `renderAfter`: used by a running Sammelprobe (penalty, "Record attempt") and the ARCANOVI flow.
// `costMode: 'failure'` shows the AsP section only after a failed check (the ARCANOVI result pays the full costs itself).
// `initialModifications`: chosen before casting in a fight (Zauberdauer senken/erhöhen, S. 256).
export function SpellProbeDialog({ stats, spell, reference, value, extraSources: extra = [], renderAfter, costMode = 'normal', initialModifications = [], onClose }: {
   stats: Stats; spell: MagicSpell; reference: MagicReference; value: number; extraSources?: ProbeExtraSource[]
   renderAfter?: (state: ProbeResultState) => ReactNode; costMode?: 'normal' | 'failure'; initialModifications?: string[]; onClose: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const check = useSpellCheck(stats, spell.key)
   const rules = spellRules(stats, spell, reference, value)
   const { propertyProbe, spellPatzer } = useTalentOptions()
   const curse = spell.kind === 'Hexenfluch'
   const song = spell.kind === 'Elfenlied'
   const ritual = spell.kind === 'Ritual'
   const witch = stats.generalSpecialAbilities.includes('Tradition (Hexe)')
   const foci = staffFoci(stats)
   const [resistance, setResistance] = useState(0)
   const [sustained, setSustained] = useState(0)
   const [omitted, setOmitted] = useState({ formula: false, gesture: false })
   const [ground, setGround] = useState(0)
   const [emotion, setEmotion] = useState(0)
   const [ritualSetup, setRitualSetup] = useState({ site: 0, time: 0, clothing: false, tools: false })
   const [mods, setMods] = useState<string[]>(initialModifications)
   const [preQuality, setPreQuality] = useState(0)
   const [preCheck, setPreCheck] = useState<string | null>(null)
   const [aspDraft, setAspDraft] = useState<string | null>(null)
   const [lepDraft, setLepDraft] = useState('0')
   const [forbiddenOk, setForbiddenOk] = useState(false)
   const [spent, setSpent] = useState<number | null>(null)
   const [patzer, setPatzer] = useState<number | null>(null)
   const [weapon, setWeapon] = useState('')
   const [broomJoined, setBroomJoined] = useState(false)
   const fightRunning = useFightStore((state) => Boolean(state.fights[stats.charId]))
   const resistanceLabel = curse ? 'Target SK/ZK (halved)' : `Target ${spell.resistance}`
   const owns = (name: string) => stats.generalSpecialAbilities.includes(name)
   const modificationValue = mods.reduce((sum, key) => sum + (ritualModifications.find((entry) => entry.key === key)?.value ?? 0), 0)
   // source: DSA5 Regelwerk, S. 253–254, 281 (SK/ZK lowers all three attributes; curses use half), S. 285–286 (−1 per sustained spell),
   // S. 255 (formula/gesture omitted −2 each), S. 278 (witch: −1 per Schritt above ground, max −8; emotions up to ±2),
   // S. 260–261 (ritual site, constellation, clothing, equipment; ritual modifications), S. 277 (Merkmalsfokus +1)
   const extraSources: ProbeExtraSource[] = [
      ...(rules.foreign ? [foreignSource] : []),
      ...(resistance ? [{ label: resistanceLabel, value: -resistance }] : []),
      ...(sustained ? [{ label: 'Sustained spells', value: -sustained }] : []),
      ...(omitted.formula ? [{ label: 'Without formula', value: -2 }] : []),
      ...(omitted.gesture ? [{ label: 'Without gesture', value: -2 }] : []),
      ...(witch && ground ? [{ label: 'Hexe: no ground contact', value: -ground }] : []),
      ...(witch && emotion ? [{ label: 'Hexe: emotions', value: emotion }] : []),
      ...(ritualSetup.site ? [{ label: 'Ritual site', value: ritualSetup.site }] : []),
      ...(ritualSetup.time ? [{ label: 'Constellation', value: ritualSetup.time }] : []),
      ...(ritualSetup.clothing ? [{ label: 'Matching clothing', value: 1 }] : []),
      ...(ritualSetup.tools ? [{ label: 'Suitable equipment', value: 1 }] : []),
      ...(modificationValue ? [{ label: ritual ? 'Ritual modifications' : 'Spell modifications', value: modificationValue }] : []),
      ...(foci.properties.includes(spell.property) ? [{ label: 'Merkmalsfokus', value: 1 }] : []),
      ...extra,
   ]
   const spend = useManaSpend(stats, setSpent)
   const settings = useSettings(stats)
   const lifeSpend = useMutation({
      mutationFn: (amount: number) => adjustHealth(stats._id, 'damage', amount),
      onSuccess: (next) => queryClient.setQueryData(['stats', stats.charId], next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const effect = useMutation({
      mutationFn: ({ ability, quality, target }: { ability: AbilityEffect; quality: number; target?: string }) =>
         startAbilityEffect(stats._id, ability, quality, target),
      onSuccess: ({ stats: next, effects }) => {
         queryClient.setQueryData(['stats', stats.charId], next)
         queryClient.setQueryData(activeEffectsKey(stats._id), effects)
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const wildMagic = stats.disadvantages.includes('Wilde Magie')
   const probe = propertyProbe ? propertyProbes[spell.property] ?? spell.probe : spell.probe
   const songTalents = spell.songTalent === 'both' ? ['singen', 'musizieren'] : spell.songTalent ? [spell.songTalent] : []

   function toggleModification(key: string) {
      const entry = ritualModifications.find((item) => item.key === key)!
      setMods((current) => current.includes(key) ? current.filter((item) => item !== key)
         : [...current.filter((item) => !('excludes' in entry) || item !== entry.excludes), key])
   }

   const setup = <fieldset className='probe-difficulty probe-spell-modifiers'>
      <legend>{t(song ? 'Song modifiers' : ritual ? 'Ritual modifiers' : 'Spell modifiers', language)}</legend>
      {spell.resistance && <div className='probe-difficulty-custom'>
         <span>{t(resistanceLabel, language)}<small>{t(curse ? 'Enter half the target’s value; the GM rounds.' : 'Lowers all three attributes, not FW.', language)}</small></span>
         <ProbeStepper value={resistance} min={0} max={20} label={t(resistanceLabel, language)}
            lowerLabel={t('Less', language)} raiseLabel={t('More', language)} onChange={setResistance} />
      </div>}
      <div className='probe-difficulty-custom'>
         <span>{t('Sustained spells', language)}<small>{t('−1 per spell or liturgy you are sustaining.', language)}</small></span>
         <ProbeStepper value={sustained} min={0} max={10} label={t('Sustained spells', language)}
            lowerLabel={t('Less', language)} raiseLabel={t('More', language)} onChange={setSustained} />
      </div>
      {spell.kind === 'Zauberspruch' && <div className='probe-check-row'>
         {(['formula', 'gesture'] as const).map((key) => <label key={key}><input type='checkbox' checked={omitted[key]}
            onChange={(event) => setOmitted({ ...omitted, [key]: event.target.checked })} />{t(key === 'formula' ? 'Without formula (−2)' : 'Without gesture (−2)', language)}</label>)}
         <small>{t('S.', language)} 255</small>
      </div>}
      {witch && <>
         <div className='probe-difficulty-custom'>
            <span>{t('Schritt above the ground', language)}<small>{t('Hexe: −1 per Schritt without ground contact, at most −8 (S. 278).', language)}</small></span>
            <ProbeStepper value={ground} min={0} max={8} label={t('Schritt above the ground', language)}
               lowerLabel={t('Less', language)} raiseLabel={t('More', language)} onChange={setGround} />
         </div>
         <div className='probe-difficulty-custom'>
            <span>{t('Emotions', language)}<small>{t('Matching feelings up to +2, opposing or dampened up to −2 (S. 278).', language)}</small></span>
            <ProbeStepper value={emotion} min={-2} max={2} label={t('Emotions', language)}
               lowerLabel={t('Harder', language)} raiseLabel={t('Easier', language)} onChange={setEmotion} />
         </div>
      </>}
      {(ritual || song) && <>
         {ritualSiteOptions.map((group) => <div key={group.key} className='probe-segmented'>
            {group.options.map((option) => <button key={option.value} type='button' aria-pressed={ritualSetup[group.key] === option.value}
               className={ritualSetup[group.key] === option.value ? 'is-active' : ''}
               onClick={() => setRitualSetup({ ...ritualSetup, [group.key]: option.value })}>
               {t(option.label, language)}{option.value ? ` (${option.value > 0 ? '+' : ''}${option.value})` : ''}
            </button>)}
         </div>)}
         <div className='probe-check-row'>
            {!song && <label><input type='checkbox' checked={ritualSetup.clothing}
               onChange={(event) => setRitualSetup({ ...ritualSetup, clothing: event.target.checked })} />{t('Matching clothing (+1)', language)}</label>}
            <label><input type='checkbox' checked={ritualSetup.tools}
               onChange={(event) => setRitualSetup({ ...ritualSetup, tools: event.target.checked })} />{t('Suitable equipment (+1)', language)}</label>
            <small>{t('S.', language)} 260</small>
         </div>
      </>}
      {(ritual || spell.kind === 'Zauberspruch') && rules.modifications > 0 && <div className='probe-check-row'>
         <span>{t(ritual ? 'Ritual modifications: {used} / {count}' : 'Spell modifications: {used} / {count}', language)
            .replace('{used}', String(mods.length)).replace('{count}', String(rules.modifications))}</span>
         {ritualModifications.map((entry) => {
            const disabled = !mods.includes(entry.key) && (mods.length >= rules.modifications ||
               ('needsCost' in entry && !spell.costModifiable) || ('needsRange' in entry && !spell.rangeModifiable))
            return <label key={entry.key}><input type='checkbox' checked={mods.includes(entry.key)} disabled={disabled}
               onChange={() => toggleModification(entry.key)} /><span lang='de'>{modificationLabel(entry.key, ritual)}</span> ({entry.value > 0 ? '+' : ''}{entry.value})</label>
         })}
         <small>{t('S.', language)} {ritual ? 261 : 256}</small>
      </div>}
      {song && <div className='probe-difficulty-custom'>
         <span>{t('Pre-check QS', language)}<small>{t('Each QS of the Singen (Zweistimmiger Gesang) or Musizieren check adds 1 FP (S. 283).', language)}</small></span>
         <ProbeStepper value={preQuality} min={0} max={6} label={t('Pre-check QS', language)}
            lowerLabel={t('Less', language)} raiseLabel={t('More', language)} onChange={setPreQuality} />
         {songTalents.map((key) => <button key={key} type='button' className='quiet-button' onClick={() => setPreCheck(key)}>
            <Music size={15} />{t(talentCatalog.find((talent) => talent.key === key)!.label, language)}
         </button>)}
      </div>}
      {(ritual || spell.kind === 'Zauberspruch') && <ModificationRules ritual={ritual} available={rules.modifications} />}
      {rules.foreign && <p className='probe-spell-hint'>{t('Foreign tradition: check −2. Modifications require the matching Merkmalskenntnis.', language)}</p>}
      {propertyProbe && <p className='probe-spell-hint'>{t('Optional rule Merkmalsproben: the check uses the Merkmal’s attributes (S. 252).', language)}</p>}
      {wildMagic && <p className='probe-spell-hint'>{t('Wilde Magie: a 19 counts as a 20 for botches (S. 179).', language)}</p>}
   </fieldset>

   return <>
      <ProbeDialog stats={stats} eyebrow={curse ? 'Curse check' : song ? 'Song check' : ritual ? 'Ritual check' : 'Spell check'} title={spell.key}
         probe={probe} value={value} check={check} extraSources={extraSources} setup={setup} criticalBonus botchFrom={wildMagic ? 19 : 20}
         extraSkillPoints={preQuality ? [{ label: 'Pre-check QS', value: preQuality }] : []}
         onReset={() => { setAspDraft(null); setSpent(null); setPatzer(null); setForbiddenOk(false); setLepDraft('0') }} onClose={onClose}
         renderResult={(state) => <>{spellExtras(state)}{(costMode === 'normal' || !state.result.success) && spellCost(state)}{renderAfter?.(state)}</>} />
      {preCheck && <TalentProbeDialog stats={stats} talent={talentCatalog.find((talent) => talent.key === preCheck)!}
         value={stats.talents.find((entry) => entry.key === preCheck)?.value ?? 0} onClose={() => setPreCheck(null)}
         renderResult={({ result, quality }) => result.success && quality ? <button className='primary-button' type='button'
            onClick={() => { setPreQuality(quality); setPreCheck(null) }}><Check size={16} />{t('Use QS {quality} for the song', language).replace('{quality}', String(quality))}</button> : null} />}
   </>

   function spellExtras({ result, quality }: ProbeResultState) {
      const botch = result.outcome === 'botch' || result.outcome === 'disaster'
      const entry = patzer !== null ? spellPatzerTable[patzer] : null
      const weapons = [...new Set(stats.equipment.filter((item) => item.amount > 0).map((item) => item.item))]
      return <>
         {/* source: DSA5 Regelwerk, S. 258 (optional Patzertabelle für Zaubersprüche, 2W6) */}
         {botch && spellPatzer && <section className='probe-asp' aria-label={t('Spell botch table', language)}>
            {entry ? <>
               <p className='probe-fate-balance'><Dices size={16} />2W6 = {patzer}</p>
               <p lang='de'>{entry[language]}</p>
               {entry.action === 'drainAsp' && stats.mana.current > 0 && <button className='quiet-button' type='button' disabled={spend.isPending}
                  onClick={() => spend.mutate(stats.mana.current)}>{t('Lose all AsP', language)}</button>}
               {entry.action === 'stupor' && <button className='quiet-button' type='button' disabled={settings.isPending}
                  onClick={() => settings.mutate({ conditions: { ...stats.combatConditions, Betäubung: Math.min(4, (stats.combatConditions.Betäubung ?? 0) + 1) } })}>
                  {t('Betäubung +1', language)}</button>}
            </> : <button className='quiet-button' type='button' onClick={() => void throwColoredDice(6, patzerColors).then(([a, b]) => setPatzer(a + b))}>
               <Dices size={16} />{t('Roll the spell botch table (2W6)', language)}
            </button>}
         </section>}
         {/* source: DSA5 Regelwerk, S. 284 (song effects), S. 268, 301 (ZAUBERKLINGE makes a weapon magical for QS × 3 days) */}
         {result.success && quality && songEffects.includes(spell.key as AbilityEffect) && <section className='probe-asp'>
            {effect.isSuccess ? <p className='probe-asp-spent'><Check size={16} />{t('Effect started.', language)}</p>
               : <button className='primary-button' type='button' disabled={effect.isPending}
                  onClick={() => effect.mutate({ ability: spell.key as AbilityEffect, quality })}><Sparkles size={16} />{t('Start the song’s effect', language)}</button>}
         </section>}
         {result.success && quality && spell.key === 'Zauberklinge Geisterspeer' && <section className='probe-asp'>
            {effect.isSuccess ? <p className='probe-asp-spent'><Check size={16} />{t('The weapon is magical for {days} days.', language).replace('{days}', String(quality * 3))}</p>
               : <div className='probe-asp-actions'>
                  <select value={weapon} onChange={(event) => setWeapon(event.target.value)} aria-label={t('Weapon', language)}>
                     <option value=''>{t('Choose a weapon', language)}</option>
                     {weapons.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <button className='primary-button' type='button' disabled={!weapon || effect.isPending}
                     onClick={() => effect.mutate({ ability: 'Zauberklinge Geisterspeer', quality, target: weapon })}><Sparkles size={16} />{t('Enchant the weapon', language)}</button>
               </div>}
         </section>}
         {/* source: DSA5 Regelwerk, S. 297 (Radau: the broom attacks on its own with INI 12+1W6, AT 10+QS) */}
         {result.success && quality && spell.key === 'Radau' && <section className='probe-asp'>
            {broomJoined ? <p className='probe-asp-spent'><Check size={16} />{t('The broom joined the fight.', language)}</p>
               : fightRunning ? <button className='primary-button' type='button' onClick={() => void joinFightAs(stats.charId, { kind: 'radau', quality }, 'Radau', radau.initiative, radau.speed)
                  .then(() => setBroomJoined(true))}><Sparkles size={16} />{t('Bring the broom into the fight', language)}</button>
               : <p className='probe-spell-hint'>{t('Start a fight on the Combat tab to let the broom fight there.', language)}</p>}
         </section>}
      </>
   }

   function spellCost({ result }: ProbeResultState) {
      const outcome = result.outcome === 'critical' || result.outcome === 'spectacular' ? 'critical' : result.success ? 'success' : 'failure'
      const suggestion = suggestedSpellCost(spell.cost, outcome, witch)
      const suggested = suggestion.amount === null ? null : withPowerFocus(suggestion.amount, foci.powerFocus)
      const draft = aspDraft ?? String(suggested ?? '')
      const amount = Number(draft)
      const valid = Number.isInteger(amount) && amount > 0
      // source: DSA5 Regelwerk, S. 285 (Verbotene Pforten: LeP instead of AsP, at least 1 AsP, after a Selbstbeherrschung check)
      const forbidden = owns('Verbotene Pforten')
      const life = forbidden ? Math.max(0, Math.min(amount - 1, Math.trunc(Number(lepDraft)) || 0)) : 0
      const astral = amount - life
      const tooMuch = valid && astral > stats.mana.current
      const basis = outcome === 'success' ? 'Success: full costs.' : outcome === 'critical' ? 'Critical success: half costs (S. 258).'
         : witch ? 'Failed: one third of base costs + first interval (S. 278).' : 'Failed: half of base costs + first interval (S. 258).'
      return <section className='probe-asp' aria-label={t('Astral energy', language)}>
         <p className='probe-fate-balance'><Gem size={16} />{t('Astral energy', language)}: <strong>{stats.mana.current} / {stats.mana.max} AsP</strong>
            <small> · {t('Costs', language)} {spell.cost} AsP</small></p>
         <p className='probe-spell-hint'>{t(basis, language)}{!suggestion.exact && ` ${t('Variable costs: check the spell and adjust the amount.', language)}`}
            {foci.powerFocus && ` ${t('Kraftfokus: −1 AsP, at least 1 (S. 277).', language)}`}</p>
         {spent !== null ? <p className='probe-asp-spent'><Check size={16} />{t('{amount} AsP spent.', language).replace('{amount}', () => String(spent))}
            {life > 0 && ` + ${life} ${t('LeP', language)}`}</p>
            : <div className='probe-asp-actions'>
               <input type='number' inputMode='numeric' min={1} step={1} value={draft} aria-label={t('AsP amount', language)}
                  onFocus={(event) => event.target.select()} onChange={(event) => setAspDraft(event.target.value)} />
               {forbidden && <>
                  <label className='probe-inline-field'>{t('of it as LeP', language)}
                     <input type='number' inputMode='numeric' min={0} step={1} value={lepDraft} aria-label={t('LeP instead of AsP', language)}
                        onFocus={(event) => event.target.select()} onChange={(event) => setLepDraft(event.target.value)} /></label>
                  {life > 0 && <label><input type='checkbox' checked={forbiddenOk} onChange={(event) => setForbiddenOk(event.target.checked)} />
                     {t('Selbstbeherrschung succeeded (otherwise the spell fails)', language)}</label>}
               </>}
               <button className='quiet-button' type='button' disabled={!valid || tooMuch || spend.isPending || (life > 0 && !forbiddenOk)}
                  onClick={() => { spend.mutate(astral); if (life > 0) lifeSpend.mutate(life) }}><Gem size={16} />{t('Spend AsP', language)}</button>
               {tooMuch && <small className='field-error'>{t('Not enough AsP.', language)}</small>}
               {astralSpendNote(stats).map((note) => <small key={note}>{t(note, language)}</small>)}
               {forbidden && <small>{translateRuleLabel('Verbotene Pforten', language)}: {t('at least 1 AsP per spell (S. 285).', language)}</small>}
            </div>}
      </section>
   }
}
