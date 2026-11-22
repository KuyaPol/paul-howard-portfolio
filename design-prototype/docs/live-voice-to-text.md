# P—02 / Live Voice to Text — source notes

**Status:** Concept presentation implemented; transcription system not present. No Python application source, engine, model, endpoint, microphone code, demo, recording, or voice-specific screenshot was found in this repository.

## Verified sources

- `index.html` — static concept preview labelled `PROJECT CONCEPT`, `Python script · Claude-assisted development`, and `Concept preview, not a recording or screenshot`.
- `css/styles.css`, `css/responsive.css` — presentation only.
- `js/motion.js` — scroll-linked decorative wave state.
- `js/space.js` — procedural ambient spectrum; source states no audio is played. A Web Audio analyser hook exists but is never called.
- `DESIGN.md`, `PRODUCT.md`, `design-prototype/docs/local-tools-notes.md` — concept status documentation.
- `design-prototype/index.html`, `beyond-the-portfolio.html` — prototype work card, dialog, and network node.

## Stated idea

Current source says only that the concept converts live voice input into text. Historical copy described exploring “practical speech-to-text automation and transcription using Python.” That is a stated aim, not a validated product brief.

## What is implemented

- A static project card with explicit concept and “not a recording or screenshot” labels.
- Responsive styling.
- Scroll-linked decorative wave state through GSAP ScrollTrigger.
- Procedural Three.js ambient bands; no audio input and no playback.
- A prototype dialog repeating the concept status and the absence of a public demo, recording, or completed service.

## What is not implemented

- No microphone capture, `getUserMedia`, `MediaRecorder`, Web Speech API, or Web Audio capture path.
- No Python script build, CLI, GUI, package, or downloadable app.
- No Whisper, Vosk, PocketSphinx, custom model, speech package, or transcription endpoint.
- No Claude API call, SDK, key, or runtime dependency. The prototype's `Claude API` chip is only a label.
- No transcript field, storage format, export path, correction step, latency target, or permission flow.
- No public demo, recording, app screenshot, or external project link. An older “Play abstract motion” control was disabled.

## Proposed flow, with all stages unverified

1. **Live voice input** — stated source material; capture method unspecified.
2. **Audio capture** — no API found in application source.
3. **Transcription mechanism** — described as a Python script developed with Claude's assistance; no engine, model, endpoint, or decoding path verified.
4. **Text output** — intended result; no output UI or format implemented.

## Privacy

The current site does not request microphone permission, create or request audio, store voice data, or send voice network requests. No voice-specific privacy policy or local-processing guarantee is documented, so none is claimed. Any future implementation would need explicit decisions about capture consent, retention, processing location, and third-party model handling.

## Evidence limits

Generic Work-section screenshots exist, but they document the prototype Work scene rather than a transcription product. No voice-specific capture was found. The waveform shown in the deep-dive page is illustrative and labelled as such.
