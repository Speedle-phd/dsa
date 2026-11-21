import type {
   CharResponse,
   CharsResponse,
   PublicChar,
} from '@/types/char.types'

export function toPublicChar(char: any): PublicChar {
   return {
      _id: String(char._id),
      userId: String(char.userId),
      name: char.name,
      title: char.title || undefined,
      sex: char.sex,
      age: char.age,
      species: char.species,
      placeOfOrigin: char.placeOfOrigin || undefined,
      culture: char.culture,
      profession: char.profession,
      socialStatus: char.socialStatus,
      height: char.height ?? undefined,
      weight: char.weight ?? undefined,
      build: char.build || undefined,
      eyeColor: char.eyeColor || undefined,
      hairColor: char.hairColor || undefined,
      appearance: char.appearance || undefined,
      background: char.background || undefined,
      biography: char.biography || undefined,
      familyTree: char.familyTree || undefined,
      status: char.status,
      createdAt: new Date(char.createdAt).toISOString(),
      updatedAt: new Date(char.updatedAt).toISOString(),
   }
}

export function buildCharResponse(char: any): CharResponse {
   return { char: toPublicChar(char) }
}

export function buildCharsResponse(chars: any[]): CharsResponse {
   return {
      chars: chars.map(toPublicChar),
      count: chars.length,
   }
}
