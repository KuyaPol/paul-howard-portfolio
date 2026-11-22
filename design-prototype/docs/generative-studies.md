# C—01 / Generative studies

**Status:** Implemented as a local visual prototype in two places. Not a data product and not a released library.

## What it is

A set of decorative scenes made from simple geometry: rings, grids, floating panels, connecting lines, and small particle points. The shapes create depth and focus. They do not represent measured values, and there are no charts behind them.

## Purpose

The study asks how much spatial interest a page can gain from a small vocabulary of shapes and lighting, without bright effects, large textures, or a heavy animation stack. The intended result is a background that supports the copy and stays readable at every viewport.

## How it works

### In this prototype

`prototype-scene.js` creates **one** `WebGLRenderer` and **one** canvas for all scenes. Each scene state (hero, work, capabilities, profile, lab, concepts, contact) has its own group of meshes and materials. When the active scene changes:

- the outgoing group fades out while the incoming group fades in over the same window as the DOM crossfade (720 ms);
- opacity, rotation, and subtle depth movement are coordinated so there is no blank frame;
- pointer movement eases the root rotation and camera position, producing a slow parallax shift rather than a snap;
- rendering is capped to about 30 fps and stops after roughly 1.4 seconds of settled activity, when the tab is hidden, when a dialog is open, or when reduced motion is requested;
- device pixel ratio is capped (1.5, or 1 on low-power devices), geometry detail is reduced on lower-power hardware, and a real context probe gates the import.

If WebGL is unavailable, fails, or is disabled by these rules, a static CSS gradient fallback is shown instead. The canvas is decorative: `aria-hidden="true"` and `pointer-events: none`.

### In the main portfolio

A separate Three.js space scene in `js/space.js` builds a grid helper, orbit rings, and wave bars from a small set of materials. `js/motion.js` registers GSAP's ScrollTrigger and coordinates scene timing; reveals use the Web Animations API. Both modules check reduced-motion and low-power conditions before starting.

## Technologies actually used

- Three.js / WebGL for the prototype scenes and the portfolio space scene.
- JavaScript for scene state, geometry groups, and animation loops.
- CSS opacity and transforms for scene and panel transitions.
- GSAP + ScrollTrigger and the Web Animations API in the portfolio's scroll motion.
- No second 3D framework was added; the prototype copies the repository's existing installed Three.js build into `design-prototype/vendor/`.

## Interaction

Visitors can move the pointer to gently shift the field, navigate between scenes, and observe a different arrangement in each scene. There are no sliders, data inputs, or controls that change the field's values. Reduced-motion visitors see the static fallback and still get full scene navigation.

## Relevance

The same technique fits product launches, case studies, and editorial pages that need a quiet spatial layer behind real content. Sharing one renderer and gating it by device and motion preferences keeps the cost low enough to reuse across sections. The approach also demonstrates how to keep decorative visuals out of the accessibility tree.

## Current status

- **Implemented here:** shared-canvas scenes, pointer response, crossfade coordination, idle/hidden pause, DPR cap, reduced-motion and WebGL-failure fallbacks.
- **Implemented separately:** the portfolio space scene and scroll-linked motion in `js/space.js` and `js/motion.js`.
- **Proposed only:** packaging the studies as a reusable component, or connecting the geometry to real data. Neither exists yet.

## Source files

- `design-prototype/prototype-scene.js`
- `design-prototype/prototype.js`
- `design-prototype/prototype.css`
- `js/space.js`
- `js/motion.js`
- `js/scene-support.js`

## Limitations

The enhanced 3D path is desktop-only by design. Mobile, low-power, reduced-motion, and WebGL-failure paths receive the static CSS fallback. A runtime context loss switches to that fallback; recovery requires a reload.
