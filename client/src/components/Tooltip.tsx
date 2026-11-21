import {
   useEffect,
   useId,
   useLayoutEffect,
   useRef,
   useState,
   type CSSProperties,
   type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

type TooltipProps = {
   content?: string | null
   children: ReactNode
   position?: TooltipPosition
   className?: string
   disabled?: boolean
   clickToToggle?: boolean
   lang?: string
}

export function Tooltip({
   content,
   children,
   position = 'top',
   className,
   disabled = false,
   clickToToggle = false,
   lang,
}: TooltipProps) {
   const tooltipId = useId()
   const triggerRef = useRef<HTMLSpanElement>(null)
   const bubbleRef = useRef<HTMLSpanElement>(null)
   const pinnedRef = useRef(false)
   const [isVisible, setIsVisible] = useState(false)
   const [positionStyle, setPositionStyle] = useState<
      CSSProperties | undefined
   >()

   useEffect(() => {
      if (disabled || !content?.trim() || !isVisible || !triggerRef.current) {
         return
      }

      const updatePosition = () => {
         const bounds = triggerRef.current?.getBoundingClientRect()
         if (!bounds) return

         const tooltipHalfWidth = Math.min(176, (window.innerWidth - 16) / 2)
         const center = Math.min(
            Math.max(bounds.left + bounds.width / 2, tooltipHalfWidth + 8),
            window.innerWidth - tooltipHalfWidth - 8,
         )

         setPositionStyle({
            left: `${center}px`,
            right: 'auto',
            bottom: 'auto',
            top: `${position === 'bottom' ? bounds.bottom + 8 : Math.max(bounds.top - 8, 8)}px`,
            transform:
               position === 'bottom'
                  ? 'translate(-50%, 0)'
                  : position === 'top'
                    ? 'translate(-50%, -100%)'
                    : position === 'left'
                      ? 'translate(-100%, -50%)'
                      : 'translate(0, -50%)',
         })
      }

      updatePosition()
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)

      return () => {
         window.removeEventListener('resize', updatePosition)
         window.removeEventListener('scroll', updatePosition, true)
      }
   }, [content, disabled, isVisible, position])

   useLayoutEffect(() => {
      if (!isVisible || !bubbleRef.current || !triggerRef.current) return

      const bubbleBounds = bubbleRef.current.getBoundingClientRect()
      const triggerBounds = triggerRef.current.getBoundingClientRect()
      const padding = 8

      if (position !== 'top' || bubbleBounds.top >= padding) return

      setPositionStyle((current) => {
         if (!current) return current

         const nextTop = triggerBounds.bottom + padding
         const nextTransform = 'translate(-50%, 0)'

         if (
            current.top === `${nextTop}px` &&
            current.transform === nextTransform
         ) {
            return current
         }

         return {
            ...current,
            top: `${nextTop}px`,
            transform: nextTransform,
         }
      })
   }, [isVisible, position, positionStyle])

   if (disabled || !content || !content.trim()) {
      return <>{children}</>
   }

   return (
      <span
         className={`tooltip-wrapper ${className ?? ''}`.trim()}
         lang={lang}
         onPointerEnter={(event) => {
            if (event.pointerType === 'mouse') setIsVisible(true)
         }}
         onMouseLeave={() => { if (!pinnedRef.current) setIsVisible(false) }}
         onPointerLeave={() => { if (!pinnedRef.current) setIsVisible(false) }}
      >
         <span
            className='tooltip-trigger'
            tabIndex={0}
            aria-describedby={tooltipId}
            ref={triggerRef}
            onFocus={() => setIsVisible(true)}
            onBlur={() => { pinnedRef.current = false; setIsVisible(false) }}
            onKeyDown={(event) => {
               if (event.key === 'Escape') { pinnedRef.current = false; setIsVisible(false) }
               if (clickToToggle && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault()
                  pinnedRef.current = !pinnedRef.current
                  setIsVisible(pinnedRef.current)
               }
            }}
            onPointerDown={(event) => {
               if (clickToToggle) event.stopPropagation()
            }}
            onClick={(event) => {
               if (clickToToggle) {
                  event.preventDefault()
                  event.stopPropagation()
                  pinnedRef.current = !pinnedRef.current
                  setIsVisible(pinnedRef.current)
                  return
               }
               setIsVisible(false)
            }}
         >
            {children}
         </span>
         {isVisible &&
            positionStyle &&
            createPortal(
               <span
                  id={tooltipId}
                  role='tooltip'
                  lang={lang}
                  ref={bubbleRef}
                  className={`tooltip-bubble tooltip-bubble--${position} tooltip-bubble--portal`}
                  style={positionStyle}
               >
                  {content}
               </span>,
               document.body,
            )}
      </span>
   )
}
