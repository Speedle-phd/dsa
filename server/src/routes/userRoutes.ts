import { Router } from 'express'
import {
   deleteCurrentUser,
   getCurrentUser,
   getSettings,
   updateSettings,
   loginUser,
   registerUser,
   resetPassword,
   updateProfile,
} from '@/controllers/userController'
import { protect } from '@/middleware/auth'
import { validateRequest } from '@/middleware/validateRequest'
import { userSettingsSchema } from '@/validations/partyValidation'
import {
   loginSchema,
   registerSchema,
   resetPasswordSchema,
   updateProfileSchema,
} from '@/validations/userValidation'

const router = Router()

router.post('/register', validateRequest(registerSchema), registerUser)
router.post('/login', validateRequest(loginSchema), loginUser)
router.get('/me', protect, getCurrentUser)
router.delete('/me', protect, deleteCurrentUser)
router.get('/me/settings', protect, getSettings)
router.patch('/me/settings', protect, validateRequest(userSettingsSchema), updateSettings)
router.put(
   '/reset-password',
   protect,
   validateRequest(resetPasswordSchema),
   resetPassword,
)
router.put(
   '/update-profile',
   protect,
   validateRequest(updateProfileSchema),
   updateProfile,
)

export default router
