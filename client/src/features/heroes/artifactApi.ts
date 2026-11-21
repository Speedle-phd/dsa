import { axiosInstance } from '@/axios/axios'
import type { ArtifactRecharge } from './magicRules'
import type { Stats } from './statsApi'

// Magical artifacts of a hero (S. 266–270), kept in their own collection.
export type ArtifactKind = 'storage' | 'recharging' | 'permanent' | 'weapon'
export type Artifact = {
   _id: string
   name: string
   item: string | null
   kind: ArtifactKind
   spell: string
   skillPoints: number
   duration: string
   charges: { current: number; max: number }
   recharge: ArtifactRecharge | null
   trigger: string
   permanentAsp: number
   sideEffect: string
   notes: string
   origin: 'found' | 'created'
}
export type ArtifactFields = Pick<Artifact, 'name' | 'item' | 'kind' | 'spell' | 'skillPoints' | 'duration' | 'recharge' | 'trigger' | 'sideEffect' | 'notes'> & { charges: number }
export type ArtifactCreation = {
   name: string; item: string | null; spell: string; spellCost: number; skillPoints: number; duration: string
   charges: number; recharge: ArtifactRecharge | null; iron: boolean; materialSaved: number; materialBonus: boolean; trigger: string; sideEffect: string
}

export const artifactsKey = (statsId: string) => ['artifacts', statsId]
type ListResponse = { artifacts: Artifact[] }

export async function getArtifacts(statsId: string) {
   return (await axiosInstance.get<ListResponse>(`/api/stats/artifacts/${statsId}`)).data.artifacts
}
export async function addArtifact(statsId: string, fields: ArtifactFields) {
   return (await axiosInstance.put<ListResponse>(`/api/stats/add-artifact/${statsId}`, fields)).data.artifacts
}
export async function updateArtifact(statsId: string, artifactId: string, fields: Partial<ArtifactFields>) {
   return (await axiosInstance.put<ListResponse>(`/api/stats/update-artifact/${statsId}`, { ...fields, artifactId })).data.artifacts
}
export async function artifactAction(statsId: string, artifactId: string, action: 'use' | 'recharge' | 'remove') {
   return (await axiosInstance.put<ListResponse>(`/api/stats/artifact-action/${statsId}`, { artifactId, action })).data.artifacts
}
export async function createArtifact(statsId: string, input: ArtifactCreation) {
   return (await axiosInstance.put<{ stats: Stats } & ListResponse>(`/api/stats/create-artifact/${statsId}`, input)).data
}
