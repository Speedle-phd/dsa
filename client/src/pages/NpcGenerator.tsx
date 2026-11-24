import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Plus, Wand2, X } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DashboardHeader } from '@/components/DashboardHeader'
import { PageHeading } from '@/components/PageHeading'
import { QuantityStepper } from '@/components/QuantityStepper'
import { attributeLabels, getAttributeAbbreviation } from '@/features/heroes/talentCatalog'
import { deriveNpc, type DerivedPart } from '@/features/npcs/npcApi'
import { AbilityChips } from '@/features/npcs/NpcEditor'
import { armorOptions, generatorWeapons, presetInput, roleLabels, roles, speciesOptions, storeWeapon, tierLabels, tiers, type GeneratorInput, type Role, type Tier } from '@/features/npcs/npcPresets'
import { attributeOrder, weaponSummary, type NpcDraftState } from '@/features/npcs/npcSheet'
import { useLanguageStore } from '@/locales/languageStore'
import { t, translateRuleLabel } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'

// NPC generator (user request, Nov 2026): a role and experience fill in typical values (app choice); the server derives
// LeP, SK, ZK, AW, INI, GS, AT/PA/TP and RS/BE with the hero rules; the GM checks and saves in the editor
export function NpcGenerator() {
   const language = useLanguageStore((state) => state.language)
   const navigate = useNavigate()
   const [role, setRole] = useState<Role>('fighter')
   const [tier, setTier] = useState<Tier>('average')
   const [input, setInput] = useState<GeneratorInput>(() => presetInput('fighter', 'average'))
   const [addWeapon, setAddWeapon] = useState('')
   const deferred = useDeferredValue(input)
   const derived = useQuery({ queryKey: ['npc-derive', deferred], queryFn: () => deriveNpc(deferred), placeholderData: keepPreviousData, retry: false })
   const npc = derived.data?.draft
   const breakdown = derived.data?.breakdown

   function choose(nextRole: Role, nextTier: Tier) {
      setRole(nextRole)
      setTier(nextTier)
      setInput(presetInput(nextRole, nextTier, input.species))
   }
   const set = (change: Partial<GeneratorInput>) => setInput((current) => ({ ...current, ...change }))
   function takeOver() {
      if (!npc) return
      const state: NpcDraftState = { name: `${t(roleLabels[role], language)} (${t(tierLabels[tier], language)})`, draft: npc, source: 'generator' }
      navigate('/npcs/new', { state })
   }
   const explain = (parts: DerivedPart[]) => parts.map((part, index) => `${index > 0 ? (part.value < 0 ? '− ' : '+ ') : ''}${index > 0 ? Math.abs(part.value) : part.value} (${translateRuleLabel(part.label, language)})`).join(' ')

   return <main className='dashboard-shell' lang={language}>
      <DashboardHeader />
      <section className='dashboard-content'>
         <Link className='back-link' to='/npcs'><ArrowLeft size={17} /> {t('NPC library', language)}</Link>
         <PageHeading Icon={Wand2} title={t('Generate an NPC', language)}
            description={t('Role and experience are suggestions (the core rules have no NPC tables); all values are computed with the hero rules.', language)} />
         <div className='npc-generator'>
            <div className='npc-generator-inputs'>
               <section className='overview-section'>
                  <header className='section-heading'><h2>{t('Role', language)}</h2></header>
                  <div className='probe-segmented'>{roles.map((entry) => <button key={entry} type='button' aria-pressed={role === entry}
                     className={`probe-chip${role === entry ? ' is-active' : ''}`} onClick={() => choose(entry, tier)}>{t(roleLabels[entry], language)}</button>)}</div>
                  <h3 className='npc-generator-sub'>{t('Experience', language)}</h3>
                  <div className='probe-segmented'>{tiers.map((entry) => <button key={entry} type='button' aria-pressed={tier === entry}
                     className={`probe-chip${tier === entry ? ' is-active' : ''}`} onClick={() => choose(role, entry)}>{t(tierLabels[entry], language)}</button>)}</div>
                  <label className='field-group'><span>{t('Species', language)}</span>
                     <select value={input.species} onChange={(event) => set({ species: event.target.value })}>
                        {speciesOptions.map((species) => <option key={species} value={species}>{translateRuleLabel(species, language)}</option>)}
                     </select></label>
               </section>

               <section className='overview-section'>
                  <header className='section-heading'><h2>{t('Attributes', language)}</h2></header>
                  <div className='npc-generator-attributes'>
                     {attributeOrder.map((key) => <div key={key} className='field-group' title={t(attributeLabels[key], language)}>
                        <span>{getAttributeAbbreviation(key, language)}</span>
                        <QuantityStepper value={input.attributes[key]} min={1} max={25} label={t(attributeLabels[key], language)}
                           onChange={(value) => set({ attributes: { ...input.attributes, [key]: value } })} />
                     </div>)}
                  </div>
               </section>

               <section className='overview-section'>
                  <header className='section-heading'><h2>{t('Weapons and combat techniques', language)}</h2></header>
                  <ul className='npc-generator-weapons'>
                     {input.weapons.map((weapon, index) => <li key={`${weapon.name}-${index}`}>
                        <span><strong>{t(weapon.name, language)}</strong><small>{translateRuleLabel(weapon.technique, language)}</small></span>
                        <QuantityStepper value={input.techniques[weapon.technique] ?? 6} min={0} max={20} label={`${t('Combat technique', language)}: ${translateRuleLabel(weapon.technique, language)}`}
                           onChange={(value) => set({ techniques: { ...input.techniques, [weapon.technique]: value } })} />
                        <button type='button' className='icon-button' aria-label={`${t('Remove', language)}: ${weapon.name}`}
                           onClick={() => set({ weapons: input.weapons.filter((_, slot) => slot !== index) })}><X size={15} aria-hidden='true' /></button>
                     </li>)}
                  </ul>
                  <div className='npc-ability-add'>
                     <select value={addWeapon} aria-label={t('Add a weapon', language)} onChange={(event) => setAddWeapon(event.target.value)}>
                        <option value=''>{t('Add a weapon', language)}…</option>
                        {generatorWeapons.map((name) => <option key={name} value={name}>{t(name, language)}</option>)}
                     </select>
                     <button type='button' className='quiet-button' disabled={!addWeapon} onClick={() => {
                        const weapon = storeWeapon(addWeapon)
                        if (weapon) set({ weapons: [...input.weapons, weapon].slice(0, 8), techniques: { [weapon.technique]: 10, ...input.techniques } })
                        setAddWeapon('')
                     }}><Plus size={15} aria-hidden='true' />{t('Add', language)}</button>
                  </div>
                  <label className='field-group'><span>{t('Armor', language)}</span>
                     <select value={input.armor ?? ''} onChange={(event) => set({ armor: event.target.value || null })}>
                        <option value=''>{t('None', language)}</option>
                        {armorOptions.map((armor) => <option key={armor} value={armor}>{t(armor, language)}</option>)}
                     </select></label>
               </section>

               <section className='overview-section'>
                  <header className='section-heading'><h2>{t('Special abilities', language)}</h2></header>
                  <AbilityChips abilities={input.abilities} onChange={(abilities) => set({ abilities: abilities.slice(0, 30) })} />
               </section>
            </div>

            <section className='overview-section npc-generator-result' aria-live='polite'>
               <header className='section-heading'><h2>{t('Result', language)}</h2></header>
               {derived.isError && <p className='field-error'>{getErrorMessage(derived.error)}</p>}
               {npc && breakdown && <>
                  <dl className='npc-generator-values'>
                     <div><dt>{t('LeP', language)} {npc.maxHealth}</dt><dd>{explain(breakdown.maxHealth)}</dd></div>
                     <div><dt>{t('INI', language)} {npc.initiativeBase}+1W6</dt><dd>{explain(breakdown.initiativeBase)}</dd></div>
                     <div><dt>{t('AW', language)} {npc.dodge}</dt><dd>{explain(breakdown.dodge)}</dd></div>
                     <div><dt>{t('SK', language)} {npc.sheet?.soulPower} · {t('ZK', language)} {npc.sheet?.toughness}</dt>
                        <dd>{explain(breakdown.soulPower)}; {explain(breakdown.toughness)}</dd></div>
                     <div><dt>{t('GS', language)} {npc.speed}</dt><dd>{explain(breakdown.speed)}</dd></div>
                     <div><dt>{t('RS', language)}/{t('BE', language)} {npc.armor}/{npc.sheet?.burden ?? 0}</dt><dd>{input.armor ? t(input.armor, language) : t('None', language)}</dd></div>
                  </dl>
                  {npc.sheet && <p className='npc-card-weapons'>{weaponSummary(npc.sheet.weapons)}</p>}
                  <p className='party-muted'>{t('AT/PA include the combat technique, the attribute bonus, the weapon and Belastung; TP the damage bonus.', language)}</p>
               </>}
               <button className='primary-button' type='button' disabled={!npc || derived.isFetching} onClick={takeOver}>{t('Check and save', language)}</button>
            </section>
         </div>
      </section>
   </main>
}
