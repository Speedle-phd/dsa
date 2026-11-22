import mongoose, { Schema, type Document } from 'mongoose'
import bcrypt from 'bcryptjs'
import {
   emailRegex,
   emailValidationMessage,
   passwordRegex,
   passwordRules,
   passwordValidationMessage,
   usernameRules,
} from '@/validations/userRules'

export interface IUserDocument extends Document {
   username: string
   email: string
   password: string
   // What other party members see of a hero that joins a party (user setting; the owner can change it per hero)
   settings?: { defaultPartyVisibility?: 'private' | 'summary' | 'full' }
   matchPassword(candidatePassword: string): Promise<boolean>
}

const userSchema = new Schema<IUserDocument>(
   {
      username: {
         type: String,
         required: true,
         trim: true,
         minlength: usernameRules.minLength,
         maxlength: usernameRules.maxLength,
      },
      email: {
         type: String,
         required: true,
         unique: true,
         trim: true,
         lowercase: true,
         match: [emailRegex, emailValidationMessage],
      },
      password: {
         type: String,
         required: true,
         minlength: passwordRules.minLength,
         validate: {
            validator(value: string) {
               return passwordRegex.test(value)
            },
            message: passwordValidationMessage,
         },
      },
   },
   {
      timestamps: true,
   },
)

userSchema.add({
   settings: {
      defaultPartyVisibility: { type: String, enum: ['private', 'summary', 'full'], default: 'summary' },
   },
})

userSchema.pre(
   'save',
   async function (this: IUserDocument, next: (err?: Error) => void) {
      if (!this.isModified('password')) {
         return next()
      }

      const salt = await bcrypt.genSalt(10)
      this.password = await bcrypt.hash(this.password, salt)
      next()
   },
)

userSchema.methods.matchPassword = async function (
   this: IUserDocument,
   candidatePassword: string,
) {
   return bcrypt.compare(candidatePassword, this.password)
}

userSchema.set('toJSON', {
   transform: (_doc: unknown, ret: any) => {
      delete ret.password
      delete ret.__v
      return ret
   },
} as any)

export const User = mongoose.model<IUserDocument>('User', userSchema)
