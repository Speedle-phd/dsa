---
description: 'Use when creating or changing client UI, layouts, or styles. Responsive design requirements.'
applyTo: 'client/src/**/*.tsx, client/src/**/*.css'
---

# Responsive design

- Every new or changed UI must work on mobile (~360px wide), tablet and desktop. Design mobile-first.
- Styles live in `client/src/index.css`. Existing breakpoints: `min-width: 1100px` (section-link rail beside the content; below it a chip row), `max-width: 760px` (layout), `520px` / `640px` (small phones) and `380px` (nested, only for the ~360px talent card). Reuse them; don't add new ones without a reason.
- Multi-column grids must collapse to one column on small screens (see `.equipment-summary-grid`, `.equipment-form-grid`).
- Tables on mobile use the stacked-card pattern with `data-label` attributes on `<td>` (see `TalentsTab.tsx`).
- Prefer `minmax(0, 1fr)`, `flex-wrap`, and `gap` over fixed widths; avoid horizontal page scroll.
- Wrap prose at word boundaries. Do not use `overflow-wrap: anywhere` or `word-break: break-all` for labels, names, or table headings. Use language-aware `hyphens: auto` and the correct `lang` for German rule names; adapt column widths or use a contained table scroll instead of arbitrary mid-word breaks.
- Touch targets (buttons, selects, inputs) should be at least ~40px high on mobile.
- Grid columns with `minmax(0, 1fr)` report a min-content width of 0 and let content overflow into neighbours; use `min-content`/`max-content` for cells whose content must not be squeezed (e.g. name cells).
- On phones (≤520px): tile grids use 3 columns so full names fit (with soft hyphens in long German labels); icon actions move to their own row under a card title; value groups stack under their label. In narrow boxes put numbers below their label instead of beside it.
- Font sizes use the type scale tokens in `index.css` (`--fs-2xs` 12px … `--fs-3xl`); never go below `--fs-2xs`. Don't add ad-hoc rem sizes.
- Portalled dialogs render outside the tab panel: set `lang={language}` on them so German words hyphenate.
- Don't reuse generic panel classes (e.g. `.state-panel`, `.empty-state`) for content cards without checking their padding/alignment; override per context.
- Verify in the browser at 360/390px and 1280px before finishing UI work (see "Browser verification" in `copilot-instructions.md`). Check real screenshots; CSS that looks right in the file can still be overridden.
- See [UI patterns](ui-patterns.instructions.md) for dialogs, dice flows, modified values, tooltips and tables.
