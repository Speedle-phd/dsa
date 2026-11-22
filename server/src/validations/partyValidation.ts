import { z } from 'zod'
import { memberVisibilities, partyStatuses } from '@/models/party.model'

export const objectId = z.string().regex(/^[a-f0-9]{24}$/, 'Invalid id')
export const inviteCode = z.string().regex(/^[A-Za-z0-9_-]{6,24}$/, 'Invalid invite code')

export const createPartySchema = z.object({ name: z.string().trim().min(1).max(80) })
export const updatePartySchema = z.object({
   name: z.string().trim().min(1).max(80).optional(),
   status: z.enum(partyStatuses).optional(),
}).refine((value) => value.name !== undefined || value.status !== undefined, { message: 'Nothing to change.' })
export const joinPartySchema = z.object({ charId: objectId })
export const memberVisibilitySchema = z.object({ visibility: z.enum(memberVisibilities) })
export const userSettingsSchema = z.object({ defaultPartyVisibility: z.enum(memberVisibilities) })
