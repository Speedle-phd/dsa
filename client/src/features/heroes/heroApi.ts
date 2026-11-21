import { axiosInstance } from '@/axios/axios'
export { getErrorMessage as getApiErrorMessage } from '@/utils/errorHandling'

export type HeroSex = 'male' | 'female' | 'other'
export type HeroStatus = 'active' | 'retired' | 'deceased'

export type FamilyTree = {
   parents?: string[]
   siblings?: string[]
   partner?: string | null
   children?: string[]
   notes?: string
}

export type Hero = {
   _id: string
   name: string
   title?: string
   sex: HeroSex
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
   familyTree?: FamilyTree
   status: HeroStatus
}

export type HeroInput = Omit<Hero, '_id'>

export async function getHeroes() {
   const response = await axiosInstance.get<{ chars: Hero[] }>('/api/chars')
   return response.data.chars
}

export async function getHero(id: string) {
   const response = await axiosInstance.get<{ char: Hero }>(`/api/chars/${id}`)
   return response.data.char
}

export async function createHero(hero: HeroInput) {
   const response = await axiosInstance.post<{ char: Hero }>('/api/chars', hero)
   return response.data.char
}

export async function updateHero(id: string, hero: HeroInput) {
   const response = await axiosInstance.put<{ char: Hero }>(
      `/api/chars/${id}`,
      hero,
   )
   return response.data.char
}

export async function deleteHero(id: string) {
   await axiosInstance.delete(`/api/chars/${id}`)
}
