# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Recruiters and employers evaluating software development or IT support candidates, and potential clients considering Paul Howard for software or IT work. These audiences are equally important.

## Product Purpose

The portfolio lets visitors freely explore Paul's projects, skills, and experience so they can assess potential fit. Visitors can choose to contact him through the available email and profile links for employment or client opportunities; contact is optional.

## Positioning

The portfolio presents practical software projects alongside Windows support, administration, video editing, and community management experience. Its focus is this mix of hands-on technical and operational work.

## Operating Context

Visitors browse a public web portfolio with project, skills, About Me, and contact information. Contact options currently link to email, GitHub, and LinkedIn; there is no in-site contact form. The Cloudflare Worker also provides a protected admin view for operational security events.

## Capabilities and Constraints

- The public site presents the PC Tracker desktop widget and Live Voice to Text project, plus development, IT support, creative/administrative, and community skills.
- Visitors can open direct email, GitHub, and LinkedIn links.
- The site is built from static HTML, CSS, and JavaScript assets and served through a Cloudflare Worker. Cloudflare D1 stores operational security events. The protected admin view requires a Cloudflare Access identity, shows up to 100 events, and scheduled cleanup removes events older than 14 days.
- General `/api/*` endpoints are not implemented; do not present them as visitor-facing features.
- Preserve factual personal information from the existing portfolio or user-supplied sources. Do not invent personal history, clients, outcomes, testimonials, or credentials.

## Brand Commitments

The portfolio identifies its owner as Paul Howard, a BSIT student and aspiring software developer. Preserve that identity and the supplied experience details without adding unsupported personal claims.

## Evidence on Hand

- Public profile and experience copy: `index.html`.
- Project descriptions and technology details: `index.html` and the linked GitHub repository for PC Tracker.
- Contact destinations: email, GitHub, and LinkedIn links in `index.html`.
- Protected admin and security-event behavior: `src/index.js`, `src/admin-page.js`, and the D1 migrations.
- No testimonials, client case studies, or customer outcome evidence are present in the portfolio; do not fabricate them.

## Product Principles

- Let visitors browse without requiring contact or commitment.
- Show the range of software, IT support, and administrative experience together.
- Ground claims in the existing projects and supplied experience details.
- Keep contact optional and make the existing channels easy to find.

## Accessibility & Inclusion

Preserve keyboard operation and reduced-motion support for interactive elements. Keep content readable and responsive across desktop and mobile layouts.
