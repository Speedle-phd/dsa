import { Stats } from '@/models/stats.model'
import { defaultTalents } from '@/utils/talentCatalog'

// source: DSA5 Regelwerk, S. 25 ("Alle Talente sind aktiv"). Talents used to start unset (null) and cost an activation
// (house rule until Nov 2026). Set every unset talent to FW 0 and add catalog talents a hero is missing.
// Runs on every start; a no-op once every hero has all talents with a value. AP paid for activations stay spent.
export async function migrateTalentsToActive() {
   const unset = await Stats.collection.updateMany(
      { talents: { $elemMatch: { value: null } } },
      { $set: { 'talents.$[talent].value': 0 } },
      { arrayFilters: [{ 'talent.value': null }] },
   )
   let added = 0
   const defaults = defaultTalents()
   const incomplete = Stats.collection.find({ 'talents.key': { $not: { $all: defaults.map((talent) => talent.key) } } }, { projection: { talents: 1 } })
   for await (const stat of incomplete) {
      const owned = new Set((Array.isArray(stat.talents) ? stat.talents : []).map((talent: { key: string }) => talent.key))
      const missing = defaults.filter((talent) => !owned.has(talent.key))
      if (!missing.length) continue
      await Stats.updateOne({ _id: stat._id }, { $push: { talents: { $each: missing } } })
      added += missing.length
   }
   if (unset.modifiedCount || added) console.log(`✅ Talents active from FW 0: ${unset.modifiedCount} hero(es) updated, ${added} missing talent(s) added`)
}
