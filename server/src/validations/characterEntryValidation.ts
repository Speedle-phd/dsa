import { z } from "zod"
import { entryCategories } from "@/utils/characterEntryCatalog"

const text = z.string().trim().min(1).max(200)
export const entrySelectionSchema = z.object({
   category: z.enum(entryCategories),
   catalogKey: text,
   level: z.number().int().min(1).max(10).default(1),
   detail: z.string().trim().max(200).default(""),
   application: z.string().trim().max(200).default(""),
   potency: z.number().int().min(1).max(100).optional(),
}).strict()
export const entryPreviewSchema = entrySelectionSchema.extend({
   mode: z.enum(["record", "purchase", "creation"]).default("purchase"),
}).strict()
export const addCharacterEntrySchema = z.object({
   category: z.enum(entryCategories),
   mode: z.enum(["record", "purchase", "creation"]),
   key: text.optional(),
   selection: entrySelectionSchema.optional(),
   gmApproved: z.boolean().default(false),
}).strict().refine((value) =>
   value.selection ? value.selection.category === value.category && !value.key : value.mode === "record" && Boolean(value.key),
   { message: "Select a catalog entry or record a custom entry." })
   .refine((value) => value.category !== "disadvantages" || Boolean(value.selection),
      { message: "Disadvantages must be selected from the catalog." })
   .refine((value) => value.mode !== "creation" || value.category === "disadvantages",
      { message: "Creation AP credits are only available for disadvantages." })
export const removeCharacterEntrySchema = z.object({
   category: z.enum(entryCategories),
   key: text,
   mode: z.enum(["undo", "buyOff", "record"]).default("undo"),
   gmApproved: z.boolean().default(false),
}).strict().refine((value) => value.mode !== "buyOff" || value.category === "disadvantages",
   { message: "Only disadvantages can be bought off." })
