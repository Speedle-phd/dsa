// Plant items from Archiv der Kräuter on an inventory entry: raw (picked), preserved (Haltbarmachung, AdK S. 284) or a
// product of a recipe (AdK S. 144). Days are in-game day numbers (bookRules.ts); keepsUntilDay null = no date recorded
// (the core rule applies); lasting = keeps for many years (a method of AdK S. 285–286), never spoils.
export const herbForms = ['raw', 'preserved', 'product'] as const
export type HerbItemState = { form: (typeof herbForms)[number]; obtainedDay: number | null; keepsUntilDay: number | null; lasting?: boolean }

// Stacks merge only when their plant state is the same (a fresh and an old bundle of herbs stay apart)
export function sameHerbState(a: HerbItemState | null | undefined, b: HerbItemState | null | undefined) {
   if (!a || !b) return !a && !b
   return a.form === b.form && (a.obtainedDay ?? null) === (b.obtainedDay ?? null) && (a.keepsUntilDay ?? null) === (b.keepsUntilDay ?? null)
      && Boolean(a.lasting) === Boolean(b.lasting)
}
