const center = 24

function polygonPoints(corners: number, radius: number, rotation = -90) {
   return Array.from({ length: corners }, (_, index) => {
      const angle = ((rotation + (360 / corners) * index) * Math.PI) / 180
      return [
         center + radius * Math.cos(angle),
         center + radius * Math.sin(angle),
      ] as const
   })
}

const toPoints = (points: readonly (readonly [number, number])[]) =>
   points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')

function Facets({ lines }: { lines: [number, number, number, number][] }) {
   return (
      <g className='die-icon-facets'>
         {lines.map(([x1, y1, x2, y2]) => (
            <line key={`${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} />
         ))}
      </g>
   )
}

function D4() {
   return (
      <>
         <polygon className='die-icon-body' points='24,4 45,42 3,42' />
         <Facets lines={[[24, 4, 24, 30], [24, 30, 3, 42], [24, 30, 45, 42]]} />
      </>
   )
}

function D6() {
   return (
      <>
         <polygon className='die-icon-body' points='24,4 42,14 42,34 24,44 6,34 6,14' />
         <Facets lines={[[6, 14, 24, 24], [42, 14, 24, 24], [24, 24, 24, 44]]} />
      </>
   )
}

function D8() {
   return (
      <>
         <polygon className='die-icon-body' points='24,3 43,14 43,34 24,45 5,34 5,14' />
         <polygon className='die-icon-face' points='24,3 43,34 5,34' />
         <Facets lines={[[5, 14, 24, 3], [43, 14, 24, 3], [24, 45, 5, 34], [24, 45, 43, 34]]} />
      </>
   )
}

function D10({ offsetX = 0, scale = 1 }: { offsetX?: number; scale?: number }) {
   return (
      <g transform={`translate(${offsetX} ${24 - 24 * scale}) scale(${scale})`}>
         <polygon className='die-icon-body' points='24,3 45,21 45,27 24,45 3,27 3,21' />
         <polygon className='die-icon-face' points='24,3 34,26 24,32 14,26' />
         <Facets lines={[[3, 21, 14, 26], [45, 21, 34, 26], [24, 32, 24, 45]]} />
      </g>
   )
}

function D12() {
   const outer = polygonPoints(10, 21)
   const inner = polygonPoints(5, 11)
   return (
      <>
         <polygon className='die-icon-body' points={toPoints(outer)} />
         <polygon className='die-icon-face' points={toPoints(inner)} />
         <Facets
            lines={inner.map(([x, y], index) => {
               const [ox, oy] = outer[index * 2]
               return [x, y, ox, oy]
            })}
         />
      </>
   )
}

function D20() {
   const outer = polygonPoints(6, 21)
   const inner = polygonPoints(3, 11)
   return (
      <>
         <polygon className='die-icon-body' points={toPoints(outer)} />
         <polygon className='die-icon-face' points={toPoints(inner)} />
         <Facets
            lines={[
               ...inner.map(([x, y], index): [number, number, number, number] => {
                  const [ox, oy] = outer[index * 2]
                  return [x, y, ox, oy]
               }),
               ...inner.flatMap(([x, y], index): [number, number, number, number][] => {
                  const [ax, ay] = outer[(index * 2 + 1) % 6]
                  const [bx, by] = outer[(index * 2 + 5) % 6]
                  return [[x, y, ax, ay], [x, y, bx, by]]
               }),
            ]}
         />
      </>
   )
}

function D100() {
   return (
      <>
         <D10 offsetX={-6} scale={0.78} />
         <D10 offsetX={16} scale={0.78} />
      </>
   )
}

const icons = {
   4: D4,
   6: D6,
   8: D8,
   10: D10,
   12: D12,
   20: D20,
   100: D100,
} as const

export function DieIcon({ sides }: { sides: keyof typeof icons }) {
   const Shape = icons[sides]
   return (
      <svg className='die-icon' viewBox='0 0 48 48' aria-hidden='true' focusable='false'>
         <Shape />
      </svg>
   )
}
