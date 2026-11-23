import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HeartPulse, Info, Pencil, Plus, Shield, Swords, Trash2 } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useLanguageStore } from '@/locales/languageStore'
import { t, translateRuleLabel } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import type { AventurianStoreItem } from '@/utils/aventurian_store'
import { Tooltip } from '@/components/Tooltip'
import {
   addCombatAbility, getCombatReference, levelUpCombatTechnique, removeCombatAbility, updateCombatSettings,
   type CombatReference, type CombatRequirement, type CombatSettingsInput,
} from './combatApi'
import type { Hero } from './heroApi'
import { getStatsForHero, type EquipmentEntry, type Stats } from './statsApi'
import { CheckValue, ModifiedValue } from './CheckValue'
import { getAttributeAbbreviation } from './talentCatalog'
import { AdvancementValue, APToggle } from './AdvancementControls'
import { nextStepCost, useAdvancementMode } from './advancement'
import { combatStoreItems, damageBonus } from './combatGear'
import { FightPanel } from './FightPanel'
import { passiveParryBonus } from './combatSituation'
import { ConditionBadge } from './WeaponRepair'
import { conditionTooltip, statusInfo, statusTooltip } from './conditionInfo'
import { useFightStore } from './fightStore'
import { soulPowerSources, useActiveEffects } from './activeEffectsApi'
import { speciesSpeed, speedBaseBreakdown, speedBaseValue } from './energy'
import { DieIcon } from '@/components/DieIcon'
import { throwColoredDice } from '@/components/diceEngine'
import { heroInitiative } from './fightHelpers'

const initialCombatSchema = z.object({
   modifiers: z.object({
      initiative: z.coerce.number().int().min(-100).max(100),
      speed: z.coerce.number().int().min(-100).max(100),
      speedBase: z.number().int().min(0).max(100).nullable(),
   }),
})

function requirementLabel(requirement: CombatRequirement, language: 'de' | 'en') {
   if ('attribute' in requirement) return `${getAttributeAbbreviation(requirement.attribute, language)} ${requirement.minimum}`
   if ('talent' in requirement) return `${t(requirement.talent === 'reiten' ? 'Reiten' : 'Körperbeherrschung', language)} ${requirement.minimum}`
   return translateRuleLabel(requirement.ability, language)
}

function meetsRequirement(requirement: CombatRequirement, stats: Stats) {
   if ('attribute' in requirement) return stats[requirement.attribute] >= requirement.minimum
   if ('talent' in requirement) return (stats.talents.find((entry) => entry.key === requirement.talent)?.value ?? 0) >= requirement.minimum
   return stats.combatSpecialAbilities.includes(requirement.ability)
}

function RuleSource({ pages, language }: { pages: string; language: 'de' | 'en' }) {
   return (
      <Tooltip content={`${t('DSA5 Rulebook', language)}, ${t('S.', language)} ${pages}`} className='tooltip-icon-wrapper' clickToToggle lang={language}>
         <Info size={15} aria-label={t('Rule source', language)} />
      </Tooltip>
   )
}

function AbilityHint({ ability, language }: {
   ability: CombatReference['abilities'][number] | undefined
   language: 'de' | 'en'
}) {
   const content = ability?.effect
      ? `${translateRuleLabel(ability.key, language)}: ${ability.effect[language]} · ${t('DSA5 Rulebook', language)}, ${t('S.', language)} ${ability.effect.page}`
      : t('No verified rule description for this custom ability.', language)
   return (
      <Tooltip content={content} className='tooltip-icon-wrapper' clickToToggle lang={language}>
         <Info size={16} aria-label={t('Ability effect', language)} />
      </Tooltip>
   )
}

function SheetTable({ columns, rows, empty, language }: {
   columns: string[]
   rows: Array<{ key: string; cells: ReactNode[] }>
   empty: string
   language: 'de' | 'en'
}) {
   if (!rows.length) return <p className='combat-empty'>{t(empty, language)}</p>
   return (
      <div className='combat-table-scroll'>
      <table className='talent-table combat-table' lang={language}>
         <thead><tr>{columns.map((column) => <th key={column} scope='col'>{t(column, language)}</th>)}</tr></thead>
         <tbody>{rows.map((row) => (
            <tr key={row.key}>{row.cells.map((cell, index) => (
               <td key={columns[index]} data-label={t(columns[index], language)}>
                  {['Weapon', 'Combat technique', 'Armor', 'Shield', 'Condition', 'Ammunition'].includes(columns[index]) && typeof cell === 'string'
                     ? t(cell, language) : cell}
               </td>
            ))}</tr>
         ))}</tbody>
      </table>
      </div>
   )
}

function InitialCombatForm({ stats, pending, onSave, onCancel, language }: {
   stats: Stats
   pending: boolean
   onSave: (values: CombatSettingsInput) => void
   onCancel: () => void
   language: 'de' | 'en'
}) {
   function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      const speedBase = String(data.get('speedBase') ?? '').trim()
      const result = initialCombatSchema.safeParse({
         modifiers: {
            initiative: data.get('initiative'),
            speed: data.get('speed'),
            speedBase: speedBase === '' ? null : Number(speedBase),
         },
      })
      if (!result.success) {
         toast.error(t('Please correct the highlighted values.', language))
         return
      }
      onSave(result.data)
   }
   return (
      <form className='combat-initial-form' onSubmit={submit}>
         <div className='combat-input-grid'>
            <label className='field-group'>
               <span>{t('Initiative modifier', language)}</span>
               <input name='initiative' type='number' min={-100} max={100} step={1} required defaultValue={stats.combatModifiers.initiative} />
            </label>
            <label className='field-group'>
               <span>{t('Movement modifier', language)}</span>
               <input name='speed' type='number' min={-100} max={100} step={1} required defaultValue={stats.combatModifiers.speed} />
            </label>
            <label className='field-group'>
               <span>{t('Movement base override', language)}</span>
               <input name='speedBase' type='number' min={0} max={100} step={1}
                  placeholder={t('Use species base', language)} defaultValue={stats.combatModifiers.speedBase ?? ''} />
            </label>
         </div>
         <div className='combat-actions'>
            <button className='quiet-button' type='button' onClick={onCancel} disabled={pending}>{t('Cancel', language)}</button>
            <button className='primary-button' type='submit' disabled={pending}>{t('Save combat values', language)}</button>
         </div>
      </form>
   )
}

type CombatGear = { entry: EquipmentEntry; item: AventurianStoreItem; key: string }

function totalDamage(damage: string, bonus: number | null) {
   if (!bonus) return damage
   const match = /^(\d+W\d+)([+-]\d+)?$/.exec(damage)
   if (!match) return `${damage} + ${bonus}`
   const total = Number(match[2] ?? 0) + bonus
   return `${match[1]}${total > 0 ? '+' : ''}${total === 0 ? '' : total}`
}

export function HeroCombat({ hero }: { hero: Hero }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const statsQuery = useQuery({ queryKey: ['stats', hero._id], queryFn: () => getStatsForHero(hero._id) })
   const referenceQuery = useQuery({ queryKey: ['combat-reference'], queryFn: getCombatReference, staleTime: Infinity })
   const [initialOpen, setInitialOpen] = useState(false)
   const { spendAP } = useAdvancementMode(hero._id)
   const abilityMode = spendAP ? 'purchase' : 'record'
   const [abilityKey, setAbilityKey] = useState('')
   const [removingAbility, setRemovingAbility] = useState<string | null>(null)
   const fight = useFightStore((state) => state.fights[hero._id])
   const startFight = useFightStore((state) => state.start)

   function saved(stats: Stats) {
      queryClient.setQueryData(['stats', hero._id], stats)
      toast.success(t('Combat sheet updated', language))
   }
   const fail = (error: unknown) => toast.error(getErrorMessage(error))
   const techniqueMutation = useMutation({
      mutationFn: ({ key, value }: { key: string; value: number }) => levelUpCombatTechnique(statsQuery.data!._id, key, spendAP, value),
      onSuccess: saved,
      onError: fail,
   })
   const settingsMutation = useMutation({
      mutationFn: (values: CombatSettingsInput) => updateCombatSettings(statsQuery.data!._id, values),
      onSuccess: (stats, values) => { saved(stats); if (values.modifiers) setInitialOpen(false) },
      onError: fail,
   })
   const abilityMutation = useMutation({
      mutationFn: () => addCombatAbility(statsQuery.data!._id, abilityKey.trim(), abilityMode),
      onSuccess: (stats) => { saved(stats); setAbilityKey('') },
      onError: fail,
   })
   const removeAbilityMutation = useMutation({
      mutationFn: (key: string) => removeCombatAbility(statsQuery.data!._id, key, spendAP),
      onSuccess: (stats) => { saved(stats); setRemovingAbility(null) },
      onError: fail,
   })
   const busy = techniqueMutation.isPending || settingsMutation.isPending || abilityMutation.isPending || removeAbilityMutation.isPending

   const running = useActiveEffects(statsQuery.data)
   if (statsQuery.isPending || referenceQuery.isPending) return <p>{t('Loading combat sheet...', language)}</p>
   if (statsQuery.isError || referenceQuery.isError) return (
      <div className='state-panel' role='alert'>
         <p>{getErrorMessage(statsQuery.error ?? referenceQuery.error)}</p>
         <button className='quiet-button' type='button' onClick={() => {
            void statsQuery.refetch()
            void referenceQuery.refetch()
         }}>{t('Retry', language)}</button>
      </div>
   )
   const stats = statsQuery.data
   const reference = referenceQuery.data
   if (!stats || !reference) return <p role='alert'>{t('Combat data is unavailable.', language)}</p>
   const availableAP = stats.experience.total - stats.experience.spent
   const selectedAbility = reference.abilities.find((entry) => entry.key === abilityKey)
   const refundAP = spendAP ? stats.combatAbilityPurchases?.find((entry) => entry.key === removingAbility)?.ap ?? 0 : 0
   const dependentAbilities = reference.abilities.filter((entry) =>
      stats.combatSpecialAbilities.includes(entry.key) &&
      entry.requirements.some((requirement) => 'ability' in requirement && requirement.ability === removingAbility))
   const canPurchase = selectedAbility && selectedAbility.ap <= availableAP &&
      !stats.combatSpecialAbilities.includes(selectedAbility.key) &&
      selectedAbility.requirements.every((requirement) => meetsRequirement(requirement, stats))

   const gear: CombatGear[] = []
   const unknownGear: EquipmentEntry[] = []
   stats.equipment.forEach((entry, index) => {
      const item = combatStoreItems.find((item) => item.name === entry.item)
      if (item) gear.push({ entry, item, key: `${entry.item}-${entry.carriedOn}-${index}` })
      else if (['Melee_Weapons', 'Ranged_Weapons', 'Shields', 'Armor'].includes(entry.category)) unknownGear.push(entry)
   })
   const melee = gear.filter(({ item }) => item.weapon && item.weapon.reach !== 'ranged' && item.kind !== 'shield')
   const ranged = gear.filter(({ item }) => item.weapon?.reach === 'ranged')
   const shields = gear.filter(({ item }) => item.kind === 'shield')
   // source: DSA5 Regelwerk, S. 233 (an equipped shield or Parierwaffe adds its passive PA bonus to the main weapon)
   const held = gear.filter(({ entry, item }) => entry.carriedOn === 'Equipped' && item.weapon && item.weapon.reach !== 'ranged')
      .map(({ item }) => ({ name: item.name, technique: item.weapon!.combatTechnique, parryModifier: item.weapon!.parryModifier, shield: item.kind === 'shield' }))
   const armor = gear.filter(({ item }) => item.armor)
   const { base: initiative, modifier: iniModifier } = heroInitiative(stats)
   // source: DSA5 Regelwerk, S. 274 (Willenstrunk raises SK while it runs; only the strongest counts, S. 272)
   const soulPowerBonus = soulPowerSources(running)
   const soulPowerTotal = soulPowerBonus.reduce((sum, source) => sum + source.value, 0)
   // source: DSA5 Regelwerk, S. 226 (INI = Basiswert + 1W6 ± modifiers, rolled once per fight)
   async function rollInitiative() {
      const [roll] = await throwColoredDice(6, ['#b7791f'])
      startFight(hero._id, { base: initiative, modifier: iniModifier, roll })
   }
   const speciesBase = stats.combatModifiers.speedBase ?? speciesSpeed(hero.species)
   const speedBase = speciesBase === null ? null : speedBaseValue(stats, speciesBase)
   const speed = speedBase === null ? null : Math.max(0, speedBase + stats.combatModifiers.speed)
   const healthPercent = stats.health.max > 0 ? Math.max(0, Math.min(100, stats.health.current / stats.health.max * 100)) : 0

   function submitAbility(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const result = z.string().trim().min(1).max(200).safeParse(abilityKey)
      if (!result.success) { toast.error(t('Enter a combat ability.', language)); return }
      abilityMutation.mutate()
   }

   return (
      <div className='hero-combat' lang={language}>
         <section className='overview-section'>
            <header className='section-heading'>
               <Swords size={20} />
               <div><p className='eyebrow'>{t('Combat record', language)}</p><h2>{t('Combat values', language)}</h2></div>
               <RuleSource pages='40, 56, 226–236, 411' language={language} />
               <button className='quiet-button section-action' type='button' disabled={busy}
                  aria-expanded={initialOpen} onClick={() => setInitialOpen(!initialOpen)}>
                  <Pencil size={16} />{t('Edit combat modifiers', language)}
               </button>
            </header>
            <dl className='combat-summary'>
               {[
                  [t('Movement', language), speed ?? '—', 'GS'],
                  [t('Health', language), `${stats.health.current} / ${stats.health.max}`, 'LeP'],
                  [t('Dodge', language), stats.dodge.max, 'AW'],
                  [t('Initiative', language), `${initiative} + 1W6`, 'INI'],
                  [t('Soul power', language), stats.soulPower.max, 'SK'],
                  [t('Toughness', language), stats.toughness.max, 'ZK'],
               ].map(([label, value, abbreviation]) => (
                  <div key={abbreviation}><dt>{label} <small>{t(String(abbreviation), language)}</small></dt><dd>
                     {abbreviation === 'AW' ? <CheckValue stats={stats} base={stats.dodge.max} kind='defense' checkKey='AW' label={t('AW', language)} />
                        : abbreviation === 'INI' ? <><ModifiedValue base={initiative} modifier={iniModifier}
                           sources={stats.checkModifiers.initiative.sources} checkTarget={false} />
                           {fight ? <span className='combat-initiative-result' title={`W6 ${fight.initiative.roll}`}>
                              = {fight.initiative.base + fight.initiative.modifier + fight.initiative.roll}</span>
                              : <><span className='combat-initiative-dice'>+ 1W6</span>
                                 <button className='talent-probe-button' type='button' aria-label={t('Start fight · roll INI', language)}
                                    title={t('Start fight · roll INI', language)} onClick={() => void rollInitiative()}><DieIcon sides={6} /></button></>}</>
                        : abbreviation === 'SK' && soulPowerTotal ? <ModifiedValue base={stats.soulPower.max} modifier={soulPowerTotal}
                           sources={soulPowerBonus} checkTarget={false} />
                        : abbreviation === 'GS' && speed !== null ? stats.checkModifiers.speed.override !== null
                           // source: DSA5 Regelwerk, S. 34–36 (status sets GS: Liegend 1; Fixiert, Bewegungs-/Handlungsunfähig 0)
                           ? <ModifiedValue base={speed} modifier={stats.checkModifiers.speed.override - speed} checkTarget={false}
                              sources={[{ label: stats.checkModifiers.speed.overrideLabel ?? '', value: stats.checkModifiers.speed.override - speed, page: 36 }]} />
                           : <ModifiedValue base={speed} modifier={stats.checkModifiers.speed.total}
                           sources={stats.checkModifiers.speed.sources} factor={stats.checkModifiers.speed.factor} checkTarget={false} minimum={0}
                           blocked={stats.checkModifiers.speed.blocked ? ['Incapacitated: movement unavailable.'] : []} />
                        : value}
                  </dd></div>
               ))}
            </dl>
            {stats.checkModifiers.unverifiedConditions.length > 0 && <p className='field-error' role='status'>
               {t('No verified automatic modifiers for these conditions; enter their effects manually', language)}:
               {' '}<span>{stats.checkModifiers.unverifiedConditions.map((condition) => t(condition, language)).join(', ')}</span>
            </p>}
            {speed === null && <p className='field-error'>{t('Set a movement base for this custom species.', language)}</p>}
            {speciesBase !== null && speedBaseBreakdown(stats, speciesBase, language) && <p className='combat-note'>{speedBaseBreakdown(stats, speciesBase, language)}</p>}
            {initialOpen && <InitialCombatForm stats={stats} pending={busy} language={language}
               onSave={(values) => settingsMutation.mutate(values)} onCancel={() => setInitialOpen(false)} />}
         </section>

         <FightPanel stats={stats} heroId={hero._id} speed={speed} onRollInitiative={() => void rollInitiative()} />

         <section className='overview-section'>
            <header className='section-heading'><Swords size={19} /><div><h2>{t('Combat techniques', language)}</h2><p>{availableAP} {t('AP available', language)}</p></div><RuleSource pages='39, 50–51, 234–236' language={language} /></header>
            <SheetTable columns={['Combat technique', 'Leading attribute', 'StF', 'KtW', 'AT / FK', 'PA']}
               language={language} empty='Nothing recorded yet.'
               rows={reference.techniques.map((technique) => {
                  const value = stats.combatTechniques.find((entry) => entry.key === technique.key)?.value ?? 6
                  const calculated = stats.combatValues.find((entry) => entry.key === technique.key)
                  // source: DSA5 Regelwerk, S. 39, 166 (Leiteigenschaft + 2, Herausragende Kampftechnik; derived on the server)
                  const maximum = stats.skillMaxima.combatTechniques[technique.key] ?? 25
                  const cost = nextStepCost(value, technique.stfClass)
                  return {
                     key: technique.key,
                     cells: [
                        technique.key, technique.attributes.map((key) => getAttributeAbbreviation(key, language)).join('/'), technique.stfClass.toUpperCase(),
                        <div className='combat-technique-value'>
                           <strong>{value}</strong>
                           <AdvancementValue label={t(technique.key, language)} value={value} minimum={6}
                              maximum={spendAP ? Math.min(25, maximum) : 25} cost={cost} availableAP={availableAP}
                              spendAP={spendAP} pending={busy} onChange={(target) => techniqueMutation.mutate({ key: technique.key, value: target })} />
                        </div>,
                        calculated ? <CheckValue stats={stats} base={calculated.attack} kind={technique.ranged ? 'ranged' : 'attack'}
                           checkKey={technique.key} label={`${t(technique.key, language)} ${t(technique.ranged ? 'FK' : 'AT', language)}`} /> : '—',
                        calculated?.parry != null ? <CheckValue stats={stats} base={calculated.parry} kind='defense'
                           checkKey={technique.key} label={`${t(technique.key, language)} PA`} /> : '—',
                     ],
                  }
               })} />
         </section>

         <section className='overview-section'>
            <header className='section-heading'><Shield size={19} /><h2>{t('Combat special abilities', language)}</h2><RuleSource pages='54–55, 246–250' language={language} /></header>
            {stats.combatSpecialAbilities.length ? <ul className='tag-list combat-ability-list'>{stats.combatSpecialAbilities.map((key) => (
               <li key={key}>
                  <span>{reference.abilities.some((entry) => entry.key === key) ? translateRuleLabel(key, language) : key}</span>
                  <AbilityHint ability={reference.abilities.find((entry) => entry.key === key)} language={language} />
                  <button className='icon-button' type='button' disabled={busy}
                     aria-label={`${t('Remove', language)} ${reference.abilities.some((entry) => entry.key === key) ? translateRuleLabel(key, language) : key}`} onClick={() => setRemovingAbility(key)}>
                     <Trash2 size={16} />
                  </button>
               </li>
            ))}</ul>
               : <p className='combat-empty'>{t('No combat abilities recorded.', language)}</p>}
            {removingAbility && <section className='combat-remove-confirmation' aria-label={t('Remove combat ability', language)}>
               <p><strong>{reference.abilities.some((entry) => entry.key === removingAbility) ? translateRuleLabel(removingAbility, language) : removingAbility}</strong> — {t('Remove this combat ability?', language)}</p>
               <APToggle heroId={hero._id} disabled={busy} />
               <p>{!spendAP ? t('AP unchanged: set or correct values, or advance for free. No automatic refunds.', language) : refundAP > 0
                  ? `${refundAP} AP · ${t('Tracked purchase: these AP will be refunded.', language)}`
                  : t('No tracked purchase: no AP will be refunded.', language)}</p>
               {dependentAbilities.length > 0 && <p role='alert'>
                  {t('Remove dependent abilities first', language)}: <span>{dependentAbilities.map((entry) => translateRuleLabel(entry.key, language)).join(', ')}</span>
               </p>}
               <div className='combat-actions'>
                  <button className='quiet-button' type='button' disabled={busy} onClick={() => setRemovingAbility(null)}>{t('Cancel', language)}</button>
                  <button className='primary-button' type='button' disabled={busy || dependentAbilities.length > 0}
                     onClick={() => removeAbilityMutation.mutate(removingAbility)}>{t('Confirm removal', language)}</button>
               </div>
            </section>}
            <form className='combat-ability-form' onSubmit={submitAbility}>
               <label className='field-group'><span>{t('Combat special ability', language)}</span>
                  {abilityMode === 'purchase' ? <select value={abilityKey} disabled={busy} required onChange={(event) => setAbilityKey(event.target.value)}>
                     <option value=''>{t('Choose an ability', language)}</option>
                     {reference.abilities.filter((entry) => !stats.combatSpecialAbilities.includes(entry.key)).map((entry) =>
                        <option key={entry.key} value={entry.key}>{translateRuleLabel(entry.key, language)} · {entry.ap} AP</option>)}
                  </select> : <input list='combat-ability-options' value={abilityKey} required maxLength={200} disabled={busy} onChange={(event) => setAbilityKey(event.target.value)} />}
               </label>
               <datalist id='combat-ability-options'>{reference.abilities.filter((entry) => !stats.combatSpecialAbilities.includes(entry.key)).map((entry) => <option key={entry.key} value={entry.key} label={translateRuleLabel(entry.key, language)} />)}</datalist>
               <button className='primary-button' type='submit' disabled={busy || !abilityKey.trim() || (abilityMode === 'purchase' && !canPurchase)}>
                  <Plus size={16} />{t(abilityMode === 'purchase' ? 'Purchase ability' : 'Record ability', language)}
               </button>
            </form>
            {selectedAbility && <div className='combat-selected-ability'>
               <span>{translateRuleLabel(selectedAbility.key, language)}</span><AbilityHint ability={selectedAbility} language={language} />
            </div>}
            {selectedAbility && <p className='combat-note'>
               {t('Prerequisites', language)}: {selectedAbility.requirements.map((requirement) => requirementLabel(requirement, language)).join(', ') || t('None', language)}
               {abilityMode === 'purchase' && !canPurchase && ` · ${t('Check prerequisites and available AP.', language)}`}
            </p>}
         </section>

         <section className='overview-section'>
            <header className='section-heading'><Swords size={19} /><h2>{t('Melee weapons', language)}</h2><RuleSource pages='234–236, 366–368' language={language} /></header>
            <SheetTable language={language} empty='No melee weapons in inventory.'
               columns={['Weapon', 'Combat technique', 'Damage bonus', 'TP', 'AT / PA modifiers', 'Reach', 'AT', 'PA', 'Weight']}
               rows={melee.map(({ entry, item, key }) => {
                  const weapon = item.weapon!
                  const values = stats.combatValues.find((value) => value.key === weapon.combatTechnique)
                  const bonus = damageBonus(weapon, stats)
                  const passive = entry.carriedOn === 'Equipped'
                     ? passiveParryBonus({ name: item.name, technique: weapon.combatTechnique, shield: false }, held, stats.combatSpecialAbilities) : 0
                  return { key, cells: [<>{entry.item} <ConditionBadge condition={entry.condition} /></>, weapon.combatTechnique, bonus === null ? '—' : `+${bonus}`,
                     totalDamage(weapon.damage, bonus), `${weapon.attackModifier ?? '—'} / ${weapon.parryModifier ?? '—'}`, t(weapon.reach, language),
                     values ? <CheckValue stats={stats} base={values.attack + (weapon.attackModifier ?? 0)} kind='attack'
                        checkKey={weapon.combatTechnique} label={`${t(item.name, language)} AT`} /> : '—',
                     weapon.canParry !== false && values?.parry != null ? <CheckValue stats={stats} base={values.parry + (weapon.parryModifier ?? 0) + passive} kind='defense'
                        checkKey={weapon.combatTechnique} label={`${t(item.name, language)} PA`} /> : '—', `${entry.weight} s`] }
               })} />
         </section>
         <section className='overview-section'>
            <header className='section-heading'><Swords size={19} /><h2>{t('Ranged weapons', language)}</h2><RuleSource pages='241–245, 372' language={language} /></header>
            <SheetTable language={language} empty='No ranged weapons in inventory.'
               columns={['Weapon', 'Combat technique', 'Reload actions', 'TP', 'Range', 'FK', 'Ammunition', 'Weight']}
               rows={ranged.map(({ entry, item, key }) => {
                  const weapon = item.weapon!
                  const values = stats.combatValues.find((value) => value.key === weapon.combatTechnique)
                  return { key, cells: [<>{entry.item} <ConditionBadge condition={entry.condition} /></>, weapon.combatTechnique, weapon.reloadActions ?? '—', weapon.damage, weapon.range ?? '—',
                     values ? <CheckValue stats={stats} base={values.attack} kind='ranged' checkKey={weapon.combatTechnique}
                        label={`${t(item.name, language)} ${t('FK', language)}`} /> : '—',
                     weapon.ammunition ?? '—', `${entry.weight} s`] }
               })} />
         </section>
         <div className='combat-two-column'>
            <section className='overview-section'>
               <header className='section-heading'><Shield size={19} /><h2>{t('Armor', language)}</h2><RuleSource pages='32, 374' language={language} /></header>
               <SheetTable language={language} empty='No armor in inventory.'
                  columns={['Armor', 'RS', 'BE', 'Additional penalties', 'Weight']}
                  rows={armor.map(({ entry, item, key }) => ({ key, cells: [<>{entry.item} <ConditionBadge condition={entry.condition} /></>, item.armor!.protection, item.armor!.burden,
                     `GS −${item.armor!.movementPenalty ?? 0}, INI −${item.armor!.initiativePenalty ?? 0}`, `${entry.weight} s`] }))} />
               <p className='combat-note'>{t('Worn armor', language)}: {stats.checkModifiers.armor ? t(stats.checkModifiers.armor, language) : t('None', language)}
                  {` · BE ${stats.checkModifiers.armorBurden}`}</p>
            </section>
            <section className='overview-section'>
               <header className='section-heading'><Shield size={19} /><h2>{t('Shields / parrying weapons', language)}</h2><RuleSource pages='233, 236, 367' language={language} /></header>
               <SheetTable language={language} empty='No shields in inventory.'
                  columns={['Shield', 'Structure points', 'AT / PA modifiers', 'Active PA', 'Weight']}
                  rows={shields.map(({ entry, item, key }) => {
                     const base = stats.combatValues.find((value) => value.key === item.weapon!.combatTechnique)?.parry
                     // source: DSA5 Regelwerk, S. 236 (double shield bonus for active parry)
                     return { key, cells: [<>{entry.item} <ConditionBadge condition={entry.condition} /></>, item.weapon!.structurePoints ?? '—',
                        `${item.weapon!.attackModifier ?? 0} / ${item.weapon!.parryModifier ?? 0}`,
                        base != null ? <CheckValue stats={stats} base={base + 2 * (item.weapon!.parryModifier ?? 0)} kind='defense'
                           checkKey={item.weapon!.combatTechnique} label={`${t(item.name, language)} PA`} /> : '—', `${entry.weight} s`] }
                  })} />
               <p className='combat-note'>{t('Active shield parry includes twice the shield PA modifier. Passive bonuses are not applied to other weapons.', language)}</p>
            </section>
         </div>
         {unknownGear.length > 0 && <p className='combat-note' role='status'>
            {t('Combat data missing for inventory items', language)}: {unknownGear.map((entry) => entry.item).join(', ')}.
         </p>}
         <div className='combat-two-column'>
            <section className='overview-section'>
               <header className='section-heading'><Shield size={19} /><h2>{t('Status', language)}</h2><RuleSource pages='34–36' language={language} /></header>
               <ul className='combat-status-list'>
                  {Object.keys(statusInfo).map((key) => {
                     const permanent = stats.permanentStatuses.includes(key)
                     const active = permanent || stats.statuses.includes(key)
                     return <li key={key} className={active ? 'is-active' : ''}>
                        <label title={permanent ? `${t('From the disadvantage', language)} ${key}` : undefined}>
                           <input type='checkbox' checked={active} disabled={busy || permanent} onChange={() => settingsMutation.mutate({
                              statuses: active ? stats.statuses.filter((status) => status !== key) : [...stats.statuses, key],
                           })} />
                           <span lang='de'>{key}</span>
                        </label>
                        <Tooltip content={statusTooltip(key, language)} className='tooltip-icon-wrapper condition-tooltip' clickToToggle lang={language}>
                           <Info size={15} aria-label={`${key}: ${t('Rule details', language)}`} />
                        </Tooltip>
                     </li>
                  })}
               </ul>
               <p className='combat-note'>{t('A status is on or off. Rule numbers apply automatically to checks and the fight panel; GM-only effects are reminders in the ⓘ.', language)}</p>
               {stats.statuses.includes('Blutrausch') && <p className='combat-note'>{t('Removing Blutrausch adds 2 levels of Betäubung (S. 35).', language)}</p>}
               {/* source: DSA5 Regelwerk, S. 170, 173, 177 (condition levels only while the trigger is present) */}
               {stats.triggerOptions.length > 0 && <>
                  <p className='eyebrow'>{t('Disadvantage triggers', language)}</p>
                  <ul className='combat-status-list'>
                     {stats.triggerOptions.map((option) => {
                        const active = stats.triggers.includes(option.key)
                        return <li key={option.key} className={active ? 'is-active' : ''}>
                           <label title={`${t(option.condition, language)} +${['I', 'II', 'III', 'IV'][option.levels - 1]} · ${t('S.', language)} ${option.page}`}>
                              <input type='checkbox' checked={active} disabled={busy} onChange={() => settingsMutation.mutate({
                                 triggers: active ? stats.triggers.filter((key) => key !== option.key) : [...stats.triggers, option.key],
                              })} />
                              <span lang='de'>{translateRuleLabel(option.key, language)}</span>
                              <small>{t(option.condition, language)} +{['I', 'II', 'III', 'IV'][option.levels - 1]}</small>
                           </label>
                        </li>
                     })}
                  </ul>
                  <p className='combat-note'>{t('Switch a trigger on while it is present; the GM decides when. Its condition levels are added to every check.', language)}</p>
               </>}
            </section>
            <section className='overview-section'>
               <header className='section-heading'><Shield size={19} /><h2>{t('Conditions', language)}</h2><RuleSource pages='31–34, 411' language={language} /></header>
               <SheetTable language={language} empty='Nothing recorded yet.' columns={['Condition', 'Level']}
                  rows={['Belastung', ...reference.conditions.slice(0, 5), 'Schmerz', ...reference.conditions.slice(5)].map((key) => ({
                     key,
                     cells: [<span className='condition-name'>
                        {t(key, language)}
                        <Tooltip content={conditionTooltip(key, key === 'Schmerz' ? stats.pain
                           : key === 'Belastung' ? stats.checkModifiers.burden : stats.combatConditions[key] ?? 0, language)}
                           className='tooltip-icon-wrapper condition-tooltip' clickToToggle lang={language}>
                           <Info size={15} aria-label={`${t(key, language)}: ${t('Rule details', language)}`} />
                        </Tooltip>
                     </span>, key === 'Schmerz' ? <strong>{stats.pain} / IV</strong> : (
                        <select className='combat-condition-select' aria-label={`${t(key, language)} ${t('Level', language)}`} disabled={busy}
                           value={stats.combatConditions[key] ?? 0} onChange={(event) => settingsMutation.mutate({
                              conditions: { ...stats.combatConditions, [key]: Number(event.target.value) },
                           })}>
                           {['—', 'I', 'II', 'III', 'IV'].map((label, value) => <option value={value} key={value}>{label}</option>)}
                        </select>
                     )],
                  }))} />
               <p className='combat-note'>{t('Belastung here is non-armor load only. Worn armor is added once, with Belastungsgewöhnung applied.', language)}
                  {` · ${t('Effective Belastung', language)}: ${stats.checkModifiers.burden}`}</p>
            </section>
            <section className='overview-section combat-health combat-wide-section'>
               <header className='section-heading'><HeartPulse size={19} /><h2>{t('Health', language)}</h2><RuleSource pages='34, 234, 340' language={language} /></header>
               <div className='resource-label'><span>{t('LeP', language)}</span><strong>{stats.health.current} / {stats.health.max}</strong></div>
               <div className='resource-track'><span style={{ width: `${healthPercent}%` }} /></div>
               <div className='combat-health-thresholds'>
                  {/* source: DSA5 Regelwerk, S. 34, 234 */}
                  {[['¾', stats.health.max * 3 / 4], ['½', stats.health.max / 2], ['¼', stats.health.max / 4], ['≤ 5', 5]].map(([label, threshold]) => (
                     <span key={label} className={stats.health.current <= Number(threshold) ? 'is-active' : ''}>
                        {label} {label === '≤ 5' ? '' : `(${Math.floor(Number(threshold))})`} · +1 {t('Pain', language)}
                     </span>
                  ))}
               </div>
               <p className='combat-note'>{t('Damage is applied in the fight panel; LeP return by resting (overview).', language)}</p>
               {stats.health.current <= 0 && <p className='combat-health-warning' role='status'>
                  {t(stats.health.current < -stats.constitution ? 'Below negative KO: death threshold reached.' : 'Dying: treatment must begin within KO combat rounds.', language)}
                  {` (KO ${stats.constitution})`}
               </p>}
            </section>
         </div>
      </div>
   )
}
