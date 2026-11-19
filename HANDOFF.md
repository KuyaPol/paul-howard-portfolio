# Beyond the Portfolio handoff

## Overview

An internal concept showcase lives at `/beyond-the-portfolio/` with a secondary entry point near the end of the existing portfolio. The main portfolio also carries an AI Tools capability entry for ChatGPT (GPT), Claude, and Perplexity. The refinement pass kept the existing page and shell; it corrected selection semantics, added honest local-only prototype controls, strengthened per-concept visual identity, and completed documentation.

## Updated structure

```text
index.html                         main portfolio, entry link, AI Tools capability
beyond-the-portfolio/index.html    dedicated concept page (single file)
css/styles.css                     shared tokens, concept and AI Tools styles
css/responsive.css                 1100/900/760/600/420px behavior
js/app.js                          shared bundle entry
js/main.js                         menu, year, orientation sync, hero entrance
js/beyond-concepts.js              concept selection, local prototypes, transitions
js/animations.js                   IntersectionObserver + Web Animations API reveals
build.mjs                          copies entries and bundles scripts into public/
public/                            generated static output (gitignored)
```

No duplicate page, component, or script was introduced. Browser Tracker files are untouched.

## Design and interaction

The concept page reuses the graphite, lime, violet, Syne, and Manrope system. Its editorial hero, broad wordmark, ruled metadata, three-tab selector, three previews, and three detail sections remain in place. Finance uses a chart/grid motif with lime figures, business uses a ledger-line motif with violet figures, and PC health uses a bezeled monitor composition with a violet sparkline. Each preview is a distinct layout, not a repeated card.

The selector is a real `role="tablist"` containing three `role="tab"` buttons. Each tab controls its own `role="tabpanel"` (`concept-panel-finance`, `concept-panel-business`, `concept-panel-pc`) with matching `aria-labelledby`. Pointer and Arrow/Home/End keys update `aria-selected`, roving `tabindex`, the preview label, the preview title, and the "open details" link target without navigating away. `aria-orientation` stays synced to the 900px breakpoint. Each detail section offers a "Back to concept selection" link that restores the active concept and focus. All existing contact links and navigation remain unchanged.

Local-only prototype controls update sample values through DOM APIs: finance has monthly/yearly figures and a sample budget slider, business has an all/needs-attention inventory filter with a live count, and PC health has a metric selector that swaps an illustrative reading and history. Every affected area is labeled sample or illustrative; proposed integrations are never presented as connected.

## Key HTML / CSS / JS changes

- `beyond-the-portfolio/index.html`: hero copy aligned with the brief; per-panel tabpanel semantics; data hooks for labels, title, detail links, and prototypes; prototype controls; explicit proposed-integration notes; three return links.
- `js/beyond-concepts.js` (new): scoped selection logic, keyboard handling, label/detail-link sync, return-state restoration, the three local prototypes, and a 520ms directional Web Animations API slide that is skipped under `prefers-reduced-motion`.
- `js/main.js`: the old duplicate concept-selection handler was removed; it now only owns menu/year/orientation/hero-entrance behavior.
- `js/app.js`: imports and initializes the new module.
- `css/styles.css`: `--color-violet` / `--color-violet-text` tokens, AI Tools identity (violet rail, badge, note border), per-concept accent scoping, chart/ledger/monitor motifs, control styles, history sparkline, and text-link styling.
- `css/responsive.css`: control wrapping and narrow-width layout for the new controls; AI Tools badge becomes a block on small screens.
- `index.html`: AI Tools copy now includes workflow efficiency.

## Functional and conceptual scope

Functional: concept tabs and keyboard navigation, return-to-selection, all navigation and mailto actions, preview label/title sync, finance period and budget controls, business inventory filter, PC metric selector, responsive layouts, and reduced-motion fallbacks.

Illustrative / proposed: all dashboard figures, inventory records, charts, sparklines, notifications, alerts, market data, TradingView/API connections, PC monitoring, temperature/history/reports, and downloadable reports. The expanded PC concept does not claim these features exist in the current PC Tracker. AI platforms are described as workflow tools, not as Paul's products or credentials.

## Browser Tracker integration

The first portfolio showcase is now **Browser Tracker**, powered by the local Manifest V3 extension in `extension/`. It uses a controlled `externally_connectable` bridge: the page sends `TRACKER_PING` and, after the visitor enables **Share with portfolio**, `TRACKER_SNAPSHOT`, `SET_PAUSED`, and `CLEAR_DATA` to a fixed extension ID. Manifest allowlisting plus a `sender.url` path check restrict this to the GitHub Pages origin `https://kuyapol.github.io/paul-howard-portfolio/` and local development hosts. Only aggregated daily/domain totals cross the bridge; no URLs, titles, history, page content, or server uploads are involved. `js/browser-tracker.js` polls every three seconds and renders live values with DOM APIs and `textContent`. Without an installed/consenting extension the page shows a "not connected" state with installation steps and a demonstration explicitly labeled illustrative. The original Python PC Tracker is a separate project; its GitHub link is retained and relabeled.

## Accessibility, responsiveness and limitations

Native links and buttons provide keyboard access and visible focus. Concept tabs implement Arrow, Home, and End navigation and expose correct panel relationships. Reduced motion disables the switch transition, hero entrance, and reveal motion. The AI Tools badge uses CSS-generated text; if exact accessible-name matching is later required, convert it to real text inside the heading. Lighthouse reports one pre-existing failure on the main portfolio's `.profile-card` (`label-content-name-mismatch`); it is outside this task and was left unchanged.

No new runtime dependency, API call, storage, or network request was added. No fake API or live-data claim was introduced. Screenshot capture was unavailable in the browser harness, so visual confirmation is code-, DOM-, and computed-style-based rather than pixel-based.

## Verification results

- `node --check` on `js/beyond-concepts.js`, `js/main.js`, and `js/app.js`: passed.
- `npm run build`: passed; `public/` regenerated and contains the new source.
- `git diff --check`: passed (only existing LF/CRLF warnings).
- Browser DOM checks on the built page: tab click, Arrow/Home/End keyboard selection, roving tabindex, label/title/detail-link sync, 3 panel roles, return-to-selection, finance period/budget, business low-stock filter, PC metric selection, and 3 return links all behaved as intended. No console errors.
- Responsive checks via same-origin iframes at 600px and 900px: selector row/horizontal orientation at both widths, stacked stage, two-column finance preview, one-column business preview, column PC preview, and wrapped controls. AI Tools badge verified at 600px and 1200px.
- Reduced-motion check: with `prefers-reduced-motion` forced, switching concepts produced 0 running animations; normal motion produced 1.
- Lighthouse on `/beyond-the-portfolio/`: accessibility, best practices, and SEO all 1.0, no failures. On the main portfolio: all 1.0 with the pre-existing profile-card failure noted above.

No staging, commit, push, or deploy was performed.

## Commands

- Development preview: `npm run dev`
- Static build: `npm run build`
