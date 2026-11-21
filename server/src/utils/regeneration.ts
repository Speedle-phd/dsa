export const regenerationResources = ['health', 'mana', 'karmaEnergy'] as const
export type RegenerationResource = (typeof regenerationResources)[number]

const resourceNames: Record<RegenerationResource, string> = {
   health: 'Lebensenergie',
   mana: 'Astralenergie',
   karmaEnergy: 'Karmaenergie',
}

// source: DSA5 Regelwerk, S. 339 (Regeneration table)
export const campsiteModifiers = { bad: -1, normal: 0, good: 1 } as const
export const interruptionModifiers = { none: 0, short: -1, long: -2 } as const

export type RegenerationSituation = {
   campsite: keyof typeof campsiteModifiers
   interruption: keyof typeof interruptionModifiers
   environment: 'normal' | 'bad' | 'terrible'
   poisonedOrSick: boolean
   ironStone: number
   treatmentQuality: number
   otherModifier: number
   reducedHealth: boolean
}

export type RegenerationEntries = { advantages: string[]; disadvantages: string[] }

export type RegenerationStep = { label: string; value: number; ignored?: boolean }

export type RegenerationOutcome = {
   roll: number
   base: number
   modifiers: RegenerationStep[]
   subtotal: number
   environment: RegenerationSituation['environment']
   blocked: string | null
   treatment: number
   herb: number
   amount: number
}

// Bonuses waiting for the next LeP regeneration (Wirselkraut, S. 346).
export type RegenerationExtras = { herbHealth?: number }

const romans = ['I', 'II', 'III']

export function entryLevel(entries: string[], name: string) {
   for (const entry of entries) {
      if (entry === name) return 1
      if (entry.startsWith(`${name} `)) {
         const level = romans.indexOf(entry.slice(name.length + 1)) + 1
         if (level > 0) return level
      }
   }
   return 0
}

// source: DSA5 Regelwerk, S. 339–340; S. 169, 176–177 (Verbesserte/Schlechte Regeneration); S. 256 (Bann des Eisens)
export function calcRegeneration(
   resource: RegenerationResource,
   roll: number,
   situation: RegenerationSituation,
   entries: RegenerationEntries,
   extras: RegenerationExtras = {},
): RegenerationOutcome {
   // Optional rule 'Weniger Regeneration': 1W3 LeP and no bonus points for LeP (S. 340).
   const reduced = resource === 'health' && situation.reducedHealth
   const base = reduced ? Math.ceil(roll / 2) : roll
   const name = resourceNames[resource]
   const improved = entryLevel(entries.advantages, `Verbesserte Regeneration (${name})`)
   const poor = entryLevel(entries.disadvantages, `Schlechte Regeneration (${name})`)
   const ironUnits = Math.floor(situation.ironStone / 2)
   const modifiers: RegenerationStep[] = [
      { label: situation.campsite === 'bad' ? 'Schlechter Lagerplatz' : 'Gute Unterkunft', value: campsiteModifiers[situation.campsite] },
      { label: situation.interruption === 'long' ? 'Längere Unterbrechung der Nachtruhe' : 'Unterbrechung der Nachtruhe', value: interruptionModifiers[situation.interruption] },
      { label: `Verbesserte Regeneration (${name}) ${romans[improved - 1] ?? ''}`.trim(), value: improved },
      { label: `Schlechte Regeneration (${name}) ${romans[poor - 1] ?? ''}`.trim(), value: -poor },
      { label: 'Bann des Eisens', value: resource === 'mana' ? -ironUnits : 0 },
      { label: 'Other modifier', value: situation.otherModifier },
   ].filter((step) => step.value !== 0)
      .map((step) => reduced && step.value > 0 ? { ...step, ignored: true } : step)
   const subtotal = Math.max(0, base + modifiers.reduce((sum, step) => sum + (step.ignored ? 0 : step.value), 0))
   const blocked = resource === 'health' && situation.poisonedOrSick ? 'Vergiftet/Krank'
      : situation.environment === 'terrible' ? 'Furchtbare Umgebung' : null
   const afterEnvironment = blocked ? 0 : situation.environment === 'bad' ? Math.floor(subtotal / 2) : subtotal
   // Heilkunde Wunden (Heilung fördern): QS added to the next LeP regeneration (S. 340).
   const treatment = resource === 'health' && !blocked ? situation.treatmentQuality : 0
   // source: DSA5 Regelwerk, S. 346 (Wirselkraut: +1 LeP per application, at most +3 per regeneration phase)
   const herb = resource === 'health' && !blocked ? Math.min(3, Math.max(0, extras.herbHealth ?? 0)) : 0
   return {
      roll,
      base,
      modifiers,
      subtotal,
      environment: situation.environment,
      blocked,
      treatment,
      herb,
      amount: afterEnvironment + treatment + herb,
   }
}
