# Browser Usage Tracker

A local-first Manifest V3 extension for Chromium-based browsers. It estimates **active foreground browsing time**, counts open tabs, and stores per-domain totals on your device. There is no server, no account, and no analytics service.

## Install (unpacked)

1. Open `chrome://extensions` (or the equivalent in Opera GX).
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this `extension/` folder.
4. Open the toolbar popup to see today's totals.
5. To connect the portfolio dashboard, switch **Share with portfolio** to **On** in the popup (or tick the option in the extension's settings).

The manifest contains a fixed public `key`, so the extension ID is stable at `gkbmdglfleclnpbkhdmbibcaabgheefi`. Adding that key changes the ID of any earlier unpacked load; reloading the extension starts a fresh local store.

## Permissions

| Permission | Why |
| --- | --- |
| `storage` | Local settings/aggregates (`storage.local`) and the in-progress interval (`storage.session`). |
| `alarms` | Wakes the service worker once a minute to flush the current interval and prune old days. |
| `idle` | Pauses tracking when the computer is idle or locked. |
| `externally_connectable` | Not a permission; an allowlist that permits only the portfolio origin to send messages. No host permissions are requested. |
| `tabs` | Reads the active tab's URL to derive a normalized domain, and counts tabs. Titles are never read. |

## What the portfolio dashboard receives

Sharing is **off by default** and can be disabled at any time. Only these fields are returned by `TRACKER_SNAPSHOT`:

- `status` — active, paused, idle, inactive, or unsupported page.
- `activeMs` — today's active foreground time in milliseconds.
- `openTabs` — number of open, counted tabs.
- `topDomains` — up to eight entries of `{ domain, activeMs, activations }`, where `domain` is a normalized hostname such as `youtube.com`.
- `trackingPaused`, `idleState`, `day`, `generatedAt`.
- `history` — seven entries of `{ day, label, activeMs, isToday }`, using daily totals already stored locally.

The dashboard can also send `TRACKER_PING` (connection and sharing state only), `SET_PAUSED`, and `CLEAR_DATA`. All are rejected unless the sender origin is allowlisted and sharing is enabled.

**Never shared:** full URLs, paths, query strings, fragments, page titles, form contents, passwords, raw browsing history, tab IDs, window IDs, aggregation internals, or any other extension state.

The bridge uses `chrome.runtime.sendMessage` from the page and `chrome.runtime.onMessageExternal` in the service worker. The page polls every few seconds because Manifest V3 service workers may be suspended between events.

## What is not tracked

- Background tabs, other applications, time while Chrome is closed, or anything before installation.
- Idle/locked periods (via `chrome.idle`).
- Incognito windows unless both options are enabled.
- RAM, CPU, GPU, temperature, storage, or process-level metrics.

Active time is an estimate based on focus and tab events, not exact browser runtime. Domain grouping uses a small built-in public-suffix list, so unusual suffixes may be grouped imperfectly.

## Privacy

Data stays in `chrome.storage.local`. No `fetch`, no `XMLHttpRequest`, no `storage.sync`, no content scripts, no remote code, no broad host permissions, and no communication with any website other than the explicitly allowed portfolio origin.
