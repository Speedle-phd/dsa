import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Hammer, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import type { Stats } from '@/features/heroes/statsApi'
import { talentCatalog } from '@/features/heroes/talentCatalog'
import { TalentProbeDialog } from '@/features/heroes/TalentProbeDialog'
import { ProbeStepper } from '@/features/heroes/ProbeDialog'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { craftHerbal, type Recipe } from './herbApi'

// Making a plant recipe (AdK S. 144): one Pflanzenkunde check, modified by the Verarbeitungsschwierigkeit (Hilfsmittel) or half
// the level (poisons, drugs), turns `amount` applications of each main plant into as many products. One check for the batch,
// and a failure loses the plants (user decisions, Nov 2026).
export function CraftHerbalDialog({ stats, recipe, available, onClose }: { stats: Stats; recipe: Recipe; available: number; onClose: () => void }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const titleId = useId()
   const dialogRef = useModalKeyboard(onClose)
   const [amount, setAmount] = useState(1)
   const [rolling, setRolling] = useState(false)
   const checkResult = useRef<boolean | null>(null)
   // Pflanzenkunde, or the talent the recipe names (Liebesküchlein: Lebensmittelbearbeitung; Menchal-Rüstung: also Lederbearbeitung)
   const options = recipe.craftTalents.length ? recipe.craftTalents : [{ talent: 'pflanzenkunde', modifier: recipe.craftModifier ?? 0 }]
   const [choice, setChoice] = useState(options[0])
   const talent = talentCatalog.find((entry) => entry.key === choice.talent)
   const modifier = choice.modifier
   const known = !recipe.secret || stats.generalSpecialAbilities.includes(`Berufsgeheimnis (${recipe.key})`)
   const mutation = useMutation({
      mutationFn: (success: boolean) => craftHerbal(stats._id, { recipe: recipe.key, amount, talent: choice.talent, check: { success } }),
      onSuccess: (result) => {
         queryClient.setQueryData(['stats', stats.charId], result.stats)
         if (result.crafted) toast.success(t('{amount} × {name} made.', language).replace('{amount}', String(result.crafted)).replace('{name}', recipe.key))
         else toast.error(t('The check failed: the plants are lost (S. 144).', language))
         onClose()
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   if (rolling && talent) return <TalentProbeDialog stats={stats} talent={talent} fixedApplication={choice.application}
      value={stats.talents.find((entry) => entry.key === choice.talent)?.value ?? 0}
      extraSources={modifier ? [{ label: `${t(recipe.kind === 'hilfsmittel' ? 'Processing difficulty' : 'Half the poison level', language)} (AdK S. 144)`, value: modifier }] : []}
      renderResult={({ result }) => { checkResult.current = result.success; return null }}
      onClose={() => {
         setRolling(false)
         if (checkResult.current !== null) mutation.mutate(checkResult.current)
      }} />

   return createPortal(
      <div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
         <section ref={dialogRef} className='hero-editor herb-search-dialog' lang={language} role='dialog' aria-modal='true' aria-labelledby={titleId}
            onMouseDown={(event) => event.stopPropagation()}>
            <header className='editor-header'>
               <div><p className='eyebrow'>Archiv der Kräuter · AdK S. 144, {recipe.page}</p><h2 id={titleId}>{t('Make', language)}: <span lang='de'>{recipe.key}</span></h2></div>
               <button className='icon-button editor-close' type='button' onClick={onClose} aria-label={t('Close', language)}><X size={20} /></button>
            </header>
            <div className='store-purchase-body'>
               <p>{t('One check makes the whole batch: each product uses one application of the main plant. On a failure the plants are lost.', language)}</p>
               {options.length > 1 && <div className='probe-segmented' role='group' aria-label={t('Check', language)}>
                  {options.map((option) => { const label = t(talentCatalog.find((entry) => entry.key === option.talent)?.label ?? option.talent, language)
                     return <button key={option.talent} type='button' aria-pressed={choice.talent === option.talent} className={choice.talent === option.talent ? 'is-active' : ''}
                        onClick={() => setChoice(option)}>{label} {option.modifier > 0 ? `+${option.modifier}` : option.modifier === 0 ? '±0' : `−${Math.abs(option.modifier)}`}</button> })}
               </div>}
               {!known && <p className='field-error'>{t('This recipe is a Berufsgeheimnis (AdK S. 148).', language)}</p>}
               <div className='herb-search-fields'>
                  <div className='field-group'><span aria-hidden='true'>{t('Amount', language)}</span>
                     <ProbeStepper value={amount} min={1} max={Math.min(available, 50)} onChange={setAmount} label={t('Amount', language)}
                        lowerLabel={t('Fewer', language)} raiseLabel={t('More', language)} /></div>
               </div>
               <p className='herb-search-sum'>
                  {t('Uses', language)} <strong lang='de'>{recipe.mainPlants.map((group) => `${amount} × ${group.join(` ${t('or', language)} `)}`).join(', ')}</strong>
                  {' · '}{t(talent?.label ?? choice.talent, language)}{choice.application ? ` (${choice.application})` : ''} <strong>{modifier > 0 ? `+${modifier}` : modifier === 0 ? '±0' : `−${Math.abs(modifier)}`}</strong></p>
               {recipe.optionalPlants.length > 0 && <p className='combat-note'>{t('Optional additions (not taken from the inventory):', language)} <span lang='de'>{recipe.optionalPlants.join(', ')}</span></p>}
               {recipe.tools && <p className='combat-note'>{t('Typical tools', language)}: <span lang='de'>{recipe.tools}</span></p>}
               <footer className='store-purchase-footer'>
                  <span className='combat-note'>{t('{count} applications available', language).replace('{count}', String(available))}</span>
                  <div className='modal-actions'>
                     <button type='button' className='quiet-button' onClick={onClose}>{t('Cancel', language)}</button>
                     <button type='button' className='primary-button' disabled={mutation.isPending || amount > available || !known}
                        onClick={() => { checkResult.current = null; setRolling(true) }}>
                        <Hammer size={16} aria-hidden='true' />{t('Roll {talent}', language).replace('{talent}', t(talent?.label ?? choice.talent, language))}</button>
                  </div>
               </footer>
            </div>
         </section>
      </div>,
      document.body,
   )
}
