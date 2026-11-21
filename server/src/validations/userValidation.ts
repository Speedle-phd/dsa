import { z } from 'zod'
import {
   emailRegex,
   emailValidationMessage,
   normalizeEmail,
   passwordRegex,
   passwordRules,
   passwordValidationMessage,
   usernameRules,
} from '@/validations/userRules'

export const passwordSchema = z
   .string()
   .min(
      passwordRules.minLength,
      `Password must be at least ${passwordRules.minLength} characters long`,
   )
   .regex(passwordRegex, passwordValidationMessage)

export const emailSchema = z
   .string()
   .trim()
   .transform(normalizeEmail)
   .refine((value) => emailRegex.test(value), {
      message: emailValidationMessage,
   })

export const registerSchema = z.object({
   username: z
      .string()
      .trim()
      .min(
         usernameRules.minLength,
         `Username must be at least ${usernameRules.minLength} characters long`,
      )
      .max(
         usernameRules.maxLength,
         `Username cannot exceed ${usernameRules.maxLength} characters`,
      ),
   email: emailSchema,
   password: passwordSchema,
})

export const loginSchema = z.object({
   email: emailSchema,
   password: z.string().min(1, 'Password is required'),
})

export const resetPasswordSchema = z.object({
   currentPassword: z.string().min(1, 'Current password is required'),
   newPassword: passwordSchema,
})

export const updateProfileSchema = z
   .object({
      username: z
         .string()
         .trim()
         .min(
            usernameRules.minLength,
            `Username must be at least ${usernameRules.minLength} characters long`,
         )
         .max(
            usernameRules.maxLength,
            `Username cannot exceed ${usernameRules.maxLength} characters`,
         )
         .optional(),
      currentPassword: z
         .string()
         .min(1, 'Current password is required')
         .optional(),
      newPassword: passwordSchema.optional(),
   })
   .refine((data) => Boolean(data.username) || Boolean(data.newPassword), {
      message: 'Provide a username or password update',
      path: ['username'],
   })
   .refine((data) => !data.newPassword || Boolean(data.currentPassword), {
      message: 'Current password is required when changing the password',
      path: ['currentPassword'],
   })
