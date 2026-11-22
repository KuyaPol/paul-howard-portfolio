# Phase 18 visual specification

## Status

The Figma MCP connection is configured and a blank design file was created:

`https://www.figma.com/design/DjafzotwXdmeKz2piOOGtQ`

The authenticated Starter plan reached its Figma MCP call limit before design-system discovery or storyboard authoring could run. A later retry successfully created a collaboration session, but the call limit was hit again on the next batch of file reads. The file cannot be reliably edited in this session. This document is the equivalent local visual specification. The storyboard is rendered as local HTML and captured at the required viewport sizes so layout and state geometry remain measurable and visually testable.

Figma remains the intended design workspace; the production rendering engine remains Three.js inside the existing static HTML/CSS/JavaScript architecture.

---

## Design tokens

Inherited from `DESIGN.md` and current production CSS:

| Role | Value | Use |
| --- | --- | --- |
| Background | `#090B0E` | Page and scene ground |
| Surface | `#111820` | Panels and profile information card |
| Raised surface | `#16212B` | Hover/active surface |
| Primary text | `#F1F5F2` | Headings and body copy |
| Muted text | `#929D9A` | Supporting copy and metadata |
| Divider | `rgba(241,245,242,0.14)` / `rgba(241,245,242,0.26)` | Rules and strong borders |
| Accent lime | `#C7F36B` | Primary action and key signal |
| Accent cyan | `#62E2FF` | Secondary reflection/signal |
| Accent violet | `#9A82FF` | Background depth only |
| Display type | Syne, 600–800 | Headings |
| Body type | Manrope, 400–700 | Copy and UI |
| Technical type | IBM Plex Mono, 12px uppercase/tracked | Labels and progress |

These are the live production tokens from `css/prototype.css`; the Phase 18 surfaces use the same variables rather than introducing a parallel palette.

No new fonts, analytics, cookies, or remote assets are introduced.

---

## Composition ratios

The Profile visual language is:

- 45% kinetic geometry
- 30% liquid glass
- 15% dark chrome material
- 10% connected signal elements

These are design-weight ratios, not literal pixel areas. The result must read as one coherent object: a structured radial machine that resolves into a smooth, smoked-glass identity form.

---

## Required storyboard frames

### FRAME 01 — Structured Formation

- Canvas: 1724×900 primary, with responsive variants at 1440×900, 1366×768, and 390×844.
- Sculpture: DOM-aware projected diameter clamped to 240–320px; the stage gap minus 24px supplies the target on desktop.
- 12–18 organized elements on concentric radial tiers.
- Central nucleus: 56–72px projected diameter, dark chrome with lime core.
- Two cyan signal arcs and four restrained signal paths.
- Background: graphite with a very subtle radial vignette.
- State visible at entry before the morph.

### FRAME 02 — Morph Transition

- Radial elements move inward on eased trajectories.
- Outer shell scale goes from 0.86 to 1.0 while opacity rises from 0 to 0.92.
- Structured elements reduce opacity from 1.0 to 0.18 but do not disappear abruptly.
- Signal paths contract with the structure and settle into internal accents.
- Intermediate silhouette is a coherent rounded mass with visible radial traces.

### FRAME 03 — Liquid Identity

- One smooth sculptural form with continuous silhouette.
- Near-black smoked glass: dark graphite base, restrained transparency, strong rim highlights.
- Cyan light from the upper-left edge, lime from the lower-right interior.
- Strong silhouette highlight on at least 60% of the visible contour.
- No flat neon ring, wireframe cube, or floating bar motif.

### FRAME 04 — Interactive State

- Pointer parallax only: maximum ±8° yaw and ±5° pitch.
- Frame-rate-independent exponential smoothing.
- Contour deformation amplitude stays under 4% of sculpture radius.
- Signal accents move with a short 120–180ms delay.
- Idle returns slowly to neutral; no continuous spin.

### FRAME 05 — Visitor Welcome

- Panel width: 360px desktop; `calc(100vw - 40px)` mobile, maximum 360px.
- Position: bottom-right on desktop, 20px from viewport edges; bottom center on mobile above safe area.
- Padding: 24px; internal gap: 12px; border: 1px `#2b302b`; radius: 14px.
- Heading: Syne 24px/1.2, primary text.
- Copy: Manrope 14px/1.55, muted text.
- Buttons: 44px minimum height; primary lime with graphite text; secondary raised graphite with primary text.
- Focus ring: 2px lime, 2px offset.
- Dismiss button visible at top-right with 44×44 hit area.

### FRAME 06 — Guided Tour

- Spotlight: 2px lime outline around the real target, 8px offset, soft near-black scrim outside the target region.
- Tooltip: 320px desktop maximum width, 18px padding, 1px strong divider, 12px radius.
- Tooltip placement prefers below the target, then above, then clamped to viewport with 16px gutters.
- Header: `01 / 07` technical label, Syne step title.
- Body: 14px Manrope, muted text.
- Controls: Back, Next, Skip Tour; Finish replaces Next on final step.
- Progress: 7 short segments, current segment lime.
- The highlighted target remains interactive and is never covered by the panel.

### FRAME 07 — Mobile Tour

- Viewport 390×844; also verified at 320×568.
- Tooltip becomes a bottom sheet: left/right 16px, bottom `max(16px, env(safe-area-inset-bottom))`.
- Maximum height 55vh with internal scrolling only if needed.
- Spotlight inset reduces to 4px.
- Buttons wrap without clipping and remain at least 44px tall.
- Welcome panel uses the same bottom-sheet constraints.

---

## State machines

### Welcome panel

`hidden → pending → visible → {tour, dismissed} → hidden`

- `pending`: main hero entrance has settled and eligibility checks pass.
- `visible`: only one panel instance may exist.
- `tour`: Yes starts step 1 and marks `in_progress`.
- `dismissed`: No stores dismissed preference and hides the panel.
- Any navigation away from the opening scene cancels pending display.

### Tour

`idle → step(1..7) → complete|skipped|interrupted`

- Each step navigates using the existing scene API, waits for transition completion, resolves a stable target, then paints the spotlight/tooltip.
- Missing targets skip to the next valid step; if no target remains, finish gracefully.
- Escape skips. Back/Next move between valid steps. Finish stores `completed`.
- `interrupted` stores `in_progress` but never auto-resumes. Replay/Restart is explicit.

### Persistence key

`ph:visitor-tour:v1`, values limited to a small JSON object:

```json
{ "status": "skipped|in_progress|completed", "step": 0, "version": 1 }
```

No identifiers, analytics, cross-site storage, or remote endpoints. All access is wrapped so storage failure leaves the site fully usable.

---

## Animation timeline

| Phase | Time | Behavior |
| --- | --- | --- |
| Entry | 0–900ms | Structured assembly fades/assembles; gentle orientation settle; no zoom |
| Morph | 900–2400ms | Radial tiers contract; organic shell emerges; material shifts from chrome to smoked glass |
| Settle | 2400–4000ms | Highlights and signal accents settle; final silhouette stabilized |
| Interaction | ongoing | Capped pointer parallax with smoothing |
| Idle | after settle | Render loop stops; only scheduled activity resumes it |
| Exit | scene transition | Profile group fades with existing scene timing and stops rendering |

Reduced motion uses the composed static fallback with no WebGL and no pointer response. Dialogs, hidden tabs, mobile fallback, and non-Profile scenes all stop rendering.

---

## Camera and DOM-aware framing

The sculpture must live in the center column between the Profile introduction and the information card. Desktop layout target:

```text
LEFT column         CENTER STAGE              RIGHT column
intro + CTA         240–320px sculpture       profile information card
flex: 0 1 420px     flex: 1 1 auto            flex: 0 1 340px
min gap: 24px       centered                  min gap: 24px
```

Implementation must read the actual bounding boxes of the intro block and profile card, derive the free center interval, and place the sculpture center there. The camera orthographic/frustum scale is derived from the available interval and a minimum 240px target so the object remains recognizable. The right panel must not overlap more than 15% of the projected main silhouette.

Mobile (`<900px`) uses the existing no-WebGL static fallback and a composed static illustration; no second renderer is introduced.

---

## Performance budget

- One shared `canvas#scene-canvas`.
- Draw calls at or below the Phase 17 Profile steady state (17).
- Triangles at or below 12,000 at high tier.
- No new textures; maximum 2 managed texture slots from existing scene setup.
- No per-frame geometry/material allocation.
- Idle frames stop completely.
- No second renderer, no heavy refraction, no bloom pass, no large downloads.

---

## Acceptance checks

1. Structured, intermediate, and final states are distinguishable in rendered screenshots.
2. Final sculpture is visibly centered and at least 85% unobstructed at 1724, 1440, and 1366 widths.
3. Welcome panel appears only on eligible first visits after hero animation.
4. Yes/No/Back/Next/Skip/Finish/Replay all work with keyboard and touch.
5. Preference persists across refresh; No and completed states do not re-prompt.
6. Reduced motion and mobile fallback are static and readable.
7. No console errors, missing assets, horizontal overflow, or duplicate overlays.
8. Existing Phase 17 features remain intact.

---

## Verified implementation record

The local production build was measured headlessly at the four desktop viewports after the authored timeline reached `final`:

| Viewport | Draw calls | Triangles | Geometries | Textures | Idle frames after settle |
| --- | --- | --- | --- | --- | --- |
| 1724×900 | 12 | 2,424 | 13 | 2 | 0 |
| 1440×900 | 12 | 2,424 | 13 | 2 | 0 |
| 1366×768 | 12 | 2,424 | 13 | 2 | 0 |
| 1024×768 | 12 | 2,424 | 13 | 2 | 0 |

The desktop three-column layout keeps at least 24px between the copy, stage, and card at every measured viewport. The sculpture target is clamped to 240–320px from the live stage interval. Pointer response is capped to ±8° yaw and ±5° pitch and returns to neutral when the pointer settles.

Screenshot evidence is captured locally under `screenshots/phase18/before/` and `screenshots/phase18/after/`; design exploration frames are under `screenshots/phase18/design-spec/`. Screenshots and temporary tooling are intentionally excluded from the deploy allowlist and from the commit.

Figma file: `https://www.figma.com/design/DjafzotwXdmeKz2piOOGtQ` (blank; MCP authoring was blocked by the Starter plan call limit). This document plus the captured local storyboard is the accepted design-equivalent record.
