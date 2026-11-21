---
description: 'Use when writing or updating tests, especially tests for DSA5 rule logic.'
applyTo: '**/*.test.ts, **/*.test.tsx, **/*.spec.ts'
---

# Testing

- Both packages use Vitest: `cd server && npx vitest run`, `cd client && npm run test`. Client tests cover pure rule mirrors (e.g. `combatSituation.test.ts`); UI is verified in the browser.
- Place tests next to the code: `foo.ts` → `foo.test.ts`.
- Test DSA5 rules as pure functions: table-driven cases with inputs and expected outputs.
- Every rule test cites its source in the `describe` name, e.g. `describe('Steigerungskosten (S. <page>)', …)`.
- Expected values must come from the rulebook or a topic doc in `docs/dsa5/rules/`, never from the implementation under test.
- Cover boundaries: minimum/maximum values, table edges, and invalid input.
