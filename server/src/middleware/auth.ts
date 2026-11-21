import type { NextFunction, Request, Response } from 'express'
import { User } from '@/models/user.model'
import type { AuthenticatedUser } from '@/types/apiContracts'
import { NotFoundError, UnauthorizedError } from '@/utils/appError'
import { verifyToken } from '@/utils/jwt'

export async function protect(
   req: Request,
   _res: Response,
   next: NextFunction,
) {
   const authHeader = req.headers.authorization

   if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Not authorized'))
   }

   try {
      const token = authHeader.split(' ')[1]
      const payload = await verifyToken(token)

      if (!payload.sub) {
         return next(new UnauthorizedError('Invalid token payload'))
      }

      const user = await User.findById(payload.sub).select('-password')

      if (!user) {
         return next(new NotFoundError('User not found'))
      }

      const authUser: AuthenticatedUser = {
         _id: user._id.toString(),
         username: user.username,
         email: user.email,
      }

      req.user = authUser

      next()
   } catch {
      return next(new UnauthorizedError('Invalid or expired token'))
   }
}
