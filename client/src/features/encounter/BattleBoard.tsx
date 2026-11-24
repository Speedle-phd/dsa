import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BrickWall, Flame, Mountain, Sprout, TreePine, Waves } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { onPing, sendPing } from '@/realtime/socket'
import { cellAt, cellKey, firstFreeCell, reachableCells, squaresFor, stepPosition } from './boardGeometry'
import { encounterKey, moveCombatant, setObstacles, type Combatant, type Encounter, type ObstacleKind, type Position } from './encounterApi'
import { obstacleLabels } from './obstacleLabels'
import { TokenFace } from './Token'
import { tokenClass, tokenLabel } from './tokenStyle'

const obstacleIcons = { wall: BrickWall, rock: Mountain, tree: TreePine, water: Waves, bush: Sprout, fire: Flame } as const

type Drag = { id: string; pointerId: number; startX: number; startY: number; moved: boolean; cell: Position | null }
type Ping = { id: number; x: number; y: number; by: string }
// A ping shows for 2 s; a long press of 500 ms on touch sends one (user request, Nov 2026)
const pingMs = 2000
const longPressMs = 500
export type TerrainTool = ObstacleKind | 'erase' | null

// Grid battle board, 1 square = `board.scale` Schritt (user decision). Drag & drop with mouse or touch; alternatives: select a token
// and click a square, or arrow keys on a focused token. During the fight a player moves the own hero on the own turn only,
// up to GS squares per move around terrain (S. 228–229); the reachable squares are marked. The GM moves freely and paints terrain.
export function BattleBoard({ encounter, partyId, selectedId, onSelect, moveRange, terrain, overlay }: {
   encounter: Encounter; partyId: string; selectedId: string | null; onSelect: (id: string | null) => void
   // GS of the player's own hero (null = unknown: no distance limit)
   moveRange: number | null; terrain: TerrainTool; overlay?: ReactNode
}) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const boardRef = useRef<HTMLDivElement>(null)
   const [drag, setDrag] = useState<Drag | null>(null)
   const [pending, setPending] = useState<Record<string, Position | null>>({})
   const [planned, setPlanned] = useState<{ id: string; cell: Position } | null>(null)
   const [painting, setPainting] = useState<{ pointerId: number; cells: Map<string, Position> } | null>(null)
   const [announcement, setAnnouncement] = useState('')
   const [pings, setPings] = useState<Ping[]>([])
   const longPress = useRef<{ pointerId: number; x: number; y: number; timer: number } | null>(null)
   // The click (or token release) that ends a long press must not also move or select
   const suppressClick = useRef(false)
   const { board } = encounter
   // Pings only in the running party fight (a prepared fight's scope is "partyId:encounterId")
   const live = !partyId.includes(':')
   const isGm = encounter.role === 'gm'
   const setEncounter = (next: Encounter | null) => queryClient.setQueryData(encounterKey(partyId), next)
   const move = useMutation({
      mutationFn: ({ id, position }: { id: string; position: Position | null }) => moveCombatant(partyId, id, position),
      onMutate: ({ id, position }) => setPending((current) => ({ ...current, [id]: position })),
      onSuccess: setEncounter,
      onError: (error) => toast.error(getErrorMessage(error)),
      onSettled: (_data, _error, { id }) => setPending((current) => {
         const rest = { ...current }
         delete rest[id]
         return rest
      }),
   })
   const paint = useMutation({
      mutationFn: (cells: Array<Position & { kind: ObstacleKind | null }>) => setObstacles(partyId, cells),
      onSuccess: setEncounter,
      onError: (error) => toast.error(getErrorMessage(error)),
   })

   // Mark a square for everyone in the party (socket event, not stored); quietly skipped while rate-limited
   function ping(cell: Position) {
      void sendPing(partyId, cell.x, cell.y).then((result) => {
         if (!result.ok && result.error !== 'rate-limited') toast.error(t('The mark could not be sent.', language))
      }, () => toast.error(t('The mark could not be sent.', language)))
   }
   useEffect(() => {
      if (!live) return
      const timers: number[] = []
      const off = onPing((event) => {
         if (event.partyId !== partyId) return
         const id = Date.now() + Math.random()
         setPings((current) => [...current, { id, x: event.x, y: event.y, by: event.by }])
         setAnnouncement(t('{name} marks column {x}, row {y}.', language).replace('{name}', event.by)
            .replace('{x}', String(event.x + 1)).replace('{y}', String(event.y + 1)))
         timers.push(window.setTimeout(() => setPings((current) => current.filter((entry) => entry.id !== id)), pingMs))
      })
      return () => {
         off()
         timers.forEach((timer) => window.clearTimeout(timer))
      }
   }, [live, partyId, language])
   function cancelLongPress() {
      if (longPress.current) window.clearTimeout(longPress.current.timer)
      longPress.current = null
   }

   const positionOf = (combatant: Combatant) => (combatant.id in pending ? pending[combatant.id] : combatant.position)
   const placed = encounter.combatants.filter((combatant) => positionOf(combatant))
   const tray = encounter.combatants.filter((combatant) => !positionOf(combatant))
   const selected = encounter.combatants.find((combatant) => combatant.id === selectedId) ?? null
   const blocked = new Set(encounter.obstacles.map(cellKey))
   const occupied = new Set(placed.map((combatant) => cellKey(positionOf(combatant)!)))
   const fighting = encounter.round >= 1

   // Rule-bound move: a player's own hero on the board during the fight
   const costly = (combatant: Combatant) => !isGm && fighting && combatant.position !== null
   const turnReason = (combatant: Combatant) => {
      if (!combatant.canControl) return 'You can only move your own hero.'
      if (isGm || !fighting) return null
      if (encounter.activeId !== combatant.id) return 'You can move on your turn.'
      if (encounter.openAttack) return 'Wait until the open attack is defended.'
      if (!combatant.actions.free && !combatant.actions.action && !combatant.actions.bonus) return 'No action left to move this round.'
      return null
   }
   // GS of a move: a Flucht's squares (S. 237), an ally's GS, the own hero's GS; null = unknown (no limit)
   const rangeOf = (combatant: Combatant) => {
      const schritt = combatant.actions.bonus || (combatant.kind === 'ally' ? combatant.speed : combatant.kind === 'hero' ? moveRange : null)
      return schritt === null ? null : squaresFor(schritt, board.scale)
   }
   const mover = selected && costly(selected) && turnReason(selected) === null ? selected : null
   const moverPosition = mover?.position ?? null
   const reach = mover && moverPosition ? reachableCells(board, blocked, moverPosition, rangeOf(mover) ?? board.width * board.height) : null
   const cost = mover ? (mover.actions.bonus ? 'flee' : mover.actions.free ? 'free' : 'action') : null

   function refuse(combatant: Combatant, position: Position | null) {
      const reason = turnReason(combatant)
      if (reason) return reason
      if (!position) return null
      if (blocked.has(cellKey(position))) return 'This square is blocked by terrain.'
      const current = positionOf(combatant)
      if (occupied.has(cellKey(position)) && !(current && cellKey(current) === cellKey(position))) return 'This square is taken.'
      if (costly(combatant) && combatant.position) {
         const cells = combatant.id === mover?.id ? reach : reachableCells(board, blocked, combatant.position, rangeOf(combatant) ?? board.width * board.height)
         if (!cells?.has(cellKey(position))) return 'This square is out of reach (GS) or cut off by terrain.'
      }
      return null
   }
   function commit(combatant: Combatant, position: Position | null) {
      const current = positionOf(combatant)
      if (position && current && position.x === current.x && position.y === current.y) return
      const reason = refuse(combatant, position)
      if (reason) {
         toast.error(t(reason, language))
         return
      }
      setPlanned(null)
      move.mutate({ id: combatant.id, position })
      setAnnouncement(`${combatant.name}: ${position
         ? `${t('column', language)} ${position.x + 1}, ${t('row', language)} ${position.y + 1}` : t('not on the board', language)}`)
   }
   function cellFromPointer(event: PointerEvent) {
      const rect = boardRef.current?.getBoundingClientRect()
      return rect ? cellAt({ x: event.clientX, y: event.clientY }, rect, board) : null
   }

   function onTokenPointerDown(event: PointerEvent<HTMLButtonElement>, combatant: Combatant) {
      const position = positionOf(combatant)
      if (live && !terrain && event.altKey && event.button === 0 && position) {
         event.preventDefault()
         return ping(position)
      }
      if (terrain || !combatant.canControl || event.button !== 0) return
      event.currentTarget.setPointerCapture(event.pointerId)
      setDrag({ id: combatant.id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false, cell: null })
   }
   function onTokenPointerMove(event: PointerEvent<HTMLButtonElement>) {
      if (!drag || drag.pointerId !== event.pointerId) return
      const moved = drag.moved || Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 5
      setDrag({ ...drag, moved, cell: moved ? cellFromPointer(event) : null })
   }
   function onTokenPointerUp(event: PointerEvent<HTMLButtonElement>, combatant: Combatant) {
      if (suppressClick.current) {
         suppressClick.current = false
         setDrag(null)
         return
      }
      if (!drag || drag.pointerId !== event.pointerId) return
      setDrag(null)
      if (drag.moved) {
         const cell = cellFromPointer(event)
         if (cell) commit(combatant, cell)
         return
      }
      onSelect(selectedId === combatant.id ? null : combatant.id)
   }
   // Arrow keys: free moves go at once; a rule-bound move is planned square by square and confirmed with Enter
   function onTokenKeyDown(event: KeyboardEvent<HTMLButtonElement>, combatant: Combatant) {
      const position = positionOf(combatant)
      if (event.key === 'Escape') {
         setPlanned(null)
         return onSelect(null)
      }
      // P marks the token's square for everyone
      if (live && (event.key === 'p' || event.key === 'P') && position) {
         event.preventDefault()
         return ping(position)
      }
      if (!combatant.canControl || !position) return
      if (costly(combatant)) {
         if (event.key === 'Enter' && planned?.id === combatant.id) {
            event.preventDefault()
            commit(combatant, planned.cell)
            return
         }
         const from = planned?.id === combatant.id ? planned.cell : position
         const next = stepPosition(from, event.key, board)
         if (!next) return
         event.preventDefault()
         if (selectedId !== combatant.id) onSelect(combatant.id)
         setPlanned({ id: combatant.id, cell: next })
         setAnnouncement(`${t('Planned move', language)}: ${t('column', language)} ${next.x + 1}, ${t('row', language)} ${next.y + 1}. ${t('Enter confirms.', language)}`)
         return
      }
      const next = stepPosition(position, event.key, board)
      if (!next) return
      event.preventDefault()
      commit(combatant, next)
   }

   // Terrain painting (GM): press and drag over squares, sent as one change
   function onBoardPointerDown(event: PointerEvent<HTMLDivElement>) {
      if (!terrain && live && event.pointerType === 'touch') {
         const cell = cellFromPointer(event)
         if (!cell) return
         cancelLongPress()
         const timer = window.setTimeout(() => {
            longPress.current = null
            suppressClick.current = true
            ping(cell)
         }, longPressMs)
         longPress.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, timer }
         return
      }
      if (!terrain || event.button !== 0) return
      const cell = cellFromPointer(event)
      if (!cell) return
      event.currentTarget.setPointerCapture(event.pointerId)
      setPainting({ pointerId: event.pointerId, cells: new Map([[cellKey(cell), cell]]) })
   }
   function onBoardPointerMove(event: PointerEvent<HTMLDivElement>) {
      const press = longPress.current
      if (press && press.pointerId === event.pointerId && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 10) cancelLongPress()
      if (!painting || painting.pointerId !== event.pointerId) return
      const cell = cellFromPointer(event)
      if (!cell || painting.cells.has(cellKey(cell))) return
      setPainting({ ...painting, cells: new Map(painting.cells).set(cellKey(cell), cell) })
   }
   function onBoardPointerUp(event: PointerEvent<HTMLDivElement>) {
      if (longPress.current?.pointerId === event.pointerId) cancelLongPress()
      if (!painting || painting.pointerId !== event.pointerId || !terrain) return
      const kind = terrain === 'erase' ? null : terrain
      const cells = [...painting.cells.values()].filter((cell) => kind === null || !occupied.has(cellKey(cell)))
      setPainting(null)
      if (cells.length) paint.mutate(cells.map((cell) => ({ ...cell, kind })))
   }
   // Select-and-place: a click on a square moves the selected token there
   function onBoardClick(event: React.MouseEvent<HTMLDivElement>) {
      if (suppressClick.current) {
         suppressClick.current = false
         return
      }
      // Alt-click marks the square for everyone (terrain and tokens included)
      if (live && !terrain && event.altKey) {
         const cell = cellAt({ x: event.clientX, y: event.clientY }, event.currentTarget.getBoundingClientRect(), board)
         if (cell) ping(cell)
         return
      }
      if (terrain || event.target !== event.currentTarget || !selected?.canControl) return
      const rect = event.currentTarget.getBoundingClientRect()
      const cell = cellAt({ x: event.clientX, y: event.clientY }, rect, board)
      if (cell) commit(selected, cell)
   }
   function placeFromTray(combatant: Combatant) {
      const free = firstFreeCell([...placed.map((entry) => positionOf(entry)!), ...encounter.obstacles], board)
      if (free) commit(combatant, free)
   }

   const tokenProps = (combatant: Combatant) => ({
      type: 'button' as const,
      'aria-pressed': selectedId === combatant.id,
      'aria-label': tokenLabel(combatant, language, positionOf(combatant)),
      title: combatant.name,
      onPointerDown: (event: PointerEvent<HTMLButtonElement>) => onTokenPointerDown(event, combatant),
      onPointerMove: onTokenPointerMove,
      onPointerUp: (event: PointerEvent<HTMLButtonElement>) => onTokenPointerUp(event, combatant),
      onPointerCancel: () => setDrag(null),
      onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => onTokenKeyDown(event, combatant),
   })
   const extra = (combatant: Combatant) => [
      combatant.id === encounter.activeId ? 'is-active' : '',
      combatant.id === selectedId ? 'is-selected' : '',
      combatant.canControl && turnReason(combatant) === null ? 'is-movable' : '',
      drag?.id === combatant.id && drag.moved ? 'is-dragging' : '',
      encounter.openAttack?.targetId === combatant.id ? 'is-targeted' : '',
   ].filter(Boolean).join(' ')
   const dragged = drag?.moved && drag.cell ? encounter.combatants.find((combatant) => combatant.id === drag.id) : null
   const ghost = dragged && drag?.cell ? { combatant: dragged, cell: drag.cell }
      : planned ? { combatant: encounter.combatants.find((combatant) => combatant.id === planned.id), cell: planned.cell } : null
   const paintedCells = painting ? [...painting.cells.values()] : []
   const hint = terrain ? 'Drag over squares to paint terrain. Tokens cannot enter it.'
      : mover ? (cost === 'flee' ? 'Marked squares: your Flucht move.' : cost === 'free' ? 'Marked squares: move up to your GS (free action).' : 'Marked squares: sprint (uses your action and ends your turn).')
      : 'Drag a token onto a square, or select it and click a square. Arrow keys move a focused token.'

   return <div className='battle-board-wrap'>
      {/* Above the board: tokens are dragged from here onto a board that must stay in view */}
      {tray.length > 0 && <div className='battle-tray'>
         <span className='battle-tray-label'>{t('Not on the board', language)}</span>
         <ul>{tray.map((combatant) => <li key={combatant.id}>
            <button {...tokenProps(combatant)} className={tokenClass(combatant, extra(combatant))}
               onKeyDown={(event) => { if (event.key === 'Enter' && combatant.canControl) { event.preventDefault(); placeFromTray(combatant) } }}>
               <TokenFace combatant={combatant} />
            </button>
            <span className='battle-tray-name'>{combatant.name}</span>
         </li>)}</ul>
      </div>}
      <div className='battle-stage'>
         <div className='battle-board-scroll'>
            <div ref={boardRef} className={terrain ? 'battle-board is-painting' : 'battle-board'} onClick={onBoardClick}
               onPointerDown={onBoardPointerDown} onPointerMove={onBoardPointerMove} onPointerUp={onBoardPointerUp} onPointerCancel={() => { setPainting(null); cancelLongPress() }}
               onContextMenu={(event) => { if (live && longPress.current) event.preventDefault() }}
               role='group' aria-label={`${t('Battle board', language)} (${board.width} × ${board.height})`}
               style={{ gridTemplateColumns: `repeat(${board.width}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${board.height}, minmax(0, 1fr))`,
                  aspectRatio: `${board.width} / ${board.height}`, '--board-columns': board.width, '--board-rows': board.height } as React.CSSProperties}>
               {reach && [...reach.entries()].filter(([key, steps]) => steps > 0 && !occupied.has(key)).map(([key]) => {
                  const [x, y] = key.split(':').map(Number)
                  return <span key={`reach-${key}`} className={cost === 'action' ? 'battle-reach is-sprint' : 'battle-reach'} aria-hidden='true'
                     style={{ gridColumn: x + 1, gridRow: y + 1 }} />
               })}
               {encounter.obstacles.map((cell) => {
                  const Icon = obstacleIcons[cell.kind]
                  return <span key={`obstacle-${cellKey(cell)}`} className={`battle-obstacle obstacle-${cell.kind}`}
                     role='img' aria-label={`${t(obstacleLabels[cell.kind], language)}, ${t('column', language)} ${cell.x + 1}, ${t('row', language)} ${cell.y + 1}`}
                     title={t(obstacleLabels[cell.kind], language)} style={{ gridColumn: cell.x + 1, gridRow: cell.y + 1 }}>
                     {Icon && <Icon aria-hidden='true' />}</span>
               })}
               {paintedCells.map((cell) => <span key={`paint-${cellKey(cell)}`} aria-hidden='true'
                  className={terrain === 'erase' ? 'battle-obstacle is-erasing' : `battle-obstacle obstacle-${terrain} is-preview`}
                  style={{ gridColumn: cell.x + 1, gridRow: cell.y + 1 }} />)}
               {placed.map((combatant) => {
                  const position = positionOf(combatant)!
                  return <button key={combatant.id} {...tokenProps(combatant)} className={tokenClass(combatant, extra(combatant))}
                     style={{ gridColumn: position.x + 1, gridRow: position.y + 1 }}>
                     <TokenFace combatant={combatant} />
                  </button>
               })}
               {pings.map((entry) => <span key={entry.id} className='battle-ping' aria-hidden='true'
                  style={{ gridColumn: entry.x + 1, gridRow: entry.y + 1 }}><small>{entry.by}</small></span>)}
               {ghost?.combatant && <span className={tokenClass(ghost.combatant, 'is-ghost')} aria-hidden='true'
                  style={{ gridColumn: ghost.cell.x + 1, gridRow: ghost.cell.y + 1 }}><TokenFace combatant={ghost.combatant} /></span>}
            </div>
         </div>
         {overlay}
      </div>
      <p className='battle-hint'>{t(hint, language)}
         {live && !terrain && <> {t('Alt-click or long-press a square to mark it for everyone (P on a focused token).', language)}</>}
         {selected?.canControl && positionOf(selected) && (isGm || !fighting) && !terrain && <> <button className='quiet-button battle-unplace' type='button' onClick={() => commit(selected, null)}>
            {t('Take off the board', language)}</button></>}
      </p>
      <p className='sr-only' aria-live='polite'>{announcement}</p>
   </div>
}
