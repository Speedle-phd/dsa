// Client mirror of server/src/utils/alchemy.ts (S. 270–272) plus the failure table for the brewing dialog.
export const laboratories = ['Archaisches Labor', 'Hexenküche', 'Alchemistenlabor'] as const
export type Laboratory = typeof laboratories[number]
// The store text spells the elixirs' lab "Alchimistenlabor" (S. 274); the lab item is sold as "Alchemistenlabor".
export const normalizeLaboratory = (name: string) => name.replace('Alchimistenlabor', 'Alchemistenlabor') as Laboratory

export function bestLaboratory(items: readonly string[]): Laboratory | null {
   return [...laboratories].reverse().find((lab) => items.includes(lab)) ?? null
}

// source: DSA5 Regelwerk, S. 271 (one level too low −3, two too low impossible, higher +1 / +2)
export function laboratoryModifier(owned: Laboratory | null, needed: Laboratory) {
   if (!owned) return null
   const difference = laboratories.indexOf(owned) - laboratories.indexOf(needed)
   return difference <= -2 ? null : difference === -1 ? -3 : difference
}

// source: DSA5 Regelwerk, S. 272 (analysis: half the Brauschwierigkeit, rounded toward the harder side; lab −2 / ±0 / +1; recipe known +1)
export function analysisModifiers(difficulty: number, laboratory: Laboratory | null, recipeKnown: boolean) {
   return [
      { label: 'Half the Brauschwierigkeit', value: Math.floor(difficulty / 2) },
      { label: 'Laboratory', value: laboratory === 'Alchemistenlabor' ? 1 : laboratory === 'Hexenküche' ? 0 : -2 },
      ...(recipeKnown ? [{ label: 'Recipe known', value: 1 }] : []),
   ].filter((source) => source.value !== 0)
}

// source: DSA5 Regelwerk, S. 271–272 (Konsequenzen misslungener Brauproben: 1W20, +5 on a Patzer)
export const brewFailures: Array<{ from: number; to: number; de: string; en: string }> = [
   { from: 1, to: 8, de: 'Nichts weiter geschieht.', en: 'Nothing else happens.' },
   { from: 9, to: 10, de: 'Das Braugut verklumpt; die Reinigung dauert 1W6 Stunden.', en: 'The brew clots; cleaning takes 1W6 hours.' },
   { from: 11, to: 12, de: 'Verpuffung: klebrige Tropfen überall, Reinigung 1W6 Tage (nur mit Essig).', en: 'Deflagration: sticky drops everywhere, cleaning 1W6 days (vinegar only).' },
   { from: 13, to: 14, de: 'Verpuffung: Geräte im Wert eines Zehntels des Labors zerstört.', en: 'Deflagration: equipment worth a tenth of the lab is destroyed.' },
   { from: 15, to: 15, de: 'Erbärmlicher Gestank.', en: 'A dreadful stench.' },
   { from: 16, to: 16, de: 'Dichter grünlicher Qualm, schwer zu entfernen.', en: 'Thick greenish smoke, hard to get rid of.' },
   { from: 17, to: 17, de: 'Das Braugut spritzt ins Gesicht: 1W6 TP Verbrühung.', en: 'The brew splashes the face: 1W6 TP scalding.' },
   { from: 18, to: 18, de: 'Das Braugut spritzt ins Gesicht und wirkt mit QS 3 auf den Alchimisten.', en: 'The brew splashes the face and takes effect at QS 3 on the alchemist.' },
   { from: 19, to: 19, de: 'Nach einigen Stunden entflammen Reste: Zimmerbrand.', en: 'Hours later spilled remains ignite: a room fire.' },
   { from: 20, to: 20, de: 'Eine amorphe grünliche Masse erwacht und flieht.', en: 'An amorphous greenish mass comes alive and flees.' },
   { from: 21, to: 21, de: 'Ploppen: das Braugut verschwindet im Limbus und reißt Berührtes mit.', en: 'Pop: the brew vanishes into the Limbus with whatever touches it.' },
   { from: 22, to: 22, de: 'Giftige Gase: 1W6 SP pro Kampfrunde beim Einatmen.', en: 'Toxic gases: 1W6 SP per combat round when inhaled.' },
   { from: 23, to: 23, de: 'Kleine Explosion: 2W6 TP im Umkreis von 4 Schritt; Geräte im Wert eines Viertels des Labors zerstört.', en: 'Small explosion: 2W6 TP within 4 Schritt; equipment worth a quarter of the lab destroyed.' },
   { from: 24, to: 24, de: 'Große Explosion: 4W6 TP im Umkreis von 6 Schritt; die Hälfte des Labors zerstört; Brandgefahr.', en: 'Big explosion: 4W6 TP within 6 Schritt; half the lab destroyed; fire hazard.' },
   { from: 25, to: 99, de: 'Das Braugut frisst sich durch alles hindurch, im schlimmsten Fall bis zu einem kleinen Vulkanausbruch.', en: 'The brew eats through everything, at worst causing a small volcanic eruption.' },
]
export const brewFailureFor = (total: number) => brewFailures.find((entry) => total >= entry.from && total <= entry.to) ?? brewFailures[0]
