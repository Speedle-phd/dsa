# DSA5 Heldenbogen

Project instructions are shared with GitHub Copilot; the files in `.github/` are the source of truth.

@.github/copilot-instructions.md

## Read before working on

| Area | File |
|---|---|
| DSA5 rules, catalogs, `server/src/utils`, `server/src/validations`, `client/src/features/heroes`, `docs/dsa5` | `.github/instructions/dsa5.instructions.md` |
| Any `.ts`/`.tsx` (style, layering, verify commands) | `.github/instructions/typescript.instructions.md` |
| Client UI (`.tsx`, `.css`) | `.github/instructions/ui-patterns.instructions.md` and `responsive.instructions.md` |
| User-facing text, `client/src/locales` | `.github/instructions/translations.instructions.md` |
| Tests | `.github/instructions/tests.instructions.md` |
| Implementing or reviewing a rule | `.github/prompts/implement-dsa-rule.prompt.md`, `review-dsa-rule.prompt.md` |

These project conventions win over personal defaults. This app uses Tailwind v4 with a legacy `tailwind.config.ts` (`@config`) and mostly custom component classes in `client/src/index.css`, MongoDB/Mongoose, and Bearer tokens from `localStorage`; extend these patterns, don't migrate them unasked.

Current state, decisions and open issues: `HANDOFF.md`. Rule knowledge: `docs/dsa5/rules/rulebook-index.md` → topic docs.
