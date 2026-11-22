# Signal / Systems — Local Visual Prototype

Static visual prototype for Design Phases 5–16 plus the Phase 11 P—03 addendum. The earlier phase records below are historical; Phase 14 published the approved Phase 13.1 prototype at the production root routes, and Phase 15 keeps this prototype's Profile and About files aligned with those production routes. This directory is not published by `build.mjs`.

## Phase 16: P—04 SEREIN proposal

P—04 is now declared as the fourth personal software project. The Work grid uses a 2×2 desktop layout, the About project list uses two columns, and the Project Network shows seven nodes: four project destinations and three studies. SEREIN is deliberately marked `PROJECT PROPOSAL / PLANNED` with cyan dashed styling and is never presented as completed software.

| Node | Destination |
| --- | --- |
| Browser Tracker | `projects/browser-tracker.html?from=network&node=browser` |
| Live Voice to Text | `projects/live-voice-to-text.html?from=network&node=voice` |
| Interactive Experiments | `projects/interactive-experiments.html?from=network&node=experiments` |
| SEREIN | `projects/serein.html?from=network&node=serein` |
| Three studies | unchanged: local `study-*` panels |

`projects/serein.html` is a static proposal destination with the supplied overview, planned capabilities, architecture schematic, development status, the `Download Full Project Proposal` CTA, and a Back to Project Network control. The authoritative PDF is a supplied asset at `../assets/docs/SEREIN_Full_Project_Proposal_Paul_Howard_Chavez.pdf`; no replacement PDF is generated.

### Phase 16 files

- `index.html`, `about/index.html`, `beyond-the-portfolio.html` — fourth Work card, About entry, and planned network node.
- `projects/serein.html` — dedicated proposal destination.
- `prototype.css`, `about.css`, `project.css` — planned styling, 2-column layouts, SEREIN node placement, and cache-busting.
- `prototype.js`, `projects/project.js` — SEREIN route/state index and return handling.
- `docs/serein.md` — proposal status boundaries and provenance notes.

## Phase 15: Profile expansion & About route

- `index.html` and `prototype.css` now match production's exact Profile heading, introduction, and `View More →` call to action.
- `about/index.html` mirrors the production About route with prototype-relative asset paths. It keeps the same Syne/Manrope/IBM Plex Mono type system, restrained cyan/lime accents, and reduced-motion behavior.
- `site-fade.css` and `site-fade.js` provide the lightweight cross-page fade and the About page's mobile menu; they are mirrored in production as `css/site-fade.css` and `js/site-fade.js`.
- Verified locally across `1440×900`, `1366×768`, `1024×768`, `390×844`, and `320×568`, including View More, Back to Profile, browser Back/Forward, keyboard focus, reduced motion, and zero horizontal overflow.

## Phase 13.1: Beyond hero typography & spacing

Phase 13.1 is a targeted follow-up to the Lab Overview hero in `beyond-the-portfolio.html`. It reduces the oversized `140.8px` heading, rebalances the text column, and gives the supporting copy and CTA room to breathe. No global typography tokens, Three.js logic, Project Network, deep-dive pages, dialogs, navigation transitions, performance tiers, or accessibility features were changed.

### Files changed

- `prototype.css` — Lab-Overview-only heading clamp, line-height, heading/description spacing, text-column cap, content max-width, and grid gap.
- `index.html` and `beyond-the-portfolio.html` — cache-busting `prototype.css?v=19` (the shared stylesheet is linked by both pages).
- `screenshots/` — Phase 13.1 before, after, and reduced-motion captures.
- `README.md` — this Phase 13.1 record.

### Before → after at `1440×900`

| Metric | Before | After |
| --- | --- | --- |
| Heading | Syne `140.8px/123.904px`, tracking `-10.56px` | Syne `98.88px/104.813px`, tracking `-5.4384px` |
| Heading lines | 6 | 4 |
| Heading bottom | `883px` | `~600px` |
| Description top | `899px` | `628px` |
| CTA bottom | `1051px` (below viewport) | `783px` (visible) |
| Heading → description gap | `16px` | `24px` |
| Description → CTA gap | `24px` | `28px` |

### Final responsive values

| Viewport | Heading | Lines | Horizontal padding | Content right margin | Visual panel right margin | CTA |
| --- | --- | ---: | --- | --- | --- | --- |
| `1440×900` | `98.88px/104.813px` | 4 | `79.2px` | `81px` | hidden; full-bleed canvas | bottom `783px`, visible |
| `1366×768` | `100.3px/106.318px` | 4 | `75.13px` | `75px` | hidden; full-bleed canvas | bottom `740px`, visible |
| `1024×768` | `83.2px/88.192px` | 5 | `56.32px` | `56px` | `56px` | bottom `756px`, visible |
| `390×844` | `40px/42.4px` | 3 | `20px` | `20px` | `24px` | bottom `522px`, visible |
| `320×568` | `40px/42.4px` | 5 | `20px` | `20px` | `34px` | below initial fold; reachable by internal scroll |

The desktop clamp is `clamp(4.5rem, 1.5rem + 5.2vw, 7rem)` with `line-height: 1.06` and `letter-spacing: -0.055em`. The lab copy is capped at `720px`, the inner content at `1280px`, and the grid gap at `clamp(40px, 5vw, 72px)`. Mobile continues to use the existing `--type-h1`/`--type-h2` overrides, so desktop sizes are not forced onto small screens.

### Phase 13.1 verification

Playwright/Chromium checks at all five required viewports confirmed: four Syne lines at `1440×900` and `1366×768`; description and CTA visible on desktop; CTA reachable by internal scroll at `320×568`; zero horizontal overflow; zero clipped or out-of-bounds visible text; zero console errors. Reduced-motion emulation at `1440×900` and `390×844` kept the same heading/CTA geometry, set scene transition duration to `0s`, and produced no errors. Advancing from Lab Overview still reaches `scene-concepts`.

Automated checks do not establish visual quality. The screenshots below are captured for human review, not treated as visual sign-off.

### Phase 13.1 screenshots

Before: `phase13-1-beyond-lab-1440-before.png`, `phase13-1-beyond-lab-390-before.png`.

After: `phase13-1-beyond-lab-1440-after.png`, `phase13-1-beyond-lab-1366-after.png`, `phase13-1-beyond-lab-1024-after.png`, `phase13-1-beyond-lab-390-after.png`, `phase13-1-beyond-lab-320-after.png`.

Reduced motion: `phase13-1-beyond-lab-1440-reduced-after.png`, `phase13-1-beyond-lab-390-reduced-after.png`.

## Phase 13: production typography sync

Phase 13 compares the live production portfolio against the local prototype with Playwright MCP and brings the prototype's type scale, weights, leading, tracking, hierarchy, and supporting copy into line with the verified live computed styles. The production layout limitations were **not** copied: the prototype keeps its own spacing, scene composition, project identities, and Phase 12 network sphere.

### Shared type system

- `typography.css` is now the single source for the local font faces and type tokens. The Syne and Manrope files are byte-identical to production (`CE5AC77142A65CAB2248A1A2EBB740B1D4D9…` and `3AE11C49DB0455A3CC33E37D380F20FDB8C7…`); duplicate `@font-face` blocks were removed from `prototype.css` and `projects/project.css`.
- Tokens: `--type-display: clamp(4.5rem, 2.5rem + 7vw, 9rem)`, `--type-h1: clamp(3.5rem, 2rem + 5vw, 7rem)`, `--type-h2: clamp(2.5rem, 1.6rem + 3.2vw, 4.5rem)`, `--type-h3: clamp(1.25rem, 1rem + 1.2vw, 2rem)`, `--type-body: 1rem`, `--type-small: 0.875rem`, `--type-label: 0.75rem`, and `--leading-body: 1.65`.
- The eight required headings are exact: Hero “Building practical software for real problems.”; Work “Selected work, from tools to experiments.”; Capabilities “The skills behind the systems.”; Profile “The person behind the projects.” (Phase 15); Contact “Have a project in mind? Let's talk.”; Lab Overview “Exploring ideas beyond the finished product.”; Concepts “Experiments in motion, interaction, and software.”; Project Network “Explore the systems behind the work.”
- Main Contact and Beyond hero use the display token; other scene headings use the section token; body copy is `16px/26.4px`; descriptions use shared small/body sizing; study dialogs and project documentation now inherit the same scale.
- The long P—03 status heading wraps at `320px`. Phase 13 originally widened the lab text column for a `140.8px` Beyond display heading; **Phase 13.1 supersedes that decision** with a smaller Lab-Overview-only clamp and a short-desktop height guard.
- Stylesheet links carry cache-busting query strings after stale computed CSS was observed: `typography.css?v=13`, `prototype.css?v=19` (Phase 13.1), `project.css?v=14`, and `experiments.css?v=14`.

### Verified computed baseline at `1440×900`

| Element | Live production | Prototype after Phase 13 |
| --- | --- | --- |
| Body | Manrope `16px/26.4px` `400` | Manrope `16px/26.4px` `400` |
| Eyebrow | Manrope `12px/18px` `600`, `0.48px` | IBM Plex Mono `12px/18px` `600`, `0.96px` — intentional family/tracking difference |
| Hero H1 | Syne `88px/86.24px` `700`, `-5.28px` | Syne `88px/86.24px` `700`, `-5.28px` |
| Scene H2 | Syne `71.68px/70.2464px` `600`, about `-3.94px` | Syne `71.68px/70.2464px` `600`, `-3.9424px` |
| Main Contact H2 | Syne `140.8px/133.76px` `600`, `-8.448px` | Syne `140.8px/133.76px` `600`, `-8.448px` |
| Beyond hero H1 | Syne `140.8px/123.904px` `700`, `-10.56px` | Syne `140.8px/123.904px` `700`, `-10.56px` in Phase 13; **superseded in Phase 13.1** by `98.88px/104.813px`, `-5.4384px` |
| Nav links | Manrope `14px` `600` | Manrope `14px` `600` |
| Wordmark | Syne `32px` `700` | Syne `32px` `700` |

Project deep dives measured Syne `104px/97.76px` H1, Syne `71.68px/70.2464px` documentation H2, Syne `32px/36.8px` H3, and Manrope `16px/26.4px` body at `1440×900`; at `320×568` the H1 is `40px` and documentation H2 is `34px`. P—03 uses the verified lab-hero variant at `98.88px/92.9472px`.

### Phase 13 verification

Playwright/Chromium checks at `1440×900`, `1366×768`, `1024×768`, `390×844`, and `320×568` covered the five main scenes, three Beyond scenes, and P—01/P—02/P—03 documentation pages: `55` viewport/surface combinations. All three font families loaded; computed families, weights, sizes, line heights, and tracking matched the intended tokens; all eight exact headings were present; and there were zero console errors.

- Zero document horizontal overflow and zero clipped or out-of-bounds visible text in every scene and project page. The only off-viewport items are links inside the intentionally horizontally scrollable mobile documentation navigation.
- Scene transitions still advance one step: `PageDown` from Hero reaches Work with the outgoing `is-leaving` scene present during the crossfade.
- Study dialogs open at every viewport with Manrope `16px/26.4px` body copy, zero overflow, working close, and no console errors.
- Project Network activation reaches `projects/interactive-experiments.html?from=network&node=experiments`; the return link restores `?from=network&node=experiments&focus=1#scene-project-network`, the network scene, and the selected `experiments` node.
- Sampled contrast ratios against the effective dark backgrounds: eyebrow `15.44:1`, hero intro `7.05:1`, nav `11.87:1`, primary button `15.44:1`, documentation body `10.90:1`, project return `11.44:1`, status badge `10.89:1`, inline code `12.16:1`.
- Automated checks do not establish visual quality. The screenshots below are captured for human review, not treated as sign-off.

### Phase 13 screenshots

Before: `phase13-live-production-1440-before.png`, `phase13-live-beyond-1440-before.png`, `phase13-prototype-main-1440-before.png`, `phase13-prototype-p01-1440-before.png`, `phase13-prototype-p02-1440-before.png`, `phase13-prototype-p03-1440-before.png`.

After: `phase13-prototype-main-1440-after.png`, `phase13-prototype-main-1440-scene-hero-after.png`, `phase13-prototype-main-1440-scene-contact-after.png`, `phase13-prototype-main-390-scene-hero-after.png`, `phase13-prototype-main-390-scene-contact-after.png`, `phase13-prototype-beyond-scene-lab-hero-1440-after.png`, `phase13-prototype-beyond-scene-concepts-1440-after.png`, `phase13-prototype-beyond-scene-project-network-1440-after.png`, `phase13-prototype-beyond-scene-lab-hero-1366-after.png`, `phase13-prototype-beyond-scene-lab-hero-1024-after.png`, `phase13-prototype-beyond-scene-lab-hero-390-after.png`, `phase13-prototype-beyond-scene-lab-hero-320-after.png`, `phase13-prototype-beyond-scene-project-network-390-after.png`, `phase13-prototype-beyond-scene-project-network-320-after.png`, `phase13-prototype-study-dialog-1440-after.png`, `phase13-prototype-study-dialog-390-after.png`, `phase13-prototype-study-dialog-320-after.png`, `phase13-prototype-p01-1440-after.png`, `phase13-prototype-p02-1440-after.png`, `phase13-prototype-p03-1440-after.png`, `phase13-prototype-p01-390-after.png`, `phase13-prototype-p02-390-after.png`, `phase13-prototype-p03-390-after.png`, `phase13-prototype-p01-320-after.png`, `phase13-prototype-p02-320-after.png`, `phase13-prototype-p03-320-after.png`.

### Intentional differences from production

- IBM Plex Mono remains the prototype's technical-label family. Production uses Manrope for those labels; the prototype's Syne/Manrope display/body system is synchronized.
- The prototype keeps its own project-specific cyan/lime/violet identities, fixed stacked scene transitions, 3D hero sphere, Project Network, and dedicated P—01/P—02/P—03 deep-dive pages. Production layout and animation constraints were not imported.
- P—03 remains superseded by `projects/interactive-experiments.html`; the legacy Work dialog is not restored. Return URLs and `sessionStorage` network state are unchanged.
- The prototype's longer required headings need lab-specific spacing (Phase 13.1 uses a clamped `98.88–100.3px` desktop heading, a `720px` text cap, and a short-height guard); production's own overflow behavior was not reproduced.
- Figma was not used, no dependencies were installed, and no deployment configuration, commit, push, or deploy was made.

## Phase 12: Hero network sphere

The Earth hero is replaced by a right-side, 88-node 3D network sphere. It is an original procedural structure inspired only by the supplied reference image's density and depth; the purple/blue palette was not copied. The Signal / Systems world stays intact: near-black ground, electric cyan structure, restrained lime accents, muted neutral rear links, thin luminous linework, small hard node cores, and a soft atmospheric limb.

- **Structure:** Fibonacci-distributed nodes with seeded jitter, four-nearest-neighbour links plus a small set of longer cross-links (`~206` thin segments), front/rear depth attenuation, 14 travelling pulses, node halos, and a restrained fresnel atmosphere. The sphere is placed at `75.5% × 54%` on wide desktops and `73.5% × 56%` at `1024–1199px`, with controlled right-edge cropping.
- **Interaction:** slow automatic rotation, eased pointer tilt, direct drag rotation within the sphere's projected bounds, inertia decay after release, and local node/connection illumination near the cursor. Pointer-down default is only prevented for a valid sphere drag; CTA, nav, text, and body regions are excluded. Leaving the sphere clears the highlight.
- **Mobile / reduced motion:** WebGL remains disabled below `900px`, for coarse pointers, and for reduced motion. `assets/network/hero-network-static.svg` is a deterministic static rendering of the same structure (`seed 1187`), not a screenshot of the reference. The retired `.signal-stage` panel is hidden and removed from the hero markup.
- **Architecture:** one shared renderer, canvas, rAF loop, crossfade system, quality tiers, idle stop, hidden-page pause, overlay pause, context-loss handling, full disposal, and reused typed arrays/geometries. No dependency, texture download, post-processing pass, or second canvas was added. `window.__prototypeSceneStats` now exposes read-only hero interaction state and projected bounds for verification.

### Phase 12 verification

Playwright/Chromium checks at `1440×900`, `1366×768`, `1200×800`, and `1024×768` confirmed `has-webgl`, one canvas, zero scene textures, `6` draw calls / `10,016` triangles / `6` geometries, zero horizontal overflow, and a readable left copy column (sphere left edges `725 / 722 / 584 / 474px`; copy right edges `643 / 609 / 535 / 508px`). Hovering the sphere selected a node and raised focus strength; leaving it cleared focus. A synthetic pointer-down on the CTA and outside the sphere was not prevented; a pointer-down inside the sphere was. Drag set velocity (`0.252 / 0.072`), and 32 rendered frames decayed it to near zero (`0.003 / 0.0009`). CTA navigation reached `#scene-work`, and nav/wordmark transitions reached all five scenes with matching fallbacks and no hero drag state left behind.

Mobile `390×844` and `320×568` showed `no-webgl`, `display:none` canvas, the static SVG fallback, and zero overflow. Reduced-motion `1440×900` also showed `no-webgl`, no scene stats, and the static fallback. Work dialogs still rendered `0` frames while open. The P—03 return URL still restored the network scene and selected `P—03 Interactive Experiments`. No console or page errors occurred in these flows.

Automated checks do not establish visual quality. The Phase 12 screenshots below are for human visual review. Full metrics and the Phase 9 comparison are in `performance-phase12.json`.

### Phase 12 screenshots

Desktop: `phase12-hero-desktop-1440.png`, `phase12-hero-desktop-1366.png`, `phase12-hero-desktop-1200.png`, `phase12-hero-desktop-1024.png`, `phase12-hero-pointer-1440.png`, `phase12-hero-reduced-1440.png`.

Mobile: `phase12-hero-mobile-390.png`, `phase12-hero-mobile-320.png`.

### Phase 9 → Phase 12 performance

| Case | Heap | Active / idle FPS | Calls / triangles | Scene textures |
| --- | --- | --- | --- | ---: |
| Hero `1440×900` | `3.5 → 3.0 MB` | `26 → 25.2` / `0 → 0` | `6 → 6` / `16,512 → 10,016` | `3 → 0` |
| Hero `1366×768` | `3.5 → 3.3 MB` | `26 → 24.8` / `0 → 0` | `6 → 6` / `16,512 → 10,016` | `3 → 0` |
| Hero `1200×800` | `3.5 → 3.3 MB` | `26 → 25.3` / `0 → 0` | `6 → 6` / `16,512 → 10,016` | `3 → 0` |
| Hero `1024×768` | `3.5 → 3.3 MB` | `25 → 25.4` / `0 → 0` | `6 → 6` / `16,512 → 10,016` | `3 → 0` |
| Balanced `1440×900` | `3.5 → 3.3 MB` | `24 → 24.4` / `0 → 0` | `6 → 6` / `16,512 → 10,016` | `3 → 0` |
| Low `1440×900` | `3.4 → 3.6 MB` | `15 → 14.1` / `0 → 0` | `6 → 6` / `8,320 → 10,016` | `3 → 0` |
| Mobile `390×844` | `1.2 → 0.9 MB` | none / none | no WebGL stats | `0 → 0` |

The clear win is removing all three `2K` Earth texture downloads (`1.68 MB` transferred; roughly `24 MiB` nominal decoded RGBA) and `25–39%` fewer triangles at the same six draw calls. Active cadence is essentially unchanged; the low tier retains the full node mesh by design because node count is constructor-only, while its frame pacing drops to `70ms`. Runtime LOW switching recompiles the existing five shader programs but rebuilds no geometry, materials, or scene objects.

Source/provenance notes: `docs/hero-network-sphere-brief.md` and `docs/hero-network-static-asset.md`.

## Phase 11 addendum: P—03 Interactive Experiments

`P—03 / Interactive Experiments` now has its own dedicated, full-screen deep dive with a distinct violet/warm “digital laboratory” identity. It replaces the brief Work dialog destination while preserving the P—01 and P—02 work from the original Phase 11 pass.

| Node | Current destination |
| --- | --- |
| Browser Tracker | `projects/browser-tracker.html?from=network&node=browser` |
| Live Voice to Text | `projects/live-voice-to-text.html?from=network&node=voice` |
| Interactive Experiments | `projects/interactive-experiments.html?from=network&node=experiments` |
| Three studies | unchanged: local `study-*` panels |

The P—03 page records source-backed techniques without claiming a standalone product. It separates **working** existing implementations, **new lab probes** written for this page, and **concept-only** ideas. Its three Canvas 2D probes — pointer field, network trace, and generative wave — are explicitly labelled as new prototype features. No second WebGL renderer, dependency, or install is added.

### Addendum files

- `projects/interactive-experiments.html` — ten-section lab record, instrument-console hero, and one-canvas interactive bench.
- `projects/experiments.css` — P—03 laboratory identity and responsive bench styling.
- `projects/experiments.js` — selectable probes, keyboard controls, DPR cap, visibility/intersection pausing, and disposal.
- `docs/interactive-experiments.md` — compact source notes and status boundaries.
- `screenshots/phase11-experiments-*.png` — desktop, bench-state, mobile, reduced-motion, and return captures.

### Addendum verification

Playwright/Chromium checks confirmed: P—03 keyboard selection and cinematic entry; dedicated page load; all three probes, controls, tab keyboard wrapping, pause/resume, and live announcements; return selection/focus; Back/Forward; direct load; legacy Work-route redirect; reduced-motion static frame; `390px` and `320px` layouts after two overflow fixes; no broken internal links; and no console/page errors. P—01 and P—02 were regression-tested through the same network entry/return path and still work.

## Phase 11: Project deep dives

`P—01 / Browser Tracker` and `P—02 / Live Voice to Text` opened dedicated, static, full-screen documentation pages instead of brief Work dialog summaries. The addendum above extends the same architecture to P—03.

The dedicated pages are documentation-first and add no WebGL renderer. Browser Tracker uses a cyan “source-verified” identity; Live Voice to Text uses a lime “concept record” identity; Interactive Experiments uses a violet/warm laboratory identity. All three keep the Signal / Systems grid, mono labels, dark panels, and focus-visible feedback.

### Verified content only

- **Browser Tracker:** manifest `Browser Usage Tracker` v0.2.0, MV3 service worker, popup, options, shared aggregator, four permissions, no `host_permissions`, `externally_connectable` allowlist plus sender checks, local `storage.local` / `storage.session` data, consent-gated `TRACKER_PING` / `TRACKER_SNAPSHOT` bridge, active foreground-time estimates, tab counts, domain aggregates, seven-day history, Pause / Clear, excluded domains, idle threshold, retention, Incognito opt-in, and the four-step onboarding modal.
- **Live Voice to Text:** only the labelled static concept preview, decorative scroll-linked wave, and procedural spectrum are implemented. No Python source, transcription engine, microphone capture, model, endpoint, Claude API call, public demo, recording, or voice-specific screenshot exists in this repository. Every proposed stage is labelled as concept or not implemented.
- Compact provenance is recorded in `docs/browser-tracker.md`, `docs/live-voice-to-text.md`, and `docs/interactive-experiments.md`.

### Navigation and return behavior

- The HTML buttons remain the source of truth. Activation highlights the selected node and connected edges, increases node emphasis, eases the shared 3D camera toward the node, fades the network, and only then navigates after `NETWORK_ACTIVATE_MS` (`640ms`; `0ms` with reduced motion).
- The destination URL carries `from=network&node=browser|voice|experiments`, and the same state is written to `sessionStorage`. The project page writes the same state on direct load and rewrites every `← Back to Network` link to `beyond-the-portfolio.html?from=network&node=…&focus=1#scene-project-network`.
- Returning opens the network scene directly, restores the selected node and detail text, restores keyboard focus to that node without scrolling, clears any departure state, and does not replay the Overview → Concepts sequence. Browser Back / Forward restores the same selected node and focus.
- All three old `index.html?from=network&project=browser|voice|experiments#scene-work` URLs redirect to their dedicated routes. The three study destinations remain unchanged.

### Phase 11 verification

Playwright/Chromium checks at `1440×900`, `1366×768`, `390×844`, and `320×568` confirmed:

- All three cinematic entries were verified with keyboard focus and Enter activation, `prototype:network-select`, selected/previewed node, `is-departing`, detail text, delayed navigation, and fade-in to `is-project-ready`.
- All three returns restore network scene `03`, query/hash destination, selected node, focus on that node, no dialog, no departure state, and correct Back / Forward URLs.
- Direct loads with no query work, all three old Work routes redirect to dedicated pages, and `study-local` still opens its panel. The legacy `dialog-experiments` remains in the main-portfolio source but is no longer a Project Network destination.
- The P—01/P—02 pages each render nine documented sections with keyboard-operable architecture flows. The P—03 page renders ten sections with three keyboard-operable Canvas 2D probes. `:focus-visible` gives a `2px` outline throughout.
- Reduced motion uses `no-webgl`, no scene stats, immediate navigation (`78ms` in the original measured run), and a `0s` project fade. P—03 additionally shows a static lab frame with the pause control disabled.
- Mobile uses `no-webgl`, hides the detail panel, keeps all six node rows readable, and opens all three new routes. No horizontal document overflow at `1440`, `1366`, `390`, or `320`; a `320px` header wrap and P—03 heading/viewport overflows were fixed during verification.
- P—01/P—02 contain zero `<canvas>` elements and no scene stats. P—03 contains one bounded Canvas 2D element and no WebGL context; the network keeps the existing single renderer. All internal links and anchors returned HTTP 200 or resolved to existing IDs. No console or page errors occurred in the normal flows.

Automated checks do not establish visual quality. The Phase 11 screenshots below are for human review.

### Phase 11 screenshots

Desktop: `phase11-network-1440.png`, `phase11-network-1366.png`, `phase11-browser-selected-1440.png`, `phase11-voice-selected-1440.png`, `phase11-experiments-selected-1440.png`, `phase11-browser-project-1440.png`, `phase11-browser-project-1366.png`, `phase11-voice-project-1440.png`, `phase11-browser-return-1440.png`, `phase11-voice-return-1440.png`, `phase11-reduced-browser-1440.png`, `phase11-experiments-project-1440.png`, `phase11-experiments-bench-field-1440.png`, `phase11-experiments-bench-network-1440.png`, `phase11-experiments-bench-wave-1440.png`, `phase11-experiments-return-1440.png`, `phase11-experiments-reduced-1440.png`.

Mobile: `phase11-network-390.png`, `phase11-network-320.png`, `phase11-browser-project-390.png`, `phase11-browser-project-320.png`, `phase11-voice-project-390.png`, `phase11-voice-project-320.png`, `phase11-experiments-project-390.png`, `phase11-experiments-project-320.png`, `phase11-experiments-bench-390.png`, `phase11-experiments-bench-320.png`.

## Phase 10: Project Network

Phase 10 replaces the Beyond page's `03 / LAB CONTACT` scene with `03 / PROJECT NETWORK`. The scene order is now `01 / LAB OVERVIEW`, `02 / CONCEPTS`, `03 / PROJECT NETWORK`. Contact remains available from the Beyond header, the network footer, and the main portfolio contact scene.

### Six real nodes, six existing destinations

The HTML buttons are the accessible source of truth for names, descriptions, focus order, positions, and activation. The WebGL scene mirrors them; no node is a raycast-only target and no project, demo, or achievement was invented.

| Node | Destination |
| --- | --- |
| Browser Tracker | `index.html?from=network&project=browser#scene-work`, opening `dialog-browser` |
| Live Voice to Text | `index.html?from=network&project=voice#scene-work`, opening `dialog-voice` |
| Interactive Experiments | `index.html?from=network&project=experiments#scene-work`, opening `dialog-experiments` |
| Generative studies | local `study-generative` panel, documented in `docs/generative-studies.md` |
| Interaction sketches | local `study-interaction` panel, documented in `docs/interaction-sketches.md` |
| Local tools / notes | local `study-local` panel, documented in `docs/local-tools-notes.md` |

**Historical note:** the three Work rows above describe Phase 10 as shipped. Phase 11 supersedes all three with the dedicated routes listed at the top of this README; the three study rows remain current.

Phase 10's original Work flow landed directly on its dialog with a visible `← Back to Project Network` link inside the open dialog and an equivalent Lab navigation link. The return uses `?from=network#scene-project-network`, which avoids a stale cached Beyond document and opens the network directly without replaying the earlier scenes.

### Visual and interaction model

- The desktop composition uses thin cyan luminous paths, a dark grid, minor decorative points, and six major nodes with lime accents on selection. Depth comes from per-node `data-node-depth`, eased pointer parallax, a controlled camera focal shift, occasional travelling pulses, and a gradual entrance illumination after the Concepts fade-out.
- Hover or keyboard focus updates a live detail panel and adds a preview state. Activation highlights the node and its connections, increases its glow, eases the camera toward it, fades the network, then opens the correct existing panel or destination. Closing a local panel restores focus to its node and resets the network.
- On `<= 760px`, `< 900px`, reduced-motion, coarse-pointer, or failed-WebGL paths, no WebGL renderer is created. The six nodes become large, readable 2D rows with visible summaries; connectors and pointer parallax are removed, and there is no continuous animation.
- The new `network` visual has its own builder and CSS fallback. `contact` remains the shared builder for the main portfolio contact scene. The renderer keeps one canvas, one loop, one crossfade system, quality tiers, zero idle rendering, overlay pause, disposal, and event cleanup.

### Phase 10 verification

Playwright/Chromium checks at `1440×900`, `1366×768`, `390×844`, and `320×568` confirmed:

- Scene order, `03 / PROJECT NETWORK`, six named nodes, all six destinations, and a working contact link.
- Concepts → Network fade with `is-leaving` on Concepts, network fallback activation, and a single `prototype:scene` event for the destination.
- Hover/focus previews, `2px` focus outline, keyboard Enter activation, selected edge highlighting, camera/fade handoff, modal focus containment, Escape/close, and focus restoration.
- All three cross-page Work dialogs open at the correct `#scene-work` destination; all three return links reopen the network scene directly with no dialog or departure state left behind.
- Reduced motion uses `no-webgl`, zero-length scene/network transitions, immediate dialog activation, and immediate close without focus loss.
- No horizontal document overflow at any viewport; mobile rows are `85px` tall at `390px` and `101px` tall at `320px`, with connectors and detail panel hidden. Desktop node/detail overlap is `0px²`.
- No page errors or console errors in normal flows. All actual `href` destinations returned HTTP 200; local study IDs are dialog targets, not URLs.
- Full metrics are in `performance-phase10.json`. High-tier network measured `4` calls / `1,120` triangles / `4` geometries / `3` framebuffers, `32 / 0` active/idle FPS, `4.5 MB` post-GC heap, and `0` frames while a dialog is open. Mobile measured `2.1 MB` heap with all GPU counters at zero. Balanced and Low remained at `4 / 1,120` with tier frame pacing of `50ms` and `69.9ms`.

Automated checks do not establish visual quality. The Phase 10 screenshots below are for human review.

### Phase 10 screenshots

Desktop: `phase10-network-1440.png`, `phase10-network-1366.png`, `phase10-network-selected-1440.png`, `phase10-network-study-dialog-1440.png`, `phase10-network-work-dialog-1440.png`, `phase10-network-reduced-1440.png`, `phase10-network-entrance-1440.png`.

Mobile: `phase10-network-390.png`, `phase10-network-320.png`.

## Phase 9: Connected Digital World

Phase 9 replaces the Phase 8 mandatory left art rail with centered, adaptive compositions and gives the two focal scenes one shared idea: a connected digital world. Hero was a realistic, textured Earth; Work is the infrastructure beneath it. The other six scene builders, the native study dialogs, and all Phase 8 performance safeguards are preserved. Phase 12 supersedes only the Hero visual; the Earth record and attribution below are retained for provenance.

### Hero — realistic Earth

- A textured sphere uses three local 2K equirectangular maps: day imagery, night/city-light imagery, and clouds. A compact `ShaderMaterial` blends day and night by light direction, keeps oceans dark, warms populated areas, and adds a subtle cyan limb; a separate cloud shell drifts slightly faster than the surface.
- Glowing routes are derived from real latitude/longitude coordinates for London, New York, Tokyo, Singapore, Dubai, São Paulo, Sydney, Nairobi, San Francisco, and Mumbai. Small pulses travel along those routes at staggered speeds.
- The globe is centered horizontally, positioned slightly below the viewport midpoint, and large enough that its upper horizon is visible while the disk continues below the fold. The copy keeps its left alignment; a local radial scrim protects contrast, and no bright arc is placed directly behind the headline or buttons.
- Motion is deliberately restrained: slow axial rotation, subtle pointer tilt, gentle atmosphere drift, and occasional route pulses. There is no camera flight, bloom, post-processing, or idle rendering.
- 1×1 placeholder textures stay bound while the JPGs decode. If an asset fails, the globe and routes still render with the dark placeholder and the failure is reported through the browser request checks rather than silently faking geography.

### Work — connected infrastructure

- The eight separated modules became a `6 × 4` receding field of towers. Bodies, caps, signal strips, and beacons use shared geometry and instanced meshes.
- Horizontal and vertical pathways connect every cell into one network; travelling pulses and per-instance signal colours make activity read as transmission rather than decoration.
- The field sits slightly low and right of center so the section heading and project cards remain readable, with eased pointer sway and gentle beacon variation.

### Composition and compatibility

- The Phase 8 `--art-rail` layout is removed. `prototype-scene.js` now centers the WebGL root and applies small per-scene offsets instead of pushing it into a fixed desktop rail; CSS keeps text left-aligned and adds only local contrast where needed.
- Capabilities, Profile, Contact, Lab hero, and Concepts keep their distinct Phase 7/8 forms and colors. The former Lab contact scene was replaced by the Phase 10 Project Network; the CSS fallback gradients for Hero and Work were updated to match the new centered palettes.
- Presentational scene and header text is non-selectable, so pointer/swipe navigation no longer produces a selection highlight. Focus outlines are unchanged; study-dialog text remains selectable for copying without the bright lime selection colour.
- One `WebGLRenderer`, one canvas, one animation loop, quality tiers, zero idle rendering, reduced-motion/touch/failed-context fallbacks, dialog pause, instancing, reusable buffers, and explicit disposal all remain in place. No new dependency or post-processing pass was added.

### Earth texture attribution

Earth maps by **Solar System Scope** — https://www.solarsystemscope.com/textures/ — licensed under **Creative Commons Attribution 4.0 International (CC BY 4.0)**: https://creativecommons.org/licenses/by/4.0/. Solar System Scope describes these as real planetary maps built from geo-data, space photos, and NASA Blue Marble imagery.

Local files:

| File | Source | Bytes |
| --- | --- | ---: |
| `assets/earth/earth-day-2k.jpg` | https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg | 463,087 |
| `assets/earth/earth-night-2k.jpg` | https://www.solarsystemscope.com/textures/download/2k_earth_nightmap.jpg | 255,287 |
| `assets/earth/earth-clouds-2k.jpg` | https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg | 965,676 |

All three are `2048 × 1024` JPEGs (`1,684,050` bytes total). Three.js remains the local MIT-licensed renderer in `vendor/`.

### Phase 8 → Phase 9 measurements

Measured with the same Playwright procedure as the Phase 7 baseline and Phase 8 record. Heap is post-GC `JSHeapUsedSize`; GPU counts wrap WebGL create/delete calls. Full data is in `performance-phase8.json` and `performance-phase9.json`.

| Case | Heap | Active / idle FPS | Calls / triangles | GPU framebuffers / textures |
| --- | --- | --- | --- | --- |
| Hero `1440×900`: Phase 8 → 9 | `3.5 → 3.5 MB` | `25 / 0 → 26 / 0` | `12 / 4,872 → 6 / 16,512` | `5 / 6 → 3 / 7` |
| Work `1440×900`: Phase 9 | `3.4 MB` | `25 / 0` | `6 / 1,968` | `3 / 5` |
| Concepts `1440×900`: Phase 8 → 9 | `3.2 → 3.4 MB` | `25 / 0 → 25 / 0` | `7 / 36 → 7 / 36` | `3 / 5 → 3 / 5` |
| Hero `1366×768`: Phase 8 → 9 | `3.4 → 3.5 MB` | `26 / 0 → 26 / 0` | `12 / 4,872 → 6 / 16,512` | `5 / 6 → 3 / 7` |
| Hero `1200×800`: Phase 9 | `3.5 MB` | `26 / 0` | `6 / 16,512` | `3 / 7` |
| Hero `1024×768`: Phase 8 → 9 | `3.5 → 3.5 MB` | `25 / 0 → 25 / 0` | `12 / 4,872 → 6 / 16,512` | `5 / 6 → 3 / 7` |
| Mobile `390×844` / `320×568` | `1.0 → 1.2 MB` | no WebGL | no WebGL stats | all zero |
| Dialog open | — | `0 → 0` frames in `600ms` | — | — |

Hero texture cost is the notable trade: three scene textures instead of two, with about `24 MiB` nominal decoded RGBA memory (`3 × 2048 × 1024 × 4`). Browser/driver storage may differ; WebGL texture-object counts include internal defaults. Phase 9 Balanced measured `3.5 MB`, `24fps`, `6` calls, and `16,512` triangles; Low measured `3.4 MB`, `15fps`, `6` calls, and `8,320` triangles. Active frame timing stayed near the intended tier caps.

## Phase 8: depth, tiers, and efficiency

The Phase 8 left-rail composition was superseded by Phase 9. The tier, interaction, and efficiency work below remains in effect.

Phase 8 keeps the Phase 7 sculptures and crossfade system but moves desktop artwork into a clear left rail, adds pointer-responsive depth, introduces explicit quality tiers, and cuts idle/GPU work. No scene is rebuilt when a tier changes.

### Desktop composition and interaction

- At `>= 1200px` with WebGL active, hero, lab hero, Work, Capabilities, Profile, Concepts, and both Contact scenes reserve a `280–380px` left art rail; text and cards move right or fill the remaining grid.
- The 3D root is key-lit from the left, offset into that rail, and given gentle pointer parallax/rotation. Particle fields use a shared local pointer influence so nearby points react subtly instead of the whole field moving.
- Pointer motion is eased and capped; no autonomous camera flight or continuous idle rendering was added.
- At `1024px`, the artwork stays on the right and content on the left. CSS fallback layouts are unchanged.

### Quality tiers

| Tier | Selection | Behavior |
| --- | --- | --- |
| HIGH | Default on capable desktop pointers | `dpr <= 1.5`, full detail/particles, physical materials, all lights, ~32ms active cadence |
| BALANCED | Suggested by hints such as `deviceMemory <= 4`, `hardwareConcurrency <= 4`, or `dpr > 2` | `dpr <= 1.25`, reduced detail/particles, no transmission, fewer lights, ~40ms cadence |
| LOW | Suggested by `saveData` or very low core/memory hints | `dpr <= 1`, minimal detail/particles, standard materials and lights, ~64ms cadence |
| MOBILE | Coarse pointer or `< 900px` | No WebGL renderer; polished CSS/SVG-style fallback with no particle loop or pointer effects |

`hardwareConcurrency` and `deviceMemory` are only weak hints; neither blocks WebGL on its own. `pointer: coarse`, viewport width, reduced motion, save-data, DPR, and a real context probe also feed the decision. `window.__prototypeSceneStats.setQualityTier("HIGH" | "BALANCED" | "LOW" | "MOBILE")` adjusts live cadence, resolution, light visibility, and particle draw range without rebuilding geometry, materials, or groups. Constructor-only detail (mesh subdivision and initial particle allocation) still follows the tier selected at load; switching tiers never recreates objects.

### Efficiency changes

- The Phase 7 generated PMREM environment map was removed. Direct hemisphere, key, lime, violet, and fill lights now provide readable metal/glass highlights without a full render-target chain.
- Contact lanes are instanced from one shared cylinder geometry: both Contact scenes dropped from `19` draw calls / `17` renderer geometries to `7` calls / `4` geometries.
- Shared unit geometry, instanced meshes, seeded particle buffers, single `THREE.Points` fields, and reusable animation objects avoid per-frame allocation and duplicate GPU buffers.
- The renderer stops completely after `1.4s` of inactivity instead of continuing at ~10fps. It restarts on pointer movement, scene changes, resize, visibility return, or dialog close, and stays stopped for hidden tabs, reduced motion, and open dialogs.
- Only one renderer, one canvas, and one rAF loop remain. Context loss/restoration, resize, event removal, and GPU disposal are still explicit.

### Before / after measurements

Measured with the same Playwright procedure used for the Phase 7 baseline. Heap is post-GC `JSHeapUsedSize`; GPU counts wrap WebGL create/delete calls. Full data is in `performance-phase7-baseline.json` and `performance-phase8.json`.

| Case | Phase 7 → Phase 8 heap | Active FPS | Idle FPS | Calls / triangles | GPU framebuffers / textures |
| --- | --- | --- | --- | --- | --- |
| Hero, `1440×900` | `4.4 → 3.5 MB` | `25 → 25` | `10 → 0` | `12 / 4,872 → 12 / 4,872` | `41 / 7 → 5 / 6` |
| Concepts, `1440×900` | `4.3 → 3.2 MB` | `25 → 25` | `10 → 0` | `7 / 36 → 7 / 36` | `39 / 6 → 3 / 5` |
| Hero, `1366×768` | `4.5 → 3.4 MB` | `26 → 26` | `10 → 0` | `12 / 4,872 → 12 / 4,872` | `41 / 7 → 5 / 6` |
| Hero, `1024×768` | `4.5 → 3.5 MB` | `26 → 25` | `10 → 0` | `12 / 4,872 → 12 / 4,872` | `41 / 7 → 5 / 6` |
| Mobile, `390×844` / `320×568` | `1.4 → 1.0 MB` | none | none | no WebGL stats | all zero |
| Dialog open | — | — | `0 → 0` frames in `600ms` | — | — |

Additional Phase 8 tiers at `1440×900`: Balanced used `3.4 MB`, `25fps`, `11` calls, `3,910` triangles, and `3` framebuffers; Low used `3.2 MB`, `15fps`, `11` calls, `1,772` triangles, and `3` framebuffers. High-tier active frame timing remained about `40ms` (`70ms` on Low), matching the intended caps rather than indicating a regression.

## Phase 7: cinematic 3D and generative particles

`prototype-scene.js` was redesigned around volumetric sculpture and procedural particle motion while keeping the single renderer, shared crossfade, overlay pause, and adaptive performance controls from earlier phases.

### Main portfolio — cinematic sculptures

| Scene | Redesigned composition |
| --- | --- |
| Hero | An asymmetric sculpted metal core inside a translucent violet shell, with lime blades, two incomplete orbital arcs, nodes, and a drifting dust field |
| Work | Eight separated volumetric modules with glass faces and lime status strips, connected by tube pathways with travelling violet pulses |
| Capabilities | A spatial node network built on a Fibonacci sphere, solid colour-coded nodes, tube pathways, a glowing hub inside a glass cage, and lime pulses moving between nodes |
| Profile | A calm stack of brushed-metal slabs around a translucent lime spine; no flip interaction remains |
| Contact | Fourteen curved lanes converging on a small glass core and bright heart, with hundreds of particles flowing along the curves toward the centre |

### Beyond the Portfolio — generative particles

| Scene | Redesigned composition |
| --- | --- |
| Lab hero | 1,500 particles repeatedly assemble into and disperse from a volumetric torus-knot structure, with a faint metal ghost form |
| Concepts | 1,300 particles assemble into three distinct spatial structures that morph between study states, loosely echoing generative studies, interaction sketches, and local tools/notes |
| Lab contact | Twelve spiral lanes of particles flow with real depth toward a small central core; decorative only, not a software demonstration |

### Materials, lighting, and camera

- `MeshPhysicalMaterial` provides metal, clearcoat, transmission, thickness, and IOR for glass-like surfaces.
- A small procedural equirectangular canvas is converted with `PMREMGenerator` into an environment map, giving metals and glass readable highlights without an HDR download or post-processing.
- Five complementary lights: hemisphere fill, white key, lime rim, violet rim, and two coloured point fills.
- `ACESFilmicToneMapping`, exponential fog, a perspective camera, depth-separated geometry, and eased pointer parallax create depth while keeping copy readable.
- No bloom or second renderer was added.
- The PMREM environment-map bullet below is historical for Phase 7; Phase 8 replaced it with direct lighting to remove the render-target cost.

### Particle implementation

- One `THREE.Points` buffer per particle field, with dynamic position attributes and pre-generated seed/colour arrays.
- Geometry and materials are created once; animation only updates existing typed arrays and instance matrices.
- Particle budgets are `1,500`, `1,300`, and up to `1,152` on desktop; low-power devices use 42% of those counts.
- Generative states use deterministic seeded values, smoothstep blending, and pointer-weighted displacement rather than random noise every frame.

## Phase 6: targeted UX refinements

### Beyond the Portfolio — documented studies

The three existing studies each have an **Explore Study** button that opens a dedicated documentation panel:

- **C—01 / Generative studies** — `docs/generative-studies.md`
- **C—02 / Interaction sketches** — `docs/interaction-sketches.md`
- **C—03 / Local tools / notes** — `docs/local-tools-notes.md`

Each panel explains WHAT IT IS, PURPOSE, HOW IT WORKS, TECHNOLOGIES, INTERACTION, RELEVANCE, and CURRENT STATUS in plain language. Content was written after inspecting the actual source in this repository. It separates implemented behavior from concepts; in particular, no Python application source is present here, so the Python desktop interface and voice-to-text script are labelled as concepts or external work.

Panel behavior:

- Native `<dialog>` opened with `showModal()` above the current scene.
- Centered, independently scrollable, with a dimmed and blurred backdrop that still lets the 3D scene show through.
- Entrance animation uses opacity, a small vertical shift, and a subtle scale (`320ms`); exit uses a shorter reverse animation (`180ms`).
- Background WebGL rendering pauses through the existing `prototype:overlay` event while a panel is open.
- Close button, Escape, and backdrop click all close the panel; focus returns to the exact trigger.
- Focus is explicitly cycled inside the panel with Tab and Shift+Tab.
- Wheel, touch, keyboard, and nav-link scene navigation are blocked while a panel is open.
- On mobile the panel becomes a near-full-screen sheet with `13px` body text and comfortable padding.
- Reduced motion removes the panel animations and closes instantly.

### Main portfolio — static profile

The 03 / Profile scene no longer has a flip interaction:

- Removed the flip trigger, instructions, front/back faces, `data-open` state, and all flip-specific JavaScript, CSS, and ARIA.
- Replaced them with a static profile card containing the real biography and experience: BSIT studies, Python projects, Windows support, administration, and documentation.
- The contextual Three.js profile background and the overall scene remain unchanged.

## Phase 5: cinematic scene transitions

### Scroll architecture

Native CSS scroll snap was replaced with a lightweight stacked-stage system because snap cannot crossfade scenes without spatial sliding or blank frames.

- `prototype.js` upgrades the stacked document to a fixed stage with absolutely positioned, viewport-sized scenes.
- One scene is active; the outgoing scene stays visible as `is-leaving` while opacity and a subtle depth transform crossfade over `720ms` (`cubic-bezier(0.22, 0.61, 0.36, 1)`).
- CSS fallback layers and the shared WebGL scene use the same timing, so the background and content fade together.
- No fixed previous/next controls remain. Navigation is by wheel, trackpad, touch swipe, keyboard, nav links, and hash history.
- Wheel/trackpad input is accumulated and locked for one gesture, so a rapid scroll cannot skip multiple scenes.
- Overflowing scene content remains natively scrollable with wheel, touch, and keyboard; scene navigation resumes only at the inner scroll boundary.
- Inactive scenes are inert, `aria-hidden`, and unfocusable. Focus moves into the incoming scene only when it was inside the outgoing scene.
- Detail and study dialogs remain in the top layer; wheel input and WebGL rendering are paused while one is open, and focus returns to the trigger on close.
- `prefers-reduced-motion` removes transitions and WebGL; without JavaScript the page remains an ordinary stacked, scrollable document.

### Shared contextual 3D backgrounds

One `WebGLRenderer` and one canvas (`prototype-scene.js`) render all scene states. There is no second 3D framework.

The original Phase 5 table is superseded by the Phase 7 compositions above. All scenes still share the same renderer and crossfade timing.

The canvas and CSS fallback layers are `aria-hidden` and `pointer-events: none`. Perspective, lighting, and fog stay subdued so copy remains readable.

### Performance safeguards

- WebGL is attempted only at `>= 900px` width with a fine pointer, without reduced motion, and after a real context probe. Core/memory hints are weak tier signals only.
- Device pixel ratio is capped per tier (`1.5 / 1.25 / 1 / none`); geometry detail, particle allocation, lights, and materials follow the tier chosen at load.
- Active cadence is capped at about `31 / 25 / 16fps` for High / Balanced / Low. After `1.4 / 1.0 / 0.7s` of inactivity the renderer stops completely, and restarts on pointer/scene/resize/visibility/dialog events.
- Rendering stops entirely when the tab is hidden, a dialog or study panel is open, reduced motion is active, or the MOBILE tier is selected.
- Mobile, touch, unsupported WebGL, failed contexts, and reduced motion use CSS/SVG-style gradient fallbacks. A runtime context loss also switches to the CSS fallback.

## Open locally

Recommended (no dependencies):

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory design-prototype
```

Then open:

- Main prototype: http://127.0.0.1:4173/index.html
- Beyond the Portfolio: http://127.0.0.1:4173/beyond-the-portfolio.html
- Study notes: http://127.0.0.1:4173/docs/generative-studies.md

Direct `file://` opening works for content, but the local server is the tested path because the Three.js module is loaded as an ES module.

## Verification

Verified with Playwright MCP in Chromium at `1440×900`, `1366×768`, `1200×800`, `1024×768`, `390×844`, and `320×568` (plus earlier `1440×640` checks).

Phase 9 results:

- All `48` viewport/scene combinations loaded with the expected active section and zero horizontal or document overflow. Desktop reported `has-webgl`; `390×844` and `320×568` reported `no-webgl` with no stats object.
- The Earth was centered in the viewport at desktop widths. At `1440×900`, sampled cyan/blue globe pixels spanned roughly `x=450–1038` and `y=300–897`, with the horizon near `y=300`; warm city pixels were distributed across the disk rather than forming a flat neon outline. The Work network spanned roughly `x=438–1014`, `y=462–705`, below the heading and cards.
- Pointer movement produced `30` active frames and changed `2.73%` of sampled pixels. Rendering returned to `0` frames after the settle window, and no frames were produced while a study dialog was open.
- Wheel navigation kept the outgoing scene as `is-leaving` during the crossfade; `PageDown` advanced from Work to Capabilities. Escape closed the dialog and restored focus to the `data-study` trigger.
- Reduced motion, a blocked WebGL context, and touch/mobile loads all selected `no-webgl` without a stats object; touch reported `pointer: coarse`. Keyboard scene navigation still worked under reduced motion.
- Runtime tier changes kept renderer geometry counts flat (`16 → 16`); MOBILE stopped rendering and switched to `no-webgl`, then HIGH restored `has-webgl` without rebuilding scenes. All three Earth JPGs returned HTTP `200` with `image/jpeg` responses.
- No console errors, page errors, failed requests, or shader/asset failures. Screenshots were captured for human visual review; no automated check was treated as visual sign-off.

Phase 8 results:

- All eight scenes loaded with the expected active section. Desktop loads reported `has-webgl`; mobile/touch, reduced-motion, and blocked-context loads reported `no-webgl` with no stats object.
- Desktop content stayed clear of the left art rail: at `1440×900`, main content minimum X was `412–517px`; Contact content occupied the second/third grid columns; lab Contact started at `440px`. At `1024×768`, content started at `56px` and the artwork remained on the right.
- Idle rendering went from `10fps` to `0` frames per second. Pointer movement restarted rendering and produced a visible pixel change; `2,600ms` after the last pointer event, no further frames were rendered.
- Runtime tier changes kept renderer geometry counts flat (`7 → 7`) while changing `tier`, cadence, lights, and draw range. Selecting MOBILE stopped rendering and switched to `no-webgl`; selecting HIGH restored `has-webgl` and rendering without rebuilding scenes.
- Wheel navigation kept the outgoing scene as `is-leaving` during the crossfade and removed it afterward; `PageDown` advanced from Work to Capabilities.
- WebGL frames stayed flat while a study dialog was open (`0` new frames over `600ms`), and focus returned to the `data-study` trigger after Escape.
- Zero horizontal or document overflow at all five viewports for every scene. No console errors, page errors, failed requests, or 4xx/5xx responses.
- Image files were captured for human visual review; no automated test was treated as visual sign-off.

Phase 7 results:

- All eight scenes loaded with the expected active section and `has-webgl` at desktop width; mobile and reduced-motion loads correctly reported `no-webgl`.
- Observed active rendering on the particle concepts scene was `25fps` during pointer movement and `10fps` at idle. Draw calls were `7` with `36` triangles for that particle scene; the most geometry-heavy desktop scene, Hero, used `12` calls and `4,872` triangles.
- Wheel navigation kept the outgoing scene as `is-leaving` during the crossfade and removed it afterward; `PageDown` advanced from Work to Capabilities.
- WebGL frames stayed flat while a study dialog was open (`0` new frames over `600ms`) and resumed after Escape; focus returned to the `data-study` trigger.
- Reduced motion produced `no-webgl`, no stats object, and working keyboard scene navigation.
- Blocking WebGL contexts produced `no-webgl`, no stats object, and a matching active CSS fallback layer.
- Zero horizontal overflow at `1440×900`, `390×844`, and `320×568` for every scene. No console errors, page errors, failed requests, or 4xx/5xx responses.

Phase 6 results:

- All three Explore Study buttons open the correct panel with the correct title, seven required sections, and a working link to its Markdown notes.
- Backdrop measures `rgba(4, 6, 8, 0.62)` with `blur(7px)`; the scene stays faintly visible behind it.
- Mid-animation samples showed entrance `opacity 0.81` with a `2–3px` vertical offset and exit `opacity 0.84`, settling cleanly at `1`.
- Tab and Shift+Tab stayed inside the panel across repeated cycles; Escape and the close button both restored focus to the originating trigger.
- Wheel inside a panel scrolled it `0 → 240px` without changing the scene. Wheel, `PageDown`, and `End` outside the panel left the active scene unchanged.
- WebGL draw calls stayed flat while a panel was open (`185 → 185`) and resumed after close (`255`) on pointer movement.
- At `390×844` and `320×568`, panels measured `352×828` and `282×552` with zero horizontal overflow and `13px` body text.
- Reduced motion produced `no-webgl`, `animation-name: none`, instant close, and restored focus.
- The Profile scene has zero flip-related nodes, retains a static profile card with all original information, and has zero horizontal overflow at mobile width.
- All four local documentation/navigation links returned HTTP 200. No console errors, page errors, failed requests, or 4xx/5xx responses.

Phase 5 results were rechecked earlier: single-step wheel/trackpad/touch/keyboard navigation, mid-fade combined opacity of `1.0`, dialog blocking and focus restoration, reduced-motion and WebGL-failure fallbacks, idle draw-call reduction, and no horizontal overflow.

### Phase 6 screenshots

- `screenshots/phase6-study-panel-desktop-1440.png`
- `screenshots/phase6-study-panel-mobile-390.png`
- `screenshots/phase6-study-panel-mobile-320.png`
- `screenshots/phase6-reduced-motion-study-1440.png`
- `screenshots/phase6-profile-desktop-1440.png`
- `screenshots/phase6-profile-mobile-390.png`

### Phase 9 screenshots

Desktop (`1440×900`): `phase9-hero-desktop-1440.png`, `phase9-work-desktop-1440.png`, `phase9-capabilities-desktop-1440.png`, `phase9-profile-desktop-1440.png`, `phase9-contact-desktop-1440.png`, `phase9-lab-hero-desktop-1440.png`, `phase9-concepts-desktop-1440.png`, `phase9-lab-contact-desktop-1440.png`.

Mobile (`390×844`): `phase9-hero-mobile-390.png`, `phase9-work-mobile-390.png`, `phase9-capabilities-mobile-390.png`, `phase9-profile-mobile-390.png`, `phase9-contact-mobile-390.png`, `phase9-lab-hero-mobile-390.png`, `phase9-concepts-mobile-390.png`, `phase9-lab-contact-mobile-390.png`.

Additional: `phase9-hero-desktop-1200.png`, `phase9-hero-desktop-1024.png`, `phase9-hero-small-320.png`, `phase9-study-dialog-desktop-1440.png`, `phase9-study-dialog-mobile-390.png`, plus `phase9-pointer-before.png` / `phase9-pointer-after.png` and the intermediate `phase9-preview-*.png` captures.

### Phase 8 screenshots

Desktop (`1440×900`): `phase8-hero-desktop-1440.png`, `phase8-work-desktop-1440.png`, `phase8-capabilities-desktop-1440.png`, `phase8-profile-desktop-1440.png`, `phase8-contact-desktop-1440.png`, `phase8-lab-hero-desktop-1440.png`, `phase8-concepts-desktop-1440.png`, `phase8-lab-contact-desktop-1440.png`.

Mobile (`390×844`): `phase8-hero-mobile-390.png`, `phase8-work-mobile-390.png`, `phase8-capabilities-mobile-390.png`, `phase8-profile-mobile-390.png`, `phase8-contact-mobile-390.png`, `phase8-lab-hero-mobile-390.png`, `phase8-concepts-mobile-390.png`, `phase8-lab-contact-mobile-390.png`.

Additional: `phase8-hero-small-320.png`, `phase8-study-dialog-desktop-1440.png`, `phase8-study-dialog-mobile-390.png`.

### Phase 7 screenshots

Desktop (`1440×900`): `phase7-hero-desktop-1440.png`, `phase7-work-desktop-1440.png`, `phase7-capabilities-desktop-1440.png`, `phase7-profile-desktop-1440.png`, `phase7-contact-desktop-1440.png`, `phase7-lab-hero-desktop-1440.png`, `phase7-concepts-desktop-1440.png`, `phase7-lab-contact-desktop-1440.png`.

Mobile (`390×844`): `phase7-hero-mobile-390.png`, `phase7-work-mobile-390.png`, `phase7-capabilities-mobile-390.png`, `phase7-profile-mobile-390.png`, `phase7-contact-mobile-390.png`, `phase7-lab-hero-mobile-390.png`, `phase7-concepts-mobile-390.png`, `phase7-lab-contact-mobile-390.png`.

Phase 6 captures remain in `screenshots/phase6-*.png`; Phase 5 scene screenshots remain in `screenshots/phase5-*.png`.

## Design notes

- Palette: graphite `#090B0E`, surface `#111820`, text `#F1F5F2`, muted `#929D9A`, lime `#C7F36B`, violet `#9A82FF`.
- Type: shared Phase 13 tokens in `typography.css`; Syne for display, Manrope for body and UI, IBM Plex Mono for technical labels (intentional prototype difference).
- Status badges remain `LOCAL PROTOTYPE`, `CONCEPT PREVIEW`, and `EXPERIMENTS`.
- Signal label remains `SIGNAL / ACTIVE`; Beyond tiles keep `ILLUSTRATIVE — NOT A LIVE SERVICE`.
- Profile presentation is static; no interaction control remains in this prototype.

## Files

- `index.html` — main prototype page with the static Profile scene
- `beyond-the-portfolio.html` — Beyond page with three study buttons, documentation panels, and the Phase 10 Project Network
- `typography.css` — Phase 13 shared font faces and type-scale tokens
- `prototype.css` — design system, centered crossfade stage, panel animations, static profile card, desktop network map, mobile 2D network, and CSS fallbacks
- `prototype.js` — scene state, input adapters, focus/inert, overlay dialogs, WebGL gating, network activation, and cross-page return handling
- `prototype-scene.js` — one shared Three.js renderer with Phase 7 sculptures, Phase 8 depth/tier controls, Phase 9 Earth/infrastructure, and the Phase 10 network builder
- `assets/earth/` — three CC BY 4.0 Solar System Scope 2K maps with day, night, and cloud detail
- `docs/generative-studies.md`, `docs/interaction-sketches.md`, `docs/local-tools-notes.md` — verified study documentation
- `performance-phase7-baseline.json`, `performance-phase8.json`, `performance-phase9.json`, `performance-phase10.json` — matching heap/GPU/frame measurement records
- `vendor/three.module.js`, `vendor/three.core.js` — local copies of the repository's installed Three.js build
- `fonts/`, `favicon.svg` — local copies of existing assets
- `screenshots/` — Phase 5, Phase 6, Phase 7, Phase 8, Phase 9, Phase 10, Phase 12, and Phase 13 verification captures

## Known limitations

- The enhanced crossfade requires JavaScript; the no-JS path is a normal stacked document rather than a crossfade.
- WebGL backgrounds are desktop-only by design; narrow or coarse-pointer devices and reduced-motion users receive the static decorative fallback.
- A browser WebGL context loss switches to the CSS fallback; recovery in this environment requires a reload.
- Runtime tier changes do not rebuild scenes. Constructor-only detail and particle allocation still follow the tier selected at load, so switching upward cannot add geometry that was never built.
- Hash history is used for deep links and back/forward; wheel gestures intentionally advance one scene at a time.
- Study panels rely on native `<dialog>` support for the top layer and modal semantics; an explicit Tab cycle is added for keyboard safety.
- Documentation describes this repository only. Python components and hosted products referenced elsewhere are not verified here.
- The Earth's three 2K textures add about `24 MiB` nominal decoded memory. No compressed texture format or mip-streaming was added, so very low-memory desktop devices still use the existing tier/fallback rules.
- Earth maps must keep their Solar System Scope / CC BY 4.0 attribution if reused outside this prototype. A failed local JPG leaves the 1×1 placeholder bound; the scene remains functional but Earth detail is reduced.
- Verification was performed in Chromium only. The Playwright pass confirms behavior, instrumentation, and captured screenshots; it does not establish that the visual quality is acceptable.
- Visual sign-off is pending. The captured Phase 12, Phase 13, and Phase 13.1 screenshots need human review, especially hero sphere balance, the revised Lab Overview headline/CTA hierarchy and right-side breathing room, dialog/documentation readability, mobile row readability, and cyan/lime/violet glow balance. Older Phase 8–10 screenshots remain in the folder for historical comparison.
- The 3D network mirrors HTML nodes rather than using raycast picking; this is deliberate so names, focus order, and activation remain accessible even if WebGL fails. The decorative 3D points are not interactive.
