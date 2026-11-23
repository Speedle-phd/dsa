// Condition and Schmerz levels as Roman numerals (I–IV), "—" for none
export function levelsLabel(level: number) {
   return level > 0 ? ['I', 'II', 'III', 'IV'][Math.min(level, 4) - 1] : '—'
}
