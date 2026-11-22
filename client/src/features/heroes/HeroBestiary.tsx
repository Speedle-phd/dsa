import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Check, Dices, Flame, Info, PawPrint, Plus, Skull, Sparkles, Sunrise, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { throwD20s } from '@/components/diceEngine'
import { Tooltip } from '@/components/Tooltip'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import {
   addSummon, failureRow, getBestiaryReference, getSummons, revealedFacts, servicesFor, summonsKey, updateSummon,
   type BestiaryCreature, type BestiaryReference, type CreatureKind, type Summon, type SummonAction, type SummonImprovement, type SummonServiceKey,
} from './bestiaryApi'
import { companionsKey, displayDamage, updateCompanions } from './companionApi'
import type { Hero } from './heroApi'
import { getMagicReference, type MagicReference } from './magicApi'
import type { ProbeResultState } from './ProbeDialog'
import { SpellProbeDialog } from './SpellProbeDialog'
import { getStatsForHero, type Stats } from './statsApi'
import { attributeLabels, getAttributeAbbreviation, talentCatalog, type TalentAttribute } from './talentCatalog'
import { TalentProbeDialog } from './TalentProbeDialog'

const attributes: TalentAttribute[] = ['courage', 'wisdom', 'intuition', 'charisma', 'fingerDexterity', 'dexterity', 'constitution', 'strength']
const kinds: Array<{ key: CreatureKind | 'all'; label: string }> = [
   { key: 'all', label: 'All' }, { key: 'animal', label: 'Animals' }, { key: 'demon', label: 'Demons' }, { key: 'elemental', label: 'Elementals' },
]
const kindIcon = { animal: PawPrint, demon: Skull, elemental: Flame } as const
const signed = (value: number) => value > 0 ? `+${value}` : value < 0 ? `−${-value}` : '±0'

function Source({ page }: { page: number | string }) {
   const language = useLanguageStore((state) => state.language)
   return <Tooltip content={`${t('DSA5 Rulebook', language)}, ${t('S.', language)} ${page}`} clickToToggle className='tooltip-icon-wrapper' lang={language}>
      <Info size={15} aria-label={t('Rule source', language)} />
   </Tooltip>
}

function talentLabel(key: string, language: 'de' | 'en') {
   const talent = talentCatalog.find((entry) => entry.key === key)
   return talent ? t(talent.label, language) : key
}

// Stat block of a creature (for a summoned one: its values after improvements).
function StatBlock({ creature }: { creature: BestiaryCreature }) {
   const language = useLanguageStore((state) => state.language)
   const combat: Array<[string, string, string | number]> = [
      ['LeP', 'Life energy', creature.health], ...(creature.mana !== null ? [['AsP', 'Astral energy', creature.mana] as [string, string, number]] : []),
      ['INI', 'Initiative', `${creature.initiative}+1W6`],
      ...(creature.defense !== null ? [['VW', 'Defense', creature.defense] as [string, string, number]] : []),
      ...(creature.dodge !== null ? [['AW', 'Dodge', creature.dodge] as [string, string, number]] : []),
      ['SK', 'Soul power', creature.soulPower], ['ZK', 'Toughness', creature.toughness], ['GS', 'Movement', creature.speed],
      ['RS', 'Protection', creature.armor], ['Actions', 'per combat round', creature.actions],
   ]
   return <div className='companion-body'>
      <div className='companion-column'>
         <section className='companion-block'>
            <h4>{t('Attributes', language)}</h4>
            <dl className='companion-tiles'>
               {attributes.map((attribute) => <div key={attribute}>
                  <dt>{getAttributeAbbreviation(attribute, language)}{attribute === 'wisdom' && creature.animalWisdom && <sup title={t('Animal intelligence (S. 354)', language)}>t</sup>}</dt>
                  <dd>{creature.attributes[attribute]}</dd>
                  <small>{t(attributeLabels[attribute], language)}</small>
               </div>)}
            </dl>
         </section>
         <section className='companion-block'>
            <h4>{t('Combat values', language)}</h4>
            <dl className='companion-tiles'>
               {combat.map(([label, name, value]) => <div key={label}><dt>{t(label, language)}</dt><dd>{value}</dd><small>{t(name, language)}</small></div>)}
            </dl>
            {creature.defense !== null && <p className='combat-note'>{t('VW is not lowered by several defenses in one combat round.', language)} <Source page={354} /></p>}
         </section>
      </div>
      <div className='companion-column'>
         <section className='companion-block'>
            <h4>{t('Attacks', language)}</h4>
            <ul className='companion-list'>{creature.attacks.map((attack) => <li key={attack.name}>
               <strong lang='de'>{attack.name}</strong>
               <span className='companion-stats'>
                  <span><small>{t('Attack value', language)}</small>{attack.attack}</span>
                  {attack.parry !== undefined && <span><small>{t('PA', language)}</small>{attack.parry ?? '—'}</span>}
                  <span><small>{t('Hit points', language)}</small>{displayDamage(attack.damage)}</span>
                  <span><small>{t('Reach', language)}</small><span lang='de'>{attack.reach}</span></span>
               </span>
               {attack.perRound && <small>{t('At most {count} × per combat round', language).replace('{count}', String(attack.perRound))}</small>}
            </li>)}</ul>
         </section>
         <section className='companion-block'>
            <h4>{t('Talents', language)}</h4>
            <ul className='companion-list'>{creature.talents.map((entry) => <li key={entry.key} className={entry.value === null ? 'is-locked' : ''}>
               <strong>{talentLabel(entry.key, language)}</strong>
               <span className='companion-stats'><span><small>{t('FW', language)}</small>{entry.value ?? '—'}</span></span>
               {entry.note && <small lang='de'>{entry.note}</small>}
            </li>)}</ul>
         </section>
         {creature.spells.length > 0 && <section className='companion-block'>
            <h4>{t('Spells', language)}</h4>
            <ul className='companion-list'>{creature.spells.map((spell) => <li key={spell.name}>
               <strong lang='de'>{spell.name}</strong>
               <span className='companion-stats'><span><small>{t('FW', language)}</small>{spell.value}</span><span><small>{t('Check', language)}</small>{spell.probe}</span></span>
            </li>)}</ul>
         </section>}
      </div>
   </div>
}

function CreatureTexts({ creature }: { creature: BestiaryCreature }) {
   const language = useLanguageStore((state) => state.language)
   return <dl className='companion-texts'>
      {creature.traits && <div><dt>{t('Advantages/disadvantages', language)}</dt><dd lang='de'>{creature.traits}</dd></div>}
      {creature.abilities && <div><dt>{t('Special abilities', language)}</dt><dd lang='de'>{creature.abilities}</dd></div>}
      {creature.special.map((rule) => <div key={rule.name}><dt lang='de'>{rule.name}</dt><dd>{rule[language]}</dd></div>)}
      <div><dt>{t('Combat behaviour', language)}</dt><dd>{creature.behaviour[language]}</dd></div>
      <div><dt>{t('Flight', language)}</dt><dd>{creature.flight[language]}</dd></div>
      <div><dt>{t('Number', language)}</dt><dd lang='de'>{creature.count}</dd></div>
      <div><dt>{t('Schmerz', language)}</dt><dd>{creature.painTable
         ? creature.painTable.map(([health, levels]) => `≤ ${health} LeP +${levels}`).join(' · ')
         : t('No effect', language)}</dd></div>
      {creature.loot && <div><dt>{t('Loot', language)}</dt><dd>{creature.loot[language]}</dd></div>}
      {creature.hunt !== null && <div><dt>{t('Hunting modifier', language)}</dt><dd>{signed(creature.hunt)}
         <small> · {t('The core rules give no hunting procedure; the GM decides how to use it.', language)}</small></dd></div>}
      {creature.extraServices.map((service) => <div key={service.name}><dt>{t('Additional service', language)}</dt>
         <dd><span lang='de'>{service.name}</span> ({service.services} {t('services', language)}): {service[language]}</dd></div>)}
   </dl>
}

// source: DSA5 Regelwerk, S. 200, 205, 354 (Tierkunde / Sphärenkunde: facts by QS; critical: everything; botch: dangerously wrong)
function KnowledgeResult({ creature, state }: { creature: BestiaryCreature; state: ProbeResultState }) {
   const language = useLanguageStore((state) => state.language)
   const { result, quality } = state
   const critical = result.outcome === 'critical' || result.outcome === 'spectacular'
   const facts = revealedFacts(creature, quality, critical)
   if (result.outcome === 'botch' || result.outcome === 'disaster') {
      return <p className='field-error'>{t('Botch: the hero believes something dangerously wrong about this creature. The GM tells you what (S. 200).', language)}</p>
   }
   if (!result.success) return <p className='combat-note'>{t('Failed: the hero has no idea.', language)}</p>
   return <section className='probe-fate' aria-label={t('What the hero knows', language)}>
      <p className='probe-fate-balance'><BookOpen size={16} />{t('What the hero knows', language)}{critical && <small> · {t('Critical success: everything.', language)}</small>}</p>
      <ul className='bestiary-facts'>{facts.map((fact) => <li key={fact.qs}><strong>{t('QS', language)} {fact.qs}{fact.qs === 3 ? '+' : ''}</strong> {fact[language]}</li>)}</ul>
   </section>
}

// source: DSA5 Regelwerk, S. 264–265 (QS → services or improvements; failed demon summoning table)
function SummonResult({ stats, creature, reference, state }: {
   stats: Stats; creature: BestiaryCreature; reference: BestiaryReference; state: ProbeResultState
}) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const [chosen, setChosen] = useState<SummonImprovement[]>([])
   const [recorded, setRecorded] = useState(false)
   const [failureRoll, setFailureRoll] = useState<number | null>(null)
   const record = useMutation({
      mutationFn: () => addSummon(stats._id, { creature: creature.key, ritual: creature.summonedBy!, quality: state.quality ?? 1, improvements: chosen }),
      onSuccess: (next) => { queryClient.setQueryData(summonsKey(stats._id), next); setRecorded(true); toast.success(t('Summoned creature recorded.', language)) },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const { result, quality } = state
   if (!result.success) {
      if (creature.kind !== 'demon') return <p className='combat-note'>{t('Failed: no elemental appears; nothing else happens (S. 264).', language)}</p>
      const botch = result.outcome === 'botch' || result.outcome === 'disaster'
      const row = failureRoll === null ? null : failureRow(reference, failureRoll)
      return <section className='probe-fate' aria-label={t('Failed demon summoning', language)}>
         <p className='probe-fate-balance'><Skull size={16} />{t('Failed demon summoning: the GM rolls 1W20', language)}{botch && ' +15'} <Source page='264–265' /></p>
         <ul className='bestiary-failures'>{reference.summoningFailures.map((entry) => <li key={entry.from} className={row === entry ? 'is-active' : ''}>
            <strong>{entry.to === null ? `${entry.from}+` : `${entry.from}–${entry.to}`}</strong> {entry[language]}
         </li>)}</ul>
         <div className='probe-fate-actions'>
            <button className='quiet-button' type='button' disabled={failureRoll !== null}
               onClick={() => void throwD20s(['#7f1d1d']).then(([roll]) => setFailureRoll(roll + (botch ? 15 : 0)))}>
               <Dices size={16} />{t('Roll W20 for the GM', language)}</button>
            {failureRoll !== null && <small>{t('Result', language)}: {failureRoll}</small>}
         </div>
      </section>
   }
   const qs = quality ?? 1
   const services = servicesFor(qs, chosen.length)
   return <section className='probe-fate' aria-label={t('Summoning result', language)}>
      <p className='probe-fate-balance'><Sparkles size={16} />{t('Improvements (1 QS each, each once)', language)} <Source page={264} /></p>
      <ul className='bestiary-improvements'>{reference.summonImprovements.map((entry) => {
         const active = chosen.includes(entry.key)
         return <li key={entry.key}><label>
            <input type='checkbox' checked={active} disabled={recorded || (!active && chosen.length >= qs)}
               onChange={() => setChosen(active ? chosen.filter((key) => key !== entry.key) : [...chosen, entry.key])} />
            <span><strong lang='de'>{entry.name}</strong><small>{entry[language]}</small></span>
         </label></li>
      })}</ul>
      <p className='combat-note'>{t('Services: 1 for success + {qs} QS − {chosen} improvements = {services}. Every sunrise costs one service.', language)
         .replace('{qs}', String(qs)).replace('{chosen}', String(chosen.length)).replace('{services}', String(services))}</p>
      <div className='probe-fate-actions'>
         {recorded ? <small><Check size={14} /> {t('Recorded in the Bestiary tab.', language)}</small>
            : <button className='primary-button' type='button' disabled={record.isPending} onClick={() => record.mutate()}>
               <Sparkles size={16} />{t('Record summoned creature', language)}</button>}
      </div>
   </section>
}

function SummonCard({ stats, summon, reference }: { stats: Stats; summon: Summon; reference: BestiaryReference }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const [service, setService] = useState<SummonServiceKey>('work')
   const mutation = useMutation({
      mutationFn: (action: SummonAction) => updateSummon(stats._id, action),
      onSuccess: (next) => queryClient.setQueryData(summonsKey(stats._id), next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const creature = summon.effective
   const selected = reference.summonServices.find((entry) => entry.key === service)!
   const task = reference.summonServices.find((entry) => entry.key === summon.task)
   const Icon = creature ? kindIcon[creature.kind] : Sparkles
   return <li className='companion-card'>
      <header className='companion-head'>
         <span className='companion-avatar' aria-hidden='true'><Icon size={20} /></span>
         <div className='companion-title'>
            <h3 lang='de'>{summon.creature}</h3>
            <small><span lang='de'>{summon.ritual}</span> · {t('QS', language)} {summon.quality}
               {summon.improvements.length > 0 && <> · <span lang='de'>{summon.improvements.map((key) => reference.summonImprovements.find((entry) => entry.key === key)?.name ?? key).join(', ')}</span></>}</small>
            <span className='companion-badge'>{task ? `${t('Busy', language)}: ${task.name}` : `${t('Services left', language)}: ${summon.services}`}</span>
         </div>
         <div className='spell-card-actions'>
            <button className='icon-button' type='button' disabled={mutation.isPending} title={t('Sunrise: −1 service', language)}
               aria-label={`${t('Sunrise: −1 service', language)}: ${summon.creature}`} onClick={() => mutation.mutate({ action: 'sunrise', summonId: summon._id })}><Sunrise size={16} /></button>
            <button className='icon-button danger-icon' type='button' disabled={mutation.isPending} title={t('Dismiss', language)}
               aria-label={`${t('Dismiss', language)}: ${summon.creature}`} onClick={() => mutation.mutate({ action: 'dismiss', summonId: summon._id })}><X size={16} /></button>
         </div>
      </header>
      {!task && <div className='bestiary-service'>
         <div className='probe-segmented'>
            {reference.summonServices.map((entry) => <button key={entry.key} type='button' aria-pressed={service === entry.key}
               className={service === entry.key ? 'is-active' : ''} onClick={() => setService(entry.key)}><span lang='de'>{entry.name}</span></button>)}
         </div>
         <p className='probe-segmented-note'>{selected[language]}</p>
         <button className='quiet-button' type='button' disabled={mutation.isPending || summon.services < selected.minimum}
            onClick={() => mutation.mutate({ action: 'service', summonId: summon._id, service })}>
            <Check size={16} />{t('Use service', language)}</button>
         {summon.services < selected.minimum && <small>{t('Needs at least {count} services (S. 265).', language).replace('{count}', String(selected.minimum))}</small>}
      </div>}
      {summon.task === 'fight' ? <div className='bestiary-service'>
         <p className='combat-note'>{t('Fighting on the hero’s side; the Kampf ends with the fight (S. 265).', language)}</p>
         <button className='quiet-button' type='button' disabled={mutation.isPending} onClick={() => mutation.mutate({ action: 'fight-over', summonId: summon._id })}>
            <Check size={16} />{t('Fight over', language)}</button>
      </div>
         : task && <p className='combat-note'>{t('This task used all services. Dismiss the creature when it is over (S. 265).', language)}</p>}
      {summon.health && summon.health.current < summon.health.max && <p className='combat-note'>{t('LeP', language)} {summon.health.current} / {summon.health.max}</p>}
      {creature && <StatBlock creature={creature} />}
   </li>
}

function CreatureCard({ stats, creature, reference, magic, onKnowledge, onSummon }: {
   stats: Stats; creature: BestiaryCreature; reference: BestiaryReference; magic: MagicReference | undefined
   onKnowledge: () => void; onSummon: () => void
}) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const addCompanion = useMutation({
      mutationFn: () => updateCompanions(stats._id, { action: 'add-companion', species: creature.companionSpecies!, name: creature.key, familiar: false }),
      onSuccess: (next) => { queryClient.setQueryData(companionsKey(stats._id), next); toast.success(t('Companion added.', language)) },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const Icon = kindIcon[creature.kind]
   const ritual = creature.summonedBy
   const ownsRitual = ritual !== null && stats.spells.some((spell) => spell.key === ritual) && Boolean(magic?.spells.some((spell) => spell.key === ritual))
   return <li className='companion-card'>
      <header className='companion-head'>
         <span className='companion-avatar' aria-hidden='true'><Icon size={20} /></span>
         <div className='companion-title'>
            <h3 lang='de'>{creature.key}</h3>
            <small><span lang='de'>{creature.typus}</span> · {t('Size', language)} <span lang='de'>{creature.size}</span> <Source page={creature.page} /></small>
         </div>
         <div className='spell-card-actions'>
            {creature.companionSpecies && <button className='icon-button' type='button' disabled={addCompanion.isPending}
               title={t('Add as companion', language)} aria-label={`${t('Add as companion', language)}: ${creature.key}`}
               onClick={() => addCompanion.mutate()}><Plus size={16} /></button>}
         </div>
      </header>
      <div className='bestiary-actions'>
         <div>
            <strong>{t('Knowledge', language)}</strong>
            <small>{talentLabel(creature.knowledge.talent, language)} (<span lang='de'>{creature.knowledge.application}</span>)</small>
         </div>
         <button className='quiet-button' type='button' onClick={onKnowledge}
            aria-label={`${t('Knowledge check', language)}: ${creature.key}`}><BookOpen size={16} />{t('Knowledge check', language)}</button>
      </div>
      {ritual && <div className='bestiary-actions'>
         <div>
            <strong>{t('Summoning', language)}</strong>
            <small><span lang='de'>{ritual}</span> · {t('Anrufungsschwierigkeit', language)} {signed(creature.invocation ?? 0)} <Source page='263–264' /></small>
            {!ownsRitual && <small className='field-error'>{t('Requires the ritual {ritual}.', language).replace('{ritual}', ritual)}</small>}
         </div>
         <button className='quiet-button' type='button' disabled={!ownsRitual} onClick={onSummon}
            aria-label={`${t('Summon', language)}: ${creature.key}`}><Sparkles size={16} />{t('Summon', language)}</button>
      </div>}
      <StatBlock creature={creature} />
      <CreatureTexts creature={creature} />
      {creature.kind !== 'animal' && <p className='combat-note'>{t(creature.kind === 'demon' ? 'General demon rules apply (see below).' : 'General elemental rules apply (see below).', language)}
         {' '}<Source page={reference.creatureRules[creature.kind].page} /></p>}
   </li>
}

function RulesSection({ reference }: { reference: BestiaryReference }) {
   const language = useLanguageStore((state) => state.language)
   return <section className='overview-section'>
      <header className='section-header'><div><h2>{t('Rules for creatures', language)} <Source page='354–362' /></h2></div></header>
      {(['demon', 'elemental'] as const).map((kind) => <details key={kind} className='bestiary-rules'>
         <summary>{t(kind === 'demon' ? 'Demons' : 'Elementals', language)} <small>{t('S.', language)} {reference.creatureRules[kind].page}</small></summary>
         <ul>{reference.creatureRules[kind].rules.map((rule) => <li key={rule.de}>{rule[language]}</li>)}</ul>
         {kind === 'elemental' && <p className='combat-note'>{t('Counter-elements', language)}: {reference.counterElements.map(([one, two]) => `${one} – ${two}`).join(' · ')} ({t('S.', language)} 359)</p>}
      </details>)}
      <details className='bestiary-rules'>
         <summary>{t('Special manoeuvres', language)} <small>{t('S.', language)} 362</small></summary>
         <ul>{reference.creatureManeuvers.map((entry) => <li key={entry.name}><strong lang='de'>{entry.name}</strong>: {entry[language]}</li>)}</ul>
      </details>
      <details className='bestiary-rules'>
         <summary>{t('Demonic spells', language)} <small>{t('S.', language)} 355</small></summary>
         <ul>{reference.demonSpells.map((entry) => <li key={entry.name}><strong lang='de'>{entry.name}</strong>: {entry[language]}</li>)}</ul>
      </details>
      <details className='bestiary-rules'>
         <summary>{t('Animal intelligence', language)} <small>{t('S.', language)} 355</small></summary>
         <p className='combat-note'>{t('KL marked “t” is animal intelligence; compared with human KL:', language)}</p>
         <p>{reference.animalWisdomTable.map(([animal, human]) => `${animal} → ${human}`).join(' · ')}</p>
      </details>
      <details className='bestiary-rules'>
         <summary>{t('Summoning', language)} <small>{t('S.', language)} 262–265</small></summary>
         <ul>{Object.entries(reference.summoningRituals).map(([ritual, calls]) => <li key={ritual}><strong lang='de'>{ritual}</strong>: {calls[language]}</li>)}</ul>
         <p className='combat-note'>{t('The ritual check is harder by the Anrufungsschwierigkeit. Each QS gives one more service or pays for one improvement; every sunrise costs one service.', language)}</p>
      </details>
   </section>
}

type Dialog = { kind: 'knowledge' | 'summon'; creature: BestiaryCreature }

function BestiarySheet({ stats, reference, summons, magic }: { stats: Stats; reference: BestiaryReference; summons: Summon[]; magic: MagicReference | undefined }) {
   const language = useLanguageStore((state) => state.language)
   const [filter, setFilter] = useState<CreatureKind | 'all'>('all')
   const [dialog, setDialog] = useState<Dialog | null>(null)
   const creatures = reference.creatures.filter((entry) => filter === 'all' || entry.kind === filter)
   const knowledgeTalent = dialog?.kind === 'knowledge' ? talentCatalog.find((entry) => entry.key === dialog.creature.knowledge.talent) : undefined
   const ritualSpell = dialog?.kind === 'summon' ? magic?.spells.find((spell) => spell.key === dialog.creature.summonedBy) : undefined
   return <div className='hero-bestiary'>
      {summons.length > 0 && <section className='overview-section'>
         <header className='section-header'><div><h2>{t('Summoned creatures', language)} <Source page='264–265' /></h2></div></header>
         <ul className='companion-grid'>{summons.map((summon) => <SummonCard key={summon._id} stats={stats} summon={summon} reference={reference} />)}</ul>
      </section>}
      <section className='overview-section'>
         <header className='section-header'><div><h2>{t('Bestiary', language)} <Source page='353–362' /></h2></div></header>
         <p className='combat-note'>{t('The creatures of the core rules. More animals and monsters are in other books; enter them as custom companions.', language)}</p>
         <div className='probe-segmented' role='group' aria-label={t('Creature type', language)}>
            {kinds.map((entry) => <button key={entry.key} type='button' aria-pressed={filter === entry.key}
               className={filter === entry.key ? 'is-active' : ''} onClick={() => setFilter(entry.key)}>{t(entry.label, language)}</button>)}
         </div>
         <ul className='companion-grid'>{creatures.map((creature) => <CreatureCard key={creature.key} stats={stats} creature={creature} reference={reference} magic={magic}
            onKnowledge={() => setDialog({ kind: 'knowledge', creature })} onSummon={() => setDialog({ kind: 'summon', creature })} />)}</ul>
      </section>
      <RulesSection reference={reference} />
      {dialog?.kind === 'knowledge' && knowledgeTalent && <TalentProbeDialog stats={stats} talent={knowledgeTalent}
         value={stats.talents.find((entry) => entry.key === knowledgeTalent.key)?.value ?? 0}
         renderResult={(state) => <KnowledgeResult creature={dialog.creature} state={state} />} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'summon' && ritualSpell && magic && <SpellProbeDialog stats={stats} spell={ritualSpell} reference={magic}
         value={stats.spells.find((spell) => spell.key === ritualSpell.key)?.value ?? 0}
         extraSources={[{ label: `Anrufungsschwierigkeit (${dialog.creature.key})`, value: dialog.creature.invocation ?? 0 }]}
         renderAfter={(state) => <SummonResult stats={stats} creature={dialog.creature} reference={reference} state={state} />} onClose={() => setDialog(null)} />}
   </div>
}

export function HeroBestiary({ hero }: { hero: Hero }) {
   const language = useLanguageStore((state) => state.language)
   const statsQuery = useQuery({ queryKey: ['stats', hero._id], queryFn: () => getStatsForHero(hero._id) })
   const referenceQuery = useQuery({ queryKey: ['bestiary-reference'], queryFn: getBestiaryReference, staleTime: Infinity })
   const magicQuery = useQuery({ queryKey: ['magic-reference'], queryFn: getMagicReference, staleTime: Infinity })
   const statsId = statsQuery.data?._id
   const summonsQuery = useQuery({ queryKey: summonsKey(statsId), queryFn: () => getSummons(statsId!), enabled: Boolean(statsId) })
   if (statsQuery.isError || referenceQuery.isError || summonsQuery.isError) return <div className='state-panel' role='alert'>
      <p>{getErrorMessage(statsQuery.error ?? referenceQuery.error ?? summonsQuery.error)}</p>
      <button className='quiet-button' type='button' onClick={() => { void statsQuery.refetch(); void referenceQuery.refetch(); void summonsQuery.refetch() }}>{t('Retry', language)}</button>
   </div>
   if (!statsQuery.data || !referenceQuery.data || !summonsQuery.data) return <p>{t('Loading bestiary...', language)}</p>
   return <BestiarySheet stats={statsQuery.data} reference={referenceQuery.data} summons={summonsQuery.data} magic={magicQuery.data} />
}

