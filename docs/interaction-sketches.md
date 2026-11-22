# C—02 / Interaction sketches

**Status:** Implemented as local prototypes and as code in the main portfolio. Not a shipped component library.

## What it is

Small interface studies about state, layering, and keyboard access. They cover the portfolio's detail dialogs, this prototype's study documentation panels, the sample-data toggles on the concept page, and the two-sided profile card on the main portfolio page.

## Purpose

The studies test whether an interaction that looks elaborate still has a plain keyboard path, a visible focus state, and an honest label. Motion is used only when it helps a person understand what changed, and it is removed when reduced motion is requested.

## How it works

### Overlay panels in this prototype

`prototype.js` opens panels with the native HTML `dialog` element and `showModal()`. That gives the panel three useful behaviors for free:

- it sits in the browser's top layer, above the current scene;
- keyboard focus is kept inside while it is open, and Escape is supported;
- content behind it is blocked from pointer interaction.

The panel adds a semi-transparent backdrop with a blur so the 3D scene remains faintly visible. Opening a panel emits `prototype:overlay`, which pauses background rendering. A close button, Escape, or a backdrop click starts an exit animation; after it finishes, `dialog.close()` runs and focus returns to the button that opened the panel. A short timeout is used as a fallback if the animation event does not fire. Under reduced motion, opening and closing are immediate.

### Sample controls on the deployed concept page

`js/beyond-concepts.js` wires several separate patterns:

- Three concept tabs (personal finance, small business, PC health) use `role="tablist"`-style state with `aria-selected` and roving `tabindex`. Arrow keys, Home, and End switch tabs; the selected screen is shown and the others are hidden. A Web Animations slide runs unless reduced motion is requested.
- Finance range buttons (month/year), stock filters (all/in-stock/out-of-stock), and PC metric buttons (CPU, GPU, memory, storage) update sample text, notes, and bar values in place. The chosen button in each group is marked with `aria-pressed`.
- Return links restore the previously selected tab and focus.

All values are fixed sample objects in that file; none are read from a service.

### Profile card in the main portfolio

`js/about-card.js` toggles a `data-open` state on the profile panel. It mirrors that state with `aria-expanded` on the panel, `aria-hidden` on each face, and the `inert` attribute on the face that is not visible. Enter and Space also toggle the card.

**In this prototype the profile scene is deliberately static.** The flip control, faces, and handlers were removed from `design-prototype/index.html`, `prototype.css`, and `prototype.js`; the background scene remains.

## Technologies actually used

- HTML `dialog` with `showModal()`, `cancel`, and `close` events.
- JavaScript event handlers and a small close-animation controller.
- CSS opacity, transform, and `@keyframes` for entrance and exit.
- ARIA state attributes: `aria-pressed`, `aria-expanded`, `aria-hidden`, and `inert`.
- The Web Animations API and GSAP ScrollTrigger for portfolio reveals.
- No modal or focus-trap library was installed.

## Interaction

Visitors can open and close detail and documentation panels, press Escape, move focus with Tab, switch concept tabs with arrow keys, Home, and End, and choose a sample range, stock filter, or PC metric on the deployed concept page. The main portfolio's profile flip remains available there as a separate interaction; it is not present in this prototype.

## Relevance

The dialog pattern applies to settings, onboarding, documentation, and confirmation flows where background content must stay visible but unreachable. The pressed-button pattern applies to filters, tabs, and segmented controls that change a preview below them. The inert-face pattern applies to any two-state card that must remain keyboard-accessible.

## Current status

- **Implemented:** prototype detail and documentation panels, focus restoration, Escape, background pause, sample toggles, the production profile flip, and reduced-motion rules.
- **Implemented elsewhere:** portfolio reveals through `js/animations.js` and `js/motion.js`.
- **Proposed only:** merging these patterns into a shared component library. No package exists.

## Source files

- `design-prototype/prototype.js`
- `design-prototype/prototype.css`
- `design-prototype/beyond-the-portfolio.html`
- `js/beyond-concepts.js`
- `js/about-card.js`
- `js/animations.js`
- `js/motion.js`

## Limitations

Native modal focus handling depends on browser support for `dialog.showModal()`. The close animation is CSS-only and is skipped under reduced motion. Focus returns to the trigger rather than to an arbitrary saved element.
