# Project

DSA5 (Das Schwarze Auge, 5. Edition) hero manager: `client/` (React + Vite), `server/` (Express + MongoDB).

- DSA5 mechanics: follow `.github/instructions/dsa5.instructions.md`. Never invent rules; cite `S. <page>`.
- Rule knowledge: `docs/dsa5/rules/rulebook-index.md` → topic docs → `python scripts/dsa5_pages.py <pages>`. Archiv der Kräuter: `docs/dsa5/rules/archiv-der-kraeuter-index.md`, pages via `--book kraeuter`. Never read the whole PDF.
- Keep changes minimal and match existing code style.
- UI work: follow `.github/instructions/ui-patterns.instructions.md` and `responsive.instructions.md`.
- Current state and open work: see `HANDOFF.md` in the repo root.

## Development stack

- `docker compose up -d` (`compose.yml`) starts **production** (nginx on 8080, bundled server). For development add the overlay: `docker compose -f compose.yml -f compose.dev.yml up -d` starts `client` (Vite, 5173), `server` (tsx watch, 3000) and `mongo` (MongoDB 8, `127.0.0.1:27017`). Details: `HANDOFF.md` → "Running the app". Secrets live in the root `.env` (template `.env.example`); compose builds the server's `MONGO_URI` from them, overriding `server/.env`.
- `client/` and `server/` are bind-mounted, so edits reload in the containers; `node_modules` are named volumes. After changing `package.json`, run `docker compose -f compose.yml -f compose.dev.yml exec <service> npm install` (the named volume keeps old packages otherwise).
- Logs: `docker compose -f compose.yml -f compose.dev.yml logs -f server`. Tests can still run on the host (`npm run test` in `client/`/`server/`).

## Browser verification

- Dev servers: client `http://localhost:5173`, API `http://localhost:3000` (the development stack, see above; plain `docker compose up` is production on 8080).
- Use Playwright via `playwright-core` with the installed Edge (`chromium.launch({ channel: 'msedge' })`). No browser download is needed. Keep scripts and screenshots outside the repo (temp/scratch folder).
- Log in by registering or logging in through the API and setting `localStorage['dsa5.auth.token']` in an init script. The language is `localStorage['dsa5.language']`. Tokens expire quickly; log in again when redirected to `/login`.
- Screenshot desktop (1280) and phone (390, and 360 for tight layouts). Inspect computed styles when CSS "doesn't apply".
- Known issue: Vite sometimes misses writes to `client/src/index.css`, so the page serves stale styles. Re-save/touch the file or restart `npm run dev` before debugging CSS.
- The API rate limit is 2000 requests / 15 min in development (1000 in production, `apiLimiter` in `server/src/server.ts`); logins are limited separately, so log in once per run and reuse the token.
- Scripts that change the test hero back up what they touch and restore it in a `finally` block (equipment via `PUT /api/stats/update/:id { equipment }`, statuses/conditions via `combat-settings`, purse via `adjust-purse`). Label chips and buttons by the active language (`en`: "Shortbow", `de`: "Kurzbogen").
- To test the fight panel without the INI dialog, seed `localStorage['dsa-fights']` (`{ state: { fights: { [heroId]: Fight } }, version: 0 }`) in an init script, guarded so it runs once.
- Scripts that roll a lot can switch on quick rolls (no 3D animation): `localStorage['dsa5.dice'] = '{"state":{"quick":true},"version":0}'` in the init script.
- Rare dice results (crit confirmations, critical parries) can be forced with quick rolls on: an init script replaces `crypto.getRandomValues` for single-value calls with a queue (`window.__dice = [1, 20]` → next W20s roll 1, then 20), falling back to real random when the queue is empty.
- In the fight window, target headings/buttons by `#battle-dock-title` and the window's own sections; folded sections (`details`) contain nested headings with the same words, so select the summary directly (`.battle-dock-column > .battle-dock-more > summary`).
- Themes: `localStorage['dsa5.theme'] = '{"state":{"theme":"ember"},"version":0}'` (light, dark, parchment, ember, system); check new colour tokens with `client/src/theme/themes.test.ts`.
- Parties (GM + players) are live via Socket.IO on the API port (dev: `localhost:3000`, production: nginx `/socket.io/`). Test them with one browser context per user (own token each) and wait for updates without reloading; see `HANDOFF.md` → "Parties & realtime".
- With several cards per page, target buttons by their unique `aria-label` (e.g. "Attacke würfeln: Rex, Biss"); sticky headers can cover element screenshots, so scroll the element to the middle first.
