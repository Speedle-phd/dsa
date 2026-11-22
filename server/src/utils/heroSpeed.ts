import { buildStatResponse } from '@/views/statsView'

// GS by species (S. 40) when the hero has no own GS base entered; null when the species is unknown
export function speciesSpeed(species: string) {
   const name = species.trim().toLowerCase()
   if (['zwerg', 'zwerge', 'dwarf', 'dwarves'].includes(name)) return 6
   if (['mensch', 'menschen', 'human', 'elf', 'elfen', 'halbelf', 'half-elf'].includes(name)) return 8
   return null
}

type SpeedView = {
   combatModifiers: { speed: number; speedBase: number | null }
   checkModifiers: {
      speedBase: { sources: Array<{ value: number }>; halved: unknown }
      speed: { total: number; override: number | null; factor: number; blocked: boolean }
   }
}
// The hero's current GS as the fight panel shows it (same steps as client heroSpeed + FightPanel effectiveSpeed)
export function effectiveSpeed(view: SpeedView, species: string) {
   const base = view.combatModifiers.speedBase ?? speciesSpeed(species)
   if (base === null) return null
   const adjusted = base + view.checkModifiers.speedBase.sources.reduce((sum, source) => sum + source.value, 0)
   const speedBase = view.checkModifiers.speedBase.halved ? Math.ceil(adjusted / 2) : adjusted
   const speed = Math.max(0, speedBase + view.combatModifiers.speed)
   const modifiers = view.checkModifiers.speed
   if (modifiers.override !== null && modifiers.override !== undefined) return modifiers.override
   if (modifiers.blocked) return 0
   return Math.max(0, Math.round((speed + modifiers.total) * modifiers.factor))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function heroSpeedFromStats(stats: any, species: string) {
   return effectiveSpeed(buildStatResponse(stats).stats as unknown as SpeedView, species)
}
