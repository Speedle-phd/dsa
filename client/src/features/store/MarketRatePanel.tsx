import { Handshake, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { QuantityStepper } from '@/components/QuantityStepper'
import { useHeroStore } from '@/features/heroes/heroStore'
import type { Stats } from '@/features/heroes/statsApi'
import { talentCatalog } from '@/features/heroes/talentCatalog'
import { TalentProbeDialog } from '@/features/heroes/TalentProbeDialog'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { haggleRate } from '@/utils/storePricing'

const handel = talentCatalog.find((talent) => talent.key === 'handel')!
const signedPercent = (rate: number) => `${rate > 0 ? '+' : rate < 0 ? '−' : '±'}${Math.abs(rate)} %`

// One haggle per market visit (S. 208): the result applies to every purchase until it is reset.
export function MarketRatePanel({ stats }: { stats: Stats }) {
   const language = useLanguageStore((state) => state.language)
   const { marketRate, setMarketRate } = useHeroStore()
   const [rolling, setRolling] = useState(false)
   const value = stats.talents.find((talent) => talent.key === 'handel')?.value ?? null

   return <div className='state-panel market-rate-panel'>
      <div className='resource-label'>
         <span><Handshake size={15} aria-hidden='true' /> {t('Market prices', language)}</span>
         <strong className={marketRate < 0 ? 'is-discount' : marketRate > 0 ? 'is-markup' : undefined}>
            {marketRate === 0 ? t('List prices', language) : signedPercent(marketRate)}
         </strong>
      </div>
      <small>{t('Haggle once per market visit: Handel (Feilschen) against the merchant, net QS × 10 %, at most 50 % (S. 208).', language)}</small>
      <div className='market-rate-controls'>
         <button className='primary-button' type='button' disabled={value === null}
            title={value === null ? t('This talent is not activated.', language) : undefined} onClick={() => setRolling(true)}>
            <Handshake size={16} />{t('Haggle', language)}
         </button>
         <QuantityStepper value={marketRate} min={-50} max={50} label={t('Market rate in percent', language)} onChange={setMarketRate} />
         <button className='quiet-button' type='button' disabled={marketRate === 0} onClick={() => setMarketRate(0)}>
            <RotateCcw size={15} />{t('Reset', language)}
         </button>
      </div>
      {rolling && value !== null && <TalentProbeDialog stats={stats} talent={handel} value={value} opposedRole='none'
         renderResult={({ contest }) => {
            if (!contest) return <p className='fight-note'>{t('Enter the merchant’s Handel (Feilschen) result to compare.', language)}</p>
            const rate = haggleRate(contest)
            return <div className='market-rate-result'>
               <p>{rate === 0 ? t('No change: list prices.', language)
                  : t(rate < 0 ? 'You win: prices {rate}.' : 'The merchant wins: prices {rate}.', language).replace('{rate}', signedPercent(rate))}</p>
               <button className='primary-button' type='button' onClick={() => { setMarketRate(rate); setRolling(false) }}>
                  {t('Apply to this market', language)}
               </button>
            </div>
         }}
         onClose={() => setRolling(false)} />}
   </div>
}
