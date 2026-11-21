---
description: 'Use when building or changing client UI: dialogs, dice rolls, modified values, tooltips, tables. Established visual and interaction patterns of this app.'
applyTo: 'client/src/**/*.tsx, client/src/**/*.css'
---

# UI patterns

Follow [responsive instructions](responsive.instructions.md) for layout. These are the app's established patterns — reuse them instead of inventing new ones.

## Design system (Nov 2026, after `../chore_app`)

- Look: white cards (`--background-50`) on a soft tinted page (`--background-100`), sage brand (`--primary-*`), warm amber accent (`--accent-*`), neutral borders (`--background-200/300`), Geist (`@fontsource-variable/geist`, `--font-sans`). Shapes: `--radius-sm` (controls) and `--radius-md` (cards, panels), pills `999px`; shadows `--shadow-card`, `--shadow-raised`. Use these tokens, never raw px radii or new colours.
- Light and dark theme: `ThemeToggle` in the header and on the login page cycles Light → Dark → System (`theme/themeStore.ts`, key `dsa5.theme`; `index.html` applies it before the first paint). Dark mode is the `.dark` class with its own surface scale (cards lighter than the page). Never hard-code colours: status colours are `--danger`, `--success`, `--warning`; shadows and backdrops use `--shadow-color`. Check new UI in both themes.
- Header controls (AP switch, language, theme, sign out) are pills in the navigation style: muted track, white active segment (`.language-toggle`, `.header-control`).
- Entry lists add with a round "+" next to the list title (`.entry-add-button`); the full action name is its `aria-label` and tooltip.
- Hero tabs keep their own hue (`data-hero-theme` → `--hero-hue`) as an accent in a muted scale; don't add saturated per-tab colour areas.
- Page titles: `PageHeading` (`components/PageHeading.tsx`): icon tile, semibold title, lead line, actions below. The hero page uses the same pattern with an initials tile (`.hero-avatar`).
- Main navigation: `DashboardHeader` shows a pill bar (Heroes, the opened hero, Store, Services) with the current page marked; on phones only the current page shows its name.
- Long pages get section links: `SectionNav` (`components/SectionNav.tsx`) finds every top-level `.overview-section` (label = its first h2/h3/summary without the ⓘ tooltip) or explicit `data-nav-label` targets (e.g. talent groups, store categories) and marks the section in view. Wide screens (≥ 1100px): sticky rail beside the content (`.hero-tab-layout` / `.section-layout`); smaller: sticky chip row under the tab bar. Hidden with fewer than three sections. New cards appear in it automatically; give a section a `data-nav-label` when its heading is missing or too long.
- The sticky tab bar publishes its height as `--sticky-offset`; jump targets use `scroll-margin-top` from it. Anything else sticky below the tab bar must stack under that offset.

## Values and modifiers

- Show modified values with `CheckValue` / `ModifiedValue`. The effective value is a soft tinted pill (`.check-modifier`: red = harder, green = easier); the base value beside it is muted. Never style modifiers with heavy borders or per-screen variants.
- Get effective targets from `useCheckState` (`features/heroes/checkState.ts`) so dialogs, tables and rolls always agree. Don't recompute modifiers locally.
- Small labels go on top of values (abbreviation as label, full name muted below), e.g. attribute tiles, Kampfwerte tiles, companion tiles. Rows with several numbers label each one (e.g. "Attacke / Trefferpunkte / Reichweite") instead of bare abbreviations.
- Derived values show how they are made up (e.g. "20 (Zauberer) + KL 13 + 2 (Vor-/Nachteile) = 35", `energy.ts`) next to the value or in its editor section.

## Dice flows

- Shape every roll as: setup (modifiers, chance/preview, blocking reasons) → roll (3D dice, "Rolling…") → result (per-die breakdown, clear outcome badge) → explicit dismiss ("Done"). "Roll again" returns to setup; it never re-rolls silently.
- Throw dice only through `components/diceEngine.ts` (`throwColoredDice`, `throwD20s`). It shares one 3D canvas and falls back to random numbers. W2/W3 have no 3D die: they are thrown as a W6 and converted (`physicalDie`); other sizes without a physical die fall back to random numbers.
- Reuse the roll building blocks: 3W20 checks → `ProbeDialog` (talents, spells, companions; `attributes`, optional `check`, `fate`); single W20 with Bestätigungswurf → `rollD20` (`d20.ts`); Schip actions → `FateActions.tsx` (`FateD20Actions`, `FateDamageReroll`, `FateRoundActions`) with `useFatePoint` (`fate.ts`). Reroll advantages come from `RollEffect.reroll`: Begabung/Unfähig in `ProbeDialog`, Waffenbegabung via `ConfirmationReroll`. AsP spends go through `useManaSpend` (`magicApi.ts`) so Schwacher Astralkörper and Lästige Mindergeister apply.
- Colour dice so they map to what they test: red/blue/green = 1st/2nd/3rd attribute (S. 22). For other rolls use one colour per purpose (attack red, defense blue, damage gold).
- Persist only what the rules change (LeP, AsP, KaP, Schips) on the server. Roll mirrors on the client are UX only.
- Rules left to the GM (retry penalties, optional rules) are offered as visible toggles or buttons, never applied automatically. Remember an optional-rule choice per browser (localStorage, wrapped in try/catch).

## Choices and toggles

- Numeric presets (difficulty) use `.probe-difficulty-presets`, a fixed 7-column grid. Text choices (check type, side, incoming attack, outcomes) use `.probe-segmented`: one-line labels that wrap as whole buttons, the explanation of the selected option once below (`.probe-segmented-note`), not inside every button.
- Many on/off options (statuses) are pills that wrap as a group (`.combat-status-list`) with names on one line; no fixed-width grid boxes with long German words.
- Free text with known examples: one text field in the row (same height as its neighbours) and the examples as chips on their own full-width line below (`SuggestionChips`, `.suggestion-chips`); a chip fills the field, the chosen one is highlighted (`aria-pressed`). Never a second dropdown stacked next to the field.
- Tabs and sections the hero can't use are hidden, not disabled (Arkanes/Götterwirken via `heroCapabilities.ts`); keep them visible while recorded data exists.
- Stacked control groups need their own spacing: add a scoped rule where two groups meet (e.g. `.fight-panel .probe-segmented + .fight-options`) instead of changing the shared class.
- Native checkboxes and radios take the theme color through the base rule (`accent-color: hsl(var(--primary-600))`); on hero pages that is the hero's hue. Don't restyle them per component.
- Inputs the GM provides go into a collapsible card (`.fight-situation`), opened automatically when something is set; modifiers they cause show as labelled chips with the page (`SourceList`).

## Dialogs

- Render dialogs with `createPortal` to `document.body`, `role='dialog' aria-modal='true'`, `useModalKeyboard(onClose)`, and `lang={language}` (portals sit outside the tab panel's `lang`).
- Stacked dialogs are fine: `useModalKeyboard` only lets the topmost dialog handle Escape/Tab.
- Long dialogs get a sticky footer so the primary action stays visible (see `.talent-probe-dialog .editor-actions`).
- On phones, footer and action buttons stay on one line (`white-space: nowrap`), or each takes a full-width row. No 2–3-line button labels.

## Lists of records

- Section placement: pair short sections with tall ones in `.combat-two-column` (e.g. Status beside Zustände) and let wide content span the row (`.combat-wide-section`), so no column leaves a large empty gap.
- Records with many fields (spells, curses, companions) are cards in an auto grid (`repeat(auto-fill, minmax(min(100%, Xrem), 1fr))`), not wide tables. Rich records (companions) use full-width cards with two inner columns.
- A card's header holds the dice button, name and a muted subtitle (kind · Merkmal · StF); actions are icon buttons on the right (Details, edit, remove) with `title` and an `aria-label` that includes the record's name, so labels stay unique across cards.
- Prefer one-click actions per item (e.g. "Learn · 10 AP" on each trick card) over a select plus a separate button.

## Disabled states and hints

- A disabled control must say why, visibly (an inline hint) or at least in `title` / tooltip. Don't rely on `title` alone on touch devices for important reasons.
- Inactive items (e.g. talents without a value) stay readable: mute the name, don't fade the whole row with opacity.
- When every option in a group is blocked for the same reason (e.g. no familiar AP), say so once above the group and name the way out (raise AP with Edit, or turn off "Spend AP").

## Tooltips and rule texts

- Rule explanations go in a tooltip behind an ⓘ icon (`Tooltip` with `clickToToggle`). Multi-line content uses `\n` (tooltips use `white-space: pre-line`).
- Keep long rule texts in a data file as `{ de, en }` objects with a page reference (see `conditionInfo.ts`, entry effects), separate from components.
- If the core rulebook doesn't define something, say so in the UI ("not defined in the core rules") instead of guessing.

## Tables

- Give the name column most of the width. Never set `width: 100%` on a single cell: it takes all spare width and ignores the header hints.
- Keep a value and its inline controls on one line (`flex-wrap: nowrap`), e.g. FW + "+" + AP cost.
- Category-heavy tables mark each group with `data-nav-label` so it appears in the section links (`SectionNav`); no separate jump buttons.

## CSS hygiene

- Don't write broad descendant rules like `.dashboard-content p:last-child`. They silently restyle nested components. Scope to the element you mean (e.g. `h1 ~ p`).
- New sizes use the type scale tokens; new colours use the HSL tokens (`--text-*`, `--primary-*`, `--accent-*`) so both themes work.
- Remove CSS and translation keys that a change makes unused (check with a search first).
