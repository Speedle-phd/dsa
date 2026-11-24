import type { TalentAttribute } from '@/features/heroes/talentCatalog'
import { emptySheet, toReach, withLegacy, type NpcDraft, type NpcSheet, type NpcWeapon } from './npcSheet'

// Reads a pasted DSA5 stat block (the standard layout of the rulebook's bestiary and of published adventures, S. 354) into
// an NPC draft (user request, Nov 2026). Generic on purpose: values are found by their labels and weapons by their
// pattern ("Name: AT 12 PA 6 TP 1W6+4 RW mittel"), never by known names. German labels and the English edition's labels
// are accepted. Text that fits nowhere is returned as a warning, never dropped silently; unknown labelled sections are
// kept in the notes.

export type ParsedStatBlock = { name: string; draft: NpcDraft; warnings: string[] }

const attributeLabels: Array<[TalentAttribute, string]> = [
   ['courage', 'MU|COU'], ['wisdom', 'KL|SGC'], ['intuition', 'IN|INT'], ['charisma', 'CH|CHA'],
   ['fingerDexterity', 'FF|DEX'], ['dexterity', 'GE|AGI'], ['constitution', 'KO|CON'], ['strength', 'KK|STR'],
]
// Labelled sections, value runs until the next label; [field, alternatives]
type SectionField = 'abilities' | 'traits' | 'talents' | 'spells' | 'behaviour' | 'flight' | 'pain' | 'count' | 'size' | 'typus' | 'loot' | 'special' | 'ammo' | 'fate' | 'actions' | 'note'
const sections: Array<[SectionField, string]> = [
   ['abilities', 'Sonderfertigkeiten|Special Abilities|Combat Special Abilities'],
   ['traits', 'Vorteile\\s*\\/\\s*Nachteile|Vor-\\s*und\\s*Nachteile|Vorteile|Nachteile|Advantages\\s*\\/\\s*Disadvantages|Advantages|Disadvantages'],
   ['talents', 'Talente|Fertigkeiten|Skills'],
   ['spells', 'Zauber(?:sprüche)?|Zaubertricks|Liturgien|Zeremonien|Segnungen|Spells|Cantrips|Liturgical Chants|Blessings'],
   ['behaviour', 'Kampfverhalten|Combat Behaviou?r'],
   ['flight', 'Flucht|Flight|Escape'],
   ['pain', 'Schmerz\\s*\\+\\s*1\\s*bei|Pain\\s*\\+\\s*1\\s*at'],
   ['count', 'Anzahl|Number'],
   ['size', 'Größenkategorie|Size Category'],
   ['typus', 'Typus|Type'],
   ['loot', 'Beute|Loot|Booty'],
   ['special', 'Sonderregeln|Special Rules'],
   ['ammo', 'Munition|Ammunition'],
   ['fate', 'Schips?|Fate Points'],
   ['actions', 'Aktionen|Actions'],
   // Kept in the notes: knowledge facts, hunting, weight, invocation …
   ['note', 'Tierkunde[^:]{0,40}|Sphärenkunde[^:]{0,40}|Magiekunde[^:]{0,40}|Pflanzenkunde[^:]{0,40}|Jagd|Gewicht|Anrufungsschwierigkeit|Dienste|Animal Lore[^:]{0,40}|Hunting|Weight'],
]
const sectionPattern = new RegExp(`(?:^|\\s)(${sections.map(([, labels]) => labels).join('|')})\\s*:`, 'giu')
// Line breaks survive flattening as this marker: a weapon line always starts a line of the block
const lineMark = '\u2029'
// A weapon or natural attack at the start of a line: "Säbel: AT 12 PA 7 TP 1W6+3 RW mittel", "Kurzbogen: FK 11 TP 1W6+4 LZ 1 RW 10/50/80"
const weaponPattern = /(?:^|\u2029)\s*([\p{Lu}][^:\u2029]{0,40}?)\s*:\s*(AT|FK|RC)\s*(\d+)/gu
const dash = /[–—−-]/

function normalize(text: string) {
   return text
      .replace(/\r/g, '')
      .replace(/[\u00ad\u200b]/g, '')
      .replace(/\u00a0/g, ' ')
      // "Selbst-\nbeherrschung", "Kraf- takt" (PDF hyphenation) — but not "Vor- und Nachteile"
      .replace(/(\p{L})-\s*\n\s*(\p{Ll})/gu, '$1$2')
      .replace(/(\p{Ll})- (?!und\b|oder\b|bis\b|sowie\b)(\p{Ll})/gu, '$1$2')
}
// One line of text; `lineMark` keeps where the lines began (\s still matches it)
const flat = (text: string) => text.split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean).join(` ${lineMark} `)
const numberOrNull = (value: string | undefined) => {
   if (value === undefined || dash.test(value.trim()) && !/\d/.test(value)) return null
   const parsed = Number(value.replace(dash, '-'))
   return Number.isFinite(parsed) ? parsed : null
}
// Split a list at commas outside parentheses: "Finte I+II (Schwert, Waffenlos), Wuchtschlag I"
function splitList(value: string) {
   const parts: string[] = []
   let depth = 0
   let current = ''
   for (const char of value) {
      if (char === '(') depth++
      if (char === ')') depth = Math.max(0, depth - 1)
      if (char === ',' && depth === 0) {
         parts.push(current)
         current = ''
      } else current += char
   }
   parts.push(current)
   return parts.map((part) => part.trim().replace(/[.;]$/, '').trim()).filter(Boolean)
}
// Source references printed after rules ("Mächtiger Schlag AAL149") are not part of the name
const stripReferences = (value: string) => value.replace(/\s*\b[A-Z]{2,4}\d{1,3}\b/g, '').trim()
const dice = (value: string) => value.replace(/(\d+)\s*D\s*(\d+)/gi, '$1W$2').replace(/\s+/g, '')

export function parseStatBlock(input: string): ParsedStatBlock {
   const warnings: string[] = []
   const text = normalize(input)
   const lines = text.split('\n')
   // The stat block starts at its first attribute ("MU 13"); the line before it names the NPC
   const startIndex = lines.findIndex((line) => /\b(MU|COU)\s*\d+/.test(line))
   const heading = startIndex > 0 ? [...lines.slice(0, startIndex)].reverse().find((line) => line.trim() && !line.includes(':'))?.trim() ?? '' : ''
   // A name starts with a capital; a line like "etwa Heldenzahl +2" above the block is the count, not the name
   const rawName = /^\p{Lu}/u.test(heading) ? heading : ''
   const nameNote = rawName ? /\(([^)]*)\)\s*$/.exec(rawName)?.[1] ?? '' : heading
   const name = rawName.replace(/\s*\([^)]*\)\s*$/, '').trim().slice(0, 80)
   const body = flat(startIndex >= 0 ? lines.slice(startIndex).join('\n') : text)
   if (startIndex < 0) warnings.push('No attributes found (expected e.g. "MU 13 KL 11 …").')

   // Text ranges that something has read; whatever stays uncovered becomes a warning
   const covered: Array<[number, number]> = []
   const cover = (match: RegExpExecArray | null, offset = 0) => {
      if (match) covered.push([match.index + offset, match.index + offset + match[0].length])
      return match
   }

   // Labelled sections first: their text must not be read as stats
   const found: Array<{ field: SectionField; label: string; start: number; valueStart: number }> = []
   for (const match of body.matchAll(sectionPattern)) {
      const label = match[1]
      const field = sections.find(([, labels]) => new RegExp(`^(?:${labels})$`, 'iu').test(label))?.[0]
      if (field) found.push({ field, label, start: match.index + (match[0].length - match[0].trimStart().length), valueStart: match.index + match[0].length })
   }
   const sectionValues = new Map<SectionField, string[]>()
   const sectionRanges: Array<[number, number]> = []
   found.forEach((section, index) => {
      const end = found[index + 1]?.start ?? body.length
      // A section also ends where a weapon line or the armour line follows (e.g. "Munition: 20 Pfeile ⏎ RS/BE 1/0")
      const rest = body.slice(section.valueStart, end)
      const stops = [rest.search(/\u2029\s*[\p{Lu}][^:\u2029]{0,40}?\s*:\s*(AT|FK|RC)\s*\d/u), rest.search(/\s(?:RS\s*\/\s*BE|PRO\s*\/\s*ENC)\b/u)]
         .filter((position) => position >= 0)
      const valueEnd = section.valueStart + (stops.length ? Math.min(...stops) : rest.length)
      const text = body.slice(section.valueStart, valueEnd).trim()
      // Notes keep their label ("Jagd: −3"); every other field only its value
      sectionValues.set(section.field, [...(sectionValues.get(section.field) ?? []), section.field === 'note' ? `${section.label}: ${text}` : text])
      covered.push([section.start, valueEnd])
      sectionRanges.push([section.start, valueEnd])
   })
   // Stats and weapons are read from everything outside the sections (blanked, so positions stay the same)
   const stats = body.split('').map((char, position) => sectionRanges.some(([from, to]) => position >= from && position < to) ? ' ' : char).join('')
   const section = (field: SectionField) => (sectionValues.get(field) ?? []).join(' ').trim()

   // Attributes; KL "(t)" = tierische Klugheit (S. 355)
   const attributes = {} as Record<TalentAttribute, number>
   let wisdomAnimal = false
   for (const [key, labels] of attributeLabels) {
      const match = cover(new RegExp(`\\b(?:${labels})\\s*(\\d+)(\\s*\\(t\\))?`, 'u').exec(stats))
      if (match) {
         attributes[key] = Number(match[1])
         if (key === 'wisdom' && match[2]) wisdomAnimal = true
      }
   }
   const attributeCount = Object.keys(attributes).length
   if (attributeCount > 0 && attributeCount < 8) warnings.push('Not all eight attributes were found.')

   const value = (labels: string) => {
      const match = cover(new RegExp(`\\b(?:${labels})\\s*:?\\s*([–—−-]?\\s*\\d+|[–—−-])`, 'u').exec(stats))
      return match ? numberOrNull(match[1].replace(/\s/g, '')) : undefined
   }
   const health = value('LeP|LP')
   const mana = value('AsP|AE')
   const karma = value('KaP|KP')
   const ini = cover(/\bINI\s*(\d+)\s*\+\s*1\s*[WD]\s*6/u.exec(stats))
   const soulPower = value('SK|SPI')
   const toughness = value('ZK|TOU')
   const dodge = value('AW|DO')
   const defense = value('VW|DEF')
   const speed = cover(/\b(?:GS|MOV)\s*:?\s*(\d+)(?:\s*\/\s*\d+)?/u.exec(stats))
   const armor = cover(/\b(?:RS\s*\/\s*BE|PRO\s*\/\s*ENC)\s*:?\s*(\d+)\s*\/\s*(\d+)((?:\s*\([^)]*\))*)/u.exec(stats))
   const armorNotes = [...(armor?.[3] ?? '').matchAll(/\(([^)]*)\)/g)].map((match) => match[1].trim())
   const armorName = armorNotes.find((note) => !/eingerechnet|included|Modifikator/i.test(note)) ?? ''
   if (health === undefined || health === null) warnings.push('LeP not found: please enter them.')

   // Weapons and natural attacks (in the stats part)
   const weapons: NpcWeapon[] = []
   const weaponMatches = [...stats.matchAll(weaponPattern)]
   weaponMatches.forEach((match, index) => {
      const start = match.index + (match[0].length - match[0].trimStart().length)
      const end = weaponMatches[index + 1]?.index ?? stats.length
      const segment = stats.slice(start, end)
      // The weapon line ends before the next stat label (RS/BE, Aktionen …)
      const cut = segment.search(/\s(?:RS\s*\/\s*BE|PRO\s*\/\s*ENC|Aktionen|Actions|INI|LeP|SK|ZK|AW|VW|GS)\b/u)
      const line = cut > 0 ? segment.slice(0, cut) : segment
      covered.push([start, start + line.length])
      const ranged = match[2] !== 'AT'
      // PDF copies glue values: "PA 6TP 1W6+3" — a label may follow a digit directly
      const parry = /(?<![\p{L}])PA\s*(\d+|[–—−-])/u.exec(line)
      const damage = /(?<![\p{L}])(?:TP|DP)\s*(\d+\s*[WD]\s*\d+(?:\s*[+−–-]\s*\d+)?)/iu.exec(line)
      const reachWord = /(?<![\p{L}])(?:RW|RCH|Reach)\s*(kurz|mittel|lang|short|medium|long)\b/iu.exec(line)
      const range = /\b(?:RW|RNG|Range)?\s*(\d+\s*\/\s*\d+\s*\/\s*\d+)/u.exec(line)
      const reload = /\b(?:LZ|RT)\s*(\d+)/u.exec(line)
      weapons.push({
         name: stripReferences(match[1].trim()).slice(0, 60),
         kind: ranged ? 'ranged' : parry && /\d/.test(parry[1]) ? 'melee' : 'natural',
         attack: Number(match[3]),
         parry: parry && /\d/.test(parry[1]) ? Number(parry[1]) : null,
         damage: damage ? dice(damage[1]).replace(/[−–]/g, '-') : '',
         reach: ranged ? null : toReach(reachWord?.[1]),
         range: ranged && range ? range[1].replace(/\s/g, '') : null,
         reload: ranged && reload ? Number(reload[1]) : null,
         ammo: null, perRound: null,
      })
   })
   if (weapons.length === 0) warnings.push('No weapons or attacks found (expected e.g. "Säbel: AT 12 PA 7 TP 1W6+3 RW mittel").')

   // Actions and per-attack limits: "Aktionen: 2 (max. 1 × Biss)"
   const actionsText = section('actions')
   const actions = Number(/\d+/.exec(actionsText)?.[0] ?? 1) || 1
   for (const limit of actionsText.matchAll(/max\.?\s*(\d+)\s*[x×]\s*([\p{L}]+)/giu)) {
      const weapon = weapons.find((entry) => entry.name.toLowerCase().startsWith(limit[2].toLowerCase()))
      if (weapon) weapon.perRound = Number(limit[1])
   }
   const ammo = section('ammo')
   const firstRanged = weapons.find((weapon) => weapon.kind === 'ranged')
   if (ammo && firstRanged) firstRanged.ammo = ammo.slice(0, 80)

   // Talents "Kraftakt 6, Gaukeleien (Verstecktricks) 14"
   const talents = splitList(section('talents')).flatMap((entry) => {
      const match = /^(.+?)\s+([–—−-]?\d+)$/u.exec(entry)
      return match ? [{ name: match[1].trim().slice(0, 60), value: Number(match[2].replace(dash, '-')) }] : []
   })
   const maxHealth = health ?? 30
   // "Verlust von 50 % der LeP" → flees at or below the LeP left; other conditions stay text
   const flight = section('flight')
   const percent = /(\d+)\s*%/.exec(flight)
   const fleeAt = percent && /(LeP|Lebens|LP|life)/i.test(flight) ? Math.max(0, Math.floor(maxHealth * (1 - Number(percent[1]) / 100))) : null
   // "23 LeP, 16 LeP, 8 LeP, 5 LeP oder weniger": the list ends there (a page number may follow a pasted block)
   const pain = section('pain').split(/oder weniger|or less/i)[0]
   const painThresholds = pain ? [...pain.matchAll(/\d+/g)].map((match) => Number(match[0])).slice(0, 8) : null
   const fate = section('fate')
   const notes = [
      ...(fate ? [`Schips: ${fate}`] : []),
      ...(sectionValues.get('note') ?? []),
   ].join('\n').slice(0, 2000)

   // Warnings: text inside the stat block that nothing has read
   const leftover = body.split('').map((_, index) => covered.some(([from, to]) => index >= from && index < to) ? '\n' : body[index]).join('')
      .split('\n').map((part) => part.replaceAll(lineMark, ' ').replace(/\s+/g, ' ').trim()).filter((part) => /\p{L}{3,}|\d/u.test(part) && part.length > 2)
   warnings.push(...leftover.map((part) => part.slice(0, 160)))

   const sheet: NpcSheet = {
      ...emptySheet(),
      attributes: attributeCount === 8 ? attributes : null,
      wisdomAnimal,
      mana: mana ?? null, karma: karma ?? null, soulPower: soulPower ?? null, toughness: toughness ?? null,
      burden: armor ? Math.min(4, Number(armor[2])) : 0,
      armorName: armorName.slice(0, 80),
      weapons: weapons.slice(0, 12),
      actions: Math.min(6, actions),
      abilities: splitList(section('abilities')).map(stripReferences).filter(Boolean).slice(0, 60),
      traits: section('traits').slice(0, 2000),
      talents: talents.slice(0, 80),
      spells: section('spells').slice(0, 2000),
      behaviour: section('behaviour').slice(0, 2000),
      flight: flight.slice(0, 500),
      fleeAt,
      painThresholds,
      size: section('size').slice(0, 40),
      typus: section('typus').slice(0, 80),
      loot: section('loot').slice(0, 500),
      special: section('special').slice(0, 2000),
      count: (section('count') || (/anzahl|heldenzahl|number/i.test(nameNote) ? nameNote : '')).slice(0, 80),
   }
   const draft = withLegacy({
      maxHealth, armor: armor ? Number(armor[1]) : 0, initiativeBase: ini ? Number(ini[1]) : 10,
      attack: null, parry: null, damage: '', defense: defense ?? null, dodge: dodge ?? null,
      speed: speed ? Number(speed[1]) : null, notes, sheet,
   })
   return { name, draft, warnings }
}
