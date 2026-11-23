import type { ObstacleKind } from './encounterApi'

// Terrain the GM paints on the board (user decision, Nov 2026: blocks movement only, no other rule effect)
export const obstacleLabels: Record<ObstacleKind, string> = { wall: 'Wall', rock: 'Rock', tree: 'Tree', water: 'Water', bush: 'Bush', fire: 'Fire' }
