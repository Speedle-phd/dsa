import { Minus, Plus } from 'lucide-react'

export function QuantityStepper({ value, min = 1, max = 100, label, onChange }: {
   value: number; min?: number; max?: number; label: string; onChange: (value: number) => void
}) {
   // 0 is a valid value (market rate); only an empty or invalid input falls back to the value nearest 0.
   const clamp = (next: number) => Math.max(min, Math.min(max, Number.isFinite(next) ? Math.trunc(next) : 0))
   return <div className='dice-count-control service-stepper'>
      <button className='icon-button' type='button' aria-label={`${label} −1`} disabled={value <= min} onClick={() => onChange(clamp(value - 1))}><Minus size={16} /></button>
      <input type='number' inputMode='numeric' min={min} max={max} value={value} aria-label={label}
         onFocus={(event) => event.target.select()} onChange={(event) => onChange(clamp(event.target.valueAsNumber))} />
      <button className='icon-button' type='button' aria-label={`${label} +1`} disabled={value >= max} onClick={() => onChange(clamp(value + 1))}><Plus size={16} /></button>
   </div>
}
