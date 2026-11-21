import { Router } from 'express'
import {
   createCreationDraft, deleteCreationDraft, finishCreationDraft, getCreationDraft, getCreationReference, listCreationDrafts, updateCreationDraft,
} from '@/controllers/creationController'
import { protect } from '@/middleware/auth'
import { validateRequest } from '@/middleware/validateRequest'
import { createCreationDraftSchema, updateCreationDraftSchema } from '@/validations/creationValidation'

const router = Router()

router.use(protect)

router.get('/reference', getCreationReference)
router.get('/drafts', listCreationDrafts)
router.post('/drafts', validateRequest(createCreationDraftSchema), createCreationDraft)
router.get('/drafts/:id', getCreationDraft)
router.put('/drafts/:id', validateRequest(updateCreationDraftSchema), updateCreationDraft)
router.delete('/drafts/:id', deleteCreationDraft)
router.post('/drafts/:id/finish', finishCreationDraft)

export default router
