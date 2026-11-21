---
description: 'Use when adding or reviewing frontend translations, localization, German/English UI text, or DSA5 rulebook terminology.'
applyTo: 'client/src/locales/**, client/src/**/*.ts, client/src/**/*.tsx'
---

# Translations

- Use `t` with the current language and add both `de` and `en` entries to `client/src/locales/translation.json`. Reuse existing keys; do not add duplicate keys.
- Translate app labels, messages, descriptions, tooltips and accessibility text. Leave third-party library internals, including Sonner's built-in labels, alone.
- Preserve user-entered names, notes, custom entries and specialization details. Translate display labels only; never change stored identifiers, enum values or request payloads.
- Use `translateRuleLabel` only for known rule/catalog labels. Preserve levels and user-provided parameters.
- Localize message templates rather than interpolated user text. Preserve unknown error messages verbatim.
- Long rule descriptions may live in data files as `{ de, en }` objects next to their page reference (pattern: entry effects, `conditionInfo.ts`) instead of `translation.json`.
- For long German labels in narrow chips, add a soft hyphen at the correct break point (`anspruchs­voll`) rather than shrinking text. Join page references with a non-breaking space (`S. 32`).
- Stored log or history entries keep a translation key plus values, and are localized at render time, so switching language translates old entries too.
- Spell out English terms whose official abbreviation isn't verified (e.g. "Quality level", "Skill points") instead of guessing (QL/SP).
- Check an existing key's translation before reusing it: the same English word can mean different things (hero "Species" = Spezies vs. animal species = Tierart → separate key `Animal species`).
- A string containing a placeholder needs the same placeholder in both languages and a `.replace()` at the call site.

## Rulebook-based translations

- Follow [DSA5 instructions](dsa5.instructions.md) for rule lookup: topic documentation, then `docs/dsa5/rules/rulebook-index.md`, then only the relevant printed PDF pages. Never read the whole PDF.
- Use the rulebook's exact German names and abbreviations for talents, combat techniques, advantages, disadvantages, abilities, conditions and equipment.
- For English rule terminology, prefer verified official English rulebook/glossary equivalents. A German source confirms the rule, not its official English name; do not invent an English term or present a literal translation as official.
- If the English equivalent cannot be verified, retain the German term and ask for an approved glossary when an English name is required.
- Keep effect descriptions concise and faithful to the cited rule: preserve scope, prerequisites, exceptions, levels and numerical modifiers. Translation must not introduce or change mechanics.
- Retain printed page references (`S. <page>` in source documentation). English UI may display `p.`, but must preserve the source book/edition and page number; never substitute an unverified English-edition page.
- Record newly verified terminology and its source page in the relevant existing topic documentation so later translations can reuse it. Do not copy rulebook prose.
