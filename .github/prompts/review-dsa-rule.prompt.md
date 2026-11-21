---
description: 'Review code against the DSA5 rulebook: check values, formulas, and source citations.'
argument-hint: 'File, folder, or mechanic to review'
agent: agent
tools: ['search', 'read', 'execute']
---

Review DSA5 rule logic in: ${input:target}

Do not edit code. For each encoded rule:

1. Read the cited `S. <page>` (topic doc, else `python scripts/dsa5_pages.py <page>`). Flag rules with no citation.
2. Compare values, formulas, rounding, min/max limits, and edge cases against the source.
3. Check for duplicated rule logic between server and client, or server/client disagreement.
4. Check that tests exist and that expected values come from the source.

Output a table: `Location | Rule | Source | Status (OK / Mismatch / Unverified / Missing citation) | Note`.
Then list concrete fixes, most severe first.
