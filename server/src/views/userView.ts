import type {
   AuthResponse,
   PasswordResetResponse,
   PublicUser,
   UserRecord,
   UserResponse,
} from '@/types/apiContracts'

export function toPublicUser(user: UserRecord): PublicUser {
   return {
      _id: String(user._id),
      username: user.username,
      email: user.email,
   }
}

export function buildAuthResponse(
   message: string,
   token: string,
   user: UserRecord,
): AuthResponse {
   return {
      message,
      token,
      user: toPublicUser(user),
   }
}

export function buildPasswordResetResponse(
   message: string,
   token: string,
): PasswordResetResponse {
   return {
      message,
      token,
   }
}

export function buildUserResponse(user: UserRecord): UserResponse {
   return {
      user: toPublicUser(user),
   }
}
