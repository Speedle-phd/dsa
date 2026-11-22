import { Router } from 'express'
import { protect } from '@/middleware/auth'
import { validateRequest } from '@/middleware/validateRequest'
import { deleteNpcTemplate, listNpcTemplates, saveNpcTemplate } from '@/controllers/encounterController'
import { npcTemplateSchema } from '@/validations/encounterValidation'

const router = Router()

router.use(protect)
router.get('/', listNpcTemplates)
router.post('/', validateRequest(npcTemplateSchema), saveNpcTemplate)
router.delete('/:templateId', deleteNpcTemplate)

export default router
