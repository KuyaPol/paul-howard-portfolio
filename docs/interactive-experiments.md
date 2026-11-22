# P—03 / Interactive Experiments — source notes

**Status:** Several motion and interaction techniques are implemented in existing prototype source. No standalone Interactive Experiments product, public demo, saved-session system, export path, or audio-input engine was found. The three probes on the deep-dive page are newly written Canvas 2D demonstrations for that page and are labelled as such.

## Verified sources

- `design-prototype/prototype.js` — scene state, input adapters, focus/inert, WebGL gating, network activation, return handling.
- `design-prototype/prototype-scene.js` — the single shared Three.js renderer, scene builders, quality tiers, pointer parallax, network pulses, crossfades, idle stop, and disposal.
- `js/motion.js` — scroll-linked presentation state used by the main portfolio, including the labelled Live Voice to Text wave.
- `js/space.js` — procedural ambient spectrum. Source states that no audio is played; a Web Audio analyser hook is not invoked.
- `js/animations.js`, `js/beyond-concepts.js` — Web Animations API reveals and concept transitions with reduced-motion checks.
- `design-prototype/beyond-the-portfolio.html` — P—03 network node and preview copy.
- `design-prototype/projects/interactive-experiments.html` — the dedicated deep dive.
- `design-prototype/projects/experiments.css`, `design-prototype/projects/experiments.js` — the new laboratory identity and lightweight Canvas 2D bench.
- `design-prototype/docs/local-tools-notes.md`, `DESIGN.md`, `PRODUCT.md` — status boundaries used for the surrounding concepts.

## Working implementations found in source

- **Shared 3D renderer:** one Three.js context builds scenes on demand and crossfades them. Quality tiers, pointer parallax, focal easing, overlay pause, zero idle rendering, and disposal are present.
- **Project Network:** six HTML-button nodes are the accessible source of truth. Hover/focus previews, selection highlighting, connected-edge emphasis, camera easing, departure fade, and selected-node restoration are implemented.
- **Travelling pulses:** the network and infrastructure scenes use precomputed paths and timed pulses rather than added physics or network requests.
- **Scroll-linked motion:** the main portfolio uses GSAP/ScrollTrigger for presentation state, including the explicitly labelled decorative wave in the Live Voice to Text section.
- **Procedural spectrum:** ambient bands are generated in code. The source explicitly says there is no playback, and no microphone capture is wired in.
- **Web Animations:** intersection-triggered reveals and concept transitions are implemented with reduced-motion checks.

## New demonstrations on the deep-dive page

These are **newly developed prototype features for the P—03 page**; they are not existing portfolio products and are not presented as previously shipped experiments.

1. **Pointer field** — bounded particles respond to pointer position with a radial falloff, velocity damping, repel/attract mode, and a strength control. It demonstrates input mapping, falloff, and DPR-aware canvas drawing.
2. **Network trace** — a generated graph sends eased pulses along edges, supports node hit-testing, and offers manual pulse injection and automatic-pulse control. It is a lightweight 2D study of the graph-and-pulse idea in the existing Project Network, not a copy of the WebGL scene.
3. **Generative wave** — three layered sine curves use seeded phase offsets, an amplitude envelope, and a small pointer-driven phase shift. It demonstrates procedural motion only; it is not audio analysis.

## Status boundaries

- **Working:** existing renderer, scene transitions, network interaction, reduced-motion and mobile gating, scroll-linked presentation, procedural spectrum.
- **New lab probe:** the three Canvas 2D demonstrations above.
- **Concept only:** standalone experiments app, persistent lab sessions, export/share, public gallery, collaborative play, audio-reactive analysis, and formal research outcomes.
- **Absent:** microphone capture, `getUserMedia`, speech recognition, model inference, external demo link, downloadable package, and experiment-specific product screenshot.
- **Legacy surface:** `design-prototype/index.html` still contains the brief Work card and `dialog-experiments`, described there as studies in progress. The Project Network no longer routes to it; the old `?from=network&project=experiments` URL redirects to the dedicated deep dive.

## Performance and accessibility boundaries

The lab uses one Canvas 2D context, one active model, a capped device-pixel ratio, bounded particle/node counts, and an animation loop that stops when off-screen, hidden, paused, or under reduced motion. Keyboard users can operate every control; state changes are announced politely. These are implementation safeguards, not audit or benchmark results. Phase 8 records remain the source for measured renderer metrics.
