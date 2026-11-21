type Text = { de: string; en: string }
export type ConditionInfo = { page: string; levels?: [Text, Text, Text, Text]; decay?: Text; note?: Text }

const sheetOnly: ConditionInfo = {
   page: '411',
   note: {
      de: 'Nur auf dem Heldenbogen aufgeführt; im Grundregelwerk nicht definiert. Wirkung laut auslösender Quelle oder Meister.',
      en: 'Listed on the character sheet only; not defined in the core rules. Apply the effect given by its source or the GM.',
   },
}

// source: DSA5 Regelwerk, S. 32–34 (Zustände, per level); S. 32 (penalties add up, max. 5; 8+ levels → handlungsunfähig)
export const conditionInfo: Record<string, ConditionInfo> = {
   Belastung: {
      page: '32',
      levels: [
         { de: 'leicht belastet: Talente mit BE, AT, Verteidigung, INI, GS −1', en: 'lightly encumbered: BE talents, AT, defense, INI, GS −1' },
         { de: 'belastet: Talente mit BE, AT, Verteidigung, INI, GS −2', en: 'encumbered: BE talents, AT, defense, INI, GS −2' },
         { de: 'schwer belastet: Talente mit BE, AT, Verteidigung, INI, GS −3', en: 'heavily encumbered: BE talents, AT, defense, INI, GS −3' },
         { de: 'handlungsunfähig, bis auf Last fallen lassen', en: 'incapacitated, except for dropping the load' },
      ],
      decay: { de: 'Endet, sobald die Last abgelegt wird.', en: 'Ends when the load is put down.' },
   },
   Betäubung: {
      page: '32',
      levels: [
         { de: 'leicht angeschlagen: alle Proben −1', en: 'slightly dazed: all checks −1' },
         { de: 'angeschlagen: alle Proben −2', en: 'dazed: all checks −2' },
         { de: 'schwer angeschlagen: alle Proben −3', en: 'badly dazed: all checks −3' },
         { de: 'handlungsunfähig', en: 'incapacitated' },
      ],
      decay: { de: 'Je Stufe nach 3 Stunden Ruhe.', en: 'One level per 3 hours of rest.' },
   },
   Entrückung: {
      page: '33',
      levels: [
         { de: 'leicht entrückt: nicht gottgefällige Talente/Zauber −1', en: 'slightly enraptured: talents/spells not pleasing to the god −1' },
         { de: 'entrückt: gottgefällige +1, alle anderen −2', en: 'enraptured: pleasing ones +1, all others −2' },
         { de: 'göttlich berührt: gottgefällige +2, alle anderen −3', en: 'divinely touched: pleasing ones +2, all others −3' },
         { de: 'Werkzeug des Gottes: gottgefällige +3, alle anderen −4', en: 'tool of the god: pleasing ones +3, all others −4' },
      ],
      decay: { de: '1 Stufe pro Stunde.', en: 'One level per hour.' },
   },
   Furcht: {
      page: '33',
      levels: [
         { de: 'beunruhigt: alle Proben −1', en: 'uneasy: all checks −1' },
         { de: 'verängstigt: alle Proben −2', en: 'frightened: all checks −2' },
         { de: 'in Panik: alle Proben −3', en: 'panicked: all checks −3' },
         { de: 'katatonisch, handlungsunfähig', en: 'catatonic, incapacitated' },
      ],
      decay: { de: 'Ist der Auslöser fort: 1 Stufe alle 5 Minuten.', en: 'Once the trigger is gone: one level every 5 minutes.' },
   },
   Paralyse: {
      page: '33',
      levels: [
         { de: 'leicht versteift: Proben mit Bewegung/Sprache −1, GS 75 %', en: 'slightly stiff: checks needing movement/speech −1, GS 75 %' },
         { de: 'versteift: Proben mit Bewegung/Sprache −2, GS 50 %', en: 'stiff: checks needing movement/speech −2, GS 50 %' },
         { de: 'kaum bewegungsfähig: Proben mit Bewegung/Sprache −3, GS 25 %', en: 'barely mobile: checks needing movement/speech −3, GS 25 %' },
         { de: 'bewegungsunfähig', en: 'immobile' },
      ],
      decay: { de: '1 Stufe pro halbe Stunde.', en: 'One level per half hour.' },
   },
   Schmerz: {
      page: '34',
      levels: [
         { de: 'leichte Schmerzen: alle Proben −1, GS −1', en: 'mild pain: all checks −1, GS −1' },
         { de: 'ablenkende Schmerzen: alle Proben −2, GS −2', en: 'distracting pain: all checks −2, GS −2' },
         { de: 'starke Schmerzen: alle Proben −3, GS −3', en: 'severe pain: all checks −3, GS −3' },
         { de: 'handlungsunfähig, sonst alle Proben −4 (Selbstbeherrschung)', en: 'incapacitated, otherwise all checks −4 (Selbstbeherrschung)' },
      ],
      decay: {
         de: 'Je 1 Stufe bei LeP ≤ ¾, ½, ¼ und ≤ 5; sonst 1 Stufe alle 4 Stunden.',
         en: 'One level each at LeP ≤ ¾, ½, ¼ and ≤ 5; otherwise one level every 4 hours.',
      },
   },
   Verwirrung: {
      page: '34',
      levels: [
         { de: 'leicht verwirrt: alle Proben −1', en: 'slightly confused: all checks −1' },
         { de: 'verwirrt: alle Proben −2', en: 'confused: all checks −2' },
         { de: 'sehr verwirrt: alle Proben −3; kein Zaubern, keine Liturgien, keine Wissenstalente', en: 'very confused: all checks −3; no spells, liturgies or knowledge talents' },
         { de: 'handlungsunfähig', en: 'incapacitated' },
      ],
      decay: { de: '1 Stufe pro Stunde.', en: 'One level per hour.' },
   },
   Berauscht: sheetOnly,
   Trance: sheetOnly,
   Überanstrengung: sheetOnly,
}

const romans = ['I', 'II', 'III', 'IV']

export function conditionTooltip(key: string, level: number, language: 'de' | 'en') {
   const info = conditionInfo[key]
   if (!info) return null
   const lines = info.levels?.map((text, index) => `${index + 1 === level ? '▶' : '·'} ${romans[index]}: ${text[language]}`) ?? []
   return [
      ...lines,
      ...(info.decay ? [info.decay[language]] : []),
      ...(info.note ? [info.note[language]] : []),
      ...(info.levels ? [language === 'de' ? 'Zustände addieren sich, max. −5 gesamt (S. 32).' : 'Penalties add up, max. −5 in total (p. 32).'] : []),
      `${language === 'de' ? 'DSA5 Regelwerk, S.' : 'DSA5 rulebook, p.'} ${info.page}`,
   ].join('\n')
}

// source: DSA5 Regelwerk, S. 34–36 (Status: on or off, no levels); S. 222 (Wachsamkeit)
export const statusInfo: Record<string, { page: string; text: Text; auto: boolean }> = {
   Bewegungsunfähig: { page: '34', auto: true, text: {
      de: 'Kann sich nicht bewegen; Wahrnehmen und Handlungen ohne Bewegung bleiben möglich (z. B. Wissenstalente). GS 0.',
      en: 'Cannot move; perceiving and actions without movement remain possible (e.g. knowledge skills). GS 0.' } },
   Bewusstlos: { page: '34', auto: true, text: {
      de: 'Schläft oder ist ohnmächtig; zusätzlich Handlungsunfähig.', en: 'Asleep or knocked out; also Handlungsunfähig.' } },
   Blind: { page: '34–35', auto: true, text: {
      de: 'Erst Vergleichsprobe Sinnesschärfe (Suchen) gegen Verbergen (Schleichen). Dann: Nahkampfattacke halbiert, Fernkampf und Verteidigung gegen Nahkampf nur mit einer 1, gegen Fernkampf keine Verteidigung. Talente nach Meisterentscheid. Zauber auf andere nur bei Berührung.',
      en: 'First an opposed Perception (search) vs. Stealth (sneak) check. Then: melee attack halved, ranged attacks and defense against melee only on a 1, no defense against ranged. Skills as the GM rules. Spells on others only by touch.' } },
   Blutrausch: { page: '35', auto: true, text: {
      de: 'Nahkampfattacken +4, +2 TP, ignoriert Schmerz. Keine Verteidigung, kein Fernkampf, nur Körpertalente und Einschüchtern; Kraftakt +2; als Kampf-SF nur Wuchtschlag. Dauer 2W20 KR (Meister, geheim). Danach 2 Stufen Betäubung (beim Entfernen automatisch).',
      en: 'Melee attacks +4, +2 TP, ignores Schmerz. No defense, no ranged attacks, only physical skills and Intimidation; Feat of Strength +2; only Wuchtschlag as combat ability. Lasts 2W20 KR (GM, secret). Afterwards 2 levels of Betäubung (added automatically when removed).' } },
   Brennend: { page: '35', auto: false, text: {
      de: 'Feuerschaden, solange der Status anhält. Löschen: Körperbeherrschung, kleine Fläche ±0, große −1, ganz in Flammen −2; 1 Probe pro KR (freie Aktion), auch durch Helfer. Säure: nur mit Wasser o. Ä.',
      en: 'Fire damage while it lasts. Put out: Body Control, small area ±0, large −1, fully ablaze −2; 1 check per KR (free action), helpers may roll instead. Acid: only with water or similar.' } },
   Eingeengt: { page: '35–36', auto: true, text: {
      de: 'AT/PA: kurze Waffen ±0, mittlere −4/−4, lange −8/−8; kleine Schilde −2/−2, mittlere −4/−3, große −6/−4 (im Kampfpanel automatisch). Talente bis −2 nach Meisterentscheid. Zauber und Liturgien nicht betroffen.',
      en: 'AT/PA: short weapons ±0, medium −4/−4, long −8/−8; small shields −2/−2, medium −4/−3, large −6/−4 (applied in the fight panel). Skills up to −2 as the GM rules. Spells and liturgies unaffected.' } },
   Fixiert: { page: '36', auto: true, text: { de: 'GS 0, Ausweichen −4.', en: 'GS 0, dodge −4.' } },
   Handlungsunfähig: { page: '36', auto: true, text: {
      de: 'GS 0, keine Aktionen oder Verteidigungen; meist liegend. Sprechen als freie Aktion nach Meisterentscheid.',
      en: 'GS 0, no actions or defenses; usually lying down. Speaking as a free action if the GM allows.' } },
   Krank: { page: '36', auto: true, text: {
      de: 'Keine LeP-Regeneration (beim Rasten automatisch). Ohne tägliche Regenerationsphase 1W3 LeP Verlust (nicht automatisch).',
      en: 'No LeP regeneration (applied when resting). Without a daily rest phase, lose 1W3 LeP (not automatic).' } },
   Liegend: { page: '36', auto: true, text: { de: 'GS 1, Verteidigung −2, Angriffe −4. Aufstehen: 1 Aktion.', en: 'GS 1, defense −2, attacks −4. Standing up: 1 action.' } },
   Stumm: { page: '36', auto: false, text: { de: 'Kann nicht sprechen; Probleme beim Zaubern möglich (je Zauber).', en: 'Cannot speak; spellcasting may suffer (per spell).' } },
   Taub: { page: '36', auto: true, text: {
      de: 'Keine Sinnesschärfe-Proben nur auf das Gehör. Sinnesschärfe (Hinterhalte entdecken) −3 (in der Probe auswählbar).',
      en: 'No Perception checks relying on hearing alone. Perception (spot ambushes) −3 (selectable in the check).' } },
   Überrascht: { page: '36', auto: true, text: {
      de: 'Gegen dich ist eine Aktion ohne Verteidigung erlaubt, erst danach beginnt die reguläre KR (endet mit „Nächste Runde“). SF Wachsamkeit: 1 Schip hebt den Status sofort auf (S. 222).',
      en: 'One action against you may not be defended; the regular KR starts afterwards (ends with "Next round"). SF Wachsamkeit: 1 Schip removes the status immediately (p. 222).' } },
   Unsichtbar: { page: '36', auto: false, text: {
      de: 'Betrifft deine Gegner: sie brauchen eine Vergleichsprobe, dann AT halbiert, Fernkampf und Verteidigung nur mit einer 1. Zauber auf dich nur bei Berührung.',
      en: 'Affects your enemies: they need an opposed check, then AT halved, ranged attacks and defense only on a 1. Spells on you only by touch.' } },
   Vergiftet: { page: '36', auto: true, text: {
      de: 'Keine LeP-Regeneration, solange das Gift wirkt (beim Rasten automatisch).', en: 'No LeP regeneration while the poison works (applied when resting).' } },
}

export function statusTooltip(key: string, language: 'de' | 'en') {
   const info = statusInfo[key]
   if (!info) return null
   return [
      info.text[language],
      info.auto ? (language === 'de' ? 'Zahlen werden automatisch angewandt.' : 'Numbers are applied automatically.')
         : (language === 'de' ? 'Nur Hinweis, keine automatische Wirkung.' : 'Reminder only, no automatic effect.'),
      `${language === 'de' ? 'DSA5 Regelwerk, S.' : 'DSA5 rulebook, p.'} ${info.page}`,
   ].join('\n')
}
