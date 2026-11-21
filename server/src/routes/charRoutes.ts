import { Router } from 'express'
import {
   createCharacter,
   deleteCharacter,
   getCharacterById,
   getCharacters,
   updateCharacter,
} from '@/controllers/charController'
import { protect } from '@/middleware/auth'
import { validateRequest } from '@/middleware/validateRequest'
import {
   createCharSchema,
   updateCharSchema,
} from '@/validations/charValidation'

const router = Router()

router.use(protect)

router.get('/', getCharacters)
router.get('/:id', getCharacterById)
router.post('/', validateRequest(createCharSchema), createCharacter)
router.put('/:id', validateRequest(updateCharSchema), updateCharacter)
router.delete('/:id', deleteCharacter)

export default router
