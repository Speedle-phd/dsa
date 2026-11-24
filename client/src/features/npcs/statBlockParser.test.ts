import { describe, expect, it } from 'vitest'
import { parseStatBlock } from './statBlockParser'

// Synthetic stat blocks written for these tests in the standard DSA5 layout (S. 354); no published content.
const soldier = `Some story text before the block.
Grenzwache vom Pass
MU 14 KL 10 IN 12 CH 11
FF 12 GE 13 KO 14 KK 15
LeP 33 AsP –  KaP –  INI 12+1W6
SK 1 ZK 2 AW 6 GS 7
Waffenlos: AT 12 PA 6 TP 1W6
RW kurz
Hellebarde: AT 13 PA 6 TP 1W6+6 RW lang
RS/BE 4/2 (Kettenhemd) (Modifikatoren durch Rüstungen wurden bereits eingerechnet)
Sonderfertigkeiten: Finte I, Wuchtschlag I+II (Hellebarde)
Vorteile/Nachteile: Zäher Hund / Schlechte Eigenschaft (Neugier)
Talente: Körperbeherrschung 5, Selbst-
beherrschung 6, Sinnesschärfe 7
Kampfverhalten: Hält die Stellung und greift mit Wuchtschlägen an.
Flucht: Verlust von 50 % der LeP
Schmerz +1 bei: 25 LeP, 17 LeP, 8 LeP, 5 LeP oder weniger
12`

const archer = `Waldläuferin
MU 12 KL 12 IN 15 CH 11
FF 15 GE 14 KO 12 KK 11
LeP 28 AsP 30 KaP – INI 13+1W6
SK 2 ZK 1 AW 7 GS 8
Jagdmesser: AT 12 PA 6 TP 1W6+1 RW kurz
Langbogen: FK 15 LZ 1 TP 1W6+6 RW 20/100/160
Munition: 20 Pfeile
RS/BE 1/0
Sonderfertigkeiten: Präziser Schuss/Wurf I
Zauber: Zaubertrick Funkenflug; Spurlos 8, Visibili 6
Flucht: flieht nicht`

const creature = `Moorhauer
MU 13 KL 10 (t) IN 13 CH 9
FF 9 GE 13 KO 16 KK 18
LeP 48 AsP – KaP – INI 12+1W6
VW 6 SK –2 ZK 3 GS 10
Hauer: AT 13 TP 2W6+3 RW kurz
Tritt: AT 10 TP 1W6+4 RW kurz
RS/BE 2/0
Aktionen: 2 (max. 1 × Hauer)
Größenkategorie: groß
Typus: Tier, nicht humanoid
Anzahl: 1W3
Beute: 120 Rationen Fleisch
Jagd: –2
Schmerz +1 bei: 36 LeP, 24 LeP, 12 LeP, 5 LeP oder weniger`

describe('stat block parser', () => {
   it('reads a humanoid block: attributes, energies, defenses, weapons, armour', () => {
      const { name, draft, warnings } = parseStatBlock(soldier)
      expect(name).toBe('Grenzwache vom Pass')
      expect(draft.sheet?.attributes).toEqual({ courage: 14, wisdom: 10, intuition: 12, charisma: 11, fingerDexterity: 12, dexterity: 13, constitution: 14, strength: 15 })
      expect(draft).toMatchObject({ maxHealth: 33, initiativeBase: 12, dodge: 6, defense: null, speed: 7, armor: 4 })
      expect(draft.sheet).toMatchObject({ mana: null, karma: null, soulPower: 1, toughness: 2, burden: 2, armorName: 'Kettenhemd' })
      expect(draft.sheet?.weapons).toEqual([
         { name: 'Waffenlos', kind: 'melee', attack: 12, parry: 6, damage: '1W6', reach: 'short', range: null, reload: null, ammo: null, perRound: null },
         { name: 'Hellebarde', kind: 'melee', attack: 13, parry: 6, damage: '1W6+6', reach: 'long', range: null, reload: null, ammo: null, perRound: null },
      ])
      // The flat values of the older screens: the first melee weapon
      expect(draft).toMatchObject({ attack: 12, parry: 6, damage: '1W6' })
      expect(warnings).toEqual([])
   })

   it('reads lists and texts, joins PDF word breaks and stops the Schmerz list at "oder weniger"', () => {
      const { draft } = parseStatBlock(soldier)
      expect(draft.sheet?.abilities).toEqual(['Finte I', 'Wuchtschlag I+II (Hellebarde)'])
      expect(draft.sheet?.talents).toEqual([{ name: 'Körperbeherrschung', value: 5 }, { name: 'Selbstbeherrschung', value: 6 }, { name: 'Sinnesschärfe', value: 7 }])
      expect(draft.sheet?.traits).toBe('Zäher Hund / Schlechte Eigenschaft (Neugier)')
      expect(draft.sheet?.behaviour).toBe('Hält die Stellung und greift mit Wuchtschlägen an.')
      expect(draft.sheet?.painThresholds).toEqual([25, 17, 8, 5])
      // 50 % of 33 LeP lost = 16.5: flees at 16 LeP or less
      expect(draft.sheet?.fleeAt).toBe(16)
   })

   it('reads ranged weapons with range bands, reload time and ammunition, and spells', () => {
      const { draft, warnings } = parseStatBlock(archer)
      expect(draft.sheet?.weapons[1]).toEqual({ name: 'Langbogen', kind: 'ranged', attack: 15, parry: null, damage: '1W6+6', reach: null, range: '20/100/160', reload: 1, ammo: '20 Pfeile', perRound: null })
      expect(draft.sheet).toMatchObject({ mana: 30, spells: 'Zaubertrick Funkenflug; Spurlos 8, Visibili 6', flight: 'flieht nicht', fleeAt: null, painThresholds: null })
      // The armour line after a section is still read
      expect(draft.armor).toBe(1)
      expect(warnings).toEqual([])
   })

   it('reads a creature: VW, natural attacks, negative SK, actions with a per-attack limit, creature fields', () => {
      const { draft, warnings } = parseStatBlock(creature)
      expect(draft).toMatchObject({ maxHealth: 48, defense: 6, dodge: null, speed: 10, armor: 2 })
      expect(draft.sheet).toMatchObject({ wisdomAnimal: true, soulPower: -2, toughness: 3, actions: 2, size: 'groß', typus: 'Tier, nicht humanoid', count: '1W3', loot: '120 Rationen Fleisch' })
      expect(draft.sheet?.weapons.map((weapon) => [weapon.name, weapon.kind, weapon.parry, weapon.perRound])).toEqual([['Hauer', 'natural', null, 1], ['Tritt', 'natural', null, null]])
      expect(draft.notes).toContain('Jagd: –2')
      expect(warnings).toEqual([])
   })

   it('reads the English edition\'s labels', () => {
      const { draft } = parseStatBlock(`Bandit
COU 13 SGC 11 INT 13 CHA 11 DEX 12 AGI 13 CON 13 STR 14
LP 31 AE – KP – INI 12+1D6
SPI 1 TOU 2 DO 6 MOV 7
Club: AT 12 PA 5 DP 1D6+2 RCH medium
PRO/ENC 1/0
Special Abilities: Forceful Blow I
Pain +1 at: 23 LP, 16 LP, 8 LP, 5 LP or less`)
      expect(draft).toMatchObject({ maxHealth: 31, initiativeBase: 12, dodge: 6, speed: 7, armor: 1 })
      expect(draft.sheet?.weapons[0]).toMatchObject({ name: 'Club', attack: 12, parry: 5, damage: '1W6+2', reach: 'medium' })
      expect(draft.sheet).toMatchObject({ abilities: ['Forceful Blow I'], painThresholds: [23, 16, 8, 5] })
   })

   it('reports what it could not read instead of dropping it', () => {
      const { warnings, draft } = parseStatBlock(`Wirt
MU 11 KL 12 IN 13 CH 13 FF 12 GE 11 KO 13 KK 13
INI 11+1W6 AW 5 GS 8
Ein seltsamer Satz ohne Bezeichnung
Knüppel: AT 9 PA 4 TP 1W6+2 RW mittel`)
      expect(warnings).toContain('LeP not found: please enter them.')
      expect(warnings.some((warning) => warning.includes('Ein seltsamer Satz ohne Bezeichnung'))).toBe(true)
      expect(draft.sheet?.weapons).toHaveLength(1)
   })

   it('reads glued values and takes a lowercase line above the block as the count', () => {
      const { name, draft } = parseStatBlock(`etwa Heldenzahl +1
MU 12 KL 10 IN 12 CH 10 FF 11 GE 12 KO 13 KK 13
LeP 31 AsP – KaP – INI 12+1W6
SK 1 ZK 2 AW 6 GS 8
Axt: AT 12 PA 6TP 1W6+3 RW mittel
RS/BE 0/0`)
      expect(name).toBe('')
      expect(draft.sheet?.count).toBe('etwa Heldenzahl +1')
      expect(draft.sheet?.weapons[0]).toMatchObject({ parry: 6, damage: '1W6+3', reach: 'medium' })
   })

   it('warns when the text is no stat block', () => {
      const { warnings } = parseStatBlock('Just a note about the inn.')
      expect(warnings[0]).toMatch(/No attributes found/)
   })
})
