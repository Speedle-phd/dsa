import { describe, expect, it } from "vitest"
import { characterEntryCatalog, entryCategories, type EntrySelection } from "./characterEntryCatalog"
import { assertEntryListsPreserved, entryEffect, quoteEntry, removalDependents, selectionFromEntry, staffVolumeUsed, type EntryState } from "./characterEntryRules"
import { calcExperience } from "./baseAttributes"

function state(): EntryState {
   return {
      courage: 14, intuition: 14, fingerDexterity: 14,
      advantages: [], disadvantages: [], generalSpecialAbilities: [], languages: [], scripts: [],
      talents: [{ key: "magiekunde", value: 4 }, { key: "klettern", value: 18 }],
      combatTechniques: [{ key: "Bögen", value: 10 }], combatSpecialAbilities: [],
      entryPurchases: [], experience: { total: 1100, spent: 1000 },
   }
}
function selection(catalogKey: string, category: EntrySelection["category"] = "generalSpecialAbilities", extra: Partial<EntrySelection> = {}): EntrySelection {
   return { category, catalogKey, level: 1, detail: "", application: "", ...extra }
}

describe("Character entry catalog and advancement (S. 162–179, 215–224, 352)", () => {
   it("has unique entries and bilingual source-cited summaries for every category", () => {
      expect(new Set(characterEntryCatalog.map((item) => `${item.category}:${item.key}`)).size).toBe(characterEntryCatalog.length)
      for (const category of entryCategories) expect(characterEntryCatalog.some((item) => item.category === category)).toBe(true)
      for (const entry of characterEntryCatalog) {
         expect(entry.effect.de.length).toBeGreaterThan(5)
         expect(entry.effect.en.length).toBeGreaterThan(5)
         // Regelwerk entries from S. 163; Archiv der Kräuter's entries cite its recipe and rule pages (S. 148–297)
         expect(entry.effect.page).toBeGreaterThanOrEqual(entry.effect.book === "AdK" ? 144 : 163)
      }
   })
   it("adds Archiv der Kräuter's alchemical recipes as Berufsgeheimnisse (AdK S. 159–178)", () => {
      const secret = characterEntryCatalog.find((item) => item.key === "Berufsgeheimnis (Unverwundbarkeitselixier)")
      expect(secret).toMatchObject({ ap: 8, book: "AdK", requirements: [{ talent: "alchimie", minimum: 12 }], effect: { page: 171, book: "AdK" } })
      // 56 alchemical recipes, Liebesküchlein (S. 148) and the Alchimistische Äquivalenzlehre (S. 297)
      expect(characterEntryCatalog.filter((item) => item.book === "AdK")).toHaveLength(58)
   })
   it("Alchimistische Äquivalenzlehre needs Alchimie 10 and two of five lore talents at 10 (AdK S. 297)", () => {
      const hero = state()
      const set = (key: string, value: number) => {
         const existing = hero.talents.find((entry) => entry.key === key)
         if (existing) existing.value = value
         else hero.talents.push({ key, value })
      }
      set("alchimie", 10)
      set("magiekunde", 10)
      expect(quoteEntry(hero, selection("Alchimistische Äquivalenzlehre")).problems.length).toBeGreaterThan(0)
      set("sternkunde", 10)
      expect(quoteEntry(hero, selection("Alchimistische Äquivalenzlehre"))).toMatchObject({ ap: 15, problems: [] })
   })
   it("quotes Analytiker at 5 AP and requires Magiekunde 4 (S. 215)", () => {
      const hero = state()
      expect(quoteEntry(hero, selection("Analytiker"))).toMatchObject({ ap: 5, problems: [] })
      hero.talents[0].value = 3
      expect(quoteEntry(hero, selection("Analytiker")).problems).toContain("magiekunde FW 4")
   })
   it("quotes languages at 2 AP per level and requires the previous level (S. 219)", () => {
      const hero = state()
      expect(quoteEntry(hero, selection("Garethi", "languages")).ap).toBe(2)
      expect(quoteEntry(hero, selection("Garethi", "languages", { level: 2 })).problems).toContain("Record or purchase the previous level first.")
      hero.languages = ["Garethi I"]
      expect(quoteEntry(hero, selection("Garethi", "languages", { level: 2 })).problems).toEqual([])
      hero.languages.push("Garethi III")
      expect(quoteEntry(hero, selection("Garethi", "languages", { level: 2 })).problems).toContain("Already recorded at this or a higher level.")
   })
   it("does not guess a language level from an old unlevelled entry (S. 220)", () => {
      const hero = state()
      hero.languages = ["Garethi"]
      expect(selectionFromEntry("languages", "Garethi")).toBeUndefined()
      expect(entryEffect("languages", "Garethi")?.page).toBe(220)
      expect(quoteEntry(hero, selection("Kusliker Zeichen", "scripts")).problems).toContain("A matching language with an explicit level is required.")
   })
   it("enforces Ogrisch/Oloarkh ceilings and elven speech prerequisites (S. 223)", () => {
      expect(() => quoteEntry(state(), selection("Ogrisch", "languages", { level: 3 }))).toThrow("valid entry level")
      const hero = state()
      hero.languages = ["Isdira II"]
      expect(quoteEntry(hero, selection("Isdira", "languages", { level: 3 })).problems).toContain("Zweistimmiger Gesang required for level III.")
      hero.advantages = ["Zweistimmiger Gesang"]
      expect(quoteEntry(hero, selection("Isdira", "languages", { level: 3 })).problems).toEqual([])
   })
   it("quotes exact script costs and rejects missing languages or Blind (S. 219, 224)", () => {
      const hero = state()
      hero.languages = ["Rssahh I"]
      expect(quoteEntry(hero, selection("Chrmk", "scripts"))).toMatchObject({ ap: 4, problems: [] })
      hero.disadvantages = ["Blind"]
      expect(quoteEntry(hero, selection("Chrmk", "scripts")).problems).toContain("Nicht / not: Blind")
      hero.disadvantages = []
      hero.languages = ["Garethi III"]
      expect(quoteEntry(hero, selection("Trollische Raumbilderschrift", "scripts")).ap).toBe(6)
      expect(quoteEntry(hero, selection("Trollische Raumbilderschrift", "scripts")).problems.length).toBeGreaterThan(0)
   })
   it("checks skill-dependent trait costs and mutual exclusion (S. 164, 166, 178)", () => {
      const hero = state()
      const chosen = selection("Begabung", "advantages", { detail: "klettern" })
      expect(quoteEntry(hero, chosen).ap).toBe(12)
      hero.disadvantages = ["Unfähig (klettern)"]
      expect(quoteEntry(hero, chosen).problems).toContain("Unfähig in the same talent.")
      expect(quoteEntry(hero, selection("Herausragende Kampftechnik", "advantages", { detail: "Bögen" })).ap).toBe(12)
      expect(quoteEntry(hero, selection("Waffenbegabung", "advantages", { detail: "Bögen" })).ap).toBe(10)
   })
   it("counts repeated outstanding-skill selections correctly (S. 166)", () => {
      const hero = state()
      hero.advantages = ["Herausragende Fertigkeit (klettern) II", "Herausragende Fertigkeit (magiekunde) II"]
      expect(quoteEntry(hero, selection("Herausragende Fertigkeit", "advantages", { detail: "reiten" })).problems).toContain("Maximum 4 selections reached.")
   })
   it("quotes specialization ordinal costs with FW 6/12/18 and a three-per-talent limit (S. 216)", () => {
      const hero = state()
      const chosen = selection("Fertigkeitsspezialisierung", "generalSpecialAbilities", { detail: "klettern", application: "Fassaden" })
      expect(quoteEntry(hero, chosen).ap).toBe(2)
      hero.generalSpecialAbilities = ["Fertigkeitsspezialisierung (klettern: Bäume)"]
      expect(quoteEntry(hero, chosen).ap).toBe(4)
      hero.generalSpecialAbilities.push("Fertigkeitsspezialisierung (klettern: Felsen)")
      expect(quoteEntry(hero, chosen).ap).toBe(6)
      hero.talents[1].value = 17
      expect(quoteEntry(hero, chosen).problems).toContain("Specializations require FW 6/12/18; maximum three per talent.")
   })
   it("requires a teacher for professional secrets and summed skill values for instruments (S. 215, 218)", () => {
      const hero = state()
      hero.talents.push({ key: "alchimie", value: 2 }, { key: "holzbearbeitung", value: 5 }, { key: "metallbearbeitung", value: 7 })
      expect(quoteEntry(hero, selection("Berufsgeheimnis (Heiltrank)"))).toMatchObject({ ap: 4, problems: [] })
      expect(quoteEntry(hero, selection("Berufsgeheimnis (Heiltrank)")).approval).not.toBeNull()
      expect(quoteEntry(hero, selection("Instrumente bauen")).problems).toEqual([])
   })
   it("rejects unverified/custom purchases, invalid subjects and malformed levels", () => {
      expect(() => quoteEntry(state(), selection("Invented"))).toThrow("verified catalog")
      expect(() => quoteEntry(state(), selection("Begabung", "advantages", { detail: "Invented" }))).toThrow("known talent")
      expect(() => quoteEntry(state(), selection("Garethi", "languages", { level: 0 }))).toThrow("valid entry level")
      expect(() => quoteEntry(state(), selection("Analytiker", "generalSpecialAbilities", { detail: "unexpected" }))).toThrow("required specialization")
   })
   it("does not permit later purchase of Zauberer or start-money benefits (S. 168, 170)", () => {
      for (const key of ["Zauberer", "Reich"]) expect(quoteEntry(state(), selection(key, "advantages")).problems).toContain("Creation-only: record the existing entry instead of purchasing it during play.")
   })
   it("checks poison/disease source levels and normal rounding (S. 17, 167)", () => {
      const chosen = selection("Immunität gegen Gift", "advantages", { detail: "Example", potency: 5 })
      expect(quoteEntry(state(), chosen).ap).toBe(3)
      expect(() => quoteEntry(state(), { ...chosen, potency: 0 })).toThrow("verified poison/disease level")
   })
   it("blocks removing prerequisites across lists and levels, but not unrelated existing failures", () => {
      const hero = state()
      hero.advantages = ["Zauberer", "Zweistimmiger Gesang"]
      hero.generalSpecialAbilities = ["Falschspielen"]
      hero.languages = ["Garethi I", "Garethi II", "Isdira III"]
      hero.scripts = ["Kusliker Zeichen"]
      expect(removalDependents(hero, "languages", "Garethi I")).toContain("Garethi II")
      expect(removalDependents(hero, "languages", "Garethi II")).toEqual([])
      expect(removalDependents(hero, "advantages", "Zweistimmiger Gesang")).toContain("Isdira III")
      hero.generalSpecialAbilities.push("Berufsgeheimnis (Drehleier)", "Instrumente bauen")
      expect(removalDependents(hero, "generalSpecialAbilities", "Instrumente bauen")).toContain("Berufsgeheimnis (Drehleier)")
   })
   it("keeps a script if an alternative matching language remains", () => {
      const hero = state()
      hero.languages = ["Garethi III", "Bosparano II"]
      hero.scripts = ["Kusliker Zeichen"]
      expect(removalDependents(hero, "languages", "Garethi III")).toEqual([])
      hero.languages = ["Garethi III"]
      expect(removalDependents(hero, "languages", "Garethi III")).toEqual(["Kusliker Zeichen"])
   })
   it("prevents bulk editors from dropping purchase tracking or prerequisites", () => {
      const hero = state()
      hero.generalSpecialAbilities = ["Analytiker"]
      hero.entryPurchases = [{ ...selection("Analytiker"), key: "Analytiker", ap: 5 }]
      expect(() => assertEntryListsPreserved(hero, { generalSpecialAbilities: [] })).toThrow("tracked purchases")
      expect(() => assertEntryListsPreserved(hero, { generalSpecialAbilities: ["Analytiker", "Custom"] })).not.toThrow()
   })
   it("ignores unrelated fields in a complete initial-sheet update", () => {
      const payload = { advantages: [], courage: 14, experience: { gathered: 10, spent: 5 } }
      expect(() => assertEntryListsPreserved(state(), payload)).not.toThrow()
   })
   it("cannot bulk-remove two alternative languages and leave their script without a prerequisite (S. 219)", () => {
      const hero = state()
      hero.languages = ["Garethi III", "Bosparano III"]
      hero.scripts = ["Kusliker Zeichen"]
      expect(() => assertEntryListsPreserved(hero, { languages: [] })).toThrow("dependent")
      expect(hero.languages).toHaveLength(2)
   })
   it("checks writing proficiency and protects the last qualifying language/script pair (S. 219)", () => {
      const hero = state()
      const chosen = selection("Schriftstellerei (Fachpublikationen)", "generalSpecialAbilities", { detail: "magiekunde" })
      expect(quoteEntry(hero, chosen).problems).toContain("A level III language and its matching script are required.")
      hero.languages = ["Garethi III"]
      hero.scripts = ["Kusliker Zeichen"]
      expect(quoteEntry(hero, chosen).problems).toEqual([])
      hero.generalSpecialAbilities = ["Schriftstellerei (Fachpublikationen) (magiekunde)"]
      expect(removalDependents(hero, "scripts", "Kusliker Zeichen")).toEqual(hero.generalSpecialAbilities)
      expect(() => quoteEntry(hero, { ...chosen, detail: "klettern" })).toThrow("listed specialization")
   })
})

describe("Magical and divine acquisition (S. 172, 275–285, 317–321)", () => {
   it("checks attributes and caster status at their boundaries (S. 284–285, 321)", () => {
      const hero = state()
      hero.advantages = ["Zauberer", "Geweihter"]
      expect(quoteEntry(hero, selection("Aura verbergen"))).toMatchObject({ ap: 20, problems: [] })
      hero.courage = 12
      expect(quoteEntry(hero, selection("Aura verbergen")).problems).toContain("MU 13")
      expect(quoteEntry(hero, selection("Fokussierung")).problems).toContain("MU 13")
      hero.courage = 13
      expect(quoteEntry(hero, selection("Fokussierung"))).toMatchObject({ ap: 8, problems: [] })
      hero.advantages = []
      expect(quoteEntry(hero, selection("Starke Zaubertricks")).problems).toContain("Zauberer")
   })

   describe("Disadvantage creation credits and catalog names (S. 39, 46, 177)", () => {
      it("quotes Goldgier at +5 AP and a newly selected Pech III at +60 AP", () => {
         expect(quoteEntry(state(), selection("Schlechte Eigenschaft (Goldgier)", "disadvantages"), "creation"))
            .toMatchObject({ key: "Schlechte Eigenschaft (Goldgier)", ap: 5, problems: [] })
         expect(quoteEntry(state(), selection("Pech", "disadvantages", { level: 3 }), "creation").ap).toBe(60)
      })
      it("credits only the new levels and counts the highest tier once", () => {
         const hero = state()
         hero.disadvantages = ["Pech I", "Pech II"]
         expect(quoteEntry(hero, selection("Pech", "disadvantages", { level: 3 }), "creation"))
            .toMatchObject({ ap: 20, problems: [] })
      })
      it("grants principles/obligations AP only for the highest level, across different subjects (S. 175, 179)", () => {
         for (const key of ["Prinzipientreue", "Verpflichtungen"]) {
            const hero = state()
            hero.disadvantages = [`${key} (Subject A) II`]
            expect(quoteEntry(hero, selection(key, "disadvantages", { detail: "Subject B", level: 2 }), "creation").ap).toBe(0)
            expect(quoteEntry(hero, selection(key, "disadvantages", { detail: "Subject B", level: 3 }), "creation").ap).toBe(10)
         }
      })
      it("accepts exactly 80 AP and rejects more", () => {
         const hero = state()
         hero.disadvantages = ["Blind"]
         expect(quoteEntry(hero, selection("Niedrige Seelenkraft", "disadvantages"), "creation").problems).toEqual([])
         hero.disadvantages.push("Niedrige Seelenkraft")
         expect(quoteEntry(hero, selection("Schlechte Eigenschaft (Goldgier)", "disadvantages"), "creation").problems).toEqual([])
         hero.disadvantages.push("Schlechte Eigenschaft (Goldgier)")
         expect(quoteEntry(hero, selection("Hitzeempfindlich", "disadvantages"), "creation").problems)
            .toContain("Disadvantages at character creation may grant at most 80 AP.")
         expect(() => quoteEntry(hero, selection("Zeitgefühl", "advantages"), "creation")).toThrow("only available for disadvantages")
      })
      it("recognizes legacy Goldgier without allowing a duplicate creation credit", () => {
         const hero = state()
         hero.disadvantages = ["Goldgier"]
         expect(selectionFromEntry("disadvantages", "Goldgier")?.catalogKey).toBe("Schlechte Eigenschaft (Goldgier)")
         expect(entryEffect("disadvantages", "Goldgier")?.page).toBe(177)
         expect(quoteEntry(hero, selection("Schlechte Eigenschaft (Goldgier)", "disadvantages"), "creation").problems)
            .toContain("Already recorded at this or a higher level.")
      })
      it("counts talent-dependent disadvantage credits toward the cap (S. 178)", () => {
         const hero = state()
         hero.disadvantages = ["Blind", "Niedrige Seelenkraft", "Unfähig (magiekunde)"]
         expect(quoteEntry(hero, selection("Hitzeempfindlich", "disadvantages"), "creation").problems)
            .toContain("Disadvantages at character creation may grant at most 80 AP.")
      })
      it("does not fabricate a creation-credit value for an unknown existing disadvantage", () => {
         const hero = state()
         hero.disadvantages = ["Unknown"]
         expect(quoteEntry(hero, selection("Schlechte Eigenschaft (Goldgier)", "disadvantages"), "creation").problems)
            .toContain("Unknown existing disadvantage: resolve its catalog entry before granting creation AP.")
      })
      it("preserves creation credit when adventure AP are added, without mixing it into gained AP", () => {
         expect(calcExperience({ experience: { base: 1100, gathered: 10, total: 1115, disadvantageCredit: 5 } }, 20))
            .toEqual({ totalExperience: 1135, experienceGained: 30 })
         expect(calcExperience({ experience: { base: 1100, gathered: 10, total: 1110 } }, 20))
            .toEqual({ totalExperience: 1130, experienceGained: 30 })
      })
   })
   it("quotes property/aspect selections at the printed ordinal costs (S. 285, 321)", () => {
      const hero = state()
      hero.advantages = ["Zauberer", "Geweihter"]
      for (const [key, costs] of [["Merkmalskenntnis", [10, 20, 40]], ["Aspektkenntnis", [15, 25, 45]]] as const) {
         hero.generalSpecialAbilities = []
         for (let index = 0; index < 3; index++) {
            const detail = key === "Merkmalskenntnis" ? ["Einfluss", "Heilung", "Objekt"][index] : `Subject ${index}`
            const quote = quoteEntry(hero, selection(key, "generalSpecialAbilities", { detail }))
            expect(quote.ap).toBe(costs[index])
            expect(quote.approval).not.toBeNull()
            hero.generalSpecialAbilities.push(quote.key)
         }
         expect(quoteEntry(hero, selection(key, "generalSpecialAbilities", { detail: key === "Merkmalskenntnis" ? "Telekinese" : "Fourth" })).problems)
            .toContain("All priced selections are already recorded; further selections require a verified expansion rule.")
      }
   })
   it("accepts only the listed Merkmale for Merkmalskenntnis and Merkmalsfokus (S. 252, 277, 285)", () => {
      const hero = state()
      hero.advantages = ["Zauberer"]
      for (const key of ["Merkmalskenntnis", "Merkmalsfokus"]) {
         expect(() => quoteEntry(hero, selection(key, "generalSpecialAbilities", { detail: "telekinese" }))).toThrow("Choose a listed specialization.")
         expect(quoteEntry(hero, selection(key, "generalSpecialAbilities", { detail: "Telekinese" })).key).toBe(`${key} (Telekinese)`)
      }
   })
   it("protects later ordinal purchases and matching staff prerequisites (S. 277, 285)", () => {
      const hero = state()
      hero.generalSpecialAbilities = ["Merkmalskenntnis (Feuer)", "Merkmalskenntnis (Heilung)", "Merkmalsfokus (Feuer)"]
      hero.entryPurchases = [
         { ...selection("Merkmalskenntnis", "generalSpecialAbilities", { detail: "Feuer" }), key: "Merkmalskenntnis (Feuer)", ap: 10 },
         { ...selection("Merkmalskenntnis", "generalSpecialAbilities", { detail: "Heilung" }), key: "Merkmalskenntnis (Heilung)", ap: 20 },
      ]
      expect(removalDependents(hero, "generalSpecialAbilities", "Merkmalskenntnis (Feuer)"))
         .toEqual(["Merkmalskenntnis (Heilung)", "Merkmalsfokus (Feuer)"])
      expect(removalDependents(hero, "generalSpecialAbilities", "Merkmalskenntnis (Heilung)")).toEqual([])
   })
   it("allows buying the staff binding; the controller books the 2 permanent AsP (S. 276)", () => {
      const hero = state()
      hero.advantages = ["Zauberer"]
      hero.generalSpecialAbilities = ["Tradition (Gildenmagier)"]
      expect(quoteEntry(hero, selection("Bindung des Stabes")).problems).toEqual([])
   })
   it("limits staff spells to 18 volume points (S. 276)", () => {
      const hero = state()
      hero.advantages = ["Zauberer"]
      hero.generalSpecialAbilities = ["Tradition (Gildenmagier)", "Bindung des Stabes", "Kraftfokus", "Ewige Flamme", "Flammenschwert"]
      expect(staffVolumeUsed(hero.generalSpecialAbilities)).toBe(15)
      expect(quoteEntry(hero, selection("Stab-Apport")).problems).toEqual([])
      expect(quoteEntry(hero, selection("Doppeltes Maß")).problems).toEqual([])
      hero.generalSpecialAbilities.push("Stab-Apport")
      expect(quoteEntry(hero, selection("Doppeltes Maß")).problems).toContain("Staff volume: 18 + 2 exceeds 18 (S. 276).")
   })
   it("needs the witch tradition for Flugsalbe and keeps elven songs with the elven tradition (S. 281, 283)", () => {
      const hero = state()
      hero.advantages = ["Zauberer"]
      expect(quoteEntry(hero, selection("Flugsalbe")).problems).toContain("Tradition (Hexe)")
      hero.generalSpecialAbilities = ["Tradition (Elf)"]
      hero.spells = [{ key: "Friedenslied", value: 4, notes: "", paidAP: 0 }]
      expect(removalDependents(hero, "generalSpecialAbilities", "Tradition (Elf)")).toContain("Friedenslied")
   })
   it("groups special abilities for the Overview and the Arcana sections (S. 214, 274–285)", () => {
      const group = (key: string) => characterEntryCatalog.find((entry) => entry.category === "generalSpecialAbilities" && entry.key === key)?.group
      expect([group("Fallen entschärfen"), group("Wachsamkeit"), group("Tradition (Hexe)"), group("Kraftfokus"), group("Flugsalbe"),
         group("Verbotene Pforten"), group("Fokussierung"), group("Tradition (Praioskirche)")])
         .toEqual(["general", "fate", "tradition", "staff", "witch", "magic", "karma", "karma"])
   })
   it("checks divine traditions, moral codes and their removal (S. 317–320)", () => {
      const hero = state()
      hero.advantages = ["Geweihter"]
      expect(quoteEntry(hero, selection("Tradition (Perainekirche)")).problems).toContain("Prinzipientreue")
      hero.disadvantages = ["Prinzipientreue I"]
      expect(quoteEntry(hero, selection("Tradition (Perainekirche)"))).toMatchObject({ ap: 110 })
      hero.generalSpecialAbilities = ["Tradition (Perainekirche)"]
      expect(quoteEntry(hero, selection("Tradition (Boronkirche)")).problems).toContain("Only one divine tradition is allowed.")
      expect(removalDependents(hero, "disadvantages", "Prinzipientreue I")).toEqual(["Tradition (Perainekirche)"])
   })
})
