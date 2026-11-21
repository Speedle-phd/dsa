export const statsRules = {
   attributeRange: {
      minLength: 0,
      maxLength: 25,
   },
} as const

export const attributeNames = [
   'strength',
   'courage',
   'intuition',
   'wisdom',
   'charisma',
   'dexterity',
   'fingerDexterity',
   'constitution',
] as const

export const statsValidationMessages = {
   attributeRange: 'Attribute must be between 0 and 25.',
} as const
