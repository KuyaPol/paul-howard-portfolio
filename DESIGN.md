---
name: Paul Howard Portfolio
description: An editorial portfolio of practical software projects and technical experience.
colors:
  neutral-bg: "#101110"
  surface: "#171917"
  surface-raised: "#1c1f1c"
  text-primary: "#f0f2ed"
  text-muted: "#a0a69d"
  border-subtle: "#2b302b"
  accent-lime: "#b7ef66"
  violet: "#aa93bb"
  violet-bright: "#bf9bd9"
  selection-violet: "#492866"
typography:
  display:
    fontFamily: "Syne, sans-serif"
    fontWeight: "600-800"
    fontSize: "clamp(72px, 40px + 7vw, 144px)"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "16px"
    lineHeight: 1.65
  technical:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px for compact visitor-facing labels"
layout:
  maxWidth: "1200px"
  responsiveBreakpoints: [1100, 900, 760, 600, 420]
  shellGutters: "clamp(20px, 5vw, 72px); 24-56px <=1100px; 20px <=760px"
---

# Design System: Paul Howard Portfolio

## Direction

An expressive, editorial portfolio for practical software work. Oversized Syne typography and alternating project compositions carry the visual character; Manrope keeps descriptions readable, and compact Manrope labels mark metadata and technical details. Graphite is the page ground, lime signals emphasis and actions, and violet distinguishes selected details. Section alignment and spacing vary intentionally while dividers and shared type styles keep the page cohesive.

## Color

| Token | Value | Use |
| --- | --- | --- |
| Graphite background | `#101110` | Page canvas |
| Graphite surface | `#171917` | Profile and exploring panels |
| Raised graphite | `#1c1f1c` | Interactive surface state |
| Primary text | `#f0f2ed` | Headings and main copy |
| Muted text | `#a0a69d` | Supporting copy |
| Divider | `#2b302b` | Fine section and row rules |
| Lime | `#b7ef66` | Emphasis, status, and primary actions |
| Violet | `#aa93bb` | Secondary accent |
| Bright violet | `#bf9bd9` | Selected metadata and profile details |
| Selection violet | `#492866` | Reserved token; not currently applied to text selection |

Keep color roles consistent. Violet is a supporting signal, not a competing primary accent. Avoid adding new palette colors or making glow the default surface treatment.

## Typography

- **Display:** Syne, with sans-serif fallbacks. The desktop hero uses `clamp(4.5rem, 2.5rem + 7vw, 9rem)` (72–144px) with the variable font's 600–800 weight range; breakpoint rules adapt it to available width. Section and project headings use Syne with tighter, smaller scales.
- **Body:** Manrope, with sans-serif fallbacks. Base copy is 1rem / 1.65 (16px); supporting copy generally uses the 0.875rem (14px) `--text-small` token.
- **Technical:** Visitor-facing eyebrows, metadata, and labels use Manrope at the 0.75rem (12px) `--text-label` token with tracking or uppercase styling. No monospace web font is loaded on the public pages. The Worker admin view uses a system monospace stack (`ui-monospace, SFMono-Regular, Consolas, monospace`) for request IDs.

Fonts are served locally from `fonts/Syne-variable.ttf` and `fonts/Manrope-variable.ttf`, with their SIL Open Font License notices alongside them. No remote font service is used; system sans-serif fallbacks keep the page legible if a font file fails.

## Layout and responsive behavior

The content shell is capped at 1200px. Gutters use `clamp(1.25rem, 5vw, 4.5rem)` (up to 72px), narrowing further under the 1100px and 760px media queries. The active responsive breakpoints are 1100px, 900px, 760px, 600px, and 420px; the concept selector changes from a vertical list to a horizontal row at 900px.

The hero places its introduction beside the profile panel when space allows and stacks them on narrow mobile. Project showcases alternate their heading and abstract artwork on larger screens, then become distinct single-column compositions on narrow mobile. Capabilities use aligned rows with the AI Tools row distinguished by a violet rail, tinted background, and small workflow badge; experience uses a ruled timeline, and the contact close uses a large display heading with a separate action column that stacks on mobile. Avoid fixed widths that create horizontal scrolling; allow long labels and project metadata to wrap.

## Beyond the Portfolio page

The main portfolio's closing section links to a dedicated concept page at `beyond-the-portfolio/index.html`, served at `/beyond-the-portfolio/` on Cloudflare and under `/paul-howard-portfolio/beyond-the-portfolio/` on GitHub Pages. Links between the two static pages use relative paths (`beyond-the-portfolio/` outward, `../` back to the portfolio root), so no full URL or deployment-specific path is embedded. Worker `/api/*` and `/admin*` routes remain root-relative because they are handled by the Worker, not the static files.

The concept page reuses the same shell, palette, and local Syne/Manrope files. It pairs a compact editorial hero with three selectable concepts, each with a native illustrative preview and a detail section. The selector is a `role="tablist"` with three tabs, each controlling its own `tabpanel`; it is vertical above 900px and a horizontally scrollable row at 900px and below, with `js/main.js` keeping `aria-orientation` in sync. Arrow, Home, and End keys, `aria-selected`, and roving `tabindex` work in both layouts. Selecting a concept updates the preview label, title, and detail link, and a directional Web Animations API slide is used unless reduced motion is requested. Each detail section has a return link that restores the active concept and focus.

Each concept keeps the graphite base but borrows a different accent and motif: finance uses lime figures over faint chart gridlines, business uses violet figures over ledger lines, and PC health uses a bezeled monitor with a violet sparkline. Distinct preview layouts remain a requirement; do not collapse them into one repeated card. The previews contain local-only controls (finance period and sample budget, business inventory filter, PC metric selector) that update DOM values only. Figures are labeled sample or illustrative, and market data, notifications, monitoring, history, and reports are described as proposed. `build.mjs` copies the page into `public/beyond-the-portfolio/`.

## Components and interaction

- **Navigation:** compact Manrope links, generous line height, underline on hover, visible keyboard focus, and a skip link that appears on focus.
- **Primary action:** rectangular lime button with dark text and a visible focus outline.
- **Projects:** two editorial showcases separated by fine rules. The artwork is abstract and labeled as such; it is not an application screenshot. The first project is Browser Tracker, with the project brief before a live local dashboard and a separate link to the Python PC Tracker project. The second has no external project link.
- **Profile panel:** the complete `div.profile-panel` flips in 3D between its profile-statement face and interactive About Me information face, including the head and foot. Click, tap, Enter, and Space activate it. The closed face reports `aria-expanded="false"`; whichever face is hidden is both `aria-hidden` and inert. Its accessible name comes from the visible face content rather than an overriding label. Reduced motion swaps visibility without the flip.
- **Project previews:** Browser Tracker renders a real local-analytics dashboard only after the extension is detected and sharing is enabled; otherwise it shows connection instructions and a clearly labeled illustrative demonstration. Live Voice to Text remains a labeled mockup. There is no playback control or tilt interaction; GSAP only coordinates the decorative scene behind these sections.
- **Concept page contact marquee:** decorative, `aria-hidden` type strip on the Beyond the Portfolio closing section. Two identical phrase groups scroll right-to-left as a CSS keyframe loop; it has no controls, never receives pointer events, and stops under reduced motion.
- **Focus and selection:** links, buttons, the profile control, and concept tabs show keyboard focus. Text selection uses the lime accent background with dark text.

## Motion

Hero entrances, scroll-linked camera motion, the footer back-to-top tween, and scene-state transitions are coordinated by one GSAP/ScrollTrigger module. The Web Animations API and `IntersectionObserver` still own one-time `[data-reveal]` elements and the 520ms directional concept-switch slide; CSS owns hover depth, the whole-panel profile flip, the short portfolio/concept page fades, the AI Tools treatment, the contact marquee, and reduced-motion fallbacks. A single optional Three.js renderer draws a decorative procedural scene behind each page, including ambient spectrum bars driven by deterministic bass, midrange, and treble bands; it is absent on small screens, low-power devices, reduced-motion settings, WebGL failure, or script failure. The site is silent by default and does not capture audio. Three.js is loaded from a separate ES-module chunk only when the scene is allowed to start, so small, low-power, and reduced-motion visitors do not download it. No smooth-scroll library is loaded. Motion remains short and restrained, and content is visible in the default CSS state.

## Content and assets

Use only confirmed portfolio content. Do not add employers, dates, customers, outcomes, metrics, qualifications, screenshots, downloads, or links without supplied evidence. Keep the abstract project artwork distinct from any future genuine screenshots or demonstrations.
