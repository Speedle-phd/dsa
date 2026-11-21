import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Stats } from './statsApi'
import { talentGroupProbes, type TalentDefinition } from './talentCatalog'

// Optional talent rules, remembered per browser like the Patzer tables.
type TalentOptions = {
   // source: DSA5 Regelwerk, S. 185 (Verrechnung von Eigenschaften bei Routine)
   routineTrade: boolean
   // source: DSA5 Regelwerk, S. 184 (Talentgruppenprobe)
   groupProbe: boolean
   // source: DSA5 Regelwerk, S. 252 (Merkmalsproben), S. 258 (Patzertabelle für Zaubersprüche)
   propertyProbe: boolean
   spellPatzer: boolean
   set: (options: Partial<Pick<TalentOptions, 'routineTrade' | 'groupProbe' | 'propertyProbe' | 'spellPatzer'>>) => void
}

export const useTalentOptions = create<TalentOptions>()(persist((set) => ({
   routineTrade: false, groupProbe: false, propertyProbe: false, spellPatzer: false, set: (options) => set(options),
}), {
   name: 'dsa5.talent-options',
   partialize: ({ routineTrade, groupProbe, propertyProbe, spellPatzer }) => ({ routineTrade, groupProbe, propertyProbe, spellPatzer }),
}))

export function useTalentProbe(talent: TalentDefinition) {
   const groupProbe = useTalentOptions((state) => state.groupProbe)
   return groupProbe ? talentGroupProbes[talent.category] : talent.probe
}

// An unlocking entry is owned as written or with a level/detail suffix ("Heraldik", "Schriftstellerei (Poesie)").
export const ownsEntry = (stats: Pick<Stats, 'advantages' | 'generalSpecialAbilities'>, name: string) =>
   [...stats.advantages, ...stats.generalSpecialAbilities].some((entry) => entry === name || entry.startsWith(`${name} `))
