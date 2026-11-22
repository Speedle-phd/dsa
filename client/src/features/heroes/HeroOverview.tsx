import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
   Brain,
   ArrowUp,
   BookOpenText,
   Bug,
   HeartPulse,
   Moon,
   Pencil,
   Sparkles,
   Star,
   Swords,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { incrementFatePoints, levelUpAttribute, restoreFatePoints } from './statsApi'
import { updateHero, type Hero, type HeroInput } from './heroApi'
import { HeroEditor } from './HeroEditor'
import type { HeroFormSection } from './heroSchema'
import { StatsEditor } from './StatsEditor'
import {
   getStatsForHero,
   type Resource,
   type StaticResource,
   type Stats,
} from './statsApi'
import { t, translateRuleLabel } from '@/locales/translation'
import { useLanguageStore } from '@/locales/languageStore'
import { getErrorMessage } from '@/utils/errorHandling'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { CharacterEntryList } from './CharacterEntryList'
import { RegenerationDialog } from './RegenerationDialog'
import { activeEffectsKey, soulPowerSources, startAbilityEffect, useActiveEffects } from './activeEffectsApi'
import { ExperienceEditor } from './ExperienceEditor'
import { CheckValue } from './CheckValue'
import { AttributeCheckDialog } from './AttributeCheckDialog'
import { DieIcon } from '@/components/DieIcon'
import type { TalentAttribute } from './talentCatalog'
import { AdvancementValue } from './AdvancementControls'
import { nextStepCost, useAdvancementMode } from './advancement'
import { purchaseAdditionalVitalResources, type VitalResourcesType } from './statsApi'
import { getAttributeAbbreviation } from './talentCatalog'

type HeroOverviewProps = { hero: Hero }

type AttributeKey =
   | 'courage'
   | 'wisdom'
   | 'intuition'
   | 'charisma'
   | 'dexterity'
   | 'fingerDexterity'
   | 'constitution'
   | 'strength'

const attributes: Array<[AttributeKey, string, string]> = [
   ['courage', 'COU', 'Courage'],
   ['wisdom', 'WIS', 'Wisdom'],
   ['intuition', 'INT', 'Intuition'],
   ['charisma', 'CHA', 'Charisma'],
   ['fingerDexterity', 'FIN', 'Finger dexterity'],
   ['dexterity', 'DEX', 'Dexterity'],
   ['constitution', 'CON', 'Constitution'],
   ['strength', 'STR', 'Strength'],
]

const resistanceTexts: Record<Stats['conditionalResistances'][number]['against'], string> = {
   poison: 'SK/ZK {value} against poisons',
   disease: 'SK/ZK {value} against diseases',
   magic: 'SK/ZK {value} against magic',
   trueName: 'SK/ZK {value} against a caster who knows the true name',
}

function ResourceMeter({
   label,
   resource,
   isStatic = false,
   checkStats,
   action,
}: {
   label: string
   resource: Resource | StaticResource
   isStatic?: boolean
   checkStats?: Stats
   action?: ReactNode
}) {
   const maximum = resource.max
   const current = isStatic
      ? maximum
      : 'current' in resource
        ? resource.current
        : resource.value
   const percent = isStatic
      ? 100
      : maximum > 0
        ? Math.max(0, Math.min((current / maximum) * 100, 100))
        : 0

   return (
      <div className='resource-meter'>
         <div className='resource-label'>
            <span>{label}</span>
            <strong>
               {isStatic ? (
                  checkStats ? <CheckValue stats={checkStats} base={maximum} kind='defense' checkKey='AW' label='AW' /> : maximum
               ) : (
                  <>
                     {current} <small>/ {maximum}</small>
                  </>
               )}
            </strong>
         </div>
         <div className='resource-track'>
            <span style={{ width: `${percent}%` }} />
         </div>
         {action}
      </div>
   )
}

export function HeroOverview({ hero }: HeroOverviewProps) {
   const language = useLanguageStore((state) => state.language)
   const statsQuery = useQuery({
      queryKey: ['stats', hero._id],
      queryFn: () => getStatsForHero(hero._id),
   })
   const family = hero.familyTree
   const queryClient = useQueryClient()
   const [editing, setEditing] = useState<readonly HeroFormSection[] | null>(null)
   const save = useMutation({
      mutationFn: (values: HeroInput) => updateHero(hero._id, values),
      onSuccess: (updated) => {
         queryClient.setQueryData(['heroes', hero._id], updated)
         void queryClient.invalidateQueries({ queryKey: ['heroes'], exact: true })
         toast.success(t('Hero updated', language))
         setEditing(null)
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const editButton = (section: HeroFormSection, label: string) => (
      <button className='quiet-button section-action' type='button' aria-haspopup='dialog'
         aria-label={t(label, language)} onClick={() => setEditing([section])}>
         <Pencil size={16} />{t('Edit', language)}
      </button>
   )

   return (
      <div className='hero-overview'>
         {import.meta.env.DEV && (
            <aside className='fixed bottom-4 left-4 z-30'>
               <Link
                  className='quiet-button'
                  to={`${import.meta.env.VITE_API_URL}/api/stats/debug/${hero._id}`}
                  target='_blank'
                  rel='noreferrer'
                  aria-label={t('Open debug stats', language)}
               >
                  <Bug size={19} />
               </Link>
            </aside>
         )}
         <section className='overview-section overview-identity'>
            <header className='section-heading'>
               <Sparkles size={19} />
               <div>
                  <p className='eyebrow'>{t('Character record', language)}</p>
                  <h2>{t('Hero at a glance', language)}</h2>
               </div>
               {editButton('identity', 'Edit character record')}
            </header>
            <dl className='fact-grid'>
               <div>
                  <dt>{t('Full name', language)}</dt>
                  <dd>{hero.name}</dd>
               </div>
               <div>
                  <dt>{t('Age', language)}</dt>
                  <dd>{hero.age} {t('years', language)}</dd>
               </div>
               <div>
                  <dt>{t('Species', language)}</dt>
                  <dd>{hero.species}</dd>
               </div>
               <div>
                  <dt>{t('Origin', language)}</dt>
                  <dd>{hero.placeOfOrigin || t('Unknown', language)}</dd>
               </div>
               <div>
                  <dt>{t('Culture', language)}</dt>
                  <dd>{hero.culture}</dd>
               </div>
               <div>
                  <dt>{t('Profession', language)}</dt>
                  <dd>{hero.profession}</dd>
               </div>
               <div>
                  <dt>{t('Social standing', language)}</dt>
                  <dd>{hero.socialStatus}</dd>
               </div>
               <div>
                  <dt>{t('Sex', language)}</dt>
                  <dd>{t(({ male: 'Male', female: 'Female', other: 'Other' })[hero.sex], language)}</dd>
               </div>
            </dl>
         </section>
         <section className='overview-section overview-split'>
            <div>
               <div className='overview-subheading'>
                  <h3>{t('Appearance', language)}</h3>
                  {editButton('appearance', 'Edit appearance')}
               </div>
               <p className='prose-copy'>
                  {hero.appearance ||
                     t('No appearance or characteristics recorded yet.', language)}
               </p>
               <dl className='compact-facts'>
                  <div>
                     <dt>{t('Height', language)}</dt>
                     <dd>{hero.height ? `${hero.height} cm` : t('Unknown', language)}</dd>
                  </div>
                  <div>
                     <dt>{t('Weight', language)}</dt>
                     <dd>{hero.weight ? `${hero.weight} kg` : t('Unknown', language)}</dd>
                  </div>
                  <div>
                     <dt>{t('Build', language)}</dt>
                     <dd>{hero.build || t('Unknown', language)}</dd>
                  </div>
                  <div>
                     <dt>{t('Eyes / hair', language)}</dt>
                     <dd>
                        {[hero.eyeColor, hero.hairColor]
                           .filter(Boolean)
                           .join(' / ') || t('Unknown', language)}
                     </dd>
                  </div>
               </dl>
            </div>
            <div>
               <div className='overview-subheading'>
                  <h3>{t('Family', language)}</h3>
                  {editButton('family', 'Edit family')}
               </div>
               <dl className='family-facts'>
                  <div>
                     <dt>{t('Parents', language)}</dt>
                     <dd>{family?.parents?.join(', ') || t('Not recorded', language)}</dd>
                  </div>
                  <div>
                     <dt>{t('Siblings', language)}</dt>
                     <dd>{family?.siblings?.join(', ') || t('Not recorded', language)}</dd>
                  </div>
                  <div>
                     <dt>{t('Partner', language)}</dt>
                     <dd>{family?.partner || t('Not recorded', language)}</dd>
                  </div>
                  <div>
                     <dt>{t('Children', language)}</dt>
                     <dd>{family?.children?.join(', ') || t('Not recorded', language)}</dd>
                  </div>
               </dl>
               {family?.notes && (
                  <p className='prose-copy family-notes'>{family.notes}</p>
               )}
            </div>
         </section>
         <section className='overview-section overview-chronicle'>
            <header className='section-heading'>
               <BookOpenText size={19} />
               <div>
                  <p className='eyebrow'>{t('Character record', language)}</p>
                  <h2>{t('Chronicle', language)}</h2>
               </div>
               {editButton('chronicle', 'Edit chronicle')}
            </header>
            <div>
               <h3>{t('Background', language)}</h3>
               <p className='prose-copy'>{hero.background || t('Not recorded', language)}</p>
            </div>
            <div>
               <h3>{t('Biography', language)}</h3>
               <p className='prose-copy'>{hero.biography || t('Not recorded', language)}</p>
            </div>
         </section>
         {editing && (
            <HeroEditor hero={hero} sections={editing} isSaving={save.isPending}
               onClose={() => setEditing(null)} onSave={(values) => save.mutate(values)} />
         )}
         {statsQuery.isPending && (
            <div className='overview-loading'>{t('Loading base attributes...', language)}</div>
         )}
         {statsQuery.isError && (
            <div className='overview-loading'>{t('Stats are not available yet.', language)}</div>
         )}
         {statsQuery.data && (
            <StatsOverview stats={statsQuery.data} language={language} />
         )}
      </div>
   )
}

function StatsOverview({
   stats,
   language,
}: {
   stats: Stats
   language: ReturnType<typeof useLanguageStore.getState>['language']
}) {
   const { spendAP } = useAdvancementMode(stats.charId)
   const [isExperienceEditorOpen, setIsExperienceEditorOpen] = useState(false)
   const [editorScope, setEditorScope] = useState<'resources' | 'experience' | 'fatePoints' | null>(null)
   const [isResting, setIsResting] = useState(false)
   const [checking, setChecking] = useState<TalentAttribute | null>(null)
   // source: DSA5 Regelwerk, S. 274 (Willenstrunk: SK bonus while it runs), S. 216 (Eiserner Wille while focusing)
   const running = useActiveEffects(stats)
   const soulPowerBonus = soulPowerSources(running)
   const soulPowerTotal = soulPowerBonus.reduce((sum, source) => sum + source.value, 0)
   const availableAP = stats.experience.total - stats.experience.spent
   const { _id: id } = stats
   const queryClient = useQueryClient()
   const queryKey = ['stats', stats.charId]
   const incrementFatePointsMutation = useMutation({
      mutationFn: () => incrementFatePoints(id),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKey })
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   // source: DSA5 Regelwerk, S. 31 (end of an adventure: all Schips come back)
   const restoreFatePointsMutation = useMutation({
      mutationFn: () => restoreFatePoints(id),
      onSuccess: (next) => queryClient.setQueryData(queryKey, next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const incrementAttributeMutation = useMutation({
      mutationFn: ({ attribute, value }: { attribute: string; value: number }) => levelUpAttribute(id, { attribute, value, spendAP }),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKey })
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   return (
      <>
         {stats.checkModifiers.unverifiedConditions.length > 0 && <p className='field-error' role='status'>
            {t('No verified automatic modifiers for these conditions; enter their effects manually', language)}:
            {' '}<span lang='de'>{stats.checkModifiers.unverifiedConditions.join(', ')}</span>
         </p>}
         <section className='overview-section'>
            <div className='section-heading'>
               <Swords size={19} />
               <div>
                  <p className='eyebrow'>{t('Foundation', language)}</p>
                  <h2>{t('Base attributes', language)}</h2>
               </div>
               <span className='section-action'>{availableAP} {t('AP available', language)}</span>
            </div>
            <div className='attribute-grid'>
               {attributes.map(([key, , label]) => (
                  <div className='attribute-tile relative' key={key}>
                     <button type='button' className='talent-probe-button attribute-roll-button' onClick={() => setChecking(key)}
                        aria-label={`${t('Attribute check', language)}: ${t(label, language)}`} title={t('Attribute check', language)}><DieIcon sides={20} /></button>
                     <span>{getAttributeAbbreviation(key, language)}</span>
                     <CheckValue stats={stats} base={stats[key]} kind='attribute' checkKey={key} label={getAttributeAbbreviation(key, language)} />
                     <small>{t(label, language)}</small>
                     <AdvancementValue label={t(label, language)} value={stats[key]} cost={nextStepCost(stats[key], 'e')}
                        availableAP={availableAP} spendAP={spendAP} pending={incrementAttributeMutation.isPending}
                        onChange={(value) => incrementAttributeMutation.mutate({ attribute: key, value })} />
                  </div>
               ))}
            </div>
            {checking && <AttributeCheckDialog stats={stats} attribute={checking} onClose={() => setChecking(null)} />}
         </section>
         <section className='overview-section overview-resources'>
            <div className='section-heading'>
               <HeartPulse size={19} />
               <div>
                  <p className='eyebrow'>{t('Vital forces', language)}</p>
                  <h2>{t('Resources', language)}</h2>
               </div>
               <button className='quiet-button section-action' type='button' aria-haspopup='dialog' onClick={() => setIsResting(true)}>
                  <Moon size={16} />{t('Rest', language)}
               </button>
               <button className='quiet-button section-action' type='button' onClick={() => setEditorScope('resources')}>
                  <Pencil size={16} />{t('Edit resources', language)}
               </button>
            </div>
            {isResting && <RegenerationDialog stats={stats} onClose={() => setIsResting(false)} />}
            <div className='resource-grid'>
               <ResourceMeter
                  label={t('Health', language)}
                  resource={stats.health}
                  action={<ResourceAdvancement stats={stats} resourceKey='health' label='Health' />}
               />
               <ResourceMeter
                  label={soulPowerTotal ? `${t('Soul power', language)} (${soulPowerBonus.map((source) => `+${source.value} ${t(source.label, language)}`).join(', ')})` : t('Soul power', language)}
                  resource={soulPowerTotal ? { ...stats.soulPower, max: stats.soulPower.max + soulPowerTotal } : stats.soulPower}
                  action={!running.some((effect) => effect.key === 'ironWill') && stats.generalSpecialAbilities.some((name) => name.startsWith('Eiserner Wille'))
                     ? <IronWillButton stats={stats} language={language} /> : undefined}
                  isStatic
               />
               <ResourceMeter label={t('Mana', language)} resource={stats.mana}
                  action={stats.isSorcerer ? <ResourceAdvancement stats={stats} resourceKey='mana' label='Mana' /> : undefined} />
               <ResourceMeter
                  label={t('Karma energy', language)}
                  resource={stats.karmaEnergy}
                  action={stats.isConsecratedPerson ? <ResourceAdvancement stats={stats} resourceKey='karmaEnergy' label='Karma energy' /> : undefined}
               />
               <ResourceMeter
                  label={t('Toughness', language)}
                  resource={stats.toughness}
                  isStatic
               />
               <ResourceMeter label={t('Dodge', language)} resource={stats.dodge} isStatic checkStats={stats} />
            </div>
            {/* source: DSA5 Regelwerk, S. 165, 167, 168, 171, 172, 179 (SK/ZK against one kind of threat only; not applied automatically) */}
            {stats.conditionalResistances.map((entry) => {
               const hardToEnchant = entry.label === 'Schwer zu verzaubern'
               return <p key={entry.label} className='combat-note'>
                  {t(hardToEnchant ? 'Spells on the hero are {value} harder (Einfluss, Heilung, Hellsicht, Verwandlung and SK/ZK spells, even wanted ones)'
                     : resistanceTexts[entry.against], language)
                     .replace('{value}', hardToEnchant ? String(entry.value) : entry.value > 0 ? `+${entry.value}` : `−${-entry.value}`)}
                  {' · '}{translateRuleLabel(entry.label, language)}, {t('S.', language)} {entry.page}
               </p>
            })}
         </section>
         <section className='overview-section'>
            <header className='section-heading'>
               <Star size={19} /><h2>{t('Fate points', language)}</h2>
               <button className='quiet-button section-action' type='button' onClick={() => setEditorScope('fatePoints')}>
                  <Pencil size={16} />{t('Edit fate points', language)}
               </button>
            </header>
            <div className='fate-summary'>
               <div className='fate-balance'>
                  <Star size={24} aria-hidden='true' />
                  <strong>{stats.fatePoints.current} <small>/ {stats.fatePoints.max}</small></strong>
                  <span>{t('Available', language)}</span>
               </div>
                  <button
                     type='button'
                     className='quiet-button'
                     disabled={incrementFatePointsMutation.isPending || stats.fatePoints.current >= stats.fatePoints.max}
                     onClick={() => incrementFatePointsMutation.mutate()}
                  >
                     <ArrowUp size={16} />
                     {t('Get Fate', language)}
                  </button>
                  <button type='button' className='quiet-button'
                     disabled={restoreFatePointsMutation.isPending || stats.fatePoints.current >= stats.fatePoints.max}
                     onClick={() => restoreFatePointsMutation.mutate()}>
                     <Star size={16} />{t('Refill all', language)}
                  </button>
                  <p className='fate-regain'>{t('+1: start of a session, end of an adventure chapter, a heroic deed. All: end of an adventure. The GM decides (S. 31).', language)}</p>
            </div>
         </section>
         <section className='overview-section'>
            <header className='section-heading'>
               <ArrowUp size={19} /><h2>{t('Experience', language)}</h2>
               <div className='section-action combat-actions'>
                  <button className='quiet-button' type='button' onClick={() => setIsExperienceEditorOpen(true)}>
                     <ArrowUp size={16} />{t('Add experience', language)}
                  </button>
                  <button className='quiet-button' type='button' onClick={() => setEditorScope('experience')}>
                     <Pencil size={16} />{t('Edit experience', language)}
                  </button>
               </div>
            </header>
            <div className='experience-summary'>
               <div>
                  <span>{t('Available AP', language)}</span>
                  <strong>{availableAP}</strong>
               </div>
               <div>
                  <span>{t('Experience spent', language)}</span>
                  {/* Net of the disadvantage AP: they count as negative costs within the EG budget (S. 38, 46) */}
                  <strong>{stats.experience.spent - stats.experience.disadvantageCredit}</strong>
               </div>
               <div>
                  <span>{t('Experience level', language)}</span>
                  <strong>{t(stats.level, language)}</strong>
               </div>
            </div>
            <div className='experience-ledger'>
               <span>{t('Total AP', language)}: <strong>{stats.experience.total - stats.experience.disadvantageCredit}</strong></span>
               <span>{t('Earned in adventures', language)}: <strong>{stats.experience.gathered}</strong> AP</span>
               {stats.experience.disadvantageCredit > 0 && <span>{t('Disadvantages at creation', language)}: <strong>−{stats.experience.disadvantageCredit}</strong> AP
                  <small> ({t('included in spent', language)})</small></span>}
            </div>
         </section>
         <section className='overview-section overview-traits'>
            <div className='section-heading'>
               <Star size={19} />
               <div>
                  <p className='eyebrow'>{t('Character edges', language)}</p>
                  <h2>{t('Advantages & abilities', language)}</h2>
               </div>
            </div>
            <div className='trait-grid'>
               <CharacterEntryList stats={stats} category='advantages' />
               <CharacterEntryList stats={stats} category='disadvantages' />
               <CharacterEntryList stats={stats} category='generalSpecialAbilities' groups={['general', 'fate', 'karma']} />
            </div>
         </section>
         {isExperienceEditorOpen && <ExperienceEditor stats={stats} onClose={() => setIsExperienceEditorOpen(false)} />}
         {editorScope && <StatsEditor stats={stats} scope={editorScope} onClose={() => setEditorScope(null)} />}
      </>
   )
}

function ResourceAdvancement({ stats, resourceKey, label }: { stats: Stats; resourceKey: VitalResourcesType; label: string }) {
   const language = useLanguageStore((state) => state.language)
   const { spendAP } = useAdvancementMode(stats.charId)
   const queryClient = useQueryClient()
   const value = stats[resourceKey].additionalPurchase
   const mutation = useMutation({
      mutationFn: (target: number) => purchaseAdditionalVitalResources(stats._id, resourceKey, spendAP, target),
      onSuccess: (next) => queryClient.setQueryData(['stats', stats.charId], next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   return <div className='resource-advancement'>
      <small>{t('additional purchase', language)}: {value}</small>
      <AdvancementValue label={t(label, language)} value={value} cost={nextStepCost(value, 'd')}
         availableAP={stats.experience.total - stats.experience.spent} spendAP={spendAP}
         pending={mutation.isPending} onChange={mutation.mutate} />
   </div>
}

// source: DSA5 Regelwerk, S. 216 (Eiserner Wille: focus to raise SK; ended from the active effects strip)
function IronWillButton({ stats, language }: { stats: Stats; language: 'de' | 'en' }) {
   const queryClient = useQueryClient()
   const mutation = useMutation({
      mutationFn: () => startAbilityEffect(stats._id, 'Eiserner Wille'),
      onSuccess: ({ stats: next, effects }) => {
         queryClient.setQueryData(['stats', stats.charId], next)
         queryClient.setQueryData(activeEffectsKey(stats._id), effects)
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   return <button className='quiet-button' type='button' disabled={mutation.isPending} onClick={() => mutation.mutate()}
      title={t('SK +level, all other checks −level; Betäubung I when it ends (S. 216).', language)}>
      <Brain size={15} />{t('Focus: Eiserner Wille', language)}
   </button>
}
