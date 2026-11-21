import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { axiosInstance } from '@/axios/axios'
import type { EntryCategory, EntrySelection } from '@/features/heroes/characterEntryApi'
import type { TalentAttribute } from '@/features/heroes/talentCatalog'
import { getErrorMessage } from '@/utils/errorHandling'

export const creationSections = ['basics', 'species', 'culture', 'attributes', 'profession', 'entries', 'skills', 'abilities', 'finish'] as const
export type CreationSection = typeof creationSections[number]
export const sectionLabels: Record<CreationSection, string> = {
   basics: 'Experience', species: 'Species', culture: 'Culture', attributes: 'Attributes', profession: 'Profession',
   entries: 'Advantages & disadvantages', skills: 'Skills', abilities: 'Special abilities & languages', finish: 'Finish',
}
export const attributeOrder: TalentAttribute[] = ['courage', 'wisdom', 'intuition', 'charisma', 'fingerDexterity', 'dexterity', 'constitution', 'strength']

export type ExperienceLevel = 'Unerfahren' | 'Durchschnittlich' | 'Erfahren' | 'Kompetent' | 'Meisterlich' | 'Brillant' | 'Legendär'
export type CreationDraftData = {
   level: ExperienceLevel
   species: string | null
   speciesChoice: TalentAttribute | null
   culture: string | null
   culturePackage: boolean
   language: string | null
   script: string | null
   localKnowledge: string
   attributes: Record<TalentAttribute, number>
   profession: { kind: 'none' } | { kind: 'custom'; name: string } | { kind: 'package'; key: string; variant: string | null; choices: string[][]; application: string; tricks?: string[] }
   entries: EntrySelection[]
   talents: Record<string, number>
   techniques: Record<string, number>
   spells: Record<string, number>
   tricks: string[]
   liturgies?: Record<string, number>
   blessings?: string[]
   combatAbilities?: string[]
   approvals: string[]
   name: string
   sex: 'male' | 'female' | 'other'
   age: number | null
   background: string
}
export type CreationIssue = { section: CreationSection; key: string; message: string; values?: Record<string, string | number> }
type SkillRow = { base: number; value: number; cost: number; maximum: number }
export type CreationLedger = {
   apTotal: number
   costs: Record<CreationSection, number>
   spent: number
   balance: number
   caps: { attributes: Record<TalentAttribute, number>; attributeSum: number; skill: number; technique: number; spells: number; advantageAp: number; disadvantageAp: number }
   usage: { attributeSum: number; advantageAp: number; disadvantageAp: number; spells: number; liturgies: number }
   packageTalents: Record<string, number>
   profession: { key: string; variant: string | null; ap: number; languageBudget: number; budgetUsed: number; budgetIncludesScripts: boolean; curseBudget: number; curseUsed: number } | null
   // null = not activated (house rule: activation costs A–D 1–4 AP); package talents are activated
   talents: Record<string, { base: number | null; value: number | null; cost: number; maximum: number }>
   techniques: Record<string, SkillRow>
   spells: Record<string, { base: number | null; value: number; cost: number; maximum: number }>
   liturgies: Record<string, { base: number | null; value: number; cost: number; maximum: number }>
   entries: Array<{ category: EntryCategory; name: string; ap: number; problems: string[] }>
   combatAbilities: Array<{ key: string; ap: number; problems: string[] }>
   granted: { advantages: string[]; disadvantages: string[]; generalSpecialAbilities: string[]; languages: string[]; combatSpecialAbilities: string[]; tricks: string[]; blessings: string[] }
   derived: Record<'health' | 'mana' | 'karma' | 'soulPower' | 'toughness' | 'dodge' | 'initiative' | 'speed' | 'fatePoints',
      { value: number; parts: Array<{ label: string; value: number }> }>
   violations: CreationIssue[]
   warnings: Array<CreationIssue & { approved: boolean }>
}
export type CreationDraft = { _id: string; step: CreationSection; data: CreationDraftData; ledger: CreationLedger; startAge: { base: number; count: number; sides: number } | null }
export type DraftSummary = { _id: string; step: CreationSection; name: string; species: string | null; culture: string | null; level: ExperienceLevel; updatedAt: string }
export type SpeciesDefinition = {
   key: string; page: number; ap: number; health: number; soulPower: number; toughness: number; speed: number
   attributeMax: Partial<Record<TalentAttribute, number>>; choice: { value: number; options: TalentAttribute[] }
   automatic: { advantages: string[]; disadvantages: string[]; advantageAp: number }; recommended: string[]; cultures: string[]
}
export type CultureDefinition = {
   key: string; page: number; species: string[]; package: { ap: number; talents: Record<string, number> }
   languages: string[]; scripts: string[]; socialStatus: string[]
   professions: { worldly: { except: string[] } | { only: string[] }; magic: string[]; divine: string[] }
}
export type TechniqueChoice = { options: string[]; count: number; value: number }
export type ProfessionVariant = {
   key: string; ap: number; talents?: Record<string, number>; techniques?: Record<string, number>; choices?: TechniqueChoice[]; specialization?: string
   addAbilities?: string[]; addCombatAbilities?: string[]; removeCombatAbilities?: string[]; cultures?: string[]; sex?: 'female'; note?: string
}
export type ProfessionDefinition = {
   key: string; group: 'worldly' | 'magic' | 'divine'; family?: string; page: number; ap: number; requiredAdvantages?: string[]; requiredSpecies?: string[]
   requiredAbilities?: string[]; requiredDisadvantages?: Array<{ key: string; level: number }>; curseBudget?: number
   languageBudget: number; budgetIncludesScripts: boolean; specialization: string | null; abilities: string[]; combatAbilities: string[]
   techniques: Record<string, number>; choices: TechniqueChoice[]; talents: Record<string, number>; variants: ProfessionVariant[]
   spells?: Record<string, number>; tricks?: { count: number; options: string[] }
   liturgies?: Record<string, number>; blessings?: 'twelve'
}
export type CreationReference = {
   experienceLevels: Array<{ level: ExperienceLevel; ap: number; attribute: number; skill: number; technique: number; attributeSum: number; spells: number; foreignSpells: number }>
   limits: { attributeStart: number; techniqueStart: number; advantageAp: number; disadvantageAp: number; leftoverAp: number }
   species: SpeciesDefinition[]
   cultures: CultureDefinition[]
   professions: ProfessionDefinition[]
   startMoney: { silver: number }
   tricks: string[]
   combatAbilities: CombatAbilityDefinition[]
   archetypes: ArchetypeSummary[]
}
export type CombatAbilityDefinition = {
   key: string; ap: number
   requirements: Array<{ attribute: TalentAttribute; minimum: number } | { talent: string; minimum: number } | { ability: string }>
}
export type ArchetypeSummary = {
   key: string; page: number; sex: 'male' | 'female'; species: string; culture: string; profession: string; variant: string | null
   attributes: Record<TalentAttribute, number>; note: string | null
}

export type StepProps = {
   data: CreationDraftData
   ledger: CreationLedger
   reference: CreationReference
   update: (change: Partial<CreationDraftData>) => void
}

// Mirror of the server's resolvedProfession (display only; the ledger is computed on the server)
export function resolvedProfession(profession: ProfessionDefinition, variantKey: string | null) {
   const variant = profession.variants.find((entry) => entry.key === variantKey) ?? null
   return {
      spells: { ...profession.spells }, tricks: profession.tricks ?? null,
      variant, ap: variant?.ap ?? profession.ap, talents: { ...profession.talents, ...variant?.talents }, techniques: { ...profession.techniques, ...variant?.techniques },
      choices: variant?.choices ?? profession.choices, specialization: variant?.specialization ?? profession.specialization,
      abilities: [...profession.abilities, ...variant?.addAbilities ?? []],
      combatAbilities: [...profession.combatAbilities.filter((key) => !variant?.removeCombatAbilities?.includes(key)), ...variant?.addCombatAbilities ?? []],
   }
}
export function usualFor(culture: CultureDefinition | undefined, profession: ProfessionDefinition) {
   if (!culture) return true
   if (profession.group === 'worldly') {
      const worldly = culture.professions.worldly
      return 'only' in worldly ? worldly.only.includes(profession.key) : !worldly.except.includes(profession.key)
   }
   return (profession.group === 'magic' ? culture.professions.magic : culture.professions.divine).includes(profession.family ?? profession.key)
}

export const creationDraftKey = (id: string) => ['creation-draft', id]
export const creationDraftsKey = ['creation-drafts']

export async function getCreationReference() {
   return (await axiosInstance.get<CreationReference>('/api/creation/reference')).data
}
export async function listCreationDrafts() {
   return (await axiosInstance.get<{ drafts: DraftSummary[] }>('/api/creation/drafts')).data.drafts
}
export async function createCreationDraft(level: ExperienceLevel = 'Erfahren', archetype?: string) {
   return (await axiosInstance.post<CreationDraft>('/api/creation/drafts', archetype ? { level, archetype } : { level })).data
}
export async function getCreationDraft(id: string) {
   return (await axiosInstance.get<CreationDraft>(`/api/creation/drafts/${id}`)).data
}
export async function saveCreationDraft(id: string, data: CreationDraftData, step: CreationSection) {
   return (await axiosInstance.put<CreationDraft>(`/api/creation/drafts/${id}`, { data, step })).data
}
export async function deleteCreationDraft(id: string) {
   await axiosInstance.delete(`/api/creation/drafts/${id}`)
}
export async function finishCreationDraft(id: string) {
   return (await axiosInstance.post<{ charId: string }>(`/api/creation/drafts/${id}/finish`)).data
}

export const useCreationReference = () => useQuery({ queryKey: ['creation-reference'], queryFn: getCreationReference, staleTime: Infinity })

// Local edits show at once; they are saved after a short pause and the server's ledger replaces the old one.
export function useCreationDraft(id: string) {
   const queryClient = useQueryClient()
   const query = useQuery({ queryKey: creationDraftKey(id), queryFn: () => getCreationDraft(id) })
   const [local, setLocal] = useState<{ data: CreationDraftData; step: CreationSection } | null>(null)
   const timer = useRef<number | undefined>(undefined)
   const save = useMutation({
      mutationFn: (next: { data: CreationDraftData; step: CreationSection }) => saveCreationDraft(id, next.data, next.step),
      onSuccess: (draft, sent) => {
         queryClient.setQueryData(creationDraftKey(id), draft)
         // The server may adjust values (talents bought before a package move with its base). Take its version of
         // every field not edited since this save; newer local edits stay and are saved next.
         setLocal((current) => {
            if (!current) return current
            const data = { ...current.data }
            for (const key of Object.keys(draft.data) as Array<keyof CreationDraftData>) {
               if (current.data[key] === sent.data[key]) Object.assign(data, { [key]: draft.data[key] })
            }
            return { ...current, data }
         })
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   useEffect(() => () => window.clearTimeout(timer.current), [])
   const draft = query.data
   const current = local ?? (draft ? { data: draft.data, step: draft.step } : null)
   function change(next: { data: CreationDraftData; step: CreationSection }, immediate = false) {
      setLocal(next)
      window.clearTimeout(timer.current)
      if (immediate) save.mutate(next)
      else timer.current = window.setTimeout(() => save.mutate(next), 350)
   }
   return {
      draft, current, isLoading: query.isPending, isError: query.isError, saving: save.isPending,
      update: (data: Partial<CreationDraftData>) => current && change({ ...current, data: { ...current.data, ...data } }),
      goTo: (step: CreationSection) => current && change({ ...current, step }, true),
   }
}

