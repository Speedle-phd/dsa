import { z } from 'zod'
import { bookRuleKeys, maxCalendarDay, type BookRuleKey } from '@/utils/bookRules'

// Any subset of the book rule switches (bookRules.ts); unknown keys are rejected
export const bookRulesSchema = z.object(
   Object.fromEntries(bookRuleKeys.map((key) => [key, z.boolean().optional()])) as Record<BookRuleKey, z.ZodOptional<z.ZodBoolean>>,
).strict()

// In-game date: set a day number, move it by days (a year at most per step), or clear it
export const calendarActionSchema = z.discriminatedUnion('action', [
   z.object({ action: z.literal('set'), day: z.number().int().min(0).max(maxCalendarDay) }),
   z.object({ action: z.literal('advance'), days: z.number().int().min(-365).max(365).refine((days) => days !== 0, 'Nothing to change.') }),
   z.object({ action: z.literal('clear') }),
])

export const partyRulesSchema = z.object({ rules: bookRulesSchema })

// A hero without a party: its own switches and date
export const bookSettingsSchema = z.object({
   rules: bookRulesSchema.optional(),
   calendar: calendarActionSchema.optional(),
}).refine((value) => value.rules !== undefined || value.calendar !== undefined, { message: 'Nothing to change.' })
