export const charRules = {
   name: {
      minLength: 2,
      maxLength: 100,
   },
   title: {
      maxLength: 80,
   },
   species: {
      maxLength: 80,
   },
   placeOfOrigin: {
      maxLength: 80,
   },
   culture: {
      maxLength: 80,
   },
   profession: {
      maxLength: 80,
   },
   socialStatus: {
      maxLength: 60,
   },
   build: {
      maxLength: 60,
   },
   eyeColor: {
      maxLength: 40,
   },
   hairColor: {
      maxLength: 40,
   },
   appearance: {
      maxLength: 1000,
   },
   background: {
      maxLength: 400,
   },
   biography: {
      maxLength: 2000,
   },
   familyNotes: {
      maxLength: 500,
   },
} as const

export const charValidationMessages = {
   name: 'Character name is required and must be between 2 and 100 characters.',
   age: 'Age must be between 1 and 200.',
   species: 'Species is required.',
   placeOfOrigin: 'Place of origin is required.',
   culture: 'Culture is required.',
   profession: 'Profession is required.',
   socialStatus: 'Social status is required.',
   sex: 'Sex must be male, female, or other.',
   status: 'Status must be active, retired, or deceased.',
} as const
