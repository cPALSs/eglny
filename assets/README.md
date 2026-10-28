# Site assets

## Brand (`brand/`)

2027 EGLNY mark and washes for the public site:

| File | Use |
|------|-----|
| `eglny-symbol.png` | Nav mark, circle-cropped (from High Contrast master — reads at small size) |
| `eglny-logotype.svg` | Nav wordmark (tight viewBox). Dark fill `#fcf6de`; light theme masks the hero’s upper left through the letters |
| `eglny-logo-square.png` | Earlier square lockup |
| `eglny-logo.png` | Full lockup (optional) |
| `background-wash.jpg` | Unused page wash (hero is Crane Child) |

Logotype art uses **Colo Pro** + **Hemgjord Lettering** baked into the PNG. Do **not** ship those as webfonts. Live UI copy uses Metropolis only.

Source masters: `Programs/Lunar New Year/2027/Marketing Assets/` (`EGLNY 2027 Symbol - High Contrast.png` for nav, `EGLNY 2027 Symbol - Square.png`, `EGLNY 2027 Logotype.svg`, `EGLNY 2027 Logo*.png`, `Background.png`, `Crane Child 02.png`).

## Fonts (`fonts/`)

Self-hosted **Metropolis** (Chris Simpson; OFL) as woff2 — Regular, RegularItalic, Medium, SemiBold, Bold, BoldItalic. Declared via `@font-face` in `../site.css`.

## Lion dance group avatars (`lion-dance/`)

Cached Instagram profile pictures for `/resources/lion-dance/`. Named after the handle (`eastern_ways.jpg`, `redlotus-official.jpg`). Do not hotlink Instagram CDN URLs — they expire. Re-download from the live profile if an avatar goes stale.

## Social share image

`og-default.jpg` (1200×630) is the Open Graph / Twitter card for eglny.com. Current art is the 2027 Crane Child graphic. After replacing this file, run the festival SEO build so `?v=` cache-busts Facebook/Slack scrapers.

## Menu viewer (`menu-viewer/`)

Guest food-menu UI copied from Festival Network food-curation-engine:

`Operations/Festival Network/shared/tools/food-curation-engine/menu-viewer.{js,css}` (+ `menu-filters.js`, `menu-legend.js`, `menu-cuisine.js`).

Used by `/food-menu/`. Re-copy when the engine viewer changes. Data: `../data/food-menu.json` (publish from `lny-2026-applicants.json` via `publish_public_menu(..., items_source="capability")`).

Browse tabs: **By cuisine** (default; snacks double-list under cuisine + Snacks; Drinks last) · **By vendor** · **By diet**. Optional item `note` renders as a muted second line.
