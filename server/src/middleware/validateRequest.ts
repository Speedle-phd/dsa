import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { BadRequestError } from '@/utils/appError'

export function validateRequest(schema: z.ZodType) {
   return (req: Request, _res: Response, next: NextFunction) => {
      const result = schema.safeParse(req.body)

      if (!result.success) {
         const firstError =
            result.error.issues[0]?.message || 'Validation failed'
         return next(new BadRequestError(firstError))
      }

      req.body = result.data
      next()
   }
}
