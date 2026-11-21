import type { Language } from '@/locales/languageStore'
import { t, translateRuleLabel } from '@/locales/translation'
import type { AventurianStoreItem } from './aventurian_store'

const formatModifier = (value: number) => value > 0 ? `+${value}` : String(value)

const getBurnTime = (item: AventurianStoreItem, language?: Language) => {
   if (item.duration === undefined) return undefined

   const label = (key: string) => language ? t(key, language) : key
   const duration = item.duration === 'unlimited'
      ? label('unlimited')
      : `${new Intl.NumberFormat(language ?? 'en').format(item.duration)} ${label('hours')}`
   return `${label('Burn time')}: ${duration}`
}

export function getItemDetails(item: AventurianStoreItem, language?: Language) {
   const details: string[] = []
   const label = (key: string) => language ? t(key, language) : key
   const burnTime = getBurnTime(item, language)
   if (burnTime) details.push(burnTime)
   if (item.weapon) {
      const weapon = item.weapon
      const technique = language ? translateRuleLabel(weapon.combatTechnique, language) : weapon.combatTechnique
      const lead = weapon.leadingAttribute ? ` · ${weapon.leadingAttribute} ${weapon.threshold ?? ''}` : ''
      const modifiers = weapon.attackModifier !== undefined && weapon.parryModifier !== undefined
         ? ` · AT/PA ${formatModifier(weapon.attackModifier)}/${formatModifier(weapon.parryModifier)}` : ''
      details.push(`${technique} · ${label('TP')} ${weapon.damage}${lead}${modifiers}`)
      if (weapon.range) details.push(`${label('Range')} ${weapon.range}`)
      if (weapon.reach !== 'ranged') details.push(`${label('Reach')} ${label(weapon.reach)}`)
      if (weapon.length !== undefined) details.push(`${label('Length')} ${weapon.length} ${label('Halbfinger')}`)
      if (weapon.reloadActions !== undefined) details.push(`${label('Reload')} ${weapon.reloadActions} ${label('actions')}`)
      if (weapon.ammunition) details.push(`${label('Ammunition')}: ${label(weapon.ammunition)}`)
      if (weapon.structurePoints !== undefined) details.push(`${weapon.structurePoints} ${label('structure points')}`)
   }
   if (item.armor) {
      const extra = item.armor.movementPenalty ? ` · −${item.armor.movementPenalty} ${label('GS')}, −${item.armor.initiativePenalty ?? 0} ${label('INI')}` : ''
      details.push(`${label('RS')} ${item.armor.protection} · ${label('BE')} ${item.armor.burden}${extra}`)
   }
   if (item.magical) details.push(label('magical'))
   if (item.alchemy) {
      details.push(`${label('Laboratory')}: ${label(item.alchemy.laboratory)} · ${label('Brewing difficulty')} ${formatModifier(item.alchemy.brewingDifficulty)}`)
   }
   if (item.poison) {
      const poison = item.poison
      details.push(`${label('Level')} ${poison.level} · ${poison.type} · ${label('Resistance')} ${poison.resistance}`)
      details.push(`${label('Onset')} ${poison.onset} · ${label('Duration')} ${poison.duration}`)
   }
   if (item.herb) {
      details.push(`${label('Search')} ${formatModifier(item.herb.search)} · ${label('Identification')} ${formatModifier(item.herb.identify)} · ${label('Applications per QS')} ${item.herb.applications}`)
   }
   if (item.book) details.push(`${label('Language/script')}: ${label(item.book.script)}`)
   if (item.sourcePage !== undefined) details.push(`${label('DSA5 Rulebook')} · ${label('S.')} ${item.sourcePage}`)
   return details
}

export function getItemInfo(item: AventurianStoreItem, language?: Language) {
   const description = item.description?.trim()
      ? language ? t(item.description.trim(), language) : item.description.trim()
      : undefined

   return [description, getBurnTime(item, language)].filter((detail): detail is string => Boolean(detail)).join(' · ')
}

export function getPurchaseDescription(item: AventurianStoreItem, language?: Language) {
   return [
      item.description?.trim() ? language ? t(item.description.trim(), language) : item.description.trim() : undefined,
      ...getItemDetails(item, language),
      item.contents?.length ? `${language ? t('Includes', language) : 'Includes'}: ${item.contents
         .map(({ name, amount }) => {
            const display = language ? t(name, language) : name
            return amount > 1 ? `${amount} × ${display}` : display
         }).join(', ')}` : undefined,
   ].filter((detail): detail is string => Boolean(detail)).join(' · ')
}
