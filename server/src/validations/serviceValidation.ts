import { z } from 'zod'
import { services } from '@/utils/serviceCatalog'

const serviceKey = z.enum(services.map((service) => service.key) as [string, ...string[]])

// One bill: a single service or a tavern tab of several.
export const purchaseServiceSchema = z.object({
   items: z.array(z.object({ key: serviceKey, quantity: z.number().int().min(1).max(100) })).min(1).max(30),
   // Behandlung: QS of the Medicus' Heilkunde Wunden check, added to the next LeP regeneration (S. 340, 382).
   treatmentQuality: z.number().int().min(0).max(6).optional(),
})
