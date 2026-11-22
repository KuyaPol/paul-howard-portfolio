# P—01 / Browser Tracker — source notes

**Status:** Implemented locally as a Manifest V3 extension plus a page-side dashboard bridge. Not a hosted service, not an extension-store release, and not independently installed during this deep dive.

## Verified sources

- `extension/manifest.json` — version `0.2.0`, name **Browser Usage Tracker**, MV3 service worker, popup, options, fixed public key, four permissions, and an `externally_connectable` allowlist.
- `extension/background/service-worker.js` — tracking state machine, browser event listeners, local aggregation, settings, pruning, snapshots, sender validation, and messaging.
- `extension/shared/aggregate.js` — domain normalisation, day keys, midnight splitting, retention pruning, and formatting.
- `extension/popup/` and `extension/options/` — visitor-facing controls.
- `js/browser-tracker.js` — page bridge that polls the extension and renders the dashboard.
- `js/tracker-tutorial.js` — four-step onboarding modal.
- `extension/README.md`, `DESIGN.md`, `HANDOFF.md`, `design-prototype/docs/local-tools-notes.md` — documentation used for status and scope.

## Purpose

The site display name is **Browser Tracker**; the manifest name is **Browser Usage Tracker**. It estimates active foreground browsing time, counts open tabs, and stores per-domain totals on the visitor's device. A visitor must explicitly enable sharing before the local dashboard can receive aggregate snapshots.

## Implemented workflow

1. The service worker listens for install/startup, idle, alarm, window focus/removal, and tab events.
2. Active time is accumulated only for a focused normal window and its active tab; intervals are capped and split at local midnight.
3. Domains are normalised to keys; aggregates hold `activeMs`, activations, and a tab count.
4. `chrome.storage.local` holds settings and aggregates; `chrome.storage.session` holds the in-progress interval.
5. The page polls `TRACKER_PING` every 3 s, then requests `TRACKER_SNAPSHOT` only when sharing is enabled.
6. The service worker checks the sender URL and origin path before answering. The dashboard renders totals, top domains, and seven-day history.
7. Pause and Clear are visitor-controlled; hidden-page time does not accumulate on the page side.

## Permissions and data boundary

The manifest requests exactly `storage`, `alarms`, `idle`, and `tabs`. It declares no `host_permissions`. `externally_connectable` lists HTTPS GitHub Pages plus `http://localhost/*` and `http://127.0.0.1/*`; the service worker applies a second origin/path check.

Shared snapshots contain aggregate fields only. The source explicitly excludes full URLs, paths, query strings, fragments, page titles, form contents, passwords, raw history, tab IDs, and window IDs. No `fetch`, XHR, beacon, `storage.sync`, content script, or remote code was found in the extension.

## UI

- **Popup:** status, today's `HH:MM:SS`, open tabs, most-used domain, ranked sites, share toggle, Pause, Clear, and options link.
- **Options:** pause, sharing, Incognito opt-in, idle threshold `15–300`, retention `7–365`, excluded domains, and a “what it does not do” list.
- **Dashboard:** consent/live states, three metrics, top sites, seven-day bars, Pause/Clear, install guidance, and a labelled illustrative panel with no invented numbers.
- **Onboarding:** four steps covering load unpacked, sharing, and dashboard use.

## Technologies

JavaScript ES modules, Manifest V3, `chrome.storage.local`, `chrome.storage.session`, `chrome.alarms`, `chrome.idle`, `chrome.tabs`, `chrome.windows`, `chrome.runtime` messaging, HTML, and CSS. The site build uses esbuild, but the extension is not copied or bundled by that build.

## Limits and classification

- Chromium-based browsers and Opera GX are named in documentation; Firefox and Safari are unsupported. No independent browser matrix was found.
- Installation is unpacked and requires Developer mode. No store listing exists.
- Active time is an estimate; background tabs, other applications, browser-closed time, and pre-install data are excluded.
- A small built-in public-suffix subset may group unusual domains imperfectly.
- No Python source is present. Python desktop-interface references in surrounding documentation are concept-only.
- No extension screenshot, recording, public demo, formal audit, threat model, or independent privacy review was found.
