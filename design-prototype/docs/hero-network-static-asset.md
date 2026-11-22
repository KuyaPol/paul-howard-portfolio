# Hero network sphere — static asset provenance

`assets/network/hero-network-static.svg` is the no-WebGL / reduced-motion representation of the Phase 12 hero.

- **Origin:** generated locally for this prototype with a deterministic Python script using `random.seed(1187)`. No third-party artwork, photograph, texture, or font is embedded.
- **Reference use:** the supplied 512×512 purple/blue reference was used only as a structural brief for dense irregular mesh depth. No pixels, palette, or composition from it were copied.
- **Structure:** 88 nodes on a jittered Fibonacci sphere, four-nearest-neighbour connections plus seeded cross-links, projected with a mild perspective factor. Rear links use muted neutral grey; front links use electric cyan with restrained lime and white highlights.
- **File:** self-contained SVG, `640×640` viewBox, 45,250 bytes. It uses only gradients, lines, circles, and one Gaussian blur filter. No external requests, scripts, or animation.
- **Presentation:** CSS positions it on the right for the mobile/reduced-motion hero and scales it from `min(58vw, 760px)` on wide viewports to `min(104vw, 520px)` at `<=760px`. When WebGL is active, the fallback is reduced to a quiet cyan wash so the same structure is not drawn twice.

The live WebGL sphere uses the same deterministic node/edge concept at higher fidelity: 88 top-level-tier nodes, instanced cores, `LineSegments` connections, point halos, 14 travelling pulses, depth attenuation, and a fresnel atmosphere. All buffers are built once; per-frame work updates only time, focus, rotation, pulse positions, and the existing particle field.
