# CandidateScreen — Logo Kit

Mark: **"The Cue"** — record + play + lens in one form.

## Colors
- Emerald (primary): `#1C6B47`
- Ink: `#19211B`
- Mint (on dark): `#7FB79A`
- Paper: `#F6F2EA`

## Typefaces
- Wordmark: **Newsreader** (weight 500) — "Candidate" in ink, "Screen" in emerald
- Support / eyebrow: **Hanken Grotesk**

## Contents

### Vector (`../*.svg`) — scalable, preferred for web & print
- `candidatescreen-mark.svg` — emerald, single-color knockout (recolor by changing one fill)
- `candidatescreen-mark-reverse.svg` — white, for dark / emerald backgrounds
- `candidatescreen-mark-black.svg` — one-color black

### PNG (`png/`)
- `mark-emerald-1024/512/256.png` — transparent background
- `mark-white-512.png`, `mark-black-512.png` — transparent background
- `app-icon-1024/512.png` — emerald rounded tile, white mark
- `app-icon-ink-512.png` — ink tile, mint mark
- `apple-touch-icon-180.png` — iOS home-screen icon
- `favicon-32.png`, `favicon-16.png` — browser tab icons

## Usage rules
- **Clear space:** keep ≥ ½ the mark's radius clear on all sides.
- **Minimum size:** mark 20px; full lockup 120px wide.
- **Don't:** stretch, rotate, recolor outside the palette, or place on low-contrast backgrounds.
- Prefer the **SVG** anywhere it's supported; use PNGs for favicons, email, and app stores.

## Favicon install (HTML `<head>`)
```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/favicon-16.png" sizes="16x16" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon-180.png">
```
(Use `candidatescreen-mark.svg` as `favicon.svg`, or the emerald tile for a filled look.)
