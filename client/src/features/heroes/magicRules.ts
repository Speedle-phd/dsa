// Client rules for the Magie chapter (S. 251–305): staff, rituals, artifacts and the spell Patzer table.
import type { Stats } from './statsApi'
import type { TalentAttribute } from './talentCatalog'

// source: DSA5 Regelwerk, S. 252 (optional Merkmalsproben: one probe per Merkmal)
export const propertyProbes: Record<string, [TalentAttribute, TalentAttribute, TalentAttribute]> = {
   Antimagie: ['courage', 'wisdom', 'charisma'],
   Dämonisch: ['courage', 'intuition', 'charisma'],
   Einfluss: ['courage', 'intuition', 'charisma'],
   Elementar: ['courage', 'wisdom', 'charisma'],
   Heilung: ['wisdom', 'intuition', 'fingerDexterity'],
   Hellsicht: ['courage', 'wisdom', 'intuition'],
   Illusion: ['wisdom', 'intuition', 'charisma'],
   Sphären: ['courage', 'charisma', 'constitution'],
   Objekt: ['wisdom', 'intuition', 'fingerDexterity'],
   Telekinese: ['wisdom', 'fingerDexterity', 'strength'],
   Verwandlung: ['wisdom', 'intuition', 'constitution'],
}

// source: DSA5 Regelwerk, S. 276–278 (activation cost of staff spells; a transformed staff is not "in the hand")
export const staffActivationCost: Record<string, number> = {
   'Doppeltes Maß': 1, 'Ewige Flamme': 1, Flammenschwert: 3, 'Seil des Adepten': 1, 'Stab-Apport': 1,
}
const transforming = ['Ewige Flamme', 'Flammenschwert', 'Seil des Adepten']

// The foci only work while the bound staff is held and not transformed (S. 277).
export function staffFoci(stats: Pick<Stats, 'generalSpecialAbilities' | 'magicSettings'>) {
   const owned = stats.generalSpecialAbilities
   const usable = owned.includes('Bindung des Stabes') && stats.magicSettings.staffInHand &&
      !transforming.includes(stats.magicSettings.staffActive ?? '')
   return {
      usable,
      powerFocus: usable && owned.includes('Kraftfokus'),
      properties: usable ? owned.filter((name) => name.startsWith('Merkmalsfokus (')).map((name) => name.slice('Merkmalsfokus ('.length, -1)) : [],
   }
}

// Volume used by the owned staff spells (each Merkmalsfokus counts).
export function staffVolume(abilities: readonly string[], volumes: Record<string, number>) {
   return abilities.reduce((sum, name) => sum + (volumes[name.replace(/ \(.*\)$/, '')] ?? 0), 0)
}

// source: DSA5 Regelwerk, S. 277 (Kraftfokus: −1 AsP after all other changes, never below 1)
export const withPowerFocus = (amount: number, powerFocus: boolean) => powerFocus ? Math.max(1, amount - 1) : amount

// source: DSA5 Regelwerk, S. 260 (Modifikatoren für die Ritualprobe)
export const ritualSiteOptions = [
   { key: 'site', label: 'Ritual site', options: [{ value: 1, label: 'Sanctuary or magical place' }, { value: 0, label: 'Ordinary place' }, { value: -3, label: 'Wrong place' }] },
   { key: 'time', label: 'Constellation', options: [{ value: 1, label: 'Matching constellation' }, { value: 0, label: 'Neutral' }, { value: -1, label: 'Unsuitable constellation' }] },
] as const

// source: DSA5 Regelwerk, S. 255–256 (Zaubermodifikationen), S. 261 (Ritualmodifikationen); one step per category, at most FW / 4.
// The same five modifications apply to spells and rituals; only "Zauberdauer" becomes "Ritualdauer".
export const ritualModifications = [
   { key: 'force', label: 'Erzwingen', value: 1, needsCost: true },
   { key: 'cheaper', label: 'Kosten senken', value: -1, needsCost: true },
   { key: 'range', label: 'Reichweite erhöhen', value: -1, needsRange: true },
   { key: 'longer', label: 'Ritualdauer erhöhen', value: 1, excludes: 'shorter' },
   { key: 'shorter', label: 'Ritualdauer senken', value: -1, excludes: 'longer' },
] as const
export const modificationLabel = (key: string, ritual: boolean) => {
   const label = ritualModifications.find((entry) => entry.key === key)?.label ?? key
   return ritual ? label : label.replace('Ritualdauer', 'Zauberdauer')
}
// source: DSA5 Regelwerk, S. 256 (Zaubermodifikationen), S. 261 (Ritualmodifikationen): the steps each modification moves along
export const modificationSteps = {
   spell: { page: 256, rows: [
      ['Zauberdauer', ['1 Aktion', '2 Aktionen', '4 Aktionen', '8 Aktionen', '16 Aktionen', '32 Aktionen']],
      ['Reichweite', ['Berühren', '4 Schritt', '8 Schritt', '16 Schritt', '32 Schritt', '64 Schritt']],
      ['Kosten', ['1 AsP', '2 AsP', '4 AsP', '8 AsP', '16 AsP', '32 AsP']],
   ] },
   ritual: { page: 261, rows: [
      ['Ritualdauer', ['5 Minuten', '30 Minuten', '2 Stunden', '8 Stunden', '16 Stunden', '32 Stunden']],
      ['Reichweite', ['Berühren', '4 Schritt', '8 Schritt', '16 Schritt', '32 Schritt', '64 Schritt']],
      ['Kosten', ['8 AsP', '16 AsP', '32 AsP', '64 AsP', '128 AsP', '256 AsP']],
   ] },
} as const satisfies Record<'spell' | 'ritual', { page: number; rows: ReadonlyArray<readonly [string, readonly string[]]> }>

// source: DSA5 Regelwerk, S. 258 (Patzertabelle für Zaubersprüche, 2W6)
export const spellPatzerTable: Record<number, { de: string; en: string; action?: 'drainAsp' | 'stupor' }> = {
   2: { de: 'Der Geist des Zauberers tauscht für 1W6 Tage den Körper mit dem nächsten Lebewesen, das größer als eine Ratte ist.', en: 'The caster’s mind swaps bodies with the nearest creature larger than a rat for 1W6 days.' },
   3: { de: 'Ein Mindergeist verfolgt den Zauberer 1W6 Tage lang.', en: 'A minor spirit follows the caster for 1W6 days.' },
   4: { de: 'Das Ziel des Zaubers ändert sich zufällig nach Wahl des Meisters.', en: 'The spell’s target changes at random, as the GM chooses.' },
   5: { de: 'Der Zauberer verwandelt sich für 1W6 Stunden in ein Kleintier nach Wahl des Meisters.', en: 'The caster turns into a small animal of the GM’s choice for 1W6 hours.' },
   6: { de: 'Die gesamte Astralkraft verlässt den Körper als Funkenregen; sie regeneriert normal.', en: 'All astral energy leaves the body as a rain of sparks; it regenerates normally.', action: 'drainAsp' },
   7: { de: 'Der Zauberer kann 1W6 Tage lang nicht auf seine AsP zugreifen.', en: 'The caster cannot use their AsP for 1W6 days.' },
   8: { de: 'Pochende Kopfschmerzen: 1W6 Tage lang eine Stufe Betäubung.', en: 'Throbbing headache: one level of Betäubung for 1W6 days.', action: 'stupor' },
   9: { de: 'Die gesamte Astralkraft springt auf das nächste magisch begabte Wesen über; der Zauberer regeneriert sie normal.', en: 'All astral energy jumps to the nearest magically gifted being; the caster regenerates it normally.', action: 'drainAsp' },
   10: { de: 'Der Zauberer verliert für 1W6 Tage die Fähigkeit zu sprechen.', en: 'The caster cannot speak for 1W6 days.' },
   11: { de: 'Haar und Bart färben sich bunt.', en: 'Hair and beard turn colourful.' },
   12: { de: 'Eine ätherische Stimme sagt: „Tu das nie wieder!“', en: 'An ethereal voice says: “Never do that again!”' },
}

export type ArtifactRecharge = 'month' | 'week' | 'day'
// source: DSA5 Regelwerk, S. 267–268 (mirrors server/src/utils/artifacts.ts)
export const arcanoviCost = 16
export const rechargeRules: Record<ArtifactRecharge, { modifier: number; factor: number }> = {
   month: { modifier: -1, factor: 5 }, week: { modifier: -2, factor: 10 }, day: { modifier: -3, factor: 25 },
}
export type ArcanoviInput = { spellCost: number; charges: number; recharge: ArtifactRecharge | null; iron: boolean; materialSaved: number; materialBonus: boolean }
export function arcanoviPlan({ spellCost, charges, recharge, iron, materialSaved, materialBonus }: ArcanoviInput) {
   const charge = recharge ? rechargeRules[recharge] : { modifier: -(charges - 1), factor: charges }
   const asp = arcanoviCost + spellCost * charge.factor
   const permanent = Math.round(asp / 10)
   return {
      arcanoviModifier: charge.modifier + (iron ? -2 : 0) + (materialBonus && !materialSaved ? 1 : 0),
      spellModifier: charge.modifier,
      asp,
      permanent: permanent - materialSaved,
      saveable: Math.floor(permanent / 2),
      materialSilver: materialSaved * 100,
   }
}
// source: DSA5 Regelwerk, S. 269 (price rule of thumb)
export function artifactPrice(asp: number, permanent: number, stfClass: 'a' | 'b' | 'c' | 'd', quality: number, itemValue = 0) {
   const factor = stfClass === 'a' ? 0.75 : stfClass === 'b' ? 1 : 1.5
   return Math.round((asp * 10 + permanent * 100) * factor + quality * 50 + itemValue)
}

// source: DSA5 Regelwerk, S. 268–269 (Nebeneffekte, 1W20 + FP of the ARCANOVI when its QS was 1)
export const artifactSideEffects: Array<{ from: number; to: number; de: string }> = [
   { from: 1, to: 2, de: 'Das Artefakt wird Heim eines Geistes (W6: 1 Dämon, 2–3 Elementar, 4–6 Geist eines Verstorbenen).' },
   { from: 3, to: 3, de: 'Das Artefakt wiegt nur noch ein Drittel.' },
   { from: 4, to: 4, de: 'Das Artefakt wiegt das Dreifache.' },
   { from: 5, to: 5, de: 'Das Artefakt versteift sich und verliert jegliche Flexibilität.' },
   { from: 6, to: 6, de: 'Das Artefakt wird weich und biegsam wie ein Hanfseil.' },
   { from: 7, to: 7, de: 'Das Artefakt lockt Katzen an.' },
   { from: 8, to: 8, de: 'Zwischen Aktivierung und Auslösung vergehen 2 Kampfrunden.' },
   { from: 9, to: 9, de: 'Bei Aktivierung riecht es stark nach Zwiebeln oder Schwefel.' },
   { from: 10, to: 10, de: 'Das Artefakt färbt ab und hinterlässt schwer zu entfernende Flecken.' },
   { from: 11, to: 11, de: 'Das Artefakt lässt sich nur nachts aktivieren.' },
   { from: 12, to: 12, de: 'Es aktiviert sich nur bei 1–3 auf W6; die Ladung wird nur verbraucht, wenn gewürfelt werden muss.' },
   { from: 13, to: 13, de: 'Bei Aktivierung zirpt es und macht Reptilien im Umkreis einer Meile aggressiv.' },
   { from: 14, to: 14, de: 'Nach einem Jahr und einem Tag wird es zu einem Nahrungsmittel nach Wahl des Meisters.' },
   { from: 15, to: 15, de: 'Es aktiviert sich selbst, wenn es durchgeschüttelt wird.' },
   { from: 16, to: 16, de: 'Nach einem Jahr und einem Tag geht es in Flammen auf.' },
   { from: 17, to: 17, de: 'Nach einem Jahr und einem Tag holt es ein Dämon (W6 1–3) oder Dschinn (4–6).' },
   { from: 18, to: 18, de: 'Der Besitzer wird zunehmend von Verlustängsten geplagt.' },
   { from: 19, to: 99, de: 'Kein zusätzlicher Effekt.' },
]
export const sideEffectFor = (total: number) => artifactSideEffects.find((entry) => total >= entry.from && total <= entry.to) ?? artifactSideEffects[0]

// source: DSA5 Regelwerk, S. 269 (magical analysis: QS cap without / with Analytiker and a Hellsicht spell such as ANALYS)
export function analysisQualityCap(hasAnalytiker: boolean, spellQuality: number) {
   return Math.max(spellQuality, 0) + (hasAnalytiker ? 1 : 0)
}
