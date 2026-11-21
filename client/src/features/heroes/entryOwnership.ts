// What a hero already owns of a catalog entry, read from stored names such as "Hohe Astralkraft III",
// "Begabung (Klettern)", "Garethi III" or "Fertigkeitsspezialisierung (Klettern: Bäume)" (server `entryName`).
const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
const romanSuffix = / (X|IX|VIII|VII|VI|V|IV|III|II|I)$/

type CatalogItem = { key: string; levels?: number; parameter?: string; choices?: string[] }

export function ownedOfEntry(names: string[], item: CatalogItem) {
   let level = 0
   const subjects = new Set<string>()
   for (const name of names) {
      const roman = item.levels ? romanSuffix.exec(name) : null
      const base = roman ? name.slice(0, -roman[0].length) : name
      const nameLevel = roman ? romans.indexOf(roman[1]) + 1 : 1
      if (item.parameter || item.choices) {
         if (!base.startsWith(`${item.key} (`) || !base.endsWith(')')) continue
         subjects.add(base.slice(item.key.length + 2, -1).split(': ')[0])
         level = Math.max(level, nameLevel)
      } else if (base === item.key) level = Math.max(level, nameLevel)
   }
   return { level, subjects }
}

// Which part of a catalog entry can still be added: entries without a subject while a higher level is left,
// entries with a subject list without the subjects already owned. Leveled or free-text subjects and
// Fertigkeitsspezialisierungen (several per talent) stay open.
export function entryAvailability(names: string[], item: CatalogItem) {
   const owned = ownedOfEntry(names, item)
   if (!item.parameter && !item.choices) {
      return { available: owned.level < (item.levels ?? 1), minLevel: Math.min(owned.level + 1, item.levels ?? 1), takenSubjects: new Set<string>() }
   }
   const listed = !item.levels && (item.choices || item.parameter === 'talent' || item.parameter === 'technique')
   const takenSubjects = listed ? owned.subjects : new Set<string>()
   return { available: !item.choices || item.choices.some((choice) => !takenSubjects.has(choice)), minLevel: 1, takenSubjects }
}
