import { Party } from '@/models/party.model'
import { Encounter } from '@/models/encounter.model'
import { realtime } from '@/socket/realtime'

// A deleted hero leaves its party; the party room refetches.
export async function removeHeroFromParties(charId: unknown) {
   const parties = await Party.find({ 'members.charId': charId }).select('_id gmUserId')
   if (!parties.length) return
   await Promise.all([
      Party.updateMany({ 'members.charId': charId }, { $pull: { members: { charId } } }),
      Encounter.updateMany({ 'combatants.charId': charId }, { $pull: { combatants: { charId } } }),
   ])
   for (const party of parties) {
      realtime.toParty(String(party._id), { topic: 'party', partyId: String(party._id) })
      realtime.toUser(String(party.gmUserId), { topic: 'parties' })
   }
}

// A deleted account: its GM parties are deleted, its heroes leave other parties.
export async function removeUserFromParties(userId: unknown) {
   const [led, joined] = await Promise.all([
      Party.find({ gmUserId: userId }).select('_id members.userId'),
      Party.find({ 'members.userId': userId }).select('_id gmUserId'),
   ])
   await Promise.all([
      Party.deleteMany({ gmUserId: userId }),
      Party.updateMany({ 'members.userId': userId }, { $pull: { members: { userId } } }),
      Encounter.deleteMany({ partyId: { $in: led.map((party) => party._id) } }),
      Encounter.updateMany({ 'combatants.userId': userId }, { $pull: { combatants: { userId } } }),
   ])
   for (const party of led) {
      for (const member of party.members) realtime.toUser(String(member.userId), { topic: 'parties' })
      realtime.closeParty(String(party._id))
   }
   for (const party of joined) {
      realtime.toParty(String(party._id), { topic: 'party', partyId: String(party._id) })
      realtime.toUser(String(party.gmUserId), { topic: 'parties' })
   }
}
