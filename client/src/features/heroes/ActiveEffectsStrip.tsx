import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Brain, Check, EyeOff, FlaskConical, Heart, Leaf, Shield, Skull, Sparkles, Stethoscope, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Tooltip } from '@/components/Tooltip'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import { activeEffectsKey, updateActiveEffect, useActiveEffects, type ActiveEffect } from './activeEffectsApi'
import { getStatsForHero } from './statsApi'

function effectIcon(effect: ActiveEffect): LucideIcon {
   if (effect.key === 'treatment') return Stethoscope
   if (effect.key.startsWith('weapon-poison:')) return Skull
   if (effect.key.startsWith('weapon-balm:')) return Sparkles
   if (effect.key === 'soulPower' || effect.key === 'ironWill') return Brain
   if (effect.key === 'painSuppression') return Shield
   if (effect.key === 'invisibility') return EyeOff
   if (effect.key === 'love') return Heart
   if (effect.key === 'herbHealth' || effect.key === 'ignoreStupor') return Leaf
   return FlaskConical
}

function effectSummary(effect: ActiveEffect, language: 'de' | 'en') {
   const { values } = effect
   const parts = [
      values.soulPower ? `SK +${values.soulPower}` : '',
      values.damageBonus ? `+${values.damageBonus} TP` : '',
      values.magicalWeapon ? t('magical', language) : '',
      values.unbreakable ? t('unbreakable', language) : '',
      values.ignoreStupor ? t('ignores {n} Betäubung', language).replace('{n}', String(values.ignoreStupor)) : '',
      values.transitionPain ? t('Schmerz +1 while transforming', language) : '',
      values.herbHealth ? `+${values.herbHealth} ${t('LeP next regeneration', language)}` : '',
      values.treatmentQuality ? `QS ${values.treatmentQuality} ${t('to the next LeP regeneration', language)}` : '',
      values.ironWill ? `SK +${values.ironWill} · ${t('all other checks', language)} −${values.ironWill}` : '',
      values.ignorePain ? t('ignores {n} Schmerz', language).replace('{n}', String(values.ignorePain)) : '',
      values.stuporOnEnd ? t('Betäubung I when it ends', language) : '',
   ].filter(Boolean)
   return parts.join(' · ')
}

// Running elixir, herb, poison and service effects. There is no in-game clock: the player ends them.
export function ActiveEffectsStrip({ heroId, compact = false }: { heroId: string; compact?: boolean }) {
   const language = useLanguageStore((state) => state.language)
   const queryClient = useQueryClient()
   const statsQuery = useQuery({ queryKey: ['stats', heroId], queryFn: () => getStatsForHero(heroId) })
   const stats = statsQuery.data
   const effects = useActiveEffects(stats)
   const mutation = useMutation({
      mutationFn: ({ effectId, action }: { effectId: string; action: 'end' | 'end-transition' }) => updateActiveEffect(stats!._id, effectId, action),
      onSuccess: ({ stats: next, effects: list }) => {
         queryClient.setQueryData(['stats', heroId], next)
         queryClient.setQueryData(activeEffectsKey(next._id), list)
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   if (!stats || effects.length === 0) return null

   return <section className={`active-effects${compact ? ' is-compact' : ''}`} aria-label={t('Active effects', language)}>
      {!compact && <p className='eyebrow'>{t('Active effects', language)}</p>}
      <ul>
         {effects.map((effect) => {
            const Icon = effectIcon(effect)
            const summary = effectSummary(effect, language)
            const info = [effect.note?.[language], `${t('Duration', language)}: ${effect.duration[language]}`,
               `${t('Started', language)}: ${new Date(effect.createdAt).toLocaleString(language)}`, `${t('S.', language)} ${effect.page}`]
               .filter(Boolean).join(' · ')
            return <li key={effect._id} className='active-effect-chip'>
               <Icon size={16} aria-hidden='true' />
               <span className='active-effect-text'>
                  <strong>{t(effect.label, language)}{effect.quality ? ` · QS ${effect.quality}` : ''}{effect.weapon ? ` → ${t(effect.weapon, language)}` : ''}</strong>
                  {!compact && <small>{summary || effect.duration[language]}</small>}
               </span>
               <Tooltip content={info} clickToToggle className='tooltip-icon-wrapper' lang={language}>
                  <span className='active-effect-duration'>{effect.duration[language]}</span>
               </Tooltip>
               {(effect.values.transitionPain ?? 0) > 0 && <button type='button' className='icon-button' disabled={mutation.isPending}
                  title={t('Transformation finished', language)} aria-label={t('Transformation finished', language)}
                  onClick={() => mutation.mutate({ effectId: effect._id, action: 'end-transition' })}><Check size={15} /></button>}
               <button type='button' className='icon-button' disabled={mutation.isPending}
                  title={t('End effect', language)} aria-label={`${t('End effect', language)}: ${t(effect.label, language)}`}
                  onClick={() => mutation.mutate({ effectId: effect._id, action: 'end' })}><X size={15} /></button>
            </li>
         })}
      </ul>
   </section>
}
