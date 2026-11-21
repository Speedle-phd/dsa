import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { activeEffectsKey, startAbilityEffect, useActiveEffects } from './activeEffectsApi'
import type { ProbeResultState } from './ProbeDialog'
import type { Stats } from './statsApi'
import { talentDetails } from './talentDetails'

// source: DSA5 Regelwerk, S. 217–219 (Fischer, Jäger, Sammler: one more QS of food on a successful check)
const foodAbilities: Record<string, string> = { fischenUndAngeln: 'Fischer', tierkunde: 'Jäger', pflanzenkunde: 'Sammler' }

// Talent-specific follow-ups of a successful check that come from owned SF (S. 215, 217–219).
export function TalentResultActions({ stats, talentKey, state }: { stats: Stats; talentKey: string; state: ProbeResultState }) {
   const language = useLanguageStore((store) => store.language)
   const queryClient = useQueryClient()
   const running = useActiveEffects(stats)
   const suppress = useMutation({
      mutationFn: (quality: number) => startAbilityEffect(stats._id, 'Schmerzen unterdrücken', quality),
      onSuccess: ({ stats: next, effects }) => {
         queryClient.setQueryData(['stats', stats.charId], next)
         queryClient.setQueryData(activeEffectsKey(stats._id), effects)
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   const owns = (name: string) => stats.generalSpecialAbilities.includes(name)
   const quality = state.result.success ? state.quality ?? 0 : 0
   if (!quality) return null
   const food = talentDetails[talentKey]?.food
   const foodAbility = foodAbilities[talentKey]
   const painRunning = running.some((effect) => effect.key === 'painSuppression')
   return <>
      {/* source: DSA5 Regelwerk, S. 219 (Schmerzen unterdrücken: needs at least Schmerz I; one level per QS) */}
      {talentKey === 'selbstbeherrschung' && owns('Schmerzen unterdrücken') && stats.pain >= 1 && <section className='probe-asp'>
         {suppress.isSuccess || painRunning ? <p className='probe-asp-spent'><Shield size={16} />{t('Schmerz suppressed for this fight (Betäubung I when it ends).', language)}</p>
            : <button className='primary-button' type='button' disabled={suppress.isPending} onClick={() => suppress.mutate(Math.min(quality, stats.pain))}>
               <Shield size={16} />{t('Schmerzen unterdrücken: ignore {n} level(s) of Schmerz', language).replace('{n}', String(Math.min(quality, stats.pain)))}
            </button>}
      </section>}
      {/* source: DSA5 Regelwerk, S. 215 (Anführer: up to QS+1 allies in sight and hearing) */}
      {talentKey === 'ueberreden' && owns('Anführer') && <p className='probe-talent-notes'>
         {t('Anführer: up to {n} allies get AT, defense and FK +1 in the next combat round.', language).replace('{n}', String(quality + 1))}
      </p>}
      {food && <p className='probe-talent-notes'>
         <span lang='de'>{t('Gathering food', language)}: {food}</span>
         {foodAbility && owns(foodAbility) && <> · <span lang='de'>{foodAbility}</span>: {t('one more QS of food', language)}</>}
      </p>}
   </>
}
