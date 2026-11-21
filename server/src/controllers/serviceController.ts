import type { Request, Response } from 'express'
import { createEffect, listEffects } from '@/controllers/activeEffectController'
import { BadRequestError, UnauthorizedError } from '@/utils/appError'
import { purseFromKreuzer } from '@/utils/equipmentPurchase'
import { adjustPurse } from '@/utils/purseAdjustment'
import { findService, serviceTotalKreuzer, services } from '@/utils/serviceCatalog'
import { findStatsForUser, saveStats } from '@/utils/statsPersistence'
import { purchaseServiceSchema } from '@/validations/serviceValidation'
import { buildStatResponse } from '@/views/statsView'

export function getServiceReference(_req: Request, res: Response) {
   res.json({ services })
}

// source: DSA5 Regelwerk, S. 381–382 (Dienstleistungen); the server prices every service itself.
export async function purchaseServiceController(req: Request, res: Response) {
   if (!req.user) throw new UnauthorizedError('User not authenticated')
   const stat = await findStatsForUser(req.params.id, req.user._id)
   const { items, treatmentQuality } = purchaseServiceSchema.parse(req.body)
   const bill = items.map(({ key, quantity }) => {
      const service = findService(key)
      if (!service) throw new BadRequestError('Unknown service.')
      return { service, quantity }
   })
   const total = bill.reduce((sum, { service, quantity }) => sum + serviceTotalKreuzer(service, quantity), 0)
   const result = adjustPurse(stat.toObject().purse, { direction: 'lose', coins: purseFromKreuzer(total) })
   if (!result.ok) {
      throw new BadRequestError(result.reason === 'insufficient-funds' ? 'Not enough money for this service.' : 'The purse values are invalid.')
   }
   stat.purse = result.purse
   await saveStats(stat)
   // source: DSA5 Regelwerk, S. 340 (Heilkunde Wunden: the QS is added to the next LeP regeneration)
   if (bill.some(({ service }) => service.effect === 'treatment') && treatmentQuality) {
      await createEffect(stat._id, req.user._id, {
         key: 'treatment', label: 'Medicus treatment', quality: treatmentQuality, page: 382,
         duration: { de: 'bis zur nächsten Regeneration', en: 'until the next regeneration' }, values: { treatmentQuality },
      })
   }
   res.json({ ...buildStatResponse(stat), effects: await listEffects(stat._id, req.user._id), paidKreuzer: result.amountKreuzer })
}
