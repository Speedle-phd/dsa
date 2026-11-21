// Optional rule: Patzer tables (2W6) instead of 1W6+2 SP. Effects the app can apply are tagged with `action`.
export type PatzerTable = 'melee' | 'ranged' | 'defense' | 'rangedDefense'
export type PatzerAction =
   | { kind: 'weapon'; state: 'destroyed' | 'broken' | 'damaged' | 'lost' | 'stuck' | 'jammed' }
   | { kind: 'fall' } | { kind: 'stumble' } | { kind: 'pain' } | { kind: 'daze' }
   | { kind: 'self'; double: boolean } | { kind: 'ally' } | { kind: 'noDefense' } | { kind: 'none' }
export type PatzerEntry = { roll: number; de: string; en: string; action: PatzerAction }

const entry = (roll: number, de: string, en: string, action: PatzerAction): PatzerEntry => ({ roll, de, en, action })
const shared = (item: 'Waffe' | 'Schild', itemEn: 'weapon' | 'shield', penalty: string): PatzerEntry[] => [
   entry(2, `${item} zerstört`, `${itemEn} destroyed`, { kind: 'weapon', state: 'destroyed' }),
   entry(3, `${item} schwer beschädigt: unbrauchbar bis zur Reparatur`, `${itemEn} badly damaged: unusable until repaired`, { kind: 'weapon', state: 'broken' }),
   entry(4, `${item} beschädigt: ${penalty} bis zur Reparatur`, `${itemEn} damaged: ${penalty} until repaired`, { kind: 'weapon', state: 'damaged' }),
   entry(5, `${item} verloren: zu Boden gefallen`, `${itemEn} lost: dropped`, { kind: 'weapon', state: 'lost' }),
]
const melee = (item: 'Waffe' | 'Schild', itemEn: 'weapon' | 'shield'): PatzerEntry[] => [
   ...shared(item, itemEn, 'AT und PA −2'),
   entry(6, `${item} stecken geblieben: 1 Aktion und Kraftakt (Ziehen & Zerren) −1`, `${itemEn} stuck: 1 action and Feat of Strength −1`, { kind: 'weapon', state: 'stuck' }),
   entry(7, 'Sturz: Körperbeherrschung (Balance) −2, sonst Liegend', 'Fall: Body Control (balance) −2, otherwise Liegend', { kind: 'fall' }),
   entry(8, 'Stolpern: nächste Handlung −2', 'Stumble: next action −2', { kind: 'stumble' }),
   entry(9, 'Fuß verdreht: 1 Stufe Schmerz für 3 KR', 'Twisted foot: 1 level of Schmerz for 3 KR', { kind: 'pain' }),
   entry(10, 'Beule: 1 Stufe Betäubung für 1 Stunde', 'Bump: 1 level of Betäubung for 1 hour', { kind: 'daze' }),
   entry(11, 'Selbst verletzt: Waffenschaden inkl. Schadensbonus (unbewaffnet 1W6 TP)', 'Hurt yourself: weapon damage incl. bonus (unarmed 1W6 TP)', { kind: 'self', double: false }),
   entry(12, 'Selbst schwer verletzt: Waffenschaden verdoppelt (unbewaffnet 1W6 TP)', 'Badly hurt yourself: weapon damage doubled (unarmed 1W6 TP)', { kind: 'self', double: true }),
]

// source: DSA5 Regelwerk, S. 231–232 (Nahkampf), S. 234 (Verteidigung), S. 243 (Fernkampf), S. 244 (Verteidigung gegen Fernkampf)
export const patzerTables: Record<PatzerTable, PatzerEntry[]> = {
   melee: melee('Waffe', 'weapon'),
   defense: melee('Waffe', 'weapon'),
   rangedDefense: melee('Schild', 'shield'),
   ranged: [
      ...shared('Waffe', 'weapon', 'FK −4'),
      entry(6, 'Kamerad/Unschuldiger getroffen (sonst wie 11)', 'Hit an ally or bystander (otherwise as 11)', { kind: 'ally' }),
      entry(7, 'Fehlschuss: trifft ein Objekt', 'Wild miss: hits an object', { kind: 'none' }),
      entry(8, 'Zerrung: 1 Stufe Schmerz für 3 KR', 'Strain: 1 level of Schmerz for 3 KR', { kind: 'pain' }),
      entry(9, 'Ladehemmung: 2 KR, um die Waffe einsatzbereit zu machen', 'Jam: 2 KR to make the weapon ready', { kind: 'weapon', state: 'jammed' }),
      entry(10, 'Zu konzentriert: bis zur nächsten Aktion keine Verteidigung', 'Too focused: no defense until your next action', { kind: 'noDefense' }),
      entry(11, 'Selbst verletzt: Waffenschaden inkl. Schadensbonus', 'Hurt yourself: weapon damage incl. bonus', { kind: 'self', double: false }),
      entry(12, 'Schwer verletzt: Waffenschaden verdoppelt', 'Badly hurt: weapon damage doubled', { kind: 'self', double: true }),
   ],
}

// source: DSA5 Regelwerk, S. 231, 234 (unarmed: +5 if below 7), S. 244 (dodging a ranged attack: +5 on 2–6)
export function patzerResult(table: PatzerTable, sum: number, { unarmed = false, dodge = false } = {}) {
   let roll = sum
   if ((table === 'melee' || table === 'defense') && unarmed && roll < 7) roll += 5
   if (table === 'rangedDefense' && dodge && roll <= 6) roll += 5
   return patzerTables[table].find((item) => item.roll === roll)!
}

// Fight-only weapon states from the tables: the AT/PA/FK penalty, or whether the weapon is unusable.
export const weaponStatePenalty = (state: string | undefined, ranged: boolean) =>
   state === 'damaged' ? (ranged ? -4 : -2) : 0
export const weaponUnusable = (state: string | undefined) => ['destroyed', 'broken', 'lost', 'stuck', 'jammed'].includes(state ?? '')
