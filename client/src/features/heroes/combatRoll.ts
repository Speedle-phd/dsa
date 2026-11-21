// Client mirror of combat rolls for the GM-driven fight panel; only LeP changes are stored (server).
export type CombatOutcome = 'success' | 'failure' | 'critical' | 'criticalUnconfirmed' | 'botch' | 'botchAverted'

// `botchFrom` 19: Kettenwaffen attacks (S. 235); `noCritical`: Passierschlag has no crit or botch (S. 237).
export type RollRules = { botchFrom?: number; noCritical?: boolean }
export const needsConfirmation = (roll: number, { botchFrom = 20, noCritical = false }: RollRules = {}) =>
   !noCritical && (roll === 1 || roll >= botchFrom)

// source: DSA5 Regelwerk, S. 21 (1 always succeeds, 20 always fails; a 20 on a Patzer confirmation confirms it), S. 231–233
export function evaluateCombatRoll(roll: number, target: number, confirmation?: number, { botchFrom = 20, noCritical = false }: RollRules = {}): { success: boolean; outcome: CombatOutcome } {
   if (!noCritical) {
      const confirmed = confirmation !== undefined && confirmation !== 20 && (confirmation === 1 || confirmation <= target)
      if (roll === 1) return { success: true, outcome: confirmed ? 'critical' : 'criticalUnconfirmed' }
      if (roll >= botchFrom) return { success: false, outcome: confirmed ? 'botchAverted' : 'botch' }
   }
   if (roll === 20) return { success: false, outcome: 'failure' }
   if (roll === 1) return { success: true, outcome: 'success' }
   return roll <= target ? { success: true, outcome: 'success' } : { success: false, outcome: 'failure' }
}

// source: DSA5 Regelwerk, S. 232 (−3 per further defense this KR, S. 244 less after a critical ranged defense),
// S. 231 (a critical attack halves the defense, rounded up)
export function defenseTarget(value: number, defensePenalty: number, attackerCritical: boolean) {
   const reduced = value - defensePenalty
   return attackerCritical ? Math.ceil(reduced / 2) : reduced
}

// source: DSA5 Regelwerk, S. 36 (Eingeengt: AT/PA by weapon reach and shield size), S. 367 (shield sizes)
export const crampedWeapons = { short: { attack: 0, parry: 0 }, medium: { attack: -4, parry: -4 }, long: { attack: -8, parry: -8 } } as const
export const crampedShields = { small: { attack: -2, parry: -2 }, medium: { attack: -4, parry: -3 }, large: { attack: -6, parry: -4 } } as const
export const shieldSizes: Record<string, keyof typeof crampedShields> = { Holzschild: 'small', Lederschild: 'small', Thorwalerschild: 'medium', Großschild: 'large' }

// null when the reach or shield size is unknown: the app does not guess.
export function crampedModifier(name: string, reach: string, shield: boolean) {
   if (shield) return shieldSizes[name] ? crampedShields[shieldSizes[name]] : null
   if (reach === 'ranged') return { attack: 0, parry: 0 }
   return reach in crampedWeapons ? crampedWeapons[reach as keyof typeof crampedWeapons] : null
}

export type DamageDice = { count: number; sides: number; bonus: number }

export function parseDamage(damage: string, extraBonus = 0): DamageDice | null {
   const match = /^(\d+)W(\d+)([+-]\d+)?$/.exec(damage.replace(/\s/g, ''))
   if (!match) return null
   return { count: Number(match[1]), sides: Number(match[2]), bonus: Number(match[3] ?? 0) + extraBonus }
}

export const formatDamage = ({ count, sides, bonus }: DamageDice) =>
   `${count}W${sides}${bonus > 0 ? `+${bonus}` : bonus < 0 ? bonus : ''}`

// source: DSA5 Regelwerk, S. 231 (critical hit: TP including all modifiers doubled), S. 234 (SP = TP − RS)
export function hitPoints(rolls: number[], dice: DamageDice, critical: boolean) {
   const total = rolls.reduce((sum, roll) => sum + roll, 0) + dice.bonus
   return Math.max(0, critical ? total * 2 : total)
}

export const damagePoints = (tp: number, protection: number) => Math.max(0, tp - protection)

// source: DSA5 Regelwerk, S. 231, 233 (confirmed Patzer: 1W6+2 SP)
export const botchDamage = { count: 1, sides: 6, bonus: 2 } as const satisfies DamageDice

export type D20Roll = { roll: number; confirmation?: number; target: number; success: boolean; outcome: CombatOutcome; improved?: boolean
   // Waffenbegabung used on this roll (S. 169)
   confirmationRerolled?: boolean }

// source: DSA5 Regelwerk, S. 220–222 (SF "… verbessern": 1 Schip improves the die result by up to 2; not on a Patzer)
// App interpretation: only a normal failure can be turned into a success; criticals are never created or removed.
export const fateImprovement = 2
export function improveRoll(result: D20Roll): D20Roll | null {
   if (result.outcome !== 'failure' || result.roll - fateImprovement > result.target) return null
   return { ...result, success: true, outcome: 'success', improved: true }
}
