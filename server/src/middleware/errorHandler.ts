import type { NextFunction, Request, Response } from 'express'
import type { ErrorResponse } from '@/types/apiContracts'
import { AppError, InternalServerError, NotFoundError } from '@/utils/appError'
import { HttpStatus } from '@/utils/httpStatus'

type DuplicateKeyError = Error & {
   code?: number
   keyPattern?: Record<string, unknown>
   keyValue?: Record<string, unknown>
}

function isDuplicateKeyError(error: unknown): error is DuplicateKeyError {
   return (
      error instanceof Error &&
      'code' in error &&
      (error as DuplicateKeyError).code === 11000
   )
}

export function notFound(_req: Request, _res: Response, next: NextFunction) {
   next(new NotFoundError())
}

export function errorHandler(
   err: Error | AppError,
   _req: Request,
   res: Response,
   _next: NextFunction,
) {
   const duplicateKeyError = isDuplicateKeyError(err) ? err : null
   const isDuplicateCharacterName = Boolean(duplicateKeyError?.keyPattern?.name)
   const duplicateName = duplicateKeyError?.keyValue?.name
   const statusCode = duplicateKeyError
      ? HttpStatus.CONFLICT
      : err instanceof AppError
        ? err.statusCode
        : HttpStatus.INTERNAL_SERVER_ERROR
   const message = duplicateKeyError
      ? isDuplicateCharacterName && typeof duplicateName === 'string'
         ? `A hero named "${duplicateName}" already exists in your registry.`
         : 'A record with these details already exists.'
      : err.message || 'Internal server error'

   if (process.env.NODE_ENV !== 'production') {
      console.error(err)
   }

   const errorPayload: ErrorResponse = {
      statusCode,
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
   }

   if (!(err instanceof AppError) && !duplicateKeyError) {
      const fallbackError = new InternalServerError(message)
      return res.status(fallbackError.statusCode).json({
         statusCode: fallbackError.statusCode,
         message: fallbackError.message,
         ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
      })
   }

   res.status(statusCode).json(errorPayload)
}
