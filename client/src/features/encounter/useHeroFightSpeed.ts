import { useQuery } from '@tanstack/react-query'
import { fightSpeed, heroSpeed } from '@/features/heroes/energy'
import { getHero } from '@/features/heroes/heroApi'
import { getStatsForHero } from '@/features/heroes/statsApi'

// The own hero's current GS for moves on the board (same value as the fight panel and the server check)
export function useHeroFightSpeed(heroId: string | null) {
   const stats = useQuery({ queryKey: ['stats', heroId], queryFn: () => getStatsForHero(heroId!), enabled: heroId !== null })
   const hero = useQuery({ queryKey: ['heroes', heroId], queryFn: () => getHero(heroId!), enabled: heroId !== null })
   if (!stats.data || !hero.data) return null
   return fightSpeed(stats.data, heroSpeed(stats.data, hero.data.species))
}
