---
description: 'Extract a DSA5 mechanic from the rulebook PDF into a compact topic doc under docs/dsa5/rules/.'
argument-hint: "Mechanic and optional pages, e.g. 'Abgeleitete Werte S. 34-36'"
agent: agent
---

Create or update a topic doc for: ${input:mechanic}

1. Find the pages via [rulebook-index.md](../../docs/dsa5/rules/rulebook-index.md), then run `python scripts/dsa5_pages.py <pages>` (use `--grep` to narrow).
2. Write `docs/dsa5/rules/<topic>/<kebab-name>.md` where `<topic>` is one of: `character`, `combat`, `skills`, `magic`, `karma`, `alchemy`, `equipment`.
3. Use this structure and keep it short — summaries and value tables only, no copied prose:

   ```markdown
   # <Mechanic, German term>

   source: DSA5 Regelwerk, S. <pages>

   ## Summary

   <2–5 bullets: what it does, when it applies>

   ## Values / formulas

   <tables and formulas the code needs; use DSA5 abbreviations>

   ## Edge cases

   <rounding, min/max, exceptions>

   ## Open questions

   <anything unclear in the source; omit if none>

   ## Code

   <existing files implementing this; omit if none>
   ```

4. Add the doc to the "Topic docs" table in `rulebook-index.md`.
