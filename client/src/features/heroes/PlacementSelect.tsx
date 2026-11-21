import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { basePlacements, placementLabel, placementOptions } from './containers'
import type { EquipmentEntry } from './statsApi'

// Angelegt / Lager / Sonstiges plus the containers the hero has ready (S. 374–377, 381).
export function PlacementSelect({ equipment, item, amount, value, onChange, disabled, className, ariaLabel }: {
   equipment: readonly EquipmentEntry[]; item: string; amount: number; value: string; onChange: (value: string) => void
   disabled?: boolean; className?: string; ariaLabel?: string
}) {
   const language = useLanguageStore((state) => state.language)
   const options = placementOptions(equipment, item, amount, value)
   const base = options.filter((option) => (basePlacements as readonly string[]).includes(option.value))
   const containers = options.filter((option) => !(basePlacements as readonly string[]).includes(option.value))
   return <select className={className} value={value} disabled={disabled} aria-label={ariaLabel} onChange={(event) => onChange(event.target.value)}>
      {base.map((option) => <option key={option.value} value={option.value}>{placementLabel(option.value, language)}</option>)}
      {containers.length > 0 && <optgroup label={t('Containers', language)}>
         {containers.map((option) => <option key={option.value} value={option.value} disabled={option.full && option.value !== value}>
            {placementLabel(option.value, language)}{option.full ? ` (${t('full', language)})` : ''}
         </option>)}
      </optgroup>}
   </select>
}
