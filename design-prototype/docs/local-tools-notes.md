# C—03 / Local tools / notes

**Status:** The extension and local connection are implemented locally. Python items are concepts in this repository snapshot. No hosted service is offered.

## What it is

A group of local-first utility ideas and their notes: a browser activity tracker, sample finance and PC-health dashboards, and documentation explaining what stays on a device and what is only an illustration.

## Purpose

The work explores tools that do not require an account, a server, or an analytics service. It also provides a clear way to show an interface before real data exists: sample figures are labelled as samples, and the live dashboard stays empty until a visitor's own local extension is connected and sharing is enabled.

## How it works

### Browser Tracker extension

`extension/manifest.json` declares a Manifest V3 extension named **Browser Tracker**. It requests four permissions:

- `storage` for local settings, aggregates, and an in-progress interval;
- `alarms` to wake the service worker so the current interval can be flushed;
- `idle` to account for periods when the user is away;
- `tabs` to estimate active foreground browsing time.

The service worker handles internal messages such as settings, pause, and clear-data requests, plus external messages from allowed pages. External messages are checked against the sender's origin and path and gated by the visitor's sharing consent. Totals live in `chrome.storage.local` and `chrome.storage.session`. The extension contains no network calls: no `fetch`, XHR, or beacon sends data anywhere. The manifest's `externally_connectable` entries allow localhost, 127.0.0.1, and the GitHub Pages origin to connect. A fixed public key gives the unpacked extension a stable ID.

The portfolio dashboard reads only that local connection. Until sharing is switched on in the extension popup and the connection is established, the dashboard shows connection instructions or a clearly labelled illustrative demonstration. It does not fabricate visitor statistics. An onboarding dialog explains the connection, and the dashboard exposes pause and clear-data controls.

### Concept dashboards

`js/beyond-concepts.js` contains fixed sample objects for a finance overview (month and year), a small-business stock list, and PC metrics (CPU, GPU, memory, storage). Buttons swap the displayed totals, notes, bar values, and visible sample rows; a budget slider updates its own sample readout. The code reads no external data source; every value is defined in that file.

### Python items

The portfolio copy links to a separate Python project (PC Tracker Widget) and describes a Claude-assisted voice-to-text script. `DESIGN.md`, `PRODUCT.md`, and `HANDOFF.md` treat the desktop interface as a separate repository. **No application `.py` source files are present in this repository snapshot.** They are therefore documented as concepts or external work, not as verified builds here.

## Technologies actually used

- JavaScript for the extension, page logic, and sample toggles.
- Manifest V3 with `storage`, `alarms`, `idle`, and `tabs` permissions.
- Browser storage APIs (`storage.local` and `storage.session`) and local message connections.
- HTML/CSS for the dashboards and labelled illustrations.
- Python is referenced in documentation only; no Python implementation was found here.

## Interaction

A visitor can install the extension unpacked, switch sharing on in its popup, and connect it to the portfolio dashboard to see their own local totals. On the concept page they can switch the sample finance range or PC metric. No sign-up, hosted account, or invented live-data path is presented.

## Relevance

This applies to internal utilities, client dashboards, and privacy-sensitive products where data should stay on the device. It also shows a practical staging pattern: build and review the interface with clearly labelled sample data first, then connect a local source when it is ready.

## Current status

- **Implemented locally:** the extension, the local dashboard connection, the sample toggles, and the extension README.
- **Concept only:** the Claude-assisted voice-to-text script and the Python desktop interface.
- **Not offered:** a hosted service, account system, or analytics backend.

## Source files

- `extension/manifest.json`
- `extension/README.md`
- `extension/` service worker, popup, options, and shared modules
- `js/beyond-concepts.js`
- `js/browser-tracker.js`
- `beyond-the-portfolio/index.html`
- `DESIGN.md`

## Limitations

The extension is installed unpacked, so it requires Developer mode in a Chromium-based browser. The fixed public key changes the extension ID relative to earlier unpacked loads. The Python components could not be verified because no Python source is present in this repository.
