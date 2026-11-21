import { Companion } from '@/models/companion.model'
import { Stats } from '@/models/stats.model'

// Companions used to live in stats.companions. Move them into their own collection (keeping their _id) and drop the old field.
// Runs on every start; it is a no-op once no stats document has the field. Upserts make a half-finished run safe to repeat.
export async function migrateEmbeddedCompanions() {
   const legacy = Stats.collection.find({ companions: { $exists: true } }, { projection: { userId: 1, companions: 1, updatedAt: 1 } })
   let moved = 0
   for await (const stat of legacy) {
      const companions = Array.isArray(stat.companions) ? stat.companions : []
      if (companions.length) {
         await Companion.collection.bulkWrite(companions.map(({ _id, ...companion }) => ({
            updateOne: {
               filter: { _id },
               update: { $setOnInsert: { ...companion, userId: stat.userId, statsId: stat._id, createdAt: _id.getTimestamp(), updatedAt: stat.updatedAt ?? new Date() } },
               upsert: true,
            },
         })))
         moved += companions.length
      }
      await Stats.collection.updateOne({ _id: stat._id }, { $unset: { companions: '' } })
   }
   if (moved) console.log(`✅ Moved ${moved} companion(s) into their own collection`)
}
