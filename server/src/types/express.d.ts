import type { AuthenticatedUser } from '@/types/apiContracts'

declare global {
   namespace Express {
      interface Request {
         user?: AuthenticatedUser
      }
   }
}

export {}
