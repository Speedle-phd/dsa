import { armorTable, armorIndex, equippedArmor } from './armorEquipment'
import { ownedRollEffects, type RollEffectState } from './entryRollEffects'
import { statusRollEffects, statusSpeed } from './statusRules'
import { entryValueSources, halvesSpeedBase } from './entryDerivedValues'
import { triggerLevels } from './entryTriggers'
export { armorTable, armorIndex } from './armorEquipment'

export type ModifierSource = { label: string; value: number; page: number }
export type CheckProfile = {
   kind: 'attribute' | 'attack' | 'ranged' | 'defense' | 'talent'
   burden: boolean
   movement: boolean
   pleasing: boolean
   complex: boolean
   total: number
   sources: ModifierSource[]
   blocked: string[]
}
type ModifierStats = Partial<RollEffectState> & {
   pain: number
   combatConditions: Record<string, number>
   statuses?: string[]
   // Switched-on disadvantage triggers (Angst vor, Lichtempfindlich, Sensibler Geruchssinn; S. 170, 173, 177)
   triggers?: string[]
   combatSpecialAbilities: string[]
   wornArmor?: string | null
   equipment: Array<{ item: string; amount: number; carriedOn?: string }>
}

const metalArmor = ['Kettenrüstung', 'Schuppenrüstung', 'Plattenrüstung']

export function checkModifiers(stats: ModifierStats) {
   const armor = equippedArmor(stats.equipment, stats.wornArmor)
   const index = armor ? armorIndex(armor) : -1
   // source: DSA5 Regelwerk, S. 246 (two table rows per level, including extra GS/INI penalties)
   const familiarity = stats.combatSpecialAbilities.includes('Belastungsgewöhnung II') ? 2
      : stats.combatSpecialAbilities.includes('Belastungsgewöhnung I') ? 1 : 0
   const effectiveArmor = index >= 0 ? armorTable[Math.max(0, index - 2 * familiarity)] : null
   const otherBurden = stats.combatConditions.Belastung ?? 0
   // source: DSA5 Regelwerk, S. 374 (metal armor without equipped Unterkleidung: BE +1)
   const missingPadding = armor && metalArmor.includes(armor) && !stats.equipment.some((entry) =>
      entry.item === 'Unterkleidung für Metallrüstungen' && entry.amount > 0 && entry.carriedOn === 'Equipped') ? 1 : 0
   const armorBurden = (effectiveArmor?.burden ?? 0) + missingPadding
   const burden = Math.min(4, armorBurden + otherBurden)
   // Trigger levels add to the recorded conditions while the trigger is present (max IV each)
   const triggered = triggerLevels(stats)
   const pain = Math.min(4, stats.pain + triggered.Schmerz)
   // source: DSA5 Regelwerk, S. 169, 179 (Zäher Hund does not prevent incapacitation at IV)
   const effectivePain = pain === 0 ? 0 : Math.min(4, Math.max(0, pain +
      (stats.disadvantages?.includes('Zerbrechlich') ? 1 : stats.advantages?.includes('Zäher Hund') ? -1 : 0)))
   const statuses = stats.statuses ?? []
   // source: DSA5 Regelwerk, S. 35 (Blutrausch ignores all penalties from Schmerz)
   const bloodRage = statuses.includes('Blutrausch')
   const painPenalty = bloodRage ? 0 : pain
   const levels: Record<string, number> = { ...stats.combatConditions, Belastung: burden, Schmerz: effectivePain }
   for (const key of ['Furcht', 'Verwirrung'] as const) if (triggered[key]) levels[key] = Math.min(4, (levels[key] ?? 0) + triggered[key])
   const totalLevels = ['Belastung', 'Betäubung', 'Entrückung', 'Furcht', 'Paralyse', 'Schmerz', 'Verwirrung']
      .reduce((sum, key) => sum + (key === 'Schmerz' ? pain : levels[key] ?? 0), 0)
   const profiles: CheckProfile[] = []
   function profile(kind: CheckProfile['kind'], affectedByBurden: boolean, movement: boolean, pleasing: boolean, complex: boolean) {
      const sources: ModifierSource[] = []
      const blocked: string[] = []
      const add = (label: string, value: number, page: number) => { if (value) sources.push({ label, value, page }) }
      // source: DSA5 Regelwerk, S. 32–34 (condition-specific scope and maximum combined penalty 5)
      for (const key of ['Betäubung', 'Furcht', 'Schmerz', 'Verwirrung']) add(key, -(key === 'Schmerz' ? painPenalty : levels[key] ?? 0), key === 'Betäubung' ? 32 : key === 'Furcht' ? 33 : 34)
      if (!bloodRage && effectivePain !== pain) add(effectivePain < pain ? 'Zäher Hund' : 'Zerbrechlich',
         pain - effectivePain, effectivePain < pain ? 169 : 179)
      if (affectedByBurden) {
         add('Non-armor Belastung', -otherBurden, 32)
         add(armor ?? 'Armor', -(armorBurden - missingPadding), 32)
         add('Ohne Unterkleidung', -missingPadding, 374)
         if (otherBurden + armorBurden > 4) add('Belastung level limit', otherBurden + armorBurden - 4, 32)
      }
      if (movement) add('Paralyse', -(levels.Paralyse ?? 0), 33)
      if (kind === 'talent') add('Entrückung', pleasing ? Math.max(0, (levels.Entrückung ?? 0) - 1) : -(levels.Entrückung ?? 0), 33)
      const sum = sources.reduce((total, source) => total + source.value, 0)
      if (sum < -5) add('Condition penalty limit', -5 - sum, 32)
      if (totalLevels >= 8) blocked.push('Eight condition levels: incapacitated.')
      for (const key of ['Belastung', 'Betäubung', 'Furcht', 'Verwirrung']) {
         if ((levels[key] ?? 0) >= 4) blocked.push(`${key} IV: incapacitated.`)
      }
      if (pain >= 4 || effectivePain >= 4) blocked.push('Schmerz IV: Selbstbeherrschung required to remain capable of acting.')
      if (movement && (levels.Paralyse ?? 0) >= 4) blocked.push('Paralyse IV: movement and speech unavailable.')
      if (complex && (levels.Verwirrung ?? 0) >= 3) blocked.push('Verwirrung III: knowledge, spells and liturgies unavailable.')
      profiles.push({ kind, burden: affectedByBurden, movement, pleasing, complex, total: Math.max(-5, sum), sources, blocked })
   }
   profile('attack', true, true, false, false)
   profile('ranged', false, true, false, false)
   profile('defense', true, true, false, false)
   for (const movement of [false, true]) profile('attribute', false, movement, false, false)
   for (const affectedByBurden of [false, true]) for (const movement of [false, true])
      for (const pleasing of [false, true]) for (const complex of [false, true])
         profile('talent', affectedByBurden, movement, pleasing, complex)
   // source: DSA5 Regelwerk, S. 32–34 (only Belastung/armor affect INI; Schmerz also affects GS, Paralyse scales GS)
   const initiativeSources: ModifierSource[] = []
   if (burden) initiativeSources.push({ label: 'Belastung', value: -burden, page: 32 })
   if (effectiveArmor?.extra) initiativeSources.push({ label: armor ?? 'Armor', value: -effectiveArmor.extra, page: 32 })
   const speedSources = [...initiativeSources]
   if (effectivePain && !bloodRage) speedSources.push({ label: 'Schmerz', value: -effectivePain, page: 34 })
   const speedStatus = statusSpeed(statuses)
   return {
      profiles, armor, burden, otherBurden, armorBurden, effectivePain,
      entryEffects: [...ownedRollEffects(stats), ...statusRollEffects(statuses)],
      unverifiedConditions: Object.keys(stats.combatConditions).filter((key) => (stats.combatConditions[key] ?? 0) > 0 &&
         !['Belastung', 'Betäubung', 'Entrückung', 'Furcht', 'Paralyse', 'Verwirrung'].includes(key)),
      initiative: { total: initiativeSources.reduce((sum, entry) => sum + entry.value, 0), sources: initiativeSources },
      // GS-Grundwert changes (S. 165, 171, 179): applied to the base before the modifiers above; halving rounds up (user decision).
      speedBase: { sources: entryValueSources(stats, 'speed'), halved: halvesSpeedBase(stats) ? { label: 'Verstümmelt (Einbeinig)', page: 179 } : null },
      speed: { total: speedSources.reduce((sum, entry) => sum + entry.value, 0), sources: speedSources,
         override: speedStatus.override, overrideLabel: speedStatus.label,
         factor: Math.max(0, 1 - (levels.Paralyse ?? 0) / 4), blocked: totalLevels >= 8 || burden >= 4 ||
            ['Betäubung', 'Furcht', 'Verwirrung'].some((key) => (levels[key] ?? 0) >= 4) || pain >= 4 || effectivePain >= 4 },
   }
}
