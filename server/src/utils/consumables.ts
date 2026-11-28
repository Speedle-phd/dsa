// Consumable Alchimica, herbs and poisons: what happens when a hero uses one (S. 270–274, 342, 344–346).
import { herbByName } from './herbs/herbCatalog'
import { recipeByName } from './herbs/recipeCatalog'
export type Localized = { de: string; en: string }
export type Dice = { count: number; sides: number; bonus: number }

export type EffectValues = {
   soulPower?: number
   damageBonus?: number
   magicalWeapon?: boolean
   unbreakable?: boolean
   ignoreStupor?: number
   transitionPain?: number
   herbHealth?: number
   treatmentQuality?: number
   // Lästige Mindergeister: penalty on every skill check (S. 173)
   checkPenalty?: number
   // Eiserner Wille level: SK +level, all other checks −level (S. 216)
   ironWill?: number
   // Schmerzen unterdrücken: suppressed Schmerz levels (S. 219)
   ignorePain?: number
   // Ending the effect adds one level of Betäubung (S. 216, 219)
   stuporOnEnd?: boolean
   // Aura verbergen: no spells while hidden; ending adds one level of Verwirrung (S. 284)
   blocksSpells?: boolean
   confusionOnEnd?: boolean
   // Elfenlieder: Melodie der Kunstfertigkeit (craft checks +QS), Zaubermelodie (spells/rituals +1/+2) (S. 284)
   craftBonus?: number
   spellBonus?: number
}

// A timed effect created by consuming an item; `key` groups effects that must not stack (S. 272).
export type EffectSpec = {
   key: string
   label: string
   quality?: number
   page: number
   duration: Localized
   values: EffectValues
   weapon?: string
   setsStatus?: 'Unsichtbar'
   note?: Localized
}

export type Consumable =
   | { kind: 'heal'; page: number; dice: Dice }
   | { kind: 'mana'; page: number; dice: Dice }
   | { kind: 'antidote'; page: number; quality: number }
   | { kind: 'effect'; page: number; effect: EffectSpec; needsWeapon?: boolean }
   | { kind: 'info'; page: number; note: Localized; book?: 'AdK' }

const minutes = (value: number): Localized => ({ de: `${value} Minute${value === 1 ? '' : 'n'}`, en: `${value} minute${value === 1 ? '' : 's'}` })
const hours = (value: number): Localized => ({ de: `${value} Stunde${value === 1 ? '' : 'n'}`, en: `${value} hour${value === 1 ? '' : 's'}` })
const day: Localized = { de: '1 Tag', en: '1 day' }
const week: Localized = { de: '1 Woche', en: '1 week' }
const untilEnded: Localized = { de: 'bis beendet', en: 'until ended' }

// source: DSA5 Regelwerk, S. 272 (Heiltrank), S. 274 (Zaubertrank): 1W3, 1W6, 1W6+2/+4/+6/+8
export const potionDice: Dice[] = [
   { count: 1, sides: 3, bonus: 0 }, { count: 1, sides: 6, bonus: 0 }, { count: 1, sides: 6, bonus: 2 },
   { count: 1, sides: 6, bonus: 4 }, { count: 1, sides: 6, bonus: 6 }, { count: 1, sides: 6, bonus: 8 },
]
// source: DSA5 Regelwerk, S. 274 (Willenstrunk: SK bonus and duration in minutes per QS)
export const willpowerTable: Array<[number, number]> = [[1, 5], [2, 10], [2, 15], [2, 20], [3, 30], [3, 45]]
// source: DSA5 Regelwerk, S. 273 (Unsichtbarkeits- / Verwandlungselixier duration in minutes per QS)
const invisibilityMinutes = [1, 3, 5, 10, 15, 20]
const transformationMinutes = [1, 2, 5, 10, 15, 20]
// source: DSA5 Regelwerk, S. 273 (Liebestrunk: one hour from QS 3, a day at QS 5, a week at QS 6)
const loveDuration: Localized[] = [untilEnded, untilEnded, hours(1), hours(1), day, week]
// source: DSA5 Regelwerk, S. 274 (Waffenbalsam)
const balmDuration: Localized[] = [minutes(5), minutes(15), hours(2), hours(8), day, week]

const weaponPoisons = ['Arax', 'Kelmon', 'Tulmadron', 'Wurara']

// "Heiltrank (QS 3)" → { name: 'Heiltrank', quality: 3 }
export function parseConsumableName(item: string, quality?: number) {
   const match = /^(.*) \(QS ([1-6])\)$/.exec(item)
   return match ? { name: match[1], quality: quality ?? Number(match[2]) } : { name: item, quality }
}

export function consumableFor(item: string, storedQuality?: number, weapon?: string): Consumable | null {
   const { name, quality } = parseConsumableName(item, storedQuality)
   const q = quality ?? 0
   const index = q - 1
   const needsQuality = ['Antidot', 'Heiltrank', 'Liebestrunk', 'Unsichtbarkeitselixier', 'Verwandlungselixier', 'Waffenbalsam', 'Willenstrunk', 'Zaubertrank']
   if (needsQuality.includes(name) && !(q >= 1 && q <= 6)) return null
   switch (name) {
      case 'Heiltrank': return { kind: 'heal', page: 272, dice: potionDice[index] }
      case 'Zaubertrank': return { kind: 'mana', page: 274, dice: potionDice[index] }
      case 'Antidot': return { kind: 'antidote', page: 272, quality: q }
      case 'Willenstrunk': return { kind: 'effect', page: 274, effect: {
         key: 'soulPower', label: name, quality: q, page: 274, duration: minutes(willpowerTable[index][1]),
         values: { soulPower: willpowerTable[index][0] },
      } }
      case 'Unsichtbarkeitselixier': return { kind: 'effect', page: 273, effect: {
         key: 'invisibility', label: name, quality: q, page: 273, duration: minutes(invisibilityMinutes[index]), values: {},
         setsStatus: 'Unsichtbar',
      } }
      case 'Verwandlungselixier': return { kind: 'effect', page: 273, effect: {
         key: 'transformation', label: name, quality: q, page: 273, duration: minutes(transformationMinutes[index]),
         values: { transitionPain: 1 },
         note: { de: 'Während der Verwandlung und Rückverwandlung eine Stufe Schmerz.', en: 'One level of Schmerz while transforming and changing back.' },
      } }
      case 'Liebestrunk': return { kind: 'effect', page: 273, effect: {
         key: 'love', label: name, quality: q, page: 273, duration: loveDuration[index], values: {},
      } }
      case 'Waffenbalsam': return { kind: 'effect', page: 274, needsWeapon: true, effect: {
         key: `weapon-balm:${weapon ?? ''}`, label: name, quality: q, page: 274, duration: balmDuration[index], weapon,
         values: { magicalWeapon: true, ...(q >= 3 ? { damageBonus: 1 } : {}), ...(q >= 5 ? { unbreakable: true } : {}) },
         note: { de: 'Das Einreiben dauert 5 Kampfrunden.', en: 'Rubbing in the balm takes 5 combat rounds.' },
      } }
      // source: DSA5 Regelwerk, S. 345 (Gulmond: 12 hours, ignore the penalties of two levels of Betäubung)
      case 'Gulmond': return { kind: 'effect', page: 345, effect: {
         key: 'ignoreStupor', label: name, page: 345, duration: hours(12), values: { ignoreStupor: 2 },
         note: { de: 'Bei Betäubung IV dennoch handlungsunfähig.', en: 'Still incapacitated at Betäubung IV.' },
      } }
      // source: DSA5 Regelwerk, S. 346 (Wirselkraut: +1 LeP per application at the next regeneration, at most +3 per phase)
      case 'Wirselkraut': return { kind: 'effect', page: 346, effect: {
         key: 'herbHealth', label: name, page: 346, duration: { de: 'bis zur nächsten Regeneration', en: 'until the next regeneration' },
         values: { herbHealth: 1 },
      } }
      case 'Alraune': return { kind: 'info', page: 345, note: { de: 'Alraunen werden vor allem in der Alchimie verwendet.', en: 'Mandrake is mainly used in alchemy.' } }
      case 'Axordabaum': return { kind: 'info', page: 345, note: { de: 'Gegenmittel gegen Zorganpocken: mit der Spielleitung abhandeln.', en: 'Cure for Zorganpocken: resolve it with the GM.' } }
      case 'Donf': return { kind: 'info', page: 345, note: { de: 'Gegenmittel gegen Sumpffieber (Dauer −2 Tage): mit der Spielleitung abhandeln.', en: 'Cure for Sumpffieber (duration −2 days): resolve it with the GM.' } }
      case 'Egelschreck': return { kind: 'info', page: 345, note: { de: 'Vertreibt Parasiten.', en: 'Repels parasites.' } }
      case 'Lulanie': return { kind: 'info', page: 346, note: { de: 'Gegenmittel gegen Lutanas und Raschen Wahn: mit der Spielleitung abhandeln.', en: 'Cure for Lutanas and Rascher Wahn: resolve it with the GM.' } }
   }
   // source: DSA5 Regelwerk, S. 342 (weapon poisons act on the first undefended hit, at most 5 attacks)
   if (weaponPoisons.includes(name)) return { kind: 'effect', page: 342, needsWeapon: true, effect: {
      key: `weapon-poison:${weapon ?? ''}`, label: name, page: 342, duration: { de: 'erster unverteidigter Treffer, höchstens 5 Angriffe', en: 'first undefended hit, at most 5 attacks' },
      weapon, values: {},
      note: { de: 'Wirkt nur, wenn der Treffer den RS durchdringt; nur Klingen- und Stichwaffen.', en: 'Works only if the hit gets through the armor; bladed or piercing weapons only.' },
   } }
   // Plants of Archiv der Kräuter without an automated rule: used up, the effect is resolved with the GM (AdK plant page)
   const herb = herbByName(name)
   if (herb) return { kind: 'info', page: herb.page, book: 'AdK', note: {
      de: `Wirkung laut AdK S. ${herb.page}: mit der Spielleitung abhandeln.`, en: `Effect as on AdK p. ${herb.page}: resolve it with the GM.` } }
   // Products of Archiv der Kräuter's recipes (made or brewed, AdK S. 145–178): used up, the summary (for a brew its QS line)
   // shows what happens; poisons and drugs are resolved with the GM until their rules are built
   const recipe = recipeByName(name)
   if (recipe) {
      const line = recipe.summary?.qualities && q >= 1 && q <= 6 ? recipe.summary.qualities[index] : recipe.summary?.effect
      return { kind: 'info', page: recipe.page, book: 'AdK', note: line ?? {
         de: `Wirkung laut AdK S. ${recipe.page}: mit der Spielleitung abhandeln.`, en: `Effect as on AdK p. ${recipe.page}: resolve it with the GM.` } }
   }
   return null
}

export function isConsumable(item: string, quality?: number) {
   return consumableFor(item, quality, 'weapon') !== null
}

// Rolled dice must fit the potion's dice (count and sides); the bonus is added here.
export function diceTotal(dice: Dice, rolls: readonly number[]) {
   if (rolls.length !== dice.count || rolls.some((roll) => !Number.isInteger(roll) || roll < 1 || roll > dice.sides)) return null
   return rolls.reduce((sum, roll) => sum + roll, dice.bonus)
}

// The strongest value of the effect group counts (S. 272); Wirselkraut adds up to +3 per phase (S. 346).
export function effectStrength(values: EffectValues) {
   return Math.max(values.soulPower ?? 0, values.ignoreStupor ?? 0, values.damageBonus ?? 0, values.herbHealth ?? 0,
      values.treatmentQuality ?? 0, values.magicalWeapon ? 1 : 0, values.unbreakable ? 2 : 0)
}

export type StackDecision =
   | { action: 'add' }
   | { action: 'replace'; existingId: string }
   | { action: 'increase'; existingId: string; values: EffectValues }
   | { action: 'weaker' }

type ExistingEffect = { id: string; key: string; quality?: number; values: EffectValues }

// source: DSA5 Regelwerk, S. 272 (Gestapelte Alchimieeffekte: only the strongest effect applies)
export function stackEffect(existing: readonly ExistingEffect[], next: EffectSpec): StackDecision {
   const same = existing.find((effect) => effect.key === next.key)
   if (!same) return { action: 'add' }
   if (next.key === 'herbHealth') {
      const total = Math.min(3, (same.values.herbHealth ?? 0) + (next.values.herbHealth ?? 0))
      return total > (same.values.herbHealth ?? 0) ? { action: 'increase', existingId: same.id, values: { herbHealth: total } } : { action: 'weaker' }
   }
   const nextStrength = effectStrength(next.values) * 10 + (next.quality ?? 0)
   const currentStrength = effectStrength(same.values) * 10 + (same.quality ?? 0)
   return nextStrength > currentStrength ? { action: 'replace', existingId: same.id } : { action: 'weaker' }
}
