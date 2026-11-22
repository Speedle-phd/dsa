import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { rangeBands, withVision, type RangedSituation, type Situation, type Source, type Vision } from './combatSituation'
import { rangedOf, situationOf, useFightStore, type Fight } from './fightStore'
import { useEncounterLink } from './encounterLink'
import { useTurnGate } from './turnGate'

const signed = (value: number) => value > 0 ? `+${value}` : `${value}`

type Choice<T extends string | number> = { value: T; label: string }
function Select<T extends string | number>({ label, value, choices, onChange, hint }: {
   label: string; value: T; choices: Choice<T>[]; onChange: (value: T) => void; hint?: string
}) {
   const language = useLanguageStore((state) => state.language)
   return <label className='field-group fight-situation-field'>
      <span>{t(label, language)}{hint && <small> · {t(hint, language)}</small>}</span>
      <select value={String(value)} onChange={(event) => onChange(choices.find((choice) => String(choice.value) === event.target.value)!.value)}>
         {choices.map((choice) => <option key={String(choice.value)} value={String(choice.value)}>{t(choice.label, language)}</option>)}
      </select>
   </label>
}

function Toggle({ label, note, checked, onChange, hint }: { label: string; note?: string; checked: boolean; onChange: (checked: boolean) => void; hint?: string }) {
   const language = useLanguageStore((state) => state.language)
   return <label className='regen-toggle'>
      <input type='checkbox' checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span><strong>{t(label, language)}</strong>{note && <small>{t(note, language)}{hint && ` · ${t(hint, language)}`}</small>}</span>
   </label>
}

const sizes: Choice<Situation['enemySize']>[] = [
   { value: 'tiny', label: 'Tiny (rat, toad)' }, { value: 'small', label: 'Small (fawn, goat)' }, { value: 'medium', label: 'Medium (human, dwarf)' },
   { value: 'large', label: 'Large (ogre, troll)' }, { value: 'huge', label: 'Huge (dragon, giant)' },
]
const sights: Choice<Situation['sight']>[] = [
   { value: 0, label: 'Clear' }, { value: 1, label: '1 · light haze, foliage' }, { value: 2, label: '2 · silhouette (fog, moonlight)' },
   { value: 3, label: '3 · shadowy (dense fog, starlight)' }, { value: 4, label: '4 · invisible (smoke, darkness)' },
]

// Enemy and surroundings for this fight (S. 230–239). The GM tells the player; nothing is inferred.
export function SituationCard({ heroId, fight, vision }: { heroId: string; fight: Fight; vision: Vision }) {
   const language = useLanguageStore((state) => state.language)
   const update = useFightStore((state) => state.update)
   const situation = situationOf(fight)
   const set = (change: Partial<Situation>) => update(heroId, { situation: { ...situation, ...change } })
   const active = situation.enemyReach !== null || situation.enemyWeapon !== 'normal' || situation.enemySize !== 'medium' ||
      situation.sight !== 0 || situation.advantage || situation.water !== 'none'
   return <details className='fight-situation' open={active || undefined}>
      <summary>{t('Situation', language)}<small>{t('Enemy weapon and size, sight, position, water (S. 230–239)', language)}</small></summary>
      <div className='fight-situation-grid'>
         <Select label='Enemy weapon reach' value={situation.enemyReach ?? 'unknown'} onChange={(value) => set({ enemyReach: value === 'unknown' ? null : value })}
            choices={[{ value: 'unknown', label: 'Not considered' }, { value: 'short', label: 'Short' }, { value: 'medium', label: 'Medium' }, { value: 'long', label: 'Long' }]} />
         <Select label='Enemy weapon type' value={situation.enemyWeapon} onChange={(value) => set({ enemyWeapon: value })}
            choices={[{ value: 'normal', label: 'Other weapon' }, { value: 'fencing', label: 'Fechtwaffe' }, { value: 'chain', label: 'Kettenwaffe' },
               { value: 'longOrTwoHanded', label: 'Stangen- or Zweihandwaffe' }]} />
         <Select label='Enemy size' value={situation.enemySize} onChange={(value) => set({ enemySize: value })} choices={sizes} />
         <Select label='Sight' value={situation.sight} onChange={(value) => set({ sight: value })} choices={sights} />
         {situation.sight > 0 && <Toggle label='Caused by darkness' note='Dunkelsicht and Nachtblind apply; level 4 is complete darkness (S. 164, 173)'
            checked={situation.darkness} onChange={(darkness) => set({ darkness })} />}
         {withVision(situation, vision).sight !== situation.sight && <p className='fight-note'>
            {t('Your sight level', language)}: {withVision(situation, vision).sight} ({vision.darkvision ? `Dunkelsicht ${vision.darkvision === 2 ? 'II' : 'I'}` : 'Nachtblind'})</p>}
         <Select label='Water' value={situation.water} onChange={(value) => set({ water: value })}
            choices={[{ value: 'none', label: 'None' }, { value: 'waist', label: 'Waist-deep (−2)' }, { value: 'under', label: 'Under water (−6)' }]} />
         <Toggle label='Advantageous position' note='+2 on attacks and defenses (S. 238)' checked={situation.advantage} onChange={(advantage) => set({ advantage })} />
      </div>
   </details>
}

// Ranged attack inputs (S. 241–242): distance from the weapon's range, target, movement, aiming.
// `board`: values the battle board suggests in a party fight (distance, movement, into melee; S. 241–242). They are
// defaults: a change is kept for this attack (`override`) and marked as changed (user feedback, Nov 2026).
export function RangedControls({ heroId, fight, range, board = {}, override = {}, onOverride }: {
   heroId: string; fight: Fight; range: string | undefined; board?: Partial<RangedSituation>
   override?: Partial<RangedSituation>; onOverride?: (change: Partial<RangedSituation>) => void
}) {
   const language = useLanguageStore((state) => state.language)
   const update = useFightStore((state) => state.update)
   const ranged = { ...rangedOf(fight), ...board, ...override }
   const choose = <K extends keyof RangedSituation>(key: K) => (value: RangedSituation[K]) =>
      key in board && onOverride ? onOverride({ ...override, [key]: value }) : set({ [key]: value } as Partial<RangedSituation>)
   const note = (key: keyof RangedSituation) => !(key in board) ? undefined : key in override ? 'changed' : 'from the board'
   const bands = rangeBands(range)
   const set = (change: Partial<RangedSituation>) => update(heroId, { ranged: { ...rangedOf(fight), ...change } })
   // source: DSA5 Regelwerk, S. 242 (aiming: +2 per action, at most +4, a longer action); in a party fight each step is the action
   const link = useEncounterLink()
   const gate = useTurnGate(heroId, fight)
   const aimReason = gate.reason('action')
   async function aim() {
      if (await gate.spend('action', 'Aiming')) set({ aim: rangedOf(fight).aim >= 1 ? 2 : 1 })
   }
   const metres = (index: number) => bands ? ` (≤ ${bands[index]} ${t('paces', language)})` : ''
   return <div className='fight-situation-grid fight-ranged'>
      <Select label='Distance' value={ranged.distance} hint={note('distance')} onChange={choose('distance')}
         choices={[{ value: 'near', label: `${t('Near · +2 FK, +1 TP', language)}${metres(0)}` }, { value: 'medium', label: `${t('Medium · ±0', language)}${metres(1)}` },
            { value: 'far', label: `${t('Far · −2 FK, −1 TP', language)}${metres(2)}` }]} />
      <Select label='Target size or cover' value={ranged.size} onChange={(size) => set({ size })} choices={sizes} />
      <Select label='Target movement' value={ranged.targetMove} hint={note('targetMove')} onChange={choose('targetMove')}
         choices={[{ value: 'still', label: 'Standing still (+2)' }, { value: 'slow', label: 'Moving ≤ 4 paces (±0)' }, { value: 'fast', label: 'Moving ≥ 5 paces (−2)' }]} />
      <Select label='Your movement' value={ranged.shooterMove} hint={note('shooterMove')} onChange={choose('shooterMove')}
         choices={[{ value: 'still', label: 'Standing (±0)' }, { value: 'walk', label: 'Walked ≤ 4 paces (−2)' }, { value: 'run', label: 'Ran ≥ 5 paces (−4)' }]} />
      {link ? <div className='field-group fight-situation-field'>
         <span>{t('Aiming', language)} · +{ranged.aim * 2}</span>
         <button className='quiet-button' type='button' disabled={ranged.aim >= 2 || aimReason !== null}
            title={aimReason ? t(aimReason, language) : undefined} onClick={() => void aim()}>{t('Aim · 1 action (+2, max +4)', language)}</button>
      </div> : <Select label='Aiming' value={ranged.aim} onChange={(aim) => set({ aim })}
         choices={[{ value: 0, label: 'No aiming' }, { value: 1, label: '1 action (+2)' }, { value: 2, label: '2 actions (+4)' }]} />}
      <Toggle label='Target zigzags' note='−4, its GS is halved' checked={ranged.zigzag} onChange={(zigzag) => set({ zigzag })} />
      <Toggle label='Shooting into melee' note='−2; a miss hits nobody' checked={ranged.intoMelee} hint={note('intoMelee')} onChange={choose('intoMelee')} />
   </div>
}

// Named modifiers next to a roll target, so the player sees where the number comes from.
export function SourceList({ sources }: { sources: Source[] }) {
   const language = useLanguageStore((state) => state.language)
   if (!sources.length) return null
   return <ul className='fight-sources'>
      {sources.map((source) => <li key={source.label}>{t(source.label, language)} <strong>{signed(source.value)}</strong>
         {source.page > 0 && <small> · {t('S.', language)} {source.page}</small>}</li>)}
   </ul>
}
