import { Router } from 'express'
import { protect } from '@/middleware/auth'
import { validateRequest } from '@/middleware/validateRequest'
import { createNpcTemplate, deleteNpcTemplate, deriveNpcTemplate, duplicateNpcTemplate, listNpcTemplates, updateNpcTemplate } from '@/controllers/npcTemplateController'
import { npcDeriveSchema, npcTemplateSchema } from '@/validations/encounterValidation'

const router = Router()

router.use(protect)
router.get('/', listNpcTemplates)
router.post('/', validateRequest(npcTemplateSchema), createNpcTemplate)
router.post('/derive', validateRequest(npcDeriveSchema), deriveNpcTemplate)
router.put('/:templateId', validateRequest(npcTemplateSchema), updateNpcTemplate)
router.post('/:templateId/duplicate', duplicateNpcTemplate)
router.delete('/:templateId', deleteNpcTemplate)

export default router
