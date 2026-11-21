import { SignJWT, jwtVerify } from 'jose'
import type { JwtPayload } from '@/types/apiContracts'

const JWT_SECRET = new TextEncoder().encode(
   process.env.JWT_SECRET || 'change-me-in-production',
)

export async function signToken(payload: JwtPayload) {
   return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JwtPayload> {
   const { payload } = await jwtVerify(token, JWT_SECRET)
   return payload as JwtPayload
}
