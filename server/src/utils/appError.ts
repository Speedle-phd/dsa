import { HttpStatus } from '@/utils/httpStatus'

export class AppError extends Error {
   statusCode: number

   constructor(statusCode: number, message: string) {
      super(message)
      this.name = 'AppError'
      this.statusCode = statusCode
   }
}

export class BadRequestError extends AppError {
   constructor(message = 'Bad request') {
      super(HttpStatus.BAD_REQUEST, message)
      this.name = 'BadRequestError'
   }
}

export class UnauthorizedError extends AppError {
   constructor(message = 'Unauthorized') {
      super(HttpStatus.UNAUTHORIZED, message)
      this.name = 'UnauthorizedError'
   }
}

export class ForbiddenError extends AppError {
   constructor(message = 'Forbidden') {
      super(HttpStatus.FORBIDDEN, message)
      this.name = 'ForbiddenError'
   }
}

export class NotFoundError extends AppError {
   constructor(message = 'Resource not found') {
      super(HttpStatus.NOT_FOUND, message)
      this.name = 'NotFoundError'
   }
}

export class ConflictError extends AppError {
   constructor(message = 'Conflict') {
      super(HttpStatus.CONFLICT, message)
      this.name = 'ConflictError'
   }
}

export class InternalServerError extends AppError {
   constructor(message = 'Internal server error') {
      super(HttpStatus.INTERNAL_SERVER_ERROR, message)
      this.name = 'InternalServerError'
   }
}
