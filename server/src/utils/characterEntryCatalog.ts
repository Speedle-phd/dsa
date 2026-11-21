import { talentCatalog } from "./talentCatalog"
import { combatTechniques } from "./combatRules"
import { spellProperties } from "./magicCatalog"
import { entrySuggestions, type EntrySuggestion } from "./entrySuggestions"

export const entryCategories = ["advantages", "disadvantages", "generalSpecialAbilities", "languages", "scripts"] as const
export type EntryCategory = typeof entryCategories[number]
export type EntrySelection = { category: EntryCategory; catalogKey: string; level: number; detail: string; application: string; potency?: number }
export type EntryPurchase = EntrySelection & { key: string; ap: number }
export type EntryCredit = { key: string; ap: number }
export type EntryMode = "record" | "purchase" | "creation"
export type EntryEffect = { de: string; en: string; page: number }
export type EntryRequirement =
   | { talent: string; minimum: number }
   | { attribute: "courage" | "intuition" | "fingerDexterity"; minimum: number }
   | { entry: string; category: EntryCategory }
   | { absent: string; category: EntryCategory }
   | { sum: string[]; minimum: number }
   | { ranged: number }
   | { writing: true }
// Where a special ability is listed: Overview (general, fate, karma) or the Arcana sections (S. 214, 274–285).
export type EntryGroup = "general" | "fate" | "magic" | "tradition" | "staff" | "witch" | "karma"
export type CatalogEntry = {
   key: string
   group?: EntryGroup
   category: EntryCategory
   ap: number
   levels?: number
   parameter?: "talent" | "technique" | "text" | "immunity" | "specialization"
   choices?: string[]
   factor?: number
   maximum?: number
   ordinalCosts?: number[]
   requirements: EntryRequirement[]
   approval?: { de: string; en: string }
   creationOnly?: boolean
   recordOnly?: boolean
   creditHighestOnly?: boolean
   // Free-text subjects: the book's examples to pick from (entrySuggestions.ts)
   suggestions?: EntrySuggestion[]
   effect: EntryEffect
}

const entries: CatalogEntry[] = []
const talent = (key: string, minimum: number): EntryRequirement => ({ talent: key, minimum })
const needs = (entry: string, category: EntryCategory = "advantages"): EntryRequirement => ({ entry, category })
const excludes = (absent: string, category: EntryCategory = "disadvantages"): EntryRequirement => ({ absent, category })
const approval = (de: string, en: string) => ({ de, en })
function add(category: EntryCategory, key: string, ap: number, page: number, de: string, en: string,
   options: Partial<Omit<CatalogEntry, "key" | "category" | "ap" | "effect">> = {}) {
   entries.push({ key, category, ap, effect: { page, de, en }, requirements: [], ...options })
}
const advantage = (key: string, ap: number, page: number, de: string, en: string, options: Parameters<typeof add>[6] = {}) =>
   add("advantages", key, ap, page, de, en, options)
const disadvantage = (key: string, ap: number, page: number, de: string, en: string, options: Parameters<typeof add>[6] = {}) =>
   add("disadvantages", key, ap, page, de, en, options)
const ability = (key: string, ap: number, page: number, de: string, en: string, options: Parameters<typeof add>[6] = {}) =>
   add("generalSpecialAbilities", key, ap, page, de, en, options)
const exclusive = approval("Nur bei automatischer oder empfohlener Wahl durch Spezies, Kultur oder Profession.", "Must be automatic or recommended by species, culture or profession.")

// source: DSA5 Regelwerk, S. 163–170 (original, concise effect summaries)
advantage("Adel", 5, 163, "Adelsprivilegien; der Meister kann Erleichterungen gegenüber Rangniedrigeren gewähren.", "Noble privileges; the GM may grant bonuses when dealing with lower ranks.", { levels: 3, approval: approval("Die Kultur muss passenden Adel besitzen.", "The culture must have an appropriate nobility.") })
advantage("Altersresistenz", 5, 163, "Keine negativen natürlichen oder magischen Alterungseffekte.", "Immune to negative natural and magical aging effects.", { approval: exclusive })
advantage("Angenehmer Geruch", 6, 163, "Betören (Anbändeln, Liebeskünste) +1 innerhalb von 1 Schritt.", "+1 to Betören (Anbändeln, Liebeskünste) within 1 Schritt.")
advantage("Begabung", 0, 164, "Bei Fertigkeitsproben einen W20 wiederholen, besseres Ergebnis behalten; nicht bei Doppel-/Dreifach-20. Maximal drei Begabungen.", "Reroll one d20 in a skill check and keep the better result; not on double/triple 20. Maximum three aptitudes.", { parameter: "talent", factor: 6, maximum: 3 })
advantage("Beidhändig", 15, 164, "Keine Abzüge durch die falsche Hand, auch beim Führen einer Waffe.", "No off-hand penalties, including when wielding a weapon.")
advantage("Dunkelsicht", 10, 164, "I: Dunkelheitsabzüge eine Stufe geringer; II: keine. Vollständige Finsternis bleibt unverändert.", "I reduces darkness penalties by one level; II ignores them. Neither helps in total darkness.", { levels: 2, approval: exclusive, requirements: [excludes("Nachtblind")] })
advantage("Eisenaffine Aura", 15, 164, "Bann des Eisens erst je volle 4 statt 2 Stein Metallgewicht.", "Iron-ban penalties apply per full 4 rather than 2 Stein of metal.", { requirements: [needs("Zauberer")] })
advantage("Entfernungssinn", 10, 164, "Schusswaffen auf Entfernung Weit: nur −1 statt −2; Entfernungsschätzung bis 200 Schritt.", "Shooting weapons at long range: −1 instead of −2; distance estimates within 200 Schritt.", { requirements: [excludes("Blind"), excludes("Farbenblind"), excludes("Eingeschränkter Sinn (Sicht)"), excludes("Verstümmelt (Einäugig)")] })
advantage("Flink", 8, 165, "GS-Grundwert +1.", "Movement base +1.", { requirements: [excludes("Behäbig"), excludes("Fettleibig"), excludes("Verstümmelt (Einbeinig)")] })
advantage("Fuchssinn", 15, 165, "Sinnesschärfe erhält Fuchssinn zum Erspüren sonst nicht wahrnehmbarer Fallen in 10 Schritt.", "Unlocks Fuchssinn in Sinnesschärfe to sense otherwise undetectable traps within 10 Schritt.")
advantage("Geborener Redner", 4, 165, "Bekehren & Überzeugen (öffentliche Rede) +1.", "+1 to Bekehren & Überzeugen (öffentliche Rede).", { requirements: [excludes("Stumm")] })
advantage("Geweihter", 25, 165, "20 KaP Grundwert; passende geweihte Tradition separat erwerben. Nur eine geweihte Tradition.", "20 base KaP; purchase the appropriate divine tradition separately. Only one divine tradition.", { approval: approval("Weihe und passende Tradition mit dem Meister abstimmen.", "Confirm ordination and an appropriate tradition with the GM.") })
advantage("Giftresistenz", 10, 165, "Gegen Gifte SK und ZK +1 je Stufe.", "SK and ZK +1 per level against poisons.", { levels: 2, requirements: [excludes("Giftanfällig")] })
advantage("Glück", 30, 165, "Schicksalspunkte-Maximum +1 je Stufe; bei Spielbeginn auch den Vorrat erhöhen.", "Fate-point maximum +1 per level; also increases the initial pool.", { levels: 3, requirements: [excludes("Pech")] })
advantage("Gutaussehend", 20, 165, "Je Stufe +1 auf Betören (Anbändeln, Liebeskünste), Überreden (Aufschwatzen, Herausreden, Manipulieren, Schmeicheln), Handel (Feilschen).", "+1 per level to the listed attraction, persuasion and bargaining applications.", { levels: 2, requirements: [excludes("Hässlich")] })
advantage("Herausragende Fertigkeit", 0, 166, "Fertigkeitsmaximum +1 pro Wahl, keine zusätzlichen FP; maximal vier Wahlen, davon zwei je Fertigkeit.", "Skill maximum +1 per selection, no extra skill points; at most four selections, two per skill.", { parameter: "talent", factor: 2, levels: 2, maximum: 4 })
advantage("Herausragende Kampftechnik", 0, 166, "KtW-Maximum +1, kein zusätzlicher KtP; maximal zwei verschiedene Techniken.", "Combat-technique maximum +1, no extra technique point; at most two different techniques.", { parameter: "technique", factor: 4, maximum: 2 })
for (const [sense, ap] of [["Sicht", 12], ["Gehör", 12], ["Geruch & Geschmack", 6], ["Tastsinn", 2]] as const) {
   advantage(`Herausragender Sinn (${sense})`, ap, 166, `Sinnesschärfe (${sense}) +1.`, `+1 to Sinnesschärfe using ${sense}.`, { requirements: [excludes(`Eingeschränkter Sinn (${sense})`), ...(sense === "Sicht" ? [excludes("Blind")] : sense === "Gehör" ? [excludes("Taub")] : [])] })
}
advantage("Hitzeresistenz", 5, 166, "Hitzestufe −1, Minimum Stufe 1.", "Heat level −1, minimum level 1.", { requirements: [excludes("Hitzeempfindlich")] })
for (const [resource, prerequisite] of [["Astralkraft", "Zauberer"], ["Karmalkraft", "Geweihter"], ["Lebenskraft", ""]] as const) {
   advantage(`Hohe ${resource}`, 6, 166, "Energie-Grundwert +1 je Stufe.", "Energy base +1 per level.", { levels: 7, requirements: [excludes(`Niedrige ${resource}`), ...(prerequisite ? [needs(prerequisite)] : [])] })
}
advantage("Hohe Seelenkraft", 25, 166, "SK-Grundwert +1.", "SK base +1.", { requirements: [excludes("Niedrige Seelenkraft")] })
advantage("Hohe Zähigkeit", 25, 167, "ZK-Grundwert +1.", "ZK base +1.", { requirements: [excludes("Niedrige Zähigkeit")] })
for (const kind of ["Gift", "Krankheit"]) {
   advantage(`Immunität gegen ${kind}`, 0, 167, `Keine Wirkung des gewählten ${kind === "Gift" ? "Gifts" : "Krankheitserregers"}; AP: halbe Stufe.`, `Immune to the selected ${kind === "Gift" ? "poison" : "disease"}; AP equals half its level.`, { parameter: "immunity", approval: approval("Art und Stufe anhand der Quelle bestätigen.", "Confirm the specific poison/disease and its source level.") })
}
advantage("Kälteresistenz", 5, 167, "Kältestufe −1, Minimum 0.", "Cold level −1, minimum zero.", { requirements: [excludes("Kälteempfindlich")] })
advantage("Krankheitsresistenz", 10, 167, "Gegen Krankheiten SK und ZK +1 je Stufe.", "SK and ZK +1 per level against diseases.", { levels: 2, requirements: [excludes("Krankheitsanfällig")] })
advantage("Magische Einstimmung", 40, 167, "Magische Fertigkeitsproben in der gewählten Umgebung +1.", "Magic skill checks +1 in the selected environment.", { parameter: "text", requirements: [needs("Zauberer")], approval: approval("Umgebung und Kampagnenrelevanz bestätigen; keine Einschränkung für dieselbe Umgebung.", "Confirm environment and campaign relevance; no restriction for the same environment.") })
advantage("Mystiker", 20, 167, "Entrückung sinkt erst nach zwei Stunden je Stufe.", "Rapture decreases by one level every two hours.", { requirements: [needs("Geweihter"), excludes("Pragmatiker", "advantages")] })
advantage("Nichtschläfer", 8, 168, "Bis zu einer Woche wach bleiben; Schlaf nachholen. Ohne Schlaf keine gewöhnliche Regeneration.", "Stay awake for up to a week, then catch up on sleep. No ordinary regeneration while awake.", { approval: exclusive })
advantage("Pragmatiker", 10, 168, "Entrückung sinkt schon nach einer halben Stunde je Stufe.", "Rapture decreases by one level every half hour.", { requirements: [needs("Geweihter"), excludes("Mystiker", "advantages")] })
advantage("Reich", 1, 168, "Bei Erschaffung +250 Silbertaler je Stufe, kein laufendes Einkommen.", "+250 Silbertaler per level at creation, not ongoing income.", { levels: 10, creationOnly: true, requirements: [excludes("Arm")] })
advantage("Richtungssinn", 10, 168, "Orientierung +1.", "+1 to Orientierung.", { requirements: [excludes("Unfähig (orientierung)")] })
advantage("Schlangenmensch", 6, 168, "Körperbeherrschung (Akrobatik, Entwinden) +1.", "+1 to Körperbeherrschung (Akrobatik, Entwinden).")
advantage("Schwer zu verzaubern", 15, 168, "Betreffende Zauber gegen den Helden −1, auch erwünschte: Einfluss, Heilung, Hellsicht, Verwandlung oder SK/ZK-modifiziert.", "Relevant spells targeting you suffer −1, even beneficial ones: influence, healing, clairvoyance, transformation or SK/ZK-modified spells.", { approval: exclusive, requirements: [excludes("Zauberanfällig")] })
advantage("Soziale Anpassungsfähigkeit", 10, 168, "Standesbedingte Abzüge auf Gesellschaftstalente ignorieren, nicht beim Hochadel.", "Ignore social-status penalties to social skills, except when dealing with high nobility.", { requirements: [excludes("Unfrei")], approval: approval("Keine Unfähigkeit in einem Gesellschaftstalent.", "No inability in a social talent.") })
advantage("Unscheinbar", 4, 169, "Gassenwissen (Beschatten) +1.", "+1 to Gassenwissen (Beschatten).")
for (const [resource, prerequisite] of [["Astralenergie", "Zauberer"], ["Karmaenergie", "Geweihter"], ["Lebensenergie", ""]] as const) {
   advantage(`Verbesserte Regeneration (${resource})`, 10, 169, "Bei Regeneration +1 Energiepunkt je Stufe.", "+1 energy point per level when regenerating.", { levels: 3, requirements: [excludes(`Schlechte Regeneration (${resource})`), ...(prerequisite ? [needs(prerequisite)] : [])] })
}
advantage("Verhüllte Aura", 20, 169, "Ungerichtete Wahrnehmung erkennt keine Magie; gezielte magische Erkennung/Analyse −3.", "Untargeted perception sees no magic; targeted magical detection/analysis suffers −3.", { requirements: [needs("Zauberer")] })
advantage("Vertrauenerweckend", 25, 169, "Passende Anwendungen von Bekehren & Überzeugen, Überreden und Handel +1.", "+1 to the relevant conversational, persuasion and bargaining applications.", { approval: approval("Keine Unfähigkeit in einem Gesellschaftstalent.", "No inability in a social talent.") })
advantage("Waffenbegabung", 0, 169, "Bestätigungswurf für kritischen Erfolg oder Patzer der gewählten Kampftechnik wiederholen.", "Reroll critical-success or fumble confirmation for the selected combat technique.", { parameter: "technique", factor: 5 })
advantage("Wohlklang", 5, 169, "Singen +1.", "+1 to Singen.", { requirements: [excludes("Stumm")] })
advantage("Zäher Hund", 20, 169, "Schmerzabzüge wirken eine Stufe niedriger; Schmerz IV bleibt handlungsunfähig.", "Treat pain penalties as one level lower; pain IV still incapacitates.", { requirements: [excludes("Zerbrechlich")] })
advantage("Zauberer", 25, 170, "20 AsP Grundwert; Tradition separat erwerben. Nicht nach Erschaffung erwerbbar.", "20 base AsP; tradition purchased separately. Cannot be acquired after creation.", { creationOnly: true })
advantage("Zeitgefühl", 2, 170, "Tageszeit ohne äußere Hilfsmittel genau bestimmen.", "Know the time of day without external aids.")
advantage("Zweistimmiger Gesang", 5, 170, "Neues Anwendungsgebiet in Singen; ermöglicht Elfenlieder.", "Unlocks two-voiced singing and allows learning elven songs.", { approval: exclusive })
advantage("Zwergennase", 8, 170, "Sinnesschärfe zum Finden geheimer Türen, Hohlräume und ähnlicher Verstecke +1.", "+1 to Sinnesschärfe for secret doors, cavities and similar hiding places.")

// source: DSA5 Regelwerk, S. 170–179; positive amounts represent creation credits or during-play buy-off costs
disadvantage("Angst vor", 8, 170, "Solange der Auslöser präsent ist: Furcht in Höhe der Nachteilstufe.", "While exposed to the trigger, gain fear equal to the disadvantage level.", { levels: 3, parameter: "text" })
disadvantage("Arm", 1, 170, "Bei Erschaffung −250 Silbertaler je Stufe; III ohne Startkapital, nur unfreies Kleiderpaket.", "Starting money −250 Silbertaler per level; III leaves only the unfree clothing package.", { levels: 3, requirements: [excludes("Reich", "advantages")] })
disadvantage("Artefaktgebunden", 10, 171, "Ohne Hautkontakt zum gebundenen Artefakt Zauber −1; bei Verlust bis zur Herstellung eines Ersatzes.", "Spells −1 without skin contact with the bound artifact; after destruction until a replacement is made.", { parameter: "text", requirements: [needs("Zauberer")] })
disadvantage("Behäbig", 4, 171, "GS-Grundwert −1.", "Movement base −1.", { requirements: [excludes("Flink", "advantages")] })
disadvantage("Blind", 50, 171, "Dauerhafter Status Blind; Unmöglichkeit und zusätzliche Abzüge nach Meisterentscheid.", "Permanent Blind status; the GM decides additional penalties and impossible actions.", { requirements: [excludes("Herausragender Sinn (Sicht)", "advantages"), excludes("Farbenblind"), excludes("Nachtblind"), excludes("Eingeschränkter Sinn (Sicht)"), excludes("Verstümmelt (Einäugig)")] })
disadvantage("Blutrausch", 10, 171, "Schmerz durch Angriff oder misslungene Jähzorn-Willenskraft löst Blutrausch aus.", "Pain from an attack or a failed anger-control check triggers blood frenzy.", { requirements: [needs("Schlechte Eigenschaft (Jähzorn)", "disadvantages"), excludes("Angst vor (Blut)")] })
for (const [sense, ap] of [["Sicht", 15], ["Gehör", 10], ["Geruch & Geschmack", 6], ["Tastsinn", 2]] as const) {
   disadvantage(`Eingeschränkter Sinn (${sense})`, ap, 171, `Sinnesschärfe (${sense}) −2${sense === "Sicht" ? ", zusätzlich Fernkampf −2" : ""}; maximal zwei eingeschränkte Sinne.`, `Sinnesschärfe using ${sense}: −2${sense === "Sicht" ? "; ranged attacks also −2" : ""}. Maximum two impaired senses.`, { requirements: [excludes(`Herausragender Sinn (${sense})`, "advantages"), ...(sense === "Sicht" ? [excludes("Blind")] : sense === "Gehör" ? [excludes("Taub")] : [])] })
}
disadvantage("Farbenblind", 2, 171, "Farben nicht unterscheidbar; passende Proben nach Meisterentscheid erschwert oder unmöglich.", "Cannot distinguish colors; the GM decides affected checks and penalties.", { requirements: [excludes("Blind")] })
disadvantage("Fettleibig", 25, 171, "Klettern, Körperbeherrschung, Tanzen und Verbergen −1; Behäbig erforderlich.", "−1 to Klettern, Körperbeherrschung, Tanzen and Verbergen; requires Behäbig.", { requirements: [needs("Behäbig", "disadvantages"), excludes("Flink", "advantages")] })
disadvantage("Giftanfällig", 5, 171, "Gegen Gifte SK und ZK −1 je Stufe.", "SK and ZK −1 per level against poisons.", { levels: 2, requirements: [excludes("Giftresistenz", "advantages")] })
disadvantage("Hässlich", 10, 172, "Je Stufe −1 auf passende Anwendungen von Betören, Überreden und Handel.", "−1 per level to relevant attraction, persuasion and bargaining applications.", { levels: 2, requirements: [excludes("Gutaussehend", "advantages")] })
disadvantage("Hitzeempfindlich", 3, 172, "Ab Hitzestufe 2 eine Stufe stärker betroffen.", "From heat level 2, treat heat as one level higher.", { requirements: [excludes("Hitzeresistenz", "advantages")] })
disadvantage("Kälteempfindlich", 3, 172, "Ab Kältestufe 1 eine Stufe stärker betroffen.", "From cold level 1, treat cold as one level higher.", { requirements: [excludes("Kälteresistenz", "advantages")] })
for (const [key, blocked] of [["Keine Flugsalbe", "Flugsalbe"], ["Kein Vertrauter", "Vertrautenbindung"]] as const) {
   disadvantage(key, 25, 172, `Kein Erwerb von ${blocked}; Tradition (Hexe) bei Erschaffung 10 AP günstiger.`, `Cannot acquire ${blocked}; witch tradition costs 10 AP less at creation.`, { requirements: [needs("Zauberer"), excludes(blocked, "generalSpecialAbilities")], approval: approval("Passende Zauberertradition erforderlich.", "Requires an appropriate magical tradition.") })
}
disadvantage("Körpergebundene Kraft", 5, 172, "Bei Verlust von Haaren sofort 10 AsP verlieren, Minimum 0; normal regenerierbar.", "Losing hair immediately costs 10 AsP, minimum zero; recoverable normally.", { requirements: [needs("Zauberer")], approval: approval("Spezies muss Haare besitzen.", "Species must have hair.") })
disadvantage("Körperliche Auffälligkeit", 2, 172, "Gelegentliche Gesellschaftsabzüge durch Misstrauen/Aberglauben; maximal zwei.", "Occasional social penalties from distrust or superstition; maximum two.", { parameter: "text", maximum: 2 })
disadvantage("Krankheitsanfällig", 5, 172, "Gegen Krankheiten SK und ZK −1 je Stufe.", "SK and ZK −1 per level against diseases.", { levels: 2, requirements: [excludes("Krankheitsresistenz", "advantages")] })
disadvantage("Lästige Mindergeister", 20, 173, "Nach AsP-Ausgabe W20 ≤ ausgegebene AsP: Mindergeister für 10 Minuten, Fertigkeitsproben −1; nicht kumulativ.", "After spending AsP, d20 ≤ expenditure summons distracting spirits for 10 minutes: skill checks −1, non-stacking.", { requirements: [needs("Zauberer")] })
disadvantage("Lichtempfindlich", 20, 173, "Sonnenlicht heller als Dämmerung: Schmerz I; vollständige Verhüllung schützt.", "Sunlight brighter than twilight causes pain I; full coverage prevents it.")
disadvantage("Magische Einschränkung", 30, 173, "Außerhalb der gewählten günstigen Umgebung magische Fertigkeitsproben −1.", "Magic skill checks −1 outside the selected favorable environment.", { parameter: "text", requirements: [needs("Zauberer")] })
disadvantage("Nachtblind", 10, 173, "Bei mindestens einer Dunkelheitsstufe eine zusätzliche Stufe Sichtabzug.", "Once darkness causes a visibility penalty, increase it by one level.", { requirements: [excludes("Dunkelsicht", "advantages"), excludes("Blind")] })
for (const [resource, prerequisite, ap] of [["Astralkraft", "Zauberer", 2], ["Karmalkraft", "Geweihter", 2], ["Lebenskraft", "", 4]] as const) {
   disadvantage(`Niedrige ${resource}`, ap, 174, "Energie-Grundwert −1 je Stufe.", "Energy base −1 per level.", { levels: 7, requirements: [excludes(`Hohe ${resource}`, "advantages"), ...(prerequisite ? [needs(prerequisite)] : [])] })
}
disadvantage("Niedrige Seelenkraft", 25, 174, "SK-Grundwert −1.", "SK base −1.", { requirements: [excludes("Hohe Seelenkraft", "advantages")] })
disadvantage("Niedrige Zähigkeit", 25, 174, "ZK-Grundwert −1.", "ZK base −1.", { requirements: [excludes("Hohe Zähigkeit", "advantages")] })
disadvantage("Pech", 20, 174, "Schicksalspunkte-Maximum und Startvorrat −1 je Stufe, Minimum 0.", "Fate-point maximum and initial pool −1 per level, minimum zero.", { levels: 3, requirements: [excludes("Glück", "advantages")] })
disadvantage("Pechmagnet", 5, 174, "Mindestens doppelte Wahrscheinlichkeit bei zufälliger Opferwahl des Meisters.", "At least twice the usual chance of being selected as a random victim.", { approval: approval("Mit dem Meister abstimmen; nicht sinnvoll für alle Gruppenmitglieder.", "Agree with the GM; not suitable for every party member.") })
for (const [name, ap, page] of [["Arroganz", 10, 174], ["Eitelkeit", 10, 174], ["Neid", 5, 174], ["Streitsucht", 10, 175], ["Unheimlich", 8, 175], ["Verwöhnt", 10, 175], ["Vorurteile", 5, 175], ["Weltfremd", 10, 175]] as const) {
   disadvantage(`Persönlichkeitsschwäche (${name})`, ap, page, "Passende Gesellschafts-/Handel-Proben −1 nach Meisterentscheid; maximal zwei Persönlichkeitsschwächen.", "Relevant social/bargaining checks −1 at GM discretion; at most two personality flaws.", { ...(name === "Vorurteile" || name === "Weltfremd" ? { parameter: "text" as const } : {}) })
}
disadvantage("Prinzipientreue", 10, 175, "Nach Prinzipienverstoß alle Fertigkeitsproben −1 für mindestens eine Stunde; Dauer nach Meisterentscheid. AP nur einmal für die höchste Stufe.", "Breaking principles causes −1 to all skill checks for at least one hour; GM decides duration. AP granted only once for the highest level.", { levels: 3, parameter: "text", creditHighestOnly: true })
disadvantage("Schlafwandler", 10, 175, "Höchstens wöchentlich: nächste 24 Stunden Betäubung I, Regeneration der betroffenen Nacht −1.", "At most weekly: stupor I for the following 24 hours, regeneration that night −1.")
disadvantage("Schlechte Angewohnheit", 2, 175, "Lästiges Verhalten; selten Gesellschaftsabzüge nach Meisterentscheid. Erschaffungsgutschrift maximal 6 AP.", "Annoying habit; occasional social penalties at GM discretion. Creation AP credit is capped at 6.", { parameter: "text" })
for (const [name, ap] of [["Aberglaube", 5], ["Autoritätsglaube", 5], ["Geiz", 5], ["Goldgier", 5], ["Jähzorn", 10], ["Kleptomanie", 10], ["Naiv", 10], ["Neugier", 5], ["Rachsucht", 5], ["Spielsucht", 5], ["Verschwendungssucht", 5]] as const) {
   disadvantage(`Schlechte Eigenschaft (${name})`, ap, 177, "Bei Auslöser Willenskraft: bei Misserfolg der Eigenschaft folgen, solange der Auslöser wirkt; maximal zwei.", "On a trigger, test Willenskraft; failure forces the behavior while exposed. Maximum two bad traits.")
}
for (const [resource, prerequisite, page] of [["Astralenergie", "Zauberer", 176], ["Karmaenergie", "Geweihter", 176], ["Lebensenergie", "", 177]] as const) {
   disadvantage(`Schlechte Regeneration (${resource})`, 10, page, "Regenerationswurf −1 je Stufe, Minimum 0.", "Regeneration roll −1 per level, minimum zero.", { levels: 3, requirements: [excludes(`Verbesserte Regeneration (${resource})`, "advantages"), ...(prerequisite ? [needs(prerequisite)] : [])] })
}
disadvantage("Schwacher Astralkörper", 15, 177, "Jede AsP-Ausgabe kostet einen zusätzlichen AsP.", "Every AsP expenditure costs one extra AsP.", { requirements: [needs("Zauberer")] })
disadvantage("Schwacher Karmalkörper", 15, 177, "Jede KaP-Ausgabe kostet einen zusätzlichen KaP.", "Every KaP expenditure costs one extra KaP.", { requirements: [needs("Geweihter")] })
disadvantage("Sensibler Geruchssinn", 10, 177, "Bei widerlichem Geruch Verwirrung I.", "Disgusting smells cause confusion I.", { approval: exclusive, requirements: [excludes("Eingeschränkter Sinn (Geruch & Geschmack)")] })
disadvantage("Sprachfehler", 15, 177, "Sprechbezogene Gesellschaftstalente (nicht Menschenkenntnis/Willenskraft) und Handel (Feilschen) gegebenenfalls −1.", "Speech-related social checks (except Menschenkenntnis/Willenskraft) and bargaining may suffer −1.", { requirements: [excludes("Stumm")] })
disadvantage("Stigma", 10, 178, "Nach Meisterentscheid passende Gesellschaftstalente/Feilschen −1, nicht Einschüchtern, Menschenkenntnis, Willenskraft.", "GM may impose −1 on relevant social/bargaining checks, except Einschüchtern, Menschenkenntnis and Willenskraft.", { parameter: "text" })
disadvantage("Stumm", 40, 178, "Dauerhafter Status Stumm; sprachabhängige Handlungen unmöglich oder stark erschwert.", "Permanent Mute status; speech-dependent actions impossible or heavily penalized.", { requirements: [excludes("Wohlklang", "advantages"), excludes("Geborener Redner", "advantages"), excludes("Sprachfehler")] })
disadvantage("Taub", 40, 178, "Dauerhafter Status Taub; keine hörbezogenen Sinnesschärfe-Proben.", "Permanent Deaf status; no hearing-based Sinnesschärfe checks.", { requirements: [excludes("Herausragender Sinn (Gehör)", "advantages")] })
disadvantage("Unfähig", 0, 178, "Besten W20 einer Talentprobe wiederholen; zweites Ergebnis bindend. Maximal zwei Talente.", "Reroll the best d20 in a talent check; the second result is binding. Maximum two talents.", { parameter: "talent", factor: 1, maximum: 2 })
disadvantage("Unfrei", 8, 178, "Kaum Rechte; Gesellschaftsproben gegenüber Höhergestellten können erschwert sein.", "Few legal rights; social checks against higher-status people may be penalized.", { requirements: [excludes("Soziale Anpassungsfähigkeit", "advantages")] })
disadvantage("Verpflichtungen", 10, 179, "Befehle der verpflichtenden Person/Gruppe befolgen oder Konsequenzen tragen; AP nur für höchste Stufe.", "Obey the person/group or face consequences; AP only for the highest obligation level.", { levels: 3, parameter: "text", creditHighestOnly: true })
for (const [part, ap, de, en] of [
   ["Einarmig", 30, "Ein Arm fehlt mindestens ab Ellbogen; Handlungen nach Meisterentscheid erschwert/unmöglich.", "An arm is missing from at least the elbow; GM decides affected actions."],
   ["Einäugig", 10, "Fernkampf −4.", "Ranged attacks −4."],
   ["Einbeinig", 30, "GS-Grundwert halbiert; einfache Prothesen/Krücken heben dies nicht auf.", "Movement base halved; ordinary crutches/prostheses do not remove this."],
   ["Einhändig", 20, "Eine Hand fehlt; Handlungen nach Meisterentscheid erschwert/unmöglich.", "One hand is missing; GM decides affected actions."],
   ["Einohrig", 5, "Sinnesschärfe (Hören) −1.", "Hearing-based Sinnesschärfe −1."],
] as const) {
   disadvantage(`Verstümmelt (${part})`, ap, 179, de, en, { approval: approval("Heilung nur durch geeignete seltene Magie oder Götterwirken; keine widersprüchlichen Kombinationen.", "Recovery needs appropriate rare magic/divine intervention; no incompatible combinations.") })
}
disadvantage("Wahrer Name", 10, 179, "Kennt ein Zauberer den wahren Namen, sind SK und ZK gegen dessen Zauber −4.", "If a caster knows the true name, SK and ZK against their spells are −4.")
disadvantage("Wilde Magie", 10, 179, "Bei Zaubern und Ritualen zählen 19er für Patzer wie 20er.", "For spell/ritual fumbles, rolls of 19 count as 20.", { requirements: [needs("Zauberer")] })
disadvantage("Zauberanfällig", 12, 179, "Gegen Magie SK und ZK −1 je Stufe.", "Against magic, SK and ZK −1 per level.", { levels: 2, requirements: [excludes("Schwer zu verzaubern", "advantages")] })
disadvantage("Zerbrechlich", 20, 179, "Schmerz wirkt eine Stufe höher; Handlungsunfähigkeit schon bei III.", "Pain acts one level higher; incapacitation already at III.", { requirements: [excludes("Zäher Hund", "advantages")] })

// source: DSA5 Regelwerk, S. 215–222 (general and fate-point special abilities)
ability("Analytiker", 5, 215, "Magiekunde zur Analyse von Artefakten, magischen Wesen und Zaubern einsetzen; mehr QS als ohne SF möglich.", "Use Magiekunde to analyze artifacts, magical creatures and spells, with a higher QS ceiling.", { requirements: [talent("magiekunde", 4)] })
ability("Anführer", 10, 215, "1 Aktion, Überreden-Probe: QS+1 Verbündete in Sicht-/Hörweite erhalten nächste KR +1 AT, Verteidigung und FK; nicht kumulativ.", "One action and an Überreden check: QS+1 visible/audible allies gain +1 AT, defense and FK next round; non-stacking.", { requirements: [talent("kriegskunst", 4)] })
const secrets: Array<[string, number, EntryRequirement[]]> = [
   ["Antidot", 2, [talent("alchimie", 4)]], ["Glas", 1, [talent("alchimie", 8)]],
   ["Heiltrank", 4, [talent("alchimie", 2)]], ["Liebestrunk", 2, [talent("alchimie", 4)]],
   ["Porzellan", 1, [talent("alchimie", 8)]], ["Unsichtbarkeitselixier", 4, [talent("alchimie", 4)]],
   ["Verwandlungselixier", 4, [talent("alchimie", 4)]], ["Waffenbalsam", 4, [talent("alchimie", 2)]],
   ["Willenstrunk", 4, [talent("alchimie", 4)]], ["Zaubertrank", 8, [talent("alchimie", 4)]],
   ["Algebra", 2, [talent("rechnen", 4)]], ["Boltan", 2, [talent("brettUndGlueckspiel", 4)]],
   ["Drehleier", 2, [talent("holzbearbeitung", 8), talent("metallbearbeitung", 8), needs("Instrumente bauen", "generalSpecialAbilities")]],
   ["Elfenbogen", 3, [talent("holzbearbeitung", 12)]], ["Garadan", 2, [talent("brettUndGlueckspiel", 4)]],
   ["Geometrie", 1, [talent("rechnen", 8)]], ["Kamelspiel", 2, [talent("brettUndGlueckspiel", 4)]],
   ["Spinett", 2, [talent("holzbearbeitung", 8), talent("metallbearbeitung", 8), needs("Instrumente bauen", "generalSpecialAbilities")]],
   ["Standharfe", 2, [talent("holzbearbeitung", 8), needs("Instrumente bauen", "generalSpecialAbilities")]],
   ["Uhrwerk", 4, [talent("mechanik", 8), talent("metallbearbeitung", 8)]],
]
for (const [name, ap, requirements] of secrets) ability(`Berufsgeheimnis (${name})`, ap, 215, `Erlaubt Anwendung des Geheimwissens ${name}. Lehrmeister erforderlich.`, `Allows use of the professional secret ${name}. Requires a teacher.`, { requirements, approval: approval(name === "Elfenbogen" ? "Lehrmeister und Spezies Elf erforderlich." : "Lehrmeister erforderlich.", name === "Elfenbogen" ? "Requires a teacher and elven species." : "Requires a teacher.") })
ability("Dokumentfälscher", 5, 216, "Malen & Zeichnen: neues Anwendungsgebiet Dokumente fälschen.", "Unlocks document forgery in Malen & Zeichnen.", { requirements: [talent("malenUndZeichnen", 8), excludes("Blind")] })
ability("Eiserner Wille", 15, 216, "Während Konzentration SK +1 je Stufe, andere Proben −Stufe; am Ende Betäubung I.", "While concentrating, SK +1 per level and other checks −level; stupor I afterwards.", { levels: 2 })
ability("Fächersprache", 3, 216, "Mit Fächer lautlos mit anderen Kennern kommunizieren.", "Communicate silently with other trained users using a fan.", { requirements: [talent("etikette", 8), excludes("Blind")] })
ability("Fallen entschärfen", 5, 216, "Schlösserknacken: neues Anwendungsgebiet Fallen entschärfen.", "Unlocks trap disarming in Schlösserknacken.", { requirements: [talent("mechanik", 4), talent("schloesserknacken", 4)] })
ability("Falschspielen", 5, 216, "Misslungene Brett- & Glücksspiel-Probe wiederholen, nicht Patzer; Entdeckung durch Sinnesschärfe-Vergleich.", "Repeat a failed gambling check, except a fumble; opposed Sinnesschärfe detects cheating.", { requirements: [talent("brettUndGlueckspiel", 8)] })
ability("Fertigkeitsspezialisierung", 0, 216, "Im gewählten Talent-Anwendungsgebiet FW +2. Bis zu drei verschiedene Anwendungen je Talent; FW 6/12/18 nötig.", "+2 FW in the selected talent application. At most three distinct applications per talent; requires FW 6/12/18.", { parameter: "specialization", factor: 1, approval: approval("Anwendungsgebiet muss zum Talent passen.", "The selected application must belong to the talent.") })
ability("Fischer", 3, 217, "Erfolgreiche Nahrungssuche mit Fischen & Angeln: Nahrung für eine zusätzliche QS.", "Successful fishing for food yields one extra QS worth of food.", { requirements: [talent("fischenUndAngeln", 4), talent("verbergen", 4)] })
ability("Füchsisch", 3, 217, "Zinken des Füchsischen lesen und schreiben.", "Read and write thieves' signs.", { requirements: [talent("gassenwissen", 8), excludes("Blind")] })
ability("Geländekunde", 15, 217, "In passendem Gelände Fährtensuchen, Orientierung, Pflanzenkunde, Tierkunde und Wildnisleben +1.", "In the selected terrain, +1 to tracking, orientation, plants, animals and survival.", { choices: ["Dschungelkundig", "Eis- und Schneekundig", "Gebirgskundig", "Höhlenkundig", "Kulturlandkundig", "Meereskundig", "Steppenkundig", "Sumpfkundig", "Waldkundig", "Wüstenkundig"], approval: approval("Mindestens sechs Monate im Gelände gelebt.", "Must have lived in the terrain for at least six months.") })
ability("Gildenrecht", 2, 217, "Rechtskunde: neues Anwendungsgebiet Gildenrecht.", "Unlocks guild law in Rechtskunde.", { requirements: [talent("rechtskunde", 4)] })
ability("Glasbläserei", 2, 217, "Steinbearbeitung: Glaswaren formen. Glasherstellung benötigt ein separates Berufsgeheimnis.", "Shape glassware using Steinbearbeitung. Producing glass itself requires a separate professional secret.", { requirements: [talent("steinbearbeitung", 4)] })
ability("Hehlerei", 5, 217, "Handel: Hehlerei zum Verkauf gestohlener Waren.", "Unlocks selling stolen goods through Handel.", { requirements: [needs("Ortskenntnis", "generalSpecialAbilities"), talent("gassenwissen", 8), talent("handel", 4)], approval: approval("Ortskenntnis muss den Verkaufsort betreffen.", "Local knowledge must cover the location of sale.") })
ability("Heraldik", 2, 218, "Etikette: Heraldik & Stammbäume.", "Unlocks heraldry and genealogies in Etikette.", { requirements: [talent("etikette", 4)] })
ability("Instrumente bauen", 2, 218, "Holz-/Metallbearbeitung: Instrumente bauen.", "Unlocks instrument construction in wood/metalworking.", { requirements: [{ sum: ["holzbearbeitung", "metallbearbeitung"], minimum: 12 }] })
ability("Jäger", 5, 218, "Erfolgreiche Nahrungssuche mit Tierkunde: Nahrung für eine zusätzliche QS.", "Successful hunting using Tierkunde yields one extra QS worth of food.", { requirements: [{ ranged: 10 }, talent("faehrtensuchen", 4), talent("tierkunde", 4), talent("verbergen", 4)] })
ability("Kartographie", 5, 218, "Geographie: Landkarten anfertigen.", "Unlocks mapmaking in Geographie.", { requirements: [talent("geographie", 8), talent("rechnen", 4), talent("malenUndZeichnen", 4)] })
ability("Lippenlesen", 10, 218, "Sinnesschärfe: Lippenlesen in einer verstandenen Sprache.", "Read lips using Sinnesschärfe in a language you understand.", { requirements: [talent("sinnesschaerfe", 4), excludes("Blind")] })
ability("Meister der Improvisation", 10, 218, "Bei Handwerk bis zu 2 Punkte Abzug durch schlechtes Werkzeug/Material ignorieren.", "Ignore up to 2 points of crafting penalties caused by poor tools/materials.")
ability("Ortskenntnis", 2, 218, "Am gewählten Ort Gassenwissen und Orientierung +1.", "+1 to Gassenwissen and Orientierung at the selected location.", { parameter: "text", approval: approval("Sechs Monate dort gelebt oder Weg dutzendfach bereist.", "Lived there for six months or traveled the route dozens of times.") })
ability("Rosstäuscher", 4, 218, "Handel (Feilschen) beim Tierverkauf zweimal würfeln, besseres Ergebnis; Tierkunde-Vergleich entlarvt Täuschung.", "Roll bargaining twice when selling livestock and keep the better result; opposed Tierkunde exposes deception.", { requirements: [talent("handel", 4), talent("tierkunde", 8)] })
ability("Sammler", 2, 219, "Erfolgreiche Nahrungssuche mit Pflanzenkunde: Nahrung für eine zusätzliche QS.", "Successful food gathering using Pflanzenkunde yields one extra QS worth of food.", { requirements: [talent("pflanzenkunde", 4), talent("wildnisleben", 4)] })
ability("Schmerzen unterdrücken", 20, 219, "Freie Aktion und Selbstbeherrschung: je QS eine Schmerzstufe unterdrücken, einen Kampf/maximal eine Stunde; danach Betäubung I.", "Free action and Selbstbeherrschung: suppress one pain level per QS for one fight/up to one hour; stupor I afterwards.", { requirements: [talent("selbstbeherrschung", 4)] })
ability("Schnapsbrennerei", 2, 219, "Lebensmittelbearbeitung: Schnapsbrennen.", "Unlocks distillation in Lebensmittelbearbeitung.", { requirements: [talent("alchimie", 4), talent("lebensmittelbearbeitung", 4)] })
for (const [field, key] of [["Liebesroman", "betoeren"], ["Poesie", "etikette"], ["Hetzschriften", "bekehrenUeberzeugen"], ["Kriminalgeschichten", "gassenwissen"], ["Märchen & Romane", "ueberreden"]] as const) {
   ability(`Schriftstellerei (${field})`, 2, 219, "Erlaubt literarisches Schreiben im gewählten Fachbereich als Talent-Anwendungsgebiet.", "Unlocks literary writing in the selected field as a talent application.", { requirements: [talent(key, 4)], approval: approval("Passende Sprache III und zugehörige Schrift erforderlich.", "Requires a suitable language III and its script.") })
}
ability("Schriftstellerei (Fachpublikationen)", 2, 219, "Neues Anwendungsgebiet im gewählten Wissenstalent.", "Unlocks technical writing in the selected knowledge talent.", { parameter: "talent", choices: ["brettUndGlueckspiel", "geographie", "geschichtswissen", "goetterUndKulte", "kriegskunst", "magiekunde", "mechanik", "rechnen", "rechtskunde", "sagenUndLegenden", "sphaerenkunde", "sternkunde"], approval: approval("Passendes Wissenstalent FW 4, Sprache III und Schrift erforderlich.", "Requires a suitable knowledge talent at FW 4, language III and script.") })
ability("Tierstimmen imitieren", 5, 220, "Tierkunde: Tierstimmen imitieren.", "Unlocks animal-call imitation in Tierkunde.", { requirements: [talent("tierkunde", 4)] })
ability("Töpferei", 2, 220, "Steinbearbeitung: Töpfern.", "Unlocks pottery in Steinbearbeitung.", { requirements: [talent("steinbearbeitung", 4)] })
ability("Wettervorhersage", 2, 220, "Wildnisleben: Wettervorhersage.", "Unlocks weather forecasting in Wildnisleben.", { requirements: [talent("wildnisleben", 4)] })
ability("Zahlenmystik", 2, 220, "Rechnen: Zahlenmystik.", "Unlocks number mysticism in Rechnen.", { requirements: [talent("rechnen", 8), talent("sagenUndLegenden", 4)] })
for (const check of ["Attacke", "Ausweichen", "Eigenschaft", "Fernkampf", "Parade"]) {
   ability(`${check} verbessern`, 5, 222, `Schicksalspunkte für Ergebnis verbessern (${check}) einsetzen.`, `Spend fate points to improve a ${check} result.`)
}
ability("Wachsamkeit", 10, 222, "Bei Überraschung einen Schip ausgeben, um Überrascht sofort aufzuheben.", "Spend one fate point to remove Surprised immediately.")

// source: DSA5 Regelwerk, S. 275, 278, 284–285, 321
ability("Tradition (Gildenmagier)", 155, 275, "KL als Leiteigenschaft; Sicht, Geste und Formel. Zauber aus Büchern lernen, Magierstab nutzen; ein Fremdzauber bei Erschaffung in eigener Tradition.", "Leading attribute KL; sight, gesture and spoken formula. Learn spells from books and use a mage staff; one foreign spell at creation is treated as native.", { requirements: [needs("Zauberer")], approval: approval("Ausbildung und Traditionswahl bestätigen.", "Confirm training and tradition choice.") })
ability("Tradition (Hexe)", 135, 278, "CH als Leiteigenschaft. Ohne Bodenkontakt −1 je Schritt, höchstens −8; misslungene Zauber kosten ein Drittel. Passende Gefühle bis +2; Flüche, Fluggerät, Vertraute.", "Leading attribute CH. Without ground contact: −1 per Schritt, capped at −8; failed spells cost one third. Matching emotions grant up to +2; curses, flying tools and familiars.", { requirements: [needs("Zauberer")], approval: approval("Ausbildung und Traditionswahl bestätigen.", "Confirm training and tradition choice.") })
ability("Tradition (Elf)", 125, 283, "IN als Leiteigenschaft; Sicht, Geste und gesprochene/gesungene Formel. Elfische Zauber wirken doppelt so lange; Elfenlieder benötigen Zweistimmigen Gesang.", "Leading attribute IN; sight, gesture and spoken/sung formula. Elven spells last twice as long; elven songs need two-voiced singing.", { requirements: [needs("Zauberer")], approval: approval("Ausbildung und Traditionswahl bestätigen.", "Confirm training and tradition choice.") })
// source: DSA5 Regelwerk, S. 281 (Flugsalbe: the witch's flying device for a year)
ability("Flugsalbe", 15, 281, "Flugsalbe mit dem Zirkel brauen; ein gesalbtes Holzobjekt ein Jahr lang als Fluggerät (Start 1 AsP, bis 50 Meilen/h, 25 Stein Zuladung).", "Brew flying ointment with the coven; one anointed wooden object flies for a year (start 1 AsP, up to 50 Meilen/h, 25 Stein load).", { requirements: [needs("Zauberer"), needs("Tradition (Hexe)", "generalSpecialAbilities"), excludes("Keine Flugsalbe")] })
ability("Vertrautenbindung", 20, 279, "Magisches und emotionales Band mit einem Vertrautentier schließen; bei Erschaffung mit gebundenem Tier starten.", "Create a magical/emotional bond with a familiar; at creation may start with the bonded animal.", { requirements: [needs("Zauberer"), needs("Tradition (Hexe)", "generalSpecialAbilities"), excludes("Kein Vertrauter")], approval: approval("Geeignetes Vertrautentier erforderlich.", "Requires an appropriate familiar.") })
const staffApproval = approval("Gebundenen Stab, freies Volumen und etwaige AsP-Kosten separat prüfen und erfassen.", "Check and separately record the bound staff, free volume and any AsP costs.")
const staff = (key: string, ap: number, page: number, de: string, en: string, options: Parameters<typeof add>[6] = {}) =>
   ability(key, ap, page, de, en, {
      ...options, approval: options.approval ?? staffApproval,
      requirements: [needs("Zauberer"), needs("Tradition (Gildenmagier)", "generalSpecialAbilities"),
         ...(key === "Bindung des Stabes" ? [] : [needs("Bindung des Stabes", "generalSpecialAbilities")]),
         ...(options.requirements ?? [])],
   })
// source: DSA5 Regelwerk, S. 276–278
staff("Bindung des Stabes", 10, 276, "Bindet einen nahezu unzerstörbaren magischen Stab; nur ein gebundener Stab. Kostet 2 permanente AsP, Volumen 0.", "Binds a nearly indestructible magical staff; only one bound staff. Costs 2 permanent AsP, volume 0.")
staff("Doppeltes Maß", 5, 276, "Stablänge verdoppeln solange Körperkontakt; 1 AsP, Volumen 2.", "Double staff length while touching it; 1 AsP, volume 2.")
staff("Ewige Flamme", 10, 277, "Stab als Fackel, höchstens eine Stunde; kein Kampfbonus. 1 AsP, Volumen 2.", "Staff burns as a torch for at most one hour; no combat bonus. 1 AsP, volume 2.")
staff("Flammenschwert", 35, 277, "Magisches Schwert 1W6+7 TP; geführt 1 AsP/KR, fliegend 2 AsP/KR, Reichweite 32 Schritt, GS 8. Aktivierung 3 AsP, Volumen 7.", "Magical sword dealing 1W6+7 TP; held 1 AsP/round, flying 2 AsP/round, range 32 Schritt, speed 8. Activation 3 AsP, volume 7.", { requirements: [needs("Ewige Flamme", "generalSpecialAbilities"), needs("Kraftfokus", "generalSpecialAbilities")] })
staff("Kraftfokus", 30, 277, "Normalen Stab in der Hand: Zauberkosten −1 AsP, Minimum 1. Volumen 6.", "Holding the untransformed staff: spell cost −1 AsP, minimum 1. Volume 6.")
staff("Merkmalsfokus", 35, 277, "Normalen Stab in der Hand: Zauber des gewählten Merkmals +1. Volumen 8.", "Holding the untransformed staff: +1 to spells of the selected property. Volume 8.", { choices: [...spellProperties], requirements: [needs("Kraftfokus", "generalSpecialAbilities")] })
staff("Seil des Adepten", 10, 277, "Stab wird unzerstörbares 10-Meter-Seil; ohne Berührung wieder Stab. Knoten je 1 Aktion, nur bewegungsunfähige Personen fesseln. 1 AsP, Volumen 2.", "Staff becomes an indestructible 10-meter rope until contact is lost. Knots take one action; only immobilized people can be bound. 1 AsP, volume 2.")
staff("Stab-Apport", 15, 278, "Stab fliegt mit GS 15 zum Magier, umgeht Hindernisse; Holz-/Steinwände stoppen ihn. 1 AsP, Volumen 3.", "Staff flies to the mage at speed 15, avoiding obstacles; wood/stone walls stop it. 1 AsP, volume 3.")
ability("Aura verbergen", 20, 284, "1 Aktion und Willenskraft: gezielte magische Erkennung um QS erschwert, ungerichtete verborgen. Keine Zauber währenddessen; Ausschalten verursacht Verwirrung I.", "One action and Willenskraft: targeted magical detection suffers −QS, untargeted detection is blocked. Cannot cast while hidden; switching off causes confusion I.", { requirements: [needs("Zauberer"), { attribute: "courage", minimum: 13 }, { attribute: "intuition", minimum: 13 }] })
ability("Merkmalskenntnis", 10, 285, "Zauber des Merkmals über FW 14 steigern und entsprechende Fremdzauber modifizieren.", "Raise spells of the selected property above FW 14 and modify matching foreign-tradition spells.", { choices: [...spellProperties], ordinalCosts: [10, 20, 40], requirements: [needs("Zauberer")], approval: approval("Leiteigenschaft 15; drei Zauber des Merkmals FW 10 und passende Ausbildung erforderlich.", "Requires leading attribute 15, three spells of the property at FW 10 and appropriate training.") })
ability("Starke Zaubertricks", 2, 285, "Zaubertricks gelten als QS 2.", "Cantrips count as QS 2.", { requirements: [needs("Zauberer")] })
ability("Verbotene Pforten", 10, 285, "LeP statt AsP einsetzen, mindestens 1 AsP pro Zauber; Selbstbeherrschung nötig, sonst scheitert der Zauber.", "Spend LeP instead of AsP, with at least 1 AsP per spell; requires Selbstbeherrschung or the spell fails.", { requirements: [needs("Zauberer"), { attribute: "courage", minimum: 12 }] })
ability("Zauberzeichen", 20, 285, "Malen & Zeichnen: Zauberzeichen malen für Bann-/Schutzkreise und Glyphen.", "Unlocks magical signs in Malen & Zeichnen for protective/binding circles and glyphs.", { requirements: [needs("Zauberer"), { attribute: "fingerDexterity", minimum: 12 }] })
ability("Aspektkenntnis", 15, 321, "Liturgien des gewählten Aspekts über FW 14 steigern.", "Raise liturgies of the selected aspect above FW 14.", { parameter: "text", ordinalCosts: [15, 25, 45], requirements: [needs("Geweihter")], approval: approval("Leiteigenschaft 15; drei Liturgien/Zeremonien des Aspekts FW 10; Aspekt der Kirche oder allgemein.", "Requires leading attribute 15 and three liturgies/ceremonies at FW 10; a church aspect or general aspect.") })
ability("Fokussierung", 8, 321, "Bei Liturgien/Zeremonien Selbstbeherrschung (Störungen ignorieren) +1.", "+1 to Selbstbeherrschung (Störungen ignorieren) while invoking liturgies/ceremonies.", { requirements: [needs("Geweihter"), { attribute: "courage", minimum: 13 }] })
ability("Stärke des Glaubens", 10, 321, "Unbeweglich konzentrierend die Gottheit anrufen: niedere Dämonen können nicht berühren oder direkt angreifen.", "While motionless and concentrating on your deity, lesser demons cannot touch or directly attack you.", { requirements: [needs("Geweihter"), { attribute: "courage", minimum: 15 }] })
ability("Starke Segnungen", 2, 321, "Segnungen gelten als QS 2.", "Blessings count as QS 2.", { requirements: [needs("Geweihter")] })
// source: DSA5 Regelwerk, S. 317–320
for (const [church, ap, page, de, en] of [
   ["Praioskirche", 130, 317, "KL als Leiteigenschaft; SK gegen Magie +1, Erzwingen +2 statt +1.", "Leading attribute KL; SK +1 against magic, forcing liturgies grants +2 instead of +1."],
   ["Rondrakirche", 150, 317, "MU als Leiteigenschaft; Furcht eine Stufe niedriger, IV bleibt handlungsunfähig. Selbstbeherrschung kann dann eine Aktion/Verteidigung je KR erlauben.", "Leading attribute MU; fear acts one level lower, but IV still incapacitates. Selbstbeherrschung may then allow one action/defense per round."],
   ["Boronkirche", 130, 318, "MU als Leiteigenschaft; Dunkelheit eine Stufe geringer außer völliger Finsternis; geweihte Waffen verdoppeln TP gegen Untote vor RS.", "Leading attribute MU; darkness penalties one level lower except total darkness; consecrated weapons double TP against undead before RS."],
   ["Hesindekirche", 130, 319, "KL als Leiteigenschaft; Sinnesschärfe gegen Illusionen +1, Verwirrung eine Stufe geringer außer IV.", "Leading attribute KL; Sinnesschärfe +1 against illusions; confusion acts one level lower except IV."],
   ["Phexkirche", 150, 320, "IN als Leiteigenschaft; bei Schip-Wiederholung besseres Ergebnis behalten. Zeremonie +1 bei Opfer von 5 Silbertalern je Steigerungsfaktor.", "Leading attribute IN; fate-point rerolls keep the better result. Ceremony +1 for offering 5 Silbertaler per advancement-factor step."],
   ["Perainekirche", 110, 320, "IN als Leiteigenschaft; kleiner Heilsegen heilt 2 LeP; gelungene Krankheitsprobe nur leichter Verlauf, sonst keine Ansteckung.", "Leading attribute IN; minor healing blessing restores 2 LeP; a successful disease check causes only the mild course, otherwise no infection."],
] as const) {
   ability(`Tradition (${church})`, ap, page, de, en, { requirements: [needs("Geweihter"), needs("Prinzipientreue", "disadvantages")], approval: approval("Passenden Moralkodex und Weihe bestätigen; nur eine geweihte Tradition.", "Confirm the appropriate moral code and ordination; only one divine tradition.") })
}

// source: DSA5 Regelwerk, S. 219–224
export const languageScripts: Record<string, string[]> = {
   Alaani: ["Kusliker Zeichen", "Altes Alaani", "Chrmk"], Angram: ["Angram-Bilderschrift"],
   Asdharia: ["Isdira- und Asdharia-Zeichen"], Atak: [], Aureliani: ["Imperiale Zeichen"],
   Bosparano: ["Imperiale Zeichen", "Kusliker Zeichen", "Nanduria-Zeichen"], Fjarningsch: [],
   Garethi: ["Kusliker Zeichen", "Nanduria-Zeichen"], Goblinisch: [],
   Isdira: ["Isdira- und Asdharia-Zeichen"], Nujuka: [], Ogrisch: [], Oloarkh: [], Ologhaijan: [],
   Rabensprache: [], Rogolan: ["Rogolan-Runen"], Rssahh: ["Chrmk", "Chuchas"],
   Ruuz: ["Tulamidya-Zeichen"], "Saga-Thorwalsch": ["Hjaldingsche Runen"], Tahaya: [],
   Thorwalsch: ["Thorwalsche Runen"], Trollisch: ["Trollische Raumbilderschrift"],
   Tulamidya: ["Tulamidya-Zeichen", "Geheiligte Glyphen von Unau", "Kusliker Zeichen"],
   "Ur-Tulamidya": ["Ur-Tulamidya-Zeichen", "Chrmk"], Zelemja: ["Chrmk"],
   Zhayad: ["Zhayad-Zeichen"], Zyklopäisch: ["Kusliker Zeichen", "Imperiale Zeichen"],
}
for (const key of Object.keys(languageScripts)) add("languages", key, 2, 220,
   "I: einzelne Wörter; II: flüssige einfache Verständigung mit Akzent; III: komplexe, akzentfreie Verständigung. Lesen/Schreiben benötigt passende Schrift.",
   "I: a few words; II: reasonably fluent simple conversation with an accent; III: complex, accent-free speech. Reading/writing needs a matching script.",
   { levels: key === "Ogrisch" || key === "Oloarkh" ? 2 : 3, ...(key === "Rssahh" ? { approval: approval("Stufe III nur für Echsenwesen.", "Level III is restricted to lizardfolk.") } : {}) })
for (const [key, ap] of [
   ["Altes Alaani", 4], ["Angram-Bilderschrift", 4], ["Chrmk", 4], ["Chuchas", 6],
   ["Geheiligte Glyphen von Unau", 2], ["Hjaldingsche Runen", 2], ["Imperiale Zeichen", 2],
   ["Isdira- und Asdharia-Zeichen", 2], ["Kusliker Zeichen", 2], ["Nanduria-Zeichen", 2],
   ["Rogolan-Runen", 2], ["Thorwalsche Runen", 2], ["Trollische Raumbilderschrift", 6],
   ["Tulamidya-Zeichen", 2], ["Ur-Tulamidya-Zeichen", 2], ["Zhayad-Zeichen", 2],
] as const) add("scripts", key, ap, 224, "Kenntnis der Schriftzeichen erlaubt Lesen und Schreiben passender bekannter Sprachen; keine Schriftstufen.",
   "Knowing the characters allows reading and writing matching known languages; scripts have no levels.", { requirements: [excludes("Blind")] })

// source: DSA5 Regelwerk, S. 276–278 (Volumen of each staff spell; a staff holds 18 points)
export const staffVolumes: Record<string, number> = {
   "Bindung des Stabes": 0, "Doppeltes Maß": 2, "Ewige Flamme": 2, Flammenschwert: 7, Kraftfokus: 6, Merkmalsfokus: 8,
   "Seil des Adepten": 2, "Stab-Apport": 3,
}
export const staffCapacity = 18
export const staffBinding = { key: "Bindung des Stabes", permanentAsp: 2 }
function entryGroup(entry: CatalogEntry): EntryGroup {
   const page = entry.effect.page
   if (page >= 305) return "karma"
   if (entry.key.startsWith("Tradition (")) return "tradition"
   if (entry.key in staffVolumes) return "staff"
   if (entry.key === "Vertrautenbindung" || entry.key === "Flugsalbe") return "witch"
   if (page >= 274) return "magic"
   return page === 222 ? "fate" : "general"
}
for (const entry of entries) if (entry.category === "generalSpecialAbilities") entry.group = entryGroup(entry)

for (const entry of entries) if (entry.parameter === "text" && entrySuggestions[entry.key]) entry.suggestions = entrySuggestions[entry.key]
export const characterEntryCatalog = entries
export const entryRomans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]
export const entryTalents = talentCatalog.map(({ key }) => key)
export const entryTechniques = combatTechniques.map(({ key }) => key)
