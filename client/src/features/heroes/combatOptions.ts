import { resolvePlacement } from './containers'
import { combatStoreItems, damageBonus, unarmedWeapon, type StoreWeapon } from './combatGear'
import { weaponEffects, type ActiveEffect } from './activeEffectsApi'
import { crampedModifier, parseDamage, type DamageDice } from './combatRoll'
import { canGripTwoHanded, isTwoHanded, passiveParryBonus, reloadActions, type Reach } from './combatSituation'
import type { Stats } from './statsApi'

// The hero's attack and defense options from its gear (fight panel, GM overview)
export type AttackOption = {
   key: string; label: string; technique: string; kind: 'attack' | 'ranged'; base: number; damage: DamageDice | null
   // Eingeengt modifier (S. 36); null = reach or shield size unknown.
   cramped: number | null; reach: Reach | null; shield: boolean; unarmed: boolean; twoHanded: boolean
   // Inventory slot and stored damage (Patzer tables, until repaired)
   slot: { index: number; item: string } | null; condition?: 'damaged' | 'broken'
   range?: string; ammunition?: string; reload: number | null | undefined; oneHanded: boolean
   // Magic weapon, Waffenbalsam and weapon poison notes (S. 270, 274, 342)
   notes: string[]
   // May be held in both hands (S. 366); a Großschild in the other hand costs the main weapon AT −1 (S. 367).
   gripAllowed: boolean; bigShield: boolean
}
export type DefenseOption = {
   key: string; label: string; checkKey: string; technique: string; base: number; cramped: number | null; parryModifier: number
   passive: number; shield?: boolean; dodge?: boolean; unarmed?: boolean; oneHanded?: boolean; gripAllowed?: boolean
   slot: { index: number; item: string } | null; condition?: 'damaged' | 'broken'
}

// source: DSA5 Regelwerk, S. 374 (Scheiden hold a weapon ready for Schnellziehen)
const sheaths = ['Dolchscheide', 'Schwertscheide']

export function gearOptions(stats: Stats, effects: readonly ActiveEffect[]) {
   const attack: AttackOption[] = []
   const defense: DefenseOption[] = []
   const statuses = stats.statuses ?? []
   // Angelegt weapons plus weapons in a worn Dolch-/Schwertscheide (S. 249, 374): the sheathed ones are not held until drawn.
   const equipped = stats.equipment.flatMap((entry, index) => {
      const sheathed = sheaths.includes(entry.carriedOn) && resolvePlacement(entry.carriedOn, stats.equipment) === 'carried'
      if ((entry.carriedOn !== 'Equipped' && !sheathed) || entry.amount <= 0) return []
      const item = combatStoreItems.find((candidate) => candidate.name === entry.item)
      return item?.weapon ? [{ key: `${entry.item}-${index}`, name: entry.item, weapon: item.weapon, shield: item.kind === 'shield',
         slot: { index, item: entry.item }, condition: entry.condition, sheathed }] : []
   })
   const held = equipped.filter((entry) => entry.weapon.reach !== 'ranged' && !entry.sheathed)
      .map((entry) => ({ name: entry.name, technique: entry.weapon.combatTechnique, parryModifier: entry.weapon.parryModifier, shield: entry.shield }))
   // source: DSA5 Regelwerk, S. 247 (Einhändiger Kampf: only one weapon, no shield, Parierwaffe or second weapon)
   const single = held.length === 1 && ['Fechtwaffen', 'Schwerter'].includes(held[0].technique) && stats.combatSpecialAbilities.includes('Einhändiger Kampf')
   const add = (key: string, label: string, weapon: StoreWeapon, shield: boolean, unarmed = false,
      slot: AttackOption['slot'] = null, condition?: AttackOption['condition'], sheathed = false) => {
      const values = stats.combatValues.find((value) => value.key === weapon.combatTechnique)
      if (!values) return
      const ranged = weapon.reach === 'ranged'
      const cramped = statuses.includes('Eingeengt') ? crampedModifier(label, weapon.reach, shield) : { attack: 0, parry: 0 }
      // source: DSA5 Regelwerk, S. 35 (Blutrausch: +2 TP)
      const rage = statuses.includes('Blutrausch') && !ranged ? 2 : 0
      // source: DSA5 Regelwerk, S. 274 (Waffenbalsam from QS 3: +1 TP), S. 270 (artifact weapons count as magical)
      const balm = unarmed ? { damageBonus: 0, magical: false, poisoned: [] } : weaponEffects(effects, label)
      const parsed = parseDamage(weapon.damage, (damageBonus(weapon, stats) ?? 0) + rage + balm.damageBonus)
      const notes = [
         ...(sheathed ? [stats.combatSpecialAbilities.includes('Schnellziehen') ? 'In the sheath: draw it with a free action (Schnellziehen, S. 249).'
            : 'In the sheath: drawing it takes one action (S. 249).'] : []),
         ...(balm.damageBonus ? [`Waffenbalsam +${balm.damageBonus} TP`] : []),
         ...(balm.magical || combatStoreItems.find((item) => item.name === label)?.magical ? ['magical weapon'] : []),
         ...balm.poisoned.map((poison) => `poisoned: ${poison}`),
      ]
      const oneHanded = single && !unarmed && !shield && !ranged
      const gripAllowed = canGripTwoHanded({ technique: weapon.combatTechnique, ranged, shield, unarmed, twoHanded: isTwoHanded(label) }, held.length)
      // source: DSA5 Regelwerk, S. 367 (Großschild: additionally −1 AT on the main weapon)
      const bigShield = !shield && !ranged && !unarmed && held.some((item) => item.shield && item.name === 'Großschild')
      attack.push({ key, label, technique: weapon.combatTechnique, kind: ranged ? 'ranged' : 'attack',
         base: values.attack + (ranged ? 0 : weapon.attackModifier ?? 0), damage: parsed, cramped: cramped?.attack ?? null,
         reach: ranged ? null : weapon.reach as Reach, shield, unarmed, twoHanded: isTwoHanded(label),
         range: weapon.range, ammunition: weapon.ammunition, oneHanded, slot, condition, notes, gripAllowed, bigShield,
         reload: ranged ? reloadActions(weapon.reloadActions, weapon.combatTechnique, stats.combatSpecialAbilities) : undefined })
      if (!ranged && weapon.canParry !== false && values.parry != null) {
         // source: DSA5 Regelwerk, S. 233, 236 (active shield parry: twice the PA bonus; a second shield/Parierwaffe adds its passive bonus)
         const passive = shield || unarmed ? 0 : passiveParryBonus({ name: label, technique: weapon.combatTechnique, shield }, held, stats.combatSpecialAbilities)
         defense.push({ key, label, checkKey: weapon.combatTechnique, technique: weapon.combatTechnique,
            base: values.parry + (weapon.parryModifier ?? 0) * (shield ? 2 : 1) + passive, passive, parryModifier: weapon.parryModifier ?? 0,
            cramped: cramped?.parry ?? null, shield, unarmed, oneHanded, slot, condition, gripAllowed })
      }
   }
   for (const entry of equipped) add(entry.key, entry.name, entry.weapon, entry.shield, false, entry.slot, entry.condition, entry.sheathed)
   add('unarmed', 'Unarmed', unarmedWeapon, false, true)
   // source: DSA5 Regelwerk, S. 277 (Flammenschwert: Langschwert values with 1W6+7 TP, a magical weapon; 1 AsP per KR, 2 when flying;
   // a botch turns it back into the staff)
   const sword = stats.magicSettings?.staffActive === 'Flammenschwert' ? combatStoreItems.find((item) => item.name === 'Langschwert')?.weapon : undefined
   if (sword) {
      add('flame-sword', 'Flammenschwert', { ...sword, damage: '1W6+7' }, false)
      attack.find((option) => option.key === 'flame-sword')?.notes.push('magical weapon', 'Flammenschwert: 1 AsP per KR (2 when flying); a botch turns it back into the staff (S. 277).')
   }
   defense.push({ key: 'dodge', label: 'Dodge', checkKey: 'AW', technique: 'AW', base: stats.dodge.max, cramped: 0, parryModifier: 0, passive: 0, dodge: true, slot: null })
   return { attack, defense, crossBlock: stats.combatSpecialAbilities.includes('Kreuzblock') && held.length >= 2 }
}
