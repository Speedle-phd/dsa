import { useEffect, useRef, useState } from 'react'

const focusableSelector = [
   'button:not(:disabled)',
   'input:not(:disabled)',
   'select:not(:disabled)',
   'textarea:not(:disabled)',
   '[href]',
   '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function useModalKeyboard(onClose: () => void) {
   const dialogRef = useRef<HTMLElement>(null)
   const closeRef = useRef(onClose)
   // Captured on the first render: React's autoFocus moves focus into the dialog before effects run
   const [opener] = useState(() => document.activeElement)
   const autoFocusedRef = useRef<HTMLElement | null>(null)

   useEffect(() => {
      closeRef.current = onClose
   }, [onClose])

   useEffect(() => {
      const dialog = dialogRef.current
      if (!dialog) return

      const elements = () =>
         Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
      // Keep the field React's autoFocus focused (it renders no attribute). Remembered, because StrictMode's
      // second effect run follows a cleanup that already returned focus to the opener.
      if (!autoFocusedRef.current && document.activeElement instanceof HTMLElement && dialog.contains(document.activeElement)) {
         autoFocusedRef.current = document.activeElement
      }
      const initiallyFocused = (autoFocusedRef.current?.isConnected ? autoFocusedRef.current : null) ??
         dialog.querySelector<HTMLElement>('[autofocus]') ?? elements()[0]
      initiallyFocused?.focus()

      function handleKeyDown(event: KeyboardEvent) {
         // Only the topmost of stacked dialogs reacts.
         if (Array.from(document.querySelectorAll('[aria-modal="true"]')).at(-1) !== dialog) return
         if (event.key === 'Escape') {
            event.preventDefault()
            closeRef.current()
            return
         }

         if (event.key !== 'Tab') return
         const focusableElements = elements()
         const first = focusableElements[0]
         const last = focusableElements.at(-1)

         if (!first || !last) return
         if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last.focus()
         } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
         }
      }

      document.addEventListener('keydown', handleKeyDown)
      return () => {
         document.removeEventListener('keydown', handleKeyDown)
         if (opener instanceof HTMLElement && opener.isConnected) opener.focus()
      }
   }, [opener])

   return dialogRef
}
