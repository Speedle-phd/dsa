import { useQuery } from '@tanstack/react-query'
import { axiosInstance } from '@/axios/axios'
import type { GeneratorInput } from './npcPresets'
import type { NpcDraft, NpcSource } from './npcSheet'

// The GM's NPC library (user request, Nov 2026); mirrors server/src/controllers/npcTemplateController.ts
export type NpcTemplate = { _id: string; name: string; values: NpcDraft; source: NpcSource; tags: string[]; updatedAt: string | null }
export type NpcTemplateInput = { name: string; values: NpcDraft; source: NpcSource; tags: string[] }

export const npcLibraryKey = ['npc-templates'] as const

export async function getNpcLibrary() {
   return (await axiosInstance.get<{ templates: NpcTemplate[] }>('/api/npc-templates')).data.templates
}
export async function createNpc(input: NpcTemplateInput) {
   return (await axiosInstance.post<{ template: NpcTemplate }>('/api/npc-templates', input)).data.template
}
export async function updateNpc(id: string, input: NpcTemplateInput) {
   return (await axiosInstance.put<{ template: NpcTemplate }>(`/api/npc-templates/${id}`, input)).data.template
}
export async function duplicateNpc(id: string) {
   return (await axiosInstance.post<{ template: NpcTemplate }>(`/api/npc-templates/${id}/duplicate`)).data.template
}
export async function deleteNpc(id: string) {
   await axiosInstance.delete(`/api/npc-templates/${id}`)
}

// The generator's values by the hero rules, with how each value is made up
export type DerivedPart = { label: string; value: number }
export type DerivedNpc = NpcDraft & { breakdown: Record<'maxHealth' | 'soulPower' | 'toughness' | 'dodge' | 'speed' | 'initiativeBase', DerivedPart[]> }
export async function deriveNpc(input: GeneratorInput) {
   const { breakdown, ...draft } = (await axiosInstance.post<{ npc: DerivedNpc }>('/api/npc-templates/derive', input)).data.npc
   return { draft, breakdown }
}

export function useNpcLibrary() {
   return useQuery({ queryKey: npcLibraryKey, queryFn: getNpcLibrary })
}
