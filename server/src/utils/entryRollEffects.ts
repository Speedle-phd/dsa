import { characterEntryCatalog, entryRomans } from './characterEntryCatalog'
import { selectionFromEntry } from './characterEntryRules'
import { combatAbilityEffect } from './combatAbilityEffects'
import { equippedArmor } from './armorEquipment'

export type RollEffectState = Record<'advantages' | 'disadvantages' | 'generalSpecialAbilities', string[]> & {
   combatSpecialAbilities: string[]
   equipment: Array<{ item: string; amount: number; carriedOn?: string }>
   wornArmor?: string | null
}
export type RollEffect = {
   id: string
   label: string
   kind: 'talent' | 'attribute' | 'attack' | 'ranged' | 'defense'
   keys?: string[]
   value: number
   skillPoints: number
   automatic: boolean
   page: number
   de: string
   en: string
   group?: string
   excludes?: string[]
   blocked?: boolean
   offsetPenalty?: number
   // Matches every check of the kind except these keys (status exceptions, e.g. Blutrausch).
   exceptKeys?: string[]
   // Replaces the effective target after modifiers: halved (rounded up) or only a rolled 1 succeeds.
   targetRule?: 'halve' | 'one'
   // Maneuver damage on a hit: +TP, extra W6, replaced damage (1W3), or +½ GS (Sturmangriff).
   damage?: EffectDamage
   // Reroll advantages/disadvantages offered in the dice dialogs (S. 164, 169, 178), not target modifiers.
   reroll?: 'begabung' | 'unfaehig' | 'waffenbegabung' | 'falschspielen' | 'rosstaeuscher'
}
export type EffectDamage = { bonus?: number; dice?: number; replace?: '1W3'; halfSpeed?: boolean }
type Rule = Omit<RollEffect, 'id' | 'label' | 'page' | 'de' | 'en' | 'automatic' | 'skillPoints'> & {
   automatic?: boolean
   perLevel?: boolean
   skillPoints?: number
   de?: string
   en?: string
}
const talent = (keys: string[], value: number, options: Partial<Rule> = {}): Rule => ({ kind: 'talent', keys, value, ...options })
const social = ['bekehrenUeberzeugen', 'betoeren', 'einschuechtern', 'etikette', 'gassenwissen', 'menschenkenntnis', 'ueberreden', 'verkleiden', 'willenskraft']
const conversation = social.filter((key) => !['menschenkenntnis', 'willenskraft'].includes(key))
const stigma = conversation.filter((key) => key !== 'einschuechtern')
const application = (de: string, en: string) => ({ de, en })

// source: DSA5 Regelwerk, S. 163–179 (application-dependent effects are never unconditional)
const traitRules: Record<string, Rule[]> = {
   'Angenehmer Geruch': [talent(['betoeren'], 1)],
   'Geborener Redner': [talent(['bekehrenUeberzeugen'], 1, application('Öffentliche Rede.', 'Public speaking.'))],
   // source: DSA5 Regelwerk, S. 164 (replace a long-range -2 with -1, not a free bonus)
   Entfernungssinn: [{
      kind: 'ranged', keys: ['Armbrüste', 'Bögen'], value: 1, offsetPenalty: 2,
      de: 'Den normalen Weit-Abzug von -2 im situativen Modifikator erfassen; dieser Effekt gleicht 1 Punkt aus.',
      en: 'Enter the ordinary long-range -2 in the situational modifier; this effect offsets 1 point.',
   }],
   Gutaussehend: [
      talent(['betoeren'], 1, { perLevel: true, ...application('Anbändeln oder Liebeskünste.', 'Flirting or lovemaking.') }),
      talent(['ueberreden'], 1, { perLevel: true, ...application('Aufschwatzen, Herausreden, Manipulieren oder Schmeicheln.', 'Hard sell, excuses, manipulation or flattery.') }),
      talent(['handel'], 1, { perLevel: true, ...application('Feilschen.', 'Bargaining.') }),
   ],
   Hässlich: [
      talent(['betoeren'], -1, { perLevel: true, ...application('Anbändeln oder Liebeskünste.', 'Flirting or lovemaking.') }),
      talent(['ueberreden'], -1, { perLevel: true, ...application('Manipulieren oder Schmeicheln.', 'Manipulation or flattery.') }),
      talent(['handel'], -1, { perLevel: true, ...application('Feilschen.', 'Bargaining.') }),
   ],
   Richtungssinn: [talent(['orientierung'], 1, { automatic: true })],
   Schlangenmensch: [talent(['koerperbeherrschung'], 1, application('Akrobatik oder Entwinden.', 'Acrobatics or escaping restraints.'))],
   Unscheinbar: [talent(['gassenwissen'], 1, application('Beschatten.', 'Shadowing someone.'))],
   Vertrauenerweckend: [
      talent(['bekehrenUeberzeugen'], 1, application('Öffentliche Rede, Einzelgespräch oder Diskussionsführung.', 'Public speaking, one-to-one conversation or discussion.')),
      talent(['ueberreden'], 1, application('Betteln, Manipulieren oder Schmeicheln.', 'Begging, manipulation or flattery.')),
      talent(['handel'], 1, application('Feilschen.', 'Bargaining.')),
   ],
   Wohlklang: [talent(['singen'], 1, { automatic: true })],
   Zwergennase: [talent(['sinnesschaerfe'], 1)],
   Fettleibig: [talent(['klettern', 'koerperbeherrschung', 'tanzen', 'verbergen'], -1, { automatic: true })],
   'Eingeschränkter Sinn (Sicht)': [talent(['sinnesschaerfe'], -2), { kind: 'ranged', value: -2, automatic: true }],
   'Verstümmelt (Einäugig)': [{ kind: 'ranged', value: -4, automatic: true }],
   'Verstümmelt (Einohrig)': [talent(['sinnesschaerfe'], -1)],
   // source: DSA5 Regelwerk, S. 167, 171, 173 (spell checks only; 'spell:*' matches every spell)
   Artefaktgebunden: [talent(['spell:*'], -1, application('Kein Hautkontakt mit dem Artefakt.', 'No skin contact with the artifact.'))],
   'Magische Einstimmung': [talent(['spell:*'], 1, application('In der gewählten Umgebung.', 'In the chosen environment.'))],
   'Magische Einschränkung': [talent(['spell:*'], -1, application('Außerhalb der gewählten Umgebung.', 'Outside the chosen environment.'))],
   Prinzipientreue: [talent([], -1, { group: 'principles' })],
   Sprachfehler: [talent([...conversation, 'handel'], -1)],
   Stigma: [talent([...stigma, 'handel'], -1)],
}
for (const sense of ['Sicht', 'Gehör', 'Geruch & Geschmack', 'Tastsinn']) {
   traitRules[`Herausragender Sinn (${sense})`] = [talent(['sinnesschaerfe'], 1)]
   if (sense !== 'Sicht') traitRules[`Eingeschränkter Sinn (${sense})`] = [talent(['sinnesschaerfe'], -2)]
}
// source: DSA5 Regelwerk, S. 174–175 (individual personality flaws have different talent scopes)
for (const name of ['Arroganz', 'Neid', 'Streitsucht', 'Vorurteile', 'Weltfremd', 'Eitelkeit', 'Verwöhnt', 'Unheimlich']) {
   const all = ['Weltfremd', 'Eitelkeit', 'Verwöhnt'].includes(name)
   const keys = all ? social : social.filter((key) => !['einschuechtern', 'willenskraft'].includes(key))
   traitRules[`Persönlichkeitsschwäche (${name})`] = [talent(
      ['Eitelkeit', 'Verwöhnt', 'Unheimlich'].includes(name) ? keys : [...keys, 'handel'], -1,
   )]
}

// source: DSA5 Regelwerk, S. 216–219, 321
const abilityRules: Record<string, Rule[]> = {
   // Eiserner Wille is a sustained active effect (SK +level, all checks −level), started from the Overview (S. 216).
   Geländekunde: [talent(['faehrtensuchen', 'orientierung', 'pflanzenkunde', 'tierkunde', 'wildnisleben'], 1, { group: 'terrain' })],
   Ortskenntnis: [talent(['gassenwissen', 'orientierung'], 1, { group: 'location' })],
   Fokussierung: [talent(['selbstbeherrschung'], 1)],
}

const melee = ['Dolche', 'Fechtwaffen', 'Hiebwaffen', 'Raufen', 'Schilde', 'Schwerter', 'Stangenwaffen', 'Zweihandhiebwaffen', 'Zweihandschwerter']
const heavy = ['Hiebwaffen', 'Kettenwaffen', 'Schwerter', 'Stangenwaffen', 'Zweihandhiebwaffen', 'Zweihandschwerter']
const combatRule = (kind: Rule['kind'], keys: string[], value: number, options: Partial<Rule> = {}): Rule => ({ kind, keys, value, ...options })
// source: DSA5 Regelwerk, S. 246–250 (one basic and one special maneuver per action, S. 246)
const combatRules: Record<string, Rule[]> = {
   Aufmerksamkeit: [talent(['sinnesschaerfe'], 2)],
   'Einhändiger Kampf': [
      combatRule('attack', ['Fechtwaffen', 'Schwerter'], 1, { damage: { bonus: 1 } }),
      combatRule('defense', ['Fechtwaffen', 'Schwerter'], 1),
   ],
   Finte: [combatRule('attack', melee.filter((key) => key !== 'Schilde'), -1, { group: 'basic', perLevel: true })],
   // source: DSA5 Regelwerk, S. 248–250 (+2 TP per level; Hammerschlag/Todesstoß +1W6; Sturmangriff +2 + ½ GS; 1W3 TP maneuvers)
   Wuchtschlag: [combatRule('attack', [...heavy, 'Raufen'], -2, { group: 'basic', perLevel: true, damage: { bonus: 2 } })],
   'Präziser Stich': [combatRule('attack', ['Dolche', 'Fechtwaffen'], -2, { group: 'basic', perLevel: true, damage: { bonus: 2 } })],
   'Präziser Schuss/Wurf': [combatRule('ranged', ['Armbrüste', 'Bögen', 'Wurfwaffen'], -2, { group: 'basic', perLevel: true, damage: { bonus: 2 } })],
   Hammerschlag: [combatRule('attack', heavy.filter((key) => key !== 'Stangenwaffen'), -2, { group: 'special', damage: { dice: 1 } })],
   Sturmangriff: [combatRule('attack', heavy.filter((key) => key !== 'Kettenwaffen'), -2, { group: 'special', excludes: ['Finte'], damage: { bonus: 2, halfSpeed: true } })],
   Todesstoß: [combatRule('attack', ['Dolche', 'Fechtwaffen'], -2, { group: 'special', damage: { dice: 1 } })],
   Wurf: [combatRule('attack', ['Raufen'], -2, { group: 'special', damage: { replace: '1W3' } })],
   'Zu Fall bringen': [combatRule('attack', ['Stangenwaffen'], -4, { group: 'special', damage: { replace: '1W3' } })],
   // Riposte, Vorstoß and Verteidigungshaltung are declared in the fight panel (round stances), Klingenfänger and
   // Beidhändiger Kampf are computed there from the equipped weapons (S. 233, 238, 248–250).
}

export function ownedRollEffects(state: Partial<RollEffectState>): RollEffect[] {
   const result: RollEffect[] = []
   function add(label: string, page: number, de: string, en: string, rules: Rule[], level = 1) {
      rules.forEach((rule, index) => result.push({
         id: `${label}:${index}`, label, page,
         de: rule.de ? `${rule.de} ${de}` : de, en: rule.en ? `${rule.en} ${en}` : en,
         kind: rule.kind, keys: rule.keys, value: rule.value * (rule.perLevel ? level : 1),
         skillPoints: rule.skillPoints ?? 0, automatic: rule.automatic ?? false,
         group: rule.group, excludes: rule.excludes, blocked: rule.blocked,
         offsetPenalty: rule.offsetPenalty, reroll: rule.reroll,
         ...(rule.damage ? { damage: rule.damage.bonus && rule.perLevel ? { ...rule.damage, bonus: rule.damage.bonus * level } : rule.damage } : {}),
      }))
   }
   for (const category of ['advantages', 'disadvantages', 'generalSpecialAbilities'] as const) {
      const selected = new Map<string, { name: string; selection: NonNullable<ReturnType<typeof selectionFromEntry>> }>()
      for (const name of state[category] ?? []) {
         const selection = selectionFromEntry(category, name)
         if (!selection) continue
         const identity = `${selection.catalogKey}:${selection.detail}:${selection.application}`
         if ((selected.get(identity)?.selection.level ?? 0) < selection.level) selected.set(identity, { name, selection })
      }
      for (const { name, selection } of selected.values()) {
         const entry = characterEntryCatalog.find((item) => item.category === category && item.key === selection.catalogKey)
         if (!entry) continue
         const rules = (category === 'generalSpecialAbilities' ? abilityRules : traitRules)[entry.key] ?? []
         add(name, entry.effect.page, entry.effect.de, entry.effect.en, rules, selection.level)
         // source: DSA5 Regelwerk, S. 164, 169, 178, 216, 218 (FW and rerolls are not target modifiers)
         if (entry.key === 'Fertigkeitsspezialisierung') add(name, 216, entry.effect.de, entry.effect.en,
            [talent([selection.detail], 0, { skillPoints: 2, group: 'specialization' })])
         if (['Begabung', 'Unfähig', 'Falschspielen', 'Rosstäuscher', 'Waffenbegabung'].includes(entry.key)) {
            const keys = entry.key === 'Falschspielen' ? ['brettUndGlueckspiel'] : entry.key === 'Rosstäuscher' ? ['handel'] : [selection.detail]
            const kinds: Rule['kind'][] = entry.key === 'Waffenbegabung' ? ['attack', 'ranged', 'defense'] : ['talent']
            const reroll = ({ Begabung: 'begabung', Unfähig: 'unfaehig', Waffenbegabung: 'waffenbegabung', Falschspielen: 'falschspielen', Rosstäuscher: 'rosstaeuscher' } as const)[entry.key as 'Begabung']
            // source: DSA5 Regelwerk, S. 218 (Rosstäuscher only when selling livestock: chosen per check)
            add(name, entry.effect.page, entry.effect.de, entry.effect.en, kinds.map((kind) => ({ kind, keys, value: 0, automatic: entry.key !== 'Rosstäuscher', reroll })))
         }
         // Meister der Improvisation (S. 218) is applied by the talent Probe's tools choice on the client.
      }
   }
   const owned = new Set(state.combatSpecialAbilities ?? [])
   for (const name of owned) {
      const effect = combatAbilityEffect(name)
      if (!effect) continue
      const match = / (I|II|III)$/.exec(name)
      const key = match ? name.slice(0, -match[0].length) : name
      const level = match ? entryRomans.indexOf(match[1]) + 1 : 1
      if (key === 'Verbessertes Ausweichen') {
         if ([...owned].some((other) => {
            const otherLevel = / (I|II|III)$/.exec(other)
            return other.startsWith(`${key} `) && otherLevel && entryRomans.indexOf(otherLevel[1]) + 1 > level
         })) continue
         // source: DSA5 Regelwerk, S. 250 (only ordinary clothing, no armor)
         const armor = equippedArmor(state.equipment ?? [], state.wornArmor)
         if (!armor || armor === 'Normale Kleidung') add(name, effect.page, effect.de, effect.en,
            [combatRule('defense', ['AW'], level, { automatic: true })])
         continue
      }
      add(name, effect.page, effect.de, effect.en, combatRules[key] ?? [], level)
      // source: DSA5 Regelwerk, S. 247, 249 (disarm difficulty depends on target, sweep on attack number)
      if (key === 'Entwaffnen') for (const [value, de, en] of [[-4, 'Keine Zweihandwaffe.', 'Not a two-handed weapon.'], [-6, 'Zweihandwaffe.', 'Two-handed weapon.']] as const) {
         add(`${name} (${value})`, effect.page, `${de} ${effect.de}`, `${en} ${effect.en}`,
            [combatRule('attack', melee.filter((technique) => !['Dolche', 'Schilde'].includes(technique)), value, { group: 'special', damage: { replace: '1W3' } })])
      }
      if (key === 'Rundumschlag') for (let attack = 1; attack <= level + 1; attack++) {
         add(`${name} (${attack})`, effect.page, effect.de, effect.en,
            [combatRule('attack', [...heavy.filter((technique) => technique !== 'Kettenwaffen'), 'Schilde'], -2 - 4 * (attack - 1), { group: 'special' })])
      }
      if (key === 'Berittener Schütze') {
         add(`${name} (Galopp)`, effect.page, effect.de, effect.en,
            [combatRule('ranged', ['Armbrüste', 'Bögen', 'Wurfwaffen'], -4, { group: 'mounted' })])
         add(`${name} (Schritt)`, effect.page, effect.de, effect.en,
            [combatRule('ranged', ['Armbrüste', 'Bögen', 'Wurfwaffen'], 0, { group: 'mounted' })])
      }
   }
   return result
}
