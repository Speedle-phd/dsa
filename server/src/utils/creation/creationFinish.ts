import { characterEntryCatalog, type EntryPurchase } from '../characterEntryCatalog'
import { entryName } from '../characterEntryRules'
import { combatTechniques } from '../combatRules'
import { talentCatalog } from '../talentCatalog'
import type { CreationDraftData, CreationLedger } from './creationLedger'
import { capsFor } from './experienceCaps'
import { speciesFor } from './speciesCatalog'
import { startAge, startMoney } from './startTables'

// The hero's records after "Finish". The AP ledger mirrors normal purchases so later undo and buy-off keep working:
// disadvantage AP are a credit on the total, everything else is spent (S. 38, 46).
export function finishedHero(draft: CreationDraftData, ledger: CreationLedger) {
   const species = speciesFor(draft.species)!
   const caps = capsFor(draft.level)
   const purchases: EntryPurchase[] = []
   const credits: Array<{ key: string; ap: number }> = []
   const lists = { advantages: [...ledger.granted.advantages], disadvantages: [...ledger.granted.disadvantages],
      generalSpecialAbilities: [...ledger.granted.generalSpecialAbilities], languages: [...ledger.granted.languages], scripts: [] as string[] }
   // Package combat special abilities are part of the profession price, not separate purchases (S. 128)
   const combatSpecialAbilities = [...new Set([...ledger.granted.combatSpecialAbilities, ...ledger.combatAbilities.map((row) => row.key)])]
   // Bought ones are tracked like purchases on the hero page, so removing them later refunds their AP
   const combatAbilityPurchases = ledger.combatAbilities.filter((row) => row.ap > 0).map((row) => ({ key: row.key, ap: row.ap }))
   draft.entries.forEach((selection, index) => {
      const catalog = characterEntryCatalog.find((entry) => entry.category === selection.category && entry.key === selection.catalogKey)!
      const key = entryName(catalog, selection)
      const ap = Math.abs(ledger.entries[index]?.ap ?? 0)
      lists[selection.category].push(key)
      if (selection.category === 'disadvantages') credits.push({ key, ap })
      else purchases.push({ ...selection, key, ap })
   })
   if (draft.script) {
      lists.scripts.push(draft.script)
      const ap = characterEntryCatalog.find((entry) => entry.category === 'scripts' && entry.key === draft.script)?.ap ?? 0
      purchases.push({ category: 'scripts', catalogKey: draft.script, key: draft.script, level: 1, detail: '', application: '', ap })
   }
   const disadvantageCredit = ledger.usage.disadvantageAp
   const owned = (name: string) => lists.advantages.includes(name)
   const age = draft.age ?? startAge(species.key, draft.level).base
   return {
      char: {
         name: draft.name.trim(), sex: draft.sex, age, species: species.key, culture: draft.culture!, placeOfOrigin: draft.localKnowledge.trim() || draft.culture!,
         profession: draft.profession.kind === 'package' ? (draft.profession.variant ? `${draft.profession.key} (${draft.profession.variant})` : draft.profession.key)
            : draft.profession.kind === 'custom' && draft.profession.name.trim() ? draft.profession.name.trim() : '—',
         socialStatus: lists.advantages.some((name) => name.startsWith('Adel')) ? 'Adel' : lists.disadvantages.includes('Unfrei') ? 'Unfrei' : 'frei',
         background: draft.background,
      },
      stats: {
         ...draft.attributes,
         level: draft.level,
         experience: { base: caps.ap, gathered: 0, total: caps.ap + disadvantageCredit, spent: ledger.spent + disadvantageCredit, disadvantageCredit },
         health: { value: species.health, current: 999 },
         soulPower: { value: species.soulPower },
         toughness: { value: species.toughness },
         mana: { current: 999 },
         karmaEnergy: { current: 999 },
         ...lists,
         combatSpecialAbilities,
         combatAbilityPurchases,
         entryPurchases: purchases,
         entryCredits: credits,
         // Not activated talents stay unset (null), as on the hero page
         talents: talentCatalog.map(({ key }) => ({ key, value: ledger.talents[key]?.value ?? null, notes: '' })),
         combatTechniques: combatTechniques.map(({ key }) => ({ key, value: ledger.techniques[key]?.value ?? 6 })),
         // Package spells and tricks are part of the profession price (S. 128): only what was bought on top counts as paid
         spells: Object.entries(ledger.spells).map(([key, spell]) => ({ key, value: spell.value, notes: '', paidAP: Math.max(0, spell.cost) })),
         magicTricks: [...ledger.granted.tricks.map((key) => ({ key, paidAP: 0 })),
            ...draft.tricks.filter((key) => !ledger.granted.tricks.includes(key)).map((key) => ({ key, paidAP: 1 }))],
         // Package liturgies and the package's Zwölf Segnungen are part of the profession price (S. 128, 154–159)
         liturgies: Object.entries(ledger.liturgies).map(([key, liturgy]) => ({ key, value: liturgy.value, notes: '', paidAP: Math.max(0, liturgy.cost) })),
         blessings: [...ledger.granted.blessings.map((key) => ({ key, paidAP: 0 })),
            ...[...new Set(draft.blessings ?? [])].filter((key) => !ledger.granted.blessings.includes(key)).map((key) => ({ key, paidAP: 1 }))],
         isSorcerer: owned('Zauberer'),
         isConsecratedPerson: owned('Geweihter'),
         purse: { dukaten: 0, silbertaler: startMoney.silver, heller: 0, kreuzer: 0 },
      },
   }
}
