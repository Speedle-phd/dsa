---
description: 'Implement a DSA5 rule in the codebase, grounded in the rulebook with source pages.'
argument-hint: "Rule to implement, e.g. 'Lebensenergie berechnen'"
agent: agent
---

Implement this DSA5 rule: ${input:rule}

1. Find the rule following the lookup order in [dsa5.instructions.md](../instructions/dsa5.instructions.md). Extract only the pages you need.
2. If no topic doc exists for it, create one per [summarize-dsa-rule.prompt.md](./summarize-dsa-rule.prompt.md) first.
3. List any ambiguity or missing values and ask before continuing. Do not guess.
4. Find existing code touching this mechanic (server `utils`/`validations`, client `features/heroes`). Extend it rather than duplicating.
5. Implement: data table + pure function on the server, with `// source: DSA5 Regelwerk, S. <page>`. Mirror on the client only if the UI needs it.
6. Add or update tests per [tests.instructions.md](../instructions/tests.instructions.md).
7. Build `server/` and `client/` and fix errors.
8. Report: files changed, source pages used, open questions.
