import { Artifact } from '@/models/artifact.model'
import { ActiveEffect } from '@/models/activeEffect.model'
import type { Request, Response } from 'express'
import type {
   LoginInput,
   RegisterInput,
   ResetPasswordInput,
   UserUpdateInput,
} from '@/types/apiContracts'
import { normalizeEmail } from '@/validations/userRules'
import { User } from '@/models/user.model'
import { Char } from '@/models/char.model'
import { Stats } from '@/models/stats.model'
import { Companion } from '@/models/companion.model'
import { Summon } from '@/models/summon.model'
import { ExtendedCheck } from '@/models/extendedCheck.model'
import { CreationDraft } from '@/models/creationDraft.model'
import {
   ConflictError,
   NotFoundError,
   UnauthorizedError,
} from '@/utils/appError'
import { signToken } from '@/utils/jwt'
import {
   buildAuthResponse,
   buildPasswordResetResponse,
   buildUserResponse,
} from '@/views/userView'

export async function registerUser(
   req: Request<{}, {}, RegisterInput>,
   res: Response,
) {
   const { username, email, password } = req.body

   const emailLower = normalizeEmail(email)
   const existingUser = await User.findOne({ email: emailLower })

   if (existingUser) {
      throw new ConflictError('User already exists')
   }

   const user = await User.create({ username, email: emailLower, password })
   const token = await signToken({
      sub: user._id.toString(),
      username: user.username,
   })

   res.status(201).json(
      buildAuthResponse('User registered successfully', token, user),
   )
}

export async function loginUser(
   req: Request<{}, {}, LoginInput>,
   res: Response,
) {
   const { email, password } = req.body
   const normalizedEmail = normalizeEmail(email)

   const user = await User.findOne({ email: normalizedEmail })

   if (!user || !(await user.matchPassword(password))) {
      throw new UnauthorizedError('Invalid email or password')
   }

   const token = await signToken({
      sub: user._id.toString(),
      username: user.username,
   })

   res.status(200).json(buildAuthResponse('Login successful', token, user))
}

export async function getCurrentUser(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   res.status(200).json(buildUserResponse(req.user))
}

export async function deleteCurrentUser(req: Request, res: Response) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const user = await User.findById(req.user._id)

   if (!user) {
      throw new NotFoundError('User not found')
   }

   // A hero's stats, Sammelproben, companions and summoned creatures belong to the account too, as do unfinished creation drafts.
   await Promise.all([
      CreationDraft.deleteMany({ userId: user._id }),
      Char.deleteMany({ userId: user._id }),
      Stats.deleteMany({ userId: user._id }),
      ExtendedCheck.deleteMany({ userId: user._id }),
      Companion.deleteMany({ userId: user._id }),
      Summon.deleteMany({ userId: user._id }),
      Artifact.deleteMany({ userId: user._id }),
      ActiveEffect.deleteMany({ userId: user._id }),
   ])
   await user.deleteOne()

   res.status(200).json({
      message: 'User account deleted successfully',
   })
}

export async function resetPassword(
   req: Request<{}, {}, ResetPasswordInput>,
   res: Response,
) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const { currentPassword, newPassword } = req.body
   const user = await User.findById(req.user._id)

   if (!user) {
      throw new NotFoundError('User not found')
   }

   const isMatch = await user.matchPassword(currentPassword)

   if (!isMatch) {
      throw new UnauthorizedError('Current password is incorrect')
   }

   user.password = newPassword
   await user.save()

   const token = await signToken({
      sub: user._id.toString(),
      username: user.username,
   })

   res.status(200).json(
      buildPasswordResetResponse('Password reset successfully', token),
   )
}

export async function updateProfile(
   req: Request<{}, {}, UserUpdateInput>,
   res: Response,
) {
   if (!req.user) {
      throw new UnauthorizedError('User not authenticated')
   }

   const { username, currentPassword, newPassword } = req.body
   const user = await User.findById(req.user._id)

   if (!user) {
      throw new NotFoundError('User not found')
   }

   if (username) {
      user.username = username
   }

   if (newPassword) {
      if (!currentPassword) {
         throw new UnauthorizedError('Current password is required')
      }

      const isMatch = await user.matchPassword(currentPassword)
      if (!isMatch) {
         throw new UnauthorizedError('Current password is incorrect')
      }

      user.password = newPassword
   }

   await user.save()

   const token = await signToken({
      sub: user._id.toString(),
      username: user.username,
   })

   res.status(200).json(
      buildAuthResponse('Profile updated successfully', token, user),
   )
}
