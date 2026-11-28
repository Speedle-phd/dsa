import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FlaskConical, Leaf, Skull, X } from 'lucide-react'
import { useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { useModalKeyboard } from '@/components/useModalKeyboard'
import { useLanguageStore, type Language } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { aventurianStore } from '@/utils/aventurian_store'
import { getErrorMessage } from '@/utils/errorHandling'
import { catalogEntry, equipmentDisplayName } from '@/utils/storePricing'
import { activeEffectsKey, consumeItem, type ConsumeOutcome } from './activeEffectsApi'
import { useHerbReference } from '@/features/herbs/herbApi'
import { herbEffectText } from '@/features/herbs/herbStore'
import { parseDamage } from './combatRoll'
import { rollDamage } from './fightHelpers'
import type { EquipmentEntry, Stats } from './statsApi'

// source: DSA5 Regelwerk, S. 272 (Heiltrank), S. 274 (Zaubertrank)
const potionDice = ['1W3', '1W6', '1W6+2', '1W6+4', '1W6+6', '1W6+8']
const weaponItems = new Set(Object.values(aventurianStore).flat().filter((item) => item.weapon && item.kind !== 'shield').map((item) => item.name))
const weaponTargets = ['Waffenbalsam', 'Arax', 'Kelmon', 'Tulmadron', 'Wurara']
const potionColor = '#2f8f6f'

export function ConsumeDialog({ stats, entry, index, onClose }: { stats: Stats; entry: EquipmentEntry; index: number; onClose: () => void }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const titleId = useId()
   const dialogRef = useModalKeyboard(onClose)
   const catalog = catalogEntry(entry.item)
   const item = catalog?.item
   const quality = entry.quality ?? catalog?.variant?.quality
   const name = item?.name ?? entry.item
   const weapons = [...new Set(stats.equipment.filter((other) => other.amount > 0 && weaponItems.has(other.item)).map((other) => other.item))]
   const needsWeapon = weaponTargets.includes(name)
   const [weapon, setWeapon] = useState(weapons[0] ?? '')
   const [cure, setCure] = useState(false)
   const [confirmWeaker, setConfirmWeaker] = useState(false)
   const [needsConfirm, setNeedsConfirm] = useState(false)
   const [rolls, setRolls] = useState<number[] | null>(null)
   const dice = (name === 'Heiltrank' || name === 'Zaubertrank') && quality ? parseDamage(potionDice[quality - 1]) : null
   const poisoned = (stats.statuses ?? []).includes('Vergiftet')
   const noMana = name === 'Zaubertrank' && !(stats.mana.max > 0)
   const blocked = noMana ? t('This hero has no astral energy to restore.', language)
      : needsWeapon && !weapon ? t('No weapon in the equipment.', language)
         : needsConfirm && !confirmWeaker ? t('Confirm that you use it anyway.', language) : null

   const mutation = useMutation({
      mutationFn: async () => {
         const rolled = dice ? await rollDamage(dice, potionColor) : []
         if (dice) setRolls(rolled)
         return consumeItem(stats._id, { index, item: entry.item, rolls: rolled, ...(needsWeapon ? { weapon } : {}), cure, confirmWeaker })
      },
      onSuccess: ({ stats: next, effects, outcome }) => {
         queryClient.setQueryData(['stats', stats.charId], next)
         queryClient.setQueryData(activeEffectsKey(stats._id), effects)
         toast.success(outcomeMessage(outcome, language))
         onClose()
      },
      onError: (error) => {
         const message = getErrorMessage(error)
         if (message.includes('stronger effect')) setNeedsConfirm(true)
         toast.error(message)
      },
   })

   // Plants of Archiv der Kräuter: the summary per route from the book data (the core herbs keep their store text)
   const adkHerb = useHerbReference(Boolean(entry.herb) || !item).data?.herbs.find((herb) => herb.key === entry.item) ?? null
   const isHerb = item?.kind === 'herb' || adkHerb !== null
   const effectText = item?.alchemy && quality ? item.alchemy.levels[quality - 1]?.[language]
      : adkHerb ? herbEffectText(adkHerb)[language] : item?.herb?.effect[language]
   const Icon = item?.kind === 'poison' ? Skull : isHerb ? Leaf : FlaskConical
   const action = item?.kind === 'poison' || name === 'Waffenbalsam' ? 'Apply' : isHerb ? 'Use' : 'Drink'
   const pageLabel = adkHerb ? `AdK ${t('S.', language)} ${adkHerb.page}` : item?.sourcePage ? `${t('S.', language)} ${item.alchemy ? '272–274' : item.sourcePage}` : ''

   return createPortal(
      <div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
         <section ref={dialogRef} className='hero-editor consume-dialog' lang={language} role='dialog' aria-modal='true' aria-labelledby={titleId}
            onMouseDown={(event) => event.stopPropagation()}>
            <header className='editor-header'>
               <div>
                  <p className='eyebrow'>{t(isHerb ? 'herb' : item?.kind ?? 'equipment', language)}{pageLabel ? ` · ${pageLabel}` : ''}</p>
                  <h2 id={titleId}>{equipmentDisplayName(entry.item, language)}</h2>
               </div>
               <button className='icon-button editor-close' type='button' onClick={onClose} aria-label={t('Close', language)}><X size={20} /></button>
            </header>

            <div className='store-purchase-body'>
               {effectText && <div className={`store-effect-card${isHerb ? ' is-herb' : ''}`}>
                  <Icon size={18} aria-hidden='true' />
                  <div><strong>{quality ? `${t('Effect at', language)} QS ${quality}` : t('Effect', language)}</strong><p>{effectText}</p></div>
               </div>}
               {item?.poison && <div className='store-effect-card is-poison'>
                  <Skull size={18} aria-hidden='true' />
                  <dl>
                     <div><dt>{t('Check succeeds', language)}</dt><dd>{item.poison.effect[0][language]}</dd></div>
                     <div><dt>{t('Check fails', language)}</dt><dd>{item.poison.effect[1][language]}</dd></div>
                  </dl>
               </div>}

               {dice && <p className='consume-dice'>
                  {t('Roll', language)} <strong>{potionDice[(quality ?? 1) - 1]}</strong>
                  {rolls && <> · {rolls.join(' + ')}{dice.bonus ? ` + ${dice.bonus}` : ''}</>}
               </p>}

               {needsWeapon && <label className='field-group'>
                  <span>{t('Weapon', language)}</span>
                  {weapons.length ? <select value={weapon} onChange={(event) => setWeapon(event.target.value)}>
                     {weapons.map((option) => <option key={option} value={option}>{equipmentDisplayName(option, language)}</option>)}
                  </select> : <small className='field-error'>{t('No weapon in the equipment.', language)}</small>}
               </label>}

               {name === 'Antidot' && (poisoned
                  ? <label className='regen-toggle'>
                     <input type='checkbox' checked={cure} onChange={(event) => setCure(event.target.checked)} />
                     <span><strong>{t('Remove Vergiftet', language)}</strong>
                        <small>{t('Only if the poison’s level is at most QS {quality} (S. 272).', language).replace('{quality}', String(quality ?? 0))}</small></span>
                  </label>
                  : <p className='combat-note'>{t('The hero is not Vergiftet: the antidote is used without effect.', language)}</p>)}

               {needsConfirm && <label className='regen-toggle'>
                  <input type='checkbox' checked={confirmWeaker} onChange={(event) => setConfirmWeaker(event.target.checked)} />
                  <span><strong>{t('Use it anyway', language)}</strong>
                     <small>{t('A stronger effect of this kind is running; only the strongest counts (S. 272). The item is used up without a new effect.', language)}</small></span>
               </label>}
               {adkHerb && !['Wirselkraut', 'Gulmond'].includes(adkHerb.key)
                  ? <p className='combat-note'>{t('The app does not apply this plant’s effect: one application is used up; resolve the effect with the GM.', language)}</p>
                  : <p className='combat-note'>{t('Elixirs take effect at the start of the next combat round (S. 272). Timed effects run until you end them.', language)}</p>}
            </div>

            <footer className='store-purchase-footer'>
               <span className='combat-note'>{t('Remaining', language)}: {entry.amount}</span>
               <div className='modal-actions'>
                  <button type='button' className='quiet-button' onClick={onClose}>{t('Cancel', language)}</button>
                  <button type='button' className='primary-button' disabled={mutation.isPending || blocked !== null}
                     title={blocked ?? undefined} onClick={() => mutation.mutate()}>
                     <Icon size={16} />{t(action, language)}
                  </button>
               </div>
            </footer>
         </section>
      </div>,
      document.body,
   )
}

function outcomeMessage(outcome: ConsumeOutcome, language: Language) {
   if (outcome.kind === 'heal') return t('Healed {amount} LeP.', language).replace('{amount}', String(outcome.amount ?? 0))
   if (outcome.kind === 'mana') return t('Restored {amount} AsP.', language).replace('{amount}', String(outcome.amount ?? 0))
   if (outcome.kind === 'antidote') return t(outcome.cured ? 'Vergiftet removed.' : 'Item used.', language)
   if (outcome.kind === 'effect') return t('Effect started.', language)
   return t('Item used.', language)
}
