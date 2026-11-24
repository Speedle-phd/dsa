import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { npcPainLevel, weaponSummary } from '@/features/npcs/npcSheet'
import type { NpcValues } from './encounterApi'

const romanNumerals = ['', 'I', 'II', 'III', 'IV']

// For the GM: what the stat block says about this NPC right now. Schmerz (S. 34; none for demons and elementals),
// the flight threshold, Kampfverhalten and every weapon. Players never see this.
export function NpcFightHints({ values }: { values: NpcValues }) {
   const language = useLanguageStore((state) => state.language)
   const sheet = values.sheet
   const pain = npcPainLevel(values.health, values.maxHealth, sheet?.painThresholds)
   const fleeing = sheet?.fleeAt != null && values.health > 0 && values.health <= sheet.fleeAt
   return <div className='npc-fight-hints'>
      {sheet && sheet.weapons.length > 0 && <p className='party-muted'><strong>{t('Weapons and attacks', language)}:</strong> {weaponSummary(sheet.weapons)}
         {sheet.actions > 1 && ` · ${t('Actions', language)} ${sheet.actions}`}</p>}
      {pain > 0 && <p className='fight-note fight-danger'>{pain >= 4 ? t('Schmerz IV: this opponent cannot act (S. 34).', language)
         : t('Schmerz {level}: AT, PA and AW −{value} (S. 34)', language).replace('{level}', romanNumerals[pain]).replace('{value}', String(pain))}</p>}
      {sheet?.painThresholds?.length === 0 && <p className='party-muted'>{t('Feels no Schmerz.', language)}</p>}
      {fleeing && <p className='fight-note fight-danger' role='status'>{t('Flight threshold reached: this opponent tries to flee.', language)}
         {sheet?.flight && ` (${sheet.flight})`}</p>}
      {sheet?.behaviour && <p className='party-muted'><strong>{t('Combat behaviour', language)}:</strong> {sheet.behaviour}</p>}
   </div>
}
