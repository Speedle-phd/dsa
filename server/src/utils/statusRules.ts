import type { RollEffect } from './entryRollEffects'

// A Status is on or off and has no levels (S. 34).
// source: DSA5 Regelwerk, S. 34–36
export const statusNames = [
   'Bewegungsunfähig', 'Bewusstlos', 'Blind', 'Blutrausch', 'Brennend', 'Eingeengt', 'Fixiert', 'Handlungsunfähig',
   'Krank', 'Liegend', 'Stumm', 'Taub', 'Überrascht', 'Unsichtbar', 'Vergiftet',
] as const
export type StatusName = typeof statusNames[number]

// source: DSA5 Regelwerk, S. 34–36 (page of each status description)
export const statusPages: Record<StatusName, number> = {
   Bewegungsunfähig: 34, Bewusstlos: 34, Blind: 34, Blutrausch: 35, Brennend: 35, Eingeengt: 35, Fixiert: 36,
   Handlungsunfähig: 36, Krank: 36, Liegend: 36, Stumm: 36, Taub: 36, Überrascht: 36, Unsichtbar: 36, Vergiftet: 36,
}

// source: DSA5 Regelwerk, S. 35, 188–193 (Blutrausch still allows Körpertalente and Einschüchtern)
export const bloodRageTalents = ['fliegen', 'gaukelei', 'klettern', 'koerperbeherrschung', 'kraftakt', 'reiten', 'schwimmen',
   'selbstbeherrschung', 'singen', 'sinnesschaerfe', 'tanzen', 'taschendiebstahl', 'verbergen', 'zechen', 'einschuechtern']

const kinds = ['attribute', 'attack', 'ranged', 'defense', 'talent'] as const

// Bewusstlos includes Handlungsunfähig (S. 34); stored together so both show on the sheet.
export function normalizeStatuses(statuses: readonly string[]): StatusName[] {
   const known = statusNames.filter((name) => statuses.includes(name))
   return known.includes('Bewusstlos') && !known.includes('Handlungsunfähig') ? [...known, 'Handlungsunfähig'] : known
}

// source: DSA5 Regelwerk, S. 35 (after the Blutrausch the hero suffers two levels of Betäubung)
export function endBloodRage(previous: readonly string[], next: readonly string[], conditions: Record<string, number>) {
   if (!previous.includes('Blutrausch') || next.includes('Blutrausch')) return conditions
   return { ...conditions, Betäubung: Math.min(4, (conditions.Betäubung ?? 0) + 2) }
}

export function statusRollEffects(statuses: readonly string[]): RollEffect[] {
   const result: RollEffect[] = []
   const add = (status: StatusName, index: number, effect: Pick<RollEffect, 'kind'> & Partial<RollEffect>, de: string, en: string) =>
      result.push({ id: `Status ${status}:${index}`, label: status, page: statusPages[status], value: 0, skillPoints: 0,
         automatic: true, de, en, ...effect })
   const has = (status: StatusName) => statuses.includes(status)
   if (has('Handlungsunfähig')) kinds.forEach((kind, index) => add('Handlungsunfähig', index, { kind, blocked: true },
      'Keine Aktionen oder Verteidigungen.', 'No actions or defenses.'))
   if (has('Bewegungsunfähig')) {
      for (const [index, kind] of (['attack', 'ranged', 'defense'] as const).entries()) add('Bewegungsunfähig', index, { kind, blocked: true },
         'Keine Handlungen mit körperlicher Bewegung.', 'No actions that need body movement.')
      for (const [index, kind] of (['attribute', 'talent'] as const).entries()) add('Bewegungsunfähig', index + 3, { kind, blocked: true, automatic: false },
         'Auswählen, wenn die Probe körperliche Bewegung erfordert.', 'Select if this check needs body movement.')
   }
   if (has('Liegend')) {
      add('Liegend', 0, { kind: 'attack', value: -4 }, 'Angriffe −4.', 'Attacks −4.')
      add('Liegend', 1, { kind: 'ranged', value: -4 }, 'Angriffe −4.', 'Attacks −4.')
      add('Liegend', 2, { kind: 'defense', value: -2 }, 'Verteidigung −2.', 'Defense −2.')
   }
   if (has('Fixiert')) add('Fixiert', 0, { kind: 'defense', keys: ['AW'], value: -4 }, 'Ausweichen −4.', 'Dodge −4.')
   if (has('Blutrausch')) {
      add('Blutrausch', 0, { kind: 'attack', value: 4 }, 'Nahkampfattacken +4, +2 TP.', 'Melee attacks +4, +2 damage.')
      add('Blutrausch', 1, { kind: 'ranged', blocked: true }, 'Keine Fernkampfangriffe.', 'No ranged attacks.')
      add('Blutrausch', 2, { kind: 'defense', blocked: true }, 'Keine Verteidigung.', 'No defense.')
      add('Blutrausch', 3, { kind: 'talent', exceptKeys: bloodRageTalents, blocked: true },
         'Nur Körpertalente und Einschüchtern.', 'Only physical skills and Intimidation.')
      add('Blutrausch', 4, { kind: 'talent', keys: ['kraftakt'], value: 2 }, 'Kraftakt +2.', 'Feat of Strength +2.')
   }
   if (has('Blind')) {
      add('Blind', 0, { kind: 'attack', targetRule: 'halve' }, 'Nahkampfattacke halbiert, nachdem die Position des Gegners bemerkt wurde.',
         'Melee attack halved, once the opponent’s position is known.')
      add('Blind', 1, { kind: 'ranged', targetRule: 'one' }, 'Fernkampf nur mit einer gewürfelten 1.', 'Ranged attacks hit only on a rolled 1.')
      add('Blind', 2, { kind: 'defense', targetRule: 'one' }, 'Verteidigung gegen Nahkampf nur mit einer gewürfelten 1; gegen Fernkampf unmöglich.',
         'Defense against melee only on a rolled 1; impossible against ranged attacks.')
   }
   if (has('Taub')) {
      add('Taub', 0, { kind: 'talent', keys: ['sinnesschaerfe'], value: -3, automatic: false },
         'Nur für Sinnesschärfe (Hinterhalte entdecken): −3. Proben nur auf den Hörsinn sind unmöglich.',
         'Only for Perception (spot ambushes): −3. Checks relying on hearing alone are impossible.')
   }
   return result
}

// source: DSA5 Regelwerk, S. 34–36 (GS: Liegend 1; Fixiert, Bewegungsunfähig, Handlungsunfähig 0)
export function statusSpeed(statuses: readonly string[]): { override: number | null; label: string | null } {
   const zero = (['Handlungsunfähig', 'Bewegungsunfähig', 'Fixiert'] as const).find((status) => statuses.includes(status))
   if (zero) return { override: 0, label: zero }
   return statuses.includes('Liegend') ? { override: 1, label: 'Liegend' } : { override: null, label: null }
}
