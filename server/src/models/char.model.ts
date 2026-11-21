import mongoose, { Schema, type Document } from 'mongoose'

export type CharacterSex = 'male' | 'female' | 'other'
export type CharacterStatus = 'active' | 'retired' | 'deceased'

export interface ICharDocument extends Document {
   userId: mongoose.Types.ObjectId
   name: string
   title?: string
   sex: CharacterSex
   age: number
   species: string
   placeOfOrigin?: string
   culture: string
   profession: string
   socialStatus: string
   height?: number
   weight?: number
   build?: string
   eyeColor?: string
   hairColor?: string
   appearance?: string
   background?: string
   biography?: string
   familyTree?: {
      parents?: string[]
      siblings?: string[]
      partner?: string | null
      children?: string[]
      notes?: string
   }
   status: CharacterStatus
   createdAt: Date
   updatedAt: Date
}

const charSchema = new Schema<ICharDocument>(
   {
      userId: {
         type: Schema.Types.ObjectId,
         ref: 'User',
         required: true,
         index: true,
      },
      name: {
         type: String,
         required: true,
         trim: true,
         minlength: 2,
         maxlength: 100,
      },
      title: {
         type: String,
         trim: true,
         maxlength: 80,
         default: '',
      },
      sex: {
         type: String,
         enum: ['male', 'female', 'other'],
         required: true,
      },
      age: {
         type: Number,
         required: true,
         min: 1,
         max: 200,
      },
      species: {
         type: String,
         required: true,
         trim: true,
         maxlength: 80,
         default: 'Human',
      },
      placeOfOrigin: {
         type: String,
         trim: true,
         maxlength: 80,
         default: '',
      },
      culture: {
         type: String,
         required: true,
         trim: true,
         maxlength: 80,
      },
      profession: {
         type: String,
         required: true,
         trim: true,
         maxlength: 80,
      },
      socialStatus: {
         type: String,
         required: true,
         trim: true,
         maxlength: 60,
      },
      height: {
         type: Number,
         min: 0,
         default: undefined,
      },
      weight: {
         type: Number,
         min: 0,
         default: undefined,
      },
      build: {
         type: String,
         trim: true,
         maxlength: 60,
         default: '',
      },
      eyeColor: {
         type: String,
         trim: true,
         maxlength: 40,
         default: '',
      },
      hairColor: {
         type: String,
         trim: true,
         maxlength: 40,
         default: '',
      },
      appearance: {
         type: String,
         trim: true,
         maxlength: 1000,
         default: '',
      },
      background: {
         type: String,
         trim: true,
         maxlength: 400,
         default: '',
      },
      biography: {
         type: String,
         trim: true,
         maxlength: 2000,
         default: '',
      },
      familyTree: {
         parents: {
            type: [String],
            default: [],
         },
         siblings: {
            type: [String],
            default: [],
         },
         partner: {
            type: String,
            default: null,
         },
         children: {
            type: [String],
            default: [],
         },
         notes: {
            type: String,
            trim: true,
            maxlength: 500,
            default: '',
         },
      },
      status: {
         type: String,
         enum: ['active', 'retired', 'deceased'],
         default: 'active',
      },
   },
   {
      timestamps: true,
      collection: 'chars',
   },
)

charSchema.index({ userId: 1, name: 1 }, { unique: true })

charSchema.set('toJSON', {
   transform: (_doc: unknown, ret: any) => {
      delete ret.__v
      return ret
   },
} as any)

export const Char = mongoose.model<ICharDocument>('Char', charSchema)
