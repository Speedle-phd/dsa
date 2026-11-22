import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { FormEvent } from 'react'
import { Dices, Minus, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { DieIcon } from './DieIcon'
import { throwDice as throwOnLayer } from './diceEngine'
import { useModalKeyboard } from './useModalKeyboard'
import { useScrollingDown } from './scrollHooks'
import { useLanguageStore } from '../locales/languageStore'
import type { Language } from '../locales/languageStore'
import { t } from '../locales/translation'

const diceSides = [4, 6, 8, 10, 12, 20, 100] as const
const maxDice = 20

type DieSides = (typeof diceSides)[number]
type DiceCounts = Record<DieSides, number>

const initialCounts: DiceCounts = {
   4: 0,
   6: 0,
   8: 0,
   10: 0,
   12: 0,
   20: 1,
   100: 0,
}

const totalDice = (counts: DiceCounts) =>
   diceSides.reduce((total, sides) => total + counts[sides], 0)

const dieLabel = (sides: DieSides, language: Language) =>
   `${language === 'de' ? 'W' : 'd'}${sides}`

export function DiceRoller() {
   const language = useLanguageStore((state) => state.language)
   const [isOpen, setIsOpen] = useState(false)
   const [counts, setCounts] = useState(initialCounts)
   // The launcher would cover the login form and has no use before signing in.
   const showLauncher = useLocation().pathname !== '/login'
   // On phones the launcher covers row ends; it hides while scrolling down and returns on scroll up (CSS, ≤ 760 px).
   const scrollingDown = useScrollingDown()

   async function throwDice(selection: DiceCounts) {
      setCounts(selection)
      setIsOpen(false)
      try {
         await throwOnLayer(
            diceSides
               .filter((sides) => selection[sides] > 0)
               .map((sides) => ({ qty: selection[sides], sides })),
         )
      } catch {
         toast.error(t('The dice could not be thrown.', language))
      }
   }

   return (
      <>
         <div
            id='dice-roll-layer'
            className='dice-roll-layer'
            aria-hidden='true'
         />
         {showLauncher && <button
            className={scrollingDown ? 'dice-launcher is-tucked' : 'dice-launcher'}
            type='button'
            aria-haspopup='dialog'
            aria-label={t('Open dice roller', language)}
            title={t('Dice roller', language)}
            onClick={() => setIsOpen(true)}
         >
            <DieIcon sides={20} />
         </button>}
         {isOpen && (
            <DiceSelectionDialog
               initialSelection={counts}
               language={language}
               onClose={() => setIsOpen(false)}
               onThrow={(selection) => void throwDice(selection)}
            />
         )}
      </>
   )
}

interface DiceSelectionDialogProps {
   initialSelection: DiceCounts
   language: Language
   onClose: () => void
   onThrow: (selection: DiceCounts) => void
}

function DiceSelectionDialog({
   initialSelection,
   language,
   onClose,
   onThrow,
}: DiceSelectionDialogProps) {
   const dialogRef = useModalKeyboard(onClose)
   const [selection, setSelection] = useState(initialSelection)
   const total = totalDice(selection)
   const formula = diceSides
      .filter((sides) => selection[sides] > 0)
      .map((sides) => `${selection[sides]}${dieLabel(sides, language)}`)
      .join(' + ')

   function setCount(sides: DieSides, value: number) {
      const otherDice = total - selection[sides]
      const count = Math.max(
         0,
         Math.min(maxDice - otherDice, Math.trunc(value) || 0),
      )
      setSelection((current) => ({ ...current, [sides]: count }))
   }

   function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      if (total > 0) onThrow(selection)
   }

   return (
      <div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
         <section
            ref={dialogRef}
            className='hero-editor dice-roller-dialog'
            role='dialog'
            aria-modal='true'
            aria-labelledby='dice-roller-title'
            onMouseDown={(event) => event.stopPropagation()}
         >
            <header className='editor-header'>
               <div>
                  <p className='eyebrow'>{t('Dice roller', language)}</p>
                  <h2 id='dice-roller-title'>{t('Choose dice', language)}</h2>
               </div>
               <button
                  className='icon-button editor-close'
                  type='button'
                  onClick={onClose}
                  aria-label={t('Close dice roller', language)}
               >
                  <X size={20} />
               </button>
            </header>
            <form className='dice-roller-form' onSubmit={submit} noValidate>
               <div className='dice-choice-grid'>
                  {diceSides.map((sides) => {
                     const label = dieLabel(sides, language)
                     const count = selection[sides]
                     return (
                        <div
                           className={`dice-choice${count > 0 ? ' is-selected' : ''}`}
                           key={sides}
                        >
                           <button
                              className='dice-choice-pick'
                              type='button'
                              disabled={total >= maxDice}
                              aria-label={`${t('Add one', language)} ${label}`}
                              onClick={() => setCount(sides, count + 1)}
                           >
                              <DieIcon sides={sides} />
                              <span className='dice-choice-label'>{label}</span>
                           </button>
                           <div className='dice-count-control'>
                              <button
                                 className='icon-button'
                                 type='button'
                                 disabled={count === 0}
                                 aria-label={`${t('Remove one', language)} ${label}`}
                                 onClick={() => setCount(sides, count - 1)}
                              >
                                 <Minus size={16} />
                              </button>
                              <input
                                 type='number'
                                 inputMode='numeric'
                                 min='0'
                                 max={maxDice}
                                 value={count}
                                 aria-label={`${t('Amount', language)} ${label}`}
                                 onFocus={(event) => event.target.select()}
                                 onChange={(event) =>
                                    setCount(sides, event.target.valueAsNumber)
                                 }
                              />
                              <button
                                 className='icon-button'
                                 type='button'
                                 disabled={total >= maxDice}
                                 aria-label={`${t('Add one', language)} ${label}`}
                                 onClick={() => setCount(sides, count + 1)}
                              >
                                 <Plus size={16} />
                              </button>
                           </div>
                        </div>
                     )
                  })}
               </div>
               <div className='dice-roller-summary' aria-live='polite'>
                  <strong>{formula || '—'}</strong>
                  <span>
                     {t('Dice selected: {count} of {max}', language)
                        .replace('{count}', () => String(total))
                        .replace('{max}', () => String(maxDice))}
                  </span>
               </div>
               <footer className='editor-actions'>
                  <button
                     className='quiet-button'
                     type='button'
                     disabled={total === 0}
                     onClick={() => setSelection({ ...initialCounts, 20: 0 })}
                  >
                     {t('Reset', language)}
                  </button>
                  <button
                     className='primary-button'
                     type='submit'
                     disabled={total === 0}
                  >
                     <Dices size={18} />
                     {t('Throw dice', language)}
                  </button>
               </footer>
            </form>
         </section>
      </div>
   )
}
