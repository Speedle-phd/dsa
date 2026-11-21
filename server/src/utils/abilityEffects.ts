import { BadRequestError } from '@/utils/appError'
import type { EffectSpec, EffectValues } from '@/utils/consumables'

export type AbilityEffect = 'Eiserner Wille' | 'Schmerzen unterdrücken' | 'Aura verbergen' | 'Melodie der Kunstfertigkeit' | 'Zaubermelodie'
   | 'Zauberklinge Geisterspeer'
type AbilityState = { generalSpecialAbilities?: string[]; pain: number; spells?: Array<{ key: string }>; weapons?: string[] }

// Sustained general SF, kept as active effects until the player ends them (S. 216, 219).
export function abilityEffectSpec(state: AbilityState, ability: AbilityEffect, quality?: number, weapon?: string): EffectSpec {
   const owned = state.generalSpecialAbilities ?? []
   if (ability === 'Eiserner Wille') {
      // source: DSA5 Regelwerk, S. 216 (SK +1 per level while focusing, all other checks −level, Betäubung I afterwards)
      const level = owned.includes('Eiserner Wille II') ? 2 : owned.some((name) => name === 'Eiserner Wille I' || name === 'Eiserner Wille') ? 1 : 0
      if (!level) throw new BadRequestError('The hero does not have Eiserner Wille.')
      return {
         key: 'ironWill', label: `Eiserner Wille ${level === 2 ? 'II' : 'I'}`, page: 216,
         duration: { de: 'solange der Held sich konzentriert', en: 'while the hero concentrates' },
         values: { ironWill: level, stuporOnEnd: true },
         note: { de: `SK +${level}, alle anderen Proben −${level}. Endet bei Schlaf oder Bewusstlosigkeit; danach Betäubung I.`,
            en: `SK +${level}, all other checks −${level}. Ends on sleep or unconsciousness; then one level of Betäubung.` },
      }
   }
   const needsQuality = () => {
      if (!quality || quality < 1 || quality > 6) throw new BadRequestError('Enter the QS of the check.')
      return quality
   }
   // source: DSA5 Regelwerk, S. 268, 301 (ZAUBERKLINGE: the weapon counts as magical for QS × 3 days, no other effect)
   if (ability === 'Zauberklinge Geisterspeer') {
      if (!(state.spells ?? []).some((spell) => spell.key === ability)) throw new BadRequestError('The hero does not know Zauberklinge Geisterspeer.')
      if (!weapon || !(state.weapons ?? []).includes(weapon)) throw new BadRequestError('Choose a weapon from the inventory.')
      const qs = needsQuality()
      return {
         key: `weapon-magic:${weapon}`, label: 'Zauberklinge Geisterspeer', quality: qs, page: 301, weapon,
         duration: { de: `${qs * 3} Tage`, en: `${qs * 3} days` }, values: { magicalWeapon: true },
      }
   }
   // source: DSA5 Regelwerk, S. 284 (hidden aura: no spells, ending adds Verwirrung; Willenskraft QS hampers detection)
   if (ability === 'Aura verbergen') {
      if (!owned.includes('Aura verbergen')) throw new BadRequestError('The hero does not have Aura verbergen.')
      const qs = needsQuality()
      return {
         key: 'auraHidden', label: 'Aura verbergen', quality: qs, page: 284,
         duration: { de: 'bis aufgegeben, Schlaf oder Bewusstlosigkeit', en: 'until given up, sleep or unconsciousness' },
         values: { blocksSpells: true, confusionOnEnd: true },
         note: { de: `Gezielte magische Erkennung −${qs}; keine Zauber. Ausschalten: Verwirrung I.`, en: `Targeted magical detection −${qs}; no spells. Switching off: one level of Verwirrung.` },
      }
   }
   // source: DSA5 Regelwerk, S. 284 (Melodie der Kunstfertigkeit: crafts +QS; Zaubermelodie: +1 at QS 1–3, +2 at QS 4–6 until sunrise)
   if (ability === 'Melodie der Kunstfertigkeit' || ability === 'Zaubermelodie') {
      if (!(state.spells ?? []).some((spell) => spell.key === ability)) throw new BadRequestError(`The hero does not know ${ability}.`)
      const qs = needsQuality()
      const craft = ability === 'Melodie der Kunstfertigkeit'
      return {
         key: craft ? 'craftSong' : 'spellSong', label: ability, quality: qs, page: 284,
         duration: craft ? { de: 'solange gesungen', en: 'while singing' } : { de: 'bis Sonnenaufgang', en: 'until sunrise' },
         values: craft ? { craftBonus: qs } : { spellBonus: qs <= 3 ? 1 : 2 },
      }
   }
   // source: DSA5 Regelwerk, S. 219 (one Schmerz level per QS for one fight, at most 1 hour; Betäubung I afterwards)
   if (!owned.includes('Schmerzen unterdrücken')) throw new BadRequestError('The hero does not have Schmerzen unterdrücken.')
   if (state.pain < 1) throw new BadRequestError('Schmerzen unterdrücken needs at least one level of Schmerz.')
   if (!quality || quality < 1 || quality > 6) throw new BadRequestError('Enter the QS of the Selbstbeherrschung check.')
   return {
      key: 'painSuppression', label: 'Schmerzen unterdrücken', quality, page: 219,
      duration: { de: 'ein Kampf, höchstens 1 Stunde', en: 'one fight, at most 1 hour' },
      values: { ignorePain: quality, stuporOnEnd: true },
      note: { de: `${quality} Stufe(n) Schmerz unterdrückt; danach Betäubung I.`, en: `${quality} level(s) of Schmerz suppressed; then one level of Betäubung.` },
   }
}

// An ended Eiserner Wille / Schmerzen unterdrücken leaves one level of Betäubung (S. 216, 219), Aura verbergen one of Verwirrung (S. 284).
export function conditionsAfterEffect(conditions: Record<string, number>, values: EffectValues) {
   const next = { ...conditions }
   if (values.stuporOnEnd) next.Betäubung = Math.min(4, (next.Betäubung ?? 0) + 1)
   if (values.confusionOnEnd) next.Verwirrung = Math.min(4, (next.Verwirrung ?? 0) + 1)
   return values.stuporOnEnd || values.confusionOnEnd ? next : conditions
}
