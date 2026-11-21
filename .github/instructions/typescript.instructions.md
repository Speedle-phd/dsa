---
description: 'TypeScript, React, and Express conventions for this project.'
applyTo: '**/*.ts, **/*.tsx'
---

# TypeScript conventions

- 3-space indentation, no semicolons. Client uses single quotes, server uses double quotes — match the file you edit.
- Strict typing; avoid `any`. Prefer `type` aliases and `as const` data tables.
- Validate request/form data with Zod at boundaries (`server/src/validations/`, `client/src/features/**/…Schema.ts`).

## Client (`client/`)

- React 19 + Vite, TanStack Query for server state, Zustand for client state, react-hook-form + Zod for forms, Tailwind for styling.
- Import via the `@/` alias. User-facing strings go through `client/src/locales/translation.json`.
- Follow [translation instructions](translations.instructions.md), including rulebook-based terminology.
- Feature code lives in `client/src/features/<feature>/`.
- A `.tsx` file exports only components (lint rule `react-refresh/only-export-components`); hooks, helpers and constants shared with other files go into a `.ts` file next to it.

## Server (`server/`)

- Express 5 + Mongoose. Layering: `routes` → `controllers` → `models`/`utils`, response shaping in `views`.
- Throw errors from `server/src/utils/appError.ts`; the central `errorHandler` formats them.
- Shared API shapes live in `server/src/types/apiContracts.ts`.
- `stats.model.ts` is already large (user request): don't keep growing it. Records with their own lifecycle or list semantics (e.g. Sammelproben, logs, histories) get their own model in `server/src/models/<name>.model.ts`, referencing the hero by `statsId` + `userId` (always query by both), with their own controller and validation. Keep in `stats` only small values that the rule engine reads together on every load (attributes, resources, Zustände, statuses, entries).
- Companions have their own model (`companion.model.ts`). Equipment stays in `stats`: the rule engine reads it on every load and purchases change purse and equipment in one atomic save. Spells are a possible candidate; move a collection only with a migration and the user's approval.

## Verify

- Client: `npm run test`, `npm run build` and `npm run lint` in `client/`.
- Server: `npm run build` and `npx vitest run` in `server/`.
